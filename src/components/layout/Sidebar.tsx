/**
 * Sidebar Navigation
 *
 * Responsive sidebar with collapsible desktop mode and mobile hamburger menu.
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useSidebarStore } from '@/lib/stores/useSidebarStore';

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

function UserSection({ collapsed }: { collapsed: boolean }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    sessionStorage.removeItem('project_selected');
    logout();
    router.push('/login');
  };

  if (collapsed) {
    return (
      <div className="flex justify-center py-2">
        <button
          onClick={handleLogout}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors"
          title="Logout"
        >
          {(user.display_name || user.email)[0].toUpperCase()}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
        {(user.display_name || user.email)[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{user.display_name || user.email}</p>
        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
      </div>
      <button
        onClick={handleLogout}
        className="p-1 rounded hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
        title="Logout"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { collapsed, toggle } = useSidebarStore();

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

  const SidebarContent = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <>
      {/* Logo */}
      <div className={cn(
        'flex h-14 items-center border-b border-white/[0.04]',
        isCollapsed ? 'justify-center px-2' : 'gap-3 px-5'
      )}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 shrink-0">
          <Waves className="h-5 w-5 text-primary" />
        </div>
        {!isCollapsed && (
          <span className="text-lg font-bold tracking-tight">VectorSurfer</span>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        'flex-1 space-y-0.5 py-3',
        isCollapsed ? 'px-2' : 'px-3'
      )}>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              title={isCollapsed ? t(`nav.${item.key}`) : undefined}
              className={cn(
                'group relative flex items-center rounded-lg text-sm font-medium transition-colors',
                isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && t(`nav.${item.key}`)}

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-card border border-white/[0.06] text-xs text-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                  {t(`nav.${item.key}`)}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Projects + Settings + User + Toggle */}
      <div className={cn(
        'border-t border-white/[0.04] space-y-0.5 py-3',
        isCollapsed ? 'px-2' : 'p-3'
      )}>
        <Link
          href="/projects"
          onClick={() => sessionStorage.removeItem('project_selected')}
          title={isCollapsed ? t('nav.projects') : undefined}
          className={cn(
            'group relative flex items-center rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground',
            isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2'
          )}
        >
          <FolderOpen className="h-4 w-4 shrink-0" />
          {!isCollapsed && t('nav.projects')}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-card border border-white/[0.06] text-xs text-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
              {t('nav.projects')}
            </div>
          )}
        </Link>
        <Link
          href="/settings"
          title={isCollapsed ? t('nav.settings') : undefined}
          className={cn(
            'group relative flex items-center rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground',
            isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!isCollapsed && t('nav.settings')}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-card border border-white/[0.06] text-xs text-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
              {t('nav.settings')}
            </div>
          )}
        </Link>

        {/* User info */}
        <UserSection collapsed={isCollapsed} />

        {/* Desktop toggle button */}
        {!isOpen && (
          <button
            onClick={toggle}
            className={cn(
              'flex items-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors',
              isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2 w-full text-sm'
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3.5 left-4 z-50 flex md:hidden items-center justify-center w-10 h-10 rounded-xl bg-card border border-white/[0.06] shadow-lg"
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

      {/* Mobile Sidebar (always expanded) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card shadow-xl shadow-black/20 transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/[0.06]"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent isCollapsed={false} />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-card shadow-xl shadow-black/20 sidebar-transition overflow-hidden shrink-0',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent isCollapsed={collapsed} />
      </aside>
    </>
  );
}
