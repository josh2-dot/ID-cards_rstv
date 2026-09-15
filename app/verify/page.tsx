import { verifyStaffId } from '@/lib/verify-staff';

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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f5f7',
        padding: 24,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          padding: 32,
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0b3d91', margin: 0 }}>RSTV</h1>
        <p style={{ fontSize: 12, color: '#666', marginTop: 4, marginBottom: 24 }}>
          Staff ID Verification
        </p>

        {!id && (
          <p style={{ color: '#666', fontSize: 14 }}>
            Scan a staff ID card&apos;s QR code to verify it here.
          </p>
        )}

        {id && result && !result.success && (
          <>
            <StatusBadge ok={false} label="Not Found" />
            <p style={{ marginTop: 14, color: '#b00020', fontSize: 14 }}>{result.message}</p>
          </>
        )}

        {id && result?.success && result.staff && (
          <>
            <StatusBadge
              ok={!!result.valid}
              label={result.valid ? 'Valid' : result.is_expired ? 'Expired' : 'Revoked'}
            />
            <div style={{ marginTop: 22, textAlign: 'left' }}>
              <Row label="Name" value={result.staff.full_name} />
              <Row label="Staff ID" value={result.staff.staff_id_number} />
              <Row label="Role" value={result.staff.role} />
              <Row label="Department" value={result.staff.department?.name ?? '—'} />
              <Row label="Status" value={(result.status ?? '—').toUpperCase()} />
            </div>
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
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        color: '#ffffff',
        background: ok ? '#1a7f37' : '#b00020',
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
        borderBottom: '1px solid #eee',
      }}
    >
      <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#1c2628' }}>{value}</span>
    </div>
  );
}
