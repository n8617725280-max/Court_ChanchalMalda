-- Malda Court Connect v3. Dobara run karna safe hai (koi drop nahi).
create extension if not exists pgcrypto;

create table if not exists chambers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  chamber_id uuid not null references chambers(id) on delete cascade,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('senior','junior','munshi','client')),
  name text, phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  chamber_id uuid not null references chambers(id) on delete cascade,
  cnr text, case_no text, party_name text, court text, ps_name text, stage text, client_phone text,
  next_date date,
  status text not null default 'pending' check (status in ('pending','disposed')),
  notes text,
  assigned_to uuid references users(id) on delete set null,
  client_user_id uuid references users(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  client_ref uuid,                      -- offline retry mein duplicate rokta hai
  created_at timestamptz not null default now(),
  unique (chamber_id, cnr),
  unique (chamber_id, client_ref)
);

create table if not exists fees (
  id uuid primary key default gen_random_uuid(),
  chamber_id uuid not null references chambers(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  kind text not null check (kind in ('charge','payment')),
  amount numeric(12,2) not null check (amount > 0),
  note text,
  created_by uuid references users(id) on delete set null,
  client_ref uuid,
  created_at timestamptz not null default now(),
  unique (chamber_id, client_ref)
);

create table if not exists hearing_log (   -- kisne kab next date badli
  id uuid primary key default gen_random_uuid(),
  chamber_id uuid not null references chambers(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  old_date date, new_date date,
  changed_by uuid references users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists users_chamber on users(chamber_id);
create index if not exists cases_chamber_date on cases(chamber_id, next_date);
create index if not exists fees_case on fees(case_id);

-- RLS ON aur koi policy nahi = anon/public key se kuch bhi padha ya likha nahi ja sakta.
-- Sirf aapka server (service_role key) data tak pahunchta hai.
alter table chambers enable row level security;
alter table users enable row level security;
alter table cases enable row level security;
alter table fees enable row level security;
alter table hearing_log enable row level security;
revoke all on chambers, users, cases, fees, hearing_log from anon, authenticated;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  chamber_id uuid not null references chambers(id) on delete cascade,
  title text not null,
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  assigned_to uuid references users(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  done boolean not null default false,
  client_ref uuid,
  created_at timestamptz not null default now(),
  unique (chamber_id, client_ref)
);
create index if not exists tasks_chamber on tasks(chamber_id, done);
alter table tasks enable row level security;
revoke all on tasks from anon, authenticated;

alter table chambers add column if not exists active boolean not null default true;
