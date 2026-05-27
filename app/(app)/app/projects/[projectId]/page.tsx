import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Layers,
  ListChecks,
  Compass,
  GitBranch,
  AlertTriangle,
  ArrowRight,
  Clock,
  RotateCcw,
  BookOpen,
} from 'lucide-react'
import { STAGE_LABELS_HE, type ProjectStage, type ArtifactHealth } from '@/types'
import { ArtifactHealthPanel } from '@/components/artifacts/ArtifactHealthPanel'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/app/projects/${projectId}`)

  const [projectRes, artifactsRes, decisionCount, taskCount, riskCount] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('artifacts').select('id,type,status,skip_reason').eq('project_id', projectId),
    supabase.from('decisions').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'active'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
    supabase.from('risks').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'open'),
  ])

  if (projectRes.error || !projectRes.data) {
    notFound()
  }

  const project = projectRes.data
  const dbArtifacts = artifactsRes.data ?? []
  const stageLabel = STAGE_LABELS_HE[project.current_stage as ProjectStage] ?? project.current_stage

  // Build artifact health list
  const artifactHealthList: ArtifactHealth[] = [
    {
      type: 'product_brief',
      label: 'תדריך מוצר',
      href: `/app/projects/${projectId}/brief`,
      ...resolveArtifactHealth(dbArtifacts, 'product_brief'),
    },
    {
      type: 'prd',
      label: 'PRD — מסמך דרישות',
      href: `/app/projects/${projectId}/prd`,
      ...resolveArtifactHealth(dbArtifacts, 'prd'),
    },
    {
      type: 'architecture',
      label: 'ארכיטקטורה',
      href: `/app/projects/${projectId}/architecture`,
      ...resolveArtifactHealth(dbArtifacts, 'architecture'),
    },
  ]

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/app/projects"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← חזרה לפרויקטים
        </Link>
      </div>

      {/* Project header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {stageLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            נוצר: {new Date(project.created_at).toLocaleDateString('he-IL')}
          </span>
        </div>
      </div>

      {/* Artifact health + brief quality */}
      <ArtifactHealthPanel
        artifacts={artifactHealthList}
        projectId={projectId}
        decisionCount={decisionCount.count ?? 0}
        taskCount={taskCount.count ?? 0}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={FileText}
          label="ארטיפקטים"
          value={dbArtifacts.length}
          href={`/app/projects/${projectId}/brief`}
        />
        <StatCard
          icon={GitBranch}
          label="החלטות"
          value={decisionCount.count ?? 0}
          href={`/app/projects/${projectId}/decisions`}
        />
        <StatCard
          icon={ListChecks}
          label="משימות"
          value={taskCount.count ?? 0}
          href={`/app/projects/${projectId}/tasks`}
        />
        <StatCard
          icon={AlertTriangle}
          label="סיכונים פתוחים"
          value={riskCount.count ?? 0}
          href={`/app/projects/${projectId}/risks`}
          highlight={(riskCount.count ?? 0) > 0}
        />
      </div>

      {/* Section grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionLink
          icon={FileText}
          title="תדריך מוצר"
          description="תדריך מוצר — הרעיון, קהל יעד, היקף MVP"
          href={`/app/projects/${projectId}/brief`}
        />
        <SectionLink
          icon={Layers}
          title="PRD + ארכיטקטורה"
          description="מסמך מוצר מלא + תכנון ארכיטקטוני"
          href={`/app/projects/${projectId}/prd`}
        />
        <SectionLink
          icon={ListChecks}
          title="משימות"
          description="רשימת משימות בנייה, מסודרת לפי שלבים"
          href={`/app/projects/${projectId}/tasks`}
        />
        <SectionLink
          icon={Compass}
          title="תדריכי משימה"
          description="תדריכי משימה מוכנים להעתקה לכלים חיצוניים"
          href={`/app/projects/${projectId}/missions`}
        />
        <SectionLink
          icon={RotateCcw}
          title="תדריך חזרה"
          description="הדבק סיכום מכלי AI — ניתוח אוטומטי של התקדמות"
          href={`/app/projects/${projectId}/return`}
        />
        <SectionLink
          icon={GitBranch}
          title="החלטות"
          description="יומן החלטות ארכיטקטוניות ומוצריות"
          href={`/app/projects/${projectId}/decisions`}
        />
        <SectionLink
          icon={AlertTriangle}
          title="סיכונים"
          description="רגיסטר סיכונים — פתוחים וסגורים"
          href={`/app/projects/${projectId}/risks`}
        />
        <SectionLink
          icon={BookOpen}
          title="תיעוד חי"
          description="ייצוא Markdown — כל התיעוד בקליק"
          href={`/app/projects/${projectId}/docs`}
        />
      </div>
    </div>
  )
}

function resolveArtifactHealth(
  artifacts: Array<{ id: string; type: string; status: string; skip_reason?: string | null }>,
  type: string
): { status: ArtifactHealth['status']; artifactId?: string; skipReason?: string | null } {
  const found = artifacts.find((a) => a.type === type)
  if (!found) return { status: 'missing' }
  if (found.skip_reason) return { status: 'skipped', artifactId: found.id, skipReason: found.skip_reason }
  if (found.status === 'approved') return { status: 'complete', artifactId: found.id }
  return { status: 'draft', artifactId: found.id }
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  href: string
  highlight?: boolean
}) {
  return (
    <Link href={href}>
      <Card className={`cursor-pointer hover:border-primary/50 transition-colors ${highlight ? 'border-destructive/40 bg-destructive/5' : ''}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`h-4 w-4 ${highlight ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </Link>
  )
}

function SectionLink({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full cursor-pointer hover:border-primary/50 transition-colors">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2 shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base flex items-center justify-between">
                {title}
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
