-- Ad-hoc per-officer fields for cases the admin form doesn't have a
-- dedicated column for yet (e.g. "State of Origin", "Next of Kin") --
-- lets HR add a field without needing a schema migration every time.
--
-- Deliberately NOT exposed to anon: unlike staff/departments/offices,
-- there is no public-lookup SELECT policy here. Custom fields could hold
-- anything, including things that shouldn't be public by default (a
-- national ID number, a home address); HR opts a specific field into the
-- public Checkpoint app only if a later change explicitly adds that, not
-- by default just because the field exists. RLS is enabled with no
-- policies, so only the service-role client (the admin app's API routes)
-- can read or write this table -- same pattern as rank_history.

begin;

create table public.staff_custom_fields (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  field_name text not null,
  field_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, field_name)
);

create index staff_custom_fields_staff_id_idx on public.staff_custom_fields(staff_id);

alter table public.staff_custom_fields enable row level security;

commit;
