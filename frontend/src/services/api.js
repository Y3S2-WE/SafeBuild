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

  getProfile: () => request('/users/profile')
};
