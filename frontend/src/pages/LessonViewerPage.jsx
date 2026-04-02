import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Film, Type, Globe, Loader2 } from 'lucide-react';
import { api } from '../services/api';

// Language options for the selector
const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'si', label: 'Sinhala', nativeLabel: 'සිංහල', flag: '🇱🇰' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇱🇰' }
];

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

  // Translation state
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cache: { [pageId-langCode]: { title, textContent, videoTitle } }
  const [translationCache, setTranslationCache] = useState({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  /**
   * Translate the current page content
   */
  const translateCurrentPage = useCallback(
    async (pageIndex, langCode) => {
      if (!lesson || langCode === 'en') return;

      const pages = lesson.pages || [];
      const page = pages[pageIndex];
      if (!page) return;

      const cacheKey = `${page._id}-${langCode}`;
      if (translationCache[cacheKey]) return; // Already cached

      setIsTranslating(true);
      setTranslationError('');

      try {
        const fieldsToTranslate = [];

        if (page.title) {
          fieldsToTranslate.push({ field: 'title', text: page.title });
        }
        if (page.textContent) {
          fieldsToTranslate.push({ field: 'textContent', text: page.textContent });
        }
        if (page.videoTitle) {
          fieldsToTranslate.push({ field: 'videoTitle', text: page.videoTitle });
        }

        const translatedFields = {};

        // Translate each field
        for (const { field, text } of fieldsToTranslate) {
          const response = await api.translateText(text, langCode);
          translatedFields[field] = response.data?.translatedText || text;
        }

        setTranslationCache((prev) => ({
          ...prev,
          [cacheKey]: translatedFields
        }));
      } catch (err) {
        const errorMessage = err.message || 'Translation failed';
        if (errorMessage.includes('model is loading')) {
          setTranslationError('🔄 Translation model is warming up. Please try again in a few seconds...');
        } else {
          setTranslationError(errorMessage);
        }
      } finally {
        setIsTranslating(false);
      }
    },
    [lesson, translationCache]
  );

  // Auto-translate when language or page changes
  useEffect(() => {
    if (selectedLanguage !== 'en' && lesson) {
      translateCurrentPage(currentPageIndex, selectedLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage, currentPageIndex, lesson]);

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    setTranslationError('');
    setIsLangDropdownOpen(false);
  };

  /**
   * Get the display content for current page (original or translated)
   */
  const getDisplayContent = (page) => {
    if (!page) return { title: '', textContent: '', videoTitle: '' };

    if (selectedLanguage === 'en') {
      return {
        title: page.title,
        textContent: page.textContent,
        videoTitle: page.videoTitle,
        isOriginal: true
      };
    }

    const cacheKey = `${page._id}-${selectedLanguage}`;
    const cached = translationCache[cacheKey];

    if (cached) {
      return {
        title: cached.title || page.title,
        textContent: cached.textContent || stripHtmlTags(page.textContent),
        videoTitle: cached.videoTitle || page.videoTitle,
        isOriginal: false
      };
    }

    // Fallback to original while translating
    return {
      title: page.title,
      textContent: page.textContent,
      videoTitle: page.videoTitle,
      isOriginal: true
    };
  };

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
  const displayContent = getDisplayContent(currentPage);
  const selectedLang = LANGUAGES.find((l) => l.code === selectedLanguage);

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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
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
          </div>

          {/* Language Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              id="language-selector-btn"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="inline-flex items-center gap-2.5 rounded-2xl border border-brand-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-ink-900 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-brand-400 hover:bg-white hover:shadow-md"
              style={{
                background: isLangDropdownOpen
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(239,246,255,0.95))'
                  : undefined
              }}
            >
              <Globe
                size={18}
                className={`transition-transform duration-300 ${isLangDropdownOpen ? 'rotate-180 text-brand-700' : 'text-brand-500'}`}
              />
              <span className="text-lg leading-none">{selectedLang?.flag}</span>
              <span>{selectedLang?.nativeLabel}</span>
              <svg
                className={`h-4 w-4 text-brand-400 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isLangDropdownOpen && (
              <div
                className="absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-brand-200 bg-white/95 shadow-xl backdrop-blur-md"
                style={{
                  animation: 'langDropdownIn 0.2s ease-out'
                }}
              >
                <div className="px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                    Select Language
                  </p>
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    id={`lang-option-${lang.code}`}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-all duration-150 ${
                      selectedLanguage === lang.code
                        ? 'bg-gradient-to-r from-brand-50 to-brand-100 text-brand-800'
                        : 'text-ink-800 hover:bg-brand-50'
                    }`}
                  >
                    <span className="text-xl leading-none">{lang.flag}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold">{lang.nativeLabel}</div>
                      <div className="text-[11px] font-medium text-ink-600">{lang.label}</div>
                    </div>
                    {selectedLanguage === lang.code && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-3 rounded-full bg-brand-700 px-4 py-2 text-xs font-bold text-white">
            <span>Page {currentPageIndex + 1} of {pages.length}</span>
          </div>

          {selectedLanguage !== 'en' && (
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <Globe size={12} />
              Translated to {selectedLang?.nativeLabel}
            </div>
          )}

          {isTranslating && (
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700">
              <Loader2 size={12} className="animate-spin" />
              Translating...
            </div>
          )}
        </div>
      </div>

      {/* Translation Error */}
      {translationError && (
        <div className="glass-panel rounded-2xl border-l-4 border-amber-400 p-4 shadow-card">
          <p className="text-sm font-semibold text-amber-800">{translationError}</p>
          <button
            type="button"
            onClick={() => translateCurrentPage(currentPageIndex, selectedLanguage)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-200"
          >
            <Globe size={12} /> Retry Translation
          </button>
        </div>
      )}

      {/* Main Content */}
      {currentPage && (
        <div className="glass-panel rounded-2xl p-8 shadow-card relative">
          {/* Translating overlay */}
          {isTranslating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Loader2 size={32} className="animate-spin text-brand-600" />
                  <Globe size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-700" />
                </div>
                <p className="text-sm font-bold text-brand-700">
                  Translating to {selectedLang?.nativeLabel}...
                </p>
              </div>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {currentPage.contentType === 'text' ? (
                <Type size={20} className="text-brand-700" />
              ) : (
                <Film size={20} className="text-accent-500" />
              )}
              <h2 className="text-2xl font-bold text-ink-900">{displayContent.title}</h2>
            </div>
          </div>

          {/* Text Content */}
          {(currentPage.contentType === 'text' || currentPage.contentType === 'mixed') && (displayContent.textContent) && (
            <div className="rounded-xl bg-white/50 p-6">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-ink-900">
                {displayContent.isOriginal
                  ? stripHtmlTags(displayContent.textContent)
                  : displayContent.textContent}
              </p>
            </div>
          )}

          {/* Video Content */}
          {(currentPage.contentType === 'video' || currentPage.contentType === 'mixed') && currentPage.videoUrl && (
            <div className="mt-6 space-y-3">
              {displayContent.videoTitle && (
                <h3 className="text-lg font-semibold text-ink-900">{displayContent.videoTitle}</h3>
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
                  title={displayContent.videoTitle || 'Video'}
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

      {/* Dropdown animation style */}
      <style>{`
        @keyframes langDropdownIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </section>
  );
};
