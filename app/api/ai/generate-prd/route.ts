import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePRD, prdToMarkdown } from '@/lib/ai/service'
import { upsertArtifact } from '@/lib/ai/artifacts'
import type { ProductBrief } from '@/lib/ai/schemas'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await req.json()
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // Verify project ownership (RLS) + fetch brief
  const { data: briefArtifact, error: briefError } = await supabase
    .from('artifacts')
    .select('content_json')
    .eq('project_id', projectId)
    .eq('type', 'product_brief')
    .eq('status', 'approved')
    .maybeSingle()

  if (briefError || !briefArtifact) {
    return NextResponse.json(
      { error: 'לא נמצא Product Brief מאושר — יש לאשר Brief קודם' },
      { status: 400 }
    )
  }

  const brief = briefArtifact.content_json as ProductBrief

  try {
    const prd = await generatePRD(brief)
    const markdown = prdToMarkdown(prd)

    const artifact = await upsertArtifact(supabase, {
      projectId,
      type: 'prd',
      title: `PRD — ${brief.product_name}`,
      contentJson: prd,
      markdown,
    })

    if (!artifact) {
      return NextResponse.json({ error: 'Failed to save PRD' }, { status: 500 })
    }

    // Advance project stage
    await supabase
      .from('projects')
      .update({ current_stage: 'prd_draft', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({ prd, artifactId: artifact.id, markdown })
  } catch (err) {
    console.error('[generate-prd] error:', err)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
