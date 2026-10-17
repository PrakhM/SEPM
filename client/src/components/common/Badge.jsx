/**
 * Small pill for category tags, budget status and other one-word labels.
 *
 * Tones come from the semantic palette, so a "danger" badge means the same
 * thing as a danger transaction or a danger input border. There is no solid
 * variant: white-on-`success-600` is 3.77:1 and white-on-`info-400` is 2.98:1,
 * both under the WCAG AA 4.5:1 this app holds itself to, so a filled solid
 * badge could only have been made legible by breaking the palette. The
 * subtle/outline pair covers the same ground accessibly.
 *
 * @param {'primary'|'success'|'danger'|'warning'|'info'|'neutral'} tone
 * @param {'subtle'|'outline'} variant
 * @param {boolean} dot  Leading status dot, for live/active states.
 * @param {React.ComponentType} icon Leading icon.
 */
const TONES = {
  primary: {
    subtle: 'bg-primary-subtle text-primary-on-subtle',
    outline: 'border-primary/40 text-primary-on-subtle',
    dot: 'bg-primary',
  },
  success: {
    subtle: 'bg-success-subtle text-success-on-subtle',
    outline: 'border-success/40 text-success-on-subtle',
    dot: 'bg-success',
  },
  danger: {
    subtle: 'bg-danger-subtle text-danger-on-subtle',
    outline: 'border-danger/40 text-danger-on-subtle',
    dot: 'bg-danger',
  },
  warning: {
    subtle: 'bg-warning-subtle text-warning-on-subtle',
    outline: 'border-warning/40 text-warning-on-subtle',
    dot: 'bg-warning',
  },
  info: {
    subtle: 'bg-info-subtle text-info-on-subtle',
    outline: 'border-info/40 text-info-on-subtle',
    dot: 'bg-info',
  },
  // Neutral has no accent of its own - it borrows the page's own greys, so a
  // badge used as a quiet tag does not read as a status.
  neutral: {
    subtle: 'bg-bg-subtle text-text-secondary',
    outline: 'border-border-strong text-text-secondary',
    dot: 'bg-text-tertiary',
  },
};

const SIZES = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
};

export default function Badge({
  tone = 'neutral',
  variant = 'subtle',
  size = 'md',
  dot = false,
  icon: Icon,
  className = '',
  children,
  ...rest
}) {
  const palette = TONES[tone] ?? TONES.neutral;

  return (
    <span
      className={[
        'inline-flex items-center rounded-pill font-medium whitespace-nowrap',
        variant === 'outline' ? 'border bg-transparent' : '',
        palette[variant] ?? palette.subtle,
        SIZES[size] ?? SIZES.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {dot && (
        <span
          className={`size-1.5 shrink-0 rounded-pill ${palette.dot}`}
          aria-hidden="true"
        />
      )}
      {Icon && (
        <Icon
          className={size === 'sm' ? 'size-3' : 'size-3.5'}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
