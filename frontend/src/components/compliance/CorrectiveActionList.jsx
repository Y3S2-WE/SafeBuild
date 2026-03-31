import { useState } from 'react';
import {
  managerAllowedCorrectiveTransitions,
  officerAllowedCorrectiveTransitions,
  safetyComplianceManagerAllowedCorrectiveTransitions
} from '../../constants/compliance/statusOptions';
import { formatDate, statusColorClass, titleCase } from '../../utils/compliance/formatters';

const truncateText = (text, maxLength = 140) => {
  const normalized = String(text || '').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

export const CorrectiveActionList = ({
  actions = [],
  canDelete = false,
  role = '',
  onUploadDocument = async () => {},
  onStatusChange,
  onDelete
}) => {
  const [completionSummaryById, setCompletionSummaryById] = useState({});
  const [selectedFileById, setSelectedFileById] = useState({});
  const [uploadingById, setUploadingById] = useState({});
  const [submissionErrorById, setSubmissionErrorById] = useState({});
  const [verificationNotesById, setVerificationNotesById] = useState({});
  const [reviewErrorById, setReviewErrorById] = useState({});

  const isSafetyComplianceManager = role === 'safety-compliance-manager';
  const isOfficer = role === 'officer';

  const allowedTransitions = isSafetyComplianceManager
    ? safetyComplianceManagerAllowedCorrectiveTransitions
    : isOfficer
      ? officerAllowedCorrectiveTransitions
      : managerAllowedCorrectiveTransitions;

  if (!actions.length) {
    return <p className="text-sm text-ink-700">No corrective actions yet.</p>;
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => {
        const nextStatuses = allowedTransitions[action.status] || [];
        const quickActionStatuses = isSafetyComplianceManager
          ? nextStatuses.filter((status) => status !== 'completed')
          : nextStatuses;
        const completionSummary = completionSummaryById[action._id] || '';
        const selectedFile = selectedFileById[action._id] || null;
        const isUploading = Boolean(uploadingById[action._id]);
        const submissionError = submissionErrorById[action._id] || '';
        const verificationNotes = verificationNotesById[action._id] || '';
        const reviewError = reviewErrorById[action._id] || '';
        const statusLabel = action.status === 'completed' ? 'Pending Verification' : titleCase(action.status);
        const summaryText = truncateText(action.description, 150);
        const findingsText = truncateText(action.audit?.findings, 180);
        const completionText = truncateText(action.completionReport || action.completionSummary || action.completionNotes, 180);

        return (
          <article key={action._id} className="rounded-xl border border-brand-100 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink-900">{action.title}</p>
                <p className="mt-1 text-xs text-ink-700">{summaryText || 'No summary provided.'}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-700">
                  <span><strong>Due:</strong> {formatDate(action.dueDate)}</span>
                  <span><strong>Site:</strong> {action.audit?.site || 'N/A'}</span>
                  <span><strong>Assignee:</strong> {action.assignedTo?.firstName} {action.assignedTo?.lastName}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColorClass(action.priority)}`}>
                  {titleCase(action.priority)}
                </span>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColorClass(action.status)}`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            {(findingsText || completionText || action.completionDocument?.url || action.verificationNotes) ? (
              <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-2">
                <summary className="cursor-pointer text-xs font-semibold text-ink-800">View details</summary>
                <div className="mt-2 space-y-2 text-xs text-ink-800">
                  {findingsText ? (
                    <p><strong>Audit summary:</strong> {findingsText}</p>
                  ) : null}
                  {completionText ? (
                    <p><strong>Completion note:</strong> {completionText}</p>
                  ) : null}
                  {action.verificationNotes ? (
                    <p><strong>Verification notes:</strong> {action.verificationNotes}</p>
                  ) : null}
                  {action.completionDocument?.url ? (
                    <p>
                      <strong>Completion file:</strong>{' '}
                      <a
                        href={action.completionDocument.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-brand-700 underline"
                      >
                        {action.completionDocument.originalName || 'View document'}
                      </a>
                    </p>
                  ) : null}
                </div>
              </details>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {isOfficer ? null : quickActionStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="rounded-lg border border-brand-200 px-2 py-1 text-xs"
                  onClick={() => onStatusChange(action, status)}
                >
                  Set {titleCase(status)}
                </button>
              ))}

              {isSafetyComplianceManager && action.status === 'in-progress' ? (
                <div className="mt-2 w-full space-y-2 rounded-lg border border-brand-100 p-2">
                  <p className="text-xs text-ink-700">Upload completion report as PDF/DOC/DOCX and provide summary note for officer verification.</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="w-full rounded-lg border border-brand-100 px-2 py-1 text-xs"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedFileById((prev) => ({ ...prev, [action._id]: file }));
                      setSubmissionErrorById((prev) => ({ ...prev, [action._id]: '' }));
                    }}
                  />
                  {selectedFile ? (
                    <p className="text-xs text-ink-700">Selected file: {selectedFile.name}</p>
                  ) : action.completionDocument?.originalName ? (
                    <p className="text-xs text-ink-700">Uploaded file: {action.completionDocument.originalName}</p>
                  ) : null}
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-brand-100 px-2 py-1 text-xs"
                    placeholder="Summary note (short closure summary)"
                    value={completionSummary}
                    onChange={(e) => {
                      setCompletionSummaryById((prev) => ({ ...prev, [action._id]: e.target.value }));
                      setSubmissionErrorById((prev) => ({ ...prev, [action._id]: '' }));
                    }}
                  />
                  {submissionError ? <p className="text-xs text-red-700">{submissionError}</p> : null}
                  <button
                    type="button"
                    className="rounded-lg border border-brand-200 px-2 py-1 text-xs"
                    disabled={isUploading}
                    onClick={async () => {
                      if (!completionSummary.trim()) {
                        setSubmissionErrorById((prev) => ({
                          ...prev,
                          [action._id]: 'Summary note is required.'
                        }));
                        return;
                      }

                      if (!selectedFile && !action.completionDocument?.url) {
                        setSubmissionErrorById((prev) => ({
                          ...prev,
                          [action._id]: 'Upload a PDF, DOC, or DOCX completion report.'
                        }));
                        return;
                      }

                      setSubmissionErrorById((prev) => ({ ...prev, [action._id]: '' }));

                      try {
                        if (selectedFile) {
                          setUploadingById((prev) => ({ ...prev, [action._id]: true }));
                          await onUploadDocument(action, selectedFile);
                        }

                        await onStatusChange(action, 'completed', {
                          completionSummary
                        });

                        setSelectedFileById((prev) => ({ ...prev, [action._id]: null }));
                      } catch (error) {
                        setSubmissionErrorById((prev) => ({
                          ...prev,
                          [action._id]: error?.message || 'Failed to submit completion package.'
                        }));
                      } finally {
                        setUploadingById((prev) => ({ ...prev, [action._id]: false }));
                      }
                    }}
                  >
                    {isUploading ? 'Uploading...' : 'Submit for Verification'}
                  </button>
                </div>
              ) : null}

              {isOfficer && action.status === 'completed' ? (
                <div className="mt-2 w-full space-y-2 rounded-lg border border-brand-100 p-2">
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-brand-100 px-2 py-1 text-xs"
                    placeholder="Review notes (required when rejecting)"
                    value={verificationNotes}
                    onChange={(e) => {
                      setVerificationNotesById((prev) => ({ ...prev, [action._id]: e.target.value }));
                      setReviewErrorById((prev) => ({ ...prev, [action._id]: '' }));
                    }}
                  />
                  {reviewError ? <p className="text-xs text-red-700">{reviewError}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                      onClick={() => {
                        setReviewErrorById((prev) => ({ ...prev, [action._id]: '' }));
                        onStatusChange(action, 'verified', { verificationNotes });
                      }}
                    >
                      Verify Completion
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700"
                      onClick={() => {
                        if (!verificationNotes.trim()) {
                          setReviewErrorById((prev) => ({
                            ...prev,
                            [action._id]: 'Rejection reason is required.'
                          }));
                          return;
                        }

                        setReviewErrorById((prev) => ({ ...prev, [action._id]: '' }));
                        onStatusChange(action, 'in-progress', { verificationNotes });
                      }}
                    >
                      Reject to In Progress
                    </button>
                  </div>
                </div>
              ) : null}

              {!isSafetyComplianceManager && !isOfficer && !nextStatuses.length ? (
                <p className="text-xs text-ink-700">View-only access</p>
              ) : null}

              {canDelete ? (
                <button
                  type="button"
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
                  onClick={() => onDelete(action._id)}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
};
