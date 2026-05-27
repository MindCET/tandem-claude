'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArtifactViewer } from './ArtifactViewer'
import { Pencil, Eye, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Props {
  artifactId: string
  title: string
  type: string
  status: string
  markdown: string
  version: number
  updatedAt: string
  onSaved?: (newMarkdown: string, newVersion: number) => void
}

export function EditableArtifact({
  artifactId,
  title,
  type,
  status,
  markdown: initialMarkdown,
  version: initialVersion,
  updatedAt,
  onSaved,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialMarkdown)
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const [version, setVersion] = useState(initialVersion)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  async function handleSave() {
    if (!draft.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const newVersion = version + 1

      // Save current content as a version snapshot before overwriting
      await supabase.from('artifact_versions').insert({
        artifact_id: artifactId,
        content_markdown: markdown,
        version,
        changed_by: 'user',
        change_summary: null,
      })

      // Update artifact with new content
      const { error } = await supabase
        .from('artifacts')
        .update({
          content_markdown: draft,
          version: newVersion,
          updated_at: now,
        })
        .eq('id', artifactId)

      if (error) throw new Error(error.message)

      setMarkdown(draft)
      setVersion(newVersion)
      setEditing(false)
      onSaved?.(draft, newVersion)
      toast({ title: 'עודכן', description: 'Mission Brief הבא יכלול את השינויים.' })
    } catch (err) {
      toast({
        title: 'שגיאה',
        description: err instanceof Error ? err.message : 'שגיאה בשמירה',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function handleEditToggle() {
    if (!editing) {
      setDraft(markdown)
    }
    setEditing((v) => !v)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditToggle}
          className="gap-1"
        >
          {editing ? (
            <><Eye className="h-3.5 w-3.5" />תצוגה</>
          ) : (
            <><Pencil className="h-3.5 w-3.5" />ערוך</>
          )}
        </Button>
        {editing && (
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
            {saving
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />שומר...</>
              : <><Save className="h-3.5 w-3.5" />שמור</>
            }
          </Button>
        )}
      </div>

      {editing ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[500px] font-mono text-sm"
          dir="ltr"
          placeholder="Markdown..."
        />
      ) : (
        <ArtifactViewer
          title={title}
          type={type}
          status={status}
          markdown={markdown}
          version={version}
          updatedAt={updatedAt}
        />
      )}
    </div>
  )
}
