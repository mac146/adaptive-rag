'use client'

import { memo, useEffect, useEffectEvent, useMemo, useRef } from 'react'

import { AnswerCard } from '@/components/AnswerCard'
import { MessageBubble } from '@/components/MessageBubble'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdaptiveDocument, ThreadMessage } from '@/lib/types'

interface ChatAreaProps {
  activeDocument: AdaptiveDocument | null
  messages: ThreadMessage[]
  isLoading: boolean
}

function profileTone(value: string) {
  switch (value) {
    case 'high':
      return 'bg-[#534AB7]/18 text-[#43389d]'
    case 'medium':
      return 'bg-[#0F9D8A]/18 text-[#06695e]'
    case 'low':
      return 'bg-[#C58A1C]/18 text-[#875708]'
    case 'short':
      return 'bg-[#7C7F8F]/18 text-[#565968]'
    default:
      return 'bg-secondary text-secondary-foreground'
  }
}

const MemoAnswerCard = memo(AnswerCard)
const MemoMessageBubble = memo(MessageBubble)

function ChatAreaComponent({ activeDocument, messages, isLoading }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const shouldStickToBottomRef = useRef(true)
  const previousMessageCountRef = useRef(messages.length)

  const updateScrollAnchor = useEffectEvent(() => {
    const element = scrollRef.current
    if (!element) return
    const distanceFromBottom = element.scrollHeight - element.clientHeight - element.scrollTop

    // Keep track of whether the user is still near the bottom so we only auto-scroll
    // when new content arrives and they have not intentionally scrolled away.
    shouldStickToBottomRef.current = distanceFromBottom <= 120
  })

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    updateScrollAnchor()

    // Using a passive native listener keeps scroll tracking off the React event path
    // and avoids extra work while the user is dragging through the history.
    element.addEventListener('scroll', updateScrollAnchor, { passive: true })

    return () => {
      element.removeEventListener('scroll', updateScrollAnchor)
    }
  }, [updateScrollAnchor])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const messageCountChanged = previousMessageCountRef.current !== messages.length
    previousMessageCountRef.current = messages.length

    if (!shouldStickToBottomRef.current || (!messageCountChanged && !isLoading)) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      // We intentionally avoid smooth scrolling here. The previous implementation
      // animated every append, which fought with manual scrolling and produced the
      // "jumping up and down" behavior when history grew.
      element.scrollTop = element.scrollHeight
      shouldStickToBottomRef.current = true
    })

    return () => window.cancelAnimationFrame(frame)
  }, [messages.length, isLoading])

  const profilePills = useMemo(
    () =>
      activeDocument
        ? [
            {
              label: `${activeDocument.profile.structure_score} structure`,
              tone: profileTone(activeDocument.profile.structure_score),
            },
            {
              label: `${activeDocument.profile.total_sections} sections`,
              tone: 'bg-secondary text-secondary-foreground',
            },
            {
              label: `${activeDocument.profile.total_words.toLocaleString()} words`,
              tone: profileTone(activeDocument.profile.length),
            },
          ]
        : [],
    [activeDocument],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b-[0.5px] border-border px-6 py-5">
        <div className="min-w-0">
          <h1 className="truncate text-[18px] font-medium">
            {activeDocument?.name ?? 'No document selected'}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {profilePills.map((pill) => (
              <span
                key={pill.label}
                className={`px-2 py-1 text-[11px] uppercase tracking-[0.08em] ${pill.tone}`}
              >
                {pill.label}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 pt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Auto routing on
        </div>
      </header>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
          {messages.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className="message-row">
                <MemoMessageBubble message={message} />
              </div>
            ) : (
              <div key={message.id} className="message-row">
                <MemoAnswerCard message={message} />
              </div>
            ),
          )}
          {isLoading ? <LoadingAnswerCard /> : null}
        </div>
      </div>
    </div>
  )
}

export const ChatArea = memo(ChatAreaComponent)

function LoadingAnswerCard() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center bg-[#534AB7]/12 text-[11px] font-medium text-[#43389d]">
        AR
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          adaptive rag
        </p>
        <div className="border-[0.5px] border-border bg-muted/50 p-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-full bg-foreground/8" />
            <Skeleton className="h-3 w-[92%] bg-foreground/8" />
            <Skeleton className="h-3 w-[75%] bg-foreground/8" />
          </div>
        </div>
      </div>
    </div>
  )
}
