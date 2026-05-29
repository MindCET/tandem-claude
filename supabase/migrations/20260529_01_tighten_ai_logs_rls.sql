-- Tighten ai_logs RLS.
--
-- The original policies allowed any authenticated user to read and insert
-- rows where project_id is null ("system-level logs"). That let users read
-- each other's null-project logs and forge log rows — a cross-tenant leak.
--
-- All AI logging in the app is project-scoped, so we drop the null-project
-- allowance and require project ownership for both select and insert.

drop policy if exists "ai_logs: select own or system" on public.ai_logs;
drop policy if exists "ai_logs: insert own or system" on public.ai_logs;

create policy "ai_logs: select own"
  on public.ai_logs for select
  using (
    exists (
      select 1 from public.projects
      where id = project_id and user_id = auth.uid()
    )
  );

create policy "ai_logs: insert own"
  on public.ai_logs for insert
  with check (
    exists (
      select 1 from public.projects
      where id = project_id and user_id = auth.uid()
    )
  );
