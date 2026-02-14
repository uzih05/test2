/**
 * Golden Dataset Page
 *
 * Function list → click function → view executions → register as golden.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Star,
  Search,
  ChevronRight,
  ChevronLeft,
  Plus,
  Loader2,
  Activity,
  Code2,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  useGoldenList,
  useRegisterGolden,
  useDeleteGolden,
  useFunctions,
  useExecutions,
} from '@/lib/hooks/useApi';
import { useTranslation } from '@/lib/i18n';
import { formatDuration, timeAgo, cn } from '@/lib/utils';
import type { ExecutionFilters } from '@/lib/types/api';

// ============ Function List View ============
function FunctionListView({ onSelect }: { onSelect: (name: string) => void }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: goldenData, isLoading: goldenLoading } = useGoldenList(undefined, 500);
  const { data: functionsData, isLoading: functionsLoading } = useFunctions();

  // Build function → golden count map
  const goldenCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of goldenData?.items || []) {
      map.set(item.function_name, (map.get(item.function_name) || 0) + 1);
    }
    return map;
  }, [goldenData]);

  // Merge: all functions from registry + any functions with golden records
  const functionList = useMemo(() => {
    const seen = new Set<string>();
    const result: { name: string; goldenCount: number; executionCount?: number }[] = [];

    // Functions from registry
    for (const fn of functionsData?.items || []) {
      seen.add(fn.function_name);
      result.push({
        name: fn.function_name,
        goldenCount: goldenCountMap.get(fn.function_name) || 0,
        executionCount: fn.execution_count,
      });
    }

    // Functions only in golden records
    for (const [name, count] of goldenCountMap) {
      if (!seen.has(name)) {
        result.push({ name, goldenCount: count });
      }
    }

    return result
      .filter((f) => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.goldenCount - a.goldenCount || a.name.localeCompare(b.name));
  }, [functionsData, goldenCountMap, searchQuery]);

  const isLoading = goldenLoading || functionsLoading;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('cache.functionName')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Function Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_120px_120px_32px] gap-4 px-5 py-3 border-b border-border bg-muted/20 text-xs font-medium text-muted-foreground">
          <span>{t('functions.title')}</span>
          <span>{t('cache.goldenDataset')}</span>
          <span>{t('functions.executions')}</span>
          <span />
        </div>

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse border-b border-border bg-muted/20 last:border-b-0" />
          ))
        ) : functionList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Code2 className="h-12 w-12 mb-4 opacity-50" />
            <p>{t('common.noData')}</p>
          </div>
        ) : (
          functionList.map((fn) => (
            <button
              key={fn.name}
              onClick={() => onSelect(fn.name)}
              className="group w-full flex items-center md:grid md:grid-cols-[1fr_120px_120px_32px] gap-2 md:gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Code2 className="h-4 w-4 text-primary shrink-0" />
                <code className="text-sm font-medium truncate">{fn.name}</code>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className={cn('h-3.5 w-3.5', fn.goldenCount > 0 ? 'text-yellow-500' : 'text-muted-foreground/30')} />
                <span className="text-sm">{fn.goldenCount}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {fn.executionCount !== undefined ? fn.executionCount : '-'}
              </span>
              <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ============ Function Detail View (Executions + Golden) ============
function FunctionDetailView({ functionName, onBack }: { functionName: string; onBack: () => void }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const filters: ExecutionFilters = { function_name: functionName };
  const { data: execData, isLoading: execLoading } = useExecutions(PAGE_SIZE, page * PAGE_SIZE, filters);
  const { data: goldenData, isLoading: goldenLoading, refetch: refetchGolden } = useGoldenList(functionName, 200);
  const registerMutation = useRegisterGolden();
  const deleteMutation = useDeleteGolden();

  const executions = execData?.items || [];
  const total = execData?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Set of original execution UUIDs that are registered as golden
  const goldenOriginalUuids = useMemo(() => {
    const set = new Set<string>();
    for (const item of goldenData?.items || []) {
      if (item.original_uuid) set.add(item.original_uuid);
    }
    return set;
  }, [goldenData]);

  const handleRegister = async (executionUuid: string) => {
    try {
      await registerMutation.mutateAsync({
        execution_uuid: executionUuid,
        note: '',
        tags: [],
      });
      refetchGolden();
    } catch (e) {
      console.error('Register failed:', e);
    }
  };

  const handleUnregister = async (goldenUuid: string) => {
    try {
      await deleteMutation.mutateAsync(goldenUuid);
      refetchGolden();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  // Find golden record's own UUID by the original execution UUID
  const findGoldenUuid = (executionUuid: string): string | undefined => {
    return goldenData?.items?.find((g) => g.original_uuid === executionUuid)?.uuid;
  };

  return (
    <div className="space-y-4">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <code className="text-lg font-semibold truncate block">{functionName}</code>
          <p className="text-sm text-muted-foreground">
            {total} {t('functions.executions').toLowerCase()} · {goldenData?.items?.length || 0} golden
          </p>
        </div>
      </div>

      {/* Execution Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/20">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t('executions.duration')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t('common.time')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Span ID</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Golden</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {execLoading || goldenLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td>
              </tr>
            ) : executions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              executions.map((exec) => {
                const isGolden = goldenOriginalUuids.has(exec.uuid);
                return (
                  <tr key={exec.uuid} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <StatusBadge status={exec.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDuration(exec.duration_ms)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {timeAgo(exec.timestamp_utc)}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-muted-foreground">{exec.span_id.slice(0, 16)}...</code>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isGolden ? (
                        <button
                          onClick={() => {
                            const gUuid = findGoldenUuid(exec.uuid);
                            if (gUuid) handleUnregister(gUuid);
                          }}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs font-medium text-yellow-500 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                        >
                          <Star className="h-3 w-3" />
                          Golden
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(exec.uuid)}
                          disabled={registerMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-yellow-500/50 hover:text-yellow-500 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          {t('cache.register')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {t('common.page')} {page + 1} {t('common.of')} {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Main Page ============
export default function GoldenDatasetPage() {
  const { t } = useTranslation();
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-500" />
          {t('cache.goldenDataset')}
        </h1>
        <p className="text-muted-foreground">
          {t('cache.goldenSubtitle') || 'Manage golden dataset records per function'}
        </p>
      </div>

      {/* Content */}
      {selectedFunction ? (
        <FunctionDetailView
          functionName={selectedFunction}
          onBack={() => setSelectedFunction(null)}
        />
      ) : (
        <FunctionListView onSelect={setSelectedFunction} />
      )}
    </div>
  );
}
