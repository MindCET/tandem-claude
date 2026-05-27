import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, artifactType, skipReason } = await request.json()
  if (!projectId || !artifactType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Upsert a skipped artifact placeholder
  const { error } = await supabase.from('artifacts').upsert(
    {
      project_id: projectId,
      type: artifactType,
      title: artifactType,
      content_markdown: null,
      status: 'draft',
      source: 'user_created',
      skip_reason: skipReason || 'דולג על ידי המשתמש',
      completeness_score: 0,
    },
    { onConflict: 'project_id,type' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
