'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  isLoading?: boolean
}

export function ChatInput({ onSend, disabled, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled || isLoading) return
    onSend(value.trim())
    setValue('')
  }, [value, disabled, isLoading, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const canSend = value.trim().length > 0 && !disabled && !isLoading

  return (
    <div className="bg-[#1a1a1a] border-t border-[#333] p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Upload a document to start asking questions...' : 'Ask a question about your document...'}
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              'w-full resize-none bg-[#262626] border border-[#404040] px-4 py-3 text-sm text-white placeholder:text-[#666]',
              'focus:outline-none focus:border-[#60a5fa] transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'rounded-none'
            )}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!canSend}
          className={cn(
            'h-[46px] w-[46px] p-0 rounded-none transition-colors',
            canSend
              ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-white'
              : 'bg-[#262626] text-[#666] cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      <div className="mt-2 text-[10px] text-[#666] text-center">
        Press <kbd className="bg-[#262626] border border-[#333] px-1 py-0.5 rounded-sm mx-0.5">Enter</kbd> to send
        <span className="mx-1">•</span>
        <kbd className="bg-[#262626] border border-[#333] px-1 py-0.5 rounded-sm mx-0.5">Shift + Enter</kbd> for new line
      </div>
    </div>
  )
}
