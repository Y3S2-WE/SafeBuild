import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, MapPin, FileText, ChevronLeft,
  CheckCircle2, Loader2, Info, Calendar,
  ShieldAlert, Flame, Activity
} from 'lucide-react';
import { api } from '../services/api';

const FIELD_OPTS = {
  type: [
    { value: 'hazard',    label: 'Hazard',    icon: ShieldAlert, desc: 'Potential risk that hasn\'t caused harm yet' },
    { value: 'near-miss', label: 'Near Miss',  icon: Flame,       desc: 'Incident that could have caused harm' },
    { value: 'accident',  label: 'Accident',   icon: Activity,    desc: 'Incident resulting in actual harm or damage' },
  ],
  severity: [
    { value: 'low',    label: 'Low',    dot: 'bg-emerald-500', selected: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
    { value: 'medium', label: 'Medium', dot: 'bg-amber-500',   selected: 'border-amber-400   bg-amber-50   text-amber-700'  },
    { value: 'high',   label: 'High',   dot: 'bg-rose-500',    selected: 'border-rose-400    bg-rose-50    text-rose-700'   },
  ],
};

const INITIAL = {
  title: '',
  type: '',
  severity: '',
  address: '',
  dateOccurred: '',
  description: '',
};

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1"><Info size={11} />{msg}</p>;
}

function Label({ children, required }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

function SectionHeader({ step, icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {step}
      </div>
      <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-brand-500" />}
        {children}
      </h2>
    </div>
  );
}

export default function ReportIncidentPage() {
  const navigate = useNavigate();
  const [form, setForm]             = useState(INITIAL);
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required.';
    if (!form.type)               e.type        = 'Select an incident type.';
    if (!form.severity)           e.severity    = 'Select a severity level.';
    if (!form.address.trim())     e.address     = 'Location is required.';
    if (!form.dateOccurred)       e.dateOccurred = 'Date of occurrence is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    else if (form.description.trim().length < 20)
      e.description = 'Please provide at least 20 characters.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      await api.createIncident(form);
      setSuccess(true);
    } catch (err) {
      const apiErrors = {};
      if (err.details?.length) {
        err.details.forEach((d) => { if (d.field) apiErrors[d.field] = d.message; });
      }
      setErrors(Object.keys(apiErrors).length ? apiErrors : { _global: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-10 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-900">Report Submitted</h2>
            <p className="text-slate-500 text-sm mt-1">
              Your incident has been logged and will be reviewed shortly.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setForm(INITIAL); setSuccess(false); }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Report Another
            </button>
            <button
              onClick={() => navigate('/incidents')}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
            >
              View All Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <button
            onClick={() => navigate('/incidents')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 font-medium mb-4 transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Reports
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-accent-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-900">Report an Incident</h1>
              <p className="text-sm text-slate-500">Fill in the details below to submit a safety report.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Global error */}
          {errors._global && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <Info size={15} />
              {errors._global}
            </div>
          )}

          {/* Section 1: Basic info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
            <SectionHeader step="1" icon={FileText}>Basic Information</SectionHeader>

            {/* Title */}
            <div>
              <Label required>Incident Title</Label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Brief, descriptive title…"
                maxLength={200}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors ${
                  errors.title ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:bg-white'
                }`}
              />
              <FieldError msg={errors.title} />
            </div>

            {/* Type */}
            <div>
              <Label required>Incident Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FIELD_OPTS.type.map((opt) => {
                  const TypeIcon = opt.icon;
                  const selected = form.type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('type', opt.value)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        selected
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg mb-2.5 flex items-center justify-center ${
                        selected ? 'bg-brand-100' : 'bg-slate-100'
                      }`}>
                        <TypeIcon size={16} className={selected ? 'text-brand-600' : 'text-slate-500'} />
                      </div>
                      <p className="text-sm font-semibold text-ink-900">{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
              <FieldError msg={errors.type} />
            </div>

            {/* Severity */}
            <div>
              <Label required>Severity Level</Label>
              <div className="flex gap-3">
                {FIELD_OPTS.severity.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('severity', opt.value)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      form.severity === opt.value
                        ? `${opt.selected} border-current`
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
              <FieldError msg={errors.severity} />
            </div>
          </div>

          {/* Section 2: Location & Date */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
            <SectionHeader step="2" icon={MapPin}>Location &amp; Date</SectionHeader>

            <div>
              <Label required>Site / Address</Label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="e.g. Block A, Level 3, Column 12"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors ${
                  errors.address ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:bg-white'
                }`}
              />
              <FieldError msg={errors.address} />
            </div>

            <div>
              <Label required>Date of Occurrence</Label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={form.dateOccurred}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set('dateOccurred', e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors ${
                    errors.dateOccurred ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:bg-white'
                  }`}
                />
              </div>
              <FieldError msg={errors.dateOccurred} />
            </div>
          </div>

          {/* Section 3: Description */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
            <SectionHeader step="3" icon={FileText}>Incident Description</SectionHeader>

            <div>
              <Label required>What happened?</Label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe the incident clearly — what occurred, who was involved, and any immediate actions taken…"
                maxLength={2000}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors resize-none ${
                  errors.description ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:bg-white'
                }`}
              />
              <div className="flex justify-between mt-1">
                <FieldError msg={errors.description} />
                <span className={`text-xs ml-auto ${form.description.length >= 1900 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {form.description.length}/2000
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pb-6">
            <button
              type="button"
              onClick={() => navigate('/incidents')}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {submitting
                ? <><Loader2 size={16} className="animate-spin" />Submitting…</>
                : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
