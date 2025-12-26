import { apiClient } from './api-client';

export interface AdminPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  token_limit: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
}

export interface CreatePackageRequest {
  name: string;
  description: string;
  price: number;
  token_limit: number;
  duration_days: number;
  features: string[];
}

export interface UpdatePackageRequest extends CreatePackageRequest {
  is_active: boolean;
}

export interface TokenResetSettings {
  enabled: boolean;
  cycle_days: number;
}

export interface FreeAccountSettings {
  token_limit: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  company_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'manager';
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role?: 'user' | 'admin' | 'manager';
}

export interface UpdateUserRequest {
  full_name?: string;
  phone?: string;
  company?: string;
}

export interface ChangeRoleRequest {
  role: 'user' | 'admin' | 'manager';
}

export const adminApiClient = {
  // Package Management
  packages: {
    list: async (): Promise<AdminPackage[]> => {
      const response = await apiClient.get<any>('/api/v1/packages', false);
      return response.data || response;
    },

    getById: async (id: string): Promise<AdminPackage> => {
      const response = await apiClient.get<any>(`/api/v1/packages/${id}`, false);
      return response.data || response;
    },

    create: async (data: CreatePackageRequest): Promise<{ package_id: string }> => {
      const response = await apiClient.post<any>('/api/v1/admin/packages', data, true);
      return response;
    },

    update: async (id: string, data: UpdatePackageRequest): Promise<void> => {
      await apiClient.put<any>(`/api/v1/admin/packages/${id}`, data, true);
    },

    delete: async (id: string): Promise<void> => {
      await apiClient.delete<any>(`/api/v1/admin/packages/${id}`, true);
    },
  },

  // System Settings
  settings: {
    tokenReset: {
      get: async (): Promise<TokenResetSettings> => {
        const response = await apiClient.get<any>('/api/v1/admin/settings/token-reset', true);
        return response.data || response;
      },

      update: async (data: TokenResetSettings): Promise<void> => {
        await apiClient.put<any>('/api/v1/admin/settings/token-reset', data, true);
      },
    },

    freeAccount: {
      get: async (): Promise<FreeAccountSettings> => {
        const response = await apiClient.get<any>('/api/v1/admin/settings/free-account', true);
        return response.data || response;
      },

      update: async (data: FreeAccountSettings): Promise<void> => {
        await apiClient.put<any>('/api/v1/admin/settings/free-account', data, true);
      },
    },
  },

  // User Management
  users: {
    list: async (): Promise<AdminUser[]> => {
      const response = await apiClient.get<any>('/api/v1/admin/users', true);
      return response.data || response;
    },

    create: async (data: CreateUserRequest): Promise<{ user_id: string }> => {
      const response = await apiClient.post<any>('/api/v1/admin/users', data, true);
      return response;
    },

    update: async (id: string, data: UpdateUserRequest): Promise<void> => {
      await apiClient.put<any>(`/api/v1/admin/users/${id}`, data, true);
    },

    changeRole: async (id: string, data: ChangeRoleRequest): Promise<void> => {
      await apiClient.patch<any>(`/api/v1/admin/users/${id}/role`, data, true);
    },

    delete: async (id: string): Promise<void> => {
      await apiClient.delete<any>(`/api/v1/admin/users/${id}`, true);
    },
  },
};
