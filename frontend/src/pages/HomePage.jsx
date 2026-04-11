import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Award, BookOpen, ChevronLeft, ChevronRight,
  ClipboardCheck, GraduationCap, HardHat, Mail, MapPin,
  Phone, Shield, ShieldCheck, Siren, Star, Users, Zap
} from 'lucide-react';

// ── Slider data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    src: '/images/slide-1.png',
    alt: 'Construction safety training session',
    label: 'Safety Training',
    caption: 'Structured classroom-based and digital safety training for every worker on-site.'
  },
  {
    src: '/images/slide-2.png',
    alt: 'Site inspection at golden hour',
    label: 'Site Inspections',
    caption: 'Real-time safety audit workflows and incident documentation straight from the field.'
  },
  {
    src: '/images/slide-3.png',
    alt: 'Compliance certification handover',
    label: 'Certifications',
    caption: 'Digital certificates issued automatically on course and quiz completion.'
  },
  {
    src: '/images/slide-4.png',
    alt: 'Safety manager using digital platform on-site',
    label: 'Digital Platform',
    caption: 'One connected workspace for safety data, compliance dashboards, and reporting.'
  }
];

// ── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: BookOpen,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    title: 'Smart Course Tracking',
    text: 'Role-based training modules with real-time progress tracking and lesson completion analytics.'
  },
  {
    icon: Award,
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.1)',
    title: 'Auto Certification',
    text: 'Digital certificates issued on quiz success with unique verification codes and QR support.'
  },
  {
    icon: Siren,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    title: 'Incident Reporting',
    text: 'Real-time hazard and incident reporting with geo-tagging, severity classification, and resolution tracking.'
  },
  {
    icon: ClipboardCheck,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    title: 'Compliance Audits',
    text: 'Schedule and conduct audits, generate checklists, and track corrective actions to closure.'
  },
  {
    icon: Users,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    title: 'Role-Based Access',
    text: 'Tailored dashboards for Managers, Officers, Trainers, Workers, and Compliance Coordinators.'
  },
  {
    icon: Shield,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
    title: 'Enterprise Security',
    text: 'JWT-secured authentication with full role-guard middleware and session management.'
  }
];

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '5+', label: 'User Roles', icon: Users },
  { value: '100%', label: 'Digital Compliance', icon: ClipboardCheck },
  { value: 'Real-time', label: 'Incident Tracking', icon: Siren },
  { value: 'ISO-ready', label: 'Audit Framework', icon: ShieldCheck }
];

// ── Footer Links ──────────────────────────────────────────────────────────────
const FOOTER_LINKS = {
  'Platform': [
    { label: 'Learning Hub', href: '/learning-hub' },
    { label: 'Quiz & Assessments', href: '/certifications' },
    { label: 'Incident Reporting', href: '/incidents' },
    { label: 'Report an Incident', href: '/incidents/report' },
    { label: 'Compliance Workspace', href: '/portal/compliance' },
    { label: 'Certificate Verify', href: '/certificate-verify' }
  ],
  'Access': [
    { label: 'Login Portal', href: '/login' },
    { label: 'Register Employee', href: '/register' },
    { label: 'My Dashboard', href: '/dashboard' }
  ]
};

// ── Hero Slider ───────────────────────────────────────────────────────────────
function HeroSlider() {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(null);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    if (animating || idx === active) return;
    setPrev(active);
    setActive(idx);
    setAnimating(true);
    setTimeout(() => { setPrev(null); setAnimating(false); }, 600);
  };

  const next = () => goTo((active + 1) % SLIDES.length);
  const back = () => goTo((active - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [active]);

  return (
    <div className="home-slider">
      {/* Images */}
      {SLIDES.map((s, i) => (
        <div
          key={s.src}
          className={`home-slide ${i === active ? 'home-slide-active' : i === prev ? 'home-slide-prev' : 'home-slide-hidden'}`}
        >
          <img src={s.src} alt={s.alt} className="home-slide-img" />
          <div className="home-slide-overlay" />
        </div>
      ))}

      {/* Glass caption */}
      <div className="home-slide-caption">
        <span className="home-slide-tag">
          <HardHat size={11} /> {SLIDES[active].label}
        </span>
        <p className="home-slide-text">{SLIDES[active].caption}</p>
      </div>

      {/* Navigation arrows */}
      <button onClick={back} className="home-slider-arrow home-slider-arrow-l" aria-label="prev">
        <ChevronLeft size={18} />
      </button>
      <button onClick={next} className="home-slider-arrow home-slider-arrow-r" aria-label="next">
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="home-slider-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`home-slider-dot ${i === active ? 'home-slider-dot-active' : ''}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export const HomePage = () => (
  <div className="home-root">

    {/* ── Background ambient ── */}
    <div className="home-bg-blob home-bg-blob-1" />
    <div className="home-bg-blob home-bg-blob-2" />
    <div className="home-bg-grid" />

    {/* ── Centred content ── */}
    <div className="home-content">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="home-hero">
        {/* Left */}
        <div className="home-hero-left">
          <div className="home-hero-tag">
            <ShieldCheck size={13} className="animate-pulse" />
            UNIFIED SAFETY PLATFORM
          </div>

          <h1 className="home-hero-title">
            Build Safer Teams with One{' '}
            <span className="home-gradient-text">Modern Training</span>{' '}
            Experience
          </h1>

          <p className="home-hero-sub">
            SafeBuild centralises safety training, incident reporting, compliance auditing,
            and real-time certifications in a single role-aware digital workspace — built
            for modern construction operations.
          </p>

          {/* Quick trust signals */}
          <div className="home-trust-row">
            {['ISO-Ready Audits', 'Auto Certifications', 'Real-time Incidents'].map((t) => (
              <span key={t} className="home-trust-chip">
                <Star size={10} className="text-indigo-300" /> {t}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="home-cta-row">
            <Link to="/register" className="home-btn-primary">
              <Zap size={16} />
              Get Started
            </Link>
            <Link to="/login" className="home-btn-secondary">
              View Dashboard <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Right — Slider */}
        <div className="home-hero-right">
          <HeroSlider />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════ */}
      <section className="home-stats-bar">
        {STATS.map(({ value, label, icon: Icon }) => (
          <div key={label} className="home-stat">
            <div className="home-stat-icon"><Icon size={18} /></div>
            <p className="home-stat-value">{value}</p>
            <p className="home-stat-label">{label}</p>
          </div>
        ))}
      </section>

      {/* ══════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════ */}
      <section className="home-section">
        <div className="home-section-header">
          <div className="home-hero-tag" style={{ margin: '0 auto 1rem' }}>
            <GraduationCap size={13} /> PLATFORM FEATURES
          </div>
          <h2 className="home-section-title">
            Everything you need to run{' '}
            <span className="home-gradient-text">safe construction sites</span>
          </h2>
          <p className="home-section-sub">
            A single connected platform across training, compliance, auditing, and incident management.
          </p>
        </div>

        <div className="home-features-grid">
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className="home-feature-card animate-fade-in-up"
              style={{ opacity: 0, animationDelay: `${i * 0.07}s` }}
            >
              <div className="home-feature-icon" style={{ background: f.bg }}>
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <h3 className="home-feature-title">{f.title}</h3>
              <p className="home-feature-text">{f.text}</p>
              <div className="home-feature-glow" style={{ background: f.bg }} />
            </article>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════ */}
      <section className="home-cta-banner">
        <div className="home-bg-blob" style={{ top: '-60px', right: '5%', width: '280px', height: '280px', background: 'rgba(99,102,241,0.12)', filter: 'blur(60px)' }} />
        <div className="home-cta-banner-inner">
          <div>
            <h2 className="home-cta-banner-title">Ready to modernise your safety programme?</h2>
            <p className="home-cta-banner-sub">Join construction teams already using SafeBuild to reduce incidents and improve compliance.</p>
          </div>
          <div className="home-cta-row">
            <Link to="/register" className="home-btn-primary">
              <Zap size={15} /> Register Now
            </Link>
            <Link to="/login" className="home-btn-secondary">
              Login Portal <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

    </div>{/* end .home-content */}

    {/* ══════════════════════════════════════════════
        FOOTER — full width
    ══════════════════════════════════════════════ */}
    <footer className="home-footer">
      <div className="home-footer-grid">

        {/* Brand */}
        <div className="home-footer-brand">
          <div className="home-footer-logo">
            <ShieldCheck size={20} />
          </div>
          <h3 className="home-footer-brand-name">SafeBuild</h3>
          <p className="home-footer-brand-sub">
            The unified construction safety platform — training, audits, incidents, and certifications
            in one connected digital workspace.
          </p>
          <div className="home-footer-contact">
            <p><Phone size={13} className="text-indigo-400" /> +94 11 245 8899</p>
            <p><MapPin size={13} className="text-indigo-400" /> Colombo, Sri Lanka</p>
            <p><Mail size={13} className="text-indigo-400" /> support@safebuild.com</p>
          </div>
        </div>

        {/* Links */}
        {Object.entries(FOOTER_LINKS).map(([col, links]) => (
          <div key={col} className="home-footer-col">
            <p className="home-footer-col-heading">{col}</p>
            <ul className="home-footer-links">
              {links.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="home-footer-link">
                    <ArrowRight size={11} /> {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Modules quick-access */}
        <div className="home-footer-col">
          <p className="home-footer-col-heading">Quick Access</p>
          <div className="home-footer-module-chips">
            {[
              { label: 'Learning Hub', href: '/learning-hub', color: '#10b981' },
              { label: 'Quiz Admin', href: '/quiz-admin', color: '#6366f1' },
              { label: 'Incidents', href: '/incidents', color: '#f59e0b' },
              { label: 'Compliance', href: '/portal/compliance', color: '#0ea5e9' },
              { label: 'Certifications', href: '/certifications', color: '#8b5cf6' },
              { label: 'Dashboard', href: '/dashboard', color: '#06b6d4' }
            ].map((m) => (
              <Link key={m.href} to={m.href} className="home-footer-chip" style={{ borderColor: m.color + '40', color: m.color }}>
                {m.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="home-footer-bottom">
        <p>© {new Date().getFullYear()} SafeBuild Platform. All rights reserved.</p>
        <p className="home-footer-bottom-right">Built for modern construction safety operations.</p>
      </div>
    </footer>

  </div>
);
