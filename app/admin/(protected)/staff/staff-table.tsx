'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { CustomField, Department, StaffStatus } from '@/lib/types';
import { colors, radius } from '@/lib/design-tokens';

export interface StaffRow {
  id: string;
  fullName: string;
  staffIdNumber: string;
  department: string;
  role: string;
  postingLocation: string | null;
  phone: string | null;
  status: StaffStatus;
  photoUrl: string | null;
  customFields: CustomField[];
}

interface EditableCustomField {
  key: string;
  id?: string;
  fieldName: string;
  fieldValue: string;
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
  const [confirmTarget, setConfirmTarget] = useState<StaffRow | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [editTarget, setEditTarget] = useState<StaffRow | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newPosting, setNewPosting] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [editCustomFields, setEditCustomFields] = useState<EditableCustomField[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const newRoleInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return staff.filter((row) => {
      if (departmentFilter !== 'all' && row.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      return true;
    });
  }, [staff, departmentFilter, statusFilter]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!confirmTarget) return;
    confirmButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmTarget(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [confirmTarget]);

  useEffect(() => {
    if (!editTarget) return;
    newRoleInputRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setEditTarget(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editTarget]);

  function openEdit(row: StaffRow) {
    setEditError(null);
    setNewRole(row.role);
    setNewPosting(row.postingLocation ?? '');
    setNewPhone(row.phone ?? '');
    setEditCustomFields(
      row.customFields.map((field) => ({
        key: field.id,
        id: field.id,
        fieldName: field.field_name,
        fieldValue: field.field_value ?? '',
      }))
    );
    setEditTarget(row);
  }

  function addCustomFieldRow() {
    setEditCustomFields((rows) => [
      ...rows,
      { key: crypto.randomUUID(), fieldName: '', fieldValue: '' },
    ]);
  }

  function updateCustomFieldRow(key: string, patch: Partial<Pick<EditableCustomField, 'fieldName' | 'fieldValue'>>) {
    setEditCustomFields((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeCustomFieldRow(key: string) {
    setEditCustomFields((rows) => rows.filter((row) => row.key !== key));
  }

  async function handleConfirmEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;

    const trimmedRole = newRole.trim();
    const trimmedPosting = newPosting.trim();
    const trimmedPhone = newPhone.trim();

    if (!trimmedRole) {
      setEditError('Rank is required.');
      return;
    }

    const customFieldsPayload = editCustomFields
      .map((row) => ({ id: row.id, field_name: row.fieldName.trim(), field_value: row.fieldValue.trim() }))
      .filter((row) => row.field_name);

    const originalCustomFieldsSignature = JSON.stringify(
      [...editTarget.customFields]
        .map((f) => ({ id: f.id, field_name: f.field_name, field_value: f.field_value ?? '' }))
        .sort((a, b) => a.id.localeCompare(b.id))
    );
    const currentCustomFieldsSignature = JSON.stringify(
      [...customFieldsPayload].sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''))
    );

    const unchanged =
      trimmedRole === editTarget.role &&
      trimmedPosting === (editTarget.postingLocation ?? '') &&
      trimmedPhone === (editTarget.phone ?? '') &&
      currentCustomFieldsSignature === originalCustomFieldsSignature;
    if (unchanged) {
      setEditError('No changes to save.');
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/staff/${editTarget.id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: trimmedRole,
          posting_location: trimmedPosting || null,
          phone: trimmedPhone || null,
          custom_fields: customFieldsPayload,
        }),
      });
      const body = await res.json();

      if (!body.success) {
        setEditError(body.message ?? 'Failed to save changes.');
        return;
      }

      setToastMessage(`${editTarget.fullName}'s details were updated.`);
      setEditTarget(null);
      router.refresh();
    } catch {
      setEditError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmRevoke() {
    if (!confirmTarget) return;
    const id = confirmTarget.id;
    const name = confirmTarget.fullName;

    setRevokingId(id);
    setErrorMessage(null);
    setConfirmTarget(null);

    try {
      const res = await fetch(`/api/staff/${id}/revoke`, { method: 'PATCH' });
      const body = await res.json();

      if (!body.success) {
        setErrorMessage(body.message ?? 'Failed to revoke staff ID.');
        return;
      }

      setToastMessage(`${name}'s staff ID has been revoked.`);
      router.refresh();
    } catch {
      setErrorMessage('Failed to revoke staff ID.');
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="field" style={{ margin: 0 }}>
          <label className="field-label" htmlFor="department-filter">
            Department
          </label>
          <select
            id="department-filter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value="all">All departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field" style={{ margin: 0 }}>
          <label className="field-label" htmlFor="status-filter">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="alert alert-error" style={{ marginBottom: 12 }}>
          {errorMessage}
        </p>
      )}

      {/* Table layout: shown at >= 641px, hidden below via .staff-table-scroll in globals.css */}
      <div className="staff-table-scroll" style={{ overflowX: 'auto' }}>
        <table className="staff-table">
          <thead>
            <tr>
              <th style={thStyle}>Photo</th>
              <th style={thStyle}>Full name</th>
              <th style={thStyle}>Staff ID</th>
              <th style={thStyle}>Department</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Posting</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td style={tdStyle}>
                  <StaffPhoto row={row} width={40} height={44} />
                </td>
                <td style={tdStyle}>{row.fullName}</td>
                <td style={{ ...tdStyle, fontFamily: 'var(--font-geist-mono)' }}>{row.staffIdNumber}</td>
                <td style={tdStyle}>{row.department}</td>
                <td style={tdStyle}>{row.role}</td>
                <td style={tdStyle}>{row.postingLocation ?? '—'}</td>
                <td style={tdStyle}>{row.phone ?? '—'}</td>
                <td style={tdStyle}>
                  <StatusBadge status={row.status} />
                </td>
                <td style={tdStyle}>
                  {row.status === 'active' && (
                    <RowActions
                      row={row}
                      revoking={revokingId === row.id}
                      onRevoke={() => setConfirmTarget(row)}
                      onEdit={() => openEdit(row)}
                    />
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: colors.textMuted }}>
                  No staff records match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Card layout: shown at <= 640px via .staff-cards in globals.css, same data as the table above */}
      <div className="staff-cards">
        {filtered.map((row) => (
          <article key={row.id} className="staff-card">
            <div style={{ display: 'flex', gap: 12 }}>
              <StaffPhoto row={row} width={52} height={58} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: colors.text }}>
                  {row.fullName}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 13,
                    fontFamily: 'var(--font-geist-mono)',
                    color: colors.textMuted,
                  }}
                >
                  {row.staffIdNumber}
                </p>
                <div style={{ marginTop: 6 }}>
                  <StatusBadge status={row.status} />
                </div>
              </div>
            </div>

            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                margin: '12px 0 0',
                fontSize: 13,
              }}
            >
              <div>
                <dt style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700 }}>Department</dt>
                <dd style={{ margin: 0, color: colors.text }}>{row.department}</dd>
              </div>
              <div>
                <dt style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700 }}>Role</dt>
                <dd style={{ margin: 0, color: colors.text }}>{row.role}</dd>
              </div>
              <div>
                <dt style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700 }}>Posting</dt>
                <dd style={{ margin: 0, color: colors.text }}>{row.postingLocation ?? '—'}</dd>
              </div>
              <div>
                <dt style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700 }}>Phone</dt>
                <dd style={{ margin: 0, color: colors.text }}>{row.phone ?? '—'}</dd>
              </div>
            </dl>

            {row.status === 'active' && (
              <div style={{ marginTop: 12 }}>
                <RowActions
                  row={row}
                  revoking={revokingId === row.id}
                  onRevoke={() => setConfirmTarget(row)}
                  onEdit={() => openEdit(row)}
                  fullWidth
                />
              </div>
            )}
          </article>
        ))}
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
            No staff records match these filters.
          </p>
        )}
      </div>

      {confirmTarget && (
        <div
          className="modal-overlay"
          onClick={() => setConfirmTarget(null)}
        >
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="revoke-modal-title"
            aria-describedby="revoke-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="revoke-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>
              Revoke staff ID?
            </h2>
            <p id="revoke-modal-desc" style={{ marginTop: 8, fontSize: 14, color: colors.textMuted }}>
              This will revoke the ID for <strong>{confirmTarget.fullName}</strong> (
              {confirmTarget.staffIdNumber}). This cannot be undone from here.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmTarget(null)}>
                Cancel
              </button>
              <button
                ref={confirmButtonRef}
                className="btn btn-danger-solid"
                onClick={handleConfirmRevoke}
              >
                Revoke ID
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>
              Edit officer
            </h2>
            <p style={{ marginTop: 8, fontSize: 14, color: colors.textMuted }}>
              <strong>{editTarget.fullName}</strong> ({editTarget.staffIdNumber})
            </p>
            <form onSubmit={handleConfirmEdit}>
              <div className="field">
                <label className="field-label" htmlFor="edit-role">
                  Rank
                </label>
                <input
                  ref={newRoleInputRef}
                  id="edit-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="input"
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="edit-posting">
                  Posting location
                </label>
                <input
                  id="edit-posting"
                  value={newPosting}
                  onChange={(e) => setNewPosting(e.target.value)}
                  className="input"
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="edit-phone">
                  Phone number
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="input"
                />
              </div>

              <div className="field">
                <span className="field-label">Custom fields</span>
                {editCustomFields.map((row) => (
                  <div key={row.key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      value={row.fieldName}
                      onChange={(e) => updateCustomFieldRow(row.key, { fieldName: e.target.value })}
                      placeholder="Field name"
                      className="input"
                      style={{ flex: 1 }}
                      aria-label="Custom field name"
                    />
                    <input
                      value={row.fieldValue}
                      onChange={(e) => updateCustomFieldRow(row.key, { fieldValue: e.target.value })}
                      placeholder="Value"
                      className="input"
                      style={{ flex: 1 }}
                      aria-label="Custom field value"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => removeCustomFieldRow(row.key)}
                      aria-label={`Remove ${row.fieldName || 'custom'} field`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addCustomFieldRow}>
                  + Add field
                </button>
              </div>

              {editError && (
                <p role="alert" className="field-error">
                  {editError}
                </p>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div role="status" className="toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

function StaffPhoto({ row, width, height }: { row: StaffRow; width: number; height: number }) {
  if (row.photoUrl) {
    return (
      <Image
        src={row.photoUrl}
        alt={`Photo of ${row.fullName}`}
        width={width}
        height={height}
        style={{ objectFit: 'cover', border: `1px solid ${colors.border}`, borderRadius: radius.sm }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`No photo on file for ${row.fullName}`}
      style={{
        width,
        height,
        background: colors.surfaceMuted,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.sm,
      }}
    />
  );
}

function RowActions({
  row,
  revoking,
  onRevoke,
  onEdit,
  fullWidth,
}: {
  row: StaffRow;
  revoking: boolean;
  onRevoke: () => void;
  onEdit: () => void;
  fullWidth?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <a
        href={`/api/staff/card?staff_id_number=${encodeURIComponent(row.staffIdNumber)}`}
        className="btn btn-secondary btn-sm"
        style={fullWidth ? { flex: 1 } : undefined}
      >
        Download card
      </a>
      <button
        onClick={onEdit}
        className="btn btn-secondary btn-sm"
        style={fullWidth ? { flex: 1 } : undefined}
      >
        Edit
      </button>
      <button
        onClick={onRevoke}
        disabled={revoking}
        className="btn btn-danger btn-sm"
        style={fullWidth ? { flex: 1 } : undefined}
      >
        {revoking ? 'Revoking…' : 'Revoke'}
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: StaffStatus }) {
  const map: Record<StaffStatus, { bg: string; fg: string }> = {
    active: { bg: colors.successBg, fg: colors.success },
    revoked: { bg: colors.dangerBg, fg: colors.danger },
    expired: { bg: colors.warningBg, fg: colors.warning },
  };
  const { bg, fg } = map[status];

  return (
    <span
      style={{
        background: bg,
        color: fg,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        display: 'inline-block',
      }}
    >
      {status}
    </span>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 700,
  color: colors.text,
  padding: '10px 12px',
  borderBottom: `2px solid ${colors.borderLight}`,
};

const tdStyle: React.CSSProperties = {
  fontSize: 13,
  color: colors.text,
  padding: '10px 12px',
  borderBottom: `1px solid ${colors.borderLight}`,
};
