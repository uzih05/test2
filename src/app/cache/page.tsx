'use client';

import { useState } from 'react';
import {
  Database,
  Zap,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
} from 'lucide-react';
import {
  useCacheAnalytics,
  useDriftSummary,
  useSimulateDrift,
} from '@/lib/hooks/useApi';
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

  if (data?.total_executions === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('cache.analytics')}</h2>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
          {t('cache.noExecutionData')}
        </div>
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

// ============ Tab Navigation ============
type CacheTab = 'analytics' | 'drift';

function CacheTabSelector({ value, onChange }: { value: CacheTab; onChange: (tab: CacheTab) => void }) {
  const { t } = useTranslation();

  const tabs: { key: CacheTab; label: string }[] = [
    { key: 'analytics', label: t('cache.analyticsTab') },
    { key: 'drift', label: t('cache.driftTab') },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
            value === tab.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ============ Main Page ============
export default function CachePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CacheTab>('analytics');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            {t('cache.title')}
          </h1>
          <p className="text-muted-foreground">{t('cache.subtitle')}</p>
        </div>
        <CacheTabSelector value={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      {activeTab === 'analytics' && <CacheAnalyticsSection />}
      {activeTab === 'drift' && <DriftDetectionSection />}
    </div>
  );
}
