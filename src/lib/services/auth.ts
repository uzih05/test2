/**
 * Auth API Service
 * [BYOD]
 */

import type { AuthResponse, User } from '../types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const authService = {
  async signup(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Signup failed: ${res.status}`);
    }
    return res.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Login failed: ${res.status}`);
    }
    return res.json();
  },

  async getMe(token: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to get user info');
    return res.json();
  },

  async updateApiKey(key: string | null): Promise<{ status: string; has_key: boolean }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vs_token') : null;
    const res = await fetch(`${API_BASE}/auth/api-key`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ openai_api_key: key || null }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to update API key: ${res.status}`);
    }
    return res.json();
  },
};
