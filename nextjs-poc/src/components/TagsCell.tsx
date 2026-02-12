'use client';

import type { AnimeTag, Tag } from '@/lib/prisma';
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
  // Extract tags from junction table by category
  const typeTags = tags.filter((at) => at.tag.isType).map((at) => at.tag);
  const statusTags = tags.filter((at) => at.tag.isStatus).map((at) => at.tag);
  const customTags = tags.filter((at) => !at.tag.isStatus && !at.tag.isType).map((at) => at.tag);

  if (isEditing) {
    return (
      <TagEditor
        currentTags={currentTags}
        allTags={allTags}
        statusTags={statusTags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {typeTags.map((tag) => (
        <TagBadge key={tag.id} tag={tag} />
      ))}
      {statusTags.map((tag) => (
        <TagBadge key={tag.id} tag={tag} />
      ))}
      {customTags.map((tag) => (
        <TagBadge key={tag.id} tag={tag} />
      ))}
    </div>
  );
};
