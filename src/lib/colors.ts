import { Prisma } from '@prisma/client';

// ============================================
// ColorKey - Valid values for Tag.colorKey field
// ============================================

export type ColorKey =
  | 'DEFAULT'
  // Status tags
  | 'Watching'
  | 'Completed'
  | 'OnHold'
  | 'Dropped'
  | 'PlanToWatch'
  // Type tags
  | 'TV'
  | 'Movie'
  | 'OVA'
  | 'ONA'
  | 'Special'
  | 'Music'
  // Genre tags
  | 'Action'
  | 'Adventure'
  | 'AwardWinning'
  | 'Comedy'
  | 'Drama'
  | 'Ecchi'
  | 'Erotica'
  | 'Fantasy'
  | 'GirlsLove'
  | 'Gourmet'
  | 'Horror'
  | 'Mystery'
  | 'Romance'
  | 'SciFi'
  | 'SliceOfLife'
  | 'Sports'
  | 'Supernatural'
  | 'Suspense'
  // Studio
  | 'Studio'
  // Custom colors (randomly assigned to user-created tags)
  | 'Custom1'
  | 'Custom2'
  | 'Custom3'
  | 'Custom4'
  | 'Custom5'
  | 'Custom6'
  | 'Custom7'
  | 'Custom8'
  | 'Custom9'
  | 'Custom10';

// Type helpers for common query patterns
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
  scores?: number[]; // Selected score values (e.g., [1, 7, 8, 10])
  tags?: number[]; // Selected tag IDs
  titleDisplay?: 'default' | 'english';
}

// Import result from Server Action
export interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  total: number;
}

// ============================================
// Color Map - ColorKey to hex values
// All colors designed for white text (#ffffff)
// ============================================

export const COLOR_MAP: Record<ColorKey, string> = {
  // Default fallback
  DEFAULT: '#4338ca',       // Indigo 700
  
  // Status tags
  Watching: '#1d4ed8',      // Blue 700
  Completed: '#15803d',     // Green 700
  OnHold: '#b45309',        // Amber 700
  Dropped: '#b91c1c',       // Red 700
  PlanToWatch: '#334155',   // Slate 700
  
  // Type tags
  TV: '#0369a1',            // Sky 700
  Movie: '#6d28d9',         // Violet 700
  OVA: '#be185d',           // Pink 700
  ONA: '#0f766e',           // Teal 700
  Special: '#c2410c',       // Orange 700
  Music: '#047857',         // Emerald 700
  
  // Genre tags
  Action: '#b91c1c',        // Red 700
  Adventure: '#15803d',     // Green 700
  AwardWinning: '#a16207',  // Yellow 700
  Comedy: '#c2410c',        // Orange 700
  Drama: '#6d28d9',         // Violet 700
  Ecchi: '#be185d',         // Pink 700
  Erotica: '#9f1239',       // Rose 800
  Fantasy: '#7e22ce',       // Purple 700
  GirlsLove: '#db2777',     // Pink 600
  Gourmet: '#4d7c0f',       // Lime 700
  Horror: '#1f2937',        // Gray 800
  Mystery: '#4338ca',       // Indigo 700
  Romance: '#e11d48',       // Rose 600
  SciFi: '#0369a1',         // Sky 700
  SliceOfLife: '#047857',   // Emerald 700
  Sports: '#1d4ed8',        // Blue 700
  Supernatural: '#5b21b6',  // Violet 800
  Suspense: '#334155',      // Slate 700
  
  // Studio (all studios use same color)
  Studio: '#7e22ce',        // Purple 700
  
  // Custom colors (for user-created tags)
  Custom1: '#b91c1c',       // Red 700
  Custom2: '#c2410c',       // Orange 700
  Custom3: '#a16207',       // Yellow 700
  Custom4: '#15803d',       // Green 700
  Custom5: '#0f766e',       // Teal 700
  Custom6: '#0369a1',       // Sky 700
  Custom7: '#1d4ed8',       // Blue 700
  Custom8: '#6d28d9',       // Violet 700
  Custom9: '#7e22ce',       // Purple 700
  Custom10: '#be185d',      // Pink 700
};

// Custom color keys for random assignment
const CUSTOM_COLOR_KEYS: ColorKey[] = [
  'Custom1', 'Custom2', 'Custom3', 'Custom4', 'Custom5',
  'Custom6', 'Custom7', 'Custom8', 'Custom9', 'Custom10',
];

// Get a random custom color key for user-created tags
export function getRandomCustomColorKey(): ColorKey {
  return CUSTOM_COLOR_KEYS[Math.floor(Math.random() * CUSTOM_COLOR_KEYS.length)];
}

// Helper function to get hex color from colorKey string
export function getColor(colorKey: string): string {
  return COLOR_MAP[colorKey as ColorKey] || COLOR_MAP.DEFAULT;
}

// Helper to map tag name to ColorKey (for creating tags)
export function getColorKeyForTag(name: string, isStudio: boolean): ColorKey {
  if (isStudio) return 'Studio';
  
  // Map tag names to ColorKey values
  const nameToKey: Record<string, ColorKey> = {
    // Status
    'Watching': 'Watching',
    'Completed': 'Completed',
    'On-Hold': 'OnHold',
    'Dropped': 'Dropped',
    'Plan to Watch': 'PlanToWatch',
    // Type
    'TV': 'TV',
    'Movie': 'Movie',
    'OVA': 'OVA',
    'ONA': 'ONA',
    'Special': 'Special',
    'Music': 'Music',
    // Genre
    'Action': 'Action',
    'Adventure': 'Adventure',
    'Award Winning': 'AwardWinning',
    'Comedy': 'Comedy',
    'Drama': 'Drama',
    'Ecchi': 'Ecchi',
    'Erotica': 'Erotica',
    'Fantasy': 'Fantasy',
    'Girls Love': 'GirlsLove',
    'Gourmet': 'Gourmet',
    'Horror': 'Horror',
    'Mystery': 'Mystery',
    'Romance': 'Romance',
    'Sci-Fi': 'SciFi',
    'Slice of Life': 'SliceOfLife',
    'Sports': 'Sports',
    'Supernatural': 'Supernatural',
    'Suspense': 'Suspense',
  };
  
  return nameToKey[name] || 'DEFAULT';
}
