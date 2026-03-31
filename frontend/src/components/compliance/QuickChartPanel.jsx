import { useMemo, useState } from 'react';

export const QuickChartPanel = ({ charts, isLoading = false, items }) => {
  const defaultItems = [
    {
      key: 'correctiveStatus',
      title: 'Corrective Status',
      description: 'Action distribution across compliance lifecycle statuses.'
    },
    {
      key: 'correctivePriority',
      title: 'Corrective Priority',
      description: 'Priority workload split to guide team focus.'
    },
    {
      key: 'auditsTimeline',
      title: 'Audit Timeline',
      description: 'Completed audit trend over the last six months.'
    }
  ];

  const resolvedItems = items?.length ? items : defaultItems;
  const [failedChartKeys, setFailedChartKeys] = useState({});

  const visibleItems = useMemo(
    () => resolvedItems.filter((item) => item && typeof item.key === 'string' && item.key.trim()),
    [resolvedItems]
  );

  const ChartLoader = () => (
    <div className="min-h-[240px] animate-pulse rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center">
      <p className="text-xs text-slate-500">Loading chart...</p>
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleItems.map((item) => {
        const src = charts?.[item.key];
        const hasLoadFailure = Boolean(failedChartKeys[item.key]);
        const hasError = (!src || hasLoadFailure) && !isLoading;

        return (
          <article key={item.key} className="rounded-xl border border-brand-100 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{item.title}</p>
              <p className="text-xs text-slate-500 mt-1">{item.description}</p>
            </div>
            
            {isLoading ? (
              <ChartLoader />
            ) : src && !hasLoadFailure ? (
              <div className="min-h-[240px] overflow-hidden rounded-lg border border-slate-100 bg-white">
                <img 
                  src={src} 
                  alt={item.title} 
                  className="h-full w-full object-contain" 
                  loading="lazy"
                  onError={() => {
                    setFailedChartKeys((prev) => ({ ...prev, [item.key]: true }));
                  }}
                />
              </div>
            ) : (
              <div className="min-h-[240px] rounded-lg border border-slate-100 bg-slate-50 flex flex-col items-center justify-center p-4">
                <p className="text-xs font-semibold text-slate-600">No data available</p>
                <p className="text-xs text-slate-400 mt-1">
                  {hasError 
                    ? 'Failed to generate chart. Try refreshing the dashboard.'
                    : 'No records yet in this category.'}
                </p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};
