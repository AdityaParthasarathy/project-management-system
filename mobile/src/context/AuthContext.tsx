import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { getMe, login as loginApi, logout as logoutApi, register as registerApi } from '@/services/auth';
import { getToken, removeToken, saveRefreshToken, saveToken } from '@/services/authStorage';
import { clearCache } from '@/services/cache';
import { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await removeToken();
    await clearCache();
    setToken(null);
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    setLoading(true);

    try {
      const storedToken = await getToken();

      if (!storedToken || storedToken === 'undefined' || storedToken === 'null') {
        setUser(null);
        setToken(null);
        return;
      }

      setToken(storedToken);
      const currentUser = await getMe();
      setUser(currentUser);
    } catch (error: any) {
      await clearSession();

      if (error?.status === 401) {
        Alert.alert('Session expired', 'Your session has expired. Please log in again.');
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginApi(email, password);
    await saveToken(response.token);
    await saveRefreshToken(response.refreshToken);
    setToken(response.token);
    const currentUser = await getMe();
    setUser(currentUser);
    router.replace('/');
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const response = await registerApi(fullName, email, password);
    await saveToken(response.token);
    await saveRefreshToken(response.refreshToken);
    setToken(response.token);
    const currentUser = await getMe();
    setUser(currentUser);
    router.replace('/');
  }, []);

  const logout = useCallback(async () => {
    try {
      const storedToken = await getToken();
      if (storedToken) {
        try {
          await logoutApi();
        } catch {
          // Ignore backend logout errors and continue clearing client session.
        }
      }
    } finally {
      await clearSession();
      router.replace('/login');
    }
  }, [clearSession]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, restoreSession }),
    [user, token, loading, login, register, logout, restoreSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
