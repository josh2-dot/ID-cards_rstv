import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentOrganization } from '@/lib/get-current-organization';
import { StaffTable, type StaffRow } from './staff-table';
import type { Department } from '@/lib/types';
import { colors, spacing } from '@/lib/design-tokens';

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

async function getStaffAndDepartments(organizationId: string): Promise<{
  staff: StaffRow[];
  departments: Department[];
}> {
  const supabase = getSupabaseServerClient();

  const [staffResult, departmentsResult] = await Promise.all([
    supabase
      .from('staff')
      .select('id, first_name, last_name, staff_id_number, role, status, photo_path, departments(name)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false }),
    supabase
      .from('departments')
      .select('id, name, code')
      .eq('organization_id', organizationId)
      .order('name'),
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
  const organization = await getCurrentOrganization();
  if (!organization) {
    redirect('/admin/login');
  }

  const { staff, departments } = await getStaffAndDepartments(organization.id);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/admin/staff">Staff</Link>
      </nav>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
          flexWrap: 'wrap',
          marginBottom: spacing.xl,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>Staff</h1>
        <Link href="/admin/staff/new" className="btn btn-primary">
          + New Staff
        </Link>
      </div>

      <StaffTable staff={staff} departments={departments} />
    </div>
  );
}
