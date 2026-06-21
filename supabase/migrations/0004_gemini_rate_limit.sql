-- Durable Gemini rate-limit counter. Replaces the in-memory `windowStart`/
-- `windowCount` counter in lib/gemini.ts, which only held per warm Vercel
-- function instance (not truly global across concurrent instances). One row
-- per "bucket" (e.g. 'names', 'starter') so name-generation and brand-starter
-- traffic can be capped independently.

create table if not exists public.gemini_rate_limit (
  bucket text primary key,
  window_start timestamptz not null default now(),
  count int not null default 0
);

-- Written by service role only (via supabaseAdmin.rpc in lib/gemini.ts) —
-- RLS on, no public policies, same pattern as `feedback` in 0001_init.sql.
alter table public.gemini_rate_limit enable row level security;

-- Atomically check-and-increment a bucket's count for the current window.
-- The UPDATE statement takes a row lock for its duration, so concurrent
-- callers (e.g. two serverless instances hitting the same bucket at once)
-- are serialized — no race between the reset check and the increment.
create or replace function public.acquire_gemini_slot(
  p_bucket text,
  p_limit int,
  p_window_seconds int default 60
)
returns boolean
language plpgsql
as $$
declare
  v_count int;
begin
  insert into public.gemini_rate_limit (bucket, window_start, count)
  values (p_bucket, now(), 0)
  on conflict (bucket) do nothing;

  update public.gemini_rate_limit
  set
    window_start = case
      when window_start < now() - (p_window_seconds || ' seconds')::interval then now()
      else window_start
    end,
    count = case
      when window_start < now() - (p_window_seconds || ' seconds')::interval then 1
      else count + 1
    end
  where bucket = p_bucket
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;
