import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// Server-side auth gate for everything under the (app) group.
// Defense-in-depth on top of middleware: pages never render without a
// verified session, even if a middleware matcher gap ever lets a request through.
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <>{children}</>
}
