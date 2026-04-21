---
title: Adaptive RAG
emoji: 🤖
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Adaptive RAG

A structure-aware Retrieval-Augmented Generation (RAG) system that adapts its retrieval strategy based on document structure and question type.

## What It Does

Upload a document → ask questions → get accurate answers grounded in the document.

## How It Works

1. **Upload** — Parse a PDF, DOCX, Markdown, or TXT file. Extract structure and build a document profile.
2. **Index** — Chunk adaptively. Store in Qdrant (vector) and BM25 (keyword) indexed by `document_id`.
3. **Route** — Classify question (concept vs term) and select retrieval strategy based on document profile.
4. **Retrieve** — Run hybrid search (vector + BM25), merge with Reciprocal Rank Fusion.
5. **Rerank** — Cross-encoder reranking to surface the most relevant chunks.
6. **Answer** — Send top chunks to Gemini 2.5 Flash via LiteLLM. Answer strictly grounded in document.

## Live Demo

| Endpoint | URL |
|----------|-----|
| Frontend | https://eclectic-sable-5fc2e5.netlify.app |
| Health | https://mac146-adaptive-rag.hf.space/health |
| Upload | https://mac146-adaptive-rag.hf.space/upload |
| Ask | https://mac146-adaptive-rag.hf.space/ask |
| API Docs | https://mac146-adaptive-rag.hf.space/docs |

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | FastAPI |
| Vector DB | Qdrant Cloud |
| Database | Supabase PostgreSQL |
| Embeddings | `all-MiniLM-L6-v2` (384-dim) |
| Reranker | `ms-marco-MiniLM-L-6-v2` |
| Keyword Search | BM25s |
| LLM | Gemini 2.5 Flash (LiteLLM) |
| Parsing | PyMuPDF, python-docx, markdown-it-py |

## API

### Upload a document
```
POST /upload
Content-Type: multipart/form-data

file: <your file>
```
Returns `document_id` and document profile.

### Ask a question
```
POST /ask
Content-Type: application/json

{
  "question": "What is the refund policy?",
  "document_id": "<document_id from upload>",
  "force_strategy": null
}
```
Returns answer, strategy used, confidence, and source sections.

## Running Locally

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Set environment variables in `backend/.env`:

```
QDRANT_URL=
QDRANT_API_KEY=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
GOOGLE_API_KEY=
LITELLM_MODEL=gemini/gemini-2.5-flash
MAX_CONTEXT_CHARS=8000
```