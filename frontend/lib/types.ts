export type StructureScore = 'high' | 'medium' | 'low'
export type DocumentLength = 'short' | 'medium' | 'long'
export type Confidence = 'high' | 'medium' | 'low' | 'forced'
export type AskStrategyOverride = 'auto' | 'hybrid' | 'hierarchical+hybrid'

export interface DocumentProfile {
  total_words: number
  total_sections: number
  heading_count: number
  heading_levels: number[]
  size_variance: 'high' | 'low'
  structure_score: StructureScore
  length: DocumentLength
}

export interface AdaptiveDocument {
  id: string
  name: string
  profile: DocumentProfile
  uploadedAt: string
  isDemo?: boolean
}

export interface UploadingState {
  fileName: string
}

export interface SourceReference {
  section?: string | null
  page?: number | null
  text?: string | null
}

export interface UserMessage {
  id: string
  role: 'user'
  content: string
  createdAt: string
}

export interface AnswerMessage {
  id: string
  role: 'assistant'
  answer: string
  createdAt: string
  strategy_used: string
  reason: string
  confidence: Confidence
  target_sections: string[]
  sources: SourceReference[]
}

export type ThreadMessage = UserMessage | AnswerMessage

export interface UploadResponse {
  document_id: string
  profile: DocumentProfile
}

export interface AskRequest {
  question: string
  document_id: string
  force_strategy?: Exclude<AskStrategyOverride, 'auto'>
}

export interface AskResponse {
  answer: string
  strategy_used: string
  reason: string
  confidence: Confidence
  target_sections: string[]
  sources: SourceReference[]
}

export interface HealthResponse {
  status: 'ok'
}
