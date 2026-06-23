/** Types mirroring the backend user-provisioning contract (/api/v1/users). */

/**
 * A managed user record. This is the Profile shape plus a `created_at`
 * timestamp (ISO string), returned by the /users endpoints.
 */
export interface UserRecord {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  country_code: string | null;
  role: string;
  school_id: string | null;
  profile_picture: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

/** Request body for POST /users. */
export interface CreateUserPayload {
  mobile?: string;
  country_code?: string;
  email?: string;
  role: string;
  name?: string;
  school_id?: string;
}

/** Request body for PATCH /users/{id} — all fields optional. */
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
}

/** `data` payload of GET /users (a paginated list of users). */
export interface PaginatedUsers {
  items: UserRecord[];
  total: number;
  page: number;
  page_size: number;
}

/** Query parameters accepted by GET /users. */
export interface ListUsersParams {
  page?: number;
  page_size?: number;
  role?: string;
  q?: string;
}
