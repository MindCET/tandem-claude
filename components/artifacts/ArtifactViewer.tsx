'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, FileText } from 'lucide-react'
import { escapeHtml } from '@/lib/utils'

interface Props {
  title: string
  type: string
  status: string
  markdown: string
  version?: number
  updatedAt?: string
}

// Simple Markdown-to-HTML renderer
// Handles: headings, bold, lists, code blocks, paragraphs
function renderMarkdown(md: string): string {
  return escapeHtml(md)
    // Code blocks first — replace before other rules so content isn't processed again
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="art-code"><code>$1</code></pre>')
    // Headings
    .replace(/^### (.+)$/gm, '<h4 class="art-h4">$1</h4>')
    .replace(/^## (.+)$/gm,  '<h3 class="art-h3">$1</h3>')
    .replace(/^# (.+)$/gm,   '<h2 class="art-h2">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // List items
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="art-list">$1</ul>')
    // Paragraphs: any non-empty line that doesn't already start with an HTML tag
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft:      { label: 'טיוטה',  variant: 'secondary' },
  approved:   { label: 'מאושר', variant: 'default'   },
  superseded: { label: 'הוחלף', variant: 'outline'   },
}

const TYPE_LABELS: Record<string, string> = {
  product_brief: 'Product Brief',
  prd:           'PRD',
  architecture:  'Architecture',
  data_model:    'Data Model',
}

export function ArtifactViewer({ title, type, status, markdown, version, updatedAt }: Props) {
  const statusInfo = STATUS_LABELS[status] ?? { label: status, variant: 'outline' as const }
  const typeLabel  = TYPE_LABELS[type] ?? type

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
              <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
              {version && version > 1 && (
                <span className="text-xs text-muted-foreground">v{version}</span>
              )}
            </div>
          </div>
        </div>
        {updatedAt && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {new Date(updatedAt).toLocaleDateString('he-IL')}
          </span>
        )}
      </div>

      {/* Content — hardcoded colors to avoid Tailwind v4 CSS variable issues */}
      <div
        className="artifact-content"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
      />

      <style>{`
        .artifact-content .art-h2 { font-size: 1.2rem; font-weight: 700; margin: 1.4rem 0 0.5rem; color: #0f172a; }
        .artifact-content .art-h3 { font-size: 1.05rem; font-weight: 600; margin: 1.1rem 0 0.4rem; color: #1e293b; }
        .artifact-content .art-h4 { font-size: 0.9rem; font-weight: 600; margin: 0.9rem 0 0.3rem; color: #334155; }
        .artifact-content .art-list { padding-right: 1.2rem; margin: 0.4rem 0; list-style-type: disc; }
        .artifact-content .art-list li { font-size: 0.875rem; color: #475569; line-height: 1.6; margin-bottom: 0.15rem; }
        .artifact-content .art-code { background: #0f172a; color: #e2e8f0; padding: 12px 16px; border-radius: 8px; font-family: 'SF Mono','Fira Code',monospace; font-size: 12px; line-height: 1.6; overflow-x: auto; direction: ltr; text-align: left; margin: 0.75rem 0; white-space: pre; }
        .artifact-content p { font-size: 0.875rem; color: #475569; line-height: 1.7; margin: 0.3rem 0; }
        .artifact-content strong { color: #1e293b; font-weight: 600; }
        .artifact-content hr { border: none; border-top: 1px solid #e2e8f0; margin: 1rem 0; }
      `}</style>
    </div>
  )
}
