/**
 * Front-end mirror of the backend create/manage permission matrix
 * (app/core/roles.py). These helpers gate UI affordances only — the backend
 * remains the source of truth and re-enforces every rule.
 */

export const ROLE_SUPER_ADMIN = "super_admin";
export const ROLE_ADMIN = "admin";
export const ROLE_STAFF = "staff";
export const ROLE_TEACHER = "teacher";
export const ROLE_STUDENT = "student";
export const ROLE_PARENT = "parent";

/** Target roles a super_admin may create/manage (never another super_admin). */
const SUPER_ADMIN_CREATABLE = [
  ROLE_ADMIN,
  ROLE_STAFF,
  ROLE_TEACHER,
  ROLE_STUDENT,
  ROLE_PARENT,
];

/** Target roles an admin may create/manage (own school only). */
const ADMIN_CREATABLE = [ROLE_STAFF, ROLE_TEACHER, ROLE_STUDENT, ROLE_PARENT];

/**
 * Roles the given caller may create. Mirrors the backend CREATE matrix:
 *   super_admin -> {admin, staff, teacher, student, parent}  (never super_admin)
 *   admin       -> {staff, teacher, student, parent}
 *   everyone else -> []
 */
export function creatableRoles(currentRole: string | null | undefined): string[] {
  switch (currentRole) {
    case ROLE_SUPER_ADMIN:
      return [...SUPER_ADMIN_CREATABLE];
    case ROLE_ADMIN:
      return [...ADMIN_CREATABLE];
    default:
      return [];
  }
}

/** Whether the caller may create/update users (super_admin or admin). */
export function canManageUsers(role: string | null | undefined): boolean {
  return role === ROLE_SUPER_ADMIN || role === ROLE_ADMIN;
}

/** Whether the caller may view the users list (super_admin, admin or staff). */
export function canViewUsers(role: string | null | undefined): boolean {
  return (
    role === ROLE_SUPER_ADMIN || role === ROLE_ADMIN || role === ROLE_STAFF
  );
}

/**
 * Whether the caller may create/update students (admin or staff). Mirrors the
 * backend student-management matrix — super_admin is NOT a student manager
 * (they use the platform console).
 */
export function canManageStudents(role: string | null | undefined): boolean {
  return role === ROLE_ADMIN || role === ROLE_STAFF;
}

/** Whether the caller may view the students roster (admin, staff or teacher). */
export function canViewStudents(role: string | null | undefined): boolean {
  return (
    role === ROLE_ADMIN || role === ROLE_STAFF || role === ROLE_TEACHER
  );
}

/**
 * The landing route for a freshly authenticated user, by role + onboarding
 * state:
 *   super_admin                       -> /superadmin (the platform console)
 *   any other role, not yet onboarded -> /onboarding (org wizard or profile
 *                                        completion, per the role)
 *   otherwise                         -> /dashboard  (the school CRM)
 *
 * Note: super_admin is a platform role and skips the school onboarding flow.
 */
export function homeForRole(
  role: string | null | undefined,
  onboardingCompleted: boolean,
): string {
  if (role === ROLE_SUPER_ADMIN) return "/superadmin";
  if (!onboardingCompleted) return "/onboarding";
  return "/dashboard";
}
