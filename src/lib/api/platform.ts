/**
 * Typed wrappers over the backend platform-owner endpoints (/api/v1/platform).
 * Every call requires a super_admin Bearer token and unwraps the {data}
 * envelope. See @/types/platform for the response shapes.
 */

import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope } from "@/types/auth";
import type {
  ClientDetail,
  ClientListItem,
  ListClientsParams,
  PaginatedClients,
  PlatformMetrics,
} from "@/types/platform";

/** GET /platform/metrics — top-line platform KPIs. */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const { data } = await apiClient.get<ApiEnvelope<PlatformMetrics>>(
    "/platform/metrics",
  );
  return data.data;
}

/** GET /platform/clients — paginated list of all clients (organizations). */
export async function listClients(
  params: ListClientsParams = {},
): Promise<PaginatedClients> {
  const { page = 1, page_size = 20, q, status = "all" } = params;
  const { data } = await apiClient.get<ApiEnvelope<PaginatedClients>>(
    "/platform/clients",
    {
      params: {
        page,
        page_size,
        status,
        ...(q ? { q } : {}),
      },
    },
  );
  return data.data;
}

/** GET /platform/clients/{id} — full oversight detail for one client. */
export async function getClient(id: string): Promise<ClientDetail> {
  const { data } = await apiClient.get<ApiEnvelope<ClientDetail>>(
    `/platform/clients/${id}`,
  );
  return data.data;
}

/** PATCH /platform/clients/{id} — activate or deactivate a client. */
export async function setClientActive(
  id: string,
  isActive: boolean,
): Promise<ClientListItem> {
  const { data } = await apiClient.patch<ApiEnvelope<ClientListItem>>(
    `/platform/clients/${id}`,
    { is_active: isActive },
  );
  return data.data;
}
