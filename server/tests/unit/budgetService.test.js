import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Budget maths and the atomic increment.
 *
 * `calculateUtilization`, `evaluateThresholds` and `periodForDate` take plain
 * values and return plain values — the suites below call them with literals and
 * assert on literals, with no Prisma call in between. That is the point of
 * keeping them in the service rather than inline in a controller: the money
 * maths is testable without a database.
 *
 * The mocks are declared before the dynamic imports so the service picks them
 * up; budgetService pulls in prismaClient at module load, and instantiating the
 * real client is what needs a DATABASE_URL.
 */

vi.mock('../../src/lib/prismaClient.js', () => ({
  default: {
    budget: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../src/generated/prisma/index.js', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      constructor(message, opts) {
        super(message);
        this.code = opts.code;
      }
    },
  },
}));

const prisma = (await import('../../src/lib/prismaClient.js')).default;
const { Prisma } = await import('../../src/generated/prisma/index.js');
const {
  applyTransactionToBudget,
  calculateUtilization,
  createBudget,
  evaluateThresholds,
  periodForDate,
  toBudgetView,
} = await import('../../src/services/budgetService.js');

const USER_ID = '11111111-1111-1111-1111-111111111111';
const CATEGORY_ID = '33333333-3333-3333-3333-333333333333';
const BUDGET_ID = '44444444-4444-4444-4444-444444444444';

describe('calculateUtilization — pure', () => {
  it('is spent / limitAmount', () => {
    expect(calculateUtilization(500, 2000)).toBe(0.25);
  });

  it('is exactly 1 when spent equals the limit', () => {
    expect(calculateUtilization(2000, 2000)).toBe(1);
  });

  it('works in paise without a unit conversion', () => {
    // ₹500 of a ₹2,000 budget, both in paise.
    expect(calculateUtilization(50000, 200000)).toBe(0.25);
  });

  it('exceeds 1 when spend passes the limit', () => {
    expect(calculateUtilization(2500, 2000)).toBe(1.25);
  });

  it('returns 0 for a zero limit rather than Infinity or NaN', () => {
    expect(calculateUtilization(500, 0)).toBe(0);
  });

  it('returns 0 for an empty budget', () => {
    expect(calculateUtilization(0, 2000)).toBe(0);
  });
});

describe('evaluateThresholds — pure', () => {
  it('is ok below 80%', () => {
    const result = evaluateThresholds(7999, 10000);
    expect(result.level).toBe('ok');
    expect(result.alerts).toEqual([]);
  });

  it('fires the 80% alert exactly at the threshold, not one paisa under', () => {
    const result = evaluateThresholds(8000, 10000);
    expect(result.utilization).toBe(0.8);
    expect(result.level).toBe('approaching');
    expect(result.alerts).toEqual([0.8]);
  });

  it('does not fire the 80% alert one paisa below', () => {
    expect(evaluateThresholds(7999, 10000).alerts).toEqual([]);
  });

  it('fires the 100% alert exactly at the limit', () => {
    const result = evaluateThresholds(10000, 10000);
    expect(result.level).toBe('exceeded');
    expect(result.alerts).toEqual([0.8, 1]);
  });

  it('carries both alerts when well past the limit', () => {
    const result = evaluateThresholds(15000, 10000);
    expect(result.utilization).toBe(1.5);
    expect(result.level).toBe('exceeded');
    expect(result.alerts).toEqual([0.8, 1]);
  });

  it('stays at the 80% level between the two thresholds', () => {
    expect(evaluateThresholds(9000, 10000).level).toBe('approaching');
  });

  it('is ok for a zero-spend budget with a real limit', () => {
    expect(evaluateThresholds(0, 10000).level).toBe('ok');
  });
});

describe('periodForDate — pure', () => {
  it('formats a date as YYYY-MM', () => {
    expect(periodForDate('2026-10-18')).toBe('2026-10');
  });

  it('accepts a Date as well as a string', () => {
    expect(periodForDate(new Date('2026-01-05T23:30:00Z'))).toBe('2026-01');
  });

  it('uses UTC, so the bucket does not move with the server timezone', () => {
    // 23:30 UTC is already the next day in IST (+05:30). Reading this off the
    // local month would file it under 2026-11.
    expect(periodForDate(new Date('2026-01-05T23:30:00Z'))).toBe('2026-01');
  });

  it('pads single-digit months', () => {
    expect(periodForDate('2026-03-09')).toBe('2026-03');
  });
});

function budgetRow(overrides = {}) {
  return {
    id: BUDGET_ID,
    userId: USER_ID,
    categoryId: CATEGORY_ID,
    period: '2026-10',
    limitAmount: 100000,
    spent: 0,
    category: { id: CATEGORY_ID, name: 'Food' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  prisma.category.findUnique.mockResolvedValue({
    id: CATEGORY_ID,
    userId: USER_ID,
  });
  prisma.budget.findUnique.mockResolvedValue(null);
});

describe('applyTransactionToBudget — atomic increment', () => {
  it('uses a single { increment } update, never read-then-write', async () => {
    prisma.budget.update.mockResolvedValue(budgetRow({ spent: 12500 }));

    await applyTransactionToBudget(BUDGET_ID, 12500);

    expect(prisma.budget.update).toHaveBeenCalledTimes(1);
    expect(prisma.budget.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BUDGET_ID },
        data: { spent: { increment: 12500 } },
      }),
    );
  });

  it('never reads the budget first', async () => {
    // A read-modify-write would show up here. `findFirst`/`findUnique` on budget
    // must stay unused by the increment path.
    prisma.budget.update.mockResolvedValue(budgetRow({ spent: 12500 }));

    await applyTransactionToBudget(BUDGET_ID, 12500);

    expect(prisma.budget.findFirst).not.toHaveBeenCalled();
    expect(prisma.budget.findUnique).not.toHaveBeenCalled();
  });

  it('keeps the amount as integer paise', async () => {
    prisma.budget.update.mockResolvedValue(budgetRow({ spent: 1 }));

    await applyTransactionToBudget(BUDGET_ID, 1);

    const { data } = prisma.budget.update.mock.calls[0][0];
    expect(data.spent.increment).toBe(1);
    expect(Number.isInteger(data.spent.increment)).toBe(true);
  });

  it('uses the caller-supplied client, so it can join a $transaction', async () => {
    prisma.budget.update.mockResolvedValue(budgetRow({ spent: 500 }));

    const tx = {
      budget: {
        update: vi.fn().mockResolvedValue(budgetRow({ spent: 500 })),
      },
    };
    await applyTransactionToBudget(BUDGET_ID, 500, tx);

    expect(tx.budget.update).toHaveBeenCalledTimes(1);
    // The shared client is untouched when a handle is passed in.
    expect(prisma.budget.update).not.toHaveBeenCalled();
  });

  it('returns the updated budget with utilization attached', async () => {
    prisma.budget.update.mockResolvedValue(budgetRow({ spent: 80000 }));

    const result = await applyTransactionToBudget(BUDGET_ID, 80000);

    expect(result.spent).toBe(80000);
    expect(result.utilization).toBe(0.8);
    expect(result.utilizationPercent).toBe(80);
    expect(result.thresholdLevel).toBe('approaching');
    expect(result.alerts).toEqual([0.8]);
    expect(result.remainingAmount).toBe(20000);
  });

  it('reports no alert before the first threshold', async () => {
    prisma.budget.update.mockResolvedValue(budgetRow({ spent: 20000 }));

    const result = await applyTransactionToBudget(BUDGET_ID, 20000);

    expect(result.thresholdLevel).toBe('ok');
    expect(result.alerts).toEqual([]);
  });

  it('rejects a non-integer amount before touching the database', async () => {
    await expect(
      applyTransactionToBudget(BUDGET_ID, 12.5),
    ).rejects.toMatchObject({ name: 'ValidationError', status: 400 });
    expect(prisma.budget.update).not.toHaveBeenCalled();
  });

  it('rejects a non-positive amount — a budget only ever goes up', async () => {
    await expect(applyTransactionToBudget(BUDGET_ID, 0)).rejects.toMatchObject({
      name: 'ValidationError',
    });
    await expect(
      applyTransactionToBudget(BUDGET_ID, -100),
    ).rejects.toMatchObject({ name: 'ValidationError' });
    expect(prisma.budget.update).not.toHaveBeenCalled();
  });

  it('maps a missing budget row to a 404 rather than a 500', async () => {
    prisma.budget.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', { code: 'P2025' }),
    );

    await expect(
      applyTransactionToBudget(BUDGET_ID, 100),
    ).rejects.toMatchObject({ name: 'NotFoundError', status: 404 });
  });

  it('rethrows anything that is not Prisma\'s own "not found"', async () => {
    prisma.budget.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('connection lost', {
        code: 'P1001',
      }),
    );

    await expect(applyTransactionToBudget(BUDGET_ID, 100)).rejects.toThrow(
      'connection lost',
    );
  });
});

describe('toBudgetView — derived fields', () => {
  it('clamps remainingAmount at 0 when the budget is overspent', () => {
    const view = toBudgetView(
      budgetRow({ spent: 150000, limitAmount: 100000 }),
    );
    expect(view.remainingAmount).toBe(0);
    expect(view.utilization).toBe(1.5);
    expect(view.thresholdLevel).toBe('exceeded');
  });

  it('rounds utilizationPercent to 2dp so the wire payload stays readable', () => {
    const view = toBudgetView(budgetRow({ spent: 33333, limitAmount: 100000 }));
    expect(view.utilizationPercent).toBe(33.33);
  });

  it('keeps the raw paise columns untouched', () => {
    const view = toBudgetView(budgetRow({ spent: 33333, limitAmount: 100000 }));
    expect(view.spent).toBe(33333);
    expect(view.limitAmount).toBe(100000);
  });
});

describe('createBudget', () => {
  const data = {
    categoryId: CATEGORY_ID,
    period: '2026-10',
    limitAmount: 100000,
  };

  it('creates with spent starting at zero', async () => {
    prisma.budget.create.mockResolvedValue(budgetRow());

    const budget = await createBudget(USER_ID, data);

    expect(budget.spent).toBe(0);
    expect(prisma.budget.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        categoryId: CATEGORY_ID,
        period: '2026-10',
        limitAmount: 100000,
        spent: 0,
      },
      include: { category: { select: { id: true, name: true } } },
    });
  });

  it('refuses a second budget for the same category and period', async () => {
    prisma.budget.findUnique.mockResolvedValue({ id: BUDGET_ID });

    await expect(createBudget(USER_ID, data)).rejects.toMatchObject({
      name: 'ConflictError',
      status: 409,
    });
    expect(prisma.budget.create).not.toHaveBeenCalled();
  });

  it('lets the unique constraint settle a race between two creates', async () => {
    prisma.budget.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique constraint', {
        code: 'P2002',
      }),
    );

    await expect(createBudget(USER_ID, data)).rejects.toMatchObject({
      name: 'ConflictError',
      status: 409,
    });
  });

  it('accepts a system category (userId null)', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: CATEGORY_ID,
      userId: null,
    });
    prisma.budget.create.mockResolvedValue(budgetRow());

    await expect(createBudget(USER_ID, data)).resolves.toMatchObject({
      id: BUDGET_ID,
    });
  });

  it("refuses another user's category", async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: CATEGORY_ID,
      userId: '99999999-9999-9999-9999-999999999999',
    });

    await expect(createBudget(USER_ID, data)).rejects.toMatchObject({
      name: 'ValidationError',
      status: 400,
    });
    expect(prisma.budget.create).not.toHaveBeenCalled();
  });

  it("gives a missing category the same answer as someone else's", async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(createBudget(USER_ID, data)).rejects.toMatchObject({
      message: 'Category not found',
      status: 400,
    });
  });
});
