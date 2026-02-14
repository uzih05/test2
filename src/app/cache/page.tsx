'use client';

import { useState } from 'react';
import {
  Database,
  Zap,
  Clock,
  Star,
  Trash2,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  Activity,
  X,
} from 'lucide-react';
import {
  useCacheAnalytics,
  useGoldenList,
  useDriftSummary,
  useRegisterGolden,
  useDeleteGolden,
  useSimulateDrift,
} from '@/lib/hooks/useApi';
import { cacheService } from '@/lib/services/cache';
import { useTranslation } from '@/lib/i18n';
import { formatDuration, formatNumber, cn } from '@/lib/utils';
import type { DriftResult, GoldenCandidate } from '@/lib/types/api';

// ============ KPI Card ============
interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

function KPICard({ label, value, icon, color = 'text-primary' }: KPICardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// ============ Cache Analytics Section ============
function CacheAnalyticsSection() {
  const { t } = useTranslation();
  const { data, isLoading } = useCacheAnalytics(60);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{t('cache.analytics')}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={t('cache.hitRate')}
          value={`${data?.cache_hit_rate ?? 0}%`}
          icon={<Zap className="h-4 w-4" />}
          color="text-green-500"
        />
        <KPICard
          label={t('cache.totalHits')}
          value={formatNumber(data?.cache_hit_count ?? 0)}
          icon={<Activity className="h-4 w-4" />}
          color="text-blue-500"
        />
        <KPICard
          label={t('cache.timeSaved')}
          value={formatDuration(data?.time_saved_ms ?? 0)}
          icon={<Clock className="h-4 w-4" />}
          color="text-purple-500"
        />
        <KPICard
          label={t('cache.goldenRatio')}
          value={`${data?.golden_ratio ?? 0}%`}
          icon={<Star className="h-4 w-4" />}
          color="text-yellow-500"
        />
      </div>
    </div>
  );
}

// ============ Register Modal ============
interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function RegisterModal({ isOpen, onClose, onSuccess }: RegisterModalProps) {
  const { t } = useTranslation();
  const [uuid, setUuid] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const registerMutation = useRegisterGolden();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!uuid.trim()) return;
    try {
      await registerMutation.mutateAsync({
        execution_uuid: uuid.trim(),
        note: note.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setUuid('');
      setNote('');
      setTags('');
      onSuccess();
      onClose();
    } catch (e) {
      console.error('Register failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t('cache.registerGolden')}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t('cache.executionUuid')}</label>
            <input
              type="text"
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              placeholder="execution-uuid-here"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('cache.note')}</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('cache.tags')}</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!uuid.trim() || registerMutation.isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {registerMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              t('cache.register')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Golden Dataset Section (Function-based) ============
function GoldenDatasetSection() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [expandedFn, setExpandedFn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch } = useGoldenList(undefined, 200);
  const deleteMutation = useDeleteGolden();

  // Group golden records by function_name
  const functionGroups = (() => {
    const items = data?.items || [];
    const groups = new Map<string, typeof items>();
    for (const item of items) {
      const list = groups.get(item.function_name) || [];
      list.push(item);
      groups.set(item.function_name, list);
    }
    return Array.from(groups.entries())
      .map(([name, records]) => ({ name, records, count: records.length }))
      .filter(g => !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.count - a.count);
  })();

  const handleDelete = async (uuid: string) => {
    try {
      await deleteMutation.mutateAsync(uuid);
      refetch();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {t('cache.goldenDataset')}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3 w-3" />
          {t('cache.register')}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('cache.functionName')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {/* Function List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : functionGroups.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t('cache.noGoldenData')}
        </div>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-auto">
          {functionGroups.map((group) => (
            <div key={group.name}>
              {/* Function Row */}
              <button
                onClick={() => setExpandedFn(expandedFn === group.name ? null : group.name)}
                className={cn(
                  'w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors',
                  expandedFn === group.name ? 'bg-primary/10' : 'hover:bg-muted/50'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ChevronDown className={cn(
                    'h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0',
                    expandedFn === group.name && 'rotate-180'
                  )} />
                  <code className="text-sm font-medium truncate">{group.name}</code>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground shrink-0">
                  {group.count}
                </span>
              </button>

              {/* Expanded: Golden Records for this function */}
              {expandedFn === group.name && (
                <div className="ml-6 mr-2 mb-2 space-y-1.5 mt-1">
                  {group.records.map((item) => (
                    <div key={item.uuid} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Star className="h-3 w-3 text-yellow-500 shrink-0" />
                        <code className="text-xs text-muted-foreground">{item.uuid.slice(0, 12)}...</code>
                        {item.note && <span className="text-xs text-muted-foreground truncate">{item.note}</span>}
                        {item.tags?.map((tag) => (
                          <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs">{tag}</span>
                        ))}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.uuid); }}
                        disabled={deleteMutation.isPending}
                        className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Link to executions for this function */}
                  <a
                    href={`/executions?function_name=${encodeURIComponent(group.name)}`}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {t('cache.viewExecutions')}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <RegisterModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => refetch()} />
    </div>
  );
}

// ============ Drift Detection Section ============
function DriftDetectionSection() {
  const { t } = useTranslation();
  const { data, isLoading } = useDriftSummary();
  const simulateMutation = useSimulateDrift();

  const [simFn, setSimFn] = useState('');
  const [simText, setSimText] = useState('');
  const [simResult, setSimResult] = useState<DriftResult | null>(null);

  const handleSimulate = async () => {
    if (!simFn.trim() || !simText.trim()) return;
    try {
      const result = await simulateMutation.mutateAsync({
        text: simText.trim(),
        function_name: simFn.trim(),
      });
      setSimResult(result);
    } catch (e) {
      console.error('Simulate failed:', e);
    }
  };

  const statusColors: Record<string, string> = {
    NORMAL: 'bg-green-500/20 text-green-500',
    ANOMALY: 'bg-red-500/20 text-red-500',
    INSUFFICIENT_DATA: 'bg-yellow-500/20 text-yellow-500',
    NO_VECTOR: 'bg-gray-500/20 text-gray-500',
  };

  const statusLabels: Record<string, string> = {
    NORMAL: t('cache.normal'),
    ANOMALY: t('cache.anomaly'),
    INSUFFICIENT_DATA: t('cache.insufficientData'),
    NO_VECTOR: t('cache.noVector'),
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        {t('cache.drift')}
      </h2>

      {/* Summary Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (data?.items?.length ?? 0) === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {t('common.noData')}
        </div>
      ) : (
        <div className="overflow-auto max-h-64 mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4">Function</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">{t('cache.avgDistance')}</th>
                <th className="pb-2 pr-4">{t('cache.threshold')}</th>
                <th className="pb-2">{t('cache.samples')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => (
                <tr key={item.function_name} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-2 pr-4">
                    <code className="text-xs">{item.function_name}</code>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColors[item.status])}>
                      {statusLabels[item.status] || item.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-xs">{item.avg_distance}</td>
                  <td className="py-2 pr-4 text-xs">{item.threshold}</td>
                  <td className="py-2 text-xs">{item.sample_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drift Simulator */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-sm font-medium mb-3">{t('cache.driftSimulator')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder={t('cache.functionName')}
            value={simFn}
            onChange={(e) => setSimFn(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <input
            type="text"
            placeholder={t('cache.inputText')}
            value={simText}
            onChange={(e) => setSimText(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <button
          onClick={handleSimulate}
          disabled={!simFn.trim() || !simText.trim() || simulateMutation.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {simulateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t('cache.simulate')
          )}
        </button>

        {simResult && (
          <div className={cn(
            'mt-3 rounded-xl border p-4',
            simResult.is_drift ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'
          )}>
            <div className="flex items-center gap-2 mb-2">
              {simResult.is_drift ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <span className="font-medium text-sm">
                {simResult.is_drift ? t('cache.isDrift') : t('cache.noDrift')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>{t('cache.avgDistance')}: <span className="font-medium text-foreground">{simResult.avg_distance}</span></div>
              <div>{t('cache.threshold')}: <span className="font-medium text-foreground">{simResult.threshold}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Main Page ============
export default function CachePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          {t('cache.title')}
        </h1>
        <p className="text-muted-foreground">{t('cache.subtitle')}</p>
      </div>

      {/* Cache Analytics KPI */}
      <CacheAnalyticsSection />

      {/* Golden Dataset + Drift Detection */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GoldenDatasetSection />
        <DriftDetectionSection />
      </div>
    </div>
  );
}
