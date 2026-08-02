import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute, PublicOnlyRoute } from './components/routing/ProtectedRoute';
import { AuthLayout } from './pages/AuthLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { BooksPage } from './pages/BooksPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { MyBorrowsPage } from './pages/MyBorrowsPage';
import { BorrowRequestsPage } from './pages/BorrowRequestsPage';
import { CatalogPage } from './pages/CatalogPage';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { Permission } from './domain/permissions';

/**
 * Every signed-in screen in one table, guarded by the same `permission` values
 * the sidebar filters on (see `config/navigation.js`). A new page is one row
 * here plus one row there — the guarding logic itself is never rewritten.
 *
 * `permission: null` means "any signed-in account".
 */
export const APP_ROUTES = Object.freeze([
  { path: '/', element: <DashboardPage />, permission: null },
  { path: '/books', element: <BooksPage />, permission: Permission.VIEW_CATALOG },
  { path: '/books/:id', element: <BookDetailPage />, permission: Permission.VIEW_CATALOG },
  { path: '/my-borrows', element: <MyBorrowsPage />, permission: Permission.BORROW_BOOKS },
  { path: '/requests', element: <BorrowRequestsPage />, permission: Permission.VERIFY_BORROWS },
  { path: '/catalog', element: <CatalogPage />, permission: Permission.MANAGE_AUTHORS },
  { path: '/search', element: <SearchPage />, permission: Permission.VIEW_CATALOG },
  { path: '/profile', element: <ProfilePage />, permission: null },
]);

export function AppRoutes() {
  return (
    <Routes>
      {/* Signed-out chrome. */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
        </Route>
      </Route>

      {/* Signed-in chrome. The outer guard handles authentication; the inner
          one handles authorisation per route. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {APP_ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute permission={route.permission}>{route.element}</ProtectedRoute>
              }
            />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
