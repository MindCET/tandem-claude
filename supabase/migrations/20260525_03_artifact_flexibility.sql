-- =====================================================================
-- Tandem — Artifact Flexibility Migration
-- Adds versioning, import source, skip support to artifacts table
-- =====================================================================

ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'user_created',
  ADD COLUMN IF NOT EXISTS skip_reason text,
  ADD COLUMN IF NOT EXISTS completeness_score integer DEFAULT 0;

-- artifact_versions: full history of every artifact edit
CREATE TABLE IF NOT EXISTS public.artifact_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  content_markdown text,
  version integer NOT NULL,
  changed_by text DEFAULT 'user', -- 'user' | 'ai_suggestion' | 'return_brief'
  change_summary text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS artifact_versions_artifact_id_idx ON public.artifact_versions(artifact_id);

-- RLS for artifact_versions (inherit project ownership via artifact)
ALTER TABLE public.artifact_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their own artifacts"
  ON public.artifact_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artifacts a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.id = artifact_versions.artifact_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert versions of their own artifacts"
  ON public.artifact_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artifacts a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.id = artifact_versions.artifact_id
        AND p.user_id = auth.uid()
    )
  );
