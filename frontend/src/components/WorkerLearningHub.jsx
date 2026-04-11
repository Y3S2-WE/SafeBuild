import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  ChevronRight,
  CircleCheck,
  Clock,
  Flame,
  GraduationCap,
  HardHat,
  LayersIcon,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Users
} from 'lucide-react';
import { api } from '../services/api';

// Map categories to CSS class suffixes
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

const getLevelIcon = (level = '') => {
  if (level === 'Beginner') return { icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (level === 'Intermediate') return { icon: Flame, color: 'text-amber-600', bg: 'bg-amber-50' };
  return { icon: ShieldCheck, color: 'text-red-600', bg: 'bg-red-50' };
};

export const WorkerLearningHub = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [enrollingId, setEnrollingId] = useState('');

  const enrolledCourseIds = useMemo(() => {
    return new Set(enrollments.map((item) => item.courseId?._id).filter(Boolean));
  }, [enrollments]);

  const loadLearningData = async () => {
    setLoading(true);
    setError('');

    try {
      const [courseResponse, enrollmentResponse] = await Promise.all([
        api.getCourses(),
        api.getMyEnrollments()
      ]);

      setCourses(courseResponse.data || []);
      setEnrollments(enrollmentResponse.data || []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load learning hub');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearningData();
  }, []);

  const handleEnroll = async (courseId) => {
    setError('');
    setSuccess('');

    try {
      setEnrollingId(courseId);
      await api.enrollInCourse(courseId);
      setSuccess('Enrollment successful. Course added to your learning list.');
      await loadLearningData();
    } catch (requestError) {
      setError(requestError.message || 'Enrollment failed');
    } finally {
      setEnrollingId('');
    }
  };

  const enrolledCount = enrolledCourseIds.size;
  const totalCount = courses.length;

  if (loading) {
    return (
      <div className="lms-hero-bg rounded-3xl p-12 text-center shadow-card">
        <div className="inline-flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-white/80">Loading learning hub...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* ── Hero Section ── */}
      <header className="lms-hero-bg rounded-3xl p-5 md:p-6 text-white shadow-card">
        {/* Floating Orbs */}
        <div className="floating-orb floating-orb-lg bg-cyan-400/15 -top-24 right-12" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-blue-400/10 -bottom-16 left-10" style={{ animationDelay: '2s' }} />
        <div className="floating-orb floating-orb-sm bg-indigo-300/15 top-1/2 right-1/3" style={{ animationDelay: '3.5s' }} />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="animate-fade-in-up" style={{ opacity: 0 }}>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 border border-white/10">
              <GraduationCap size={13} className="animate-pulse" /> Safety Learning Hub
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight">
              Your Safety <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Training Path</span>
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/75 leading-relaxed">
              Enroll in published courses to start your safety certification journey.
            </p>
          </div>

          {/* Enrollment Stat Chips */}
          <div className="animate-fade-in-up anim-delay-200 flex gap-2" style={{ opacity: 0 }}>
            <div className="lms-stat-chip !min-w-[72px] !px-3 !py-2">
              <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest">Enrolled</p>
              <p className="text-xl font-extrabold mt-0.5">{enrolledCount}</p>
              <BookOpenCheck size={12} className="text-cyan-300 mt-0.5" />
            </div>
            <div className="lms-stat-chip !min-w-[72px] !px-3 !py-2">
              <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest">Available</p>
              <p className="text-xl font-extrabold mt-0.5">{totalCount}</p>
              <LayersIcon size={12} className="text-cyan-300 mt-0.5" />
            </div>
            <button
              type="button"
              onClick={loadLearningData}
              className="lms-stat-chip !px-3 !py-2 hover:bg-white/15 transition-colors cursor-pointer"
            >
              <RefreshCw size={15} className="text-cyan-300" />
              <p className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest">Refresh</p>
            </button>
          </div>
        </div>
      </header>

      {/* ── Notifications ── */}
      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 backdrop-blur-sm px-5 py-4 text-sm font-medium text-red-700 flex items-center gap-3 shadow-sm">
          <div className="icon-container bg-red-100 text-red-600 !w-9 !h-9 !min-w-[36px]">
            <HardHat size={18} />
          </div>
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 backdrop-blur-sm px-5 py-4 text-sm font-medium text-emerald-700 flex items-center gap-3 shadow-sm">
          <div className="icon-container icon-container-emerald !w-9 !h-9 !min-w-[36px]">
            <CircleCheck size={18} />
          </div>
          {success}
        </div>
      )}

      {/* ── Course Grid ── */}
      {courses.length === 0 ? (
        <div className="glass-card-premium rounded-3xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 text-brand-600 mb-4">
            <BookOpenCheck size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-ink-900">No Courses Available Yet</h2>
          <p className="mt-2 text-sm text-ink-800">Check back later — your trainers are building courses.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink-900">
              Available Courses <span className="text-brand-600">({courses.length})</span>
            </h2>
            {enrolledCount > 0 && (
              <p className="text-sm text-emerald-700 font-semibold flex items-center gap-1.5">
                <CircleCheck size={16} /> {enrolledCount} enrolled
              </p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course, index) => {
              const isEnrolled = enrolledCourseIds.has(course._id);
              const isBusy = enrollingId === course._id;
              const catClass = getCategoryClass(course.category);
              const levelInfo = getLevelIcon(course.level);
              const LevelIcon = levelInfo.icon;

              return (
                <article
                  key={course._id}
                  className="course-card-lms animate-fade-in-up"
                  style={{ opacity: 0, animationDelay: `${index * 0.08}s` }}
                >
                  {/* Category Stripe */}
                  <div className={`card-top-stripe cat-${catClass}`} />

                  <div className="p-6">
                    {/* Top row: category + level */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider cat-pill-${catClass}`}>
                        <HardHat size={11} /> {course.category}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${levelInfo.bg} ${levelInfo.color}`}>
                        <LevelIcon size={11} /> {course.level}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className={`text-base font-extrabold leading-snug text-ink-900 mb-2 ${isEnrolled ? 'group-hover:text-brand-700 cursor-pointer' : ''}`}
                      onClick={() => isEnrolled && navigate(`/course-detail?courseId=${course._id}`)}
                    >
                      {course.title}
                    </h3>

                    <p className="text-sm text-ink-800 leading-relaxed line-clamp-3 mb-4">{course.description}</p>

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                        <Clock size={11} /> {course.duration}h
                      </span>
                      {course.totalLessons > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                          <LayersIcon size={11} /> {course.totalLessons} lessons
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    {isEnrolled ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/course-detail?courseId=${course._id}`)}
                        className="btn-premium btn-premium-emerald w-full text-sm"
                      >
                        <BookOpenCheck size={15} /> Continue Learning <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnroll(course._id);
                        }}
                        className="btn-premium btn-premium-brand w-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isBusy ? (
                          <><LoaderCircle size={15} className="animate-spin" /> Enrolling...</>
                        ) : (
                          <><GraduationCap size={15} /> Enroll Now <ChevronRight size={14} /></>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* ── My Enrollments Quick View ── */}
      {enrolledCount > 0 && (
        <section className="glass-card-premium rounded-3xl p-6 shadow-card animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="icon-container icon-container-emerald">
              <CircleCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">My Enrolled Courses</h2>
              <p className="text-xs text-ink-800 mt-0.5">Tap to resume your learning progress.</p>
            </div>
          </div>
          <div className="space-y-3">
            {courses
              .filter((c) => enrolledCourseIds.has(c._id))
              .map((course) => (
                <button
                  key={course._id}
                  type="button"
                  onClick={() => navigate(`/course-detail?courseId=${course._id}`)}
                  className="lesson-card-lms w-full text-left hover:cursor-pointer"
                >
                  <div className={`lesson-number-badge bg-gradient-to-br cat-${getCategoryClass(course.category)} !rounded-xl`}>
                    <BookOpenCheck size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink-900 truncate">{course.title}</p>
                    <p className="mt-0.5 text-xs text-ink-800 flex items-center gap-2">
                      <span>{course.category}</span>
                      <span className="text-brand-300">•</span>
                      <span>{course.duration}h</span>
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-brand-400 flex-shrink-0 self-center" />
                </button>
              ))}
          </div>
        </section>
      )}
    </section>
  );
};
