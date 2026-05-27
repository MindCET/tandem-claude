"use client"

import { useState } from "react"
import {
  Compass,
  Plus,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Code,
  Palette,
  Database
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const missions = [
  {
    id: "m1",
    title: "מימוש אימות משתמשים עם Supabase",
    description: "הגדרת זרימת auth מלאה כולל הרשמה, כניסה, איפוס סיסמה וניהול session עם Supabase Auth.",
    project: "SaaS Dashboard",
    tool: "Cursor",
    toolIcon: Code,
    status: "in-progress",
    priority: "high",
    createdAt: "לפני שעתיים",
    context: {
      constraints: ["שימוש ב-magic links לאימות ללא סיסמה", "מימוש מדיניות RLS", "הוספת לוגיקת רענון session"],
      references: ["PRD סעיף 4.2", "מסמך ארכיטקטורה - Auth Flow"],
      acceptanceCriteria: ["משתמשים יכולים להירשם עם אימייל", "ה-session נשמר בין רענונים", "protected routes מפנים ל-login"]
    }
  },
  {
    id: "m2",
    title: "יצירת קומפוננטות פריסת דשבורד",
    description: "בניית מעטפת הדשבורד הראשית כולל ניווט sidebar, header וגריד פריסה רספונסיבי.",
    project: "SaaS Dashboard",
    tool: "v0",
    toolIcon: Palette,
    status: "pending-review",
    priority: "medium",
    createdAt: "לפני יום",
    context: {
      constraints: ["עקוב אחר tokens של מערכת העיצוב", "גישה mobile-first", "תמיכה במצב כהה"],
      references: ["Design System v1.2", "Figma Mockups"],
      acceptanceCriteria: ["רספונסיבי עד 320px", "sidebar מתקפל", "ניווט breadcrumb"]
    }
  },
  {
    id: "m3",
    title: "הגדרת סכמת בסיס נתונים",
    description: "יצירת סכמת בסיס הנתונים הראשונית עם טבלאות users, organizations, projects ו-activity.",
    project: "Mobile App MVP",
    tool: "Claude Code",
    toolIcon: Database,
    status: "queued",
    priority: "high",
    createdAt: "לפני 3 ימים",
    context: {
      constraints: ["שימוש ב-Supabase migrations", "הוספת indexes מתאימים", "מימוש soft deletes"],
      references: ["מסמך מודל נתונים", "תרשים יחסי ישויות"],
      acceptanceCriteria: ["כל הטבלאות נוצרו", "RLS מופעל", "סקריפט seed מוכן"]
    }
  },
  {
    id: "m4",
    title: "בניית אשף onboarding",
    description: "יצירת חוויית onboarding רב-שלבית למשתמשים חדשים עם מעקב התקדמות ואפשרות דילוג.",
    project: "SaaS Dashboard",
    tool: "v0",
    toolIcon: Palette,
    status: "completed",
    priority: "medium",
    createdAt: "לפני 5 ימים",
    context: {
      constraints: ["מקסימום 5 שלבים", "שמירה אוטומטית של התקדמות", "אפשרות לדלג ולחזור מאוחר יותר"],
      references: ["מסמך זרימת משתמש", "Onboarding Best Practices"],
      acceptanceCriteria: ["כל השלבים מומשו", "התקדמות נשמרת", "פונקציונליות דילוג עובדת"]
    }
  },
]

const statusColors = {
  "in-progress": "bg-amber-500",
  "pending-review": "bg-primary",
  "queued": "bg-muted-foreground",
  "completed": "bg-emerald-500"
}

const statusLabels = {
  "in-progress": "בתהליך",
  "pending-review": "ממתין לבחינה",
  "queued": "בתור",
  "completed": "הושלם"
}

const priorityLabels = {
  high: "גבוה",
  medium: "בינוני",
  low: "נמוך"
}

export default function MissionsPage() {
  const [selectedMission, setSelectedMission] = useState<typeof missions[0] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">תדריכי משימה</h1>
            <p className="text-sm text-muted-foreground">מפרטי משימות לכלי AI חיצוניים</p>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            צור תדריך
          </Button>
        </div>
      </header>

      <div className="p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש משימות..."
              className="pl-10 bg-background/50 border-border/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            סינון
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">כל המשימות</TabsTrigger>
            <TabsTrigger value="in-progress">בתהליך</TabsTrigger>
            <TabsTrigger value="pending">ממתינות לבחינה</TabsTrigger>
            <TabsTrigger value="completed">הושלמו</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-0">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Mission List */}
              <div className="space-y-3">
                {missions.map((mission) => (
                  <Card
                    key={mission.id}
                    className={`cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 ${
                      selectedMission?.id === mission.id ? "border-primary ring-1 ring-primary/20" : ""
                    }`}
                    onClick={() => setSelectedMission(mission)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${statusColors[mission.status as keyof typeof statusColors]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-sm leading-snug">{mission.title}</h3>
                            <Badge
                              variant={mission.priority === "high" ? "destructive" : "secondary"}
                              className="text-xs shrink-0"
                            >
                              {priorityLabels[mission.priority as keyof typeof priorityLabels]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mission.description}</p>
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs gap-1 px-1.5 py-0">
                              <mission.toolIcon className="h-3 w-3" />
                              {mission.tool}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{mission.project}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{mission.createdAt}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Mission Detail */}
              {selectedMission ? (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-24 h-fit">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${statusColors[selectedMission.status as keyof typeof statusColors]} text-white text-xs`}>
                            {statusLabels[selectedMission.status as keyof typeof statusLabels]}
                          </Badge>
                          <Badge variant="outline" className="text-xs gap-1">
                            <selectedMission.toolIcon className="h-3 w-3" />
                            {selectedMission.tool}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{selectedMission.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">{selectedMission.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        אסור לעשות
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedMission.context.constraints.map((constraint, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {constraint}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-primary" />
                        מקורות
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedMission.context.references.map((ref, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {ref}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        קריטריוני קבלה
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedMission.context.acceptanceCriteria.map((criteria, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="h-4 w-4 rounded border border-border/50 shrink-0 mt-0.5" />
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <Button className="flex-1 gap-2">
                        <Copy className="h-4 w-4" />
                        העתק תדריך
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Zap className="h-4 w-4" />
                        פתח ב-{selectedMission.tool}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 bg-card/30 backdrop-blur-sm flex items-center justify-center min-h-[400px]">
                  <div className="text-center text-muted-foreground">
                    <Compass className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">בחר משימה לצפייה בפרטים</p>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="in-progress">
            <div className="text-center py-12 text-muted-foreground">
              <p>משימות בתהליך יופיעו כאן</p>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="text-center py-12 text-muted-foreground">
              <p>משימות הממתינות לבחינה יופיעו כאן</p>
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="text-center py-12 text-muted-foreground">
              <p>משימות שהושלמו יופיעו כאן</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
