'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { TaskCard } from '@/components/tasks/TaskCard'
import {
  Loader2, Sparkles, ListChecks, AlertCircle, CheckCircle2, RefreshCw,
} from 'lucide-react'
import type { Task } from '@/types'

export default function TasksPage() {
  const params = useParams<{ projectId: string }>()
  const supabase = createClient()
  const projectId = params.projectId

  const [tasks, setTasks] = useState<Task[]>([])
  const [projectName, setProjectName] = useState('')
  const [hasArchitecture, setHasArchitecture] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedCount, setGeneratedCount] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      const [tasksRes, projRes, archRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('phase', { ascending: true })
          .order('priority', { ascending: true }),
        supabase.from('projects').select('name').eq('id', projectId).single(),
        supabase
          .from('artifacts')
          .select('id')
          .eq('project_id', projectId)
          .eq('type', 'architecture')
          .eq('status', 'approved')
          .maybeSingle(),
      ])
      // The project query fails (or returns nothing) when the project does not
      // exist or the user has no access to it under RLS — treat as not found
      // instead of silently rendering an empty task list.
      if (projRes.error || !projRes.data) {
        setLoadError(true)
        setLoading(false)
        return
      }
      setTasks(tasksRes.data ?? [])
      setProjectName(projRes.data.name ?? '')
      setHasArchitecture(!!archRes.data)
      setLoading(false)
    }
    load()
  }, [projectId])

  async function handleGenerate() {
    setError(null)
    setGenerating(true)
    setGeneratedCount(null)
    try {
      const res = await fetch('/api/ai/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'שגיאה ביצירת משימות')
      }
      const { tasksCount } = await res.json()

      // Reload tasks from DB to get proper IDs
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('phase', { ascending: true })
        .order('priority', { ascending: true })
      setTasks(data ?? [])
      setGeneratedCount(tasksCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה')
    } finally {
      setGenerating(false)
    }
  }

  // Group tasks by phase
  const grouped: Record<string, Task[]> = {}
  for (const task of tasks) {
    const phase = task.phase ?? 'ללא שלב'
    if (!grouped[phase]) grouped[phase] = []
    grouped[phase].push(task)
  }
  const phases = Object.keys(grouped)

  // Priority order for sorting within phase
  const priorityOrder = { P0: 0, P1: 1, P2: 2 }
  for (const phase of phases) {
    grouped[phase].sort(
      (a, b) =>
        (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 9) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 9)
    )
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">תוכנית משימות</h1>
            <p className="text-sm text-muted-foreground">
              {tasks.length > 0 ? `${tasks.length} משימות ב-${phases.length} שלבים` : 'עוד לא נוצרו משימות'}
            </p>
          </div>
        </div>
        {tasks.length > 0 && (
          <Button variant="outline" onClick={handleGenerate} disabled={generating} size="sm">
            {generating ? (
              <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="ml-2 h-3.5 w-3.5" />
            )}
            ייצר מחדש
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {generatedCount !== null && (
        <Alert className="mb-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{generatedCount} משימות נוצרו ונשמרו</AlertDescription>
        </Alert>
      )}

      {tasks.length === 0 ? (
        /* Empty state */
        <Card>
          <CardHeader className="text-center">
            <CardTitle>תוכנית משימות — Task Plan</CardTitle>
            <CardDescription>
              AI יפרק את ה-Architecture לרשימת משימות מסודרת לפי שלבים, עדיפות, ומורכבות
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            {!hasArchitecture ? (
              <div className="space-y-3">
                <Alert variant="destructive" className="text-right">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>יש לאשר Architecture לפני יצירת משימות</AlertDescription>
                </Alert>
                <Button asChild variant="outline">
                  <Link href={`/app/projects/${projectId}/architecture`}>עבור לארכיטקטורה</Link>
                </Button>
              </div>
            ) : (
              <Button onClick={handleGenerate} disabled={generating} size="lg">
                {generating ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    מייצר משימות...
                  </>
                ) : (
                  <>
                    <Sparkles className="ml-2 h-4 w-4" />
                    צור תוכנית משימות מ-AI
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Tasks grouped by phase */
        <div className="space-y-8">
          {phases.map((phase) => (
            <div key={phase}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-semibold">{phase}</h2>
                <Badge variant="secondary" className="text-xs">
                  {grouped[phase].length} משימות
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {grouped[phase].map((task) => (
                  <TaskCard
                    key={task.id}
                    id={task.id}
                    projectId={projectId}
                    title={task.title}
                    description={task.description}
                    phase={task.phase}
                    priority={task.priority}
                    complexity={task.complexity}
                    status={task.status}
                    recommended_tool={task.recommended_tool}
                    acceptance_criteria={
                      Array.isArray(task.acceptance_criteria)
                        ? (task.acceptance_criteria as string[])
                        : []
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
