import { apiClient, redactSensitiveValues } from './apiClient';
import type { User } from '@/types/user.types';

interface RawUser {
  id?: string;
  userId?: string;
  email?: string;
  name?: string | null;
  displayName?: string | null;
  avatar?: string | null;
  image?: string | null;
  photoURL?: string | null;
  role?: string | null;
  status?: string | null;
  lastSeen?: string | null;
  createdAt?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const ROLE_MAP: Record<string, User['role']> = {
  admin: 'ADMIN',
  moderator: 'MODERATOR',
  teacher: 'TEACHER',
  student: 'STUDENT',
};

const STATUS_MAP: Record<string, User['status']> = {
  accepted: 'ACCEPTED',
  pending: 'ACCEPTED',
  rejected: 'REJECTED',
};

// The backend stores role/status lowercase and names avatars photoURL/image;
// the UI speaks uppercase enums + displayName/avatar. Normalize in exactly one
// place so login, session restore, and guards all see the same shape.
export const normalizeUser = (raw: RawUser | null | undefined): User | null => {
  if (!raw) return null;
  const id = raw.id || raw.userId;
  if (!id) return null;
  const email = raw.email || '';
  return {
    id,
    userId: raw.userId || id,
    email,
    displayName: raw.displayName || raw.name || email.split('@')[0] || 'Member',
    avatar: raw.avatar ?? raw.photoURL ?? raw.image ?? null,
    role: raw.role ? ROLE_MAP[raw.role.toLowerCase()] || 'STUDENT' : 'STUDENT',
    status: raw.status ? STATUS_MAP[raw.status.toLowerCase()] || 'ACCEPTED' : 'ACCEPTED',
    lastSeen: raw.lastSeen ?? null,
    createdAt: raw.createdAt,
  };
};

export const authService = {
  async login(data: LoginInput) {
    const response = await apiClient.post<RawUser>('/auth/login', data);
    const user = normalizeUser(response.data);
    if (!user) {
      console.error('[authService] Login response did not include a usable user', {
        status: response.statusCode,
        body: redactSensitiveValues(response),
      });
    }
    return { ...response, data: user };
  },

  async logout() {
    return apiClient.post<void>('/auth/logout', {});
  },

  async me() {
    const response = await apiClient.get<RawUser>('/auth/me');
    return { ...response, data: normalizeUser(response.data) };
  },
};
