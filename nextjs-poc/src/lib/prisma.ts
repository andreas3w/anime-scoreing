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

// ============================================
// Tag Color Palette
// All colors designed for white text (#ffffff)
// ============================================

export const TAG_COLORS = [
  '#dc2626', // Red 600
  '#ea580c', // Orange 600
  '#d97706', // Amber 600
  '#ca8a04', // Yellow 600
  '#65a30d', // Lime 600
  '#16a34a', // Green 600
  '#059669', // Emerald 600
  '#0d9488', // Teal 600
  '#0891b2', // Cyan 600
  '#0284c7', // Sky 600
  '#2563eb', // Blue 600
  '#4f46e5', // Indigo 600
  '#7c3aed', // Violet 600
  '#9333ea', // Purple 600
  '#c026d3', // Fuchsia 600
  '#db2777', // Pink 600
  '#e11d48', // Rose 600
  '#475569', // Slate 600
  '#52525b', // Zinc 600
  '#57534e', // Stone 600
] as const;

// Status tag colors (specific assignments)
export const STATUS_COLORS: Record<string, string> = {
  Watching: '#2563eb',      // Blue
  Completed: '#16a34a',     // Green
  'On-Hold': '#d97706',     // Amber
  Dropped: '#dc2626',       // Red
  'Plan to Watch': '#475569', // Slate
};

// Type tag colors (specific assignments)
export const TYPE_COLORS: Record<string, string> = {
  TV: '#0284c7',            // Sky
  Movie: '#7c3aed',         // Violet
  OVA: '#db2777',           // Pink
  ONA: '#0d9488',           // Teal
  Special: '#ea580c',       // Orange
  Music: '#059669',         // Emerald
};

// Default color for custom tags
export const DEFAULT_TAG_COLOR = '#4f46e5'; // Indigo
