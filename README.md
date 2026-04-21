# Adaptive RAG

> A structure-aware Retrieval-Augmented Generation system that intelligently adapts its retrieval strategy based on how a document is organized and what kind of question is being asked.

## Live Demo

| | URL |
|---|---|
| **Frontend** | https://eclectic-sable-5fc2e5.netlify.app |
| **API Docs** | https://mac146-adaptive-rag.hf.space/docs |
| **Backend** | https://mac146-adaptive-rag.hf.space |

---

## What Problem Does This Solve?

Standard RAG systems treat every document and every question the same way — fixed-size chunks, single retrieval method. This works poorly for documents with rich section structures (reports, manuals, legal docs) where context lives within clearly defined headings and subsections.

**Adaptive RAG** analyzes the document before indexing and dynamically selects the retrieval approach that best fits the document's structure and the nature of the question. A conceptual question ("how does X work?") over a well-structured document triggers section-aware hierarchical retrieval. A term-based lookup ("what is the value of Y?") triggers full hybrid search across all chunks. The result is more precise, context-grounded answers.

---

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────────┐
│   Client    │────▶│                   FastAPI                        │
└─────────────┘     └──────────┬───────────────────────────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │         Ingestion Pipeline       │
              │  Parse → Analyze → Chunk → Index │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │           Dual Index            │
              │  Qdrant (vectors) + BM25 (keys) │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │        Adaptive Router          │
              │  Profile + Question → Strategy  │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │     Hybrid Retrieval + RRF      │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │       Cross-Encoder Rerank      │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │     LLM Answer (Gemini 2.5)     │
              └─────────────────────────────────┘
```

---

## How It Works

### 1. Document Ingestion

When a document is uploaded the system:

- **Parses** the file using format-specific parsers (PDF via PyMuPDF, DOCX via python-docx, Markdown via markdown-it-py, plain TXT)
- **Extracts structure** — detects headings using font size + bold flags (PDF), paragraph styles (DOCX), or heading tokens (Markdown)
- **Validates headings** — filters false positives like figure captions, numbered lists, and single-word fragments
- **Builds a document profile** with metrics: `total_words`, `total_sections`, `heading_density`, `size_variance`
- **Classifies the document** along two dimensions:
  - Structure quality: `high` / `medium` / `low`
  - Length: `short` (<2k words) / `medium` (2–10k) / `long` (>10k)

### 2. Adaptive Chunking

Based on the document profile, one of two chunking strategies is applied:

| Strategy | Triggered When | Behavior |
|---|---|---|
| **Hierarchical** | High structure | Sections <50w accumulated, 50–500w kept intact, >500w split with overlap |
| **Fixed** | Low/medium structure | All content split into 400-word chunks with 50-word overlap |

Each chunk carries metadata: `section_title`, `parent_section`, `heading_level`, `page_number`.

### 3. Dual Indexing

Every document gets its own isolated Qdrant collection (`doc_{document_id}`) and BM25 index:

- **Vector index** — chunks embedded with `all-MiniLM-L6-v2` (384 dimensions, cosine distance) stored in Qdrant Cloud
- **Keyword index** — BM25s index built over chunk text, serialized and stored in Supabase PostgreSQL alongside document metadata

### 4. Adaptive Routing

When a question arrives the router examines two things:

**Document profile** (what kind of document is this?)
**Question type** (what kind of answer is being sought?)

Question classification:
- **Concept** — contains "how", "why", "explain", "summarize", "describe", "what is", etc.
- **Term/Technical** — contains numbers, symbols, acronyms, or is a very short lookup query

Routing decision table:

| Document Structure | Question Type | Strategy |
|---|---|---|
| Short (any structure) | Any | Hybrid — full document search |
| Low / Medium structure | Any | Hybrid — section boundaries unreliable |
| High structure | Concept | Hierarchical + Hybrid — match sections by question keywords |
| High structure | Term / Technical | Hybrid — numbers and acronyms need full search |
| Manual override | Any | User-specified `force_strategy` |

### 5. Hybrid Retrieval with RRF

Both indexes are queried in parallel:

- **Vector search** — top-10 semantically similar chunks from Qdrant
- **Keyword search** — top-10 BM25-ranked chunks

Results are merged using **Reciprocal Rank Fusion**:

```
score(chunk) = Σ 1 / (rank + 60)
```

The fused top-10 are passed to the reranker.

### 6. Cross-Encoder Reranking

A `cross-encoder/ms-marco-MiniLM-L-6-v2` model scores each (question, chunk) pair directly. Top 4 chunks by reranker score are selected as the final context.

### 7. Answer Generation

The top chunks are assembled into a context string (capped at `MAX_CONTEXT_CHARS`). The LLM is prompted to answer strictly from the provided context and respond with "I don't know" if the answer cannot be found. Default model is **Gemini 2.5 Flash** via LiteLLM (supports OpenAI as fallback).

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Web Framework** | FastAPI + Uvicorn | REST API |
| **Frontend** | Next.js 16, Tailwind CSS, shadcn/ui | UI |
| **Vector DB** | Qdrant Cloud | Semantic search |
| **Database** | Supabase PostgreSQL | Document metadata + BM25 storage |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` | 384-dim chunk vectors |
| **Reranker** | `cross-encoder/ms-marco-MiniLM-L-6-v2` | Relevance scoring |
| **Keyword Search** | BM25s | TF-IDF weighted full-text search |
| **LLM** | Gemini 2.5 Flash via LiteLLM | Answer generation |
| **PDF Parsing** | PyMuPDF | Text + font metadata extraction |
| **DOCX Parsing** | python-docx | Paragraph style extraction |
| **Markdown Parsing** | markdown-it-py | Token-based heading detection |

---

## Project Structure

```
adaptive-rag/
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app, route definitions
│   │   ├── database.py               # Supabase connection, save/load documents
│   │   ├── api/
│   │   │   └── pipeline.py           # Ingest and answer orchestration
│   │   ├── ingestion/
│   │   │   ├── parser/parser.py      # PDF, DOCX, MD, TXT parsers
│   │   │   ├── chunker/chunker.py    # Hierarchical and fixed chunking
│   │   │   └── structure_analyzer.py # Heading validation, document profiling
│   │   ├── indexing/
│   │   │   ├── embedder.py           # Sentence transformer embeddings
│   │   │   ├── vector_store.py       # Qdrant collection management
│   │   │   └── keyword_store.py      # BM25 index build and search
│   │   └── retrieval/
│   │       ├── router.py             # Strategy selection logic
│   │       ├── retriever.py          # Hybrid search + RRF merge
│   │       └── reranker.py           # Cross-encoder reranking
│   ├── tests/
│   │   └── test_parser.py
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── app/                          # Next.js App Router pages
    ├── components/                   # UI components (shadcn/ui)
    ├── lib/api.ts                    # Backend API client
    └── netlify.toml                  # Netlify deployment config
```

---

## API Reference

### `POST /upload`

Upload and index a document.

**Request:** `multipart/form-data` with a `file` field (PDF, DOCX, MD, TXT)

**Response:**
```json
{
  "message": "Document indexed successfully",
  "document_id": "uuid-string",
  "profile": {
    "structure": "high",
    "length_category": "medium",
    "total_words": 4821,
    "total_sections": 12,
    "heading_density": 0.42
  }
}
```

---

### `POST /ask`

Ask a question about an indexed document.

**Request:**
```json
{
  "question": "What are the key findings of the report?",
  "document_id": "uuid-string",
  "force_strategy": null
}
```

`force_strategy` accepts `"hybrid"` or `"hierarchical+hybrid"` to override routing.

**Response:**
```json
{
  "answer": "The key findings include...",
  "strategy_used": "hierarchical+hybrid",
  "reason": "High-structure document with concept question — matched sections by keywords",
  "confidence": "high",
  "target_sections": ["Executive Summary", "Key Findings"],
  "sources": [
    { "section": "Key Findings", "page": 3 },
    { "section": "Executive Summary", "page": 1 }
  ]
}
```

---

### `GET /health`

Returns `{"status": "ok"}` if the service is running.

---

## Running Locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Create `backend/.env`:

```env
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key

DB_HOST=aws-x-region.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.your-project-ref
DB_PASSWORD=your-db-password

GOOGLE_API_KEY=your-google-api-key
LITELLM_MODEL=gemini/gemini-2.5-flash
MAX_CONTEXT_CHARS=8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Deployment

| Service | Platform | Config |
|---|---|---|
| Backend | Hugging Face Spaces (Docker) | `backend/Dockerfile` |
| Frontend | Netlify | `frontend/netlify.toml` |
| Vector DB | Qdrant Cloud | Managed |
| Database | Supabase | Managed |

---

## Known Limitations

- Not hardened for concurrent users — model instances are global singletons
- BM25 index is serialized as pickle in PostgreSQL (not suitable for large scale)
- First request after cold start is slow due to model loading (~700MB RAM required)
- Single-document-per-query design — no cross-document retrieval
