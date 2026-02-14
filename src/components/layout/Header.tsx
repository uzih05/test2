/**
 * Global Header
 *
 * Sticky top bar with sidebar toggle, search, user profile, and language switcher.
 */

'use client';

import { Menu } from 'lucide-react';
import { useSidebarStore } from '@/lib/stores/useSidebarStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { SearchBar } from './SearchBar';

export function Header() {
  const { toggle } = useSidebarStore();
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-white/[0.04] bg-background/80 backdrop-blur-xl px-4 md:px-6">
      {/* Sidebar Toggle */}
      <button
        onClick={toggle}
        className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/[0.06] transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Search (center) */}
      <div className="flex-1 flex justify-center max-w-xl mx-auto">
        <SearchBar />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        {/* User avatar */}
        {user && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
            {(user.display_name || user.email)[0].toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
