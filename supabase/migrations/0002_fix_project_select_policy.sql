-- Fix: inserting a project with RETURNING failed with
-- "new row violates row-level security policy for table projects".
-- can_view_project() runs its own query, which cannot see the row being
-- inserted in the same statement, so the SELECT policy rejected it.
-- Check ownership directly on the row first.
drop policy if exists "projects select" on public.projects;
create policy "projects select" on public.projects for select
  using (owner_id = auth.uid() or public.can_view_project(id));
