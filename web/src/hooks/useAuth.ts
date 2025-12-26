/**
 * Authentication Hook
 * Manages user authentication state and operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get return URL from query params
  const getReturnUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('returnUrl') || '/';
  };

  // Get current user profile
  // Auth state is determined by cookie presence (managed by backend)
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      return apiClient.getProfile();
    },
    retry: false,
    // Always try to fetch - backend will return 401 if not authenticated
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiClient.login(data),
    onSuccess: (response) => {
      // Backend returns: { message, data: { user, expires_in } }
      const user = response?.data?.user || response?.user;
      if (user) {
        queryClient.setQueryData(['user'], user);
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Redirect to returnUrl or home
      const returnUrl = getReturnUrl();
      navigate(returnUrl);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      full_name?: string;
    }) => apiClient.register(data),
    onSuccess: (response) => {
      // Backend returns: { message, data: { user, expires_in } }
      const user = response?.data?.user || response?.user;

      if (user) {
        queryClient.setQueryData(['user'], user);
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Redirect to returnUrl or home
      const returnUrl = getReturnUrl();
      navigate(returnUrl);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
      queryClient.clear();
      navigate('/login');
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isLoadingUser,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
