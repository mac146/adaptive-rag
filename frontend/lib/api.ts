import { createClient } from '@/lib/supabase/client'
import type { AskRequest, AskResponse, HealthResponse, UploadResponse } from '@/lib/types'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://mac146-adaptive-rag.hf.space'
const ASK_TIMEOUT_MS = 90000

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
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  })

  return parseJson<UploadResponse>(response)
}

export async function askQuestion(
  payload: AskRequest,
  options?: { signal?: AbortSignal },
): Promise<AskResponse> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), ASK_TIMEOUT_MS)
  const externalSignal = options?.signal
  const abortFromExternal = () => controller.abort()

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort()
    } else {
      externalSignal.addEventListener('abort', abortFromExternal, { once: true })
    }
  }

  const authHeaders = await getAuthHeaders()

  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (externalSignal?.aborted) {
          throw new Error('The request was canceled.')
        }

        throw new Error('The request timed out. The backend likely got stuck processing the question.')
      }

      throw error
    })

    return parseJson<AskResponse>(response)
  } finally {
    if (externalSignal) {
      externalSignal.removeEventListener('abort', abortFromExternal)
    }
    window.clearTimeout(timeoutId)
  }
}

export interface DocumentListItem {
  document_id: string
  filename: string
  profile: import('./types').DocumentProfile
  created_at: string
}

export async function listDocuments(): Promise<DocumentListItem[]> {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: 'GET',
    cache: 'no-store',
  })
  return parseJson<DocumentListItem[]>(response)
}

export async function healthCheck(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    cache: 'no-store',
  })

  return parseJson<HealthResponse>(response)
}
