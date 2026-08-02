/** Mirrors `users.User.ROLE_CHOICES`. */
export const Role = Object.freeze({
  ADMIN: 'admin',
  STUDENT: 'student',
  TEACHER: 'teacher',
  STAFF: 'staff',
  OTHER: 'other',
});

export const ROLE_LABELS = Object.freeze({
  [Role.ADMIN]: 'Admin',
  [Role.STUDENT]: 'Student',
  [Role.TEACHER]: 'Teacher',
  [Role.STAFF]: 'Staff',
  [Role.OTHER]: 'Other',
});

/**
 * `users.permissions.IsLibrarian` — the desk roles that administer the library
 * rather than borrow from it.
 */
export const LIBRARIAN_ROLES = Object.freeze([Role.ADMIN, Role.STAFF]);

/** `users.permissions.IsUser` — the roles that hold loans. */
export const MEMBER_ROLES = Object.freeze([Role.STUDENT, Role.TEACHER, Role.OTHER]);

/** Every role, in the order admin screens should list them. */
export const ALL_ROLES = Object.freeze([
  Role.ADMIN,
  Role.STAFF,
  Role.STUDENT,
  Role.TEACHER,
  Role.OTHER,
]);

/** Ready for `<Select options>` on admin filters and role editors. */
export const ROLE_OPTIONS = Object.freeze(
  ALL_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
);

/** Roles offered on the public sign-up form, with what to expect afterwards. */
export const SIGNUP_ROLES = Object.freeze([
  { value: Role.STUDENT, label: 'Student' },
  { value: Role.TEACHER, label: 'Teacher' },
  { value: Role.OTHER, label: 'Other' },
  { value: Role.STAFF, label: 'Staff (needs approval)' },
  { value: Role.ADMIN, label: 'Admin (needs approval)' },
]);

/**
 * `users.permissions.IsAll` now covers every role — staff included, which it
 * once did not. Keeping the list explicit means that if a future role reaches
 * the model without reaching `IsAll`, the exception lives here rather than
 * scattered through the pages.
 */
export const ROLES_WITH_API_ACCESS = ALL_ROLES;

export const roleLabel = (role) => ROLE_LABELS[role] ?? 'Unknown';

/** Badge tone per role, so every screen colours an account the same way. */
export const ROLE_TONES = Object.freeze({
  [Role.ADMIN]: 'danger',
  [Role.STAFF]: 'brand',
  [Role.STUDENT]: 'info',
  [Role.TEACHER]: 'success',
  [Role.OTHER]: 'neutral',
});

export const roleTone = (role) => ROLE_TONES[role] ?? 'neutral';

export const isLibrarianRole = (role) => LIBRARIAN_ROLES.includes(role);
