const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

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

  getCourses: () => request('/courses'),

  createCourse: (payload) =>
    request('/courses', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateCourse: (courseId, payload) =>
    request(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteCourse: (courseId) =>
    request(`/courses/${courseId}`, {
      method: 'DELETE'
    }),

  getLessonsByCourse: (courseId) => request(`/lessons/course/${courseId}`),

  createLesson: (payload) =>
    request('/lessons', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateLesson: (lessonId, payload) =>
    request(`/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteLesson: (lessonId) =>
    request(`/lessons/${lessonId}`, {
      method: 'DELETE'
    }),

  enrollInCourse: (courseId) =>
    request('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ courseId })
    }),

  getMyEnrollments: () => request('/enrollments/my-courses'),

  addPage: (lessonId, payload) =>
    request(`/lessons/${lessonId}/pages`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updatePage: (lessonId, pageId, payload) =>
    request(`/lessons/${lessonId}/pages/${pageId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deletePage: (lessonId, pageId) =>
    request(`/lessons/${lessonId}/pages/${pageId}`, {
      method: 'DELETE'
    })
};
