/**
 * GitHub Integration API Service
 */

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

export interface GitHubRepo {
  full_name: string;
  name: string;
  owner: string;
  private: boolean;
  description: string | null;
  language: string | null;
  updated_at: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  author: string;
  author_avatar: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  labels: { name: string; color: string }[];
  reviewers: string[];
  html_url: string;
}

export const githubService = {
  async saveToken(token: string): Promise<{ status: string; username: string }> {
    const res = await fetch(`${API_BASE}/github/token`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token }),
    });
    return handleResponse(res);
  },

  async deleteToken(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/github/token`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getStatus(): Promise<{ connected: boolean; username?: string }> {
    const res = await fetch(`${API_BASE}/github/status`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async listRepos(page = 1): Promise<{ items: GitHubRepo[] }> {
    const res = await fetch(`${API_BASE}/github/repos?page=${page}&per_page=50`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async listPulls(
    owner: string,
    repo: string,
    state = 'all',
    page = 1,
  ): Promise<{ items: GitHubPR[] }> {
    const res = await fetch(
      `${API_BASE}/github/repos/${owner}/${repo}/pulls?state=${state}&page=${page}&per_page=30`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(res);
  },
};
