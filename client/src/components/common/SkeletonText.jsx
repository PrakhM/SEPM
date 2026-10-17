import Skeleton from './Skeleton.jsx';

/**
 * A paragraph's worth of skeleton lines, for replacing a block of text while it
 * loads.
 *
 * The last line is shortened, because a paragraph of full-width bars reads as a
 * loading table rather than as prose, and a real paragraph never ends flush
 * with the margin.
 *
 * @param {number} lines
 */
export default function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={`h-3 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}
