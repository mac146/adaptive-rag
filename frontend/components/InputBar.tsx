'use client'

import { useEffect, useRef } from 'react'
import { Send, Square } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AskStrategyOverride } from '@/lib/types'

interface InputBarProps {
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  strategy: AskStrategyOverride
  onStrategyChange: (value: AskStrategyOverride) => void
  isAsking: boolean
  onCancel: () => void
  inputDisabled: boolean
  controlsDisabled: boolean
  submitDisabled: boolean
}

export function InputBar({
  value,
  onValueChange,
  onSubmit,
  strategy,
  onStrategyChange,
  isAsking,
  onCancel,
  inputDisabled,
  controlsDisabled,
  submitDisabled,
}: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!inputDisabled) {
      textareaRef.current?.focus()
    }
  }, [inputDisabled])

  return (
    <div className="relative z-20 shrink-0 border-t-[0.5px] border-border bg-card px-6 py-4">
      <div className="mx-auto flex w-full max-w-4xl items-end gap-3 border-[0.5px] border-border bg-background px-3 py-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSubmit()
            }
          }}
          placeholder="Ask anything about this document..."
          disabled={inputDisabled}
          rows={1}
          className="min-h-[24px] max-h-40 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent text-[13px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        <Select
          value={strategy}
          onValueChange={(value) => onStrategyChange(value as AskStrategyOverride)}
          disabled={controlsDisabled}
        >
          <SelectTrigger className="h-8 border-[0.5px] border-border bg-background px-2 text-[11px] uppercase tracking-[0.08em] shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[0.5px] border-border shadow-none">
            <SelectItem value="auto">auto</SelectItem>
            <SelectItem value="hybrid">hybrid</SelectItem>
            <SelectItem value="hierarchical+hybrid">hierarchical+hybrid</SelectItem>
          </SelectContent>
        </Select>
        {isAsking ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex size-8 items-center justify-center border-[0.5px] border-border bg-background text-foreground transition-opacity"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            className="flex size-8 items-center justify-center bg-[#534AB7] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
