from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import shutil
import os
import litellm
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
    temp_path = f"./temp_{file.filename}"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    profile = ingest_document(temp_path)

    os.remove(temp_path)

    return {
        "message": "Document indexed successfully",
        "profile": profile
    }


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

    response = litellm.completion(
        model="gpt-4o-mini",
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





