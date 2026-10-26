-- Court Connect: grants.sql
-- Supabase 30 October 2026 se nayi tables apne aap API ko nahi milti.
-- Yeh file sab update chalane ke BAAD ek baar Run karein. Dobara chalana safe hai.
-- Jo table abhi nahi bani, uski line chhod deta hai.
grant usage on schema public to service_role;
do $$ declare t text; begin
  foreach t in array array['chambers','users','cases','fees','hearing_log','tasks','clients','documents','drafts','notes','drive_tokens','ecourts_cache','ecourts_usage'] loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select, insert, update, delete on public.%I to service_role', t);
      execute format('revoke all on public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;
grant usage, select on all sequences in schema public to service_role;
