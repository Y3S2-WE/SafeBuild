import { Award, BookOpenCheck, AlertTriangle, UserRound, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleTips = {
  manager: 'Monitor platform adoption, user status, and compliance records across teams.',
  officer: 'Track safety readiness, audit evidence, and incident-prevention learning progress.',
  trainer: 'Create and publish course content, then monitor completion and engagement.',
  worker: 'Continue assigned courses and complete lessons to maintain safety compliance.'
};

export const PortalPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

        <article
          onClick={() => navigate('/incidents')}
          className="glass-panel rounded-2xl p-5 shadow-card cursor-pointer hover:border-brand-300 hover:shadow-glow transition-all group"
        >
          <AlertTriangle className="text-accent-500" size={21} />
          <h2 className="mt-4 text-lg font-bold text-ink-900">Incidents &amp; Hazards</h2>
          <p className="mt-2 text-sm text-ink-800">Report and track safety incidents, hazards, and near-miss events on site.</p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:gap-2 transition-all">
            Open module <ChevronRight size={13} />
          </p>
        </article>
      </div>
    </section>
  );
};
