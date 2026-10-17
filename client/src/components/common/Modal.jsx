import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Centred overlay dialog: dimmed, blurred backdrop, slide-up entrance.
 *
 * Behaviour, all of it handled here so no caller has to remember it:
 *   - Escape closes it.
 *   - A click that lands on the backdrop closes it, but a click that starts
 *     inside the panel and drags out to release on the backdrop does not
 *     (otherwise a text selection that escapes the panel deletes the user's
 *     form).
 *   - Focus moves into the dialog on open, Tab cycles inside it, and focus
 *     returns to whatever was focused before it opened.
 *   - The page behind cannot scroll while it is up.
 *
 * The backdrop uses the static `neutral-900/60` step rather than the semantic
 * `bg-inverse`, for the same reason the nav drawer's scrim does: `bg-inverse`
 * flips per mode, so a scrim built from it would flash near-white at night.
 *
 * There is no exit animation - `open={false}` unmounts immediately. A modal is
 * the last thing between the user and the action they asked for, so it should
 * leave the way it arrived: now.
 */

/** Everything that can hold focus, in DOM order, minus the plumbing. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    // Hidden-but-present controls are not tabbable, so they must not count as
    // either end of the cycle.
    (node) => node.offsetParent !== null || node === document.activeElement,
  );
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {string} title     Also the dialog's accessible name.
 * @param {string} description Secondary line, read out with the title.
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {boolean} dismissible  False pins it open (an in-flight submit, a
 *                                destructive confirmation). Escape and the
 *                                backdrop then do nothing; an explicit Cancel
 *                                or the form's own control must close it.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  dismissible = true,
  footer,
  children,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;

    // Lock the page behind the dialog, restoring whatever overflow value was
    // already there (the nav drawer sets its own, and the two can overlap).
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus in after paint, so the entrance animation does not scroll the
    // panel back into view as it animates in from 12px below.
    const frame = requestAnimationFrame(() => {
      const focusable = getFocusable(panelRef.current);
      (focusable[0] ?? panelRef.current)?.focus();
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && dismissible) {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusable(panelRef.current);
      // Nothing to cycle through: hold focus on the panel itself rather than
      // letting it escape to the page behind.
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Hand focus back to the control that opened the dialog, so a keyboard
      // user resumes where they left off instead of at the top of the page.
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, dismissible, onClose]);

  // Portals need a document. This app is client-rendered, so this is only ever
  // true under SSR/prerendering, where a modal has nothing to portal into yet.
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        onClick={() => dismissible && onClose()}
        className="absolute inset-0 animate-modal-backdrop-in bg-neutral-900/60 backdrop-blur-sm motion-reduce:animate-none"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card-raised animate-modal-panel-in outline-none motion-reduce:animate-none sm:max-h-[calc(100dvh-3rem)] ${SIZES[size] ?? SIZES.md}`}
      >
        {/* Pressing Escape closes, but it has to be a visible control too - not
            everyone uses a keyboard. */}
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2
                id={titleId}
                className="text-lg font-semibold tracking-tight text-text"
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm text-text-secondary"
              >
                {description}
              </p>
            )}
          </div>

          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mt-1 -mr-1 rounded-control p-1.5 text-text-tertiary transition-colors duration-200 hover:bg-bg-subtle hover:text-text"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-bg-subtle px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
