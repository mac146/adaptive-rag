from sentence_transformers import cross_encoder

model=cross_encoder.CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

def rerank(question, chunks, top_k=4):
    pairs=[(question, chunk["text"]) for chunk in chunks]
        
    scores=model.predict(pairs)

    scored_chunks=[{**chunk, "rerank_score": float(score)}
    for chunk, score in zip(chunks, scores)]
    
    scored_chunks.sort(key=lambda x: x["rerank_score"], reverse=True)
    return scored_chunks[:top_k]