import { NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { anthropic, MODEL } from "@/lib/ai/client"
import { createClient } from "@/lib/supabase/server"
import {
  IngestionSchema,
  INGESTION_SYSTEM,
  INGESTION_USER,
} from "@/lib/ai/companion/ingestion"

const MAX_SUMMARY_LENGTH = 50_000

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

  if (typeof rawSummary !== "string" || rawSummary.length > MAX_SUMMARY_LENGTH) {
    return NextResponse.json(
      { error: `rawSummary must be a string under ${MAX_SUMMARY_LENGTH} characters` },
      { status: 400 }
    )
  }

  // Verify the project exists and is owned by the user (RLS-scoped read).
  // Without this, ownership only fails silently at insert time.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // Parse the summary with Claude (structured output — no manual JSON.parse).
  let parsed
  try {
    const { object } = await generateObject({
      model: anthropic(MODEL),
      schema: IngestionSchema,
      system: INGESTION_SYSTEM,
      prompt: INGESTION_USER(rawSummary),
    })
    parsed = object
  } catch (err) {
    console.error("companion ingest: failed to parse summary", err)
    return NextResponse.json(
      { error: "Failed to parse summary" },
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
    const { error } = await supabase.from("decisions").insert(decisionRows)
    if (error) {
      console.error("companion ingest: failed to insert decisions", error)
      return NextResponse.json(
        { error: "Failed to save decisions" },
        { status: 500 }
      )
    }
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
    const { error } = await supabase.from("risks").insert(riskRows)
    if (error) {
      console.error("companion ingest: failed to insert risks", error)
      return NextResponse.json(
        { error: "Failed to save risks" },
        { status: 500 }
      )
    }
  }

  // Log to ai_logs (best-effort — don't fail the request on logging errors)
  const { error: logError } = await supabase.from("ai_logs").insert({
    project_id: projectId,
    task_type: "companion_ingestion",
    provider: "anthropic",
    model: MODEL,
    input: { rawSummary: rawSummary.slice(0, 500) },
    output: parsed,
    status: "success",
  })
  if (logError) {
    console.error("companion ingest: failed to write ai_log", logError)
  }

  return NextResponse.json({ parsed })
}
