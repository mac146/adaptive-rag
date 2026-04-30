import os
from qdrant_client import QdrantClient
from app.indexing.embedder import embed_batch, embed_text
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import uuid

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
    timeout=120,
)

def get_collection_name(document_id: str) -> str:
    return f"doc_{document_id}"

def create_collection(document_id: str):
    collection = get_collection_name(document_id)
    try:
        existing = [c.name for c in client.get_collections().collections]
        if collection in existing:
            client.delete_collection(collection)
        client.create_collection(
            collection_name=collection,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )
    except Exception as e:
        # Attempt cleanup so we don't leave a half-created collection
        try:
            client.delete_collection(collection)
        except Exception:
            pass
        raise RuntimeError(f"Failed to create Qdrant collection '{collection}': {e}") from e

def store_chunks(chunks: list[dict], document_id: str):
    collection = get_collection_name(document_id)
    texts = [chunk["text"] for chunk in chunks]
    vectors = embed_batch(texts)
    points = [
        PointStruct(id=str(uuid.uuid4()), vector=vector, payload={**chunk})
        for chunk, vector in zip(chunks, vectors)
    ]
    batch_size = 50
    for i in range(0, len(points), batch_size):
        client.upsert(collection_name=collection, points=points[i:i + batch_size])

def search(query_text: str, document_id: str, top_k: int = 10, filter_section: str = None) -> list[dict]:
    collection = get_collection_name(document_id)
    query_vector = embed_text(query_text)
    search_filter = None
    if filter_section is not None:
        search_filter = Filter(
            must=[FieldCondition(
                key="section_title",
                match=MatchValue(value=filter_section)
            )]
        )
    response = client.query_points(
        collection_name=collection,
        query=query_vector,
        query_filter=search_filter,
        limit=top_k,
        with_payload=True,
        with_vectors=False
    )
    return [{**point.payload, "score": point.score} for point in response.points]
