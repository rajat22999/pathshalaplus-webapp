/** Shared types for the organization-onboarding wizard. */

export type CodeStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export interface WizardForm {
  // Step 1 — organization
  orgName: string;
  orgCode: string;
  orgCodeEdited: boolean;
  orgEmail: string;
  orgPhone: string | undefined;
  // Step 2 — school campus
  schoolName: string;
  schoolCode: string;
  schoolCodeEdited: boolean;
  schoolPhone: string | undefined;
  schoolEmail: string;
  schoolAddress: string;
  academicSession: string;
  // Step 3 — admin profile
  firstName: string;
  lastName: string;
  adminEmail: string;
  // Step 4 — billing
  addons: string[];
}

export type UpdateForm = (patch: Partial<WizardForm>) => void;
