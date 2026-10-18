import { PrismaClient } from '../generated/prisma/index.js';

/**
 * The single shared Prisma client instance.
 *
 * architecture.md: services import this; controllers must never touch Prisma
 * directly. One instance per process — Prisma manages a connection pool behind
 * it, so constructing one per request would exhaust database connections.
 */
const prisma = new PrismaClient();

export default prisma;
