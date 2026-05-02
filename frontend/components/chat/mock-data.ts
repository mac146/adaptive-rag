import type {
  AssistantChatMessage,
  ChatDocument,
  ChatMessage,
  ConfidenceLabel,
  StrategyLabel,
} from '@/components/chat/types'

export const INITIAL_DOCUMENTS: ChatDocument[] = [
  {
    id: 'doc-q4-report',
    name: 'Q4 Operating Review.pdf',
    structure: 'high',
    meta: '42 pages',
    updatedAt: '2m ago',
    defaultStrategy: 'Hierarchical+Hybrid',
    defaultConfidence: 'High',
  },
  {
    id: 'doc-policy-playbook',
    name: 'Support Escalation Playbook.md',
    structure: 'medium',
    meta: '18 pages',
    updatedAt: '18m ago',
    defaultStrategy: 'Hybrid',
    defaultConfidence: 'Medium',
  },
  {
    id: 'doc-legal-brief',
    name: 'Vendor Security Addendum.docx',
    structure: 'low',
    meta: '11 pages',
    updatedAt: '1h ago',
    defaultStrategy: 'Hybrid',
    defaultConfidence: 'Low',
  },
]

export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'doc-q4-report': [
    {
      id: 'q4-user-1',
      role: 'user',
      content: 'Summarize the main risks called out in the Q4 review.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'q4-assistant-1',
      role: 'assistant',
      title: 'Answer',
      summary:
        'The Q4 review frames the biggest risks around delayed enterprise expansion, slower onboarding throughput, and uneven margins across premium accounts. The strongest signals come from the operating cadence section and the regional performance appendix.',
      bullets: [
        'Enterprise pipeline risk is tied to two strategic deals slipping into the next quarter.',
        'Implementation capacity is under pressure, which increases onboarding time for larger customers.',
        'Gross margin softness is concentrated in custom support-heavy accounts rather than the broader base.',
      ],
      strategy: 'Hierarchical+Hybrid',
      confidence: 'High',
      reason:
        'A structured operating review with clear sections benefits from heading-aware retrieval before hybrid validation.',
      sources: [
        { id: 'src-q4-1', section: 'Executive Summary', page: 2 },
        { id: 'src-q4-2', section: 'Risk Outlook', page: 14 },
        { id: 'src-q4-3', section: 'Regional Variance', page: 27 },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  'doc-policy-playbook': [
    {
      id: 'policy-user-1',
      role: 'user',
      content: 'How should the team handle P1 incidents after hours?',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'policy-assistant-1',
      role: 'assistant',
      title: 'Answer',
      summary:
        'After-hours P1 incidents should move immediately into the urgent escalation path, with IC ownership assigned first and customer communications initiated in parallel.',
      bullets: [
        'Page the on-call incident commander and open the severity bridge within 10 minutes.',
        'Notify customer success after the bridge is active, not before.',
        'Use the fallback notification chain if engineering leadership does not acknowledge within 15 minutes.',
      ],
      strategy: 'Hybrid',
      confidence: 'Medium',
      reason:
        'The playbook mixes procedures and short directives, so broad retrieval gives better coverage than section targeting alone.',
      sources: [
        { id: 'src-policy-1', section: 'P1 Escalation Flow', page: 4 },
        { id: 'src-policy-2', section: 'After-Hours Coverage', page: 9 },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  'doc-legal-brief': [
    {
      id: 'legal-user-1',
      role: 'user',
      content: 'Which clauses mention data retention obligations?',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'legal-assistant-1',
      role: 'assistant',
      title: 'Answer',
      summary:
        'Data retention is addressed in the storage limitation clause, the audit cooperation section, and the termination obligations appendix. The wording appears fragmented, which lowers confidence slightly.',
      bullets: [
        'The primary retention window is described under storage limitation.',
        'Audit cooperation references retained logs needed for compliance review.',
        'Termination obligations specify deletion or return after the final retention period ends.',
      ],
      strategy: 'Hybrid',
      confidence: 'Low',
      reason:
        'The document is less structured and uses legal cross-references, so hybrid retrieval is more reliable than heading-driven routing.',
      sources: [
        { id: 'src-legal-1', section: 'Storage Limitation', page: 3 },
        { id: 'src-legal-2', section: 'Audit Cooperation', page: 6 },
        { id: 'src-legal-3', section: 'Termination Obligations', page: 10 },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
}

const QUESTION_LIBRARY = [
  {
    includes: ['summary', 'summarize', 'overview'],
    summary:
      'The document centers on operational priorities, the main execution blockers, and the sections where decision-makers are expected to act next.',
    bullets: [
      'Key insights are clustered around performance trends, implementation friction, and measurable next steps.',
      'High-signal sections are prioritized so the answer stays grounded in document structure rather than generic chat output.',
      'The narrative suggests the team should focus on follow-up execution rather than additional discovery.',
    ],
  },
  {
    includes: ['risk', 'issue', 'concern'],
    summary:
      'The strongest risk signals point to delivery bottlenecks, ambiguous ownership across critical workstreams, and lagging visibility into downstream impact.',
    bullets: [
      'Operational bottlenecks appear where approvals and implementation overlap.',
      'Several sections imply dependency risk caused by handoffs between teams.',
      'The mitigation path is documented, but timing assumptions remain the weakest point.',
    ],
  },
  {
    includes: ['timeline', 'when', 'deadline'],
    summary:
      'The document indicates a staged timeline where the immediate milestone is clearly defined, while later checkpoints remain conditional on upstream delivery.',
    bullets: [
      'The first milestone is committed and linked to a specific owner.',
      'Mid-cycle checkpoints depend on review outcomes and staffing availability.',
      'Final delivery timing is framed as achievable but sensitive to unresolved dependencies.',
    ],
  },
]

function pickStrategy(document: ChatDocument): StrategyLabel {
  return document.structure === 'high' ? 'Hierarchical+Hybrid' : 'Hybrid'
}

function pickConfidence(document: ChatDocument): ConfidenceLabel {
  if (document.structure === 'high') return 'High'
  if (document.structure === 'medium') return 'Medium'
  return 'Low'
}

export function buildMockResponse(
  question: string,
  document: ChatDocument,
  isUploadGreeting: true,
): ChatMessage[]
export function buildMockResponse(
  question: string,
  document: ChatDocument,
  isUploadGreeting?: false,
): AssistantChatMessage
export function buildMockResponse(
  question: string,
  document: ChatDocument,
  isUploadGreeting = false,
): AssistantChatMessage | ChatMessage[] {
  if (isUploadGreeting) {
    return [
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        title: 'Answer',
        summary:
          'Your document is staged in the workspace. The dashboard is ready for section-aware questioning, source tracing, and strategy-aware analysis.',
        bullets: [
          'Use the chat composer to ask for summaries, risks, metrics, or clause references.',
          `This file is marked with ${document.structure} structure confidence for demo routing.`,
          'Source chips will stay attached to every response so the experience feels document-first.',
        ],
        strategy: pickStrategy(document),
        confidence: pickConfidence(document),
        reason:
          'This mock onboarding response is shaped to preview the dashboard state immediately after upload.',
        sources: [
          { id: crypto.randomUUID(), section: 'Document Overview', page: 1 },
          { id: crypto.randomUUID(), section: 'Indexed Sections', page: 2 },
        ],
        createdAt: new Date().toISOString(),
      },
    ]
  }

  const normalizedQuestion = question.toLowerCase()
  const matchedTemplate = QUESTION_LIBRARY.find((template) =>
    template.includes.some((term) => normalizedQuestion.includes(term)),
  )

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    title: 'Answer',
    summary:
      matchedTemplate?.summary ??
      'The document suggests the answer sits across a few related sections rather than a single quote, so the response blends direct evidence with the surrounding context.',
    bullets:
      matchedTemplate?.bullets ?? [
        'The most relevant sections are grouped together to reduce fragmented retrieval.',
        'Document structure influences how aggressively the answer leans on heading-aware routing.',
        'The source chips highlight where the strongest evidence likely lives for a follow-up question.',
      ],
    strategy: pickStrategy(document),
    confidence: pickConfidence(document),
    reason:
      document.structure === 'high'
        ? 'The active document has reliable headings, so section-aware retrieval can narrow context before hybrid verification.'
        : 'The active document appears less structured, so the response uses broader retrieval to preserve recall.',
    sources: [
      { id: crypto.randomUUID(), section: 'Executive Context', page: 1 },
      { id: crypto.randomUUID(), section: 'Core Findings', page: 2 },
      { id: crypto.randomUUID(), section: 'Supporting Detail', page: 3 },
    ],
    createdAt: new Date().toISOString(),
  }
}

export function buildUploadedDocument(fileName: string): ChatDocument {
  return {
    id: crypto.randomUUID(),
    name: fileName,
    structure: 'medium',
    meta: '24 pages',
    updatedAt: 'just now',
    defaultStrategy: 'Hybrid',
    defaultConfidence: 'Medium',
  }
}
