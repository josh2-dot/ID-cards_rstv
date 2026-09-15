'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { Department } from '@/lib/types';
import { colors, spacing } from '@/lib/design-tokens';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

function validatePhoto(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Photo must be a JPG or PNG file.';
  if (file.size > MAX_FILE_SIZE) return 'Photo exceeds the 2MB size limit.';
  return null;
}

export default function NewStaffPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState('');
  const [employmentDate, setEmploymentDate] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdStaffId, setCreatedStaffId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from('departments')
      .select('id, name, code')
      .order('name')
      .then(({ data, error: fetchError }) => {
        if (!fetchError && data) setDepartments(data);
      });
  }, []);

  const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function applyPhotoFile(file: File | null) {
    if (!file) {
      setPhoto(null);
      setPhotoError(null);
      return;
    }
    const validationError = validatePhoto(file);
    setPhotoError(validationError);
    setPhoto(validationError ? null : file);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    applyPhotoFile(file);
  }

  function handleSignatureChange(file: File | null) {
    if (!file) {
      setSignature(null);
      setSignatureError(null);
      return;
    }
    const validationError = validatePhoto(file);
    setSignatureError(validationError);
    setSignature(validationError ? null : file);
  }

  function resetForm() {
    setFirstName('');
    setLastName('');
    setOtherNames('');
    setDepartmentId('');
    setRole('');
    setEmploymentDate('');
    setPhoto(null);
    setSignature(null);
    setPhotoError(null);
    setSignatureError(null);
    setCreatedStaffId(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const department = departments.find((d) => d.id === departmentId);
    if (!department) {
      setError('Please select a department.');
      return;
    }
    if (!photo) {
      setError('A staff photo is required.');
      return;
    }
    if (photoError || signatureError) {
      setError('Please fix the highlighted file errors before submitting.');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.set('first_name', firstName);
    formData.set('last_name', lastName);
    formData.set('other_names', otherNames);
    formData.set('department_id', department.id);
    formData.set('department_code', department.code);
    formData.set('role', role);
    formData.set('employment_date', employmentDate);
    formData.set('photo', photo);
    if (signature) formData.set('signature', signature);

    try {
      const res = await fetch('/api/staff/create', { method: 'POST', body: formData });
      const body = await res.json();

      if (!body.success) {
        setError(body.message ?? 'Failed to create staff record.');
        setSubmitting(false);
        return;
      }

      setCreatedStaffId(body.staff?.staff_id_number ?? null);
      setSubmitting(false);
    } catch {
      setError('Failed to create staff record.');
      setSubmitting(false);
    }
  }

  if (createdStaffId) {
    return (
      <div>
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href="/admin/staff">Staff</Link>
          <span aria-hidden="true">/</span>
          <span className="current">New Staff</span>
        </nav>

        <div
          role="status"
          className="alert alert-success"
          style={{ flexDirection: 'column', alignItems: 'flex-start', padding: spacing.xl, maxWidth: 420 }}
        >
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Staff ID created successfully</p>
          <p style={{ margin: '8px 0 0', fontWeight: 400, fontFamily: 'var(--font-geist-mono)' }}>
            {createdStaffId}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: spacing.lg }}>
            <button type="button" className="btn btn-primary" onClick={resetForm}>
              Add another
            </button>
            <Link href="/admin/staff" className="btn btn-secondary">
              Back to staff list
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/admin/staff">Staff</Link>
        <span aria-hidden="true">/</span>
        <span className="current">New Staff</span>
      </nav>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: spacing.xl }}>
        New Staff
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 440,
          background: colors.surface,
          borderRadius: 8,
          padding: spacing.xl,
        }}
      >
        <div className="field">
          <label className="field-label" htmlFor="first-name">
            First name
          </label>
          <input
            id="first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="last-name">
            Last name
          </label>
          <input
            id="last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="other-names">
            Other names
          </label>
          <input
            id="other-names"
            value={otherNames}
            onChange={(e) => setOtherNames(e.target.value)}
            className="input"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="department">
            Department
          </label>
          <select
            id="department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
            className="input"
          >
            <option value="">Select a department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="role">
            Role
          </label>
          <input id="role" value={role} onChange={(e) => setRole(e.target.value)} required className="input" />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="employment-date">
            Employment date
          </label>
          <input
            id="employment-date"
            type="date"
            value={employmentDate}
            onChange={(e) => setEmploymentDate(e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="field">
          <span className="field-label" id="photo-caption">
            Photo (JPG or PNG, max 2MB)
          </span>
          <label
            htmlFor="photo-input"
            className={`dropzone${isDragOver ? ' is-dragover' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimizable remote asset
              <img src={photoPreview} alt="Selected staff photo preview" className="dropzone-preview" />
            ) : (
              <div
                role="img"
                aria-label="No photo selected"
                className="dropzone-preview"
                style={{ background: colors.background }}
              />
            )}
            <p id="photo-hint" style={{ margin: 0, fontSize: 13, color: colors.text, fontWeight: 600 }}>
              {photo ? photo.name : 'Drag a photo here, or click to browse'}
            </p>
            <input
              ref={photoInputRef}
              id="photo-input"
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => applyPhotoFile(e.target.files?.[0] ?? null)}
              className="visually-hidden"
              aria-label="Staff photo"
              aria-describedby="photo-caption photo-hint"
            />
          </label>
          {photoError && (
            <p role="alert" className="field-error">
              {photoError}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="signature-input">
            Signature (optional)
          </label>
          <input
            id="signature-input"
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleSignatureChange(e.target.files?.[0] ?? null)}
            className="input"
            aria-invalid={signatureError ? 'true' : undefined}
          />
          {signatureError && (
            <p role="alert" className="field-error">
              {signatureError}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="alert alert-error" style={{ marginTop: spacing.lg }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', marginTop: spacing.lg }}>
          {submitting ? 'Creating…' : 'Create staff ID'}
        </button>
      </form>
    </div>
  );
}
