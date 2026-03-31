const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const request = async (path, options = {}) => {
  const token = localStorage.getItem('safebuild_token');

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Request failed');
    error.details = data.errors || [];
    throw error;
  }

  return data;
};

export const api = {
  registerEmployee: (payload) =>
    request('/users/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, role: 'worker' })
    }),

  login: (payload) =>
    request('/users/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getProfile: () => request('/users/profile'),

  // ── Incidents & Hazards ───────────────────────────────────────────────────

  createIncident: ({ address, ...rest }) =>
    request('/incidents', {
      method: 'POST',
      body: JSON.stringify({ ...rest, location: { address } })
    }),

  getIncidents: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    return request(`/incidents${qs ? `?${qs}` : ''}`);
  },

  getIncidentById: (id) => request(`/incidents/${id}`),

  updateIncident: (id, { address, ...rest }) =>
    request(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(address !== undefined ? { ...rest, location: { address } } : rest)
    }),

  deleteIncident: (id) =>
    request(`/incidents/${id}`, { method: 'DELETE' }),

  updateIncidentStatus: (id, payload) =>
    request(`/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  addIncidentComment: (id, payload) =>
    request(`/incidents/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getIncidentStats: () => request('/incidents/stats/summary')
};
