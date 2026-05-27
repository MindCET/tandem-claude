"use client"

import { useState } from "react"
import {
  History,
  Search,
  FileText,
  GitBranch,
  Compass,
  Database,
  Clock,
  Layers,
  ArrowUpRight,
  Brain
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

const memoryArtifacts = {
  productBrief: {
    id: "brief",
    title: "תדריך מוצר",
    icon: FileText,
    lastUpdated: "לפני יומיים",
    version: "1.3",
    summary: "דשבורד אנליטיקה SaaS לעסקים קטנים למעקב אחר מדדי מפתח וקבלת החלטות מונעת נתונים.",
    content: {
      problemStatement: "לעסקים קטנים חסרים כלי אנליטיקה נגישים וקלים לשימוש. פתרונות ארגוניים מורכבים ויקרים מדי.",
      targetUsers: "בעלי עסקים קטנים, מנהלי שיווק, אחראי תפעול בחברות של 10-50 עובדים",
      coreValue: "תובנות פשוטות וניתנות לפעולה ממקורות נתונים מחוברים ללא מומחיות טכנית",
      successMetrics: ["זמן לתובנה ראשונה < 5 דקות", "שיעור שימוש יומי פעיל > 40%", "NPS > 50"]
    }
  },
  prd: {
    id: "prd",
    title: "PRD",
    icon: FileText,
    lastUpdated: "לפני יום",
    version: "2.1",
    summary: "דרישות מוצר מלאות כולל user stories, קריטריוני קבלה וגבולות היקף.",
    sections: [
      { name: "User Stories", count: 24 },
      { name: "קריטריוני קבלה", count: 48 },
      { name: "דרישות לא-פונקציונליות", count: 12 },
      { name: "מחוץ להיקף", count: 8 }
    ]
  },
  architecture: {
    id: "arch",
    title: "מפת ארכיטקטורה",
    icon: Layers,
    lastUpdated: "לפני 3 ימים",
    version: "1.2",
    summary: "ארכיטקטורת מערכת כולל frontend, backend, בסיס נתונים ואינטגרציות חיצוניות.",
    components: [
      { name: "Next.js Frontend", status: "פעיל" },
      { name: "Supabase Backend", status: "פעיל" },
      { name: "PostgreSQL Database", status: "פעיל" },
      { name: "Stripe Payments", status: "מתוכנן" },
      { name: "Analytics Pipeline", status: "מתוכנן" }
    ]
  },
  dataModel: {
    id: "data",
    title: "מודל נתונים",
    icon: Database,
    lastUpdated: "לפני 4 ימים",
    version: "1.1",
    summary: "תרשים יחסי ישויות ותיעוד סכמת בסיס הנתונים.",
    entities: [
      { name: "users", fields: 8 },
      { name: "organizations", fields: 6 },
      { name: "projects", fields: 12 },
      { name: "metrics", fields: 15 },
      { name: "dashboards", fields: 10 }
    ]
  }
}

const recentChanges = [
  {
    id: "c1",
    artifact: "PRD",
    change: "נוסף user story לשיתוף דשבורד",
    timestamp: "לפני שעתיים",
    author: "Tandem AI"
  },
  {
    id: "c2",
    artifact: "ארכיטקטורה",
    change: "עודכן זרימת auth לכלול OAuth providers",
    timestamp: "לפני יום",
    author: "משתמש"
  },
  {
    id: "c3",
    artifact: "מודל נתונים",
    change: "נוסף soft delete לכל הישויות",
    timestamp: "לפני יומיים",
    author: "Tandem AI"
  },
  {
    id: "c4",
    artifact: "תדריך מוצר",
    change: "עודן פלח משתמשי היעד",
    timestamp: "לפני 3 ימים",
    author: "משתמש"
  },
]

const contextGraph = {
  nodes: [
    { id: "brief", label: "תדריך מוצר", x: 30, y: 50 },
    { id: "prd", label: "PRD", x: 180, y: 30 },
    { id: "arch", label: "ארכיטקטורה", x: 180, y: 100 },
    { id: "data", label: "מודל נתונים", x: 340, y: 50 },
    { id: "decisions", label: "החלטות", x: 340, y: 120 },
    { id: "missions", label: "משימות", x: 490, y: 70 },
  ],
  edges: [
    { from: "brief", to: "prd" },
    { from: "brief", to: "arch" },
    { from: "prd", to: "data" },
    { from: "arch", to: "data" },
    { from: "prd", to: "decisions" },
    { from: "arch", to: "decisions" },
    { from: "data", to: "missions" },
    { from: "decisions", to: "missions" },
  ]
}

export default function MemoryPage() {
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>("brief")

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">זיכרון פרויקט</h1>
            <p className="text-sm text-muted-foreground">תיעוד חי וגרף קונטקסט</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש בזיכרון..."
                className="pl-10 bg-background/50 border-border/50 w-64"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Context Map Visualization */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                גרף קונטקסט
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                6 ארטיפקטים מחוברים
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-48 bg-muted/20 rounded-lg border border-border/30">
              <svg className="w-full h-full" viewBox="0 0 600 180">
                {contextGraph.edges.map((edge, i) => {
                  const from = contextGraph.nodes.find(n => n.id === edge.from)!
                  const to = contextGraph.nodes.find(n => n.id === edge.to)!
                  return (
                    <line
                      key={i}
                      x1={from.x + 55}
                      y1={from.y + 15}
                      x2={to.x}
                      y2={to.y + 15}
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-border/50"
                    />
                  )
                })}
                {contextGraph.nodes.map((node) => (
                  <g key={node.id} className="cursor-pointer" onClick={() => setSelectedArtifact(node.id)}>
                    <rect
                      x={node.x}
                      y={node.y}
                      width="90"
                      height="30"
                      rx="6"
                      fill="currentColor"
                      className={`${selectedArtifact === node.id ? "text-primary" : "text-muted/50"} transition-colors`}
                    />
                    <text
                      x={node.x + 45}
                      y={node.y + 19}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="10"
                      className={`font-medium ${selectedArtifact === node.id ? "text-primary-foreground" : "text-foreground"}`}
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Artifacts List */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium mb-4">ארטיפקטים מרכזיים</h2>
            {Object.values(memoryArtifacts).map((artifact) => (
              <Card
                key={artifact.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedArtifact === artifact.id ? "border-primary ring-1 ring-primary/20" : "border-border/50"
                } bg-card/50`}
                onClick={() => setSelectedArtifact(artifact.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <artifact.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{artifact.title}</h3>
                        <Badge variant="outline" className="text-xs">v{artifact.version}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{artifact.summary}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>עודכן {artifact.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Artifact Detail */}
          <div className="lg:col-span-2">
            {selectedArtifact === "brief" && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">v{memoryArtifacts.productBrief.version}</Badge>
                        <span className="text-xs text-muted-foreground">עודכן {memoryArtifacts.productBrief.lastUpdated}</span>
                      </div>
                      <CardTitle className="text-lg">{memoryArtifacts.productBrief.title}</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      ערוך
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">הגדרת הבעיה</h4>
                    <p className="text-sm text-muted-foreground">{memoryArtifacts.productBrief.content.problemStatement}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">משתמשי יעד</h4>
                    <p className="text-sm text-muted-foreground">{memoryArtifacts.productBrief.content.targetUsers}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">הצעת ערך מרכזית</h4>
                    <p className="text-sm text-muted-foreground">{memoryArtifacts.productBrief.content.coreValue}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">מדדי הצלחה</h4>
                    <ul className="space-y-1.5">
                      {memoryArtifacts.productBrief.content.successMetrics.map((metric, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedArtifact === "prd" && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">v{memoryArtifacts.prd.version}</Badge>
                        <span className="text-xs text-muted-foreground">עודכן {memoryArtifacts.prd.lastUpdated}</span>
                      </div>
                      <CardTitle className="text-lg">{memoryArtifacts.prd.title}</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      ערוך
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{memoryArtifacts.prd.summary}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {memoryArtifacts.prd.sections.map((section) => (
                      <div key={section.name} className="rounded-lg border border-border/50 p-3 bg-background/50">
                        <p className="text-2xl font-bold">{section.count}</p>
                        <p className="text-xs text-muted-foreground">{section.name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedArtifact === "arch" && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">v{memoryArtifacts.architecture.version}</Badge>
                        <span className="text-xs text-muted-foreground">עודכן {memoryArtifacts.architecture.lastUpdated}</span>
                      </div>
                      <CardTitle className="text-lg">{memoryArtifacts.architecture.title}</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      ערוך
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{memoryArtifacts.architecture.summary}</p>
                  <div className="space-y-2">
                    {memoryArtifacts.architecture.components.map((comp) => (
                      <div key={comp.name} className="flex items-center justify-between rounded-lg border border-border/50 p-3 bg-background/50">
                        <span className="text-sm font-medium">{comp.name}</span>
                        <Badge variant={comp.status === "פעיל" ? "default" : "secondary"} className="text-xs">
                          {comp.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedArtifact === "data" && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">v{memoryArtifacts.dataModel.version}</Badge>
                        <span className="text-xs text-muted-foreground">עודכן {memoryArtifacts.dataModel.lastUpdated}</span>
                      </div>
                      <CardTitle className="text-lg">{memoryArtifacts.dataModel.title}</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      ערוך
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{memoryArtifacts.dataModel.summary}</p>
                  <div className="space-y-2">
                    {memoryArtifacts.dataModel.entities.map((entity) => (
                      <div key={entity.name} className="flex items-center justify-between rounded-lg border border-border/50 p-3 bg-background/50">
                        <code className="text-sm font-mono text-primary">{entity.name}</code>
                        <span className="text-xs text-muted-foreground">{entity.fields} שדות</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Changes */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">שינויים אחרונים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentChanges.map((change) => (
                    <div key={change.id} className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">{change.artifact}:</span> {change.change}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {change.author} • {change.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
