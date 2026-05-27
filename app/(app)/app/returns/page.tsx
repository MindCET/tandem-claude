"use client"

import { useState } from "react"
import {
  FileText,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code,
  Palette,
  Database,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const returnBriefs = [
  {
    id: "rb1",
    missionTitle: "מימוש אימות משתמשים עם Supabase",
    project: "SaaS Dashboard",
    tool: "Cursor",
    toolIcon: Code,
    completedAt: "לפני שעתיים",
    status: "completed",
    summary: "מומש בהצלחה אימות Supabase עם אימייל/סיסמה ו-OAuth providers (Google, GitHub). נוסף ניהול session ו-protected routes.",
    artifacts: {
      filesCreated: [
        "lib/supabase/client.ts",
        "lib/supabase/server.ts",
        "app/(auth)/login/page.tsx",
        "app/(auth)/signup/page.tsx",
        "middleware.ts"
      ],
      filesModified: [
        "app/layout.tsx",
        "components/ui/button.tsx"
      ],
      dependencies: [
        "@supabase/supabase-js",
        "@supabase/ssr"
      ]
    },
    decisions: [
      {
        title: "נוסף OAuth בנוסף ל-magic links",
        rationale: "חוויית משתמש טובה יותר למי שמעדיף כניסה חברתית",
        needsReview: true
      },
      {
        title: "שימוש ב-middleware להגנת routes",
        rationale: "יעיל יותר מבדיקה בכל דף בנפרד",
        needsReview: false
      }
    ],
    completionChecklist: [
      { item: "משתמשים יכולים להירשם עם אימייל", completed: true },
      { item: "ה-session נשמר בין רענונים", completed: true },
      { item: "protected routes מפנים ל-login", completed: true },
      { item: "זרימת איפוס סיסמה עובדת", completed: false }
    ],
    notes: "OAuth נוסף כשיפור מעבר למפרט המקורי. מומלץ לעדכן PRD לשקף שינוי זה. זרימת איפוס סיסמה דורשת עבודה נוספת — נוצרה משימת המשך.",
    driftFlags: [
      "מימוש OAuth שונה מהמפרט (magic links בלבד)"
    ]
  },
  {
    id: "rb2",
    missionTitle: "יצירת קומפוננטות פריסת דשבורד",
    project: "SaaS Dashboard",
    tool: "v0",
    toolIcon: Palette,
    completedAt: "לפני יום",
    status: "pending-review",
    summary: "נבנה מעטפת הדשבורד הראשית עם ניווט sidebar רספונסיבי, header עם תפריט משתמש ואזור תוכן גמיש. תומך במצב כהה.",
    artifacts: {
      filesCreated: [
        "components/layout/sidebar.tsx",
        "components/layout/header.tsx",
        "components/layout/dashboard-shell.tsx",
        "app/(dashboard)/layout.tsx"
      ],
      filesModified: [
        "app/globals.css",
        "tailwind.config.ts"
      ],
      dependencies: []
    },
    decisions: [
      {
        title: "שימוש ב-CSS variables לעיצוב",
        rationale: "תמיכה קלה יותר במצב כהה והתאמה אישית",
        needsReview: false
      }
    ],
    completionChecklist: [
      { item: "רספונסיבי עד 320px", completed: true },
      { item: "sidebar מתקפל", completed: true },
      { item: "ניווט breadcrumb", completed: false }
    ],
    notes: "ניווט breadcrumb נדחה למשימה נפרדת. כל שאר קריטריוני הקבלה עומדים.",
    driftFlags: []
  },
  {
    id: "rb3",
    missionTitle: "הגדרת סכמת בסיס נתונים",
    project: "Mobile App MVP",
    tool: "Claude Code",
    toolIcon: Database,
    completedAt: "לפני 3 ימים",
    status: "completed",
    summary: "נוצרה סכמת בסיס נתונים ראשונית עם טבלאות users, workouts, exercises ו-progress. נוספו מדיניות RLS ונתוני seed.",
    artifacts: {
      filesCreated: [
        "supabase/migrations/001_initial_schema.sql",
        "supabase/migrations/002_rls_policies.sql",
        "supabase/seed.sql",
        "types/database.ts"
      ],
      filesModified: [],
      dependencies: []
    },
    decisions: [
      {
        title: "שימוש ב-soft deletes לכל הטבלאות",
        rationale: "שחזור נתונים ו-audit trail",
        needsReview: false
      },
      {
        title: "נוספו composite indexes לשאילתות נפוצות",
        rationale: "אופטימיזציית ביצועים",
        needsReview: false
      }
    ],
    completionChecklist: [
      { item: "כל הטבלאות נוצרו", completed: true },
      { item: "RLS מופעל", completed: true },
      { item: "סקריפט seed מוכן", completed: true }
    ],
    notes: "הסכמה עוקבת אחר תרשים יחסי הישויות. טיפוסים נוצרו לאינטגרציה עם TypeScript.",
    driftFlags: []
  },
]

export default function ReturnsPage() {
  const [selectedBrief, setSelectedBrief] = useState<typeof returnBriefs[0] | null>(null)
  const [expandedSections, setExpandedSections] = useState<string[]>(["artifacts", "decisions", "checklist"])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">תדריכי חזרה</h1>
            <p className="text-sm text-muted-foreground">תוצאות מסשנים שהושלמו בכלי AI</p>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            הגש תדריך חזרה
          </Button>
        </div>
      </header>

      <div className="p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש תדריכי חזרה..."
              className="pl-10 bg-background/50 border-border/50"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">כל התדריכים</TabsTrigger>
            <TabsTrigger value="pending">ממתינים לבחינה</TabsTrigger>
            <TabsTrigger value="completed">עובדו</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-0">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Brief List */}
              <div className="space-y-3">
                {returnBriefs.map((brief) => (
                  <Card
                    key={brief.id}
                    className={`cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 ${
                      selectedBrief?.id === brief.id ? "border-primary ring-1 ring-primary/20" : ""
                    }`}
                    onClick={() => setSelectedBrief(brief)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          brief.status === "completed" ? "bg-emerald-500/10 text-emerald-500" :
                          "bg-amber-500/10 text-amber-500"
                        }`}>
                          <brief.toolIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-sm leading-snug">{brief.missionTitle}</h3>
                            {brief.driftFlags.length > 0 && (
                              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{brief.summary}</p>
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {brief.tool}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{brief.project}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{brief.completedAt}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Brief Detail */}
              {selectedBrief ? (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-24 h-fit max-h-[calc(100vh-140px)] overflow-auto">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${
                            selectedBrief.status === "completed"
                              ? "bg-emerald-500 text-white"
                              : "bg-amber-500 text-white"
                          }`}>
                            {selectedBrief.status === "completed" ? "עובד" : "ממתין לבחינה"}
                          </Badge>
                          <Badge variant="outline" className="text-xs gap-1">
                            <selectedBrief.toolIcon className="h-3 w-3" />
                            {selectedBrief.tool}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{selectedBrief.missionTitle}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">{selectedBrief.summary}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedBrief.driftFlags.length > 0 && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-500">סטייה זוהתה</p>
                            <ul className="mt-1 space-y-1">
                              {selectedBrief.driftFlags.map((flag, i) => (
                                <li key={i} className="text-xs text-muted-foreground">{flag}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Artifacts */}
                    <Collapsible open={expandedSections.includes("artifacts")} onOpenChange={() => toggleSection("artifacts")}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
                        <span>ארטיפקטים</span>
                        {expandedSections.includes("artifacts") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3">
                        {selectedBrief.artifacts.filesCreated.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">קבצים שנוצרו</p>
                            <div className="space-y-1">
                              {selectedBrief.artifacts.filesCreated.map((file, i) => (
                                <code key={i} className="block text-xs font-mono text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded">
                                  + {file}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedBrief.artifacts.filesModified.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">קבצים שעודכנו</p>
                            <div className="space-y-1">
                              {selectedBrief.artifacts.filesModified.map((file, i) => (
                                <code key={i} className="block text-xs font-mono text-amber-500 bg-amber-500/5 px-2 py-1 rounded">
                                  ~ {file}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedBrief.artifacts.dependencies.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">תלויות שנוספו</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedBrief.artifacts.dependencies.map((dep, i) => (
                                <Badge key={i} variant="secondary" className="text-xs font-mono">
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Decisions */}
                    <Collapsible open={expandedSections.includes("decisions")} onOpenChange={() => toggleSection("decisions")}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
                        <span>החלטות שהתקבלו</span>
                        {expandedSections.includes("decisions") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2">
                        {selectedBrief.decisions.map((decision, i) => (
                          <div key={i} className="rounded-lg border border-border/50 bg-background/50 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">{decision.title}</p>
                              {decision.needsReview && (
                                <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                                  דורש בחינה
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{decision.rationale}</p>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Completion Checklist */}
                    <Collapsible open={expandedSections.includes("checklist")} onOpenChange={() => toggleSection("checklist")}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
                        <span>קריטריוני קבלה</span>
                        {expandedSections.includes("checklist") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2">
                        {selectedBrief.completionChecklist.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            {item.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <div className="h-4 w-4 rounded border border-border/50 shrink-0 mt-0.5" />
                            )}
                            <span className={item.completed ? "text-muted-foreground" : ""}>{item.item}</span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>

                    {selectedBrief.notes && (
                      <div>
                        <p className="text-sm font-medium mb-2">הערות</p>
                        <p className="text-sm text-muted-foreground">{selectedBrief.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <Button className="flex-1 gap-2" size="sm">
                        <CheckCircle2 className="h-4 w-4" />
                        אשר וסנכרן
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        פתח משימה
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 bg-card/30 backdrop-blur-sm flex items-center justify-center min-h-[400px]">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">בחר תדריך חזרה לצפייה בפרטים</p>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="text-center py-12 text-muted-foreground">
              <p>תדריכים הממתינים לבחינה יופיעו כאן</p>
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="text-center py-12 text-muted-foreground">
              <p>תדריכים שעובדו יופיעו כאן</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
