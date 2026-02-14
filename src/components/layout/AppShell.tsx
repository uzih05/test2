/**
 * App Shell - conditionally shows sidebar based on auth state and route.
 * [BYOD]
 */

'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { AuthGuard } from './AuthGuard';

const FULLSCREEN_PAGES = ['/login', '/signup', '/projects'];
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_PAGES.includes(pathname);

  // Auth / project pages: no sidebar, full-screen
  if (!USE_MOCK && isFullscreen) {
    return (
      <AuthGuard>
        <div className="h-screen bg-background">{children}</div>
      </AuthGuard>
    );
  }

  // Dashboard pages: sidebar + content
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}
