import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, QrCode, Search } from 'lucide-react';
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
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f1f43] via-[#173f80] to-[#2b6fd0] p-7 text-white shadow-card">
        <div className="pointer-events-none absolute -top-16 right-8 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-44 w-44 rounded-full bg-orange-300/20 blur-3xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
            <QrCode size={14} /> Public Verification
          </p>
          <h1 className="mt-4 text-3xl font-extrabold">Certificate Verification</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85">
            Scan a QR code or enter the certificate code to validate authenticity in real time.
          </p>
        </div>
      </header>

      <article className="glass-panel rounded-3xl p-5 shadow-card">
        <h2 className="text-lg font-bold text-ink-900">Verify by Certificate Code</h2>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
          <input
            value={certificateCodeInput}
            onChange={(event) => setCertificateCodeInput(event.target.value.toUpperCase())}
            placeholder="CERT-XXXXXXXX"
            className="w-full rounded-xl border border-brand-100 bg-white/90 px-3 py-2 text-sm font-semibold tracking-wide text-ink-900 outline-none ring-brand-300 focus:ring-2"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
          >
            <Search size={14} /> {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </article>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      )}

      {!isLoading && result && (
        <article className="rounded-3xl border border-brand-100 bg-white p-6 shadow-card">
          {isValid ? (
            <>
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                <BadgeCheck size={13} /> Certificate Valid
              </p>
              <h2 className="mt-4 text-2xl font-extrabold text-ink-900">Verified Certificate</h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-black/80 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Certificate Code</p>
                  <p className="mt-1 text-sm font-extrabold text-ink-900">{verifiedCertificate?.certificateCode}</p>
                </div>
                <div className="rounded-xl border border-black/80 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Holder</p>
                  <p className="mt-1 text-sm font-extrabold text-ink-900">{verifiedCertificate?.userName || '-'}</p>
                </div>
                <div className="rounded-xl border border-black/80 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Email</p>
                  <p className="mt-1 text-sm font-extrabold text-ink-900">{verifiedCertificate?.userEmail || '-'}</p>
                </div>
                <div className="rounded-xl border border-black/80 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Certification Quiz</p>
                  <p className="mt-1 text-sm font-extrabold text-ink-900">{verifiedCertificate?.quizTitle || '-'}</p>
                </div>
                <div className="rounded-xl border border-black/80 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Marks</p>
                  <p className="mt-1 text-sm font-extrabold text-ink-900">{verifiedCertificate?.percentage ?? 0}%</p>
                </div>
                <div className="rounded-xl border border-black/80 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Issued At</p>
                  <p className="mt-1 text-sm font-extrabold text-ink-900">{formatDate(verifiedCertificate?.issuedAt)}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                <AlertTriangle size={13} /> Not Valid
              </p>
              <h2 className="mt-4 text-2xl font-extrabold text-ink-900">Certificate Not Found or Invalid</h2>
              <p className="mt-2 text-sm text-ink-800">
                Please check the certificate code and try again. If this code came from a QR image, ensure it was scanned fully.
              </p>
            </>
          )}
        </article>
      )}
    </section>
  );
};
