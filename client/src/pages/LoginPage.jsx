import { TrendingUp } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../store/authStore.js';

/**
 * PLACEHOLDER — real login/register forms arrive with Increment 1 (auth).
 *
 * It exists now only so the shell has somewhere to land: AppShell redirects
 * unauthenticated visitors to /login, and without a route for that path the
 * wildcard route would bounce them straight back into the shell, looping.
 * Replace the whole page once authService.js exists.
 */
export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const signInAsDemoUser = useAuthStore((state) => state.signInAsDemoUser);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-control bg-primary text-primary-contrast">
          <TrendingUp className="size-6" aria-hidden="true" />
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-text">
          Fin<span className="text-primary">Track</span>
        </h1>

        <div className="mt-6 rounded-card border border-border bg-surface p-6 text-left shadow-card">
          <span className="inline-flex rounded-pill bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary-on-subtle">
            Increment 1
          </span>
          <h2 className="mt-3 text-lg font-semibold text-text">Sign in</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Email and password sign-in, plus registration, land here with the
            auth increment. The shell around this page is already built.
          </p>

          <button
            type="button"
            onClick={signInAsDemoUser}
            className="mt-5 inline-flex w-full items-center justify-center rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-light active:bg-primary-dark"
          >
            Continue as demo user
          </button>
        </div>
      </div>
    </div>
  );
}
