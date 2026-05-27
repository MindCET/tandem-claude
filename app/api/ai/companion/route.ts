import { streamText } from "ai"
import { anthropic, MODEL } from "@/lib/ai/client"
import { createClient } from "@/lib/supabase/server"
import { buildProjectContext } from "@/lib/ai/companion/context"
import { buildCompanionSystem } from "@/lib/ai/companion/prompts"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { messages, projectId } = await req.json()

  const projectContext = projectId
    ? await buildProjectContext(projectId, supabase)
    : ""

  const result = streamText({
    model: anthropic(MODEL),
    system: buildCompanionSystem(projectContext),
    messages,
  })

  return result.toTextStreamResponse()
}
