import { useEffect, useState } from 'react';
import { checklistCategories } from '../../constants/compliance/statusOptions';

const initialForm = {
  title: '',
  description: '',
  category: 'general',
  items: [{ question: '' }]
};

const normalizeItems = (items = []) => {
  const normalized = items
    .map((item) => ({ question: item?.question || '' }))
    .filter((item) => item.question.trim());

  return normalized.length ? normalized : [{ question: '' }];
};

const toFormState = (values) => ({
  title: values?.title || '',
  description: values?.description || '',
  category: values?.category || 'general',
  items: normalizeItems(values?.items || [])
});

export const ChecklistForm = ({ onSubmit, loading = false, initialValues = null, onCancel }) => {
  const [form, setForm] = useState(() => toFormState(initialValues));

  useEffect(() => {
    setForm(toFormState(initialValues));
  }, [initialValues]);

  const setItemField = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? { ...item, [key]: value } : item))
    }));
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { question: '' }] }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? prev.items : prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      items: form.items.filter((item) => item.question.trim())
    };
    await onSubmit(payload);
    setForm(initialForm);
  };

  const isEditing = Boolean(initialValues?._id);

  return (
    <form className="space-y-3" onSubmit={submit}>
      <input
        className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
        placeholder="Checklist title"
        value={form.title}
        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
        required
      />

      <textarea
        className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
        placeholder="Description"
        rows={2}
        value={form.description}
        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
      />

      <select
        className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
        value={form.category}
        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
      >
        {checklistCategories.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>

      <div className="space-y-2">
        {form.items.map((item, index) => (
          <div key={`${index}-${item.question}`} className="rounded-xl border border-brand-100 p-3">
            <input
              className="mb-2 w-full rounded-xl border border-brand-100 px-3 py-2 text-sm"
              placeholder={`Question ${index + 1}`}
              value={item.question}
              onChange={(e) => setItemField(index, 'question', e.target.value)}
              required
            />
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-red-700"
              onClick={() => removeItem(index)}
            >
              Remove question
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-xl border border-brand-200 px-3 py-2 text-sm font-semibold"
          onClick={addItem}
        >
          Add Question
        </button>
        {isEditing ? (
          <button
            type="button"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Checklist' : 'Create Checklist'}
        </button>
      </div>
    </form>
  );
};
