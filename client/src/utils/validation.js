/**
 * Client-side mirrors of the server's auth rules
 * (server/src/validators/authValidator.js).
 *
 * They exist so the UI can explain what is wrong before a round-trip; the
 * server remains the authority - its message wins whenever the two disagree.
 * Each validator returns the message to show, or null when the value is fine.
 */

export const NAME_MAX_LENGTH = 100;
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Deliberately more permissive than the server's email rule: the worst thing
 * a client-side regex can do is reject an address the server would accept,
 * which would make a valid account un-usable.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(value) {
  const name = String(value).trim();
  if (!name) return 'Name is required';
  if (name.length > NAME_MAX_LENGTH) {
    return `Name must be at most ${NAME_MAX_LENGTH} characters`;
  }
  return null;
}

export function validateEmail(value) {
  const email = String(value).trim();
  if (!email) return 'Email is required';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address';
  return null;
}

/** Login: any non-empty password is worth trying against the server. */
export function validatePasswordPresent(value) {
  return value ? null : 'Password is required';
}

/** Registration: the password will actually be stored, so enforce the
 *  server's minimum strength rule up front. */
export function validateNewPassword(value) {
  if (!value) return 'Password is required';
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  return null;
}

export function validatePasswordConfirmation(password, confirmation) {
  if (!confirmation) return 'Confirm your password';
  return confirmation === password ? null : 'Passwords do not match';
}
