'use client'

import { memo, useCallback } from 'react'
import { FileText, LogOut } from 'lucide-react'

import { DocList } from '@/components/DocList'
import { UploadZone } from '@/components/UploadZone'
import { createClient } from '@/lib/supabase/client'
import type { AdaptiveDocument, UploadingState } from '@/lib/types'

interface SidebarProps {
  documents: AdaptiveDocument[]
  activeDocumentId: string | null
  onSelectDocument: (documentId: string) => void
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
  uploadingState: UploadingState | null
}

function SidebarComponent({
  documents,
  activeDocumentId,
  onSelectDocument,
  onUpload,
  isUploading,
  uploadingState,
}: SidebarProps) {
  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }, [])

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-b-[0.5px] border-r-[0.5px] border-border bg-muted md:w-[260px] md:border-b-0">
      <div className="flex items-center gap-3 border-b-[0.5px] border-border px-5 py-4">
        <div className="flex size-7 items-center justify-center bg-[#534AB7] text-white">
          <FileText className="size-4" />
        </div>
        <div>
          <p className="text-[13px] font-medium tracking-[0.01em]">Adaptive RAG</p>
        </div>
      </div>
      <div className="border-b-[0.5px] border-border px-4 py-4">
        <UploadZone onUpload={onUpload} isUploading={isUploading} uploadingState={uploadingState} />
      </div>
      <div className="px-4 pb-3 pt-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Documents</p>
      </div>
      <div className="min-h-0 flex-1 px-2 pb-2">
        <DocList
          documents={documents}
          activeDocumentId={activeDocumentId}
          onSelectDocument={onSelectDocument}
        />
      </div>
      <div className="border-t-[0.5px] border-border px-4 py-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export const Sidebar = memo(SidebarComponent)
