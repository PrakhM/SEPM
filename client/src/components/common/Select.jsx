import { ChevronDown } from 'lucide-react';
import { useId } from 'react';

import {
  CONTROL_BASE,
  FOCUS_BORDER,
  INVALID_BORDER,
  controlSize,
} from './controlStyles.js';
import Field from './Field.jsx';

/**
 * Native `<select>` styled to match Input and Button.
 *
 * Native on purpose: the dropdown is the OS's, so it gets platform
 * keyboard/type-ahead behaviour, a real listbox for screen readers and correct
 * rendering on mobile, none of which a custom listbox can match without a lot
 * of code. The native arrow is hidden and replaced with a chevron so it does not
 * fight the control's border colour, and `uiStore` sets `color-scheme` on
 * <html> so the OS popup follows light/dark mode with us.
 *
 * Pass `options` for a plain list, or `children` for `<optgroup>`s or anything
 * else that needs to be hand-written.
 *
 * @param {Array<{value: string, label: string, disabled?: boolean}>} options
 */
export default function Select({
  label,
  helperText,
  error,
  optional = false,
  size = 'md',
  options,
  id,
  className = '',
  containerClassName = '',
  children,
  ...rest
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;

  const { control, text, icon } = controlSize(size);
  const invalid = Boolean(error);

  return (
    <Field
      id={selectId}
      label={label}
      optional={optional}
      helperText={helperText}
      error={error}
      messageId={messageId}
      className={containerClassName}
    >
      {/* `relative` wrapper exists only to anchor the chevron; the select itself
          stays a block-level control at the full width of the field. */}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={invalid || undefined}
          aria-describedby={helperText || error ? messageId : undefined}
          className={[
            CONTROL_BASE,
            control,
            text,
            // Native arrow off, and room kept for the chevron that replaces it.
            'appearance-none pr-10',
            invalid ? INVALID_BORDER : `${FOCUS_BORDER} border-border`,
            className,
          ].join(' ')}
          {...rest}
        >
          {options
            ? options.map(({ value, label: optionLabel, disabled }) => (
                <option key={value} value={value} disabled={disabled}>
                  {optionLabel}
                </option>
              ))
            : children}
        </select>

        <ChevronDown
          className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 ${icon} text-text-tertiary`}
          aria-hidden="true"
        />
      </div>
    </Field>
  );
}
