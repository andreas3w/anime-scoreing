// Shared types
export interface Tag {
  id: number;
  name: string;
  color: string;
  isStatus: boolean;
}

export interface Anime {
  id: number;
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
  tags: Tag[];
}

export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minScore?: number;
  maxScore?: number;
  tags?: string; // comma-separated tag IDs
}

export interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  total: number;
}
