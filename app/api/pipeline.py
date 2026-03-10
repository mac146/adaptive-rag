from app.ingestion.parser.parser import parse_document
from app.ingestion.structure_analyzer import build_document_profile, build_sections
from app.ingestion.chunker.chunker import chunk_sections
from app.indexing.indexer import index_document
from app.retrieval.reranker import rerank
from app.retrieval.retriever import retrieve
from app.retrieval.router import decide_strategy
import json
import os


def ingest_document(file_path:str):
    elements= parse_document(file_path)

    sections= build_sections(elements)

    profile= build_document_profile(sections, elements)

    chunks= chunk_sections(sections, profile)

    index_document(chunks)

    state={
        "profile": profile,
        "sections": sections,
    }
    with open("document_state.json", "w") as f:
        json.dump(state, f)

    return profile

def answer_question (question:str, force_strategy:str=None):
    if not os.path.exists("document_state.json"):
        raise FileNotFoundError("document_state.json not found. Upload and index a document first.")

    with open("document_state.json", "r") as f:
        state= json.load(f)

    profile= state["profile"]
    sections= state["sections"]

    strategy_output= decide_strategy(profile, question, sections, force_strategy)

    retrieved_chunks= retrieve(question, strategy_output)

    if not retrieved_chunks:
        return {
            "answer": None,
            "chunks_used": [],
            "strategy": strategy_output,
            "confidence": "low",
            "reason": "No chunks retrieved for the question.",
            "target_sections": strategy_output["target_sections"]
        }

    reranked_chunks= rerank(question, retrieved_chunks)

    if not reranked_chunks:
        return {
            "answer": None,
            "chunks_used": [],
            "strategy": strategy_output,
            "confidence": "low",
            "reason": "No chunks reranked for the question.",
            "target_sections": strategy_output["target_sections"]
        }

    return {
        "answer": reranked_chunks[0]["text"],
        "chunks_used": reranked_chunks,
        "strategy": strategy_output,
        "confidence": strategy_output["confidence"],
        "reason": strategy_output["reason"],
        "target_sections": strategy_output["target_sections"]
    }

