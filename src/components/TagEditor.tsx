'use client';

import { useState, useRef, useEffect } from 'react';
import type { Tag } from '@/lib/colors';
import { getColor } from '@/lib/colors';
import { Badge } from './ui/Badge';

interface TagEditorProps {
  currentTags: string[];
  allTags: Tag[];
  onAddTag: (tagName: string) => void;
  onRemoveTag: (tagName: string) => void;
}

export const TagEditor: React.FC<TagEditorProps> = ({
  currentTags,
  allTags,
  onAddTag,
  onRemoveTag,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Only show custom tags (not status, type, studio, or genre)
  const customTags = allTags.filter((t) => !t.isStatus && !t.isType && !t.isStudio && !t.isGenre);

  const suggestions = customTags.filter((tag) => {
    const matchesInput = tag.name.toLowerCase().includes(inputValue.toLowerCase());
    const notAlreadyAdded = !currentTags.includes(tag.name);
    return matchesInput && notAlreadyAdded && inputValue.length > 0;
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (tagName: string) => {
    onAddTag(tagName);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && showSuggestions) {
        handleSelect(suggestions[selectedIndex].name);
      } else if (inputValue.trim()) {
        onAddTag(inputValue.trim());
        setInputValue('');
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowSuggestions(value.length > 0);
  };

  const getTagInfo = (tagName: string): Tag | undefined => {
    return allTags.find((t) => t.name === tagName);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {currentTags.map((tagName) => {
        const tagInfo = getTagInfo(tagName);
        return (
          <Badge
            key={tagName}
            color={tagInfo ? getColor(tagInfo.colorKey) : getColor('DEFAULT')}
            onRemove={() => onRemoveTag(tagName)}
          >
            {tagName}
          </Badge>
        );
      })}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
          placeholder="Add tag..."
          className="h-7 w-28 text-xs px-2 rounded-md border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 mt-1 w-48 max-h-40 overflow-y-auto bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50"
          >
            {suggestions.map((tag, index) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelect(tag.name)}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-700 ${
                  index === selectedIndex ? 'bg-slate-700' : ''
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getColor(tag.colorKey) }}
                />
                <span className="text-white truncate">{tag.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
