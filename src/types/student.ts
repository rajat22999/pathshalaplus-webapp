/** Types mirroring the backend student-management contract (/api/v1/students). */

/**
 * A student record. This is a User row with role="student", scoped to the
 * actor's active campus, plus the academic profile fields. `name` maps to the
 * User.full_name column; `date_of_birth` is serialized as "YYYY-MM-DD".
 */
export interface StudentRecord {
  id: string;
  name: string | null;
  mobile: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  grade: string | null;
  section: string | null;
  roll_number: string | null;
  admission_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  address: string | null;
}

/** `data` payload of GET /students (a paginated list of students). */
export interface PaginatedStudents {
  items: StudentRecord[];
  total: number;
  page: number;
  page_size: number;
}

/** Request body for POST /students. `name` is required; the rest optional. */
export interface StudentCreatePayload {
  name: string;
  mobile?: string;
  email?: string;
  grade?: string;
  section?: string;
  roll_number?: string;
  admission_number?: string;
  date_of_birth?: string;
  gender?: string;
  guardian_name?: string;
  guardian_phone?: string;
  address?: string;
}

/** Request body for PATCH /students/{id} — any subset of create fields + is_active. */
export interface StudentUpdatePayload {
  name?: string;
  mobile?: string;
  email?: string;
  grade?: string;
  section?: string;
  roll_number?: string;
  admission_number?: string;
  date_of_birth?: string;
  gender?: string;
  guardian_name?: string;
  guardian_phone?: string;
  address?: string;
  is_active?: boolean;
}

/** Query parameters accepted by GET /students. */
export interface ListStudentsParams {
  page?: number;
  page_size?: number;
  q?: string;
  grade?: string;
  section?: string;
  status?: "all" | "active" | "inactive";
}
