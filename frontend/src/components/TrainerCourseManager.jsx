import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Pencil, Plus, RefreshCcw, Trash2, X } from 'lucide-react';
import { api } from '../services/api';
import { ConfirmDialog } from './ConfirmDialog';

const categoryOptions = [
  'PPE',
  'Electrical Safety',
  'Working at Heights',
  'Fire Safety',
  'First Aid',
  'Hazardous Materials',
  'Machine Safety',
  'Confined Spaces',
  'Other'
];

const levelOptions = ['Beginner', 'Intermediate', 'Advanced'];
const statusOptions = ['Draft', 'Published'];

const initialForm = {
  title: '',
  category: 'PPE',
  description: '',
  level: 'Beginner',
  duration: 1,
  status: 'Draft'
};

const initialLessonForm = {
  title: '',
  description: '',
  orderIndex: 1,
  duration: 10
};

export const TrainerCourseManager = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const [coursePendingDelete, setCoursePendingDelete] = useState(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const formTitle = useMemo(() => {
    return editingCourseId ? 'Update Existing Course' : 'Create New Course';
  }, [editingCourseId]);

  const totalCourses = courses.length;
  const publishedCourses = useMemo(() => courses.filter((course) => course.status === 'Published').length, [courses]);
  const draftCourses = totalCourses - publishedCourses;

  const statusStats = useMemo(() => {
    return statusOptions.map((status) => ({
      label: status,
      count: courses.filter((course) => course.status === status).length
    }));
  }, [courses]);

  const categoryStats = useMemo(() => {
    const counts = courses.reduce((acc, course) => {
      const key = course.category || 'Other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [courses]);

  const maxCategoryCount = useMemo(() => {
    return categoryStats.reduce((max, item) => Math.max(max, item.count), 0);
  }, [categoryStats]);

  const loadCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getCourses();
      setCourses(response.data || []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' ? Number(value) : value
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingCourseId('');
  };

  const handleEdit = (course) => {
    setError('');
    setSuccess('');
    setEditingCourseId(course._id);
    setFormData({
      title: course.title,
      category: course.category,
      description: course.description,
      level: course.level,
      duration: course.duration,
      status: course.status
    });
  };

  const requestDelete = (course) => {
    setCoursePendingDelete(course);
  };

  const handleDelete = async () => {
    if (!coursePendingDelete) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      setIsDeleteSubmitting(true);
      await api.deleteCourse(coursePendingDelete._id);
      setSuccess('Course deleted successfully');
      if (editingCourseId === coursePendingDelete._id) {
        resetForm();
      }
      await loadCourses();
      setCoursePendingDelete(null);
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete course');
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Course title is required';
    if (!formData.description.trim()) return 'Course description is required';
    if (!formData.duration || Number(formData.duration) < 0.5) return 'Duration must be at least 0.5 hours';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const payload = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      duration: Number(formData.duration)
    };

    try {
      setIsSubmitting(true);
      if (editingCourseId) {
        await api.updateCourse(editingCourseId, payload);
        setSuccess('Course updated successfully');
      } else {
        await api.createCourse(payload);
        setSuccess('Course created successfully');
      }

      resetForm();
      await loadCourses();
    } catch (requestError) {
      setError(requestError.message || 'Failed to save course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink-900">Trainer Course Manager</h2>
          <p className="mt-1 text-sm text-ink-800">Create, update, publish, and remove your training courses.</p>
        </div>
        <button
          type="button"
          onClick={loadCourses}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
        >
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-ink-900">Course Statistics</h3>
            <p className="mt-1 text-sm text-ink-800">Live distribution of your courses by status and category.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800">Total: {totalCourses}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Published: {publishedCourses}</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Draft: {draftCourses}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-white/90 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Status Mix</p>
            <div className="mt-3 space-y-2.5">
              {statusStats.map((item) => {
                const width = totalCourses > 0 ? (item.count / totalCourses) * 100 : 0;

                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-ink-800">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
                      <div
                        className={`h-full rounded-full ${item.label === 'Published' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-brand-100 bg-white/90 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Top Categories</p>
            {categoryStats.length === 0 ? (
              <p className="mt-3 text-sm text-ink-700">Create courses to populate category insights.</p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {categoryStats.map((item) => {
                  const width = maxCategoryCount > 0 ? (item.count / maxCategoryCount) * 100 : 0;

                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-ink-800">
                        <span className="truncate pr-2">{item.label}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
                        <div className="h-full rounded-full bg-bark-600" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr,1.5fr]">
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-ink-900">{formTitle}</h3>
            {editingCourseId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-100 px-2.5 py-1.5 text-xs font-bold text-brand-800 transition hover:bg-brand-200"
              >
                <X size={13} /> Cancel Edit
              </button>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
              Course Title
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Working Safely with Elevated Platforms"
                className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
              Description
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Summarize the objective, key hazards, and expected learning outcomes."
                className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
                Category
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
                Level
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                >
                  {levelOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
                Duration (hours)
                <input
                  name="duration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.duration}
                  onChange={handleChange}
                  className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
                Status
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {editingCourseId ? <Pencil size={15} /> : <Plus size={15} />}
            {isSubmitting ? 'Saving...' : editingCourseId ? 'Update Course' : 'Create Course'}
          </button>
        </form>

        <div className="glass-panel rounded-2xl p-5 shadow-card">
          <h3 className="text-base font-bold text-ink-900">Your Courses</h3>
          <p className="mt-1 text-sm text-ink-800">Only courses created by your trainer account are listed here.</p>

          {loading ? (
            <p className="mt-4 text-sm font-semibold text-brand-700">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-brand-200 bg-white/75 px-4 py-6 text-sm text-ink-800">
              No courses yet. Create your first training module from the form.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {courses.map((course) => (
                <article key={course._id} className="rounded-xl border border-brand-100 bg-white/90 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-ink-900">{course.title}</h4>
                      <p className="mt-1 text-xs text-ink-700">
                        {course.category} • {course.level} • {course.duration}h • {course.totalLessons || 0} lessons
                      </p>
                    </div>
                    <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800">
                      {course.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-ink-800">{course.description}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/lesson-management?courseId=${course._id}`)}
                      className="inline-flex items-center gap-1 rounded-lg bg-bark-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-bark-800"
                    >
                      <BookOpen size={13} /> Manage Lessons
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(course)}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-800"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(course)}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(coursePendingDelete)}
        title="Delete Course"
        message={
          coursePendingDelete
            ? `Delete "${coursePendingDelete.title}"? This also removes related lessons and enrollments.`
            : ''
        }
        confirmLabel="Delete Course"
        isLoading={isDeleteSubmitting}
        onCancel={() => setCoursePendingDelete(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
};
