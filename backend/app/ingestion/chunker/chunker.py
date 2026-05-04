def chunk_sections(sections, profile):
    score = profile["structure_score"]
    text_sections = []
    table_chunks = []

    for section in sections:
        items = section.get("items")
        if not items:
            text_sections.append(section)
            continue

        text_parts = []
        for item in items:
            if not item.get("is_table_row"):
                text_parts.append(item["text"])

        if text_parts:
            text_sections.append({
                **section,
                "content": " ".join(text_parts),
            })

        table_chunks.extend(chunk_table_rows(section))

    if score == "high":
        text_chunks = hierarchical_chunking(text_sections)
    else:
        text_chunks = fixed_chunking(text_sections)

    chunks = text_chunks + table_chunks
    for index, chunk in enumerate(chunks, start=1):
        chunk["chunk_id"] = make_chunk_id(chunk.get("section_title"), index)

    return [c for c in chunks if c.get("text", "").strip()]


def make_chunk_id(title, index):
    base = (title or "untitled").lower().replace(" ", "_")
    return f"{base}_{str(index).zfill(3)}"


def _titled_text(title: str | None, body: str) -> str:
    """Prepend section title to body so BM25 can match on section headings."""
    if title and title.strip():
        return f"{title}: {body}"
    return body


def chunk_table_rows(section):
    items = section.get("items", [])
    table_rows = [item for item in items if item.get("is_table_row")]
    if not table_rows:
        return []

    grouped_rows = []
    current_group = []
    current_table_index = None

    for row in table_rows:
        table_index = row.get("table_index")
        if current_group and table_index != current_table_index:
            grouped_rows.append(current_group)
            current_group = []
        current_group.append(row)
        current_table_index = table_index

    if current_group:
        grouped_rows.append(current_group)

    results = []
    for rows in grouped_rows:
        buffer = []
        buffer_words = 0

        for row in rows:
            row_text = row["text"].strip()
            if not row_text:
                continue

            row_words = len(row_text.split())
            if buffer and buffer_words + row_words > 300:
                section_title = row.get("section_title") or section.get("title")
                body = "\n".join(buffer)
                results.append({
                    "chunk_id":       "",
                    "text":           f"Section: {section_title or 'Untitled'}\n{body}",
                    "section_title":  section_title,
                    "parent_section": section.get("parent"),
                    "level":          section.get("level"),
                    "page":           row.get("page", section.get("page")),
                    "word_count":     buffer_words,
                    "strategy_used":  "table",
                    "is_table_chunk": True,
                    "table_index":    row.get("table_index"),
                })
                buffer = []
                buffer_words = 0

            buffer.append(row_text)
            buffer_words += row_words

        if buffer:
            section_title = rows[0].get("section_title") or section.get("title")
            body = "\n".join(buffer)
            results.append({
                "chunk_id":       "",
                "text":           f"Section: {section_title or 'Untitled'}\n{body}",
                "section_title":  section_title,
                "parent_section": section.get("parent"),
                "level":          section.get("level"),
                "page":           rows[0].get("page", section.get("page")),
                "word_count":     buffer_words,
                "strategy_used":  "table",
                "is_table_chunk": True,
                "table_index":    rows[0].get("table_index"),
            })

    return results


def hierarchical_chunking(sections):
    results = []
    leftover_text = ""
    leftover_meta = None  # Set ONCE when accumulation starts, never overwritten

    for section in sections:
        combined_text = (leftover_text + " " + section["content"]).strip()
        word_count = len(combined_text.split())

        if word_count < 20:
            # Too short to be useful standalone — accumulate
            leftover_text = combined_text
            if leftover_meta is None:
                leftover_meta = section
            continue

        # Use the section that started the accumulation as the title owner.
        # If leftover was empty this iteration, the current section is the owner.
        primary = leftover_meta if leftover_meta is not None else section

        if word_count <= 500:
            chunk_index = len(results) + 1
            results.append({
                "chunk_id":       make_chunk_id(primary["title"], chunk_index),
                "text":           _titled_text(primary["title"], combined_text),
                "section_title":  primary["title"],
                "parent_section": primary.get("parent"),
                "level":          primary.get("level"),
                "page":           primary.get("page"),
                "word_count":     word_count,
                "strategy_used":  "hierarchical",
            })
            leftover_text = ""
            leftover_meta = None

        else:
            words = combined_text.split()
            chunk_size = 400
            overlap = 50
            step = chunk_size - overlap

            for i in range(0, len(words), step):
                chunk_words = words[i:i + chunk_size]
                if not chunk_words:
                    break
                chunk_text = " ".join(chunk_words)
                chunk_index = len(results) + 1
                results.append({
                    "chunk_id":       make_chunk_id(primary["title"], chunk_index),
                    "text":           _titled_text(primary["title"], chunk_text),
                    "section_title":  primary["title"],
                    "parent_section": primary.get("parent"),
                    "level":          primary.get("level"),
                    "page":           primary.get("page"),
                    "word_count":     len(chunk_words),
                    "strategy_used":  "hierarchical",
                })

            leftover_text = ""
            leftover_meta = None

    if leftover_text.strip():
        chunk_index = len(results) + 1
        meta = leftover_meta or {}
        results.append({
            "chunk_id":       make_chunk_id(meta.get("title"), chunk_index),
            "text":           _titled_text(meta.get("title"), leftover_text.strip()),
            "section_title":  meta.get("title"),
            "parent_section": meta.get("parent"),
            "level":          meta.get("level"),
            "page":           meta.get("page"),
            "word_count":     len(leftover_text.split()),
            "strategy_used":  "hierarchical",
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
                "chunk_id":       make_chunk_id(section["title"], chunk_index),
                "text":           _titled_text(section["title"], chunk_text),
                "section_title":  section["title"],
                "parent_section": section.get("parent"),
                "level":          section.get("level"),
                "page":           section.get("page"),
                "word_count":     len(chunk_words),
                "strategy_used":  "fixed",
            })

    return results
