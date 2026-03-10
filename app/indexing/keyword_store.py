import bm25s
import pickle

INDEX_PATH = "./bm25s_index.pkl"
bm25 = bm25s.BM25()

def build_index(chunks:list[dict]):
    documents=[chunk["text"] for chunk in chunks]

    retriever=bm25s.BM25S()
    tokenize= bm25s.tokenize(documents)
    retriever.index(tokenize)

    with open(INDEX_PATH, "wb") as f:
        pickle.dump({"retriever": retriever, "chunks": chunks}, f)

def load_index():
        with open(INDEX_PATH,"rb") as f:
            data=pickle.load(f)
            return data["retriever"], data["chunks"]
        
    
def search(query_text:str,top_k:int=10)->list[dict]:
        retriever, chunks=load_index()

        tokenized_query=bm25s.tokenize(query_text)
        results, scores=retriever.search(tokenized_query,k=top_k)

        output=[]
        for idx, score in zip(results[0],scores[0]):
              chunk=chunks[idx]
              output.append({
                    **chunk,
                    "score":float(score)
              })
        return output