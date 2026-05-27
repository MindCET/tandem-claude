"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Zap, Clipboard, ArrowDownCircle, ClipboardList, CornerDownLeft, Download, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { CompanionMessage, type CompanionMessageData } from "./CompanionMessage"
import { CompanionInput } from "./CompanionInput"

interface CompanionPanelProps {
  open: boolean
  onClose: () => void
  projectId?: string
  projectName?: string
}

const QUICK_ACTIONS = [
  { label: "Mission Prompt", icon: ClipboardList, message: "תייצר לי mission prompt למשימה הנוכחית" },
  { label: "Return Prompt",  icon: CornerDownLeft, message: "תייצר לי return prompt לסוף הסשן" },
  { label: "הדבק סיכום",    icon: Download,       message: "רוצה להדביק סיכום סשן" },
  { label: "מה הלאה?",      icon: HelpCircle,     message: "מה הצעד הבא שאני צריך לעשות בפרויקט?" },
]

export function CompanionPanel({ open, onClose, projectId, projectName }: CompanionPanelProps) {
  const [messages, setMessages] = useState<CompanionMessageData[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [awaitingIngestion, setAwaitingIngestion] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: projectName
            ? `שלום! אני Tandem Companion 👋\n\nאני כאן לעזור לך עם הפרויקט **${projectName}**.\n\nאני יכול:\n• להמליץ על הכלי הנכון לכל משימה\n• לייצר mission prompt מותאם לפלטפורמה\n• לייצר return prompt לסוף הסשן\n• לקלוט סיכום סשן ולשמור החלטות לזיכרון המוצר\n\nמה תרצה לעשות?`
            : `שלום! אני Tandem Companion 👋\n\nבחר פרויקט כדי שאוכל לטעון את הקונטקסט שלו, או שאל אותי שאלה כללית על תהליך הפיתוח.`,
        },
      ])
    }
  }, [open, projectName])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(text?: string) {
    const content = text ?? input.trim()
    if (!content || isLoading) return

    const userMsg: CompanionMessageData = {
      id: Date.now().toString(),
      role: "user",
      content,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    // Detect if user is pasting a summary
    const isPastingSummary =
      awaitingIngestion ||
      content.length > 200 ||
      content.toLowerCase().includes("completed work") ||
      content.includes("**Completed") ||
      content.includes("## ")

    try {
      if (isPastingSummary && projectId) {
        await handleIngestion(content)
      } else {
        await handleChat(content, userMsg)
      }
    } finally {
      setIsLoading(false)
      setAwaitingIngestion(false)
    }
  }

  async function handleChat(content: string, userMsg: CompanionMessageData) {
    const apiMessages = [
      ...messages.filter((m) => m.id !== "welcome" && m.content.trim() !== ""),
      userMsg,
    ].map((m) => ({ role: m.role, content: m.content }))

    const response = await fetch("/api/ai/companion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages, projectId }),
    })

    if (!response.ok || !response.body) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "שגיאה — נסה שוב." },
      ])
      return
    }

    // Stream response
    const assistantId = Date.now().toString()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ])

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fullText += decoder.decode(value, { stream: true })
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: fullText } : m
        )
      )
    }

    // If response mentions pasting summary, set ingestion mode
    if (
      fullText.includes("הדבק") ||
      fullText.includes("paste") ||
      fullText.includes("summary")
    ) {
      setAwaitingIngestion(true)
    }
  }

  async function handleIngestion(rawSummary: string) {
    if (!projectId) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "כדי לשמור לזיכרון המוצר, צריך לבחור פרויקט קודם.",
        },
      ])
      return
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "מנתח את הסיכום ושומר לזיכרון המוצר... ⏳",
      },
    ])

    const response = await fetch("/api/ai/companion/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawSummary, projectId }),
    })

    const result = await response.json()

    if (!response.ok) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: `שגיאה: ${result.error}` },
      ])
      return
    }

    const { parsed } = result
    const savedMsg = [
      "✅ **הסיכום נשמר לזיכרון המוצר**",
      "",
      parsed.completed_work?.length
        ? `**עבודה שהושלמה:**\n${parsed.completed_work.map((w: string) => `• ${w}`).join("\n")}`
        : "",
      parsed.decisions?.length
        ? `\n**החלטות שנשמרו (${parsed.decisions.length}):**\n${parsed.decisions.map((d: { title: string }) => `• ${d.title}`).join("\n")}`
        : "",
      parsed.risks?.length
        ? `\n**סיכונים שנרשמו (${parsed.risks.length}):**\n${parsed.risks.map((r: { title: string }) => `• ${r.title}`).join("\n")}`
        : "",
      parsed.recommended_next_step
        ? `\n**צעד הבא:** ${parsed.recommended_next_step}`
        : "",
    ]
      .filter(Boolean)
      .join("\n")

    setMessages((prev) => [
      ...prev.slice(0, -1), // remove "מנתח..." message
      { id: Date.now().toString(), role: "assistant", content: savedMsg },
    ])
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[420px] max-w-full flex flex-col p-0 gap-0"
      >
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 border border-primary/30">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-sm font-semibold leading-none">Tandem Companion</SheetTitle>
              {projectName && (
                <p className="text-xs text-muted-foreground mt-0.5">{projectName}</p>
              )}
            </div>
          </div>
          {awaitingIngestion && (
            <Badge variant="secondary" className="text-xs gap-1">
              <ArrowDownCircle className="h-3 w-3" />
              מצב קליטה
            </Badge>
          )}
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <CompanionMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-[10px] font-bold mt-0.5">
                T
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-border/50 flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.message)}
              disabled={isLoading}
              className="cursor-pointer flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <action.icon className="h-3 w-3 shrink-0" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-border/50 shrink-0">
          <CompanionInput
            value={input}
            onChange={setInput}
            onSubmit={() => sendMessage()}
            isLoading={isLoading}
            placeholder={
              awaitingIngestion
                ? "הדבק כאן את הסיכום מהפלטפורמה..."
                : "שאל שאלה, בקש פרומפט, או הדבק סיכום סשן..."
            }
          />
          {awaitingIngestion && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Clipboard className="h-3 w-3" />
              הדבק את הסיכום שקיבלת מהפלטפורמה
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
