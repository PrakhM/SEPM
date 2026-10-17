/**
 * Surface container: white (neutral-800) in dark mode, one hairline border, a
 * soft shadow and one consistent internal padding.
 *
 * Structure is opt-in so a card can hold any of three shapes:
 *   - bare       `<Card>…</Card>`
 *   - titled     `<Card title="October" action={<Button/>}>…</Card>`
 *   - sectioned  the above plus `footer`, for confirm/actions that belong to
 *                the card rather than the page.
 *
 * `padded={false}` drops the body padding for cards whose content is a flush
 * table or list that manages its own row spacing.
 *
 * @param {string} title    Header title. The header slot renders if this,
 *                          `description` or `action` is present.
 * @param {React.ReactNode} action  Right-aligned header control.
 * @param {boolean} raised  Taller shadow, for a card that is itself raised
 *                          above the page (a popover, a hovered row).
 */
export default function Card({
  title,
  description,
  action,
  footer,
  padded = true,
  raised = false,
  className = '',
  children,
  ...rest
}) {
  const hasHeader = Boolean(title || description || action);

  return (
    <section
      className={[
        'rounded-card border border-border bg-surface',
        raised ? 'shadow-card-raised' : 'shadow-card',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h3 className="truncate text-base font-semibold text-text">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {action && (
            <div className="flex shrink-0 items-center gap-2">{action}</div>
          )}
        </header>
      )}

      <div className={padded ? 'p-5' : ''}>{children}</div>

      {footer && (
        <footer className="border-t border-border bg-bg-subtle px-5 py-3 text-sm text-text-secondary">
          {footer}
        </footer>
      )}
    </section>
  );
}
