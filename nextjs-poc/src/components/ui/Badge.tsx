import { clsx } from 'clsx';
import { getColor } from '@/lib/prisma';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  isStatus?: boolean;
  onRemove?: () => void;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color,
  isStatus = false,
  onRemove,
  className,
}) => {
  const backgroundColor = color || getColor('DEFAULT');
  
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-none text-white',
        isStatus && 'ring-1 ring-white/20',
        className
      )}
      style={{ backgroundColor }}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:bg-black/20 rounded-full p-0.5 transition-colors"
          aria-label="Remove tag"
        >
          <XIcon />
        </button>
      )}
    </span>
  );
};

const XIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
