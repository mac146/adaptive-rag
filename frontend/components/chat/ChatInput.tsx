'use client'

import type { ChangeEvent, KeyboardEvent } from 'react'
import { Paperclip, SendHorizonal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  onUploadClick: () => void
  disabled?: boolean
}

export function ChatInput({
  value,
  onValueChange,
  onSubmit,
  onUploadClick,
  disabled = false,
}: ChatInputProps) {
  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onValueChange(event.target.value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="border-t border-white/10 bg-[linear-gradient(180deg,_rgba(3,8,20,0.08),_rgba(3,8,20,0.26))] px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl items-end gap-3 rounded-[26px] border border-white/10 bg-black/20 p-3 shadow-[0_18px_48px_rgba(2,6,23,0.3)] transition-shadow focus-within:shadow-[0_0_0_1px_rgba(96,165,250,0.35),0_0_50px_rgba(96,165,250,0.18)]">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onUploadClick}
          className="h-11 w-11 rounded-2xl border border-white/10 bg-white/[0.05] text-white/65 hover:bg-white/[0.09] hover:text-white"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck
          placeholder="Ask something about your document..."
          className={cn(
            'min-h-[56px] w-full resize-none border-0 bg-transparent px-1 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/35 focus:outline-none',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-text',
          )}
        />

        <Button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="h-11 rounded-2xl border border-blue-300/20 bg-[linear-gradient(135deg,_rgba(37,99,235,0.95),_rgba(124,58,237,0.95))] px-4 text-white shadow-[0_12px_32px_rgba(71,85,255,0.35)] hover:opacity-95"
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
