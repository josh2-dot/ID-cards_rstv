import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { StaffTable, type StaffRow } from './staff-table';
import type { Department } from '@/lib/types';

interface StaffQueryRow {
  id: string;
  first_name: string;
  last_name: string;
  staff_id_number: string;
  role: string;
  status: 'active' | 'revoked' | 'expired';
  photo_path: string | null;
  departments: { name: string } | null;
}

async function getStaffAndDepartments(): Promise<{
  staff: StaffRow[];
  departments: Department[];
}> {
  const supabase = getSupabaseServerClient();

  const [staffResult, departmentsResult] = await Promise.all([
    supabase
      .from('staff')
      .select('id, first_name, last_name, staff_id_number, role, status, photo_path, departments(name)')
      .order('created_at', { ascending: false }),
    supabase.from('departments').select('id, name, code').order('name'),
  ]);

  if (staffResult.error) {
    throw new Error(`Failed to load staff: ${staffResult.error.message}`);
  }
  if (departmentsResult.error) {
    throw new Error(`Failed to load departments: ${departmentsResult.error.message}`);
  }

  const rows = (staffResult.data ?? []) as unknown as StaffQueryRow[];

  const staff: StaffRow[] = await Promise.all(
    rows.map(async (row) => {
      let photoUrl: string | null = null;

      if (row.photo_path) {
        const { data: signed } = await supabase.storage
          .from('staff-id-assets')
          .createSignedUrl(row.photo_path, 300);
        photoUrl = signed?.signedUrl ?? null;
      }

      return {
        id: row.id,
        fullName: `${row.first_name} ${row.last_name}`,
        staffIdNumber: row.staff_id_number,
        department: row.departments?.name ?? '—',
        role: row.role,
        status: row.status,
        photoUrl,
      };
    })
  );

  return { staff, departments: departmentsResult.data ?? [] };
}

export default async function AdminStaffPage() {
  const { staff, departments } = await getStaffAndDepartments();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0b3d91', margin: 0 }}>Staff</h1>
        <Link
          href="/admin/staff/new"
          style={{
            background: '#0b3d91',
            color: '#ffffff',
            borderRadius: 4,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          + New Staff
        </Link>
      </div>

      <StaffTable staff={staff} departments={departments} />
    </div>
  );
}
