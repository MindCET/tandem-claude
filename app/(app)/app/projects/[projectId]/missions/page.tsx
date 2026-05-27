import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Compass, Wrench, ArrowRight } from 'lucide-react'

interface PageProps {
  params: Promise<{ projectId: string }>
}

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  ready:        { label: 'מוכן',      variant: 'default'    },
  sent_to_tool: { label: 'נשלח',      variant: 'secondary'  },
  returned:     { label: 'הוחזר',     variant: 'outline'    },
}

export default async function MissionsPage({ params }: PageProps) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/app/projects/${projectId}/missions`)

  const [projectRes, missionsRes] = await Promise.all([
    supabase.from('projects').select('name').eq('id', projectId).single(),
    supabase
      .from('missions')
      .select('*, tasks(title, phase, priority)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
  ])

  if (!projectRes.data) notFound()

  const project = projectRes.data
  const missions = missionsRes.data ?? []

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
          <div className="rounded-md bg-primary/10 p-2">
            <Compass className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">תדריכי משימה</h1>
            <p className="text-sm text-muted-foreground">{missions.length} משימות נוצרו</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/app/projects/${projectId}/tasks`}>← לרשימת המשימות</Link>
        </Button>
      </div>

      {missions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Compass className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              עוד לא נוצרו תדריכי משימה — לחץ על "צור תדריך משימה" מכל משימה ברשימה
            </p>
            <Button asChild>
              <Link href={`/app/projects/${projectId}/tasks`}>
                עבור לרשימת המשימות
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {missions.map((m) => {
            const task = m.tasks as { title: string; phase: string; priority: string } | null
            const statusInfo = STATUS_BADGE[m.status] ?? { label: m.status, variant: 'outline' as const }
            return (
              <Link key={m.id} href={`/app/projects/${projectId}/missions/${m.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{task?.title ?? 'Mission'}</p>
                        {task?.phase && (
                          <p className="text-xs text-muted-foreground mt-0.5">{task.phase}</p>
                        )}
                        {m.tool_name && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                            <Wrench className="h-3 w-3" />
                            {m.tool_name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
