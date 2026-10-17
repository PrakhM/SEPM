import { createPortal } from 'react-dom';

import { useToastStore } from '../../store/toastStore.js';
import Toast from './Toast.jsx';

/**
 * Renders the toast queue. Mounted once, at the app root, because a toast is
 * triggered from anywhere (a form's submit handler, a future axios error
 * interceptor) and still has to appear in the same place.
 *
 * Placement follows the platform convention: bottom-centre on a phone, where
 * the thumb already is and the top is where the status bar lives; top-right
 * from `sm` up, just below the sticky top bar. The container is
 * pointer-events-none with each toast re-enabling it, so the queue never
 * swallows a click meant for the page behind it.
 */
export default function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  // A stable reference from the store, so it does not become a Toast effect
  // dependency that restarts every countdown on each queue change.
  const dismiss = useToastStore((state) => state.dismiss);

  // Portals need a document. This one is mounted above the router, so it always
  // has one; the check is here only so the component stays self-contained
  // if it is ever rendered during prerendering.
  if (typeof document === 'undefined' || toasts.length === 0) return null;

  return createPortal(
    <div
      aria-label="Notifications"
      // No `items-end`: the column stretches, so every toast is the same width
      // and the stack keeps a straight edge. Shrink-to-fit per toast was tried
      // first and it left a ragged left margin the moment two messages
      // differed in length.
      //
      // Order flips per breakpoint, because the two anchors want opposite
      // things: the phone stack is anchored to the bottom edge, so the newest
      // toast belongs nearest that edge; the desktop stack is anchored to the
      // top-right corner, so the newest belongs nearest the corner instead.
      // One `flex-col-reverse` for both (the first cut) put the oldest toast
      // against the screen edge on mobile, which is backwards.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col gap-2 p-4 sm:inset-x-auto sm:right-6 sm:bottom-auto sm:top-20 sm:w-96 sm:flex-col-reverse sm:p-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full animate-toast-in-bottom motion-reduce:animate-none sm:animate-toast-in-right"
        >
          <Toast toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
