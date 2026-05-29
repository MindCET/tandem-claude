import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTasks, tasksToMarkdown } from '@/lib/ai/service'
import type { ProductBrief } from '@/lib/ai/schemas'
import type { PRD } from '@/lib/ai/schemas'
import type { Architecture } from '@/lib/ai/schemas'

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json()
    if (!projectId) {
      return NextResponse.json({ error: 'projectId נדרש' }, { status: 400 })
    }

    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })

    // Fetch all three approved artifacts in parallel
    const [briefRes, prdRes, archRes] = await Promise.all([
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
        .eq('status', 'approved')
        .maybeSingle(),
      supabase
        .from('artifacts')
        .select('content_json')
        .eq('project_id', projectId)
        .eq('type', 'architecture')
        .eq('status', 'approved')
        .maybeSingle(),
    ])

    if (!briefRes.data?.content_json) {
      return NextResponse.json({ error: 'Product Brief מאושר לא נמצא' }, { status: 400 })
    }
    if (!prdRes.data?.content_json) {
      return NextResponse.json({ error: 'PRD מאושר לא נמצא' }, { status: 400 })
    }
    if (!archRes.data?.content_json) {
      return NextResponse.json({ error: 'Architecture מאושרת לא נמצאה' }, { status: 400 })
    }

    const brief = briefRes.data.content_json as unknown as ProductBrief
    const prd = prdRes.data.content_json as unknown as PRD
    const arch = archRes.data.content_json as unknown as Architecture

    // Generate task list
    const taskList = await generateTasks(brief, prd, arch)
    const markdown = tasksToMarkdown(taskList)

    // Save each task to the tasks table
    const taskInserts = taskList.tasks.map((t) => ({
      project_id: projectId,
      title: t.title,
      description: t.description,
      phase: t.phase,
      priority: t.priority,
      complexity: t.complexity,
      recommended_tool: t.recommended_tool,
      acceptance_criteria: t.acceptance_criteria,
      dependencies: t.dependencies,
      status: 'not_started',
    }))

    // Delete any previous auto-generated tasks first, then insert fresh ones.
    // Bail out if the delete fails so we don't wipe tasks and then fail to
    // re-insert (which would leave the project with no tasks at all).
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', projectId)
    if (deleteError) {
      console.error('Tasks delete error:', deleteError)
      return NextResponse.json({ error: 'שגיאה בשמירת משימות' }, { status: 500 })
    }
    const { error: insertError } = await supabase.from('tasks').insert(taskInserts)
    if (insertError) {
      console.error('Tasks insert error:', insertError)
      return NextResponse.json({ error: 'שגיאה בשמירת משימות' }, { status: 500 })
    }

    // Advance stage to task_plan_draft
    await supabase
      .from('projects')
      .update({ current_stage: 'task_plan_draft', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({
      taskList,
      markdown,
      tasksCount: taskList.tasks.length,
      phases: taskList.phases,
    })
  } catch (err) {
    console.error('generate-tasks error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'שגיאה לא ידועה' },
      { status: 500 }
    )
  }
}
