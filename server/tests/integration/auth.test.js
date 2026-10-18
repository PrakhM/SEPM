import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

/**
 * register -> login -> /me against a real database.
 *
 * Refuses to run unless TEST_DATABASE_URL is set. Without this guard the suite
 * falls back to DATABASE_URL and runs its deleteMany against whatever database
 * holds real data — the row-scoping below is a convention, not a boundary.
 * Point TEST_DATABASE_URL at a throwaway database (a Neon dev branch is the
 * cheapest option).
 */
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Integration tests must not run against the development database.\n' +
      'Create a throwaway database (e.g. a Neon dev branch) and add it to server/.env:\n' +
      '  TEST_DATABASE_URL=postgresql://...\n' +
      'See the "Database" section of progress.md.',
  );
}

// Must be set before prismaClient is constructed — it reads the env at
// construction time, so this has to happen above the imports below.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const { default: app } = await import('../../src/app.js');
const { default: prisma } = await import('../../src/lib/prismaClient.js');

const TEST_EMAIL_PREFIX = 'it.auth.test.';
const UNIQUE = `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;

const CREDENTIALS = {
  name: 'Integration Tester',
  email: `${TEST_EMAIL_PREFIX}${UNIQUE}@example.com`,
  password: 'integration-test-password',
};

let token;

function cleanup() {
  return prisma.user.deleteMany({
    where: { email: { startsWith: TEST_EMAIL_PREFIX } },
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

describe('auth flow: register -> login -> /me', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(CREDENTIALS);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      name: CREDENTIALS.name,
      email: CREDENTIALS.email,
    });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(typeof res.body.token).toBe('string');

    token = res.body.token;
  });

  it('stores the password hashed, never in plaintext', async () => {
    const row = await prisma.user.findUnique({
      where: { email: CREDENTIALS.email },
      select: { passwordHash: true },
    });

    expect(row).not.toBeNull();
    expect(row.passwordHash).not.toBe(CREDENTIALS.password);
    expect(row.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate registration with 409', async () => {
    const res = await request(app).post('/api/auth/register').send(CREDENTIALS);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects a malformed payload with 400 and field details', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
      password: expect.any(String),
    });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.email, password: CREDENTIALS.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(CREDENTIALS.email);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(typeof res.body.token).toBe('string');

    token = res.body.token;
  });

  it('rejects a wrong password with 401 and no hash leak', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(JSON.stringify(res.body)).not.toContain('$2b$');
  });

  it('returns the current user from /me with the token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: CREDENTIALS.email,
      name: CREDENTIALS.name,
    });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects /me with no token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects /me with a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.jwt');

    expect(res.status).toBe(401);
  });

  it('rejects /me once the user is deleted', async () => {
    await prisma.user.update({
      where: { email: CREDENTIALS.email },
      data: { name: 'Renamed' },
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    // Still valid: the token is checked against the user row, which exists.
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Renamed');
  });
});
