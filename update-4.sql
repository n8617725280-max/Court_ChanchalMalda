-- Malda Court Connect — update-4.sql (storage: R2, link, Google Drive)
-- Supabase > SQL Editor > New query > ye poora text paste karke Run. Dobara chalana bhi safe hai (idempotent).
-- Koi purana data delete nahi hota. Purani files 'supabase' maani jaati hain aur waise hi khulti rahengi.

-- 1) documents: har file ka backend (supabase / r2 / gdrive / link), link ka URL, Drive file id
alter table documents add column if not exists backend text;
alter table documents add column if not exists url text;
alter table documents add column if not exists drive_file_id text;
update documents set backend = 'supabase' where backend is null;
alter table documents alter column backend set default 'supabase';

alter table documents drop constraint if exists documents_backend_check;
alter table documents add constraint documents_backend_check check (backend is null or backend in ('supabase','r2','gdrive','link'));

-- link ke liye size 0 aur mime 'text/uri-list' chahiye: purane check hata kar naye lagayein
alter table documents drop constraint if exists documents_mime_check;
alter table documents add constraint documents_mime_check check (mime in ('application/pdf','image/jpeg','image/png','text/uri-list'));
alter table documents drop constraint if exists documents_size_check;
alter table documents add constraint documents_size_check check (size >= 0 and size <= 10485760 and (size > 0 or backend = 'link'));
alter table documents drop constraint if exists documents_link_url_check;
alter table documents add constraint documents_link_url_check check (backend is distinct from 'link' or (url is not null and url like 'https://%'));

-- 2) Google Drive tokens (har user ka ek). Refresh token server par AES-256-GCM se encrypt hota hai.
create table if not exists drive_tokens (
  user_id uuid primary key references users(id) on delete cascade,
  chamber_id uuid not null references chambers(id) on delete cascade,
  enc_refresh text not null,
  email text,
  created_at timestamptz not null default now()
);

-- 3) Suraksha: RLS ON aur koi policy nahi = anon/public key se kuch nahi. Sirf server (service_role) pahunchta hai.
alter table drive_tokens enable row level security;
alter table documents enable row level security;
revoke all on drive_tokens from anon, authenticated;
revoke all on documents from anon, authenticated;
