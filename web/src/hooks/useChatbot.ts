/**
 * Chatbot Hook
 * Manages chatbot conversations and messages
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatbotClient } from '@/lib/api-client';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface Conversation {
  session_id: string;
  title?: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export function useChatbot(sessionId?: string) {
  const queryClient = useQueryClient();

  // Get conversations list
  const { data: conversations, isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => chatbotClient.getConversations(),
  });

  // Get specific conversation
  const { data: conversation, isLoading: isLoadingConversation } = useQuery<Conversation>({
    queryKey: ['conversation', sessionId],
    queryFn: () => chatbotClient.getConversation(sessionId!),
    enabled: !!sessionId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { message: string; sessionId?: string }) =>
      chatbotClient.sendMessage(data.message, data.sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] });
      }
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: (sessionId: string) => chatbotClient.deleteConversation(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Clear memory mutation
  const clearMemoryMutation = useMutation({
    mutationFn: (sessionId: string) => chatbotClient.clearMemory(sessionId),
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] });
      }
    },
  });

  return {
    conversations: conversations || [],
    conversation,
    isLoadingConversations,
    isLoadingConversation,
    sendMessage: sendMessageMutation.mutate,
    deleteConversation: deleteConversationMutation.mutate,
    clearMemory: clearMemoryMutation.mutate,
    isSending: sendMessageMutation.isPending,
    isDeleting: deleteConversationMutation.isPending,
    isClearing: clearMemoryMutation.isPending,
    sendError: sendMessageMutation.error,
  };
}
