'use client'

import { useRef, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from '@/components/chat-message'
import { ChatInput } from '@/components/chat-input'
import type { Message } from '@/lib/types'

interface DocumentChatProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  isDocumentReady: boolean
  isLoading: boolean
}

export function DocumentChat({ messages, onSendMessage, isDocumentReady, isLoading }: DocumentChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-1 flex-col bg-[#0f0f0f] min-h-0">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#333]">
        <MessageSquare className="h-5 w-5 text-[#60a5fa]" />
        <h2 className="text-base font-semibold text-white">Document Q&A</h2>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div ref={scrollRef} className="p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center bg-[#1a1a1a] border border-[#333] mb-4">
                <MessageSquare className="h-7 w-7 text-[#404040]" />
              </div>
              <p className="text-[#a3a3a3] text-sm mb-1">
                {isDocumentReady
                  ? 'Your document is ready. Ask a question to get started.'
                  : 'Upload a document to start asking questions.'}
              </p>
              <p className="text-[#666] text-xs">
                {isDocumentReady
                  ? 'Questions are answered using intelligent retrieval from your document.'
                  : 'Supported formats: PDF, DOCX, Markdown'}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#2d2d2d] px-4 py-3 rounded-[4px]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 bg-[#60a5fa] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 bg-[#60a5fa] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 bg-[#60a5fa] rounded-full animate-bounce" />
                      </div>
                      <span className="text-xs text-[#a3a3a3]">Searching document...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <ChatInput
        onSend={onSendMessage}
        disabled={!isDocumentReady}
        isLoading={isLoading}
      />
    </div>
  )
}
