-- Malda Court Connect v5 — update-3.sql
-- Purane (chal rahe) database ke liye. Supabase > SQL Editor mein paste karke ek baar Run karein.
-- Dobara run karna safe hai: sirf "if not exists" se naye column/table jodta hai. Koi DROP nahi, koi purana data nahi badalta.
create extension if not exists pgcrypto;

-- 1) Chamber settings: vakil ka naam (drafts ke liye) aur UPI
alter table chambers add column if not exists active boolean not null default true;
alter table chambers add column if not exists adv_name text;
alter table chambers add column if not exists adv_enrol text;
alter table chambers add column if not exists address text;
alter table chambers add column if not exists upi_id text;
alter table chambers add column if not exists upi_name text;

-- 2) Clients (muvakkil)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  chamber_id uuid not null references chambers(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  guardian text,                        -- pita / pati ka naam
  notes text,
  created_by uuid references users(id) on delete set null,
  client_ref uuid,                      -- offline retry mein duplicate rokta hai
  created_at timestamptz not null default now(),
  unique (chamber_id, client_ref)
);

-- 3) Cases: client link + criminal details (sab nullable, purane cases waise hi chalenge)
alter table cases add column if not exists client_phone text;
alter table cases add column if not exists client_id uuid references clients(id) on delete set null;
alter table cases add column if not exists case_type text;
alter table cases add column if not exists fir_no text;
alter table cases add column if not exists fir_date date;
alter table cases add column if not exists sections text;
alter table cases add column if not exists bail_status text;
alter table cases add column if not exists chargesheet_date date;
alter table cases add column if not exists ip_name text;   -- complainant / informant
alter table cases add column if not exists io_name text;   -- investigating officer
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cases_case_type_check') then
    alter table cases add constraint cases_case_type_check check (case_type is null or case_type in ('civil','criminal','other'));
  end if;
end $$;

-- 4) Document vault ka hisaab (asli file private Storage bucket "case-docs" mein)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  chamber_id uuid not null references chambers(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  name text not null,
  mime text not null check (mime in ('application/pdf','image/jpeg','image/png')),
  size integer not null check (size > 0 and size <= 10485760),
  path text not null unique,            -- <chamber_id>/<case_id>/<uuid>.<ext>
  uploaded_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 5) Drafts (Vakalatnama, affidavit, bail wagairah)
create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  chamber_id uuid not null references chambers(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  kind text not null default 'other',
  title text not null default 'Draft',
  body text not null,
  created_by uuid references users(id) on delete set null,
  client_ref uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chamber_id, client_ref)
);

-- 6) Chamber notes / knowledge base
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  chamber_id uuid not null references chambers(id) on delete cascade,
  title text not null,
  body text not null default '',
  tag text,
  case_id uuid references cases(id) on delete set null,
  private boolean not null default false,   -- true = sirf senior dekh sakta hai
  created_by uuid references users(id) on delete set null,
  client_ref uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chamber_id, client_ref)
);

-- 7) Indexes
create index if not exists clients_chamber on clients(chamber_id, name);
create index if not exists cases_client on cases(client_id);
create index if not exists documents_case on documents(chamber_id, case_id);
create index if not exists drafts_case on drafts(chamber_id, case_id);
create index if not exists notes_chamber on notes(chamber_id, updated_at desc);
create index if not exists hearing_log_chamber on hearing_log(chamber_id, changed_at desc);

-- 8) Suraksha: RLS ON aur koi policy nahi = anon/public key se kuch nahi. Sirf server (service_role) pahunchta hai.
alter table clients enable row level security;
alter table documents enable row level security;
alter table drafts enable row level security;
alter table notes enable row level security;
revoke all on clients, documents, drafts, notes from anon, authenticated;

-- 9) Private storage bucket (server bhi start hote waqt khud bana deta hai). public = false hamesha.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('case-docs', 'case-docs', false, 10485760, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false;

-- Supabase 30 Oct 2026 badlav: nayi tables ko server (service_role) ke liye saaf GRANT chahiye.
-- anon/authenticated ko kuch nahi milta; app sirf server se data padhta hai.
grant usage on schema public to service_role;
grant select, insert, update, delete on clients, documents, drafts, notes to service_role;
grant usage, select on all sequences in schema public to service_role;
