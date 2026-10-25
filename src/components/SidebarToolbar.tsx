import React from 'react';
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
  Loader2,
  Wrench,
} from 'lucide-react';
import { PdfExportProgress } from '../utils/pdfExport';

export interface SidebarToolbarProps {
  collapsed?: boolean;
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
  className?: string;
}

export const SidebarToolbar: React.FC<SidebarToolbarProps> = ({
  collapsed = false,
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
  className = '',
}) => {
  if (collapsed) {
    return (
      <div
        aria-label="Sidebar quick actions toolbar"
        className={`flex flex-col items-center gap-1.5 p-1 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] ${className}`}
      >
        {/* Export PDF Button (Collapsed) */}
        <button
          type="button"
          onClick={onExportPdf}
          disabled={isExportingPdf}
          className="touch-target-48 w-11 h-11 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center cursor-pointer hover:opacity-90 transition-transform active:scale-95 disabled:opacity-80 shadow-xs relative overflow-hidden"
          title={pdfExportProgress ? `PDF Export: ${pdfExportProgress.percent}%` : 'Export Certified PDF (A4)'}
          aria-label="Export Certified PDF"
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
        </button>

        {/* Quick Print Button (Collapsed) */}
        <button
          type="button"
          onClick={onQuickPrint}
          className="touch-target-48 w-11 h-11 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-center cursor-pointer transition-colors"
          title="Quick Print Submittal (Ctrl+P)"
          aria-label="Quick Print Submittal"
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* Undo Button (Collapsed) */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`touch-target-48 w-11 h-11 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex items-center justify-center transition-colors ${
            canUndo
              ? 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer'
              : 'text-[var(--md-sys-color-on-surface-variant)] opacity-30 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Redo Button (Collapsed) */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`touch-target-48 w-11 h-11 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex items-center justify-center transition-colors ${
            canRedo
              ? 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer'
              : 'text-[var(--md-sys-color-on-surface-variant)] opacity-30 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Snapshot Button (Collapsed) */}
        <button
          type="button"
          onClick={onLogSnapshot}
          className="touch-target-48 w-11 h-11 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-center cursor-pointer transition-colors"
          title="Save Calculation Snapshot"
          aria-label="Save Calculation Snapshot"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* History Drawer Button (Collapsed) */}
        <button
          type="button"
          onClick={onOpenHistoryDrawer}
          className="touch-target-48 w-11 h-11 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-center cursor-pointer transition-colors relative"
          title={`History Ledger (${historyCount} saved)`}
          aria-label="History Ledger"
        >
          <History className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-[9px] font-mono font-bold flex items-center justify-center">
              {historyCount > 99 ? '99+' : historyCount}
            </span>
          )}
        </button>

        {/* Share Summary Button (Collapsed) */}
        <button
          type="button"
          onClick={onShareSummary}
          className="touch-target-48 w-11 h-11 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-center cursor-pointer transition-colors"
          title={copiedSummary ? 'Summary Copied!' : 'Copy / Share Summary'}
          aria-label="Copy Calculation Summary"
        >
          {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
        </button>

        {/* Command Palette Button (Collapsed) */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="touch-target-48 w-11 h-11 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-center cursor-pointer transition-colors"
          title="Command Palette & Search (Ctrl+K)"
          aria-label="Command Palette"
        >
          <Command className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Expanded View (!collapsed)
  return (
    <div
      aria-label="Sidebar workbench toolbar"
      className={`p-3 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5 ${className}`}
    >
      {/* Header with Title and Active Workbench Tag */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] text-[10px]">
          <Wrench className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          <span>Workbench Tools</span>
        </span>
        {activeModuleName && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] font-medium truncate max-w-[110px]">
            {activeModuleName}
          </span>
        )}
      </div>

      {/* Primary Action Buttons: Export PDF & Quick Print */}
      <div className="grid grid-cols-2 gap-2">
        {/* Export PDF Button */}
        <button
          type="button"
          onClick={onExportPdf}
          disabled={isExportingPdf}
          className="touch-target-48 relative overflow-hidden px-3 py-2.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold hover:opacity-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 disabled:opacity-90"
          title={pdfExportProgress ? `${pdfExportProgress.percent}% · ${pdfExportProgress.stage}` : 'Direct Export Certified A4 PDF'}
          aria-label="Export Certified PDF"
        >
          {isExportingPdf && pdfExportProgress && (
            <span
              className="absolute inset-0 bg-emerald-500/35 transition-all duration-300 pointer-events-none"
              style={{ width: `${pdfExportProgress.percent}%` }}
            />
          )}
          {isExportingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0 z-10" />
          ) : (
            <FileDown className="w-4 h-4 shrink-0 z-10" />
          )}
          <span className="font-mono z-10 truncate">
            {isExportingPdf
              ? pdfExportProgress
                ? `${pdfExportProgress.percent}%`
                : 'Exporting...'
              : 'Export PDF'}
          </span>
        </button>

        {/* Quick Print Button */}
        <button
          type="button"
          onClick={onQuickPrint}
          className="touch-target-48 px-3 py-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          title="Quick print verification report (Ctrl+P)"
          aria-label="Quick print verification report"
        >
          <Printer className="w-4 h-4 shrink-0 text-[var(--md-sys-color-primary)]" />
          <span className="font-mono">Quick Print</span>
        </button>
      </div>

      {/* Secondary Quick Utilities Toolbar Strip */}
      <div className="flex items-center justify-between gap-1 p-1 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        {/* Undo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`touch-target-48 flex-1 py-1.5 rounded flex items-center justify-center transition-colors ${
            canUndo
              ? 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer'
              : 'text-[var(--md-sys-color-on-surface-variant)] opacity-30 cursor-not-allowed'
          }`}
          title="Undo last change (Ctrl+Z)"
          aria-label="Undo last change"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`touch-target-48 flex-1 py-1.5 rounded flex items-center justify-center transition-colors ${
            canRedo
              ? 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer'
              : 'text-[var(--md-sys-color-on-surface-variant)] opacity-30 cursor-not-allowed'
          }`}
          title="Redo change (Ctrl+Y)"
          aria-label="Redo change"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[var(--md-sys-color-outline-variant)] shrink-0" />

        {/* Save Snapshot */}
        <button
          type="button"
          onClick={onLogSnapshot}
          className="touch-target-48 flex-1 py-1.5 rounded hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center cursor-pointer transition-colors"
          title="Save Calculation Snapshot to Ledger"
          aria-label="Save Calculation Snapshot"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>

        {/* History Ledger */}
        <button
          type="button"
          onClick={onOpenHistoryDrawer}
          className="touch-target-48 flex-1 py-1.5 rounded hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center cursor-pointer transition-colors relative"
          title={`Open Calculation History (${historyCount} saved)`}
          aria-label="Open Calculation History"
        >
          <History className="w-3.5 h-3.5" />
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-0.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-[8px] font-mono font-bold flex items-center justify-center">
              {historyCount > 99 ? '99+' : historyCount}
            </span>
          )}
        </button>

        {/* Copy / Share Summary */}
        <button
          type="button"
          onClick={onShareSummary}
          className="touch-target-48 flex-1 py-1.5 rounded hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center cursor-pointer transition-colors"
          title={copiedSummary ? 'Summary Copied to Clipboard!' : 'Copy Analytical Calculation Summary'}
          aria-label="Copy Analytical Calculation Summary"
        >
          {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>

        {/* Command Palette */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="touch-target-48 flex-1 py-1.5 rounded hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] flex items-center justify-center cursor-pointer transition-colors"
          title="Command Palette & Search (Ctrl+K)"
          aria-label="Command Palette & Search"
        >
          <Command className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
