/**
 * Packages Hook
 * Manages subscription packages
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  token_limit: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePackages() {
  const { data: packages, isLoading, error } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: () => apiClient.getPackages(),
  });

  return {
    packages: packages || [],
    isLoading,
    error,
  };
}

export function usePackage(id: string) {
  const { data: packageData, isLoading, error } = useQuery<Package>({
    queryKey: ['package', id],
    queryFn: () => apiClient.getPackage(id),
    enabled: !!id,
  });

  return {
    package: packageData,
    isLoading,
    error,
  };
}
