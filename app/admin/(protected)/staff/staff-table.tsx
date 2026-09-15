'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Department, StaffStatus } from '@/lib/types';

export interface StaffRow {
  id: string;
  fullName: string;
  staffIdNumber: string;
  department: string;
  role: string;
  status: StaffStatus;
  photoUrl: string | null;
}

const STATUS_OPTIONS: StaffStatus[] = ['active', 'revoked', 'expired'];

export function StaffTable({
  staff,
  departments,
}: {
  staff: StaffRow[];
  departments: Department[];
}) {
  const router = useRouter();
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return staff.filter((row) => {
      if (departmentFilter !== 'all' && row.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      return true;
    });
  }, [staff, departmentFilter, statusFilter]);

  async function handleRevoke(id: string) {
    if (!window.confirm('Revoke this staff ID? This cannot be undone from here.')) return;

    setRevokingId(id);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/staff/${id}/revoke`, { method: 'PATCH' });
      const body = await res.json();

      if (!body.success) {
        setErrorMessage(body.message ?? 'Failed to revoke staff ID.');
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage('Failed to revoke staff ID.');
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {errorMessage && (
        <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>{errorMessage}</p>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff' }}>
        <thead>
          <tr>
            <th style={thStyle}>Photo</th>
            <th style={thStyle}>Full name</th>
            <th style={thStyle}>Staff ID</th>
            <th style={thStyle}>Department</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id}>
              <td style={tdStyle}>
                {row.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.photoUrl}
                    alt={row.fullName}
                    style={{ width: 40, height: 44, objectFit: 'cover', border: '1px solid #b4b4b4' }}
                  />
                ) : (
                  <div style={{ width: 40, height: 44, background: '#f0f0f0', border: '1px solid #b4b4b4' }} />
                )}
              </td>
              <td style={tdStyle}>{row.fullName}</td>
              <td style={tdStyle}>{row.staffIdNumber}</td>
              <td style={tdStyle}>{row.department}</td>
              <td style={tdStyle}>{row.role}</td>
              <td style={tdStyle}>
                <span style={statusBadgeStyle(row.status)}>{row.status}</span>
              </td>
              <td style={tdStyle}>
                {row.status === 'active' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={`/api/staff/card?staff_id_number=${encodeURIComponent(row.staffIdNumber)}`}
                      style={downloadLinkStyle}
                    >
                      Download card
                    </a>
                    <button
                      onClick={() => handleRevoke(row.id)}
                      disabled={revokingId === row.id}
                      style={revokeButtonStyle}
                    >
                      {revokingId === row.id ? 'Revoking…' : 'Revoke'}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>
                No staff records match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  border: '1px solid #b4b4b4',
  borderRadius: 4,
  padding: '6px 10px',
  fontSize: 13,
  color: '#1c2628',
  background: '#ffffff',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 700,
  color: '#1c2628',
  padding: '10px 12px',
  borderBottom: '2px solid #e5e7eb',
};

const tdStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#1c2628',
  padding: '10px 12px',
  borderBottom: '1px solid #e5e7eb',
};

const revokeButtonStyle: React.CSSProperties = {
  background: '#ffffff',
  color: '#b91c1c',
  border: '1px solid #b91c1c',
  borderRadius: 4,
  padding: '5px 12px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};

const downloadLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: '#ffffff',
  color: '#0b3d91',
  border: '1px solid #0b3d91',
  borderRadius: 4,
  padding: '5px 12px',
  fontSize: 12,
  fontWeight: 700,
  textDecoration: 'none',
};

function statusBadgeStyle(status: StaffStatus): React.CSSProperties {
  const colors: Record<StaffStatus, { bg: string; fg: string }> = {
    active: { bg: '#dcfce7', fg: '#166534' },
    revoked: { bg: '#fee2e2', fg: '#991b1b' },
    expired: { bg: '#fef3c7', fg: '#92400e' },
  };
  const { bg, fg } = colors[status];

  return {
    background: bg,
    color: fg,
    borderRadius: 999,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  };
}
