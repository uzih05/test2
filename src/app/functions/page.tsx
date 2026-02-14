/**
 * Functions Page - Function registry with hybrid search and detail modal
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Code2,
  Search,
  MessageSquare,
  Loader2,
  X,
  Sliders,
  Users,
  Clock,
  AlertTriangle,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FileCode,
  LayoutGrid,
  GitBranch,
} from 'lucide-react';
import {
  useFunctions,
  useFunctionSearch,
  useFunctionHybridSearch,
  useFunction,
} from '@/lib/hooks/useApi';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { formatNumber, formatDuration, formatPercentage, cn } from '@/lib/utils';
import type { FunctionInfo } from '@/lib/types/api';

// ============ Function Detail Modal ============
interface FunctionDetailModalProps {
  listData: FunctionInfo | null;
  onClose: () => void;
}

function FunctionDetailModal({ listData, onClose }: FunctionDetailModalProps) {
  const { data: detailData, isLoading } = useFunction(listData?.function_name || '');
  const { t } = useTranslation();

  if (!listData) return null;

  // Merge: listData as base (has stats), detailData supplements extra fields
  const func = detailData
    ? {
        ...listData,
        ...Object.fromEntries(
          Object.entries(detailData).filter(([, v]) => v != null && v !== '')
        ),
      }
    : listData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl border border-border bg-card shadow-2xl mx-4">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('functions.details')}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
            <div className="space-y-6">
              {/* Function Name & Module */}
              <div>
                <code className="text-xl font-bold text-primary">{func.function_name}</code>
                {func.module && (
                  <p className="text-sm text-muted-foreground font-mono mt-1">{func.module}</p>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {func.team && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Users className="h-3 w-3" />
                    {func.team}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                  <Zap className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{formatNumber(func.execution_count || 0)}</p>
                  <p className="text-xs text-muted-foreground">{t('functions.executions')}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{formatDuration(func.avg_duration_ms || 0)}</p>
                  <p className="text-xs text-muted-foreground">{t('functions.avgDuration')}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                  <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-red-500" />
                  <p className={cn(
                    "text-2xl font-bold",
                    (func.error_rate || 0) > 5 ? 'text-red-500' : ''
                  )}>
                    {formatPercentage(func.error_rate || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('functions.errorRate')}</p>
                </div>
              </div>

              {/* Description */}
              {func.description && (
                <div>
                  <h3 className="text-sm font-medium mb-2">{t('functions.description')}</h3>
                  <p className="text-sm text-muted-foreground">{func.description}</p>
                </div>
              )}

              {/* Docstring */}
              {func.docstring && (
                <div>
                  <h3 className="text-sm font-medium mb-2">{t('functions.docstring')}</h3>
                  <pre className="rounded-xl bg-muted p-4 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {func.docstring}
                  </pre>
                </div>
              )}

              {/* Docstring / Source Code loading indicator */}
              {isLoading && !detailData && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Source Code */}
              {func.source_code && (
                <div>
                  <h3 className="text-sm font-medium mb-2">{t('functions.sourceCode')}</h3>
                  <pre className="rounded-xl bg-muted p-4 text-xs overflow-auto max-h-60 font-mono">
                    <code>{func.source_code}</code>
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border flex-wrap">
                <a
                  href={`/executions?function_name=${encodeURIComponent(func.function_name)}`}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {t('functions.viewExecutions')}
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href={`/errors?function_name=${encodeURIComponent(func.function_name)}`}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  {t('functions.viewErrors')}
                </a>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// ============ Search Mode Selector ============
type SearchMode = 'semantic' | 'hybrid';

interface SearchModeSelectorProps {
  value: SearchMode;
  onChange: (mode: SearchMode) => void;
}

function SearchModeSelector({ value, onChange }: SearchModeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
      <button
        onClick={() => onChange('semantic')}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
          value === 'semantic'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {t('functions.semantic')}
      </button>
      <button
        onClick={() => onChange('hybrid')}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
          value === 'hybrid'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {t('functions.hybrid')}
      </button>
    </div>
  );
}

// ============ Alpha Slider ============
interface AlphaSliderProps {
  value: number;
  onChange: (value: number) => void;
}

function AlphaSlider({ value, onChange }: AlphaSliderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{t('functions.keyword')}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value * 100}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-24 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
      />
      <span className="text-xs text-muted-foreground whitespace-nowrap">{t('functions.vector')}</span>
      <span className="text-xs font-medium w-8">{Math.round(value * 100)}%</span>
    </div>
  );
}

// ============ Ask AI Section ============
function AskAISection() {
  const [askQuery, setAskQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [askResult, setAskResult] = useState<string | null>(null);
  const { t, language } = useTranslation();
  const { user } = useAuthStore();
  const hasApiKey = user?.has_openai_key ?? false;

  const handleAsk = async () => {
    if (!askQuery.trim() || !hasApiKey) return;
    setIsAsking(true);
    setAskResult(null);

    try {
      const { functionsService } = await import('@/lib/services/api');
      const data = await functionsService.askAboutFunction(askQuery, language);
      setAskResult(data.answer);
    } catch (error: any) {
      setAskResult(error.message || t('common.error'));
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">{t('functions.askAI')}</h3>
      </div>

      {!hasApiKey && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-center gap-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
          <p className="text-xs text-yellow-500">
            {t('settings.apiKeyRequired')}{' '}
            <a href="/settings" className="underline hover:text-yellow-400">{t('nav.settings')} →</a>
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t('functions.askPlaceholder')}
          value={askQuery}
          onChange={(e) => setAskQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          disabled={!hasApiKey}
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleAsk}
          disabled={isAsking || !askQuery.trim() || !hasApiKey}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : t('functions.ask')}
        </button>
      </div>

      {askResult && (
        <div className="mt-4 rounded-xl bg-background border border-border p-4">
          <p className="text-sm whitespace-pre-wrap">{askResult}</p>
        </div>
      )}
    </div>
  );
}

// ============ Function Card ============
interface FunctionCardProps {
  func: FunctionInfo;
  onClick: () => void;
}

function FunctionCard({ func, onClick }: FunctionCardProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="h-4 w-4 text-primary shrink-0" />
            <code className="text-sm font-semibold truncate">{func.function_name}</code>
          </div>

          {func.module && (
            <p className="text-xs text-muted-foreground font-mono truncate mb-2">
              {func.module}
            </p>
          )}

          {func.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {func.description}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {func.team && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {func.team}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {func.execution_count !== undefined && (
            <div className="text-right">
              <p className="text-sm font-semibold">{formatNumber(func.execution_count)}</p>
              <p className="text-xs text-muted-foreground">{t('functions.runs')}</p>
            </div>
          )}
          {func.error_rate !== undefined && func.error_rate > 0 && (
            <span className={cn(
              "text-xs font-medium",
              func.error_rate > 5 ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {formatPercentage(func.error_rate)} {t('functions.errors')}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ============ File Tree Types & Builder ============
type ViewMode = 'grid' | 'tree';
type SortBy = 'execution_count' | 'error_rate' | 'avg_duration_ms' | 'name';

interface FileTreeNode {
  name: string;
  path: string;
  children: FileTreeNode[];
  functions: FunctionInfo[];
  totalExecutions: number;
  avgErrorRate: number;
  functionCount: number;
}

function buildFileTree(functions: FunctionInfo[], sortBy: SortBy): FileTreeNode {
  const root: FileTreeNode = {
    name: '',
    path: '',
    children: [],
    functions: [],
    totalExecutions: 0,
    avgErrorRate: 0,
    functionCount: 0,
  };

  for (const func of functions) {
    const filePath = func.file_path || func.module || 'unknown';
    const segments = filePath.replace(/\\/g, '/').split('/').filter(Boolean);

    let current = root;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const fullPath = segments.slice(0, i + 1).join('/');
      let child = current.children.find((c) => c.name === seg);
      if (!child) {
        child = {
          name: seg,
          path: fullPath,
          children: [],
          functions: [],
          totalExecutions: 0,
          avgErrorRate: 0,
          functionCount: 0,
        };
        current.children.push(child);
      }
      current = child;
    }
    current.functions.push(func);
  }

  // Aggregate stats bottom-up
  function aggregate(node: FileTreeNode): void {
    for (const child of node.children) {
      aggregate(child);
    }
    const allFuncs = getAllFunctions(node);
    node.functionCount = allFuncs.length;
    node.totalExecutions = allFuncs.reduce((sum, f) => sum + (f.execution_count || 0), 0);
    const errorRates = allFuncs.filter((f) => f.error_rate !== undefined);
    node.avgErrorRate = errorRates.length > 0
      ? errorRates.reduce((sum, f) => sum + (f.error_rate || 0), 0) / errorRates.length
      : 0;
  }

  function getAllFunctions(node: FileTreeNode): FunctionInfo[] {
    const result = [...node.functions];
    for (const child of node.children) {
      result.push(...getAllFunctions(child));
    }
    return result;
  }

  aggregate(root);

  // Sort children at each level
  function sortTree(node: FileTreeNode): void {
    // Directories first, then files with functions
    node.children.sort((a, b) => {
      const aIsDir = a.children.length > 0;
      const bIsDir = b.children.length > 0;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;

      switch (sortBy) {
        case 'execution_count': return b.totalExecutions - a.totalExecutions;
        case 'error_rate': return b.avgErrorRate - a.avgErrorRate;
        case 'avg_duration_ms': {
          const aFuncs = getAllFunctions(a);
          const bFuncs = getAllFunctions(b);
          const aAvg = aFuncs.length > 0 ? aFuncs.reduce((s, f) => s + (f.avg_duration_ms || 0), 0) / aFuncs.length : 0;
          const bAvg = bFuncs.length > 0 ? bFuncs.reduce((s, f) => s + (f.avg_duration_ms || 0), 0) / bFuncs.length : 0;
          return bAvg - aAvg;
        }
        default: return a.name.localeCompare(b.name);
      }
    });

    // Sort functions within node
    node.functions.sort((a, b) => {
      switch (sortBy) {
        case 'execution_count': return (b.execution_count || 0) - (a.execution_count || 0);
        case 'error_rate': return (b.error_rate || 0) - (a.error_rate || 0);
        case 'avg_duration_ms': return (b.avg_duration_ms || 0) - (a.avg_duration_ms || 0);
        default: return a.function_name.localeCompare(b.function_name);
      }
    });

    for (const child of node.children) {
      sortTree(child);
    }
  }

  sortTree(root);
  return root;
}

// ============ File Tree Node Component ============
interface FileTreeNodeProps {
  node: FileTreeNode;
  depth?: number;
  onSelectFunction: (func: FunctionInfo) => void;
}

function FileTreeNodeComponent({ node, depth = 0, onSelectFunction }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const { t } = useTranslation();
  const hasChildren = node.children.length > 0 || node.functions.length > 0;
  const isLeaf = node.children.length === 0;

  return (
    <div>
      {/* Node header (skip root node which has empty name) */}
      {node.name && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left',
            depth > 0 && 'ml-4'
          )}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <div className="w-3.5" />
          )}

          {isLeaf && node.functions.length > 0 ? (
            <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />
          ) : (
            <FolderOpen className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
          )}

          <span className="text-sm font-medium truncate">{node.name}</span>

          <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span>{node.functionCount} {t('functions.functionsCount')}</span>
            {node.totalExecutions > 0 && (
              <span>{formatNumber(node.totalExecutions)} {t('functions.runs')}</span>
            )}
            {node.avgErrorRate > 0 && (
              <span className={node.avgErrorRate > 5 ? 'text-red-500' : ''}>
                {formatPercentage(node.avgErrorRate)}
              </span>
            )}
          </span>
        </button>
      )}

      {/* Children */}
      {(expanded || !node.name) && (
        <div>
          {node.children.map((child) => (
            <FileTreeNodeComponent
              key={child.path}
              node={child}
              depth={node.name ? depth + 1 : 0}
              onSelectFunction={onSelectFunction}
            />
          ))}

          {/* Functions in this node */}
          {node.functions.map((func, i) => (
            <button
              key={`${func.function_name}-${i}`}
              onClick={() => onSelectFunction(func)}
              className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
              style={{ paddingLeft: `${(node.name ? depth + 1 : 0) * 16 + 12 + 14}px` }}
            >
              <Code2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <code className="text-sm font-medium truncate">{func.function_name}</code>

              <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                {func.execution_count !== undefined && (
                  <span>{formatNumber(func.execution_count)} {t('functions.runs')}</span>
                )}
                {func.avg_duration_ms !== undefined && (
                  <span>{formatDuration(func.avg_duration_ms)}</span>
                )}
                {func.error_rate !== undefined && func.error_rate > 0 && (
                  <span className={func.error_rate > 5 ? 'text-red-500' : ''}>
                    {formatPercentage(func.error_rate)}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Main Page Component ============
export default function FunctionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('semantic');
  const [alpha, setAlpha] = useState(0.5);
  const [teamFilter, setTeamFilter] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<FunctionInfo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [sortBy, setSortBy] = useState<SortBy>('execution_count');
  const { t } = useTranslation();

  // Fetch data based on search mode
  const { data: allFunctions, isLoading: loadingAll } = useFunctions();
  const { data: semanticResults, isLoading: loadingSemantic } = useFunctionSearch(
    searchMode === 'semantic' ? searchQuery : '',
    20
  );
  const { data: hybridResults, isLoading: loadingHybrid } = useFunctionHybridSearch(
    searchMode === 'hybrid' ? searchQuery : '',
    alpha,
    20
  );

  // Determine which results to show
  const functions = useMemo(() => {
    let results: FunctionInfo[] = [];

    if (searchQuery) {
      results = searchMode === 'semantic'
        ? (semanticResults?.items || [])
        : (hybridResults?.items || []);
    } else {
      results = allFunctions?.items || [];
    }

    // Apply team filter
    if (teamFilter) {
      results = results.filter(f =>
        f.team?.toLowerCase().includes(teamFilter.toLowerCase())
      );
    }

    // Apply sort (for grid view; tree view handles sorting internally)
    if (viewMode === 'grid') {
      results = [...results].sort((a, b) => {
        switch (sortBy) {
          case 'execution_count': return (b.execution_count || 0) - (a.execution_count || 0);
          case 'error_rate': return (b.error_rate || 0) - (a.error_rate || 0);
          case 'avg_duration_ms': return (b.avg_duration_ms || 0) - (a.avg_duration_ms || 0);
          case 'name': return a.function_name.localeCompare(b.function_name);
          default: return 0;
        }
      });
    }

    return results;
  }, [searchQuery, searchMode, semanticResults, hybridResults, allFunctions, teamFilter, viewMode, sortBy]);

  // Build file tree for tree view
  const fileTree = useMemo(() => {
    if (viewMode !== 'tree') return null;
    return buildFileTree(functions, sortBy);
  }, [functions, viewMode, sortBy]);

  const isLoading = searchQuery
    ? (searchMode === 'semantic' ? loadingSemantic : loadingHybrid)
    : loadingAll;

  // Get unique teams for filter suggestions
  const teams = useMemo(() => {
    const allTeams = (allFunctions?.items || [])
      .map(f => f.team)
      .filter((t): t is string => !!t);
    return [...new Set(allTeams)];
  }, [allFunctions]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('functions.title')}</h1>
        <p className="text-muted-foreground">
          {t('functions.subtitle')}
        </p>
      </div>

      {/* Ask AI */}
      <AskAISection />

      {/* Search & Filters */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('functions.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Search Mode */}
          <SearchModeSelector value={searchMode} onChange={setSearchMode} />

          {/* Team Filter */}
          <div className="relative">
            <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('executions.team') + "..."}
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              list="teams"
              className="w-28 rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <datalist id="teams">
              {teams.map(team => (
                <option key={team} value={team} />
              ))}
            </datalist>
          </div>

          {/* Clear */}
          {(searchQuery || teamFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTeamFilter('');
              }}
              className="flex items-center gap-1 rounded-xl border border-border px-3 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
              {t('common.clear')}
            </button>
          )}
        </div>

        {/* Hybrid Search Options */}
        {searchMode === 'hybrid' && searchQuery && (
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <Sliders className="h-4 w-4 text-muted-foreground" />
            <AlphaSlider value={alpha} onChange={setAlpha} />
          </div>
        )}
      </div>

      {/* Results Count + View Mode + Sort */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="text-sm text-muted-foreground">
          {functions.length} {t('nav.functions').toLowerCase()}
        </span>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t('functions.sortBy')}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs focus:border-primary focus:outline-none"
            >
              <option value="execution_count">{t('functions.execCount')}</option>
              <option value="error_rate">{t('functions.errorRate')}</option>
              <option value="avg_duration_ms">{t('functions.avgDuration')}</option>
              <option value="name">{t('functions.name')}</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              title={t('functions.gridView')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'tree' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              title={t('functions.treeView')}
            >
              <GitBranch className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Functions Grid / Tree */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-muted" />
          ))}
        </div>
      ) : functions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Code2 className="h-12 w-12 mb-4 opacity-50" />
          <p>{t('functions.noFunctions')}</p>
          {searchQuery && (
            <p className="text-sm mt-1">{t('functions.tryDifferent')}</p>
          )}
        </div>
      ) : viewMode === 'tree' && fileTree ? (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <FileTreeNodeComponent
            node={fileTree}
            onSelectFunction={(func) => setSelectedFunction(func)}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {functions.map((func, index) => (
            <FunctionCard
              key={`${func.function_name}-${index}`}
              func={func}
              onClick={() => setSelectedFunction(func)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <FunctionDetailModal
        listData={selectedFunction}
        onClose={() => setSelectedFunction(null)}
      />
    </div>
  );
}
