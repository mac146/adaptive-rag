'use client'

import type { UserMessage } from '@/lib/types'

interface MessageBubbleProps {
  message: UserMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center bg-[#3B82F6]/12 text-[11px] font-medium text-[#7db2ff]">
        U
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">you</p>
        <div className="border-[0.5px] border-border bg-background px-4 py-3 text-[13px] leading-6">
          {message.content}
        </div>
      </div>
    </div>
  )
}
