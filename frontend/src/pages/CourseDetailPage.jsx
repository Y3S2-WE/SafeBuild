import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  BookOpenCheck,
  ChevronRight,
  Clock,
  Film,
  Flame,
  HardHat,
  LayersIcon,
  LoaderCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Type
} from 'lucide-react';
import { api } from '../services/api';

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

const getLevelInfo = (level = '') => {
  if (level === 'Beginner') return { icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (level === 'Intermediate') return { icon: Flame, color: 'text-amber-600', bg: 'bg-amber-50' };
  return { icon: ShieldCheck, color: 'text-red-600', bg: 'bg-red-50' };
};

export const CourseDetailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) {
      navigate('/learning-hub');
      return;
    }

    const loadCourseData = async () => {
      setLoading(true);
      setError('');

      try {
        const [courseResponse, lessonsResponse] = await Promise.all([
          api.getCourses(),
          api.getLessonsByCourse(courseId)
        ]);

        const foundCourse = courseResponse.data?.find((c) => c._id === courseId);
        if (!foundCourse || foundCourse.status !== 'Published') {
          setError('Course not found or not published');
          setTimeout(() => navigate('/learning-hub'), 2000);
          return;
        }

        setCourse(foundCourse);
        setLessons(lessonsResponse.data || []);
      } catch (requestError) {
        setError(requestError.message || 'Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, navigate]);

  if (loading) {
    return (
      <div className="lms-hero-bg rounded-3xl p-12 text-center shadow-card">
        <div className="inline-flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-white/80">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass-card-premium rounded-3xl p-8 shadow-card">
        <p className="text-sm font-semibold text-red-700">{error || 'Course not found'}</p>
        <button
          type="button"
          onClick={() => navigate('/learning-hub')}
          className="mt-4 btn-premium btn-premium-brand text-sm"
        >
          <ArrowLeft size={15} /> Back to Courses
        </button>
      </div>
    );
  }

  const catClass = getCategoryClass(course.category);
  const levelInfo = getLevelInfo(course.level);
  const LevelIcon = levelInfo.icon;

  return (
    <section className="space-y-6">
      {/* ── Hero Header ── */}
      <header className="lms-hero-bg rounded-3xl p-8 md:p-10 text-white shadow-card">
        {/* Floating Orbs */}
        <div className="floating-orb floating-orb-lg bg-cyan-400/15 -top-24 right-8" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-indigo-400/10 -bottom-14 left-10" style={{ animationDelay: '2.5s' }} />

        <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/60 mb-4">
            <button
              type="button"
              onClick={() => navigate('/learning-hub')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={13} /> Learning Hub
            </button>
            <ChevronRight size={12} />
            <span className="text-white/90 font-semibold">{course.title}</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              {/* Category + Level Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 backdrop-blur-sm border border-white/15 text-white`}>
                  <HardHat size={12} /> {course.category}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold bg-white/15 backdrop-blur-sm border border-white/15 text-white`}>
                  <LevelIcon size={12} /> {course.level}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-200">
                  <BookOpenCheck size={12} /> Published
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight max-w-2xl">
                {course.title}
              </h1>
              <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-2xl">{course.description}</p>
            </div>

            {/* Stats Chips */}
            <div className="flex flex-wrap gap-3">
              <div className="lms-stat-chip">
                <Clock size={16} className="text-cyan-300" />
                <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest mt-1">Duration</p>
                <p className="text-lg font-extrabold">{course.duration}h</p>
              </div>
              <div className="lms-stat-chip">
                <LayersIcon size={16} className="text-cyan-300" />
                <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest mt-1">Lessons</p>
                <p className="text-lg font-extrabold">{lessons.length}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Lesson List ── */}
      <article className="glass-card-premium rounded-3xl p-6 shadow-card animate-fade-in-up" style={{ opacity: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="icon-container icon-container-brand">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-900">Course Lessons</h2>
            <p className="text-xs text-ink-800 mt-0.5">
              {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} — click any lesson to begin
            </p>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white/60 px-6 py-10 text-center">
            <div className="icon-container icon-container-brand mx-auto mb-3">
              <BookOpen size={22} />
            </div>
            <p className="text-sm font-semibold text-ink-800">No lessons available yet</p>
            <p className="mt-1 text-xs text-ink-700">The trainer is still building this course.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const textPages = lesson.pages?.filter(p => p.contentType === 'text' || p.contentType === 'mixed') || [];
              const videoPages = lesson.pages?.filter(p => p.contentType === 'video' || p.contentType === 'mixed') || [];

              return (
                <div
                  key={lesson._id}
                  className="lesson-card-lms animate-fade-in-up"
                  style={{ opacity: 0, animationDelay: `${index * 0.06}s` }}
                >
                  {/* Lesson Number Badge */}
                  <div className="lesson-number-badge">
                    {lesson.orderIndex || index + 1}
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-ink-900">{lesson.title}</h3>
                    </div>

                    {lesson.description && (
                      <p className="text-xs text-ink-800 leading-relaxed line-clamp-2 mb-2">{lesson.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-ink-700 font-semibold">
                      {lesson.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {lesson.duration} min
                        </span>
                      )}
                      {lesson.pages?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <LayersIcon size={11} /> {lesson.pages.length} page{lesson.pages.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {textPages.length > 0 && (
                        <span className="flex items-center gap-1 text-brand-600">
                          <Type size={11} /> {textPages.length} text
                        </span>
                      )}
                      {videoPages.length > 0 && (
                        <span className="flex items-center gap-1 text-accent-600">
                          <Film size={11} /> {videoPages.length} video
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Start Button */}
                  <button
                    type="button"
                    onClick={() => navigate(`/lesson-viewer?courseId=${courseId}&lessonId=${lesson._id}`)}
                    className="btn-premium btn-premium-brand !py-2.5 !px-4 text-xs flex-shrink-0"
                  >
                    <Play size={13} /> Start
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
};
