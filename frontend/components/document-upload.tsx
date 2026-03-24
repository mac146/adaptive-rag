'use client'

import { useCallback, useState } from 'react'
import { FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import type { DocumentMetadata } from '@/lib/types'

interface DocumentUploadProps {
  document: DocumentMetadata | null
  onUpload: (file: File) => void
  uploadProgress: number
}

export function DocumentUpload({ document, onUpload, uploadProgress }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      onUpload(file)
    }
  }, [onUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }, [onUpload])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (document) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center bg-[#262626] border border-[#404040]">
            <FileText className="h-6 w-6 text-[#60a5fa]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-[#f5f5f5] truncate">{document.name}</h3>
              {document.status === 'ready' && (
                <Badge className="bg-[#10b981] text-white border-0 rounded-sm gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Indexed
                </Badge>
              )}
              {document.status === 'indexing' && (
                <Badge className="bg-[#3b82f6] text-white border-0 rounded-sm gap-1">
                  <Spinner className="h-3 w-3" />
                  Indexing
                </Badge>
              )}
              {document.status === 'uploading' && (
                <Badge className="bg-[#404040] text-[#a3a3a3] border-0 rounded-sm">
                  Uploading
                </Badge>
              )}
              {document.status === 'error' && (
                <Badge className="bg-red-500/20 text-red-400 border-0 rounded-sm gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Error
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-[#a3a3a3]">
              <span>{formatFileSize(document.size)}</span>
              <span className="text-[#404040]">•</span>
              <span>{formatDate(document.uploadedAt)}</span>
            </div>
            {document.status === 'uploading' && (
              <div className="mt-3">
                <Progress value={uploadProgress} className="h-1 bg-[#333] rounded-none [&>div]:bg-[#3b82f6] [&>div]:rounded-none" />
              </div>
            )}
            {document.status === 'ready' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {document.pageCount && (
                  <span className="text-xs bg-[#262626] border border-[#333] px-2 py-1 text-[#a3a3a3]">
                    {document.pageCount} pages
                  </span>
                )}
                {document.structureType && (
                  <span className="text-xs bg-[#262626] border border-[#333] px-2 py-1 text-[#a3a3a3]">
                    {document.structureType}
                  </span>
                )}
                {document.sections && document.sections.length > 0 && (
                  <span className="text-xs bg-[#262626] border border-[#333] px-2 py-1 text-[#a3a3a3]">
                    {document.sections.length} sections
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'bg-[#1a1a1a] border border-dashed p-8 transition-colors cursor-pointer',
        isDragging ? 'border-[#60a5fa] bg-[#60a5fa]/5' : 'border-[#333] hover:border-[#404040]'
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className={cn(
          'flex h-14 w-14 items-center justify-center mb-4 transition-colors',
          isDragging ? 'bg-[#60a5fa]/10' : 'bg-[#262626]'
        )}>
          <Upload className={cn(
            'h-6 w-6 transition-colors',
            isDragging ? 'text-[#60a5fa]' : 'text-[#a3a3a3]'
          )} />
        </div>
        <p className="text-sm text-[#e5e5e5] mb-1">
          Drop your PDF, DOCX, or Markdown here
        </p>
        <p className="text-xs text-[#a3a3a3] mb-4">
          or click to browse files
        </p>
        <label>
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.docx,.md,.txt"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-[#404040] text-[#e5e5e5] hover:bg-[#262626] hover:text-white rounded-none cursor-pointer"
            asChild
          >
            <span>Browse files</span>
          </Button>
        </label>
      </div>
    </div>
  )
}
