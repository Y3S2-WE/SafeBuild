import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Film,
  GraduationCap,
  HardHat,
  Layers,
  Pencil,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  Type,
  X
} from 'lucide-react';
import ReactQuill from 'react-quill';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

// Helper function to get truncated plain text for preview (strip HTML first)
const getTextPreview = (html, length = 80) => {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const text = temp.textContent || temp.innerText || '';
  return text.substring(0, length) + (text.length > length ? '...' : '');
};

const initialLessonForm = {
  title: '',
  description: '',
  orderIndex: 1,
  duration: 10
};

const initialPageForm = {
  title: '',
  contentType: 'text',
  textContent: '',
  videoUrl: '',
  videoTitle: ''
};

export const LessonManagementPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const courseId = searchParams.get('courseId');

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lessonError, setLessonError] = useState('');
  const [lessonSuccess, setLessonSuccess] = useState('');
  const [isLessonSubmitting, setIsLessonSubmitting] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState('');
  const [lessonForm, setLessonForm] = useState(initialLessonForm);
  const [lessonLoading, setLessonLoading] = useState(false);

  // Page management state
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');
  const [isPageSubmitting, setIsPageSubmitting] = useState(false);
  const [editingPageId, setEditingPageId] = useState('');
  const [pageForm, setPageForm] = useState(initialPageForm);
  const [deleteAction, setDeleteAction] = useState(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const lessonFormTitle = useMemo(() => {
    return editingLessonId ? 'Update Lesson' : 'Add New Lesson';
  }, [editingLessonId]);

  const pageFormTitle = useMemo(() => {
    return editingPageId ? 'Update Page' : 'Add New Page';
  }, [editingPageId]);

  const selectedLesson = useMemo(() => {
    return lessons.find((l) => l._id === selectedLessonId);
  }, [lessons, selectedLessonId]);

  // Load course and lessons on mount
  useEffect(() => {
    if (!courseId) {
      navigate('/dashboard');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setLessonError('');

      try {
        const coursesResponse = await api.getCourses();
        const foundCourse = coursesResponse.data?.find((c) => c._id === courseId);

        if (!foundCourse) {
          setLessonError('Course not found or not authorized');
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }

        setCourse(foundCourse);
        await loadLessons(courseId);
      } catch (requestError) {
        setLessonError(requestError.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, navigate]);

  const loadLessons = async (cId) => {
    setLessonLoading(true);

    try {
      const response = await api.getLessonsByCourse(cId);
      setLessons(response.data || []);
    } catch (requestError) {
      setLessonError(requestError.message || 'Failed to load lessons');
    } finally {
      setLessonLoading(false);
    }
  };

  const resetLessonForm = () => {
    setLessonForm(initialLessonForm);
    setEditingLessonId('');
  };

  const resetPageForm = () => {
    setPageForm(initialPageForm);
    setEditingPageId('');
    setPageError('');
    setPageSuccess('');
  };

  const handleLessonChange = (event) => {
    const { name, value } = event.target;
    setLessonForm((prev) => ({
      ...prev,
      [name]: name === 'orderIndex' || name === 'duration' ? Number(value) : value
    }));
  };

  const handlePageChange = (event) => {
    const { name, value } = event.target;
    setPageForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTextContentChange = (value) => {
    setPageForm((prev) => ({
      ...prev,
      textContent: value
    }));
  };

  const validateLessonForm = () => {
    if (!lessonForm.title.trim()) return 'Lesson title is required';
    if (Number(lessonForm.orderIndex) < 1) return 'Order index must be at least 1';
    if (Number(lessonForm.duration) < 0) return 'Lesson duration cannot be negative';
    return '';
  };

  const validatePageForm = () => {
    if (!pageForm.title.trim()) return 'Page title is required';
    if (pageForm.contentType === 'text' && !pageForm.textContent.trim()) {
      return 'Text content is required for text pages';
    }
    if (pageForm.contentType === 'video' && !pageForm.videoUrl.trim()) {
      return 'Video URL is required for video pages';
    }
    if (pageForm.contentType === 'mixed') {
      if (!pageForm.textContent.trim() && !pageForm.videoUrl.trim()) {
        return 'Mixed pages need either text content or video URL';
      }
    }
    return '';
  };

  const handleLessonEdit = (lesson) => {
    setLessonError('');
    setLessonSuccess('');
    setEditingLessonId(lesson._id);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      orderIndex: lesson.orderIndex,
      duration: lesson.duration || 0
    });
  };

  const requestLessonDelete = (lesson) => {
    setDeleteAction({
      type: 'lesson',
      lessonId: lesson._id,
      title: lesson.title
    });
  };

  const requestPageDelete = (page) => {
    if (!selectedLessonId) return;
    setDeleteAction({
      type: 'page',
      lessonId: selectedLessonId,
      pageId: page._id,
      title: page.title
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAction) return;

    setLessonError('');
    setLessonSuccess('');
    setPageError('');
    setPageSuccess('');

    try {
      setIsDeleteSubmitting(true);

      if (deleteAction.type === 'lesson') {
        await api.deleteLesson(deleteAction.lessonId);
        setLessonSuccess('Lesson deleted successfully');
        if (editingLessonId === deleteAction.lessonId) resetLessonForm();
        if (selectedLessonId === deleteAction.lessonId) setSelectedLessonId(null);
      }

      if (deleteAction.type === 'page') {
        await api.deletePage(deleteAction.lessonId, deleteAction.pageId);
        if (editingPageId === deleteAction.pageId) resetPageForm();
        setPageSuccess('Page deleted successfully');
      }

      await loadLessons(courseId);
      setDeleteAction(null);
    } catch (requestError) {
      if (deleteAction.type === 'lesson') {
        setLessonError(requestError.message || 'Failed to delete lesson');
      } else {
        setPageError(requestError.message || 'Failed to delete page');
      }
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const handleLessonSubmit = async (event) => {
    event.preventDefault();
    setLessonError('');
    setLessonSuccess('');

    if (!course) {
      setLessonError('Select a course first');
      return;
    }

    const validationMessage = validateLessonForm();
    if (validationMessage) {
      setLessonError(validationMessage);
      return;
    }

    const payload = {
      title: lessonForm.title.trim(),
      description: lessonForm.description.trim(),
      orderIndex: Number(lessonForm.orderIndex),
      duration: Number(lessonForm.duration)
    };

    try {
      setIsLessonSubmitting(true);
      if (editingLessonId) {
        await api.updateLesson(editingLessonId, payload);
        setLessonSuccess('Lesson updated successfully');
      } else {
        await api.createLesson({ ...payload, courseId: course._id, pages: [] });
        setLessonSuccess('Lesson created successfully');
      }

      resetLessonForm();
      await loadLessons(courseId);
    } catch (requestError) {
      setLessonError(requestError.message || 'Failed to save lesson');
    } finally {
      setIsLessonSubmitting(false);
    }
  };

  const handlePageEdit = (page) => {
    setPageError('');
    setPageSuccess('');
    setEditingPageId(page._id);
    setPageForm({
      title: page.title,
      contentType: page.contentType,
      textContent: page.textContent || '',
      videoUrl: page.videoUrl || '',
      videoTitle: page.videoTitle || ''
    });
  };

  const handlePageSubmit = async (event) => {
    event.preventDefault();
    setPageError('');
    setPageSuccess('');

    if (!selectedLesson) {
      setPageError('Select a lesson first');
      return;
    }

    const validationMessage = validatePageForm();
    if (validationMessage) {
      setPageError(validationMessage);
      return;
    }

    const payload = {
      title: pageForm.title.trim(),
      contentType: pageForm.contentType,
      textContent: pageForm.textContent.trim(),
      videoUrl: pageForm.videoUrl.trim(),
      videoTitle: pageForm.videoTitle.trim()
    };

    try {
      setIsPageSubmitting(true);
      if (editingPageId) {
        await api.updatePage(selectedLessonId, editingPageId, payload);
        setPageSuccess('Page updated successfully');
      } else {
        await api.addPage(selectedLessonId, payload);
        setPageSuccess('Page added successfully');
      }

      resetPageForm();
      await loadLessons(courseId);
    } catch (requestError) {
      setPageError(requestError.message || 'Failed to save page');
    } finally {
      setIsPageSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="lms-hero-bg rounded-3xl p-12 text-center shadow-card">
        <div className="inline-flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-white/80">Loading lesson manager...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass-card-premium rounded-3xl p-8 shadow-card">
        <p className="text-sm font-semibold text-red-700">{lessonError || 'Course not found'}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-4 btn-premium btn-premium-brand text-sm"
        >
          <ArrowLeft size={15} /> Back to Portal
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* ── Hero ── */}
      <header className="lms-hero-bg rounded-3xl p-8 text-white shadow-card">
        <div className="floating-orb floating-orb-md bg-cyan-400/15 -top-16 right-8" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-sm bg-indigo-300/10 -bottom-10 left-10" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white border border-white/10 transition mb-4"
          >
            <ArrowLeft size={14} /> Back to Portal
          </button>

          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 border border-white/10 mb-4 ml-2">
            <GraduationCap size={14} className="animate-pulse" /> Lesson Manager
          </p>

          <h1 className="text-3xl font-extrabold leading-tight">
            Manage Lessons
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Managing lessons for{' '}
            <span className="font-bold text-cyan-200">{course.title}</span>
            {' '}·{' '}{course.category}
            {' '}·{' '}{course.level}
          </p>

          {/* Quick lesson count chips */}
          <div className="mt-4 flex gap-3">
            <div className="lms-stat-chip">
              <Layers size={14} className="text-cyan-300" />
              <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest mt-1">Lessons</p>
              <p className="text-lg font-extrabold">{lessons.length}</p>
            </div>
            {selectedLesson && (
              <div className="lms-stat-chip">
                <BookOpen size={14} className="text-cyan-300" />
                <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest mt-1">Pages</p>
                <p className="text-lg font-extrabold">{selectedLesson.pages?.length || 0}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Lesson Form + List ── */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr,1.8fr]">
        {/* Lesson Form */}
        <form onSubmit={handleLessonSubmit} className="glass-card-premium rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-brand">
                {editingLessonId ? <Pencil size={18} /> : <Plus size={18} />}
              </div>
              <h3 className="text-lg font-bold text-ink-900">{lessonFormTitle}</h3>
            </div>
            {editingLessonId && (
              <button
                type="button"
                onClick={resetLessonForm}
                className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs"
              >
                <X size={13} /> Cancel
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Lesson Title</label>
              <input
                name="title"
                value={lessonForm.title}
                onChange={handleLessonChange}
                placeholder="Introduction to Scaffold Safety"
                className="lms-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Description</label>
              <textarea
                name="description"
                value={lessonForm.description}
                onChange={handleLessonChange}
                rows={3}
                placeholder="Briefly describe what this lesson covers."
                className="lms-input resize-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Order</label>
                <input
                  name="orderIndex"
                  type="number"
                  min="1"
                  value={lessonForm.orderIndex}
                  onChange={handleLessonChange}
                  className="lms-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Duration (min)</label>
                <input
                  name="duration"
                  type="number"
                  min="0"
                  value={lessonForm.duration}
                  onChange={handleLessonChange}
                  className="lms-input"
                />
              </div>
            </div>
          </div>

          {lessonError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm font-semibold text-red-700">
              {lessonError}
            </div>
          )}

          {lessonSuccess && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 size={16} /> {lessonSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={isLessonSubmitting}
            className="mt-5 btn-premium btn-premium-brand w-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {editingLessonId ? <Pencil size={15} /> : <Plus size={15} />}
            {isLessonSubmitting ? 'Saving...' : editingLessonId ? 'Update Lesson' : 'Add Lesson'}
          </button>
        </form>

        {/* Lesson List */}
        <div className="glass-card-premium rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-brand">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink-900">Course Lessons</h3>
                <p className="text-xs text-ink-800 mt-0.5">Click a lesson to manage its pages</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadLessons(courseId)}
              className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs"
            >
              <RefreshCcw size={13} /> Refresh
            </button>
          </div>

          {lessonLoading ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-brand-700">Loading lessons...</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white/60 px-6 py-8 text-center">
              <div className="icon-container icon-container-brand mx-auto mb-3"><BookOpen size={22} /></div>
              <p className="text-sm font-semibold text-ink-800">No lessons yet</p>
              <p className="text-xs text-ink-700 mt-1">Add the first lesson using the form.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <article
                  key={lesson._id}
                  className={`lesson-card-lms cursor-pointer ${
                    selectedLessonId === lesson._id ? 'border-brand-400 bg-white shadow-md shadow-brand-100/40' : ''
                  }`}
                  onClick={() => setSelectedLessonId(lesson._id)}
                >
                  {/* Lesson number */}
                  <div className={`lesson-number-badge ${selectedLessonId === lesson._id ? '' : '!bg-gradient-to-br from-brand-300 to-brand-500'}`}>
                    {lesson.orderIndex}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-ink-900 truncate">{lesson.title}</h4>
                    <p className="mt-0.5 text-xs text-ink-800 flex items-center gap-2">
                      <span>{lesson.duration || 0} min</span>
                      <span className="text-brand-300">•</span>
                      <span>{lesson.pages?.length || 0} pages</span>
                    </p>
                    {lesson.description && (
                      <p className="mt-1 text-xs text-ink-700 leading-relaxed line-clamp-1">{lesson.description}</p>
                    )}
                  </div>

                  {/* Action cluster */}
                  <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLessonId(lesson._id);
                        setTimeout(() => {
                          document.querySelector('.page-manager-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                      className="btn-premium btn-premium-emerald !px-2.5 !py-1.5 text-xs"
                    >
                      <BookOpen size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLessonEdit(lesson)}
                      className="btn-premium btn-premium-outline !px-2.5 !py-1.5 text-xs"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => requestLessonDelete(lesson)}
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Page Manager ── */}
      {selectedLesson && (
        <div className="page-manager-section grid gap-5 lg:grid-cols-[1.2fr,1.8fr]">
          {/* Page Form */}
          <form onSubmit={handlePageSubmit} className="glass-card-premium rounded-3xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="icon-container icon-container-amber">
                  {editingPageId ? <Pencil size={18} /> : <Plus size={18} />}
                </div>
                <h3 className="text-lg font-bold text-ink-900">{pageFormTitle}</h3>
              </div>
              {editingPageId && (
                <button
                  type="button"
                  onClick={resetPageForm}
                  className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs"
                >
                  <X size={13} /> Cancel
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Page Title</label>
                <input
                  name="title"
                  value={pageForm.title}
                  onChange={handlePageChange}
                  placeholder="Safety Inspection Procedures"
                  className="lms-input"
                />
              </div>

              {/* Content Type Toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-2">Content Type</label>
                <div className="flex gap-2">
                  {[
                    { value: 'text', label: 'Text', icon: Type },
                    { value: 'video', label: 'Video', icon: Film },
                    { value: 'mixed', label: 'Mixed', icon: Layers }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPageForm((prev) => ({ ...prev, contentType: opt.value }))}
                      className={`content-type-btn ${pageForm.contentType === opt.value ? 'content-type-btn-active' : ''}`}
                    >
                      <opt.icon size={14} /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {(pageForm.contentType === 'text' || pageForm.contentType === 'mixed') && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Text Content</label>
                  <ReactQuill
                    value={pageForm.textContent}
                    onChange={handleTextContentChange}
                    theme="snow"
                    placeholder="Write the page content here..."
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'header': 1 }, { 'header': 2 }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                      ]
                    }}
                    formats={['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block', 'header', 'list', 'link', 'image']}
                    style={{ borderRadius: '0.75rem', border: '1px solid rgb(229, 231, 235)', backgroundColor: 'rgba(255, 255, 255, 0.9)', minHeight: '200px' }}
                  />
                </div>
              )}

              {(pageForm.contentType === 'video' || pageForm.contentType === 'mixed') && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Video URL</label>
                    <input
                      name="videoUrl"
                      type="url"
                      value={pageForm.videoUrl}
                      onChange={handlePageChange}
                      placeholder="https://youtube.com/watch?v=..."
                      className="lms-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-700 mb-1.5">Video Title</label>
                    <input
                      name="videoTitle"
                      value={pageForm.videoTitle}
                      onChange={handlePageChange}
                      placeholder="Video title"
                      className="lms-input"
                    />
                  </div>
                </>
              )}
            </div>

            {pageError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm font-semibold text-red-700">
                {pageError}
              </div>
            )}

            {pageSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} /> {pageSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isPageSubmitting}
              className="mt-5 btn-premium btn-premium-emerald w-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {editingPageId ? <Pencil size={15} /> : <Plus size={15} />}
              {isPageSubmitting ? 'Saving...' : editingPageId ? 'Update Page' : 'Add Page'}
            </button>
          </form>

          {/* Page List */}
          <div className="glass-card-premium rounded-3xl p-6 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-container icon-container-amber">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink-900">Pages in "{selectedLesson.title}"</h3>
                <p className="text-xs text-ink-800 mt-0.5">Manage content pages for this lesson.</p>
              </div>
            </div>

            {selectedLesson.pages && selectedLesson.pages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-200 bg-white/60 px-6 py-8 text-center">
                <div className="icon-container icon-container-amber mx-auto mb-3"><Type size={22} /></div>
                <p className="text-sm font-semibold text-ink-800">No pages yet</p>
                <p className="text-xs text-ink-700 mt-1">Add the first page using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedLesson.pages?.map((page, index) => (
                  <article key={page._id} className="page-preview-card">
                    {/* Badge row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                          page.contentType === 'video' ? 'bg-accent-100 text-accent-700' : 'bg-brand-100 text-brand-700'
                        }`}>
                          {page.contentType === 'text' ? <Type size={11} /> : <Film size={11} />}
                          Page {page.pageNumber || index + 1}
                        </span>
                        <h4 className="text-sm font-bold text-ink-900">{page.title}</h4>
                      </div>
                    </div>

                    {page.textContent && (
                      <p className="mt-2 text-xs text-ink-700 leading-relaxed line-clamp-2">
                        {getTextPreview(page.textContent, 100)}
                      </p>
                    )}

                    {page.videoUrl && (
                      <p className="mt-2 text-xs font-semibold text-accent-600 flex items-center gap-1">
                        <Film size={11} /> {page.videoTitle || 'Video content'}
                      </p>
                    )}

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePageEdit(page)}
                        className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => requestPageDelete(page)}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteAction)}
        title={deleteAction?.type === 'page' ? 'Delete Page' : 'Delete Lesson'}
        message={deleteAction ? `Delete "${deleteAction.title}"? This action cannot be undone.` : ''}
        confirmLabel={deleteAction?.type === 'page' ? 'Delete Page' : 'Delete Lesson'}
        isLoading={isDeleteSubmitting}
        onCancel={() => setDeleteAction(null)}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
};
