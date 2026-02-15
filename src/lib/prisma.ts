import { PrismaClient } from '@prisma/client';

// Re-export all client-safe utilities from colors.ts
// so existing imports from '@/lib/prisma' continue to work
export {
  type ColorKey,
  type Tag,
  type AnimeWithTags,
  type AnimeTag,
  type FilterOptions,
  type ImportResult,
  COLOR_MAP,
  getRandomCustomColorKey,
  getColor,
  getColorKeyForTag,
} from './colors';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaInitialized: boolean | undefined;
};

const prismaClient = globalForPrisma.prisma ?? new PrismaClient();

// Enable WAL mode and busy_timeout for SQLite concurrency
// WAL allows reads while writes are happening (no more SQLITE_BUSY errors)
// busy_timeout makes writers wait up to 5s instead of failing immediately
if (!globalForPrisma.prismaInitialized) {
  prismaClient.$connect().then(async () => {
    // Use $queryRawUnsafe for PRAGMAs since they may return result rows
    await prismaClient.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    await prismaClient.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
  }).catch((err) => {
    console.error('Failed to set SQLite PRAGMAs:', err);
  });
  globalForPrisma.prismaInitialized = true;
}

export const prisma = prismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
