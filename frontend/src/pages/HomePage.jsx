import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookCheck,
  CircleUserRound,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  MapPin,
  Phone,
  Shield,
  Siren,
  UserPlus
} from 'lucide-react';

const quickActions = [
  { title: 'Courses', icon: <BookCheck size={16} /> },
  { title: 'Assessments', icon: <FileCheck2 size={16} /> },
  { title: 'Incidents', icon: <Siren size={16} /> },
  { title: 'Auditing', icon: <ClipboardList size={16} /> }
];

const heroImages = [
  {
    src: 'https://hubinternational.com/-/media/hub-international/Blog/Articles/Main-Images-A/2023/Main-Image-Workplace-Violence-in-Construction.jpg',
    alt: 'Construction team reviewing safety procedures'
  },
  {
    src: 'https://eversafe.edu.sg/wp-content/uploads/2020/08/construction-worker-wearing-safety-harness-belt-during-working-installing-concrete-roof-tile-top-new-roof_64073-449-1.jpg',
    alt: 'Safety officer checking site equipment'
  },
  {
    src: 'https://blog.ofbusiness.com/wp-content/uploads/2025/04/compressed_construction_safety_image.jpg',
    alt: 'Workers in protective gear at an industrial site'
  },
  {
    src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=80',
    alt: 'Engineer planning site safety workflow'
  }
];

const cards = [
  {
    title: 'Smart Course Tracking',
    text: 'Real-time progress insights, lesson completion data, and smooth continuation for workers.',
    icon: <BookCheck className="text-brand-700" size={22} />
  },
  {
    title: 'Compliance Visibility',
    text: 'Audit-ready records and training alignment for construction safety and operational control.',
    icon: <ClipboardCheck className="text-accent-500" size={22} />
  },
  {
    title: 'Secure Role Access',
    text: 'One login portal for all roles with backend authorization already integrated in your API.',
    icon: <Shield className="text-brand-700" size={22} />
  }
];

export const HomePage = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroImages.length);
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-10">
      <section className="glass-panel rounded-2xl border border-brand-100/70 p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-bark-700">Home Quick Access</p>
            <p className="mt-1 text-sm font-semibold text-ink-800">Use these shortcuts to jump into core modules</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-accent-300 bg-gradient-to-r from-accent-500 to-accent-400 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:from-accent-600 hover:to-accent-500"
              >
                {action.icon}
                {action.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-bark-300/50 bg-gradient-to-br from-bark-900 via-bark-800 to-brand-700 px-6 py-12 text-white shadow-glow sm:px-10">
        <div className="absolute inset-0 bg-hero-grid bg-grid opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-500/10 via-transparent to-accent-300/10" />
        <div className="absolute -right-6 -top-8 h-36 w-36 animate-drift rounded-full bg-brand-300/45 blur-2xl" />
        <div className="absolute right-32 top-20 h-16 w-16 rounded-full bg-accent-400/70 blur-xl" />
        <div className="absolute -bottom-8 left-10 h-28 w-28 animate-drift rounded-full bg-cyan-200/50 blur-2xl" />

        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr,1.05fr]">
          <div className="max-w-3xl space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em]">
              <CircleUserRound size={14} /> Unified Safety Learning Portal
            </p>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
              Build Safer Teams with One Modern Training Experience
            </h1>
            <p className="max-w-2xl text-sm text-blue-100 sm:text-base">
              SafeBuild centralizes learning, compliance, and employee onboarding in a clean, role-aware platform.
              Start with employee registration and a shared login portal, then scale to full training operations.
            </p>

            <div className="flex flex-wrap gap-3 pt-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-brand-700 transition hover:-translate-y-0.5"
              >
                <UserPlus size={16} /> Register Employee
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-accent-300/70 bg-accent-500/20 px-5 py-3 text-sm font-bold text-accent-50 transition hover:bg-accent-500/30"
              >
                Open Login Portal <ArrowRight size={16} />
              </Link>
            </div>

            
          </div>

          <div className="relative w-full justify-self-end overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 to-accent-300/10 p-3 lg:max-w-xl">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {heroImages.map((image) => (
                <div key={image.src} className="h-[230px] w-full flex-shrink-0 overflow-hidden rounded-xl sm:h-[300px]">
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bark-900/45 to-transparent" />

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {heroImages.map((image, index) => (
                <button
                  key={`${image.src}-dot`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    activeSlide === index ? 'w-7 bg-accent-300' : 'w-2.5 bg-white/60'
                  }`}
                  aria-label={`Show slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card, index) => (
          <article
            key={card.title}
            className="glass-panel rounded-2xl border border-brand-100/70 p-6 shadow-card animate-rise"
            style={{ animationDelay: `${index * 110}ms` }}
          >
            <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 p-2">{card.icon}</div>
            <h2 className="text-lg font-bold text-ink-900">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-800">{card.text}</p>
          </article>
        ))}
      </section>

      <footer className="overflow-hidden rounded-3xl border border-bark-300/45 bg-gradient-to-br from-bark-900 via-bark-800 to-brand-800 text-white shadow-glow">
        <div className="grid gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1.4fr,1fr,1fr]">
          <div>
            <h3 className="text-2xl font-extrabold">SafeBuild Platform</h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100">
              Built for real construction operations. Train teams faster, report incidents early, and maintain
              compliance with one connected digital safety workspace.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent-500/25 px-4 py-2 text-xs font-semibold text-accent-100 ring-1 ring-accent-300/40">
              Blue-first UI system with controlled orange action highlights
            </div>
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-200">Platform</p>
            <ul className="mt-4 space-y-3 text-sm text-blue-100">
              <li>Training Courses</li>
              <li>Assessments and Quizzes</li>
              <li>Incident Reporting</li>
              <li>Audit and Corrective Actions</li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-200">Contact</p>
            <ul className="mt-4 space-y-3 text-sm text-blue-100">
              <li className="flex items-center gap-2">
                <Phone size={15} className="text-accent-300" /> +94 11 245 8899
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={15} className="text-accent-300" /> Colombo, Sri Lanka
              </li>
              <li className="text-xs text-blue-200">support@safebuild.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15 px-6 py-4 text-xs text-blue-200 sm:px-8">
          © {new Date().getFullYear()} SafeBuild. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
