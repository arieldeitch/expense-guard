-- Fit Log — Phase 1 schema: profiles + goals.
--
-- Deliberately minimal. This is NOT the full 30-entity model in
-- src/lib/migration/cloudSchema.ts. Only the goals flow is cloud-backed in
-- Phase 1; sessions, runs, templates, catalog and exercises stay local-only
-- until a later phase maps them.
--
-- Rules enforced here (AGENTS.md):
--   * RLS is enabled in the SAME migration that creates each table.
--   * Every user-owned row is scoped by auth.uid().
--   * GRANT + RLS + policies live in this one file.
--   * NO delete policy is created. Deletion is impossible through the API;
--     removal is expressed as status = 'trashed' (soft delete only).
--   * numeric, never float, for every meaningful number.
--
-- Record identity: `id` is the stable id that already exists in localStorage
-- and in the backup envelope. It is never regenerated. Ownership is decided
-- server-side by auth.uid(); any owner value carried in from a local file is
-- kept only under source_metadata and is never an authorisation authority.

-- ---------------------------------------------------------------- profiles --

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. Keyed by auth.users.id.';

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- No delete policy: soft delete only.

grant select, insert, update on public.profiles to authenticated;

-- ------------------------------------------------------------------- goals --

create table if not exists public.goals (
  -- Stable id from localStorage / the backup envelope. Never regenerated.
  id                text primary key,

  -- Sole authorisation authority. Defaults to the caller so a client can never
  -- insert a row owned by somebody else even if it tries to set user_id.
  user_id           uuid not null default auth.uid()
                      references auth.users (id) on delete cascade,

  domain            text not null check (domain in ('running', 'gym', 'home')),
  goal_type         text not null,
  name              text not null,
  status            text not null,

  priority          integer not null default 1,
  is_primary        boolean not null default false,

  target_value      numeric,
  target_unit       text,
  current_value     numeric,

  -- Local record version. Monotonic per goal, set by the client.
  version           integer not null default 1,

  -- Full local record, so a round-trip is lossless while the column set stays
  -- minimal. Phase 2 can promote fields out of here without a data migration.
  payload           jsonb not null default '{}'::jsonb,

  -- Documentation only. Never consulted for permission decisions.
  source_metadata   jsonb not null default '{}'::jsonb,

  -- Sync support.
  content_checksum  text,
  op_id             text,
  client_created_at timestamptz,
  client_updated_at timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.goals is
  'User goals. id is the stable local id; ownership is auth.uid() only.';
comment on column public.goals.payload is
  'Full local goal record for lossless round-trip.';
comment on column public.goals.op_id is
  'Deterministic operation id of the import that last wrote this row.';

create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists goals_user_domain_idx on public.goals (user_id, domain);

alter table public.goals enable row level security;

create policy goals_select_own on public.goals
  for select using (auth.uid() = user_id);

create policy goals_insert_own on public.goals
  for insert with check (auth.uid() = user_id);

create policy goals_update_own on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- No delete policy: soft delete only (status = 'trashed').

grant select, insert, update on public.goals to authenticated;

-- ------------------------------------------------------------ updated_at ----

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists goals_touch_updated_at on public.goals;
create trigger goals_touch_updated_at
  before update on public.goals
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------- profile on signup --------

-- Deliberately NOT done with a trigger on auth.users.
--
-- The usual Supabase recipe adds an `after insert on auth.users` trigger. That
-- is a schema modification of auth.users, which the project's standing rules
-- forbid outright. It also needs security definer, which widens the blast
-- radius for a row the client can create perfectly well on its own.
--
-- Instead the client calls ensureProfile() right after a successful sign-in
-- (src/lib/supabase/session.ts). It upserts `id = auth.uid()`, which the
-- profiles_insert_own policy already permits, and is idempotent. auth.users is
-- never written to by this project.
