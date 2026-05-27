'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EditableArtifact } from '@/components/artifacts/EditableArtifact'
import { ImportArtifactDialog } from '@/components/artifacts/ImportArtifactDialog'
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'

export default function PRDPage() {
  const params = useParams<{ projectId: string }>()
  const supabase = createClient()
  const projectId = params.projectId

  const [artifact, setArtifact] = useState<Record<string, unknown> | null>(null)
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [artRes, projRes] = await Promise.all([
        supabase.from('artifacts').select('*').eq('project_id', projectId).eq('type', 'prd').maybeSingle(),
        supabase.from('projects').select('name').eq('id', projectId).single(),
      ])
      setArtifact(artRes.data)
      setProjectName(projRes.data?.name ?? '')
      setLoading(false)
    }
    load()
  }, [projectId])

  async function handleGenerate() {
    setError(null)
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'שגיאה בייצור PRD')
      }
      const { prd, artifactId, markdown } = await res.json()
      setArtifact({
        id: artifactId,
        title: `PRD — ${projectName}`,
        type: 'prd',
        status: 'draft',
        content_markdown: markdown,
        content_json: prd,
        version: 1,
        updated_at: new Date().toISOString(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה')
    } finally {
      setGenerating(false)
    }
  }

  async function handleApprove() {
    if (!artifact) return
    setApproving(true)
    setError(null)
    try {
      const { error: artErr } = await supabase
        .from('artifacts')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', artifact.id as string)
      if (artErr) throw new Error(artErr.message)
      setArtifact({ ...artifact, status: 'approved' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה באישור ה-PRD')
    } finally {
      setApproving(false)
    }
  }

  function handleImported(markdown: string, artifactId: string) {
    setArtifact({
      id: artifactId,
      title: `PRD — ${projectName}`,
      type: 'prd',
      status: 'approved',
      source: 'imported',
      content_markdown: markdown,
      version: 1,
      updated_at: new Date().toISOString(),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {artifact ? (
        <Card>
          <CardContent className="pt-6">
            <EditableArtifact
              artifactId={artifact.id as string}
              title={artifact.title as string}
              type="prd"
              status={artifact.status as string}
              markdown={(artifact.content_markdown as string) ?? ''}
              version={(artifact.version as number) ?? 1}
              updatedAt={(artifact.updated_at as string) ?? ''}
            />

            <div className="mt-6 pt-4 border-t flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                  ייצר מחדש
                </Button>
                <ImportArtifactDialog
                  projectId={projectId}
                  artifactType="prd"
                  onImported={handleImported}
                />
              </div>
              {artifact.status !== 'approved' ? (
                <Button onClick={handleApprove} disabled={approving}>
                  {approving
                    ? <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    : <CheckCircle2 className="ml-2 h-4 w-4" />}
                  אשר PRD
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  מאושר — ניתן לעריכה בכל עת
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>PRD — מסמך דרישות מוצר</CardTitle>
            <CardDescription>ייצר PRD מ-AI, ייבא מסמך קיים, או כתוב ידנית</CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8 flex flex-col items-center gap-3">
            <Button onClick={handleGenerate} disabled={generating} size="lg">
              {generating ? (
                <><Loader2 className="ml-2 h-4 w-4 animate-spin" />מייצר PRD...</>
              ) : (
                <><Sparkles className="ml-2 h-4 w-4" />צור PRD מ-AI</>
              )}
            </Button>
            <ImportArtifactDialog
              projectId={projectId}
              artifactType="prd"
              onImported={handleImported}
              variant="outline"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
