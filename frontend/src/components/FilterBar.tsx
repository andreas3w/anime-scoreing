import { useState, useCallback } from 'react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import type { FilterOptions, Tag } from '../types';
import { Badge } from './ui/Badge';

interface FilterBarProps {
  filters: FilterOptions;
  tags: Tag[];
  onFiltersChange: (filters: FilterOptions) => void;
}

const sortByOptions = [
  { value: '_default', label: 'Default' },
  { value: 'title', label: 'Title' },
  { value: 'myScore', label: 'Score' },
  { value: 'type', label: 'Type' },
  { value: 'updatedAt', label: 'Last Updated' },
];

const sortOrderOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

const scoreOptions = [
  { value: '_any', label: 'Any' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
];

export const FilterBar: React.FC<FilterBarProps> = ({ filters, tags, onFiltersChange }) => {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      onFiltersChange({ ...filters, search: value || undefined });
    },
    [filters, onFiltersChange]
  );

  const handleSortByChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        sortBy: value === '_default' ? undefined : value,
      });
    },
    [filters, onFiltersChange]
  );

  const handleSortOrderChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        sortOrder: (value as 'asc' | 'desc') || undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleMinScoreChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        minScore: value === '_any' ? undefined : parseInt(value, 10),
      });
    },
    [filters, onFiltersChange]
  );

  const handleMaxScoreChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        maxScore: value === '_any' ? undefined : parseInt(value, 10),
      });
    },
    [filters, onFiltersChange]
  );

  const toggleTag = useCallback(
    (tagId: number) => {
      const newSelected = new Set(selectedTagIds);
      if (newSelected.has(tagId)) {
        newSelected.delete(tagId);
      } else {
        newSelected.add(tagId);
      }
      setSelectedTagIds(newSelected);

      const tagIdsStr = newSelected.size > 0 ? Array.from(newSelected).join(',') : undefined;
      onFiltersChange({ ...filters, tags: tagIdsStr });
    },
    [selectedTagIds, filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedTagIds(new Set());
    onFiltersChange({});
  }, [onFiltersChange]);

  const statusTags = tags.filter((t) => t.isStatus);
  const customTags = tags.filter((t) => !t.isStatus);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <Input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title..."
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Sort by:</span>
          <Select
            options={sortByOptions}
            value={filters.sortBy || '_default'}
            onValueChange={handleSortByChange}
            placeholder="Sort by..."
          />
          <Select
            options={sortOrderOptions}
            value={filters.sortOrder || 'asc'}
            onValueChange={handleSortOrderChange}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Score:</span>
          <Select
            options={scoreOptions}
            value={filters.minScore?.toString() || '_any'}
            onValueChange={handleMinScoreChange}
            placeholder="Min"
            className="w-20"
          />
          <span className="text-slate-600">–</span>
          <Select
            options={scoreOptions}
            value={filters.maxScore?.toString() || '_any'}
            onValueChange={handleMaxScoreChange}
            placeholder="Max"
            className="w-20"
          />
        </div>

        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear
        </Button>
      </div>

      {/* Tags Filter Row */}
      {(statusTags.length > 0 || customTags.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400 mr-2">Filter by tag:</span>
          {statusTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`transition-opacity ${selectedTagIds.has(tag.id) ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
            >
              <Badge color={tag.color} isStatus>
                {tag.name}
              </Badge>
            </button>
          ))}
          {statusTags.length > 0 && customTags.length > 0 && (
            <span className="text-slate-700 mx-1">|</span>
          )}
          {customTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`transition-opacity ${selectedTagIds.has(tag.id) ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
            >
              <Badge color={tag.color}>{tag.name}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
