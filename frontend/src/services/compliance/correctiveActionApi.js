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

export const correctiveActionApi = {
  getAll: (params = {}) => request(`/corrective-actions${toQuery(params)}`),
  getStats: () => request('/corrective-actions/stats'),
  getById: (id) => request(`/corrective-actions/${id}`),
  uploadCompletionDocument: async (id, file) => {
    const token = localStorage.getItem('safebuild_token');
    const formData = new FormData();
    formData.append('reportFile', file);

    const response = await fetch(`${BASE_URL}/corrective-actions/${id}/completion-document`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      handleUnauthorized(response);
      const error = new Error(data.message || data.error || 'Upload failed');
      error.details = data.errors || [];
      throw error;
    }

    return data;
  },
  update: (id, payload) =>
    request(`/corrective-actions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  remove: (id) =>
    request(`/corrective-actions/${id}`, {
      method: 'DELETE'
    })
};
