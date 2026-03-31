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

        <nav className="glass-panel flex items-center gap-1 rounded-full px-2 py-2 text-ink-800 shadow-card">
          <NavLink to="/" className={baseLinkClass}>
            Home
          </NavLink>
          <NavLink to="/register" className={baseLinkClass}>
            Employee Register
          </NavLink>
          <NavLink to="/login" className={baseLinkClass}>
            Login Portal
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/portal" className={baseLinkClass}>
              Portal
            </NavLink>
          )}
          {isAuthenticated && (user.role === 'manager' || user.role === 'officer') && (
            <NavLink to="/portal/compliance" className={baseLinkClass}>
              Compliance
            </NavLink>
          )}
          {isAuthenticated && user.role === 'safety-compliance-manager' && (
            <NavLink to="/portal/compliance/actions" className={baseLinkClass}>
              Coordination Actions
            </NavLink>
          )}
          {isAuthenticated && (
            <button
              type="button"
              onClick={logout}
              className="ml-2 flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              <LogOut size={15} />
              Logout
            </button>
          )}
        </nav>
      </header>

      {isAuthenticated && (
        <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
          <div className="glass-panel flex flex-wrap items-center justify-between gap-2 rounded-2xl px-5 py-4 shadow-card">
            <p className="text-sm text-ink-800">
              Signed in as <span className="font-bold">{user.firstName} {user.lastName}</span>
            </p>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800">
              {user.role}
            </span>
          </div>
        </section>
      )}

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};