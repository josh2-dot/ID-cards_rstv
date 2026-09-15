import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-only Supabase client using the public anon key.
 * Its session is stored in cookies (not localStorage), so server components
 * such as the admin layout can read the same signed-in session.
 * Never use the service role key here — see lib/supabase-server.ts for that.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase browser environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).'
    );
  }

  return createBrowserClient(url, anonKey);
}
