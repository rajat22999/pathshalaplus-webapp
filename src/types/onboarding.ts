/** Types mirroring the backend onboarding + billing contract (/api/v1). */

import type { Profile } from "@/types/auth";

/** A priced add-on line (snapshot stored on the subscription). */
export interface AddonLine {
  code: string;
  name: string;
  price: number;
}

/** A selectable add-on from the catalog. */
export interface CatalogAddon extends AddonLine {
  icon: string;
  description: string;
}

export interface BasePlan {
  code: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

/** `data` payload of GET /billing/catalog. */
export interface BillingCatalog {
  base_plan: BasePlan;
  addons: CatalogAddon[];
  tax_percent: number;
  currency: string;
  billing_cycle: string;
}

/** `data` payload of POST /billing/quote. */
export interface Quote {
  plan_code: string;
  billing_cycle: string;
  currency: string;
  base_amount: number;
  addons_amount: number;
  subtotal_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  lines: AddonLine[];
}

/** `data` payload of GET /onboarding/check-code. */
export interface CodeCheck {
  type: "org" | "school";
  code: string;
  valid: boolean;
  available: boolean;
}

/** `data` payload of GET /onboarding/status. */
export interface OnboardingStatus {
  onboarding_completed: boolean;
  has_organization: boolean;
  organization_id: string | null;
  prefill: {
    mobile: string | null;
    country_code: string | null;
    email: string | null;
    first_name: string;
    last_name: string;
  };
}

export interface OrganizationInput {
  name: string;
  code: string;
  business_email: string;
  contact_number: string;
  country_code?: string;
}

export interface SchoolInput {
  name: string;
  code: string;
  phone: string;
  country_code?: string;
  email: string;
  address: string;
  academic_session: string;
}

export interface AdminProfileInput {
  first_name: string;
  last_name: string;
  email: string;
}

/** Request body for POST /onboarding. */
export interface OnboardingPayload {
  organization: OrganizationInput;
  school: SchoolInput;
  admin: AdminProfileInput;
  addons: string[];
}

export interface OrganizationRecord {
  id: string;
  name: string;
  code: string;
  business_email: string;
  contact_number: string;
  country_code: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SchoolRecord {
  id: string;
  organization_id: string | null;
  name: string;
  code: string | null;
  phone: string | null;
  country_code: string | null;
  email: string | null;
  address: string | null;
  academic_session: string | null;
  is_active: boolean;
}

export interface SubscriptionRecord {
  id: string;
  organization_id: string;
  plan_code: string;
  billing_cycle: string;
  status: string;
  currency: string;
  base_amount: number;
  addons_amount: number;
  subtotal_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  addons: AddonLine[];
  current_period_start: string | null;
  current_period_end: string | null;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  reference: string;
  created_at: string;
}

/** `data` payload of POST /onboarding. */
export interface OnboardingResult {
  organization: OrganizationRecord;
  school: SchoolRecord;
  subscription: SubscriptionRecord;
  payment: PaymentRecord;
  profile: Profile;
}
