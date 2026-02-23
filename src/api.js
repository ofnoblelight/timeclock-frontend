import { getToken, clearAuth } from './auth';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.reload();
    throw new Error('Unauthorized');
  }

  if (res.status === 403) {
    const data = await res.json();
    if (data.code === 'TRIAL_EXPIRED') throw new Error('TRIAL_EXPIRED');
    if (data.code === 'SUB_CANCELLED') throw new Error('SUB_CANCELLED');
    throw new Error(data.error || 'Forbidden');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  // CSV export returns text
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    return res.text();
  }

  return res.json();
}

// ── Auth ──
export const authRefresh = (token) =>
  request('/api/auth/refresh', { method: 'POST', body: JSON.stringify({ token }) });

// ── Punch ──
export const getPunchStatus = () =>
  request('/api/punch/status');

export const punchIn = () =>
  request('/api/punch/in', { method: 'POST' });

export const punchOut = (notes) =>
  request('/api/punch/out', { method: 'POST', body: JSON.stringify({ notes }) });

// ── Entries ──
export const getMyEntries = (start, end, page = 1) => {
  const params = new URLSearchParams({ page });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  return request(`/api/entries/mine?${params}`);
};

export const getAllEntries = (start, end, userId, page = 1) => {
  const params = new URLSearchParams({ page });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  if (userId) params.set('user_id', userId);
  return request(`/api/entries/all?${params}`);
};

export const editEntry = (id, data) =>
  request(`/api/entries/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteEntry = (id) =>
  request(`/api/entries/${id}`, { method: 'DELETE' });

export const createManualEntry = (data) =>
  request('/api/entries/manual', { method: 'POST', body: JSON.stringify(data) });

// ── Admin ──
export const getUsers = () =>
  request('/api/admin/users');

export const updateUser = (id, data) =>
  request(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const getOrg = () =>
  request('/api/admin/org');

// ── Export ──
export const exportCsv = (start, end, userId) => {
  const params = new URLSearchParams({ start, end });
  if (userId) params.set('user_id', userId);
  return request(`/api/export/csv?${params}`);
};

// Helper: download CSV string as file
export function downloadCsv(csvText, filename) {
  const blob = new Blob([csvText], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
