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

  getIncidentStats: () => request('/incidents/stats/summary'),

  // ── Courses & Lessons ─────────────────────────────────────────────────────

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
    }),

  getAllQuizzes: () => request('/quizzes'),

  getQuizById: (quizId) => request(`/quizzes/${quizId}`),

  createQuiz: (payload) =>
    request('/quizzes', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateQuiz: (quizId, payload) =>
    request(`/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteQuiz: (quizId) =>
    request(`/quizzes/${quizId}`, {
      method: 'DELETE'
    }),

  addQuestion: (quizId, payload) =>
    request(`/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateQuestion: (quizId, questionId, payload) =>
    request(`/quizzes/${quizId}/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteQuestion: (quizId, questionId) =>
    request(`/quizzes/${quizId}/questions/${questionId}`, {
      method: 'DELETE'
    }),

  getAllAttempts: (quizId) => request(`/quiz-attempts${quizId ? `?quizId=${quizId}` : ''}`),

  submitQuizAttempt: (payload) =>
    request('/quiz-attempts', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMyAttempts: (quizId) => request(`/quiz-attempts/my-attempts${quizId ? `?quizId=${quizId}` : ''}`),

  getQuizStats: (quizId) => request(`/quiz-attempts/quiz/${quizId}/stats`),

  getAllCertificates: (quizId) => request(`/certificates${quizId ? `?quizId=${quizId}` : ''}`),

  getMyCertificates: () => request('/certificates/my-certificates'),

  verifyCertificateByCode: (code) => request(`/certificates/verify/${code}`)
};
