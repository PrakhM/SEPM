import { CircleAlert } from 'lucide-react';

/**
 * Label-above / message-below shell shared by Input and Select, so every field
 * in the app has the same vertical rhythm: label, gap, control, gap, message.
 *
 * The message slot is always reserved for the helper text or the error, never
 * both - a field that swaps its own helper text for an error message as the
 * user types does not jump the layout around.
 *
 * This component renders no control of its own; `children` is the Input or
 * Select, which owns its own id and is wired up here through `id` and
 * `messageId`.
 */
export default function Field({
  id,
  label,
  optional = false,
  helperText,
  error,
  messageId,
  children,
  className = '',
}) {
  const message = error || helperText;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-text"
        >
          {label}
          {optional && (
            <span className="ml-1.5 text-xs font-normal text-text-tertiary">
              Optional
            </span>
          )}
        </label>
      )}

      {children}

      {message && (
        <p
          id={messageId}
          // Errors are the loud thing that can happen in a form, so they take
          // the danger accent and read at a slightly larger size than helper
          // text rather than relying on colour alone.
          className={
            error
              ? 'mt-1.5 flex items-start gap-1 text-sm font-medium text-danger'
              : 'mt-1.5 text-xs text-text-tertiary'
          }
        >
          {error && (
            <CircleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
          )}
          {message}
        </p>
      )}
    </div>
  );
}
