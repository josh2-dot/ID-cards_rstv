-- Step 2: backfill RStV as the first organization.
-- Creates the RStV organizations row and populates organization_id on
-- every existing row in departments, staff, and staff_id_sequences, then
-- enforces NOT NULL on all three now that every row has a value.
--
-- The per-org unique constraint fix (departments.code/name,
-- staff_id_sequences' primary key) and the next_staff_seq() signature
-- change are deferred to Step 3 rather than bundled here: they require an
-- app-code change (lib/generate-staff-id.ts's RPC call) to land safely,
-- and Step 3 is already where this project's queries/auth code get
-- updated. Doing it here would mean editing application code ahead of the
-- step designated for that. There's no collision risk from deferring it:
-- RStV is the only organization until Step 3 lands, so the current
-- global-unique department code/name and shared sequence counter can't
-- collide with anything yet.

begin;

insert into public.organizations (name, slug)
values ('RStV', 'rstv');

update public.departments
set organization_id = (select id from public.organizations where slug = 'rstv')
where organization_id is null;

update public.staff
set organization_id = (select id from public.organizations where slug = 'rstv')
where organization_id is null;

update public.staff_id_sequences
set organization_id = (select id from public.organizations where slug = 'rstv')
where organization_id is null;

alter table public.departments alter column organization_id set not null;
alter table public.staff alter column organization_id set not null;
alter table public.staff_id_sequences alter column organization_id set not null;

commit;
