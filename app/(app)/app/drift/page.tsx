"use client"

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  FileText,
  Code,
  Database,
  Shield,
  Zap,
  Eye,
  GitCompare
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const driftAlerts = [
  {
    id: "drift1",
    title: "מימוש האימות שונה מהמפרט",
    severity: "high",
    category: "ארכיטקטורה",
    project: "SaaS Dashboard",
    detectedAt: "לפני שעתיים",
    description: "תדריך החזרה מציין שמומש OAuth, אך ה-PRD מגדיר magic links בלבד.",
    expected: "אימות magic link באמצעות Supabase Auth עם אימות אימייל",
    actual: "אימות OAuth עם Google ו-GitHub מומש",
    affectedArtifacts: ["PRD סעיף 4.2", "מסמך ארכיטקטורה - Auth Flow", "תדריך משימה #12"],
    suggestions: [
      "עדכן PRD לשקף את החלטת OAuth",
      "רשום החלטה חדשה להוספת OAuth",
      "ודא שהשלכות האבטחה מתועדות"
    ],
    status: "unresolved"
  },
  {
    id: "drift2",
    title: "תלות חדשה נוספה ללא תיעוד",
    severity: "medium",
    category: "תלויות",
    project: "Mobile App MVP",
    detectedAt: "לפני יום",
    description: "חבילת \"react-native-reanimated\" נוספה אך לא נרשמה ביומן ההחלטות.",
    expected: "כל התלויות צריכות להיות מתועדות עם נימוק ביומן ההחלטות",
    actual: "תלות נוספה בתדריך חזרה ללא רשומת החלטה תואמת",
    affectedArtifacts: ["מסמך תלויות", "תדריך חזרה #8"],
    suggestions: [
      "רשום החלטה עבור react-native-reanimated",
      "תעד את דרישות האנימציה שהובילו לכך",
      "עדכן מסמך ארכיטקטורה עם גישת האנימציה"
    ],
    status: "unresolved"
  },
  {
    id: "drift3",
    title: "חוסר עקביות בשמות endpoints של API",
    severity: "low",
    category: "דפוסים",
    project: "E-commerce Platform",
    detectedAt: "לפני 3 ימים",
    description: "endpoints חדשים משתמשים ב-camelCase בעוד endpoints קיימים משתמשים ב-snake_case.",
    expected: "שמות snake_case עקביים בכל endpoints של ה-API",
    actual: "שמות מעורבים: /api/get_products לעומת /api/getUserCart",
    affectedArtifacts: ["מפרט API", "מסמך דפוסים"],
    suggestions: [
      "שנה שם endpoints חדשים ל-snake_case",
      "הוסף כלל linting לשמות endpoints",
      "עדכן תיעוד API"
    ],
    status: "resolved"
  },
]

const alignmentScore = {
  overall: 87,
  categories: [
    { name: "ארכיטקטורה", score: 92, icon: Database },
    { name: "דפוסים", score: 78, icon: Code },
    { name: "אבטחה", score: 95, icon: Shield },
    { name: "ביצועים", score: 85, icon: Zap },
    { name: "תיעוד", score: 82, icon: FileText },
  ]
}

const severityColors = {
  high: "text-destructive border-destructive/30 bg-destructive/5",
  medium: "text-amber-500 border-amber-500/30 bg-amber-500/5",
  low: "text-muted-foreground border-border/50 bg-muted/30"
}

const severityIcons = {
  high: XCircle,
  medium: AlertTriangle,
  low: AlertTriangle
}

const severityLabels = {
  high: "גבוה",
  medium: "בינוני",
  low: "נמוך"
}

export default function DriftPage() {
  const [selectedAlert, setSelectedAlert] = useState<typeof driftAlerts[0] | null>(null)

  const unresolvedCount = driftAlerts.filter(d => d.status === "unresolved").length

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">זיהוי סטייה</h1>
            <p className="text-sm text-muted-foreground">מעקב אחר יישור בין מפרטים למימוש</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              הרץ ניתוח
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Alignment Score */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid gap-6 lg:grid-cols-6">
              <div className="lg:col-span-2 flex flex-col items-center justify-center text-center border-r border-border/50 pr-6">
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted/30"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${alignmentScore.overall * 3.52} 352`}
                      className="text-primary transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <span className="text-4xl font-bold">{alignmentScore.overall}</span>
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium">ציון יישור</p>
                <p className="text-xs text-muted-foreground">בכל הפרויקטים</p>
              </div>

              <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                {alignmentScore.categories.map((cat) => (
                  <div key={cat.name} className="text-center">
                    <div className={`mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${
                      cat.score >= 90 ? "bg-emerald-500/10 text-emerald-500" :
                      cat.score >= 80 ? "bg-primary/10 text-primary" :
                      "bg-amber-500/10 text-amber-500"
                    }`}>
                      <cat.icon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{cat.score}%</p>
                    <p className="text-xs text-muted-foreground">{cat.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drift Alerts */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium">התראות פעילות</h2>
              <Badge variant="destructive" className="text-xs">
                {unresolvedCount} לא פתורות
              </Badge>
            </div>

            {driftAlerts.map((alert) => {
              const SeverityIcon = severityIcons[alert.severity as keyof typeof severityIcons]
              return (
                <Card
                  key={alert.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedAlert?.id === alert.id ? "border-primary ring-1 ring-primary/20" : "border-border/50"
                  } ${alert.status === "resolved" ? "opacity-60" : ""}`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-md ${severityColors[alert.severity as keyof typeof severityColors]}`}>
                        <SeverityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm leading-snug">{alert.title}</h3>
                          {alert.status === "resolved" && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {severityLabels[alert.severity as keyof typeof severityLabels]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{alert.project}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{alert.detectedAt}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Alert Detail */}
          <div className="lg:col-span-3">
            {selectedAlert ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={`text-xs ${
                            selectedAlert.severity === "high" ? "bg-destructive text-white" :
                            selectedAlert.severity === "medium" ? "bg-amber-500 text-white" :
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          חומרה: {severityLabels[selectedAlert.severity as keyof typeof severityLabels]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {selectedAlert.category}
                        </Badge>
                        {selectedAlert.status === "resolved" && (
                          <Badge className="bg-emerald-500 text-white text-xs">
                            נפתר
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{selectedAlert.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">{selectedAlert.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                      <div className="flex items-center gap-2 mb-2 text-emerald-500">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">צפוי (מפרט)</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedAlert.expected}</p>
                    </div>
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                      <div className="flex items-center gap-2 mb-2 text-destructive">
                        <Code className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">בפועל (מימוש)</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedAlert.actual}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">ארטיפקטים מושפעים</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAlert.affectedArtifacts.map((artifact, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {artifact}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">פעולות מוצעות</h4>
                    <ul className="space-y-2">
                      {selectedAlert.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedAlert.status !== "resolved" && (
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <Button className="flex-1 gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        סמן כנפתר
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Eye className="h-4 w-4" />
                        סקור הפרשים
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <GitCompare className="h-4 w-4" />
                        עדכן מפרט
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 bg-card/30 backdrop-blur-sm flex items-center justify-center min-h-[500px]">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">בחר התראה לצפייה בפרטים</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
