import { Link, NavLink, useLocation } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const baseLinkClass =
  'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 hover:bg-brand-100/80';

export const Shell = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { pathname } = useLocation();

  const isHome      = pathname === '/';
  const isDashboard = pathname === '/dashboard';
  const isPortal    = !isHome && !isDashboard;   // all other pages get the frame

  return (
    <div className={`relative min-h-screen overflow-hidden ${
      isHome      ? 'bg-[#050a1a]'    :
      isPortal    ? 'portal-page-bg'  :
      /* dashboard */ ''
    }`}>

      {/* Ambient blob — portal pages only */}
      {isPortal && (
        <>
          <div className="portal-bg-blob portal-bg-blob-1" />
          <div className="portal-bg-blob portal-bg-blob-2" />
          <div className="portal-bg-blob portal-bg-blob-3" />
        </>
      )}

      {/* Light gradient halo — non-home pages (original Shell decoration) */}
      {!isHome && !isPortal && (
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-72 bg-gradient-to-r from-brand-500/30 to-brand-300/20 blur-3xl" />
      )}

      {/* ── Header ── */}
      <header className={`relative z-20 flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8 ${
        isHome ? 'bg-transparent border-b border-white/5' : 'mx-auto max-w-7xl py-5'
      }`}>
        <Link to="/" className="flex items-center gap-2">
          <span className="rounded-xl bg-brand-600 p-2 text-white shadow-glow">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className={`text-lg font-extrabold tracking-tight ${isHome ? 'text-white' : 'text-ink-900'}`}>SafeBuild</p>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isHome ? 'text-indigo-300' : 'text-brand-700'}`}>Training Portal</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className={`flex items-center gap-1 rounded-full px-2 py-2 shadow-card ${
          isHome
            ? 'bg-white/5 border border-white/10 backdrop-blur-md text-slate-200'
            : 'glass-panel text-ink-800'
        }`}>
          <NavLink to="/" className={baseLinkClass}>Home</NavLink>

          {!isAuthenticated && (
            <>
              <NavLink to="/register" className={baseLinkClass}>Employee Register</NavLink>
              <NavLink to="/login"    className={baseLinkClass}>Login Portal</NavLink>
            </>
          )}

          {isAuthenticated && user?.role === 'worker' && (
            <>
              <NavLink to="/dashboard"    className={baseLinkClass}>Dashboard</NavLink>
              <NavLink to="/certifications" className={baseLinkClass}>Certifications</NavLink>
              <NavLink to="/learning-hub" className={baseLinkClass}>Courses</NavLink>
            </>
          )}

          {isAuthenticated && user?.role !== 'worker' && (
            <NavLink to="/dashboard" className={baseLinkClass}>Dashboard</NavLink>
          )}

          {isAuthenticated && (user?.role === 'manager' || user?.role === 'officer') && (
            <NavLink to="/portal/compliance" className={baseLinkClass}>Compliance</NavLink>
          )}

          {isAuthenticated && user?.role === 'safety-compliance-manager' && (
            <NavLink to="/portal/compliance/actions" className={baseLinkClass}>My Queue</NavLink>
          )}

          {isAuthenticated && user?.role === 'trainer' && (
            <>
              <NavLink to="/course-manager" className={baseLinkClass}>Courses</NavLink>
              <NavLink to="/quiz-admin"     className={baseLinkClass}>Quiz Admin</NavLink>
            </>
          )}
        </nav>

        {/* User info */}
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
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className={
        isHome
          ? 'relative z-10 w-full'
          : 'relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8'
      }>
        {isPortal ? (
          <div className="portal-frame">
            {children}
          </div>
        ) : children}
      </main>
    </div>
  );
};