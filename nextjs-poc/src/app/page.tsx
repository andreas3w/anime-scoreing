import { prisma } from '@/lib/prisma';
import { MainContent } from '@/components/MainContent';

// This is a SERVER COMPONENT - runs on the server, no "use client"
// It can directly query the database!
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Build filter conditions from URL params
  const where: Record<string, unknown> = {};
  
  if (params.search) {
    where.title = { contains: String(params.search) };
  }
  
  if (params.minScore || params.maxScore) {
    where.myScore = {
      ...(params.minScore && { gte: parseInt(String(params.minScore), 10) }),
      ...(params.maxScore && { lte: parseInt(String(params.maxScore), 10) }),
    };
  }
  
  if (params.tags) {
    const tagIds = String(params.tags).split(',').map(Number);
    where.tags = {
      some: {
        tagId: { in: tagIds },
      },
    };
  }

  // Build sort options
  const orderBy: Record<string, string> = {};
  const sortBy = params.sortBy ? String(params.sortBy) : 'myScore';
  const sortOrder = params.sortOrder ? String(params.sortOrder) : 'desc';
  
  if (sortBy === 'updatedAt') {
    orderBy.myLastUpdated = sortOrder;
  } else if (sortBy) {
    orderBy[sortBy] = sortOrder;
  }

  // Direct database query - no API call needed!
  const animeList = await prisma.anime.findMany({
    where,
    include: {
      tags: {
        include: { tag: true },
      },
    },
    orderBy,
  });

  const allTags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
  });

  // Transform to match our component props
  const anime = animeList.map((a) => ({
    id: a.id,
    malId: a.malId,
    title: a.title,
    type: a.type,
    episodes: a.episodes,
    myScore: a.myScore,
    myStatus: a.myStatus,
    myWatchedEpisodes: a.myWatchedEpisodes,
    myStartDate: a.myStartDate,
    myFinishDate: a.myFinishDate,
    myLastUpdated: a.myLastUpdated,
    tags: a.tags.map((at) => ({
      id: at.tag.id,
      name: at.tag.name,
      color: at.tag.color,
      isStatus: at.tag.isStatus,
    })),
  }));

  const tags = allTags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    isStatus: t.isStatus,
  }));

  return <MainContent initialAnime={anime} initialTags={tags} />;
}
