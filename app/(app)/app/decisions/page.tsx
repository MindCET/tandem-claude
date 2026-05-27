"use client"

import { useState } from "react"
import {
  GitBranch,
  Search,
  CheckCircle2,
  ChevronRight,
  Calendar,
  Tag,
  MessageSquare,
  Link2,
  User,
  ArrowUpRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

const decisions = [
  {
    id: "d1",
    title: "שימוש ב-Supabase לאימות ובסיס נתונים",
    description: "לאחר הערכת Firebase, Auth0 ו-Supabase, בחרנו ב-Supabase בזכות בסיס ה-PostgreSQL, אימות מובנה ויכולות real-time.",
    project: "SaaS Dashboard",
    category: "ארכיטקטורה",
    status: "approved",
    timestamp: "לפני שעתיים",
    date: "14 במאי 2026",
    author: "Tandem AI",
    rationale: "Supabase מספק את האיזון הטוב ביותר בין חוויית מפתח, מדרגיות ועלות למוצר SaaS בשלב מוקדם. בסיס ה-PostgreSQL מאפשר שאילתות מורכבות בצמיחה.",
    alternatives: [
      { name: "Firebase", reason: "NoSQL היה מחייב שינויי מודל נתונים" },
      { name: "Auth0", reason: "עלות ומורכבות נוספות לאימות נפרד" },
      { name: "PlanetScale", reason: "היה נדרש פתרון אימות נפרד" }
    ],
    implications: [
      "כל מודלי הנתונים יהיו רלציוניים",
      "זרימות אימות ישתמשו ב-Supabase magic links",
      "תכונות real-time זמינות דרך subscriptions"
    ],
    linkedArtifacts: ["מסמך ארכיטקטורה", "PRD v1.2", "תדריך משימה #12"]
  },
  {
    id: "d2",
    title: "רינדור בצד שרת לדפי SEO",
    description: "דפים ציבוריים ישתמשו ב-SSR לטובת SEO, בעוד דפי הדשבורד יישארו client-side לאינטראקטיביות טובה יותר.",
    project: "E-commerce Platform",
    category: "ביצועים",
    status: "approved",
    timestamp: "לפני יום",
    date: "13 במאי 2026",
    author: "Tandem AI",
    rationale: "SEO קריטי לגילויות. SSR מבטיח שמנועי חיפוש יכולים לאנדקס דפי מוצר תוך שמירת הדשבורד מהיר ואינטראקטיבי.",
    alternatives: [
      { name: "SSR מלא", reason: "יאיט את אינטראקציות הדשבורד" },
      { name: "CSR מלא", reason: "SEO גרוע לדפי מוצר" }
    ],
    implications: [
      "צורך בהפרדה של routes ציבוריים ופרטיים",
      "מורכבות ניהול state מסוימת",
      "אסטרטגיית caching לדפי SSR נדרשת"
    ],
    linkedArtifacts: ["מפרט ביצועים", "דרישות SEO"]
  },
  {
    id: "d3",
    title: "React Native במקום Flutter למובייל",
    description: "React Native נבחר לשיתוף קוד טוב יותר עם אפליקציית Next.js הקיימת והיכרות הצוות עם React.",
    project: "Mobile App MVP",
    category: "Stack",
    status: "approved",
    timestamp: "לפני יומיים",
    date: "12 במאי 2026",
    author: "משתמש",
    rationale: "הצוות כבר מכיר React ו-TypeScript. שיתוף קוד בין web למובייל יאיץ את הפיתוח משמעותית.",
    alternatives: [
      { name: "Flutter", reason: "היה מחייב לימוד Dart" },
      { name: "Native iOS/Android", reason: "כפל מאמץ הפיתוח" },
      { name: "Expo בלבד", reason: "גישה מוגבלת ל-native modules" }
    ],
    implications: [
      "ניתן לשתף לוגיקת validation וטיפוסים",
      "חלק מקומפוננטות UI ניידות",
      "בעתיד תידרש מומחיות React Native"
    ],
    linkedArtifacts: ["מסמך Tech Stack", "דרישות מובייל"]
  },
  {
    id: "d4",
    title: "מבנה monorepo עם Turborepo",
    description: "איחוד web, מובייל ופקאג'ים משותפים ל-monorepo לשיתוף קוד טוב יותר ויעילות CI/CD.",
    project: "SaaS Dashboard",
    category: "DevOps",
    status: "pending",
    timestamp: "לפני 3 ימים",
    date: "11 במאי 2026",
    author: "Tandem AI",
    rationale: "עם הוספת מובייל ופקאג'ים משותפים, monorepo יצמצם כפילויות ויפשט ניהול תלויות.",
    alternatives: [
      { name: "Repos נפרדים", reason: "מורכבות CI/CD רבה יותר, פקאג'ים כפולים" },
      { name: "Nx", reason: "מורכב מדי לגודל הנוכחי" }
    ],
    implications: [
      "צורך לבנות מחדש את מבנה הפרויקט",
      "שינויים בצינור CI/CD נדרשים",
      "שיתוף cache טוב יותר בין builds"
    ],
    linkedArtifacts: ["מסמך ארכיטקטורה", "תכנית DevOps"]
  },
]

const categories = ["הכל", "ארכיטקטורה", "Stack", "ביצועים", "DevOps", "אבטחה", "עיצוב"]

export default function DecisionsPage() {
  const [selectedDecision, setSelectedDecision] = useState<typeof decisions[0] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("הכל")

  const filteredDecisions = decisions.filter(d =>
    activeCategory === "הכל" || d.category === activeCategory
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">יומן החלטות</h1>
            <p className="text-sm text-muted-foreground">מעקב ורפרנס לכל החלטות המוצר</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {decisions.filter(d => d.status === "approved").length} מאושרות
            </Badge>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש החלטות..."
              className="pl-10 bg-background/50 border-border/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="rounded-full"
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Timeline */}
          <div className="lg:col-span-2 space-y-1">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-2 pr-4">
                {filteredDecisions.map((decision, index) => (
                  <div key={decision.id} className="relative">
                    {index < filteredDecisions.length - 1 && (
                      <div className="absolute left-[11px] top-10 bottom-0 w-px bg-border/50" />
                    )}

                    <div
                      className={`cursor-pointer rounded-lg border border-border/50 bg-card/50 p-4 transition-all hover:border-primary/50 ${
                        selectedDecision?.id === decision.id ? "border-primary ring-1 ring-primary/20" : ""
                      }`}
                      onClick={() => setSelectedDecision(decision)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          decision.status === "approved"
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-amber-500 bg-amber-500/10"
                        }`}>
                          {decision.status === "approved" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-sm leading-snug">{decision.title}</h3>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {decision.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{decision.project}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{decision.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Decision Detail */}
          <div className="lg:col-span-3">
            {selectedDecision ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-24">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={`text-xs ${
                            selectedDecision.status === "approved"
                              ? "bg-emerald-500 text-white"
                              : "bg-amber-500 text-white"
                          }`}
                        >
                          {selectedDecision.status === "approved" ? "מאושר" : "ממתין"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {selectedDecision.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{selectedDecision.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {selectedDecision.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {selectedDecision.author}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{selectedDecision.description}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      נימוק
                    </h4>
                    <p className="text-sm text-muted-foreground">{selectedDecision.rationale}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">חלופות שנשקלו</h4>
                    <div className="space-y-2">
                      {selectedDecision.alternatives.map((alt, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Badge variant="outline" className="shrink-0 text-xs">{alt.name}</Badge>
                          <span className="text-muted-foreground">{alt.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">השלכות</h4>
                    <ul className="space-y-1.5">
                      {selectedDecision.implications.map((impl, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {impl}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-primary" />
                      ארטיפקטים מקושרים
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDecision.linkedArtifacts.map((artifact, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-muted gap-1"
                        >
                          {artifact}
                          <ArrowUpRight className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 bg-card/30 backdrop-blur-sm flex items-center justify-center min-h-[500px]">
                <div className="text-center text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">בחר החלטה לצפייה בפרטים</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
