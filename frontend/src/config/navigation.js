import { Permission } from '../domain/permissions';

/**
 * The one place a screen is declared. The sidebar renders from this list and
 * the router guards from the same `permission` field, so a new page can never
 * drift out of sync with the menu that links to it.
 *
 * `permission: null` means "any signed-in account".
 */
export const NAV_ITEMS = Object.freeze([
  { to: '/', label: 'Dashboard', icon: '🏠', permission: null, end: true },
  { to: '/books', label: 'Books', icon: '📚', permission: Permission.VIEW_CATALOG },
  { to: '/my-borrows', label: 'My borrows', icon: '🔖', permission: Permission.BORROW_BOOKS },
  { to: '/requests', label: 'Borrow requests', icon: '✅', permission: Permission.VERIFY_BORROWS },
  { to: '/catalog', label: 'Authors & categories', icon: '🗂️', permission: Permission.MANAGE_AUTHORS },
  { to: '/search', label: 'Search', icon: '🔍', permission: Permission.VIEW_CATALOG },
  { to: '/profile', label: 'Profile', icon: '👤', permission: null },
]);

export const visibleNavItems = (can) =>
  NAV_ITEMS.filter((item) => !item.permission || can(item.permission));
