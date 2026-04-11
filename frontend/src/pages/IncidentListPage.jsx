import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Plus, Search, Filter, ChevronRight,
  Clock, CheckCircle2, Loader2, XCircle, Flame,
  ShieldAlert, Activity, RefreshCw, MapPin, User, Calendar,
  ArrowUpDown, ShieldCheck, BarChart3, TrendingUp, AlertOctagon, X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Meta ──────────────────────────────────────────────────────────────────────

const SEVERITY_META = {
  low:    { label: 'Low',    cls: 'sev-badge-low',    dot: 'bg-emerald-500' },
  medium: { label: 'Medium', cls: 'sev-badge-medium', dot: 'bg-amber-500'   },
  high:   { label: 'High',   cls: 'sev-badge-high',   dot: 'bg-rose-500'    },
};

const TYPE_META = {
  hazard:      { label: 'Hazard',    icon: ShieldAlert, cls: 'inc-type-hazard',    iconBg: 'rgba(249,115,22,0.1)',  iconClr: '#c2410c' },
  'near-miss': { label: 'Near Miss', icon: Flame,       cls: 'inc-type-near-miss', iconBg: 'rgba(234,179,8,0.1)',   iconClr: '#854d0e' },
  accident:    { label: 'Accident',  icon: Activity,    cls: 'inc-type-accident',  iconBg: 'rgba(239,68,68,0.1)',   iconClr: '#991b1b' },
};

const STATUS_META = {
  open:          { label: 'Open',          icon: Clock,        cls: 'inc-status-open'          },
  investigating: { label: 'Investigating', icon: Loader2,      cls: 'inc-status-investigating' },
  resolved:      { label: 'Resolved',      icon: CheckCircle2, cls: 'inc-status-resolved'      },
  closed:        { label: 'Closed',        icon: XCircle,      cls: 'inc-status-closed'        },
};

const QUICK_ACTIONS = {
  open:          { label: 'Investigate', nextStatus: 'investigating', cls: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200' },
  investigating: { label: 'Resolve',     nextStatus: 'resolved',      cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200' },
};

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ label, cls, icon: Icon }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {Icon && <Icon size={10} />}
      {label}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const m = SEVERITY_META[severity] ?? SEVERITY_META.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-none ${
      toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
    }`}>
      {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
      {toast.msg}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, topBarColor, textColor, active, onClick }) {
  return (
    <button onClick={onClick} className={`inc-stat-card text-left w-full ${active ? 'active-filter ring-2 ring-offset-1' : ''}`} style={{ '--tw-ring-color': textColor }}>
      <div className="stat-top-bar" style={{ background: topBarColor }} />
      <div className="flex items-center justify-between mb-3 pt-1">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${topBarColor}18` }}>
          <Icon size={14} style={{ color: textColor }} />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-ink-900 leading-none" style={{ color: active ? textColor : undefined }}>
        {value ?? '–'}
      </p>
      {active && (
        <p className="text-[10px] font-bold mt-2 uppercase tracking-wide flex items-center gap-1" style={{ color: textColor }}>
          <X size={9} /> Filtering active
        </p>
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IncidentListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incidents, setIncidents]       = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [filters, setFilters]           = useState({ status: '', severity: '', type: '' });
  const [showFilters, setShowFilters]   = useState(false);
  const [sortBy, setSortBy]             = useState('newest');
  const [quickUpdating, setQuickUpdating] = useState(null);
  const [toast, setToast]               = useState(null);

  const isManager = user?.role === 'manager' || user?.role === 'officer';

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [inc, st] = await Promise.allSettled([
        api.getIncidents(filters),
        isManager ? api.getIncidentStats() : Promise.resolve(null),
      ]);
      if (inc.status === 'fulfilled') setIncidents(inc.value.incidents ?? inc.value.data ?? inc.value ?? []);
      if (st.status  === 'fulfilled' && st.value) setStats(st.value.stats ?? st.value.data ?? st.value);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters, isManager]);

  useEffect(() => { load(); }, [load]);

  const handleQuickAction = async (incId, nextStatus, e) => {
    e.stopPropagation();
    setQuickUpdating(incId);
    try {
      await api.updateIncidentStatus(incId, { status: nextStatus });
      showToast(`Moved to ${STATUS_META[nextStatus]?.label}`);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setQuickUpdating(null);
    }
  };

  const handleStatCardClick = (statusValue) => {
    setFilters((f) => ({ ...f, status: f.status === statusValue ? '' : statusValue }));
  };

  const filtered = incidents.filter((inc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inc.title?.toLowerCase().includes(q) ||
      inc.location?.address?.toLowerCase().includes(q) ||
      inc.reportedByName?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'oldest')   return new Date(a.dateOccurred) - new Date(b.dateOccurred);
    if (sortBy === 'severity') return (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2);
    return new Date(b.dateOccurred) - new Date(a.dateOccurred);
  });

  const resetFilters = () => setFilters({ status: '', severity: '', type: '' });
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast toast={toast} />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ── Hero Card ── */}
        <header className="incident-hero-bg rounded-3xl p-6 md:p-8 text-white shadow-card">
        <div className="floating-orb floating-orb-lg bg-teal-400/10  -top-16 right-12" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-blue-400/8  -bottom-10 left-10" style={{ animationDelay: '3s' }} />

          <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-200 border border-white/10 mb-3">
            <ShieldCheck size={12} className="animate-pulse" /> Safety Reporting System
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                Incident & <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-200">Hazard Reports</span>
              </h1>
              <p className="mt-1.5 text-sm text-white/70 max-w-lg leading-relaxed">
                Track, investigate and resolve safety incidents across all active sites.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-start">
              {isManager && stats && (
                <>
                  <div className="lms-stat-chip !px-3 !py-2 !min-w-[62px]">
                    <AlertTriangle size={12} className="text-teal-300" />
                    <p className="text-[10px] font-semibold text-teal-200 uppercase tracking-widest mt-0.5">Total</p>
                    <p className="text-lg font-extrabold">{stats.total ?? 0}</p>
                  </div>
                  <div className="lms-stat-chip !px-3 !py-2 !min-w-[62px]">
                    <Clock size={12} className="text-cyan-300" />
                    <p className="text-[10px] font-semibold text-teal-200 uppercase tracking-widest mt-0.5">Open</p>
                    <p className="text-lg font-extrabold text-cyan-200">{stats.byStatus?.open ?? 0}</p>
                  </div>
                </>
              )}
              <button
                onClick={() => navigate('/incidents/report')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-900/30 transition-all hover:-translate-y-0.5 text-sm"
              >
                <Plus size={16} />
                Report Incident
              </button>
            </div>
          </div>
          </div>
        </header>

        {/* ── Stat Cards (manager) ── */}
        {isManager && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total"         value={stats.total}                   icon={BarChart3}    topBarColor="#6366f1" textColor="#4338ca" active={false}                             onClick={resetFilters} />
            <StatCard label="Open"          value={stats.byStatus?.open}          icon={AlertOctagon} topBarColor="#3b82f6" textColor="#1d4ed8" active={filters.status==='open'}          onClick={() => handleStatCardClick('open')} />
            <StatCard label="Investigating" value={stats.byStatus?.investigating} icon={TrendingUp}   topBarColor="#8b5cf6" textColor="#5b21b6" active={filters.status==='investigating'} onClick={() => handleStatCardClick('investigating')} />
            <StatCard label="Resolved"      value={stats.byStatus?.resolved}      icon={CheckCircle2} topBarColor="#10b981" textColor="#065f46" active={filters.status==='resolved'}      onClick={() => handleStatCardClick('resolved')} />
          </div>
        )}

        {/* ── Search + Filter Bar ── */}
        <div className="compliance-filter-bar">
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, location or reporter…"
                  className="compliance-search"
                />
              </div>
              {/* Sort */}
              <div className="relative">
                <ArrowUpDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="lms-select !pl-8 !pr-8"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="severity">High severity first</option>
                </select>
              </div>
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`cf-btn ${showFilters || activeFilterCount > 0 ? 'cf-btn-active-indigo' : ''}`}
              >
                <Filter size={13} /> Filters
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button onClick={load} title="Refresh" className="cf-btn">
                <RefreshCw size={13} />
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-200/60">
                {[
                  { key: 'status',   label: 'Status',   opts: ['open','investigating','resolved','closed'] },
                  { key: 'severity', label: 'Severity', opts: ['low','medium','high'] },
                  { key: 'type',     label: 'Type',     opts: ['hazard','near-miss','accident'] },
                ].map(({ key, label, opts }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">{label}</span>
                    <select
                      value={filters[key]}
                      onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                      className="lms-select !py-1 !text-xs"
                    >
                      <option value="">All</option>
                      {opts.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                    </select>
                  </div>
                ))}
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-auto flex items-center gap-1">
                    <X size={11} /> Clear all
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-5 py-4 text-sm font-medium text-red-700 flex items-center gap-3">
            <AlertTriangle size={16} className="flex-shrink-0 text-red-500" /> {error}
          </div>
        )}

        {/* ── Incident List ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm font-medium">Loading incidents…</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center shadow-inner">
              <AlertTriangle size={32} className="text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="font-bold text-slate-600 text-lg">No incidents found</p>
            <p className="text-sm text-slate-400">Try adjusting your search or filters.</p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-sm text-rose-600 font-semibold hover:underline flex items-center gap-1">
                <X size={13} /> Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400 font-semibold px-1">
              {sorted.length} {sorted.length === 1 ? 'incident' : 'incidents'}
              {filters.status && <span className="text-rose-500 ml-1">· filtered by {filters.status}</span>}
            </p>

            {sorted.map((inc) => {
              const typeMeta    = TYPE_META[inc.type]     ?? TYPE_META.hazard;
              const statusMeta  = STATUS_META[inc.status] ?? STATUS_META.open;
              const TypeIcon    = typeMeta.icon;
              const StatusIcon  = statusMeta.icon;
              const quickAction = isManager ? QUICK_ACTIONS[inc.status] : null;
              const cardSev     = `incident-card-${inc.severity ?? 'low'}`;

              return (
                <button
                  key={inc._id}
                  onClick={() => navigate(`/incidents/${inc._id}`)}
                  className={`incident-card w-full text-left group ${cardSev}`}
                >
                  <div className="flex items-center gap-4 pl-2">
                    {/* Type icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: typeMeta.iconBg }}
                    >
                      <TypeIcon size={20} style={{ color: typeMeta.iconClr }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-ink-900 truncate text-sm group-hover:text-rose-700 transition-colors">
                          {inc.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusMeta.cls}`}>
                          <StatusIcon size={10} /> {statusMeta.label}
                        </span>
                        {inc.severity === 'high' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            High Priority
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Badge label={typeMeta.label} cls={typeMeta.cls} icon={TypeIcon} />
                        <SeverityBadge severity={inc.severity} />
                        {inc.location?.address && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <MapPin size={10} />{inc.location.address}
                          </span>
                        )}
                        {inc.reportedByName && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <User size={10} />{inc.reportedByName}
                          </span>
                        )}
                        {inc.dateOccurred && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Calendar size={10} />{new Date(inc.dateOccurred).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick action */}
                    {quickAction && (
                      <button
                        onClick={(e) => handleQuickAction(inc._id, quickAction.nextStatus, e)}
                        disabled={quickUpdating === inc._id}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${quickAction.cls} disabled:opacity-50 hover:-translate-y-0.5`}
                      >
                        {quickUpdating === inc._id ? <Loader2 size={12} className="animate-spin" /> : quickAction.label}
                      </button>
                    )}

                    <ChevronRight size={17} className="text-slate-300 group-hover:text-rose-400 flex-shrink-0 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
