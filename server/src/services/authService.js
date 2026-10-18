import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import prisma from '../lib/prismaClient.js';
import { ConflictError, UnauthorizedError } from '../lib/errors.js';

/** Work factor for bcrypt. 12 is ~250ms on modest hardware. */
const SALT_ROUNDS = 12;

/** Access-token lifetime. Keep short; the app has no refresh flow yet. */
const TOKEN_TTL = '1h';

/** The fields we are willing to hand back to a client. Never the hash. */
const PUBLIC_USER = { id: true, name: true, email: true };

/**
 * Strips everything not explicitly public. Built by projection rather than
 * deletion so a column added to the table later cannot leak by default.
 */
function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

/**
 * Looks up the current user for an authenticated request.
 *
 * Returns null when the id does not resolve, so a token minted for an account
 * that has since been deleted stops working instead of persisting until it
 * expires. Used by authMiddleware so the middleware holds no Prisma import —
 * architecture.md keeps database access inside the service layer.
 */
export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER,
  });

  return user ? toPublicUser(user) : null;
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail loudly rather than signing with an empty key.
    throw new Error('JWT_SECRET is not set');
  }
  return jwt.sign({ sub: user.id }, secret, { expiresIn: TOKEN_TTL });
}

/**
 * Registers a new user. Throws ConflictError if the email is taken.
 */
export async function register({ name, email, password }) {
  // Check first for a clear message. The unique constraint on User.email is
  // still the real guarantee — this only narrows the race window, it does not
  // close it. A concurrent duplicate surfaces as P2002 and is mapped in
  // middleware/errorHandler.js.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: PUBLIC_USER,
  });

  return { user, token: signToken(user) };
}

/**
 * Verifies credentials and issues a token.
 *
 * A missing email and a wrong password produce the same error and both do a
 * bcrypt comparison, so the response does not reveal whether an account exists.
 */
export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...PUBLIC_USER, passwordHash: true },
  });

  // No user: hash against a dummy value so the timing still resembles the
  // real path, then fail with the same error as a wrong password.
  const passwordHash =
    user?.passwordHash ??
    '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
  const passwordMatches = await bcrypt.compare(password, passwordHash);

  if (!user || !passwordMatches) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // toPublicUser, not `user`: the row fetched above carries passwordHash, and
  // returning it would put the hash in the login response.
  return { user: toPublicUser(user), token: signToken(user) };
}
