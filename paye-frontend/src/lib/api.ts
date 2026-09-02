// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '78.31.235.12:5000/api';

/**
 * Helper to get authorization headers.
 * Retrieves the token from localStorage or your state manager.
 */
const getAuthHeaders = (): HeadersInit => {
  const storedData = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null;
  
  let token = null;

  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData);
      // Based on your JSON, the token is nested inside state.token
      token = parsedData.state?.token;
    } catch (e) {
      console.error("Failed to parse auth-storage:", e);
    }
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const apiClient = {
  async get(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async put(endpoint: string, body: unknown) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async post(endpoint: string, body: unknown) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async patch(endpoint: string, body: unknown) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async delete(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },
};

/**
 * Unified response handler to keep code DRY
 */
async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'API Request failed');
  }
  return res.json();
}

/*
 * Chat API endpoints
 */
export const chatApi = {
  async getConversations() {
    return apiClient.get("/chat/conversations");
  },
  async getMessages(sessionId: string) {
    return apiClient.get(`/chat/${sessionId}`);
  },
};
