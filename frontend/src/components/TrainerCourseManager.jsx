import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  HardHat,
  Layers,
  LayoutDashboard,
  Pencil,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
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

const getCategoryClass = (category = '') => {
  const map = {
    'PPE': 'ppe',
    'Electrical Safety': 'electrical',
    'Working at Heights': 'heights',
    'Fire Safety': 'fire',
    'First Aid': 'firstaid',
    'Hazardous Materials': 'hazardous',
    'Machine Safety': 'machine',
    'Confined Spaces': 'confined'
  };
  return map[category] || 'other';
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
  const publishedCourses = useMemo(() => courses.filter((c) => c.status === 'Published').length, [courses]);
  const draftCourses = totalCourses - publishedCourses;

  const statusStats = useMemo(() => {
    return statusOptions.map((status) => ({
      label: status,
      count: courses.filter((c) => c.status === status).length
    }));
  }, [courses]);

  const categoryStats = useMemo(() => {
    const counts = courses.reduce((acc, c) => {
      const key = c.category || 'Other';
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
    if (!coursePendingDelete) return;

    setError('');
    setSuccess('');

    try {
      setIsDeleteSubmitting(true);
      await api.deleteCourse(coursePendingDelete._id);
      setSuccess('Course deleted successfully');
      if (editingCourseId === coursePendingDelete._id) resetForm();
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
    <section className="space-y-6">
      {/* ── Hero Header ── */}
      <header className="lms-hero-bg rounded-3xl p-8 text-white shadow-card">
        <div className="floating-orb floating-orb-lg bg-cyan-400/15 -top-24 right-8" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-sm bg-indigo-300/10 -bottom-10 left-10" style={{ animationDelay: '2.5s' }} />

        <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 border border-white/10 mb-4">
            <GraduationCap size={14} className="animate-pulse" /> Trainer Dashboard
          </p>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold leading-tight">
                Course <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Manager</span>
              </h1>
              <p className="mt-2 text-sm text-white/80">
                Create, update, publish, and manage your safety training courses.
              </p>
            </div>

            {/* Quick stat chips */}
            <div className="flex flex-wrap gap-3">
              <div className="lms-stat-chip">
                <LayoutDashboard size={14} className="text-cyan-300" />
                <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest mt-1">Total</p>
                <p className="text-2xl font-extrabold">{totalCourses}</p>
              </div>
              <div className="lms-stat-chip">
                <CheckCircle2 size={14} className="text-emerald-300" />
                <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest mt-1">Published</p>
                <p className="text-2xl font-extrabold">{publishedCourses}</p>
              </div>
              <div className="lms-stat-chip">
                <Sparkles size={14} className="text-amber-300" />
                <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest mt-1">Drafts</p>
                <p className="text-2xl font-extrabold">{draftCourses}</p>
              </div>
              <button
                type="button"
                onClick={loadCourses}
                className="lms-stat-chip hover:bg-white/15 transition-colors cursor-pointer"
              >
                <RefreshCcw size={18} className="text-cyan-300" />
                <p className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest">Refresh</p>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Course Statistics Panel ── */}
      <article className="glass-card-premium rounded-3xl p-6 shadow-card animate-fade-in-up" style={{ opacity: 0 }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="icon-container icon-container-brand">
            <LayoutDashboard size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Course Statistics</h2>
            <p className="text-xs text-ink-800 mt-0.5">Live distribution of your courses by status and category.</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Status Mix */}
          <div className="rounded-2xl border border-brand-100/80 bg-white/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-4">Status Mix</p>
            <div className="space-y-3">
              {statusStats.map((item) => {
                const width = totalCourses > 0 ? (item.count / totalCourses) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink-800">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${item.label === 'Published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {item.label}
                      </span>
                      <span className="font-extrabold">{item.count}</span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className={`progress-bar-fill ${item.label === 'Published' ? '!bg-gradient-to-r !from-emerald-400 !to-emerald-600' : '!bg-gradient-to-r !from-amber-400 !to-amber-600'}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Categories */}
          <div className="rounded-2xl border border-brand-100/80 bg-white/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-4">Top Categories</p>
            {categoryStats.length === 0 ? (
              <p className="text-sm text-ink-700">Create courses to populate category insights.</p>
            ) : (
              <div className="space-y-3">
                {categoryStats.map((item) => {
                  const width = maxCategoryCount > 0 ? (item.count / maxCategoryCount) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink-800">
                        <span className="truncate pr-2 flex items-center gap-1.5">
                          <HardHat size={11} className="text-brand-500" /> {item.label}
                        </span>
                        <span className="font-extrabold">{item.count}</span>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </article>

      {/* ── Form + Course List ── */}
      <div className="grid gap-5 xl:grid-cols-[1.1fr,1.5fr]">
        {/* Create/Edit Form */}
        <form onSubmit={handleSubmit} className="glass-card-premium rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-brand">
                {editingCourseId ? <Pencil size={18} /> : <Plus size={18} />}
              </div>
              <h3 className="text-lg font-bold text-ink-900">{formTitle}</h3>
            </div>
            {editingCourseId && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs"
              >
                <X size={13} /> Cancel Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Course Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Working Safely with Elevated Platforms"
                className="lms-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Summarize the objective, key hazards, and expected learning outcomes."
                className="lms-input resize-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Category</label>
                <div className="relative">
                  <select name="category" value={formData.category} onChange={handleChange} className="lms-select pr-8">
                    {categoryOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-brand-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Level</label>
                <div className="relative">
                  <select name="level" value={formData.level} onChange={handleChange} className="lms-select pr-8">
                    {levelOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-brand-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Duration (hours)</label>
                <input
                  name="duration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.duration}
                  onChange={handleChange}
                  className="lms-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Status</label>
                <div className="flex gap-2">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, status: opt }))}
                      className={`content-type-btn flex-1 justify-center ${formData.status === opt ? 'content-type-btn-active' : ''}`}
                    >
                      {opt === 'Published' ? <CheckCircle2 size={13} /> : <Sparkles size={13} />}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 btn-premium btn-premium-brand w-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {editingCourseId ? <Pencil size={15} /> : <Plus size={15} />}
            {isSubmitting ? 'Saving...' : editingCourseId ? 'Update Course' : 'Create Course'}
          </button>
        </form>

        {/* Course List */}
        <div className="glass-card-premium rounded-3xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="icon-container icon-container-brand">
              <GraduationCap size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink-900">Your Courses</h3>
              <p className="text-xs text-ink-800 mt-0.5">Only courses created by your account are shown here.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-brand-700">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white/60 px-6 py-8 text-center">
              <div className="icon-container icon-container-brand mx-auto mb-3"><GraduationCap size={22} /></div>
              <p className="text-sm font-semibold text-ink-800">No courses yet</p>
              <p className="text-xs text-ink-700 mt-1">Create your first training module from the form.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course, index) => {
                const catClass = getCategoryClass(course.category);
                return (
                  <article
                    key={course._id}
                    className="course-card-lms animate-fade-in-up"
                    style={{ opacity: 0, animationDelay: `${index * 0.06}s` }}
                  >
                    <div className={`card-top-stripe cat-${catClass}`} />
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="text-sm font-extrabold text-ink-900">{course.title}</h4>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              course.status === 'Published'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {course.status === 'Published' ? <CheckCircle2 size={11} /> : <Sparkles size={11} />}
                              {course.status}
                            </span>
                          </div>
                          <p className="text-xs text-ink-700 flex items-center gap-2">
                            <span className={`cat-pill-${catClass} rounded-full px-2.5 py-0.5 text-[11px] font-bold`}>{course.category}</span>
                            <span>·</span>
                            <span>{course.level}</span>
                            <span>·</span>
                            <span>{course.duration}h</span>
                            <span>·</span>
                            <span>{course.totalLessons || 0} lessons</span>
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-ink-800 leading-relaxed line-clamp-2 mb-4">{course.description}</p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/lesson-management?courseId=${course._id}`)}
                          className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs"
                        >
                          <BookOpen size={12} /> Manage Lessons
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(course)}
                          className="btn-premium btn-premium-brand !px-3 !py-1.5 text-xs"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(course)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
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
