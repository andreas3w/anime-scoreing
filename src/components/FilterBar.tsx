'use client';

import { useState, useCallback } from 'react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import type { FilterOptions, Tag } from '@/lib/colors';
import { getColor } from '@/lib/colors';

interface FilterBarProps {
  filters: FilterOptions;
  tags: Tag[];
  onFiltersChange: (filters: FilterOptions) => void;
}

const titleDisplayOptions = [
  { value: 'default', label: 'Original' },
  { value: 'english', label: 'English' },
];

const SCORE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const FilterBar: React.FC<FilterBarProps> = ({ filters, tags, onFiltersChange }) => {
  const [search, setSearch] = useState(filters.search || '');
  
  // Derive selected IDs from filters (arrays)
  const selectedTagIds = new Set<number>(filters.tags ?? []);
  const selectedScores = new Set<number>(filters.scores ?? []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      onFiltersChange({ ...filters, search: value || undefined });
    },
    [filters, onFiltersChange]
  );

  const handleTitleDisplayChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        titleDisplay: (value as 'default' | 'english') || 'default',
      });
    },
    [filters, onFiltersChange]
  );

  const toggleScore = useCallback(
    (score: number) => {
      const newSelected = new Set(selectedScores);
      if (newSelected.has(score)) {
        newSelected.delete(score);
      } else {
        newSelected.add(score);
      }

      onFiltersChange({
        ...filters,
        scores: newSelected.size > 0 ? Array.from(newSelected) : undefined,
      });
    },
    [selectedScores, filters, onFiltersChange]
  );

  const toggleTag = useCallback(
    (tagId: number) => {
      const newSelected = new Set(selectedTagIds);
      if (newSelected.has(tagId)) {
        newSelected.delete(tagId);
      } else {
        newSelected.add(tagId);
      }

      onFiltersChange({
        ...filters,
        tags: newSelected.size > 0 ? Array.from(newSelected) : undefined,
      });
    },
    [selectedTagIds, filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    onFiltersChange({});
  }, [onFiltersChange]);

  // Categorize tags by type
  const statusTags = tags.filter((t) => t.isStatus);
  const typeTags = tags.filter((t) => t.isType);
  const studioTags = tags.filter((t) => t.isStudio);
  const genreTags = tags.filter((t) => t.isGenre);
  const customTags = tags.filter((t) => !t.isStatus && !t.isType && !t.isStudio && !t.isGenre);

  // Render a row of tag pills
  const renderTagRow = (label: string, tagList: Tag[], showIfEmpty = false) => {
    if (tagList.length === 0 && !showIfEmpty) return null;
    return (
      <div className="flex flex-wrap items-center gap-2 py-2 border-t border-slate-800">
        <span className="text-sm text-slate-400 w-16 flex-shrink-0">{label}:</span>
        {tagList.length === 0 ? (
          <span className="text-sm text-slate-600 italic">None</span>
        ) : (
          tagList.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`transition-all ${
                selectedTagIds.has(tag.id) 
                  ? 'opacity-100 scale-105' 
                  : 'opacity-50 hover:opacity-75'
              }`}
            >
              <Badge color={getColor(tag.colorKey)} isStatus={tag.isStatus || tag.isType}>
                {tag.name}
              </Badge>
            </button>
          ))
        )}
      </div>
    );
  };

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
          <span className="text-sm text-slate-400">Title:</span>
          <Select
            options={titleDisplayOptions}
            value={filters.titleDisplay || 'default'}
            onValueChange={handleTitleDisplayChange}
          />
        </div>

        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear
        </Button>
      </div>

      {/* Score Filter Row */}
      <div className="flex flex-wrap items-center gap-2 py-2 border-t border-slate-800">
        <span className="text-sm text-slate-400 w-16 flex-shrink-0">Score:</span>
        {SCORE_VALUES.map((score) => (
          <button
            key={score}
            onClick={() => toggleScore(score)}
            className={`transition-all ${
              selectedScores.has(score)
                ? 'opacity-100 scale-105'
                : 'opacity-50 hover:opacity-75'
            }`}
          >
            <Badge color="#4338ca" isStatus>
              {score}
            </Badge>
          </button>
        ))}
      </div>

      {/* Tag Filter Rows - each type on its own row */}
      {renderTagRow('Status', statusTags)}
      {renderTagRow('Type', typeTags)}
      {renderTagRow('Studio', studioTags)}
      {renderTagRow('Genre', genreTags)}
      {renderTagRow('Tags', customTags)}
    </div>
  );
};
