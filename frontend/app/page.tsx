'use client'

import { useMemo, useState } from 'react'

import { ChatArea } from '@/components/ChatArea'
import { InputBar } from '@/components/InputBar'
import { Sidebar } from '@/components/Sidebar'
import { askQuestion, uploadDocument } from '@/lib/api'
import type {
  AdaptiveDocument,
  AnswerMessage,
  AskStrategyOverride,
  DocumentProfile,
  ThreadMessage,
  UploadingState,
  UserMessage,
} from '@/lib/types'

const demoProfile: DocumentProfile = {
  total_words: 6842,
  total_sections: 12,
  heading_count: 28,
  heading_levels: [1, 2, 3],
  size_variance: 'low',
  structure_score: 'high',
  length: 'medium',
}

const demoDocuments: AdaptiveDocument[] = [
  {
    id: 'demo-ops',
    name: 'enterprise-search-rollout-playbook.pdf',
    profile: demoProfile,
    uploadedAt: new Date('2026-04-20T09:30:00+05:30').toISOString(),
    isDemo: true,
  },
  {
    id: 'demo-policy',
    name: 'support-knowledge-retention-guidelines.md',
    profile: {
      total_words: 3810,
      total_sections: 8,
      heading_count: 16,
      heading_levels: [1, 2],
      size_variance: 'high',
      structure_score: 'medium',
      length: 'medium',
    },
    uploadedAt: new Date('2026-04-19T16:15:00+05:30').toISOString(),
    isDemo: true,
  },
  {
    id: 'demo-brief',
    name: 'incident-summary.txt',
    profile: {
      total_words: 842,
      total_sections: 2,
      heading_count: 2,
      heading_levels: [1],
      size_variance: 'low',
      structure_score: 'low',
      length: 'short',
    },
    uploadedAt: new Date('2026-04-18T12:00:00+05:30').toISOString(),
    isDemo: true,
  },
]

const demoMessages: ThreadMessage[] = [
  {
    id: 'msg-demo-user',
    role: 'user',
    content:
      'Which rollout milestones should happen before we enable auto routing for customer-facing queries?',
    createdAt: new Date('2026-04-21T08:32:00+05:30').toISOString(),
  } satisfies UserMessage,
  {
    id: 'msg-demo-answer',
    role: 'assistant',
    answer:
      'The document recommends enabling auto routing only after three checkpoints are complete: section taxonomy review, benchmark validation across at least three query classes, and a fallback policy for low-confidence answers. It also notes that support teams should approve the escalation path before customer traffic is routed automatically.',
    createdAt: new Date('2026-04-21T08:33:00+05:30').toISOString(),
    strategy_used: 'hierarchical+hybrid',
    reason:
      'The question maps directly to rollout and routing sections, so section-aware retrieval followed by hybrid recall gives better precision.',
    confidence: 'high',
    target_sections: ['Rollout Gates', 'Routing Policy', 'Risk Controls'],
    sources: [
      {
        section: 'Rollout Gates',
        page: 7,
        text:
          'Before auto routing is enabled, the team must complete taxonomy review, retrieval benchmarking, and fallback readiness checks.',
      },
      {
        section: 'Routing Policy',
        page: 11,
        text:
          'Customer-facing routing may be automated only when low-confidence answers are redirected to a human review lane.',
      },
      {
        section: 'Risk Controls',
        page: 14,
        text:
          'Support leadership signs off on escalation handling before production traffic is allowed to use automatic route selection.',
      },
    ],
  } satisfies AnswerMessage,
]

export default function Page() {
  const [documents, setDocuments] = useState<AdaptiveDocument[]>(demoDocuments)
  const [activeDocumentId, setActiveDocumentId] = useState<string>(demoDocuments[0].id)
  const [messages, setMessages] = useState<ThreadMessage[]>(demoMessages)
  const [inputValue, setInputValue] = useState('')
  const [forceStrategy, setForceStrategy] = useState<AskStrategyOverride>('auto')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingState, setUploadingState] = useState<UploadingState | null>(null)
  const [isAsking, setIsAsking] = useState(false)

  const activeDocument = useMemo(
    () => documents.find((document) => document.id === activeDocumentId) ?? null,
    [activeDocumentId, documents],
  )

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
            'Document indexed successfully. Ask about section intent, key findings, metrics, or any page-specific detail and I’ll route the query automatically.',
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

    try {
      const response = await askQuestion({
        question,
        document_id: activeDocument.id,
        force_strategy: forceStrategy === 'auto' ? undefined : forceStrategy,
      })

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
      setIsAsking(false)
    }
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
          disabled={!activeDocument || isAsking || isUploading}
        />
      </section>
    </main>
  )
}
