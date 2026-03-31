import { Link, NavLink } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const baseLinkClass =
  'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 hover:bg-brand-100/80';

export const Shell = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-72 bg-gradient-to-r from-brand-500/30 to-brand-300/20 blur-3xl" />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="rounded-xl bg-brand-600 p-2 text-white shadow-glow">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-ink-900">SafeBuild</p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Training Portal</p>
          </div>
        </Link>

        {/* Block 1 — Navigation links */}
        <nav className="glass-panel flex items-center gap-1 rounded-full px-2 py-2 text-ink-800 shadow-card">
          <NavLink to="/" className={baseLinkClass}>
            Home
          </NavLink>

          {!isAuthenticated && (
            <>
              <NavLink to="/register" className={baseLinkClass}>
                Employee Register
              </NavLink>
              <NavLink to="/login" className={baseLinkClass}>
                Login Portal
              </NavLink>
            </>
          )}

          {isAuthenticated && user?.role === 'worker' && (
            <>
              <NavLink to="/certifications" className={baseLinkClass}>
                Certifications
              </NavLink>
              <NavLink to="/learning-hub" className={baseLinkClass}>
                Courses
              </NavLink>
            </>
          )}

          {isAuthenticated && user?.role !== 'worker' && (
            <NavLink to="/portal" className={baseLinkClass}>
              Portal
            </NavLink>
          )}

          {isAuthenticated && user?.role !== 'worker' && (user.role === 'manager' || user.role === 'officer') && (
            <NavLink to="/portal/compliance" className={baseLinkClass}>
              Compliance
            </NavLink>
          )}

          {isAuthenticated && user?.role !== 'worker' && user.role === 'safety-compliance-manager' && (
            <NavLink to="/portal/compliance/actions" className={baseLinkClass}>
              Coordination Actions
            </NavLink>
          )}

          {isAuthenticated && user?.role === 'trainer' && (
            <NavLink to="/quiz-admin" className={baseLinkClass}>
              Quiz Admin
            </NavLink>
          )}
        </nav>

        {/* Block 2 — User info */}
        {isAuthenticated && (
          <div className="glass-panel flex items-center gap-4 rounded-full px-4 py-2 shadow-card">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user.firstName?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700">
              {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-full bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};