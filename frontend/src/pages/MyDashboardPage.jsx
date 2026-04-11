import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight,
  Award, BookOpen, CheckCircle2, ChevronRight, Clock,
  FileText, GraduationCap, HardHat, Mail, MapPin, Phone,
  QrCode, RefreshCcw, Shield, ShieldCheck, Star, TrendingUp, User, XCircle,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const badge = (color, label) => (
  <span className={`wd-badge wd-badge-${color}`}>{label}</span>
);

const statusIncident = (s) => {
  const map = {
    open:        ['amber',   'Open'],
    investigating: ['blue',  'Investigating'],
    resolved:    ['emerald', 'Resolved'],
    closed:      ['gray',    'Closed'],
  };
  const [c, l] = map[s] || ['gray', s];
  return badge(c, l);
};

const statusCourse = (s) => {
  const map = {
    enrolled:   ['blue',    'Enrolled'],
    'in-progress': ['indigo', 'In Progress'],
    completed:  ['emerald', 'Completed'],
  };
  const [c, l] = map[s] || ['gray', s];
  return badge(c, l);
};

const scoreChip = (score) => {
  const pct = Math.round(score ?? 0);
  const color = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'red';
  return <span className={`wd-badge wd-badge-${color}`}>{pct}%</span>;
};

// ── Stat chip ──────────────────────────────────────────────────────────────────
function StatChip({ icon: Icon, label, value, color }) {
  return (
    <div className="wd-stat">
      <div className="wd-stat-icon" style={{ color }}>
        <Icon size={18} />
      </div>
      <div>
        <p className="wd-stat-value">{value ?? '—'}</p>
        <p className="wd-stat-label">{label}</p>
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, color, title, count }) {
  return (
    <div className="wd-section-header">
      <div className="wd-section-icon" style={{ background: color + '20', color }}>
        <Icon size={18} />
      </div>
      <div>
        <h2 className="wd-section-title">{title}</h2>
        {count !== undefined && (
          <p className="wd-section-count">{count} record{count !== 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyRow({ cols, message }) {
  return (
    <tr>
      <td colSpan={cols} className="wd-empty">
        <span className="wd-empty-text">{message}</span>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export const MyDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile,  setProfile]  = useState(null);
  const [courses,  setCourses]  = useState([]);
  const [certs,    setCerts]    = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [incidents,setIncidents]= useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [prof, enroll, certificates, quizAttempts, incList] = await Promise.all([
        api.getProfile(),
        api.getMyEnrollments().catch(() => ([])),
        api.getMyCertificates().catch(() => ([])),
        api.getMyAttempts().catch(() => ([])),
        api.getIncidents().catch(() => ([])),
      ]);

      // Safely extract array from deeply nested API response shapes
      const safeArr = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        
        const keys = ['data', 'certificates', 'items', 'enrollments', 'attempts', 'incidents'];
        
        // 1. Direct properties (e.g. v.data)
        for (const k of keys) {
          if (Array.isArray(v[k])) return v[k];
        }
        
        // 2. Axios wrapper level (v.data.*)
        if (v.data && typeof v.data === 'object') {
          for (const k of keys) {
            if (Array.isArray(v.data[k])) return v.data[k];
          }
          
          // 3. Backend data wrapper level (v.data.data.*)
          if (v.data.data && typeof v.data.data === 'object') {
            for (const k of keys) {
              if (Array.isArray(v.data.data[k])) return v.data.data[k];
            }
          }
        }
        
        return [];
      };

      const profileData = prof?.data ?? prof ?? {};
      setProfile(profileData);
      setCourses(safeArr(enroll));
      setCerts(safeArr(certificates));
      setAttempts(safeArr(quizAttempts));

      // Filter incidents to only those reported by this user
      const allInc = safeArr(incList);
      const uid = profileData?._id;
      setIncidents(uid ? allInc.filter(i =>
        i.reportedBy?._id === uid || i.reportedBy === uid
      ) : allInc);

    } catch (e) {
      setError(e.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);


  const completedCourses = courses.filter(e => e.status === 'completed').length;
  const passedAttempts   = attempts.filter(a => (a.score ?? 0) >= 50).length;

  // ── Loading ──
  if (loading) {
    return (
      <div className="wd-loading">
        <div className="wd-spinner" />
        <p className="wd-loading-text">Loading your dashboard…</p>
      </div>
    );
  }

  const p = profile || {};

  return (
    <section className="wd-root space-y-6">

      {/* ── Hero card ── */}
      <header className="wd-hero">
        <div className="floating-orb floating-orb-lg bg-teal-400/10 -top-20 right-8" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-blue-400/8 -bottom-14 left-8"  style={{ animationDelay: '3s' }} />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="animate-fade-in-up" style={{ opacity: 0 }}>
            <p className="wd-hero-badge">
              <User size={11} className="animate-pulse" /> Worker Dashboard
            </p>
            <h1 className="wd-hero-title">
              My Dashboard
            </h1>
            <p className="wd-hero-sub">
              Your personal overview — training progress, quiz scores, certifications, and reported incidents.
            </p>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-2 items-start animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
            <StatChip icon={BookOpen}     label="Courses"      value={courses.length}    color="#6ee7b7" />
            <StatChip icon={Award}        label="Certs"        value={certs.length}      color="#a5b4fc" />
            <StatChip icon={CheckCircle2} label="Passed"       value={passedAttempts}    color="#34d399" />
            <StatChip icon={AlertTriangle}label="Incidents"    value={incidents.length}  color="#fbbf24" />
            <button onClick={load} className="lms-stat-chip !px-3 !py-2 cursor-pointer hover:bg-white/20 transition-colors">
              <RefreshCcw size={13} className="text-cyan-300" />
              <p className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest mt-0.5">Refresh</p>
            </button>
          </div>
        </div>

        {/* Back to dashboard */}
        <div className="relative z-10 mt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white/80 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Dashboard
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          PROFILE CARD
      ══════════════════════════════════════════════ */}
      <div className="wd-card animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
        <SectionHeader icon={User} color="#818cf8" title="My Profile" />
        <div className="wd-profile-grid">
          <div className="wd-profile-avatar">
            <span>{p.firstName?.charAt(0)?.toUpperCase()}{p.lastName?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="wd-profile-details">
            <h3 className="wd-profile-name">{p.firstName} {p.lastName}</h3>
            <span className="wd-badge wd-badge-indigo capitalize">{p.role ?? 'Worker'}</span>
            <div className="wd-profile-meta">
              <p><Mail size={13}/> {p.email ?? '—'}</p>
              {p.phone      && <p><Phone size={13}/> {p.phone}</p>}
              {p.department && <p><HardHat size={13}/> {p.department}</p>}
              {p.employeeId && <p><ShieldCheck size={13}/> ID: {p.employeeId}</p>}
              {p.createdAt  && <p><Clock size={13}/> Joined {fmt(p.createdAt)}</p>}
            </div>
          </div>
          {/* Mini progress summary */}
          <div className="wd-profile-summary">
            {[
              { label: 'Enrolled Courses',   value: courses.length,     icon: BookOpen,     color: '#10b981' },
              { label: 'Completed Courses',  value: completedCourses,   icon: CheckCircle2, color: '#6366f1' },
              { label: 'Certifications',     value: certs.length,       icon: Award,        color: '#f59e0b' },
              { label: 'Quiz Attempts',      value: attempts.length,    icon: FileText,     color: '#38bdf8' },
              { label: 'Incidents Reported', value: incidents.length,   icon: AlertTriangle,color: '#f97316' },
            ].map(s => (
              <div key={s.label} className="wd-summary-row">
                <div className="wd-summary-icon" style={{ color: s.color }}><s.icon size={14}/></div>
                <span className="wd-summary-label">{s.label}</span>
                <span className="wd-summary-value">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ENROLLED COURSES
      ══════════════════════════════════════════════ */}
      <div className="wd-card animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.15s' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <SectionHeader icon={BookOpen} color="#10b981" title="Enrolled Courses" count={courses.length} />
          <Link to="/learning-hub" className="wd-btn-sm">
            Learning Hub <ArrowRight size={13} />
          </Link>
        </div>
        <div className="wd-table-wrap">
          <table className="wd-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Category</th>
                <th>Level</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0
                ? <EmptyRow cols={7} message="You have not enrolled in any courses yet." />
                : courses.map((e) => {
                  const courseData = e.courseId || e.course || {};
                  return (
                    <tr key={e._id}>
                      <td className="wd-td-main">
                        <span className="flex items-center gap-2">
                          <BookOpen size={14} className="text-emerald-400 shrink-0" />
                          {courseData.title ?? e.title ?? '—'}
                        </span>
                      </td>
                      <td><span className="wd-tag">{courseData.category ?? '—'}</span></td>
                      <td>{courseData.level ?? '—'}</td>
                      <td>{courseData.duration ? `${courseData.duration}h` : '—'}</td>
                      <td>{statusCourse(e.status)}</td>
                    <td>
                      <div className="wd-progress-wrap">
                        <div className="wd-progress-track">
                          <div className="wd-progress-fill" style={{ width: `${e.progressPercent ?? 0}%` }} />
                        </div>
                        <span className="wd-progress-pct">{e.progressPercent ?? 0}%</span>
                      </div>
                    </td>
                    <td className="wd-td-muted">{fmt(e.enrolledAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          QUIZ ATTEMPTS
      ══════════════════════════════════════════════ */}
      <div className="wd-card animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.2s' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <SectionHeader icon={GraduationCap} color="#818cf8" title="Quiz Attempts" count={attempts.length} />
          <Link to="/certifications" className="wd-btn-sm">
            Take a Quiz <ArrowRight size={13} />
          </Link>
        </div>
        <div className="wd-table-wrap">
          <table className="wd-table">
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Score</th>
                <th>Status</th>
                <th>Correct / Total</th>
                <th>Time Taken</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0
                ? <EmptyRow cols={6} message="No quiz attempts yet. Take a quiz to get started." />
                : attempts.map((a) => (
                  <tr key={a._id}>
                    <td className="wd-td-main">
                      <span className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-indigo-400 shrink-0" />
                        {a.quiz?.title ?? a.quizTitle ?? '—'}
                      </span>
                    </td>
                    <td>{scoreChip(a.score)}</td>
                    <td>
                      {a.passed
                        ? <span className="wd-badge wd-badge-emerald flex items-center gap-1 w-fit"><CheckCircle2 size={11}/>Passed</span>
                        : <span className="wd-badge wd-badge-red flex items-center gap-1 w-fit"><XCircle size={11}/>Failed</span>
                      }
                    </td>
                    <td>{a.correctAnswers ?? '—'} / {a.totalQuestions ?? '—'}</td>
                    <td className="wd-td-muted">{a.timeTaken ? `${a.timeTaken}s` : '—'}</td>
                    <td className="wd-td-muted">{fmt(a.submittedAt ?? a.createdAt)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          CERTIFICATIONS
      ══════════════════════════════════════════════ */}
      <div className="wd-card animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.25s' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <SectionHeader icon={Award} color="#f59e0b" title="My Certifications" count={certs.length} />
          <Link to="/certifications" className="wd-btn-sm">
            View All <ArrowRight size={13} />
          </Link>
        </div>
        {certs.length === 0 ? (
          <div className="wd-empty-card">
            <Award size={32} className="text-amber-400/50 mb-2" />
            <p className="text-sm font-semibold text-white/50">No certifications yet</p>
            <p className="text-xs text-white/30 mt-1">Complete a course and pass its quiz to earn your certificate.</p>
          </div>
        ) : (
          <div className="wd-cert-grid">
            {certs.map((cert) => (
              <div key={cert._id} className="wd-cert-card">
                <div className="wd-cert-seal">
                  <Award size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="wd-cert-title">{cert.quiz?.title ?? cert.quizTitle ?? 'Certificate'}</p>
                  <p className="wd-cert-meta">Code: <span className="font-mono text-amber-300">{cert.certificateCode ?? '—'}</span></p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="wd-cert-meta m-0">Issued: {fmt(cert.issuedAt ?? cert.createdAt)}</p>
                    {cert.grade && <p className="wd-cert-meta m-0">&bull; Grade: <span className="text-white/80">{cert.grade}</span></p>}
                  </div>
                  {cert.qrCodeUrl && (
                    <div className="mt-3">
                      <a 
                        href={cert.qrCodeUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <QrCode size={12} /> View QR Card
                      </a>
                    </div>
                  )}
                </div>
                <span className="wd-badge wd-badge-amber self-start mt-1">Certified</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          REPORTED INCIDENTS
      ══════════════════════════════════════════════ */}
      <div className="wd-card animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <SectionHeader icon={AlertTriangle} color="#f97316" title="My Reported Incidents" count={incidents.length} />
          <Link to="/incidents/report" className="wd-btn-sm wd-btn-orange">
            Report Incident <ArrowRight size={13} />
          </Link>
        </div>
        <div className="wd-table-wrap">
          <table className="wd-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Location</th>
                <th>Status</th>
                <th>Reported</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0
                ? <EmptyRow cols={7} message="No incidents reported by you yet." />
                : incidents.map((inc) => (
                  <tr key={inc._id}>
                    <td className="wd-td-main">
                      <span className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-orange-400 shrink-0" />
                        {inc.title ?? '—'}
                      </span>
                    </td>
                    <td><span className="wd-tag">{inc.type ?? '—'}</span></td>
                    <td>
                      {badge(
                        inc.severity === 'critical' ? 'red' :
                        inc.severity === 'high'     ? 'orange' :
                        inc.severity === 'medium'   ? 'amber' : 'gray',
                        inc.severity ?? '—'
                      )}
                    </td>
                    <td className="wd-td-muted">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {inc.location?.address
                          ? inc.location.address.length > 28
                            ? inc.location.address.slice(0, 28) + '…'
                            : inc.location.address
                          : '—'}
                      </span>
                    </td>
                    <td>{statusIncident(inc.status)}</td>
                    <td className="wd-td-muted">{fmt(inc.reportedAt ?? inc.createdAt)}</td>
                    <td>
                      <Link to={`/incidents/${inc._id}`} className="wd-view-btn">
                        View <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

    </section>
  );
};
