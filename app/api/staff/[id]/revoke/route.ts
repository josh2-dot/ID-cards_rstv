import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentOrganization } from '@/lib/get-current-organization';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const supabase = getSupabaseServerClient();

    const { data: staff, error } = await supabase
      .from('staff')
      .update({ status: 'revoked' })
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (error || !staff) {
      return NextResponse.json(
        { success: false, message: 'Staff record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, staff });
  } catch (err) {
    console.error('[staff/[id]/revoke] error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
