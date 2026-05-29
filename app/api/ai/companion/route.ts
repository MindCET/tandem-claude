import { streamText } from "ai"
import { anthropic, MODEL } from "@/lib/ai/client"
import { createClient } from "@/lib/supabase/server"
import { buildProjectContext } from "@/lib/ai/companion/context"
import { buildCompanionSystem } from "@/lib/ai/companion/prompts"

// Guardrails against runaway cost / abuse on the streaming endpoint.
const MAX_MESSAGES = 50
const MAX_TOTAL_CHARS = 100_000

function isValidMessages(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false
  if (value.length > MAX_MESSAGES) return false
  let totalChars = 0
  for (const m of value) {
    if (!m || typeof m !== "object") return false
    if (typeof m.role !== "string") return false
    if (typeof m.content === "string") totalChars += m.content.length
  }
  return totalChars <= MAX_TOTAL_CHARS
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const { messages, projectId } = await req.json()

    if (!isValidMessages(messages)) {
      return new Response("Invalid messages", { status: 400 })
    }

    // If a project is referenced, verify the user owns it before building
    // context from it (RLS-scoped read).
    if (projectId) {
      const { data: project, error } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .single()
      if (error || !project) {
        return new Response("Project not found", { status: 404 })
      }
    }

    const projectContext = projectId
      ? await buildProjectContext(projectId, supabase)
      : ""

    const result = streamText({
      model: anthropic(MODEL),
      system: buildCompanionSystem(projectContext),
      messages,
    })

    return result.toTextStreamResponse()
  } catch (err) {
    console.error("companion: request failed", err)
    return new Response("Companion request failed", { status: 500 })
  }
}
