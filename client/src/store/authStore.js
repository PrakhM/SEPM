import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Session state for the shell.
 *
 * PLACEHOLDER — Increment 1 (auth) has not been built yet, so there is no
 * `/auth/me` endpoint to hydrate this from. The demo user below only exists so
 * the shell's user section renders something; replace `hydrate()` with a real
 * fetch once authService.js lands. Everything else in the app should read the
 * user from here rather than assuming auth works.
 */
const PLACEHOLDER_USER = {
  id: 'placeholder-user',
  name: 'Demo User',
  email: 'demo@fintrack.app',
  avatarUrl: null,
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user: PLACEHOLDER_USER,
      isAuthenticated: true,

      /** Swap the demo user for the real session response. */
      setSession: (user, isAuthenticated = true) =>
        set({ user, isAuthenticated }),

      /** Temporary stand-in for the logout endpoint. */
      logout: () => set({ user: null, isAuthenticated: false }),

      /**
       * Temporary stand-in for the login endpoint. Exists so the shell's
       * logout button leads somewhere recoverable before auth is built -
       * without it, logging out strands the placeholder on /login with no way
       * back except a reload. Delete alongside the rest of this store's
       * placeholder surface once authService.js lands.
       */
      signInAsDemoUser: () =>
        set({ user: PLACEHOLDER_USER, isAuthenticated: true }),
    }),
    {
      name: 'fintrack-session',
      // Persist only real sessions; the demo identity is never restored, so a
      // reload always returns to a signed-in shell. A real session is issued
      // by the server and must survive reloads via its own token.
      partialize: (state) =>
        state.isAuthenticated && state.user?.id !== PLACEHOLDER_USER.id
          ? { user: state.user, isAuthenticated: true }
          : {},
    },
  ),
);

/**
 * Two-letter initials for the avatar fallback. Skips honorifics so
 * "Dr. Zoya Mehta" reads "ZM", not "DZ".
 */
export function getInitials(name) {
  if (!name) return '?';
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !/^(dr|mr|mrs|ms|prof)\.?$/i.test(part));

  const source = parts.length ? parts : String(name).trim().split(/\s+/);
  return source
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
