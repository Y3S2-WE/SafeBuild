import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  ClipboardCheck,
  FilePenLine,
  GraduationCap,
  ListChecks,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const initialQuizForm = {
  title: '',
  description: '',
  passMark: 70,
  timeLimit: 20,
  isActive: true
};

const initialQuestionForm = {
  questionText: '',
  points: 1,
  answers: [
    { answerText: '', isCorrect: true },
    { answerText: '', isCorrect: false },
    { answerText: '', isCorrect: false },
    { answerText: '', isCorrect: false }
  ]
};

const toDateTime = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
};

const toPercent = (value) => `${value ?? 0}%`;

const splitByQuiz = (items, idKey) =>
  items.reduce((acc, item) => {
    const quizId = item?.quiz?._id || item?.quiz || item[idKey];
    if (!quizId) return acc;
    if (!acc[quizId]) acc[quizId] = [];
    acc[quizId].push(item);
    return acc;
  }, {});

const sectionButtonClass =
  'rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/90 transition hover:bg-white/20';

export const QuizAdminDashboard = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [statsByQuiz, setStatsByQuiz] = useState({});

  const [selectedQuizId, setSelectedQuizId] = useState('');

  const [quizForm, setQuizForm] = useState(initialQuizForm);
  const [editingQuizId, setEditingQuizId] = useState('');

  const [questionForm, setQuestionForm] = useState(initialQuestionForm);
  const [editingQuestionId, setEditingQuestionId] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => quiz._id === selectedQuizId) || null,
    [quizzes, selectedQuizId]
  );

  const attemptsByQuiz = useMemo(() => splitByQuiz(attempts, 'quizId'), [attempts]);
  const certificatesByQuiz = useMemo(() => splitByQuiz(certificates, 'quizId'), [certificates]);

  const selectedAttempts = useMemo(() => attemptsByQuiz[selectedQuizId] || [], [attemptsByQuiz, selectedQuizId]);
  const selectedCertificates = useMemo(
    () => certificatesByQuiz[selectedQuizId] || [],
    [certificatesByQuiz, selectedQuizId]
  );

  const selectedStats = statsByQuiz[selectedQuizId] || {};

  const selectedQuizSummaryCards = useMemo(() => {
    if (!selectedQuiz) {
      return [
        { label: 'Questions', value: 0, icon: ListChecks },
        { label: 'Pass Mark', value: '0%', icon: ClipboardCheck },
        { label: 'Attempts', value: 0, icon: Users },
        { label: 'Certificates', value: 0, icon: Award }
      ];
    }

    return [
      { label: 'Questions', value: selectedQuiz.questions?.length || 0, icon: ListChecks },
      { label: 'Pass Mark', value: `${selectedQuiz.passMark}%`, icon: ClipboardCheck },
      { label: 'Attempts', value: selectedStats.totalAttempts || 0, icon: Users },
      { label: 'Certificates', value: selectedCertificates.length, icon: Award }
    ];
  }, [selectedQuiz, selectedStats, selectedCertificates.length]);

  const enrollmentRows = useMemo(() => {
    const map = new Map();

    selectedAttempts.forEach((attempt) => {
      const userId = attempt?.user?._id;
      if (!userId) return;

      const current = map.get(userId) || {
        userId,
        name: `${attempt.user.firstName || ''} ${attempt.user.lastName || ''}`.trim() || 'Unknown User',
        email: attempt.user.email || '-',
        attempts: 0,
        bestMark: 0,
        latestMark: 0,
        progress: 'Not Started',
        latestAttemptAt: null
      };

      current.attempts += 1;
      current.latestMark = attempt.percentage || 0;
      current.bestMark = Math.max(current.bestMark, attempt.percentage || 0);
      current.latestAttemptAt = attempt.submittedAt;
      current.progress = attempt.passed || current.bestMark >= (selectedQuiz?.passMark || 0) ? 'Completed' : 'In Progress';

      map.set(userId, current);
    });

    return [...map.values()].sort((a, b) => b.bestMark - a.bestMark);
  }, [selectedAttempts, selectedQuiz?.passMark]);

  const resetQuestionForm = () => {
    setQuestionForm(initialQuestionForm);
    setEditingQuestionId('');
  };

  const resetQuizForm = () => {
    setQuizForm(initialQuizForm);
    setEditingQuizId('');
  };

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [quizRes, attemptRes, certRes] = await Promise.all([
        api.getAllQuizzes(),
        api.getAllAttempts(),
        api.getAllCertificates()
      ]);

      const loadedQuizzes = Array.isArray(quizRes.data) ? quizRes.data : [];
      const loadedAttempts = Array.isArray(attemptRes.data) ? attemptRes.data : [];
      const loadedCertificates = Array.isArray(certRes?.data?.certificates) ? certRes.data.certificates : [];

      setQuizzes(loadedQuizzes);
      setAttempts(loadedAttempts);
      setCertificates(loadedCertificates);

      if (!selectedQuizId && loadedQuizzes.length > 0) {
        setSelectedQuizId(loadedQuizzes[0]._id);
      }

      if (loadedQuizzes.length > 0) {
        const statEntries = await Promise.all(
          loadedQuizzes.map(async (quiz) => {
            try {
              const statsRes = await api.getQuizStats(quiz._id);
              return [quiz._id, statsRes.data || {}];
            } catch {
              return [quiz._id, {}];
            }
          })
        );
        setStatsByQuiz(Object.fromEntries(statEntries));
      } else {
        setStatsByQuiz({});
      }
    } catch (loadError) {
      setError(loadError.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuizSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        title: quizForm.title,
        description: quizForm.description,
        passMark: Number(quizForm.passMark),
        timeLimit: Number(quizForm.timeLimit),
        isActive: Boolean(quizForm.isActive)
      };

      if (editingQuizId) {
        await api.updateQuiz(editingQuizId, payload);
        setNotice('Quiz updated successfully.');
      } else {
        await api.createQuiz(payload);
        setNotice('Quiz created successfully.');
      }

      resetQuizForm();
      await loadData();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save quiz');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuizId(quiz._id);
    setQuizForm({
      title: quiz.title || '',
      description: quiz.description || '',
      passMark: quiz.passMark ?? 70,
      timeLimit: quiz.timeLimit ?? 20,
      isActive: quiz.isActive ?? true
    });
  };

  const handleDeleteQuiz = async (quizId) => {
    const confirmed = window.confirm('Delete this quiz? This will remove all questions in it.');
    if (!confirmed) return;

    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      await api.deleteQuiz(quizId);
      setNotice('Quiz deleted successfully.');
      if (selectedQuizId === quizId) {
        setSelectedQuizId('');
      }
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete quiz');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    if (!selectedQuizId) {
      setError('Please select a quiz first.');
      return;
    }

    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        questionText: questionForm.questionText,
        points: Number(questionForm.points),
        answers: questionForm.answers.map((answer) => ({
          answerText: answer.answerText,
          isCorrect: answer.isCorrect
        }))
      };

      if (editingQuestionId) {
        await api.updateQuestion(selectedQuizId, editingQuestionId, payload);
        setNotice('Question updated successfully.');
      } else {
        await api.addQuestion(selectedQuizId, payload);
        setNotice('Question added successfully.');
      }

      resetQuestionForm();
      await loadData();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestionId(question._id);
    setQuestionForm({
      questionText: question.questionText || '',
      points: question.points ?? 1,
      answers: (question.answers || []).map((item) => ({
        answerText: item.answerText || '',
        isCorrect: Boolean(item.isCorrect)
      }))
    });
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!selectedQuizId) return;
    const confirmed = window.confirm('Delete this question?');
    if (!confirmed) return;

    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      await api.deleteQuestion(selectedQuizId, questionId);
      setNotice('Question deleted successfully.');
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete question');
    } finally {
      setIsSaving(false);
    }
  };

  const setCorrectAnswer = (correctIndex) => {
    setQuestionForm((prev) => ({
      ...prev,
      answers: prev.answers.map((answer, index) => ({
        ...answer,
        isCorrect: index === correctIndex
      }))
    }));
  };

  if (user?.role !== 'trainer') {
    return (
      <section className="glass-panel rounded-3xl p-8 shadow-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
          <ShieldAlert size={14} /> Restricted View
        </p>
        <h1 className="mt-4 text-2xl font-extrabold text-ink-900">Trainer Access Required</h1>
        <p className="mt-2 text-sm text-ink-800">
          This dashboard is available only for trainer accounts. Please sign in with a trainer role to manage quizzes.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b2048] via-[#10326e] to-[#1652a6] p-7 text-white shadow-card">
        <div className="pointer-events-none absolute -top-16 right-8 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-44 w-44 rounded-full bg-orange-300/15 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
              <GraduationCap size={14} /> Trainer Workspace
            </p>
            <h1 className="mt-4 text-3xl font-extrabold">Quiz Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              First impression view with a 3-section flow: Quiz Overview, Create Quiz & Questions, and Quiz Info tables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className={`${sectionButtonClass} ${activeSection === 'overview' ? 'bg-white/30 text-white' : ''}`}
            >
              1. Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('create')}
              className={`${sectionButtonClass} ${activeSection === 'create' ? 'bg-white/30 text-white' : ''}`}
            >
              2. Create & CRUD
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('info')}
              className={`${sectionButtonClass} ${activeSection === 'info' ? 'bg-white/30 text-white' : ''}`}
            >
              3. Quiz Info
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-800 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      )}
      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>
      )}

      {activeSection === 'overview' && (
      <section id="section-overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-ink-900">1. Quiz Overview</h2>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
            Quiz List • Selected Overview • Questions
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {selectedQuizSummaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">{card.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink-900">{card.value}</p>
                <Icon className="mt-2 text-brand-600" size={18} />
              </article>
            );
          })}
        </div>

        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <article className="glass-panel rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink-900">Quiz List</h3>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-700">{quizzes.length}</span>
            </div>
            <div className="mt-4 space-y-2">
              {quizzes.length === 0 && <p className="text-sm text-ink-800">No quizzes yet. Create one in section 2.</p>}
              {quizzes.map((quiz) => (
                <button
                  key={quiz._id}
                  type="button"
                  onClick={() => setSelectedQuizId(quiz._id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    selectedQuizId === quiz._id
                      ? 'border-brand-500 bg-brand-50 shadow'
                      : 'border-white/70 bg-white/80 hover:border-brand-300'
                  }`}
                >
                  <p className="text-sm font-bold text-ink-900">{quiz.title}</p>
                  <p className="mt-1 text-xs text-ink-800">
                    {quiz.questions?.length || 0} Qs • Pass {quiz.passMark}% • {quiz.isActive ? 'Active' : 'Inactive'}
                  </p>
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-3xl bg-[#0f234d] p-5 text-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold">Selected Quiz Overview</h3>
              {selectedQuiz && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditQuiz(selectedQuiz)}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-white/15"
                  >
                    <FilePenLine size={13} /> Edit Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuiz(selectedQuiz._id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-300/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-200 hover:bg-red-500/20"
                  >
                    <Trash2 size={13} /> Delete Quiz
                  </button>
                </div>
              )}
            </div>

            {!selectedQuiz ? (
              <p className="mt-3 text-sm text-white/80">Select a quiz from the left list.</p>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">Title</p>
                    <p className="mt-1 text-sm font-bold">{selectedQuiz.title}</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">Pass Mark</p>
                    <p className="mt-1 text-sm font-bold">{selectedQuiz.passMark}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">Time Limit</p>
                    <p className="mt-1 text-sm font-bold">{selectedQuiz.timeLimit || '-'} mins</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">Status</p>
                    <p className="mt-1 text-sm font-bold">{selectedQuiz.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>

                <p className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90">
                  {selectedQuiz.description}
                </p>

                <div className="mt-4">
                  <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-100">Questions</h4>
                  <div className="mt-2 overflow-x-auto rounded-2xl border border-black/70 bg-white/5">
                    <table className="min-w-full border-collapse border border-black/70 text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-cyan-100">
                          <th className="border border-black/70 px-3 py-2">#</th>
                          <th className="border border-black/70 px-3 py-2">Question</th>
                          <th className="border border-black/70 px-3 py-2">Points</th>
                          <th className="border border-black/70 px-3 py-2">Correct Answer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedQuiz.questions || []).map((question, index) => {
                          const correct = (question.answers || []).find((answer) => answer.isCorrect);
                          return (
                            <tr key={question._id} className="text-white/90">
                              <td className="border border-black/70 px-3 py-2">{index + 1}</td>
                              <td className="border border-black/70 px-3 py-2">{question.questionText}</td>
                              <td className="border border-black/70 px-3 py-2">{question.points}</td>
                              <td className="border border-black/70 px-3 py-2">{correct?.answerText || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </article>
        </div>
      </section>
      )}

      {activeSection === 'create' && (
      <section id="section-create" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-ink-900">2. Create Quiz and Questions</h2>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Detailed Form • Question CRUD</p>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <article className="glass-panel rounded-3xl p-5 shadow-card">
            <h3 className="text-lg font-bold text-ink-900">Create Quiz (Detailed Form)</h3>
            <form className="mt-4 space-y-3" onSubmit={handleQuizSubmit}>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Quiz Title</label>
                <input
                  className="w-full rounded-xl border border-brand-100 bg-white/90 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring-2"
                  placeholder="Construction Safety Level 1"
                  value={quizForm.title}
                  onChange={(event) => setQuizForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Description</label>
                <textarea
                  className="w-full rounded-xl border border-brand-100 bg-white/90 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring-2"
                  placeholder="Explain quiz objective and coverage."
                  rows={4}
                  value={quizForm.description}
                  onChange={(event) => setQuizForm((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Pass Mark (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full rounded-xl border border-brand-100 bg-white/90 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring-2"
                    value={quizForm.passMark}
                    onChange={(event) => setQuizForm((prev) => ({ ...prev, passMark: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Time Limit (mins)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-xl border border-brand-100 bg-white/90 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring-2"
                    value={quizForm.timeLimit}
                    onChange={(event) => setQuizForm((prev) => ({ ...prev, timeLimit: event.target.value }))}
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-brand-100 bg-white/70 px-3 py-2 text-sm font-semibold text-ink-800">
                <input
                  type="checkbox"
                  checked={quizForm.isActive}
                  onChange={(event) => setQuizForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                Active Quiz
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
                >
                  <Plus size={15} /> {editingQuizId ? 'Update Quiz' : 'Create Quiz'}
                </button>
                {editingQuizId && (
                  <button
                    type="button"
                    className="rounded-xl border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700"
                    onClick={resetQuizForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </article>

          <article className="glass-panel rounded-3xl p-5 shadow-card">
            <h3 className="text-lg font-bold text-ink-900">Question CRUD</h3>
            {!selectedQuiz ? (
              <p className="mt-3 text-sm text-ink-800">Select a quiz in section 1 before creating or editing questions.</p>
            ) : (
              <>
                <form className="mt-4 space-y-3" onSubmit={handleQuestionSubmit}>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Question Text</label>
                    <input
                      className="w-full rounded-xl border border-brand-100 bg-white/90 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring-2"
                      value={questionForm.questionText}
                      onChange={(event) =>
                        setQuestionForm((prev) => ({
                          ...prev,
                          questionText: event.target.value
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Points</label>
                    <input
                      type="number"
                      min={1}
                      className="w-40 rounded-xl border border-brand-100 bg-white/90 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring-2"
                      value={questionForm.points}
                      onChange={(event) =>
                        setQuestionForm((prev) => ({
                          ...prev,
                          points: event.target.value
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {questionForm.answers.map((answer, index) => (
                      <div key={`answer-input-${index}`} className="rounded-2xl border border-white/70 bg-white/75 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Option {index + 1}</p>
                          <button
                            type="button"
                            onClick={() => setCorrectAnswer(index)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                              answer.isCorrect
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-brand-100 hover:text-brand-700'
                            }`}
                          >
                            {answer.isCorrect ? 'Correct' : 'Set Correct'}
                          </button>
                        </div>
                        <input
                          className="w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm outline-none ring-brand-300 focus:ring-2"
                          value={answer.answerText}
                          onChange={(event) =>
                            setQuestionForm((prev) => ({
                              ...prev,
                              answers: prev.answers.map((item, answerIndex) =>
                                answerIndex === index ? { ...item, answerText: event.target.value } : item
                              )
                            }))
                          }
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
                    >
                      <Plus size={14} /> {editingQuestionId ? 'Update Question' : 'Add Question'}
                    </button>
                    {editingQuestionId && (
                      <button
                        type="button"
                        onClick={resetQuestionForm}
                        className="rounded-xl border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-black/70 bg-white/70">
                  <table className="min-w-full border-collapse border border-black/70 text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-brand-700">
                        <th className="border border-black/70 px-3 py-2">#</th>
                        <th className="border border-black/70 px-3 py-2">Question</th>
                        <th className="border border-black/70 px-3 py-2">Points</th>
                        <th className="border border-black/70 px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedQuiz.questions || []).map((question, index) => (
                        <tr key={question._id} className="text-ink-800">
                          <td className="border border-black/70 px-3 py-2">{index + 1}</td>
                          <td className="border border-black/70 px-3 py-2">{question.questionText}</td>
                          <td className="border border-black/70 px-3 py-2">{question.points}</td>
                          <td className="border border-black/70 px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditQuestion(question)}
                                className="rounded-lg border border-brand-300 px-2.5 py-1 text-xs font-semibold text-brand-700"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(question._id)}
                                className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </article>
        </div>
      </section>
      )}

      {activeSection === 'info' && (
      <section id="section-info" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-ink-900">3. Quiz Info</h2>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
            Performance • Enrollment • Progress & Marks • Certificates
          </p>
        </div>

        <article className="rounded-3xl bg-[#101f42] p-5 text-white shadow-card">
          <h3 className="text-lg font-bold">Quiz Performance Snapshot</h3>
          {!selectedQuiz ? (
            <p className="mt-3 text-sm text-white/80">Select a quiz to inspect analytics.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">Attempts</p>
                <p className="mt-1 text-lg font-bold">{selectedStats.totalAttempts || 0}</p>
                <Users className="mt-2 text-cyan-200" size={16} />
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">Pass Rate</p>
                <p className="mt-1 text-lg font-bold">{toPercent(selectedStats.passRate || 0)}</p>
                <ClipboardCheck className="mt-2 text-cyan-200" size={16} />
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">Average Score</p>
                <p className="mt-1 text-lg font-bold">{toPercent(selectedStats.averageScore || 0)}</p>
                <Activity className="mt-2 text-cyan-200" size={16} />
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">Highest Score</p>
                <p className="mt-1 text-lg font-bold">{toPercent(selectedStats.highestScore || 0)}</p>
                <BarChart3 className="mt-2 text-cyan-200" size={16} />
              </div>
            </div>
          )}
        </article>

        <article className="glass-panel rounded-3xl p-5 shadow-card">
          <h3 className="text-lg font-bold text-ink-900">Enrollment List, Progress & Marks</h3>
          {!selectedQuiz ? (
            <p className="mt-3 text-sm text-ink-800">Select a quiz to see participants.</p>
          ) : enrollmentRows.length === 0 ? (
            <p className="mt-3 text-sm text-ink-800">No participants yet for this quiz.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-black/70 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-brand-700">
                    <th className="border border-black/70 px-3 py-2">Learner</th>
                    <th className="border border-black/70 px-3 py-2">Attempts</th>
                    <th className="border border-black/70 px-3 py-2">Latest</th>
                    <th className="border border-black/70 px-3 py-2">Best</th>
                    <th className="border border-black/70 px-3 py-2">Progress</th>
                    <th className="border border-black/70 px-3 py-2">Last Attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollmentRows.map((row) => (
                    <tr key={row.userId} className="text-ink-800">
                      <td className="border border-black/70 px-3 py-2">
                        <p className="font-semibold text-ink-900">{row.name}</p>
                        <p className="text-xs text-ink-800">{row.email}</p>
                      </td>
                      <td className="border border-black/70 px-3 py-2">{row.attempts}</td>
                      <td className="border border-black/70 px-3 py-2">{toPercent(row.latestMark)}</td>
                      <td className="border border-black/70 px-3 py-2">{toPercent(row.bestMark)}</td>
                      <td className="border border-black/70 px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${
                            row.progress === 'Completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {row.progress}
                        </span>
                      </td>
                      <td className="border border-black/70 px-3 py-2">{toDateTime(row.latestAttemptAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="glass-panel rounded-3xl p-5 shadow-card">
          <h3 className="text-lg font-bold text-ink-900">Issued Certificates (with date)</h3>
          {!selectedQuiz ? (
            <p className="mt-3 text-sm text-ink-800">Select a quiz to view issued certificates.</p>
          ) : selectedCertificates.length === 0 ? (
            <p className="mt-3 text-sm text-ink-800">No certificates issued for this quiz yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-black/70 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-brand-700">
                    <th className="border border-black/70 px-3 py-2">Certificate Code</th>
                    <th className="border border-black/70 px-3 py-2">Learner</th>
                    <th className="border border-black/70 px-3 py-2">Marks</th>
                    <th className="border border-black/70 px-3 py-2">Issued Date</th>
                    <th className="border border-black/70 px-3 py-2">QR Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCertificates.map((certificate) => (
                    <tr key={certificate._id} className="text-ink-800">
                      <td className="border border-black/70 px-3 py-2 font-semibold text-ink-900">{certificate.certificateCode}</td>
                      <td className="border border-black/70 px-3 py-2">
                        <p className="font-semibold text-ink-900">{certificate.userName}</p>
                        <p className="text-xs text-ink-800">{certificate.userEmail}</p>
                      </td>
                      <td className="border border-black/70 px-3 py-2">{toPercent(certificate.percentage)}</td>
                      <td className="border border-black/70 px-3 py-2">{toDateTime(certificate.issuedAt)}</td>
                      <td className="border border-black/70 px-3 py-2">
                        {certificate.qrCodeUrl ? (
                          <a
                            href={certificate.qrCodeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-300 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                          >
                            Open QR
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
      )}
    </section>
  );
};
