'use client';

import type { AnimeTag, Tag } from '@/lib/colors';
import { TagBadge } from './TagBadge';
import { TagEditor } from './TagEditor';

interface TagsCellProps {
  tags: AnimeTag[];
  allTags: Tag[];
  isEditing: boolean;
  currentTags: string[];
  onAddTag: (tagName: string) => void;
  onRemoveTag: (tagName: string) => void;
}

export const TagsCell: React.FC<TagsCellProps> = ({
  tags,
  allTags,
  isEditing,
  currentTags,
  onAddTag,
  onRemoveTag,
}) => {
  // Extract tag objects from junction table
  const tagObjects = tags.map((at) => at.tag);

  if (isEditing) {
    return (
      <TagEditor
        currentTags={currentTags}
        allTags={allTags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />
    );
  }

  if (tagObjects.length === 0) {
    return <span className="text-slate-600 text-sm">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tagObjects.map((tag) => (
        <TagBadge key={tag.id} tag={tag} />
      ))}
    </div>
  );
};
