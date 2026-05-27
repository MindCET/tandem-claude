import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

interface PageProps {
  params: Promise<{ projectId: string }>
}

const SEVERITY_CONFIG: Record<string, { label: string; className: string; order: number }> = {
  critical: { label: 'קריטי',  className: 'bg-red-100 text-red-800 border-red-200',       order: 0 },
  high:     { label: 'גבוה',   className: 'bg-orange-100 text-orange-800 border-orange-200', order: 1 },
  medium:   { label: 'בינוני', className: 'bg-amber-100 text-amber-800 border-amber-200',   order: 2 },
  low:      { label: 'נמוך',   className: 'bg-slate-100 text-slate-700 border-slate-200',   order: 3 },
}

const SOURCE_LABELS: Record<string, string> = {
  architecture:  'ארכיטקטורה',
  return_brief:  'תדריך חזרה',
  manual:        'ידני',
}

export default async function RisksPage({ params }: PageProps) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/app/projects/${projectId}/risks`)

  const [projectRes, risksRes] = await Promise.all([
    supabase.from('projects').select('name').eq('id', projectId).single(),
    supabase
      .from('risks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
  ])

  if (!projectRes.data) notFound()

  const project = projectRes.data
  const risks = (risksRes.data ?? []).sort(
    (a, b) =>
      (SEVERITY_CONFIG[a.severity]?.order ?? 9) - (SEVERITY_CONFIG[b.severity]?.order ?? 9)
  )

  const openRisks = risks.filter((r) => r.status === 'open')
  const resolvedRisks = risks.filter((r) => r.status !== 'open')

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/app/projects/${projectId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← חזרה ל-{project.name}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-destructive/10 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">רגיסטר סיכונים</h1>
            <p className="text-sm text-muted-foreground">
              {openRisks.length} פתוחים · {resolvedRisks.length} סגורים
            </p>
          </div>
        </div>
        {/* Severity breakdown */}
        <div className="flex gap-2 flex-wrap justify-end">
          {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
            const count = openRisks.filter((r) => r.severity === sev).length
            if (count === 0) return null
            const cfg = SEVERITY_CONFIG[sev]
            return (
              <Badge key={sev} className={`text-xs ${cfg.className}`}>
                {cfg.label} ({count})
              </Badge>
            )
          })}
        </div>
      </div>

      {risks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              אין סיכונים — הם יווצרו אוטומטית מ-Architecture ו-Return Briefs
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Open risks */}
          {openRisks.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                פתוחים ({openRisks.length})
              </h2>
              <div className="space-y-2">
                {openRisks.map((risk) => {
                  const cfg = SEVERITY_CONFIG[risk.severity] ?? SEVERITY_CONFIG.low
                  return (
                    <Card key={risk.id} className={`border ${cfg.className.split(' ').find(c => c.startsWith('border-')) ?? ''}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                          <Badge className={`text-[10px] shrink-0 mt-0.5 ${cfg.className}`}>
                            {cfg.label}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{risk.title}</p>
                            {risk.description && (
                              <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>
                            )}
                            {risk.recommended_action && (
                              <p className="text-xs mt-1.5">
                                <strong className="text-foreground">פעולה מומלצת:</strong>{' '}
                                <span className="text-muted-foreground">{risk.recommended_action}</span>
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {risk.source && (
                                <span className="text-[10px] text-muted-foreground">
                                  מקור: {SOURCE_LABELS[risk.source] ?? risk.source}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(risk.created_at).toLocaleDateString('he-IL')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )}

          {/* Resolved risks */}
          {resolvedRisks.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                סגורים / פתורים ({resolvedRisks.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {resolvedRisks.map((risk) => (
                  <Card key={risk.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                          {risk.severity}
                        </Badge>
                        <div>
                          <p className="text-sm font-semibold line-through">{risk.title}</p>
                          {risk.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-through">{risk.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
