from fastapi import FastAPI

app=FastAPI(
    title="adaptive-rag",
    description="Structure-aware RAG system",
    version="0.1"
)

@app.get("/")
def root():
    return {"message": "Adaptive RAG API running"}