import type { Tag } from '../types';
import { TagBadge } from './TagBadge';
import { TagEditor } from './TagEditor';

interface TagsCellProps {
  tags: Tag[];
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
  const statusTags = tags.filter((tag) => tag.isStatus);
  const customTags = tags.filter((tag) => !tag.isStatus);

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
      {statusTags.map((tag) => (
        <TagBadge key={tag.id} tag={tag} />
      ))}
      {customTags.map((tag) => (
        <TagBadge key={tag.id} tag={tag} />
      ))}
    </div>
  );
};
