/**
 * Sidebar Navigation
 * 
 * Responsive sidebar with mobile hamburger menu.
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
  User,
  FolderOpen,
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
  { key: 'github', href: '/github', icon: GitPullRequest },
];

function UserSection() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    sessionStorage.removeItem('project_selected');
    logout();
    router.push('/login');
  };

  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
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

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar on resize to desktop
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

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Waves className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">VectorSurfer</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(`nav.${item.key}`)}
            </Link>
          );
        })}
      </nav>

      {/* Projects + Settings + User */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/projects"
          onClick={() => sessionStorage.removeItem('project_selected')}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <FolderOpen className="h-4 w-4" />
          {t('nav.projects')}
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          {t('nav.settings')}
        </Link>

        {/* [BYOD] User info + logout */}
        <UserSection />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 flex md:hidden items-center justify-center w-10 h-10 rounded-lg bg-card border border-border shadow-lg"
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

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-border bg-card transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>
    </>
  );
}
