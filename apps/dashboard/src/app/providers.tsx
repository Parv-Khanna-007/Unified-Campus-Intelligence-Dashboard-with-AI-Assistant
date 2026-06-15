'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export interface UserProfile {
  username: string;
  name: string;
  role: 'student' | 'admin';
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const savedToken = localStorage.getItem('campus_intel_auth_token');
    const savedUser = localStorage.getItem('campus_intel_auth_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('campus_intel_auth_token');
        localStorage.removeItem('campus_intel_auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('campus_intel_auth_token', newToken);
    localStorage.setItem('campus_intel_auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('campus_intel_auth_token');
    localStorage.removeItem('campus_intel_auth_user');
    // Clear chat sessions on logout to maintain privacy
    localStorage.removeItem('campus_intel_chat_sessions');
  };

  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={true}>
      <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout, isLoading }}>
        {children}
      </AuthContext.Provider>
    </NextThemesProvider>
  );
}
