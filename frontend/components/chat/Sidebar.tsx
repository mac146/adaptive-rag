import { FileText, LogOut, Plus, Sparkles, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChatDocument } from '@/components/chat/types'

interface SidebarProps {
  documents: ChatDocument[]
  activeDocumentId: string
  onSelectDocument: (documentId: string) => void
  onDeleteHistory: (documentId: string) => void
  onUploadClick: () => void
  onLogout: () => void
}

export function Sidebar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onDeleteHistory,
  onUploadClick,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col overflow-hidden border-b border-white/10 bg-[linear-gradient(180deg,_rgba(5,10,20,0.92),_rgba(5,10,20,0.78))] px-4 py-4 backdrop-blur-xl lg:w-[300px] lg:border-b-0 lg:border-r">
      {/* Brand header */}
      <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4 shadow-[0_18px_48px_rgba(4,8,20,0.28)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(59,130,246,0.95),_rgba(139,92,246,0.95))] shadow-[0_10px_35px_rgba(90,102,255,0.45)]">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Q&A Workspace</p>
            <h1 className="truncate text-base font-semibold tracking-tight text-white">AdaptiveRAG</h1>
          </div>
        </div>
      </div>

      {/* Document history list */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/36">History</p>
          <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/50">
            {documents.length}
          </span>
        </div>

        <div className="app-scrollbar flex-1 space-y-1.5 overflow-y-auto pb-1">
          {documents.map((document) => {
            const isActive = document.id === activeDocumentId

            return (
              <div
                key={document.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectDocument(document.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelectDocument(document.id)}
                className={cn(
                  'group w-full cursor-pointer rounded-2xl border px-3 py-3 text-left transition-all',
                  isActive
                    ? 'border-blue-400/20 bg-[linear-gradient(135deg,_rgba(59,130,246,0.12),_rgba(139,92,246,0.08))] shadow-[0_6px_24px_rgba(50,90,255,0.1)]'
                    : 'border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.035]',
                )}
              >
                <div className="flex items-start gap-2.5">
                  {/* File icon */}
                  <div className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-white/65 transition-colors',
                    isActive ? 'border-blue-300/20 bg-blue-400/10' : 'border-white/8 bg-white/[0.03]',
                  )}>
                    <FileText className="h-3.5 w-3.5" />
                  </div>

                  {/* Name + meta */}
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'truncate text-sm font-medium leading-snug transition-colors',
                      isActive ? 'text-white' : 'text-white/85',
                    )}>
                      {document.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] capitalize',
                        isActive
                          ? 'border-blue-300/15 bg-blue-400/8 text-blue-100/80'
                          : 'border-white/8 bg-white/[0.025] text-white/50',
                      )}>
                        {document.structure}
                      </span>
                      <span className="text-[10px] text-white/35">{document.updatedAt}</span>
                    </div>
                  </div>

                  {/* Trash — visible on hover */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteHistory(document.id) }}
                    className="mt-0.5 shrink-0 rounded-lg border border-white/8 bg-white/[0.03] p-1.5 text-white/35 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/[0.08] hover:text-rose-300"
                    aria-label={`Delete ${document.name}`}
                    title="Delete document"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}

          {documents.length === 0 && (
            <p className="px-1 pt-2 text-xs text-white/30">No documents yet. Upload one below.</p>
          )}
        </div>
      </div>

      {/* Upload button */}
      <Button
        type="button"
        onClick={onUploadClick}
        className="mt-4 h-11 rounded-2xl border border-blue-300/20 bg-[linear-gradient(135deg,_rgba(37,99,235,0.95),_rgba(124,58,237,0.95))] text-sm font-medium text-white shadow-[0_16px_45px_rgba(71,85,255,0.22)] hover:opacity-95"
      >
        <Plus className="h-4 w-4" />
        Upload Document
      </Button>

      {/* Logout */}
      <button
        type="button"
        onClick={onLogout}
        className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <LogOut className="h-3.5 w-3.5" />
        Logout
      </button>
    </aside>
  )
}
