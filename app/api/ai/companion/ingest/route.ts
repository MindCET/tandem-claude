import { NextRequest, NextResponse } from "next/server"
import { anthropic, MODEL } from "@/lib/ai/client"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import {
  IngestionSchema,
  INGESTION_SYSTEM,
  INGESTION_USER,
} from "@/lib/ai/companion/ingestion"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { rawSummary, projectId } = await req.json()

  if (!rawSummary || !projectId) {
    return NextResponse.json(
      { error: "rawSummary and projectId are required" },
      { status: 400 }
    )
  }

  // Parse the summary with Claude
  let parsed
  try {
    const { text } = await generateText({
      model: anthropic(MODEL),
      system: INGESTION_SYSTEM,
      prompt: INGESTION_USER(rawSummary),
    })

    const json = JSON.parse(text)
    parsed = IngestionSchema.parse(json)
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to parse summary", details: String(err) },
      { status: 500 }
    )
  }

  // Save decisions to Supabase
  if (parsed.decisions.length > 0) {
    const decisionRows = parsed.decisions.map((d) => ({
      project_id: projectId,
      title: d.title,
      decision: d.decision,
      rationale: d.rationale,
      category: d.category,
      status: "active",
    }))
    await supabase.from("decisions").insert(decisionRows)
  }

  // Save risks to Supabase
  if (parsed.risks.length > 0) {
    const riskRows = parsed.risks.map((r) => ({
      project_id: projectId,
      title: r.title,
      description: r.description,
      severity: r.severity,
      source: "companion_ingestion",
      status: "open",
    }))
    await supabase.from("risks").insert(riskRows)
  }

  // Log to ai_logs
  await supabase.from("ai_logs").insert({
    project_id: projectId,
    task_type: "companion_ingestion",
    provider: "anthropic",
    model: MODEL,
    input: { rawSummary: rawSummary.slice(0, 500) },
    output: parsed,
    status: "success",
  })

  return NextResponse.json({ parsed })
}
