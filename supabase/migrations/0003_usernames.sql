-- Brandsor usernames (Phase: account identity).
-- Run after 0001_init.sql and 0002_brands.sql.
--
-- A username is a unique account handle, separate from brand public-profile slugs.
-- Not used in any URL today — purely a display identity in the navbar. Existing
-- RLS on `profiles` ("viewable/updatable by owner") already covers these new
-- columns since RLS is table-level, not column-level.

alter table public.profiles
  add column if not exists username text,
  add column if not exists username_changed_at timestamptz;

-- Case-insensitive uniqueness: "Alice" and "alice" collide.
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));
