'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Copy, Check, BookOpen, FileText, GitBranch, ListChecks, AlertTriangle } from 'lucide-react'

interface Artifact {
  type: string
  title: string
  content_markdown: string | null
  status: string
  version: number
  updated_at: string
}

interface Decision {
  title: string
  decision: string
  rationale: string | null
  category: string
  status: string
}

interface Task {
  title: string
  description: string | null
  phase: string | null
  priority: string
  complexity: string
  recommended_tool: string | null
  status: string
}

interface Risk {
  title: string
  description: string | null
  severity: string
  status: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }
  return (
    <Button onClick={copy} variant="outline" size="sm" className="gap-2">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'הועתק!' : 'העתק Markdown'}
    </Button>
  )
}

function SectionStatus({ count, label }: { count: number; label: string }) {
  return (
    <Badge variant={count > 0 ? 'default' : 'secondary'} className="text-xs">
      {count} {label}
    </Badge>
  )
}

export default function DocsPage() {
  const params = useParams<{ projectId: string }>()
  const supabase = createClient()
  const projectId = params.projectId

  const [projectName, setProjectName] = useState('')
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    async function load() {
      const [projRes, artRes, decRes, taskRes, riskRes] = await Promise.all([
        supabase.from('projects').select('name').eq('id', projectId).single(),
        supabase
          .from('artifacts')
          .select('type, title, content_markdown, status, version, updated_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }),
        supabase
          .from('decisions')
          .select('title, decision, rationale, category, status')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }),
        supabase
          .from('tasks')
          .select('title, description, phase, priority, complexity, recommended_tool, status')
          .eq('project_id', projectId)
          .order('phase', { ascending: true })
          .order('priority', { ascending: true }),
        supabase
          .from('risks')
          .select('title, description, severity, status')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }),
      ])
      // Project missing or inaccessible (RLS) — surface as not found.
      if (projRes.error || !projRes.data) {
        setLoadError(true)
        setLoading(false)
        return
      }
      setProjectName(projRes.data.name ?? '')
      setArtifacts((artRes.data ?? []) as Artifact[])
      setDecisions((decRes.data ?? []) as Decision[])
      setTasks((taskRes.data ?? []) as Task[])
      setRisks((riskRes.data ?? []) as Risk[])
      setLoading(false)
    }
    load()
  }, [projectId])

  // ── Build the full markdown export ───────────────────────────────────────

  function buildMarkdown(): string {
    const lines: string[] = []
    const date = new Date().toLocaleDateString('he-IL')

    lines.push(`# ${projectName} — Living Docs`)
    lines.push(`> ייוצא מ-Tandem · ${date}`)
    lines.push('')
    lines.push('---')
    lines.push('')

    // Artifacts
    const typeOrder = ['product_brief', 'prd', 'architecture']
    const sortedArtifacts = [...artifacts].sort(
      (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
    )
    for (const art of sortedArtifacts) {
      if (!art.content_markdown) continue
      lines.push(art.content_markdown.trim())
      lines.push('')
      lines.push('---')
      lines.push('')
    }

    // Decisions
    if (decisions.length > 0) {
      lines.push('# יומן החלטות')
      lines.push('')
      const activeDecisions = decisions.filter((d) => d.status === 'active')
      for (const d of activeDecisions) {
        lines.push(`## ${d.title}`)
        lines.push(`**קטגוריה:** ${d.category}`)
        lines.push('')
        lines.push(d.decision)
        if (d.rationale) {
          lines.push('')
          lines.push(`**נימוק:** ${d.rationale}`)
        }
        lines.push('')
      }
      lines.push('---')
      lines.push('')
    }

    // Tasks
    if (tasks.length > 0) {
      lines.push('# תוכנית משימות')
      lines.push('')
      const grouped: Record<string, Task[]> = {}
      for (const t of tasks) {
        const phase = t.phase ?? 'ללא שלב'
        if (!grouped[phase]) grouped[phase] = []
        grouped[phase].push(t)
      }
      for (const [phase, phaseTasks] of Object.entries(grouped)) {
        lines.push(`## ${phase}`)
        lines.push('')
        for (const t of phaseTasks) {
          const done = t.status === 'approved' ? '✅' : t.status === 'blocked' ? '🔴' : '⬜'
          lines.push(`- ${done} **[${t.priority}]** ${t.title}`)
          if (t.description) lines.push(`  ${t.description}`)
          if (t.recommended_tool) lines.push(`  *כלי: ${t.recommended_tool}*`)
        }
        lines.push('')
      }
      lines.push('---')
      lines.push('')
    }

    // Risks
    const openRisks = risks.filter((r) => r.status === 'open')
    if (openRisks.length > 0) {
      lines.push('# סיכונים פתוחים')
      lines.push('')
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const sorted = [...openRisks].sort(
        (a, b) =>
          (sevOrder[a.severity as keyof typeof sevOrder] ?? 9) -
          (sevOrder[b.severity as keyof typeof sevOrder] ?? 9)
      )
      for (const r of sorted) {
        lines.push(`- **[${r.severity.toUpperCase()}] ${r.title}**`)
        if (r.description) lines.push(`  ${r.description}`)
      }
      lines.push('')
    }

    return lines.join('\n')
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
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          הפרויקט לא נמצא או שאין לך גישה אליו
        </div>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/app/projects">חזרה לפרויקטים</Link>
        </Button>
      </div>
    )
  }

  const markdown = buildMarkdown()
  const approvedArtifacts = artifacts.filter((a) => a.status === 'approved').length
  const activeDecisions = decisions.filter((d) => d.status === 'active').length
  const openRisks = risks.filter((r) => r.status === 'open').length

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="mb-6">
        <Link
          href={`/app/projects/${projectId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← חזרה ל-{projectName}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Living Docs</h1>
            <p className="text-sm text-muted-foreground">
              כל תיעוד הפרויקט — מוכן לייצוא ל-Notion / GitHub
            </p>
          </div>
        </div>
        <CopyButton text={markdown} />
      </div>

      {/* Coverage stats */}
      <div className="flex flex-wrap gap-2 mb-6">
        <SectionStatus count={approvedArtifacts} label="artifacts מאושרים" />
        <SectionStatus count={activeDecisions} label="החלטות פעילות" />
        <SectionStatus count={tasks.length} label="משימות" />
        <SectionStatus count={openRisks} label="סיכונים פתוחים" />
      </div>

      {/* Sections overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Artifacts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Artifacts ({artifacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {artifacts.length === 0 ? (
              <p className="text-xs text-muted-foreground">אין artifacts עדיין</p>
            ) : (
              artifacts.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{a.title}</span>
                  <Badge
                    variant={a.status === 'approved' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {a.status === 'approved' ? 'מאושר' : 'טיוטה'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Decisions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              החלטות ({decisions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {decisions.length === 0 ? (
              <p className="text-xs text-muted-foreground">אין החלטות עדיין</p>
            ) : (
              decisions.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <span className="truncate">{d.title}</span>
                </div>
              ))
            )}
            {decisions.length > 5 && (
              <p className="text-xs text-muted-foreground">+{decisions.length - 5} נוספות</p>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              משימות ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">אין משימות עדיין</p>
            ) : (
              <div className="space-y-1">
                {(['P0', 'P1', 'P2'] as const).map((p) => {
                  const count = tasks.filter((t) => t.priority === p).length
                  const done  = tasks.filter((t) => t.priority === p && t.status === 'approved').length
                  if (count === 0) return null
                  return (
                    <div key={p} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{p}</span>
                      <span>
                        <span className="font-medium">{done}</span>
                        <span className="text-muted-foreground">/{count}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              סיכונים ({risks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {risks.length === 0 ? (
              <p className="text-xs text-muted-foreground">אין סיכונים עדיין</p>
            ) : (
              (['critical', 'high', 'medium', 'low'] as const).map((sev) => {
                const count = risks.filter((r) => r.severity === sev && r.status === 'open').length
                if (count === 0) return null
                return (
                  <div key={sev} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{sev}</span>
                    <Badge
                      className={`text-[10px] ${
                        sev === 'critical' ? 'bg-red-100 text-red-800' :
                        sev === 'high'     ? 'bg-orange-100 text-orange-800' :
                        sev === 'medium'   ? 'bg-amber-100 text-amber-800' :
                                            'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {count}
                    </Badge>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Markdown preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">תצוגה מקדימה — Markdown</CardTitle>
            <CopyButton text={markdown} />
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-200 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed" dir="ltr">
            {markdown || '(אין תוכן לייצוא עדיין — צור artifacts תחילה)'}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
