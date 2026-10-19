import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/prismaClient.js', () => ({
  default: {
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    idempotencyKey: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    // The expense path looks up the matching budget by (user, category,
    // period) before incrementing it. Unused by these tests, which all create
    // uncategorised transactions.
    budget: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
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
const { createTransaction } =
  await import('../../src/services/transactionService.js');

const USER_ID = '11111111-1111-1111-1111-111111111111';
const KEY = 'idempotency-key-abc';

const DATA = {
  type: 'expense',
  amount: 124900,
  description: 'Zoya Textiles',
  date: '2026-10-18',
  source: 'manual',
};

const CREATED_ROW = {
  id: '22222222-2222-2222-2222-222222222222',
  userId: USER_ID,
  categoryId: null,
  type: 'expense',
  amount: 124900,
  description: 'Zoya Textiles',
  paymentMethod: null,
  date: new Date('2026-10-18'),
  source: 'manual',
  createdAt: new Date('2026-10-18T10:00:00Z'),
  category: null,
};

/**
 * The interactive $transaction callback is invoked with a tx handle whose
 * methods are the same vi.fn mocks, so a test can assert on them.
 */
function mockTransactionTx(overrides = {}) {
  const tx = {
    transaction: { create: vi.fn().mockResolvedValue(CREATED_ROW) },
    idempotencyKey: { create: vi.fn().mockResolvedValue(undefined) },
    ...overrides,
  };
  prisma.$transaction.mockImplementation((cb) => cb(tx));
  return tx;
}

beforeEach(() => {
  vi.clearAllMocks();
  prisma.idempotencyKey.delete.mockResolvedValue({});
});

describe('createTransaction — idempotency', () => {
  it('creates the row and stores the key when the key is unseen', async () => {
    prisma.idempotencyKey.findUnique.mockResolvedValue(null);
    const tx = mockTransactionTx();

    const result = await createTransaction(USER_ID, DATA, KEY);

    expect(result.replayed).toBe(false);
    expect(result.statusCode).toBe(201);
    expect(tx.transaction.create).toHaveBeenCalledTimes(1);
    expect(tx.idempotencyKey.create).toHaveBeenCalledTimes(1);
    expect(tx.idempotencyKey.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        key: KEY,
        statusCode: 201,
        responseBody: expect.objectContaining({
          id: CREATED_ROW.id,
          amount: 124900,
          description: 'Zoya Textiles',
        }),
      },
    });
  });

  it('replays the stored response when the key was seen before', async () => {
    const stored = {
      id: CREATED_ROW.id,
      userId: USER_ID,
      amount: 124900,
      description: 'Zoya Textiles',
    };
    prisma.idempotencyKey.findUnique.mockResolvedValue({
      id: 'stored-row-id',
      userId: USER_ID,
      key: KEY,
      statusCode: 201,
      responseBody: stored,
      createdAt: new Date(),
    });

    const result = await createTransaction(USER_ID, DATA, KEY);

    expect(result.replayed).toBe(true);
    expect(result.statusCode).toBe(201);
    expect(result.transaction).toEqual(stored);
  });

  it('does NOT call create twice when the same key is submitted twice', async () => {
    prisma.idempotencyKey.findUnique.mockResolvedValue(null);
    const tx = mockTransactionTx();

    // First submission — key unseen.
    await createTransaction(USER_ID, DATA, KEY);
    expect(tx.transaction.create).toHaveBeenCalledTimes(1);

    // Second submission, same key: the row now exists.
    prisma.idempotencyKey.findUnique.mockResolvedValue({
      id: 'stored-row-id',
      userId: USER_ID,
      key: KEY,
      statusCode: 201,
      responseBody: { id: CREATED_ROW.id, amount: 124900 },
      createdAt: new Date(),
    });

    const replay = await createTransaction(USER_ID, DATA, KEY);

    expect(replay.replayed).toBe(true);
    // The critical assertion: no second row.
    expect(tx.transaction.create).toHaveBeenCalledTimes(1);
    expect(tx.idempotencyKey.create).toHaveBeenCalledTimes(1);
  });

  it('returns identical results for both submissions of one key', async () => {
    prisma.idempotencyKey.findUnique.mockResolvedValue(null);
    mockTransactionTx();

    const first = await createTransaction(USER_ID, DATA, KEY);

    prisma.idempotencyKey.findUnique.mockResolvedValue({
      id: 'stored-row-id',
      userId: USER_ID,
      key: KEY,
      statusCode: 201,
      responseBody: first.transaction,
      createdAt: new Date(),
    });

    const second = await createTransaction(USER_ID, DATA, KEY);

    expect(second.transaction).toEqual(first.transaction);
    expect(second.statusCode).toBe(first.statusCode);
  });

  it('replays rather than duplicating when a race trips the unique constraint', async () => {
    prisma.idempotencyKey.findUnique
      // First lookup: nothing there.
      .mockResolvedValueOnce(null)
      // After P2002: the winner's row.
      .mockResolvedValueOnce({
        id: 'stored-row-id',
        userId: USER_ID,
        key: KEY,
        statusCode: 201,
        responseBody: { id: 'winner-row-id', amount: 124900 },
        createdAt: new Date(),
      });

    prisma.$transaction.mockImplementation(async () => {
      throw new Prisma.PrismaClientKnownRequestError('unique constraint', {
        code: 'P2002',
      });
    });

    const result = await createTransaction(USER_ID, DATA, KEY);

    expect(result.replayed).toBe(true);
    expect(result.transaction.id).toBe('winner-row-id');
  });

  it('treats a key older than 24h as unseen and deletes it', async () => {
    const stale = new Date(Date.now() - 25 * 60 * 60 * 1000);
    prisma.idempotencyKey.findUnique.mockResolvedValue({
      id: 'stale-row-id',
      userId: USER_ID,
      key: KEY,
      statusCode: 201,
      responseBody: { id: 'old' },
      createdAt: stale,
    });
    mockTransactionTx();

    const result = await createTransaction(USER_ID, DATA, KEY);

    expect(prisma.idempotencyKey.delete).toHaveBeenCalledWith({
      where: { id: 'stale-row-id' },
    });
    // Treated as a fresh request, so the row is created again.
    expect(result.replayed).toBe(false);
  });

  it('rejects a missing Idempotency-Key', async () => {
    await expect(
      createTransaction(USER_ID, DATA, undefined),
    ).rejects.toMatchObject({
      name: 'ValidationError',
      status: 400,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('scopes the lookup to the authenticated user', async () => {
    prisma.idempotencyKey.findUnique.mockResolvedValue(null);
    mockTransactionTx();

    await createTransaction(USER_ID, DATA, KEY);

    expect(prisma.idempotencyKey.findUnique).toHaveBeenCalledWith({
      where: { userId_key: { userId: USER_ID, key: KEY } },
    });
  });

  it('keeps money as integer paise with no conversion', async () => {
    prisma.idempotencyKey.findUnique.mockResolvedValue(null);
    const tx = mockTransactionTx();

    await createTransaction(USER_ID, DATA, KEY);

    const { data } = tx.transaction.create.mock.calls[0][0];
    expect(data.amount).toBe(124900);
    expect(Number.isInteger(data.amount)).toBe(true);
  });
});
