'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, AlertCircle, XCircle, SkipForward, Compass } from 'lucide-react'
import { computeBriefQuality, briefQualityLabel } from '@/lib/artifacts/brief-quality'
import type { ArtifactHealth } from '@/types'

interface Props {
  artifacts: ArtifactHealth[]
  projectId: string
  decisionCount: number
  taskCount: number
}

export function ArtifactHealthPanel({ artifacts, projectId, decisionCount, taskCount }: Props) {
  const quality = computeBriefQuality(artifacts)
  const qualityLabel = briefQualityLabel(quality)

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            איכות Mission Brief
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold">{quality}%</div>
            <Badge variant={quality >= 80 ? 'default' : quality >= 50 ? 'secondary' : 'outline'}>
              {qualityLabel}
            </Badge>
          </div>
        </div>
        <ProgressBar value={quality} />
      </CardHeader>
      <CardContent className="space-y-2">
        {artifacts.map((a) => (
          <ArtifactRow key={a.type} artifact={a} projectId={projectId} />
        ))}

        <div className="pt-2 border-t flex items-center justify-between text-sm text-muted-foreground">
          <span>{decisionCount} החלטות · {taskCount} משימות</span>
          <Button asChild size="sm">
            <Link href={`/app/projects/${projectId}/missions/new`}>
              🚀 צור Mission Brief
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function ArtifactRow({ artifact, projectId }: { artifact: ArtifactHealth; projectId: string }) {
  const [skipOpen, setSkipOpen] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSkip() {
    setSaving(true)
    await fetch('/api/artifacts/skip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, artifactType: artifact.type, skipReason }),
    })
    setSaving(false)
    setSkipOpen(false)
    router.refresh()
  }

  const statusIcon = {
    complete: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />,
    draft:    <AlertCircle  className="h-4 w-4 text-yellow-500 shrink-0" />,
    missing:  <XCircle      className="h-4 w-4 text-muted-foreground shrink-0" />,
    skipped:  <SkipForward  className="h-4 w-4 text-muted-foreground shrink-0" />,
  }[artifact.status]

  return (
    <>
      <div className="flex items-center justify-between gap-2 py-1">
        <div className="flex items-center gap-2 min-w-0">
          {statusIcon}
          <span className="text-sm truncate">{artifact.label}</span>
          {artifact.status === 'skipped' && (
            <span className="text-xs text-muted-foreground truncate">({artifact.skipReason ?? 'דולג'})</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {artifact.status !== 'missing' && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href={artifact.href}>ערוך</Link>
            </Button>
          )}
          {artifact.status === 'missing' && (
            <>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href={artifact.href}>הוסף</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setSkipOpen(true)}
              >
                דלג
              </Button>
            </>
          )}
          {artifact.status === 'skipped' && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href={artifact.href}>הוסף בכל זאת</Link>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={skipOpen} onOpenChange={setSkipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>דלג על {artifact.label}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Mission Brief יכלול הערה שהארטיפקט הזה חסר. אפשר להוסיף אותו בכל עת.
          </p>
          <Textarea
            placeholder="סיבה (אופציונלי) — למשל: לא רלוונטי לפרויקט קוד קיים"
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipOpen(false)}>ביטול</Button>
            <Button onClick={handleSkip} disabled={saving}>
              {saving ? 'שומר...' : 'דלג'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
