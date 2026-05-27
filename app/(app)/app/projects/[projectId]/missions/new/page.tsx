'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MissionBriefCard } from '@/components/missions/MissionBriefCard'
import { Loader2, Sparkles, AlertCircle } from 'lucide-react'
import type { MissionBrief } from '@/lib/ai/schemas'

export default function NewMissionPage() {
  const params = useParams<{ projectId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const projectId = params.projectId
  const taskId = searchParams.get('taskId')

  const [task, setTask] = useState<{ title: string; description: string | null; recommended_tool: string | null } | null>(null)
  const [projectName, setProjectName] = useState('')
  const [mission, setMission] = useState<MissionBrief | null>(null)
  const [markdown, setMarkdown] = useState('')
  const [missionId, setMissionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!taskId) { setLoading(false); return }

      const [taskRes, projRes] = await Promise.all([
        supabase.from('tasks').select('title, description, recommended_tool').eq('id', taskId).single(),
        supabase.from('projects').select('name').eq('id', projectId).single(),
      ])
      setTask(taskRes.data)
      setProjectName(projRes.data?.name ?? '')
      setLoading(false)
    }
    load()
  }, [projectId, taskId])

  async function handleGenerate() {
    if (!taskId) return
    setError(null)
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, taskId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'שגיאה ביצירת תדריך משימה')
      }
      const data = await res.json()
      setMission(data.mission)
      setMarkdown(data.markdown)
      setMissionId(data.missionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!taskId || !task) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>לא נמצאה משימה — חזור לרשימת המשימות</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href={`/app/projects/${projectId}/tasks`}>← לרשימת המשימות</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/app/projects/${projectId}/tasks`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← חזרה למשימות
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {mission ? (
        <Card>
          <CardContent className="pt-6">
            <MissionBriefCard
              title={mission.title}
              tool_name={mission.tool_name}
              context={mission.context}
              objective={mission.objective}
              instructions={mission.instructions}
              constraints={mission.constraints}
              deliverables={mission.deliverables}
              return_prompt={mission.return_prompt}
              acceptance_criteria={mission.acceptance_criteria}
              fullMarkdown={markdown}
            />
            <div className="mt-6 pt-4 border-t flex items-center justify-between">
              <Button variant="outline" onClick={handleGenerate} disabled={generating} size="sm">
                {generating ? <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" /> : null}
                ייצר מחדש
              </Button>
              {missionId && (
                <Button asChild size="sm">
                  <Link href={`/app/projects/${projectId}/missions/${missionId}`}>
                    פתח דף המשימה ←
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>תדריך משימה — {task.title}</CardTitle>
            <CardDescription>
              AI ייצר תדריך משימה מלא ומוכן להדבקה ב-{task.recommended_tool ?? 'כלי AI'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button onClick={handleGenerate} disabled={generating} size="lg">
              {generating ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מייצר תדריך משימה...
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 h-4 w-4" />
                  צור תדריך משימה מ-AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
