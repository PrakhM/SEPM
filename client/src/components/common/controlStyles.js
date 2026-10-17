/**
 * Shared metrics for the form controls (Button, Input, Select).
 *
 * They live here, in one place, because the three primitives have to agree on
 * height: a row of "input + button" breaks visually the moment one of them is a
 * pixel off. Adding a size means adding one row to CONTROL_SIZES, never editing
 * three components.
 *
 * Not a component file, so it exports lookups only.
 */

/**
 * `control` is the fixed height - `h-*` rather than padding, so the box does
 * not grow when a button has an icon or when the font falls back to a taller
 * one. `text`/`icon` scale with it.
 */
export const CONTROL_SIZES = {
  sm: { control: 'h-8', text: 'text-xs', icon: 'size-3.5', gap: 'gap-1.5' },
  md: { control: 'h-10', text: 'text-sm', icon: 'size-4', gap: 'gap-2' },
  lg: { control: 'h-12', text: 'text-base', icon: 'size-5', gap: 'gap-2' },
};

/** Unknown sizes fall back to `md` rather than rendering an unstyled control. */
export function controlSize(size) {
  return CONTROL_SIZES[size] ?? CONTROL_SIZES.md;
}

/**
 * Focus treatment for the field controls.
 *
 * The ring itself is NOT drawn here: `index.css` already gives every
 * interactive element a 2px `--c-primary` outline at a 2px offset on
 * :focus-visible (see its `:focus-visible` rule). Controls only add the border
 * colour change, which is what a pointer user sees. Keeping one ring system
 * means a focus ring looks identical on a sidebar link, a Button and an Input,
 * and no component has to remember to draw its own.
 */
export const FOCUS_BORDER = 'focus:border-primary';

/** Invalid state. `aria-invalid` is set by the field wrapper, not just here. */
export const INVALID_BORDER = 'border-danger focus:border-danger';

/** Placeholder colour is its own step so it never reads as real input. */
export const CONTROL_BASE =
  'w-full rounded-control border bg-surface text-text transition-colors duration-200 placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:text-text-tertiary';
