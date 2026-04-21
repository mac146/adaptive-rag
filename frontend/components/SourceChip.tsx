'use client'

import { useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { SourceReference } from '@/lib/types'

interface SourceChipProps {
  source: SourceReference
}

export function SourceChip({ source }: SourceChipProps) {
  const [open, setOpen] = useState(false)
  const section = source.section ?? 'Untitled section'
  const pageLabel = source.page ? `p${source.page}` : 'p?'
  const fallbackText = `Section: ${section} - Page: ${source.page ?? '?'}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="border-[0.5px] border-border bg-background px-2 py-1 text-[11px] text-[#5f6273]"
        >
          {section} - {pageLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="border-[0.5px] border-border bg-popover p-3 text-[12px] leading-5 shadow-none"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {source.text?.trim() ? source.text : fallbackText}
      </PopoverContent>
    </Popover>
  )
}
