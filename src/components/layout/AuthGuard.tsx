/**
 * Auth Guard Component
 * [BYOD] Redirects unauthenticated users to /login.
 * Redirects authenticated users to /projects on initial load.
 * Bypassed when USE_MOCK is true.
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const PUBLIC_PATHS = ['/login', '/signup'];
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (USE_MOCK) {
      setChecked(true);
      return;
    }

    checkAuth().finally(() => setChecked(true));
  }, [checkAuth]);

  useEffect(() => {
    if (!checked || USE_MOCK) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);
    const isProjects = pathname === '/projects';

    // Not logged in -> go to login
    if (!isAuthenticated && !isPublic) {
      router.replace('/login');
      return;
    }

    // Logged in on public page -> go to projects
    if (isAuthenticated && isPublic) {
      router.replace('/projects');
      return;
    }

    // Logged in, on a dashboard page -> require project selection first
    if (isAuthenticated && !isPublic && !isProjects) {
      const projectSelected = sessionStorage.getItem('project_selected');
      if (!projectSelected) {
        router.replace('/projects');
      }
    }
  }, [checked, isAuthenticated, pathname, router]);

  if (!checked && !USE_MOCK) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
