'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchUser = async () => {
    const access = localStorage.getItem('accessToken');
    if (!access) { setLoadingUser(false); return; }

    try {
      setLoadingUser(true);
      const res = await api.get('/auth/me');
      setUser(res.data);
      return res.data;
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
      return { accessToken, refreshToken, user }
    } catch (err) {
      throw err;
    }
  };

  async function logout() {
    console.log('Logging out user...');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    //remove login data at cookie
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    setUser(null);
  };

  const updateTokens = ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  };

  const role = user?.role || 'guest';

  //sync shared data between accounts
  useEffect(() => {
    if (!user || !user.relatedUsers?.length) return;

    const personFields = [
      'username', 'email', 'pendingEmail', 'pendingEmailCode',
      'lastEmailChangeSentAt', 'password', 'type', 'phone',
      'countryCode', 'isPhoneVerified', 'lastLogin', 'devices',
      'googleId', 'appleId', 'resetPasswordToken', 'lastResetPasswordSentAt',
      'resetPasswordExpires', 'otpCode', 'otpLastSentAt', 'otpExpiresAt',
      'referralCode', 'languages', 'country', 'countryId',
      'permissions', 'status', 'deactivatedAt', 'nationalId'
    ];

    setUser(prev => {
      const sharedData = {};
      personFields.forEach(field => {
        sharedData[field] = prev[field];
      });

      return {
        ...prev,
        relatedUsers: prev.relatedUsers.map(related => ({
          ...related,
          ...sharedData
        }))
      };
    });

  }, [
    user?.username, user?.email, user?.pendingEmail, user?.pendingEmailCode,
    user?.lastEmailChangeSentAt, user?.password, user?.type, user?.phone,
    user?.countryCode, user?.isPhoneVerified, user?.lastLogin, user?.devices,
    user?.googleId, user?.appleId, user?.resetPasswordToken, user?.lastResetPasswordSentAt,
    user?.resetPasswordExpires, user?.otpCode, user?.otpLastSentAt, user?.otpExpiresAt,
    user?.referralCode, user?.languages, user?.countryId,
    user?.permissions, user?.status, user?.deactivatedAt, user?.nationalId
  ]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
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
