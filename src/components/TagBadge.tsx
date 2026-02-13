import type { Tag } from '@/lib/prisma';
import { getColor } from '@/lib/prisma';
import { Badge } from './ui/Badge';

interface TagBadgeProps {
  tag: Tag;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ tag }) => {
  // System tags (status & type) get a ring to distinguish from custom tags
  const isSystemTag = tag.isStatus || tag.isType;

  return (
    <Badge color={getColor(tag.colorKey)} isStatus={isSystemTag}>
      {tag.name}
    </Badge>
  );
};
