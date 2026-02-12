import type { Tag } from '@/lib/prisma';

interface TagBadgeProps {
  tag: Tag;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ tag }) => {
  const getTextColor = (bgColor: string) => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        tag.isStatus ? 'ring-1 ring-white/20' : ''
      }`}
      style={{
        backgroundColor: tag.color,
        color: getTextColor(tag.color),
      }}
    >
      {tag.name}
    </span>
  );
};
