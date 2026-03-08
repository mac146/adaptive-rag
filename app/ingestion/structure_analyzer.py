def build_sections(elements: list[dict]) -> list[dict]:
    sections = []
    current_section = None
    # tracks heading stack for parent detection
    # e.g. [("API Reference", 1), ("Authentication", 2)]
    heading_stack = []

    for elem in elements:
        if elem["type"] == "heading":
            if current_section:
                # word count before closing
                current_section["word_count"] = len(
                    current_section["content"].split()
                    if isinstance(current_section["content"], str)
                    else " ".join(current_section["content"]).split()
                )
                sections.append(current_section)

            # update heading stack
            # pop anything at same level or deeper
            while heading_stack and heading_stack[-1]["level"] >= elem["level"]:
                heading_stack.pop()

            # parent is whatever is now on top of stack
            parent = heading_stack[-1]["title"] if heading_stack else None

            current_section = {
                "title": elem["text"],
                "level": elem["level"],
                "parent": parent,
                "page": elem.get("page"),
                "content": [],
                "word_count": 0
            }

            # push current heading onto stack
            heading_stack.append({
                "title": elem["text"],
                "level": elem["level"]
            })

        elif elem["type"] == "paragraph":
            if current_section:
                current_section["content"].append(elem["text"])
            else:
                # paragraph before first heading
                sections.append({
                    "title": None,
                    "level": None,
                    "parent": None,
                    "page": elem.get("page"),
                    "content": elem["text"],
                    "word_count": len(elem["text"].split())
                })

    # close final section
    if current_section:
        joined = " ".join(current_section["content"])
        current_section["content"] = joined
        current_section["word_count"] = len(joined.split())
        sections.append(current_section)

    # join content lists that are still lists
    for section in sections:
        if isinstance(section["content"], list):
            section["content"] = " ".join(section["content"])
            section["word_count"] = len(section["content"].split())

    return sections


def build_document_profile(sections: list[dict], elements: list[dict]) -> dict:
    headings = [e for e in elements if e["type"] == "heading"]
    total_words = sum(s["word_count"] for s in sections)
    heading_levels = sorted(set(h["level"] for h in headings))
    word_counts = [s["word_count"] for s in sections if s["word_count"] > 0]

    # section size variance — are sections evenly sized?
    if len(word_counts) > 1:
        avg = sum(word_counts) / len(word_counts)
        variance = sum((w - avg) ** 2 for w in word_counts) / len(word_counts)
        size_variance = "high" if variance > avg ** 2 * 0.5 else "low"
    else:
        size_variance = "low"

    # structure score — how well structured is this doc?
    heading_density = len(headings) / max(total_words / 100, 1)
    if heading_density >= 2 and len(heading_levels) >= 2:
        structure_score = "high"
    elif heading_density >= 1 or len(heading_levels) >= 1:
        structure_score = "medium"
    else:
        structure_score = "low"

    # length classification
    if total_words > 10000:
        length = "long"
    elif total_words > 2000:
        length = "medium"
    else:
        length = "short"

    return {
        "total_words": total_words,
        "total_sections": len(sections),
        "heading_count": len(headings),
        "heading_levels": heading_levels,       # e.g. [1, 2, 3]
        "size_variance": size_variance,         # "high" or "low"
        "structure_score": structure_score,     # "high", "medium", "low"
        "length": length,                       # "short", "medium", "long"
    }