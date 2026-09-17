-- Manual RLS isolation check -- NOT a migration, never apply this via the
-- migration pipeline. Run by hand in the Supabase SQL Editor AFTER
-- 20260917000300_add_multi_tenant_rls.sql has been applied.
--
-- Everything it inserts is undone by the final `rollback`, so it's safe to
-- run against production -- except the two throwaway auth users, which
-- must be created separately first (outside this transaction, since
-- auth.users is managed by GoTrie, not plain SQL) and deleted afterward:
--
--   1. Dashboard > Authentication > Add user, twice:
--        rls-test-a@example.com
--        rls-test-b@example.com
--      (any password; you won't sign in as them, just need their ids)
--   2. Run the whole block below in one go.
--   3. Read the two result sets: the first must show ONLY
--      RLSTEST-ENG-2026-0001 / org A's 'ENG' row, the second ONLY
--      RLSTEST-ENG-2026-0002 / org B's 'ENG' row.
--   4. Delete the two throwaway users from Dashboard > Authentication.

begin;

insert into public.organizations (name, slug) values
  ('Test Org A', 'test-org-a'),
  ('Test Org B', 'test-org-b');

insert into public.profiles (id, organization_id)
select u.id, o.id
from auth.users u, public.organizations o
where u.email = 'rls-test-a@example.com' and o.slug = 'test-org-a';

insert into public.profiles (id, organization_id)
select u.id, o.id
from auth.users u, public.organizations o
where u.email = 'rls-test-b@example.com' and o.slug = 'test-org-b';

-- Same department name/code reused across two orgs -- only succeeds if
-- the per-org unique constraint from Step 3 actually landed.
insert into public.departments (organization_id, name, code)
select o.id, 'Engineering', 'ENG' from public.organizations o where o.slug = 'test-org-a';
insert into public.departments (organization_id, name, code)
select o.id, 'Engineering', 'ENG' from public.organizations o where o.slug = 'test-org-b';

insert into public.staff (organization_id, first_name, last_name, staff_id_number, department_id, role, employment_date)
select o.id, 'Alice', 'Test', 'RLSTEST-ENG-2026-0001', d.id, 'Engineer', current_date
from public.organizations o
join public.departments d on d.organization_id = o.id and d.code = 'ENG'
where o.slug = 'test-org-a';

insert into public.staff (organization_id, first_name, last_name, staff_id_number, department_id, role, employment_date)
select o.id, 'Bob', 'Test', 'RLSTEST-ENG-2026-0002', d.id, 'Engineer', current_date
from public.organizations o
join public.departments d on d.organization_id = o.id and d.code = 'ENG'
where o.slug = 'test-org-b';

-- ---- act as org A's user: expect ONLY org A's rows back --------------

select set_config(
  'request.jwt.claims',
  json_build_object('sub', (select id::text from auth.users where email = 'rls-test-a@example.com'))::text,
  true
);
set local role authenticated;

select staff_id_number from public.staff;    -- expect: RLSTEST-ENG-2026-0001 only
select code from public.departments;          -- expect: one 'ENG' row (org A's)

reset role;

-- ---- act as org B's user: expect ONLY org B's rows back --------------

select set_config(
  'request.jwt.claims',
  json_build_object('sub', (select id::text from auth.users where email = 'rls-test-b@example.com'))::text,
  true
);
set local role authenticated;

select staff_id_number from public.staff;    -- expect: RLSTEST-ENG-2026-0002 only
select code from public.departments;          -- expect: one 'ENG' row (org B's)

reset role;

-- Optional bonus check: per-org sequence counters don't collide.
-- select public.next_staff_seq(
--   (select id from public.organizations where slug = 'test-org-a'), 'ENG', 2026
-- );
-- select public.next_staff_seq(
--   (select id from public.organizations where slug = 'test-org-b'), 'ENG', 2026
-- );
-- Both should return 1 -- proving org A and org B don't share a counter.

rollback;
