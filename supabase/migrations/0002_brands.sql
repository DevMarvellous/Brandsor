-- Brandsor brands schema (Phase 2): brands, assets, brand_snapshots.
-- Run this in the Supabase SQL editor on top of 0001_init.sql.
--
-- Design: denormalized. One `brands` row holds the whole brand `state` (palette,
-- typography, guidelines TipTap JSON, current logo asset id) as JSONB. Assets are
-- immutable rows referencing Storage objects. A snapshot is a cheap immutable copy
-- of `state`. See CLAUDE.md "Brand data model" for the full rationale.

-- ============================================================
-- shared: bump updated_at on row update
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1) Brands
-- ============================================================
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  is_public boolean not null default false,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dashboard read path: a user's brands, most-recently-touched first.
create index if not exists brands_owner_updated_idx
  on public.brands (owner_id, updated_at desc);

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

alter table public.brands enable row level security;

-- The entire public/private toggle. A request for a private (or nonexistent) brand
-- returns no row, which the app renders as a 404 (never 403 — don't leak existence).
create policy "Brands are viewable if public or owned"
  on public.brands for select
  using (is_public or owner_id = auth.uid());

create policy "Brands are insertable by owner"
  on public.brands for insert
  with check (owner_id = auth.uid());

create policy "Brands are updatable by owner"
  on public.brands for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Brands are deletable by owner"
  on public.brands for delete
  using (owner_id = auth.uid());

-- ============================================================
-- 2) Assets (immutable; reference Storage objects, never embed binaries)
-- ============================================================
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  size_bytes integer,
  created_at timestamptz not null default now()
);

create index if not exists assets_brand_idx on public.assets (brand_id);

alter table public.assets enable row level security;

-- Viewable by the owner, or by anyone if the parent brand is public (so the public
-- profile can resolve a brand's logo asset).
create policy "Assets viewable if owner or brand public"
  on public.assets for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.brands b
      where b.id = assets.brand_id and b.is_public
    )
  );

create policy "Assets are insertable by owner"
  on public.assets for insert
  with check (owner_id = auth.uid());

create policy "Assets are deletable by owner"
  on public.assets for delete
  using (owner_id = auth.uid());

-- ============================================================
-- 3) Brand snapshots (the moat: a cheap immutable copy of `state`)
-- ============================================================
create table if not exists public.brand_snapshots (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text,
  state jsonb not null,
  created_at timestamptz not null default now()
);

-- Version history read path: a brand's snapshots, newest first.
create index if not exists brand_snapshots_brand_created_idx
  on public.brand_snapshots (brand_id, created_at desc);

alter table public.brand_snapshots enable row level security;

-- Owner-only in v1. Public profiles render current `state`, not history.
create policy "Snapshots are viewable by owner"
  on public.brand_snapshots for select
  using (owner_id = auth.uid());

create policy "Snapshots are insertable by owner"
  on public.brand_snapshots for insert
  with check (owner_id = auth.uid());

create policy "Snapshots are deletable by owner"
  on public.brand_snapshots for delete
  using (owner_id = auth.uid());

-- ============================================================
-- 4) Storage policies for the `brand-assets` bucket
-- ============================================================
-- NOTE: create the bucket first (Storage → New bucket → name `brand-assets`,
-- Public bucket = ON) — see TASKS.md. These policies then enforce owner-only writes
-- keyed on the first path segment being the uploader's uid, i.e. uploads must use the
-- path convention `{owner_id}/{brand_id}/{filename}`. Public read is open by design
-- (public bucket); the size cap (~2MB) and MIME allowlist (PNG/JPEG/SVG/WebP) are set
-- on the bucket itself in the dashboard.

create policy "brand-assets public read"
  on storage.objects for select
  using (bucket_id = 'brand-assets');

create policy "brand-assets owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "brand-assets owner update"
  on storage.objects for update
  using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "brand-assets owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
