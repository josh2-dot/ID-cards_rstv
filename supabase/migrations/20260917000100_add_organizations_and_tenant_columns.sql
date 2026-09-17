-- Step 1: multi-tenancy schema.
-- Adds the `organizations` table and a nullable `organization_id` FK to
-- every table that holds tenant-specific data (departments, staff,
-- staff_id_sequences). Nullable for now -- Step 2 backfills every existing
-- row with RStV's organization_id, and only then do we enforce NOT NULL.
--
-- Deliberately NOT done here (deferred to land alongside Step 2's NOT NULL
-- enforcement, since both need backfilled data to be meaningful):
--   - departments_code_key / departments_name_key move from globally unique
--     to unique per organization_id, so two orgs can each have a department
--     named/coded the same.
--   - staff_id_sequences' primary key moves from (department_code, year) to
--     (organization_id, department_code, year), and next_staff_seq(...)
--     gets an org_id parameter, so two orgs sharing a department code don't
--     share a sequence counter.

begin;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

alter table public.departments
  add column organization_id uuid references public.organizations(id);

alter table public.staff
  add column organization_id uuid references public.organizations(id);

alter table public.staff_id_sequences
  add column organization_id uuid references public.organizations(id);

create index departments_organization_id_idx on public.departments(organization_id);
create index staff_organization_id_idx on public.staff(organization_id);
create index staff_id_sequences_organization_id_idx on public.staff_id_sequences(organization_id);

commit;
