import { ExternalLink } from 'lucide-react'

import type { ChatSource } from '@/components/chat/types'

interface SourcesListProps {
  sources: ChatSource[]
}

export function SourcesList({ sources }: SourcesListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((source) => (
        <button
          key={source.id}
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white/72 transition-colors hover:border-blue-300/25 hover:bg-white/[0.1] hover:text-white"
        >
          <span>{source.section}</span>
          <span className="text-white/35">|</span>
          <span>Page {source.page}</span>
          <ExternalLink className="h-3.5 w-3.5 text-white/45" />
        </button>
      ))}
    </div>
  )
}
