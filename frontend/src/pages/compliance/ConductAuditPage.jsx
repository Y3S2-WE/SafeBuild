import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck,
  RefreshCcw,
  ShieldCheck,
  PlayCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auditApi } from '../../services/compliance/auditApi';
import { api } from '../../services/api';
import { AuditList } from '../../components/compliance/AuditList';
import { AuditExecutionForm } from '../../components/compliance/AuditExecutionForm';

export const ConductAuditPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user?.role === 'manager' || user?.role === 'officer';
  const canCancel = user?.role === 'manager';

  const [audits, setAudits]                     = useState([]);
  const [complianceManagers, setComplianceManagers] = useState([]);
  const [selectedAudit, setSelectedAudit]       = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState('');
  const [statusView, setStatusView]             = useState('active');

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
    if (statusView === 'active')     return audits.filter((a) => a.status === 'scheduled' || a.status === 'in-progress');
    if (statusView === 'completed')  return audits.filter((a) => a.status === 'completed');
    if (statusView === 'cancelled')  return audits.filter((a) => a.status === 'cancelled');
    return audits;
  }, [audits, statusView]);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const [auditsRes, usersRes] = await Promise.all([
        auditApi.getAll(),
        api.getUsers ? api.getUsers().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);
      setAudits(auditsRes.data || []);
      const userList = usersRes.data || [];
      setComplianceManagers(userList.filter((p) => p.role === 'safety-compliance-manager' && p.isActive !== false));
      if (selectedAudit?._id) {
        const latest = (auditsRes.data || []).find((a) => a._id === selectedAudit._id);
        if (!latest) setSelectedAudit(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load audits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectAudit = async (id) => {
    if (!id) { setSelectedAudit(null); return; }
    try {
      setLoading(true); setError('');
      const response = await auditApi.getById(id);
      const detail = response.data || null;
      setSelectedAudit(detail);
      if (detail && (!detail.checklistTemplate || !detail.checklistTemplate.items?.length)) {
        setError('Selected audit has no valid checklist template/items and cannot be conducted.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load selected audit details.');
    } finally {
      setLoading(false);
    }
  };

  const submitExecution = async (id, payload) => {
    try {
      setError('');
      const response = await auditApi.submitExecution(id, payload);
      const createdCount = response?.data?.autoCorrectiveActionsCreated || 0;
      const notice = createdCount > 0
        ? `${createdCount} corrective action(s) were created from failed audit items.`
        : 'Audit submitted. No new corrective actions were needed.';
      navigate(`/portal/compliance/actions${createdCount > 0 ? `?audit=${id}` : ''}`, { state: { notice } });
    } catch (err) {
      setError(err.message || 'Failed to submit audit execution.');
      throw err;
    }
  };

  const updateStatus = async (audit, status, extraPayload = {}) => {
    try {
      setError('');
      await auditApi.update(audit._id, { status, ...extraPayload });
      if (selectedAudit?._id === audit._id && ['completed', 'cancelled'].includes(status)) setSelectedAudit(null);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to update audit status.');
    }
  };

  const statusFilters = [
    { key: 'active',    label: 'Active',    count: counts.active,    icon: Clock,        activeClass: 'cf-btn-active-blue'  },
    { key: 'completed', label: 'Completed', count: counts.completed, icon: CheckCircle2, activeClass: 'cf-btn-active-green' },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled, icon: XCircle,      activeClass: 'cf-btn-active-red'   },
    { key: 'all',       label: 'All',       count: counts.all,       icon: Layers,       activeClass: 'cf-btn-active-indigo'},
  ];

  return (
    <section className="space-y-6">
      {/* ── Hero ── */}
      <header className="compliance-hero-bg rounded-3xl p-6 md:p-8 text-white shadow-card">
        <div className="floating-orb floating-orb-lg bg-cyan-400/10  -top-20 right-8"  style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-indigo-400/8 -bottom-14 left-8" style={{ animationDelay: '2.5s' }} />

        <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200 border border-white/10 mb-3">
            <ShieldCheck size={13} className="animate-pulse" /> Audit Execution
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold leading-tight">
                Conduct <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-sky-200">Audit</span>
              </h1>
              <p className="mt-1.5 text-sm text-white/75 max-w-xl">Run checklist pass/fail, submit findings, and complete audit scoring.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="lms-stat-chip !px-3 !py-2 !min-w-[68px]">
                <PlayCircle size={12} className="text-cyan-300" />
                <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest mt-0.5">Active</p>
                <p className="text-xl font-extrabold text-cyan-100">{counts.active}</p>
              </div>
              <div className="lms-stat-chip !px-3 !py-2 !min-w-[68px]">
                <Zap size={12} className="text-teal-300" />
                <p className="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest mt-0.5">Selected</p>
                <p className="text-xl font-extrabold text-teal-200">{selectedAudit ? '1' : '—'}</p>
              </div>
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

      {/* ── Filter Toolbar ── */}
      <div className="compliance-filter-bar">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-700">Audit Status Filter</p>
              <p className="text-xs text-ink-700 mt-0.5">Filter audits by lifecycle stage for faster operational focus.</p>
            </div>
            <ClipboardCheck size={16} className="text-brand-400" />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map(({ key, label, count, icon: Icon, activeClass }) => (
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
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr,1.1fr]">
        {/* Execution Form */}
        <div className="glass-card-premium rounded-3xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="icon-container" style={{ background: 'rgba(14,165,233,0.1)', color: '#0369a1' }}>
              <PlayCircle size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">Execution Form</h2>
              <p className="text-xs text-ink-700 mt-0.5">
                {selectedAudit ? `Running: ${selectedAudit.site || 'Selected Audit'}` : 'Select an audit from the list to begin.'}
              </p>
            </div>
          </div>
          <AuditExecutionForm
            audits={audits}
            complianceManagers={complianceManagers}
            selectedAudit={selectedAudit}
            onSelectAudit={selectAudit}
            onSubmit={submitExecution}
            loading={loading}
          />
        </div>

        {/* Audit List */}
        <div className="glass-card-premium rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-brand"><Layers size={18} /></div>
              <div>
                <h2 className="text-lg font-bold text-ink-900">Audits ({visibleAudits.length})</h2>
                <p className="text-xs text-ink-700 mt-0.5">Click a row to load it in the execution form.</p>
              </div>
            </div>
            <button type="button" onClick={load} disabled={loading} className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs disabled:opacity-50">
              <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          <AuditList
            audits={visibleAudits}
            canManage={canManage}
            canCancel={canCancel}
            canDelete={false}
            showStatusActions={false}
            onStatusChange={updateStatus}
            onDelete={() => {}}
            onSelect={(audit) => selectAudit(audit._id)}
          />
        </div>
      </div>
    </section>
  );
};
