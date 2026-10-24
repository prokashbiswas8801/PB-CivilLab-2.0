import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  Sparkles,
  Share2,
  Check,
  RotateCcw,
  RotateCw,
  History,
  Command,
  ChevronDown,
  ChevronUp,
  Layers,
  Loader2,
} from 'lucide-react';
import { PdfExportProgress } from '../utils/pdfExport';

interface FloatingActionBarProps {
  onQuickPrint: () => void;
  onExportPdf: () => void;
  isExportingPdf?: boolean;
  pdfExportProgress?: PdfExportProgress | null;
  onLogSnapshot: () => void;
  onShareSummary: () => void;
  copiedSummary: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenHistoryDrawer: () => void;
  historyCount: number;
  onOpenCommandPalette: () => void;
  activeModuleName?: string;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  onQuickPrint,
  onExportPdf,
  isExportingPdf = false,
  pdfExportProgress = null,
  onLogSnapshot,
  onShareSummary,
  copiedSummary,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenHistoryDrawer,
  historyCount,
  onOpenCommandPalette,
  activeModuleName,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <aside
      aria-label="Persistent engineering quick-action dock"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 print:hidden transition-all duration-300"
    >
      {isMinimized ? (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="touch-target-48 w-12 h-12 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-lg hover:shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          title="Open Quick-Action Toolbar"
          aria-label="Expand quick actions toolbar"
        >
          <Layers className="w-5 h-5" />
        </button>
      ) : (
        <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-2xl bg-[var(--md-sys-color-surface)]/95 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] shadow-xl text-[var(--md-sys-color-on-surface)]">
          {/* Collapse button */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="touch-target-48 p-2 rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            title="Minimize toolbar"
            aria-label="Minimize toolbar"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-[var(--md-sys-color-outline-variant)] my-auto" />

          {/* Undo / Redo controls */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`touch-target-48 p-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors ${
                canUndo
                  ? 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                  : 'opacity-35 cursor-not-allowed text-[var(--md-sys-color-on-surface-variant)]'
              }`}
              title="Undo last change (Ctrl+Z)"
              aria-label="Undo last change"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className={`touch-target-48 p-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors ${
                canRedo
                  ? 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                  : 'opacity-35 cursor-not-allowed text-[var(--md-sys-color-on-surface-variant)]'
              }`}
              title="Redo change (Ctrl+Y / Ctrl+Shift+Z)"
              aria-label="Redo change"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-[var(--md-sys-color-outline-variant)] my-auto" />

          {/* Save / Log Snapshot */}
          <button
            type="button"
            onClick={onLogSnapshot}
            className="touch-target-48 px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer flex items-center gap-1.5 transition-colors"
            title="Save calculation snapshot to project ledger"
            aria-label="Save calculation snapshot"
          >
            <Sparkles className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <span className="hidden md:inline font-mono">Snapshot</span>
          </button>

          {/* History Drawer toggle */}
          <button
            type="button"
            onClick={onOpenHistoryDrawer}
            className="touch-target-48 relative px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer flex items-center gap-1.5 transition-colors"
            title="Open calculation session history drawer"
            aria-label="Open calculation session history drawer"
          >
            <History className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <span className="hidden md:inline font-mono">History</span>
            {historyCount > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-[10px] font-mono font-bold flex items-center justify-center">
                {historyCount > 99 ? '99+' : historyCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-[var(--md-sys-color-outline-variant)] my-auto" />

          {/* Quick Print Report */}
          <button
            type="button"
            onClick={onQuickPrint}
            className="touch-target-48 px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer flex items-center gap-1.5 transition-colors"
            title="Quick print verification report (Ctrl+P)"
            aria-label="Quick print verification report"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden lg:inline font-mono">Print</span>
          </button>

          {/* Export PDF with Live Percentage and Progress Fill */}
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className="touch-target-48 relative overflow-hidden px-3 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold hover:opacity-95 cursor-pointer flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 disabled:opacity-90"
            title={pdfExportProgress ? `${pdfExportProgress.percent}% - ${pdfExportProgress.stage}` : 'Export certified vector PDF report'}
            aria-label={pdfExportProgress ? `Exporting PDF: ${pdfExportProgress.percent}%` : 'Export certified vector PDF report'}
          >
            {isExportingPdf && pdfExportProgress && (
              <span
                className="absolute inset-0 bg-emerald-500/35 transition-all duration-300 pointer-events-none"
                style={{ width: `${pdfExportProgress.percent}%` }}
              />
            )}
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin z-10" />
            ) : (
              <FileDown className="w-4 h-4 z-10" />
            )}
            <span className="font-mono z-10">
              {isExportingPdf
                ? pdfExportProgress
                  ? `${pdfExportProgress.percent}%`
                  : 'Exporting...'
                : 'Export PDF'}
            </span>
          </button>

          {/* Share Summary */}
          <button
            type="button"
            onClick={onShareSummary}
            className="touch-target-48 p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors"
            title="Share or copy calculation summary"
            aria-label="Share or copy calculation summary"
          >
            {copiedSummary ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          {/* Command Palette summon button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="touch-target-48 p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors"
            title="Command Palette & Global Search (Cmd+K)"
            aria-label="Open command palette and global search"
          >
            <Command className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
