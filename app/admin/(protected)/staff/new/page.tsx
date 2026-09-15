'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { Department } from '@/lib/types';

export default function NewStaffPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState('');
  const [employmentDate, setEmploymentDate] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      router.push('/admin/staff');
      router.refresh();
    } catch {
      setError('Failed to create staff record.');
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0b3d91', marginBottom: 20 }}>New Staff</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: 8,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <label style={labelStyle}>First name</label>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={inputStyle} />

        <label style={{ ...labelStyle, marginTop: 12 }}>Last name</label>
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} required style={inputStyle} />

        <label style={{ ...labelStyle, marginTop: 12 }}>Other names</label>
        <input value={otherNames} onChange={(e) => setOtherNames(e.target.value)} style={inputStyle} />

        <label style={{ ...labelStyle, marginTop: 12 }}>Department</label>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          required
          style={inputStyle}
        >
          <option value="">Select a department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        <label style={{ ...labelStyle, marginTop: 12 }}>Role</label>
        <input value={role} onChange={(e) => setRole(e.target.value)} required style={inputStyle} />

        <label style={{ ...labelStyle, marginTop: 12 }}>Employment date</label>
        <input
          type="date"
          value={employmentDate}
          onChange={(e) => setEmploymentDate(e.target.value)}
          required
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: 12 }}>Photo (JPG or PNG, max 2MB)</label>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          required
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: 12 }}>Signature (optional)</label>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setSignature(e.target.files?.[0] ?? null)}
          style={inputStyle}
        />

        {error && <p style={{ color: '#b91c1c', fontSize: 13, marginTop: 12, marginBottom: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 20,
            background: '#0b3d91',
            color: '#ffffff',
            border: 'none',
            borderRadius: 4,
            padding: '10px 0',
            fontSize: 14,
            fontWeight: 700,
            cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Creating…' : 'Create staff ID'}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#1c2628',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  border: '1px solid #b4b4b4',
  borderRadius: 4,
  padding: '8px 10px',
  fontSize: 14,
  color: '#1c2628',
};
