'use client'

import { useEffect, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

interface StrategyPipelineProps {
  strategy: string
  animateKey: string
}

function toNodes(strategy: string) {
  const parts = strategy
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)

  const nodes = [...parts]
  if (parts.some((part) => part === 'hybrid')) {
    nodes.push('rerank')
  }

  return nodes.length > 0 ? nodes : ['hybrid']
}

export function StrategyPipeline({ strategy, animateKey }: StrategyPipelineProps) {
  const nodes = useMemo(() => toNodes(strategy), [strategy])
  const [activeCount, setActiveCount] = useState(0)

  useEffect(() => {
    setActiveCount(0)
    const timers = nodes.map((_, index) =>
      window.setTimeout(() => {
        setActiveCount(index + 1)
      }, index * 200),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [animateKey, nodes])

  return (
    <div className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.08em]">
      {nodes.map((node, index) => {
        const isActive = index < activeCount || activeCount === nodes.length
        return (
          <div key={`${animateKey}-${node}-${index}`} className="flex items-center gap-1">
            <span
              className={cn(
                'border-[0.5px] border-border px-2 py-1 transition-colors duration-200',
                isActive
                  ? 'border-[#534AB7]/35 bg-[#534AB7]/16 text-[#43389d]'
                  : 'bg-background text-muted-foreground',
              )}
            >
              {node}
            </span>
            {index < nodes.length - 1 ? <span className="text-muted-foreground">{'>'}</span> : null}
          </div>
        )
      })}
    </div>
  )
}
