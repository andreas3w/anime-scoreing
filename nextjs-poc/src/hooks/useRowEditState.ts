'use client';

import { useState, useCallback } from 'react';
import type { AnimeTag } from '@/lib/prisma';

interface RowEditState {
  isEditing: boolean;
  currentTags: string[];
}

interface UseRowEditStateResult {
  editState: RowEditState;
  startEdit: (existingTags: AnimeTag[]) => void;
  cancelEdit: () => void;
  addTag: (tagName: string) => void;
  removeTag: (tagName: string) => void;
  getCurrentTags: () => string[];
}

export const useRowEditState = (): UseRowEditStateResult => {
  const [editState, setEditState] = useState<RowEditState>({
    isEditing: false,
    currentTags: [],
  });

  const startEdit = useCallback((existingTags: AnimeTag[]) => {
    // Extract custom tag names from junction table (exclude status and type tags)
    const customTagNames = existingTags
      .filter((at) => !at.tag.isStatus && !at.tag.isType)
      .map((at) => at.tag.name);
    
    setEditState({
      isEditing: true,
      currentTags: customTagNames,
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditState({
      isEditing: false,
      currentTags: [],
    });
  }, []);

  const addTag = useCallback((tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    
    setEditState((prev) => {
      if (prev.currentTags.includes(trimmed)) return prev;
      return {
        ...prev,
        currentTags: [...prev.currentTags, trimmed],
      };
    });
  }, []);

  const removeTag = useCallback((tagName: string) => {
    setEditState((prev) => ({
      ...prev,
      currentTags: prev.currentTags.filter((t) => t !== tagName),
    }));
  }, []);

  const getCurrentTags = useCallback(() => {
    return editState.currentTags;
  }, [editState.currentTags]);

  return {
    editState,
    startEdit,
    cancelEdit,
    addTag,
    removeTag,
    getCurrentTags,
  };
};
