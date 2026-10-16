import { Menu, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Slim bar above the page content: page title on the left, the page's primary
 * action (if any) on the right. On phones it also carries the hamburger that
 * opens the nav drawer and a compact wordmark.
 */
export default function TopBar({ title, action, onOpenDrawer }) {
  const { label, icon: Icon, onClick, to, disabled } = action ?? {};
  const hasAction = Boolean(label);

  // Same visual treatment either way; only the element and the target differ.
  const actionClass =
    'inline-flex shrink-0 items-center gap-2 rounded-control bg-primary px-3 py-2 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-light active:bg-primary-dark disabled:pointer-events-none disabled:bg-bg-subtle disabled:text-text-tertiary sm:px-4';
  const actionChildren = (
    <>
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {/* Below `sm` the label is dropped so it cannot squeeze the page title
          into an ellipsis on a 375px phone. The icon still carries it via
          aria-label, and the full label returns from `sm` up. */}
      <span className="sr-only sm:not-sr-only">{label}</span>
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open navigation menu"
          className="-ml-1 inline-flex size-10 shrink-0 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        {/* The sidebar carries the wordmark from `lg` up, so this compact mark
            only fills the gap while the sidebar is still a drawer. */}
        <Link
          to="/dashboard"
          className="hidden shrink-0 sm:block lg:hidden"
          aria-label="FinTrack home"
        >
          <span className="flex size-8 items-center justify-center rounded-control bg-primary text-primary-contrast">
            <TrendingUp className="size-4" aria-hidden="true" />
          </span>
        </Link>

        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight text-text sm:text-2xl">
          {title}
        </h1>

        {hasAction &&
          (to ? (
            <Link
              to={to}
              className={actionClass}
              aria-label={label}
              aria-disabled={disabled || undefined}
            >
              {actionChildren}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onClick}
              disabled={disabled}
              className={actionClass}
              aria-label={label}
            >
              {actionChildren}
            </button>
          ))}
      </div>
    </header>
  );
}
