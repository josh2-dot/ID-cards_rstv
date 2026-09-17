import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentOrganization } from '@/lib/get-current-organization';
import { LogoutButton } from './logout-button';
import { colors, spacing } from '@/lib/design-tokens';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organization = await getCurrentOrganization();

  if (!organization) {
    redirect('/admin/login');
  }

  const headerColor = organization.primaryColor ?? colors.primary;

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <a href="#admin-main" className="skip-link">
        Skip to main content
      </a>

      <header
        style={{
          background: headerColor,
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
          {organization.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- org-supplied logo, arbitrary external host
            <img
              src={organization.logoUrl}
              alt={`${organization.name} logo`}
              width={28}
              height={28}
              style={{ borderRadius: 4, objectFit: 'cover' }}
            />
          ) : (
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
              {organization.name.trim().slice(0, 2).toUpperCase()}
            </span>
          )}
          <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>{organization.name} Admin</span>
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
