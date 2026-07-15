/**
 * Types mirroring the backend platform-owner (super_admin) contract
 * (/api/v1/platform). All money amounts are whole rupees (see @/lib/format).
 */

/** `data` payload of GET /platform/metrics. */
export interface PlatformMetrics {
  total_clients: number;
  active_clients: number;
  total_schools: number;
  active_schools: number;
  active_subscriptions: number;
  total_revenue: number;
  /** ISO 4217 code, e.g. "INR". */
  currency: string;
  /** New client sign-ups in the trailing 30 days. */
  recent_signups: number;
}

/** A school summary attached to a client row. */
export interface ClientSchoolSummary {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
}

/** The account owner (org admin) attached to a client row. */
export interface ClientOwner {
  id: string;
  name: string | null;
  mobile: string | null;
  email: string | null;
}

/** The subscription summary attached to a client row. */
export interface ClientSubscriptionSummary {
  plan_code: string;
  status: string;
  total_amount: number;
  currency: string;
  current_period_end: string | null;
}

/** A single row in GET /platform/clients. */
export interface ClientListItem {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  business_email: string | null;
  contact_number: string | null;
  school: ClientSchoolSummary | null;
  schools_count: number;
  owner: ClientOwner | null;
  subscription: ClientSubscriptionSummary | null;
  users_count: number;
}

/** `data` payload of GET /platform/clients (a paginated list of clients). */
export interface PaginatedClients {
  items: ClientListItem[];
  total: number;
  page: number;
  page_size: number;
}

/** Status filter accepted by GET /platform/clients. */
export type ClientStatusFilter = "all" | "active" | "inactive";

/** Query parameters accepted by GET /platform/clients. */
export interface ListClientsParams {
  page?: number;
  page_size?: number;
  q?: string;
  status?: ClientStatusFilter;
}

/** The organization block of GET /platform/clients/{id}. */
export interface ClientOrganization {
  id: string;
  name: string;
  code: string;
  business_email: string | null;
  contact_number: string | null;
  country_code: string | null;
  is_active: boolean;
  created_at: string;
}

/** A full school record in GET /platform/clients/{id}. */
export interface ClientSchool {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  academic_session: string | null;
  is_active: boolean;
  created_at: string;
}

/** A full subscription record in GET /platform/clients/{id}. */
export interface ClientSubscription {
  id: string;
  plan_code: string;
  status: string;
  total_amount: number;
  currency: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

/** A payment record in GET /platform/clients/{id}. */
export interface ClientPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  reference: string | null;
  created_at: string;
}

/** A user record in GET /platform/clients/{id}. */
export interface ClientUser {
  id: string;
  name: string | null;
  mobile: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

/** Aggregate counts block of GET /platform/clients/{id}. */
export interface ClientCounts {
  schools: number;
  users: number;
  payments: number;
}

/** `data` payload of GET /platform/clients/{id}. */
export interface ClientDetail {
  organization: ClientOrganization;
  schools: ClientSchool[];
  subscription: ClientSubscription | null;
  subscriptions: ClientSubscription[];
  payments: ClientPayment[];
  users: ClientUser[];
  counts: ClientCounts;
}
