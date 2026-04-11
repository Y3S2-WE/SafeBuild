import { useEffect, useMemo, useState } from 'react';
import { correctivePriorities } from '../../constants/compliance/statusOptions';

export const AuditExecutionForm = ({ audits = [], complianceManagers = [], selectedAudit, onSelectAudit, onSubmit, loading = false }) => {
  const [findings, setFindings] = useState('');
  const [answers, setAnswers] = useState({});
  const [assignments, setAssignments] = useState({});
  const [formError, setFormError] = useState('');

  const availableAudits = useMemo(
    () => audits.filter(
      (audit) =>
        audit.status !== 'completed' &&
        audit.status !== 'cancelled' &&
        Boolean(audit.checklistTemplate)
    ),
    [audits]
  );

  const checklistItems = selectedAudit?.checklistTemplate?.items || [];

  useEffect(() => {
    setFindings('');
    setAnswers({});
    setAssignments({});
    setFormError('');
  }, [selectedAudit?._id]);

  const handleAuditSelect = (event) => {
    const nextId = event.target.value;
    setFindings('');
    setAnswers({});
    setAssignments({});
    setFormError('');
    onSelectAudit(nextId);
  };

  const setAssignmentField = (questionId, key, value) => {
    setAssignments((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [key]: value
      }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedAudit) {
      return;
    }

    if (!checklistItems.length) {
      setFormError('Selected audit has no checklist items. Please schedule a valid audit template.');
      return;
    }

    const findingsSummary = findings.trim();
    if (!findingsSummary) {
      setFormError('Findings summary is required before submitting audit results.');
      return;
    }

    const responses = checklistItems.map((item) => ({
      questionId: item._id,
      actualAnswer: answers[item._id] === 'true',
      comments: ''
    }));

    const failedItems = checklistItems.filter((item) => answers[item._id] === 'false');

    if (failedItems.length > 0 && complianceManagers.length === 0) {
      setFormError('No active safety compliance managers available. Add one before submitting failed items.');
      return;
    }

    const correctiveAssignments = failedItems.map((item) => ({
      questionId: item._id,
      assignedTo: assignments[item._id]?.assignedTo || '',
      priority: assignments[item._id]?.priority || ''
    }));

    const missingAssignment = correctiveAssignments.find((item) => !item.assignedTo || !item.priority);
    if (missingAssignment) {
      setFormError('Please assign a safety compliance manager and priority for every failed item before submitting.');
      return;
    }

    setFormError('');

    const payload = {
      responses,
      findings: findingsSummary,
      correctiveAssignments
    };

    if (selectedAudit.status === 'scheduled') {
      payload.status = 'in-progress';
    }

    try {
      await onSubmit(selectedAudit._id, payload);
      setFindings('');
      setAnswers({});
      setAssignments({});
      setFormError('');
    } catch (err) {
      setFormError(err.message || 'Failed to submit audit execution.');
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <select className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm" value={selectedAudit?._id || ''} onChange={handleAuditSelect}>
        <option value="">Select audit to conduct</option>
        {availableAudits.map((audit) => (
          <option key={audit._id} value={audit._id}>{audit.site} ({audit.status})</option>
        ))}
      </select>

      {checklistItems.map((item) => (
        <div key={item._id} className="rounded-xl border border-brand-100 p-3">
          <p className="text-sm font-semibold text-ink-900">{item.question}</p>
          <select
            className="mt-2 w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
            value={answers[item._id] || ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [item._id]: e.target.value }))}
            required
          >
            <option value="">Select result</option>
            <option value="true">Pass / Yes</option>
            <option value="false">Fail / No</option>
          </select>

          <p className="mt-2 text-xs text-ink-700">
            If marked as fail, assign a safety compliance manager and set a priority for the corrective action.
          </p>

          {answers[item._id] === 'false' ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <select
                className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
                value={assignments[item._id]?.assignedTo || ''}
                onChange={(e) => setAssignmentField(item._id, 'assignedTo', e.target.value)}
                required
              >
                <option value="">Assign safety compliance manager</option>
                {complianceManagers.map((manager) => (
                  <option key={manager._id || manager.id} value={manager._id || manager.id}>
                    {manager.firstName} {manager.lastName}
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
                value={assignments[item._id]?.priority || ''}
                onChange={(e) => setAssignmentField(item._id, 'priority', e.target.value)}
                required
              >
                <option value="">Set priority</option>
                {correctivePriorities.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
          ) : null}

          {answers[item._id] === 'false' && complianceManagers.length === 0 ? (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
              No active safety compliance managers found to assign this failed item.
            </p>
          ) : null}
        </div>
      ))}

      {selectedAudit && checklistItems.length === 0 ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          This audit cannot be conducted because its checklist template is missing or has no items.
        </p>
      ) : null}

      {formError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {formError}
        </p>
      ) : null}

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Officer Findings Summary *</p>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
          placeholder="Summarize key issues, risk context, and overall observations"
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading || !selectedAudit || checklistItems.length === 0} className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-70">
        {loading ? 'Submitting...' : 'Submit Audit Results'}
      </button>
    </form>
  );
};
