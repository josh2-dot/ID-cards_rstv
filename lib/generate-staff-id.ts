import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Generates the next staff ID number in the format:
 *   <ORG_SLUG>-<DEPT_CODE>-<YEAR>-<SEQUENCE>
 *   e.g. RSTV-ENG-2026-0032
 *
 * The prefix comes from the organization's slug (uppercased) rather than a
 * fixed literal, so each tenant gets its own ID scheme -- RStV's slug is
 * "rstv", so its IDs keep the same RSTV- prefix they've always had.
 *
 * Uses the `next_staff_seq` Postgres function so the counter increments
 * atomically per organization+department+year, even under concurrent
 * requests.
 */
export async function generateStaffIdNumber(
  supabase: SupabaseClient,
  organizationId: string,
  organizationSlug: string,
  departmentCode: string
): Promise<string> {
  const year = new Date().getFullYear();

  const { data, error } = await supabase.rpc('next_staff_seq', {
    p_organization_id: organizationId,
    dept_code: departmentCode,
    yr: year,
  });

  if (error) {
    throw new Error(`Failed to generate staff ID: ${error.message}`);
  }

  const seq = String(data).padStart(4, '0');
  const prefix = organizationSlug.toUpperCase();
  return `${prefix}-${departmentCode}-${year}-${seq}`;
}
