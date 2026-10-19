import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import * as authService from '../services/authService.js';
import { setAuthToken } from '../services/httpClient.js';

/**
 * Session state: the signed-in user and their API token.
 *
 * Both survive a reload (persisted to localStorage under `fintrack-session`),
 * and every authenticated request carries the token through `setAuthToken`
 * on the shared axios instance.
 *
 * The actions deliberately rethrow whatever authService throws - an ApiError
 * carrying `message`, `status` and an optional field-level `details` map - so
 * the form that started the request decides how to present the failure
 * (inline field error, toast, or both). The store stays free of UI concerns.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      /**
       * @throws {ApiError} 401 on bad credentials.
       * @returns the signed-in user, for a welcome toast.
       */
      login: async ({ email, password }) => {
        const { user, token } = await authService.login({ email, password });
        setAuthToken(token);
        set({ user, token, isAuthenticated: true });
        return user;
      },

      /**
       * @throws {ApiError} 409 on a duplicate email, 400 with `details` on
       *                    server-side validation failure.
       */
      register: async ({ name, email, password }) => {
        const { user, token } = await authService.register({
          name,
          email,
          password,
        });
        setAuthToken(token);
        set({ user, token, isAuthenticated: true });
        return user;
      },

      logout: () => {
        setAuthToken(null);
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'fintrack-session',
      // `isAuthenticated` is only ever set in the same `set` as user and
      // token, so it cannot drift from them; persisting the trio means a
      // rehydrated session arrives internally consistent, with no second
      // pass to reconcile the flag.
      partialize: ({ user, token, isAuthenticated }) => ({
        user,
        token,
        isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // The bearer-token header lives in module memory, which a reload
        // wipes; reattach the persisted token so the very first request after
        // a reload is still authenticated.
        setAuthToken(state?.token ?? null);
      },
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
