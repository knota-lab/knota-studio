import { useLocalStorageState } from 'ahooks';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getCurrentUser, login as loginRequest } from '@/api/auth';
import { tokenKey } from '@/api/client';
import { clearAllI18nCaches } from '@/i18n';
import type { CurrentUserResponse } from '@/types/api';

type AuthContextValue = {
  user: CurrentUserResponse | null;
  token: string | undefined;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    captcha?: { token: string; answer: string },
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useLocalStorageState<string | undefined>(tokenKey);
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  const clearAuthState = useCallback(() => {
    setToken(undefined);
    setUser(null);
    window.localStorage.removeItem(tokenKey);
    clearAllI18nCaches();
  }, [setToken]);

  const logout = useCallback(() => {
    clearAuthState();
    window.location.href = '/login';
  }, [clearAuthState]);

  useEffect(() => {
    let active = true;

    if (!token) {
      setUser(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const validateUser = async () => {
      setLoading(true);

      const currentUser = await getCurrentUser();

      if (active) {
        setUser(currentUser);
      }
      setLoading(false);
    };

    void validateUser();

    return () => {
      active = false;
    };
  }, [token]);

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string,
      captcha?: { token: string; answer: string },
    ) => {
      setLoading(true);

      const response = await loginRequest(email, password, captcha);
      setToken(response.token);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    },
    [setToken],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      refreshUser,
      loading,
    }),
    [loading, login, logout, refreshUser, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
