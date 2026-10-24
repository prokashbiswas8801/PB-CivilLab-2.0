import React from 'react';
import {
  FileDown,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  QrCode,
  FileSpreadsheet,
  Award,
} from 'lucide-react';
import { PdfExportProgress } from '../utils/pdfExport';

interface PdfExportProgressModalProps {
  progress: PdfExportProgress | null;
  moduleName: string;
  projectCode: string;
}

const STAGES = [
  { minPercent: 0, label: 'Document Initialization', icon: FileDown },
  { minPercent: 25, label: 'Cryptographic QR Code & Hash', icon: QrCode },
  { minPercent: 45, label: 'Executive Header & Credentials', icon: Award },
  { minPercent: 65, label: 'Analytical Schedule & Limit States', icon: FileSpreadsheet },
  { minPercent: 80, label: 'Governing Standards & Equations', icon: Sparkles },
  { minPercent: 92, label: 'Official Seal & Vector Compilation', icon: ShieldCheck },
];

export const PdfExportProgressModal: React.FC<PdfExportProgressModalProps> = ({
  progress,
  moduleName,
  projectCode,
}) => {
  if (!progress) return null;

  const currentPercent = Math.min(100, Math.max(0, Math.round(progress.percent)));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating certified PDF report"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-2xl shadow-2xl overflow-hidden text-[var(--md-sys-color-on-surface)] flex flex-col transform transition-all duration-300 scale-100">
        {/* Top Gradient Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <FileDown className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
                Compiling Certified PDF
              </h3>
              <p className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                {moduleName} · [{projectCode}]
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
              {currentPercent}%
            </div>
            <div className="text-[10px] font-mono uppercase font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              {currentPercent === 100 ? 'Ready' : 'In Progress'}
            </div>
          </div>
        </div>

        {/* Progress Bar & Current Stage */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-semibold flex items-center gap-1.5">
                <Loader2 className={`w-3.5 h-3.5 text-blue-600 ${currentPercent < 100 ? 'animate-spin' : ''}`} />
                <span>Current Stage:</span>
              </span>
              <span className="font-bold text-[var(--md-sys-color-on-surface)] truncate max-w-[220px]">
                {currentPercent === 100 ? 'Download Triggered' : `${currentPercent}% Completed`}
              </span>
            </div>

            {/* Stage Description Text Box */}
            <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs font-mono text-[var(--md-sys-color-on-surface)] font-medium leading-relaxed">
              {progress.stage}
            </div>

            {/* Smooth Track & Fill Bar */}
            <div className="relative w-full h-2.5 bg-[var(--md-sys-color-surface-container-high)] rounded-full overflow-hidden border border-[var(--md-sys-color-outline-variant)]/60">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-xs"
                style={{ width: `${currentPercent}%` }}
              />
            </div>
          </div>

          {/* Sequential Stage Checklist */}
          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/60 space-y-2">
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] tracking-wider">
              Submittal Generation Pipeline
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs font-mono">
              {STAGES.map((s, idx) => {
                const Icon = s.icon;
                const isPassed = currentPercent > s.minPercent + 12 || currentPercent === 100;
                const isActive =
                  !isPassed &&
                  currentPercent >= s.minPercent &&
                  (idx === STAGES.length - 1 || currentPercent < STAGES[idx + 1].minPercent);

                return (
                  <div
                    key={s.label}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold'
                        : isPassed
                        ? 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] font-medium'
                        : 'text-[var(--md-sys-color-on-surface-variant)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{s.label}</span>
                    </div>

                    <div className="shrink-0">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[var(--md-sys-color-outline-variant)]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-5 py-3 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>jsPDF Pure Vector Engine · Zero Server Upload</span>
          </span>
          <span className="font-semibold">{currentPercent}%</span>
        </div>
      </div>
    </div>
  );
};
