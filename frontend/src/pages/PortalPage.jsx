import { Link } from 'react-router-dom';
import { Award, BookOpenCheck, Layers3, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TrainerCourseManager } from '../components/TrainerCourseManager';

const roleTips = {
  manager: 'Monitor platform adoption, user status, and compliance records across teams.',
  officer: 'Track safety readiness, audit evidence, and incident-prevention learning progress.',
  trainer: 'Create and publish course content, then monitor completion and engagement.',
  worker: 'Continue assigned courses and complete lessons to maintain safety compliance.'
};

export const PortalPage = () => {
  const { user } = useAuth();
  const isTrainer = user?.role === 'trainer';
  const isWorker = user?.role === 'worker';

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-3xl p-7 shadow-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800">
          <UserRound size={14} /> Welcome Back
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">
          {user.firstName} {user.lastName}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-800">
          You are logged in as <span className="font-bold uppercase text-brand-700">{user.role}</span>. {roleTips[user.role]}
        </p>
      </div>

      {isTrainer ? (
        <TrainerCourseManager />
      ) : isWorker ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/learning-hub" className="glass-panel rounded-2xl p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow">
            <BookOpenCheck className="text-brand-700" size={21} />
            <h2 className="mt-4 text-lg font-bold text-ink-900">Learning Hub</h2>
            <p className="mt-2 text-sm text-ink-800">View all trainer-created courses and enroll to start learning.</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brand-700">Open courses page</p>
          </Link>

          <article className="glass-panel rounded-2xl p-5 shadow-card">
            <Award className="text-brand-700" size={21} />
            <h2 className="mt-4 text-lg font-bold text-ink-900">Certifications</h2>
            <p className="mt-2 text-sm text-ink-800">After finishing courses, certificates and quiz outcomes will appear here.</p>
          </article>

          <article className="glass-panel rounded-2xl p-5 shadow-card">
            <Layers3 className="text-brand-700" size={21} />
            <h2 className="mt-4 text-lg font-bold text-ink-900">Safety Operations</h2>
            <p className="mt-2 text-sm text-ink-800">Incident reports and safety updates for your site will be available in this section.</p>
          </article>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <article className="glass-panel rounded-2xl p-5 shadow-card">
            <BookOpenCheck className="text-brand-700" size={21} />
            <h2 className="mt-4 text-lg font-bold text-ink-900">Learning Hub</h2>
            <p className="mt-2 text-sm text-ink-800">Connect this tile to your course list, continue learning, and progress APIs.</p>
          </article>

          <article className="glass-panel rounded-2xl p-5 shadow-card">
            <Award className="text-brand-700" size={21} />
            <h2 className="mt-4 text-lg font-bold text-ink-900">Certifications</h2>
            <p className="mt-2 text-sm text-ink-800">Integrate certificate and quiz features here in the next frontend phase.</p>
          </article>

          <article className="glass-panel rounded-2xl p-5 shadow-card">
            <Layers3 className="text-brand-700" size={21} />
            <h2 className="mt-4 text-lg font-bold text-ink-900">Operations</h2>
            <p className="mt-2 text-sm text-ink-800">Add incidents, audits, and corrective action modules using the same theme tokens.</p>
          </article>
        </div>
      )}
    </section>
  );
};
