import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service role key.
 * NEVER import this file from client components — it bypasses RLS.
 * Only use it inside API routes / server actions.
 */
export function getSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase server environment variables (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
