export interface DocumentMetadata {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
  pageCount?: number
  sections?: string[]
  structureType?: string
  status: 'uploading' | 'indexing' | 'ready' | 'error'
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: number
  strategy?: 'Hybrid Retrieval' | 'Vector Search' | 'Keyword Search'
  sources?: Source[]
}

export interface Source {
  id: string
  title: string
  pageNumber?: number
  content: string
}
