import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, CheckCircle2, Clock3, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ENROLL_STORAGE_KEY = 'safebuild_enrolled_quizzes';

const getEnrolledQuizIds = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(ENROLL_STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const saveEnrolledQuizIds = (ids) => {
  localStorage.setItem(ENROLL_STORAGE_KEY, JSON.stringify(ids));
};

export const CertificationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [enrolledQuizIds, setEnrolledQuizIds] = useState(getEnrolledQuizIds());

  const certificationQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.isActive),
    [quizzes]
  );

  useEffect(() => {
    const loadQuizzes = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await api.getAllQuizzes();
        const list = Array.isArray(response.data) ? response.data : [];
        setQuizzes(list);
      } catch (loadError) {
        setError(loadError.message || 'Failed to load certifications');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const handleEnroll = (quizId) => {
    const next = enrolledQuizIds.includes(quizId) ? enrolledQuizIds : [...enrolledQuizIds, quizId];
    setEnrolledQuizIds(next);
    saveEnrolledQuizIds(next);
    setSelectedQuiz(null);
    navigate(`/quiz-workspace?quizId=${quizId}`);
  };

  if (user?.role !== 'worker') {
    return (
      <section className="glass-panel rounded-3xl p-8 shadow-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
          <ShieldAlert size={14} /> Worker View Only
        </p>
        <h1 className="mt-4 text-2xl font-extrabold text-ink-900">Certification Explorer</h1>
        <p className="mt-2 text-sm text-ink-800">This page is available for employees (worker role) to enroll and complete certification quizzes.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#12244e] via-[#1a3b78] to-[#2566c4] p-7 text-white shadow-card">
        <div className="pointer-events-none absolute -top-20 right-8 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-orange-300/15 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
              <Sparkles size={14} /> Certification Pathway
            </p>
            <h1 className="mt-4 text-3xl font-extrabold">Explore Certifications</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              Certifications are powered by quizzes. Browse, inspect details, and enroll to start your certification journey.
            </p>
          </div>
          <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm">
            <p className="text-cyan-100">Enrolled Quizzes</p>
            <p className="text-2xl font-extrabold">{enrolledQuizIds.length}</p>
          </div>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      {isLoading ? (
        <div className="glass-panel rounded-3xl p-8 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-800">Loading certifications...</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {certificationQuizzes.map((quiz) => {
            const isEnrolled = enrolledQuizIds.includes(quiz._id);
            return (
              <article
                key={quiz._id}
                className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-200/40 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-2">
                    <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
                      <BookOpenCheck size={14} /> Certification Quiz
                    </p>
                    {isEnrolled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 size={13} /> Enrolled
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-lg font-extrabold text-ink-900">{quiz.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-800">{quiz.description}</p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-brand-50 px-2 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Questions</p>
                      <p className="text-sm font-extrabold text-ink-900">{quiz.questions?.length || 0}</p>
                    </div>
                    <div className="rounded-xl bg-brand-50 px-2 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Pass</p>
                      <p className="text-sm font-extrabold text-ink-900">{quiz.passMark}%</p>
                    </div>
                    <div className="rounded-xl bg-brand-50 px-2 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Time</p>
                      <p className="text-sm font-extrabold text-ink-900">{quiz.timeLimit || '-'}m</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedQuiz(quiz)}
                      className="flex-1 rounded-xl border border-brand-300 bg-white px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEnroll(quiz._id)}
                      className="flex-1 rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
                    >
                      {isEnrolled ? 'Open Workspace' : 'Enroll'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedQuiz && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-2xl animate-rise rounded-3xl border border-white/70 bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                  <Clock3 size={13} /> Quiz Details
                </p>
                <h3 className="mt-3 text-2xl font-extrabold text-ink-900">{selectedQuiz.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuiz(null)}
                className="rounded-full border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-700"
              >
                Close
              </button>
            </div>

            <p className="mt-4 text-sm text-ink-800">{selectedQuiz.description}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Questions</p>
                <p className="mt-1 text-lg font-extrabold text-ink-900">{selectedQuiz.questions?.length || 0}</p>
              </div>
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Pass Mark</p>
                <p className="mt-1 text-lg font-extrabold text-ink-900">{selectedQuiz.passMark}%</p>
              </div>
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Time Limit</p>
                <p className="mt-1 text-lg font-extrabold text-ink-900">{selectedQuiz.timeLimit || '-'} mins</p>
              </div>
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Total Points</p>
                <p className="mt-1 text-lg font-extrabold text-ink-900">{selectedQuiz.totalPoints || 0}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedQuiz(null)}
                className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => handleEnroll(selectedQuiz._id)}
                className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Enroll & Start Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
