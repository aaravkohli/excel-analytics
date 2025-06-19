// src/utils/api.ts

const API_BASE = import.meta.env.VITE_API_URL || "";

// Helper to handle JSON responses and errors
type FetchOptions = RequestInit & { token?: string };

function isHeadersInstance(headers: any): headers is Headers {
  return typeof Headers !== 'undefined' && headers instanceof Headers;
}

function headersToObject(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (typeof headers === 'object' && !Array.isArray(headers)) {
    return { ...headers } as Record<string, string>;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  if (isHeadersInstance(headers)) {
    const obj: Record<string, string> = {};
    (headers as any).forEach((value: string, key: string) => {
      obj[key] = value;
    });
    return obj;
  }
  return {};
}

async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headersToObject(options.headers),
  };
  // Always use token from localStorage unless explicitly provided
  const token = options.token || localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Prefix with API_BASE if not already absolute
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const res = await fetch(fullUrl, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || res.statusText);
  }
  return res.json();
}

// --- Upload History ---
export async function getUserFiles(token?: string) {
  return apiFetch<{ data: { files: any[] } }>(`/api/file/my-files`, { token });
}

export async function getFileAnalyses(fileId: string, token?: string) {
  return apiFetch<{ data: { history: any[] } }>(`/api/analysis/file/${fileId}/history`, { token });
}

// --- Admin Panel ---
export async function getAllUsers(token?: string) {
  return apiFetch<{ data: { users: any[] } }>(`/api/user/`, { token });
}

export async function updateUser(userId: string, body: any, token?: string) {
  return apiFetch<{ data: { user: any } }>(`/api/user/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    token,
  });
}

export async function getUserStats(token?: string) {
  return apiFetch<{ data: { stats: any } }>(`/api/user/stats/overview`, { token });
}

export async function getActivityStats(token?: string) {
  return apiFetch<{ data: { fileStats: any[]; analysisStats: any[] } }>(`/api/user/stats/activity`, { token });
}

export async function getStorageStats(token?: string) {
  return apiFetch<{ data: { stats: any[] } }>(`/api/user/stats/storage`, { token });
}

// --- Download Analysis ---
export async function downloadAnalysis(analysisId: string, token?: string) {
  const res = await fetch(`${API_BASE}/api/analysis/${analysisId}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download analysis');
  return res.blob();
}

// --- Auth ---
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // so cookie is set
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || res.statusText);
  }
  return res.json(); // { status, token, data: { user } }
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/file/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || res.statusText);
  }
  return res.json();
}

export async function getProfile(token?: string) {
  return apiFetch<{ data: { user: any } }>(`/api/user/profile`, { token });
}

// --- Analysis & AI Insights ---
export async function getAnalysisInsights(analysisId: string, token?: string) {
  return apiFetch<{ data: { insights: string[] } }>(`/api/analysis/${analysisId}/insights`, { token });
}

export async function createAnalysis(body: any, token?: string) {
  return apiFetch<{ data: { analysis: any } }>(`/api/analysis`, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getAnalysisChart(analysisId: string, token?: string) {
  return apiFetch<{ data: { chartData: any } }>(`/api/analysis/${analysisId}/chart`, { token });
}

export async function exportAnalysis(analysisId: string, token?: string) {
  const res = await fetch(`${API_BASE}/api/analysis/${analysisId}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to export analysis');
  return res.blob();
}

// --- File Preview ---
export async function getFilePreview(fileId: string, token?: string) {
  return apiFetch<{ data: { headers: string[]; rows: any[][] } }>(`/api/file/${fileId}/preview`, { token });
}

// --- Admin Applications ---
export async function getPendingAdmins(token?: string) {
  return apiFetch<{ data: { users: any[] } }>(`/api/user/pending-admins`, { token });
}

export async function approveAdmin(userId: string, token?: string) {
  return apiFetch<{ data: { user: any } }>(`/api/user/approve-admin/${userId}`, {
    method: 'POST',
    token,
  });
}

export async function rejectAdmin(userId: string, token?: string) {
  return apiFetch<{ data: { user: any } }>(`/api/user/reject-admin/${userId}`, {
    method: 'POST',
    token,
  });
}

export async function register(name: string, email: string, password: string, adminApplication?: { details?: string }) {
  const body: any = { name, email, password };
  if (adminApplication && adminApplication.details) {
    body.applyForAdmin = true;
    body.adminReason = adminApplication.details;
  }
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || res.statusText);
  }
  return res.json(); // { status, token, data: { user } }
} 