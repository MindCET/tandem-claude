"use client"

import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { FlaskConical } from "lucide-react"

const stats = [
  { label: "פרויקטים פעילים", value: "3", subLabel: "+1 השבוע" },
  { label: "משימות",          value: "7", subLabel: "2 ממתינות לבחינה" },
  { label: "החלטות",          value: "24", subLabel: "+5 היום" },
  { label: "התראות",          value: "2", subLabel: "דורש תשומת לב", accent: true },
]

const recentProjects = [
  { id: "1", name: "SaaS Dashboard",     progress: 68, phase: "BUILD",        lastActivity: "לפני שעתיים", hasDrift: true },
  { id: "2", name: "Mobile App MVP",     progress: 35, phase: "ARCH",         lastActivity: "לפני יום",    hasDrift: true },
  { id: "3", name: "E-commerce Platform", progress: 12, phase: "PLAN",        lastActivity: "לפני 3 ימים", hasDrift: false },
]

const activeMissions = [
  { id: "m1", title: "מימוש זרימת אימות משתמשים",        project: "SaaS Dashboard",  tool: "Cursor",      status: "in-progress" },
  { id: "m2", title: "יצירת קומפוננטות פריסת דשבורד",    project: "SaaS Dashboard",  tool: "v0",          status: "pending-review" },
  { id: "m3", title: "הגדרת סכמת בסיס נתונים",          project: "Mobile App MVP",   tool: "Claude Code", status: "queued" },
]

const recentDecisions = [
  { id: "d1", title: "שימוש ב-Supabase Auth לאימות", project: "SaaS Dashboard",    time: "14:32", category: "ARCH" },
  { id: "d2", title: "SSR לכל דפי ה-marketing",       project: "E-commerce",        time: "11:10", category: "PERF" },
  { id: "d3", title: "React Native במקום Flutter",    project: "Mobile App MVP",    time: "אתמול", category: "STACK" },
]

const statusColor: Record<string, string> = {
  "in-progress":    "#e85d3a",
  "pending-review": "#18182a",
  "queued":         "rgba(22,22,34,0.25)",
}

export default function ControlTowerPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f0e9da' }}>
      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1px 1fr', height: '100%' }}>

        {/* LEFT COLUMN */}
        <div style={{ padding: '28px', overflowY: 'auto' }}>

          {/* Demo notice */}
          <div
            className="flex items-center gap-2 mb-6 px-4 py-2.5 text-sm"
            style={{
              border: '1px solid rgba(232,93,58,0.35)',
              background: 'rgba(232,93,58,0.06)',
              borderRadius: 2,
              color: '#e85d3a',
              fontFamily: 'Rubik, sans-serif',
              fontSize: 12,
            }}
          >
            <FlaskConical className="h-4 w-4 shrink-0" />
            <span>
              <strong>נתוני Demo</strong> — הנתונים כאן לדוגמה בלבד.{" "}
              <a href="/app/projects" style={{ textDecoration: 'underline', textUnderlineOffset: 2 }}>
                עבור לפרויקטים שלך
              </a>
            </span>
          </div>

          {/* Hero number */}
          <section style={{ marginBottom: 28 }}>
            <div className="ed-section-head">
              סקירת מערכת <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 7 }}>2026.05.26</span>
            </div>
            <div style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 900, fontSize: 100, color: '#18182a', lineHeight: 0.82, letterSpacing: '-0.04em' }}>
              3
            </div>
            <div style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 300, fontSize: 14, color: 'rgba(22,22,34,0.45)', marginTop: 10 }}>
              פרויקטים פעילים בתהליך
            </div>

            {/* Stat strip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2, background: 'rgba(22,22,34,0.1)', marginTop: 20, marginBottom: 24 }}>
              {stats.map((s) => (
                <div key={s.label} style={{ background: '#f0e9da', padding: '12px 14px' }}>
                  <div style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 800, fontSize: 28, color: s.accent ? '#e85d3a' : '#18182a', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,22,34,0.38)', marginTop: 3 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(22,22,34,0.3)', marginTop: 2 }}>
                    {s.subLabel}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section style={{ marginBottom: 28 }}>
            <div className="ed-section-head">פרויקטים</div>
            {recentProjects.map((p) => (
              <Link
                key={p.id}
                href={`/app/projects/${p.id}`}
                className="block transition-opacity hover:opacity-65"
                style={{ padding: '9px 0', borderBottom: '1px solid rgba(22,22,34,0.1)', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 700, fontSize: 13, color: '#18182a' }}>{p.name}</div>
                  <div style={{ height: 2, background: 'rgba(22,22,34,0.1)', marginTop: 4, borderRadius: 1, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: `${p.progress}%`, background: '#18182a', borderRadius: 1 }} />
                  </div>
                </div>
                <div style={{ fontFamily: 'Rubik, sans-serif', fontSize: 9, fontWeight: 500, color: 'rgba(22,22,34,0.38)', letterSpacing: '0.04em' }}>
                  {p.phase}
                </div>
                <div style={{ fontFamily: 'Rubik, sans-serif', fontSize: 14, fontWeight: 700, color: '#e85d3a', minWidth: 36, textAlign: 'start' }}>
                  {p.progress}%
                </div>
              </Link>
            ))}
          </section>

          {/* Recent decisions */}
          <section>
            <div className="ed-section-head">
              החלטות אחרונות
              <Link href="/app/decisions" style={{ fontFamily: 'Rubik, sans-serif', fontSize: 9, fontWeight: 500, color: 'rgba(22,22,34,0.38)', letterSpacing: '0.04em', textDecoration: 'none' }}>
                יומן מלא →
              </Link>
            </div>
            {recentDecisions.map((d) => (
              <div key={d.id} style={{ padding: '7px 0', borderBottom: '1px solid rgba(22,22,34,0.08)', display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 10 }}>
                <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', color: '#e85d3a', flexShrink: 0, paddingTop: 1 }}>
                  {d.category}
                </span>
                <span style={{ color: 'rgba(22,22,34,0.6)', flex: 1, lineHeight: 1.4, fontWeight: 400 }}>{d.title}</span>
                <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: 9, fontWeight: 400, color: 'rgba(22,22,34,0.3)', whiteSpace: 'nowrap' }}>{d.time}</span>
              </div>
            ))}
          </section>
        </div>

        {/* DIVIDER */}
        <div style={{ background: 'rgba(22,22,34,0.1)' }} />

        {/* RIGHT COLUMN */}
        <div style={{ padding: '28px 20px', overflowY: 'auto' }}>

          {/* Drift alerts */}
          <section style={{ marginBottom: 26 }}>
            <div className="ed-section-head">התראות סטייה</div>

            <div style={{ background: '#e85d3a', padding: '12px 14px', borderRadius: 2, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: '#fff', marginBottom: 4, letterSpacing: '0.01em' }}>⚠ Spec Drift — Authentication</div>
              <div style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                OAuth מומש במקום Magic Links כפי שהוגדר ב-PRD. דורש תשומת לב מיידית.
              </div>
              <div className="flex gap-1.5 mt-3">
                <Button size="sm" variant="outline" className="h-6 text-xs px-3"
                  style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff', background: 'transparent', fontFamily: 'Rubik, sans-serif', letterSpacing: '0.04em' }}>
                  סקור
                </Button>
                <Button size="sm" variant="outline" className="h-6 text-xs px-3"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)', background: 'transparent', fontFamily: 'Rubik, sans-serif', letterSpacing: '0.04em' }}>
                  עדכן מפרט
                </Button>
              </div>
            </div>

            <div style={{ background: '#18182a', padding: '12px 14px', borderRadius: 2 }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: '#fff', marginBottom: 4, letterSpacing: '0.01em' }}>⚡ Undocumented Dependency</div>
              <div style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                react-native-reanimated נוספה ללא רישום ביומן ההחלטות.
              </div>
              <div className="flex gap-1.5 mt-3">
                <Button size="sm" variant="outline" className="h-6 text-xs px-3"
                  style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.8)', background: 'transparent', fontFamily: 'Rubik, sans-serif', letterSpacing: '0.04em' }}>
                  רשום החלטה
                </Button>
              </div>
            </div>
          </section>

          {/* Active mission */}
          <section style={{ marginBottom: 26 }}>
            <div className="ed-section-head">משימה נוכחית</div>
            <Link
              href="/app/missions"
              style={{ display: 'block', background: '#18182a', padding: '14px', borderRadius: 2, textDecoration: 'none' }}
              className="transition-opacity hover:opacity-85"
            >
              <div style={{ fontFamily: 'Rubik, sans-serif', fontSize: 7, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.28)', marginBottom: 6, textTransform: 'uppercase' }}>
                IN PROGRESS
              </div>
              <div style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
                מימוש זרימת אימות משתמשים
              </div>
              <div style={{ fontFamily: 'Rubik, sans-serif', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
                CURSOR — SaaS Dashboard
              </div>
            </Link>
          </section>

          {/* Missions queue */}
          <section>
            <div className="ed-section-head">
              תור משימות
              <Link href="/app/missions" style={{ fontFamily: 'Rubik, sans-serif', fontSize: 9, fontWeight: 500, color: 'rgba(22,22,34,0.38)', letterSpacing: '0.04em', textDecoration: 'none' }}>
                הצג הכל →
              </Link>
            </div>
            {activeMissions.map((m) => (
              <div key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(22,22,34,0.08)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span
                  className="rounded-full mt-1.5 shrink-0"
                  style={{ width: 6, height: 6, background: statusColor[m.status], flexShrink: 0, marginTop: 5 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Rubik, sans-serif', fontSize: 11, fontWeight: 500, color: 'rgba(22,22,34,0.75)', lineHeight: 1.35 }}>{m.title}</div>
                  <div style={{ fontSize: 9, color: 'rgba(22,22,34,0.38)', marginTop: 2, letterSpacing: '0.04em' }}>
                    {m.tool} — {m.project}
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}
