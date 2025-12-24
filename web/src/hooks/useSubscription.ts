/**
 * Subscription Hook
 * Manages user subscription and token usage
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Subscription {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  remaining_tokens: number;  // Backend returns "remaining_tokens"
  total_tokens: number;
  current_period_start: string;
  current_period_end: string;  // Subscription renewal date (30 days, 1 year, etc.)
  auto_renew: boolean;
  last_token_reset_at?: string;  // Last time tokens were reset
  next_token_reset_at?: string;  // Next token reset date (7 days cycle)
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const queryClient = useQueryClient();

  // Get current subscription
  const { data: subscription, isLoading, error } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: () => apiClient.getCurrentSubscription(),
    retry: 1,
  });

  // Create subscription mutation
  const createMutation = useMutation({
    mutationFn: (packageId: string) => apiClient.createSubscription(packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  // Consume tokens mutation
  const consumeTokensMutation = useMutation({
    mutationFn: (tokens: number) => apiClient.consumeTokens(tokens),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.cancelSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  return {
    subscription,
    isLoading,
    error,
    createSubscription: createMutation.mutate,
    consumeTokens: consumeTokensMutation.mutate,
    cancelSubscription: cancelMutation.mutate,
    isCreating: createMutation.isPending,
    isConsuming: consumeTokensMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}
