import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

/**
 * Budget concurrency and the create/update atomicity guarantee.
 *
 * Two claims are under test, both of which a read-then-write implementation
 * fails:
 *
 *   1. N-REL-02 — N simultaneous expenses against one budget sum to exactly the
 *      total. Every writer reads the same `spent` and one wins, so the final
 *      value comes out short. It is asserted once per trial and the whole block
 *      repeats, because a race that only loses updates under load can pass by
 *      luck on a single quiet run.
 *
 *   2. database-schema.md — creating a transaction and moving the budget happen
 *      together or not at all. The failing half is induced with a row-scoped
 *      CHECK constraint so the budget update genuinely fails, and the assertion
 *      is that nothing survived: no transaction row, no spend, no idempotency
 *      key.
 *
 * Refuses to run without TEST_DATABASE_URL so the deleteMany below can never
 * touch the development database.
 */
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Integration tests must not run against the development database.\n' +
      'Create a throwaway database (e.g. a Neon dev branch) and add it to server/.env:\n' +
      '  TEST_DATABASE_URL=postgresql://...',
  );
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const { default: app } = await import('../../src/app.js');
const { default: prisma } = await import('../../src/lib/prismaClient.js');

const TEST_EMAIL_PREFIX = 'it.budgetconc.test.';
const UNIQUE = `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
const PASSWORD = 'integration-test-password';

/** ₹100 in paise. Integer money, all the way down (conventions.md). */
const EXPENSE_PAISE = 10000;
const CONCURRENT_REQUESTS = 10;
const EXPECTED_SPENT = EXPENSE_PAISE * CONCURRENT_REQUESTS; // ₹1000 = 100000 paise

/**
 * The budget limit is set to exactly the expected total, so a correct run lands
 * on the 100% threshold rather than somewhere in the middle. The concurrency and
 * the threshold boundary are then checked by the same assertion.
 */
const LIMIT_PAISE = EXPECTED_SPENT;

const users = [];

function cleanup() {
  return prisma.idempotencyKey
    .deleteMany({
      where: { user: { email: { startsWith: TEST_EMAIL_PREFIX } } },
    })
    .then(() =>
      prisma.transaction.deleteMany({
        where: { user: { email: { startsWith: TEST_EMAIL_PREFIX } } },
      }),
    )
    .then(() =>
      prisma.budget.deleteMany({
        where: { user: { email: { startsWith: TEST_EMAIL_PREFIX } } },
      }),
    )
    .then(() =>
      prisma.category.deleteMany({
        where: { user: { email: { startsWith: TEST_EMAIL_PREFIX } } },
      }),
    )
    .then(() =>
      prisma.user.deleteMany({
        where: { email: { startsWith: TEST_EMAIL_PREFIX } },
      }),
    );
}

/**
 * A fresh user, category and budget per trial.
 *
 * Fresh rather than reused because the whole point is that `spent` starts at
 * zero: a leftover total from a previous trial would mask a lost update.
 */
async function setupTrial(label) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: `Concurrency ${label}`,
      email: `${TEST_EMAIL_PREFIX}${label}.${UNIQUE}@example.com`,
      password: PASSWORD,
    });
  expect(res.status).toBe(201);

  const user = res.body.user;
  users.push(user.id);

  const category = await prisma.category.create({
    data: { name: `Food ${label} ${UNIQUE}`, userId: user.id },
  });

  const budget = await prisma.budget.create({
    data: {
      userId: user.id,
      categoryId: category.id,
      period: '2026-01',
      limitAmount: LIMIT_PAISE,
      spent: 0,
    },
  });

  return {
    token: res.body.token,
    userId: user.id,
    categoryId: category.id,
    budgetId: budget.id,
  };
}

/** Posts one expense with its own idempotency key, so it is never replayed. */
function postExpense(token, { amount, categoryId, description, key }) {
  return request(app)
    .post('/api/transactions')
    .set('Idempotency-Key', key)
    .set('Authorization', `Bearer ${token}`)
    .send({
      type: 'expense',
      amount,
      description,
      date: '2026-01-15',
      categoryId,
    });
}

beforeAll(async () => {
  if (!process.env.JWT_SECRET)
    throw new Error('JWT_SECRET must be set to run integration tests');
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('budget concurrency — 10 simultaneous ₹100 expenses', () => {
  // Repeated rather than run once: the failure mode this guards against is
  // timing-dependent, so a single pass proves nothing on its own.
  const TRIALS = 10;

  for (let trial = 1; trial <= TRIALS; trial += 1) {
    it(`trial ${trial} of ${TRIALS}: spent lands on exactly 10 × ₹100`, async () => {
      const { token, userId, categoryId, budgetId } = await setupTrial(
        `t${trial}`,
      );

      // All ten issued together: they overlap inside the database, which a
      // sequential loop would never produce.
      const responses = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }, (_unused, index) =>
          postExpense(token, {
            amount: EXPENSE_PAISE,
            categoryId,
            description: `Parallel ${trial}-${index} ${UNIQUE}`,
            key: `k-conc-${trial}-${index}-${UNIQUE}`,
          }),
        ),
      );

      // Every request succeeded...
      for (const res of responses) {
        expect(res.status).toBe(201);
      }

      // ...and none of them collided on the same transaction row.
      const ids = new Set(responses.map((res) => res.body.transaction.id));
      expect(ids.size).toBe(CONCURRENT_REQUESTS);

      // The lost-update assertion.
      const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
      });
      expect(budget.spent).toBe(EXPECTED_SPENT);
      expect(budget.spent).toBe(100000);
      expect(Number.isInteger(budget.spent)).toBe(true);

      // All ten rows really were written, not just the spend counter moved.
      const rows = await prisma.transaction.count({
        where: { userId, date: new Date('2026-01-15') },
      });
      expect(rows).toBe(CONCURRENT_REQUESTS);

      // Every key was stored, so a retry of any of the ten replays rather than
      // duplicating.
      const keys = await prisma.idempotencyKey.count({ where: { userId } });
      expect(keys).toBe(CONCURRENT_REQUESTS);
    });
  }

  it('reads back the same total through the API, landing on exactly 100%', async () => {
    const { token, categoryId, budgetId } = await setupTrial('readback');

    await Promise.all(
      Array.from({ length: CONCURRENT_REQUESTS }, (_unused, index) =>
        postExpense(token, {
          amount: EXPENSE_PAISE,
          categoryId,
          description: `Readback ${index} ${UNIQUE}`,
          key: `k-readback-${index}-${UNIQUE}`,
        }),
      ),
    );

    const res = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${token}`);

    // limitAmount === expected total, so a correct run is exactly at the
    // 100% threshold rather than just past or just under it.
    expect(res.body.budget.spent).toBe(EXPECTED_SPENT);
    expect(res.body.budget.utilization).toBe(1);
    expect(res.body.budget.remainingAmount).toBe(0);
    expect(res.body.budget.thresholdLevel).toBe('exceeded');
    expect(res.body.budget.alerts).toEqual([0.8, 1]);
  });
});

describe('transaction create + budget update are atomic', () => {
  /**
   * Scoped to one budget id rather than the whole table, so the constraint only
   * affects the row this test is about. A table-wide CHECK would also break any
   * other budget being written in the window, including by another test file.
   */
  const CONSTRAINT = 'test_budget_update_must_fail';

  it('rolls back the transaction row, the spend and the key when the update fails', async () => {
    const { token, userId, categoryId, budgetId } = await setupTrial('atomic');

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Budget" ADD CONSTRAINT ${CONSTRAINT} CHECK ("id" <> '${budgetId}'::uuid OR "spent" = 0)`,
    );

    let res;
    try {
      res = await postExpense(token, {
        amount: EXPENSE_PAISE,
        categoryId,
        description: `Must roll back ${UNIQUE}`,
        key: `k-atomic-${UNIQUE}`,
      });
    } finally {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Budget" DROP CONSTRAINT IF EXISTS ${CONSTRAINT}`,
      );
    }

    // The request failed rather than half-succeeding...
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.transaction).toBeUndefined();

    // ...and none of the three writes survived.
    const rows = await prisma.transaction.count({
      where: { userId, description: `Must roll back ${UNIQUE}` },
    });
    expect(rows).toBe(0);

    const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
    expect(budget.spent).toBe(0);

    const keys = await prisma.idempotencyKey.count({
      where: { userId, key: `k-atomic-${UNIQUE}` },
    });
    expect(keys).toBe(0);
  });

  it('commits all three together when nothing fails', async () => {
    const { token, userId, categoryId, budgetId } = await setupTrial('commit');

    const res = await postExpense(token, {
      amount: EXPENSE_PAISE,
      categoryId,
      description: `Commits ${UNIQUE}`,
      key: `k-commit-${UNIQUE}`,
    });

    expect(res.status).toBe(201);
    expect(res.body.transaction.id).toBeDefined();

    const rows = await prisma.transaction.count({
      where: { userId, description: `Commits ${UNIQUE}` },
    });
    expect(rows).toBe(1);

    const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
    expect(budget.spent).toBe(EXPENSE_PAISE);

    const keys = await prisma.idempotencyKey.count({
      where: { userId, key: `k-commit-${UNIQUE}` },
    });
    expect(keys).toBe(1);
  });

  it('a category with no budget still creates the transaction', async () => {
    // The absence of a budget is not a failure: the write commits on its own
    // rather than rolling back a valid entry.
    const { token, userId, categoryId } = await setupTrial('nobudget');

    const res = await postExpense(token, {
      amount: EXPENSE_PAISE,
      categoryId,
      description: `No budget yet ${UNIQUE}`,
      key: `k-nobudget-${UNIQUE}`,
    });

    expect(res.status).toBe(201);

    const rows = await prisma.transaction.count({
      where: { userId, description: `No budget yet ${UNIQUE}` },
    });
    expect(rows).toBe(1);
  });
});
