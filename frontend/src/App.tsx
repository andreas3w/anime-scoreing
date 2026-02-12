import { useEffect, useState, useCallback } from 'react';
import { useAnime } from './hooks/useAnime';
import { tagsApi } from './api/client';
import { AnimeTable } from './components/AnimeTable';
import { FilterBar } from './components/FilterBar';
import { ImportButton } from './components/ImportButton';
import type { FilterOptions, ImportResult } from './types';

function App() {
  const { anime, tags, loading, error, fetchAnime, setTags, setAllTags } = useAnime();
  const [filters, setFilters] = useState<FilterOptions>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Fetch anime and tags on mount and when filters change
  useEffect(() => {
    fetchAnime(filters);
  }, [fetchAnime, filters]);

  useEffect(() => {
    tagsApi.getTags(true).then((res) => setAllTags(res.data));
  }, [setAllTags]);

  const handleSort = useCallback((field: string) => {
    setFilters((prev) => {
      const newSortBy = field === 'updatedAt' ? 'updatedAt' : field;
      const newSortOrder = prev.sortBy === newSortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc';
      return {
        ...prev,
        sortBy: newSortBy,
        sortOrder: newSortOrder,
      };
    });
  }, []);

  const handleSaveTags = useCallback(async (id: number, tagNames: string[]) => {
    await setTags(id, tagNames);
    // Refresh tags list in case new ones were created
    const res = await tagsApi.getTags(true);
    setAllTags(res.data);
  }, [setTags, setAllTags]);

  const handleImportComplete = useCallback((result: ImportResult) => {
    setImportResult(result);
    fetchAnime(filters);
    tagsApi.getTags(true).then((res) => setAllTags(res.data));
    // Clear the result notification after 5 seconds
    setTimeout(() => setImportResult(null), 5000);
  }, [fetchAnime, filters, setAllTags]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Anime List Manager</h1>
              <p className="text-slate-400 mt-1">
                {anime.length > 0 ? `${anime.length} anime in your list` : 'Import your MAL export to get started'}
              </p>
            </div>
            <ImportButton onImportComplete={handleImportComplete} />
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

          {/* Error Notification */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}
        </header>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar filters={filters} tags={tags} onFiltersChange={setFilters} />
        </div>

        {/* Anime Table */}
        <AnimeTable
          anime={anime}
          tags={tags}
          loading={loading}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSort={handleSort}
          onSaveTags={handleSaveTags}
        />
      </div>
    </div>
  );
}

export default App;
