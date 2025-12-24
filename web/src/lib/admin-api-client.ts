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
};
