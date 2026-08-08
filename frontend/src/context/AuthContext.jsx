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

  const login = useCallback(async (credentials) => {
    const result = await authApi.login(credentials);
    setTokens(result);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await authApi.register(payload);
    setTokens(result);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    const storedRefreshToken = loadStoredRefreshToken();
    try {
      if (storedRefreshToken) await authApi.logout(storedRefreshToken);
    } finally {
      setTokens(null);
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (slug) => Boolean(user?.permissions?.includes(slug)),
    [user]
  );

  const hasRole = useCallback((slug) => Boolean(user?.roles?.includes(slug)), [user]);

  const value = { user, isBootstrapping, login, register, logout, hasPermission, hasRole };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
