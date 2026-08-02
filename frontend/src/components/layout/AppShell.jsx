import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../hooks/useAuth';
import { hasApiAccess } from '../../domain/permissions';
import { Alert } from '../ui';

/**
 * The frame every signed-in page renders inside. Pages supply content only —
 * they never repeat the chrome.
 */
export function AppShell() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {!hasApiAccess(user) && (
            <Alert tone="warning" title="Limited account" className="mb-6">
              The API does not grant your role access to library data yet. Ask an admin to update
              your account role.
            </Alert>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
