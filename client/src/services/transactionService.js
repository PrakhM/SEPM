import { api } from './httpClient.js';

/**
 * Client wrapper for the transaction endpoints.
 *
 * Amounts cross this boundary as integer paise (conventions.md); only the
 * form converts between what the user typed and paise, via
 * utils/formatters.js.
 */

/** 401 is caught globally by RequireAuth; this is only for dev-time clarity. */
function unwrap({ data }) {
  return data;
}

export async function listTransactions(filters = {}) {
  const params = {};
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.type) params.type = filters.type;
  if (filters.search) params.search = filters.search;
  if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
  if (typeof filters.limit === 'number') params.limit = filters.limit;

  const { data } = await api.get('/transactions', { params });
  return data;
}

export async function createTransaction(payload, idempotencyKey) {
  const { data } = await api.post('/transactions', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return data.transaction;
}

export async function updateTransaction(id, payload) {
  const { data } = await api.patch(`/transactions/${id}`, payload);
  return data.transaction;
}

export async function deleteTransaction(id) {
  await api.delete(`/transactions/${id}`);
}

/**
 * A fresh key per logical submission. Reused across retries of the SAME
 * submission (a double-click, a flaky network) so the server replays rather
 * than duplicating; regenerated only when the form is reopened for a new
 * entry. crypto.randomUUID needs a secure context, which localhost and HTTPS
 * both are - the fallback keeps the form usable if it ever is not.
 */
export function newIdempotencyKey() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

export { unwrap };
