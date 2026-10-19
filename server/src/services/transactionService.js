import { Prisma } from '../generated/prisma/index.js';

import prisma from '../lib/prismaClient.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';
import {
  applyTransactionToBudget,
  evaluateThresholds,
  periodForDate,
} from './budgetService.js';

/**
 * Transaction CRUD plus the idempotency pattern (conventions.md).
 *
 * Money is always integer paise end to end — nothing here parses, divides or
 * converts an amount.
 */

/** Keys older than this are ignored on lookup (conventions.md: 24 hours). */
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/** Shape stored in IdempotencyKey.responseBody and replayed verbatim. */
function storedResponse(transaction, category, budget) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    categoryId: transaction.categoryId,
    type: transaction.type,
    amount: transaction.amount,
    description: transaction.description,
    paymentMethod: transaction.paymentMethod,
    date: transaction.date,
    source: transaction.source,
    createdAt: transaction.createdAt,
    ...(category ? { category } : {}),
    // Null unless this expense pushed a budget past a threshold, so the client
    // can raise the alert without a second request. See budgetAlert below.
    ...(budget ? { budgetAlert: budget } : {}),
  };
}

function withCategory(transaction) {
  if (!transaction?.category) return transaction;
  const { category, ...rest } = transaction;
  return { ...rest, category: { id: category.id, name: category.name } };
}

/**
 * Moves a matching budget's spend by the amount of one expense, inside the
 * caller's transaction.
 *
 * The budget is looked up by (user, category, period) — the period comes from
 * the transaction's own date, so an entry recorded for last month counts
 * against last month's budget rather than this one's. A transaction with no
 * category, or one whose category has no budget that period, is simply not
 * budgeted: creation still succeeds, because a missing budget is a setup gap
 * and not a client error.
 *
 * Returns the alert to hand back to the client, or null. "Only budget" is the
 * decision this layer makes — architecture.md assigns budgetService the maths
 * and the atomic increment, not the choice of which budget applies.
 */
async function applyBudgetForExpense(tx, created) {
  const budget = await tx.budget.findUnique({
    where: {
      userId_categoryId_period: {
        userId: created.userId,
        categoryId: created.categoryId,
        period: periodForDate(created.date),
      },
    },
    select: { id: true },
  });

  if (!budget) return null;

  const updated = await applyTransactionToBudget(budget.id, created.amount, tx);

  return budgetAlert(updated, created.amount);
}

/**
 * The threshold the expense pushed a budget past, or null if it crossed none.
 *
 * `updated.spent` was returned by the same atomic statement that set it, so the
 * pre-increment value is exactly `spent - amount` — no second read, and no
 * window where another concurrent increment could make it a lie.
 */
function budgetAlert(updated, amount) {
  if (!updated?.limitAmount) return null;

  const before = evaluateThresholds(
    updated.spent - amount,
    updated.limitAmount,
  );
  const after = evaluateThresholds(updated.spent, updated.limitAmount);

  const crossed = after.alerts.filter(
    (alert) => !before.alerts.includes(alert),
  );
  if (crossed.length === 0) return null;

  return {
    budgetId: updated.id,
    period: updated.period,
    thresholdLevel: after.level,
    alerts: crossed,
    spent: updated.spent,
    limitAmount: updated.limitAmount,
    utilization: after.utilization,
  };
}

/**
 * Creates a transaction, at most once per Idempotency-Key.
 *
 * Order of operations follows architecture.md:
 *   1. look up (userId, key) and replay a stored response if present
 *   2. create the row, move the budget's spend, and store the key in ONE
 *      $transaction, so a crash between them cannot leave a key with no
 *      transaction, a transaction with no budget update, or vice versa
 *
 * If two identical requests race, the unique constraint on (userId, key)
 * makes the second insert fail; that is caught and answered with the stored
 * result rather than a second transaction row.
 */
export async function createTransaction(userId, data, idempotencyKey) {
  if (!idempotencyKey) {
    throw new ValidationError('Idempotency-Key header is required');
  }

  const existing = await findIdempotencyRecord(userId, idempotencyKey);
  if (existing) {
    return {
      transaction: existing.responseBody,
      statusCode: existing.statusCode,
      replayed: true,
    };
  }

  const payload = {
    userId,
    categoryId: data.categoryId ?? null,
    type: data.type,
    amount: data.amount,
    description: data.description,
    paymentMethod: data.paymentMethod ?? null,
    date: new Date(data.date),
    source: data.source ?? 'manual',
  };

  try {
    // Interactive form rather than the array form in database-schema.md,
    // because the stored body has to contain the row we just created. With
    // an array the key would have to be inserted before that row exists,
    // leaving a window where a crash stores a key with no response in it and
    // the next retry replays an empty object. Inside the callback all three
    // writes commit together or not at all.
    const body = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: payload,
        include: { category: { select: { id: true, name: true } } },
      });

      const budgetAlert =
        created.type === 'expense' && created.categoryId
          ? await applyBudgetForExpense(tx, created)
          : null;

      const response = storedResponse(created, created.category, budgetAlert);

      await tx.idempotencyKey.create({
        data: {
          userId,
          key: idempotencyKey,
          statusCode: 201,
          responseBody: response,
        },
      });

      return response;
    });

    return { transaction: body, statusCode: 201, replayed: false };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      // Lost the race: the unique constraint on (userId, key) fired. The
      // winner's row is authoritative, so return that rather than erroring.
      const winner = await findIdempotencyRecord(userId, idempotencyKey);
      if (winner) {
        return {
          transaction: winner.responseBody,
          statusCode: winner.statusCode,
          replayed: true,
        };
      }
    }
    throw error;
  }
}

/**
 * Returns the stored record for a key, or null if unseen or expired.
 *
 * Expiry is lazy: an expired row is deleted on lookup rather than by a
 * scheduled job, which free-tier hosting cannot run (features.md).
 */
async function findIdempotencyRecord(userId, key) {
  const record = await prisma.idempotencyKey.findUnique({
    where: { userId_key: { userId, key } },
  });

  if (!record) return null;

  if (Date.now() - new Date(record.createdAt).getTime() > IDEMPOTENCY_TTL_MS) {
    // Best effort: if the delete fails the key simply gets overwritten by the
    // insert that follows, so there is nothing useful to do about an error.
    try {
      await prisma.idempotencyKey.delete({ where: { id: record.id } });
    } catch {
      /* ignore */
    }
    return null;
  }

  return record;
}

export async function listTransactions(
  userId,
  { from, to, categoryId, type, cursor, limit },
) {
  const where = {
    userId,
    ...(type ? { type } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.transaction.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { category: { select: { id: true, name: true } } },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    transactions: page.map(withCategory),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function getTransaction(userId, id) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!transaction) {
    // 404 rather than 403: another user's id should not be distinguishable
    // from an id that does not exist.
    throw new NotFoundError('Transaction not found');
  }

  return withCategory(transaction);
}

export async function updateTransaction(userId, id, data) {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new NotFoundError('Transaction not found');

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.paymentMethod !== undefined
        ? { paymentMethod: data.paymentMethod }
        : {}),
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return withCategory(updated);
}

export async function deleteTransaction(userId, id) {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new NotFoundError('Transaction not found');

  await prisma.transaction.delete({ where: { id } });
}
