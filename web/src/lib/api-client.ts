/**
 * EPR API Client
 * Handles all HTTP requests to EPR backend services
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL;

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = false, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    };

    // No need to add Authorization header - backend reads from HTTP-only cookie

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include', // Include cookies for session management
      });

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && requiresAuth) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request - new token is in cookie
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers,
            credentials: 'include',
          });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as any;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      // New token is automatically set in HTTP-only cookie by backend
      return response.ok;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Auth APIs
  async register(data: {
    email: string;
    password: string;
    full_name?: string;
  }) {
    const response = await this.request<any>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Token is automatically set in HTTP-only cookie by backend
    return response;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Token is automatically set in HTTP-only cookie by backend
    return response;
  }

  async logout() {
    await this.request('/api/v1/auth/logout', {
      method: 'POST',
      requiresAuth: true,
    });
    // Cookie is cleared by backend
  }

  async getProfile() {
    const response = await this.request<any>('/api/v1/users/profile', {
      requiresAuth: true,
    });
    // Backend returns: { data: user }
    return response?.data || response;
  }

  // Package APIs
  async getPackages() {
    return this.request<any[]>('/api/v1/packages');
  }

  async getPackage(id: string) {
    return this.request<any>(`/api/v1/packages/${id}`);
  }

  // Subscription APIs
  async createSubscription(packageId: string) {
    return this.request<any>('/api/v1/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ package_id: packageId }),
      requiresAuth: true,
    });
  }

  async getCurrentSubscription() {
    const response = await this.request<any>('/api/v1/subscriptions/current', {
      requiresAuth: true,
    });
    // Backend returns: { data: subscription }
    return response?.data || null;
  }

  async consumeTokens(tokens: number) {
    return this.request<any>('/api/v1/subscriptions/consume-tokens', {
      method: 'POST',
      body: JSON.stringify({ tokens }),
      requiresAuth: true,
    });
  }

  async cancelSubscription(id: string) {
    return this.request<any>(`/api/v1/subscriptions/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  // Generic GET/POST/PUT/DELETE methods
  async get<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, { requiresAuth });
  }

  async post<T>(
    endpoint: string,
    data: any,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  async put<T>(
    endpoint: string,
    data: any,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  async delete<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      requiresAuth,
    });
  }
}

// Chatbot API Client
class ChatbotAPIClient extends APIClient {
  async sendMessage(message: string, sessionId?: string) {
    // POST /api/v1/chat returns Server-Sent Events (SSE) streaming
    const url = `${this.baseURL}/api/v1/chat`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        question: message,
        session_id: sessionId,
        chat_history: "",  // Backend expects string, not array
        faq_threshold: 0.6,
        use_parallel: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let completeResponse = '';
    let sources: any[] = [];

    if (!reader) {
      throw new Error('No response body');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'response_chunk') {
              completeResponse += data.chunk || '';
            } else if (data.type === 'response_complete') {
              completeResponse = data.response || completeResponse;
              sources = data.documents || [];
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      response: completeResponse,
      sources,
      session_id: sessionId,
    };
  }

  async getChatHistory(sessionId: string) {
    return this.get<any>(`/api/v1/chat-history?session_id=${sessionId}`, true);
  }

  async getConversations() {
    const response = await this.get<any>('/api/v1/conversations', true);
    // Backend returns: { status: "success", data: [...] }
    return response?.data || [];
  }

  async getConversation(sessionId: string) {
    const response = await this.get<any>(`/api/v1/conversations/${sessionId}`, true);
    // Backend returns: { status: "success", data: {...} }
    return response?.data || null;
  }

  async deleteConversation(sessionId: string) {
    return this.delete<any>(`/api/v1/conversations/${sessionId}`, true);
  }

  async clearMemory(sessionId: string) {
    return this.post<any>('/api/v1/clear-memory', { session_id: sessionId }, true);
  }
}

// Export instances
export const apiClient = new APIClient(API_BASE_URL);
export const chatbotClient = new ChatbotAPIClient(CHATBOT_API_URL);
