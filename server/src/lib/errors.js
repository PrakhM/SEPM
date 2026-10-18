/**
 * Typed application errors.
 *
 * Services throw these; `middleware/errorHandler.js` is the only place that
 * maps them to HTTP status codes. Anything that reaches the error handler
 * without one of these types is treated as unexpected and reported as a
 * generic 500 — that is what keeps raw Prisma/Postgres messages and stack
 * traces from leaking to the client.
 */

/** Base class so `instanceof AppError` identifies every deliberate throw. */
export class AppError extends Error {
  /**
   * @param {string} message  Safe to show the client.
   * @param {number} status   HTTP status code.
   * @param {string} code     Stable machine-readable code for the client.
   * @param {object} [details] Optional field-level context, returned as
   *   `error.details`. Must be safe to expose.
   */
  constructor(message, status, code, details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.isOperational = true;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/** The requested entity does not exist. */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/** The request failed validation. `details` is optional field-level context. */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = undefined) {
    super(message, 400, 'VALIDATION_ERROR');
    if (details !== undefined) this.details = details;
  }
}

/** The request conflicts with existing state (duplicate email, budget exists). */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

/** Authentication failed or was not supplied. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}
