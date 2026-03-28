import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleUserRound, KeyRound, UserCog } from 'lucide-react';
import { FormInput } from '../components/FormInput';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const permanentAccounts = [
  {
    role: 'Manager',
    email: 'manager@safebuild.com',
    password: 'manager123'
  },
  {
    role: 'Safety Officer',
    email: 'officer@safebuild.com',
    password: 'officer123'
  },
  {
    role: 'Trainer',
    email: 'trainer@safebuild.com',
    password: 'trainer123'
  }
];

export const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const notice = location.state?.notice || '';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fillAccount = (email, password) => {
    setFormData({ email, password });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      const response = await api.login(formData);
      login(response.data);
      navigate('/portal');
    } catch (requestError) {
      setError(requestError.message || 'Login failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr,1.05fr]">
      <aside className="glass-panel rounded-3xl p-7 shadow-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800">
          <KeyRound size={14} /> Unified Access
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">One Login Portal for All Users</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-800">
          Use one secure portal for manager, safety officer, trainer, and worker accounts.
          New workers can be added through the employee registration page.
        </p>

        <div className="mt-7 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Permanent Accounts</p>
          {permanentAccounts.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => fillAccount(account.email, account.password)}
              className="flex w-full items-center justify-between rounded-xl border border-brand-100 bg-white/90 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50"
            >
              <div>
                <p className="text-sm font-bold text-ink-900">{account.role}</p>
                <p className="text-xs text-ink-700">{account.email}</p>
              </div>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">Use</span>
            </button>
          ))}
        </div>
      </aside>

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-7 shadow-card">
        <div className="mb-6 flex items-center gap-2">
          <span className="rounded-xl bg-brand-100 p-2 text-brand-700">
            <CircleUserRound size={18} />
          </span>
          <h2 className="text-xl font-bold text-ink-900">Sign In to SafeBuild</h2>
        </div>

        {notice && (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {notice}
          </p>
        )}

        <div className="space-y-4">
          <FormInput
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@safebuild.com"
            value={formData.email}
            onChange={handleChange}
          />
          <FormInput
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <UserCog size={16} />
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="mt-5 text-center text-sm text-ink-700">
          Need worker access?{' '}
          <Link to="/register" className="font-bold text-brand-700 hover:text-brand-900">
            Register employee account
          </Link>
        </p>
      </form>
    </section>
  );
};
