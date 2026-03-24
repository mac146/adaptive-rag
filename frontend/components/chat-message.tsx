'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Message } from '@/lib/types'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showSources, setShowSources] = useState(false)
  const [hovering, setHovering] = useState(false)

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const isUser = message.role === 'user'

  return (
    <div
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className={cn('max-w-[80%] space-y-2', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-[#3b82f6] text-white rounded-[4px]'
              : 'bg-[#2d2d2d] text-[#e5e5e5] rounded-[4px]'
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {!isUser && (message.confidence !== undefined || message.strategy) && (
          <div className="flex items-center gap-2 flex-wrap">
            {message.confidence !== undefined && (
              <span className="text-xs text-[#a3a3a3]">
                Confidence: {message.confidence}%
              </span>
            )}
            {message.strategy && (
              <Badge className="bg-[#262626] text-[#a3a3a3] border border-[#333] rounded-sm text-[10px] px-1.5 py-0.5">
                {message.strategy}
              </Badge>
            )}
          </div>
        )}

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-[#60a5fa] hover:text-[#93c5fd] transition-colors"
            >
              <FileText className="h-3 w-3" />
              <span>Sources from document ({message.sources.length})</span>
              {showSources ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((source) => (
                  <div
                    key={source.id}
                    className="bg-[#1a1a1a] border border-[#333] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[#e5e5e5]">{source.title}</span>
                      {source.pageNumber && (
                        <span className="text-[#a3a3a3]">Page {source.pageNumber}</span>
                      )}
                    </div>
                    <p className="text-[#a3a3a3] line-clamp-2">{source.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            'text-[10px] text-[#666] transition-opacity',
            hovering ? 'opacity-100' : 'opacity-0'
          )}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}
