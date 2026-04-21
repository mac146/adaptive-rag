'use client'

import { useRef, useState } from 'react'
import { FileUp, LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { UploadingState } from '@/lib/types'

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
  uploadingState: UploadingState | null
}

const acceptedExtensions = ['pdf', 'docx', 'md', 'txt']

export function UploadZone({ onUpload, isUploading, uploadingState }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  async function submitFile(file: File | undefined) {
    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !acceptedExtensions.includes(extension)) return
    await onUpload(file)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={() => setIsDragging(true)}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={async (event) => {
          event.preventDefault()
          setIsDragging(false)
          await submitFile(event.dataTransfer.files?.[0])
        }}
        disabled={isUploading}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 border-[0.5px] border-dashed border-border bg-muted/50 px-4 py-6 text-center transition-colors',
          isDragging && 'border-[#534AB7] bg-[#534AB7]/10',
          isUploading && 'cursor-wait',
        )}
      >
        <div className="flex size-8 items-center justify-center border-[0.5px] border-border bg-background">
          {isUploading ? (
            <LoaderCircle className="size-4 animate-spin text-[#534AB7]" />
          ) : (
            <FileUp className="size-4 text-[#534AB7]" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[13px] font-medium">
            {isUploading ? 'Uploading document...' : 'Drop a document here'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            PDF, DOCX, MD, or TXT. Click to browse.
          </p>
          {uploadingState ? (
            <p className="truncate text-[11px] text-muted-foreground">{uploadingState.fileName}</p>
          ) : null}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.md,.txt"
        onChange={async (event) => {
          await submitFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </>
  )
}
