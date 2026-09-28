export type StaffStatus = 'active' | 'revoked' | 'expired';

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  other_names?: string | null;
  staff_id_number: string;
  department_id: string;
  role: string;
  posting_location?: string | null;
  phone?: string | null;
  employment_date: string;
  photo_path?: string | null;
  signature_path?: string | null;
  status: StaffStatus;
  issued_at: string;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RankHistoryEntry {
  id: string;
  staff_id: string;
  previous_role: string;
  new_role: string;
  changed_at: string;
  changed_by: string | null;
}

export interface CustomField {
  id: string;
  staff_id: string;
  field_name: string;
  field_value: string | null;
}
