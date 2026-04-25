'use client'

import { memo, useCallback, useEffect, useMemo, useRef } from 'react'

import { AnswerCard } from '@/components/AnswerCard'
import { MessageBubble } from '@/components/MessageBubble'
import { Skeleton } from '@/components/ui/skeleton'
import type { ThreadMessage } from '@/lib/types'

interface ChatMessagesProps {
  messages: ThreadMessage[]
  isLoading: boolean
}

const MemoAnswerCard = memo(AnswerCard)
const MemoMessageBubble = memo(MessageBubble)
const MAX_RENDERED_MESSAGES = 50

function ChatMessagesComponent({ messages, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const shouldStickToBottomRef = useRef(true)
  const previousMessageCountRef = useRef(messages.length)

  const renderedMessages = useMemo(() => {
    return messages.slice(-MAX_RENDERED_MESSAGES)
  }, [messages])

  const handleScroll = useCallback(() => {
    const element = scrollRef.current
    if (!element) return
    const distanceFromBottom = element.scrollHeight - element.clientHeight - element.scrollTop
    shouldStickToBottomRef.current = distanceFromBottom <= 120
  }, [])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    handleScroll()
    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const messageCountChanged = previousMessageCountRef.current !== messages.length
    previousMessageCountRef.current = messages.length

    if (!shouldStickToBottomRef.current || (!messageCountChanged && !isLoading)) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight
      shouldStickToBottomRef.current = true
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isLoading, messages.length])

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
        {renderedMessages.map((message) =>
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
  )
}

export const ChatMessages = memo(ChatMessagesComponent)

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
