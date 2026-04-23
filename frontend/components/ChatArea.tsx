'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

import { AnswerCard } from '@/components/AnswerCard'
import { MessageBubble } from '@/components/MessageBubble'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdaptiveDocument, ThreadMessage } from '@/lib/types'

interface ChatAreaProps {
  activeDocument: AdaptiveDocument | null
  messages: ThreadMessage[]
  isLoading: boolean
}

const pillVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, delay: index * 0.08 },
  }),
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

export function ChatArea({ activeDocument, messages, isLoading }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const profilePills = activeDocument
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
    : []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b-[0.5px] border-border px-6 py-5">
        <div className="min-w-0">
          <h1 className="truncate text-[18px] font-medium">
            {activeDocument?.name ?? 'No document selected'}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {profilePills.map((pill, index) => (
              <motion.span
                key={`${activeDocument?.id ?? 'empty'}-${pill.label}`}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={pillVariants}
                className={`px-2 py-1 text-[11px] uppercase tracking-[0.08em] ${pill.tone}`}
              >
                {pill.label}
              </motion.span>
            ))}
          </div>
        </div>
        <div className="shrink-0 pt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Auto routing on
        </div>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
          {messages.map((message) =>
            message.role === 'user' ? (
              <MessageBubble key={message.id} message={message} />
            ) : (
              <AnswerCard key={message.id} message={message} />
            ),
          )}
          {isLoading ? <LoadingAnswerCard /> : null}
          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </ScrollArea>
    </div>
  )
}

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
