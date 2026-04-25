'use client'

import { useMemo } from 'react'

interface StrategyPipelineProps {
  strategy: string
}

function toNodes(strategy: string) {
  const parts = strategy.split('+').map((p) => p.trim()).filter(Boolean)
  const nodes = [...parts]
  if (parts.some((p) => p === 'hybrid')) nodes.push('rerank')
  return nodes.length > 0 ? nodes : ['hybrid']
}

export function StrategyPipeline({ strategy }: StrategyPipelineProps) {
  const nodes = useMemo(() => toNodes(strategy), [strategy])

  return (
    <div className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.08em]">
      {nodes.map((node, index) => (
        <div key={`${node}-${index}`} className="flex items-center gap-1">
          <span className="border-[0.5px] border-[#534AB7]/35 bg-[#534AB7]/16 px-2 py-1 text-[#43389d]">
            {node}
          </span>
          {index < nodes.length - 1 ? (
            <span className="text-muted-foreground">{'>'}</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
