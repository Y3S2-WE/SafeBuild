import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, Award, Briefcase, CheckCircle2,
  Eye, EyeOff, HardHat, Lock, Mail, Phone, ShieldCheck,
  User, UserPlus
} from 'lucide-react';
import { api } from '../services/api';

const initialState = {
  firstName: '', lastName: '', email: '', password: '',
  employeeId: '', phone: '', department: ''
};

const PERKS = [
  { icon: ShieldCheck, label: 'Instant Access',    text: 'Access safety modules right after registration'    },
  { icon: Award,       label: 'Auto Certification', text: 'Complete courses and earn verifiable certificates'  },
  { icon: HardHat,     label: 'Site Ready',         text: 'Report incidents and hazards from any device'      },
];

export const RegisterPage = () => {
  const [formData, setFormData]       = useState(initialState);
  const [errors, setErrors]           = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError]       = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!formData.firstName.trim()) e.firstName = 'Required';
    if (!formData.lastName.trim())  e.lastName  = 'Required';
    if (!formData.email.trim())     e.email     = 'Required';
    if (formData.password.length < 6) e.password = 'Min. 6 characters';
    return e;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError('');
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      await api.registerEmployee(formData);
      navigate('/login', {
        state: { notice: 'Account created successfully. Please sign in to continue.' }
      });
    } catch (error) {
      setApiError(error.message || 'Registration failed. Please try again.');
      if (Array.isArray(error.details)) {
        const detailErrors = error.details.reduce((acc, item) => {
          if (item.path && !acc[item.path]) acc[item.path] = item.msg;
          return acc;
        }, {});
        setErrors((prev) => ({ ...prev, ...detailErrors }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (id, label, icon, placeholder, opts = {}) => (
    <div className={`auth-field ${opts.error ? 'auth-field-error' : ''}`}>
      <label htmlFor={id} className="auth-label">{label}</label>
      <div className="auth-input-wrap">
        {icon && <span className="auth-input-icon">{icon}</span>}
        <input
          id={id}
          name={id}
          type={opts.type ?? 'text'}
          autoComplete={opts.autoComplete}
          placeholder={placeholder}
          value={formData[id]}
          onChange={handleChange}
          className={`auth-input ${icon ? 'auth-input-icon-l' : ''} ${opts.extra ?? ''}`}
        />
        {opts.toggle}
      </div>
      {opts.error && <p className="auth-field-msg">{opts.error}</p>}
    </div>
  );

  return (
    <div className="auth-page">
      {/* ── Left — brand panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-logo">
          <ShieldCheck size={22} />
        </div>
        <h1 className="auth-brand-title">
          Join the SafeBuild<br />
          <span className="auth-brand-gradient">Safety Network</span>
        </h1>
        <p className="auth-brand-sub">
          Create your worker account to access training courses, earn safety
          certifications, and contribute to a safer construction environment.
        </p>

        <div className="auth-perks">
          {PERKS.map(({ icon: Icon, label, text }) => (
            <div key={label} className="auth-perk-card">
              <div className="auth-perk-icon"><Icon size={16} /></div>
              <div>
                <p className="auth-perk-label">{label}</p>
                <p className="auth-perk-text">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="auth-brand-footer">
          <div className="auth-brand-blob auth-brand-blob-1" />
          <div className="auth-brand-blob auth-brand-blob-2" />
          <p className="auth-brand-tagline">Worker registration portal</p>
        </div>
      </div>

      {/* ── Right — form ── */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          {/* Header */}
          <div className="auth-form-header">
            <div className="auth-form-icon-wrap">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="auth-form-title">Create account</h2>
              <p className="auth-form-subtitle">Fill in your details to get started</p>
            </div>
          </div>

          {apiError && (
            <div className="auth-notice auth-notice-error">
              <AlertCircle size={15} /> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Name row */}
            <div className="auth-row-2">
              {field('firstName', 'First Name', <User size={16} />, 'John',  { error: errors.firstName })}
              {field('lastName',  'Last Name',  <User size={16} />, 'Perera', { error: errors.lastName  })}
            </div>

            {/* Email */}
            {field('email', 'Email Address', <Mail size={16} />, 'you@safebuild.com', {
              type: 'email', autoComplete: 'email', error: errors.email
            })}

            {/* Password */}
            <div className={`auth-field ${errors.password ? 'auth-field-error' : ''}`}>
              <label htmlFor="password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="auth-input auth-input-icon-l auth-input-icon-r"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="auth-eye-btn"
                  aria-label={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="auth-field-msg">{errors.password}</p>}
            </div>

            {/* Employee ID + Department */}
            <div className="auth-row-2">
              {field('employeeId', 'Employee ID', <Briefcase size={16} />, 'EMP024')}
              {field('department', 'Department', <HardHat size={16} />, 'Construction')}
            </div>

            {/* Phone */}
            {field('phone', 'Phone Number', <Phone size={16} />, '+94 77 123 4567', {
              type: 'tel', autoComplete: 'tel'
            })}

            {/* Submit */}
            <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
              {isSubmitting ? (
                <><span className="auth-spinner" /> Creating account…</>
              ) : (
                <><CheckCircle2 size={16} /> Create Account</>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-footer-link">
              Sign in <ArrowRight size={12} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
