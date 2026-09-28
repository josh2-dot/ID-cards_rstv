-- Fixes a bug in 20260924000000_nfss_public_officer_lookup.sql: the
-- anon-facing staff/offices SELECT policies (and the storage.objects
-- photo policy) all check organizations.public_lookup_enabled via a
-- subquery against public.organizations -- but that table's own RLS had
-- no anon-readable policy, only "Users can read their own organization"
-- (scoped to a signed-in admin's profile). Since the subquery runs as
-- the anon role, RLS silently returned zero rows for it, so `organization_id
-- in (select id from organizations where public_lookup_enabled = true)`
-- was always empty and those policies never actually let anon read
-- anything, regardless of the flag. Same problem blocks the app's own
-- `organizations!inner(slug)` embedded-join filter.
--
-- Fix: give anon a narrow read on organizations, scoped to exactly the
-- rows that opted in -- RStV (public_lookup_enabled = false) stays
-- completely invisible to anon either way.

begin;

create policy "Anon can read public-lookup organizations"
on public.organizations for select
to anon
using (public_lookup_enabled = true);

commit;
