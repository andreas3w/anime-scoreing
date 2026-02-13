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
  
  // Filter by selected scores (can select multiple, e.g., [1, 7, 8, 10])
  if (params.scores) {
    const scoreValues = String(params.scores).split(',').map(Number);
    where.myScore = { in: scoreValues };
  }
  
  if (params.tags) {
    const tagIds = String(params.tags).split(',').map(Number);
    // AND filter: anime must have ALL selected tags
    where.AND = tagIds.map((tagId) => ({
      tags: {
        some: {
          tagId: tagId,
        },
      },
    }));
  }

  // Build sort options
  const orderBy: Record<string, string> = {};
  const sortBy = params.sortBy ? String(params.sortBy) : 'myScore';
  const sortOrder = params.sortOrder ? String(params.sortOrder) : 'desc';
  const titleDisplay = (params.titleDisplay as 'default' | 'english') || 'default';
  
  if (sortBy === 'updatedAt') {
    orderBy.myLastUpdated = sortOrder;
  } else if (sortBy === 'title') {
    // Sort by the selected title display field
    if (titleDisplay === 'english') {
      orderBy.titleEnglish = sortOrder;
    } else {
      orderBy.title = sortOrder;
    }
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

  return <MainContent initialAnime={animeList} initialTags={allTags} titleDisplay={titleDisplay} />;
}
