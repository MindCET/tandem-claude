'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Loader2, AlertCircle, CheckCircle2, AlertTriangle, GitBranch,
  ArrowRight, RotateCcw, ListChecks,
} from 'lucide-react'
import type { ReturnAnalysis } from '@/lib/ai/schemas'

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  completed: { label: 'הושלם', className: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
  partial:   { label: 'חלקי',  className: 'bg-amber-100 text-amber-800', icon: <AlertTriangle className="h-4 w-4" /> },
  blocked:   { label: 'חסום',  className: 'bg-red-100 text-red-800',    icon: <AlertCircle className="h-4 w-4" /> },
  failed:    { label: 'נכשל',  className: 'bg-red-100 text-red-800',    icon: <AlertCircle className="h-4 w-4" /> },
}

const DRIFT_CONFIG: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  none:     { label: 'ללא סטייה',     variant: 'outline'     },
  minor:    { label: 'סטייה קלה',     variant: 'secondary'   },
  moderate: { label: 'סטייה בינונית', variant: 'default'     },
  major:    { label: 'סטייה גדולה',   variant: 'destructive' },
}

export default function ReturnPage() {
  const params = useParams<{ projectId: string }>()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const projectId = params.projectId
  const missionId = searchParams.get('missionId')

  const [projectName, setProjectName] = useState('')
  const [missions, setMissions] = useState<Array<{ id: string; tasks: { title: string } | null }>>([])
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(missionId)
  const [rawSummary, setRawSummary] = useState('')
  const [analysis, setAnalysis] = useState<ReturnAnalysis | null>(null)
  const [savedCounts, setSavedCounts] = useState<{ decisions: number; risks: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [projRes, missionsRes] = await Promise.all([
        supabase.from('projects').select('name').eq('id', projectId).single(),
        supabase
          .from('missions')
          .select('id, tasks(title)')
          .eq('project_id', projectId)
          .in('status', ['ready', 'sent_to_tool'])
          .order('created_at', { ascending: false }),
      ])
      // Project missing or inaccessible (RLS) — surface as not found.
      if (projRes.error || !projRes.data) {
        setLoadError(true)
        setLoading(false)
        return
      }
      setProjectName(projRes.data.name ?? '')
      setMissions((missionsRes.data ?? []) as unknown as Array<{ id: string; tasks: { title: string } | null }>)
      setLoading(false)
    }
    load()
  }, [projectId])

  async function handleAnalyze() {
    if (!rawSummary.trim()) {
      setError('יש להדביק סיכום מהכלי לפני הניתוח')
      return
    }
    setError(null)
    setAnalyzing(true)
    setAnalysis(null)
    setSavedCounts(null)
    try {
      const res = await fetch('/api/ai/analyze-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          rawSummary,
          missionId: selectedMissionId,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'שגיאה בניתוח')
      }
      const data = await res.json()
      setAnalysis(data.analysis)
      setSavedCounts({ decisions: data.decisionsCount, risks: data.risksCount })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>הפרויקט לא נמצא או שאין לך גישה אליו</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/app/projects">חזרה לפרויקטים</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/app/projects/${projectId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← חזרה ל-{projectName}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-md bg-primary/10 p-2">
          <RotateCcw className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Return Brief</h1>
          <p className="text-sm text-muted-foreground">הדבק את הסיכום מהכלי ו-AI ינתח את התקדמות הפרויקט</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!analysis ? (
        /* Input form */
        <div className="space-y-4">
          {/* Mission selector */}
          {missions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">משימה (אופציונלי)</CardTitle>
                <CardDescription className="text-xs">בחר את המשימה שאליה מתייחס הסיכום</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedMissionId(null)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      !selectedMissionId
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    ללא קישור למשימה
                  </button>
                  {missions.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMissionId(m.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        selectedMissionId === m.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {m.tasks?.title ?? 'Mission'}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paste area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">הדבק סיכום מהכלי</CardTitle>
              <CardDescription>
                סיים עבודה ב-Claude Code / Cursor / v0.dev? הדבק את הסיכום של הכלי כאן
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="הדבק כאן את הסיכום שהכלי יצר אחרי השלמת המשימה..."
                value={rawSummary}
                onChange={(e) => setRawSummary(e.target.value)}
                className="min-h-[240px] font-mono text-sm resize-none"
                dir="ltr"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {rawSummary.length > 0 ? `${rawSummary.length} תווים` : 'לפחות 50 תווים מומלצים'}
                </p>
                <Button onClick={handleAnalyze} disabled={analyzing || rawSummary.trim().length < 20}>
                  {analyzing ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      מנתח...
                    </>
                  ) : (
                    'נתח סיכום'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Analysis results */
        <div className="space-y-4">
          {/* Saved counts */}
          {savedCounts && (savedCounts.decisions > 0 || savedCounts.risks > 0) && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="flex gap-4">
                {savedCounts.decisions > 0 && (
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3.5 w-3.5" />
                    {savedCounts.decisions} החלטות נשמרו
                  </span>
                )}
                {savedCounts.risks > 0 && (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {savedCounts.risks} סיכונים נשמרו
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Status + Summary */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_CONFIG[analysis.status]?.className ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {STATUS_CONFIG[analysis.status]?.icon}
                  {STATUS_CONFIG[analysis.status]?.label ?? analysis.status}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{analysis.summary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Drift Detection */}
          {analysis.drift_detected && (
            <Alert variant={analysis.drift_severity === 'major' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center gap-2 mb-1">
                  <strong>זוהתה סטייה מהתוכנית</strong>
                  <Badge variant={DRIFT_CONFIG[analysis.drift_severity]?.variant ?? 'outline'}>
                    {DRIFT_CONFIG[analysis.drift_severity]?.label ?? analysis.drift_severity}
                  </Badge>
                </div>
                <p className="text-sm">{analysis.drift_description}</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Completed items */}
          {analysis.completed_items.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  הושלם בהצלחה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {analysis.completed_items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-green-500 shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Blockers */}
          {analysis.blockers.length > 0 && (
            <Card className="border-destructive/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  חסמים ובעיות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {analysis.blockers.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm text-destructive">
                      <span className="shrink-0">✗</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* New Decisions */}
          {analysis.new_decisions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" />
                  החלטות חדשות שהתגלו ({analysis.new_decisions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.new_decisions.map((d, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <p className="text-sm font-semibold">{d.title}</p>
                      <p className="text-sm mt-0.5">{d.decision}</p>
                      {d.rationale && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>נימוק:</strong> {d.rationale}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Risks */}
          {analysis.new_risks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  סיכונים שהתגלו ({analysis.new_risks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.new_risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Badge
                        className={
                          r.severity === 'critical' ? 'bg-red-100 text-red-800 text-[10px]' :
                          r.severity === 'high'     ? 'bg-orange-100 text-orange-800 text-[10px]' :
                          r.severity === 'medium'   ? 'bg-amber-100 text-amber-800 text-[10px]' :
                                                      'bg-slate-100 text-slate-700 text-[10px]'
                        }
                      >
                        {r.severity}
                      </Badge>
                      <div>
                        <span className="font-medium">{r.title}</span>
                        {r.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Recommended Actions */}
          {analysis.next_recommended_actions.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  הצעדים הבאים המומלצים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1.5">
                  {analysis.next_recommended_actions.map((action, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setAnalysis(null)
                setRawSummary('')
                setSavedCounts(null)
              }}
            >
              נתח סיכום נוסף
            </Button>
            <Button asChild>
              <Link href={`/app/projects/${projectId}/tasks`}>
                המשך למשימות
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
