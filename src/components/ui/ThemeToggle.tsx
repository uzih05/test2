'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/lib/stores/useThemeStore';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

const themes: { value: Theme; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
];

interface ThemeToggleProps {
  variant?: 'default' | 'header';
}

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className={cn(
      'flex items-center rounded-lg p-0.5 gap-0.5',
      variant === 'header'
        ? 'bg-white/10'
        : 'bg-muted border border-border'
    )}>
      {themes.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center justify-center rounded-md p-1.5 transition-colors',
            theme === value
              ? variant === 'header'
                ? 'bg-white/20 text-white'
                : 'bg-background text-foreground shadow-sm'
              : variant === 'header'
                ? 'text-white/60 hover:text-white'
                : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
