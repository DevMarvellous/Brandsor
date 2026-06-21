-- Brandsor initial schema (Supabase / Postgres)
-- Run this in the Supabase SQL editor (or via the CLI) on a fresh project.

-- ============================================================
-- 1) Profiles (1:1 with auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  generation_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic generation counter (usage analytics only; not a paywall).
create or replace function public.increment_generation_count(p_uid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set generation_count = generation_count + 1 where id = p_uid;
$$;

-- ============================================================
-- 2) Saved names
-- ============================================================
create table if not exists public.saved_names (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  tagline text not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_names_user_created_idx
  on public.saved_names (user_id, created_at desc);

alter table public.saved_names enable row level security;

create policy "Saved names are manageable by owner"
  on public.saved_names for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 3) Feedback  (written by service role only; RLS on, no public policies)
-- ============================================================
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;
