import Button from './Button.jsx';

/**
 * What a list shows when it has nothing in it: an icon, one short sentence, and
 * - where there is an obvious next step - the button that takes it.
 *
 * The message is deliberately the instruction, not the diagnosis ("No
 * transactions yet - add your first one" rather than "0 results"), because the
 * user's next move is what the empty state exists to prompt.
 *
 * @param {React.ComponentType} icon
 * @param {string} title
 * @param {string} description  Optional second line.
 * @param {string} actionLabel  Renders a primary Button when given.
 * @param {() => void} onAction
 * @param {React.ReactNode} action  Escape hatch for a custom CTA instead.
 * @param {boolean} compact  Tighter padding/icon for use inside a Card or panel.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  compact = false,
  className = '',
}) {
  const cta =
    action ??
    (actionLabel && onAction ? (
      <Button size={compact ? 'sm' : 'md'} onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null);

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'} ${className}`}
    >
      {Icon && (
        <span
          className={`flex items-center justify-center rounded-control bg-bg-subtle text-text-tertiary ${compact ? 'size-10' : 'size-12'}`}
        >
          <Icon className={compact ? 'size-5' : 'size-6'} aria-hidden="true" />
        </span>
      )}

      <p
        className={`mt-4 font-semibold text-text ${compact ? 'text-sm' : 'text-base'}`}
      >
        {title}
      </p>

      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      )}

      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}
