import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Film, Type } from 'lucide-react';
import { api } from '../services/api';

// Helper function to strip HTML tags and get plain text
const stripHtmlTags = (html) => {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

export const LessonViewerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const lessonId = searchParams.get('lessonId');

  const [lesson, setLesson] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId || !lessonId) {
      navigate(`/course-detail?courseId=${courseId || ''}`);
      return;
    }

    const loadLesson = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.getLessonsByCourse(courseId);
        const lessons = response.data || [];
        const found = lessons.find((l) => l._id === lessonId);

        if (!found) {
          setError('Lesson not found');
          return;
        }

        setLesson(found);
        setCurrentPageIndex(0);
      } catch (err) {
        setError(err.message || 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [courseId, lessonId, navigate]);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-800">Loading lesson...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="glass-panel rounded-2xl p-8 shadow-card">
        <p className="mb-4 text-sm font-semibold text-red-700">{error || 'Lesson not found'}</p>
        <button
          type="button"
          onClick={() => navigate(`/course-detail?courseId=${courseId}`)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-800"
        >
          <ArrowLeft size={15} /> Back to Course
        </button>
      </div>
    );
  }

  const pages = lesson.pages || [];
  const currentPage = pages[currentPageIndex] || null;

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSelect = (index) => {
    setCurrentPageIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (pages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="glass-panel rounded-3xl p-7 shadow-card">
          <button
            type="button"
            onClick={() => navigate(`/course-detail?courseId=${courseId}`)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800 transition hover:bg-brand-200"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="mt-4 text-3xl font-extrabold text-ink-900">{lesson.title}</h1>
        </div>

        <div className="glass-panel rounded-2xl p-8 text-center shadow-card">
          <p className="text-sm font-semibold text-ink-800">This lesson has no content pages yet.</p>
          <p className="mt-2 text-xs text-ink-700">Please check back later as the trainer adds content.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-7 shadow-card">
        <button
          type="button"
          onClick={() => navigate(`/course-detail?courseId=${courseId}`)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800 transition hover:bg-brand-200"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">{lesson.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-800">
          {lesson.description || 'Lesson content'}
        </p>
        <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-brand-700 px-4 py-2 text-xs font-bold text-white">
          <span>Page {currentPageIndex + 1} of {pages.length}</span>
        </div>
      </div>

      {/* Main Content */}
      {currentPage && (
        <div className="glass-panel rounded-2xl p-8 shadow-card">
          <div className="mb-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {currentPage.contentType === 'text' ? (
                <Type size={20} className="text-brand-700" />
              ) : (
                <Film size={20} className="text-accent-500" />
              )}
              <h2 className="text-2xl font-bold text-ink-900">{currentPage.title}</h2>
            </div>
          </div>

          {/* Text Content */}
          {(currentPage.contentType === 'text' || currentPage.contentType === 'mixed') && currentPage.textContent && (
            <div className="rounded-xl bg-white/50 p-6">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-ink-900">
                {stripHtmlTags(currentPage.textContent)}
              </p>
            </div>
          )}

          {/* Video Content */}
          {(currentPage.contentType === 'video' || currentPage.contentType === 'mixed') && currentPage.videoUrl && (
            <div className="mt-6 space-y-3">
              {currentPage.videoTitle && (
                <h3 className="text-lg font-semibold text-ink-900">{currentPage.videoTitle}</h3>
              )}
              <div className="aspect-video overflow-hidden rounded-xl bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={
                    currentPage.videoUrl.includes('youtube.com') || currentPage.videoUrl.includes('youtu.be')
                      ? currentPage.videoUrl
                          .replace('watch?v=', 'embed/')
                          .replace('youtu.be/', 'youtube.com/embed/')
                      : currentPage.videoUrl
                  }
                  title={currentPage.videoTitle || 'Video'}
                  frameBorder="0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="glass-panel rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={18} /> Previous
          </button>

          <span className="text-sm font-semibold text-ink-900">
            {currentPageIndex + 1} / {pages.length}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPageIndex === pages.length - 1}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>

        {/* Page Thumbnails */}
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          {pages.map((page, index) => (
            <button
              key={page._id}
              type="button"
              onClick={() => handlePageSelect(index)}
              className={`min-w-fit rounded-lg px-4 py-2 text-xs font-bold transition ${
                index === currentPageIndex
                  ? 'bg-bark-700 text-white'
                  : 'border border-brand-200 bg-white text-brand-800 hover:border-brand-400 hover:bg-brand-50'
              }`}
            >
              {page.contentType === 'text' ? <Type size={12} className="mr-1 inline" /> : <Film size={12} className="mr-1 inline" />}
              {page.title.substring(0, 20)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
