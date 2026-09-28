-- NFSS tenant + public officer-lookup support.
--
-- Adds NFSS as a new organization and extends the schema for Checkpoint,
-- the public officer-verification mobile app
-- (see ../../../nfss/checkpoint-nfss-app-plan.md).
--
-- Reuses existing columns where they already cover what the plan asked
-- for, instead of adding near-duplicates:
--   - staff.staff_id_number already IS the badge number (format
--     <ORG>-<DEPT>-<YEAR>-<SEQ>, see lib/generate-staff-id.ts) -- no new
--     badge_number column, and no new index: it's already declared
--     globally unique (see the Step 3 migration's comment), which already
--     gives it a unique index.
--   - staff.role already IS the rank/job title an officer holds --
--     rank_history tracks changes to this column instead of introducing a
--     separate `rank` column that would just duplicate it.
--   - staff.status's existing 'revoked' value already means what NFSS
--     calls "terminated". No new status value needed: verify-staff.ts's
--     isValid check (status = 'active' and not expired) already makes a
--     revoked officer read as not-verified, which is exactly what a
--     public verification app wants for someone flashing a terminated
--     officer's badge number.
--   - staff.photo_path + the private staff-id-assets bucket already cover
--     officer photos. See the storage policy below for how the mobile app
--     gets a signed URL for one with only the anon key.
--
-- Genuinely new: posting_location (staff has no concept of a current
-- posting today), rank_history (no promotion history exists anywhere
-- yet), offices, and the public_lookup_enabled toggle + anon read access
-- that lets Checkpoint query this project directly with the anon key.
--
-- Whether public_lookup_enabled ever gets flipped to true for NFSS is
-- still an open call from the client (see the plan doc, section 7) -- it
-- defaults to false so this migration is safe to apply either way.
--
-- Table-level SELECT for anon/authenticated is already covered by this
-- project's default privileges (the same reason Step 3's staff/
-- departments policies work with no explicit GRANT beside them) -- RLS
-- below is the actual gate, same pattern as the rest of this file.

begin;

-- ---- 1. organizations: public-lookup toggle + the NFSS tenant ---------

alter table public.organizations
  add column public_lookup_enabled boolean not null default false;

insert into public.organizations (name, slug)
values ('NFSS', 'nfss');

-- ---- 2. staff: posting location ----------------------------------------

alter table public.staff
  add column posting_location text;

-- ---- 3. rank_history: written by the future "Promote" admin action ----

create table public.rank_history (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  previous_role text not null,
  new_role text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id)
);

create index rank_history_staff_id_idx on public.rank_history(staff_id);

alter table public.rank_history enable row level security;

-- No policies added on purpose: like staff/departments, this is only ever
-- read/written through the service-role client (lib/supabase-server.ts),
-- which bypasses RLS entirely. Enabling RLS with zero policies just makes
-- sure that stays true -- an anon/authenticated client gets nothing.

-- ---- 4. offices ---------------------------------------------------------

create table public.offices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create index offices_organization_id_idx on public.offices(organization_id);

alter table public.offices enable row level security;

-- ---- 5. name search index -------------------------------------------------

create extension if not exists pg_trgm;

create index staff_full_name_trgm_idx
  on public.staff using gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- ---- 6. anon read access for public_lookup_enabled organizations ----------
--
-- Scoped narrowly: SELECT only, and only for organizations that opted in.
-- Every other table (departments, profiles, organizations itself,
-- rank_history, staff_id_sequences) stays closed to anon -- Checkpoint
-- only ever reads staff and offices directly with the anon key.

create policy "Anon can read staff for public-lookup organizations"
on public.staff for select
to anon
using (
  organization_id in (
    select id from public.organizations where public_lookup_enabled = true
  )
);

create policy "Anon can read offices for public-lookup organizations"
on public.offices for select
to anon
using (
  organization_id in (
    select id from public.organizations where public_lookup_enabled = true
  )
);

-- ---- 7. anon photo access via signed URLs ----------------------------------
--
-- staff-id-assets is a private bucket -- Checkpoint calls
-- .storage.from('staff-id-assets').createSignedUrl(path, ttl) with the
-- anon key, which needs a SELECT policy on storage.objects to succeed.
-- Scoped to the photos/ prefix only (never signatures/, which the public
-- app has no reason to read), and to staff rows belonging to a
-- public_lookup_enabled organization.

create policy "Anon can read officer photos for public-lookup organizations"
on storage.objects for select
to anon
using (
  bucket_id = 'staff-id-assets'
  and name like 'photos/%'
  and exists (
    select 1
    from public.staff s
    join public.organizations o on o.id = s.organization_id
    where s.photo_path = storage.objects.name
      and o.public_lookup_enabled = true
  )
);

commit;
