import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const certificateDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString();
};

export const Certificate = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifiedCertificate, setVerifiedCertificate] = useState(null);
  const [myCertificates, setMyCertificates] = useState([]);
  const [selectedCode, setSelectedCode] = useState(searchParams.get('code') || '');

  const activeCertificate = useMemo(() => {
    if (verifiedCertificate) return verifiedCertificate;
    const local = myCertificates.find((item) => item.certificateCode === selectedCode);
    return local || myCertificates[0] || null;
  }, [verifiedCertificate, myCertificates, selectedCode]);

  useEffect(() => {
    const loadCertificates = async () => {
      setIsLoading(true);
      setError('');

      try {
        const mine = await api.getMyCertificates();
        const certList = Array.isArray(mine?.data?.certificates) ? mine.data.certificates : [];
        setMyCertificates(certList);

        const code = searchParams.get('code');
        if (code) {
          setSelectedCode(code);
          const verify = await api.verifyCertificateByCode(code);
          if (verify?.data?.isValid && verify?.data?.certificate) {
            setVerifiedCertificate(verify.data.certificate);
          }
        }
      } catch (loadError) {
        setError(loadError.message || 'Failed to load certificate data');
      } finally {
        setIsLoading(false);
      }
    };

    loadCertificates();
  }, [searchParams]);

  const handleDownloadPdf = () => {
    if (!activeCertificate) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFillColor(10, 35, 77);
    doc.rect(0, 0, 297, 210, 'F');

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 12, 273, 186, 4, 4, 'F');

    doc.setDrawColor(18, 84, 170);
    doc.setLineWidth(0.8);
    doc.roundedRect(17, 17, 263, 176, 3, 3, 'S');

    doc.setTextColor(19, 55, 115);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('SAFEBUILD CERTIFICATE', 148.5, 40, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45, 45, 45);
    doc.text('This certifies that', 148.5, 58, { align: 'center' });

    doc.setFontSize(26);
    doc.setFont('times', 'bold');
    doc.setTextColor(7, 20, 45);
    doc.text(activeCertificate.userName || `${user.firstName} ${user.lastName}`, 148.5, 74, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45, 45, 45);
    doc.text('has successfully completed', 148.5, 88, { align: 'center' });

    doc.setFontSize(19);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(19, 55, 115);
    doc.text(activeCertificate.quizTitle || 'Certification Quiz', 148.5, 102, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45, 45, 45);
    doc.text(`Marks: ${activeCertificate.percentage}%`, 70, 132);
    doc.text(`Issued Date: ${certificateDate(activeCertificate.issuedAt)}`, 70, 142);
    doc.text(`Certificate Code: ${activeCertificate.certificateCode}`, 70, 152);

    doc.text('Verified by SafeBuild Assessment & Certification System', 148.5, 176, { align: 'center' });

    doc.setTextColor(19, 55, 115);
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Signature', 222, 152, { align: 'center' });

    const fileCode = (activeCertificate.certificateCode || 'certificate').replace(/[^A-Za-z0-9-]/g, '_');
    doc.save(`SafeBuild-${fileCode}.pdf`);
  };

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111f40] via-[#17457f] to-[#2281d9] p-7 text-white shadow-card">
        <div className="pointer-events-none absolute -top-16 right-8 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-yellow-300/15 blur-3xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
            <Sparkles size={14} /> Certification Center
          </p>
          <h1 className="mt-4 text-3xl font-extrabold">Certificate Preview</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85">Preview your certificate and download it as a PDF after a successful quiz result.</p>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      {isLoading ? (
        <div className="glass-panel rounded-3xl p-8 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-800">Loading certificate...</p>
        </div>
      ) : !activeCertificate ? (
        <div className="glass-panel rounded-3xl p-8 shadow-card">
          <h2 className="text-xl font-extrabold text-ink-900">No certificate available</h2>
          <p className="mt-2 text-sm text-ink-800">Complete a certification quiz and pass it to generate your certificate.</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <aside className="glass-panel rounded-3xl p-5 shadow-card">
            <h2 className="text-lg font-bold text-ink-900">My Certificates</h2>
            <div className="mt-4 space-y-2">
              {myCertificates.length === 0 && <p className="text-sm text-ink-800">No certificates found.</p>}
              {myCertificates.map((certificate) => (
                <button
                  key={certificate._id}
                  type="button"
                  onClick={() => {
                    setVerifiedCertificate(null);
                    setSelectedCode(certificate.certificateCode);
                  }}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    selectedCode === certificate.certificateCode
                      ? 'border-brand-500 bg-brand-50 shadow'
                      : 'border-white/70 bg-white/80 hover:border-brand-300'
                  }`}
                >
                  <p className="text-sm font-bold text-ink-900">{certificate.quizTitle}</p>
                  <p className="mt-1 text-xs text-ink-800">{certificate.certificateCode}</p>
                </button>
              ))}
            </div>
          </aside>

          <article className="rounded-3xl border border-brand-200 bg-white p-6 shadow-card">
            <div className="rounded-3xl border-2 border-brand-300 bg-gradient-to-br from-[#f6fbff] to-[#eef6ff] p-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                <ShieldCheck size={13} /> Official Certificate
              </p>

              <h2 className="mt-4 text-3xl font-extrabold text-brand-900">SafeBuild Certification</h2>
              <p className="mt-2 text-sm text-ink-800">This certifies that</p>
              <p className="mt-2 text-4xl font-black text-ink-900">{activeCertificate.userName || `${user.firstName} ${user.lastName}`}</p>
              <p className="mt-3 text-sm text-ink-800">has successfully completed</p>
              <p className="mt-2 text-2xl font-extrabold text-brand-800">{activeCertificate.quizTitle}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Marks</p>
                  <p className="text-lg font-extrabold text-ink-900">{activeCertificate.percentage}%</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Issued</p>
                  <p className="text-lg font-extrabold text-ink-900">{certificateDate(activeCertificate.issuedAt)}</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Code</p>
                  <p className="text-sm font-extrabold text-ink-900">{activeCertificate.certificateCode}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-ink-800">
                  <p className="font-bold">Certificate Verification</p>
                  <p>{activeCertificate.certificateCode}</p>
                </div>
                <div className="flex gap-2">
                  {activeCertificate.qrCodeUrl && (
                    <a
                      href={activeCertificate.qrCodeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-brand-300 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                    >
                      <QrCode size={14} /> QR
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
                  >
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
};
