import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = getSupabaseServerClient();

    const { data: staff, error } = await supabase
      .from('staff')
      .update({ status: 'revoked' })
      .eq('id', id)
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
