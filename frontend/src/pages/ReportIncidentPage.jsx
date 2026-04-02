import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, MapPin, FileText, ChevronLeft, ChevronRight,
  CheckCircle2, Loader2, Info, Calendar,
  ShieldAlert, Flame, Activity
} from 'lucide-react';
import { api } from '../services/api';
import MapPicker from '../components/MapPicker';

// ── Config ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Basic Info',    icon: FileText },
  { id: 2, label: 'Location & Date', icon: MapPin  },
  { id: 3, label: 'Description',   icon: FileText },
];

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

const INITIAL = { title: '', type: '', severity: '', address: '', latitude: null, longitude: null, dateOccurred: '', description: '' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
      <Info size={11} />{msg}
    </p>
  );
}

function Label({ children, required }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportIncidentPage() {
  const navigate = useNavigate();
  const [form, setForm]             = useState(INITIAL);
  const [errors, setErrors]         = useState({});
  const [step, setStep]             = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  // Handle map location selection
  const handleLocationChange = useCallback(({ address, latitude, longitude }) => {
    setForm((f) => ({ ...f, address, latitude, longitude }));
    setErrors((e) => ({ ...e, address: '' }));
  }, []);

  // Validate only the fields that belong to a given step
  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.title.trim())   e.title    = 'Title is required.';
      if (!form.type)           e.type     = 'Select an incident type.';
      if (!form.severity)       e.severity = 'Select a severity level.';
    }
    if (s === 2) {
      if (!form.address || !form.address.trim()) e.address = 'Please select a location on the map.';
      if (!form.dateOccurred) e.dateOccurred = 'Date of occurrence is required.';
    }
    if (s === 3) {
      if (!form.description.trim()) e.description = 'Description is required.';
      else if (form.description.trim().length < 20)
        e.description = 'Please provide at least 20 characters.';
    }
    return e;
  };

  const goNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  // Validate on blur for immediate feedback
  const handleBlur = (key) => {
    const allErrs = validateStep(step);
    if (allErrs[key]) setErrors((e) => ({ ...e, [key]: allErrs[key] }));
  };

  const handleSubmit = async () => {
    const errs = validateStep(3);
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

  // ── Success screen ────────────────────────────────────────────────────────

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
              onClick={() => { setForm(INITIAL); setStep(1); setSuccess(false); }}
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

  // ── Form ──────────────────────────────────────────────────────────────────

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

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Progress stepper ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center gap-0">
            {STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              const done    = step > s.id;
              const active  = step === s.id;
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  {/* Step node */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      done   ? 'bg-emerald-500 text-white'
                      : active ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : 'bg-slate-100 text-slate-400'
                    }`}>
                      {done ? <CheckCircle2 size={16} /> : <StepIcon size={15} />}
                    </div>
                    <p className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                      active ? 'text-brand-700' : done ? 'text-emerald-600' : 'text-slate-400'
                    }`}>{s.label}</p>
                  </div>

                  {/* Connector line (not after last) */}
                  {idx < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 mb-4 rounded-full transition-all ${
                      step > s.id ? 'bg-emerald-400' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Global API error */}
        {errors._global && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <Info size={15} />
            {errors._global}
          </div>
        )}

        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-1">
              <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText size={14} className="text-brand-500" />
                Basic Information
              </h2>
            </div>

            {/* Title */}
            <div>
              <Label required>Incident Title</Label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                onBlur={() => handleBlur('title')}
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
                          ? 'border-brand-500 bg-brand-50 shadow-sm'
                          : 'border-slate-200 hover:border-brand-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center ${
                        selected ? 'bg-brand-100' : 'bg-slate-100'
                      }`}>
                        <TypeIcon size={18} className={selected ? 'text-brand-600' : 'text-slate-500'} />
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
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      form.severity === opt.value
                        ? `${opt.selected} border-current shadow-sm`
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
        )}

        {/* ── Step 2: Location & Date ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-1">
              <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MapPin size={14} className="text-brand-500" />
                Location &amp; Date
              </h2>
            </div>

            <div>
              <Label required>Incident Location</Label>
              <p className="text-xs text-slate-500 mb-3">Search, click the map, or use your current location to pin the incident site.</p>
              <MapPicker
                value={{
                  address: form.address,
                  latitude: form.latitude,
                  longitude: form.longitude,
                }}
                onChange={handleLocationChange}
                error={errors.address}
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
                  onBlur={() => handleBlur('dateOccurred')}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors ${
                    errors.dateOccurred ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:bg-white'
                  }`}
                />
              </div>
              <FieldError msg={errors.dateOccurred} />
            </div>
          </div>
        )}

        {/* ── Step 3: Description ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-1">
              <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText size={14} className="text-brand-500" />
                Incident Description
              </h2>
            </div>

            {/* Summary of previous steps */}
            <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1 border border-slate-100">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Summary so far</p>
              <p className="text-sm text-slate-700"><span className="font-medium">Title:</span> {form.title}</p>
              <p className="text-sm text-slate-700"><span className="font-medium">Type:</span> {form.type} · <span className="font-medium">Severity:</span> {form.severity}</p>
              <p className="text-sm text-slate-700"><span className="font-medium">Location:</span> {form.address} · {form.dateOccurred}</p>
            </div>

            <div>
              <Label required>What happened?</Label>
              <textarea
                rows={6}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                onBlur={() => handleBlur('description')}
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
        )}

        {/* ── Navigation buttons ── */}
        <div className="flex gap-3 pb-6">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          {step === 1 && (
            <button
              type="button"
              onClick={() => navigate('/incidents')}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {submitting
                ? <><Loader2 size={16} className="animate-spin" />Submitting…</>
                : <><CheckCircle2 size={16} />Submit Report</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
