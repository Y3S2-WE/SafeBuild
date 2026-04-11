import { statusColorClass, titleCase } from '../../utils/compliance/formatters';

export const ChecklistList = ({ items = [], canManage = false, canDelete = false, onToggle, onDelete, onEdit }) => {
  if (!items.length) {
    return <p className="text-sm text-ink-700">No checklist templates yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item._id} className="rounded-xl border border-brand-100 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-ink-900">{item.title}</p>
              <p className="text-xs text-ink-700">
                {titleCase(item.category)} • {item.items?.length || 0} questions
              </p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColorClass(item.isActive ? 'completed' : 'cancelled')}`}>
              {item.isActive ? 'active' : 'inactive'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {canManage ? (
              <button
                type="button"
                className="rounded-lg border border-brand-200 px-2 py-1 text-xs"
                onClick={() => onEdit(item)}
              >
                Edit
              </button>
            ) : null}

            {canManage ? (
              <button
                type="button"
                className="rounded-lg border border-brand-200 px-2 py-1 text-xs"
                onClick={() => onToggle(item)}
              >
                Toggle Active
              </button>
            ) : null}

            {canDelete ? (
              <button
                type="button"
                className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
                onClick={() => onDelete(item._id)}
              >
                Delete
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
};
