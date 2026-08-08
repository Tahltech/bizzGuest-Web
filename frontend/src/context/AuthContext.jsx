import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth.js';
import { loadStoredRefreshToken, setTokens } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const storedRefreshToken = loadStoredRefreshToken();
      if (!storedRefreshToken) {
        setIsBootstrapping(false);
        return;
      }
      try {
        const tokens = await authApi.refresh(storedRefreshToken);
        setTokens(tokens);
        setUser(tokens.user);
      } catch {
        setTokens(null);
      } finally {
        setIsBootstrapping(false);
      }
    }
    bootstrap();
  }, []);

  const applyAuthResult = useCallback((result) => {
    setTokens(result);
    setUser(result.user);
    return result.user;
  }, []);

  const login = useCallback(async (credentials) => applyAuthResult(await authApi.login(credentials)), [applyAuthResult]);
  const register = useCallback(async (payload) => applyAuthResult(await authApi.register(payload)), [applyAuthResult]);

  const logout = useCallback(async () => {
    const storedRefreshToken = loadStoredRefreshToken();
    try {
      if (storedRefreshToken) await authApi.logout(storedRefreshToken);
    } finally {
      setTokens(null);
      setUser(null);
    }
  }, []);

  /** Shallow-merges fields (e.g. a new fullName) into the in-memory user after a profile edit — no new tokens needed since roles/permissions didn't change. */
  const patchUser = useCallback((fields) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
  }, []);

  const hasPermission = useCallback(
    (slug) => Boolean(user?.permissions?.includes(slug)),
    [user]
  );

  const hasRole = useCallback((slug) => Boolean(user?.roles?.includes(slug)), [user]);

  const value = { user, isBootstrapping, login, register, logout, applyAuthResult, patchUser, hasPermission, hasRole };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
