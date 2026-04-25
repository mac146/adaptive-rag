'use client'

import { memo, useMemo } from 'react'

import { ChatMessages } from '@/components/ChatMessages'
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

function ChatAreaComponent({ activeDocument, messages, isLoading }: ChatAreaProps) {
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
      <ChatMessages messages={messages} isLoading={isLoading} />
    </div>
  )
}

export const ChatArea = memo(ChatAreaComponent)
