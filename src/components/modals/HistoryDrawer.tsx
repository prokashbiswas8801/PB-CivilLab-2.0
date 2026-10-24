import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  History,
  RotateCcw,
  GitFork,
  ArrowRightLeft,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CalculationRecord, CivilWorkspace, EngineeringModuleId } from '../../types/civil';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyRecords: CalculationRecord[];
  activeWorkspace: CivilWorkspace;
  onRestoreRecord: (record: CalculationRecord) => void;
  onForkRecordToProject: (record: CalculationRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
  onLogCurrentSnapshot: () => void;
  activeProjectCode: string;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  historyRecords,
  activeWorkspace,
  onRestoreRecord,
  onForkRecordToProject,
  onDeleteRecord,
  onClearHistory,
  onLogCurrentSnapshot,
  activeProjectCode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<'all' | EngineeringModuleId>('all');
  const [projectScope, setProjectScope] = useState<'active-project' | 'all-projects'>('active-project');
  const [comparingRecordId, setComparingRecordId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return historyRecords.filter((rec) => {
      // Scope filter
      if (projectScope === 'active-project' && rec.workspaceId && rec.workspaceId !== activeWorkspace.id) {
        return false;
      }
      // Module filter
      if (selectedModule !== 'all' && rec.moduleId !== selectedModule) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = rec.title.toLowerCase().includes(q);
        const matchesNotes = rec.notes?.toLowerCase().includes(q);
        const matchesModule = rec.moduleId.toLowerCase().includes(q);
        const matchesId = rec.id.toLowerCase().includes(q);
        const matchesMetrics = rec.keyMetrics?.some(
          (m) => m.label.toLowerCase().includes(q) || m.value.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesNotes && !matchesModule && !matchesId && !matchesMetrics) {
          return false;
        }
      }
      return true;
    });
  }, [historyRecords, projectScope, activeWorkspace.id, selectedModule, searchQuery]);

  // Unique modules in history for dropdown
  const availableModules = useMemo(() => {
    const set = new Set<EngineeringModuleId>();
    historyRecords.forEach((r) => set.add(r.moduleId));
    return Array.from(set);
  }, [historyRecords]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-xl bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-2xl flex flex-col h-full border-l border-[var(--md-sys-color-outline-variant)] transform transition-transform duration-300 ease-out z-10">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight">Calculation Session History</div>
              <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">
                {filteredRecords.length} snapshots archived · Local-first ledger
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogCurrentSnapshot}
              className="touch-target-48 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold hover:opacity-90 cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Save current calculation as a snapshot"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Snapshot Current</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="touch-target-48 p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
              aria-label="Close history drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search snapshots by title, module, notes, or metrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-mono rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <select
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value as 'active-project' | 'all-projects')}
                className="touch-target-48 px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
              >
                <option value="active-project">Active Project ({activeProjectCode})</option>
                <option value="all-projects">All Workspace Ledgers</option>
              </select>

              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value as 'all' | EngineeringModuleId)}
                className="touch-target-48 px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
              >
                <option value="all">All Modules</option>
                {availableModules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {historyRecords.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="touch-target-48 px-2.5 py-1 text-xs font-mono text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/20 rounded-md cursor-pointer flex items-center gap-1"
                title="Clear all saved calculation snapshots"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Records List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] space-y-3">
              <History className="w-10 h-10 mx-auto opacity-30 text-[var(--md-sys-color-primary)]" />
              <div className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                No Snapshots Found
              </div>
              <p className="max-w-xs mx-auto text-xs text-[var(--md-sys-color-on-surface-variant)]">
                {searchQuery
                  ? 'No records match your query. Try clearing search filters.'
                  : 'Capture calculation snapshots anytime by clicking "Snapshot Current" or the persistent action bar.'}
              </p>
              <button
                type="button"
                onClick={onLogCurrentSnapshot}
                className="px-3.5 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Snapshot Active State Now</span>
              </button>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isComparing = comparingRecordId === rec.id;
              const hasInputs = rec.inputsSnapshot && Object.keys(rec.inputsSnapshot).length > 0;

              return (
                <div
                  key={rec.id}
                  className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-outline)] transition-all p-3.5 space-y-3 shadow-2xs"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-1.5 py-0.5 rounded">
                          {rec.moduleId}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(rec.timestamp).toLocaleString()}
                        </span>
                        {(rec.status === 'nominal' || (rec.status as string) === 'valid') && (
                          <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Pass
                          </span>
                        )}
                        {rec.status === 'warning' && (
                          <span className="text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            Advisory
                          </span>
                        )}
                        {(rec.status === 'critical' || (rec.status as string) === 'invalid') && (
                          <span className="text-[10px] font-mono font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-0.5">
                            <XCircle className="w-3 h-3" />
                            Exceeded
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-1 tracking-tight">
                        {rec.title}
                      </div>
                      {rec.notes && (
                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 leading-snug">
                          {rec.notes}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteRecord(rec.id)}
                      className="touch-target-48 p-1.5 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] rounded-lg hover:bg-[var(--md-sys-color-error-container)]/20 cursor-pointer"
                      title="Delete this snapshot"
                      aria-label={`Delete record ${rec.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Key Metrics Grid */}
                  {rec.keyMetrics && rec.keyMetrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[var(--md-sys-color-surface-container)] p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)]/60 text-xs font-mono">
                      {rec.keyMetrics.map((m) => (
                        <div key={m.label} className="min-w-0">
                          <div className="text-[9.5px] uppercase text-[var(--md-sys-color-on-surface-variant)] font-semibold truncate">
                            {m.label}
                          </div>
                          <div className="font-bold text-[var(--md-sys-color-on-surface)] truncate mt-0.5">
                            {m.value} <span className="font-normal text-[10px]">{m.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Compare Panel */}
                  {isComparing && hasInputs && (
                    <div className="bg-[var(--md-sys-color-surface-container-high)] p-3 rounded-lg border border-[var(--md-sys-color-outline)] space-y-2 text-xs font-mono">
                      <div className="font-bold text-[var(--md-sys-color-on-surface)] text-[11px] uppercase tracking-wider flex items-center justify-between">
                        <span>Snapshot Parameter Inspect</span>
                        <span className="text-[10px] font-normal text-[var(--md-sys-color-on-surface-variant)]">
                          Snapshot #{rec.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1 text-[11px]">
                        {Object.entries(rec.inputsSnapshot || {}).map(([key, val]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between py-0.5 border-b border-[var(--md-sys-color-outline-variant)]/40 last:border-0"
                          >
                            <span className="text-[var(--md-sys-color-on-surface-variant)]">{key}:</span>
                            <span className="font-bold text-[var(--md-sys-color-on-surface)] truncate max-w-[180px]">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tactile Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/60">
                    <button
                      type="button"
                      onClick={() => onRestoreRecord(rec)}
                      className="touch-target-48 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold hover:opacity-90 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Restore parameters directly into active workspace"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore State</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onForkRecordToProject(rec)}
                      className="touch-target-48 px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                      title="Fork snapshot into an independent project workspace"
                    >
                      <GitFork className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                      <span>Fork to Project</span>
                    </button>

                    {hasInputs && (
                      <button
                        type="button"
                        onClick={() => setComparingRecordId(isComparing ? null : rec.id)}
                        className="touch-target-48 px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] text-xs font-medium cursor-pointer flex items-center gap-1"
                        title="Toggle parameter inspection"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>{isComparing ? 'Hide Diff' : 'Inspect'}</span>
                        {isComparing ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] shrink-0">
          <span>Esc to dismiss · Ctrl+Z to undo</span>
          <button
            type="button"
            onClick={onClose}
            className="touch-target-48 px-3 py-1 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-semibold cursor-pointer hover:bg-[var(--md-sys-color-surface-container-high)]"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
