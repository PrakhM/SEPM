import { z } from 'zod';

import { paise, uuid, yearMonth } from './commonValidator.js';

/**
 * Request schemas for the budget routes.
 *
 * `limitAmount` uses the same integer-paise schema as a transaction amount, so
 * a budget limit and the entries counted against it are always the same unit
 * and the same range.
 */

export const createBudgetSchema = z.object({
  categoryId: uuid,
  period: yearMonth,
  limitAmount: paise,
});

/** Only the limit is editable — `spent` is owned by transactionService. */
export const updateBudgetSchema = z.object({
  limitAmount: paise,
});

export const listBudgetsSchema = z.object({
  period: yearMonth.optional(),
  categoryId: uuid.optional(),
});

export const idParamSchema = z.object({ id: uuid });
