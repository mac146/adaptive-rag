export type StructureLabel = 'high' | 'medium' | 'low'
export type StrategyLabel = 'Hybrid' | 'Hierarchical+Hybrid'
export type ConfidenceLabel = 'High' | 'Medium' | 'Low'

export interface ChatDocument {
  id: string
  name: string
  structure: StructureLabel
  meta: string
  updatedAt: string
  defaultStrategy: StrategyLabel
  defaultConfidence: ConfidenceLabel
}

export interface ChatSource {
  id: string
  section: string
  page: number
}

export interface UserChatMessage {
  id: string
  role: 'user'
  content: string
  createdAt: string
}

export interface AssistantChatMessage {
  id: string
  role: 'assistant'
  title: string
  summary: string
  bullets: string[]
  strategy: StrategyLabel
  confidence: ConfidenceLabel
  reason: string
  sources: ChatSource[]
  createdAt: string
}

export type ChatMessage = UserChatMessage | AssistantChatMessage
