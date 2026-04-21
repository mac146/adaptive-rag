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

The system analyzes document structure (headings, sections, hierarchy) and intelligently selects between hybrid and hierarchical retrieval strategies depending on how the document is organized and what kind of question is being asked.

## How It Works

1. **Upload** — Parse a PDF, DOCX, Markdown, or TXT file. Extract structure and build a document profile.
2. **Index** — Chunk the document adaptively. Store chunks in Qdrant (vector search) and BM25 (keyword search) indexed by `document_id`.
3. **Route** — On a question, classify it (concept vs term/technical) and select a retrieval strategy based on the document profile.
4. **Retrieve** — Run hybrid search (vector + BM25), merge results with Reciprocal Rank Fusion.
5. **Rerank** — Cross-encoder reranking to surface the most relevant chunks.
6. **Answer** — Send top chunks as context to Gemini 2.5 Flash via LiteLLM. Answer is strictly grounded in the document.

Your Live URLs

Endpoint URL

Health=https://mac146-adaptive-rag.hf.space/healthUpload
doc=https://mac146-adaptive-rag.hf.space/uploadAsk
question=https://mac146-adaptive-rag.hf.space/askAPI
Docs=https://mac146-adaptive-rag.hf.space/docs

## Tech Stack

| Layer | Technology |
|---|---|
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

## Project Structure

```
adaptive-rag/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── database.py          # Supabase operations
│   │   ├── api/pipeline.py      # Orchestration
│   │   ├── ingestion/           # Parsing, chunking, structure analysis
│   │   ├── indexing/            # Embeddings, Qdrant, BM25
│   │   └── retrieval/           # Router, retriever, reranker
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/                    # Coming soon
```

## Running Locally

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Set the following environment variables in a `.env` file inside `backend/`:

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

## Live Demo

**Base URL:** https://mac146-adaptive-rag.hf.space

| Endpoint | URL |
|---|---|
| Health | https://mac146-adaptive-rag.hf.space/health |
| Upload | https://mac146-adaptive-rag.hf.space/upload |
| Ask | https://mac146-adaptive-rag.hf.space/ask |
| API Docs | https://mac146-adaptive-rag.hf.space/docs |

## Deployment

Backend is deployed on Hugging Face Spaces (Docker). See `backend/Dockerfile`.
