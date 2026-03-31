import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Film, Pencil, Plus, RefreshCcw, Trash2, Type, X } from 'lucide-react';
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
      navigate('/portal');
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
          setTimeout(() => navigate('/portal'), 2000);
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
    if (!selectedLessonId) {
      return;
    }

    setDeleteAction({
      type: 'page',
      lessonId: selectedLessonId,
      pageId: page._id,
      title: page.title
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAction) {
      return;
    }

    setLessonError('');
    setLessonSuccess('');
    setPageError('');
    setPageSuccess('');

    try {
      setIsDeleteSubmitting(true);

      if (deleteAction.type === 'lesson') {
        await api.deleteLesson(deleteAction.lessonId);
        setLessonSuccess('Lesson deleted successfully');
        if (editingLessonId === deleteAction.lessonId) {
          resetLessonForm();
        }
        if (selectedLessonId === deleteAction.lessonId) {
          setSelectedLessonId(null);
        }
      }

      if (deleteAction.type === 'page') {
        await api.deletePage(deleteAction.lessonId, deleteAction.pageId);
        if (editingPageId === deleteAction.pageId) {
          resetPageForm();
        }
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
        await api.createLesson({
          ...payload,
          courseId: course._id,
          pages: []
        });
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
      <div className="glass-panel rounded-2xl p-8 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-800">Loading lesson manager...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass-panel rounded-2xl p-8 shadow-card">
        <p className="text-sm font-semibold text-red-700">{lessonError || 'Course not found'}</p>
        <button
          type="button"
          onClick={() => navigate('/portal')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-800"
        >
          <ArrowLeft size={15} /> Back to Portal
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-3xl p-7 shadow-card">
        <button
          type="button"
          onClick={() => navigate('/portal')}
          className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800 transition hover:bg-brand-200"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">Lesson Manager</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-800">
          Managing lessons for <span className="font-bold text-brand-700">{course.title}</span> • {course.category} • {course.level}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr,1.8fr]">
        <form onSubmit={handleLessonSubmit} className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">{lessonFormTitle}</h3>
            {editingLessonId && (
              <button
                type="button"
                onClick={resetLessonForm}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-100 px-2.5 py-1.5 text-xs font-bold text-brand-800 transition hover:bg-brand-200"
              >
                <X size={13} /> Cancel
              </button>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
              Lesson Title
              <input
                name="title"
                value={lessonForm.title}
                onChange={handleLessonChange}
                placeholder="Introduction to Scaffold Safety"
                className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
              Description
              <textarea
                name="description"
                value={lessonForm.description}
                onChange={handleLessonChange}
                rows={3}
                placeholder="Briefly describe what this lesson covers."
                className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
                Order Index
                <input
                  name="orderIndex"
                  type="number"
                  min="1"
                  value={lessonForm.orderIndex}
                  onChange={handleLessonChange}
                  className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
                Duration (minutes)
                <input
                  name="duration"
                  type="number"
                  min="0"
                  value={lessonForm.duration}
                  onChange={handleLessonChange}
                  className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </label>
            </div>
          </div>

          {lessonError && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {lessonError}
            </p>
          )}

          {lessonSuccess && (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {lessonSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={isLessonSubmitting}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-bark-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-bark-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {editingLessonId ? <Pencil size={15} /> : <Plus size={15} />}
            {isLessonSubmitting ? 'Saving...' : editingLessonId ? 'Update Lesson' : 'Add Lesson'}
          </button>
        </form>

        <div className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-ink-900">Course Lessons</h3>
            <button
              type="button"
              onClick={() => loadLessons(courseId)}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-brand-800 transition hover:bg-brand-50"
            >
              <RefreshCcw size={13} /> Refresh
            </button>
          </div>

          <p className="mt-1 text-sm text-ink-800">Click on a lesson to manage its pages.</p>

          {lessonLoading ? (
            <p className="mt-4 text-sm font-semibold text-brand-700">Loading lessons...</p>
          ) : lessons.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-brand-200 bg-white/75 px-4 py-6 text-sm text-ink-800">
              No lessons yet. Add the first lesson using the form.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {lessons.map((lesson) => (
                <article
                  key={lesson._id}
                  className={`rounded-xl border p-4 transition cursor-pointer ${
                    selectedLessonId === lesson._id
                      ? 'border-bark-300 bg-bark-50'
                      : 'border-brand-100 bg-white/90 hover:border-brand-300'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div onClick={() => setSelectedLessonId(lesson._id)}>
                      <h4 className="text-base font-bold text-ink-900">
                        {lesson.orderIndex}. {lesson.title}
                      </h4>
                      <p className="mt-1 text-sm text-ink-700">
                        {lesson.duration || 0} min • {lesson.pages?.length || 0} pages
                      </p>
                    </div>
                  </div>

                  {lesson.description && (
                    <p className="mt-3 text-sm leading-relaxed text-ink-800">{lesson.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLessonId(lesson._id);
                        setTimeout(() => {
                          document.querySelector('.page-manager-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-accent-600"
                    >
                      <BookOpen size={13} /> Manage Pages
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLessonEdit(lesson)}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-800"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => requestLessonDelete(lesson)}
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

      {selectedLesson && (
        <div className="page-manager-section grid gap-5 lg:grid-cols-[1.2fr,1.8fr]">
          <form onSubmit={handlePageSubmit} className="glass-panel rounded-2xl p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink-900">{pageFormTitle}</h3>
              {editingPageId && (
                <button
                  type="button"
                  onClick={resetPageForm}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-100 px-2.5 py-1.5 text-xs font-bold text-brand-800 transition hover:bg-brand-200"
                >
                  <X size={13} /> Cancel
                </button>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
                Page Title
                <input
                  name="title"
                  value={pageForm.title}
                  onChange={handlePageChange}
                  placeholder="Safety Inspection Procedures"
                  className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
                Content Type
                <select
                  name="contentType"
                  value={pageForm.contentType}
                  onChange={handlePageChange}
                  className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                >
                  <option value="text">Text Only</option>
                  <option value="video">Video Only</option>
                  <option value="mixed">Text + Video</option>
                </select>
              </label>

              {(pageForm.contentType === 'text' || pageForm.contentType === 'mixed') && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink-800">Text Content</label>
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
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                      ]
                    }}
                    formats={['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block', 'header', 'list', 'link', 'image']}
                    style={{
                      borderRadius: '0.75rem',
                      border: '1px solid rgb(229, 231, 235)',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      minHeight: '200px'
                    }}
                  />
                </div>
              )}

              {(pageForm.contentType === 'video' || pageForm.contentType === 'mixed') && (
                <>
                  <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
                    Video URL
                    <input
                      name="videoUrl"
                      type="url"
                      value={pageForm.videoUrl}
                      onChange={handlePageChange}
                      placeholder="https://youtube.com/watch?v=..."
                      className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-800">
                    Video Title
                    <input
                      name="videoTitle"
                      value={pageForm.videoTitle}
                      onChange={handlePageChange}
                      placeholder="Video title"
                      className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  </label>
                </>
              )}
            </div>

            {pageError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {pageError}
              </p>
            )}

            {pageSuccess && (
              <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                {pageSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={isPageSubmitting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {editingPageId ? <Pencil size={15} /> : <Plus size={15} />}
              {isPageSubmitting ? 'Saving...' : editingPageId ? 'Update Page' : 'Add Page'}
            </button>
          </form>

          <div className="glass-panel rounded-2xl p-5 shadow-card">
            <h3 className="text-lg font-bold text-ink-900">Pages in "{selectedLesson.title}"</h3>
            <p className="mt-1 text-sm text-ink-800">Manage content pages for this lesson.</p>

            {selectedLesson.pages && selectedLesson.pages.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-white/75 px-4 py-6 text-center">
                <Type size={24} className="mx-auto text-brand-400" />
                <p className="mt-3 text-sm font-semibold text-ink-800">No pages yet</p>
                <p className="mt-1 text-xs text-ink-700">Add the first page using the form on the left.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {selectedLesson.pages?.map((page, index) => (
                  <article key={page._id} className="rounded-xl border border-brand-100 bg-white/90 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-700">
                          {page.contentType === 'text' ? <Type size={12} /> : <Film size={12} />}
                          Page {page.pageNumber || index + 1}
                        </div>
                        <h4 className="text-sm font-bold text-ink-900">{page.title}</h4>
                      </div>
                    </div>

                    {page.textContent && (
                      <div className="mt-3 max-h-24 overflow-hidden rounded-lg bg-gradient-to-b from-brand-50 to-transparent p-3 text-xs text-ink-800 border border-brand-100">
                        <div 
                          className="prose prose-sm max-w-none line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: page.textContent }}
                        />
                      </div>
                    )}

                    {page.videoUrl && (
                      <p className="mt-2 text-xs text-brand-700 font-semibold">
                        🎥 {page.videoTitle || 'Video content'}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handlePageEdit(page)}
                        className="inline-flex items-center gap-1 rounded-lg bg-bark-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-bark-800"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => requestPageDelete(page)}
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
