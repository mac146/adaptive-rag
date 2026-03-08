import bm25s
import pickle

INDEX_PATH = bm25s.BM25S(path="./bm25s_index.pkl")

def build_index(chunks:list[dict]):
    documents=[chunk["text"] for chunk in chunks]

    retriever=bm25s.BM25S()
    tokenize= bm25s.tokenize(documents)
    retriever.index(tokenize)

    with open(INDEX_PATH, "wb") as f:
        pickle.dump({"retriever": retriever, "chunks": chunks}, f)

    def load_index():
        