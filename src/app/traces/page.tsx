/**
 * Traces Page - Distributed tracing list view
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  GitBranch,
  Search,
  ChevronRight,
  Clock,
  Layers,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTraces } from '@/lib/hooks/useApi';
import { useTranslation } from '@/lib/i18n';
import { formatDuration, timeAgo, cn } from '@/lib/utils';

export default function TracesPage() {
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const { data, isLoading } = useTraces(limit);

  // Filter traces
  const traces = (data || []).filter(trace => {
    if (statusFilter && trace.status !== statusFilter) return false;
    if (searchQuery && !trace.root_function.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('traces.title')}</h1>
          <p className="text-muted-foreground">
            {t('traces.subtitle')}
          </p>
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value={20}>{t('traces.last20')}</option>
          <option value={50}>{t('traces.last50')}</option>
          <option value={100}>{t('traces.last100')}</option>
        </select>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('traces.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t('status.allStatus')}</option>
          <option value="SUCCESS">{t('status.success')}</option>
          <option value="ERROR">{t('common.error')}</option>
          <option value="PARTIAL">{t('status.partial')}</option>
        </select>

        <span className="text-sm text-muted-foreground ml-auto">
          {traces.length} {t('traces.title').toLowerCase()}
        </span>
      </div>

      {/* Traces List */}
      <div className="rounded-3xl border border-white/[0.06] bg-card overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[1fr_100px_100px_80px_120px_32px] gap-4 px-5 py-3 border-b border-border bg-white/[0.02] text-xs font-medium text-muted-foreground">
          <span>{t('traces.rootFunction')}</span>
          <span>{t('common.status')}</span>
          <span>{t('traces.duration')}</span>
          <span>{t('traces.spans')}</span>
          <span>{t('common.time')}</span>
          <span />
        </div>

        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse border-b border-border bg-muted/20 last:border-b-0" />
          ))
        ) : traces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <GitBranch className="h-12 w-12 mb-4 opacity-50" />
            <p>{t('traces.noTraces')}</p>
            {(searchQuery || statusFilter) && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter(''); }}
                className="mt-2 text-sm text-primary hover:underline"
              >
                {t('common.clearFilters')}
              </button>
            )}
          </div>
        ) : (
          traces.map((trace) => (
            <Link
              key={trace.trace_id}
              href={`/traces/${trace.trace_id}`}
              className="group flex flex-col md:grid md:grid-cols-[1fr_100px_100px_80px_120px_32px] gap-2 md:gap-4 md:items-center px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              {/* Function name */}
              <div className="flex items-center gap-2 min-w-0">
                <GitBranch className="h-4 w-4 text-primary shrink-0" />
                <code className="text-sm font-medium truncate">{trace.root_function}</code>
              </div>

              {/* Mobile: inline stats */}
              <div className="flex items-center gap-4 md:contents">
                <StatusBadge status={trace.status} size="sm" />

                <span className="flex items-center gap-1.5 text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground md:hidden" />
                  {formatDuration(trace.total_duration_ms)}
                </span>

                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Layers className="h-3 w-3 md:hidden" />
                  {trace.span_count}
                </span>

                <span className="text-xs text-muted-foreground ml-auto md:ml-0">
                  {timeAgo(trace.start_time)}
                </span>
              </div>

              <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
