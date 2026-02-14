/**
 * Status Badge Component
 */

import { cn } from '@/lib/utils';

type StatusType = 'SUCCESS' | 'ERROR' | 'CACHE_HIT' | 'PARTIAL' | 'PENDING' | 'default';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  SUCCESS: {
    label: 'Success',
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
  ERROR: {
    label: 'Error',
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
  CACHE_HIT: {
    label: 'Cached',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  PARTIAL: {
    label: 'Partial',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  },
  default: {
    label: 'Unknown',
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  },
};

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || statusConfig.default;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.className,
        className
      )}
    >
      <span
        className={cn(
          'mr-1.5 h-1.5 w-1.5 rounded-full',
          status === 'SUCCESS' && 'bg-green-500',
          status === 'ERROR' && 'bg-red-500',
          status === 'CACHE_HIT' && 'bg-blue-500',
          status === 'PARTIAL' && 'bg-yellow-500',
          status === 'PENDING' && 'bg-gray-500'
        )}
      />
      {config.label}
    </span>
  );
}
