# Adaptive RAG (Testing Mode)

## Status
This project is currently in **testing mode**. It uses **local hard disk files** for storage (BM25 index, Qdrant data, and document state). This is not production-ready and is intended for local experimentation.

## Overview
Adaptive RAG is a structure-aware retrieval-augmented generation (RAG) system that:
- Parses documents (PDF, DOCX, Markdown)
- Detects document structure and sections
- Chooses a retrieval strategy based on document structure and question type
- Retrieves via hybrid vector + keyword search
- Reranks results and generates answers using an LLM

## How It Works
1. **Ingestion**: Upload a document to `/upload`. The file is parsed and chunked.
2. **Indexing**: Chunks are stored in:
   - **Qdrant (local)**: Vector search index
   - **BM25 (local)**: Keyword search index
3. **Querying**: Ask a question at `/ask`.
4. **Routing**: Strategy is selected by document structure and question type.
5. **Retrieval + Rerank**: Hybrid retrieval and cross-encoder reranking.
6. **Answering**: LLM generates the final answer using retrieved context.

## API Endpoints
- `GET /` - Health message
- `GET /health` - Basic health check
- `POST /upload` - Upload and index a document, requires auth
- `POST /ask` - Ask a question, requires auth
- `GET /documents` - List the signed-in user's documents, requires auth

## Local Storage (Testing Mode)
These files and folders are created on disk during testing:
- `document_state.json` - Document profile and sections
- `bm25s_index.pkl` - BM25 keyword index
- `qdrant_data/` - Local Qdrant vector store

## Requirements
See `requirements.txt` for dependencies.

## Run Locally
```bash
uvicorn app.main:app --reload
```

Set Supabase auth env vars for backend token verification:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Notes
- This build is not hardened for concurrent users.
- Indexing recreates the vector collection per upload.
- Use only for local testing until storage, concurrency, and security are improved.
