import { useState, useCallback } from 'react';
import type { Anime, Tag } from '../types';
import { animeApi } from '../api/client';

interface UseAnimeResult {
  anime: Anime[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
  fetchAnime: (filters?: Record<string, string | number | undefined>) => Promise<void>;
  setTags: (id: number, tagNames: string[]) => Promise<Anime | null>;
  deleteAnime: (id: number) => Promise<void>;
  setAnime: React.Dispatch<React.SetStateAction<Anime[]>>;
  setAllTags: React.Dispatch<React.SetStateAction<Tag[]>>;
}

export const useAnime = (): UseAnimeResult => {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [tags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnime = useCallback(async (filters?: Record<string, string | number | undefined>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await animeApi.getAnimeList(
        filters?.tags as string | undefined,
        filters?.minScore as number | undefined,
        filters?.maxScore as number | undefined,
        filters?.search as string | undefined,
        filters?.sortBy as 'title' | 'myScore' | 'type' | 'updatedAt' | undefined,
        filters?.sortOrder as 'asc' | 'desc' | undefined
      );
      setAnime(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch anime');
    } finally {
      setLoading(false);
    }
  }, []);

  const setAnimeTags = useCallback(async (id: number, tagNames: string[]): Promise<Anime | null> => {
    try {
      const response = await animeApi.setAnimeTags(id, { tags: tagNames });
      // Update the anime in state
      setAnime((prev) =>
        prev.map((a) => (a.id === id ? response.data : a))
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tags');
      return null;
    }
  }, []);

  const deleteAnimeEntry = useCallback(async (id: number) => {
    try {
      await animeApi.deleteAnime(id);
      setAnime((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete anime');
    }
  }, []);

  return {
    anime,
    tags,
    loading,
    error,
    fetchAnime,
    setTags: setAnimeTags,
    deleteAnime: deleteAnimeEntry,
    setAnime,
    setAllTags,
  };
};
