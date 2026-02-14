/**
 * Sidebar Navigation
 *
 * 128px fixed sidebar with icon + label vertical layout.
 * Mobile: slide drawer.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  GitBranch,
  Code2,
  AlertTriangle,
  Sparkles,
  Database,
  GitPullRequest,
  Settings,
  Waves,
  Menu,
  X,
  LogOut,
  FolderOpen,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const navigation = [
  { key: 'overview', href: '/', icon: LayoutDashboard },
  { key: 'executions', href: '/executions', icon: Activity },
  { key: 'traces', href: '/traces', icon: GitBranch },
  { key: 'functions', href: '/functions', icon: Code2 },
  { key: 'errors', href: '/errors', icon: AlertTriangle },
  { key: 'healer', href: '/healer', icon: Sparkles },
  { key: 'cache', href: '/cache', icon: Database },
  { key: 'golden', href: '/golden', icon: Star },
  { key: 'github', href: '/github', icon: GitPullRequest },
];

function UserSection({ mobile }: { mobile?: boolean }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    sessionStorage.removeItem('project_selected');
    logout();
    router.push('/login');
  };

  if (mobile) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full gradient-accent text-white text-xs font-bold shrink-0">
          {(user.display_name || user.email)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{user.display_name || user.email}</p>
          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Logout"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <button
        onClick={handleLogout}
        className="flex h-8 w-8 items-center justify-center rounded-full gradient-accent text-white text-xs font-bold hover:opacity-80 transition-opacity"
        title="Logout"
      >
        {(user.display_name || user.email)[0].toUpperCase()}
      </button>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3.5 left-4 z-50 flex md:hidden items-center justify-center w-10 h-10 rounded-xl bg-card border border-border shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar (264px drawer) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[264px] flex flex-col bg-card border-r border-border shadow-xl transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Mobile Logo */}
        <div className="flex h-14 items-center gap-3 px-5 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-accent shrink-0">
            <Waves className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">VectorSurfer</span>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 space-y-0.5 py-3 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'gradient-accent text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Bottom */}
        <div className="border-t border-border space-y-0.5 p-3">
          <Link
            href="/projects"
            onClick={() => sessionStorage.removeItem('project_selected')}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <FolderOpen className="h-4 w-4 shrink-0" />
            {t('nav.projects')}
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4 shrink-0" />
            {t('nav.settings')}
          </Link>
          <UserSection mobile />
        </div>
      </aside>

      {/* Desktop Sidebar (128px fixed) */}
      <aside className="hidden md:flex flex-col w-[128px] bg-card border-r border-border shrink-0 overflow-hidden">
        {/* Logo */}
        <div className="flex flex-col items-center gap-1 py-4 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-accent">
            <Waves className="h-6 w-6 text-white" />
          </div>
          <span className="text-[10px] font-bold tracking-tight gradient-accent-text">VectorSurfer</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-0.5 py-3 px-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-full py-2 rounded-xl text-center transition-all hover:scale-105',
                  isActive
                    ? 'gradient-accent text-white shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="text-[10px] font-medium leading-tight">{t(`nav.${item.key}`)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Projects, Settings, User */}
        <div className="border-t border-border flex flex-col items-center gap-0.5 py-3 px-2">
          <Link
            href="/projects"
            onClick={() => sessionStorage.removeItem('project_selected')}
            className={cn(
              'flex flex-col items-center justify-center gap-1 w-full py-2 rounded-xl text-center transition-all hover:scale-105',
              pathname === '/projects'
                ? 'gradient-accent text-white shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <FolderOpen className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-medium leading-tight">{t('nav.projects')}</span>
          </Link>
          <Link
            href="/settings"
            className={cn(
              'flex flex-col items-center justify-center gap-1 w-full py-2 rounded-xl text-center transition-all hover:scale-105',
              pathname === '/settings'
                ? 'gradient-accent text-white shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-medium leading-tight">{t('nav.settings')}</span>
          </Link>
          <UserSection />
        </div>
      </aside>
    </>
  );
}
