import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Film,
  Globe,
  Loader2,
  Play,
  RotateCcw,
  Type
} from 'lucide-react';
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
      <div className="lms-hero-bg rounded-3xl p-12 text-center shadow-card">
        <div className="inline-flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-white/80">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="glass-card-premium rounded-3xl p-8 shadow-card">
        <p className="mb-4 text-sm font-semibold text-red-700">{error || 'Lesson not found'}</p>
        <button
          type="button"
          onClick={() => navigate(`/course-detail?courseId=${courseId}`)}
          className="btn-premium btn-premium-brand text-sm"
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
        <header className="lms-hero-bg rounded-3xl p-8 text-white shadow-card">
          <div className="floating-orb floating-orb-md bg-cyan-400/15 -top-16 right-8" style={{ animationDelay: '0s' }} />
          <div className="relative z-10">
            <button
              type="button"
              onClick={() => navigate(`/course-detail?courseId=${courseId}`)}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white border border-white/10 transition mb-4"
            >
              <ArrowLeft size={14} /> Back to Course
            </button>
            <h1 className="text-3xl font-extrabold">{lesson.title}</h1>
          </div>
        </header>

        <div className="glass-card-premium rounded-3xl p-10 text-center shadow-card">
          <div className="icon-container icon-container-brand mx-auto mb-4">
            <Type size={22} />
          </div>
          <p className="text-sm font-semibold text-ink-800">This lesson has no content pages yet.</p>
          <p className="mt-2 text-xs text-ink-700">Please check back later as the trainer adds content.</p>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentPageIndex + 1) / pages.length) * 100);

  return (
    <section className="space-y-6">
      {/* ── Header ── */}
      <header className="lms-hero-bg rounded-3xl p-7 md:p-8 text-white shadow-card relative z-50">
        <div className="floating-orb floating-orb-md bg-cyan-400/15 -top-16 right-8" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-sm bg-indigo-300/10 -bottom-10 left-10" style={{ animationDelay: '2s' }} />

        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              {/* Back button */}
              <button
                type="button"
                onClick={() => navigate(`/course-detail?courseId=${courseId}`)}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white border border-white/10 transition mb-4"
              >
                <ArrowLeft size={14} /> Back to Course
              </button>

              <h1 className="text-2xl md:text-3xl font-extrabold leading-snug">{lesson.title}</h1>
              {lesson.description && (
                <p className="mt-2 text-sm text-white/75 leading-relaxed max-w-2xl">{lesson.description}</p>
              )}

              {/* Page indicator + translation badges */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white border border-white/10">
                  Page {currentPageIndex + 1} <span className="text-white/50">/</span> {pages.length}
                </div>

                {selectedLanguage !== 'en' && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 px-3 py-1.5 text-xs font-bold text-emerald-200">
                    <Globe size={12} /> {selectedLang?.nativeLabel}
                  </div>
                )}

                {isTranslating && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 px-3 py-1.5 text-xs font-bold text-amber-200">
                    <Loader2 size={12} className="animate-spin" /> Translating...
                  </div>
                )}
              </div>
            </div>

            {/* Language Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                id="language-selector-btn"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="inline-flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <Globe
                  size={18}
                  className={`transition-transform duration-300 ${isLangDropdownOpen ? 'rotate-180 text-cyan-300' : 'text-white/80'}`}
                />
                <span className="text-lg leading-none">{selectedLang?.flag}</span>
                <span>{selectedLang?.nativeLabel}</span>
                <svg
                  className={`h-4 w-4 text-white/50 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`}
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
                  style={{ animation: 'langDropdownIn 0.2s ease-out' }}
                >
                  <div className="px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Select Language</p>
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

          {/* Progress bar (full width below) */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-white transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-white/70">{progressPercent}%</span>
          </div>
        </div>
      </header>

      {/* ── Translation Error ── */}
      {translationError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 backdrop-blur-sm px-5 py-4 text-sm font-medium text-amber-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="icon-container icon-container-amber !w-9 !h-9 !min-w-[36px]">
              <Globe size={18} />
            </div>
            {translationError}
          </div>
          <button
            type="button"
            onClick={() => translateCurrentPage(currentPageIndex, selectedLanguage)}
            className="btn-premium btn-premium-gold text-xs whitespace-nowrap"
          >
            <RotateCcw size={13} /> Retry
          </button>
        </div>
      )}

      {/* ── Main Content Card ── */}
      {currentPage && (
        <article className="glass-card-premium rounded-3xl shadow-card relative overflow-hidden">
          {/* Translating overlay */}
          {isTranslating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Loader2 size={36} className="animate-spin text-brand-600" />
                  <Globe size={18} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-700" />
                </div>
                <p className="text-sm font-bold text-brand-700">Translating to {selectedLang?.nativeLabel}...</p>
              </div>
            </div>
          )}

          {/* Page type header */}
          <div className="flex items-center gap-3 px-7 pt-7 pb-5 border-b border-brand-100">
            <div className={`icon-container ${currentPage.contentType === 'text' ? 'icon-container-brand' : 'icon-container-amber'}`}>
              {currentPage.contentType === 'text' ? <Type size={18} /> : <Film size={18} />}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">
                {currentPage.contentType === 'text' ? 'Reading' : currentPage.contentType === 'video' ? 'Video Lesson' : 'Mixed Content'} · Page {currentPageIndex + 1}
              </p>
              <h2 className="text-xl font-extrabold text-ink-900 mt-0.5">{displayContent.title}</h2>
            </div>
          </div>

          {/* Content area */}
          <div className="p-7">
            {/* Text Content */}
            {(currentPage.contentType === 'text' || currentPage.contentType === 'mixed') && displayContent.textContent && (
              <div className="rounded-2xl bg-gradient-to-br from-white to-brand-50/30 border border-brand-100/60 p-6 mb-6">
                {displayContent.isOriginal ? (
                  <div
                    className="ql-editor-content content-reader"
                    dangerouslySetInnerHTML={{ __html: displayContent.textContent }}
                  />
                ) : (
                  <p className="content-reader whitespace-pre-wrap">{displayContent.textContent}</p>
                )}
              </div>
            )}

            {/* Video Content */}
            {(currentPage.contentType === 'video' || currentPage.contentType === 'mixed') && currentPage.videoUrl && (
              <div className="space-y-3">
                {displayContent.videoTitle && (
                  <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
                    <Play size={16} className="text-accent-500" /> {displayContent.videoTitle}
                  </h3>
                )}
                <div className="video-embed-container">
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
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>
        </article>
      )}

      {/* ── Navigation & Page Thumbnails ── */}
      <article className="glass-card-premium rounded-3xl p-5 shadow-card">
        {/* Prev / Next */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0}
            className="btn-premium btn-premium-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={17} /> Previous
          </button>

          <span className="text-sm font-extrabold text-ink-900">
            {currentPageIndex + 1} <span className="text-brand-400 font-normal">/</span> {pages.length}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPageIndex === pages.length - 1}
            className="btn-premium btn-premium-brand text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={17} />
          </button>
        </div>

        {/* Page Thumbnails */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {pages.map((page, index) => (
            <button
              key={page._id}
              type="button"
              onClick={() => handlePageSelect(index)}
              className={`page-thumb ${index === currentPageIndex ? 'page-thumb-active' : ''}`}
            >
              {page.contentType === 'text' ? <Type size={11} /> : <Film size={11} />}
              {page.title.substring(0, 18)}{page.title.length > 18 ? '…' : ''}
            </button>
          ))}
        </div>
      </article>

      {/* Dropdown animation style */}
      <style>{`
        @keyframes langDropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </section>
  );
};
