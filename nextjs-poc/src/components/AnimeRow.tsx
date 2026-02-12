'use client';

import { useTransition } from 'react';
import type { AnimeWithTags, Tag } from '@/lib/prisma';
import { Button } from './ui/Button';
import { TagsCell } from './TagsCell';
import { useRowEditState } from '@/hooks/useRowEditState';
import { saveTags } from '@/app/actions';

interface AnimeRowProps {
  anime: AnimeWithTags;
  allTags: Tag[];
}

export const AnimeRow: React.FC<AnimeRowProps> = ({ anime, allTags }) => {
  const { editState, startEdit, cancelEdit, addTag, removeTag, getCurrentTags } = useRowEditState();
  const [isPending, startTransition] = useTransition();

  const handleSave = async () => {
    startTransition(async () => {
      await saveTags(anime.id, getCurrentTags());
      cancelEdit();
    });
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr || dateStr === '0000-00-00') return '—';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return '—';
    }
  };

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
      <td className="px-4 py-3 font-medium text-white max-w-xs truncate" title={anime.title}>
        {anime.title}
      </td>
      <td className="px-4 py-3 text-slate-400 text-center">{anime.type || '—'}</td>
      <td className="px-4 py-3 text-center">
        <span className={anime.myScore > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
          {anime.myScore > 0 ? anime.myScore : '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-300 text-center">
        {anime.myWatchedEpisodes}/{anime.episodes || '?'}
      </td>
      <td className="px-4 py-3 min-w-[200px]">
        <TagsCell
          tags={anime.tags}
          allTags={allTags}
          isEditing={editState.isEditing}
          currentTags={editState.currentTags}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />
      </td>
      <td className="px-4 py-3 text-slate-500 text-sm">{formatDate(anime.myLastUpdated)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 justify-end">
          {editState.isEditing ? (
            <>
              <Button variant="success" size="sm" onClick={handleSave} disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => startEdit(anime.tags)}>
              Edit
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};
