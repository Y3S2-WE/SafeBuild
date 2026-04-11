import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FilePenLine,
  Fingerprint,
  GraduationCap,
  HelpCircle,
  Layers,
  LayoutDashboard,
  ListChecks,
  Plus,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  Timer,
  Trash2,
  Trophy,
  Users,
  X,
  Zap
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

const sectionTabs = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'create', label: 'Create Quiz', icon: Settings },
  { key: 'info', label: 'Quiz Info', icon: BarChart3 }
];

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
        { label: 'Questions', value: 0, icon: ListChecks, color: 'brand' },
        { label: 'Pass Mark', value: '0%', icon: Target, color: 'emerald' },
        { label: 'Attempts', value: 0, icon: Users, color: 'amber' },
        { label: 'Certificates', value: 0, icon: Award, color: 'purple' }
      ];
    }

    return [
      { label: 'Questions', value: selectedQuiz.questions?.length || 0, icon: ListChecks, color: 'brand' },
      { label: 'Pass Mark', value: `${selectedQuiz.passMark}%`, icon: Target, color: 'emerald' },
      { label: 'Attempts', value: selectedStats.totalAttempts || 0, icon: Users, color: 'amber' },
      { label: 'Certificates', value: selectedCertificates.length, icon: Award, color: 'purple' }
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
      <section className="glass-card-premium rounded-3xl p-10 shadow-card text-center max-w-xl mx-auto mt-12">
        <div className="icon-container icon-container-amber mx-auto mb-4">
          <ShieldAlert size={22} />
        </div>
        <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-700 mb-4">
          <ShieldAlert size={14} /> Restricted View
        </p>
        <h1 className="text-2xl font-extrabold text-ink-900">Trainer Access Required</h1>
        <p className="mt-3 text-sm text-ink-800 leading-relaxed">
          This dashboard is available only for trainer accounts. Please sign in with a trainer role to manage quizzes.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {/* ── Hero Section ── */}
      <header className="quiz-hero-bg rounded-3xl p-8 md:p-10 text-white shadow-card">
        <div className="floating-orb floating-orb-lg bg-cyan-400/20 -top-20 right-10" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-orange-400/15 -bottom-16 left-8" style={{ animationDelay: '2s' }} />
        <div className="floating-orb floating-orb-sm bg-purple-300/15 top-1/3 right-1/4" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
          <div className="animate-fade-in-up" style={{ opacity: 0 }}>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 border border-white/10">
              <GraduationCap size={14} className="animate-pulse" /> Trainer Workspace
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight">
              Quiz Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Dashboard</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/80 leading-relaxed">
              Manage quizzes, questions, view performance analytics and issued certificates — all from one workspace.
            </p>
          </div>

          {/* Section Tabs */}
          <div className="animate-fade-in-up anim-delay-200 flex flex-wrap items-center gap-2" style={{ opacity: 0 }}>
            {sectionTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSection(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-all duration-300 border ${activeSection === tab.key
                    ? 'bg-white text-brand-800 border-white shadow-lg'
                    : 'border-white/20 bg-white/10 text-white/90 hover:bg-white/20'
                  }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white/90 transition hover:bg-white/25 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </header>

      {/* ── Notifications ── */}
      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 backdrop-blur-sm px-5 py-4 text-sm font-medium text-red-700 flex items-center gap-3 animate-fade-in-up shadow-sm">
          <div className="icon-container bg-red-100 text-red-600 !w-9 !h-9 !min-w-[36px]"><ShieldAlert size={18} /></div>
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 backdrop-blur-sm px-5 py-4 text-sm font-medium text-emerald-700 flex items-center gap-3 animate-fade-in-up shadow-sm">
          <div className="icon-container icon-container-emerald !w-9 !h-9 !min-w-[36px]"><CheckCircle2 size={18} /></div>
          {notice}
        </div>
      )}

      {/* ═══════ SECTION 1: OVERVIEW ═══════ */}
      {activeSection === 'overview' && (
        <section id="section-overview" className="space-y-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink-900 flex items-center gap-2">
              <LayoutDashboard size={20} className="text-brand-600" /> Quiz Overview
            </h2>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
              Quiz List • Selected Overview • Questions
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {selectedQuizSummaryCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.label}
                  className="stat-card-glow animate-fade-in-up"
                  style={{ opacity: 0, animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700">{card.label}</p>
                      <p className="mt-1 text-3xl font-extrabold text-ink-900">{card.value}</p>
                    </div>
                    <div className={`icon-container icon-container-${card.color}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
            {/* Quiz List */}
            <article className="glass-card-premium rounded-3xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <Layers size={18} className="text-brand-600" /> Quiz List
                </h3>
                <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-700">{quizzes.length}</span>
              </div>
              <div className="space-y-2">
                {quizzes.length === 0 && <p className="text-sm text-ink-800">No quizzes yet. Create one in section 2.</p>}
                {quizzes.map((quiz) => (
                  <button
                    key={quiz._id}
                    type="button"
                    onClick={() => setSelectedQuizId(quiz._id)}
                    className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 ${selectedQuizId === quiz._id
                        ? 'border-brand-400 bg-gradient-to-r from-brand-50 to-brand-100/50 shadow-md shadow-brand-100/50'
                        : 'border-white/60 bg-white/70 hover:border-brand-200 hover:shadow-sm'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${selectedQuizId === quiz._id ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white' : 'bg-brand-50 text-brand-600'}`}>
                        <BookOpen size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink-900 truncate">{quiz.title}</p>
                        <p className="mt-0.5 text-xs text-ink-800 flex items-center gap-1.5">
                          <span>{quiz.questions?.length || 0} Qs</span>
                          <span className="text-brand-300">•</span>
                          <span>Pass {quiz.passMark}%</span>
                          <span className="text-brand-300">•</span>
                          <span className={`font-semibold ${quiz.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {quiz.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </article>

            {/* Selected Quiz Overview (Dark Panel) */}
            <article className="glass-card-dark rounded-3xl p-6 text-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Eye size={18} className="text-cyan-300" /> Selected Quiz Overview
                </h3>
                {selectedQuiz && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditQuiz(selectedQuiz)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wide hover:bg-white/20 transition"
                    >
                      <FilePenLine size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuiz(selectedQuiz._id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-300 hover:bg-red-500/20 transition"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>

              {!selectedQuiz ? (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 text-cyan-300 mb-3">
                    <ClipboardCheck size={24} />
                  </div>
                  <p className="text-sm text-white/70">Select a quiz from the list.</p>
                </div>
              ) : (
                <>
                  {/* Quiz Info Cards */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
                    {[
                      { label: 'Title', value: selectedQuiz.title },
                      { label: 'Pass Mark', value: `${selectedQuiz.passMark}%` },
                      { label: 'Time Limit', value: `${selectedQuiz.timeLimit || '-'} mins` },
                      { label: 'Status', value: selectedQuiz.isActive ? 'Active' : 'Inactive' }
                    ].map((info) => (
                      <div key={info.label} className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-cyan-200 font-semibold">{info.label}</p>
                        <p className="mt-1 text-sm font-bold truncate">{info.value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 leading-relaxed mb-5">
                    {selectedQuiz.description}
                  </p>

                  {/* Questions Table */}
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-200 flex items-center gap-2 mb-3">
                      <HelpCircle size={14} /> Questions ({selectedQuiz.questions?.length || 0})
                    </h4>
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                      <table className="table-modern-dark">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Question</th>
                            <th>Points</th>
                            <th>Correct Answer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedQuiz.questions || []).map((question, index) => {
                            const correct = (question.answers || []).find((answer) => answer.isCorrect);
                            return (
                              <tr key={question._id}>
                                <td>
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white/10 text-xs font-bold">{index + 1}</span>
                                </td>
                                <td className="font-medium">{question.questionText}</td>
                                <td>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-bold text-cyan-200">
                                    <Star size={10} /> {question.points}
                                  </span>
                                </td>
                                <td className="text-emerald-300 font-medium">{correct?.answerText || '-'}</td>
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

      {/* ═══════ SECTION 2: CREATE & CRUD ═══════ */}
      {activeSection === 'create' && (
        <section id="section-create" className="space-y-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink-900 flex items-center gap-2">
              <Settings size={20} className="text-brand-600" /> Create Quiz & Questions
            </h2>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Detailed Form • Question CRUD</p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Create Quiz Form */}
            <article className="glass-card-premium rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2 mb-5">
                <Plus size={18} className="text-brand-600" />
                {editingQuizId ? 'Update Quiz' : 'Create New Quiz'}
              </h3>
              <form className="space-y-4" onSubmit={handleQuizSubmit}>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Quiz Title</label>
                  <input
                    className="w-full rounded-xl border-2 border-brand-100 bg-white/90 px-4 py-2.5 text-sm outline-none ring-brand-300 focus:ring-2 focus:border-brand-300 transition-all"
                    placeholder="Construction Safety Level 1"
                    value={quizForm.title}
                    onChange={(event) => setQuizForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Description</label>
                  <textarea
                    className="w-full rounded-xl border-2 border-brand-100 bg-white/90 px-4 py-2.5 text-sm outline-none ring-brand-300 focus:ring-2 focus:border-brand-300 transition-all resize-none"
                    placeholder="Explain quiz objective and coverage."
                    rows={4}
                    value={quizForm.description}
                    onChange={(event) => setQuizForm((prev) => ({ ...prev, description: event.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Pass Mark (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full rounded-xl border-2 border-brand-100 bg-white/90 px-4 py-2.5 text-sm outline-none ring-brand-300 focus:ring-2 focus:border-brand-300 transition-all"
                      value={quizForm.passMark}
                      onChange={(event) => setQuizForm((prev) => ({ ...prev, passMark: event.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Time Limit (mins)</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-xl border-2 border-brand-100 bg-white/90 px-4 py-2.5 text-sm outline-none ring-brand-300 focus:ring-2 focus:border-brand-300 transition-all"
                      value={quizForm.timeLimit}
                      onChange={(event) => setQuizForm((prev) => ({ ...prev, timeLimit: event.target.value }))}
                      required
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-xl border-2 border-brand-100 bg-white/70 px-4 py-3 text-sm font-semibold text-ink-800 cursor-pointer hover:border-brand-200 transition-colors">
                  <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${quizForm.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${quizForm.isActive ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <input
                    type="checkbox"
                    checked={quizForm.isActive}
                    onChange={(event) => setQuizForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                    className="sr-only"
                  />
                  Active Quiz
                </label>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-premium btn-premium-brand flex-1 text-sm disabled:opacity-60"
                  >
                    <Plus size={15} /> {editingQuizId ? 'Update Quiz' : 'Create Quiz'}
                  </button>
                  {editingQuizId && (
                    <button
                      type="button"
                      className="btn-premium btn-premium-outline text-sm"
                      onClick={resetQuizForm}
                    >
                      <X size={14} /> Cancel
                    </button>
                  )}
                </div>
              </form>
            </article>

            {/* Question CRUD */}
            <article className="glass-card-premium rounded-3xl p-6 shadow-card">
              <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2 mb-5">
                <HelpCircle size={18} className="text-brand-600" /> Question CRUD
              </h3>
              {!selectedQuiz ? (
                <div className="text-center py-10">
                  <div className="icon-container icon-container-brand mx-auto mb-3">
                    <ClipboardCheck size={22} />
                  </div>
                  <p className="text-sm text-ink-800">Select a quiz in Overview before creating questions.</p>
                </div>
              ) : (
                <>
                  <form className="space-y-4" onSubmit={handleQuestionSubmit}>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Question Text</label>
                      <input
                        className="w-full rounded-xl border-2 border-brand-100 bg-white/90 px-4 py-2.5 text-sm outline-none ring-brand-300 focus:ring-2 focus:border-brand-300 transition-all"
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
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Points</label>
                      <input
                        type="number"
                        min={1}
                        className="w-40 rounded-xl border-2 border-brand-100 bg-white/90 px-4 py-2.5 text-sm outline-none ring-brand-300 focus:ring-2 focus:border-brand-300 transition-all"
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

                    <div className="grid gap-3 sm:grid-cols-2">
                      {questionForm.answers.map((answer, index) => (
                        <div key={`answer-input-${index}`} className="rounded-2xl border border-brand-100/80 bg-gradient-to-br from-white to-brand-50/30 p-4 transition-shadow hover:shadow-sm">
                          <div className="mb-2.5 flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-brand-100 text-brand-700 text-[10px] font-bold">{index + 1}</span>
                              Option
                            </p>
                            <button
                              type="button"
                              onClick={() => setCorrectAnswer(index)}
                              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${answer.isCorrect
                                  ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                                  : 'bg-gray-100 text-gray-500 hover:bg-brand-100 hover:text-brand-700'
                                }`}
                            >
                              {answer.isCorrect ? '✓ Correct' : 'Set Correct'}
                            </button>
                          </div>
                          <input
                            className="w-full rounded-xl border-2 border-brand-100 bg-white px-3 py-2 text-sm outline-none ring-brand-300 focus:ring-2 focus:border-brand-300 transition-all"
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

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="btn-premium btn-premium-brand text-sm disabled:opacity-60"
                      >
                        <Plus size={14} /> {editingQuestionId ? 'Update Question' : 'Add Question'}
                      </button>
                      {editingQuestionId && (
                        <button
                          type="button"
                          onClick={resetQuestionForm}
                          className="btn-premium btn-premium-outline text-sm"
                        >
                          <X size={14} /> Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Questions List */}
                  <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-100 bg-white/50">
                    <table className="table-modern">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Question</th>
                          <th>Points</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedQuiz.questions || []).map((question, index) => (
                          <tr key={question._id}>
                            <td>
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-brand-100 text-brand-700 text-xs font-bold">{index + 1}</span>
                            </td>
                            <td className="font-medium text-ink-900">{question.questionText}</td>
                            <td>
                              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                                <Star size={10} /> {question.points}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditQuestion(question)}
                                  className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs"
                                >
                                  <FilePenLine size={12} /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(question._id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                                >
                                  <Trash2 size={12} /> Delete
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

      {/* ═══════ SECTION 3: QUIZ INFO ═══════ */}
      {activeSection === 'info' && (
        <section id="section-info" className="space-y-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-brand-600" /> Quiz Info & Analytics
            </h2>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
              Performance • Progress • Certificates
            </p>
          </div>

          {/* Performance Snapshot (Dark) */}
          <article className="glass-card-dark rounded-3xl p-6 text-white shadow-card">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-5">
              <Activity size={18} className="text-cyan-300" /> Quiz Performance Snapshot
            </h3>
            {!selectedQuiz ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 text-cyan-300 mb-3">
                  <BarChart3 size={24} />
                </div>
                <p className="text-sm text-white/70">Select a quiz to inspect analytics.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Attempts', value: selectedStats.totalAttempts || 0, icon: Users, color: 'text-cyan-300' },
                  { label: 'Pass Rate', value: toPercent(selectedStats.passRate || 0), icon: ClipboardCheck, color: 'text-emerald-300' },
                  { label: 'Average Score', value: toPercent(selectedStats.averageScore || 0), icon: Activity, color: 'text-amber-300' },
                  { label: 'Highest Score', value: toPercent(selectedStats.highestScore || 0), icon: BarChart3, color: 'text-purple-300' }
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition-colors animate-fade-in-up"
                    style={{ opacity: 0, animationDelay: `${i * 0.1}s` }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.12em] text-cyan-200 font-semibold">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                    <stat.icon className={`mt-2 ${stat.color}`} size={18} />
                  </div>
                ))}
              </div>
            )}
          </article>

          {/* Enrollment & Progress */}
          <article className="glass-card-premium rounded-3xl p-6 shadow-card">
            <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2 mb-5">
              <Users size={18} className="text-brand-600" /> Enrollment List, Progress & Marks
            </h3>
            {!selectedQuiz ? (
              <div className="text-center py-8">
                <div className="icon-container icon-container-brand mx-auto mb-3"><Users size={22} /></div>
                <p className="text-sm text-ink-800">Select a quiz to see participants.</p>
              </div>
            ) : enrollmentRows.length === 0 ? (
              <div className="text-center py-8">
                <div className="icon-container icon-container-amber mx-auto mb-3"><Users size={22} /></div>
                <p className="text-sm text-ink-800">No participants yet for this quiz.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white/50">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Learner</th>
                      <th>Attempts</th>
                      <th>Latest</th>
                      <th>Best</th>
                      <th>Progress</th>
                      <th>Last Attempt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollmentRows.map((row) => (
                      <tr key={row.userId}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                              {row.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-ink-900">{row.name}</p>
                              <p className="text-xs text-ink-800">{row.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                            {row.attempts}
                          </span>
                        </td>
                        <td className="font-semibold">{toPercent(row.latestMark)}</td>
                        <td className="font-semibold text-brand-700">{toPercent(row.bestMark)}</td>
                        <td>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${row.progress === 'Completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                            }`}>
                            {row.progress === 'Completed' ? <CheckCircle2 size={11} /> : <Timer size={11} />}
                            {row.progress}
                          </span>
                        </td>
                        <td className="text-xs text-ink-800">{toDateTime(row.latestAttemptAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          {/* Certificates */}
          <article className="glass-card-premium rounded-3xl p-6 shadow-card">
            <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2 mb-5">
              <Trophy size={18} className="text-brand-600" /> Issued Certificates
            </h3>
            {!selectedQuiz ? (
              <div className="text-center py-8">
                <div className="icon-container icon-container-purple mx-auto mb-3"><Award size={22} /></div>
                <p className="text-sm text-ink-800">Select a quiz to view issued certificates.</p>
              </div>
            ) : selectedCertificates.length === 0 ? (
              <div className="text-center py-8">
                <div className="icon-container icon-container-purple mx-auto mb-3"><Award size={22} /></div>
                <p className="text-sm text-ink-800">No certificates issued for this quiz yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white/50">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Certificate Code</th>
                      <th>Learner</th>
                      <th>Marks</th>
                      <th>Issued Date</th>
                      <th>QR Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCertificates.map((certificate) => (
                      <tr key={certificate._id}>
                        <td>
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg tracking-wider">
                            <Fingerprint size={12} /> {certificate.certificateCode}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                              {(certificate.userName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-ink-900">{certificate.userName}</p>
                              <p className="text-xs text-ink-800">{certificate.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            <Target size={10} /> {toPercent(certificate.percentage)}
                          </span>
                        </td>
                        <td className="text-xs text-ink-800">{toDateTime(certificate.issuedAt)}</td>
                        <td>
                          {certificate.qrCodeUrl ? (
                            <a
                              href={certificate.qrCodeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs"
                            >
                              <Zap size={12} /> Open QR
                            </a>
                          ) : (
                            <span className="text-xs text-ink-800">-</span>
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
