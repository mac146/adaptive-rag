from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import shutil
import os
import litellm
import tempfile
from pathlib import Path
from dotenv import load_dotenv
from app.api.pipeline import ingest_document, answer_question

load_dotenv()

app=FastAPI(
    title="adaptive-rag",
    description="Structure-aware RAG system",
    version="0.1"
)

class QuestionRequest(BaseModel):
    question: str
    force_strategy: str = None

    

@app.get("/")
def root():
    return {"message": "Adaptive RAG API running"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    ext = Path(file.filename).suffix.lower()
    if ext not in {".pdf", ".docx", ".md"}:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    temp_path = temp_file.name
    temp_file.close()

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        profile = ingest_document(temp_path)

        return {
            "message": "Document indexed successfully",
            "profile": profile
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/ask")
async def ask_question(request: QuestionRequest):
    pipeline_output = answer_question(request.question, request.force_strategy)

    chunks_used = pipeline_output["chunks_used"]
    context     = "\n\n".join(chunk["text"] for chunk in chunks_used)

    system_prompt = (
        "You are a helpful assistant. Answer the question using only "
        "the context below. If the answer cannot be found in the context, "
        "say I don't know. Do not make anything up."
    )

    user_message = f"Context:\n{context}\n\nQuestion: {request.question}"

    model = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash")
    api_key = os.getenv("LITELLM_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("OPENAI_API_KEY")

    response = litellm.completion(
        model=model,
        api_key=api_key,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message}
        ]
    )

    answer = response.choices[0].message.content

    return {
        "answer":          answer,
        "strategy_used":   pipeline_output["strategy"]["strategy"],
        "reason":          pipeline_output["reason"],
        "confidence":      pipeline_output["confidence"],
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





