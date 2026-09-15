import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseSessionClient } from '@/lib/supabase-session-server';
import { LogoutButton } from './logout-button';
import { colors, spacing } from '@/lib/design-tokens';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseSessionClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/admin/login');
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <a href="#admin-main" className="skip-link">
        Skip to main content
      </a>

      <header
        style={{
          background: colors.primary,
          color: colors.textOnPrimary,
          padding: `${spacing.md}px ${spacing.xl}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/admin/staff"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            color: colors.textOnPrimary,
            borderRadius: 4,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            RS
          </span>
          <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>RSTV Admin</span>
        </Link>

        <nav aria-label="Admin" style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
          <Link
            href="/verify"
            className="header-link"
            style={{ color: colors.textOnPrimary, fontSize: 13, textDecoration: 'none', borderRadius: 4 }}
          >
            Verify a card
          </Link>
          <LogoutButton />
        </nav>
      </header>

      <main id="admin-main" style={{ flex: 1, padding: spacing.xl, background: colors.surfaceMuted }}>
        {children}
      </main>
    </div>
  );
}
