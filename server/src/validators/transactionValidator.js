import { z } from 'zod';

/**
 * Request schemas for the transaction routes.
 *
 * Amounts are integers in paise (conventions.md "Money handling"): the client
 * sends 124900 for ₹1,249.00, never 1249.0. The schema rejects non-integers
 * rather than rounding, so a float can never reach the money column.
 */

const paise = z
  .int('Amount must be an integer number of paise (e.g. 124900 for ₹1,249.00)')
  .positive('Amount must be greater than zero')
  .safe();

const uuid = z.uuid('Must be a valid UUID');

const isoDate = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be an ISO calendar date (YYYY-MM-DD)',
  )
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    'Date must be a real calendar date',
  );

const baseFields = {
  amount: paise,
  description: z.string().trim().min(1, 'Description is required').max(200),
  date: isoDate,
  categoryId: uuid.nullish(),
  paymentMethod: z.string().trim().max(50).nullish(),
};

export const createTransactionSchema = z.object({
  ...baseFields,
  type: z.enum(['income', 'expense', 'transfer']),
  // Absent on manual entry; set to 'rule' or 'ai' when the category was
  // assigned rather than chosen by the user.
  source: z.enum(['manual', 'rule', 'ai']).default('manual'),
});

export const updateTransactionSchema = z.object({
  amount: paise.optional(),
  description: z.string().trim().min(1).max(200).optional(),
  date: isoDate.optional(),
  categoryId: uuid.nullish(),
  paymentMethod: z.string().trim().max(50).nullish(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
});

// Query filters for the list endpoint.
export const listTransactionsSchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  categoryId: uuid.optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  // Keyset pagination: rows newer than this ISO timestamp, newest first.
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const idParamSchema = z.object({ id: uuid });
