import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore.js';

/**
 * Route guard for everything behind the login.
 *
 * Unauthenticated visitors are sent to /login, and the page they were
 * actually after travels along in router state so LoginPage can send them
 * back there once they have signed in, instead of always landing on the
 * dashboard.
 *
 * This is the *only* place the redirect lives: App.jsx wraps the shell (and
 * the review harnesses) in it, so there is one rule to read and one rule to
 * change.
 */
export default function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
