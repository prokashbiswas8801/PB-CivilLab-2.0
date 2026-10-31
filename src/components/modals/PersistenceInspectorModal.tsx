import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Bug,
} from 'lucide-react';
import { CivilLabSchemaV2 } from '../../types/civil';
import { STORAGE_KEY } from '../../utils/storage';

export interface PersistenceInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: CivilLabSchemaV2;
  idbDiagnostics: {
    supported: boolean;
    hasStoredState: boolean;
    lastPersistedTime?: string;
    approxSizeChars: number;
    syncing?: boolean;
  };
  onForceIdbSync: () => void;
  onRestoreFromIdb: () => void;
  onResetToClean: () => void;
  onLoadDemoDataset: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onTestV1Migration: () => void;
  onTestErrorBoundary: () => void;
}

export const PersistenceInspectorModal: React.FC<PersistenceInspectorModalProps> = ({
  isOpen,
  onClose,
  appState,
  idbDiagnostics,
  onForceIdbSync,
  onRestoreFromIdb,
  onResetToClean,
  onLoadDemoDataset,
  onExportJson,
  onImportJson,
  onTestV1Migration,
  onTestErrorBoundary,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl custom-scrollbar"
          >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              Local-First Schema v2 Storage Diagnostics
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              PB CivilLab offline persistence and schema state inspector
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Schema Inspector"
            className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-[var(--md-sys-color-surface-container)]">
            <div className="text-[var(--md-sys-color-on-surface-variant)]">Schema Version</div>
            <div className="text-base font-bold">{appState.schemaVersion}</div>
          </div>
          <div className="p-2.5 rounded bg-[var(--md-sys-color-surface-container)]">
            <div className="text-[var(--md-sys-color-on-surface-variant)]">Workspaces</div>
            <div className="text-base font-bold">{appState.workspaces.length}</div>
          </div>
          <div className="p-2.5 rounded bg-[var(--md-sys-color-surface-container)]">
            <div className="text-[var(--md-sys-color-on-surface-variant)]">Custom Units</div>
            <div className="text-base font-bold">{appState.customUnits.length}</div>
          </div>
          <div className="p-2.5 rounded bg-[var(--md-sys-color-surface-container)]">
            <div className="text-[var(--md-sys-color-on-surface-variant)]">History Logs</div>
            <div className="text-base font-bold">{appState.calculationHistory.length}</div>
          </div>
        </div>

        {/* Dual-Layer Local-First Storage Health Card */}
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                Dual-Layer Local-First Persistence Architecture
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--md-sys-color-success)]/15 text-[var(--md-sys-color-success)] border border-[var(--md-sys-color-success)]/30">
              <ShieldCheck className="w-3 h-3" />
              <span>Zero-Data-Loss Active</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
              <div className="text-[var(--md-sys-color-on-surface-variant)] text-[10px]">Tier 1: Synchronous Web Storage</div>
              <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">localStorage ({STORAGE_KEY})</div>
              <div className="text-[10px] text-[var(--md-sys-color-success)] flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Instant in-memory & session reload</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
              <div className="text-[var(--md-sys-color-on-surface-variant)] text-[10px]">Tier 2: Asynchronous Resilient DB</div>
              <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                IndexedDB (pb_civillab_db)
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-primary)] flex items-center gap-1 mt-1">
                {idbDiagnostics.supported ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {idbDiagnostics.hasStoredState ? `Synced (~${Math.round(idbDiagnostics.approxSizeChars / 1024 * 10) / 10} KB)` : 'Ready & Connected'}
                    </span>
                  </>
                ) : (
                  <span>Fallback mode</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]">
            <button
              type="button"
              onClick={onForceIdbSync}
              disabled={idbDiagnostics.syncing}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[var(--md-sys-color-surface)] cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>{idbDiagnostics.syncing ? 'Backing up...' : 'Backup to IndexedDB Now'}</span>
            </button>

            <button
              type="button"
              onClick={onRestoreFromIdb}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[var(--md-sys-color-surface)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />
              <span>Restore from IndexedDB</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
            Storage Management & State Controls
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onResetToClean}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[var(--md-sys-color-primary)] cursor-pointer"
              title="Initialize clean project with 0 takeoff items and 0 logs"
            >
              <Trash2 className="w-4 h-4 text-[var(--md-sys-color-error)]" />
              <span>Reset to Clean Slate (0 Items)</span>
            </button>

            <button
              type="button"
              onClick={onLoadDemoDataset}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-xs font-bold inline-flex items-center gap-1.5 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/40 cursor-pointer"
              title="Load complete Padma River Viaduct demo project with 7 takeoffs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Demo Dataset (Padma Viaduct)</span>
            </button>

            <button
              type="button"
              onClick={onExportJson}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={onImportJson}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import JSON</span>
            </button>

            <button
              type="button"
              onClick={onTestV1Migration}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Test v1 Migration</span>
            </button>

            <button
              type="button"
              onClick={onTestErrorBoundary}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Bug className="w-4 h-4" />
              <span>Test ErrorBoundary</span>
            </button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
