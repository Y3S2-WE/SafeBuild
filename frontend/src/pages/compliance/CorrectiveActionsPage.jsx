import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Wrench } from 'lucide-react';
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
  const canDelete = false;
  const auditFilter = searchParams.get('audit') || '';

  const [actions, setActions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (location.state?.notice) {
      setNotice(location.state.notice);
    }
  }, [location.state]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');

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

  useEffect(() => {
    load();
  }, [auditFilter]);

  const changeStatus = async (action, status, extraPayload = {}) => {
    await correctiveActionApi.update(action._id, { status, ...extraPayload });
    await load();
  };

  const uploadCompletionDocument = async (action, file) => {
    await correctiveActionApi.uploadCompletionDocument(action._id, file);
    await load();
  };

  const remove = async (id) => {
    await correctiveActionApi.remove(id);
    await load();
  };

  const counts = useMemo(() => {
    return actions.reduce(
      (acc, action) => {
        acc.all += 1;
        if (action.status === 'open') acc.open += 1;
        if (action.status === 'in-progress') acc.inProgress += 1;
        if (action.status === 'completed') acc.completed += 1;
        if (action.status === 'verified') acc.verified += 1;
        return acc;
      },
      { all: 0, open: 0, inProgress: 0, completed: 0, verified: 0 }
    );
  }, [actions]);

  const filteredActions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return actions.filter((action) => {
      if (statusFilter !== 'all' && action.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const title = String(action.title || '').toLowerCase();
      const site = String(action.audit?.site || '').toLowerCase();
      const assignee = `${String(action.assignedTo?.firstName || '').toLowerCase()} ${String(action.assignedTo?.lastName || '').toLowerCase()}`;
      const priority = String(action.priority || '').toLowerCase();

      return (
        title.includes(normalizedSearch) ||
        site.includes(normalizedSearch) ||
        assignee.includes(normalizedSearch) ||
        priority.includes(normalizedSearch)
      );
    });
  }, [actions, searchTerm, statusFilter]);

  const statusFilterButtonBase = 'rounded-xl border px-3 py-1 text-xs font-semibold transition-all duration-200';
  const statusFilterButtonInactive = 'border-slate-200 bg-white/80 text-slate-700 hover:border-brand-300 hover:bg-brand-50';

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-3xl p-7 shadow-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800">
          <Wrench size={14} /> Corrective Actions
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">Action Assignment & Tracking</h1>
        <p className="mt-2 text-sm text-ink-800">
          {isSafetyComplianceManager
            ? 'These are your assigned corrective actions. Coordinate execution parties and submit completion report as PDF/Word plus summary note for officer verification.'
            : isOfficer
              ? 'Review submitted PDF/Word completion report and summary note, verify on-site effectiveness, or reject back to in-progress with a mandatory reason.'
              : 'View corrective action progress, submitted completion responses, and verification status across all audits.'}
        </p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{notice}</div> : null}

      {auditFilter && !isSafetyComplianceManager ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 px-4 py-3 text-sm text-brand-800">
          <p className="font-semibold">Showing corrective actions for the submitted audit.</p>
          <button
            type="button"
            className="rounded-xl border border-brand-300 px-2 py-1 text-xs font-semibold"
            onClick={() => setSearchParams({})}
          >
            Show All Actions
          </button>
        </div>
      ) : null}

      {canSeeStats ? <AnalyticsCards summary={null} actionStats={stats} /> : null}

      <div className="glass-panel rounded-2xl border border-brand-100/80 bg-gradient-to-r from-white/90 via-accent-50/35 to-brand-50/70 p-4 shadow-card">
        <p className="text-xs font-bold uppercase tracking-widest text-accent-500">Queue Overview</p>
        <p className="mt-1 text-xs font-medium text-ink-800">Use quick filters to focus on the actions that need attention now.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={`${statusFilterButtonBase} ${statusFilter === 'all' ? 'border-brand-500 bg-brand-100 text-brand-800 shadow-sm shadow-brand-100' : statusFilterButtonInactive}`} onClick={() => setStatusFilter('all')}>
            All ({counts.all})
          </button>
          <button type="button" className={`${statusFilterButtonBase} ${statusFilter === 'open' ? 'border-rose-500 bg-rose-100 text-rose-800 shadow-sm shadow-rose-100' : statusFilterButtonInactive}`} onClick={() => setStatusFilter('open')}>
            Open ({counts.open})
          </button>
          <button type="button" className={`${statusFilterButtonBase} ${statusFilter === 'in-progress' ? 'border-amber-500 bg-amber-100 text-amber-800 shadow-sm shadow-amber-100' : statusFilterButtonInactive}`} onClick={() => setStatusFilter('in-progress')}>
            In Progress ({counts.inProgress})
          </button>
          <button type="button" className={`${statusFilterButtonBase} ${statusFilter === 'completed' ? 'border-sky-500 bg-sky-100 text-sky-800 shadow-sm shadow-sky-100' : statusFilterButtonInactive}`} onClick={() => setStatusFilter('completed')}>
            Pending Verification ({counts.completed})
          </button>
          <button type="button" className={`${statusFilterButtonBase} ${statusFilter === 'verified' ? 'border-emerald-500 bg-emerald-100 text-emerald-800 shadow-sm shadow-emerald-100' : statusFilterButtonInactive}`} onClick={() => setStatusFilter('verified')}>
            Verified ({counts.verified})
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="actionSearch" className="text-xs font-semibold text-ink-800">
            Search
          </label>
          <input
            id="actionSearch"
            type="text"
            className="w-full rounded-lg border border-brand-200 bg-white px-2 py-1 text-xs text-ink-900 md:max-w-sm"
            placeholder="Title, site, assignee, or priority"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900">
              {isSafetyComplianceManager ? 'My Coordination Queue' : 'Action List'} ({filteredActions.length})
            </h2>
            <button type="button" className="rounded-xl border border-brand-200 px-2 py-1 text-xs font-semibold" onClick={load}>
              <RefreshCcw size={12} className="mr-1 inline" /> Refresh
            </button>
          </div>
          <CorrectiveActionList
            actions={filteredActions}
            canDelete={canDelete}
            role={role}
            onUploadDocument={uploadCompletionDocument}
            onStatusChange={changeStatus}
            onDelete={remove}
          />
      </div>
    </section>
  );
};
