'use client'

import type { SourceReference } from '@/lib/types'

interface SourceChipProps {
  source: SourceReference
}

export function SourceChip({ source }: SourceChipProps) {
  const section = source.section ?? 'Untitled section'
  const pageLabel = source.page ? `p${source.page}` : 'p?'
  const tooltipText = source.text?.trim()
    ? source.text
    : `Section: ${section} — Page: ${source.page ?? '?'}`

  return (
    <div className="group relative">
      <div className="border-[0.5px] border-border bg-background px-2 py-1 text-[11px] text-[#5f6273] cursor-default select-none">
        {section} — {pageLabel}
      </div>
      <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden w-64 border-[0.5px] border-border bg-popover p-3 text-[12px] leading-5 group-hover:block">
        {tooltipText}
      </div>
    </div>
  )
}
