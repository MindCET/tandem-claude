import { createBrowserClient } from '@supabase/ssr'

function makeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Reuse a single browser client across the app. Creating a new one on every
// render/call spawns multiple GoTrueClient instances (console warnings) and
// wastes work; the browser client is safe to share.
let client: ReturnType<typeof makeClient> | undefined

export function createClient() {
  if (!client) {
    client = makeClient()
  }
  return client
}
