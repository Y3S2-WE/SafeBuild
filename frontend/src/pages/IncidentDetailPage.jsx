import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ChevronLeft, MapPin, User, Calendar,
  Clock, CheckCircle2, Loader2, XCircle, ShieldAlert,
  Flame, Activity, MessageSquare, Send, Pencil, Trash2,
  Save, X, Info, ArrowRight, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StaticMap from '../components/StaticMap';

// ── Meta maps ─────────────────────────────────────────────────────────────────

const SEVERITY_META = {
  low:    { label: 'Low',    cls: 'sev-badge-low',    dot: 'bg-emerald-500' },
  medium: { label: 'Medium', cls: 'sev-badge-medium', dot: 'bg-amber-500'   },
  high:   { label: 'High',   cls: 'sev-badge-high',   dot: 'bg-rose-500'    },
};

const TYPE_META = {
  hazard:      { label: 'Hazard',    icon: ShieldAlert, cls: 'inc-type-hazard',    iconBg: 'rgba(249,115,22,0.1)',  iconClr: '#c2410c', heroBar: 'from-orange-500 to-amber-400'   },
  'near-miss': { label: 'Near Miss', icon: Flame,       cls: 'inc-type-near-miss', iconBg: 'rgba(234,179,8,0.1)',   iconClr: '#854d0e', heroBar: 'from-yellow-500 to-amber-400'   },
  accident:    { label: 'Accident',  icon: Activity,    cls: 'inc-type-accident',  iconBg: 'rgba(239,68,68,0.1)',   iconClr: '#991b1b', heroBar: 'from-rose-600   to-red-500'      },
};

const STATUS_META = {
  open:          { label: 'Open',          icon: Clock,        cls: 'inc-status-open'          },
  investigating: { label: 'Investigating', icon: Loader2,      cls: 'inc-status-investigating' },
  resolved:      { label: 'Resolved',      icon: CheckCircle2, cls: 'inc-status-resolved'      },
  closed:        { label: 'Closed',        icon: XCircle,      cls: 'inc-status-closed'        },
};

const STATUS_TRANSITIONS = {
  open:          ['investigating'],
  investigating: ['resolved'],
  resolved:      ['closed'],
  closed:        [],
};

const PRIMARY_ACTIONS = {
  open:          { label: 'Start Investigation', nextStatus: 'investigating', grad: 'from-purple-600 to-violet-600 shadow-purple-200' },
  investigating: { label: 'Mark as Resolved',    nextStatus: 'resolved',      grad: 'from-emerald-600 to-teal-600 shadow-emerald-200' },
  resolved:      { label: 'Close Incident',      nextStatus: 'closed',        grad: 'from-slate-500 to-slate-600 shadow-slate-200'    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const m = SEVERITY_META[severity] ?? SEVERITY_META.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} /> {m.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.open;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}>
      <Icon size={10} /> {m.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const m = TYPE_META[type] ?? TYPE_META.hazard;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}>
      <Icon size={10} /> {m.label}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-rose-400" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-sm text-ink-900 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-none ${
      toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
    }`}>
      {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
      {toast.msg}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IncidentDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState(null);

  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);
  const [editErr, setEditErr]   = useState('');

  const [nextStatus, setNextStatus]         = useState('');
  const [statusNote, setStatusNote]         = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusErr, setStatusErr]           = useState('');

  const [commentText, setCommentText]     = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [commentErr, setCommentErr]       = useState('');

  const [deleting, setDeleting] = useState(false);

  const isManager = user?.role === 'manager' || user?.role === 'officer';
  const isOwner   = user?._id === incident?.reportedBy || user?.id === incident?.reportedBy;
  const canEdit   = (isOwner && incident?.status === 'open') || isManager;
  const canDelete = (isOwner && incident?.status === 'open') || user?.role === 'manager';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await api.getIncidentById(id);
      const inc  = data.incident ?? data.data ?? data;
      setIncident(inc);
      setEditForm({ title: inc.title, address: inc.location?.address ?? '', description: inc.description, severity: inc.severity });
      setNextStatus((STATUS_TRANSITIONS[inc.status] ?? [])[0] ?? '');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveEdit = async () => {
    setSaving(true); setEditErr('');
    try {
      const data = await api.updateIncident(id, editForm);
      setIncident(data.incident ?? data.data ?? data);
      setEditing(false);
      showToast('Incident updated');
    } catch (e) {
      setEditErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrimaryAction = async (targetStatus) => {
    setUpdatingStatus(true); setStatusErr('');
    try {
      const data = await api.updateIncidentStatus(id, { status: targetStatus });
      const updated = data.incident ?? data.data ?? data;
      setIncident(updated);
      showToast(`Status updated to ${STATUS_META[targetStatus]?.label}`);
      setNextStatus((STATUS_TRANSITIONS[targetStatus] ?? [])[0] ?? '');
      setStatusNote('');
    } catch (e) {
      setStatusErr(e.message);
      showToast(e.message, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusUpdate = async () => { if (nextStatus) handlePrimaryAction(nextStatus); };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setAddingComment(true); setCommentErr('');
    try {
      const data = await api.addIncidentComment(id, { comment: commentText.trim() });
      setIncident(data.incident ?? data.data ?? data);
      setCommentText('');
      showToast('Note added');
    } catch (e) {
      setCommentErr(e.message);
    } finally {
      setAddingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this incident report?')) return;
    setDeleting(true);
    try {
      await api.deleteIncident(id);
      navigate('/incidents');
    } catch (e) {
      setError(e.message);
      showToast(e.message, 'error');
      setDeleting(false);
    }
  };

  // ── Loading / Error States ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center gap-3 text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-rose-400" />
        </div>
        <span className="text-sm font-medium">Loading incident…</span>
      </div>
    );
  }

  if (error && !incident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center px-4">
        <div className="report-step-card max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-rose-400" />
          </div>
          <p className="text-slate-600 font-medium">{error}</p>
          <button onClick={() => navigate('/incidents')} className="text-rose-600 text-sm font-semibold hover:underline">
            ← Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const typeMeta      = TYPE_META[incident.type]     ?? TYPE_META.hazard;
  const statusMeta    = STATUS_META[incident.status] ?? STATUS_META.open;
  const TypeIcon      = typeMeta.icon;
  const StatusIcon    = statusMeta.icon;
  const transitions   = STATUS_TRANSITIONS[incident.status] ?? [];
  const primaryAction = isManager ? PRIMARY_ACTIONS[incident.status] : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast toast={toast} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── Hero Card ── */}
        <header className="incident-hero-bg rounded-3xl p-6 md:p-8 text-white shadow-card">
          <div className="floating-orb floating-orb-lg bg-teal-400/10  -top-16 right-16" style={{ animationDelay: '0s' }} />
          <div className="floating-orb floating-orb-md bg-blue-400/8  -bottom-10 left-8"  style={{ animationDelay: '2.5s' }} />

          <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
            <button
              onClick={() => navigate('/incidents')}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white font-semibold mb-4 transition-colors uppercase tracking-widest"
            >
              <ChevronLeft size={14} /> All Reports
            </button>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-200 border border-white/10 mb-3">
              <ShieldCheck size={12} className="animate-pulse" /> Incident Detail
            </p>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: typeMeta.iconBg }}>
                  <TypeIcon size={24} style={{ color: typeMeta.iconClr }} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight truncate">
                    {incident.title}
                  </h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <StatusBadge status={incident.status} />
                    <TypeBadge   type={incident.type} />
                    <SeverityBadge severity={incident.severity} />
                  </div>
                </div>
              </div>
              {/* Edit / Delete buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
              {canEdit && !editing && (
                <button onClick={() => setEditing(true)} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors border border-white/15" title="Edit">
                  <Pencil size={15} />
                </button>
              )}
              {editing && (
                <>
                  <button onClick={handleSaveEdit} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold disabled:opacity-60 transition-colors shadow-lg">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
                  </button>
                  <button onClick={() => { setEditing(false); setEditErr(''); }} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors border border-white/15">
                    <X size={15} />
                  </button>
                </>
              )}
              {canDelete && !editing && (
                <button onClick={handleDelete} disabled={deleting} className="p-2.5 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 hover:text-white transition-colors border border-rose-400/30" title="Delete">
                  {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              )}
              </div>
            </div>
          </div>
        </header>

        {editErr && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600 flex items-center gap-2">
            <Info size={13} /> {editErr}
          </div>
        )}

        {/* ── Primary Action CTA ── */}
        {primaryAction && !editing && (
          <div className="report-step-card !py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center border border-rose-100">
                <StatusIcon size={18} className="text-rose-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Next Action</p>
                <p className="text-sm font-semibold text-ink-900">
                  Advance to <span className="font-bold">{STATUS_META[primaryAction.nextStatus]?.label}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => handlePrimaryAction(primaryAction.nextStatus)}
              disabled={updatingStatus}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r ${primaryAction.grad} text-white text-sm font-bold transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-60`}
            >
              {updatingStatus ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {primaryAction.label}
            </button>
          </div>
        )}

        {incident.status === 'closed' && (
          <div className="report-step-card !py-3.5 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">This incident has been closed.</p>
          </div>
        )}

        {/* Severity picker (edit mode) */}
        {editing && (
          <div className="report-step-card">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Edit Severity</p>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEditForm((f) => ({ ...f, severity: s }))}
                  className={`sev-btn ${editForm.severity === s ? (s === 'low' ? 'sev-btn-low-sel' : s === 'medium' ? 'sev-btn-medium-sel' : 'sev-btn-high-sel') : 'text-slate-500'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Details */}
            <div className="report-step-card space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-rose-500 to-orange-400" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Details</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={MapPin}      label="Location"    value={editing ? null : incident.location?.address} />
                <InfoRow icon={User}        label="Reported By" value={incident.reportedByName} />
                <InfoRow icon={Calendar}    label="Occurred"    value={incident.dateOccurred   ? new Date(incident.dateOccurred).toLocaleDateString()  : null} />
                <InfoRow icon={Clock}       label="Reported"    value={incident.dateReported   ? new Date(incident.dateReported).toLocaleString()      : null} />
                {incident.dateResolved && (
                  <InfoRow icon={CheckCircle2} label="Resolved" value={new Date(incident.dateResolved).toLocaleDateString()} />
                )}
              </div>

              {editing && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Location</label>
                  <input
                    className="mt-2 w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium focus:outline-none focus:border-rose-400 bg-slate-50 focus:bg-white transition-colors"
                    value={editForm.address}
                    onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
              )}

              {!editing && incident.location?.latitude && incident.location?.longitude && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Location on Map</p>
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <StaticMap
                      latitude={incident.location.latitude}
                      longitude={incident.location.longitude}
                      address={incident.location.address}
                      height={240}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 font-mono">
                    {incident.location.latitude.toFixed(6)}, {incident.location.longitude.toFixed(6)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Description</p>
                {editing ? (
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-rose-400 bg-slate-50 focus:bg-white transition-colors resize-none font-medium"
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    {incident.description}
                  </p>
                )}
              </div>
            </div>

            {/* Investigation Notes */}
            <div className="report-step-card space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-indigo-400" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={13} className="text-blue-500" /> Investigation Notes
                </h2>
                {incident.comments?.length > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                    {incident.comments.length}
                  </span>
                )}
              </div>

              {incident.comments?.length > 0 ? (
                <div className="space-y-3">
                  {incident.comments.map((c, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-blue-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm">
                        {(c.addedByName ?? c.userName ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 comment-bubble">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-bold text-slate-700">{c.addedByName ?? c.userName ?? 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</p>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{c.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 gap-2 text-slate-300">
                  <MessageSquare size={28} strokeWidth={1.5} />
                  <p className="text-sm font-medium text-slate-400">No investigation notes yet.</p>
                </div>
              )}

              {isManager && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-blue-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm">
                      {user?.firstName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-2">
                      <textarea
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add an investigation note…"
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-400 bg-slate-50 focus:bg-white transition-colors resize-none"
                      />
                      {commentErr && <p className="text-xs text-rose-500">{commentErr}</p>}
                      <button
                        onClick={handleAddComment}
                        disabled={addingComment || !commentText.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-md"
                      >
                        {addingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5">

            {/* Status workflow */}
            <div className="report-step-card space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-rose-500 to-orange-400" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Status Timeline</h2>
              </div>

              <div className="relative">
                <div className="absolute left-3.5 top-4 bottom-4 w-px bg-slate-100" />
                {['open', 'investigating', 'resolved', 'closed'].map((s, idx, arr) => {
                  const m       = STATUS_META[s];
                  const Icon    = m.icon;
                  const currIdx = arr.indexOf(incident.status);
                  const isActive = s === incident.status;
                  const isPast   = currIdx > idx;
                  return (
                    <div key={s} className="relative flex items-center gap-3 py-2">
                      <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white ${
                        isActive ? `${m.cls} timeline-node-active` : isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isPast ? <CheckCircle2 size={13} /> : <Icon size={13} />}
                      </div>
                      <span className={`text-sm ${isActive ? `font-bold ${m.cls.split(' ')[1] ?? 'text-slate-700'}` : isPast ? 'text-slate-500' : 'text-slate-400'}`}>
                        {m.label}
                      </span>
                      {isActive && (
                        <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {isManager && transitions.length > 0 && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add a note for this transition</p>
                  <textarea
                    rows={2}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Optional transition note…"
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-400 bg-slate-50 focus:bg-white transition-colors resize-none"
                  />
                  {statusErr && <p className="text-xs text-rose-500">{statusErr}</p>}
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-200"
                  >
                    {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    Advance Status
                  </button>
                </div>
              )}
            </div>

            {/* Report info */}
            <div className="report-step-card space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-slate-400 to-slate-500" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Report Info</h2>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-semibold">ID</span>
                  <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    #{incident._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-semibold">Type</span>
                  <TypeBadge type={incident.type} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-semibold">Severity</span>
                  <SeverityBadge severity={incident.severity} />
                </div>
                {incident.assignedToName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Assigned To</span>
                    <span className="font-semibold text-ink-900 text-xs">{incident.assignedToName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
