-- Court Connect v5.3: Case Ref (judgment citation + jude hue case)
-- Dobara chalana safe hai.
alter table cases add column if not exists case_refs jsonb not null default '[]'::jsonb;
