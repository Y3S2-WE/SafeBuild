import { useState } from 'react';
import { formatDateTime, statusColorClass } from '../../utils/compliance/formatters';

export const AuditList = ({ audits = [], canManage = false, canCancel = false, canDelete = false, showStatusActions = true, onStatusChange, onDelete, onSelect }) => {
  const [cancelReasonById, setCancelReasonById] = useState({});
  const [cancelErrorById, setCancelErrorById] = useState({});
  const [cancelSubmittingId, setCancelSubmittingId] = useState('');
  const [cancelEditingId, setCancelEditingId] = useState('');

  if (!audits.length) {
    return <p className="text-sm text-ink-700">No audits found.</p>;
  }

  const submitCancel = async (audit) => {
    const reason = (cancelReasonById[audit._id] || '').trim();
    if (!reason) {
      setCancelErrorById((prev) => ({ ...prev, [audit._id]: 'Cancellation reason is required.' }));
      return;
    }

    setCancelErrorById((prev) => ({ ...prev, [audit._id]: '' }));

    try {
      setCancelSubmittingId(audit._id);
      await onStatusChange(audit, 'cancelled', { cancelReason: reason });
      setCancelReasonById((prev) => ({ ...prev, [audit._id]: '' }));
      setCancelEditingId('');
    } finally {
      setCancelSubmittingId('');
    }
  };

  return (
    <div className="space-y-3">
      {audits.map((audit) => (
        <article key={audit._id} className="rounded-xl border border-brand-100 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-ink-900">{audit.site}</p>
              <p className="text-xs text-ink-700">{formatDateTime(audit.auditDate)} • {audit.checklistTemplate?.title || 'Checklist N/A'}</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColorClass(audit.status)}`}>
              {audit.status}
            </span>
          </div>

          {audit.score?.total ? (
            <p className="mt-2 text-xs text-ink-700">
              Score: {audit.score.passed}/{audit.score.total} ({audit.score.percentage}%)
            </p>
          ) : null}

          {audit.status === 'cancelled' ? (
            <p className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
              Cancellation reason: {audit.cancelReason || 'No reason recorded'}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {onSelect && audit.status !== 'completed' && audit.status !== 'cancelled' && audit.checklistTemplate ? (
              <button type="button" className="rounded-lg border border-brand-200 px-2 py-1 text-xs" onClick={() => onSelect(audit)}>
                Conduct
              </button>
            ) : null}

            {showStatusActions && canManage && audit.status === 'scheduled' ? (
              <button type="button" className="rounded-lg border border-brand-200 px-2 py-1 text-xs" onClick={() => onStatusChange(audit, 'in-progress')}>
                Start
              </button>
            ) : null}

            {showStatusActions && canCancel && (audit.status === 'scheduled' || audit.status === 'in-progress') ? (
              <>
                <button
                  type="button"
                  className="rounded-lg border border-brand-200 px-2 py-1 text-xs"
                  onClick={() => setCancelEditingId(audit._id)}
                >
                  Cancel
                </button>

                {cancelEditingId === audit._id ? (
                  <div className="w-full space-y-2 rounded-lg border border-brand-100 p-2">
                    <textarea
                      rows={2}
                      className="w-full rounded-lg border border-brand-100 px-2 py-1 text-xs"
                      placeholder="Reason for cancelling this audit"
                      value={cancelReasonById[audit._id] || ''}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setCancelReasonById((prev) => ({ ...prev, [audit._id]: nextValue }));
                        if (nextValue.trim()) {
                          setCancelErrorById((prev) => ({ ...prev, [audit._id]: '' }));
                        }
                      }}
                    />
                    {cancelErrorById[audit._id] ? (
                      <p className="text-xs font-semibold text-red-700">{cancelErrorById[audit._id]}</p>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-brand-200 px-2 py-1 text-xs"
                        onClick={() => submitCancel(audit)}
                        disabled={cancelSubmittingId === audit._id}
                      >
                        {cancelSubmittingId === audit._id ? 'Submitting...' : 'Submit Cancellation'}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                        onClick={() => {
                          setCancelEditingId('');
                          setCancelErrorById((prev) => ({ ...prev, [audit._id]: '' }));
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {canDelete ? (
              <button type="button" className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700" onClick={() => onDelete(audit._id)}>
                Delete
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
};
