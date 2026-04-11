import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, MapPin, FileText, ChevronLeft, ChevronRight,
  CheckCircle2, Loader2, Info, Calendar,
  ShieldAlert, Flame, Activity, ShieldCheck, Zap, ClipboardList
} from 'lucide-react';
import { api } from '../services/api';
import MapPicker from '../components/MapPicker';

// ── Config ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Basic Info',     icon: FileText     },
  { id: 2, label: 'Location & Date', icon: MapPin       },
  { id: 3, label: 'Description',    icon: ClipboardList },
];

const FIELD_OPTS = {
  type: [
    { value: 'hazard',    label: 'Hazard',    icon: ShieldAlert, desc: "Potential risk that hasn't caused harm yet",   iconBg: 'rgba(249,115,22,0.1)',  iconClr: '#c2410c' },
    { value: 'near-miss', label: 'Near Miss', icon: Flame,       desc: 'Incident that could have caused harm',          iconBg: 'rgba(234,179,8,0.1)',   iconClr: '#854d0e' },
    { value: 'accident',  label: 'Accident',  icon: Activity,    desc: 'Incident resulting in actual harm or damage',   iconBg: 'rgba(239,68,68,0.1)',   iconClr: '#991b1b' },
  ],
  severity: [
    { value: 'low',    label: 'Low',    dot: 'bg-emerald-500', selCls: 'sev-btn-low-sel'    },
    { value: 'medium', label: 'Medium', dot: 'bg-amber-500',   selCls: 'sev-btn-medium-sel' },
    { value: 'high',   label: 'High',   dot: 'bg-rose-500',    selCls: 'sev-btn-high-sel'   },
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
    <label className="block text-sm font-semibold text-slate-700 mb-2">
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

  const handleLocationChange = useCallback(({ address, latitude, longitude }) => {
    setForm((f) => ({ ...f, address, latitude, longitude }));
    setErrors((e) => ({ ...e, address: '' }));
  }, []);

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.title.trim())   e.title    = 'Title is required.';
      if (!form.type)           e.type     = 'Select an incident type.';
      if (!form.severity)       e.severity = 'Select a severity level.';
    }
    if (s === 2) {
      if (!form.address?.trim()) e.address = 'Please select a location on the map.';
      if (!form.dateOccurred)    e.dateOccurred = 'Date of occurrence is required.';
    }
    if (s === 3) {
      if (!form.description.trim())              e.description = 'Description is required.';
      else if (form.description.trim().length < 20) e.description = 'Please provide at least 20 characters.';
    }
    return e;
  };

  const goNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const goBack = () => { setErrors({}); setStep((s) => s - 1); };

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
      if (err.details?.length) err.details.forEach((d) => { if (d.field) apiErrors[d.field] = d.message; });
      setErrors(Object.keys(apiErrors).length ? apiErrors : { _global: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
        <div className="report-step-card max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-200">
            <CheckCircle2 size={36} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-ink-900">Report Submitted!</h2>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              Your incident has been logged and will be reviewed by the safety team shortly.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setForm(INITIAL); setStep(1); setSuccess(false); }}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Report Another
            </button>
            <button
              onClick={() => navigate('/incidents')}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white text-sm font-bold transition-all shadow-lg shadow-rose-200"
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

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Hero Card ── */}
        <header className="incident-hero-bg rounded-3xl p-6 md:p-8 text-white shadow-card">
          <div className="floating-orb floating-orb-lg bg-teal-400/10  -top-16 right-16" style={{ animationDelay: '0s' }} />
          <div className="floating-orb floating-orb-md bg-blue-400/8  -bottom-10 left-8"  style={{ animationDelay: '2.5s' }} />

          <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
            <button
              onClick={() => navigate('/incidents')}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white font-semibold mb-4 transition-colors uppercase tracking-widest"
            >
              <ChevronLeft size={14} /> Back to Reports
            </button>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-200 border border-white/10 mb-3">
              <ShieldCheck size={12} className="animate-pulse" /> Incident Reporting
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              Report an <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-200">Incident</span>
            </h1>
            <p className="mt-1.5 text-sm text-white/65 leading-relaxed">
              Fill in the details below to submit a safety report. Step {step} of {STEPS.length}.
            </p>
          </div>
        </header>

        {/* ── Progress Stepper ── */}
        <div className="report-step-card !p-5">
          <div className="flex items-center">
            {STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              const done   = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      done   ? 'step-node-done text-white'
                      : active ? 'step-node-active text-white'
                      : 'step-node-inactive'
                    }`}>
                      {done ? <CheckCircle2 size={17} /> : <StepIcon size={16} />}
                    </div>
                    <p className={`text-[10px] mt-1.5 font-bold whitespace-nowrap uppercase tracking-wide ${
                      active ? 'text-rose-600' : done ? 'text-emerald-600' : 'text-slate-400'
                    }`}>{s.label}</p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 mb-5 rounded-full transition-all ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step progress bar */}
          <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Global API error */}
        {errors._global && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-5 py-3.5 text-sm flex items-center gap-2 font-medium">
            <Info size={15} /> {errors._global}
          </div>
        )}

        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <div className="report-step-card space-y-5 animate-fade-in-up" style={{ opacity: 0 }}>
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-sm font-extrabold shadow-lg shadow-rose-200">1</div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={14} className="text-rose-500" /> Basic Information
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Tell us what happened at a high level.</p>
              </div>
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
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all ${
                  errors.title ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:border-rose-400 focus:bg-white'
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
                      className={`type-card ${selected ? 'type-card-selected' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: opt.iconBg }}>
                        <TypeIcon size={20} style={{ color: opt.iconClr }} />
                      </div>
                      <p className="text-sm font-bold text-ink-900">{opt.label}</p>
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
                {FIELD_OPTS.severity.map((opt) => {
                  const selected = form.severity === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('severity', opt.value)}
                      className={`sev-btn ${selected ? opt.selCls : 'text-slate-500'}`}
                    >
                      <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${opt.dot}`} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <FieldError msg={errors.severity} />
            </div>
          </div>
        )}

        {/* ── Step 2: Location & Date ── */}
        {step === 2 && (
          <div className="report-step-card space-y-5 animate-fade-in-up" style={{ opacity: 0 }}>
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-sm font-extrabold shadow-lg shadow-rose-200">2</div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <MapPin size={14} className="text-rose-500" /> Location & Date
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Where and when did this occur?</p>
              </div>
            </div>

            <div>
              <Label required>Incident Location</Label>
              <p className="text-xs text-slate-500 mb-3">Search, click the map, or use your current location to pin the incident site.</p>
              <MapPicker
                value={{ address: form.address, latitude: form.latitude, longitude: form.longitude }}
                onChange={handleLocationChange}
                error={errors.address}
              />
              <FieldError msg={errors.address} />
            </div>

            <div>
              <Label required>Date of Occurrence</Label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400" />
                <input
                  type="date"
                  value={form.dateOccurred}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set('dateOccurred', e.target.value)}
                  onBlur={() => handleBlur('dateOccurred')}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all ${
                    errors.dateOccurred ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:border-rose-400 focus:bg-white'
                  }`}
                />
              </div>
              <FieldError msg={errors.dateOccurred} />
            </div>
          </div>
        )}

        {/* ── Step 3: Description ── */}
        {step === 3 && (
          <div className="report-step-card space-y-5 animate-fade-in-up" style={{ opacity: 0 }}>
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-sm font-extrabold shadow-lg shadow-rose-200">3</div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardList size={14} className="text-rose-500" /> Incident Description
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Provide as much detail as possible.</p>
              </div>
            </div>

            {/* Summary review */}
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Summary so far</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div><span className="font-semibold text-slate-500">Title</span><p className="text-ink-900 font-medium truncate">{form.title}</p></div>
                <div><span className="font-semibold text-slate-500">Type</span><p className="text-ink-900 font-medium capitalize">{form.type}</p></div>
                <div><span className="font-semibold text-slate-500">Severity</span><p className="text-ink-900 font-medium capitalize">{form.severity}</p></div>
                <div><span className="font-semibold text-slate-500">Date</span><p className="text-ink-900 font-medium">{form.dateOccurred}</p></div>
                {form.address && <div className="col-span-2"><span className="font-semibold text-slate-500">Location</span><p className="text-ink-900 font-medium truncate">{form.address}</p></div>}
              </div>
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
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all resize-none ${
                  errors.description ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:border-rose-400 focus:bg-white'
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

        {/* ── Navigation Buttons ── */}
        <div className="flex gap-3 pb-6">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step === 1 && (
            <button
              type="button"
              onClick={() => navigate('/incidents')}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white text-sm font-bold transition-all shadow-lg shadow-rose-200 hover:-translate-y-0.5"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-200 hover:-translate-y-0.5"
            >
              {submitting
                ? <><Loader2 size={16} className="animate-spin" />Submitting…</>
                : <><Zap size={16} />Submit Report</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
