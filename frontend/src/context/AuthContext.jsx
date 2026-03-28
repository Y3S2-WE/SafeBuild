import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        localStorage.removeItem('safebuild_token');
        localStorage.removeItem('safebuild_user');
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  const login = (payload) => {
    localStorage.setItem('safebuild_token', payload.token);
    localStorage.setItem('safebuild_user', JSON.stringify(payload.user));
    setUser(payload.user);
  };

  const logout = () => {
    localStorage.removeItem('safebuild_token');
    localStorage.removeItem('safebuild_user');
    setUser(null);
  };

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
