// Re-export types from generated API
export type { Anime, Tag, ImportResult, SetTagsRequest, UpdateTag } from '../generated/api';
export { AnimeTypeEnum, SortBy, SortOrder } from '../generated/api';

// UI-specific types
export interface RowEditState {
  isEditing: boolean;
  currentTags: string[];
}

export interface FilterOptions {
  search?: string;
  tags?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | undefined;
}
