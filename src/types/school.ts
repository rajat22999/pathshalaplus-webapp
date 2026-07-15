/**
 * Types mirroring the backend school-admin contract (/api/v1/school). Every
 * money amount is a whole number in the subscription's currency (see
 * @/lib/format for INR rendering).
 */

/** The organization (umbrella billing account) block of GET /school/overview. */
export interface SchoolOrganization {
  id: string;
  name: string;
  code: string;
  business_email: string | null;
  contact_number: string | null;
  country_code: string | null;
  is_active: boolean;
  created_at: string;
}

/** The school (campus) block of GET /school/overview and PUT /school. */
export interface SchoolInfo {
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

/** A single add-on line inside the subscription block. */
export interface SchoolSubscriptionAddon {
  code: string;
  name: string;
  price: number;
}

/** The subscription block of GET /school/overview. */
export interface SchoolSubscription {
  plan_code: string;
  plan_name: string;
  status: string;
  billing_cycle: string;
  base_amount: number;
  addons_amount: number;
  total_amount: number;
  currency: string;
  tax_percent: number;
  tax_amount: number;
  addons: SchoolSubscriptionAddon[];
  current_period_start: string | null;
  current_period_end: string | null;
}

/** The last-payment block of GET /school/overview. */
export interface SchoolPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  reference: string | null;
  created_at: string;
}

/** Per-role member counts of GET /school/overview. */
export interface SchoolCounts {
  staff: number;
  teacher: number;
  student: number;
  parent: number;
  admin: number;
  total: number;
}

/** `data` payload of GET /school/overview. */
export interface SchoolOverview {
  organization: SchoolOrganization;
  school: SchoolInfo | null;
  subscription: SchoolSubscription | null;
  last_payment: SchoolPayment | null;
  counts: SchoolCounts;
}

/** Request body for PUT /school — all fields optional. */
export interface UpdateSchoolPayload {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  academic_session?: string;
}
