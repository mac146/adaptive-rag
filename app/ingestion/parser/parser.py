import fitz        
import docx        
from markdown_it import MarkdownIt

def parse_pdf(file_path:str) -> list[dict]:
    doc =fitz.open(file_path)
    elements=[]

    for page_num, page in enumerate(doc,start=1):
        blocks=page.get_text("dict")["blocks"]

        for block in blocks:
            if block['type'] !=0:
                continue

            for line in block["lines"]:
                for span in line ["spans"]:
                    text= span["text"].strip()
                    if not text:
                        continue

                    font_size=span["size"]
                    is_bold="bold" in span["font"].lower()

                    # Heuristic: large or bold text = heading
                    if font_size>=14 or is_bold:
                        level=1 if font_size>=18 else 2
                        elements.append({
                            "type":"heading",
                            "level":level,
                            "text":text,
                            "page":page_num
                            })
                    else:
                        elements.append({
                            "type":"paragraph",
                            "level":None,
                            "text":text,
                            "page":page_num
                        })

    return elements
    
def parse_docx(file_path:str) -> list[dict]:
    doc = docx.Document(file_path)
    elements=[]

    for para in doc.paragraphs:
        text=para.text.strip()
        if not text:
            continue

        style= para.style.name
        if style.startswith("Heading"):
            level=int(style.split()[-1])
            elements.append({
                "type":"heading",
                "level":level,
                "text":text,
                "page":None
            })
        else:
            elements.append({
                "type":"paragraph",
                "level":None,
                "text":text,
                "page":None
            })
    return elements


def parse_markdown(file_path: str) -> list[dict]:
    with open(file_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    md = MarkdownIt()
    tokens = md.parse(md_content)
    elements = []

    i = 0
    while i < len(tokens):
        token = tokens[i]

        if token.type == "heading_open":
            # heading_open → inline (the text) → heading_close
            level = int(token.tag[1])  # "h1" → 1, "h2" → 2
            text_token = tokens[i + 1]
            elements.append({
                "type": "heading",
                "level": level,
                "text": text_token.content.strip(),
                "page": None
            })
            i += 3  # skip heading_open, inline, heading_close

        elif token.type == "inline":
            if token.content.strip():
                elements.append({
                    "type": "paragraph",
                    "level": None,
                    "text": token.content.strip(),
                    "page": None
                })
            i += 1

        else:
            i += 1

    return elements


def parse_document(file_path: str) -> list[dict]:
    if file_path.endswith('.pdf'):
        return parse_pdf(file_path)
    elif file_path.endswith('.docx'):
        return parse_docx(file_path)
    elif file_path.endswith('.md'):
        return parse_markdown(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_path}")