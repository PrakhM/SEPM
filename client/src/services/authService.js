import { api, toApiError } from './httpClient.js';

/**
 * Axios wrapper for the auth endpoints (server/src/routes/authRoutes.js).
 *
 * Every call resolves to the server's `{ user, token }` payload and rejects
 * with a normalized ApiError, so no caller ever touches axios' error shape.
 */

/** The server lowercases and trims emails; doing it here keeps the stored
 *  session's user object consistent with what was actually checked. */
function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

async function post(path, body) {
  try {
    const { data } = await api.post(path, body);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * @returns {Promise<{ user: {id, name, email}, token: string }>}
 * @throws {ApiError} 401 on bad credentials, with the server's message.
 */
export function login({ email, password }) {
  return post('/auth/login', { email: normalizeEmail(email), password });
}

/**
 * @returns {Promise<{ user: {id, name, email}, token: string }>}
 * @throws {ApiError} 409 on a duplicate email, or 400 with field-level
 *                    `details` if the server's validation disagrees with the
 *                    client's.
 */
export function register({ name, email, password }) {
  return post('/auth/register', {
    name: String(name).trim(),
    email: normalizeEmail(email),
    password,
  });
}
