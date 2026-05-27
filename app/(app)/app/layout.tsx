"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CompanionButton } from "@/components/companion/CompanionButton"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  { labelHe: "מגדל שליטה",   href: "/app" },
  { labelHe: "פרויקטים",     href: "/app/projects" },
  { labelHe: "משימות",       href: "/app/missions" },
  { labelHe: "תדריכי חזרה",  href: "/app/returns" },
  { labelHe: "יומן החלטות",  href: "/app/decisions" },
  { labelHe: "זיהוי סטייה",  href: "/app/drift" },
  { labelHe: "זיכרון",       href: "/app/memory" },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [companionProjectName, setCompanionProjectName] = useState<string | undefined>()
  const pathname = usePathname()
  const supabase = createClient()
  const { lang } = useLanguage()

  const projectIdMatch = pathname.match(/\/app\/projects\/([^/]+)/)
  const companionProjectId = projectIdMatch ? projectIdMatch[1] : undefined

  useEffect(() => {
    if (!companionProjectId) { setCompanionProjectName(undefined); return }
    supabase
      .from('projects')
      .select('name')
      .eq('id', companionProjectId)
      .single()
      .then(({ data }) => setCompanionProjectName(data?.name ?? undefined))
  }, [companionProjectId])

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      {/* Editorial sidebar — narrow dark strip */}
      <aside
        className="flex flex-col items-center flex-shrink-0 border-l"
        style={{
          width: 60,
          background: '#18182a',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        {/* Vertical logo */}
        <Link
          href="/app"
          className="flex items-center justify-center py-5 mb-2"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          <span
            style={{
              fontFamily: 'Rubik, sans-serif',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '0.12em',
              color: '#f0e9da',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Tandem
          </span>
        </Link>

        {/* Nav pips */}
        <TooltipProvider delayDuration={0}>
          <nav className="flex flex-col items-center gap-1.5 flex-1 pt-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href))

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <span
                        className="block rounded-sm transition-all duration-200"
                        style={{
                          width: isActive ? 36 : 28,
                          height: 4,
                          background: isActive ? '#e85d3a' : 'rgba(255,255,255,0.15)',
                          marginTop: 3,
                          marginBottom: 3,
                        }}
                      />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    className="border text-xs font-medium"
                    style={{
                      background: '#18182a',
                      borderColor: 'rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.75)',
                      fontFamily: 'Rubik, sans-serif',
                      letterSpacing: '0.04em',
                      borderRadius: 2,
                    }}
                  >
                    {item.labelHe}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>
        </TooltipProvider>

        {/* Bottom: date/issue tag */}
        <div
          className="pb-5"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 8,
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.18)',
          }}
        >
          2026.V / 001
        </div>
      </aside>

      {/* Top bar */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header
          className="flex items-center gap-5 flex-shrink-0 border-b px-5"
          style={{
            height: 40,
            background: '#18182a',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <span
            style={{
              fontFamily: 'Rubik, sans-serif',
              fontSize: 9,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.22)',
              letterSpacing: '0.06em',
              marginInlineEnd: 'auto',
            }}
          >
            2026.V — Issue No. 001
          </span>

          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className="transition-all duration-150"
                style={{
                  fontFamily: 'Rubik, sans-serif',
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isActive ? '#f0e9da' : 'rgba(255,255,255,0.28)',
                  paddingBottom: 2,
                  borderBottom: isActive ? '2px solid #e85d3a' : '2px solid transparent',
                  textDecoration: 'none',
                }}
              >
                {item.labelHe}
              </Link>
            )
          })}

          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className="animate-pulse rounded-full"
              style={{ width: 6, height: 6, background: '#4af0c4', boxShadow: '0 0 5px #4af0c4' }}
            />
            <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>
              Live
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>

      <CompanionButton projectId={companionProjectId} projectName={companionProjectName} />
    </div>
  )
}
