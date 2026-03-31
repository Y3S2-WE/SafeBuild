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
            <div className="ml-2 flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-semibold text-ink-900 leading-tight">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-brand-700 font-bold uppercase tracking-wider leading-tight">{user.role}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </nav>
      </header>


<main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};
