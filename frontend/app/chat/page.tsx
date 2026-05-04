'use client'

import type { ChangeEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatInput } from '@/components/chat/ChatInput'
import { MessageList } from '@/components/chat/MessageList'
import { Sidebar } from '@/components/chat/Sidebar'
import type {
  AssistantChatMessage,
  ChatDocument,
  ChatMessage,
  ConfidenceLabel,
  StrategyLabel,
} from '@/components/chat/types'
import { askQuestion, deleteDocument, listDocuments, uploadDocument } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import type {
  AdaptiveDocument,
  AnswerMessage,
  Confidence,
  SourceReference,
  UserMessage,
  UploadingState,
} from '@/lib/types'

const CHAT_MAX_MESSAGES = 200

function chatKey(userId: string, documentId: string) {
  return `chat_${userId}_${documentId}`
}

function isLegacyUserMessage(message: unknown): message is UserMessage {
  return typeof message === 'object' && message !== null && 'role' in message && 'content' in message
}

function isLegacyAnswerMessage(message: unknown): message is AnswerMessage {
  return typeof message === 'object' && message !== null && 'role' in message && 'answer' in message
}

function normalizeStoredMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) {
    return []
  }

  return messages.flatMap((message): ChatMessage[] => {
    if (
      typeof message === 'object' &&
      message !== null &&
      'role' in message &&
      (message as ChatMessage).role === 'user' &&
      'content' in message
    ) {
      return [message as ChatMessage]
    }

    if (
      typeof message === 'object' &&
      message !== null &&
      'role' in message &&
      (message as ChatMessage).role === 'assistant' &&
      'summary' in message &&
      'strategy' in message
    ) {
      return [message as ChatMessage]
    }

    if (isLegacyUserMessage(message)) {
      return [{
        id: message.id,
        role: 'user',
        content: message.content,
        createdAt: message.createdAt,
      }]
    }

    if (isLegacyAnswerMessage(message)) {
      return [{
        id: message.id,
        role: 'assistant',
        title: 'Answer',
        summary: message.answer,
        bullets: buildBullets(message.answer, message.sources, message.reason),
        strategy: toStrategyLabel(message.strategy_used),
        confidence: toConfidenceLabel(message.confidence),
        reason: message.reason,
        sources: message.sources.map((source, index) => ({
          id: `${source.section ?? 'source'}-${source.page ?? index}-${index}`,
          section: source.section ?? 'Referenced section',
          page: source.page ?? 1,
        })),
        createdAt: message.createdAt,
      }]
    }

    return []
  })
}

function loadChat(userId: string, documentId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(chatKey(userId, documentId))
    return raw ? normalizeStoredMessages(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

function saveChat(
  userId: string,
  documentId: string,
  messages: ChatMessage[],
  onQuotaExceeded?: () => void,
) {
  const capped = messages.length > CHAT_MAX_MESSAGES
    ? messages.slice(-CHAT_MAX_MESSAGES)
    : messages

  try {
    localStorage.setItem(chatKey(userId, documentId), JSON.stringify(capped))
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      onQuotaExceeded?.()
    }
  }
}

function formatRelativeDate(value: string): string {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()

  if (Number.isNaN(date.getTime()) || diffMs < 0) {
    return 'just now'
  }

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function toStrategyLabel(strategy?: string): StrategyLabel {
  return strategy === 'hierarchical+hybrid' ? 'Hierarchical+Hybrid' : 'Hybrid'
}

function toConfidenceLabel(confidence?: Confidence): ConfidenceLabel {
  if (confidence === 'high') return 'High'
  if (confidence === 'medium') return 'Medium'
  return 'Low'
}

function profileToStructure(profile: AdaptiveDocument['profile']): ChatDocument['structure'] {
  const score = profile.structure_score
  return score === 'high' || score === 'medium' || score === 'low' ? score : 'medium'
}

function profileToMeta(profile: AdaptiveDocument['profile']): string {
  return `${profile.total_sections} sections`
}

function mapDocument(document: {
  document_id: string
  filename: string
  profile: AdaptiveDocument['profile']
  created_at: string
}): ChatDocument {
  const structure = profileToStructure(document.profile)
  return {
    id: document.document_id,
    name: document.filename,
    structure,
    meta: profileToMeta(document.profile),
    updatedAt: formatRelativeDate(document.created_at),
    defaultStrategy: structure === 'high' ? 'Hierarchical+Hybrid' : 'Hybrid',
    defaultConfidence: structure === 'high' ? 'High' : structure === 'medium' ? 'Medium' : 'Low',
  }
}

function buildBullets(answer: string, sources: SourceReference[], reason: string): string[] {
  const cleanedSentences = answer
    .split(/\n+/)
    .flatMap((part) => part.split(/(?<=[.!?])\s+/))
    .map((part) => part.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)

  const unique = Array.from(new Set(cleanedSentences))
  if (unique.length >= 2) {
    return unique.slice(0, 3)
  }

  const sourceBullets = sources
    .filter((source) => source.section || source.page)
    .slice(0, 3)
    .map((source) => {
      const section = source.section ?? 'Referenced section'
      const page = source.page ? `page ${source.page}` : 'document source'
      return `Relevant evidence was retrieved from ${section} on ${page}.`
    })

  if (sourceBullets.length > 0) {
    return sourceBullets
  }

  return [reason]
}

function mapAssistantMessage(response: {
  answer: string
  strategy_used: string
  reason: string
  confidence: Confidence
  sources: SourceReference[]
}): AssistantChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    title: 'Answer',
    summary: response.answer,
    bullets: buildBullets(response.answer, response.sources, response.reason),
    strategy: toStrategyLabel(response.strategy_used),
    confidence: toConfidenceLabel(response.confidence),
    reason: response.reason,
    sources: response.sources.map((source, index) => ({
      id: `${source.section ?? 'source'}-${source.page ?? index}-${index}`,
      section: source.section ?? 'Referenced section',
      page: source.page ?? 1,
    })),
    createdAt: new Date().toISOString(),
  }
}

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<ChatDocument[]>([])
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [messagesByDocument, setMessagesByDocument] = useState<Record<string, ChatMessage[]>>({})
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingState, setUploadingState] = useState<UploadingState | null>(null)
  const [storageError, setStorageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const activeRequestRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)

      if (!uid) return

      listDocuments()
        .then((apiDocuments) => {
          const mapped = apiDocuments.map(mapDocument)
          setDocuments(mapped)
          setActiveDocumentId((current) => current ?? mapped[0]?.id ?? null)
          setMessagesByDocument((current) => {
            const next = { ...current }
            mapped.forEach((document) => {
              if (!next[document.id]) {
                next[document.id] = loadChat(uid, document.id)
              }
            })
            return next
          })
        })
        .catch(() => {})
    })
  }, [])

  useEffect(() => {
    if (!userId) return

    Object.entries(messagesByDocument).forEach(([documentId, messages]) => {
      if (messages.length > 0) {
        saveChat(userId, documentId, messages, () => setStorageError(true))
      }
    })
  }, [messagesByDocument, userId])

  const activeDocument = useMemo(
    () => documents.find((document) => document.id === activeDocumentId) ?? null,
    [activeDocumentId, documents],
  )

  const activeMessages = activeDocument ? (messagesByDocument[activeDocument.id] ?? []) : []
  const latestAssistantMessage = [...activeMessages].reverse().find((message) => message.role === 'assistant')

  const handleSelectDocument = useCallback((documentId: string) => {
    setActiveDocumentId(documentId)
    setInputValue('')
    setIsThinking(false)
  }, [])

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    if (!userId) return

    try {
      await deleteDocument(documentId)
    } catch {
      // Best-effort: clean up locally even if the API call fails
    }

    localStorage.removeItem(chatKey(userId, documentId))

    setDocuments((prev) => {
      const remaining = prev.filter((d) => d.id !== documentId)
      setActiveDocumentId((active) =>
        active === documentId ? (remaining[0]?.id ?? null) : active
      )
      return remaining
    })

    setMessagesByDocument((current) => {
      const { [documentId]: _removed, ...rest } = current
      return rest
    })
  }, [userId])

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }, [])

  async function handleUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || isUploading) return

    setIsUploading(true)
    setUploadingState({ fileName: file.name })

    try {
      const response = await uploadDocument(file)
      const uploadedDocument: ChatDocument = mapDocument({
        document_id: response.document_id,
        filename: file.name,
        profile: response.profile,
        created_at: new Date().toISOString(),
      })

      setDocuments((current) => [uploadedDocument, ...current])
      setActiveDocumentId(uploadedDocument.id)
      setMessagesByDocument((current) => ({
        ...current,
        [uploadedDocument.id]: [],
      }))
    } finally {
      setIsUploading(false)
      setUploadingState(null)
      event.target.value = ''
    }
  }

  const handleSubmit = useCallback(async () => {
    const question = inputValue.trim()
    if (!question || !activeDocument || isThinking) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    }

    setMessagesByDocument((current) => ({
      ...current,
      [activeDocument.id]: [...(current[activeDocument.id] ?? []), userMessage],
    }))
    setInputValue('')
    setIsThinking(true)

    const abortController = new AbortController()
    activeRequestRef.current = abortController

    try {
      const response = await askQuestion(
        {
          question,
          document_id: activeDocument.id,
        },
        { signal: abortController.signal },
      )

      const assistantMessage = mapAssistantMessage(response)
      setMessagesByDocument((current) => ({
        ...current,
        [activeDocument.id]: [...(current[activeDocument.id] ?? []), assistantMessage],
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed.'
      const assistantMessage: AssistantChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        title: 'Answer',
        summary: `I couldn't complete that request. ${message}`,
        bullets: ['Try again after the backend finishes processing or verify the selected document.'],
        strategy: activeDocument.defaultStrategy,
        confidence: 'Low',
        reason: 'Fallback response after the API request failed.',
        sources: [],
        createdAt: new Date().toISOString(),
      }

      setMessagesByDocument((current) => ({
        ...current,
        [activeDocument.id]: [...(current[activeDocument.id] ?? []), assistantMessage],
      }))
    } finally {
      activeRequestRef.current = null
      setIsThinking(false)
    }
  }, [activeDocument, inputValue, isThinking])

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(69,116,255,0.22),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(124,58,237,0.16),_transparent_22%),linear-gradient(180deg,_#06111f_0%,_#040812_48%,_#02050d_100%)] text-white">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col overflow-hidden lg:flex-row">
        <Sidebar
          documents={documents}
          activeDocumentId={activeDocument?.id ?? ''}
          onSelectDocument={handleSelectDocument}
          onDeleteHistory={handleDeleteDocument}
          onUploadClick={handleUploadClick}
          onLogout={handleLogout}
        />

        <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-6 lg:px-6">
          {storageError && (
            <div className="mb-4 rounded-2xl border border-amber-300/15 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              Chat history storage is full. Older messages will be trimmed automatically.
            </div>
          )}

          {activeDocument ? (
            <>
              <ChatHeader
                document={activeDocument}
                strategy={latestAssistantMessage?.strategy ?? activeDocument.defaultStrategy}
                confidence={latestAssistantMessage?.confidence ?? activeDocument.defaultConfidence}
              />

              <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_20px_80px_rgba(3,8,20,0.45)] backdrop-blur-2xl">
                <MessageList messages={activeMessages} isThinking={isThinking} />
                <ChatInput
                  value={inputValue}
                  onValueChange={setInputValue}
                  onSubmit={handleSubmit}
                  onUploadClick={handleUploadClick}
                  disabled={isThinking || isUploading}
                />
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
              <div className="max-w-md rounded-[28px] border border-white/10 bg-white/[0.05] p-8 text-center shadow-[0_18px_60px_rgba(3,8,20,0.34)] backdrop-blur-2xl">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">AdaptiveRAG</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {isUploading ? 'Uploading document...' : 'No documents yet'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/58">
                  {isUploading && uploadingState
                    ? `Indexing ${uploadingState.fileName}. It will appear here once the upload completes.`
                    : 'Upload your first document to start asking source-grounded questions.'}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleUploadChange}
        accept=".pdf,.doc,.docx,.md,.txt"
      />
    </main>
  )
}
