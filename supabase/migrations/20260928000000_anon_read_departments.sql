-- Fixes another gap in 20260924000000_nfss_public_officer_lookup.sql:
-- staff/offices got anon-facing SELECT policies, but departments didn't,
-- so the `departments(name)` embed Checkpoint uses for the officer
-- profile's "Department" field always resolved to null for anon -- not
-- an error, just silently blank on every public officer profile.
--
-- Same scoping as staff/offices: anon can read departments only for
-- organizations that opted into public lookup.

begin;

create policy "Anon can read departments for public-lookup organizations"
on public.departments for select
to anon
using (
  organization_id in (
    select id from public.organizations where public_lookup_enabled = true
  )
);

commit;
