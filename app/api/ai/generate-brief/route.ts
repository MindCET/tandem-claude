import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateProductBrief, briefToMarkdown } from '@/lib/ai/service'
import { upsertArtifact } from '@/lib/ai/artifacts'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { projectId, idea, questions, answers } = body

  if (!projectId || !idea || !questions) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!Array.isArray(questions) || questions.length > 100) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Verify user owns the project (RLS enforces this, but belt-and-suspenders)
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  try {
    const brief = await generateProductBrief(idea, questions, answers ?? {})
    const markdown = briefToMarkdown(brief)

    const artifact = await upsertArtifact(supabase, {
      projectId,
      type: 'product_brief',
      title: brief.product_name,
      contentJson: brief,
      markdown,
    })

    if (!artifact) {
      return NextResponse.json({ error: 'Failed to save brief' }, { status: 500 })
    }

    // Advance project stage
    await supabase
      .from('projects')
      .update({ current_stage: 'product_brief_draft', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({ brief, artifactId: artifact.id, markdown })
  } catch (err) {
    console.error('[generate-brief] error:', err)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
