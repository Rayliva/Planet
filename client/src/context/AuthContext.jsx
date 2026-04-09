import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext(null);

const GUEST_USER = { id: 'guest', guest: true, display_name: 'Explorer', email: null };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedGuest = localStorage.getItem('planet-guest');
    if (savedGuest === 'true') {
      setUser(GUEST_USER);
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then((data) => setUser(data?.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.removeItem('planet-guest');
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    const data = await api.post('/auth/register', { email, password, displayName });
    localStorage.removeItem('planet-guest');
    setUser(data.user);
    return data;
  }, []);

  const loginAsGuest = useCallback(() => {
    localStorage.setItem('planet-guest', 'true');
    setUser(GUEST_USER);
  }, []);

  const logout = useCallback(async () => {
    if (user?.guest) {
      localStorage.removeItem('planet-guest');
    } else {
      await api.post('/auth/logout');
    }
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
