import { useUiStore } from '../store/uiStore.js';

/**
 * Animated light/dark switch. The two glyphs are stacked and cross-fade with
 * a rotate + scale, rather than being a checkbox with a label beside it.
 */
export default function ThemeToggle({ className = '' }) {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';

  const nextLabel = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
      className={`inline-flex size-9 items-center justify-center rounded-control border border-border bg-surface text-text-secondary transition-colors duration-200 hover:bg-bg-subtle hover:text-text ${className}`}
    >
      <span className="relative block size-5">
        {/* Sun — light mode */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className={`absolute inset-0 size-5 transition-all duration-300 ease-out motion-reduce:transition-none ${
            isDark
              ? 'rotate-90 scale-50 opacity-0'
              : 'rotate-0 scale-100 opacity-100'
          }`}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>

        {/* Moon — dark mode */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`absolute inset-0 size-5 transition-all duration-300 ease-out motion-reduce:transition-none ${
            isDark
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-50 opacity-0'
          }`}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      </span>
    </button>
  );
}
