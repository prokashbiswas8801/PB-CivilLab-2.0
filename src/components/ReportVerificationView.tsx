import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Printer,
  ExternalLink,
  ArrowLeft,
  FileText,
  Calendar,
  Building,
  MapPin,
  Award,
  Layers,
  Scale,
  Activity,
  QrCode,
  Share2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  PublicEngineeringReportRecord,
  encodeVerificationToken,
  buildPublicVerificationUrl,
} from '../utils/verificationEngine';
import { exportCertifiedEngineeringPdf } from '../utils/pdfExport';
import { CivilWorkspace, EngineeringModuleId } from '../types/civil';

interface ReportVerificationViewProps {
  record: PublicEngineeringReportRecord;
  onClose: () => void;
  onOpenWorkbench?: (record: PublicEngineeringReportRecord) => void;
  activeWorkspace?: CivilWorkspace;
  onDownloadPdf?: (record: PublicEngineeringReportRecord) => void;
}

export function ReportVerificationView({
  record,
  onClose,
  onOpenWorkbench,
  activeWorkspace,
  onDownloadPdf,
}: ReportVerificationViewProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedDocId, setCopiedDocId] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'inputs' | 'outputs' | 'equations'>('overview');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pbcivillab.app';
  const publicUrl = record.verificationUrl || buildPublicVerificationUrl(record, origin);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(publicUrl, {
      margin: 1,
      width: 200,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.warn('Failed to generate verification QR code:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [publicUrl]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyDocId = async () => {
    try {
      await navigator.clipboard.writeText(record.docId);
      setCopiedDocId(true);
      setTimeout(() => setCopiedDocId(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(record.verificationHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const dcr = record.summary.dcr;

  const formattedDate = new Date(record.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-8 py-3.5 bg-[var(--md-sys-color-surface)]/95 backdrop-blur-md border-b border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
            title="Return to PB CivilLab"
            aria-label="Back to Workbench"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)]">
                PB CivilLab Verification Registry
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                Digitally Certified Submittal
              </span>
            </div>
            <h1 className="text-sm md:text-base font-bold text-[var(--md-sys-color-on-surface)] truncate">
              {record.docId} · {record.project.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer btn-tactile"
            title="Copy Public Verification Link"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'URL Copied!' : 'Copy Share URL'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer btn-tactile"
            title="Print Official Submittal Sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {onOpenWorkbench && (
            <button
              type="button"
              onClick={() => onOpenWorkbench(record)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] text-xs font-semibold shadow-xs transition-opacity cursor-pointer btn-tactile"
              title="Open parameters in PB CivilLab Workbench"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Workbench</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Verification Certificate Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Verification Status Banner */}
        <div className="p-5 md:p-6 rounded-3xl bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-emerald-950 dark:text-emerald-100">
                  Engineering Submittal Verified &amp; Certified
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  ISO 9001 QA COMPLIANT
                </span>
              </div>
              <p className="text-xs md:text-sm text-emerald-800/80 dark:text-emerald-300/80 mt-1">
                This calculation submittal was authoritatively generated and validated by a licensed professional engineer using the PB CivilLab Analytical Engine under governing building standard <strong>{record.project.governingCode}</strong>.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-[var(--md-sys-color-surface)] border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer"
            >
              {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedUrl ? 'Copied Public Link!' : 'Copy Verification URL'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Submittal Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Document Control & Cryptographic QR Block (1 col) */}
          <div className="space-y-6">
            {/* Scannable Verification Card */}
            <div className="m3-card p-5 space-y-4 text-center">
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Dynamic Scannable Verification
              </div>
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`Verification QR Code for ${record.docId}`}
                      className="w-44 h-44 object-contain rounded"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded text-slate-400">
                      <QrCode className="w-12 h-12 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleCopyDocId}
                  className="font-mono font-bold text-base md:text-lg text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                  title="Click to copy Doc Reference ID"
                >
                  <span>{record.docId}</span>
                  {copiedDocId ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>
                <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  Public Document Control Reference
                </div>
              </div>

              {/* Cryptographic Verification Hash */}
              <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)] text-left">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Verification Hash
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="hover:text-[var(--md-sys-color-primary)] cursor-pointer"
                    title="Copy full cryptographic hash"
                  >
                    {copiedHash ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="mt-1 font-mono text-[11px] p-2 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] break-all border border-[var(--md-sys-color-outline-variant)]">
                  {record.verificationHash}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-left text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Issued: {formattedDate}</span>
              </div>
            </div>

            {/* Engineer of Record & Peer Reviewers */}
            <div className="m3-card p-5 space-y-3">
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Engineer of Record (EOR)</span>
              </div>
              <div>
                <div className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  {record.engineer.fullName}
                </div>
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  {record.engineer.designation} · {record.engineer.organization}
                </div>
                <div className="font-mono text-xs text-[var(--md-sys-color-primary)] mt-1">
                  License #{record.engineer.licenseNumber}
                </div>
              </div>
            </div>

            {/* Project Details Card */}
            <div className="m3-card p-5 space-y-3">
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Project Master Record</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Project Name: </span>
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{record.project.name}</span>
                </div>
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Project Code: </span>
                  <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">
                    {record.project.projectCode}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Site Location: </span>
                  <span className="text-[var(--md-sys-color-on-surface)]">{record.project.siteLocation}</span>
                </div>
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Governing Code: </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {record.project.governingCode}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Currency: </span>
                  <span className="font-mono font-bold">{record.project.currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Analytical Results, DCR Meter, QA Matrix & Data Tables (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Module Banner & Limit-State DCR Gauge */}
            <div className="m3-card p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)] pb-4">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--md-sys-color-primary)] font-bold">
                    Analytical Module
                  </div>
                  <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                    {record.module.name}
                  </h3>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono mt-0.5">
                    Standard: {record.module.codeStandard}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      record.summary.status === 'critical'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : record.summary.status === 'warning'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {record.summary.status === 'critical' ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{record.summary.status.toUpperCase()} STATUS</span>
                  </span>
                </div>
              </div>

              {/* Demand-Capacity Ratio (DCR) Capacity Utilization Gauge */}
              {dcr && (
                <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                        {dcr.metricLabel} (DCR)
                      </div>
                      <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                        Limit: {dcr.referenceLimit || 'DCR ≤ 1.00 (100%)'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                        {dcr.formattedValue}
                      </div>
                      <div
                        className={`text-xs font-bold uppercase font-mono ${
                          dcr.status === 'critical'
                            ? 'text-rose-500'
                            : dcr.status === 'warning'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}
                      >
                        {dcr.status === 'critical'
                          ? 'Capacity Exceeded'
                          : dcr.status === 'warning'
                          ? 'Near Capacity (Caution)'
                          : 'Code Compliant (Safe)'}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar Meter */}
                  <div className="relative w-full h-3 rounded-full bg-[var(--md-sys-color-surface-container-high)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dcr.status === 'critical'
                          ? 'bg-rose-500'
                          : dcr.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, dcr.percentage))}%` }}
                    />
                  </div>

                  {dcr.description && (
                    <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                      {dcr.description}
                    </div>
                  )}
                </div>
              )}

              {/* Executive Notes */}
              {record.summary.executiveNotes && (
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)]">Executive Notes: </span>
                  {record.summary.executiveNotes}
                </div>
              )}
            </div>

            {/* Navigation Tabs for Granular Results */}
            <div className="space-y-4">
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] max-w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  Key Outputs ({record.summary.keyOutputs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inputs')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'inputs'
                      ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  Design Inputs ({record.summary.keyInputs.length})
                </button>
                {record.summary.equations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('equations')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === 'equations'
                        ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    Governing Formulations ({record.summary.equations.length})
                  </button>
                )}
              </div>

              {/* Tab 1: Key Outputs */}
              {activeTab === 'overview' && (
                <div className="m3-card overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                      Analytical Output Parameters &amp; Structural Capacity
                    </h4>
                  </div>
                  <div className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                    {record.summary.keyOutputs.map((out, idx) => (
                      <div
                        key={idx}
                        className="px-5 py-3 flex items-center justify-between text-xs hover:bg-[var(--md-sys-color-surface-container-low)]/50 transition-colors"
                      >
                        <div className="font-medium text-[var(--md-sys-color-on-surface)]">
                          {out.label}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-[var(--md-sys-color-primary)]">
                            {out.value} {out.unit}
                          </span>
                          {out.status && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                                out.status === 'pass'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {out.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Key Inputs */}
              {activeTab === 'inputs' && (
                <div className="m3-card overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                      Design Input Parameters &amp; Site Boundary Conditions
                    </h4>
                  </div>
                  <div className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                    {record.summary.keyInputs.map((inp, idx) => (
                      <div
                        key={idx}
                        className="px-5 py-3 flex items-center justify-between text-xs hover:bg-[var(--md-sys-color-surface-container-low)]/50 transition-colors"
                      >
                        <div className="text-[var(--md-sys-color-on-surface)]">
                          {inp.label}
                        </div>
                        <div className="font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                          {inp.value} {inp.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Equations */}
              {activeTab === 'equations' && (
                <div className="m3-card divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {record.summary.equations.map((eq, idx) => (
                    <div key={idx} className="p-5 space-y-1.5">
                      <div className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">
                        {eq.name}
                      </div>
                      <div className="font-mono font-bold text-sm text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container)] px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                        {eq.formula}
                      </div>
                      <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        {eq.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Official 3-Signature QA Sign-Off Matrix */}
            <div className="m3-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                    Quality Assurance (QA/QC) 3-Tier Sign-Off Matrix
                  </h4>
                </div>
                <span className="text-[10px] font-mono opacity-70">
                  ISO 9001 Protocol
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--md-sys-color-outline-variant)] p-4 gap-4 md:gap-0">
                {/* Column 1: Prepared By */}
                <div className="md:px-4 space-y-2">
                  <div className="text-[10px] font-mono font-bold text-[var(--md-sys-color-primary)] uppercase">
                    1. Prepared By (Designer)
                  </div>
                  <div className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">
                    {record.signatories.preparedBy.name}
                  </div>
                  <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {record.signatories.preparedBy.designation}
                  </div>
                  <div className="pt-2 text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] border-t border-dashed border-[var(--md-sys-color-outline-variant)]">
                    <div>Lic: {record.signatories.preparedBy.license}</div>
                    <div>Date: {record.signatories.preparedBy.date}</div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      Status: {record.signatories.preparedBy.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Column 2: Checked By */}
                <div className="md:px-4 space-y-2">
                  <div className="text-[10px] font-mono font-bold text-[var(--md-sys-color-primary)] uppercase">
                    2. Checked By (Peer Reviewer)
                  </div>
                  <div className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">
                    {record.signatories.checkedBy.name}
                  </div>
                  <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {record.signatories.checkedBy.designation}
                  </div>
                  <div className="pt-2 text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] border-t border-dashed border-[var(--md-sys-color-outline-variant)]">
                    <div>Lic: {record.signatories.checkedBy.license}</div>
                    <div>Date: {record.signatories.checkedBy.date}</div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      Status: {record.signatories.checkedBy.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Column 3: Approved By */}
                <div className="md:px-4 space-y-2">
                  <div className="text-[10px] font-mono font-bold text-[var(--md-sys-color-primary)] uppercase">
                    3. Approved By (EOR)
                  </div>
                  <div className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">
                    {record.signatories.approvedBy.name}
                  </div>
                  <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {record.signatories.approvedBy.designation}
                  </div>
                  <div className="pt-2 text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] border-t border-dashed border-[var(--md-sys-color-outline-variant)]">
                    <div>Lic: {record.signatories.approvedBy.license}</div>
                    <div>Date: {record.signatories.approvedBy.date}</div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      Status: {record.signatories.approvedBy.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Compliance Notice Footer */}
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] text-center text-xs text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]">
          <p>
            This public verification page is cryptographic proof of calculation integrity under PB CivilLab Automated Submittal Protocol v2.4. Document Reference ID <strong>{record.docId}</strong>.
          </p>
          <p className="mt-1 text-[11px] opacity-75">
            Strictly certified for professional civil engineering, permit submittals, and regulatory compliance.
          </p>
        </div>
      </main>
    </div>
  );
}
