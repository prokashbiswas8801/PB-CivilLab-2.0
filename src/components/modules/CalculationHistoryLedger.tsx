import React from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { CalculationRecord } from '../../types/civil';
import { LogoMark } from '../Logo';

export interface CalculationHistoryLedgerProps {
  filteredHistory: CalculationRecord[];
  historyScope: 'active-project' | 'all-projects';
  setHistoryScope: (scope: 'active-project' | 'all-projects') => void;
  activeProjectCode: string;
  onClearHistory: () => void;
  onLoadSampleHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
}

export const CalculationHistoryLedger: React.FC<CalculationHistoryLedgerProps> = ({
  filteredHistory,
  historyScope,
  setHistoryScope,
  activeProjectCode,
  onClearHistory,
  onLoadSampleHistory,
  onDeleteHistoryItem,
}) => {
  return (
    <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center gap-2">
          <LogoMark size={20} className="text-[var(--md-sys-color-primary)]" />
          <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
            Calculation History Ledger
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={historyScope}
            onChange={(e) => setHistoryScope(e.target.value as 'active-project' | 'all-projects')}
            className="touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono bg-[var(--md-sys-color-surface)]"
          >
            <option value="active-project">Active Project Only ({activeProjectCode})</option>
            <option value="all-projects">All Projects Across Lab</option>
          </select>
          <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
            {filteredHistory.length} Entries
          </span>
          {filteredHistory.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="px-2 py-1 rounded text-xs font-mono text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/20 cursor-pointer"
              title="Clear history records"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-[var(--md-sys-color-outline-variant)] mt-2">
        {filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] space-y-2">
            <div>No calculation snapshots logged for this project yet. Use &quot;Log Snapshot&quot; above to capture records.</div>
            <button
              type="button"
              onClick={onLoadSampleHistory}
              className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Load Sample History Records</span>
            </button>
          </div>
        ) : (
          filteredHistory.map((rec) => (
            <div key={rec.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  {rec.id.slice(0, 8)} · {new Date(rec.timestamp).toLocaleTimeString()} · <span className="font-bold text-[var(--md-sys-color-primary)]">[{rec.moduleId}]</span>
                </div>
                <div className="text-sm font-semibold truncate">{rec.title}</div>
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">{rec.notes}</div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-mono">
                  {rec.keyMetrics.map((m) => (
                    <span key={m.label}>
                      {m.label}: <strong>{m.value} {m.unit}</strong>
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteHistoryItem(rec.id)}
                className="touch-target-48 px-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] cursor-pointer"
                aria-label={`Delete record ${rec.title}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
