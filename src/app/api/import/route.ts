import { prisma, getColorKeyForTag } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Status tag mapping
const STATUS_MAP: Record<string, string> = {
  Watching: 'Watching',
  Completed: 'Completed',
  'On-Hold': 'On-Hold',
  Dropped: 'Dropped',
  'Plan to Watch': 'Plan to Watch',
};

interface ParsedMalEntry {
  malId: number;
  title: string;
  type: string | null;
  episodes: number | null;
  myScore: number;
  myStatus: string | null;
  myWatchedEpisodes: number;
  myStartDate: string | null;
  myFinishDate: string | null;
  myLastUpdated: string | null;
}

// Retry helper for transient SQLite busy errors
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 200): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      const isRetryable = msg.includes('SQLITE_BUSY') || msg.includes('database is locked');
      if (isRetryable && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Retry exhausted');
}

// Import a single anime entry inside a transaction to avoid partial writes
async function importEntry(entry: ParsedMalEntry): Promise<'created' | 'updated' | 'failed'> {
  try {
    return await withRetry(() => prisma.$transaction(async (tx) => {
      const animeType = entry.type;

      const data = {
        malId: entry.malId,
        title: entry.title,
        type: animeType,
        episodes: entry.episodes,
        myScore: entry.myScore,
        myStatus: entry.myStatus,
        myWatchedEpisodes: entry.myWatchedEpisodes,
        myStartDate: entry.myStartDate,
        myFinishDate: entry.myFinishDate,
        myLastUpdated: entry.myLastUpdated,
      };

      const existing = await tx.anime.findUnique({ where: { malId: entry.malId } });

      if (existing) {
        await tx.anime.update({ where: { malId: entry.malId }, data });

        if (animeType) {
          await tx.animeTag.deleteMany({
            where: { animeId: existing.id, tag: { isType: true } },
          });
          const typeTag = await tx.tag.upsert({
            where: { name: animeType },
            create: { name: animeType, isType: true, colorKey: getColorKeyForTag(animeType, false) },
            update: {},
          });
          await tx.animeTag.create({
            data: { animeId: existing.id, tagId: typeTag.id },
          });
        }

        const statusName = STATUS_MAP[entry.myStatus || ''];
        if (statusName) {
          await tx.animeTag.deleteMany({
            where: { animeId: existing.id, tag: { isStatus: true } },
          });
          const statusTag = await tx.tag.upsert({
            where: { name: statusName },
            create: { name: statusName, isStatus: true, colorKey: getColorKeyForTag(statusName, false) },
            update: {},
          });
          await tx.animeTag.create({
            data: { animeId: existing.id, tagId: statusTag.id },
          });
        }

        return 'updated' as const;
      } else {
        const anime = await tx.anime.create({ data });

        if (animeType) {
          const typeTag = await tx.tag.upsert({
            where: { name: animeType },
            create: { name: animeType, isType: true, colorKey: getColorKeyForTag(animeType, false) },
            update: {},
          });
          await tx.animeTag.create({
            data: { animeId: anime.id, tagId: typeTag.id },
          });
        }

        const statusName = STATUS_MAP[entry.myStatus || ''];
        if (statusName) {
          const statusTag = await tx.tag.upsert({
            where: { name: statusName },
            create: { name: statusName, isStatus: true, colorKey: getColorKeyForTag(statusName, false) },
            update: {},
          });
          await tx.animeTag.create({
            data: { animeId: anime.id, tagId: statusTag.id },
          });
        }

        return 'created' as const;
      }
    }));
  } catch (error) {
    console.error(`Failed to import anime malId ${entry.malId}:`, error);
    return 'failed';
  }
}

// POST /api/import - Import a batch of anime entries
// Using an API route instead of a server action to avoid RSC re-rendering overhead per request
export async function POST(request: NextRequest) {
  try {
    const { entries } = (await request.json()) as { entries: ParsedMalEntry[] };

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'No entries provided' }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const entry of entries) {
      const result = await importEntry(entry);
      if (result === 'created') created++;
      else if (result === 'updated') updated++;
      else failed++;
    }

    return NextResponse.json({ created, updated, failed });
  } catch (error) {
    console.error('Import batch failed:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
