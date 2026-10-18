import { ZodError } from 'zod';

import { Prisma } from '../generated/prisma/index.js';

import { AppError } from '../lib/errors.js';

/**
 * Maps thrown errors to `{ error: { code, message } }`.
 *
 * Registered last so it catches everything routed through Express, including
 * rejections from async middleware.
 */

/**
 * Flattens a ZodError into `{ field: message }` for the response `details`.
 */
function fromZodError(error) {
  if (!(error instanceof ZodError)) return null;

  const details = {};
  for (const issue of error.issues) {
    details[issue.path.join('.') || '_'] = issue.message;
  }

  return new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
}

/**
 * Prisma raises a coded error for conflicts and missing rows. Those are
 * expected outcomes, not defects, so they are translated into typed errors
 * with messages safe to return.
 */
function fromPrismaError(error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new AppError('Resource already exists', 409, 'CONFLICT');
      case 'P2025':
        return new AppError('Resource not found', 404, 'NOT_FOUND');
      case 'P2003':
        return new AppError(
          'Referenced resource does not exist',
          400,
          'VALIDATION_ERROR',
        );
      default:
        return null;
    }
  }
  return null;
}

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity (4 args).
export default function errorHandler(error, req, res, next) {
  const mapped =
    error instanceof AppError
      ? error
      : (fromZodError(error) ?? fromPrismaError(error));

  if (mapped) {
    // Deliberate, expected failure. Logged at warn so it is visible in the
    // logs without looking like a server fault.
    console.warn(
      `[${req.method} ${req.originalUrl}] ${mapped.code}: ${mapped.message}`,
    );
    return res.status(mapped.status).json({
      error: {
        code: mapped.code,
        message: mapped.message,
        ...(mapped.details && { details: mapped.details }),
      },
    });
  }

  // Unexpected: log the full error server-side, return nothing about it.
  // The stack is never sent to the client, in any environment. It is already
  // written to the server log above, so debugging loses nothing — and gating
  // this on NODE_ENV is not worth the risk, because a deployed host that does
  // not set NODE_ENV would otherwise serve stacks to the public.
  console.error(`[${req.method} ${req.originalUrl}] Unhandled error:`, error);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
