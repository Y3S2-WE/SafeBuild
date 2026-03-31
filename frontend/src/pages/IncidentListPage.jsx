import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Plus, Search, Filter, ChevronRight,
  Clock, CheckCircle2, Loader2, XCircle, Flame,
  ShieldAlert, Activity, RefreshCw, MapPin, User, Calendar,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Meta ──────────────────────────────────────────────────────────────────────

const SEVERITY_META = {
  low:    { label: 'Low',    bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', cardBorder: 'border-l-emerald-400' },
  medium: { label: 'Medium', bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',   cardBorder: 'border-l-amber-400'   },
  high:   { label: 'High',   bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500',    cardBorder: 'border-l-rose-500'    },
};

const TYPE_META = {
  hazard:      { label: 'Hazard',    icon: ShieldAlert, bg: 'bg-orange-100', text: 'text-orange-700' },
  'near-miss': { label: 'Near Miss', icon: Flame,       bg: 'bg-yellow-100', text: 'text-yellow-700' },
  accident:    { label: 'Accident',  icon: Activity,    bg: 'bg-red-100',    text: 'text-red-700'    },
};

const STATUS_META = {
  open:          { label: 'Open',          icon: Clock,        bg: 'bg-blue-100',  text: 'text-blue-700'   },
  investigating: { label: 'Investigating', icon: Loader2,      bg: 'bg-purple-100',text: 'text-purple-700' },
  resolved:      { label: 'Resolved',      icon: CheckCircle2, bg: 'bg-green-100', text: 'text-green-700'  },
  closed:        { label: 'Closed',        icon: XCircle,      bg: 'bg-slate-100', text: 'text-slate-600'  },
};

// Quick action a manager can take directly from the list
const QUICK_ACTIONS = {
  open:          { label: 'Investigate', nextStatus: 'investigating', cls: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200' },
  investigating: { label: 'Resolve',     nextStatus: 'resolved',      cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200' },
};

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

// ── Shared components ─────────────────────────────────────────────────────────

function Badge({ meta }) {
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
      {Icon && <Icon size={11} />}
      {meta.label}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const m = SEVERITY_META[severity] ?? SEVERITY_META.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-rise pointer-events-none ${
      toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
    }`}>
      {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
      {toast.msg}
    </div>
  );
}

// Clickable stat card — clicking it toggles a status filter
function StatCard({ label, value, icon: Icon, accentBorder, iconColor, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl border shadow-card p-5 border-l-4 ${accentBorder} text-left w-full transition-all ${
        active
          ? 'ring-2 ring-offset-1 ring-brand-400 shadow-glow border-slate-200'
          : 'border-slate-200 hover:shadow-glow'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <Icon size={15} className={iconColor} />
      </div>
      <p className="text-3xl font-bold text-ink-900 leading-none">{value ?? '–'}</p>
      {active && (
        <p className="text-[10px] text-brand-600 font-semibold mt-2 uppercase tracking-wide">Filtering ✕</p>
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IncidentListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incidents, setIncidents]     = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [filters, setFilters]         = useState({ status: '', severity: '', type: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy]           = useState('newest');
  const [quickUpdating, setQuickUpdating] = useState(null);
  const [toast, setToast]             = useState(null);

  const isManager = user?.role === 'manager' || user?.role === 'officer';

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
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

  // Quick status advance directly from the list row
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

  // Toggle a status filter via stat card click
  const handleStatCardClick = (statusValue) => {
    setFilters(f => ({ ...f, status: f.status === statusValue ? '' : statusValue }));
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
    return new Date(b.dateOccurred) - new Date(a.dateOccurred); // newest default
  });

  const resetFilters = () => setFilters({ status: '', severity: '', type: '' });
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast toast={toast} />

      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-accent-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-ink-900">Incident &amp; Hazard Reports</h1>
                <p className="text-sm text-slate-500">Track, manage and resolve safety incidents on site.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/incidents/report')}
              className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Plus size={18} />
              Report Incident
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* Stat cards — clickable filters */}
        {isManager && stats && (
          <>
            <p className="text-xs text-slate-400 font-medium px-0.5">Click a card to filter by status</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total" value={stats.total} icon={AlertTriangle}
                accentBorder="border-l-brand-500" iconColor="text-brand-500"
                active={false} onClick={() => resetFilters()}
              />
              <StatCard
                label="Open" value={stats.byStatus?.open} icon={Clock}
                accentBorder="border-l-blue-500" iconColor="text-blue-500"
                active={filters.status === 'open'} onClick={() => handleStatCardClick('open')}
              />
              <StatCard
                label="Investigating" value={stats.byStatus?.investigating} icon={Loader2}
                accentBorder="border-l-purple-500" iconColor="text-purple-500"
                active={filters.status === 'investigating'} onClick={() => handleStatCardClick('investigating')}
              />
              <StatCard
                label="Resolved" value={stats.byStatus?.resolved} icon={CheckCircle2}
                accentBorder="border-l-emerald-500" iconColor="text-emerald-500"
                active={filters.status === 'resolved'} onClick={() => handleStatCardClick('resolved')}
              />
            </div>
          </>
        )}

        {/* Search + sort + filter bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 space-y-3">
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, location or reporter…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white text-slate-700 appearance-none cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="severity">High severity first</option>
              </select>
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'border-brand-400 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button onClick={load} title="Refresh" className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <RefreshCw size={15} />
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
              {[
                { key: 'status',   label: 'Status',   opts: ['open','investigating','resolved','closed'] },
                { key: 'severity', label: 'Severity', opts: ['low','medium','high'] },
                { key: 'type',     label: 'Type',     opts: ['hazard','near-miss','accident'] },
              ].map(({ key, label, opts }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">{label}</span>
                  <select
                    value={filters[key]}
                    onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white text-slate-700"
                  >
                    <option value="">All</option>
                    {opts.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              ))}
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-xs text-rose-500 hover:text-rose-700 font-semibold ml-auto">
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertTriangle size={15} />
            {error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading incidents…</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={28} className="text-slate-400" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-slate-600">No incidents found</p>
            <p className="text-sm text-slate-400">Try adjusting your search or filters.</p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-sm text-brand-600 font-medium hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium px-1">
              {sorted.length} {sorted.length === 1 ? 'incident' : 'incidents'}
              {filters.status && <span className="text-brand-600"> · filtered by {filters.status}</span>}
            </p>

            {sorted.map((inc) => {
              const typeMeta   = TYPE_META[inc.type]     ?? TYPE_META.hazard;
              const statusMeta = STATUS_META[inc.status] ?? STATUS_META.open;
              const sevMeta    = SEVERITY_META[inc.severity] ?? SEVERITY_META.low;
              const TypeIcon   = typeMeta.icon;
              const quickAction = isManager ? QUICK_ACTIONS[inc.status] : null;
              const isHigh     = inc.severity === 'high';

              return (
                <button
                  key={inc._id}
                  onClick={() => navigate(`/incidents/${inc._id}`)}
                  className={`w-full bg-white rounded-2xl border shadow-card px-5 py-4 flex items-center gap-4 hover:border-brand-300 hover:shadow-glow transition-all group text-left border-l-4 ${sevMeta.cardBorder} ${
                    isHigh ? 'bg-rose-50/40' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeMeta.bg}`}>
                    <TypeIcon size={18} className={typeMeta.text} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className={`font-semibold truncate ${isHigh ? 'text-rose-900' : 'text-ink-900'}`}>{inc.title}</h3>
                      <Badge meta={statusMeta} />
                      {isHigh && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          High Priority
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <Badge meta={typeMeta} />
                      <SeverityBadge severity={inc.severity} />
                      {inc.location?.address && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={11} />{inc.location.address}
                        </span>
                      )}
                      {inc.reportedByName && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <User size={11} />{inc.reportedByName}
                        </span>
                      )}
                      {inc.dateOccurred && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Calendar size={11} />{new Date(inc.dateOccurred).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick action button — manager only */}
                  {quickAction && (
                    <button
                      onClick={(e) => handleQuickAction(inc._id, quickAction.nextStatus, e)}
                      disabled={quickUpdating === inc._id}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${quickAction.cls} disabled:opacity-50`}
                    >
                      {quickUpdating === inc._id
                        ? <Loader2 size={12} className="animate-spin" />
                        : quickAction.label}
                    </button>
                  )}

                  <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-500 flex-shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
