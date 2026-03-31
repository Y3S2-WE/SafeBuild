const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const handleUnauthorized = (response) => {
  if (response.status === 401) {
    localStorage.removeItem('safebuild_token');
    localStorage.removeItem('safebuild_user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
};

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
    handleUnauthorized(response);
    const error = new Error(data.message || data.error || 'Request failed');
    error.details = data.errors || [];
    throw error;
  }

  return data;
};

const toQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.append(key, String(value));
  });
  return query.toString() ? `?${query.toString()}` : '';
};

export const auditApi = {
  getAll: (params = {}) => request(`/audits${toQuery(params)}`),
  getById: (id) => request(`/audits/${id}`),
  create: (payload) =>
    request('/audits', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  update: (id, payload) =>
    request(`/audits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  remove: (id) =>
    request(`/audits/${id}`, {
      method: 'DELETE'
    }),
  submitExecution: (id, payload) =>
    request(`/audits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
};
