export const APP_NAME = 'Rahmah Chat';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },
  ADMIN: {
    USERS: '/admin/users',
  },
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CHAT: '/chat',
  ADMIN: '/admin',
} as const;