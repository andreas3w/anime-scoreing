import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Type helpers for common query patterns
// Use these instead of custom type definitions

export type Tag = Prisma.TagGetPayload<object>;

export type AnimeWithTags = Prisma.AnimeGetPayload<{
  include: { tags: { include: { tag: true } } };
}>;

// Helper to extract tag from junction table
export type AnimeTag = AnimeWithTags['tags'][number];

// Filter options for URL params
export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minScore?: number;
  maxScore?: number;
  tags?: string;
}

// Import result from Server Action
export interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  total: number;
}
