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
  titleDisplay?: 'default' | 'english' | 'japanese';
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
// Using 700-800 level shades for better contrast
// ============================================

export const TAG_COLORS = [
  '#b91c1c', // Red 700
  '#c2410c', // Orange 700
  '#b45309', // Amber 700
  '#a16207', // Yellow 700
  '#4d7c0f', // Lime 700
  '#15803d', // Green 700
  '#047857', // Emerald 700
  '#0f766e', // Teal 700
  '#0e7490', // Cyan 700
  '#0369a1', // Sky 700
  '#1d4ed8', // Blue 700
  '#4338ca', // Indigo 700
  '#6d28d9', // Violet 700
  '#7e22ce', // Purple 700
  '#a21caf', // Fuchsia 700
  '#be185d', // Pink 700
  '#be123c', // Rose 700
  '#334155', // Slate 700
  '#3f3f46', // Zinc 700
  '#44403c', // Stone 700
] as const;

// Status tag colors (specific assignments)
export const STATUS_COLORS: Record<string, string> = {
  Watching: '#1d4ed8',      // Blue 700
  Completed: '#15803d',     // Green 700
  'On-Hold': '#b45309',     // Amber 700
  Dropped: '#b91c1c',       // Red 700
  'Plan to Watch': '#334155', // Slate 700
};

// Type tag colors (specific assignments)
export const TYPE_COLORS: Record<string, string> = {
  TV: '#0369a1',            // Sky 700
  Movie: '#6d28d9',         // Violet 700
  OVA: '#be185d',           // Pink 700
  ONA: '#0f766e',           // Teal 700
  Special: '#c2410c',       // Orange 700
  Music: '#047857',         // Emerald 700
};

// Default color for custom tags
export const DEFAULT_TAG_COLOR = '#4338ca'; // Indigo 700
