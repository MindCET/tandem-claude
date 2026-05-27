import type { Database } from './database'

// Row types (read from DB)
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Artifact = Database['public']['Tables']['artifacts']['Row']
export type Decision = Database['public']['Tables']['decisions']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Mission = Database['public']['Tables']['missions']['Row']
export type ToolSession = Database['public']['Tables']['tool_sessions']['Row']
export type Risk = Database['public']['Tables']['risks']['Row']
export type OpenQuestion = Database['public']['Tables']['open_questions']['Row']
export type AILog = Database['public']['Tables']['ai_logs']['Row']

// Insert helpers (write to DB)
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ArtifactInsert = Database['public']['Tables']['artifacts']['Insert']
export type DecisionInsert = Database['public']['Tables']['decisions']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type MissionInsert = Database['public']['Tables']['missions']['Insert']
export type RiskInsert = Database['public']['Tables']['risks']['Insert']

// Domain enums — string-literal types for code clarity
export type ProjectStage =
  | 'idea_capture'
  | 'clarification'
  | 'product_brief_draft'
  | 'product_brief_approved'
  | 'prd_draft'
  | 'prd_approved'
  | 'architecture_draft'
  | 'architecture_approved'
  | 'task_plan_draft'
  | 'task_plan_approved'
  | 'mission_ready'
  | 'mission_sent'
  | 'return_received'
  | 'return_reviewed'
  | 'iteration_ready'
  | 'testing_ready'
  | 'deployment_ready'
  | 'live'

export type ArtifactType =
  | 'product_brief'
  | 'prd'
  | 'architecture'
  | 'data_model'
  | 'analytics_plan'
  | 'docs_export'

export type TaskStatus =
  | 'not_started'
  | 'ready'
  | 'sent_to_tool'
  | 'returned'
  | 'needs_review'
  | 'approved'
  | 'blocked'

export type ArtifactSource = 'user_created' | 'ai_generated' | 'imported'

export type ArtifactVersionChangedBy = 'user' | 'ai_suggestion' | 'return_brief'

export interface ArtifactVersion {
  id: string
  artifact_id: string
  content_markdown: string | null
  version: number
  changed_by: ArtifactVersionChangedBy
  change_summary: string | null
  created_at: string
}

// Computed artifact health — not stored, derived at runtime
export interface ArtifactHealth {
  type: ArtifactType
  label: string
  status: 'complete' | 'draft' | 'missing' | 'skipped'
  href: string
  artifactId?: string
  skipReason?: string | null
}

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'

export type DecisionCategory =
  | 'technical'
  | 'product'
  | 'design'
  | 'business'
  | 'security'

// Human-readable labels for stages (Hebrew)
export const STAGE_LABELS_HE: Record<ProjectStage, string> = {
  idea_capture: 'תפיסת רעיון',
  clarification: 'בירור',
  product_brief_draft: 'טיוטת תדריך',
  product_brief_approved: 'תדריך מאושר',
  prd_draft: 'טיוטת PRD',
  prd_approved: 'PRD מאושר',
  architecture_draft: 'טיוטת ארכיטקטורה',
  architecture_approved: 'ארכיטקטורה מאושרת',
  task_plan_draft: 'טיוטת משימות',
  task_plan_approved: 'תוכנית משימות מאושרת',
  mission_ready: 'משימה מוכנה',
  mission_sent: 'משימה נשלחה',
  return_received: 'התקבל סיכום',
  return_reviewed: 'סיכום נסקר',
  iteration_ready: 'מוכן לאיטרציה',
  testing_ready: 'מוכן לבדיקה',
  deployment_ready: 'מוכן לפריסה',
  live: 'בייצור',
}
