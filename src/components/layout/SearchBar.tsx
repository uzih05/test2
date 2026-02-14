/**
 * SearchBar - Command palette style search
 *
 * Ctrl+K / Cmd+K to focus. Filters navigation items and navigates on select.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Activity,
  GitBranch,
  Code2,
  AlertTriangle,
  Sparkles,
  Database,
  GitPullRequest,
  Settings,
  FolderOpen,
  Star,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const pages = [
  { key: 'overview', href: '/', icon: LayoutDashboard },
  { key: 'executions', href: '/executions', icon: Activity },
  { key: 'traces', href: '/traces', icon: GitBranch },
  { key: 'functions', href: '/functions', icon: Code2 },
  { key: 'errors', href: '/errors', icon: AlertTriangle },
  { key: 'healer', href: '/healer', icon: Sparkles },
  { key: 'cache', href: '/cache', icon: Database },
  { key: 'golden', href: '/golden', icon: Star },
  { key: 'github', href: '/github', icon: GitPullRequest },
  { key: 'settings', href: '/settings', icon: Settings },
  { key: 'projects', href: '/projects', icon: FolderOpen },
];

export function SearchBar() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? pages.filter((p) => {
        const label = t(`nav.${p.key}`).toLowerCase();
        return label.includes(query.toLowerCase()) || p.key.includes(query.toLowerCase());
      })
    : pages;

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    inputRef.current?.blur();
  }, []);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      close();
    },
    [router, close]
  );

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, close]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      navigate(filtered[selectedIndex].href);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={`Search... (Ctrl+K)`}
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-white/[0.06] bg-card shadow-2xl overflow-hidden z-50">
          <div className="max-h-[300px] overflow-y-auto py-1">
            {filtered.map((page, index) => (
              <button
                key={page.key}
                onClick={() => navigate(page.href)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground'
                )}
              >
                <page.icon className="h-4 w-4" />
                <span>{t(`nav.${page.key}`)}</span>
                <span className="ml-auto text-xs text-muted-foreground/50">{page.href}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
