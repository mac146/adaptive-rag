import { Badge } from '@/components/ui/badge'
import type {
  ChatDocument,
  ConfidenceLabel,
  StrategyLabel,
} from '@/components/chat/types'

interface ChatHeaderProps {
  document: ChatDocument
  strategy: StrategyLabel
  confidence: ConfidenceLabel
}

const strategyClasses: Record<StrategyLabel, string> = {
  Hybrid: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
  'Hierarchical+Hybrid': 'border-violet-400/20 bg-violet-400/10 text-violet-100',
}

const confidenceClasses: Record<ConfidenceLabel, string> = {
  High: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  Medium: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
  Low: 'border-rose-400/20 bg-rose-400/10 text-rose-100',
}

export function ChatHeader({ document, strategy, confidence }: ChatHeaderProps) {
  return (
    <header className="rounded-[28px] border border-white/10 bg-white/[0.05] px-5 py-4 shadow-[0_18px_48px_rgba(2,6,23,0.35)] backdrop-blur-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Selected document</p>
          <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">
            {document.name}
          </h2>
          <p className="mt-1 text-sm text-white/50">
            AI workspace for source-grounded Q&A, retrieval traces, and structured answers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`rounded-full border px-3 py-1 text-xs font-medium ${strategyClasses[strategy]}`}>
            {strategy}
          </Badge>
          <Badge className={`rounded-full border px-3 py-1 text-xs font-medium ${confidenceClasses[confidence]}`}>
            {confidence} confidence
          </Badge>
          <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/65">
            Structure {document.structure}
          </Badge>
        </div>
      </div>
    </header>
  )
}
