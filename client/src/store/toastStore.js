import { create } from 'zustand';

/**
 * Transient notification queue.
 *
 * Toasts are the one piece of app state with a life cycle rather than a value,
 * so it lives in its own store: any component can `toast.success(...)` without
 * threading a callback down a tree, and the queue is capped so a burst of
 * notifications cannot bury the page it is notifying about.
 *
 * Deliberately NOT persisted and deliberately separate from `authStore` /
 * `uiStore` - a notification that survives a reload is a stale notification.
 *
 * Dismissal is driven by the Toast component that renders each item, not by a
 * timer here, so a toast the user is hovering or tabbing through does not
 * disappear out from under them.
 */

export const TOAST_DEFAULT_DURATION = 4000;

/** Oldest toasts fall off the top past this many. */
export const TOAST_MAX_VISIBLE = 4;

let nextToastId = 0;

export const useToastStore = create((set) => ({
  toasts: [],

  /** @returns {string} the new toast's id, for a manual `dismiss`. */
  push: ({ variant = 'info', duration = TOAST_DEFAULT_DURATION, ...rest }) => {
    const id = `toast-${++nextToastId}`;
    set((state) => ({
      toasts: [...state.toasts, { id, variant, duration, ...rest }].slice(
        -TOAST_MAX_VISIBLE,
      ),
    }));
    return id;
  },

  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  clear: () => set({ toasts: [] }),
}));

/**
 * Imperative API: `toast.success('Saved', { description: '…' })`.
 * The message is the only required part; `duration: 0` pins a toast until it
 * is dismissed by hand.
 */
function notify(variant) {
  return (title, options = {}) =>
    useToastStore.getState().push({ variant, title, ...options });
}

export const toast = {
  success: notify('success'),
  error: notify('error'),
  info: notify('info'),
  dismiss: (id) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
};
