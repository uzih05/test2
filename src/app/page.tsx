/**
 * Dashboard Overview Page
 *
 * API-driven customizable dashboard.
 * Users pin/unpin widgets, choose S/M/L sizes, drag to reorder.
 * Empty state on first visit with onboarding guide.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import {
    Activity,
    Zap,
    AlertTriangle,
    Clock,
    PieChart,
    Coins,
    TrendingUp,
    RefreshCw,
    Waves,
    Plus,
    X,
    BarChart3,
    Shield,
    LayoutGrid,
} from 'lucide-react';
import { Layout } from 'react-grid-layout';
import { BentoDashboard, EditModeToggle, WidgetConfig } from '@/components/dashboard/BentoDashboard';
import { SurferChart } from '@/components/dashboard/SurferChart';
import { RecentErrors } from '@/components/dashboard/RecentErrors';
import { SystemStatusCard } from '@/components/dashboard/SystemStatusCard';
import { TimeRangeSelector, FillModeSelector } from '@/components/ui/TimeRangeSelector';
import { useDashboardStore } from '@/lib/stores/useDashboardStore';
import { useTranslation } from '@/lib/i18n';
import {
    useKPIMetrics,
    useSystemStatus,
    useTimeline,
    useRecentErrors,
    useTokenUsage,
    useErrorDistribution,
    useFunctionDistribution,
} from '@/lib/hooks/useApi';
import { formatNumber, formatDuration, formatPercentage, cn } from '@/lib/utils';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { Widget, WidgetCatalogItem } from '@/lib/services/widgets';
import { widgetsService } from '@/lib/services/widgets';

// ============ Grid Size Mapping ============
const WIDGET_GRID: Record<string, Record<string, { w: number; h: number }>> = {
    token_usage:           { S: { w: 3, h: 2 }, M: { w: 6, h: 4 }, L: { w: 6, h: 6 } },
    cache_hit:             { S: { w: 3, h: 2 }, M: { w: 6, h: 4 }, L: { w: 6, h: 6 } },
    error_rate:            { S: { w: 3, h: 2 }, M: { w: 6, h: 4 }, L: { w: 6, h: 6 } },
    execution_timeline:    { M: { w: 6, h: 4 }, L: { w: 12, h: 4 } },
    function_distribution: { M: { w: 6, h: 4 }, L: { w: 12, h: 4 } },
    recent_errors:         { M: { w: 6, h: 4 }, L: { w: 12, h: 4 } },
    system_status:         { S: { w: 3, h: 2 }, M: { w: 6, h: 3 } },
    kpi_overview:          { M: { w: 6, h: 4 }, L: { w: 12, h: 2 } },
};

const WIDGET_ICONS: Record<string, React.ReactNode> = {
    token_usage: <Coins className="h-4 w-4" />,
    cache_hit: <Zap className="h-4 w-4" />,
    error_rate: <PieChart className="h-4 w-4" />,
    execution_timeline: <TrendingUp className="h-4 w-4" />,
    function_distribution: <BarChart3 className="h-4 w-4" />,
    recent_errors: <AlertTriangle className="h-4 w-4" />,
    system_status: <Shield className="h-4 w-4" />,
    kpi_overview: <Activity className="h-4 w-4" />,
};

const WIDGET_TITLE_KEYS: Record<string, string> = {
    token_usage: 'dashboard.tokenUsage',
    cache_hit: 'dashboard.cacheHit',
    error_rate: 'dashboard.errorDistribution',
    execution_timeline: 'dashboard.executionTimeline',
    function_distribution: 'dashboard.functionDistribution',
    recent_errors: 'dashboard.recentErrors',
    system_status: 'dashboard.systemStatus',
    kpi_overview: 'dashboard.kpiOverview',
};

// ============ Compute Layout from Widget Order + Sizes ============
function computeLayout(widgets: Widget[]): Layout[] {
    const result: Layout[] = [];
    let x = 0;
    let y = 0;
    let rowMaxH = 0;

    for (const w of widgets) {
        const gridSize = WIDGET_GRID[w.widget_type]?.[w.size] || { w: 6, h: 4 };

        if (x + gridSize.w > 12) {
            x = 0;
            y += rowMaxH;
            rowMaxH = 0;
        }

        result.push({ i: w.id, x, y, w: gridSize.w, h: gridSize.h });
        x += gridSize.w;
        rowMaxH = Math.max(rowMaxH, gridSize.h);
    }

    return result;
}

// ============ Widget Components ============

function TokenUsageWidget() {
    const { data: tokenUsage, isLoading } = useTokenUsage();
    const { t } = useTranslation();

    if (isLoading) return <div className="text-muted-foreground">{t('common.loading')}</div>;

    const categories = tokenUsage?.by_category || {};
    const total = tokenUsage?.total_tokens || 0;

    return (
        <div className="space-y-4">
            <div className="text-center">
                <p className="text-3xl font-bold">{formatNumber(total)}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.totalTokens')}</p>
            </div>
            <div className="space-y-2">
                {Object.entries(categories).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate">{category}</span>
                        <span className="font-medium">{formatNumber(count as number)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CacheHitWidget({ timeRange }: { timeRange: number }) {
    const { data: kpi, isLoading } = useKPIMetrics(timeRange);
    const { t } = useTranslation();

    return (
        <div className="h-full flex flex-col justify-center">
            <p className="text-3xl font-bold tracking-tight">
                {isLoading ? '...' : formatNumber(kpi?.cache_hit_count || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t('dashboard.cached')}</p>
        </div>
    );
}

function ErrorRateWidget({ timeRange }: { timeRange: number }) {
    const { data: distribution } = useErrorDistribution(timeRange);
    const { t } = useTranslation();

    if (!distribution || distribution.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                {t('dashboard.noErrorsInPeriod')}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {distribution.slice(0, 5).map((item, index) => {
                const errorItem = item as { name?: string; error_code?: string; count: number };
                const displayName = errorItem.name || errorItem.error_code || 'Unknown';
                return (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: `hsl(${index * 50}, 70%, 50%)` }}
                            />
                            <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                                {displayName}
                            </span>
                        </div>
                        <span className="text-sm font-medium">{formatNumber(item.count)}</span>
                    </div>
                );
            })}
        </div>
    );
}

function TimelineWidget({ timeRange }: { timeRange: number }) {
    const { fillMode } = useDashboardStore();
    const { language } = useTranslation();
    const locale = language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US';
    const bucketSize = Math.max(5, Math.floor(timeRange / 12));
    const { data: timeline } = useTimeline(timeRange, bucketSize);

    const chartData = useMemo(() => {
        if (!timeline) return [];
        return timeline.map((point) => ({
            name: new Date(point.timestamp).toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
            }),
            value: point.success + point.error + point.cache_hit,
            success: point.success,
            error: point.error,
            cache_hit: point.cache_hit,
        }));
    }, [timeline, locale]);

    return (
        <SurferChart
            data={chartData}
            dataKey="value"
            fillMode={fillMode}
            strokeColor="#ec5a53"
            fillColor="#ec5a53"
            height={220}
            showGrid={true}
            showXAxis={true}
            showYAxis={true}
        />
    );
}

function RecentErrorsWidget({ timeRange, limit = 5 }: { timeRange: number; limit?: number }) {
    const { data: errors } = useRecentErrors(timeRange, limit);
    return <RecentErrors errors={errors?.items || []} />;
}

function FunctionDistributionWidget() {
    const { data: distribution, isLoading } = useFunctionDistribution(10);
    const { t } = useTranslation();

    if (isLoading) return <div className="text-muted-foreground">{t('common.loading')}</div>;

    const items = (distribution || []) as { name?: string; function_name?: string; count: number }[];

    if (items.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                {t('common.noData')}
            </div>
        );
    }

    const maxCount = Math.max(...items.map((i) => i.count));

    return (
        <div className="space-y-2">
            {items.slice(0, 8).map((item, index) => {
                const name = item.name || item.function_name || 'Unknown';
                const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                    <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <code className="text-xs truncate max-w-[180px]">{name}</code>
                            <span className="font-medium text-xs">{formatNumber(item.count)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary/60 rounded-full"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function SystemStatusWidget() {
    const { data: status } = useSystemStatus();
    return <SystemStatusCard status={status} />;
}

function KPIOverviewWidget({ timeRange }: { timeRange: number }) {
    const { data: kpi, isLoading } = useKPIMetrics(timeRange);
    const { t } = useTranslation();

    const items = [
        { label: t('dashboard.totalExecutions'), value: formatNumber(kpi?.total_executions || 0), icon: <Activity className="h-4 w-4" /> },
        { label: t('dashboard.successRate'), value: formatPercentage(kpi?.success_rate || 0), icon: <Zap className="h-4 w-4" /> },
        { label: t('dashboard.avgDuration'), value: formatDuration(kpi?.avg_duration_ms || 0), icon: <Clock className="h-4 w-4" /> },
        { label: t('dashboard.errors'), value: formatNumber(kpi?.error_count || 0), icon: <AlertTriangle className="h-4 w-4" /> },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 h-full">
            {items.map((item, i) => (
                <div key={i} className="flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        {item.icon}
                        <span className="text-xs">{item.label}</span>
                    </div>
                    <p className="text-2xl font-bold tracking-tight">
                        {isLoading ? '...' : item.value}
                    </p>
                </div>
            ))}
        </div>
    );
}

// ============ Widget Content Factory ============
function WidgetContent({ type, timeRange }: { type: string; timeRange: number }) {
    switch (type) {
        case 'token_usage':
            return <TokenUsageWidget />;
        case 'cache_hit':
            return <CacheHitWidget timeRange={timeRange} />;
        case 'error_rate':
            return <ErrorRateWidget timeRange={timeRange} />;
        case 'execution_timeline':
            return <TimelineWidget timeRange={timeRange} />;
        case 'function_distribution':
            return <FunctionDistributionWidget />;
        case 'recent_errors':
            return <RecentErrorsWidget timeRange={timeRange} />;
        case 'system_status':
            return <SystemStatusWidget />;
        case 'kpi_overview':
            return <KPIOverviewWidget timeRange={timeRange} />;
        default:
            return <div className="text-muted-foreground">Unknown widget</div>;
    }
}

// ============ Widget Picker Modal ============
function WidgetPicker({
    catalog,
    existingTypes,
    onAdd,
    onClose,
}: {
    catalog: WidgetCatalogItem[];
    existingTypes: string[];
    onAdd: (type: string, size: string) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[70vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                    <h2 className="text-lg font-bold">{t('widgets.catalog')}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[55vh] space-y-2">
                    {catalog.map((item) => {
                        const alreadyAdded = existingTypes.includes(item.type);
                        return (
                            <button
                                key={item.type}
                                disabled={alreadyAdded}
                                onClick={() => onAdd(item.type, item.default_size)}
                                className={cn(
                                    'w-full flex items-center gap-3 p-4 rounded-xl border transition-colors text-left',
                                    alreadyAdded
                                        ? 'border-border bg-muted/50 opacity-50 cursor-not-allowed'
                                        : 'border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                                )}
                            >
                                <span className="text-primary shrink-0">
                                    {WIDGET_ICONS[item.type] || <Activity className="h-4 w-4" />}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.sizes.join(' / ')} &middot; {t('widgets.default')}: {item.default_size}
                                    </p>
                                </div>
                                {alreadyAdded && (
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {t('widgets.added')}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ============ Empty State ============
function EmptyDashboard({ onAddWidget }: { onAddWidget: () => void }) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center py-32 px-4">
            <div className="rounded-full bg-muted p-6 mb-6">
                <LayoutGrid className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('widgets.emptyTitle')}</h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
                {t('widgets.emptyDesc')}
            </p>
            <button
                onClick={onAddWidget}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium transition-colors hover:bg-primary/90"
            >
                <Plus className="h-5 w-5" />
                {t('widgets.addFirst')}
            </button>
        </div>
    );
}

// ============ Main Page Component ============
export default function DashboardPage() {
    const { timeRangeMinutes } = useDashboardStore();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    // Fetch user's pinned widgets
    const { data: widgetsData, isLoading, isError } = useQuery({
        queryKey: ['dashboard-widgets'],
        queryFn: () => widgetsService.list(),
        retry: false,
    });

    // Fetch widget catalog
    const { data: catalogData } = useQuery({
        queryKey: ['widget-catalog'],
        queryFn: () => widgetsService.getCatalog(),
        staleTime: Infinity,
    });

    // Mutations
    const addWidget = useMutation({
        mutationFn: ({ type, size }: { type: string; size: string }) =>
            widgetsService.add(type, size),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] }),
    });

    const removeWidget = useMutation({
        mutationFn: (id: string) => widgetsService.remove(id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] }),
    });

    const updateWidget = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { size?: string } }) =>
            widgetsService.update(id, data),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] }),
    });

    const reorderWidgets = useMutation({
        mutationFn: (ids: string[]) => widgetsService.reorder(ids),
    });

    const widgets = widgetsData?.items || [];
    const catalog = catalogData?.items || [];

    // Compute grid layout from widget order + sizes
    const layout = useMemo(() => computeLayout(widgets), [widgets]);

    // Key to remount BentoDashboard when widgets change (add/remove/resize)
    const layoutKey = widgets.map((w) => `${w.id}:${w.size}`).join(',');

    // Build widget configs for BentoDashboard
    const widgetConfigs: WidgetConfig[] = useMemo(() => {
        return widgets.map((w) => {
            const catalogItem = catalog.find((c) => c.type === w.widget_type);
            return {
                id: w.id,
                title: t(WIDGET_TITLE_KEYS[w.widget_type] || w.widget_type),
                icon: WIDGET_ICONS[w.widget_type] || <Activity className="h-4 w-4" />,
                component: (
                    <WidgetContent type={w.widget_type} timeRange={timeRangeMinutes} />
                ),
                size: w.size,
                availableSizes: catalogItem?.sizes || ['M'],
                onSizeChange: (size: string) =>
                    updateWidget.mutate({ id: w.id, data: { size } }),
                onRemove: () => removeWidget.mutate(w.id),
            };
        });
    }, [widgets, catalog, timeRangeMinutes, t]);

    // Handle drag reorder
    const handleDragEnd = useCallback(
        (newLayout: Layout[]) => {
            const sorted = [...newLayout].sort((a, b) => a.y - b.y || a.x - b.x);
            const newOrder = sorted.map((item) => item.i);
            const currentOrder = widgets.map((w) => w.id);
            if (JSON.stringify(newOrder) !== JSON.stringify(currentOrder)) {
                reorderWidgets.mutate(newOrder);
            }
        },
        [widgets]
    );

    const handleRefresh = () => queryClient.invalidateQueries();

    const handleAddWidget = (type: string, size: string) => {
        addWidget.mutate({ type, size });
        setShowPicker(false);
    };

    const isEmpty = !isLoading && (isError || widgets.length === 0);

    return (
        <div className="min-h-screen bg-background">
            {/* Sub Header - dashboard controls */}
            <div className="border-b border-border/50 bg-background/60 backdrop-blur-sm">
                <div className="px-4 md:px-6 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Title */}
                        <div className="flex items-center gap-2 min-w-0">
                            <Waves className="h-5 w-5 text-primary shrink-0" />
                            <h1 className="text-lg font-bold tracking-tight truncate">
                                {t('dashboard.title')}
                            </h1>
                        </div>

                        <div className="flex-1 min-w-[20px]" />

                        {/* Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Add Widget */}
                            <button
                                onClick={() => setShowPicker(true)}
                                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted/50 hover-glow"
                                title={t('widgets.addWidget')}
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    {t('widgets.addWidget')}
                                </span>
                            </button>

                            {/* Chart Style */}
                            <div className="hidden md:block">
                                <FillModeSelector />
                            </div>

                            {/* Edit Mode */}
                            {widgets.length > 0 && (
                                <div className="hidden md:block">
                                    <EditModeToggle
                                        isEditing={isEditing}
                                        onToggle={() => setIsEditing(!isEditing)}
                                    />
                                </div>
                            )}

                            {/* Refresh */}
                            <button
                                onClick={handleRefresh}
                                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted/50 hover-glow"
                                title={t('common.refresh')}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>

                            {/* Time Range */}
                            <TimeRangeSelector />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="p-4 md:p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="text-muted-foreground">{t('common.loading')}</div>
                    </div>
                ) : isEmpty ? (
                    <EmptyDashboard onAddWidget={() => setShowPicker(true)} />
                ) : (
                    <BentoDashboard
                        key={layoutKey}
                        widgets={widgetConfigs}
                        initialLayout={layout}
                        columns={12}
                        rowHeight={80}
                        gap={20}
                        editable={isEditing}
                        onDragEnd={handleDragEnd}
                    />
                )}
            </main>

            {/* Widget Picker Modal */}
            {showPicker && (
                <WidgetPicker
                    catalog={catalog}
                    existingTypes={widgets.map((w) => w.widget_type)}
                    onAdd={handleAddWidget}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}
