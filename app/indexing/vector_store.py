from qdrant_client import QdrantClient
from app.indexing.embedder import embed_batch, embed_text
from qdrant_client.models import Distance, VectorParams, PointStruct,Filter,FieldCondition,MatchValue
import uuid

client =QdrantClient(path="./qdrant_data")
collection_name = "documents"

def create_collection():
    client.recreate_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )

def store_chunks(chunks: list[dict]):
    texts = [chunk["text"] for chunk in chunks]
    vectors = embed_batch(texts)

    points = []
    for chunk, vector in zip(chunks, vectors):
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "chunk_id": chunk["chunk_id"],
                "text": chunk["text"],
                "section_title": chunk["section_title"],
                "parent_section": chunk["parent_section"],
                "level": chunk["level"],
                "page": chunk["page"],
                "word_count": chunk["word_count"],
                "strategy_used": chunk["strategy_used"]
            }
        ))

    client.upsert(collection_name=collection_name, points=points)


def search(query_text: str, top_k: int = 10, filter_section: str = None) -> list[dict]:
    query_vector = embed_text(query_text)

    search_filter = None
    if filter_section is not None:
        search_filter = Filter(
            must=[
                FieldCondition(
                    key="section_title",
                    match=MatchValue(value=filter_section)
                )
            ]
        )

    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter=search_filter,
        limit=top_k
    )

    return [
        {
            **result.payload,
            "score": result.score
        }
        for result in results
    ]
