export const AuditScheduleForm = ({ checklists = [], auditors = [], onSubmit, loading = false }) => {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      site: formData.get('site'),
      auditDate: formData.get('auditDate'),
      checklistTemplate: formData.get('checklistTemplate'),
      assignedAuditor: formData.get('assignedAuditor')
    };

    await onSubmit(payload);
    event.currentTarget.reset();
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <input
        name="site"
        className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
        placeholder="Site / Department"
        required
      />

      <input
        name="auditDate"
        type="datetime-local"
        className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
        required
      />

      <select name="checklistTemplate" className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm" required>
        <option value="">Select checklist template</option>
        {checklists.filter((item) => item.isActive).map((item) => (
          <option key={item._id} value={item._id}>{item.title}</option>
        ))}
      </select>

      <select name="assignedAuditor" className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm" required>
        <option value="">Assign officer</option>
        {auditors.map((user) => (
          <option key={user._id || user.id} value={user._id || user.id}>
            {user.firstName} {user.lastName} ({user.role})
          </option>
        ))}
      </select>

      <button type="submit" disabled={loading} className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-70">
        {loading ? 'Saving...' : 'Create Audit Schedule'}
      </button>
    </form>
  );
};
