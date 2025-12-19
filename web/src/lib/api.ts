// ============================================
// API Client - Cookie-based Authentication
// ============================================

// Import centralized config
import { API_URL, CHATBOT_URL } from './config';

// ============================================
// Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  company_name?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  role: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface ApiError {
  error: string;
  message?: string;
}

// ============================================
// HTTP-Only Cookie Management
// ============================================
// NOTE: Tokens are managed by the server via Set-Cookie headers
// Frontend does NOT store tokens - they are HTTP-only and secure
// Browsers automatically send tokens with each request

export const tokenManager = {
  // Tokens are now managed by the server
  // Frontend intentionally does NOT have access to tokens
  // This is for security - XSS attacks cannot steal HTTP-only cookies
  setTokens: () => {
    console.log('[AUTH] Tokens set by server via Set-Cookie headers');
  },

  getAccessToken: (): null => {
    // Frontend cannot access HTTP-only tokens
    return null;
  },

  getRefreshToken: (): null => {
    // Frontend cannot access HTTP-only tokens
    return null;
  },

  isRememberMe: (): boolean => {
    // Check localStorage for UI preference only
    return localStorage.getItem('rememberMe') === 'true';
  },

  setRememberMe: (value: boolean) => {
    // Store "remember me" preference for UI state only
    if (value) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }
  },

  clearTokens: () => {
    // Backend handles token clearing via logout endpoint
    // Frontend just clears local preferences
    localStorage.removeItem('rememberMe');
    console.log('[AUTH] Local preferences cleared (tokens cleared by server)');
  },
};

// ============================================
// API Request Helper
// ============================================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = API_URL
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // IMPORTANT: credentials: 'include' tells browsers to automatically send HTTP-only cookies
  // This is how frontend communicates with server without touching tokens
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Send cookies automatically with every request
  };

  console.log(`[API] ${options.method || 'GET'} ${endpoint}`);

  const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions);

  // Handle 401 - Session expired
  if (response.status === 401) {
    console.log('[API] ❌ 401 Unauthorized - Session expired');
    // Logout and redirect to login (handled by auth context)
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: 'Request failed',
    }));

    // Don't log 404 on subscription endpoint as error (expected for new users)
    if (response.status === 404 && endpoint.includes('/subscriptions/current')) {
      console.log('[API] ℹ️ 404 - No active subscription found');
    } else {
      console.error('[API] ❌ Request failed:', error);
    }

    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  console.log(`[API] ✅ ${response.status}`);
  return response.json();
}

// ============================================
// Auth API
// ============================================

// NOTE: Token refresh is handled by the server automatically
// When access token expires, client gets 401
// Server sends Set-Cookie with new accessToken via /auth/refresh endpoint
// This is transparent to frontend due to credentials: 'include' in apiRequest

export const authAPI = {
  login: async (credentials: LoginRequest, rememberMe: boolean = false): Promise<AuthResponse> => {
    console.log('[AUTH] Login request:', credentials.email);
    console.log('[AUTH] Remember me:', rememberMe);

    const response = await apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...credentials,
        // Pass rememberMe to backend so it can set appropriate token expiry
        remember_me: rememberMe,
      }),
    });

    // Backend returns: { data: { user: {...}, expires_in: 900 } }
    // Tokens are NOT in response body - they are in HTTP-only cookies
    const data: AuthResponse = {
      accessToken: '', // Not needed - handled by cookies
      refreshToken: '', // Not needed - handled by cookies
      user: response.data.user,
    };

    // Save "remember me" preference locally for UI (not tokens!)
    // Tokens are set by server via Set-Cookie headers (HTTP-only)
    tokenManager.setRememberMe(rememberMe);

    console.log('[AUTH] ✅ Login successful');
    console.log('[AUTH] Cookies set by server (HTTP-only)');
    console.log('[AUTH] User:', data.user.email, '| Role:', data.user.role);

    return data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // After registration, need to login
    return authAPI.login({
      email: userData.email,
      password: userData.password,
    });
  },

  logout: async (): Promise<void> => {
    try {
      await apiRequest<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
      console.log('[AUTH] ✅ Logout successful - tokens cleared by server');
    } catch (error) {
      console.error('[AUTH] Logout failed:', error);
      // Even if logout fails, clear local state
      throw error;
    } finally {
      // Always clear local preferences
      tokenManager.clearTokens();
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await apiRequest<{ data: User }>('/users/profile');
    return response.data;
  },
};

// ============================================
// Packages API
// ============================================

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  queryLimit: number;
  features: string[];
}

export const packagesAPI = {
  list: async (): Promise<Package[]> => {
    return apiRequest<Package[]>('/packages');
  },

  getById: async (id: string): Promise<Package> => {
    return apiRequest<Package>(`/packages/${id}`);
  },
};

// ============================================
// Subscriptions API
// ============================================

export interface Subscription {
  id: string;
  user_id: string;
  package_id: string;
  package_name?: string;
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  remaining_tokens: number;
  total_tokens: number;
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  last_token_reset_at?: string;
  next_token_reset_at?: string;
  created_at: string;
  updated_at: string;
}

export const subscriptionsAPI = {
  getCurrent: async (): Promise<Subscription | null> => {
    try {
      const response = await apiRequest<{ data: Subscription }>('/subscriptions/current');
      return response.data;
    } catch (error: any) {
      // 404 is expected for users without subscription - don't log as error
      if (error?.message?.includes('404') || error?.message?.includes('no active subscription')) {
        console.log('[SUBSCRIPTION] ℹ️ No active subscription found (this is normal for new users)');
        return null;
      }
      // Other errors should be logged
      console.error('[SUBSCRIPTION] ❌ Failed to fetch subscription:', error);
      return null;
    }
  },

  consumeTokens: async (tokenCount: number): Promise<boolean> => {
    try {
      await apiRequest('/subscriptions/consume-tokens', {
        method: 'POST',
        body: JSON.stringify({ token_count: tokenCount }),
      });
      return true;
    } catch (error) {
      console.error('Failed to consume tokens:', error);
      return false;
    }
  },
};

// ============================================
// Chatbot API
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  documents?: any[];  // Legal documents used as sources
  source?: string;    // Source type: 'faq', 'legal', 'web_search', 'chitchat'
}

export interface ChatRequest {
  message: string;
  chatHistory?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  documents?: any[];
  source?: string;
}

export const chatbotAPI = {
  sendMessageStreaming: async (
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onTokenUsage?: (tokensUsed: number) => void,
    onComplete?: (documents: any[], source: string) => void
  ): Promise<void> => {
    const backendRequest = {
      question: request.message,
      chat_history: request.chatHistory?.map(msg =>
        `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n') || '',
      faq_threshold: 0.6,
      use_parallel: true,
    };

    // NOTE: Tokens are sent via HTTP-only cookies (credentials: 'include')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(CHATBOT_URL, {
      method: 'POST',
      headers,
      credentials: 'include', // Send cookies automatically
      body: JSON.stringify(backendRequest),
    });

    if (!response.ok) {
      throw new Error(`Chatbot API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle different event types
              if (data.type === 'status') {
                // Status update - log it
                console.log('[CHAT] Status:', data.message);
              } else if (data.type === 'response_chunk' && data.chunk) {
                // Streaming chunk - send to callback
                onChunk(data.chunk);
              } else if (data.type === 'response_complete') {
                // Final response complete with documents and source
                const documents = data.documents || [];
                const source = data.source || 'unknown';
                console.log(`[CHAT] Stream complete - Source: ${source}, Documents: ${documents.length}`);
                if (onComplete) {
                  onComplete(documents, source);
                }
              } else if (data.type === 'token_usage') {
                // Token usage from backend - backend already consumed tokens
                const tokensUsed = data.tokens_used || 0;
                console.log(`[CHAT] 📊 Tokens used: ${tokensUsed} (${data.consumed ? 'consumed by backend' : 'not consumed'})`);
                if (onTokenUsage) {
                  onTokenUsage(tokensUsed);
                }
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              // Skip invalid JSON lines
              if (line.trim() && line !== 'data: ') {
                console.warn('Failed to parse SSE line:', line, e);
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    // Map frontend format to backend format
    const backendRequest = {
      question: request.message,
      chat_history: request.chatHistory?.map(msg =>
        `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n') || '',
      faq_threshold: 0.6,
      use_parallel: true,
    };

    // NOTE: Tokens are sent via HTTP-only cookies (credentials: 'include')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Fetch streaming response
    const response = await fetch(CHATBOT_URL, {
      method: 'POST',
      headers,
      credentials: 'include', // Send cookies automatically
      body: JSON.stringify(backendRequest),
    });

    if (!response.ok) {
      throw new Error(`Chatbot API error: ${response.status}`);
    }

    // Parse SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let finalResponse = '';
    let documents: any[] = [];
    let source = '';

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'response_chunk' && data.content) {
              finalResponse += data.content;
            } else if (data.type === 'response_complete') {
              finalResponse = data.response || finalResponse;
              documents = data.documents || [];
              source = data.source || '';
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) {
            // Skip invalid JSON
            continue;
          }
        }
      }
    }

    return {
      response: finalResponse || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
      documents,
      source,
    };
  },

  // Streaming support for future enhancement
  streamMessage: async function* (request: ChatRequest): AsyncGenerator<string> {
    // NOTE: Tokens are sent via HTTP-only cookies (credentials: 'include')
    const response = await fetch(`${CHATBOT_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send cookies automatically
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Streaming request failed');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      yield chunk;
    }
  },
};

// ============================================
// Admin API
// ============================================

export interface AdminUser extends User {
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  revenue: string;
}

export interface AdminStats {
  totalUsers: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  growthRate: number;
}

export const adminAPI = {
  // Users Management
  getUsers: async (page: number = 1, limit: number = 10): Promise<{ data: AdminUser[]; total: number }> => {
    return apiRequest('/admin/users', {
      method: 'GET',
    });
  },

  getUserById: async (userId: string): Promise<AdminUser> => {
    return apiRequest(`/admin/users/${userId}`);
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    return apiRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteUser: async (userId: string): Promise<void> => {
    return apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Subscriptions Management
  getSubscriptions: async (page: number = 1, limit: number = 10): Promise<{ data: Subscription[]; total: number }> => {
    return apiRequest('/admin/subscriptions', {
      method: 'GET',
    });
  },

  getSubscriptionById: async (subscriptionId: string): Promise<Subscription> => {
    return apiRequest(`/admin/subscriptions/${subscriptionId}`);
  },

  // Packages Management
  getPackages: async (): Promise<Package[]> => {
    return apiRequest('/admin/packages');
  },

  createPackage: async (data: Partial<Package>): Promise<Package> => {
    return apiRequest('/admin/packages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePackage: async (packageId: string, data: Partial<Package>): Promise<Package> => {
    return apiRequest(`/admin/packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePackage: async (packageId: string): Promise<void> => {
    return apiRequest(`/admin/packages/${packageId}`, {
      method: 'DELETE',
    });
  },

  // Stats
  getStats: async (): Promise<AdminStats> => {
    return apiRequest('/admin/stats');
  },

  // Activity Log
  getActivityLog: async (page: number = 1, limit: number = 20): Promise<any[]> => {
    return apiRequest('/admin/activity-log', {
      method: 'GET',
    });
  },
};

// ============================================
// Export default API object
// ============================================

export const api = {
  auth: authAPI,
  packages: packagesAPI,
  subscriptions: subscriptionsAPI,
  chatbot: chatbotAPI,
  admin: adminAPI,
};

export default api;
