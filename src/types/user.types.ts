export interface User {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatar: string | null;
  role: 'STUDENT' | 'TEACHER' | 'MODERATOR' | 'ADMIN';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  lastSeen?: string | null;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}
