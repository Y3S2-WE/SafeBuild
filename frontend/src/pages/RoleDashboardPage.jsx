import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, BarChart3, ClipboardCheck, ShieldCheck,
  Wrench, AlertTriangle, GraduationCap, Users,
  ArrowRight, CheckCircle2, Activity, Layers, LogOut,
  CalendarCheck, ListChecks, FileSearch, PlayCircle,
  Award, BookMarked, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Greeting helper ───────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ── Workspace card ────────────────────────────────────────────────────────────
function WorkspaceCard({ icon: Icon, iconBg, iconColor, title, subtitle, href, accent, tag, delay = 0 }) {
  return (
    <Link
      to={href}
      className="compliance-link-card group animate-fade-in-up"
      style={{ opacity: 0, animationDelay: `${delay}s` }}
    >
      <div className="card-icon-ring" style={{ background: iconBg }}>
        <Icon size={22} style={{ color: iconColor }} />
      </div>
      {tag && (
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: iconColor }}>
          {tag}
        </p>
      )}
      <h3 className="text-base font-extrabold text-ink-900 group-hover:text-brand-700 transition-colors leading-snug">
        {title}
      </h3>
      <p className="mt-1 text-xs text-ink-700 leading-relaxed">{subtitle}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-bold" style={{ color: iconColor }}>
        Open <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-3xl"
        style={{ background: accent }}
      />
    </Link>
  );
}

// ── Role badge colours ────────────────────────────────────────────────────────
const roleMeta = {
  trainer:                   { label: 'Trainer',                   bg: 'rgba(99,102,241,0.1)',  color: '#4338ca', grad: 'from-indigo-500  to-purple-500'  },
  officer:                   { label: 'Safety Officer',             bg: 'rgba(14,165,233,0.1)', color: '#0369a1', grad: 'from-sky-500     to-cyan-500'    },
  manager:                   { label: 'Manager',                    bg: 'rgba(34,120,214,0.1)', color: '#1d4ed8', grad: 'from-blue-600    to-indigo-600'  },
  'safety-compliance-manager': { label: 'Safety Compliance Manager', bg: 'rgba(245,158,11,0.1)', color: '#b45309', grad: 'from-amber-500   to-orange-500' },
  worker:                    { label: 'Worker',                     bg: 'rgba(16,185,129,0.1)', color: '#065f46', grad: 'from-emerald-500 to-teal-500'   },
};

// ── Role dashboard configs ────────────────────────────────────────────────────
const DASHBOARDS = {
  trainer: {
    heroIcon: GraduationCap,
    heroTitle: 'Trainer',
    heroHighlight: 'Workspace',
    heroSub: 'Create and manage course content, run quizzes, and monitor learner performance — all from one place.',
    cards: [
      {
        icon: BookOpen,
        iconBg: 'rgba(99,102,241,0.1)',
        iconColor: '#4338ca',
        title: 'Course Manager',
        subtitle: 'Build lessons, manage course content, and publish training material for your learners.',
        href: '/course-manager',
        accent: 'linear-gradient(90deg,#6366f1,#4f46e5)',
        tag: 'Training'
      },
      {
        icon: Award,
        iconBg: 'rgba(139,92,246,0.1)',
        iconColor: '#6d28d9',
        title: 'Quiz Admin',
        subtitle: 'Create quizzes, manage questions, review scores, and issue certifications to workers.',
        href: '/quiz-admin',
        accent: 'linear-gradient(90deg,#8b5cf6,#7c3aed)',
        tag: 'Assessment'
      },
    ],
    stats: [
      { label: 'Course Manager', icon: BookMarked, color: 'text-indigo-500' },
      { label: 'Quiz Admin',     icon: Star,        color: 'text-purple-500' },
    ]
  },

  officer: {
    heroIcon: ShieldCheck,
    heroTitle: 'Safety Officer',
    heroHighlight: 'Operations',
    heroSub: 'Execute audits, verify corrective action submissions, and track incidents across all active sites.',
    cards: [
      {
        icon: ClipboardCheck,
        iconBg: 'rgba(14,165,233,0.1)',
        iconColor: '#0369a1',
        title: 'Compliance Workspace',
        subtitle: 'Conduct audits and verify corrective action completion submissions from the field.',
        href: '/portal/compliance',
        accent: 'linear-gradient(90deg,#0ea5e9,#0369a1)',
        tag: 'Compliance'
      },
      {
        icon: AlertTriangle,
        iconBg: 'rgba(245,158,11,0.1)',
        iconColor: '#b45309',
        title: 'Incidents & Hazards',
        subtitle: 'View, investigate and manage reported incidents and hazard observations across your sites.',
        href: '/incidents',
        accent: 'linear-gradient(90deg,#f59e0b,#d97706)',
        tag: 'Safety'
      },
    ],
    stats: [
      { label: 'Compliance Hub', icon: ShieldCheck,    color: 'text-sky-500'   },
      { label: 'Incidents',      icon: AlertTriangle,  color: 'text-amber-500' },
    ]
  },

  manager: {
    heroIcon: BarChart3,
    heroTitle: 'Manager',
    heroHighlight: 'Command Center',
    heroSub: 'Oversee compliance governance, audit schedules, analytics, and incident resolution across your organisation.',
    cards: [
      {
        icon: Layers,
        iconBg: 'rgba(34,120,214,0.1)',
        iconColor: '#1d4ed8',
        title: 'Compliance Workspace',
        subtitle: 'Define checklists, schedule audits, review analytics, and oversee corrective action closure.',
        href: '/portal/compliance',
        accent: 'linear-gradient(90deg,#2278d6,#1d4ed8)',
        tag: 'Governance'
      },
      {
        icon: AlertTriangle,
        iconBg: 'rgba(239,68,68,0.1)',
        iconColor: '#b91c1c',
        title: 'Incidents & Hazards',
        subtitle: 'Monitor all reported incidents, advance investigation status, and close resolved cases.',
        href: '/incidents',
        accent: 'linear-gradient(90deg,#ef4444,#b91c1c)',
        tag: 'Safety'
      },
    ],
    stats: [
      { label: 'Compliance',  icon: ClipboardCheck, color: 'text-blue-500' },
      { label: 'Incidents',   icon: Activity,       color: 'text-red-500'  },
    ]
  },

  'safety-compliance-manager': {
    heroIcon: Wrench,
    heroTitle: 'Safety Compliance',
    heroHighlight: 'Coordination Hub',
    heroSub: 'Coordinate site teams, collect evidence, and submit corrective action completion reports for officer verification.',
    cards: [
      {
        icon: Wrench,
        iconBg: 'rgba(245,158,11,0.1)',
        iconColor: '#b45309',
        title: 'My Coordination Queue',
        subtitle: 'View assigned corrective actions, coordinate execution parties, upload evidence, and submit for verification.',
        href: '/portal/compliance/actions',
        accent: 'linear-gradient(90deg,#f59e0b,#d97706)',
        tag: 'Corrective Actions'
      },
    ],
    stats: [
      { label: 'Action Queue', icon: ListChecks, color: 'text-amber-500' },
    ]
  },

  worker: {
    heroIcon: BookOpen,
    heroTitle: 'Worker',
    heroHighlight: 'Learning Portal',
    heroSub: 'Complete assigned safety training, take quizzes, earn certifications, and report site hazards.',
    cards: [
      {
        icon: BookOpen,
        iconBg: 'rgba(16,185,129,0.1)',
        iconColor: '#065f46',
        title: 'Learning Hub',
        subtitle: 'Browse and resume your assigned safety training courses and lessons.',
        href: '/learning-hub',
        accent: 'linear-gradient(90deg,#10b981,#059669)',
        tag: 'Training'
      },
      {
        icon: Award,
        iconBg: 'rgba(99,102,241,0.1)',
        iconColor: '#4338ca',
        title: 'Certifications & Quizzes',
        subtitle: 'Take quizzes and view your certificates after completing courses.',
        href: '/certifications',
        accent: 'linear-gradient(90deg,#6366f1,#4f46e5)',
        tag: 'Assessment'
      },
      {
        icon: AlertTriangle,
        iconBg: 'rgba(245,158,11,0.1)',
        iconColor: '#b45309',
        title: 'Report Incident',
        subtitle: 'Report a hazard, near-miss, or accident you observe on site immediately.',
        href: '/incidents/report',
        accent: 'linear-gradient(90deg,#f59e0b,#d97706)',
        tag: 'Safety'
      },
    ],
    stats: [
      { label: 'Learning Hub', icon: BookOpen,      color: 'text-emerald-500' },
      { label: 'Quizzes',      icon: CheckCircle2,  color: 'text-indigo-500'  },
      { label: 'Incidents',    icon: AlertTriangle, color: 'text-amber-500'   },
    ]
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export const RoleDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? 'worker';
  const config = DASHBOARDS[role] ?? DASHBOARDS.worker;
  const meta = roleMeta[role] ?? roleMeta.worker;
  const HeroIcon = config.heroIcon;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <section className="dashboard-page-bg space-y-6">
      <div className="dashboard-frame space-y-5">

        {/* ── Hero Card ── */}
        <header className="compliance-hero-bg rounded-3xl p-6 md:p-8 text-white shadow-card">
          <div className="floating-orb floating-orb-lg bg-teal-400/10  -top-20 right-8"  style={{ animationDelay: '0s' }} />
          <div className="floating-orb floating-orb-md bg-blue-400/8   -bottom-14 left-8" style={{ animationDelay: '3s' }} />

          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0s' }}>
                {/* Role badge */}
                <p
                  className="inline-flex items-center gap-2 rounded-full backdrop-blur-sm px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] border border-white/15 mb-4"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#a5f3fc' }}
                >
                  <HeroIcon size={12} className="animate-pulse" />
                  {meta.label}
                </p>

                <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                  {getGreeting()},{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-200">
                    {user?.firstName}!
                  </span>
                </h1>
                <p className="mt-2 text-sm text-white/70 max-w-xl leading-relaxed">{config.heroSub}</p>
                <p className="mt-3 text-[11px] text-white/40 font-medium">{dateStr}</p>
              </div>

              {/* Stat chips + logout */}
              <div className="flex flex-wrap gap-2 items-start animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
                {config.stats.map((s) => (
                  <div key={s.label} className="lms-stat-chip !px-3 !py-2 !min-w-[74px]">
                    <s.icon size={13} className={s.color} />
                    <p className="text-[10px] font-bold text-teal-200 uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
                <button
                  onClick={handleLogout}
                  className="lms-stat-chip !px-3 !py-2 hover:bg-white/20 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut size={13} className="text-rose-300" />
                  <p className="text-[10px] font-bold text-rose-200 uppercase tracking-widest mt-0.5">Sign Out</p>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ── Section heading ── */}
        <div className="px-0.5 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.15s' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Your Workspace</h2>
          <p className="text-sm font-semibold text-ink-800 mt-0.5">Select a module below to get started.</p>
        </div>

        {/* ── Workspace Cards ── */}
        <div className={`grid gap-4 ${config.cards.length === 1 ? 'sm:max-w-sm' : config.cards.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
          {config.cards.map((card, i) => (
            <WorkspaceCard key={card.href} {...card} delay={0.2 + i * 0.07} />
          ))}
        </div>

        {/* ── Role info footer ── */}
        <div
          className="glass-card-premium rounded-2xl p-4 animate-fade-in-up flex items-center gap-3"
          style={{ opacity: 0, animationDelay: `${0.2 + config.cards.length * 0.07}s` }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: meta.bg }}
          >
            <HeroIcon size={18} style={{ color: meta.color }} />
          </div>
          <div>
            <p className="text-xs font-bold text-ink-900">Logged in as <span className="capitalize" style={{ color: meta.color }}>{meta.label}</span></p>
            <p className="text-xs text-ink-700 mt-0.5">{user?.email}</p>
          </div>
          <p className="ml-auto text-[10px] font-semibold text-slate-400 uppercase tracking-widest hidden sm:block">SafeBuild Platform</p>
        </div>

      </div>
    </section>
  );
};
