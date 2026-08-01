-- Fit Log — Phase 1 schema: profiles + goals.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. Keyed by auth.users.id.';

grant select, insert, update on public.profiles to authenticated;

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- No delete policy: soft delete only.

create table if not exists public.goals (
  id                text primary key,

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

  version           integer not null default 1,

  payload           jsonb not null default '{}'::jsonb,
  source_metadata   jsonb not null default '{}'::jsonb,

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

grant select, insert, update on public.goals to authenticated;

alter table public.goals enable row level security;

create policy goals_select_own on public.goals
  for select using (auth.uid() = user_id);

create policy goals_insert_own on public.goals
  for insert with check (auth.uid() = user_id);

create policy goals_update_own on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- No delete policy: soft delete only (status = 'trashed').

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
