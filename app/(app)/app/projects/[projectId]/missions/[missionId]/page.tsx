import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { escapeHtml } from '@/lib/utils'

interface PageProps {
  params: Promise<{ projectId: string; missionId: string }>
}

export default async function MissionDetailPage({ params }: PageProps) {
  const { projectId, missionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/app/projects/${projectId}/missions/${missionId}`)

  const [missionRes, projRes] = await Promise.all([
    supabase
      .from('missions')
      .select('*, tasks(title, phase)')
      .eq('id', missionId)
      .eq('project_id', projectId)
      .single(),
    supabase.from('projects').select('name').eq('id', projectId).single(),
  ])

  if (missionRes.error || !missionRes.data) notFound()

  const mission = missionRes.data
  const task = mission.tasks as { title: string; phase: string } | null
  const projectName = projRes.data?.name ?? ''

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/app/projects/${projectId}/missions`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← חזרה למשימות של {projectName}
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Display as formatted markdown */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl font-bold">{task?.title ?? 'תדריך משימה'}</h1>
                {task?.phase && (
                  <p className="text-sm text-muted-foreground mt-1">{task.phase}</p>
                )}
                {mission.tool_name && (
                  <p className="text-xs text-muted-foreground mt-1">כלי: {mission.tool_name}</p>
                )}
              </div>
            </div>

            {/* Mission brief as pre-formatted text with copy button */}
            <MissionMarkdownDisplay
              markdown={mission.mission_brief ?? ''}
              returnPrompt={mission.return_prompt ?? ''}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Server-side markdown display — no structured data needed
function MissionMarkdownDisplay({
  markdown,
  returnPrompt,
}: {
  markdown: string
  returnPrompt: string
}) {
  return (
    <div className="space-y-4">
      <div
        className="mission-content"
        dangerouslySetInnerHTML={{ __html: renderMissionMarkdown(markdown) }}
      />
      {returnPrompt && (
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Return Prompt — הדבק אחרי המשימה
          </p>
          <pre className="bg-code-bg text-code-text p-4 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-x-auto" dir="ltr">
            {returnPrompt}
          </pre>
        </div>
      )}
      <style>{`
        .mission-content h1 { font-size: 1.3rem; font-weight: 700; margin: 1.4rem 0 0.5rem; color: #0f172a; }
        .mission-content h2 { font-size: 1.1rem; font-weight: 600; margin: 1.2rem 0 0.4rem; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .mission-content h3 { font-size: 0.95rem; font-weight: 600; margin: 0.9rem 0 0.3rem; color: #334155; }
        .mission-content p { font-size: 0.875rem; color: #475569; line-height: 1.7; margin: 0.3rem 0; }
        .mission-content ul, .mission-content ol { padding-right: 1.2rem; margin: 0.4rem 0; }
        .mission-content li { font-size: 0.875rem; color: #475569; line-height: 1.6; margin-bottom: 0.2rem; }
        .mission-content ul { list-style-type: disc; }
        .mission-content ol { list-style-type: decimal; }
        .mission-content strong { color: #1e293b; font-weight: 600; }
        .mission-content pre { background: #0f172a; color: #e2e8f0; padding: 12px 16px; border-radius: 8px; font-family: 'SF Mono','Fira Code',monospace; font-size: 12px; line-height: 1.6; overflow-x: auto; direction: ltr; text-align: left; margin: 0.75rem 0; white-space: pre; }
        .mission-content code { background: #f1f5f9; color: #334155; padding: 1px 5px; border-radius: 4px; font-size: 12px; font-family: 'SF Mono',monospace; }
        .mission-content hr { border: none; border-top: 1px solid #e2e8f0; margin: 1rem 0; }
      `}</style>
    </div>
  )
}

function renderMissionMarkdown(md: string): string {
  return escapeHtml(md)
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
    .replace(/<p>\s*<\/p>/g, '')
}
