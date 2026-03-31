const StatCard = ({ label, value }) => (
  <article className="glass-panel rounded-2xl p-4 shadow-card">
    <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{label}</p>
    <p className="mt-2 text-3xl font-extrabold text-ink-900">{value}</p>
  </article>
);

export const AnalyticsCards = ({ summary, actionStats }) => {
  const open = actionStats?.byStatus?.open || summary?.correctiveByStatus?.open || 0;
  const inProgress = actionStats?.byStatus?.['in-progress'] || summary?.correctiveByStatus?.['in-progress'] || 0;
  const total = actionStats?.total || Object.values(summary?.correctiveByStatus || {}).reduce((a, b) => a + b, 0);
  const overdue = actionStats?.overdue || summary?.overdueCorrectiveActions || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Open Actions" value={open} />
      <StatCard label="In Progress" value={inProgress} />
      <StatCard label="Overdue" value={overdue} />
      <StatCard label="Total Actions" value={total} />
    </div>
  );
};
