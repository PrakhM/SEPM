/**
 * Pulsing placeholder block for loading states.
 *
 * A skeleton earns its name from matching the shape of whatever it replaces -
 * a list of six row skeletons should be the same height as the six rows that
 * arrive after, so nothing shifts when the data lands. That means the height,
 * radius and spacing come from the caller (via `className`) rather than being
 * fixed here; this only supplies the fill and the pulse.
 *
 * `motion-reduce:animate-none` stops the pulse for users who have asked for
 * reduced motion - the block still reads as a placeholder, just a still one.
 *
 * @param {boolean} circle  Round it, for avatars and dots.
 */
export default function Skeleton({ circle = false, className = '' }) {
  return (
    <div
      // Not announced: a skeleton is decorative, and `aria-busy` / a loading
      // label belongs on the region that contains it.
      aria-hidden="true"
      className={`animate-pulse bg-bg-subtle motion-reduce:animate-none ${circle ? 'rounded-pill' : 'rounded-control'} ${className}`}
    />
  );
}
