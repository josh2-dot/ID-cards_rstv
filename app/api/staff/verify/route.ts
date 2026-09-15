import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const staffIdNumber = String(body?.staff_id_number ?? '').trim().toUpperCase();

    if (!staffIdNumber) {
      return NextResponse.json(
        { success: false, message: 'Staff ID number is required.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: staff, error } = await supabase
      .from('staff')
      .select('staff_id_number, first_name, last_name, role, status, expires_at, departments(name, code)')
      .eq('staff_id_number', staffIdNumber)
      .single();

    if (error || !staff) {
      return NextResponse.json(
        { success: false, message: 'No staff record found for this ID.' },
        { status: 404 }
      );
    }

    const isExpired = staff.expires_at ? new Date(staff.expires_at) < new Date() : false;
    const isValid = staff.status === 'active' && !isExpired;

    return NextResponse.json({
      success: true,
      valid: isValid,
      status: staff.status,
      is_expired: isExpired,
      staff: {
        staff_id_number: staff.staff_id_number,
        full_name: `${staff.first_name} ${staff.last_name}`,
        role: staff.role,
        department: staff.departments,
      },
    });
  } catch (err) {
    console.error('[staff/verify] error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
