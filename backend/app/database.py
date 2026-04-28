import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode="require",
        connect_timeout=10,
    )


def save_document(document_id: str, filename: str, profile: dict, sections: list, user_id: str = None):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO documents (document_id, filename, profile, sections, bm25_index, user_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (document_id) DO UPDATE
        SET filename   = EXCLUDED.filename,
            profile    = EXCLUDED.profile,
            sections   = EXCLUDED.sections,
            bm25_index = EXCLUDED.bm25_index,
            user_id    = EXCLUDED.user_id
    """, (
        document_id,
        filename,
        psycopg2.extras.Json(profile),
        psycopg2.extras.Json(sections),
        b'',
        user_id,
    ))
    conn.commit()
    cur.close()
    conn.close()


def load_document_meta(document_id: str) -> dict:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT document_id, filename, profile, sections
        FROM documents
        WHERE document_id = %s
    """, (document_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        raise ValueError(f"Document {document_id} not found")

    return {
        "document_id": row[0],
        "filename":    row[1],
        "profile":     row[2],
        "sections":    row[3],
    }


def list_documents(user_id: str = None) -> list[dict]:
    conn = get_connection()
    cur = conn.cursor()
    if user_id:
        cur.execute("""
            SELECT document_id, filename, profile, created_at
            FROM documents
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
    else:
        cur.execute("""
            SELECT document_id, filename, profile, created_at
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
            "profile":     row[2],
            "created_at":  str(row[3])
        }
        for row in rows
    ]
