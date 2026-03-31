import { correctivePriorities } from '../../constants/compliance/statusOptions';

export const CorrectiveActionForm = ({ audits = [], assignees = [], onSubmit, loading = false }) => {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      title: formData.get('title'),
      description: formData.get('description'),
      audit: formData.get('audit'),
      assignedTo: formData.get('assignedTo'),
      priority: formData.get('priority'),
      dueDate: formData.get('dueDate')
    };

    await onSubmit(payload);
    event.currentTarget.reset();
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <input
        name="title"
        className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
        placeholder="Corrective action title"
        required
      />

      <textarea
        name="description"
        rows={3}
        className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
        placeholder="Description"
        required
      />

      <select name="audit" className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm" required>
        <option value="">Select related audit</option>
        {audits.map((audit) => (
          <option key={audit._id} value={audit._id}>{audit.site} ({audit.status})</option>
        ))}
      </select>

      <select name="assignedTo" className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm" required>
        <option value="">Assign user</option>
        {assignees.map((user) => (
          <option key={user._id || user.id} value={user._id || user.id}>
            {user.firstName} {user.lastName} ({user.role})
          </option>
        ))}
      </select>

      <div className="grid gap-2 sm:grid-cols-2">
        <select name="priority" defaultValue="medium" className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm">
          {correctivePriorities.map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>

        <input name="dueDate" type="date" className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm" required />
      </div>

      <button type="submit" disabled={loading} className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-70">
        {loading ? 'Saving...' : 'Create Corrective Action'}
      </button>
    </form>
  );
};
