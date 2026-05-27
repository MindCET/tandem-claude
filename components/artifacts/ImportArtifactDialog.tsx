'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AnalysisResult {
  type: string
  completeness_score: number
  gaps: string[]
  suggested_improvements: string[]
}

interface Props {
  projectId: string
  artifactType: string
  onImported: (markdown: string, artifactId: string) => void
  variant?: 'default' | 'outline' | 'ghost'
}

export function ImportArtifactDialog({ projectId, artifactType, onImported, variant = 'ghost' }: Props) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleAnalyze() {
    if (!content.trim()) return
    setAnalyzing(true)
    setError(null)
    setAnalysis(null)
    try {
      const res = await fetch('/api/ai/artifacts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, projectId }),
      })
      if (!res.ok) throw new Error('שגיאה בניתוח המסמך')
      const data = await res.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleImport() {
    if (!content.trim()) return
    setImporting(true)
    setError(null)
    try {
      const now = new Date().toISOString()
      const score = analysis?.completeness_score ?? 70

      const { data, error: dbErr } = await supabase
        .from('artifacts')
        .upsert(
          {
            project_id: projectId,
            type: artifactType,
            title: artifactType,
            content_markdown: content,
            status: 'approved',
            source: 'imported',
            skip_reason: null,
            completeness_score: score,
            version: 1,
            updated_at: now,
          },
          { onConflict: 'project_id,type' }
        )
        .select('id')
        .single()

      if (dbErr || !data) throw new Error(dbErr?.message ?? 'שגיאה בשמירה')

      onImported(content, data.id)
      setOpen(false)
      setContent('')
      setAnalysis(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
    } finally {
      setImporting(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setContent('')
    setAnalysis(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className="gap-1">
          <Upload className="h-3.5 w-3.5" />
          ייבא מסמך קיים
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ייבוא מסמך קיים</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Textarea
          placeholder="הדבק את תוכן המסמך כאן — Markdown, טקסט חופשי, או כל פורמט אחר..."
          value={content}
          onChange={(e) => { setContent(e.target.value); setAnalysis(null) }}
          rows={12}
          className="font-mono text-sm"
          dir="ltr"
        />

        {analysis && (
          <div className="rounded-md border p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium">ניתוח המסמך</span>
              <span className="text-muted-foreground">· שלמות: {analysis.completeness_score}%</span>
            </div>
            {analysis.gaps.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1">פערים שזוהו:</p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {analysis.gaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={handleClose}>ביטול</Button>
          {!analysis ? (
            <Button variant="outline" onClick={handleAnalyze} disabled={analyzing || !content.trim()}>
              {analyzing ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />מנתח...</> : 'נתח קודם'}
            </Button>
          ) : null}
          <Button onClick={handleImport} disabled={importing || !content.trim()}>
            {importing ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />מייבא...</> : 'ייבא כמו שהוא'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
