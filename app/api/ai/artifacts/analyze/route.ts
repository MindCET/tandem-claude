import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic, MODEL } from '@/lib/ai/client'
import { createClient } from '@/lib/supabase/server'

const AnalysisSchema = z.object({
  type: z.string().describe('Detected artifact type: product_brief | prd | architecture | other'),
  completeness_score: z.number().min(0).max(100).describe('How complete is this artifact, 0-100'),
  gaps: z.array(z.string()).describe('Missing sections or information (in Hebrew, max 5 items)'),
  suggested_improvements: z.array(z.string()).describe('Optional improvements (in Hebrew, max 3 items)'),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, projectId } = await request.json()
  if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 })

  // Verify project access if projectId provided
  if (projectId) {
    const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('user_id', user.id).single()
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { object } = await generateObject({
    model: anthropic(MODEL),
    schema: AnalysisSchema,
    prompt: `Analyze the following document and identify what type of product artifact it is, how complete it is, and what's missing.

Document:
---
${content.slice(0, 8000)}
---

Respond in Hebrew for gaps and improvements. Be concise.`,
  })

  return NextResponse.json(object)
}
