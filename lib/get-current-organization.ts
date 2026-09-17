import { getSupabaseSessionClient } from './supabase-session-server';
import { getSupabaseServerClient } from './supabase-server';

export interface CurrentOrganization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

interface ProfileQueryRow {
  organizations: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
  } | null;
}

/**
 * Resolves the signed-in admin's organization from their session via the
 * profiles table. Every service-role query in the app needs this to scope
 * itself to one tenant -- RLS doesn't apply to the service-role client.
 */
export async function getCurrentOrganization(): Promise<CurrentOrganization | null> {
  const sessionClient = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) return null;

  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('organizations(id, name, slug, logo_url, primary_color)')
    .eq('id', user.id)
    .single();

  const org = (profile as unknown as ProfileQueryRow | null)?.organizations;
  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logo_url,
    primaryColor: org.primary_color,
  };
}
