import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const THEME_STORAGE_KEY = 'fintrack-theme';

export const isTheme = (value) => value === 'light' || value === 'dark';

/** Read the persisted/system preference. Runs in the browser only. */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Private mode or blocked storage - fall through to the system choice.
  }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/** Mirror the theme onto <html> so Tailwind's `dark:` variant can see it. */
function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  root.dataset.theme = theme;
}

/**
 * UI-only state. Deliberately separate from feature stores so that toggling
 * the theme cannot re-render or invalidate any data store.
 */
export const useUiStore = create(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),

      setTheme: (theme) => {
        if (!isTheme(theme)) return;
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      // Store the bare theme string, not the whole store shape.
      partialize: (state) => ({ theme: state.theme }),
      // Paint the class before the first render so there is no flash of the
      // wrong theme; `applyTheme` is pure and safe to call on the server.
      onRehydrateStorage: () => (state) => applyTheme(state?.theme ?? 'light'),
    },
  ),
);

// Apply once at module load so the very first paint is already correct.
applyTheme(useUiStore.getState().theme);
