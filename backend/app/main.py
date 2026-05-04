from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
import shutil
import os
import litellm
import tempfile
import traceback
from pathlib import Path
from dotenv import load_dotenv
import httpx
from loguru import logger
from app.api.pipeline import ingest_document, answer_question, purge_document
from app.database import list_documents, delete_document

load_dotenv()

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

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".md", ".txt"}
auth_scheme = HTTPBearer(auto_error=False)


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
                temperature=0,
                max_tokens=1024,
            )
            return response, model
        except Exception as error:
            last_error = error
            has_more_models = index < len(models) - 1
            if not has_more_models or not _is_overload_error(error):
                raise

    raise last_error


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(auth_scheme),
) -> str:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not supabase_url or not supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase auth is not configured on the backend.",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{supabase_url.rstrip('/')}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {credentials.credentials}",
                    "apikey": supabase_anon_key,
                },
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to verify auth session: {error}",
        ) from error

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired auth token.",
        )

    user_payload = response.json()
    user_id = user_payload.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user id missing from token.",
        )

    return user_id

app = FastAPI(
    title="adaptive-rag",
    description="Structure-aware RAG system",
    version="0.1"
)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
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
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    temp_path = temp_file.name
    temp_file.close()

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = ingest_document(temp_path, file.filename, user_id=user_id)

        return {
            "message": "Document indexed successfully",
            "document_id": result["document_id"],
            "profile": result["profile"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {type(e).__name__}: {e}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/ask")
async def ask_question(
    request: QuestionRequest,
    user_id: str = Depends(get_current_user_id),
):
    api_key = os.getenv("LITELLM_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="No LLM API key configured. Set LITELLM_API_KEY, GOOGLE_API_KEY, or OPENAI_API_KEY."
        )

    try:
        pipeline_output = answer_question(
            request.question,
            request.document_id,
            request.force_strategy,
            user_id=user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to retrieve answer: {type(e).__name__}: {e}")

    chunks_used = pipeline_output["chunks_used"]

    # Drop clearly irrelevant chunks (rerank_score < -3) unless they're all we have
    relevant = [c for c in chunks_used if c.get("rerank_score", 0) >= -3]
    if relevant:
        chunks_used = relevant

    max_context_chars = int(os.getenv("MAX_CONTEXT_CHARS", "12000"))
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
        "You are a precise document assistant. "
        "Answer the question using ONLY the information explicitly stated in the context below. "
        "Do not use knowledge from your training that is not present in the context — "
        "if a fact, formula, number, or value is not written in the context, do not state it. "
        "If the context fully answers the question, answer directly and concisely. "
        "If the context only partially covers the question, answer what is covered and state "
        "'The document does not provide further detail on this.' "
        "If the context contains no relevant information at all, say "
        "'The document does not contain this information.'"
    )

    if pipeline_output.get("length_category") == "short":
        system_prompt = (
            "Answer based on the provided context. "
            "If the answer is not explicitly stated but can be clearly inferred from the context, "
            "reason carefully and answer. Only say 'I don't know' if the context contains no "
            "relevant information at all."
        )

    user_message = f"Context:\n{context}\n\nQuestion: {request.question}"

    primary_model = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash")
    fallback_models = _parse_fallback_models(primary_model)
    models_to_try = [primary_model, *fallback_models]
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


@app.delete("/documents/{document_id}")
async def delete_document_endpoint(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
):
    purge_document(document_id)
    deleted = delete_document(document_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"message": "Document deleted."}


@app.get("/documents")
async def get_documents(user_id: str = Depends(get_current_user_id)):
    try:
        return list_documents(user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}
