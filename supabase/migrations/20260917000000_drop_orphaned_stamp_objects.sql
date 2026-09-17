-- Step 0: remove leftover objects from the old "STAMP" app that used to
-- share this Supabase project. Their tables (organizers, events, tickets,
-- ticket_tiers, award_votes, award_nominees, withdrawals, platform_config)
-- no longer exist, so these are all dead code today -- any of them would
-- error immediately if invoked. The trigger below is the one that isn't
-- inert: it fires on every new auth.users row and calls a function that
-- inserts into `organizers`, which will raise
-- "relation \"organizers\" does not exist" and fail the signup.
--
-- Confirmed via live introspection before writing this file:
--   - public tables are only: departments, staff, staff_id_sequences
--   - on_auth_user_created is ENABLED on auth.users
--   - next_staff_seq and set_updated_at are the only functions still in use

begin;

drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.handle_new_auth_user();
drop function if exists public.charge_awards_module_fees(uuid);
drop function if exists public.effective_awards_module_fee(uuid);
drop function if exists public.increment_tier_sold(uuid);
drop function if exists public.organizer_available_balance(uuid);
drop function if exists public.organizer_balance_summary(uuid);
drop function if exists public.platform_stats();
drop function if exists public.recount_nominee_votes(uuid);

commit;
