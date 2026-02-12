'use client';

import { useState, useCallback } from 'react';
import type { Tag } from '@/types';

interface RowEditState {
  isEditing: boolean;
  currentTags: string[];
}

interface UseRowEditStateResult {
  editState: RowEditState;
  startEdit: (existingTags: Tag[]) => void;
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

  const startEdit = useCallback((existingTags: Tag[]) => {
    const customTagNames = existingTags
      .filter((tag) => !tag.isStatus)
      .map((tag) => tag.name);
    
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
