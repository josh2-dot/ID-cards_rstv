import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { StaffIdCardDocument, StaffCardData } from '@/lib/card-pdf';

export async function GET(req: NextRequest) {
  try {
    const staffIdNumber = req.nextUrl.searchParams.get('staff_id_number')?.trim().toUpperCase();

    if (!staffIdNumber) {
      return NextResponse.json(
        { success: false, message: 'staff_id_number is required.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*, departments(name, code)')
      .eq('staff_id_number', staffIdNumber)
      .single();

    if (error || !staff) {
      return NextResponse.json(
        { success: false, message: 'Staff record not found.' },
        { status: 404 }
      );
    }

    if (staff.status !== 'active') {
      return NextResponse.json(
        { success: false, message: `Cannot generate a card for a ${staff.status} staff record.` },
        { status: 403 }
      );
    }

    // ---- Signed URL + fetch for the photo (bucket is private) ----
    let photoDataUri: string | null = null;
    if (staff.photo_path) {
      const { data: signed } = await supabase.storage
        .from('staff-id-assets')
        .createSignedUrl(staff.photo_path, 60);

      if (signed?.signedUrl) {
        const res = await fetch(signed.signedUrl);
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = staff.photo_path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        photoDataUri = `data:${mime};base64,${buf.toString('base64')}`;
      }
    }

    // ---- Same for the signature, if present ----
    let signatureDataUri: string | null = null;
    if (staff.signature_path) {
      const { data: signed } = await supabase.storage
        .from('staff-id-assets')
        .createSignedUrl(staff.signature_path, 60);

      if (signed?.signedUrl) {
        const res = await fetch(signed.signedUrl);
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = staff.signature_path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        signatureDataUri = `data:${mime};base64,${buf.toString('base64')}`;
      }
    }

    // ---- QR pointing at the public verify page ----
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
    const verifyUrl = `${baseUrl}/verify?id=${encodeURIComponent(staff.staff_id_number)}`;
    const qrDataUri = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 });

    const cardData: StaffCardData = {
      fullName: `${staff.first_name} ${staff.last_name}`,
      staffIdNumber: staff.staff_id_number,
      department: staff.departments?.name ?? '—',
      role: staff.role,
      employmentDate: staff.employment_date,
      expiresAt: staff.expires_at ?? null,
      photoDataUri,
      signatureDataUri,
      qrDataUri,
    };

    const pdfBuffer = await renderToBuffer(<StaffIdCardDocument data={cardData} />);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="RSTV_ID_${staff.staff_id_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[staff/card] error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
