import { useState } from 'react';
import type { Tag } from '../types';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';

interface TagEditorProps {
  currentTags: string[];
  allTags: Tag[];
  statusTags: Tag[];
  onAddTag: (tagName: string) => void;
  onRemoveTag: (tagName: string) => void;
}

export const TagEditor: React.FC<TagEditorProps> = ({
  currentTags,
  allTags,
  statusTags,
  onAddTag,
  onRemoveTag,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        onAddTag(inputValue.trim());
        setInputValue('');
      }
    }
  };

  // Find tag info for current tags (for colors)
  const getTagInfo = (tagName: string): Tag | undefined => {
    return allTags.find((t) => t.name === tagName);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Status tags (read-only, grayed out appearance) */}
      {statusTags.map((tag) => (
        <Badge key={tag.id} color={tag.color} isStatus className="opacity-70">
          {tag.name}
        </Badge>
      ))}

      {/* Custom tags (editable) */}
      {currentTags.map((tagName) => {
        const tagInfo = getTagInfo(tagName);
        return (
          <Badge
            key={tagName}
            color={tagInfo?.color || '#6366f1'}
            onRemove={() => onRemoveTag(tagName)}
          >
            {tagName}
          </Badge>
        );
      })}

      {/* Input for adding new tags */}
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add tag..."
        className="h-7 w-24 text-xs px-2"
      />
    </div>
  );
};
