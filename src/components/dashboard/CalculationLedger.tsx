import React from 'react';
import {
  FileText,
  RotateCcw,
  Download,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import { EngineeringModuleId, CalculationRecord } from '../../types/civil';
import { TOOL_REGISTRY } from '../../data/toolRegistry';
import { useWorkbench } from '../../context/WorkbenchContext';

interface CalculationLedgerProps {
  calculationHistory: CalculationRecord[];
  onSelectModule: (moduleId: EngineeringModuleId) => void;
  onRestoreCalculation?: (record: CalculationRecord) => void;
  onDeleteCalculation?: (id: string) => void;
  onDirectDownloadPdf: () => void;
}

export const CalculationLedger: React.FC<CalculationLedgerProps> = ({
  calculationHistory,
  onSelectModule,
  onRestoreCalculation,
  onDeleteCalculation,
  onDirectDownloadPdf,
}) => {
  const workbench = useWorkbench();

  // Combine both sources if available
  const displayRecords = calculationHistory.length > 0 ? calculationHistory : [];

  const handleSeedSampleCalculations = () => {
    // Seed 3 realistic engineering verification snapshots into workbench history
    workbench.saveCalculationSnapshot({
      moduleId: 'beam-analysis',
      moduleName: 'RC Beam Flexure, Shear & Deflection Solver',
      title: 'Girder G-102 Ultimate Limit State Check',
      unitSystem: workbench.unitSystem,
      status: 'valid',
      summaryMetrics: [
        { label: 'Mu', value: '184.5', unit: 'kN·m' },
        { label: 'As,req', value: '1,420', unit: 'mm²' },
        { label: 'Defl', value: '11.8', unit: 'mm' },
      ],
    });

    workbench.saveCalculationSnapshot({
      moduleId: 'bearing-capacity',
      moduleName: 'Shallow Footing Bearing Capacity & Settlement',
      title: 'Isolated Footing F-04 Terzaghi Verification',
      unitSystem: workbench.unitSystem,
      status: 'valid',
      summaryMetrics: [
        { label: 'q_all', value: '245.6', unit: 'kN/m²' },
        { label: 'FS', value: '3.12', unit: '' },
      ],
    });

    workbench.saveCalculationSnapshot({
      moduleId: 'rebar-bbs',
      moduleName: 'Rebar BBS & Bar Bending Schedule Engine',
      title: 'Strip Footing Mat Reinforcement Takeoff',
      unitSystem: workbench.unitSystem,
      status: 'valid',
      summaryMetrics: [
        { label: 'Total Weight', value: '3,840', unit: 'kg' },
        { label: 'Bars', value: '16mm & 20mm', unit: '' },
      ],
    });
  };

  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] rounded-md p-3.5 space-y-3 flex flex-col justify-between shadow-xs">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/60 pb-2">
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
            Live Calculation Log &amp; Snapshots
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          {displayRecords.length} Stored Run{displayRecords.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* BODY TABLE */}
      {displayRecords.length === 0 ? (
        <div className="py-8 text-center space-y-2 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
          <Clock className="w-7 h-7 mx-auto text-slate-400" />
          <div className="font-bold text-[var(--md-sys-color-on-surface)]">
            No Saved Calculation Runs in Ledger
          </div>
          <p className="text-[11px] max-w-xs mx-auto leading-relaxed">
            Calculations performed in any solver can be saved as formal verified audit snapshots.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSeedSampleCalculations}
              className="px-3 py-1.5 rounded bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-mono text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Certified Sample Snapshots</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar max-h-[380px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono divide-y divide-[var(--md-sys-color-outline-variant)]/60">
            <thead className="text-[9px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] sticky top-0">
              <tr>
                <th className="py-2 px-2">Code</th>
                <th className="py-2 px-2">Title</th>
                <th className="py-2 px-2">Key Metric</th>
                <th className="py-2 px-1 text-center">Status</th>
                <th className="py-2 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/40">
              {displayRecords.map((record) => {
                const toolEntry = TOOL_REGISTRY.find((t) => t.moduleId === record.moduleId);
                const shortCode = toolEntry?.shortCode || 'CALC';

                // Format status
                const isWarning = record.status === 'warning';
                const isFail = record.status === 'critical';
                const statusLabel = isFail ? 'REVIEW' : isWarning ? 'WARN' : 'SAFE';

                // Format metric string
                const metricString = (record.keyMetrics || [])
                  .map((m) => `${m.label}: ${m.value}${m.unit ? ' ' + m.unit : ''}`)
                  .slice(0, 2)
                  .join(' · ') || record.notes || 'Evaluated';

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors group"
                  >
                    {/* Tool Short Code */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] font-bold text-[10px]">
                        {shortCode}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="py-2 px-2 max-w-[140px] truncate font-medium text-[var(--md-sys-color-on-surface)]" title={record.title}>
                      {record.title}
                    </td>

                    {/* Key Output Result */}
                    <td className="py-2 px-2 text-[var(--md-sys-color-on-surface-variant)] max-w-[140px] truncate tabular-nums text-[11px]" title={metricString}>
                      {metricString}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2 px-1 text-center whitespace-nowrap">
                      {isFail ? (
                        <span className="inline-flex items-center gap-0.5 text-rose-500 font-bold text-[10px]">
                          <AlertOctagon className="w-3 h-3" />
                          <span>{statusLabel}</span>
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold text-[10px]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{statusLabel}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-emerald-500 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{statusLabel}</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectModule(record.moduleId);
                            if (onRestoreCalculation) onRestoreCalculation(record);
                          }}
                          className="p-1 rounded text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                          title="Reload parameters into active module"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={onDirectDownloadPdf}
                          className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                          title="Export report PDF"
                        >
                          <Download className="w-3 h-3" />
                        </button>

                        {onDeleteCalculation && (
                          <button
                            type="button"
                            onClick={() => onDeleteCalculation(record.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER AUDIT NOTE */}
      <div className="border-t border-[var(--md-sys-color-outline-variant)]/60 pt-2 flex items-center justify-between text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
        <span>Submittal Verification</span>
        <button
          type="button"
          onClick={onDirectDownloadPdf}
          className="text-[var(--md-sys-color-primary)] hover:underline font-semibold"
        >
          Generate Batch Audit Report →
        </button>
      </div>
    </div>
  );
};
