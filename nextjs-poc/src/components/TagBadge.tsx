import type { Tag } from '@/lib/prisma';

interface TagBadgeProps {
  tag: Tag;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ tag }) => {
  // System tags (status & type) get a ring to distinguish from custom tags
  const isSystemTag = tag.isStatus || tag.isType;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium leading-none text-white ${
        isSystemTag ? 'ring-1 ring-white/20' : ''
      }`}
      style={{ backgroundColor: tag.color }}
    >
      {tag.name}
    </span>
  );
};
