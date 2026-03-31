import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Award, BookOpen, Clock, LoaderCircle } from 'lucide-react';
import { api } from '../services/api';

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
      <div className="glass-panel rounded-2xl p-8 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-800">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass-panel rounded-2xl p-8 shadow-card">
        <p className="text-sm font-semibold text-red-700">{error || 'Course not found'}</p>
        <button
          type="button"
          onClick={() => navigate('/learning-hub')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-800"
        >
          <ArrowLeft size={15} /> Back to Courses
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-3xl p-7 shadow-card">
        <button
          type="button"
          onClick={() => navigate('/learning-hub')}
          className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800 transition hover:bg-brand-200"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">{course.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-800">{course.description}</p>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-100 px-3 py-1.5 text-xs font-bold text-brand-700">
              {course.category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Award size={16} className="text-brand-700" />
            <span className="text-sm font-semibold text-ink-800">{course.level} Level</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-brand-700" />
            <span className="text-sm font-semibold text-ink-800">{course.duration} hours</span>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 shadow-card">
        <h2 className="text-xl font-bold text-ink-900">Course Lessons</h2>
        <p className="mt-1 text-sm text-ink-800">
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} in this course
        </p>

        {lessons.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-white/75 px-4 py-6 text-center">
            <BookOpen size={24} className="mx-auto text-brand-400" />
            <p className="mt-3 text-sm font-semibold text-ink-800">No lessons available yet</p>
            <p className="mt-1 text-xs text-ink-700">The trainer is still building this course.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {lessons.map((lesson, index) => (
              <article
                key={lesson._id}
                className="rounded-xl border border-brand-100 bg-white/90 p-5 transition hover:border-brand-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-2 inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
                      Lesson {lesson.orderIndex || index + 1}
                    </div>
                    <h3 className="text-base font-bold text-ink-900">{lesson.title}</h3>

                    {lesson.description && (
                      <p className="mt-2 text-sm leading-relaxed text-ink-800">{lesson.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-ink-700">
                      {lesson.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {lesson.duration} minutes
                        </span>
                      )}
                      {lesson.pages && lesson.pages.length > 0 && (
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} /> {lesson.pages.length} page{lesson.pages.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/lesson-viewer?courseId=${courseId}&lessonId=${lesson._id}`)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800"
                >
                  <BookOpen size={15} /> Start Lesson
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
