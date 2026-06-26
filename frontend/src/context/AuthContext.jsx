// Auth context — owns the current user, role, and login/logout/register helpers.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'anon' | 'auth'

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user || null);
      setStatus(data.user ? 'auth' : 'anon');
    } catch (err) {
      // 401 is expected when not signed in.
      if (err.status !== 401) console.warn('[auth] me failed', err);
      setUser(null);
      setStatus('anon');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
    setStatus('auth');
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setUser(data.user);
    setStatus('auth');
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setStatus('anon');
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      status,
      isAuthed: status === 'auth',
      isCustomer: user?.role === 'CUSTOMER' || user?.role === 'ADMIN',
      isVendor: user?.role === 'VENDOR' || user?.role === 'ADMIN',
      isAdmin: user?.role === 'ADMIN',
      refresh,
      login,
      register,
      logout,
      setUser,
    }),
    [user, status, refresh, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}