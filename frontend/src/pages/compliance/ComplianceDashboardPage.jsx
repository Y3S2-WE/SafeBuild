import { useEffect, useState } from 'react';
import { BarChart3, CheckSquare, ClipboardCheck, RefreshCcw, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi } from '../../services/compliance/analyticsApi';
import { correctiveActionApi } from '../../services/compliance/correctiveActionApi';
import { auditApi } from '../../services/compliance/auditApi';
import { QuickChartPanel } from '../../components/compliance/QuickChartPanel';
import { AnalyticsCards } from '../../components/compliance/AnalyticsCards';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildQuickChartUrl = (chartConfig, { width = 620, height = 320 } = {}) => {
  const encoded = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encoded}&w=${width}&h=${height}&f=png&bkg=white&devicePixelRatio=2`;
};

const buildOfficerCharts = ({ audits = [], actions = [] }) => {
  const statusKeys = ['scheduled', 'in-progress', 'completed', 'cancelled'];
  const statusLabels = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
  const statusColors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444'];

  const auditStatusMap = audits.reduce((acc, audit) => {
    const key = audit?.status;
    if (statusKeys.includes(key)) {
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});

  const auditStatusData = statusKeys.map((key) => auditStatusMap[key] || 0);

  const timelineMap = new Map();
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    timelineMap.set(label, 0);
  }

  audits
    .filter((audit) => audit?.status === 'completed' && audit?.auditDate)
    .forEach((audit) => {
      const d = new Date(audit.auditDate);
      if (Number.isNaN(d.getTime())) return;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (timelineMap.has(label)) {
        timelineMap.set(label, timelineMap.get(label) + 1);
      }
    });

  const verificationData = {
    completed: actions.filter((item) => item?.status === 'completed').length,
    verified: actions.filter((item) => item?.status === 'verified').length,
    open: actions.filter((item) => item?.status === 'open' || item?.status === 'in-progress').length
  };

  return {
    auditsAssignedStatus: buildQuickChartUrl({
      type: 'doughnut',
      data: {
        labels: statusLabels,
        datasets: [{
          data: auditStatusData,
          backgroundColor: statusColors,
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        title: { display: true, text: 'Assigned Audits by Status', fontSize: 14 },
        legend: { position: 'bottom' }
      }
    }, { width: 520, height: 320 }),
    myAuditCompletionTrend: buildQuickChartUrl({
      type: 'line',
      data: {
        labels: Array.from(timelineMap.keys()),
        datasets: [{
          label: 'Completed Audits',
          data: Array.from(timelineMap.values()),
          borderColor: '#2563eb',
          pointBackgroundColor: '#2563eb',
          fill: false,
          lineTension: 0.2,
          borderWidth: 3
        }]
      },
      options: {
        title: { display: true, text: 'My Audit Completion Trend', fontSize: 14 },
        legend: { display: false },
        scales: {
          yAxes: [{ ticks: { beginAtZero: true, precision: 0, stepSize: 1 } }]
        }
      }
    }, { width: 700, height: 320 }),
    verificationQueue: buildQuickChartUrl({
      type: 'bar',
      data: {
        labels: ['Awaiting Verification', 'Verified', 'Open/In Progress'],
        datasets: [{
          data: [verificationData.completed, verificationData.verified, verificationData.open],
          backgroundColor: ['#f59e0b', '#10b981', '#0ea5e9'],
          borderRadius: 6
        }]
      },
      options: {
        title: { display: true, text: 'Corrective Action Verification Queue', fontSize: 14 },
        legend: { display: false },
        scales: {
          yAxes: [{ ticks: { beginAtZero: true, precision: 0, stepSize: 1 } }]
        }
      }
    }, { width: 620, height: 320 })
  };
};

const LinkCard = ({ icon, title, subtitle, href }) => (
  <Link to={href} className="glass-panel rounded-2xl p-4 shadow-card transition hover:shadow-lg">
    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-700">
      {icon}
      Workspace
    </p>
    <h3 className="mt-2 text-lg font-bold text-ink-900">{title}</h3>
    <p className="mt-1 text-sm text-ink-700">{subtitle}</p>
  </Link>
);

export const ComplianceDashboardPage = () => {
  const { user } = useAuth();
  const canMonitorGovernance = user?.role === 'manager';
  const canManageDefinitions = user?.role === 'manager';
  const canConduct = user?.role === 'officer';
  const canAccessActions = user?.role === 'manager' || user?.role === 'officer';
  const isOfficer = user?.role === 'officer';
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [actionStats, setActionStats] = useState(null);
  const [officerCharts, setOfficerCharts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!canMonitorGovernance && !isOfficer) {
      setSummary(null);
      setCharts(null);
      setActionStats(null);
      setOfficerCharts(null);
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (canMonitorGovernance) {
        const [dashboardRes, statsRes] = await Promise.all([
          analyticsApi.getDashboard(),
          correctiveActionApi.getStats().catch(() => ({ data: null }))
        ]);

        setSummary(dashboardRes.data?.summary || null);
        setCharts(dashboardRes.data?.charts || null);
        setActionStats(statsRes.data || null);
        setOfficerCharts(null);
      }

      if (isOfficer) {
        const [auditsRes, actionsRes] = await Promise.all([
          auditApi.getAll({ assignedAuditor: user?._id }),
          correctiveActionApi.getAll()
        ]);

        const assignedAuditIds = new Set(
          (auditsRes.data || [])
            .map((audit) => String(audit?._id || ''))
            .filter(Boolean)
        );

        const officerRelevantActions = (actionsRes.data || []).filter((action) =>
          assignedAuditIds.has(String(action?.audit?._id || action?.audit || ''))
        );

        const officerChartUrls = buildOfficerCharts({
          audits: auditsRes.data || [],
          actions: officerRelevantActions
        });

        setOfficerCharts(officerChartUrls);
        setSummary(null);
        setCharts(null);
        setActionStats(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load analytics dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Optional: Refresh analytics every 5 minutes for real-time insights
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [canMonitorGovernance, isOfficer, user?._id]);

  const officerChartItems = [
    {
      key: 'auditsAssignedStatus',
      title: 'My Assigned Audits',
      description: 'Status split of audits currently assigned to you.'
    },
    {
      key: 'myAuditCompletionTrend',
      title: 'My Completion Trend',
      description: 'Your completed audits trend over the last 6 months.'
    },
    {
      key: 'verificationQueue',
      title: 'Verification Queue',
      description: 'Actions awaiting officer verification vs verified workload.'
    }
  ];

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-3xl p-7 shadow-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800">
          <BarChart3 size={14} /> Compliance Dashboard
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">
          {canMonitorGovernance ? 'Manager Command Center' : 'Officer Operations Dashboard'}
        </h1>
        <p className="mt-2 text-sm text-ink-800">
          {canMonitorGovernance
            ? 'Use this workspace to maintain checklists, audits, corrective actions, and governance analytics.'
            : 'Use this workspace to conduct audits and review corrective action verification tasks.'}
        </p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {canManageDefinitions ? (
          <LinkCard icon={<CheckSquare size={14} />} title="Checklist Templates" subtitle="Create and maintain templates." href="/portal/compliance/checklists" />
        ) : null}
        {canManageDefinitions ? (
          <LinkCard icon={<ClipboardCheck size={14} />} title="Audit Schedules" subtitle="Schedule and manage audits." href="/portal/compliance/audits" />
        ) : null}
        {canConduct ? <LinkCard icon={<ClipboardCheck size={14} />} title="Conduct Audit" subtitle="Execute checklist pass/fail runs." href="/portal/compliance/conduct" /> : null}
        {canAccessActions ? (
          <LinkCard icon={<Wrench size={14} />} title="Corrective Actions" subtitle="Assign and track issue closure." href="/portal/compliance/actions" />
        ) : null}
      </div>

      {canMonitorGovernance ? (
      <div className="glass-panel rounded-2xl p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink-900">QuickChart Analytics</h2>
            <p className="text-xs text-slate-500 mt-1">Real-time compliance dashboard powered by QuickChart.io</p>
          </div>
          <button 
            type="button" 
            className="rounded-xl border border-brand-200 px-2 py-1 text-xs font-semibold disabled:opacity-50"
            onClick={load}
            disabled={loading}
          >
            <RefreshCcw size={12} className={`mr-1 inline ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
            <strong>Analytics Error:</strong> {error}
            <p className="mt-1">Try refreshing in a moment, or contact your system administrator if the issue persists.</p>
          </div>
        )}

        {loading && <p className="mb-4 text-sm font-semibold text-brand-800">Loading charts...</p>}

        <AnalyticsCards summary={summary} actionStats={actionStats} />

        <div className="mt-4">
          <QuickChartPanel charts={charts} isLoading={loading} />
        </div>
      </div>
      ) : isOfficer ? (
      <div className="glass-panel rounded-2xl p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink-900">Officer QuickChart Analytics</h2>
            <p className="text-xs text-slate-500 mt-1">Role-specific chart insights for execution and verification workflows.</p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-brand-200 px-2 py-1 text-xs font-semibold disabled:opacity-50"
            onClick={load}
            disabled={loading}
          >
            <RefreshCcw size={12} className={`mr-1 inline ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading && <p className="mb-4 text-sm font-semibold text-brand-800">Loading officer charts...</p>}

        <QuickChartPanel charts={officerCharts} isLoading={loading} items={officerChartItems} />
      </div>
      ) : (
      <div className="glass-panel rounded-2xl p-5 shadow-card">
        <p className="text-sm font-semibold text-ink-800">
          Governance analytics is manager-only. Use the cards above to open your execution and verification workspaces.
        </p>
      </div>
      )}
    </section>
  );
};
