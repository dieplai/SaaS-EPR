"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User, tokenManager } from '@/lib/api';

// ============================================
// Types
// ============================================

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    company_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  refreshUser: () => Promise<void>;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[AUTH] ===== Checking Auth (HTTP-only cookies) =====');

      // Try to get user profile
      // If user is logged in, browser will automatically send HTTP-only cookies
      // (Browsers auto-send cookies set by server, thanks to credentials: 'include')
      console.log('[AUTH] Fetching user profile...');
      const profile = await api.auth.getProfile();

      console.log('[AUTH] ✅ Profile loaded successfully');
      console.log('[AUTH] User ID:', profile.id);
      console.log('[AUTH] User Email:', profile.email);
      console.log('[AUTH] User Role:', profile.role);
      setUser(profile);
    } catch (error) {
      console.log('[AUTH] ℹ️ Not authenticated (cookies not present or expired)');
      // User is not authenticated - this is normal on page load
      // Just set user to null, don't log as error
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      console.log('[AUTH] ===== Login Request =====');
      console.log('[AUTH] Email:', email);
      console.log('[AUTH] Remember Me:', rememberMe);

      const response = await api.auth.login({ email, password }, rememberMe);

      console.log('[AUTH] ✅ Login successful');
      console.log('[AUTH] User ID:', response.user.id);
      console.log('[AUTH] User Email:', response.user.email);
      console.log('[AUTH] User Role:', response.user.role);
      console.log('[AUTH] 🍪 Tokens set by server via Set-Cookie headers (HTTP-only)');

      // Set user in state
      setUser(response.user);
    } catch (error) {
      console.error('[AUTH] ❌ Login failed:', error);
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    company_name?: string;
  }) => {
    try {
      const response = await api.auth.register(data);
      setUser(response.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('[AUTH] ===== Logout Request =====');
      await api.auth.logout();
      console.log('[AUTH] ✅ Logout successful - server cleared cookies');
    } catch (error) {
      console.error('[AUTH] ❌ Logout failed:', error);
    } finally {
      // Always clear local state (tokens are cleared by server)
      tokenManager.clearTokens();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      console.log('[AUTH] Refreshing user profile...');
      const profile = await api.auth.getProfile();
      setUser(profile);
      console.log('[AUTH] ✅ User refreshed:', profile.email);
    } catch (error) {
      console.log('[AUTH] ℹ️ Failed to refresh user (not authenticated)');
      // User is not authenticated anymore
      setUser(null);
    }
  };

  const isAdmin = user?.role === 'admin';

  const hasRole = (role: string) => user?.role === role;

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin,
    hasRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
