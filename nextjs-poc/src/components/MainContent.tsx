'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AnimeWithTags, Tag, FilterOptions, ImportResult } from '@/lib/prisma';
import { AnimeTable } from './AnimeTable';
import { FilterBar } from './FilterBar';
import { ImportButton } from './ImportButton';
import { FetchTitlesButton } from './FetchTitlesButton';

interface MainContentProps {
  initialAnime: AnimeWithTags[];
  initialTags: Tag[];
  titleDisplay: 'default' | 'english';
}

export const MainContent: React.FC<MainContentProps> = ({ initialAnime, initialTags, titleDisplay }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Parse current filters from URL
  const filters: FilterOptions = {
    search: searchParams.get('search') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
    scores: searchParams.get('scores') 
      ? searchParams.get('scores')!.split(',').map(Number) 
      : undefined,
    tags: searchParams.get('tags') 
      ? searchParams.get('tags')!.split(',').map(Number) 
      : undefined,
    titleDisplay: (searchParams.get('titleDisplay') as 'default' | 'english') || 'default',
  };

  // Update URL when filters change (triggers server re-fetch)
  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    const params = new URLSearchParams();
    
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
    if (newFilters.sortOrder) params.set('sortOrder', newFilters.sortOrder);
    if (newFilters.scores && newFilters.scores.length > 0) {
      params.set('scores', newFilters.scores.join(','));
    }
    if (newFilters.tags && newFilters.tags.length > 0) {
      params.set('tags', newFilters.tags.join(','));
    }
    if (newFilters.titleDisplay && newFilters.titleDisplay !== 'default') {
      params.set('titleDisplay', newFilters.titleDisplay);
    }

    router.push(`?${params.toString()}`);
  }, [router]);

  const handleSort = useCallback((field: string) => {
    const newSortBy = field === 'updatedAt' ? 'updatedAt' : field;
    const newSortOrder = filters.sortBy === newSortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    handleFiltersChange({
      ...filters,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
    });
  }, [filters, handleFiltersChange]);

  // Handle clicking on a tag in the list to add it to filters
  const handleTagClick = useCallback((tagId: number) => {
    const currentTagIds = filters.tags ?? [];
    if (!currentTagIds.includes(tagId)) {
      handleFiltersChange({
        ...filters,
        tags: [...currentTagIds, tagId],
      });
    }
  }, [filters, handleFiltersChange]);

  const handleImportComplete = useCallback((result: ImportResult) => {
    setImportResult(result);
    router.refresh(); // Refresh server data
    setTimeout(() => setImportResult(null), 5000);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Anime List Manager</h1>
              <p className="text-slate-400 mt-1">
                {initialAnime.length > 0
                  ? `${initialAnime.length} anime in your list`
                  : 'Import your MAL export to get started'}
              </p>
            </div>
            <div className="flex gap-2">
              <FetchTitlesButton />
              <ImportButton onImportComplete={handleImportComplete} />
            </div>
          </div>

          {/* Import Result Notification */}
          {importResult && (
            <div className="mt-4 p-4 bg-emerald-900/50 border border-emerald-700 rounded-lg">
              <p className="text-emerald-300">
                Import complete: {importResult.created} created, {importResult.updated} updated
                {importResult.failed > 0 && `, ${importResult.failed} failed`}
              </p>
            </div>
          )}
        </header>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar filters={filters} tags={initialTags} onFiltersChange={handleFiltersChange} />
        </div>

        {/* Anime Table */}
        <AnimeTable
          anime={initialAnime}
          tags={initialTags}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSort={handleSort}
          titleDisplay={titleDisplay}
          onTagClick={handleTagClick}
        />
      </div>
    </div>
  );
};
