import bm25s

def build_index(chunks: list[dict]):
    documents = [chunk["text"] for chunk in chunks]
    retriever = bm25s.BM25()
    tokenized = bm25s.tokenize(documents)
    retriever.index(tokenized)
    return retriever 


def search(query_text: str, retriever, chunks: list[dict], top_k: int = 10) -> list[dict]:
    k = min(top_k, len(chunks)) if chunks else 0
    if k == 0:
        return []

    tokenized_query = bm25s.tokenize([query_text])
    results, scores = retriever.retrieve(
        tokenized_query,
        k=k,
        return_as="tuple",
        show_progress=False
    )

    output = []
    for idx, score in zip(results[0], scores[0]):
        chunk = chunks[idx]
        output.append({
            **chunk,
            "score": float(score)
        })
    return output
