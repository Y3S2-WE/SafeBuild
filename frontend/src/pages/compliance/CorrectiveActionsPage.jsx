import { useEffect, useMemo, useState } from 'react';
import {
  RefreshCcw,
  Wrench,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  AlertTriangle,
  AlertOctagon,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { correctiveActionApi } from '../../services/compliance/correctiveActionApi';
import { CorrectiveActionList } from '../../components/compliance/CorrectiveActionList';
import { AnalyticsCards } from '../../components/compliance/AnalyticsCards';

export const CorrectiveActionsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = user?.role || '';
  const isManager = role === 'manager';
  const isOfficer = role === 'officer';
  const isSafetyComplianceManager = role === 'safety-compliance-manager';
  const canSeeStats = isManager;
  const auditFilter = searchParams.get('audit') || '';

  const [actions, setActions]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [notice, setNotice]         = useState(location.state?.notice || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { if (location.state?.notice) setNotice(location.state.notice); }, [location.state]);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const [actionsRes, statsRes] = await Promise.all([
        correctiveActionApi.getAll(auditFilter ? { audit: auditFilter } : {}),
        canSeeStats ? correctiveActionApi.getStats() : Promise.resolve({ data: null })
      ]);
      setActions(actionsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load corrective actions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [auditFilter]);

  const changeStatus = async (action, status, extraPayload = {}) => {
    await correctiveActionApi.update(action._id, { status, ...extraPayload });
    await load();
  };
  const uploadCompletionDocument = async (action, file) => {
    await correctiveActionApi.uploadCompletionDocument(action._id, file);
    await load();
  };
  const remove = async (id) => { await correctiveActionApi.remove(id); await load(); };

  const counts = useMemo(() =>
    actions.reduce((acc, a) => {
      acc.all += 1;
      if (a.status === 'open')        acc.open += 1;
      if (a.status === 'in-progress') acc.inProgress += 1;
      if (a.status === 'completed')   acc.completed += 1;
      if (a.status === 'verified')    acc.verified += 1;
      return acc;
    }, { all: 0, open: 0, inProgress: 0, completed: 0, verified: 0 }),
  [actions]);

  const filteredActions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return actions.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(a.title || '').toLowerCase().includes(q) ||
        String(a.audit?.site || '').toLowerCase().includes(q) ||
        `${String(a.assignedTo?.firstName || '')} ${String(a.assignedTo?.lastName || '')}`.toLowerCase().includes(q) ||
        String(a.priority || '').toLowerCase().includes(q)
      );
    });
  }, [actions, searchTerm, statusFilter]);

  const roleDescription = isSafetyComplianceManager
    ? 'Your assigned corrective actions. Coordinate execution parties and submit completion report for officer verification.'
    : isOfficer
      ? 'Review submitted completion reports, verify on-site effectiveness, or reject back to in-progress with a mandatory reason.'
      : 'View corrective action progress, completion responses, and verification status across all audits.';

  const statusFilters = [
    { key: 'all',         label: 'All',                count: counts.all,        icon: Layers,        activeClass: 'cf-btn-active-indigo' },
    { key: 'open',        label: 'Open',               count: counts.open,       icon: AlertOctagon,  activeClass: 'cf-btn-active-red'    },
    { key: 'in-progress', label: 'In Progress',        count: counts.inProgress, icon: Clock,         activeClass: 'cf-btn-active-amber'  },
    { key: 'completed',   label: 'Pending Verify',     count: counts.completed,  icon: ArrowUpRight,  activeClass: 'cf-btn-active-sky'    },
    { key: 'verified',    label: 'Verified',           count: counts.verified,   icon: CheckCircle2,  activeClass: 'cf-btn-active-green'  },
  ];

  return (
    <section className="space-y-6">
      {/* ── Hero ── */}
      <header className="compliance-hero-bg rounded-3xl p-6 md:p-8 text-white shadow-card">
        <div className="floating-orb floating-orb-lg bg-amber-400/10 -top-20 right-8"  style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-teal-400/8  -bottom-14 left-8" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-200 border border-white/10 mb-3">
            <ShieldCheck size={13} className="animate-pulse" /> Corrective Actions
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold leading-tight">
                Action <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-200">Tracking</span>
              </h1>
              <p className="mt-1.5 text-sm text-white/75 max-w-xl leading-relaxed">{roleDescription}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Open',     val: counts.open,       color: 'text-red-300'    },
                { label: 'Progress', val: counts.inProgress, color: 'text-amber-300'  },
                { label: 'Verified', val: counts.verified,   color: 'text-teal-300'   },
              ].map((s) => (
                <div key={s.label} className="lms-stat-chip !px-3 !py-2 !min-w-[68px]">
                  <p className="text-[10px] font-semibold text-amber-200 uppercase tracking-widest">{s.label}</p>
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
                </div>
              ))}
              <button type="button" onClick={load} disabled={loading} className="lms-stat-chip !px-3 !py-2 hover:bg-white/20 cursor-pointer disabled:opacity-50">
                <RefreshCcw size={14} className={`text-amber-300 ${loading ? 'animate-spin' : ''}`} />
                <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">Refresh</p>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Notifications ── */}
      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-5 py-4 text-sm font-medium text-red-700 flex items-center gap-3">
          <AlertTriangle size={16} className="flex-shrink-0 text-red-500" /> {error}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-5 py-4 text-sm font-semibold text-emerald-700 flex items-center gap-3">
          <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-500" /> {notice}
        </div>
      )}

      {/* ── Audit Filter Banner ── */}
      {auditFilter && !isSafetyComplianceManager && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 px-5 py-3.5 text-sm text-brand-800">
          <p className="font-semibold flex items-center gap-2">
            <Activity size={15} className="text-brand-500" />
            Showing corrective actions for the submitted audit.
          </p>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs"
          >
            Show All Actions
          </button>
        </div>
      )}

      {/* ── Analytics Cards ── */}
      {canSeeStats && <AnalyticsCards summary={null} actionStats={stats} />}

      {/* ── Filter + Search Toolbar ── */}
      <div className="compliance-filter-bar">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-700">Queue Overview</p>
              <p className="text-xs text-ink-700 mt-0.5">Use quick filters to focus on actions that need attention now.</p>
            </div>
            <Wrench size={15} className="text-brand-400" />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map(({ key, label, count, icon: Icon, activeClass }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`cf-btn ${statusFilter === key ? activeClass : ''}`}
              >
                <Icon size={12} /> {label} ({count})
              </button>
            ))}
          </div>

          <div className="mt-4 relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
            <input
              id="actionSearch"
              type="text"
              className="compliance-search"
              placeholder="Search title, site, assignee or priority…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Action List Panel ── */}
      <div className="glass-card-premium rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="icon-container" style={{ background: 'rgba(245,158,11,0.1)', color: '#b45309' }}>
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">
                {isSafetyComplianceManager ? 'My Coordination Queue' : 'Action List'} ({filteredActions.length})
              </h2>
              <p className="text-xs text-ink-700 mt-0.5">
                {filteredActions.length} of {actions.length} actions shown
              </p>
            </div>
          </div>
          <button type="button" onClick={load} disabled={loading} className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs disabled:opacity-50">
            <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-4 text-sm font-semibold text-amber-700">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            Loading actions...
          </div>
        )}

        <CorrectiveActionList
          actions={filteredActions}
          canDelete={false}
          role={role}
          onUploadDocument={uploadCompletionDocument}
          onStatusChange={changeStatus}
          onDelete={remove}
        />
      </div>
    </section>
  );
};
