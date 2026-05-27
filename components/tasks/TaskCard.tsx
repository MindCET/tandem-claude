import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Compass, Wrench } from 'lucide-react'

interface Props {
  id: string
  projectId: string
  title: string
  description: string | null
  phase: string | null
  priority: string
  complexity: string
  status: string
  recommended_tool: string | null
  acceptance_criteria: string[]
}

const PRIORITY_STYLE: Record<string, { label: string; className: string }> = {
  P0: { label: 'P0 חובה', className: 'bg-red-950/60 text-red-400 border border-red-800/50' },
  P1: { label: 'P1 חשוב', className: 'bg-amber-950/60 text-amber-400 border border-amber-800/50' },
  P2: { label: 'P2 נחמד', className: 'bg-muted text-muted-foreground border border-border' },
}

const COMPLEXITY_STYLE: Record<string, string> = {
  small:  'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50',
  medium: 'bg-primary/10 text-primary border border-primary/30',
  large:  'bg-purple-950/60 text-purple-400 border border-purple-800/50',
}

const COMPLEXITY_HE: Record<string, string> = {
  small:  'קטן',
  medium: 'בינוני',
  large:  'גדול',
}

const STATUS_STYLE: Record<string, string> = {
  not_started:  'border-slate-200',
  ready:        'border-blue-300 bg-blue-50/30',
  sent_to_tool: 'border-amber-300 bg-amber-50/30',
  returned:     'border-green-300 bg-green-50/30',
  approved:     'border-green-400 bg-green-50/50 opacity-70',
  blocked:      'border-red-300 bg-red-50/30',
}

export function TaskCard({
  id, projectId, title, description, priority, complexity, status, recommended_tool, acceptance_criteria,
}: Props) {
  const prioStyle  = PRIORITY_STYLE[priority]  ?? { label: priority,   className: 'bg-slate-100 text-slate-700' }
  const cmpxClass  = COMPLEXITY_STYLE[complexity] ?? 'bg-slate-100 text-slate-700'
  const cmpxLabel  = COMPLEXITY_HE[complexity]    ?? complexity
  const borderCls  = STATUS_STYLE[status]         ?? 'border-slate-200'

  return (
    <Card className={`border ${borderCls} transition-colors`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-semibold leading-snug">{title}</CardTitle>
          <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
            <Badge className={`text-[10px] ${prioStyle.className}`}>{prioStyle.label}</Badge>
            <Badge className={`text-[10px] ${cmpxClass}`}>{cmpxLabel}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}

        {recommended_tool && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wrench className="h-3 w-3" />
            <span>{recommended_tool}</span>
          </div>
        )}

        {acceptance_criteria.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">קריטריוני קבלה</p>
            <ul className="space-y-0.5">
              {acceptance_criteria.slice(0, 3).map((c, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                  <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                  <span>{c}</span>
                </li>
              ))}
              {acceptance_criteria.length > 3 && (
                <li className="text-xs text-muted-foreground">+{acceptance_criteria.length - 3} נוספים</li>
              )}
            </ul>
          </div>
        )}

        {status !== 'approved' && (
          <div className="pt-1">
            <Button asChild size="sm" variant="outline" className="w-full text-xs h-8">
              <Link href={`/app/projects/${projectId}/missions/new?taskId=${id}`}>
                <Compass className="ml-1.5 h-3 w-3" />
                צור תדריך משימה
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
