import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('safebuild_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('safebuild_token');
    localStorage.removeItem('safebuild_user');
    setUser(null);
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      const token = localStorage.getItem('safebuild_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.getProfile();
        setUser(response.data);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  const login = useCallback((payload) => {
    localStorage.setItem('safebuild_token', payload.token);
    localStorage.setItem('safebuild_user', JSON.stringify(payload.user));
    setUser(payload.user);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      logout();
    };

    const onStorage = (event) => {
      if (event.key === 'safebuild_token' && !event.newValue) {
        setUser(null);
      }

      if (event.key === 'safebuild_user') {
        if (!event.newValue) {
          setUser(null);
        } else {
          try {
            setUser(JSON.parse(event.newValue));
          } catch {
            setUser(null);
          }
        }
      }
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized);
      window.removeEventListener('storage', onStorage);
    };
  }, [logout]);

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: Boolean(user) }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
