'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { MessageItem } from '@/components/chat/MessageItem'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChatMessage } from '@/components/chat/types'

interface MessageListProps {
  messages: ChatMessage[]
  isThinking: boolean
}

export function MessageList({ messages, isThinking }: MessageListProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <MessageItem message={message} />
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_12px_36px_rgba(5,10,25,0.28)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/45">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Adaptive analysis in progress
            </div>
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-32 rounded-full bg-white/10" />
              <Skeleton className="h-4 w-full rounded-full bg-white/10" />
              <Skeleton className="h-4 w-5/6 rounded-full bg-white/10" />
              <div className="grid gap-2 sm:grid-cols-3">
                <Skeleton className="h-10 rounded-2xl bg-white/10" />
                <Skeleton className="h-10 rounded-2xl bg-white/10" />
                <Skeleton className="h-10 rounded-2xl bg-white/10" />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
