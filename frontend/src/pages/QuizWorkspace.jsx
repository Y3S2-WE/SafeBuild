import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardCheck, Sparkles, Timer } from 'lucide-react';
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

    const totalQuestions = selectedQuizDetails.questions?.length || 0;
    const unanswered = Object.values(answersByIndex).filter((value) => value === null || value === undefined).length;

    if (unanswered > 0) {
      setError(`Please answer all questions before submit. Remaining: ${unanswered}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const answers = Array.from({ length: totalQuestions }, (_, index) => ({
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
      <section className="glass-panel rounded-3xl p-8 shadow-card">
        <h1 className="text-2xl font-extrabold text-ink-900">Quiz Workspace</h1>
        <p className="mt-2 text-sm text-ink-800">This workspace is for employees (worker role) to take certification quizzes.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111f40] via-[#184a8f] to-[#2e79dc] p-7 text-white shadow-card">
        <div className="pointer-events-none absolute -top-16 right-8 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-yellow-300/15 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
              <Sparkles size={14} /> Certification Quiz Workspace
            </p>
            <h1 className="mt-4 text-3xl font-extrabold">Enroll, Attempt, Submit</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              Select an enrolled quiz, complete all questions, submit answers, then claim certificate if you pass.
            </p>
          </div>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      {isLoading ? (
        <div className="glass-panel rounded-3xl p-8 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-800">Loading workspace...</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <aside className="glass-panel rounded-3xl p-5 shadow-card">
            <h2 className="text-lg font-bold text-ink-900">My Certification Quizzes</h2>
            <div className="mt-4 space-y-2">
              {quizzes.length === 0 && <p className="text-sm text-ink-800">No active quizzes available.</p>}
              {quizzes.map((quiz) => {
                const isEnrolled = enrolledQuizIds.includes(quiz._id);
                const isSelected = selectedQuizId === quiz._id;
                return (
                  <button
                    key={quiz._id}
                    type="button"
                    onClick={() => setSelectedQuizId(quiz._id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                      isSelected ? 'border-brand-500 bg-brand-50 shadow' : 'border-white/70 bg-white/80 hover:border-brand-300'
                    }`}
                  >
                    <p className="text-sm font-bold text-ink-900">{quiz.title}</p>
                    <p className="mt-1 text-xs text-ink-800">
                      {quiz.questions?.length || 0} Qs • Pass {quiz.passMark}% {isEnrolled ? '• Enrolled' : '• Not enrolled'}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <article className="glass-panel rounded-3xl p-5 shadow-card">
            {!selectedQuizDetails ? (
              <p className="text-sm text-ink-800">Select a quiz to start.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-extrabold text-ink-900">{selectedQuizDetails.title}</h2>
                    <p className="mt-2 text-sm text-ink-800">{selectedQuizDetails.description}</p>
                  </div>
                  <div className="rounded-2xl border border-brand-200 bg-white px-4 py-3 text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Pass Mark</p>
                    <p className="text-xl font-extrabold text-ink-900">{selectedQuizDetails.passMark}%</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-ink-800">
                      <Timer size={13} /> {selectedQuizDetails.timeLimit || '-'} mins
                    </p>
                  </div>
                </div>

                {!isSelectedQuizEnrolled && (
                  <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    You are not enrolled for this quiz yet.
                    <button
                      type="button"
                      onClick={enrollSelectedQuiz}
                      className="ml-2 rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white"
                    >
                      Enroll Now
                    </button>
                  </div>
                )}

                {isSelectedQuizEnrolled && (
                  <>
                    <div className="mt-5 space-y-4">
                      {(selectedQuizDetails.questions || []).map((question, qIndex) => (
                        <div key={question._id} className="rounded-2xl border border-brand-100 bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
                            Question {qIndex + 1} • {question.points} point(s)
                          </p>
                          <p className="mt-1 text-sm font-bold text-ink-900">{question.questionText}</p>

                          <div className="mt-3 space-y-2">
                            {(question.answers || []).map((answer, aIndex) => (
                              <label
                                key={`${question._id}-ans-${aIndex}`}
                                className="flex cursor-pointer items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2 text-sm text-ink-800"
                              >
                                <input
                                  type="radio"
                                  name={`question-${qIndex}`}
                                  checked={answersByIndex[qIndex] === aIndex}
                                  onChange={() =>
                                    setAnswersByIndex((prev) => ({
                                      ...prev,
                                      [qIndex]: aIndex
                                    }))
                                  }
                                />
                                {answer.answerText}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
                      >
                        <ClipboardCheck size={15} /> {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                      </button>
                    </div>

                    {attemptHistory.length > 0 && (
                      <div className="mt-6 rounded-2xl border border-brand-100 bg-white/80 p-4">
                        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-brand-700">Recent Attempts</h3>
                        <ul className="mt-2 space-y-1 text-sm text-ink-800">
                          {attemptHistory.slice(0, 5).map((attempt) => (
                            <li key={attempt._id}>
                              {new Date(attempt.submittedAt).toLocaleString()} • {attempt.percentage}% •{' '}
                              {attempt.passed ? 'Passed' : 'Failed'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </article>
        </div>
      )}

      {resultModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-lg animate-rise rounded-3xl border border-white/60 bg-white p-6 shadow-card">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
              <CheckCircle2 size={13} /> Quiz Result
            </p>

            <h3 className="mt-3 text-2xl font-extrabold text-ink-900">
              {resultModal.payload?.attempt?.passed ? 'Congratulations! You Passed' : 'Result Available'}
            </h3>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Score</p>
                <p className="text-lg font-extrabold text-ink-900">{resultModal.payload?.attempt?.score ?? '-'}</p>
              </div>
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Marks</p>
                <p className="text-lg font-extrabold text-ink-900">{resultModal.payload?.attempt?.percentage ?? 0}%</p>
              </div>
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Status</p>
                <p className="text-lg font-extrabold text-ink-900">
                  {resultModal.payload?.attempt?.passed ? 'Pass' : 'Fail'}
                </p>
              </div>
            </div>

            {resultModal.payload?.certificate?.certificateCode && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Certificate generated: <span className="font-bold">{resultModal.payload.certificate.certificateCode}</span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setResultModal({ open: false, payload: null })}
                className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700"
              >
                Close
              </button>
              {resultModal.payload?.certificate?.certificateCode && (
                <button
                  type="button"
                  onClick={claimCertificate}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Claim Certificate <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
