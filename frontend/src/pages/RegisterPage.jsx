import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, UserPlus } from 'lucide-react';
import { FormInput } from '../components/FormInput';
import { api } from '../services/api';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  employeeId: '',
  phone: '',
  department: ''
};

export const RegisterPage = () => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) nextErrors.email = 'Email is required';
    if (!formData.password || formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError('');

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await api.registerEmployee(formData);
      navigate('/login', {
        state: {
          notice: 'Employee account created successfully. Please login using your credentials.'
        }
      });
    } catch (error) {
      setApiError(error.message || 'Registration failed');
      if (Array.isArray(error.details)) {
        const detailErrors = error.details.reduce((acc, item) => {
          if (item.path && !acc[item.path]) {
            acc[item.path] = item.msg;
          }
          return acc;
        }, {});
        setErrors((prev) => ({ ...prev, ...detailErrors }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr,1.1fr]">
      <aside className="glass-panel rounded-3xl p-7 shadow-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800">
          <BriefcaseBusiness size={14} /> Employee Onboarding
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-ink-900">Register New Employee</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-800">
          This registration portal is for worker accounts. Permanent accounts for manager, safety officer,
          and trainer are already provisioned and should login directly.
        </p>
        <div className="mt-8 rounded-2xl bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-800">Already have an account?</p>
          <Link
            to="/login"
            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-700 transition hover:text-brand-900"
          >
            Go to Login Portal <ArrowRight size={15} />
          </Link>
        </div>
      </aside>

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-7 shadow-card">
        <div className="mb-6 flex items-center gap-2">
          <span className="rounded-xl bg-brand-100 p-2 text-brand-700">
            <UserPlus size={18} />
          </span>
          <h2 className="text-xl font-bold text-ink-900">Employee Registration Form</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            id="firstName"
            name="firstName"
            label="First Name"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
          />
          <FormInput
            id="lastName"
            name="lastName"
            label="Last Name"
            placeholder="Perera"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
          />
        </div>

        <div className="mt-4 space-y-4">
          <FormInput
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="worker@safebuild.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />
          <FormInput
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Minimum 6 characters"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormInput
            id="employeeId"
            name="employeeId"
            label="Employee ID"
            placeholder="EMP024"
            value={formData.employeeId}
            onChange={handleChange}
            error={errors.employeeId}
          />
          <FormInput
            id="department"
            name="department"
            label="Department"
            placeholder="Construction"
            value={formData.department}
            onChange={handleChange}
            error={errors.department}
          />
        </div>

        <div className="mt-4">
          <FormInput
            id="phone"
            name="phone"
            label="Phone"
            placeholder="+94 77 123 4567"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
          />
        </div>

        {apiError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {apiError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Creating account...' : 'Create Employee Account'}
        </button>
      </form>
    </section>
  );
};
