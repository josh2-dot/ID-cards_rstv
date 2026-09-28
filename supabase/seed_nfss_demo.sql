-- Demo seed data for the Checkpoint prototype -- NOT a migration, don't
-- add this to the migrations/ pipeline. Run by hand in the Supabase SQL
-- Editor, once, after 20260924000000_nfss_public_officer_lookup.sql has
-- been applied.
--
-- Flips NFSS's public_lookup_enabled on and adds one department, one
-- fictional officer (the same "Emeka Amadi" example name used as a
-- placeholder throughout ../../nfss/checkpoint-nfss-app-plan.md), and one
-- office, so the Checkpoint app has something real to search for and
-- display. All of this is placeholder data -- replace the department,
-- officer, and office with real NFSS records before this goes anywhere
-- near production, and consider flipping public_lookup_enabled back to
-- false until NFSS actually confirms lookup should be public (see the
-- plan doc, section 7).

begin;

update public.organizations
set public_lookup_enabled = true
where slug = 'nfss';

insert into public.departments (organization_id, name, code)
select id, 'Enforcement', 'ENF'
from public.organizations
where slug = 'nfss';

with org as (
  select id, slug from public.organizations where slug = 'nfss'
), dept as (
  select id, code from public.departments
  where organization_id = (select id from org) and code = 'ENF'
), seq as (
  select public.next_staff_seq((select id from org), (select code from dept), 2026) as n
)
insert into public.staff (
  organization_id, first_name, last_name, staff_id_number, department_id,
  role, posting_location, employment_date, status
)
select
  (select id from org),
  'Emeka',
  'Amadi',
  upper((select slug from org)) || '-' || (select code from dept) || '-2026-' || lpad((select n from seq)::text, 4, '0'),
  (select id from dept),
  'Enforcement Officer',
  'Port Harcourt Command HQ',
  current_date,
  'active';

insert into public.offices (organization_id, name, address, lat, lng)
select id, 'NFSS Port Harcourt Command HQ', 'Old GRA, Port Harcourt, Rivers State', 4.8156, 7.0498
from public.organizations
where slug = 'nfss';

commit;

-- After running, the generated badge number is visible via:
-- select staff_id_number from public.staff where first_name = 'Emeka' and last_name = 'Amadi';
-- (expected: NFSS-ENF-2026-0001, unless next_staff_seq(NFSS, ENF, 2026) was already called before)
