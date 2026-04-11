import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff,
  KeyRound, Lock, Mail, ShieldCheck, Sparkles, Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: ShieldCheck, text: 'Role-based secure access control' },
  { icon: Zap,         text: 'Instant dashboard after login'    },
  { icon: Sparkles,    text: 'Unified portal for all roles'     },
];

export const LoginPage = () => {
  const [formData, setFormData]       = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login }    = useAuth();
  const location     = useLocation();
  const navigate     = useNavigate();
  const notice       = location.state?.notice || '';

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setIsSubmitting(true);
      const response = await api.login(formData);
      login(response.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left panel — branding ── */}
      <div className="auth-brand-panel">
        {/* Logo */}
        <div className="auth-logo">
          <ShieldCheck size={22} />
        </div>
        <h1 className="auth-brand-title">
          Welcome back to<br />
          <span className="auth-brand-gradient">SafeBuild</span>
        </h1>
        <p className="auth-brand-sub">
          The unified safety training, compliance, and incident
          management platform for modern construction teams.
        </p>

        {/* Feature list */}
        <ul className="auth-feature-list">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="auth-feature-item">
              <div className="auth-feature-icon"><Icon size={15} /></div>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {/* Bottom accent */}
        <div className="auth-brand-footer">
          <div className="auth-brand-blob auth-brand-blob-1" />
          <div className="auth-brand-blob auth-brand-blob-2" />
          <p className="auth-brand-tagline">
            Trusted by construction safety teams
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          {/* Header */}
          <div className="auth-form-header">
            <div className="auth-form-icon-wrap">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="auth-form-title">Sign in</h2>
              <p className="auth-form-subtitle">Enter your credentials to access your workspace</p>
            </div>
          </div>

          {/* Success notice */}
          {notice && (
            <div className="auth-notice auth-notice-success">
              <CheckCircle2 size={15} />
              {notice}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="auth-notice auth-notice-error">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@safebuild.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="auth-input auth-input-icon-l"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="auth-input auth-input-icon-l auth-input-icon-r"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="auth-eye-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="auth-spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="auth-footer-text">
            Need a worker account?{' '}
            <Link to="/register" className="auth-footer-link">
              Register here <ArrowRight size={12} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
