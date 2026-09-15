import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Generates the next staff ID number in the format:
 *   RSTV-<DEPT_CODE>-<YEAR>-<SEQUENCE>
 *   e.g. RSTV-ENG-2026-0032
 *
 * Uses the `next_staff_seq` Postgres function so the counter
 * increments atomically even under concurrent requests.
 */
export async function generateStaffIdNumber(
  supabase: SupabaseClient,
  departmentCode: string
): Promise<string> {
  const year = new Date().getFullYear();

  const { data, error } = await supabase.rpc('next_staff_seq', {
    dept_code: departmentCode,
    yr: year,
  });

  if (error) {
    throw new Error(`Failed to generate staff ID: ${error.message}`);
  }

  const seq = String(data).padStart(4, '0');
  return `RSTV-${departmentCode}-${year}-${seq}`;
}
