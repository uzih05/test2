/**
 * Global Header
 *
 * Gradient pink→purple header with rounded-bl-3xl.
 */

'use client';

import { useAuthStore } from '@/lib/stores/useAuthStore';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SearchBar } from './SearchBar';

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-20 flex h-14 md:h-20 items-center gap-4 gradient-accent rounded-bl-3xl px-4 md:px-6 shadow-lg">
      {/* Search (center) */}
      <div className="flex-1 flex justify-center max-w-xl mx-auto">
        <SearchBar variant="header" />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <ThemeToggle variant="header" />
        <LanguageSwitcher variant="header" />

        {/* User avatar */}
        {user && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-xs font-bold">
            {(user.display_name || user.email)[0].toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
