import type { Tag } from '../types';
import { Badge } from './ui/Badge';

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  showRemove?: boolean;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ tag, onRemove, showRemove = false }) => {
  return (
    <Badge
      color={tag.color}
      isStatus={tag.isStatus}
      onRemove={showRemove && !tag.isStatus ? onRemove : undefined}
    >
      {tag.name}
    </Badge>
  );
};
