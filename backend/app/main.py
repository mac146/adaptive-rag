from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
import litellm
import tempfile
from pathlib import Path
from dotenv import load_dotenv
from app.api.pipeline import ingest_document, answer_question
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt  

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT secret not configured.")
    try:
        payload = jwt.decode(
            credentials.credentials,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")

OVERLOAD_ERROR_HINTS = (
    "overloaded",
    "overloaded_error",
    "resource_exhausted",
    "rate limit",
    "rate_limit",
    "too many requests",
    "429",
    "503",
    "service unavailable",
    "unavailable",
)


def _parse_model_list(raw: str):
    return [model.strip() for model in raw.split(",") if model.strip()]


def _parse_fallback_models(primary_model: str):
    if primary_model.startswith("gemini/"):
        gemini_raw = os.getenv("GEMINI_FALLBACK_MODELS", "")
        if gemini_raw.strip():
            return _parse_model_list(gemini_raw)

    generic_raw = os.getenv("LITELLM_FALLBACK_MODELS", "")
    return _parse_model_list(generic_raw)


def _is_overload_error(error: Exception) -> bool:
    status_code = getattr(error, "status_code", None)
    if status_code in {429, 503}:
        return True

    message = str(error).lower()
    return any(hint in message for hint in OVERLOAD_ERROR_HINTS)


def _complete_with_fallback(models, api_key, messages):
    last_error = None

    for index, model in enumerate(models):
        try:
            response = litellm.completion(
                model=model,
                api_key=api_key,
                messages=messages,
            )
            return response, model
        except Exception as error:
            last_error = error
            has_more_models = index < len(models) - 1
            if not has_more_models or not _is_overload_error(error):
                raise

    raise last_error

app=FastAPI(
    title="adaptive-rag",
    description="Structure-aware RAG system",
    version="0.1"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://eclectic-sable-5fc2e5.netlify.app",  # old Netlify (keep until Vercel is live)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str
    document_id: str
    force_strategy: str = None

    

@app.get("/")
def root():
    return {"message": "Adaptive RAG API running"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...), _: dict = Depends(verify_token)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    ext = Path(file.filename).suffix.lower()
    if ext not in {".pdf", ".docx", ".md", ".txt"}:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    temp_path = temp_file.name
    temp_file.close()

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = ingest_document(temp_path, file.filename)

        return {
            "message": "Document indexed successfully",
            "document_id": result["document_id"],
            "profile": result["profile"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/ask")
async def ask_question(request: QuestionRequest, _: dict = Depends(verify_token)):
    pipeline_output = answer_question(request.question, request.document_id, request.force_strategy)

    chunks_used = pipeline_output["chunks_used"]
    max_context_chars = int(os.getenv("MAX_CONTEXT_CHARS", "8000"))
    context_parts = []
    total_chars = 0
    for chunk in chunks_used:
        text = chunk["text"]
        if total_chars + len(text) + 2 > max_context_chars:
            break
        context_parts.append(text)
        total_chars += len(text) + 2
    context = "\n\n".join(context_parts)

    system_prompt = (
        "You are a helpful assistant. Answer the question using only "
        "the context below. If the answer cannot be found in the context, "
        "say I don't know. Do not make anything up."
    )

    user_message = f"Context:\n{context}\n\nQuestion: {request.question}"

    primary_model = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash")
    fallback_models = _parse_fallback_models(primary_model)
    models_to_try = [primary_model, *fallback_models]
    api_key = os.getenv("LITELLM_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("OPENAI_API_KEY")
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_message}
    ]

    try:
        response, model_used = _complete_with_fallback(models_to_try, api_key, messages)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    answer = response.choices[0].message.content

    return {
        "answer":          answer,
        "strategy_used":   pipeline_output["strategy"]["strategy"],
        "reason":          pipeline_output["reason"],
        "confidence":      pipeline_output["confidence"],
        "model_used":      model_used,
        "target_sections": pipeline_output["target_sections"],
        "sources": [
            {
                "section": chunk.get("section_title"),
                "page":    chunk.get("page")
            }
            for chunk in chunks_used
        ]
    }


@app.get("/health")
async def health():
    return {"status": "ok"}



