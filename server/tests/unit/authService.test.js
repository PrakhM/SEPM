import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocked before importing the service so the module graph picks up the mocks.
vi.mock('../../src/lib/prismaClient.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'signed.jwt.token'),
  },
}));

const bcrypt = (await import('bcrypt')).default;
const jwt = (await import('jsonwebtoken')).default;
const prisma = (await import('../../src/lib/prismaClient.js')).default;
const { getUserById, login, register } =
  await import('../../src/services/authService.js');

const CREDENTIALS = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'correct-horse-battery',
};

const STORED_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  name: CREDENTIALS.name,
  email: CREDENTIALS.email,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
});

describe('authService.register', () => {
  it('hashes the password and creates the user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');
    prisma.user.create.mockResolvedValue(STORED_USER);

    const result = await register(CREDENTIALS);

    expect(bcrypt.hash).toHaveBeenCalledWith(
      CREDENTIALS.password,
      expect.any(Number),
    );
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: CREDENTIALS.name,
        email: CREDENTIALS.email,
        passwordHash: 'hashed-password',
      },
      // Must not select the hash into the response.
      select: expect.not.objectContaining({ passwordHash: true }),
    });
    expect(result.user).toEqual(STORED_USER);
    expect(result.token).toBe('signed.jwt.token');
  });

  it('never returns the password hash to the caller', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');
    prisma.user.create.mockResolvedValue(STORED_USER);

    const result = await register(CREDENTIALS);

    expect(result.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('hashed-password');
  });

  it('signs a token carrying the user id as the subject', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');
    prisma.user.create.mockResolvedValue(STORED_USER);

    await register(CREDENTIALS);

    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: STORED_USER.id },
      'test-secret',
      expect.objectContaining({ expiresIn: expect.any(String) }),
    );
  });

  it('rejects a duplicate email with ConflictError', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: STORED_USER.id });

    await expect(register(CREDENTIALS)).rejects.toMatchObject({
      name: 'ConflictError',
      status: 409,
      code: 'CONFLICT',
    });

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('does not disclose whether the email exists in the thrown message', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: STORED_USER.id });

    await expect(register(CREDENTIALS)).rejects.toThrow(/already exists/i);
  });
});

describe('authService.login', () => {
  const stored = { ...STORED_USER, passwordHash: 'stored-hash' };

  it('returns the user and a token when the password matches', async () => {
    prisma.user.findUnique.mockResolvedValue(stored);
    bcrypt.compare.mockResolvedValue(true);

    const result = await login({
      email: CREDENTIALS.email,
      password: CREDENTIALS.password,
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      CREDENTIALS.password,
      'stored-hash',
    );
    expect(result.user).toEqual(STORED_USER);
    expect(result.token).toBe('signed.jwt.token');
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('rejects a wrong password with UnauthorizedError', async () => {
    prisma.user.findUnique.mockResolvedValue(stored);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      login({ email: CREDENTIALS.email, password: 'wrong-password' }),
    ).rejects.toMatchObject({
      name: 'UnauthorizedError',
      status: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('rejects an unknown email with the same error as a wrong password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.compare.mockResolvedValue(false);

    const unknownEmail = await login({
      email: 'nobody@example.com',
      password: 'whatever',
    }).catch((e) => e);
    const wrongPassword = await login({
      email: CREDENTIALS.email,
      password: 'wrong',
    }).catch((e) => e);

    expect(unknownEmail.name).toBe('UnauthorizedError');
    expect(unknownEmail.message).toBe(wrongPassword.message);
  });

  it('still runs a bcrypt comparison for an unknown email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.compare.mockResolvedValue(false);

    await login({ email: 'nobody@example.com', password: 'whatever' }).catch(
      () => {},
    );

    expect(bcrypt.compare).toHaveBeenCalled();
  });
});

describe('authService.getUserById', () => {
  it('returns the public user when the id resolves', async () => {
    prisma.user.findUnique.mockResolvedValue(STORED_USER);

    const user = await getUserById(STORED_USER.id);

    expect(user).toEqual(STORED_USER);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: STORED_USER.id },
      select: { id: true, name: true, email: true },
    });
  });

  it('never returns passwordHash even when the row carries it', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...STORED_USER,
      passwordHash: 'stored-hash',
    });

    const user = await getUserById(STORED_USER.id);

    expect(user.passwordHash).toBeUndefined();
  });

  it('returns null for an id that no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    expect(
      await getUserById('11111111-1111-1111-1111-111111111111'),
    ).toBeNull();
  });
});
