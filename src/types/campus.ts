/**
 * Types mirroring the backend multi-campus contract (/api/v1/school/campuses).
 * A "campus" is a School row under the admin's organization; the admin's active
 * campus is the school whose id equals admin.school_id (is_active_campus).
 */

/** A single campus (school) under the admin's organization. */
export interface Campus {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  academic_session: string | null;
  /** The school's own active/inactive flag (not the "active campus" flag). */
  is_active: boolean;
  created_at: string;
  /** Number of users whose school_id == this school's id. */
  user_count: number;
  /** True when this is the admin's currently-active campus (school_id match). */
  is_active_campus: boolean;
}

/** `data` payload of GET /school/campuses. */
export interface CampusList {
  active_school_id: string | null;
  campuses: Campus[];
}

/** Request body for POST /school/campuses. */
export interface AddCampusPayload {
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  academic_session: string;
}
