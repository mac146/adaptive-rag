from app.ingestion.parser.parser import parse_pdf, parse_docx, parse_markdown


def test_pdf():
    result = parse_pdf("tests/samples/test.pdf")
    print("PDF RESULT:", result)


def test_docx():
    result = parse_docx("tests/samples/test.docx")
    print(result)


def test_markdown():
    result = parse_markdown("tests/samples/test.md")
    print(result)


if __name__ == "__main__":
    test_pdf()   # run only pdf