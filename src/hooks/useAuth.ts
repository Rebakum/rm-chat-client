'use client';

import { useContext } from 'react';
import { AuthContext } from '@/store/AuthProvider';
import type { AuthContextType } from '@/types/user.types';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};