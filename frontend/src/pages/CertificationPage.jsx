import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck,
  HelpCircle,
  Layers,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  Trophy,
  X,
  Zap
} from 'lucide-react';
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
      <section className="glass-card-premium rounded-3xl p-10 shadow-card text-center max-w-xl mx-auto mt-12">
        <div className="icon-container icon-container-amber mx-auto mb-4">
          <ShieldAlert size={22} />
        </div>
        <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-700 mb-4">
          <ShieldAlert size={14} /> Worker View Only
        </p>
        <h1 className="text-2xl font-extrabold text-ink-900">Certification Explorer</h1>
        <p className="mt-3 text-sm text-ink-800 leading-relaxed">
          This page is available for employees (worker role) to enroll and complete certification quizzes.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {/* ── Hero Section with Background Image ── */}
      <header className="quiz-hero-bg rounded-3xl p-8 md:p-10 text-white shadow-card">
        {/* Floating Orbs */}
        <div className="floating-orb floating-orb-lg bg-cyan-400/20 -top-20 right-10" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-orange-400/15 -bottom-16 left-8" style={{ animationDelay: '2s' }} />
        <div className="floating-orb floating-orb-sm bg-blue-300/20 top-1/2 right-1/3" style={{ animationDelay: '4s' }} />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="animate-fade-in-up" style={{ opacity: 0 }}>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 border border-white/10">
              <Sparkles size={14} className="animate-pulse" /> Certification Pathway
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight">
              Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Certifications</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80 leading-relaxed">
              Certifications are powered by quizzes. Browse, inspect details, and enroll to start your certification journey.
            </p>
          </div>

          <div className="animate-fade-in-up anim-delay-200 flex gap-3" style={{ opacity: 0 }}>
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-4 text-center">
              <p className="text-xs font-semibold text-cyan-200 uppercase tracking-widest">Enrolled</p>
              <p className="text-3xl font-extrabold mt-1 badge-pulse inline-block">{enrolledQuizIds.length}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-4 text-center">
              <p className="text-xs font-semibold text-cyan-200 uppercase tracking-widest">Available</p>
              <p className="text-3xl font-extrabold mt-1">{certificationQuizzes.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Error State ── */}
      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 backdrop-blur-sm px-5 py-4 text-sm font-medium text-red-700 flex items-center gap-3 animate-fade-in-up shadow-sm">
          <div className="icon-container bg-red-100 text-red-600">
            <ShieldAlert size={18} />
          </div>
          {error}
        </div>
      )}

      {/* ── Loading State ── */}
      {isLoading ? (
        <div className="glass-card-premium rounded-3xl p-12 text-center shadow-card">
          <div className="inline-flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-brand-800">Loading certifications...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Quiz Cards Grid ── */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {certificationQuizzes.map((quiz, index) => {
              const isEnrolled = enrolledQuizIds.includes(quiz._id);
              return (
                <article
                  key={quiz._id}
                  className="group glass-card-premium rounded-3xl p-6 animate-fade-in-up relative"
                  style={{ opacity: 0, animationDelay: `${index * 0.1}s` }}
                >
                  {/* Top Gradient Accent */}
                  <div className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400 opacity-60 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    {/* Header Badges */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="icon-container icon-container-brand">
                          <BookOpenCheck size={20} />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">
                          Certification Quiz
                        </p>
                      </div>
                      {isEnrolled && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm badge-pulse">
                          <CheckCircle2 size={13} /> Enrolled
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h2 className="text-lg font-extrabold text-ink-900 group-hover:text-brand-700 transition-colors leading-snug">
                      {quiz.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm text-ink-800 leading-relaxed">{quiz.description}</p>

                    {/* Stats Row */}
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 px-3 py-2.5 text-center group-hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <HelpCircle size={11} className="text-brand-500" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Questions</p>
                        </div>
                        <p className="text-sm font-extrabold text-ink-900">{quiz.questions?.length || 0}</p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 px-3 py-2.5 text-center group-hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Target size={11} className="text-brand-500" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Pass</p>
                        </div>
                        <p className="text-sm font-extrabold text-ink-900">{quiz.passMark}%</p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 px-3 py-2.5 text-center group-hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock3 size={11} className="text-brand-500" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Time</p>
                        </div>
                        <p className="text-sm font-extrabold text-ink-900">{quiz.timeLimit || '-'}m</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedQuiz(quiz)}
                        className="btn-premium btn-premium-outline flex-1 text-sm"
                      >
                        <Layers size={14} /> Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEnroll(quiz._id)}
                        className="btn-premium btn-premium-brand flex-1 text-sm"
                      >
                        {isEnrolled ? (
                          <><Zap size={14} /> Open Workspace</>
                        ) : (
                          <><Award size={14} /> Enroll</>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {certificationQuizzes.length === 0 && (
            <div className="glass-card-premium rounded-3xl p-12 text-center animate-fade-in-up" style={{ opacity: 0 }}>
              <div className="icon-container icon-container-brand mx-auto mb-4">
                <FileCheck size={22} />
              </div>
              <h2 className="text-xl font-extrabold text-ink-900">No Certifications Available</h2>
              <p className="mt-2 text-sm text-ink-800">Check back later for new certification quizzes.</p>
            </div>
          )}
        </>
      )}

      {/* ── Quiz Details Modal ── */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-40 flex items-center justify-center modal-overlay px-4">
          <div className="w-full max-w-2xl animate-scale-in rounded-3xl glass-card-premium p-7 shadow-card-hover border border-white/50 relative overflow-hidden">
            {/* Modal Decorative Element */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                  <Trophy size={13} /> Quiz Details
                </p>
                <h3 className="mt-4 text-2xl font-extrabold text-ink-900">{selectedQuiz.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuiz(null)}
                className="rounded-full w-10 h-10 flex items-center justify-center bg-brand-50 hover:bg-brand-100 text-brand-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-sm text-ink-800 leading-relaxed">{selectedQuiz.description}</p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Questions', value: selectedQuiz.questions?.length || 0, icon: HelpCircle, color: 'brand' },
                { label: 'Pass Mark', value: `${selectedQuiz.passMark}%`, icon: Target, color: 'emerald' },
                { label: 'Time Limit', value: `${selectedQuiz.timeLimit || '-'} mins`, icon: Clock3, color: 'amber' },
                { label: 'Total Points', value: selectedQuiz.totalPoints || 0, icon: Star, color: 'purple' }
              ].map((stat) => (
                <div key={stat.label} className="stat-card-glow text-center">
                  <div className={`icon-container icon-container-${stat.color} mx-auto mb-2`}>
                    <stat.icon size={18} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">{stat.label}</p>
                  <p className="mt-1 text-xl font-extrabold text-ink-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedQuiz(null)}
                className="btn-premium btn-premium-outline text-sm"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => handleEnroll(selectedQuiz._id)}
                className="btn-premium btn-premium-emerald text-sm"
              >
                <Award size={15} /> Enroll & Start Quiz <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
