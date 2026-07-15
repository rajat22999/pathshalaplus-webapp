/** Typed wrappers over the backend student-management endpoints. */

import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope } from "@/types/auth";
import type {
  ListStudentsParams,
  PaginatedStudents,
  StudentCreatePayload,
  StudentRecord,
  StudentUpdatePayload,
} from "@/types/student";

/**
 * GET /students — list students (role="student") in the actor's active campus.
 * Returns the unwrapped paginated payload.
 */
export async function listStudents(
  params: ListStudentsParams = {},
): Promise<PaginatedStudents> {
  const {
    page = 1,
    page_size = 20,
    q,
    grade,
    section,
    status = "all",
  } = params;
  const { data } = await apiClient.get<ApiEnvelope<PaginatedStudents>>(
    "/students",
    {
      params: {
        page,
        page_size,
        status,
        ...(q ? { q } : {}),
        ...(grade ? { grade } : {}),
        ...(section ? { section } : {}),
      },
    },
  );
  return data.data;
}

/** POST /students — create a student (manager: admin | staff). */
export async function createStudent(
  payload: StudentCreatePayload,
): Promise<StudentRecord> {
  const { data } = await apiClient.post<ApiEnvelope<StudentRecord>>(
    "/students",
    payload,
  );
  return data.data;
}

/** GET /students/{id} — fetch a single student (scoped to the active campus). */
export async function getStudent(id: string): Promise<StudentRecord> {
  const { data } = await apiClient.get<ApiEnvelope<StudentRecord>>(
    `/students/${id}`,
  );
  return data.data;
}

/** PATCH /students/{id} — update a student (manager; scoped). */
export async function updateStudent(
  id: string,
  payload: StudentUpdatePayload,
): Promise<StudentRecord> {
  const { data } = await apiClient.patch<ApiEnvelope<StudentRecord>>(
    `/students/${id}`,
    payload,
  );
  return data.data;
}
