'use client';

import { useTransition } from 'react';
import type { AnimeWithTags, Tag } from '@/lib/prisma';
import { getColor } from '@/lib/prisma';
import { Button } from './ui/Button';
import { TagsCell } from './TagsCell';
import { useRowEditState } from '@/hooks/useRowEditState';
import { saveTags } from '@/app/actions';

interface AnimeRowProps {
  anime: AnimeWithTags;
  allTags: Tag[];
  titleDisplay: 'default' | 'english';
  onTagClick: (tagId: number) => void;
}

export const AnimeRow: React.FC<AnimeRowProps> = ({ anime, allTags, titleDisplay, onTagClick }) => {
  const { editState, startEdit, cancelEdit, addTag, removeTag, getCurrentTags } = useRowEditState();
  const [isPending, startTransition] = useTransition();

  const handleSave = async () => {
    startTransition(async () => {
      await saveTags(anime.id, getCurrentTags());
      cancelEdit();
    });
  };

  // Determine main and subtitle based on title display setting
  const getMainTitle = (): string => {
    if (titleDisplay === 'english' && anime.titleEnglish) {
      return anime.titleEnglish;
    }
    return anime.title; // Romaji/Original
  };

  const getSubtitle = (): string | null => {
    if (titleDisplay === 'english' && anime.titleEnglish && anime.titleEnglish !== anime.title) {
      // English is main, show Romaji as subtitle
      return anime.title;
    }
    if (titleDisplay === 'default' && anime.titleEnglish && anime.titleEnglish !== anime.title) {
      // Romaji is main, show English as subtitle
      return anime.titleEnglish;
    }
    return null;
  };

  const mainTitle = getMainTitle();
  const subtitleTitle = getSubtitle();

  // Categorize tags
  const statusTags = anime.tags.filter((at) => at.tag.isStatus);
  const typeTags = anime.tags.filter((at) => at.tag.isType);
  const studioTags = anime.tags.filter((at) => at.tag.isStudio);
  const genreTags = anime.tags.filter((at) => at.tag.isGenre);
  const customTags = anime.tags.filter((at) => !at.tag.isStatus && !at.tag.isType && !at.tag.isStudio && !at.tag.isGenre);

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
      {/* Title Cell */}
      <td className="px-4 py-3 font-medium text-white max-w-[250px]">
        <a
          href={`https://myanimelist.net/anime/${anime.malId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 hover:text-blue-400 transition-colors"
        >
          {/* Cover Image */}
          <div className="flex-shrink-0 w-10 h-14 bg-slate-800 rounded overflow-hidden">
            {anime.imageUrl ? (
              <img
                src={anime.imageUrl}
                alt={anime.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600">
                <ImagePlaceholderIcon />
              </div>
            )}
          </div>
          {/* Title */}
          <div className="min-w-0 flex-1">
            <div className="truncate max-w-[180px]" title={mainTitle}>{mainTitle}</div>
            {subtitleTitle && (
              <div className="text-xs text-slate-500 truncate max-w-[180px]" title={subtitleTitle}>{subtitleTitle}</div>
            )}
          </div>
        </a>
      </td>

      {/* Score Cell */}
      <td className="px-4 py-3 text-center">
        <span className={anime.myScore > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
          {anime.myScore > 0 ? anime.myScore : '—'}
        </span>
      </td>

      {/* Progress Cell */}
      <td className="px-4 py-3 text-slate-300 text-center whitespace-nowrap">
        {anime.myWatchedEpisodes}/{anime.episodes || '?'}
      </td>

      {/* Status Cell */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {statusTags.map((at) => (
            <button
              key={at.tag.id}
              onClick={() => onTagClick(at.tag.id)}
              className="inline-flex items-center justify-center px-2 py-1 text-xs rounded-full text-white cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: getColor(at.tag.colorKey) }}
            >
              {at.tag.name}
            </button>
          ))}
        </div>
      </td>

      {/* Type Cell */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {typeTags.map((at) => (
            <button
              key={at.tag.id}
              onClick={() => onTagClick(at.tag.id)}
              className="inline-flex items-center justify-center px-2 py-1 text-xs rounded-full text-white cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: getColor(at.tag.colorKey) }}
            >
              {at.tag.name}
            </button>
          ))}
        </div>
      </td>

      {/* Studio Cell */}
      <td className="px-4 py-3 max-w-[150px]">
        <div className="flex flex-wrap gap-1">
          {studioTags.map((at) => (
            <button
              key={at.tag.id}
              onClick={() => onTagClick(at.tag.id)}
              className="inline-flex items-center justify-center px-2 py-1 text-xs rounded-full text-white max-w-[120px] cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: getColor(at.tag.colorKey) }}
              title={at.tag.name}
            >
              <span className="truncate">{at.tag.name}</span>
            </button>
          ))}
        </div>
      </td>

      {/* Genre Cell */}
      <td className="px-4 py-3 max-w-[200px]">
        <div className="flex flex-wrap gap-1">
          {genreTags.map((at) => (
            <button
              key={at.tag.id}
              onClick={() => onTagClick(at.tag.id)}
              className="inline-flex items-center justify-center px-2 py-1 text-xs rounded-full text-white cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: getColor(at.tag.colorKey) }}
            >
              {at.tag.name}
            </button>
          ))}
        </div>
      </td>

      {/* Custom Tags Cell */}
      <td className="px-4 py-3 min-w-[150px]">
        <TagsCell
          tags={customTags}
          allTags={allTags.filter((t) => !t.isStatus && !t.isType && !t.isStudio && !t.isGenre)}
          isEditing={editState.isEditing}
          currentTags={editState.currentTags}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />
      </td>

      {/* Actions Cell */}
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

const ImagePlaceholderIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
