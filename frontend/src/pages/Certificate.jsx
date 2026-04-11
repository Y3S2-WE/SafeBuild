import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  Calendar,
  CheckCircle2,
  Download,
  FileCheck,
  Fingerprint,
  Hash,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy
} from 'lucide-react';
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
    <section className="space-y-8">
      {/* ── Hero Section ── */}
      <header className="cert-hero-bg rounded-3xl p-8 md:p-10 text-white shadow-card">
        <div className="floating-orb floating-orb-lg bg-yellow-400/15 -top-20 right-10" style={{ animationDelay: '0s' }} />
        <div className="floating-orb floating-orb-md bg-cyan-400/15 -bottom-16 left-8" style={{ animationDelay: '2s' }} />
        <div className="floating-orb floating-orb-sm bg-amber-300/20 top-1/3 right-1/4" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 animate-fade-in-up" style={{ opacity: 0 }}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-yellow-100 border border-white/10">
            <Sparkles size={14} className="animate-pulse" /> Certification Center
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight">
            Certificate <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">Preview</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/80 leading-relaxed">
            Preview your certificate and download it as a PDF after a successful quiz result.
          </p>
        </div>
      </header>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 backdrop-blur-sm px-5 py-4 text-sm font-medium text-red-700 flex items-center gap-3 animate-fade-in-up shadow-sm">
          <div className="icon-container bg-red-100 text-red-600 !w-9 !h-9 !min-w-[36px]">
            <ShieldCheck size={18} />
          </div>
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading ? (
        <div className="glass-card-premium rounded-3xl p-12 text-center shadow-card">
          <div className="inline-flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-brand-800">Loading certificate...</p>
          </div>
        </div>
      ) : !activeCertificate ? (
        <div className="glass-card-premium rounded-3xl p-12 shadow-card text-center animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 mb-4">
            <FileCheck size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-ink-900">No certificate available</h2>
          <p className="mt-2 text-sm text-ink-800 max-w-md mx-auto">Complete a certification quiz and pass it to generate your certificate.</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          {/* ── Sidebar: Certificate List ── */}
          <aside className="glass-card-premium rounded-3xl p-5 shadow-card animate-fade-in-up" style={{ opacity: 0 }}>
            <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2 mb-5">
              <Award size={18} className="text-brand-600" /> My Certificates
            </h2>
            <div className="space-y-2">
              {myCertificates.length === 0 && <p className="text-sm text-ink-800">No certificates found.</p>}
              {myCertificates.map((certificate) => {
                const isActive = selectedCode === certificate.certificateCode;
                return (
                  <button
                    key={certificate._id}
                    type="button"
                    onClick={() => {
                      setVerifiedCertificate(null);
                      setSelectedCode(certificate.certificateCode);
                    }}
                    className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 ${
                      isActive
                        ? 'border-brand-400 bg-gradient-to-r from-brand-50 to-brand-100/50 shadow-md shadow-brand-100/50'
                        : 'border-white/60 bg-white/70 hover:border-brand-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${isActive ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white' : 'bg-brand-50 text-brand-600'}`}>
                        <Trophy size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink-900 truncate">{certificate.quizTitle}</p>
                        <p className="mt-0.5 text-[10px] text-ink-800 font-mono tracking-wider">{certificate.certificateCode}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Certificate Preview ── */}
          <article className="glass-card-premium rounded-3xl p-6 shadow-card animate-fade-in-up anim-delay-100" style={{ opacity: 0 }}>
            <div className="certificate-frame p-7 relative overflow-hidden">
              {/* Decorative Corners */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-brand-400/40 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-brand-400/40 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-brand-400/40 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-brand-400/40 rounded-br-lg" />

              {/* Certificate Badge */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow-brand">
                  <ShieldCheck size={24} />
                </div>
                <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                  <Star size={12} className="text-brand-500" /> Official Certificate
                </p>
              </div>

              {/* Certificate Content */}
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-800 to-brand-600">
                SafeBuild Certification
              </h2>

              <p className="mt-4 text-sm text-ink-800 font-medium">This certifies that</p>
              <p className="mt-2 text-4xl font-black text-ink-900 leading-tight">
                {activeCertificate.userName || `${user.firstName} ${user.lastName}`}
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-brand-400 to-brand-200 rounded-full mt-3" />

              <p className="mt-4 text-sm text-ink-800 font-medium">has successfully completed</p>
              <p className="mt-2 text-2xl font-extrabold text-brand-800">{activeCertificate.quizTitle}</p>

              {/* Stats Cards */}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Marks', value: `${activeCertificate.percentage}%`, icon: Star, color: 'brand' },
                  { label: 'Issued', value: certificateDate(activeCertificate.issuedAt), icon: Calendar, color: 'emerald' },
                  { label: 'Code', value: activeCertificate.certificateCode, icon: Hash, color: 'purple' }
                ].map((stat) => (
                  <div key={stat.label} className="stat-card-glow text-center">
                    <div className={`icon-container icon-container-${stat.color} mx-auto mb-2 !w-9 !h-9 !min-w-[36px]`}>
                      <stat.icon size={16} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">{stat.label}</p>
                    <p className={`mt-1 font-extrabold text-ink-900 ${stat.label === 'Code' ? 'text-xs font-mono tracking-wider' : 'text-lg'}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-5 border-t border-brand-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="icon-container icon-container-brand !w-9 !h-9 !min-w-[36px]">
                    <Fingerprint size={16} />
                  </div>
                  <div className="text-xs text-ink-800">
                    <p className="font-bold">Certificate Verification</p>
                    <p className="font-mono tracking-wider text-brand-700">{activeCertificate.certificateCode}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {activeCertificate.qrCodeUrl && (
                    <a
                      href={activeCertificate.qrCodeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-premium btn-premium-outline text-sm"
                    >
                      <QrCode size={14} /> QR Code
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="btn-premium btn-premium-brand text-sm"
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
