def chunk_sections(sections, profile):
    score = profile["structure_score"]
    if score == "high":
        chunks = hierarchical_chunking(sections)
    else:
        chunks = fixed_chunking(sections)
    return [c for c in chunks if c.get("text", "").strip()]


def make_chunk_id(title, index):
    base = (title or "untitled").lower().replace(" ", "_")
    return f"{base}_{str(index).zfill(3)}"


def hierarchical_chunking(sections):
    results = []
    leftover_text = ""
    leftover_meta = None

    for section in sections:
        combined_text = (leftover_text + " " + section["content"]).strip()
        word_count = len(combined_text.split())

        if word_count < 50:
            leftover_text = combined_text
            leftover_meta = section
            continue

        elif word_count <= 500:

            chunk_index = len(results) + 1
            results.append({
                "chunk_id": make_chunk_id(section["title"], chunk_index),
                "text": combined_text,
                "section_title": section["title"],
                "parent_section": section.get("parent"),
                "level": section.get("level"),
                "page": section.get("page"),
                "word_count": word_count,
                "strategy_used": "hierarchical"
            })
            leftover_text = ""
            leftover_meta = None

        else:

            words = combined_text.split()
            chunk_size = 400
            overlap = 50
            step = chunk_size - overlap
            sub_index = 1

            for i in range(0, len(words), step):
                chunk_words = words[i:i + chunk_size]
                if not chunk_words:
                    break
                chunk_text = " ".join(chunk_words)
                chunk_index = len(results) + 1
                results.append({
                    "chunk_id": make_chunk_id(section["title"], chunk_index),
                    "text": chunk_text,
                    "section_title": section["title"],
                    "parent_section": section.get("parent"),
                    "level": section.get("level"),
                    "page": section.get("page"),
                    "word_count": len(chunk_words),
                    "strategy_used": "hierarchical"
                })
                sub_index += 1

            leftover_text = ""
            leftover_meta = None


    if leftover_text.strip():
        chunk_index = len(results) + 1
        meta = leftover_meta or {}
        results.append({
            "chunk_id": make_chunk_id(meta.get("title"), chunk_index),
            "text": leftover_text.strip(),
            "section_title": meta.get("title"),
            "parent_section": meta.get("parent"),
            "level": meta.get("level"),
            "page": meta.get("page"),
            "word_count": len(leftover_text.split()),
            "strategy_used": "hierarchical"
        })

    return results


def fixed_chunking(sections):
    results = []
    chunk_size = 400
    overlap = 50
    step = chunk_size - overlap


    for section in sections:
        words = section["content"].split()

        for i in range(0, len(words), step):
            chunk_words = words[i:i + chunk_size]
            if not chunk_words:
                break
            chunk_text = " ".join(chunk_words)
            chunk_index = len(results) + 1
            results.append({
                "chunk_id": make_chunk_id(section["title"], chunk_index),
                "text": chunk_text,
                "section_title": section["title"],
                "parent_section": section.get("parent"),
                "level": section.get("level"),
                "page": section.get("page"),
                "word_count": len(chunk_words),
                "strategy_used": "fixed"
            })

    return results
