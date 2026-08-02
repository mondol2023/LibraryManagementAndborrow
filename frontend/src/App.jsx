import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppRoutes } from './routes';

/**
 * Composition root: the only place that knows how the providers nest.
 * Toasts sit outside auth because session-expiry notices are raised by the
 * network layer, before any page is mounted.
 */
export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
