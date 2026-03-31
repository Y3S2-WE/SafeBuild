import { useEffect, useState } from 'react';
import { CheckSquare, RefreshCcw } from 'lucide-react';
import { ChecklistForm } from '../../components/compliance/ChecklistForm';
import { ChecklistList } from '../../components/compliance/ChecklistList';
import { checklistApi } from '../../services/compliance/checklistApi';
import { useAuth } from '../../context/AuthContext';

export const ChecklistTemplatesPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'manager';
  const canDelete = user?.role === 'manager';

  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await checklistApi.getAll();
      setItems(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load checklists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (payload) => {
    setError('');
    await checklistApi.create(payload);
    await load();
  };

  const update = async (payload) => {
    if (!editingItem?._id) {
      return;
    }

    setError('');
    await checklistApi.update(editingItem._id, payload);
    setEditingItem(null);
    await load();
  };

  const toggle = async (checklist) => {
    await checklistApi.update(checklist._id, { isActive: !checklist.isActive });
    await load();
  };

  const remove = async (id) => {
    await checklistApi.remove(id);
    if (editingItem?._id === id) {
      setEditingItem(null);
    }
    await load();
  };

  const startEdit = async (item) => {
    try {
      setLoading(true);
      setError('');
      const response = await checklistApi.getById(item._id);
      setEditingItem(response.data || item);
    } catch (err) {
      setError(err.message || 'Failed to load checklist for editing.');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setError('');
  };

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-3xl p-7 shadow-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800">
          <CheckSquare size={14} /> Checklist Templates
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">Checklist CRUD</h1>
        <p className="mt-2 text-sm text-ink-800">Create and maintain audit checklist templates for compliance runs.</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr,1.1fr]">
        {canManage ? (
          <div className="glass-panel rounded-2xl p-5 shadow-card">
            <h2 className="mb-3 text-lg font-bold text-ink-900">
              {editingItem ? 'Edit Checklist Template' : 'New Checklist Template'}
            </h2>
            <ChecklistForm
              key={editingItem?._id || 'new'}
              onSubmit={editingItem ? update : create}
              loading={loading}
              initialValues={editingItem}
              onCancel={cancelEdit}
            />
          </div>
        ) : null}

        <div className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900">Templates</h2>
            <button type="button" className="rounded-xl border border-brand-200 px-2 py-1 text-xs font-semibold" onClick={load}>
              <RefreshCcw size={12} className="mr-1 inline" /> Refresh
            </button>
          </div>
          <ChecklistList
            items={items}
            canManage={canManage}
            canDelete={canDelete}
            onToggle={toggle}
            onDelete={remove}
            onEdit={startEdit}
          />
        </div>
      </div>
    </section>
  );
};
