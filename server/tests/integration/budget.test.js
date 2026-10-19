import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

/**
 * Budget CRUD, the transaction -> budget increment, and the concurrency
 * guarantee, against a real database.
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

const TEST_EMAIL_PREFIX = 'it.budget.test.';
const UNIQUE = `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
const EMAIL = `${TEST_EMAIL_PREFIX}${UNIQUE}@example.com`;
const PASSWORD = 'integration-test-password';

let token;
let userId;
let categoryId;

function cleanup() {
  // Children first, since the FKs cascade from User anyway but this keeps the
  // intent explicit.
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

beforeAll(async () => {
  if (!process.env.JWT_SECRET)
    throw new Error('JWT_SECRET must be set to run integration tests');
  await cleanup();

  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Budget Tester', email: EMAIL, password: PASSWORD });
  token = res.body.token;
  userId = res.body.user.id;
  expect(res.status).toBe(201);

  // No seed script exists yet, so the category is created here.
  const category = await prisma.category.create({
    data: { name: `Food ${UNIQUE}`, userId },
  });
  categoryId = category.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

function auth(extra = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

/** Posts one expense with a unique idempotency key, so it is never replayed. */
async function createExpense({ amount, date, description, key }) {
  return request(app)
    .post('/api/transactions')
    .set('Idempotency-Key', key)
    .set(auth())
    .send({
      type: 'expense',
      amount,
      description,
      date,
      categoryId,
    });
}

describe('budgets — CRUD over HTTP', () => {
  let budgetId;

  it('creates one', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set(auth())
      .send({ categoryId, period: '2026-10', limitAmount: 500000 });

    expect(res.status).toBe(201);
    expect(res.body.budget).toMatchObject({
      categoryId,
      period: '2026-10',
      limitAmount: 500000,
      spent: 0,
      utilization: 0,
      thresholdLevel: 'ok',
    });
    expect(res.body.budget.alerts).toEqual([]);
    budgetId = res.body.budget.id;
  });

  it('rejects a second budget for the same category and period with 409', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set(auth())
      .send({ categoryId, period: '2026-10', limitAmount: 900000 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('allows one budget per category per period, so a new period is fine', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set(auth())
      .send({ categoryId, period: '2026-11', limitAmount: 500000 });

    expect(res.status).toBe(201);
    await prisma.budget.delete({ where: { id: res.body.budget.id } });
  });

  it('rejects a non-integer limit with 400', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set(auth())
      .send({ categoryId, period: '2026-10', limitAmount: 5000.5 });

    expect(res.status).toBe(400);
    expect(res.body.error.details.limitAmount).toMatch(/integer/i);
  });

  it('rejects a malformed period with 400', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set(auth())
      .send({ categoryId, period: 'October', limitAmount: 500000 });

    expect(res.status).toBe(400);
    expect(res.body.error.details.period).toMatch(/YYYY-MM/);
  });

  it('lists the user budgets with utilization', async () => {
    const res = await request(app).get('/api/budgets').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.budgets.length).toBeGreaterThan(0);
    expect(
      res.body.budgets.every((b) => typeof b.utilization === 'number'),
    ).toBe(true);
  });

  it('filters the list by period', async () => {
    const res = await request(app)
      .get('/api/budgets?period=2026-10')
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.budgets.every((b) => b.period === '2026-10')).toBe(true);
  });

  it('reads one', async () => {
    const res = await request(app).get(`/api/budgets/${budgetId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.budget.id).toBe(budgetId);
  });

  it('updates the limit', async () => {
    const res = await request(app)
      .patch(`/api/budgets/${budgetId}`)
      .set(auth())
      .send({ limitAmount: 600000 });

    expect(res.status).toBe(200);
    expect(res.body.budget.limitAmount).toBe(600000);
  });

  it('does not accept `spent` as an editable field', async () => {
    const res = await request(app)
      .patch(`/api/budgets/${budgetId}`)
      .set(auth())
      .send({ limitAmount: 600000, spent: 999999 });

    // Zod strips the unknown key, so the running total is untouched.
    expect(res.status).toBe(200);
    expect(res.body.budget.spent).toBe(0);
  });

  it('404s for an id that does not exist', async () => {
    const res = await request(app)
      .get('/api/budgets/99999999-9999-9999-9999-999999999999')
      .set(auth());
    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/budgets')).status).toBe(401);
    expect((await request(app).post('/api/budgets').send({})).status).toBe(401);
  });
});

describe('budgets — an expense increments its budget', () => {
  let budgetId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set(auth())
      .send({ categoryId, period: '2026-09', limitAmount: 100000 });
    budgetId = res.body.budget.id;
  });

  it('adds the amount to spent and reports the new utilization', async () => {
    const res = await createExpense({
      amount: 25000,
      date: '2026-09-04',
      description: `Concurrency base ${UNIQUE}`,
      key: `k-budget-1-${UNIQUE}`,
    });

    expect(res.status).toBe(201);

    const budget = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set(auth());
    expect(budget.body.budget.spent).toBe(25000);
    expect(budget.body.budget.utilization).toBe(0.25);
    expect(budget.body.budget.remainingAmount).toBe(75000);
  });

  it('files the expense under the period of its own date, not today', async () => {
    // The budget above is 2026-09; an expense dated 2026-10 must not touch it.
    await createExpense({
      amount: 99900,
      date: '2026-10-02',
      description: `Wrong month ${UNIQUE}`,
      key: `k-budget-wrong-month-${UNIQUE}`,
    });

    const budget = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set(auth());
    expect(budget.body.budget.spent).toBe(25000);
  });

  it('does not budget an expense with no category', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Idempotency-Key', `k-budget-nocat-${UNIQUE}`)
      .set(auth())
      .send({
        type: 'expense',
        amount: 500000,
        description: `Uncategorised ${UNIQUE}`,
        date: '2026-09-05',
      });

    expect(res.status).toBe(201);

    const budget = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set(auth());
    expect(budget.body.budget.spent).toBe(25000);
  });

  it('does not move a budget for income', async () => {
    await request(app)
      .post('/api/transactions')
      .set('Idempotency-Key', `k-budget-income-${UNIQUE}`)
      .set(auth())
      .send({
        type: 'income',
        amount: 500000,
        description: `Salary ${UNIQUE}`,
        date: '2026-09-06',
        categoryId,
      });

    const budget = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set(auth());
    expect(budget.body.budget.spent).toBe(25000);
  });

  it('replaying the same idempotency key does not spend the budget twice', async () => {
    const key = `k-budget-replay-${UNIQUE}`;
    const payload = {
      amount: 1000,
      date: '2026-09-07',
      description: `Replayed ${UNIQUE}`,
      key,
    };

    const first = await createExpense(payload);
    const second = await createExpense(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const budget = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set(auth());
    expect(budget.body.budget.spent).toBe(25000 + 1000);
  });
});

describe('budgets — threshold alerts', () => {
  const LIMIT = 100000;

  async function budgetFor(month) {
    const created = await request(app)
      .post('/api/budgets')
      .set(auth())
      .send({ categoryId, period: month, limitAmount: LIMIT });
    return created.body.budget;
  }

  it('stays quiet below 80%', async () => {
    const budget = await budgetFor('2026-05');
    const res = await createExpense({
      amount: 79900,
      date: '2026-05-10',
      description: `Under ${UNIQUE}`,
      key: `k-alert-under-${UNIQUE}`,
    });

    expect(res.body.transaction.budgetAlert).toBeUndefined();
    const after = await request(app)
      .get(`/api/budgets/${budget.id}`)
      .set(auth());
    expect(after.body.budget.thresholdLevel).toBe('ok');
  });

  it('flags the 80% crossing once, on the transaction that caused it', async () => {
    const budget = await budgetFor('2026-06');

    const under = await createExpense({
      amount: 79000,
      date: '2026-06-10',
      description: `Almost ${UNIQUE}`,
      key: `k-alert-almost-${UNIQUE}`,
    });
    expect(under.body.transaction.budgetAlert).toBeUndefined();

    const crossing = await createExpense({
      amount: 1000,
      date: '2026-06-11',
      description: `Crossing ${UNIQUE}`,
      key: `k-alert-crossing-${UNIQUE}`,
    });

    expect(crossing.body.transaction.budgetAlert).toMatchObject({
      budgetId: budget.id,
      alerts: [0.8],
      thresholdLevel: 'approaching',
    });
  });

  it('does not repeat the 80% alert on every later expense', async () => {
    const budget = await budgetFor('2026-07');

    // Already above 80% from the first entry.
    await createExpense({
      amount: 85000,
      date: '2026-07-10',
      description: `First ${UNIQUE}`,
      key: `k-alert-repeat-a-${UNIQUE}`,
    });

    const second = await createExpense({
      amount: 1000,
      date: '2026-07-11',
      description: `Second ${UNIQUE}`,
      key: `k-alert-repeat-b-${UNIQUE}`,
    });

    // 86% — still above 80%, but this transaction crossed nothing new.
    expect(second.body.transaction.budgetAlert).toBeUndefined();

    const after = await request(app)
      .get(`/api/budgets/${budget.id}`)
      .set(auth());
    expect(after.body.budget.thresholdLevel).toBe('approaching');
  });

  it('flags the 100% crossing', async () => {
    const budget = await budgetFor('2026-04');

    await createExpense({
      amount: 95000,
      date: '2026-04-10',
      description: `Pre-exceeded ${UNIQUE}`,
      key: `k-alert-exceed-a-${UNIQUE}`,
    });

    const crossing = await createExpense({
      amount: 5000,
      date: '2026-04-11',
      description: `Exceeded ${UNIQUE}`,
      key: `k-alert-exceed-b-${UNIQUE}`,
    });

    expect(crossing.body.transaction.budgetAlert).toMatchObject({
      budgetId: budget.id,
      alerts: [1],
      thresholdLevel: 'exceeded',
    });
  });

  it('keeps the stored replayed response byte-identical to the first answer', async () => {
    // A limit this small means the single expense below crosses 80% and gives
    // the response something to carry.
    const created = await request(app)
      .post('/api/budgets')
      .set(auth())
      .send({ categoryId, period: '2026-03', limitAmount: 400 });
    const key = `k-alert-replay-${UNIQUE}`;
    const payload = {
      amount: 500,
      date: '2026-03-10',
      description: `Replayed alert ${UNIQUE}`,
      key,
    };

    const first = await createExpense(payload);
    const second = await createExpense(payload);

    expect(first.body.transaction.budgetAlert).toBeDefined();
    // The replay carries the alert the first response carried, rather than
    // recomputing it against a budget that has since moved on.
    expect(second.body).toEqual(first.body);
    expect(created.body.budget.id).toBeDefined();
  });
});

describe('budgets — concurrency (NFR-REL-02)', () => {
  it('N parallel expenses against one budget sum to exactly the total', async () => {
    const created = await request(app)
      .post('/api/budgets')
      .set(auth())
      .send({ categoryId, period: '2026-02', limitAmount: 50000 });
    const budgetId = created.body.budget.id;

    const N = 12;
    const AMOUNT = 1375;
    const expected = N * AMOUNT;

    // Fired together rather than awaited in a loop: the point is that they
    // overlap inside the database, which a sequential loop never would.
    const responses = await Promise.all(
      Array.from({ length: N }, (_unused, index) =>
        createExpense({
          amount: AMOUNT,
          date: '2026-02-15',
          description: `Parallel ${index} ${UNIQUE}`,
          key: `k-concurrent-${index}-${UNIQUE}`,
        }),
      ),
    );

    expect(responses.every((res) => res.status === 201)).toBe(true);

    const budget = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set(auth());

    // The lost-update assertion: with a read-then-write increment, this comes
    // out short — every writer reads the same `spent` and one wins.
    expect(budget.body.budget.spent).toBe(expected);
    expect(budget.body.budget.utilization).toBeCloseTo(0.33, 5);

    const rows = await prisma.transaction.count({
      where: {
        userId,
        date: new Date('2026-02-15'),
        description: { startsWith: `Parallel ` },
      },
    });
    expect(rows).toBe(N);
  });
});
