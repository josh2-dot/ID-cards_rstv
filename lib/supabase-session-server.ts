import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Session-aware Supabase client for Server Components / Route Handlers that
 * need to know who is signed in. Reads the session from request cookies and
 * uses the anon key, so it respects RLS — unlike getSupabaseServerClient
 * (lib/supabase-server.ts), which uses the service role key and bypasses it.
 */
export async function getSupabaseSessionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).'
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component render, where cookies can't be
          // written. Fine here — this client is only used to read the
          // session, not to refresh it.
        }
      },
    },
  });
}
