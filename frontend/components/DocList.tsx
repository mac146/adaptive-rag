'use client'

import { FileText } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import type { AdaptiveDocument } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DocListProps {
  documents: AdaptiveDocument[]
  activeDocumentId: string | null
  onSelectDocument: (documentId: string) => void
}

const structureBadgeStyles = {
  high: 'bg-[#534AB7]/18 text-[#43389d]',
  medium: 'bg-[#0F9D8A]/18 text-[#06695e]',
  low: 'bg-[#C58A1C]/18 text-[#875708]',
  short: 'bg-[#7C7F8F]/18 text-[#565968]',
} as const

export function DocList({ documents, activeDocumentId, onSelectDocument }: DocListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 pr-2">
        {documents.map((document) => {
          const badgeKey =
            document.profile.length === 'short' ? 'short' : document.profile.structure_score

          return (
            <button
              key={document.id}
              type="button"
              onClick={() => onSelectDocument(document.id)}
              className={cn(
                'flex w-full items-center gap-3 border-[0.5px] border-transparent px-3 py-3 text-left transition-colors',
                activeDocumentId === document.id
                  ? 'border-l-[2px] border-l-[#534AB7] bg-background'
                  : 'hover:bg-secondary',
              )}
            >
              <div className="flex size-8 shrink-0 items-center justify-center border-[0.5px] border-border bg-secondary">
                <FileText className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px]">{document.name}</p>
              </div>
              <span
                className={cn(
                  'shrink-0 px-2 py-1 text-[11px] uppercase tracking-[0.08em]',
                  structureBadgeStyles[badgeKey],
                )}
              >
                {badgeKey}
              </span>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
