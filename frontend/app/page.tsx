'use client'

import { useState, useCallback } from 'react'
import { DocumentUpload } from '@/components/document-upload'
import { DocumentChat } from '@/components/document-chat'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import type { DocumentMetadata, Message } from '@/lib/types'
import { uploadDocument, askQuestion } from '@/lib/api'

export default function DocumentQAPage() {
  const [document, setDocument] = useState<DocumentMetadata | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleUpload = useCallback(async (file: File) => {
    // Set initial uploading state
    setDocument({
      id: 'uploading',
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      status: 'uploading',
    })
    setUploadProgress(0)

    // Progress tracking
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 100)

    try {
      // Call backend API
      const response = await uploadDocument(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      // Transition to indexing
      setDocument((prev) => prev ? { ...prev, status: 'indexing' } : null)

      // Set ready state with actual metadata from backend
      setDocument({
        id: response.document_id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        status: 'ready',
        pageCount: response.profile.total_chunks,
        sections: response.profile.sections || [],
        structureType: 'Document',
      })

      // Clear messages for new document
      setMessages([])

      toast.success('Document indexed successfully', {
        description: `${file.name} is ready for questions.`,
      })
    } catch (error) {
      clearInterval(progressInterval)
      setDocument((prev) => prev ? { ...prev, status: 'error' } : null)
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'There was an error processing your document.',
      })
    }
  }, [])

  const handleSendMessage = useCallback(async (content: string) => {
    if (!document?.id || document.status !== 'ready') {
      toast.error('No document loaded', {
        description: 'Please upload a document first.',
      })
      return
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Call backend API
      const response = await askQuestion(content, document.id)

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        confidence: response.confidence === 'high' ? 95 : response.confidence === 'medium' ? 75 : 55,
        strategy: response.strategy_used,
        sources: response.sources.map((source, index) => ({
          id: String(index),
          title: source.section || 'Unnamed Section',
          pageNumber: source.page,
          content: source.text || '',
        })),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      toast.error('Failed to get response', {
        description: error instanceof Error ? error.message : 'There was an error processing your question.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [document?.id, document?.status])

  return (
    <main className="flex min-h-screen flex-col bg-[#0f0f0f]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-[#3b82f6]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-white"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-white">ADAPTIVE-RAG</h1>
        </div>
        <span className="text-xs text-[#666]">Document Intelligence Platform</span>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:flex-row min-h-0">
        {/* Document Panel */}
        <div className="w-full lg:w-[400px] border-b lg:border-b-0 lg:border-r border-[#333] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-[#f5f5f5] mb-1">Document</h2>
            <p className="text-xs text-[#a3a3a3]">
              Upload a document to analyze and query
            </p>
          </div>
          <DocumentUpload
            document={document}
            onUpload={handleUpload}
            uploadProgress={uploadProgress}
          />
        </div>

        {/* Chat Panel */}
        <div className="flex flex-1 flex-col min-h-0">
          <DocumentChat
            messages={messages}
            onSendMessage={handleSendMessage}
            isDocumentReady={document?.status === 'ready'}
            isLoading={isLoading}
          />
        </div>
      </div>

      <Toaster position="bottom-right" theme="dark" />
    </main>
  )
}
