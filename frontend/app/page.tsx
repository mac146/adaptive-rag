'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ChatArea } from '@/components/ChatArea'
import { InputBar } from '@/components/InputBar'
import { Sidebar } from '@/components/Sidebar'
import { askQuestion, listDocuments, uploadDocument } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import type {
  AdaptiveDocument,
  AnswerMessage,
  AskStrategyOverride,
  ThreadMessage,
  UploadingState,
  UserMessage,
} from '@/lib/types'

const CHAT_MAX_MESSAGES = 200

function chatKey(userId: string, documentId: string) {
  return `chat_${userId}_${documentId}`
}

function loadChat(userId: string, documentId: string): ThreadMessage[] {
  try {
    const raw = localStorage.getItem(chatKey(userId, documentId))
    return raw ? (JSON.parse(raw) as ThreadMessage[]) : []
  } catch {
    return []
  }
}

function saveChat(
  userId: string,
  documentId: string,
  messages: ThreadMessage[],
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

export default function Page() {
  const [userId, setUserId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<AdaptiveDocument[]>([])
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [forceStrategy, setForceStrategy] = useState<AskStrategyOverride>('auto')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingState, setUploadingState] = useState<UploadingState | null>(null)
  const [isAsking, setIsAsking] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const activeRequestRef = useRef<AbortController | null>(null)

  // Load user + their documents on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      listDocuments(uid ?? undefined)
        .then((docs) => {
          setDocuments(
            docs.map((d) => ({
              id: d.document_id,
              name: d.filename,
              profile: d.profile,
              uploadedAt: d.created_at,
            })),
          )
        })
        .catch(() => {})
    })
  }, [])

  // Save chat to localStorage whenever messages change
  useEffect(() => {
    if (userId && activeDocumentId && messages.length > 0) {
      saveChat(userId, activeDocumentId, messages, () => setStorageError(true))
    }
  }, [userId, activeDocumentId, messages])

  const activeDocument = useMemo(
    () => documents.find((document) => document.id === activeDocumentId) ?? null,
    [activeDocumentId, documents],
  )
  const inputDisabled = !activeDocument || isUploading
  const submitDisabled = inputDisabled || isAsking || !inputValue.trim()
  const controlsDisabled = !activeDocument || isUploading || isAsking

  const handleSelectDocument = useCallback((documentId: string) => {
    setActiveDocumentId(documentId)
    setMessages(userId ? loadChat(userId, documentId) : [])
  }, [userId])

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadingState({ fileName: file.name })

    try {
      const response = await uploadDocument(file, userId ?? undefined)
      const uploadedDocument: AdaptiveDocument = {
        id: response.document_id,
        name: file.name,
        profile: response.profile,
        uploadedAt: new Date().toISOString(),
      }

      const welcomeMessage: AnswerMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        answer:
          "Document indexed successfully. Ask about section intent, key findings, metrics, or any page-specific detail and I'll route the query automatically.",
        createdAt: new Date().toISOString(),
        strategy_used: 'hybrid',
        reason: 'Initialization response after successful upload.',
        confidence: 'high',
        target_sections: [],
        sources: [],
      }

      setDocuments((current) => [uploadedDocument, ...current])
      setActiveDocumentId(uploadedDocument.id)
      setMessages([welcomeMessage])
      if (userId) saveChat(userId, uploadedDocument.id, [welcomeMessage])
    } finally {
      setIsUploading(false)
      setUploadingState(null)
    }
  }, [userId])

  const handleAsk = useCallback(async () => {
    const question = inputValue.trim()
    if (!question || !activeDocument || isAsking) {
      return
    }

    const userMessage: UserMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    }

    setMessages((current) => [...current, userMessage])
    setInputValue('')
    setIsAsking(true)
    const abortController = new AbortController()
    activeRequestRef.current = abortController

    try {
      const response = await askQuestion(
        {
          question,
          document_id: activeDocument.id,
          force_strategy: forceStrategy === 'auto' ? undefined : forceStrategy,
        },
        { signal: abortController.signal },
      )

      const answerMessage: AnswerMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        answer: response.answer,
        createdAt: new Date().toISOString(),
        strategy_used: response.strategy_used,
        reason: response.reason,
        confidence: response.confidence,
        target_sections: response.target_sections,
        sources: response.sources,
      }

      setMessages((current) => [...current, answerMessage])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed.'
      if (message === 'The request was canceled.') {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            answer: 'Request canceled.',
            createdAt: new Date().toISOString(),
            strategy_used: 'hybrid',
            reason: 'The in-flight request was canceled by the user.',
            confidence: 'low',
            target_sections: [],
            sources: [],
          },
        ])
        return
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          answer: `I couldn't complete that request. ${message}`,
          createdAt: new Date().toISOString(),
          strategy_used: 'hybrid',
          reason: 'Error fallback shown after the API request failed.',
          confidence: 'low',
          target_sections: [],
          sources: [],
        },
      ])
    } finally {
      activeRequestRef.current = null
      setIsAsking(false)
    }
  }, [activeDocument, forceStrategy, inputValue, isAsking])

  const handleCancelAsk = useCallback(() => {
    activeRequestRef.current?.abort()
  }, [])

  return (
    <main className="flex h-screen min-h-0 overflow-hidden bg-background text-[13px] text-foreground">
      <Sidebar
        documents={documents}
        activeDocumentId={activeDocumentId}
        onSelectDocument={handleSelectDocument}
        onUpload={handleUpload}
        isUploading={isUploading}
        uploadingState={uploadingState}
      />
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {storageError && (
          <div className="flex items-center justify-between bg-destructive/10 px-4 py-2 text-xs text-destructive">
            <span>Chat history storage is full. Oldest messages will be trimmed automatically.</span>
            <button onClick={() => setStorageError(false)} className="ml-4 font-medium underline">
              Dismiss
            </button>
          </div>
        )}
        <ChatArea activeDocument={activeDocument} messages={messages} isLoading={isAsking} />
        <InputBar
          value={inputValue}
          onValueChange={setInputValue}
          onSubmit={handleAsk}
          strategy={forceStrategy}
          onStrategyChange={setForceStrategy}
          isAsking={isAsking}
          onCancel={handleCancelAsk}
          inputDisabled={inputDisabled}
          controlsDisabled={controlsDisabled}
          submitDisabled={submitDisabled}
        />
      </section>
    </main>
  )
}
