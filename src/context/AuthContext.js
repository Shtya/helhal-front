'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchUser = async () => {
    try {
      setLoadingUser(true);
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const setCurrentUser = (input) => {
    try {
      const parsed = typeof input === 'string' ? JSON.parse(input) : input;
      setUser(parsed);
    } catch (err) {
      console.error('Invalid user input:', err);
      setUser(null);
    }
  };

  const login = async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials);
      const { accessToken, refreshToken, user } = res.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    console.log('Logging out user...');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const updateTokens = ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loadingUser,
        setCurrentUser,
        refetchUser: fetchUser,
        logout,
        login,
        updateTokens
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
