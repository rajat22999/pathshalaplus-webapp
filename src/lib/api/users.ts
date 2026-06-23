/** Typed wrappers over the backend user-provisioning endpoints. */

import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope } from "@/types/auth";
import type {
  CreateUserPayload,
  ListUsersParams,
  PaginatedUsers,
  UpdateUserPayload,
  UserRecord,
} from "@/types/users";

/**
 * GET /users — list users visible to the caller (own school for admin/staff,
 * all schools for super_admin). Returns the unwrapped paginated payload.
 */
export async function listUsers(
  params: ListUsersParams = {},
): Promise<PaginatedUsers> {
  const { page = 1, page_size = 20, role, q } = params;
  const { data } = await apiClient.get<ApiEnvelope<PaginatedUsers>>("/users", {
    params: {
      page,
      page_size,
      ...(role ? { role } : {}),
      ...(q ? { q } : {}),
    },
  });
  return data.data;
}

/** POST /users — provision a new user (manager: super_admin | admin). */
export async function createUser(
  payload: CreateUserPayload,
): Promise<UserRecord> {
  const { data } = await apiClient.post<ApiEnvelope<UserRecord>>(
    "/users",
    payload,
  );
  return data.data;
}

/** GET /users/{id} — fetch a single user (scoped to the caller). */
export async function getUser(id: string): Promise<UserRecord> {
  const { data } = await apiClient.get<ApiEnvelope<UserRecord>>(
    `/users/${id}`,
  );
  return data.data;
}

/** PATCH /users/{id} — update a user (manager; scoped). */
export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<UserRecord> {
  const { data } = await apiClient.patch<ApiEnvelope<UserRecord>>(
    `/users/${id}`,
    payload,
  );
  return data.data;
}
