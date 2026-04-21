import type { AskRequest, AskResponse, HealthResponse, UploadResponse } from '@/lib/types'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://mac146-adaptive-rag.hf.space'

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed.'

    try {
      const payload = (await response.json()) as { detail?: string }
      message = payload.detail ?? message
    } catch {
      message = response.statusText || message
    }

    throw new Error(message)
  }

  return (await response.json()) as T
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  })

  return parseJson<UploadResponse>(response)
}

export async function askQuestion(payload: AskRequest): Promise<AskResponse> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseJson<AskResponse>(response)
}

export async function healthCheck(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    cache: 'no-store',
  })

  return parseJson<HealthResponse>(response)
}
