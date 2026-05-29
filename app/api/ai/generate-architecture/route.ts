import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateArchitecture, architectureToMarkdown } from '@/lib/ai/service'
import { upsertArtifact } from '@/lib/ai/artifacts'
import type { ProductBrief, PRD } from '@/lib/ai/schemas'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, preferences } = await req.json()
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // Fetch approved brief + PRD in parallel
  const [briefRes, prdRes] = await Promise.all([
    supabase
      .from('artifacts')
      .select('content_json')
      .eq('project_id', projectId)
      .eq('type', 'product_brief')
      .eq('status', 'approved')
      .maybeSingle(),
    supabase
      .from('artifacts')
      .select('content_json')
      .eq('project_id', projectId)
      .eq('type', 'prd')
      .in('status', ['draft', 'approved'])
      .maybeSingle(),
  ])

  if (!briefRes.data || !prdRes.data) {
    return NextResponse.json(
      { error: 'נדרש Product Brief מאושר + PRD כדי ליצור ארכיטקטורה' },
      { status: 400 }
    )
  }

  const brief = briefRes.data.content_json as ProductBrief
  const prd = prdRes.data.content_json as PRD

  try {
    const architecture = await generateArchitecture(prd, brief, preferences)
    const markdown = architectureToMarkdown(architecture)

    const artifact = await upsertArtifact(supabase, {
      projectId,
      type: 'architecture',
      title: `Architecture — ${brief.product_name}`,
      contentJson: architecture,
      markdown,
    })

    if (!artifact) {
      return NextResponse.json({ error: 'Failed to save architecture' }, { status: 500 })
    }

    // Auto-save decisions to decisions table
    if (architecture.decisions.length > 0) {
      const decisionRows = architecture.decisions.map((d) => ({
        project_id: projectId,
        title: d.title,
        decision: d.decision,
        rationale: d.rationale,
        category: d.category,
        status: 'active',
        source_artifact_id: artifact.id,
      }))

      const { error: decisionsError } = await supabase
        .from('decisions')
        .insert(decisionRows)

      if (decisionsError) {
        console.error('[generate-architecture] decisions save error:', decisionsError)
        // Non-fatal — architecture is saved, decisions just didn't persist
      }
    }

    // Auto-save risks to risks table
    if (architecture.risks.length > 0) {
      const riskRows = architecture.risks.map((r) => ({
        project_id: projectId,
        title: r.title,
        description: r.description,
        severity: r.severity,
        category: 'technical',
        source: 'architecture',
        status: 'open',
      }))

      const { error: risksError } = await supabase.from('risks').insert(riskRows)
      if (risksError) {
        console.error('[generate-architecture] risks save error:', risksError)
      }
    }

    // Advance project stage
    await supabase
      .from('projects')
      .update({ current_stage: 'architecture_draft', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({
      architecture,
      artifactId: artifact.id,
      markdown,
      decisionsCount: architecture.decisions.length,
      risksCount: architecture.risks.length,
    })
  } catch (err) {
    console.error('[generate-architecture] error:', err)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
