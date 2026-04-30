from sentence_transformers import SentenceTransformer

try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    raise RuntimeError(f"Failed to load embedding model 'all-MiniLM-L6-v2': {e}") from e

def embed_text(text: str) -> list[float]:
    result = model.encode(text)
    return result.tolist()

def embed_batch(texts: list[str]) -> list[list[float]]:
    result = model.encode(texts)
    return result.tolist()
