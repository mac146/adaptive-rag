import uuid
from app.ingestion.parser.parser import parse_document
from app.ingestion.structure_analyzer import build_document_profile, build_sections
from app.ingestion.chunker.chunker import chunk_sections
from app.indexing.vector_store import create_collection, store_chunks, client, get_collection_name
from app.indexing.keyword_store import build_index, search as keyword_search
from app.retrieval.reranker import rerank
from app.retrieval.retriever import retrieve
from app.retrieval.router import decide_strategy
from app.database import save_document, load_document_meta

# In-memory BM25 cache: document_id -> retriever object
# Each upload generates a new UUID so stale entries are naturally orphaned.
# Cap at 20 entries to bound memory usage.
_bm25_cache: dict = {}
_BM25_CACHE_MAX = 20


def _get_bm25(document_id: str, chunks: list[dict]):
    if document_id not in _bm25_cache:
        if len(_bm25_cache) >= _BM25_CACHE_MAX:
            # Evict the oldest entry
            oldest = next(iter(_bm25_cache))
            del _bm25_cache[oldest]
        _bm25_cache[document_id] = build_index(chunks)
    return _bm25_cache[document_id]


def ingest_document(file_path: str, filename: str, user_id: str = None) -> dict:
    elements = parse_document(file_path)
    if not elements:
        raise ValueError("No parsable text found in document.")

    sections = build_sections(elements)
    profile  = build_document_profile(sections, elements)
    chunks   = chunk_sections(sections, profile)
    if not chunks:
        raise ValueError("No chunks created from document.")

    document_id = str(uuid.uuid4())

    create_collection(document_id)
    store_chunks(chunks, document_id)

    # Prime the BM25 cache immediately after ingestion
    _bm25_cache[document_id] = build_index(chunks)

    sections_meta = [
        {k: s[k] for k in ("title", "level", "parent", "page", "word_count") if k in s}
        for s in sections
    ]

    save_document(
        document_id=document_id,
        filename=filename,
        profile=profile,
        sections=sections_meta,
        user_id=user_id,
    )

    return {
        "document_id": document_id,
        "profile": profile,
    }


def answer_question(question: str, document_id: str, force_strategy: str = None) -> dict:
    meta = load_document_meta(document_id)

    profile  = meta["profile"]
    sections = meta["sections"]

    # Fetch chunks from Qdrant (already stored there during ingest)
    scroll_result = client.scroll(
        collection_name=get_collection_name(document_id),
        limit=10000,
        with_payload=True,
        with_vectors=False,
    )
    chunks = [point.payload for point in scroll_result[0]]

    retriever = _get_bm25(document_id, chunks)

    strategy_output = decide_strategy(profile, question, sections, force_strategy)

    retrieved_chunks = retrieve(
        question=question,
        strategy_output=strategy_output,
        document_id=document_id,
        retriever=retriever,
        chunks=chunks,
    )

    if not retrieved_chunks:
        return {
            "answer":          None,
            "chunks_used":     [],
            "strategy":        strategy_output,
            "confidence":      "low",
            "reason":          "No chunks retrieved for the question.",
            "target_sections": strategy_output["target_sections"],
        }

    reranked_chunks = rerank(question, retrieved_chunks)

    if not reranked_chunks:
        return {
            "answer":          None,
            "chunks_used":     [],
            "strategy":        strategy_output,
            "confidence":      "low",
            "reason":          "No chunks after reranking.",
            "target_sections": strategy_output["target_sections"],
        }

    return {
        "answer":          reranked_chunks[0]["text"],
        "chunks_used":     reranked_chunks,
        "strategy":        strategy_output,
        "confidence":      strategy_output["confidence"],
        "reason":          strategy_output["reason"],
        "target_sections": strategy_output["target_sections"],
    }
