/**
 * Language Switcher Component
 *
 * Dropdown to switch between Korean, English, Japanese.
 * Supports 'header' variant for gradient header.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation, LANGUAGES, LanguageCode } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
    variant?: 'default' | 'header';
}

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
    const { language, setLanguage } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLang = LANGUAGES[language];
    const isHeader = variant === 'header';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all',
                    isHeader
                        ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
                        : 'bg-card border-border hover:border-primary/40',
                    isOpen && !isHeader && 'border-primary ring-1 ring-primary/20',
                    isOpen && isHeader && 'bg-white/20 border-white/30'
                )}
                aria-label="Select language"
            >
                <Globe className={cn('h-4 w-4', isHeader ? 'text-white/70' : 'text-muted-foreground')} />
                <span className="text-sm font-medium hidden sm:inline">{currentLang.flag}</span>
                <ChevronDown className={cn(
                    'h-4 w-4 transition-transform',
                    isHeader ? 'text-white/70' : 'text-muted-foreground',
                    isOpen && 'rotate-180'
                )} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-border bg-card p-1 shadow-xl z-50">
                    {(Object.values(LANGUAGES) as typeof LANGUAGES[LanguageCode][]).map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code as LanguageCode);
                                setIsOpen(false);
                            }}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors',
                                language === lang.code
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-muted text-foreground'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span>{lang.name}</span>
                            </div>
                            {language === lang.code && (
                                <Check className="h-4 w-4" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
