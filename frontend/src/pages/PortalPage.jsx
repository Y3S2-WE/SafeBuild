import { Award, BarChart3, BookOpenCheck, Layers3, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleTips = {
  manager: 'Monitor platform adoption, user status, and compliance records across teams.',
  officer: 'Track safety readiness, audit evidence, and incident-prevention learning progress.',
  'safety-compliance-manager': 'Coordinate site teams, vendors, and evidence collection to close corrective actions effectively.',
  trainer: 'Create and publish course content, then monitor completion and engagement.',
  worker: 'Continue assigned courses and complete lessons to maintain safety compliance.'
};

export const PortalPage = () => {
  const { user } = useAuth();
  const canAccessCompliance = user?.role === 'manager' || user?.role === 'officer';
  const canAccessCoordinationActions = user?.role === 'safety-compliance-manager';

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

      {canAccessCompliance ? (
        <div className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-700">
                <BarChart3 size={14} /> Compliance Center
              </p>
              <h2 className="mt-2 text-xl font-bold text-ink-900">Compliance Auditing Workspace</h2>
              <p className="mt-1 text-sm text-ink-800">Manage checklist templates, audits, corrective actions, and analytics from one module.</p>
            </div>
            <Link
              to="/portal/compliance"
              className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-800"
            >
              Open Compliance
            </Link>
          </div>
        </div>
      ) : null}

      {canAccessCoordinationActions ? (
        <div className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-700">
                <BarChart3 size={14} /> Corrective Coordination
              </p>
              <h2 className="mt-2 text-xl font-bold text-ink-900">My Coordination Queue</h2>
              <p className="mt-1 text-sm text-ink-800">Coordinate execution parties, collect evidence, and submit completion reports for officer verification.</p>
            </div>
            <Link
              to="/portal/compliance/actions"
              className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-800"
            >
              Open Coordination
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
};