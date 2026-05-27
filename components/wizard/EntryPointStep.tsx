'use client'

import { Lightbulb, FileText, Code2, Hammer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type EntryPoint = 'idea' | 'has_prd' | 'has_code' | 'mid_build'

interface Props {
  onSelect: (entry: EntryPoint) => void
}

const OPTIONS: Array<{
  id: EntryPoint
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}> = [
  {
    id: 'idea',
    icon: Lightbulb,
    title: 'יש לי רעיון',
    description: 'AI יעזור לי לעצב אותו, לכתוב PRD, ולתכנן ארכיטקטורה',
  },
  {
    id: 'has_prd',
    icon: FileText,
    title: 'יש לי PRD קיים',
    description: 'כתבתי מסמך דרישות בנוטיון / גוגל דוק / מקום אחר — רוצה לייבא אותו',
  },
  {
    id: 'has_code',
    icon: Code2,
    title: 'יש לי קוד קיים',
    description: 'הפרויקט כבר קיים, אני רוצה לנהל אותו ב-Tandem',
  },
  {
    id: 'mid_build',
    icon: Hammer,
    title: 'אני כבר בבנייה',
    description: 'אני עובד עם AI — רוצה רק Mission Briefs ו-Return Briefs',
  },
]

export function EntryPointStep({ onSelect }: Props) {
  return (
    <div className="space-y-3 py-2">
      <p className="text-sm text-muted-foreground mb-4">איפה אתה עכשיו?</p>
      {OPTIONS.map(({ id, icon: Icon, title, description }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className="w-full text-right rounded-lg border border-border p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-start gap-3 group"
        >
          <div className="rounded-md bg-muted p-2 shrink-0 group-hover:bg-primary/10 transition-colors">
            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
