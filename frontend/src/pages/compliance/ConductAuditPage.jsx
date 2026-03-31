import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, RefreshCcw } from 'lucide-react';
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

  const [audits, setAudits] = useState([]);
  const [complianceManagers, setComplianceManagers] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusView, setStatusView] = useState('active');

  const counts = useMemo(() => {
    return audits.reduce(
      (acc, audit) => {
        if (audit.status === 'scheduled' || audit.status === 'in-progress') {
          acc.active += 1;
        }
        if (audit.status === 'completed') {
          acc.completed += 1;
        }
        if (audit.status === 'cancelled') {
          acc.cancelled += 1;
        }
        acc.all += 1;
        return acc;
      },
      { active: 0, completed: 0, cancelled: 0, all: 0 }
    );
  }, [audits]);

  const visibleAudits = useMemo(() => {
    if (statusView === 'active') {
      return audits.filter((audit) => audit.status === 'scheduled' || audit.status === 'in-progress');
    }
    if (statusView === 'completed') {
      return audits.filter((audit) => audit.status === 'completed');
    }
    if (statusView === 'cancelled') {
      return audits.filter((audit) => audit.status === 'cancelled');
    }
    return audits;
  }, [audits, statusView]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [auditsResponse, usersResponse] = await Promise.all([
        auditApi.getAll(),
        api.getUsers ? api.getUsers().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      setAudits(auditsResponse.data || []);

      const userList = usersResponse.data || [];
      setComplianceManagers(
        userList.filter(
          (person) => person.role === 'safety-compliance-manager' && person.isActive !== false
        )
      );

      // Keep the selected audit synced with the latest list status.
      if (selectedAudit?._id) {
        const latest = (auditsResponse.data || []).find((audit) => audit._id === selectedAudit._id);
        if (!latest) {
          setSelectedAudit(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load audits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectAudit = async (id) => {
    if (!id) {
      setSelectedAudit(null);
      return;
    }

    try {
      setLoading(true);
      setError('');
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

      const query = createdCount > 0 ? `?audit=${id}` : '';
      navigate(`/portal/compliance/actions${query}`, { state: { notice } });
    } catch (err) {
      setError(err.message || 'Failed to submit audit execution.');
      throw err;
    }
  };

  const updateStatus = async (audit, status, extraPayload = {}) => {
    try {
      setError('');
      await auditApi.update(audit._id, { status, ...extraPayload });
      if (selectedAudit?._id === audit._id && ['completed', 'cancelled'].includes(status)) {
        setSelectedAudit(null);
      }
      await load();
    } catch (err) {
      setError(err.message || 'Failed to update audit status.');
    }
  };

  const statusButtonBase = 'rounded-xl border px-3 py-1 text-xs font-semibold transition-all duration-200';
  const statusButtonInactive = 'border-slate-200 bg-white/80 text-slate-700 hover:border-brand-300 hover:bg-brand-50';

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-3xl p-7 shadow-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800">
          <ClipboardCheck size={14} /> Conduct Audit
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">Checklist Execution</h1>
        <p className="mt-2 text-sm text-ink-800">Run checklist pass/fail, submit findings, and complete audit scoring.</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="glass-panel rounded-2xl border border-brand-100/80 bg-gradient-to-r from-white/90 via-accent-50/35 to-brand-50/70 p-4 shadow-card">
        <p className="text-xs font-bold uppercase tracking-widest text-accent-500">Audit Status Overview</p>
        <p className="mt-1 text-xs font-medium text-ink-800">Filter audits by lifecycle stage for faster operational focus.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={`${statusButtonBase} ${statusView === 'active' ? 'border-brand-500 bg-brand-100 text-brand-800 shadow-sm shadow-brand-100' : statusButtonInactive}`} onClick={() => setStatusView('active')}>
            Active ({counts.active})
          </button>
          <button type="button" className={`${statusButtonBase} ${statusView === 'completed' ? 'border-emerald-500 bg-emerald-100 text-emerald-800 shadow-sm shadow-emerald-100' : statusButtonInactive}`} onClick={() => setStatusView('completed')}>
            Completed ({counts.completed})
          </button>
          <button type="button" className={`${statusButtonBase} ${statusView === 'cancelled' ? 'border-rose-500 bg-rose-100 text-rose-800 shadow-sm shadow-rose-100' : statusButtonInactive}`} onClick={() => setStatusView('cancelled')}>
            Cancelled ({counts.cancelled})
          </button>
          <button type="button" className={`${statusButtonBase} ${statusView === 'all' ? 'border-accent-500 bg-accent-50 text-accent-600 shadow-sm shadow-accent-100' : statusButtonInactive}`} onClick={() => setStatusView('all')}>
            All ({counts.all})
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.1fr]">
        <div className="glass-panel rounded-2xl p-5 shadow-card">
          <h2 className="mb-3 text-lg font-bold text-ink-900">Execution Form</h2>
          <AuditExecutionForm
            audits={audits}
            complianceManagers={complianceManagers}
            selectedAudit={selectedAudit}
            onSelectAudit={selectAudit}
            onSubmit={submitExecution}
            loading={loading}
          />
        </div>

        <div className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900">Audits ({visibleAudits.length})</h2>
            <button type="button" className="rounded-xl border border-brand-200 px-2 py-1 text-xs font-semibold" onClick={load}>
              <RefreshCcw size={12} className="mr-1 inline" /> Refresh
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
