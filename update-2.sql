-- Supabase SQL Editor mein ek baar Run karein (Owner Panel ke liye)
alter table chambers add column if not exists active boolean not null default true;
