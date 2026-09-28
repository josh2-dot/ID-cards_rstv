import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseSessionClient } from '@/lib/supabase-session-server';
import { getCurrentOrganization } from '@/lib/get-current-organization';

export async function PATCH(
  req: NextRequest,
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
    const body = await req.json();
    const newRole = String(body.role ?? '').trim();
    const newPosting = body.posting_location == null ? null : String(body.posting_location).trim() || null;
    const newPhone = body.phone == null ? null : String(body.phone).trim() || null;

    const rawCustomFields = Array.isArray(body.custom_fields) ? body.custom_fields : [];
    const customFields: { id?: string; field_name: string; field_value: string }[] = rawCustomFields
      .map((field: { id?: unknown; field_name?: unknown; field_value?: unknown }) => ({
        id: typeof field.id === 'string' ? field.id : undefined,
        field_name: String(field.field_name ?? '').trim(),
        field_value: String(field.field_value ?? '').trim(),
      }))
      .filter((field: { field_name: string }) => field.field_name);

    if (!newRole) {
      return NextResponse.json({ success: false, message: 'Rank is required.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { data: current, error: fetchError } = await supabase
      .from('staff')
      .select('id, role')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json(
        { success: false, message: 'Staff record not found.' },
        { status: 404 }
      );
    }

    const { data: staff, error: updateError } = await supabase
      .from('staff')
      .update({ role: newRole, posting_location: newPosting, phone: newPhone })
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (updateError || !staff) {
      return NextResponse.json(
        { success: false, message: 'Failed to save changes.' },
        { status: 500 }
      );
    }

    if (current.role !== newRole) {
      const sessionClient = await getSupabaseSessionClient();
      const {
        data: { user },
      } = await sessionClient.auth.getUser();

      const { error: historyError } = await supabase.from('rank_history').insert({
        staff_id: id,
        previous_role: current.role,
        new_role: newRole,
        changed_by: user?.id ?? null,
      });

      if (historyError) {
        console.error('[staff/[id]/update] rank_history insert failed:', historyError);
      }
    }

    // ---- Sync custom fields: delete removed, update existing, insert new ----
    const { data: existingFields, error: existingFieldsError } = await supabase
      .from('staff_custom_fields')
      .select('id')
      .eq('staff_id', id);

    if (existingFieldsError) {
      console.error('[staff/[id]/update] failed to load existing custom fields:', existingFieldsError);
    } else {
      const incomingIds = new Set(customFields.map((field) => field.id).filter(Boolean));
      const idsToDelete = (existingFields ?? [])
        .map((field) => field.id)
        .filter((existingId) => !incomingIds.has(existingId));

      if (idsToDelete.length > 0) {
        await supabase.from('staff_custom_fields').delete().in('id', idsToDelete);
      }

      const toUpdate = customFields.filter((field) => field.id);
      const toInsert = customFields.filter((field) => !field.id);

      const updateResults = await Promise.all(
        toUpdate.map((field) =>
          supabase
            .from('staff_custom_fields')
            .update({
              field_name: field.field_name,
              field_value: field.field_value,
              updated_at: new Date().toISOString(),
            })
            .eq('id', field.id)
            .eq('staff_id', id)
        )
      );

      const insertResult =
        toInsert.length > 0
          ? await supabase
              .from('staff_custom_fields')
              .insert(toInsert.map((field) => ({ staff_id: id, ...field })))
          : null;

      const customFieldsError = insertResult?.error ?? updateResults.find((r) => r.error)?.error;

      if (customFieldsError) {
        const message =
          customFieldsError.code === '23505'
            ? 'Two custom fields can’t share the same name.'
            : 'Officer details were saved, but custom fields failed to save.';
        return NextResponse.json({ success: false, message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, staff });
  } catch (err) {
    console.error('[staff/[id]/update] error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
