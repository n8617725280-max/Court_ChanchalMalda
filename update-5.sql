-- Malda Court Connect — update-5.sql (eCourtsIndia live CNR status, v5.2)
-- Supabase > SQL Editor > New query > ye poora text paste karke Run. Dobara chalana bhi safe hai (idempotent).
-- Pehle supabase.sql, update-3.sql, update-4.sql chal chuke hon. Koi purana data delete nahi hota.

-- 1) Har case ka aakhri live status (chhota snapshot). 12 ghante tak isi se jawab, API call nahi.
create table if not exists ecourts_cache (
  case_id uuid primary key references cases(id) on delete cascade,
  chamber_id uuid not null references chambers(id) on delete cascade,
  cnr text not null,
  snapshot jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  fetched_by uuid references users(id) on delete set null
);
create index if not exists ecourts_cache_chamber_idx on ecourts_cache (chamber_id);

-- 2) Har chamber ki rozana ginti (sirf asli API call). Seema: ECOURTS_DAILY_LIMIT (default 30).
create table if not exists ecourts_usage (
  chamber_id uuid not null references chambers(id) on delete cascade,
  day date not null,
  count integer not null default 0 check (count >= 0),
  primary key (chamber_id, day)
);

-- 3) Suraksha: RLS ON aur koi policy nahi = anon/public key se kuch nahi. Sirf server (service_role) pahunchta hai.
alter table ecourts_cache enable row level security;
alter table ecourts_usage enable row level security;
revoke all on ecourts_cache from anon, authenticated;
revoke all on ecourts_usage from anon, authenticated;

-- Supabase 30 Oct 2026 badlav: nayi tables ko server (service_role) ke liye saaf GRANT chahiye.
-- anon/authenticated ko kuch nahi milta; app sirf server se data padhta hai.
grant usage on schema public to service_role;
grant select, insert, update, delete on ecourts_cache, ecourts_usage to service_role;
grant usage, select on all sequences in schema public to service_role;
