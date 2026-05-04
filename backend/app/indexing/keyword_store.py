import bm25s

def build_index(chunks: list[dict]):
    documents = [chunk["text"] for chunk in chunks]
    retriever = bm25s.BM25()
    tokenized = bm25s.tokenize(documents)
    retriever.index(tokenized)
    return retriever


def search(
    query_text: str,
    retriever,
    chunks: list[dict],
    top_k: int = 10,
    filter_section: str | None = None,
) -> list[dict]:
    if not chunks:
        return []

    # When filtering by section, retrieve more candidates before filtering so
    # we don't silently return 0 results if the top-k BM25 hits all happen to
    # be from other sections.
    fetch_k = min(top_k * 4 if filter_section else top_k, len(chunks))

    tokenized_query = bm25s.tokenize([query_text])
    results, scores = retriever.retrieve(
        tokenized_query,
        k=fetch_k,
        return_as="tuple",
        show_progress=False,
    )

    output = []
    for idx, score in zip(results[0], scores[0]):
        chunk = chunks[idx]
        if filter_section is not None and chunk.get("section_title") != filter_section:
            continue
        output.append({**chunk, "score": float(score)})
        if len(output) >= top_k:
            break
    return output
