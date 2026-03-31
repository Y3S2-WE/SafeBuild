import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auditApi } from '../../services/compliance/auditApi';
import { checklistApi } from '../../services/compliance/checklistApi';
import { api } from '../../services/api';
import { AuditScheduleForm } from '../../components/compliance/AuditScheduleForm';
import { AuditList } from '../../components/compliance/AuditList';

export const AuditSchedulesPage = () => {
  const { user } = useAuth();
  const canSchedule = user?.role === 'manager';
  const canCancel = user?.role === 'manager';
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [audits, setAudits] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusView, setStatusView] = useState('active');
  const [completedMonth, setCompletedMonth] = useState(currentMonth);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

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
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const withStatusFilter = (() => {
    if (statusView === 'active') {
      return audits.filter((audit) => audit.status === 'scheduled' || audit.status === 'in-progress');
    }
    if (statusView === 'completed') {
      return audits.filter((audit) => {
        if (audit.status !== 'completed') {
          return false;
        }

        if (!completedMonth) {
          return true;
        }

        const auditMonth = audit.auditDate ? new Date(audit.auditDate).toISOString().slice(0, 7) : '';
        return auditMonth === completedMonth;
      });
    }
    if (statusView === 'cancelled') {
      return audits.filter((audit) => audit.status === 'cancelled');
    }
    return audits;
    })();

    if (!normalizedSearch) {
      return withStatusFilter;
    }

    return withStatusFilter.filter((audit) => {
      const siteText = String(audit.site || '').toLowerCase();
      const checklistText = String(audit.checklistTemplate?.title || '').toLowerCase();
      const statusText = String(audit.status || '').toLowerCase();
      return (
        siteText.includes(normalizedSearch) ||
        checklistText.includes(normalizedSearch) ||
        statusText.includes(normalizedSearch)
      );
    });
  }, [audits, statusView, completedMonth, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(visibleAudits.length / pageSize));

  const paginatedAudits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleAudits.slice(start, start + pageSize);
  }, [visibleAudits, currentPage]);

  const completedMonthOptions = useMemo(() => {
    const uniqueMonths = Array.from(
      new Set(
        audits
          .filter((audit) => audit.status === 'completed' && audit.auditDate)
          .map((audit) => {
            const date = new Date(audit.auditDate);
            if (Number.isNaN(date.getTime())) {
              return '';
            }
            return date.toISOString().slice(0, 7);
          })
          .filter(Boolean)
      )
    ).sort((a, b) => (a > b ? -1 : 1));

    return uniqueMonths;
  }, [audits]);

  const formatMonthLabel = (value) => {
    if (!value) {
      return 'All months';
    }

    const [year, month] = value.split('-').map(Number);
    if (!year || !month) {
      return value;
    }

    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });
  };

  const load = async () => {
    try {
      setLoading(true);
      setError('');

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

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusView, completedMonth, searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const create = async (payload) => {
    await auditApi.create(payload);
    await load();
  };

  const updateStatus = async (audit, status, extraPayload = {}) => {
    try {
      setError('');
      await auditApi.update(audit._id, { status, ...extraPayload });
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
          <ClipboardCheck size={14} /> Audit Schedules
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">Audit CRUD + Status Flow</h1>
        <p className="mt-2 text-sm text-ink-800">Schedule audits, start/cancel runs, and manage lifecycle status.</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="glass-panel rounded-2xl border border-brand-100/80 bg-gradient-to-r from-white/90 via-accent-50/35 to-brand-50/70 p-4 shadow-card">
        <p className="text-xs font-bold uppercase tracking-widest text-accent-500">Audit Status Overview</p>
        <p className="mt-1 text-xs font-medium text-ink-800">Track pipeline health and switch instantly between key audit states.</p>
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
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="auditSearch" className="text-xs font-semibold text-ink-800">
            Search
          </label>
          <input
            id="auditSearch"
            type="text"
            className="w-full rounded-lg border border-brand-200 bg-white px-2 py-1 text-xs text-ink-900 md:max-w-xs"
            placeholder="Site, checklist, or status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {statusView === 'completed' ? (
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="completedMonth" className="text-xs font-semibold text-ink-800">
              Month
            </label>
            <select
              id="completedMonth"
              className="rounded-lg border border-brand-200 bg-white px-2 py-1 text-xs text-ink-900"
              value={completedMonth}
              onChange={(e) => setCompletedMonth(e.target.value)}
            >
              <option value="">All months</option>
              {completedMonthOptions.map((monthValue) => (
                <option key={monthValue} value={monthValue}>
                  {formatMonthLabel(monthValue)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className={canSchedule ? 'grid gap-6 lg:grid-cols-[1fr,1.1fr]' : 'space-y-6'}>
        {canSchedule ? (
          <div className="glass-panel rounded-2xl p-5 shadow-card">
            <h2 className="mb-3 text-lg font-bold text-ink-900">Schedule New Audit</h2>
            <AuditScheduleForm checklists={checklists} auditors={auditors} onSubmit={create} loading={loading} />
          </div>
        ) : null}

        <div className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900">
              Audit List ({visibleAudits.length})
              {statusView === 'completed' && completedMonth ? ` - ${formatMonthLabel(completedMonth)}` : ''}
            </h2>
            <button type="button" className="rounded-xl border border-brand-200 px-2 py-1 text-xs font-semibold" onClick={load}>
              <RefreshCcw size={12} className="mr-1 inline" /> Refresh
            </button>
          </div>
          <AuditList
            audits={paginatedAudits}
            canManage={false}
            canCancel={canCancel}
            canDelete={false}
            onStatusChange={updateStatus}
          />
          {visibleAudits.length > 0 ? (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-xs text-ink-700">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-brand-200 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-brand-200 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
