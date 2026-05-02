import { ChevronRight, Orbit, Sparkles } from 'lucide-react'

import { SourcesList } from '@/components/chat/SourcesList'
import type { AssistantChatMessage } from '@/components/chat/types'

interface AnswerBlockProps {
  message: AssistantChatMessage
}

export function AnswerBlock({ message }: AnswerBlockProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.04))] shadow-[0_18px_60px_rgba(3,8,20,0.34)] backdrop-blur-2xl">
      <div className="border-b border-white/10 bg-[linear-gradient(90deg,_rgba(59,130,246,0.12),_rgba(124,58,237,0.08),_transparent)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(59,130,246,0.9),_rgba(124,58,237,0.9))] shadow-[0_10px_30px_rgba(78,98,255,0.35)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">AI Response</p>
            <h3 className="text-lg font-semibold text-white">{message.title}</h3>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-5 py-5 sm:px-6">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
            <Orbit className="h-4 w-4 text-blue-300" />
            Answer
          </div>
          <p className="text-sm leading-7 text-white/78">{message.summary}</p>
          <ul className="mt-4 space-y-3">
            {message.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3 text-sm leading-6 text-white/72">
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-blue-300" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-white">Sources</p>
          <SourcesList sources={message.sources} />
        </div>

        <div className="grid gap-3 border-t border-white/10 pt-4 text-sm text-white/56 sm:grid-cols-[180px_1fr]">
          <p className="text-xs uppercase tracking-[0.24em] text-white/38">Meta Info</p>
          <div className="space-y-2">
            <p>
              <span className="text-white/72">Strategy used:</span> {message.strategy}
            </p>
            <p>
              <span className="text-white/72">Reason:</span> {message.reason}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
