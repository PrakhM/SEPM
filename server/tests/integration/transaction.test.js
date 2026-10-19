import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

/**
 * Transaction CRUD and the idempotency pattern against a real database.
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

const TEST_EMAIL_PREFIX = 'it.txn.test.';
const UNIQUE = `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
const EMAIL = `${TEST_EMAIL_PREFIX}${UNIQUE}@example.com`;
const PASSWORD = 'integration-test-password';

let token;

function cleanup() {
  // Order matters: children first, since the FKs cascade from User anyway but
  // this keeps the intent explicit.
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
    .send({ name: 'Txn Tester', email: EMAIL, password: PASSWORD });
  token = res.body.token;
  expect(res.status).toBe(201);
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

function auth(extra = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

describe('transactions — idempotency over HTTP', () => {
  const payload = {
    type: 'expense',
    amount: 124900,
    description: 'Zoya Textiles',
    date: '2026-10-18',
    paymentMethod: 'UPI',
  };

  it('creates a transaction and returns 201', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Idempotency-Key', `k-create-${UNIQUE}`)
      .set(auth())
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.transaction).toMatchObject({
      amount: 124900,
      description: 'Zoya Textiles',
      type: 'expense',
    });
  });

  it('sending the same request twice with one key creates exactly one row', async () => {
    const key = `k-dupe-${UNIQUE}`;
    // Unique per test: an earlier test already created a "Zoya Textiles"
    // row, so counting by that description would conflate the two.
    const description = `Zoya Textiles ${UNIQUE}`;

    const first = await request(app)
      .post('/api/transactions')
      .set('Idempotency-Key', key)
      .set(auth())
      .send({ ...payload, description });

    const second = await request(app)
      .post('/api/transactions')
      .set('Idempotency-Key', key)
      .set(auth())
      .send({ ...payload, description });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    // Same row, not two.
    expect(second.body.transaction.id).toBe(first.body.transaction.id);

    // Exactly one row for this description.
    const rows = await prisma.transaction.count({
      where: { userId: (await currentUser()).id, description },
    });
    expect(rows).toBe(1);
  });

  it('returns identical response bodies for both submissions', async () => {
    const key = `k-identical-${UNIQUE}`;

    const first = await request(app)
      .post('/api/transactions')
      .set('Idempotency-Key', key)
      .set(auth())
      .send(payload);

    const second = await request(app)
      .post('/api/transactions')
      .set('Idempotency-Key', key)
      .set(auth())
      .send(payload);

    // JSONB does not preserve key order, so compare structurally.
    expect(Object.entries(second.body.transaction).sort()).toEqual(
      Object.entries(first.body.transaction).sort(),
    );
    expect(second.body).toEqual(first.body);
  });

  it('stores the key alongside the response for replay', async () => {
    const key = `k-stored-${UNIQUE}`;
    const res = await request(app)
      .post('/api/transactions')
      .set('Idempotency-Key', key)
      .set(auth())
      .send(payload);

    const record = await prisma.idempotencyKey.findUnique({
      where: { userId_key: { userId: (await currentUser()).id, key } },
    });

    expect(record).not.toBeNull();
    expect(record.statusCode).toBe(201);
    expect(record.responseBody.id).toBe(res.body.transaction.id);
  });

  it('rejects a request with no Idempotency-Key with a clear 400', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set(auth())
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/Idempotency-Key/i);
  });

  it('does not create a row when the key is missing', async () => {
    const before = await prisma.transaction.count({
      where: { userId: (await currentUser()).id },
    });
    await request(app).post('/api/transactions').set(auth()).send(payload);
    const after = await prisma.transaction.count({
      where: { userId: (await currentUser()).id },
    });

    expect(after).toBe(before);
  });

  it('rejects a non-integer amount with 400', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Idempotency-Key', `k-float-${UNIQUE}`)
      .set(auth())
      .send({ ...payload, amount: 1249.5 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.amount).toMatch(/integer/i);
  });
});

describe('transactions — amounts are integer paise end to end', () => {
  it('returns an integer amount and stores one in Postgres', async () => {
    const key = `k-money-${UNIQUE}`;
    const res = await request(app)
      .post('/api/transactions')
      .set('Idempotency-Key', key)
      .set(auth())
      .send({
        type: 'expense',
        amount: 500050,
        description: 'Money check',
        date: '2026-10-18',
      });

    expect(Number.isInteger(res.body.transaction.amount)).toBe(true);

    const raw = await prisma.$queryRaw`
      SELECT amount FROM "Transaction" WHERE id = ${res.body.transaction.id}::uuid
    `;
    // Postgres integer comes back as a JS number, not a string or a float.
    expect(typeof raw[0].amount).toBe('number');
    expect(Number.isInteger(raw[0].amount)).toBe(true);
    expect(raw[0].amount).toBe(500050);
  });

  it('the amount column is integer, not numeric or double precision', async () => {
    const cols = await prisma.$queryRaw`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'Transaction' AND column_name = 'amount'
    `;
    expect(cols[0].data_type).toBe('integer');
  });
});

describe('transactions — CRUD', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Idempotency-Key', `k-crud-${UNIQUE}`)
      .set(auth())
      .send({
        type: 'expense',
        amount: 99900,
        description: 'Original',
        date: '2026-10-01',
      });
    id = res.body.transaction.id;
  });

  it('reads one', async () => {
    const res = await request(app).get(`/api/transactions/${id}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.transaction.description).toBe('Original');
  });

  it('updates one', async () => {
    const res = await request(app)
      .patch(`/api/transactions/${id}`)
      .set(auth())
      .send({ description: 'Updated', amount: 12300 });

    expect(res.status).toBe(200);
    expect(res.body.transaction.description).toBe('Updated');
    expect(res.body.transaction.amount).toBe(12300);

    const check = await request(app).get(`/api/transactions/${id}`).set(auth());
    expect(check.body.transaction.description).toBe('Updated');
  });

  it('lists, filtered by type', async () => {
    const res = await request(app)
      .get('/api/transactions?type=expense')
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.transactions.every((t) => t.type === 'expense')).toBe(true);
  });

  it('deletes one', async () => {
    const del = await request(app)
      .delete(`/api/transactions/${id}`)
      .set(auth());
    expect(del.status).toBe(204);

    const after = await request(app).get(`/api/transactions/${id}`).set(auth());
    expect(after.status).toBe(404);
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/transactions')).status).toBe(401);
    expect((await request(app).post('/api/transactions').send({})).status).toBe(
      401,
    );
  });
});

async function currentUser() {
  const res = await request(app).get('/api/auth/me').set(auth());
  return res.body.user;
}
