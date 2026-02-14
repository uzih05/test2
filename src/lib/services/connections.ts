/**
 * Connection CRUD API Service
 * [BYOD]
 */

import type { WeaviateConnection, ConnectionCreateRequest, ConnectionTestRequest } from '../types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vs_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API Error: ${res.status}`);
  }
  return res.json();
}

export const connectionsService = {
  async list(): Promise<{ items: WeaviateConnection[]; total: number }> {
    const res = await fetch(`${API_BASE}/connections`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async create(data: ConnectionCreateRequest): Promise<WeaviateConnection> {
    const res = await fetch(`${API_BASE}/connections`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async update(id: string, data: Partial<ConnectionCreateRequest>): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/connections/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async remove(id: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/connections/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async activate(id: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/connections/${id}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async test(data: ConnectionTestRequest): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/connections/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateApiKey(connectionId: string, key: string): Promise<{ status: string; has_key: boolean }> {
    const res = await fetch(`${API_BASE}/connections/${connectionId}/api-key`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ openai_api_key: key }),
    });
    return handleResponse(res);
  },

  async deleteApiKey(connectionId: string): Promise<{ status: string; has_key: boolean }> {
    const res = await fetch(`${API_BASE}/connections/${connectionId}/api-key`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
