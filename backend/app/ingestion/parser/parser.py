import fitz
import docx
from markdown_it import MarkdownIt


def parse_pdf(file_path: str) -> list[dict]:
    try:
        doc = fitz.open(file_path)
    except Exception as e:
        raise ValueError(f"Cannot open PDF: {e}")

    elements = []

    for page_num, page in enumerate(doc, start=1):
        blocks = page.get_text("dict")["blocks"]

        for block in blocks:
            if block["type"] != 0:
                continue

            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"].strip()
                    if not text:
                        continue

                    font_size = span["size"]
                    font_name = span["font"]
                    flags = span.get("flags", 0)
                    # PyMuPDF flags: 16 indicates bold in many PDFs; font name check as fallback.
                    is_bold = ("bold" in font_name.lower()) or (flags & 16)

                    # Heuristic: require ALL conditions for headings
                    # 1) font size >= 11 AND bold
                    # 2) length < 80
                    # 3) does not end with punctuation . , ; ! ?
                    # 4) does not start with lowercase
                    # 5) balanced parentheses
                    heading_candidate = (
                        font_size >= 11
                        and is_bold
                        and len(text) < 80
                        and not text.endswith((".", ",", ";", "!", "?"))
                        and (not text[0].islower())
                        and text.count("(") == text.count(")")
                    )

                    if heading_candidate:
                        level = 1 if font_size >= 18 else 2
                        elements.append({
                            "type": "heading",
                            "level": level,
                            "text": text,
                            "page": page_num,
                        })
                    else:
                        elements.append({
                            "type": "paragraph",
                            "level": None,
                            "text": text,
                            "page": page_num,
                        })

    return elements


def parse_docx(file_path: str) -> list[dict]:
    try:
        doc = docx.Document(file_path)
    except Exception as e:
        raise ValueError(f"Cannot open DOCX: {e}")

    elements = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        style = para.style.name if para.style else ""
        if style.startswith("Heading"):
            try:
                level = int(style.split()[-1])
            except (ValueError, IndexError):
                level = 2
            elements.append({
                "type": "heading",
                "level": level,
                "text": text,
                "page": None,
            })
        else:
            elements.append({
                "type": "paragraph",
                "level": None,
                "text": text,
                "page": None,
            })
    return elements


def parse_markdown(file_path: str) -> list[dict]:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            md_content = f.read()
    except Exception as e:
        raise ValueError(f"Cannot read file: {e}")

    md = MarkdownIt()
    tokens = md.parse(md_content)
    elements = []

    i = 0
    while i < len(tokens):
        token = tokens[i]

        if token.type == "heading_open":
            # heading_open -> inline (the text) -> heading_close
            level = int(token.tag[1])  # "h1" -> 1, "h2" -> 2
            text_token = tokens[i + 1]
            elements.append({
                "type": "heading",
                "level": level,
                "text": text_token.content.strip(),
                "page": None,
            })
            i += 3  # skip heading_open, inline, heading_close

        elif token.type == "inline":
            if token.content.strip():
                elements.append({
                    "type": "paragraph",
                    "level": None,
                    "text": token.content.strip(),
                    "page": None,
                })
            i += 1

        else:
            i += 1

    return elements


def parse_text(file_path: str) -> list[dict]:
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception as e:
        raise ValueError(f"Cannot read text file: {e}")

    elements = []
    for line in content.splitlines():
        text = line.strip()
        if text:
            elements.append({
                "type": "paragraph",
                "level": None,
                "text": text,
                "page": None,
            })
    return elements


def parse_document(file_path: str) -> list[dict]:
    if file_path.endswith(".pdf"):
        return parse_pdf(file_path)
    elif file_path.endswith(".docx"):
        return parse_docx(file_path)
    elif file_path.endswith(".md"):
        return parse_markdown(file_path)
    elif file_path.endswith(".txt"):
        return parse_text(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_path}")
