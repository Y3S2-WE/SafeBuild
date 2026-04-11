import { useEffect, useState } from 'react';
import {
  BarChart3,
  CheckSquare,
  ClipboardCheck,
  RefreshCcw,
  ShieldCheck,
  Wrench,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi } from '../../services/compliance/analyticsApi';
import { correctiveActionApi } from '../../services/compliance/correctiveActionApi';
import { auditApi } from '../../services/compliance/auditApi';
import { QuickChartPanel } from '../../components/compliance/QuickChartPanel';
import { AnalyticsCards } from '../../components/compliance/AnalyticsCards';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
    if (statusKeys.includes(key)) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const auditStatusData = statusKeys.map((key) => auditStatusMap[key] || 0);
  const timelineMap = new Map();
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    timelineMap.set(`${monthNames[date.getMonth()]} ${date.getFullYear()}`, 0);
  }
  audits.filter((a) => a?.status === 'completed' && a?.auditDate).forEach((audit) => {
    const d = new Date(audit.auditDate);
    if (Number.isNaN(d.getTime())) return;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (timelineMap.has(label)) timelineMap.set(label, timelineMap.get(label) + 1);
  });
  const verificationData = {
    completed: actions.filter((i) => i?.status === 'completed').length,
    verified:  actions.filter((i) => i?.status === 'verified').length,
    open:      actions.filter((i) => i?.status === 'open' || i?.status === 'in-progress').length
  };
  return {
    auditsAssignedStatus: buildQuickChartUrl({ type:'doughnut', data:{ labels:statusLabels, datasets:[{ data:auditStatusData, backgroundColor:statusColors, borderColor:'#ffffff', borderWidth:2 }] }, options:{ title:{ display:true, text:'Assigned Audits by Status', fontSize:14 }, legend:{ position:'bottom' } } }, { width:520, height:320 }),
    myAuditCompletionTrend: buildQuickChartUrl({ type:'line', data:{ labels:Array.from(timelineMap.keys()), datasets:[{ label:'Completed Audits', data:Array.from(timelineMap.values()), borderColor:'#2563eb', pointBackgroundColor:'#2563eb', fill:false, lineTension:0.2, borderWidth:3 }] }, options:{ title:{ display:true, text:'My Audit Completion Trend', fontSize:14 }, legend:{ display:false }, scales:{ yAxes:[{ ticks:{ beginAtZero:true, precision:0, stepSize:1 } }] } } }, { width:700, height:320 }),
    verificationQueue: buildQuickChartUrl({ type:'bar', data:{ labels:['Awaiting Verification','Verified','Open/In Progress'], datasets:[{ data:[verificationData.completed, verificationData.verified, verificationData.open], backgroundColor:['#f59e0b','#10b981','#0ea5e9'], borderRadius:6 }] }, options:{ title:{ display:true, text:'Corrective Action Verification Queue', fontSize:14 }, legend:{ display:false }, scales:{ yAxes:[{ ticks:{ beginAtZero:true, precision:0, stepSize:1 } }] } } }, { width:620, height:320 })
  };
};

const LinkCard = ({ icon: Icon, iconBg, iconColor, title, subtitle, href, accent }) => (
  <Link to={href} className="compliance-link-card group">
    <div style={{ background: iconBg }} className="card-icon-ring">
      <Icon size={22} style={{ color: iconColor }} />
    </div>
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: iconColor }}>
      Workspace
    </p>
    <h3 className="text-base font-extrabold text-ink-900 group-hover:text-brand-700 transition-colors leading-snug">
      {title}
    </h3>
    <p className="mt-1 text-xs text-ink-700 leading-relaxed">{subtitle}</p>
    <div className="mt-3 flex items-center gap-1 text-xs font-bold" style={{ color: iconColor }}>
      Open <ArrowRight size={12} />
    </div>
    {/* Bottom accent stripe */}
    <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: accent }} />
  </Link>
);

export const ComplianceDashboardPage = () => {
  const { user } = useAuth();
  const canMonitorGovernance = user?.role === 'manager';
  const canManageDefinitions = user?.role === 'manager';
  const canConduct = user?.role === 'officer';
  const canAccessActions = user?.role === 'manager' || user?.role === 'officer';
  const isOfficer = user?.role === 'officer';

  const [summary, setSummary]           = useState(null);
  const [charts, setCharts]             = useState(null);
  const [actionStats, setActionStats]   = useState(null);
  const [officerCharts, setOfficerCharts] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const load = async () => {
    if (!canMonitorGovernance && !isOfficer) {
      setSummary(null); setCharts(null); setActionStats(null); setOfficerCharts(null);
      return;
    }
    try {
      setLoading(true); setError('');
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
        const assignedAuditIds = new Set((auditsRes.data || []).map((a) => String(a?._id || '')).filter(Boolean));
        const officerRelevantActions = (actionsRes.data || []).filter((action) =>
          assignedAuditIds.has(String(action?.audit?._id || action?.audit || ''))
        );
        setOfficerCharts(buildOfficerCharts({ audits: auditsRes.data || [], actions: officerRelevantActions }));
        setSummary(null); setCharts(null); setActionStats(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load analytics dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [canMonitorGovernance, isOfficer, user?._id]);

  const officerChartItems = [
    { key: 'auditsAssignedStatus',   title: 'My Assigned Audits',   description: 'Status split of audits currently assigned to you.' },
    { key: 'myAuditCompletionTrend', title: 'My Completion Trend',  description: 'Your completed audits trend over the last 6 months.' },
    { key: 'verificationQueue',      title: 'Verification Queue',   description: 'Actions awaiting officer verification vs verified workload.' }
  ];

  const linkCards = [
    canManageDefinitions && { icon: CheckSquare,    iconBg: 'rgba(99,102,241,0.1)',  iconColor: '#4338ca', title: 'Checklist Templates', subtitle: 'Create and maintain compliance checklist templates.',  href: '/portal/compliance/checklists', accent: 'linear-gradient(90deg,#6366f1,#4f46e5)' },
    canManageDefinitions && { icon: ClipboardCheck, iconBg: 'rgba(34,120,214,0.1)',  iconColor: '#1d4ed8', title: 'Audit Schedules',      subtitle: 'Schedule, assign, and manage audit lifecycle.',        href: '/portal/compliance/audits',     accent: 'linear-gradient(90deg,#2278d6,#1d4ed8)' },
    canConduct           && { icon: ClipboardCheck, iconBg: 'rgba(14,165,233,0.1)',  iconColor: '#0369a1', title: 'Conduct Audit',        subtitle: 'Execute checklist pass/fail runs and submit findings.', href: '/portal/compliance/conduct',    accent: 'linear-gradient(90deg,#0ea5e9,#0369a1)' },
    canAccessActions     && { icon: Wrench,          iconBg: 'rgba(245,158,11,0.1)',  iconColor: '#b45309', title: 'Corrective Actions',   subtitle: 'Assign, track and verify issue closure workflows.',    href: '/portal/compliance/actions',    accent: 'linear-gradient(90deg,#f59e0b,#d97706)' },
  ].filter(Boolean);

  return (
    <section className="space-y-6">
      {/* ── Hero ── */}
      <header className="compliance-hero-bg rounded-3xl p-6 md:p-8 text-white shadow-card">
        <div className="floating-orb floating-orb-lg bg-teal-400/10 -top-20 right-8"   style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-blue-400/10 -bottom-14 left-8" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-teal-200 border border-white/10 mb-4">
            <ShieldCheck size={13} className="animate-pulse" /> Compliance & Audit Hub
          </p>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                {canMonitorGovernance
                  ? <>Manager <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-200">Command Center</span></>
                  : <>Officer <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-200">Operations</span></>}
              </h1>
              <p className="mt-2 text-sm text-white/75 max-w-xl leading-relaxed">
                {canMonitorGovernance
                  ? 'Maintain checklists, audits, corrective actions, and governance analytics from one unified workspace.'
                  : 'Conduct audits, review corrective action submissions, and track your verification queue.'}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="lms-stat-chip !min-w-[72px] !px-3 !py-2">
                <Activity size={13} className="text-teal-300" />
                <p className="text-[10px] font-semibold text-teal-200 uppercase tracking-widest mt-0.5">Role</p>
                <p className="text-sm font-extrabold capitalize">{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="lms-stat-chip !px-3 !py-2 hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCcw size={15} className={`text-teal-300 ${loading ? 'animate-spin' : ''}`} />
                <p className="text-[10px] font-bold text-teal-200 uppercase tracking-widest">Refresh</p>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 backdrop-blur-sm px-5 py-4 text-sm font-medium text-red-700 flex items-center gap-3 shadow-sm">
          <AlertTriangle size={17} className="text-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Workspace Link Cards ── */}
      {linkCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {linkCards.map((card, i) => (
            <div key={card.href} className="animate-fade-in-up" style={{ opacity: 0, animationDelay: `${i * 0.07}s` }}>
              <LinkCard {...card} />
            </div>
          ))}
        </div>
      )}

      {/* ── Analytics Section ── */}
      {canMonitorGovernance ? (
        <div className="glass-card-premium rounded-3xl p-6 shadow-card animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-brand"><BarChart3 size={19} /></div>
              <div>
                <h2 className="text-lg font-bold text-ink-900">QuickChart Analytics</h2>
                <p className="text-xs text-ink-700 mt-0.5">Real-time compliance dashboard powered by QuickChart.io</p>
              </div>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs disabled:opacity-50"
            >
              <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {loading && (
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-700">
              <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              Loading analytics...
            </div>
          )}
          <AnalyticsCards summary={summary} actionStats={actionStats} />
          <div className="mt-4"><QuickChartPanel charts={charts} isLoading={loading} /></div>
        </div>
      ) : isOfficer ? (
        <div className="glass-card-premium rounded-3xl p-6 shadow-card animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-container" style={{ background: 'rgba(14,165,233,0.1)', color: '#0369a1' }}>
                <BarChart3 size={19} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink-900">Officer Analytics</h2>
                <p className="text-xs text-ink-700 mt-0.5">Role-specific chart insights for your execution and verification workflows.</p>
              </div>
            </div>
            <button type="button" onClick={load} disabled={loading} className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs disabled:opacity-50">
              <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {loading && (
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-sky-700">
              <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              Loading officer charts...
            </div>
          )}
          <QuickChartPanel charts={officerCharts} isLoading={loading} items={officerChartItems} />
        </div>
      ) : (
        <div className="glass-card-premium rounded-3xl p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="icon-container icon-container-brand"><Layers size={20} /></div>
            <p className="text-sm font-semibold text-ink-800">
              Governance analytics is manager-only. Use the cards above to open your execution and verification workspaces.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
