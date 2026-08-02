import { Role, MEMBER_ROLES, ROLES_WITH_API_ACCESS } from './roles';

/**
 * The frontend mirror of the DRF permission classes.
 *
 * Every "can this user do X?" question in the UI resolves here, so a rule
 * change is a one-line edit and no component ever compares a role string
 * itself. This hides buttons that would 403 — the server stays the authority.
 */
export const Permission = Object.freeze({
  VIEW_CATALOG: 'catalog:view',
  MANAGE_BOOKS: 'books:manage',
  DELETE_BOOKS: 'books:delete',
  MANAGE_AUTHORS: 'authors:manage',
  MANAGE_CATEGORIES: 'categories:manage',
  DELETE_LOOKUPS: 'lookups:delete',
  BORROW_BOOKS: 'borrow:create',
  BORROW_FOR_OTHERS: 'borrow:create-for-others',
  VIEW_ALL_BORROWS: 'borrow:view-all',
  VERIFY_BORROWS: 'borrow:verify',
  RETURN_ANY_BORROW: 'borrow:return-any',
  SEARCH_USERS: 'search:users',
  VIEW_ANY_PENALTY: 'penalty:view-any',
  ADJUST_PENALTIES: 'penalty:adjust',
  VIEW_USERS: 'users:view',
  CREATE_USERS: 'users:create',
  EDIT_USERS: 'users:edit',
  APPROVE_USERS: 'users:approve',
  DEACTIVATE_USERS: 'users:deactivate',
  VIEW_ACCOUNT_PANELS: 'dashboard:accounts',
});

/**
 * `IsLibrarian` — what an admin and a staff member share. Staff run the desk:
 * catalogue, loans, and read-only access to the member list.
 */
const LIBRARIAN_PERMISSIONS = [
  Permission.VIEW_CATALOG,
  Permission.MANAGE_BOOKS,
  Permission.MANAGE_AUTHORS,
  Permission.MANAGE_CATEGORIES,
  Permission.BORROW_BOOKS,
  Permission.BORROW_FOR_OTHERS,
  Permission.VIEW_ALL_BORROWS,
  Permission.VERIFY_BORROWS,
  Permission.RETURN_ANY_BORROW,
  Permission.SEARCH_USERS,
  Permission.VIEW_ANY_PENALTY,
  Permission.VIEW_USERS,
];

/** role -> permissions. Adding a role means adding a row, nothing else. */
const ROLE_PERMISSIONS = {
  [Role.ADMIN]: Object.values(Permission),
  ...Object.fromEntries(
    MEMBER_ROLES.map((role) => [role, [Permission.VIEW_CATALOG, Permission.BORROW_BOOKS]]),
  ),
  // Everything destructive or account-shaping stays with admins: the backend
  // gates DELETE, user create/edit, approval and penalty writes on `IsAdmin`,
  // and withholds the `users` dashboard panel from staff.
  [Role.STAFF]: LIBRARIAN_PERMISSIONS,
};

export const permissionsFor = (role) => ROLE_PERMISSIONS[role] ?? [];

export const can = (user, permission) =>
  Boolean(user) && permissionsFor(user.role).includes(permission);

export const isAdmin = (user) => user?.role === Role.ADMIN;

/** Admin or staff — the desk roles the API calls "librarian". */
export const isLibrarian = (user) => can(user, Permission.VIEW_ALL_BORROWS);

export const hasApiAccess = (user) =>
  Boolean(user) && ROLES_WITH_API_ACCESS.includes(user.role);
