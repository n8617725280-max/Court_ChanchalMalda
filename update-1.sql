-- Supabase SQL Editor mein ek baar Run karein (dobara run karna safe hai)
alter table cases add column if not exists client_phone text;
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
