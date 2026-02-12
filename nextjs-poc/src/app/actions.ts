'use server';

import { prisma, getColorKeyForTag, getRandomCustomColorKey } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { XMLParser } from 'fast-xml-parser';

// Jikan API base URL
const JIKAN_API_BASE = 'https://api.jikan.moe/v4';

// Rate limiting helper - Jikan has a 3 requests/second limit
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Server Action: Save tags for an anime
// Called directly from client components - no API endpoint needed!
export async function saveTags(animeId: number, tagNames: string[]) {
  // Remove existing custom tags (not status, type, studio, or genre tags)
  await prisma.animeTag.deleteMany({
    where: {
      animeId,
      tag: { isStatus: false, isType: false, isStudio: false, isGenre: false },
    },
  });

  // Add new tags
  for (const name of tagNames) {
    // Find or create tag - custom tags get random color
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name, colorKey: getRandomCustomColorKey() },
      update: {},
    });

    // Link to anime
    await prisma.animeTag.create({
      data: { animeId, tagId: tag.id },
    });
  }

  // Revalidate the page to show new data
  revalidatePath('/');
}

// Server Action: Import MAL XML
export async function importMalXml(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const text = await file.text();
  const parser = new XMLParser();
  const result = parser.parse(text);

  const animeEntries = result.myanimelist?.anime || [];
  const entries = Array.isArray(animeEntries) ? animeEntries : [animeEntries];

  let created = 0;
  let updated = 0;

  // Status tag mapping
  const statusMap: Record<string, string> = {
    Watching: 'Watching',
    Completed: 'Completed',
    'On-Hold': 'On-Hold',
    Dropped: 'Dropped',
    'Plan to Watch': 'Plan to Watch',
  };

  for (const entry of entries) {
    const malId = entry.series_animedb_id;
    if (!malId) continue;

    const animeType = entry.series_type || null;

    const data = {
      malId,
      title: entry.series_title || 'Unknown',
      type: animeType, // Keep for backwards compatibility
      episodes: entry.series_episodes || null,
      myScore: entry.my_score || 0,
      myStatus: entry.my_status || null,
      myWatchedEpisodes: entry.my_watched_episodes || 0,
      myStartDate: entry.my_start_date || null,
      myFinishDate: entry.my_finish_date || null,
      myLastUpdated: entry.my_last_updated || null,
    };

    const existing = await prisma.anime.findUnique({ where: { malId } });

    if (existing) {
      await prisma.anime.update({ where: { malId }, data });

      // Update type tag if changed
      if (animeType) {
        // Remove old type tag
        await prisma.animeTag.deleteMany({
          where: {
            animeId: existing.id,
            tag: { isType: true },
          },
        });

        // Add new type tag
        const typeTag = await prisma.tag.upsert({
          where: { name: animeType },
          create: { name: animeType, isType: true, colorKey: getColorKeyForTag(animeType, false) },
          update: {},
        });
        await prisma.animeTag.create({
          data: { animeId: existing.id, tagId: typeTag.id },
        });
      }

      // Update status tag if changed
      const statusName = statusMap[entry.my_status];
      if (statusName) {
        // Remove old status tag
        await prisma.animeTag.deleteMany({
          where: {
            animeId: existing.id,
            tag: { isStatus: true },
          },
        });

        // Add new status tag
        const statusTag = await prisma.tag.upsert({
          where: { name: statusName },
          create: { name: statusName, isStatus: true, colorKey: getColorKeyForTag(statusName, false) },
          update: {},
        });
        await prisma.animeTag.create({
          data: { animeId: existing.id, tagId: statusTag.id },
        });
      }

      updated++;
    } else {
      const anime = await prisma.anime.create({ data });
      created++;

      // Add type tag for new entries
      if (animeType) {
        const typeTag = await prisma.tag.upsert({
          where: { name: animeType },
          create: { name: animeType, isType: true, colorKey: getColorKeyForTag(animeType, false) },
          update: {},
        });
        await prisma.animeTag.create({
          data: { animeId: anime.id, tagId: typeTag.id },
        });
      }

      // Add status tag for new entries
      const statusName = statusMap[entry.my_status];
      if (statusName) {
        const statusTag = await prisma.tag.upsert({
          where: { name: statusName },
          create: { name: statusName, isStatus: true, colorKey: getColorKeyForTag(statusName, false) },
          update: {},
        });
        await prisma.animeTag.create({
          data: { animeId: anime.id, tagId: statusTag.id },
        });
      }
    }
  }

  revalidatePath('/');
  return { created, updated, failed: 0, total: entries.length };
}

// Interface for Jikan API response
interface JikanAnimeResponse {
  data: {
    mal_id: number;
    title: string;
    title_english: string | null;
    title_japanese: string | null;
    synopsis: string | null;
    year: number | null;
    images: {
      jpg: {
        image_url: string;
        small_image_url: string;
        large_image_url: string;
      };
    };
    trailer: {
      youtube_id: string | null;
      url: string | null;
    } | null;
    studios: Array<{ mal_id: number; name: string }>;
    genres: Array<{ mal_id: number; name: string }>;
  };
}

// Data returned from Jikan fetch
interface JikanFetchResult {
  titleEnglish: string | null;
  titleJapanese: string | null;
  imageUrl: string | null;
  synopsis: string | null;
  trailerUrl: string | null;
  year: number | null;
  studios: string[];
  genres: string[];
}

// Fetch anime data from Jikan API with retry logic
async function fetchAnimeFromJikan(malId: number, retries = 3): Promise<JikanFetchResult | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${JIKAN_API_BASE}/anime/${malId}`);
      
      // Handle rate limiting (429) with exponential backoff
      if (response.status === 429) {
        console.log(`Rate limited for malId ${malId}, attempt ${attempt}/${retries}, waiting...`);
        if (attempt < retries) {
          // Wait longer on each retry: 2s, 4s, 8s
          await delay(2000 * Math.pow(2, attempt - 1));
          continue;
        }
        return null;
      }
      
      // Handle 404 - anime doesn't exist
      if (response.status === 404) {
        console.log(`Anime not found for malId ${malId}`);
        return null;
      }
      
      if (!response.ok) {
        console.error(`Jikan API error for malId ${malId}: ${response.status}`);
        if (attempt < retries) {
          await delay(2000);
          continue;
        }
        return null;
      }
      
      // Parse JSON with error handling for malformed responses
      let data: JikanAnimeResponse;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.error(`Failed to parse JSON for malId ${malId}:`, parseError);
        if (attempt < retries) {
          await delay(2000);
          continue;
        }
        return null;
      }
      
      // Validate that we got the expected data structure
      if (!data?.data) {
        console.error(`Invalid response structure for malId ${malId}`);
        if (attempt < retries) {
          await delay(2000);
          continue;
        }
        return null;
      }
      
      return {
        titleEnglish: data.data.title_english || null,
        titleJapanese: data.data.title_japanese || null,
        imageUrl: data.data.images?.jpg?.image_url || null,
        synopsis: data.data.synopsis || null,
        trailerUrl: data.data.trailer?.url || null,
        year: data.data.year || null,
        studios: data.data.studios?.map(s => s.name) || [],
        genres: data.data.genres?.map(g => g.name) || [],
      };
    } catch (error) {
      console.error(`Failed to fetch from Jikan for malId ${malId}:`, error);
      if (attempt < retries) {
        await delay(2000 * attempt);
        continue;
      }
      return null;
    }
  }
  return null;
}

// Server Action: Get list of anime missing data (for progress tracking)
export async function getAnimeMissingData(): Promise<{ id: number; malId: number; title: string }[]> {
  const animeMissingData = await prisma.anime.findMany({
    where: {
      dataFetched: false,
    },
    select: { id: true, malId: true, title: true },
  });
  return animeMissingData;
}

// Colors for studio tags (darker for better contrast)
const STUDIO_COLOR = '#7e22ce'; // Purple 700

// Helper to create studio/genre tags for an anime
async function createTagsForAnime(animeId: number, studios: string[], genres: string[]) {
  // Create studio tags
  for (const studioName of studios) {
    const tag = await prisma.tag.upsert({
      where: { name: studioName },
      create: { name: studioName, isStudio: true, colorKey: getColorKeyForTag(studioName, true) },
      update: {},
    });
    await prisma.animeTag.upsert({
      where: { animeId_tagId: { animeId, tagId: tag.id } },
      create: { animeId, tagId: tag.id },
      update: {},
    });
  }
  
  // Create genre tags with specific colors per genre
  for (const genreName of genres) {
    const tag = await prisma.tag.upsert({
      where: { name: genreName },
      create: { name: genreName, isGenre: true, colorKey: getColorKeyForTag(genreName, false) },
      update: {},
    });
    await prisma.animeTag.upsert({
      where: { animeId_tagId: { animeId, tagId: tag.id } },
      create: { animeId, tagId: tag.id },
      update: {},
    });
  }
}

// Server Action: Fetch data for a single anime by ID (returns the fetched data for UI)
export async function fetchSingleAnimeData(animeId: number): Promise<{
  success: boolean;
  title?: string;
  titleEnglish?: string | null;
  titleJapanese?: string | null;
  imageUrl?: string | null;
} | null> {
  const anime = await prisma.anime.findUnique({
    where: { id: animeId },
    select: { id: true, malId: true, title: true },
  });

  if (!anime) return { success: false };

  const result = await fetchAnimeFromJikan(anime.malId);
  
  // Always mark as fetched, even if result is null (anime not found on MAL)
  if (!result) {
    await prisma.anime.update({
      where: { id: animeId },
      data: { dataFetched: true },
    });
    return { success: false, title: anime.title };
  }

  // Update anime with fetched data
  await prisma.anime.update({
    where: { id: animeId },
    data: {
      titleEnglish: result.titleEnglish,
      titleJapanese: result.titleJapanese,
      imageUrl: result.imageUrl,
      synopsis: result.synopsis,
      trailerUrl: result.trailerUrl,
      year: result.year,
      dataFetched: true,
    },
  });

  // Create studio and genre tags
  await createTagsForAnime(animeId, result.studios, result.genres);

  return {
    success: true,
    title: anime.title,
    titleEnglish: result.titleEnglish,
    titleJapanese: result.titleJapanese,
    imageUrl: result.imageUrl,
  };
}

// Server Action: Revalidate the page (call after batch fetching is complete)
export async function revalidateAnimePage() {
  revalidatePath('/');
}

// Server Action: Fetch English/Japanese titles and images for all anime missing them
export async function fetchMissingTitles(): Promise<{ updated: number; failed: number; total: number }> {
  // Find anime that haven't been fetched yet
  const animeMissingData = await prisma.anime.findMany({
    where: {
      dataFetched: false,
    },
    select: { id: true, malId: true, title: true },
  });

  let updated = 0;
  let failed = 0;

  for (const anime of animeMissingData) {
    // Rate limiting - Jikan API is strict, use 1.5 seconds between requests
    // This is slower but more reliable
    await delay(1500);

    const result = await fetchAnimeFromJikan(anime.malId);
    if (result) {
      await prisma.anime.update({
        where: { id: anime.id },
        data: {
          titleEnglish: result.titleEnglish,
          titleJapanese: result.titleJapanese,
          imageUrl: result.imageUrl,
          synopsis: result.synopsis,
          trailerUrl: result.trailerUrl,
          year: result.year,
          dataFetched: true,
        },
      });
      // Create studio and genre tags
      await createTagsForAnime(anime.id, result.studios, result.genres);
      updated++;
      console.log(`✓ Updated ${anime.title} (${updated}/${animeMissingData.length})`);
    } else {
      // Mark as fetched even on failure so we don't retry forever
      await prisma.anime.update({
        where: { id: anime.id },
        data: { dataFetched: true },
      });
      failed++;
      console.log(`✗ Failed ${anime.title} (malId: ${anime.malId})`);
    }
  }

  revalidatePath('/');
  return { updated, failed, total: animeMissingData.length };
}

// Server Action: Fetch data for a single anime
export async function fetchTitlesForAnime(animeId: number): Promise<boolean> {
  const anime = await prisma.anime.findUnique({
    where: { id: animeId },
    select: { id: true, malId: true },
  });

  if (!anime) return false;

  const result = await fetchAnimeFromJikan(anime.malId);
  if (!result) {
    await prisma.anime.update({
      where: { id: animeId },
      data: { dataFetched: true },
    });
    return false;
  }

  await prisma.anime.update({
    where: { id: animeId },
    data: {
      titleEnglish: result.titleEnglish,
      titleJapanese: result.titleJapanese,
      imageUrl: result.imageUrl,
      synopsis: result.synopsis,
      trailerUrl: result.trailerUrl,
      year: result.year,
      dataFetched: true,
    },
  });

  // Create studio and genre tags
  await createTagsForAnime(animeId, result.studios, result.genres);

  revalidatePath('/');
  return true;
}
