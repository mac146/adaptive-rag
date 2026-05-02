import { FileText, LogOut, Plus, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChatDocument } from '@/components/chat/types'

interface SidebarProps {
  documents: ChatDocument[]
  activeDocumentId: string
  onSelectDocument: (documentId: string) => void
  onUploadClick: () => void
  onLogout: () => void
}

export function Sidebar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onUploadClick,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col overflow-hidden border-b border-white/10 bg-[linear-gradient(180deg,_rgba(5,10,20,0.92),_rgba(5,10,20,0.78))] px-4 py-4 backdrop-blur-xl lg:w-[320px] lg:border-b-0 lg:border-r">
      <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 shadow-[0_18px_48px_rgba(4,8,20,0.28)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(59,130,246,0.95),_rgba(139,92,246,0.95))] shadow-[0_10px_35px_rgba(90,102,255,0.45)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Workspace</p>
            <h1 className="text-lg font-semibold tracking-tight text-white">AdaptiveRAG</h1>
          </div>
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-3 flex items-center justify-between px-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/36">History</p>
          <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[11px] text-white/50">
            {documents.length}
          </span>
        </div>

        <div className="app-scrollbar flex min-h-0 flex-1 gap-3 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-x-visible lg:overflow-y-auto">
          {documents.map((document) => {
            const isActive = document.id === activeDocumentId

            return (
              <button
                key={document.id}
                type="button"
                onClick={() => onSelectDocument(document.id)}
                className={cn(
                  'group min-w-[220px] rounded-2xl border px-3 py-3 text-left transition-all lg:block lg:min-w-0',
                  isActive
                    ? 'border-blue-400/18 bg-[linear-gradient(135deg,_rgba(59,130,246,0.12),_rgba(139,92,246,0.08))] shadow-[0_8px_30px_rgba(50,90,255,0.12)]'
                    : 'border-transparent bg-transparent hover:border-white/6 hover:bg-white/[0.035]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={cn(
                      'mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border text-white/70 transition-colors',
                      isActive ? 'border-blue-300/15 bg-blue-400/10' : 'border-white/8 bg-white/[0.03]',
                    )}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        'truncate text-sm font-medium transition-colors',
                        isActive ? 'text-white' : 'text-white/88',
                      )}>
                        {document.name}
                      </p>
                      <p className="mt-1 text-xs text-white/42">{document.meta}</p>
                    </div>
                  </div>
                  <span className="hidden text-[11px] text-white/40 lg:block">{document.updatedAt}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] capitalize',
                    isActive
                      ? 'border-blue-300/15 bg-blue-400/10 text-blue-100'
                      : 'border-white/8 bg-white/[0.03] text-white/58',
                  )}>
                    Structure: {document.structure}
                  </span>
                  <span className="text-[11px] text-white/35 lg:hidden">{document.updatedAt}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Button
        type="button"
        onClick={onUploadClick}
        className="mt-4 h-12 rounded-2xl border border-blue-300/20 bg-[linear-gradient(135deg,_rgba(37,99,235,0.95),_rgba(124,58,237,0.95))] text-sm font-medium text-white shadow-[0_16px_45px_rgba(71,85,255,0.28)] hover:opacity-95"
      >
        <Plus className="h-4 w-4" />
        Upload Document
      </Button>

      <button
        type="button"
        onClick={onLogout}
        className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/64 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  )
}
