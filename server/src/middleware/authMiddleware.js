import jwt from 'jsonwebtoken';

import * as authService from '../services/authService.js';
import { UnauthorizedError } from '../lib/errors.js';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail loudly at request time rather than silently treating every token as
    // signed with an empty key.
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

/**
 * Verifies the bearer token on the request and attaches the user to `req.user`.
 *
 * The user is loaded from the database rather than trusted from the token
 * payload, so a token for a deleted account cannot keep working. The lookup
 * goes through authService so this middleware holds no Prisma import.
 */
export default async function authMiddleware(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedError('Missing bearer token');
    }

    let payload;
    try {
      payload = jwt.verify(token, getSecret());
    } catch {
      // Never surface the jwt reason (expired vs malformed vs bad signature) —
      // it is more than a client needs and invites probing.
      throw new UnauthorizedError('Invalid or expired token');
    }

    const user = await authService.getUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
