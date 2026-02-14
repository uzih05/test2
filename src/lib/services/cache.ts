/**
 * Cache Service
 *
 * Provides API calls for cache analytics, golden dataset management, and drift detection.
 */

import type {
  CacheAnalytics,
  GoldenRecord,
  GoldenCandidate,
  GoldenStats,
  DriftSummaryItem,
  DriftResult,
} from '../types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vs_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('vs_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const cacheService = {
  // Cache Analytics
  async getAnalytics(range: number = 60): Promise<CacheAnalytics> {
    return fetchAPI(`/cache/analytics?range=${range}`);
  },

  // Golden Dataset
  async listGolden(functionName?: string, limit: number = 50): Promise<{ items: GoldenRecord[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (functionName) params.append('function_name', functionName);
    return fetchAPI(`/cache/golden?${params}`);
  },

  async registerGolden(data: { execution_uuid: string; note: string; tags: string[] }): Promise<{ uuid: string; status: string }> {
    return fetchAPI('/cache/golden', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteGolden(uuid: string): Promise<{ uuid: string; status: string }> {
    return fetchAPI(`/cache/golden/${uuid}`, {
      method: 'DELETE',
    });
  },

  async recommendCandidates(functionName: string, limit: number = 5): Promise<{ function_name: string; candidates: GoldenCandidate[]; total: number }> {
    return fetchAPI(`/cache/golden/recommend/${encodeURIComponent(functionName)}?limit=${limit}`);
  },

  async getGoldenStats(): Promise<GoldenStats> {
    return fetchAPI('/cache/golden/stats');
  },

  // Drift Detection
  async getDriftSummary(): Promise<{ items: DriftSummaryItem[]; total: number }> {
    return fetchAPI('/cache/drift/summary');
  },

  async simulateDrift(data: { text: string; function_name: string; threshold?: number; k?: number }): Promise<DriftResult> {
    return fetchAPI('/cache/drift/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
