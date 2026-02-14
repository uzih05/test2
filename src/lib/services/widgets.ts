/**
 * Widget CRUD API Service
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

export interface WidgetCatalogItem {
  type: string;
  name: string;
  sizes: string[];
  default_size: string;
}

export interface Widget {
  id: string;
  widget_type: string;
  position_order: number;
  size: string;
}

export const widgetsService = {
  async getCatalog(): Promise<{ items: WidgetCatalogItem[] }> {
    const res = await fetch(`${API_BASE}/widgets/catalog`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async list(): Promise<{ items: Widget[] }> {
    const res = await fetch(`${API_BASE}/widgets`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async add(widget_type: string, size: string = 'M'): Promise<Widget> {
    const res = await fetch(`${API_BASE}/widgets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ widget_type, size }),
    });
    return handleResponse(res);
  },

  async update(id: string, data: { size?: string; position_order?: number }): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/widgets/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async remove(id: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/widgets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async reorder(widget_ids: string[]): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/widgets/reorder`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ widget_ids }),
    });
    return handleResponse(res);
  },
};
