'use client'

import { useMemo, useRef, useState } from 'react'

import { ChatArea } from '@/components/ChatArea'
import { InputBar } from '@/components/InputBar'
import { Sidebar } from '@/components/Sidebar'
import { askQuestion, uploadDocument } from '@/lib/api'
import type {
  AdaptiveDocument,
  AnswerMessage,
  AskStrategyOverride,
  ThreadMessage,
  UploadingState,
  UserMessage,
} from '@/lib/types'

export default function Page() {
  const [documents, setDocuments] = useState<AdaptiveDocument[]>([])
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [forceStrategy, setForceStrategy] = useState<AskStrategyOverride>('auto')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingState, setUploadingState] = useState<UploadingState | null>(null)
  const [isAsking, setIsAsking] = useState(false)
  const activeRequestRef = useRef<AbortController | null>(null)

  const activeDocument = useMemo(
    () => documents.find((document) => document.id === activeDocumentId) ?? null,
    [activeDocumentId, documents],
  )
  const inputDisabled = !activeDocument || isUploading
  const submitDisabled = inputDisabled || isAsking || !inputValue.trim()
  const controlsDisabled = !activeDocument || isUploading || isAsking

  async function handleUpload(file: File) {
    setIsUploading(true)
    setUploadingState({ fileName: file.name })

    try {
      const response = await uploadDocument(file)
      const uploadedDocument: AdaptiveDocument = {
        id: response.document_id,
        name: file.name,
        profile: response.profile,
        uploadedAt: new Date().toISOString(),
      }

      setDocuments((current) => [uploadedDocument, ...current])
      setActiveDocumentId(uploadedDocument.id)
      setMessages([
        {
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
        },
      ])
    } finally {
      setIsUploading(false)
      setUploadingState(null)
    }
  }

  async function handleAsk() {
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
  }

  function handleCancelAsk() {
    activeRequestRef.current?.abort()
  }

  return (
    <main className="flex h-screen overflow-hidden bg-background text-[13px] text-foreground">
      <Sidebar
        documents={documents}
        activeDocumentId={activeDocumentId}
        onSelectDocument={setActiveDocumentId}
        onUpload={handleUpload}
        isUploading={isUploading}
        uploadingState={uploadingState}
      />
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
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
