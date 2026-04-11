import { useEffect, useState } from 'react';
import {
  CheckSquare,
  RefreshCcw,
  Plus,
  Pencil,
  ShieldCheck,
  ListChecks,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { ChecklistForm } from '../../components/compliance/ChecklistForm';
import { ChecklistList } from '../../components/compliance/ChecklistList';
import { checklistApi } from '../../services/compliance/checklistApi';
import { useAuth } from '../../context/AuthContext';

export const ChecklistTemplatesPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'manager';
  const canDelete  = user?.role === 'manager';

  const [items, setItems]             = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const load = async () => {
    try {
      setLoading(true); setError('');
      const response = await checklistApi.getAll();
      setItems(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load checklists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (payload) => { setError(''); await checklistApi.create(payload); await load(); };
  const update = async (payload) => {
    if (!editingItem?._id) return;
    setError(''); await checklistApi.update(editingItem._id, payload);
    setEditingItem(null); await load();
  };
  const toggle = async (checklist) => { await checklistApi.update(checklist._id, { isActive: !checklist.isActive }); await load(); };
  const remove = async (id) => { await checklistApi.remove(id); if (editingItem?._id === id) setEditingItem(null); await load(); };
  const startEdit = async (item) => {
    try {
      setLoading(true); setError('');
      const response = await checklistApi.getById(item._id);
      setEditingItem(response.data || item);
    } catch (err) {
      setError(err.message || 'Failed to load checklist for editing.');
    } finally {
      setLoading(false);
    }
  };
  const cancelEdit = () => { setEditingItem(null); setError(''); };

  const activeCount   = items.filter((i) => i.isActive).length;
  const inactiveCount = items.length - activeCount;

  return (
    <section className="space-y-6">
      {/* ── Hero ── */}
      <header className="compliance-hero-bg rounded-3xl p-6 md:p-8 text-white shadow-card">
        <div className="floating-orb floating-orb-lg bg-indigo-400/10 -top-20 right-8"  style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-teal-400/8  -bottom-12 left-8" style={{ animationDelay: '2.5s' }} />

        <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-200 border border-white/10 mb-3">
            <ShieldCheck size={13} className="animate-pulse" /> Compliance Templates
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold leading-tight">
                Checklist <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-200">Templates</span>
              </h1>
              <p className="mt-1.5 text-sm text-white/75 max-w-xl">Create and maintain audit checklist templates for compliance runs.</p>
            </div>
            <div className="flex gap-2">
              <div className="lms-stat-chip !min-w-[68px] !px-3 !py-2">
                <CheckSquare size={12} className="text-indigo-300" />
                <p className="text-[10px] font-semibold text-indigo-200 uppercase tracking-widest mt-0.5">Total</p>
                <p className="text-xl font-extrabold">{items.length}</p>
              </div>
              <div className="lms-stat-chip !min-w-[68px] !px-3 !py-2">
                <Layers size={12} className="text-teal-300" />
                <p className="text-[10px] font-semibold text-indigo-200 uppercase tracking-widest mt-0.5">Active</p>
                <p className="text-xl font-extrabold">{activeCount}</p>
              </div>
              <button type="button" onClick={load} disabled={loading} className="lms-stat-chip !px-3 !py-2 hover:bg-white/20 cursor-pointer disabled:opacity-50">
                <RefreshCcw size={14} className={`text-indigo-300 ${loading ? 'animate-spin' : ''}`} />
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Refresh</p>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-5 py-4 text-sm font-medium text-red-700 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr,1.1fr]">
        {/* Form Panel */}
        {canManage && (
          <div className="glass-card-premium rounded-3xl p-6 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-container" style={{ background: 'rgba(99,102,241,0.1)', color: '#4338ca' }}>
                {editingItem ? <Pencil size={18} /> : <Plus size={18} />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink-900">
                  {editingItem ? 'Edit Checklist Template' : 'New Checklist Template'}
                </h2>
                <p className="text-xs text-ink-700 mt-0.5">
                  {editingItem ? 'Update the selected template.' : 'Define items, categories and scoring.'}
                </p>
              </div>
            </div>
            <ChecklistForm
              key={editingItem?._id || 'new'}
              onSubmit={editingItem ? update : create}
              loading={loading}
              initialValues={editingItem}
              onCancel={cancelEdit}
            />
          </div>
        )}

        {/* List Panel */}
        <div className="glass-card-premium rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-container" style={{ background: 'rgba(99,102,241,0.1)', color: '#4338ca' }}>
                <ListChecks size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink-900">Templates ({items.length})</h2>
                <p className="text-xs text-ink-700 mt-0.5">{activeCount} active · {inactiveCount} inactive</p>
              </div>
            </div>
            <button type="button" onClick={load} disabled={loading} className="btn-premium btn-premium-outline !px-3 !py-1.5 text-xs disabled:opacity-50">
              <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 py-4 text-sm font-semibold text-indigo-700">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Loading templates...
            </div>
          )}

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
