import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * One notification.
 *
 * Reads as an alert for errors and as a status for everything else, and owns
 * its own dismiss timer so the queue in the store stays dumb.
 *
 * The timer pauses while the toast is hovered or has focus inside it - a 4s
 * auto-dismiss that keeps running under the pointer makes long messages
 * unreadable, and it is the difference between WCAG's "pause on hover" being
 * honoured or not. The thin bar along the bottom edge is that same timer made
 * visible, so the countdown is never a surprise.
 */

const VARIANTS = {
  success: { Icon: CircleCheck, accent: 'text-success' },
  error: { Icon: CircleAlert, accent: 'text-danger' },
  info: { Icon: Info, accent: 'text-info' },
};

export default function Toast({ toast, onDismiss }) {
  const { id, variant, title, description, duration } = toast;
  const { Icon, accent } = VARIANTS[variant] ?? VARIANTS.info;

  const [paused, setPaused] = useState(false);
  // Time still owed, updated when the timer is interrupted so resuming picks up
  // where it left off instead of restarting a full four seconds.
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0);

  useEffect(() => {
    // `duration: 0` means "stay until dismissed", so no timer at all.
    if (!duration || paused) return undefined;

    startedAtRef.current = Date.now();
    const timer = setTimeout(() => onDismiss(id), remainingRef.current);

    return () => {
      clearTimeout(timer);
      remainingRef.current = Math.max(
        0,
        remainingRef.current - (Date.now() - startedAtRef.current),
      );
    };
  }, [id, duration, paused, onDismiss]);

  return (
    <div
      // Errors interrupt; everything else waits its turn in the queue.
      role={variant === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        // Only unpause once focus has left the toast entirely, not when it moves
        // from the message to the close button inside it.
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
      className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-card border border-border bg-surface p-4 pr-11 shadow-card-raised"
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${accent}`} aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{title}</p>
        {description && (
          <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        )}
      </div>

      {/* Always reachable, so the timer is never the only way to dismiss. */}
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label={`Dismiss notification: ${title}`}
        className="absolute top-2.5 right-2.5 rounded-control p-1 text-text-tertiary transition-colors duration-200 hover:bg-bg-subtle hover:text-text"
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      {duration > 0 && (
        <span
          aria-hidden="true"
          // `animate-toast-life` (a @theme motion token) carries the timing
          // function and fill mode; the duration and the paused state have to
          // come from this toast's own timer, so they are set inline.
          className={`animate-toast-life absolute bottom-0 left-0 h-0.5 w-full motion-reduce:hidden ${
            variant === 'error'
              ? 'bg-danger'
              : variant === 'success'
                ? 'bg-success'
                : 'bg-info'
          }`}
          style={{
            animationDuration: `${duration}ms`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      )}
    </div>
  );
}
