import Link from 'next/link';
import { verifyStaffId } from '@/lib/verify-staff';
import { colors, radius, shadow, spacing } from '@/lib/design-tokens';

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const result = id ? await verifyStaffId(id) : null;

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.background,
        padding: spacing.lg,
      }}
    >
      <div
        style={{
          background: colors.surface,
          borderRadius: radius.lg,
          boxShadow: shadow.md,
          padding: spacing.xl,
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Link
          href="/"
          className="header-link"
          style={{ color: colors.primary, textDecoration: 'none', fontWeight: 700, fontSize: 18 }}
        >
          RSTV
        </Link>
        <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: spacing.xl }}>
          Staff ID Verification
        </p>

        {!id && (
          <p style={{ color: colors.textMuted, fontSize: 14 }}>
            Scan a staff ID card&apos;s QR code to verify it here.
          </p>
        )}

        {id && result && !result.success && (
          <>
            <StatusBadge ok={false} label="Not Found" />
            <p style={{ marginTop: 14, color: colors.danger, fontSize: 14 }}>{result.message}</p>
          </>
        )}

        {id && result?.success && result.staff && (
          <>
            <StatusBadge
              ok={!!result.valid}
              label={result.valid ? 'Valid' : result.is_expired ? 'Expired' : 'Revoked'}
            />
            <dl style={{ marginTop: 22, textAlign: 'left' }}>
              <Row label="Name" value={result.staff.full_name} />
              <Row label="Staff ID" value={result.staff.staff_id_number} />
              <Row label="Role" value={result.staff.role} />
              <Row label="Department" value={result.staff.department?.name ?? '—'} />
              <Row label="Status" value={(result.status ?? '—').toUpperCase()} />
            </dl>
          </>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 18px',
        borderRadius: radius.pill,
        fontSize: 13,
        fontWeight: 700,
        color: colors.textOnPrimary,
        background: ok ? colors.success : colors.danger,
      }}
    >
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '7px 0',
        borderBottom: `1px solid ${colors.borderLight}`,
      }}
    >
      <dt style={{ fontSize: 12, color: colors.textMuted }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.text }}>{value}</dd>
    </div>
  );
}
