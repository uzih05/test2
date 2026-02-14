/**
 * Recent Errors List
 */

'use client';

import { AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { timeAgo } from '@/lib/utils';
import type { Execution } from '@/lib/types/api';

interface RecentErrorsProps {
  errors: Execution[];
}

export function RecentErrors({ errors }: RecentErrorsProps) {
  if (errors.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No recent errors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errors.map((error) => (
        <div
          key={error.span_id}
          className="flex items-start justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3 transition-colors hover:bg-red-500/10"
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <code className="text-sm font-medium text-foreground">
                {error.function_name}
              </code>
              {error.error_code && (
                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-400">
                  {error.error_code}
                </span>
              )}
            </div>
            {error.error_message && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {error.error_message}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {error.team && <span>Team: {error.team}</span>}
              <span>{timeAgo(error.timestamp_utc)}</span>
            </div>
          </div>
          <StatusBadge status="ERROR" size="sm" />
        </div>
      ))}
    </div>
  );
}
