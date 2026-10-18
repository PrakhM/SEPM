import { z } from 'zod';

/**
 * Request schemas for the auth routes.
 *
 * Controllers call `.parse()`, so a malformed body throws a ZodError that the
 * error handler turns into a 400 with field-level details.
 */

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email('Must be a valid email address');

// bcrypt silently truncates beyond 72 bytes, so cap the input rather than let
// a long password appear to work while only its first 72 bytes are checked.
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});
