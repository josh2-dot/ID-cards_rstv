-- Adds a phone number to staff, per NFSS's request that a verified
-- officer's contact number be visible on the Checkpoint search result.
-- No new RLS policy needed: the anon-facing SELECT policy on staff (from
-- 20260924000000_nfss_public_officer_lookup.sql) is row-level, so this
-- column is readable wherever the row already is.

begin;

alter table public.staff
  add column phone text;

commit;
