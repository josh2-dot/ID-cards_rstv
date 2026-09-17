import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface VerifyResult {
  success: boolean;
  valid?: boolean;
  status?: string;
  is_expired?: boolean;
  message?: string;
  staff?: {
    staff_id_number: string;
    full_name: string;
    role: string;
    department: { name: string; code: string } | null;
    organization: { name: string; logo_url: string | null; primary_color: string | null } | null;
  };
}

/**
 * Single source of truth for "is this staff ID valid right now" —
 * used by both app/api/staff/verify/route.ts (for programmatic checks)
 * and app/verify/page.tsx (what a QR scan lands on).
 */
export async function verifyStaffId(rawId: string): Promise<VerifyResult> {
  const staffIdNumber = rawId.trim().toUpperCase();

  if (!staffIdNumber) {
    return { success: false, message: 'Staff ID number is required.' };
  }

  const supabase = getSupabaseServerClient();

  const { data: staff, error } = await supabase
    .from('staff')
    .select(
      'staff_id_number, first_name, last_name, role, status, expires_at, departments(name, code), organizations(name, logo_url, primary_color)'
    )
    .eq('staff_id_number', staffIdNumber)
    .single();

  if (error || !staff) {
    return { success: false, message: 'No staff record found for this ID.' };
  }

  const isExpired = staff.expires_at ? new Date(staff.expires_at) < new Date() : false;
  const isValid = staff.status === 'active' && !isExpired;

  return {
    success: true,
    valid: isValid,
    status: staff.status,
    is_expired: isExpired,
    staff: {
      staff_id_number: staff.staff_id_number,
      full_name: `${staff.first_name} ${staff.last_name}`,
      role: staff.role,
      department: (staff.departments as unknown as { name: string; code: string } | null) ?? null,
      organization:
        (staff.organizations as unknown as {
          name: string;
          logo_url: string | null;
          primary_color: string | null;
        } | null) ?? null,
    },
  };
}
