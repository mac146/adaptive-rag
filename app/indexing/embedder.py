from sentence_transformers import SentenceTransformer

model= SentenceTransformer('all-MiniLM-L6-v2')

def embed_text(text:str)-> list[float]:
    result=model.encode(text)
    return result.tolist()

def embed_batch(texts:list[str])-> list[list[float]]:
    result=model.encode(texts)
    return result.tolist()