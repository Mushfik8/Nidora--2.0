'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Skeleton from '../ui/Skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not logged in
      router.push('/');
      return;
    }

    if (user.isBlocked) {
      // User is blocked by admin
      router.push('/'); // Or a dedicated /blocked page
      return;
    }

    if (!user.onboardingCompleted && pathname !== '/onboarding') {
      // Needs to complete onboarding
      router.push('/onboarding');
      return;
    }

    if (user.onboardingCompleted && pathname === '/onboarding') {
      // Already onboarded
      router.push('/');
      return;
    }

    if (requireAdmin && !isAdmin) {
      // Non-admin trying to access admin page
      router.push('/');
      return;
    }
  }, [user, loading, isAdmin, router, pathname, requireAdmin]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          <p className="text-surface-500 font-medium animate-pulse">Loading Nidora...</p>
        </div>
      </div>
    );
  }

  // Prevent flash of unauthorized content while redirecting
  if (!user) return null;
  if (!user.onboardingCompleted && pathname !== '/onboarding') return null;
  if (requireAdmin && !isAdmin) return null;

  return <>{children}</>;
}
