import fitz
import docx
from docx.document import Document as DocxDocument
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import Table
from docx.text.paragraph import Paragraph
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


def iter_block_items(parent):
    if isinstance(parent, DocxDocument):
        parent_elm = parent.element.body
    else:
        raise ValueError("Unsupported parent for DOCX block iteration.")

    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)


def _is_all_caps(text: str) -> bool:
    letters = [char for char in text if char.isalpha()]
    return bool(letters) and all(char.isupper() for char in letters)


def _cell_is_bold(cell) -> bool:
    for para in cell.paragraphs:
        for run in para.runs:
            if run.text.strip() and run.bold:
                return True
    return False


def _detect_table_headers(table) -> tuple[list[str], int]:
    for row_index, row in enumerate(table.rows):
        texts = [cell.text.strip() for cell in row.cells]
        non_empty = [(cell, text) for cell, text in zip(row.cells, texts) if text]
        if not non_empty:
            continue

        if all(_cell_is_bold(cell) for cell, _ in non_empty) or all(
            _is_all_caps(text) for _, text in non_empty
        ):
            return texts, row_index
        break

    if not table.rows:
        return [], -1

    column_count = max(len(table.rows[0].cells), 0)
    return [f"Column {index + 1}" for index in range(column_count)], -1


def _format_table_row(column_names: list[str], row) -> str:
    parts = []
    for index, cell in enumerate(row.cells):
        value = cell.text.strip()
        if not value:
            continue
        column_name = column_names[index] if index < len(column_names) else f"Column {index + 1}"
        parts.append(f"[{column_name}]: {value}")
    return " | ".join(parts)


def parse_docx(file_path: str) -> list[dict]:
    try:
        doc = docx.Document(file_path)
    except Exception as e:
        raise ValueError(f"Cannot open DOCX: {e}")

    elements = []
    current_heading = None

    table_index = 0

    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            para = block
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
                current_heading = text
            else:
                elements.append({
                    "type": "paragraph",
                    "level": None,
                    "text": text,
                    "page": None,
                })
            continue

        if isinstance(block, Table):
            table = block
            column_names, header_row_index = _detect_table_headers(table)

            for row_index, row in enumerate(table.rows):
                if row_index == header_row_index:
                    continue

                row_text = _format_table_row(column_names, row)
                if not row_text:
                    continue

                elements.append({
                    "type": "paragraph",
                    "level": None,
                    "text": row_text,
                    "page": None,
                    "section_title": current_heading,
                    "is_table_row": True,
                    "table_index": table_index,
                    "row_index": row_index,
                })
            table_index += 1
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
