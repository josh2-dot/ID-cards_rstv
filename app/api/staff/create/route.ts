import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { generateStaffIdNumber } from '@/lib/generate-staff-id';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

function isValidName(value: string) {
  return /^[A-Za-z\s\-']+$/.test(value);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const firstName = String(formData.get('first_name') ?? '').trim();
    const lastName = String(formData.get('last_name') ?? '').trim();
    const otherNames = String(formData.get('other_names') ?? '').trim();
    const departmentId = String(formData.get('department_id') ?? '').trim();
    const departmentCode = String(formData.get('department_code') ?? '').trim().toUpperCase();
    const role = String(formData.get('role') ?? '').trim();
    const employmentDate = String(formData.get('employment_date') ?? '').trim();
    const photo = formData.get('photo') as File | null;
    const signature = formData.get('signature') as File | null;

    // ---- Validation ----
    if (!firstName || !isValidName(firstName)) {
      return NextResponse.json(
        { success: false, message: 'A valid first name is required.' },
        { status: 400 }
      );
    }
    if (!lastName || !isValidName(lastName)) {
      return NextResponse.json(
        { success: false, message: 'A valid last name is required.' },
        { status: 400 }
      );
    }
    if (!departmentId || !departmentCode) {
      return NextResponse.json(
        { success: false, message: 'Department is required.' },
        { status: 400 }
      );
    }
    if (!role) {
      return NextResponse.json({ success: false, message: 'Role is required.' }, { status: 400 });
    }
    if (!employmentDate || isNaN(Date.parse(employmentDate))) {
      return NextResponse.json(
        { success: false, message: 'A valid employment date is required.' },
        { status: 400 }
      );
    }
    if (!photo || photo.size === 0) {
      return NextResponse.json(
        { success: false, message: 'A staff photo is required.' },
        { status: 400 }
      );
    }
    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Photo exceeds the 2MB size limit.' },
        { status: 400 }
      );
    }
    if (!ALLOWED_MIME_TYPES.includes(photo.type)) {
      return NextResponse.json(
        { success: false, message: 'Photo must be a JPG or PNG.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // ---- Upload photo to Storage ----
    const photoExt = photo.type === 'image/png' ? 'png' : 'jpg';
    const photoFileName = `${crypto.randomUUID()}.${photoExt}`;
    const photoBuffer = Buffer.from(await photo.arrayBuffer());

    const { error: photoUploadError } = await supabase.storage
      .from('staff-id-assets')
      .upload(`photos/${photoFileName}`, photoBuffer, { contentType: photo.type });

    if (photoUploadError) {
      throw new Error(`Photo upload failed: ${photoUploadError.message}`);
    }

    // ---- Optional signature upload ----
    let signatureFileName: string | null = null;
    if (signature && signature.size > 0) {
      if (signature.size > MAX_FILE_SIZE || !ALLOWED_MIME_TYPES.includes(signature.type)) {
        return NextResponse.json(
          { success: false, message: 'Signature must be a JPG or PNG under 2MB.' },
          { status: 400 }
        );
      }
      const sigExt = signature.type === 'image/png' ? 'png' : 'jpg';
      signatureFileName = `${crypto.randomUUID()}.${sigExt}`;
      const sigBuffer = Buffer.from(await signature.arrayBuffer());

      const { error: sigUploadError } = await supabase.storage
        .from('staff-id-assets')
        .upload(`signatures/${signatureFileName}`, sigBuffer, { contentType: signature.type });

      if (sigUploadError) {
        throw new Error(`Signature upload failed: ${sigUploadError.message}`);
      }
    }

    // ---- Generate the staff ID number ----
    const staffIdNumber = await generateStaffIdNumber(supabase, departmentCode);

    // ---- Insert the record ----
    const { data, error } = await supabase
      .from('staff')
      .insert({
        first_name: firstName,
        last_name: lastName,
        other_names: otherNames || null,
        staff_id_number: staffIdNumber,
        department_id: departmentId,
        role,
        employment_date: employmentDate,
        photo_path: `photos/${photoFileName}`,
        signature_path: signatureFileName ? `signatures/${signatureFileName}` : null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save staff record: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Staff ID created successfully.',
      staff: data,
    });
  } catch (err) {
    console.error('[staff/create] error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
