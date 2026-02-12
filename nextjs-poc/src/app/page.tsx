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
  
  // Search across all title fields (default, english, japanese)
  if (params.search) {
    const searchTerm = String(params.search);
    where.OR = [
      { title: { contains: searchTerm } },
      { titleEnglish: { contains: searchTerm } },
      { titleJapanese: { contains: searchTerm } },
    ];
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
  // Pass Prisma types directly to components - no transformation needed
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

  // Get title display preference from URL params
  const titleDisplay = (params.titleDisplay as 'default' | 'english' | 'japanese') || 'default';

  return <MainContent initialAnime={animeList} initialTags={allTags} titleDisplay={titleDisplay} />;
}
