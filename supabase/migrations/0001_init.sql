-- ════════════════════════════════════════════════════════════════════════
-- Lumora Studio — initial schema
-- Run with `supabase db push` or paste into the Supabase SQL editor.
--
-- Document model: a project's pages are stored in `project_pages`, each with a
-- `background` and an ordered `elements` jsonb array (design elements). Elements
-- are stored as JSON within their page rather than as one row per element so a
-- save is a single atomic write and undo/redo snapshots map 1:1 to stored state.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── profiles ───────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- create a profile automatically for each new auth user
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── folders ────────────────────────────────────────────────────────────
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);
create index if not exists folders_owner_idx on public.folders(owner_id);

-- ─── projects ───────────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null default 'Untitled design' check (char_length(name) <= 200),
  width int not null check (width between 16 and 10000),
  height int not null check (height between 16 and 10000),
  category text,
  folder_id uuid references public.folders on delete set null,
  starred boolean not null default false,
  trashed boolean not null default false,
  trashed_at timestamptz,
  thumbnail text check (thumbnail is null or char_length(thumbnail) < 400000),
  revision int not null default 0,
  visibility text not null default 'private' check (visibility in ('private', 'link_view', 'link_edit')),
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_owner_updated_idx on public.projects(owner_id, updated_at desc);

create table if not exists public.project_pages (
  project_id uuid not null references public.projects on delete cascade,
  id text not null,
  position int not null,
  name text,
  background jsonb not null default '{}'::jsonb,
  elements jsonb not null default '[]'::jsonb,
  primary key (project_id, id)
);
create index if not exists project_pages_order_idx on public.project_pages(project_id, position);

-- Collaboration foundation: explicit members (viewer / editor).
-- NOTE: real-time co-editing is NOT implemented yet; members edit with
-- last-write-wins + revision conflict detection.
create table if not exists public.project_members (
  project_id uuid not null references public.projects on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- ─── templates & favourites ─────────────────────────────────────────────
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) <= 200),
  category text not null,
  width int not null,
  height int not null,
  tags text[] not null default '{}',
  pages jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.template_favorites (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  template_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, template_id)
);

-- ─── assets ─────────────────────────────────────────────────────────────
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) <= 200),
  storage_path text not null unique,
  mime text not null check (mime in ('image/png','image/jpeg','image/webp','image/gif','image/svg+xml')),
  size bigint not null check (size > 0 and size <= 15728640),
  width int,
  height int,
  folder text,
  source text not null default 'upload' check (source in ('upload', 'ai', 'photo')),
  created_at timestamptz not null default now()
);
create index if not exists assets_owner_idx on public.assets(owner_id, created_at desc);

-- ════════════════════════════ access helpers ════════════════════════════
create or replace function public.can_view_project(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from projects p where p.id = pid and (
      p.owner_id = auth.uid()
      or exists (select 1 from project_members m where m.project_id = pid and m.user_id = auth.uid())
    )
  );
$$;

create or replace function public.can_edit_project(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from projects p where p.id = pid and (
      p.owner_id = auth.uid()
      or exists (select 1 from project_members m where m.project_id = pid and m.user_id = auth.uid() and m.role = 'editor')
    )
  );
$$;

-- ════════════════════════════ row level security ════════════════════════
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.projects enable row level security;
alter table public.project_pages enable row level security;
alter table public.project_members enable row level security;
alter table public.templates enable row level security;
alter table public.template_favorites enable row level security;
alter table public.assets enable row level security;

create policy "own profile read" on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid());

create policy "own folders" on public.folders for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "projects select" on public.projects for select using (owner_id = auth.uid() or public.can_view_project(id));
create policy "projects insert" on public.projects for insert with check (owner_id = auth.uid());
create policy "projects update" on public.projects for update using (public.can_edit_project(id)) with check (public.can_edit_project(id));
create policy "projects delete" on public.projects for delete using (owner_id = auth.uid());

create policy "pages select" on public.project_pages for select using (public.can_view_project(project_id));
create policy "pages insert" on public.project_pages for insert with check (public.can_edit_project(project_id));
create policy "pages update" on public.project_pages for update using (public.can_edit_project(project_id));
create policy "pages delete" on public.project_pages for delete using (public.can_edit_project(project_id));

create policy "members read" on public.project_members for select
  using (user_id = auth.uid() or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "members manage" on public.project_members for all
  using (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "templates read" on public.templates for select using (owner_id = auth.uid() or is_public);
create policy "templates write" on public.templates for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own favorites" on public.template_favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own assets" on public.assets for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ════════════════════════════ RPCs ═════════════════════════════════════

-- Atomic save of a whole document with optimistic concurrency.
-- Runs as the caller (security invoker), so RLS still applies.
create or replace function public.save_project(
  p_project_id uuid,
  p_name text,
  p_width int,
  p_height int,
  p_category text,
  p_pages jsonb,
  p_expected_revision int,
  p_thumbnail text default null
) returns table (revision int, updated_at timestamptz)
language plpgsql security invoker set search_path = public as $$
declare
  cur_rev int;
  new_rev int;
  ts timestamptz := now();
begin
  if jsonb_typeof(p_pages) <> 'array' or jsonb_array_length(p_pages) = 0 or jsonb_array_length(p_pages) > 200 then
    raise exception 'invalid pages payload';
  end if;
  if octet_length(p_pages::text) > 20000000 then
    raise exception 'document too large';
  end if;

  select pr.revision into cur_rev from projects pr where pr.id = p_project_id for update;
  if not found then raise exception 'project not found or access denied'; end if;
  if cur_rev > p_expected_revision then
    raise exception 'revision_conflict:%', cur_rev using errcode = 'P0409';
  end if;
  new_rev := cur_rev + 1;

  update projects set
    name = left(coalesce(p_name, name), 200),
    width = p_width,
    height = p_height,
    category = p_category,
    thumbnail = coalesce(p_thumbnail, thumbnail),
    revision = new_rev,
    updated_at = ts
  where id = p_project_id;

  delete from project_pages pp
  where pp.project_id = p_project_id
    and pp.id not in (select x->>'id' from jsonb_array_elements(p_pages) x);

  insert into project_pages (project_id, id, position, name, background, elements)
  select p_project_id, x.value->>'id', (x.ordinality - 1)::int, x.value->>'name',
         coalesce(x.value->'background', '{}'::jsonb), coalesce(x.value->'elements', '[]'::jsonb)
  from jsonb_array_elements(p_pages) with ordinality as x(value, ordinality)
  on conflict (project_id, id) do update set
    position = excluded.position, name = excluded.name,
    background = excluded.background, elements = excluded.elements;

  return query select new_rev, ts;
end $$;

-- Public, read-only access to a project shared by link (no auth required).
create or replace function public.get_shared_project(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'name', p.name, 'width', p.width, 'height', p.height,
    'visibility', p.visibility, 'owner_id', p.owner_id, 'updated_at', p.updated_at,
    'pages', coalesce((
      select jsonb_agg(jsonb_build_object('id', pg.id, 'name', pg.name, 'background', pg.background, 'elements', pg.elements) order by pg.position)
      from project_pages pg where pg.project_id = p.id
    ), '[]'::jsonb)
  )
  from projects p
  where p.share_token = p_token and p.visibility <> 'private' and not p.trashed
  limit 1;
$$;
grant execute on function public.get_shared_project(text) to anon, authenticated;

-- A signed-in user who opens an edit link becomes an editor member.
create or replace function public.join_shared_project(p_token text) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid; vis text; owner uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select id, visibility, owner_id into pid, vis, owner from projects where share_token = p_token and not trashed;
  if pid is null or vis = 'private' then raise exception 'link not valid'; end if;
  if owner <> auth.uid() then
    insert into project_members (project_id, user_id, role)
    values (pid, auth.uid(), case when vis = 'link_edit' then 'editor' else 'viewer' end)
    on conflict (project_id, user_id) do update set role = excluded.role;
  end if;
  return pid;
end $$;
grant execute on function public.join_shared_project(text) to authenticated;

-- ════════════════════════════ storage ═══════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assets', 'assets', false, 15728640, array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Objects live under `<user id>/…`; users can only touch their own prefix.
create policy "assets read own" on storage.objects for select
  using (bucket_id = 'assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "assets insert own" on storage.objects for insert
  with check (bucket_id = 'assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "assets delete own" on storage.objects for delete
  using (bucket_id = 'assets' and (storage.foldername(name))[1] = auth.uid()::text);
