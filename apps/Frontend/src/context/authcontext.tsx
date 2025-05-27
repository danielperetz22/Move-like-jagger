import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosinstance';

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    username: string;
    instrument: string;
    profileImage?: File;
    admin?: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

type AuthProviderProps = { children: React.ReactNode };

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));

  const isAuthenticated = Boolean(token);

  const saveAuth = (accessToken: string, newRefreshToken: string, _id: string) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('userId', _id);
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
    setUserId(_id);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  };

  useEffect(() => {
    async function tryRefresh() {
      if (!refreshToken) return;
      try {
        const resp = await axiosInstance.post<{
          tokens: { accessToken: string; refreshToken: string };
          _id: string;
        }>('/auth/refresh', { refreshToken });

        const { accessToken: newAccessToken, refreshToken: newRt } = resp.data.tokens;
        saveAuth(newAccessToken, newRt, resp.data._id);
      } catch {
        localStorage.clear();
        setToken(null);
        setRefreshToken(null);
        setUserId(null);
        delete axiosInstance.defaults.headers.common['Authorization'];
      }
    }

    tryRefresh();
  }, [refreshToken]);

  const login = async (email: string, password: string) => {
    const resp = await axiosInstance.post<{
      user: { _id: string };
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/login', { email, password });

    const { accessToken: newAccessToken, refreshToken: newRt } = resp.data.tokens;
    saveAuth(newAccessToken, newRt, resp.data.user._id);
  };

  const register = async (data: {
    email: string;
    password: string;
    username: string;
    instrument: string;
    profileImage?: File;
    admin?: boolean;
  }) => {
    const form = new FormData();
    form.append('email', data.email);
    form.append('password', data.password);
    form.append('username', data.username);
    form.append('instrument', data.instrument);
    if (data.admin) form.append('admin', 'true');
    if (data.profileImage) form.append('profileImage', data.profileImage);

    const resp = await axiosInstance.post<{
      user: { _id: string };
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/register', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const { accessToken: newAccessToken, refreshToken: newRt } = resp.data.tokens;
    saveAuth(newAccessToken, newRt, resp.data.user._id);
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await axiosInstance.post('/auth/logout', { refreshToken });
      }
    } finally {
      localStorage.clear();
      setToken(null);
      setRefreshToken(null);
      setUserId(null);
      delete axiosInstance.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        userId,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}