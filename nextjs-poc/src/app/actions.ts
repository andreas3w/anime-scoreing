'use server';

import { prisma, STATUS_COLORS, TYPE_COLORS, TAG_COLORS } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { XMLParser } from 'fast-xml-parser';

// Pick a random color from the palette
function getRandomTagColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

// Server Action: Save tags for an anime
// Called directly from client components - no API endpoint needed!
export async function saveTags(animeId: number, tagNames: string[]) {
  // Remove existing custom tags (not status or type tags)
  await prisma.animeTag.deleteMany({
    where: {
      animeId,
      tag: { isStatus: false, isType: false },
    },
  });

  // Add new tags
  for (const name of tagNames) {
    // Find or create tag with random color for new tags
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name, isStatus: false, color: getRandomTagColor() },
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
          create: { name: animeType, isType: true, color: getTypeColor(animeType) },
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
          create: { name: statusName, isStatus: true, color: getStatusColor(statusName) },
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
          create: { name: animeType, isType: true, color: getTypeColor(animeType) },
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
          create: { name: statusName, isStatus: true, color: getStatusColor(statusName) },
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

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || getRandomTagColor();
}

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || getRandomTagColor();
}
