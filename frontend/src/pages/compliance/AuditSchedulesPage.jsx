import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck,
  RefreshCcw,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  AlertTriangle,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auditApi } from '../../services/compliance/auditApi';
import { checklistApi } from '../../services/compliance/checklistApi';
import { api } from '../../services/api';
import { AuditScheduleForm } from '../../components/compliance/AuditScheduleForm';
import { AuditList } from '../../components/compliance/AuditList';

export const AuditSchedulesPage = () => {
  const { user } = useAuth();
  const canSchedule = user?.role === 'manager';
  const canCancel   = user?.role === 'manager';
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [audits, setAudits]               = useState([]);
  const [checklists, setChecklists]       = useState([]);
  const [auditors, setAuditors]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [statusView, setStatusView]       = useState('active');
  const [completedMonth, setCompletedMonth] = useState(currentMonth);
  const [searchTerm, setSearchTerm]       = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const pageSize = 6;

  const counts = useMemo(() =>
    audits.reduce((acc, a) => {
      if (a.status === 'scheduled' || a.status === 'in-progress') acc.active += 1;
      if (a.status === 'completed') acc.completed += 1;
      if (a.status === 'cancelled') acc.cancelled += 1;
      acc.all += 1;
      return acc;
    }, { active: 0, completed: 0, cancelled: 0, all: 0 }),
  [audits]);

  const visibleAudits = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let list = audits;
    if (statusView === 'active')     list = audits.filter((a) => a.status === 'scheduled' || a.status === 'in-progress');
    if (statusView === 'completed')  list = audits.filter((a) => {
      if (a.status !== 'completed') return false;
      if (!completedMonth) return true;
      return (a.auditDate ? new Date(a.auditDate).toISOString().slice(0, 7) : '') === completedMonth;
    });
    if (statusView === 'cancelled')  list = audits.filter((a) => a.status === 'cancelled');
    if (!q) return list;
    return list.filter((a) =>
      String(a.site || '').toLowerCase().includes(q) ||
      String(a.checklistTemplate?.title || '').toLowerCase().includes(q) ||
      String(a.status || '').toLowerCase().includes(q)
    );
  }, [audits, statusView, completedMonth, searchTerm]);

  const totalPages     = Math.max(1, Math.ceil(visibleAudits.length / pageSize));
  const paginatedAudits = useMemo(() => visibleAudits.slice((currentPage - 1) * pageSize, currentPage * pageSize), [visibleAudits, currentPage]);

  const completedMonthOptions = useMemo(() =>
    Array.from(new Set(
      audits.filter((a) => a.status === 'completed' && a.auditDate)
        .map((a) => { const d = new Date(a.auditDate); return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 7); })
        .filter(Boolean)
    )).sort((a, b) => (a > b ? -1 : 1)),
  [audits]);

  const formatMonthLabel = (v) => {
    if (!v) return 'All months';
    const [y, m] = v.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  const load = async () => {
    try {
      setLoading(true); setError('');
      const [auditsRes, checklistsRes, usersRes] = await Promise.all([
        auditApi.getAll(),
        checklistApi.getAll(),
        api.getUsers ? api.getUsers() : Promise.resolve({ data: [] })
      ]);
      setAudits(auditsRes.data || []);
      setChecklists(checklistsRes.data || []);
      const userList = usersRes.data || [];
      setAuditors(userList.filter((u) => u.role === 'officer' && u.isActive !== false));
    } catch (err) {
      setError(err.message || 'Failed to load audits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setCurrentPage(1); }, [statusView, completedMonth, searchTerm]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const create = async (payload) => { await auditApi.create(payload); await load(); };
  const updateStatus = async (audit, status, extraPayload = {}) => {
    try {
      setError('');
      await auditApi.update(audit._id, { status, ...extraPayload });
      await load();
    } catch (err) {
      setError(err.message || 'Failed to update audit status.');
    }
  };

  const statusFilters = [
    { key: 'active',    label: 'Active',    count: counts.active,    icon: Clock,         active: 'cf-btn-active-blue'  },
    { key: 'completed', label: 'Completed', count: counts.completed, icon: CheckCircle2,  active: 'cf-btn-active-green' },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled, icon: XCircle,       active: 'cf-btn-active-red'   },
    { key: 'all',       label: 'All',       count: counts.all,       icon: Layers,        active: 'cf-btn-active-indigo'},
  ];

  return (
    <section className="space-y-6">
      {/* ── Hero ── */}
      <header className="compliance-hero-bg rounded-3xl p-6 md:p-8 text-white shadow-card">
        <div className="floating-orb floating-orb-lg bg-blue-400/10  -top-20 right-8"  style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-teal-400/10  -bottom-14 left-8" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200 border border-white/10 mb-3">
            <ShieldCheck size={13} className="animate-pulse" /> Compliance Audits
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold leading-tight">
                Audit <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Schedules</span>
              </h1>
              <p className="mt-1.5 text-sm text-white/75 max-w-xl">Schedule audits, manage lifecycle status, and track completion timelines.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Active',    val: counts.active,    color: 'text-blue-300' },
                { label: 'Completed', val: counts.completed, color: 'text-teal-300' },
                { label: 'Cancelled', val: counts.cancelled, color: 'text-red-300'  },
              ].map((s) => (
                <div key={s.label} className="lms-stat-chip !px-3 !py-2 !min-w-[68px]">
                  <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest">{s.label}</p>
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
                </div>
              ))}
              <button type="button" onClick={load} disabled={loading} className="lms-stat-chip !px-3 !py-2 hover:bg-white/20 cursor-pointer disabled:opacity-50">
                <RefreshCcw size={14} className={`text-cyan-300 ${loading ? 'animate-spin' : ''}`} />
                <p className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest">Refresh</p>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-5 py-4 text-sm font-medium text-red-700 flex items-center gap-3">
          <AlertTriangle size={16} className="flex-shrink-0 text-red-500" /> {error}
        </div>
      )}

      {/* ── Filter + Search Toolbar ── */}
      <div className="compliance-filter-bar">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-700">Filter by Status</p>
              <p className="text-xs text-ink-700 mt-0.5">Switch between lifecycle stages to focus your view.</p>
            </div>
            <CalendarDays size={16} className="text-brand-400" />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map(({ key, label, count, icon: Icon, active: activeClass }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusView(key)}
                className={`cf-btn ${statusView === key ? activeClass : ''}`}
              >
                <Icon size={12} /> {label} ({count})
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
              <input
                id="auditSearch"
                type="text"
                className="compliance-search"
                placeholder="Search site, checklist, or status…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {statusView === 'completed' && (
              <select
                id="completedMonth"
                className="lms-select w-auto min-w-[160px]"
                value={completedMonth}
                onChange={(e) => setCompletedMonth(e.target.value)}
              >
                <option value="">All months</option>
                {completedMonthOptions.map((m) => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className={canSchedule ? 'grid gap-5 lg:grid-cols-[1fr,1.1fr]' : 'space-y-5'}>
        {canSchedule && (
          <div className="glass-card-premium rounded-3xl p-6 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-container icon-container-brand"><ClipboardCheck size={18} /></div>
              <div>
                <h2 className="text-lg font-bold text-ink-900">Schedule New Audit</h2>
                <p className="text-xs text-ink-700 mt-0.5">Assign a checklist, site, auditor and date.</p>
              </div>
            </div>
            <AuditScheduleForm checklists={checklists} auditors={auditors} onSubmit={create} loading={loading} />
          </div>
        )}

        <div className="glass-card-premium rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-brand"><Layers size={18} /></div>
              <div>
                <h2 className="text-lg font-bold text-ink-900">
                  Audit List ({visibleAudits.length})
                  {statusView === 'completed' && completedMonth ? ` · ${formatMonthLabel(completedMonth)}` : ''}
                </h2>
                <p className="text-xs text-ink-700 mt-0.5">Page {currentPage} of {totalPages}</p>
              </div>
            </div>
            <button type="button" onClick={load} disabled={loading} className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs disabled:opacity-50">
              <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          <AuditList
            audits={paginatedAudits}
            canManage={false}
            canCancel={canCancel}
            canDelete={false}
            onStatusChange={updateStatus}
          />

          {visibleAudits.length > 0 && (
            <div className="mt-5 flex items-center justify-between border-t border-brand-100 pt-4">
              <p className="text-xs font-semibold text-ink-700">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-premium btn-premium-brand !px-3 !py-1.5 text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
