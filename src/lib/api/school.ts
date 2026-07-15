/**
 * Typed wrappers over the backend school-admin endpoints (/api/v1/school).
 * Every call requires an admin Bearer token and unwraps the {data} envelope.
 * See @/types/school for the response shapes.
 */

import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope } from "@/types/auth";
import type { AddCampusPayload, Campus, CampusList } from "@/types/campus";
import type {
  SchoolInfo,
  SchoolOverview,
  UpdateSchoolPayload,
} from "@/types/school";

/** GET /school/overview — the school-admin dashboard payload. */
export async function getSchoolOverview(): Promise<SchoolOverview> {
  const { data } = await apiClient.get<ApiEnvelope<SchoolOverview>>(
    "/school/overview",
  );
  return data.data;
}

/** PUT /school — update the caller's school (campus) details. */
export async function updateSchool(
  payload: UpdateSchoolPayload,
): Promise<SchoolInfo> {
  const { data } = await apiClient.put<ApiEnvelope<SchoolInfo>>(
    "/school",
    payload,
  );
  return data.data;
}

/** GET /school/campuses — every campus under the admin's organization. */
export async function listCampuses(): Promise<CampusList> {
  const { data } =
    await apiClient.get<ApiEnvelope<CampusList>>("/school/campuses");
  return data.data;
}

/** POST /school/campuses — create a new campus under the admin's organization. */
export async function addCampus(payload: AddCampusPayload): Promise<Campus> {
  const { data } = await apiClient.post<ApiEnvelope<Campus>>(
    "/school/campuses",
    payload,
  );
  return data.data;
}

/** PUT /school/active — set the admin's active campus (admin.school_id). */
export async function setActiveCampus(
  schoolId: string,
): Promise<{ active_school_id: string | null }> {
  const { data } = await apiClient.put<
    ApiEnvelope<{ active_school_id: string | null }>
  >("/school/active", { school_id: schoolId });
  return data.data;
}
