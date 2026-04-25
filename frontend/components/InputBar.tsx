'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
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

function InputBarComponent({
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
  const [isStrategyOpen, setIsStrategyOpen] = useState(false)

  const focusTextarea = useCallback(() => {
    if (inputDisabled) return

    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (!textarea || inputDisabled) return

      textarea.focus()

      // Keep the caret active after submit/cancel so the input never feels "dead"
      // even when the surrounding UI rerenders.
      const caretPosition = textarea.value.length
      textarea.setSelectionRange(caretPosition, caretPosition)
    })
  }, [inputDisabled])

  useEffect(() => {
    // Root cause: after a submit, focus could remain on the send/stop button or on
    // the strategy Select trigger. If the Select was open during a state change,
    // its portal/focus handling could leave the input feeling unclickable.
    // We close the dropdown and explicitly restore focus to the textarea.
    if (controlsDisabled) {
      setIsStrategyOpen(false)
      return
    }

    if (!isAsking) {
      focusTextarea()
    }
  }, [controlsDisabled, focusTextarea, isAsking])

  const handleSubmit = useCallback(() => {
    if (submitDisabled) return

    setIsStrategyOpen(false)
    onSubmit()
    focusTextarea()
  }, [focusTextarea, onSubmit, submitDisabled])

  const handleCancel = useCallback(() => {
    onCancel()
    focusTextarea()
  }, [focusTextarea, onCancel])

  return (
    <div className="relative z-30 shrink-0 border-t-[0.5px] border-border bg-card px-6 py-4 pointer-events-auto">
      <div className="mx-auto flex w-full max-w-4xl items-end gap-3 border-[0.5px] border-border bg-background px-3 py-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Ask anything about this document..."
          disabled={inputDisabled}
          rows={1}
          className="min-h-[24px] max-h-40 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent text-[13px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        <Select
          open={isStrategyOpen}
          onOpenChange={setIsStrategyOpen}
          value={strategy}
          onValueChange={(value) => onStrategyChange(value as AskStrategyOverride)}
          disabled={controlsDisabled}
        >
          <SelectTrigger className="h-8 border-[0.5px] border-border bg-background px-2 text-[11px] uppercase tracking-[0.08em] shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            className="border-[0.5px] border-border shadow-none"
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              focusTextarea()
            }}
          >
            <SelectItem value="auto">auto</SelectItem>
            <SelectItem value="hybrid">hybrid</SelectItem>
            <SelectItem value="hierarchical+hybrid">hierarchical+hybrid</SelectItem>
          </SelectContent>
        </Select>
        {isAsking ? (
          <button
            type="button"
            onClick={handleCancel}
            className="flex size-8 items-center justify-center border-[0.5px] border-border bg-background text-foreground transition-opacity"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
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

export const InputBar = memo(InputBarComponent)
