-- Step 3: row-level security for multi-tenancy.
--
-- 1. profiles: ties each Supabase Auth user to one organization. This is
--    how organization_id enters the request context for RLS -- every
--    policy below calls current_organization_id(), which looks up
--    auth.uid() in this table.
-- 2. current_organization_id(): SECURITY DEFINER helper so policies on
--    other tables don't need their own subquery against profiles, and so
--    evaluating it doesn't recurse through profiles' own RLS.
-- 3. Replaces the old blanket "any authenticated user" policies on
--    departments/staff with organization-scoped ones.
-- 4. The fix deferred from Step 2: departments.code/name move from
--    globally unique to unique per organization_id, and
--    staff_id_sequences' primary key + next_staff_seq() gain an
--    organization_id dimension, so two orgs can reuse the same department
--    code without sharing a sequence counter. This REQUIRES a matching
--    change to lib/generate-staff-id.ts's RPC call -- staff ID generation
--    will break the moment this migration lands until that file is
--    updated to call next_staff_seq(organization_id, dept_code, year).
--
-- staff.staff_id_number stays GLOBALLY unique on purpose: the public
-- /verify page and the card-download route look staff up only by that
-- number, with no organization filter -- it already uniquely identifies
-- the row across every tenant, so that code path needs no changes.
--
-- IMPORTANT: every table here is normally read/written through the
-- service-role client (lib/supabase-server.ts), which BYPASSES RLS
-- entirely by design. These policies only take effect for the one
-- session-bound (anon-key) query in the app -- the departments fetch in
-- app/admin/(protected)/staff/new/page.tsx. Every other route needs an
-- explicit `.eq('organization_id', ...)` filter added in application
-- code to actually be tenant-scoped; RLS alone does not protect them.

begin;

-- ---- 1. profiles ------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
using (auth.uid() = id);

-- ---- 2. current_organization_id() -------------------------------------

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

-- ---- 3. organizations: a user can read their own org row --------------

create policy "Users can read their own organization"
on public.organizations for select
using (id = public.current_organization_id());

-- ---- 4. departments / staff: org-scoped policies replace the old ones --

drop policy if exists "Departments readable by authenticated users" on public.departments;
drop policy if exists "Staff insertable by authenticated users" on public.staff;
drop policy if exists "Staff readable by authenticated users" on public.staff;
drop policy if exists "Staff updatable by authenticated users" on public.staff;

create policy "Org members can read their departments"
on public.departments for select
using (organization_id = public.current_organization_id());

create policy "Org members can read their staff"
on public.staff for select
using (organization_id = public.current_organization_id());

create policy "Org members can insert their staff"
on public.staff for insert
with check (organization_id = public.current_organization_id());

create policy "Org members can update their staff"
on public.staff for update
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

-- ---- 5. deferred fix: per-org uniqueness + per-org sequence counter ----

alter table public.departments drop constraint departments_code_key;
alter table public.departments drop constraint departments_name_key;
alter table public.departments add constraint departments_organization_id_code_key unique (organization_id, code);
alter table public.departments add constraint departments_organization_id_name_key unique (organization_id, name);

alter table public.staff_id_sequences drop constraint staff_id_sequences_pkey;
alter table public.staff_id_sequences add primary key (organization_id, department_code, year);

create or replace function public.next_staff_seq(p_organization_id uuid, dept_code text, yr integer)
returns integer
language plpgsql
as $$
declare
  next_val int;
begin
  insert into staff_id_sequences (organization_id, department_code, year, last_seq)
  values (p_organization_id, dept_code, yr, 1)
  on conflict (organization_id, department_code, year)
  do update set last_seq = staff_id_sequences.last_seq + 1
  returning last_seq into next_val;
  return next_val;
end;
$$;

drop function if exists public.next_staff_seq(text, integer);

commit;
