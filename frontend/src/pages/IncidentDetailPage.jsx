import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ChevronLeft, MapPin, User, Calendar,
  Clock, CheckCircle2, Loader2, XCircle, ShieldAlert,
  Flame, Activity, MessageSquare, Send, Pencil, Trash2,
  Save, X, Info, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StaticMap from '../components/StaticMap';

// ── Meta maps ────────────────────────────────────────────────────────────────

const SEVERITY_META = {
  low:    { label: 'Low',    bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  medium: { label: 'Medium', bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'  },
  high:   { label: 'High',   bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500'   },
};

const TYPE_META = {
  hazard:      { label: 'Hazard',    icon: ShieldAlert, bg: 'bg-orange-100', text: 'text-orange-700' },
  'near-miss': { label: 'Near Miss', icon: Flame,       bg: 'bg-yellow-100', text: 'text-yellow-700' },
  accident:    { label: 'Accident',  icon: Activity,    bg: 'bg-red-100',    text: 'text-red-700'    },
};

const TYPE_ACCENT = {
  hazard:      'bg-orange-400',
  'near-miss': 'bg-yellow-400',
  accident:    'bg-red-500',
};

const STATUS_META = {
  open:          { label: 'Open',          icon: Clock,        bg: 'bg-blue-100',   text: 'text-blue-700'   },
  investigating: { label: 'Investigating', icon: Loader2,      bg: 'bg-purple-100', text: 'text-purple-700' },
  resolved:      { label: 'Resolved',      icon: CheckCircle2, bg: 'bg-green-100',  text: 'text-green-700'  },
  closed:        { label: 'Closed',        icon: XCircle,      bg: 'bg-slate-100',  text: 'text-slate-600'  },
};

const STATUS_TRANSITIONS = {
  open:          ['investigating'],
  investigating: ['resolved'],
  resolved:      ['closed'],
  closed:        [],
};

// Contextual primary action per current status
const PRIMARY_ACTIONS = {
  open:          { label: 'Start Investigation', nextStatus: 'investigating', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  investigating: { label: 'Mark as Resolved',    nextStatus: 'resolved',      color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  resolved:      { label: 'Close Incident',       nextStatus: 'closed',        color: 'bg-slate-600 hover:bg-slate-700 text-white' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ meta }) {
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
      {Icon && <Icon size={11} />}
      {meta.label}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const m = SEVERITY_META[severity] ?? SEVERITY_META.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-ink-900 font-medium">{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, children, count }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1 h-4 rounded-full bg-brand-500" />
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
        {Icon && <Icon size={14} className="text-brand-500" />}
        {children}
      </h2>
      {count != null && count > 0 && (
        <span className="ml-auto w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">
          {count}
        </span>
      )}
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-rise pointer-events-none ${
      toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
    }`}>
      {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
      {toast.msg}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IncidentDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState(null);

  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);
  const [editErr, setEditErr]   = useState('');

  const [nextStatus, setNextStatus]           = useState('');
  const [statusNote, setStatusNote]           = useState('');
  const [updatingStatus, setUpdatingStatus]   = useState(false);
  const [statusErr, setStatusErr]             = useState('');

  const [commentText, setCommentText]         = useState('');
  const [addingComment, setAddingComment]     = useState(false);
  const [commentErr, setCommentErr]           = useState('');

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
    setLoading(true);
    setError('');
    try {
      const data = await api.getIncidentById(id);
      const inc  = data.incident ?? data.data ?? data;
      setIncident(inc);
      setEditForm({
        title:       inc.title,
        address:     inc.location?.address ?? '',
        description: inc.description,
        severity:    inc.severity,
      });
      const transitions = STATUS_TRANSITIONS[inc.status] ?? [];
      setNextStatus(transitions[0] ?? '');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleSaveEdit = async () => {
    setSaving(true);
    setEditErr('');
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

  // One-click primary action (advance to next logical status)
  const handlePrimaryAction = async (targetStatus) => {
    setUpdatingStatus(true);
    setStatusErr('');
    try {
      const data = await api.updateIncidentStatus(id, { status: targetStatus });
      const updated = data.incident ?? data.data ?? data;
      setIncident(updated);
      showToast(`Status updated to ${STATUS_META[targetStatus]?.label}`);
      const transitions = STATUS_TRANSITIONS[targetStatus] ?? [];
      setNextStatus(transitions[0] ?? '');
      setStatusNote('');
    } catch (e) {
      setStatusErr(e.message);
      showToast(e.message, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!nextStatus) return;
    handlePrimaryAction(nextStatus);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setAddingComment(true);
    setCommentErr('');
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

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center gap-3 text-slate-400">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm">Loading incident…</span>
      </div>
    );
  }

  if (error && !incident) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 max-w-md w-full text-center space-y-4">
          <AlertTriangle size={36} className="text-rose-400 mx-auto" />
          <p className="text-slate-600">{error}</p>
          <button onClick={() => navigate('/incidents')} className="text-brand-600 text-sm font-medium hover:underline">
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const typeMeta       = TYPE_META[incident.type]     ?? TYPE_META.hazard;
  const statusMeta     = STATUS_META[incident.status] ?? STATUS_META.open;
  const TypeIcon       = typeMeta.icon;
  const transitions    = STATUS_TRANSITIONS[incident.status] ?? [];
  const accentBar      = TYPE_ACCENT[incident.type] ?? 'bg-brand-400';
  const primaryAction  = isManager ? PRIMARY_ACTIONS[incident.status] : null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <Toast toast={toast} />
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate('/incidents')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 font-medium transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Reports
        </button>

        {/* Title card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className={`h-1.5 ${accentBar}`} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeMeta.bg}`}>
                  <TypeIcon size={22} className={typeMeta.text} />
                </div>
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <input
                      className="w-full text-xl font-bold text-ink-900 border-b-2 border-brand-400 bg-transparent focus:outline-none pb-1"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  ) : (
                    <h1 className="text-xl font-bold text-ink-900">{incident.title}</h1>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge meta={statusMeta} />
                    <Badge meta={typeMeta} />
                    <SeverityBadge severity={editing ? editForm.severity : incident.severity} />
                  </div>
                </div>
              </div>

              {/* Edit / Delete buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {canEdit && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-300 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                {editing && (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
                    >
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      Save
                    </button>
                    <button
                      onClick={() => { setEditing(false); setEditErr(''); }}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
                {canDelete && !editing && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-2 rounded-xl border border-rose-200 text-rose-400 hover:text-rose-600 hover:border-rose-400 transition-colors"
                    title="Delete"
                  >
                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                )}
              </div>
            </div>

            {editErr && (
              <p className="mt-3 text-xs text-rose-500 flex items-center gap-1"><Info size={11} />{editErr}</p>
            )}

            {/* Severity picker (edit mode) */}
            {editing && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Severity</p>
                <div className="flex gap-2">
                  {['low','medium','high'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, severity: s }))}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all capitalize ${
                        editForm.severity === s
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Contextual primary CTA (manager only, non-closed) ── */}
            {primaryAction && !editing && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Next action</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Advance to <span className="font-semibold text-slate-800">{STATUS_META[primaryAction.nextStatus]?.label}</span>
                  </p>
                </div>
                <button
                  onClick={() => handlePrimaryAction(primaryAction.nextStatus)}
                  disabled={updatingStatus}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-60 ${primaryAction.color}`}
                >
                  {updatingStatus
                    ? <Loader2 size={15} className="animate-spin" />
                    : <ArrowRight size={15} />}
                  {primaryAction.label}
                </button>
              </div>
            )}

            {incident.status === 'closed' && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle2 size={15} className="text-emerald-500" />
                This incident has been closed.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
              <SectionHeader>Details</SectionHeader>
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
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location</label>
                  <input
                    className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50 focus:bg-white transition-colors"
                    value={editForm.address}
                    onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
              )}

              {/* Static map showing incident location */}
              {!editing && incident.location?.latitude && incident.location?.longitude && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Location on Map</p>
                  <StaticMap
                    latitude={incident.location.latitude}
                    longitude={incident.location.longitude}
                    address={incident.location.address}
                    height={240}
                  />
                  <p className="text-xs text-slate-400 mt-1.5 font-mono">
                    {incident.location.latitude.toFixed(6)}, {incident.location.longitude.toFixed(6)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Description</p>
                {editing ? (
                  <textarea
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50 focus:bg-white transition-colors resize-none"
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{incident.description}</p>
                )}
              </div>
            </div>

            {/* Investigation notes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
              <SectionHeader icon={MessageSquare} count={incident.comments?.length}>
                Investigation Notes
              </SectionHeader>

              {incident.comments?.length > 0 ? (
                <div className="space-y-3">
                  {incident.comments.map((c, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-700">
                        {(c.addedByName ?? c.userName ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-semibold text-slate-700">{c.addedByName ?? c.userName ?? 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</p>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{c.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 gap-2 text-slate-400">
                  <MessageSquare size={24} strokeWidth={1.5} />
                  <p className="text-sm">No investigation notes yet.</p>
                </div>
              )}

              {isManager && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-700">
                      {user?.firstName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-2">
                      <textarea
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add an investigation note…"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50 focus:bg-white transition-colors resize-none"
                      />
                      {commentErr && <p className="text-xs text-rose-500">{commentErr}</p>}
                      <button
                        onClick={handleAddComment}
                        disabled={addingComment || !commentText.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
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

          {/* Right column */}
          <div className="space-y-6">

            {/* Status workflow */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4">
              <SectionHeader>Status</SectionHeader>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-3.5 top-5 bottom-5 w-px bg-slate-100" />
                {['open','investigating','resolved','closed'].map((s, idx, arr) => {
                  const m = STATUS_META[s];
                  const Icon = m.icon;
                  const currentIdx = arr.indexOf(incident.status);
                  const isActive = s === incident.status;
                  const isPast   = currentIdx > idx;
                  return (
                    <div key={s} className="relative flex items-center gap-3 py-2">
                      <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white ${
                        isActive ? `${m.bg} ${m.text}` : isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isPast ? <CheckCircle2 size={13} /> : <Icon size={13} />}
                      </div>
                      <span className={`text-sm ${isActive ? `font-semibold ${m.text}` : isPast ? 'text-slate-500' : 'text-slate-400'}`}>
                        {m.label}
                      </span>
                      {isActive && (
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Manual status override with note (manager) */}
              {isManager && transitions.length > 0 && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Optional note</p>
                  <textarea
                    rows={2}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Add a note for this transition…"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50 focus:bg-white transition-colors resize-none"
                  />
                  {statusErr && <p className="text-xs text-rose-500">{statusErr}</p>}
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    Advance Status
                  </button>
                </div>
              )}
            </div>

            {/* Report meta */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4">
              <SectionHeader>Report Info</SectionHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">ID</span>
                  <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {incident._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">Type</span>
                  <Badge meta={typeMeta} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">Severity</span>
                  <SeverityBadge severity={incident.severity} />
                </div>
                {incident.assignedToName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">Assigned To</span>
                    <span className="font-medium text-ink-900 text-xs">{incident.assignedToName}</span>
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
