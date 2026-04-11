export const FormInput = ({ label, id, error, ...props }) => {
  return (
    <label htmlFor={id} className="flex w-full flex-col gap-2">
      <span className="text-sm font-semibold text-ink-800">{label}</span>
      <input
        id={id}
        {...props}
        className="w-full rounded-xl border border-brand-100 bg-white/90 px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
};
