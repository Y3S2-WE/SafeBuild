import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, CircleCheck, LoaderCircle } from 'lucide-react';
import { api } from '../services/api';

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

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5 shadow-card">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <LoaderCircle size={16} className="animate-spin" /> Loading learning hub...
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="glass-panel rounded-2xl p-5 shadow-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800">
          <BookOpenCheck size={14} /> Learning Hub
        </p>
        <h2 className="mt-3 text-xl font-bold text-ink-900">Available Safety Courses</h2>
        <p className="mt-1 text-sm text-ink-800">
          Courses published by trainers are listed below. Enroll to start your safety training path.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </p>
      )}

      {courses.length === 0 ? (
        <div className="glass-panel rounded-2xl p-6 shadow-card">
          <p className="text-sm text-ink-800">No published courses yet. Please check back later.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course._id);
            const isBusy = enrollingId === course._id;

            return (
              <article
                key={course._id}
                className="glass-panel rounded-2xl p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
                onClick={() => isEnrolled && navigate(`/course-detail?courseId=${course._id}`)}
                style={{ cursor: isEnrolled ? 'pointer' : 'default' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-extrabold leading-snug text-ink-900">{course.title}</h3>
                  <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800">
                    {course.level}
                  </span>
                </div>

                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-brand-700">{course.category}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-800">{course.description}</p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-700">Duration: {course.duration}h</span>
                  {isEnrolled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      <CircleCheck size={13} /> Enrolled
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnroll(course._id);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isBusy ? <LoaderCircle size={13} className="animate-spin" /> : null}
                      {isBusy ? 'Enrolling...' : 'Enroll Course'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
