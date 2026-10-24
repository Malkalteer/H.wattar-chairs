import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const fetchMe = async () => {
    if (!token) return null;
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch (error) {
      setUser(null);
      setToken(null);
      return null;
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token]);

  const login = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', payload);
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', payload);
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const resendVerification = async () => {
    const { data } = await api.post('/auth/resend-verification');
    return data;
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, fetchMe, setUser, resendVerification }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
