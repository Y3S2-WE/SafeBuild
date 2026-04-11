import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileCheck,
  HelpCircle,
  Layers,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  X,
  XCircle,
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

export const QuizWorkspace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [quizzes, setQuizzes] = useState([]);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(searchParams.get('quizId') || '');
  const [selectedQuizDetails, setSelectedQuizDetails] = useState(null);
  const [startedAt, setStartedAt] = useState(new Date().toISOString());

  const [answersByIndex, setAnswersByIndex] = useState({});
  const [resultModal, setResultModal] = useState({ open: false, payload: null });

  const enrolledQuizIds = useMemo(() => getEnrolledQuizIds(), [selectedQuizId]);

  const answeredCount = useMemo(() => {
    return Object.values(answersByIndex).filter((v) => v !== null && v !== undefined).length;
  }, [answersByIndex]);

  const totalQuestions = selectedQuizDetails?.questions?.length || 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [quizRes, myAttemptRes] = await Promise.all([api.getAllQuizzes(), api.getMyAttempts()]);

        const allQuizzes = Array.isArray(quizRes.data) ? quizRes.data : [];
        const activeQuizzes = allQuizzes.filter((quiz) => quiz.isActive);
        setQuizzes(activeQuizzes);

        const attempts = Array.isArray(myAttemptRes.data) ? myAttemptRes.data : [];
        setAttemptHistory(attempts);

        if (!selectedQuizId && activeQuizzes.length > 0) {
          const firstEnrolled = activeQuizzes.find((quiz) => enrolledQuizIds.includes(quiz._id));
          setSelectedQuizId(firstEnrolled?._id || activeQuizzes[0]._id);
        }
      } catch (loadError) {
        setError(loadError.message || 'Failed to load quiz workspace');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadQuizDetails = async () => {
      if (!selectedQuizId) return;

      try {
        const response = await api.getQuizById(selectedQuizId);
        const quiz = response.data;
        setSelectedQuizDetails(quiz);

        const initialAnswers = {};
        (quiz.questions || []).forEach((_, index) => {
          initialAnswers[index] = null;
        });
        setAnswersByIndex(initialAnswers);
        setStartedAt(new Date().toISOString());
      } catch (loadError) {
        setError(loadError.message || 'Failed to load selected quiz');
      }
    };

    loadQuizDetails();
  }, [selectedQuizId]);

  const enrollSelectedQuiz = () => {
    if (!selectedQuizId) return;
    const next = enrolledQuizIds.includes(selectedQuizId) ? enrolledQuizIds : [...enrolledQuizIds, selectedQuizId];
    saveEnrolledQuizIds(next);
    setSelectedQuizId((prev) => prev);
  };

  const isSelectedQuizEnrolled = selectedQuizId ? enrolledQuizIds.includes(selectedQuizId) : false;

  const handleSubmit = async () => {
    if (!selectedQuizDetails) return;

    const totalQ = selectedQuizDetails.questions?.length || 0;
    const unanswered = Object.values(answersByIndex).filter((value) => value === null || value === undefined).length;

    if (unanswered > 0) {
      setError(`Please answer all questions before submit. Remaining: ${unanswered}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const answers = Array.from({ length: totalQ }, (_, index) => ({
        selectedAnswer: Number(answersByIndex[index])
      }));

      const response = await api.submitQuizAttempt({
        quizId: selectedQuizId,
        startedAt,
        answers
      });

      setResultModal({ open: true, payload: response.data });

      const latestAttempts = await api.getMyAttempts(selectedQuizId);
      setAttemptHistory(Array.isArray(latestAttempts.data) ? latestAttempts.data : []);
    } catch (submitError) {
      setError(submitError.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const claimCertificate = () => {
    const code = resultModal?.payload?.certificate?.certificateCode;
    if (!code) return;
    navigate(`/certificate?code=${code}`);
  };

  if (user?.role !== 'worker') {
    return (
      <section className="glass-card-premium rounded-3xl p-10 shadow-card text-center max-w-xl mx-auto mt-12">
        <div className="icon-container icon-container-brand mx-auto mb-4">
          <ClipboardCheck size={22} />
        </div>
        <h1 className="text-2xl font-extrabold text-ink-900">Quiz Workspace</h1>
        <p className="mt-3 text-sm text-ink-800 leading-relaxed">This workspace is for employees (worker role) to take certification quizzes.</p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {/* ── Hero Section ── */}
      <header className="quiz-hero-bg rounded-3xl p-8 md:p-10 text-white shadow-card">
        <div className="floating-orb floating-orb-lg bg-cyan-400/20 -top-20 right-10" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-yellow-400/15 -bottom-16 left-8" style={{ animationDelay: '2s' }} />
        <div className="floating-orb floating-orb-sm bg-purple-300/15 top-1/3 right-1/4" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
          <div className="animate-fade-in-up" style={{ opacity: 0 }}>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 border border-white/10">
              <Sparkles size={14} className="animate-pulse" /> Certification Quiz Workspace
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight">
              Enroll, Attempt, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Submit</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80 leading-relaxed">
              Select an enrolled quiz, complete all questions, submit answers, then claim certificate if you pass.
            </p>
          </div>

          {/* Progress Ring */}
          {selectedQuizDetails && isSelectedQuizEnrolled && (
            <div className="animate-fade-in-up anim-delay-200 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-4 text-center" style={{ opacity: 0 }}>
              <p className="text-xs font-semibold text-cyan-200 uppercase tracking-widest mb-1">Progress</p>
              <p className="text-3xl font-extrabold">{answeredCount}<span className="text-lg text-white/60">/{totalQuestions}</span></p>
              <div className="mt-2 w-24 h-1.5 rounded-full bg-white/20 mx-auto overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-white transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 backdrop-blur-sm px-5 py-4 text-sm font-medium text-red-700 flex items-center gap-3 animate-fade-in-up shadow-sm">
          <div className="icon-container bg-red-100 text-red-600 !w-9 !h-9 !min-w-[36px]">
            <XCircle size={18} />
          </div>
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading ? (
        <div className="glass-card-premium rounded-3xl p-12 text-center shadow-card">
          <div className="inline-flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-brand-800">Loading workspace...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          {/* ── Sidebar: Quiz List ── */}
          <aside className="glass-card-premium rounded-3xl p-5 shadow-card animate-fade-in-up" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                <Layers size={18} className="text-brand-600" /> My Quizzes
              </h2>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-700">{quizzes.length}</span>
            </div>
            <div className="space-y-2">
              {quizzes.length === 0 && <p className="text-sm text-ink-800">No active quizzes available.</p>}
              {quizzes.map((quiz) => {
                const isEnrolled = enrolledQuizIds.includes(quiz._id);
                const isSelected = selectedQuizId === quiz._id;
                return (
                  <button
                    key={quiz._id}
                    type="button"
                    onClick={() => setSelectedQuizId(quiz._id)}
                    className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 group ${
                      isSelected
                        ? 'border-brand-400 bg-gradient-to-r from-brand-50 to-brand-100/50 shadow-md shadow-brand-100/50'
                        : 'border-white/60 bg-white/70 hover:border-brand-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`icon-container !w-9 !h-9 !min-w-[36px] !rounded-lg ${isSelected ? 'icon-container-brand' : 'bg-gray-100 text-gray-500'}`}>
                        <FileCheck size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink-900 truncate">{quiz.title}</p>
                        <p className="mt-0.5 text-xs text-ink-800 flex items-center gap-1.5 flex-wrap">
                          <span>{quiz.questions?.length || 0} Qs</span>
                          <span className="text-brand-300">•</span>
                          <span>Pass {quiz.passMark}%</span>
                          {isEnrolled && (
                            <>
                              <span className="text-brand-300">•</span>
                              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold">
                                <CheckCircle2 size={10} /> Enrolled
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Main Content ── */}
          <article className="glass-card-premium rounded-3xl p-6 shadow-card animate-fade-in-up anim-delay-100" style={{ opacity: 0 }}>
            {!selectedQuizDetails ? (
              <div className="text-center py-12">
                <div className="icon-container icon-container-brand mx-auto mb-4">
                  <ClipboardCheck size={22} />
                </div>
                <p className="text-sm text-ink-800 font-medium">Select a quiz to start.</p>
              </div>
            ) : (
              <>
                {/* Quiz Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-brand-100">
                  <div>
                    <h2 className="text-2xl font-extrabold text-ink-900">{selectedQuizDetails.title}</h2>
                    <p className="mt-2 text-sm text-ink-800 leading-relaxed max-w-2xl">{selectedQuizDetails.description}</p>
                  </div>
                  <div className="stat-card-glow text-right !p-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700">Pass Mark</p>
                        <p className="text-2xl font-extrabold text-ink-900">{selectedQuizDetails.passMark}%</p>
                      </div>
                      <div className="icon-container icon-container-brand">
                        <Target size={18} />
                      </div>
                    </div>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-800">
                      <Timer size={12} className="text-brand-500" /> {selectedQuizDetails.timeLimit || '-'} mins
                    </p>
                  </div>
                </div>

                {/* Enroll Prompt */}
                {!isSelectedQuizEnrolled && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/50 px-5 py-4 flex items-center justify-between gap-3 animate-fade-in-up" style={{ opacity: 0 }}>
                    <div className="flex items-center gap-3">
                      <div className="icon-container icon-container-amber">
                        <Zap size={18} />
                      </div>
                      <p className="text-sm font-medium text-amber-800">You are not enrolled for this quiz yet.</p>
                    </div>
                    <button
                      type="button"
                      onClick={enrollSelectedQuiz}
                      className="btn-premium btn-premium-gold text-sm whitespace-nowrap"
                    >
                      <Award size={14} /> Enroll Now
                    </button>
                  </div>
                )}

                {/* Questions */}
                {isSelectedQuizEnrolled && (
                  <>
                    {/* Progress Bar */}
                    <div className="mt-5 flex items-center gap-3">
                      <div className="progress-bar-track flex-1">
                        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <span className="text-xs font-bold text-brand-700 whitespace-nowrap">{answeredCount}/{totalQuestions}</span>
                    </div>

                    <div className="mt-5 space-y-4">
                      {(selectedQuizDetails.questions || []).map((question, qIndex) => (
                        <div
                          key={question._id}
                          className="rounded-2xl border border-brand-100/80 bg-gradient-to-br from-white to-brand-50/30 p-5 animate-fade-in-up shadow-sm hover:shadow-md transition-shadow"
                          style={{ opacity: 0, animationDelay: `${qIndex * 0.05}s` }}
                        >
                          {/* Question Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold">
                              {qIndex + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600">
                                Question {qIndex + 1} • {question.points} point{question.points !== 1 ? 's' : ''}
                              </p>
                            </div>
                            {answersByIndex[qIndex] !== null && answersByIndex[qIndex] !== undefined && (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            )}
                          </div>
                          <p className="text-sm font-bold text-ink-900 leading-relaxed mb-3">{question.questionText}</p>

                          {/* Answer Options */}
                          <div className="space-y-2">
                            {(question.answers || []).map((answer, aIndex) => {
                              const isChecked = answersByIndex[qIndex] === aIndex;
                              return (
                                <label
                                  key={`${question._id}-ans-${aIndex}`}
                                  className={`quiz-option-card ${isChecked ? 'selected' : ''}`}
                                  onClick={() =>
                                    setAnswersByIndex((prev) => ({
                                      ...prev,
                                      [qIndex]: aIndex
                                    }))
                                  }
                                >
                                  <input
                                    type="radio"
                                    name={`question-${qIndex}`}
                                    checked={isChecked}
                                    onChange={() =>
                                      setAnswersByIndex((prev) => ({
                                        ...prev,
                                        [qIndex]: aIndex
                                      }))
                                    }
                                    className="sr-only"
                                  />
                                  <div className={`custom-radio ${isChecked ? 'checked' : ''}`} />
                                  <span className={`text-sm ${isChecked ? 'font-semibold text-brand-800' : 'text-ink-800'}`}>
                                    {answer.answerText}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="btn-premium btn-premium-brand text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <ClipboardCheck size={16} /> {isSubmitting ? 'Submitting...' : 'Submit Quiz'} <ChevronRight size={14} />
                      </button>
                    </div>

                    {/* Attempt History */}
                    {attemptHistory.length > 0 && (
                      <div className="mt-8 rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50/20 p-5">
                        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-brand-700 flex items-center gap-2 mb-3">
                          <Clock size={14} /> Recent Attempts
                        </h3>
                        <div className="space-y-2">
                          {attemptHistory.slice(0, 5).map((attempt) => (
                            <div key={attempt._id} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-4 py-2.5 border border-brand-50">
                              <span className="text-xs text-ink-800">{new Date(attempt.submittedAt).toLocaleString()}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-ink-900">{attempt.percentage}%</span>
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                  attempt.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {attempt.passed ? 'Passed' : 'Failed'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </article>
        </div>
      )}

      {/* ── Result Modal ── */}
      {resultModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay px-4">
          <div className={`w-full max-w-lg animate-scale-in rounded-3xl glass-card-premium p-7 shadow-card-hover border border-white/50 relative overflow-hidden ${
            resultModal.payload?.attempt?.passed ? 'confetti-bg' : ''
          }`}>
            {/* Top accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
              resultModal.payload?.attempt?.passed
                ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400'
                : 'bg-gradient-to-r from-red-400 via-red-500 to-red-400'
            }`} />

            <div className="text-center mb-5">
              {resultModal.payload?.attempt?.passed ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-3 animate-scale-in shadow-glow-emerald">
                    <PartyPopper size={28} />
                  </div>
                  <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                    <Trophy size={13} /> Congratulations!
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-3 animate-scale-in">
                    <XCircle size={28} />
                  </div>
                  <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                    <ClipboardCheck size={13} /> Quiz Result
                  </p>
                </>
              )}
            </div>

            <h3 className="text-2xl font-extrabold text-ink-900 text-center">
              {resultModal.payload?.attempt?.passed ? 'You Passed! 🎉' : 'Result Available'}
            </h3>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Score', value: resultModal.payload?.attempt?.score ?? '-', icon: Zap },
                { label: 'Marks', value: `${resultModal.payload?.attempt?.percentage ?? 0}%`, icon: Target },
                { label: 'Status', value: resultModal.payload?.attempt?.passed ? 'Pass' : 'Fail', icon: ShieldCheck }
              ].map((stat) => (
                <div key={stat.label} className="stat-card-glow text-center">
                  <stat.icon size={16} className="text-brand-500 mx-auto mb-1" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">{stat.label}</p>
                  <p className="text-lg font-extrabold text-ink-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {resultModal.payload?.certificate?.certificateCode && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50 px-4 py-3 flex items-center gap-3 animate-fade-in-up" style={{ opacity: 0 }}>
                <div className="icon-container icon-container-emerald">
                  <Award size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Certificate Generated</p>
                  <p className="text-sm font-bold text-emerald-900">{resultModal.payload.certificate.certificateCode}</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setResultModal({ open: false, payload: null })}
                className="btn-premium btn-premium-outline text-sm"
              >
                <X size={14} /> Close
              </button>
              {resultModal.payload?.certificate?.certificateCode && (
                <button
                  type="button"
                  onClick={claimCertificate}
                  className="btn-premium btn-premium-emerald text-sm"
                >
                  <Award size={15} /> Claim Certificate <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
