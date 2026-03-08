from indexing.vector_store import store_chunks, create_collection
from indexing.keyword_store import build_index

def index_document(chunks:list[dict]):
    create_collection()
    store_chunks(chunks)
    build_index(chunks)

    print(f"Indexed {len(chunks)} chunks successfully.")
    print("both indexes have been created and stored.")
