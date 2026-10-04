'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/user.types';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles: User['role'][];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace(user.role === 'ADMIN' || user.role === 'MODERATOR' ? '/dashboard' : '/chat');
    }
  }, [allowedRoles, isAuthenticated, isLoading, router, user]);

  if (isLoading || !isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-label="Loading account">
        <Spinner size="lg" />
      </div>
    );
  }

  return children;
}
