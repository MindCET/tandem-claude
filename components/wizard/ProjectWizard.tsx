'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { EntryPointStep, type EntryPoint } from './EntryPointStep'
import { IdeaStep, type IdeaData } from './IdeaStep'
import { ClarifyStep } from './ClarifyStep'
import { BriefPreviewStep } from './BriefPreviewStep'
import { ImportArtifactDialog } from '@/components/artifacts/ImportArtifactDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import type { ClarificationQuestions, ProductBrief } from '@/lib/ai/schemas'

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={[
            'h-2 rounded-full transition-all duration-300',
            i + 1 === current ? 'w-6 bg-primary' : i + 1 < current ? 'w-2 bg-primary/40' : 'w-2 bg-muted',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

// ─── Fast-entry: project name + immediate redirect ──────────────────────────

function QuickNameStep({
  onNext,
  loading,
}: {
  onNext: (name: string) => void
  loading: boolean
}) {
  const [name, setName] = useState('')
  return (
    <div className="space-y-4 py-2">
      <div>
        <Label htmlFor="proj-name">שם הפרויקט</Label>
        <Input
          id="proj-name"
          className="mt-1"
          placeholder="לדוגמה: Tandem, QuizMe, BuildPilot..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onNext(name.trim()) }}
          autoFocus
        />
      </div>
      <Button
        className="w-full"
        disabled={!name.trim() || loading}
        onClick={() => onNext(name.trim())}
      >
        {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
        המשך
      </Button>
    </div>
  )
}

// ─── Step metadata per entry-point flow ─────────────────────────────────────

type Flow = 'entry' | 'idea' | 'has_prd' | 'has_code' | 'mid_build'

const STEP_TITLES: Record<string, { title: string; description: string }> = {
  entry:    { title: 'פרויקט חדש', description: 'איפה אתה עכשיו?' },
  idea:     { title: 'הרעיון שלך', description: 'ספר לנו על הרעיון' },
  clarify:  { title: 'שאלות בירור', description: 'AI מבקש פרטים נוספים' },
  brief:    { title: 'Product Brief', description: 'תצוגה מקדימה לפני אישור' },
  name_prd: { title: 'ייבוא PRD', description: 'תן שם לפרויקט ויבא את מסמך הדרישות' },
  name_code:{ title: 'פרויקט קיים', description: 'תן שם לפרויקט כדי שנוכל ליצור אותו' },
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────

export function ProjectWizard() {
  const router = useRouter()
  const supabase = createClient()

  const [flow, setFlow] = useState<Flow>('entry')
  const [substep, setSubstep] = useState<string>('entry')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ideaData, setIdeaData] = useState<IdeaData | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [clarification, setClarification] = useState<ClarificationQuestions | null>(null)
  const [brief, setBrief] = useState<ProductBrief | null>(null)

  // ── Entry point selection ──────────────────────────────────────────────────
  function handleEntrySelect(entry: EntryPoint) {
    setError(null)
    if (entry === 'idea') {
      setFlow('idea')
      setSubstep('idea')
    } else if (entry === 'has_prd') {
      setFlow('has_prd')
      setSubstep('name_prd')
    } else {
      // has_code or mid_build — just create project with skipped artifacts
      setFlow(entry)
      setSubstep('name_code')
    }
  }

  // ── Create a project quickly (for non-idea flows) ─────────────────────────
  async function handleQuickCreate(name: string) {
    setError(null)
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('משתמש לא מחובר')

      const { data: project, error: projErr } = await supabase
        .from('projects')
        .insert({ user_id: user.id, name, current_stage: 'mission_ready', status: 'active' })
        .select('id')
        .single()
      if (projErr || !project) throw new Error(projErr?.message ?? 'שגיאה')
      const pid = project.id
      setProjectId(pid)

      if (flow === 'has_prd') {
        // Mark product_brief + architecture as skipped, PRD will be imported next
        await Promise.all([
          supabase.from('artifacts').insert({
            project_id: pid, type: 'product_brief', title: 'product_brief',
            status: 'draft', source: 'user_created',
            skip_reason: 'PRD מיובא ישירות', completeness_score: 0,
          }),
          supabase.from('artifacts').insert({
            project_id: pid, type: 'architecture', title: 'architecture',
            status: 'draft', source: 'user_created',
            skip_reason: 'לא הוגדר בשלב הייבוא', completeness_score: 0,
          }),
        ])
        setSubstep('import_prd')
      } else {
        // has_code / mid_build — skip all planning artifacts
        await Promise.all(
          ['product_brief', 'prd', 'architecture'].map((type) =>
            supabase.from('artifacts').insert({
              project_id: pid, type, title: type,
              status: 'draft', source: 'user_created',
              skip_reason: 'פרויקט קיים — ארטיפקטים ניתנים להוספה בכל עת',
              completeness_score: 0,
            })
          )
        )
        router.push(`/app/projects/${pid}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
    } finally {
      setLoading(false)
    }
  }

  // ── Idea flow: Step 1 ──────────────────────────────────────────────────────
  async function handleIdeaNext(data: IdeaData) {
    setError(null)
    setLoading(true)
    setIdeaData(data)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('משתמש לא מחובר')

      let pid = projectId
      if (pid) {
        await supabase.from('projects').update({ name: data.name.trim(), description: data.description.trim() || null, updated_at: new Date().toISOString() }).eq('id', pid)
      } else {
        const { data: project, error: projectError } = await supabase.from('projects').insert({ user_id: user.id, name: data.name.trim(), description: data.description.trim() || null, current_stage: 'idea_capture', status: 'active' }).select('id').single()
        if (projectError || !project) throw new Error(projectError?.message ?? 'שגיאה')
        pid = project.id
        setProjectId(pid)
      }

      const res = await fetch('/api/ai/generate-clarification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'שגיאה')
      setClarification(await res.json())
      setSubstep('clarify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה')
    } finally {
      setLoading(false)
    }
  }

  // ── Idea flow: Step 2 ──────────────────────────────────────────────────────
  async function handleClarifyNext(answers: Record<string, string>) {
    if (!projectId || !ideaData || !clarification) { setError('חסר מידע — נסה מחדש'); return }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-brief', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, idea: ideaData, questions: clarification.questions, answers }) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'שגיאה')
      const { brief: b } = await res.json()
      setBrief(b)
      setSubstep('brief')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה')
    } finally {
      setLoading(false)
    }
  }

  // ── Idea flow: Step 3 ──────────────────────────────────────────────────────
  async function handleApprove() {
    if (!projectId) { setError('לא נמצא מזהה פרויקט'); return }
    setError(null)
    setLoading(true)
    try {
      await Promise.all([
        supabase.from('artifacts').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('project_id', projectId).eq('type', 'product_brief'),
        supabase.from('projects').update({ current_stage: 'product_brief_approved', updated_at: new Date().toISOString() }).eq('id', projectId),
      ])
      router.push(`/app/projects/${projectId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
      setLoading(false)
    }
  }

  // ── PRD imported ───────────────────────────────────────────────────────────
  function handlePRDImported() {
    if (projectId) router.push(`/app/projects/${projectId}`)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const meta = STEP_TITLES[substep] ?? STEP_TITLES.entry
  const isIdeaFlow = flow === 'idea'
  const ideaStep = substep === 'idea' ? 1 : substep === 'clarify' ? 2 : 3

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        {isIdeaFlow && substep !== 'idea' && <StepDots current={ideaStep} total={3} />}
        <CardTitle>{meta.title}</CardTitle>
        <CardDescription>{meta.description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {substep === 'entry' && <EntryPointStep onSelect={handleEntrySelect} />}

        {substep === 'idea' && (
          <IdeaStep defaultValues={ideaData ?? undefined} onNext={handleIdeaNext} loading={loading} />
        )}

        {substep === 'clarify' && clarification && (
          <ClarifyStep clarification={clarification} onNext={handleClarifyNext} onBack={() => setSubstep('idea')} loading={loading} />
        )}

        {substep === 'brief' && brief && (
          <BriefPreviewStep brief={brief} onApprove={handleApprove} onBack={() => setSubstep('clarify')} loading={loading} />
        )}

        {(substep === 'name_prd' || substep === 'name_code') && (
          <QuickNameStep onNext={handleQuickCreate} loading={loading} />
        )}

        {substep === 'import_prd' && projectId && (
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">הפרויקט נוצר. עכשיו ייבא את ה-PRD שלך:</p>
            <ImportArtifactDialog
              projectId={projectId}
              artifactType="prd"
              onImported={handlePRDImported}
              variant="default"
            />
            <Button variant="ghost" className="w-full" onClick={() => router.push(`/app/projects/${projectId}`)}>
              דלג — אוסיף PRD מאוחר יותר
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
