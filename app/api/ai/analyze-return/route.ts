import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeReturnBrief } from '@/lib/ai/service'

export async function POST(req: NextRequest) {
  try {
    const { projectId, rawSummary, missionId } = await req.json()
    if (!projectId || !rawSummary?.trim()) {
      return NextResponse.json({ error: 'projectId ו-rawSummary נדרשים' }, { status: 400 })
    }
    if (typeof rawSummary !== 'string' || rawSummary.length > 50_000) {
      return NextResponse.json(
        { error: 'rawSummary ארוך מדי (מקסימום 50,000 תווים)' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })

    // Fetch project context in parallel
    const [projRes, tasksRes, decisionsRes] = await Promise.all([
      supabase.from('projects').select('name, current_stage').eq('id', projectId).single(),
      supabase.from('tasks').select('id, title, status').eq('project_id', projectId),
      supabase
        .from('decisions')
        .select('title')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (!projRes.data) {
      return NextResponse.json({ error: 'פרויקט לא נמצא' }, { status: 404 })
    }

    const projectContext = {
      productName: projRes.data.name,
      currentStage: projRes.data.current_stage,
      taskTitles: (tasksRes.data ?? []).map((t) => t.title),
      recentDecisions: (decisionsRes.data ?? []).map((d) => d.title),
    }

    // Run AI analysis
    const analysis = await analyzeReturnBrief(rawSummary, projectContext)

    // ── Persist results (non-fatal errors) ──────────────────────────────

    // 1. Save new decisions
    let decisionsCount = 0
    if (analysis.new_decisions.length > 0) {
      const { error } = await supabase.from('decisions').insert(
        analysis.new_decisions.map((d) => ({
          project_id: projectId,
          title: d.title,
          decision: d.decision,
          rationale: d.rationale,
          category: d.category,
          status: 'active',
          source_artifact_id: null,
        }))
      )
      if (!error) decisionsCount = analysis.new_decisions.length
      else console.error('Decisions insert error:', error)
    }

    // 2. Save new risks
    let risksCount = 0
    if (analysis.new_risks.length > 0) {
      const { error } = await supabase.from('risks').insert(
        analysis.new_risks.map((r) => ({
          project_id: projectId,
          title: r.title,
          description: r.description,
          severity: r.severity,
          category: 'technical',
          source: 'return_brief',
          status: 'open',
        }))
      )
      if (!error) risksCount = analysis.new_risks.length
      else console.error('Risks insert error:', error)
    }

    // 3. Update task statuses by matching titles
    const tasks = tasksRes.data ?? []
    const statusMap: Record<string, string> = {
      completed: 'approved',
      partial: 'needs_review',
      blocked: 'blocked',
    }
    for (const update of analysis.task_updates) {
      const matched = tasks.find(
        (t) => t.title.toLowerCase().trim() === update.task_title.toLowerCase().trim()
      )
      if (matched) {
        const newStatus = statusMap[update.new_status] ?? 'needs_review'
        await supabase
          .from('tasks')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', matched.id)
      }
    }

    // 4. Save open questions
    if (analysis.open_questions.length > 0) {
      await supabase.from('open_questions').insert(
        analysis.open_questions.map((q) => ({
          project_id: projectId,
          question: q,
          category: 'return_brief',
          status: 'open',
        }))
      )
    }

    // 5. Save tool session record
    let toolSessionId: string | null = null
    const { data: session } = await supabase
      .from('tool_sessions')
      .insert({
        project_id: projectId,
        mission_id: missionId ?? null,
        raw_summary: rawSummary,
        parsed_summary: analysis as unknown as Record<string, unknown>,
        status: analysis.status,
      })
      .select('id')
      .single()
    toolSessionId = session?.id ?? null

    // 6. Update mission status if provided
    if (missionId) {
      await supabase
        .from('missions')
        .update({
          status: 'returned',
          returned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', missionId)
    }

    // 7. Advance project stage
    await supabase
      .from('projects')
      .update({ current_stage: 'return_received', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({
      analysis,
      decisionsCount,
      risksCount,
      toolSessionId,
    })
  } catch (err) {
    console.error('analyze-return error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'שגיאה לא ידועה' },
      { status: 500 }
    )
  }
}
