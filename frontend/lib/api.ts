/**
 * API client for Adaptive RAG backend
 * Connects to FastAPI at http://localhost:8000
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UploadResponse {
  message: string;
  document_id: string;
  profile: {
    filename: string;
    num_sections: number;
    avg_chunk_size: number;
    total_chunks: number;
    sections?: string[];
  };
}

export interface QuestionRequest {
  question: string;
  document_id: string;
  force_strategy?: string;
}

export interface Source {
  section?: string;
  page?: number;
  text?: string;
}

export interface AskResponse {
  answer: string;
  strategy_used: string;
  reason: string;
  confidence: string;
  target_sections: string[];
  sources: Source[];
}

/**
 * Upload a document to the backend
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to upload document");
  }

  return response.json();
}

/**
 * Ask a question about a document
 */
export async function askQuestion(
  question: string,
  documentId: string,
  forceStrategy?: string
): Promise<AskResponse> {
  const payload: QuestionRequest = {
    question,
    document_id: documentId,
    force_strategy: forceStrategy,
  };

  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to get response");
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
