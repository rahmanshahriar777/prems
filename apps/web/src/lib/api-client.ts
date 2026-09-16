export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      if (envUrl && envUrl.startsWith('http') && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        this.baseUrl = envUrl;
      } else {
        // Use same-origin /api/v1 which is automatically rewritten by Next.js and Nginx
        this.baseUrl = '/api/v1';
      }
    } else {
      this.baseUrl = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000/api/v1';
    }
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('ems_access_token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('ems_refresh_token');
  }

  private setTokens(accessToken: string, refreshToken?: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('ems_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('ems_refresh_token', refreshToken);
    }
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // Token compromised or expired
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ems_access_token');
          localStorage.removeItem('ems_refresh_token');
          localStorage.removeItem('ems_user');
          window.location.href = '/login';
        }
        return null;
      }

      const data = await res.json();
      const newAccessToken = data.data?.accessToken || data.accessToken;
      const newRefreshToken = data.data?.refreshToken || data.refreshToken;

      this.setTokens(newAccessToken, newRefreshToken);
      return newAccessToken;
    } catch {
      return null;
    }
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) searchParams.append(k, String(v));
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (networkErr: any) {
      // Fallback strategy: if same-origin /api/v1 failed, attempt direct backend or vice-versa
      const fallbackUrl = url.startsWith('/api/v1')
        ? `http://localhost:4000${url}`
        : (url.includes('localhost:4000/api/v1') ? url.replace('http://localhost:4000/api/v1', '/api/v1') : null);

      if (fallbackUrl && fallbackUrl !== url) {
        try {
          response = await fetch(fallbackUrl, { ...options, headers });
          if (fallbackUrl.startsWith('/api/v1')) {
            this.baseUrl = '/api/v1';
          }
        } catch {
          throw networkErr;
        }
      } else {
        throw networkErr;
      }
    }

    // Handle 401: Token expired -> Refresh Token Rotation
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        this.isRefreshing = false;

        if (newToken) {
          this.onRefreshed(newToken);
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, { ...options, headers });
        }
      } else {
        // Wait for token refresh to complete
        const retryToken = await new Promise<string>((resolve) => {
          this.addRefreshSubscriber(resolve);
        });
        headers['Authorization'] = `Bearer ${retryToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = json.error?.message || json.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return json.data !== undefined ? json.data : json;
  }

  get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  ai = {
    generate: (data: {
      prompt: string;
      systemInstruction?: string;
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }) =>
      this.post<{
        content: string;
        provider: 'gemini' | 'groq';
        model: string;
        latencyMs: number;
        failoverUsed: boolean;
        failoverReason?: string;
        usage?: {
          promptTokens?: number;
          completionTokens?: number;
          totalTokens?: number;
        };
        requestId: string;
        timestamp: string;
      }>('/ai/generate', data),
    getHealth: () => this.get<any>('/ai/health'),
    getLogs: (limit = 20) => this.get<any[]>(`/ai/logs?limit=${limit}`),
  };
}

export const api = new ApiClient();
export default api;
