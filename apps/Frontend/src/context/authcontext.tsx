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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));

  // Add type definitions for auth responses
  interface TokenResponse {
    accessToken: string;
    refreshToken: string;
  }

  interface AuthResponse {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    user: {
      _id: string;
      username: string;
      email: string;
    };
  }

  // Verify token on mount and refresh if needed
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          // Set token in axios headers
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify the token by making a request to a protected endpoint
          await axiosInstance.get('/auth/me');
          
          // Token is valid, keep user logged in
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token verification failed', error);
          
          // Try to refresh the token if we have a refresh token
          if (refreshToken) {
            try {
              const response = await axiosInstance.post<TokenResponse>('/auth/refresh-token', { refreshToken });
              
              // Update tokens in state and localStorage
              const newToken = response.data.accessToken;
              const newRefreshToken = response.data.refreshToken;
              
              localStorage.setItem('token', newToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              
              setToken(newToken);
              setRefreshToken(newRefreshToken);
              setIsAuthenticated(true);
              
              // Update axios headers with new token
              axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            } catch (refreshError) {
              console.error('Token refresh failed', refreshError);
              // Clear auth state if refresh token is invalid
              handleLogout(false);
            }
          } else {
            // No refresh token, so log out
            handleLogout(false);
          }
        }
      }
    };

    verifyToken();
  }, [token, refreshToken]);

  // Function to handle logout cleanup
  const handleLogout = async (makeRequest = true) => {
    // Only make the logout request if specified (to avoid infinite loops)
    if (makeRequest && token) {
      try {
        await axiosInstance.post('/auth/logout');
      } catch (error) {
        console.error('Logout request failed', error);
      }
    }

    // Clear state
    setToken(null);
    setRefreshToken(null);
    setUserId(null);
    setIsAuthenticated(false);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    
    // Clear axios headers
    delete axiosInstance.defaults.headers.common['Authorization'];
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', { email, password });
      
      // Extract tokens and user ID from the nested response structure
      const accessToken = response.data.tokens.accessToken;
      const refreshToken = response.data.tokens.refreshToken;
      const userId = response.data.user._id;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId);
      
      setToken(accessToken);
      setRefreshToken(refreshToken);
      setUserId(userId);
      setIsAuthenticated(true);
      
      // Set token in axios headers
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    username: string;
    instrument: string;
    admin?: boolean;
  }) => {
    try {
      let requestData;
      
        const formData = new FormData();
        formData.append('email', data.email);
        formData.append('password', data.password);
        formData.append('username', data.username);
        formData.append('instrument', data.instrument);
        if (data.admin !== undefined) {
          formData.append('admin', String(data.admin));
        }
        requestData = formData;
     
      
      const response = await axiosInstance.post<AuthResponse>('/auth/register', requestData, {
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      // Extract tokens and user ID from the nested response structure
      const accessToken = response.data.tokens.accessToken;
      const refreshToken = response.data.tokens.refreshToken;
      const userId = response.data.user._id;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId);
      
      setToken(accessToken);
      setRefreshToken(refreshToken);
      setUserId(userId);
      setIsAuthenticated(true);
      
      // Set token in axios headers
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    token,
    refreshToken,
    userId,
    isAuthenticated,
    login,
    register,
    logout: () => handleLogout(true)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}