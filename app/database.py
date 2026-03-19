import os
import pickle
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))


def save_document(document_id: str, filename: str, profile: dict, sections: list, bm25_retriever, chunks: list):
    bm25_bytes = pickle.dumps({
        "retriever": bm25_retriever,
        "chunks": chunks
    })

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO documents (document_id, filename, profile, sections, bm25_index)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (document_id) DO UPDATE
        SET filename   = EXCLUDED.filename,
            profile    = EXCLUDED.profile,
            sections   = EXCLUDED.sections,
            bm25_index = EXCLUDED.bm25_index
    """, (
        document_id,
        filename,
        psycopg2.extras.Json(profile),
        psycopg2.extras.Json(sections),
        bm25_bytes
    ))
    conn.commit()
    cur.close()
    conn.close()


def load_document(document_id: str) -> dict:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT document_id, filename, profile, sections, bm25_index
        FROM documents
        WHERE document_id = %s
    """, (document_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        raise ValueError(f"Document {document_id} not found")

    bm25_data = pickle.loads(row[4])

    return {
        "document_id": row[0],
        "filename":    row[1],
        "profile":     row[2],
        "sections":    row[3],
        "retriever":   bm25_data["retriever"],
        "chunks":      bm25_data["chunks"]
    }


def list_documents() -> list[dict]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT document_id, filename, created_at
        FROM documents
        ORDER BY created_at DESC
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "document_id": row[0],
            "filename":    row[1],
            "created_at":  str(row[2])
        }
        for row in rows
    ]