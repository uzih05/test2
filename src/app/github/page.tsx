/**
 * GitHub PR Monitor Page
 *
 * Connect GitHub via PAT, select repo, browse pull requests.
 */

'use client';

import { useState } from 'react';
import {
    GitPullRequest,
    ExternalLink,
    Key,
    Check,
    Trash2,
    Lock,
    Globe,
    ChevronDown,
    RefreshCw,
    Circle,
    GitMerge,
    XCircle,
    Users,
} from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { githubService, GitHubRepo, GitHubPR } from '@/lib/services/github';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ============ PR Status Badge ============
function PRStatusBadge({ state, draft }: { state: string; draft: boolean }) {
    const { t } = useTranslation();

    if (draft) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                <Circle className="h-3 w-3" />
                {t('github.draft')}
            </span>
        );
    }

    switch (state) {
        case 'open':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                    <GitPullRequest className="h-3 w-3" />
                    {t('github.open')}
                </span>
            );
        case 'merged':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600">
                    <GitMerge className="h-3 w-3" />
                    {t('github.merged')}
                </span>
            );
        case 'closed':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600">
                    <XCircle className="h-3 w-3" />
                    {t('github.closed')}
                </span>
            );
        default:
            return null;
    }
}

// ============ Time Ago ============
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

// ============ Token Section ============
function TokenSection() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [tokenInput, setTokenInput] = useState('');
    const [message, setMessage] = useState('');

    const { data: status, isLoading } = useQuery({
        queryKey: ['github-status'],
        queryFn: () => githubService.getStatus(),
        retry: false,
    });

    const saveMutation = useMutation({
        mutationFn: (token: string) => githubService.saveToken(token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['github-status'] });
            queryClient.invalidateQueries({ queryKey: ['github-repos'] });
            setTokenInput('');
            setMessage(t('github.tokenSaved'));
            setTimeout(() => setMessage(''), 3000);
        },
        onError: (err: Error) => {
            setMessage(err.message);
            setTimeout(() => setMessage(''), 5000);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => githubService.deleteToken(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['github-status'] });
            queryClient.invalidateQueries({ queryKey: ['github-repos'] });
            setMessage(t('github.tokenDeleted'));
            setTimeout(() => setMessage(''), 3000);
        },
    });

    const connected = status?.connected;

    return (
        <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
                <Key className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">{t('github.tokenLabel')}</h2>
            </div>

            {connected ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                            {t('github.connected')}{' '}
                            <span className="font-medium">@{status.username}</span>
                        </span>
                    </div>
                    <button
                        onClick={() => deleteMutation.mutate()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('github.disconnect')}
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{t('github.tokenDesc')}</p>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            placeholder={t('github.tokenPlaceholder')}
                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                        <button
                            onClick={() => tokenInput && saveMutation.mutate(tokenInput)}
                            disabled={!tokenInput || saveMutation.isPending}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 transition-colors hover:bg-primary/90"
                        >
                            {saveMutation.isPending ? '...' : t('github.connect')}
                        </button>
                    </div>
                </div>
            )}

            {message && (
                <p className="mt-3 text-xs text-muted-foreground">{message}</p>
            )}
        </div>
    );
}

// ============ Repo Selector ============
function RepoSelector({
    selectedRepo,
    onSelect,
}: {
    selectedRepo: string;
    onSelect: (fullName: string) => void;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const { data: status } = useQuery({
        queryKey: ['github-status'],
        queryFn: () => githubService.getStatus(),
        retry: false,
    });

    const { data: reposData, isLoading } = useQuery({
        queryKey: ['github-repos'],
        queryFn: () => githubService.listRepos(),
        enabled: !!status?.connected,
        retry: false,
    });

    if (!status?.connected) return null;

    const repos = reposData?.items || [];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium transition-colors hover:bg-muted"
            >
                <span className="flex items-center gap-2 truncate">
                    {selectedRepo ? (
                        <>
                            {repos.find((r) => r.full_name === selectedRepo)?.private ? (
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            {selectedRepo}
                        </>
                    ) : (
                        <span className="text-muted-foreground">
                            {isLoading ? '...' : t('github.selectRepo')}
                        </span>
                    )}
                </span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
                        {repos.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground text-center">
                                {t('github.noRepos')}
                            </div>
                        ) : (
                            repos.map((repo) => (
                                <button
                                    key={repo.full_name}
                                    onClick={() => {
                                        onSelect(repo.full_name);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-muted',
                                        selectedRepo === repo.full_name && 'bg-primary/5 text-primary'
                                    )}
                                >
                                    {repo.private ? (
                                        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    ) : (
                                        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{repo.full_name}</p>
                                        {repo.description && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {repo.description}
                                            </p>
                                        )}
                                    </div>
                                    {repo.language && (
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {repo.language}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ============ PR List ============
function PRList({ owner, repo }: { owner: string; repo: string }) {
    const { t } = useTranslation();
    const [stateFilter, setStateFilter] = useState('all');

    const { data: pullsData, isLoading, refetch } = useQuery({
        queryKey: ['github-pulls', owner, repo, stateFilter],
        queryFn: () => githubService.listPulls(owner, repo, stateFilter),
        enabled: !!owner && !!repo,
        retry: false,
    });

    const pulls = pullsData?.items || [];

    const filters = [
        { key: 'all', label: t('github.all') },
        { key: 'open', label: t('github.open') },
        { key: 'closed', label: t('github.closed') },
    ];

    const filteredPulls = pulls;

    return (
        <div className="space-y-4">
            {/* Filter + Refresh */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setStateFilter(f.key)}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                                stateFilter === f.key
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => refetch()}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title={t('common.refresh')}
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {/* PR Items */}
            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                    {t('common.loading')}
                </div>
            ) : filteredPulls.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    {t('github.noPulls')}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredPulls.map((pr) => (
                        <a
                            key={pr.number}
                            href={pr.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card transition-colors hover:bg-muted/50 group"
                        >
                            {/* Status Icon */}
                            <div className="pt-0.5 shrink-0">
                                <PRStatusBadge state={pr.state} draft={pr.draft} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground font-mono">
                                        #{pr.number}
                                    </span>
                                    <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                        {pr.title}
                                    </h3>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {/* Author */}
                                    <span>{t('github.by')} @{pr.author}</span>

                                    {/* Time */}
                                    <span>&middot;</span>
                                    <span>{timeAgo(pr.updated_at)}</span>

                                    {/* Reviewers */}
                                    {pr.reviewers.length > 0 && (
                                        <>
                                            <span>&middot;</span>
                                            <span className="inline-flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {pr.reviewers.join(', ')}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Labels */}
                                {pr.labels.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {pr.labels.map((label) => (
                                            <span
                                                key={label.name}
                                                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                                style={{
                                                    backgroundColor: `#${label.color}20`,
                                                    color: `#${label.color}`,
                                                    border: `1px solid #${label.color}40`,
                                                }}
                                            >
                                                {label.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* External link icon */}
                            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============ Main Page ============
export default function GitHubPage() {
    const { t } = useTranslation();
    const [selectedRepo, setSelectedRepo] = useState('');

    const [owner, repo] = selectedRepo ? selectedRepo.split('/') : ['', ''];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
                <div className="px-4 md:px-6 py-3">
                    <div className="flex items-center gap-2 ml-10 md:ml-0">
                        <GitPullRequest className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-bold tracking-tight">
                            {t('github.title')}
                        </h1>
                        <span className="text-sm text-muted-foreground hidden md:inline">
                            — {t('github.subtitle')}
                        </span>
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
                {/* Token Connection */}
                <TokenSection />

                {/* Repo Selector */}
                <RepoSelector selectedRepo={selectedRepo} onSelect={setSelectedRepo} />

                {/* PR List */}
                {owner && repo && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('github.pullRequests')}
                        </h2>
                        <PRList owner={owner} repo={repo} />
                    </div>
                )}
            </main>
        </div>
    );
}
