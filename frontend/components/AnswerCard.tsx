'use client'

import { SourceChip } from '@/components/SourceChip'
import { StrategyPipeline } from '@/components/StrategyPipeline'
import type { AnswerMessage } from '@/lib/types'

interface AnswerCardProps {
  message: AnswerMessage
}

const confidenceTone = {
  high: 'bg-emerald-600',
  medium: 'bg-amber-600',
  low: 'bg-red-600',
  forced: 'bg-[#534AB7]',
} as const

export function AnswerCard({ message }: AnswerCardProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center bg-[#534AB7]/12 text-[11px] font-medium text-[#b8b2ff]">
        AR
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          adaptive rag
        </p>
        <div className="border-[0.5px] border-border bg-muted/50 p-4">
          <p className="leading-6 text-secondary-foreground">{message.answer}</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StrategyPipeline strategy={message.strategy_used} animateKey={message.id} />
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <span className={`size-2 rounded-full ${confidenceTone[message.confidence]}`} />
            <span>{message.confidence} confidence</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {message.sources.map((source, index) => (
            <SourceChip key={`${message.id}-${source.section ?? 'source'}-${index}`} source={source} />
          ))}
        </div>
      </div>
    </div>
  )
}
