export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Rahmah Chat';

export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || 'development';

export const isDevelopment = APP_ENV === 'development';
export const isProduction = APP_ENV === 'production';