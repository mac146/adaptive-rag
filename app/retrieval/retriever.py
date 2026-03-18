from app.indexing.vector_store import search as vector_search
from app.indexing.keyword_store import search as keyword_search


def rrf_merge(vector_results , keyword_results, k=60):
    score_dict={}
    chunk_map={}

    for rank, res in enumerate(vector_results):
        cid= res['chunk_id']
        score_dict[cid] = score_dict.get(cid, 0) + 1/(rank+k)
        chunk_map[cid] = res

    for rank , res in enumerate(keyword_results):
        cid= res['chunk_id']
        score_dict[cid] = score_dict.get(cid, 0) + 1/(rank+k)
        chunk_map[cid] = res

    sorted_ids = sorted(score_dict, key=lambda x: score_dict[x], reverse=True)
    
    return [
        { **chunk_map[cid],"rrf_score": score_dict[cid]}
        for cid in sorted_ids[:10]
    ]

def retrieve(question:str, strategy_output, top_k=10):
    strategy = strategy_output["strategy"]
    target_sections= strategy_output["target_sections"]

    if strategy == "hybrid":
        vec_results = vector_search(question, top_k=top_k)
        kw_results = keyword_search(question, top_k=top_k)
        return rrf_merge(vec_results, kw_results)
    
    if strategy == "hierarchical+hybrid":
        if not target_sections:
            vec_results = vector_search(question, top_k=top_k)
            kw_results = keyword_search(question, top_k=top_k)
            return rrf_merge(vec_results, kw_results)

        all_vec_results = []
        all_kw_results  = []

        for section in target_sections:
            vec_results = vector_search(question, top_k=5, filter_section=section)
            kw_results  = keyword_search(question, top_k=5)
            all_vec_results.extend(vec_results)
            all_kw_results.extend(kw_results)

        return rrf_merge(all_vec_results, all_kw_results)

    # fallback
    vec_results = vector_search(question, top_k=top_k)
    kw_results  = keyword_search(question, top_k=top_k)
    return rrf_merge(vec_results, kw_results)
