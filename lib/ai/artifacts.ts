import type { SupabaseClient } from "@supabase/supabase-js"

interface UpsertArtifactInput {
  projectId: string
  type: string
  title: string
  contentJson: unknown
  markdown: string
}

/**
 * Insert a new artifact of the given type for a project, or bump and update
 * the existing one (incrementing its version). Returns the artifact id, or
 * null if the write failed. All access is RLS-scoped via the request client.
 */
export async function upsertArtifact(
  supabase: SupabaseClient,
  { projectId, type, title, contentJson, markdown }: UpsertArtifactInput
): Promise<{ id: string } | null> {
  const { data: existing } = await supabase
    .from("artifacts")
    .select("id, version")
    .eq("project_id", projectId)
    .eq("type", type)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from("artifacts")
      .update({
        title,
        content_json: contentJson,
        content_markdown: markdown,
        status: "draft",
        version: (existing.version ?? 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id")
      .single()
    if (error || !data) {
      console.error(`[upsertArtifact:${type}] update error:`, error)
      return null
    }
    return data
  }

  const { data, error } = await supabase
    .from("artifacts")
    .insert({
      project_id: projectId,
      type,
      title,
      content_json: contentJson,
      content_markdown: markdown,
      status: "draft",
      version: 1,
    })
    .select("id")
    .single()
  if (error || !data) {
    console.error(`[upsertArtifact:${type}] insert error:`, error)
    return null
  }
  return data
}
