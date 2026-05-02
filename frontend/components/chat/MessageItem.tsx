import { AnswerBlock } from '@/components/chat/AnswerBlock'
import type { ChatMessage } from '@/components/chat/types'

interface MessageItemProps {
  message: ChatMessage
}

export function MessageItem({ message }: MessageItemProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-2xl rounded-[24px] rounded-br-md border border-white/10 bg-[linear-gradient(135deg,_rgba(37,99,235,0.32),_rgba(124,58,237,0.24))] px-4 py-3 text-sm leading-6 text-white shadow-[0_12px_34px_rgba(46,88,255,0.2)] backdrop-blur-xl">
          {message.content}
        </div>
      </div>
    )
  }

  return <AnswerBlock message={message} />
}
