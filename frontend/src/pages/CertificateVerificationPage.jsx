import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  FileCheck,
  Fingerprint,
  Hash,
  Mail,
  QrCode,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  XCircle
} from 'lucide-react';
import { api } from '../services/api';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

export const CertificateVerificationPage = () => {
  const navigate = useNavigate();
  const { code: codeFromPath } = useParams();

  const initialCode = useMemo(() => (codeFromPath || '').toUpperCase(), [codeFromPath]);

  const [certificateCodeInput, setCertificateCodeInput] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(Boolean(initialCode));
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const fetchVerification = async (code) => {
    if (!code) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await api.verifyCertificateByCode(code);
      setResult(response.data || null);
    } catch (verifyError) {
      if (verifyError.message?.toLowerCase().includes('not found')) {
        setResult({
          isValid: false,
          certificate: null
        });
      } else {
        setError(verifyError.message || 'Failed to verify certificate');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchVerification(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const onSubmit = async (event) => {
    event.preventDefault();
    const normalized = certificateCodeInput.trim().toUpperCase();
    if (!normalized) {
      setError('Enter a certificate code to verify.');
      return;
    }
    navigate(`/certificate-verify/${normalized}`);
    await fetchVerification(normalized);
  };

  const verifiedCertificate = result?.certificate || null;
  const isValid = Boolean(result?.isValid);

  return (
    <section className="space-y-8">
      {/* ── Hero Section ── */}
      <header className="quiz-hero-bg rounded-3xl p-8 md:p-10 text-white shadow-card">
        <div className="floating-orb floating-orb-lg bg-cyan-400/20 -top-20 right-10" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-green-400/15 -bottom-16 left-8" style={{ animationDelay: '2s' }} />
        <div className="floating-orb floating-orb-sm bg-purple-300/15 top-1/3 right-1/4" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 border border-white/10">
            <Shield size={14} className="animate-pulse" /> Public Verification
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight">
            Certificate <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Verification</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/80 leading-relaxed">
            Scan a QR code or enter the certificate code to validate authenticity in real time.
          </p>
        </div>
      </header>

      {/* ── Search Form ── */}
      <article className="glass-card-premium rounded-3xl p-6 shadow-card animate-fade-in-up anim-delay-100" style={{ opacity: 0 }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="icon-container icon-container-brand">
            <Fingerprint size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Verify by Certificate Code</h2>
            <p className="text-xs text-ink-800 mt-0.5">Enter the unique code printed on the certificate.</p>
          </div>
        </div>

        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400">
              <Hash size={16} />
            </div>
            <input
              value={certificateCodeInput}
              onChange={(event) => setCertificateCodeInput(event.target.value.toUpperCase())}
              placeholder="CERT-XXXXXXXX"
              className="w-full rounded-xl border-2 border-brand-100 bg-white/90 pl-10 pr-4 py-3 text-sm font-semibold tracking-widest text-ink-900 outline-none ring-brand-300 focus:ring-2 focus:border-brand-300 transition-all font-mono placeholder:font-sans placeholder:tracking-normal placeholder:text-brand-300"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-premium btn-premium-brand text-sm disabled:opacity-60 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Search size={15} /> Verify Certificate
              </>
            )}
          </button>
        </form>
      </article>

      {/* ── Error State ── */}
      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 backdrop-blur-sm px-5 py-4 text-sm font-medium text-red-700 flex items-center gap-3 animate-fade-in-up shadow-sm">
          <div className="icon-container bg-red-100 text-red-600 !w-9 !h-9 !min-w-[36px]">
            <XCircle size={18} />
          </div>
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {!isLoading && result && (
        <article className="glass-card-premium rounded-3xl p-7 shadow-card animate-scale-in relative overflow-hidden">
          {isValid ? (
            <>
              {/* Success stripe */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />

              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-glow-emerald">
                  <BadgeCheck size={28} />
                </div>
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                    <ShieldCheck size={13} /> Certificate Valid
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-ink-900">Verified Certificate</h2>
                </div>
              </div>

              {/* Certificate Info Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: 'Certificate Code', value: verifiedCertificate?.certificateCode, icon: Hash, color: 'brand' },
                  { label: 'Holder', value: verifiedCertificate?.userName || '-', icon: User, color: 'purple' },
                  { label: 'Email', value: verifiedCertificate?.userEmail || '-', icon: Mail, color: 'amber' },
                  { label: 'Certification Quiz', value: verifiedCertificate?.quizTitle || '-', icon: Trophy, color: 'brand' },
                  { label: 'Marks', value: `${verifiedCertificate?.percentage ?? 0}%`, icon: Target, color: 'emerald' },
                  { label: 'Issued At', value: formatDate(verifiedCertificate?.issuedAt), icon: Calendar, color: 'purple' }
                ].map((item) => (
                  <div key={item.label} className="stat-card-glow group">
                    <div className="flex items-start gap-3">
                      <div className={`icon-container icon-container-${item.color} !w-10 !h-10 !min-w-[40px] group-hover:scale-110 transition-transform`}>
                        <item.icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">{item.label}</p>
                        <p className="mt-1 text-sm font-extrabold text-ink-900 break-all">{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Verification Footer */}
              <div className="mt-6 pt-5 border-t border-brand-100 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-xs text-ink-800">
                  <p className="font-bold text-emerald-700">Verified by SafeBuild Assessment & Certification System</p>
                  <p className="mt-0.5">This certificate has been validated and confirmed as authentic.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Invalid stripe */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-400 via-red-500 to-red-400" />

              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg">
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                    <XCircle size={13} /> Not Valid
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-ink-900">Certificate Not Found or Invalid</h2>
                </div>
              </div>

              <div className="rounded-2xl bg-red-50/80 border border-red-100 p-5">
                <p className="text-sm text-red-800 leading-relaxed">
                  Please check the certificate code and try again. If this code came from a QR image, ensure it was scanned fully.
                </p>
                <div className="mt-4 flex items-start gap-3 text-xs text-red-700">
                  <QrCode size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Tips for verification:</p>
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-red-600">
                      <li>Ensure the full certificate code is entered</li>
                      <li>Certificate codes are case-insensitive</li>
                      <li>Try scanning the QR code directly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </article>
      )}
    </section>
  );
};
