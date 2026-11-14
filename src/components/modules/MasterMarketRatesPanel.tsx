import React, { useState } from 'react';
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  CivilWorkspace,
  CurrencyCode,
  MasterMarketRates,
} from '../../types/civil';
import { getCurrencySymbol } from '../../utils/calculations';
import { createDefaultMasterMarketRates } from '../../utils/storage';
import { syncMasterMarketRatesToWorkspace } from '../../utils/rateResolver';

export interface MasterMarketRatesPanelProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  currency?: CurrencyCode;
  defaultExpanded?: boolean;
  onRatesSynced?: (summary: string) => void;
}

interface RateFieldSpec {
  key: keyof Omit<MasterMarketRates, 'lastSyncedAt'>;
  label: string;
  unit: string;
  step: number;
  group: 'material' | 'labor';
}

const MARKET_RATE_FIELDS: RateFieldSpec[] = [
  { key: 'cementBag50Kg', label: 'OPC / PCC Cement', unit: '/ 50kg bag', step: 5, group: 'material' },
  { key: 'sylhetSandPerCft', label: 'Sylhet Coarse Sand', unit: '/ CFT', step: 1, group: 'material' },
  { key: 'localSandPerCft', label: 'Local Fine Sand', unit: '/ CFT', step: 1, group: 'material' },
  { key: 'stoneChips20mmPerCft', label: '20mm Crushed Stone', unit: '/ CFT', step: 5, group: 'material' },
  { key: 'brickKhoaPerCft', label: 'Brick Khoa (40mm)', unit: '/ CFT', step: 5, group: 'material' },
  { key: 'firstClassBrickPer1000', label: '1st-Class Bricks', unit: '/ 1000 Nos', step: 100, group: 'material' },
  { key: 'rebar500WPerTon', label: 'Grade 60/500W Rebar', unit: '/ Metric Ton', step: 500, group: 'material' },
  { key: 'headMasonDailyWage', label: 'Head Mason (Rajmistri)', unit: '/ day', step: 50, group: 'labor' },
  { key: 'helperDailyWage', label: 'Helper (Jogali)', unit: '/ day', step: 50, group: 'labor' },
  { key: 'barBenderDailyWage', label: 'Bar Bender / Fitter', unit: '/ day', step: 50, group: 'labor' },
];

export const MasterMarketRatesPanel: React.FC<MasterMarketRatesPanelProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  currency,
  defaultExpanded = false,
  onRatesSynced,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const rates: MasterMarketRates = activeWorkspace.marketRates || createDefaultMasterMarketRates();
  const sym = getCurrencySymbol(currency || activeWorkspace.rateAnalysis?.currency || activeWorkspace.currency || 'BDT');

  const handleFieldChange = (key: keyof Omit<MasterMarketRates, 'lastSyncedAt'>, raw: string) => {
    const num = raw === '' ? 0 : Number(raw);
    const safeVal = Number.isFinite(num) && num >= 0 ? num : 0;
    updateActiveWorkspace((ws) => ({
      ...ws,
      marketRates: {
        ...(ws.marketRates || createDefaultMasterMarketRates()),
        [key]: safeVal,
      },
    }));
  };

  const handleResetDefaults = () => {
    const defaults = createDefaultMasterMarketRates();
    updateActiveWorkspace((ws) => ({
      ...ws,
      marketRates: defaults,
    }));
    setSyncNotice('Reset market index to PWD 2025 baseline rates (click Sync to propagate).');
  };

  const handleSyncToAnalysisAndBoq = () => {
    const syncOutcome = syncMasterMarketRatesToWorkspace(activeWorkspace, rates);
    updateActiveWorkspace((ws) => ({
      ...ws,
      marketRates: syncOutcome.marketRates,
      rateAnalysis: syncOutcome.rateAnalysis,
      boq: {
        ...ws.boq,
        items: syncOutcome.boqItems,
      },
    }));

    const summary = `Synced Rate Analysis + ${syncOutcome.updatedBoqCount} linked BOQ item${syncOutcome.updatedBoqCount === 1 ? '' : 's'} (Undo available)`;
    setSyncNotice(summary);
    onRatesSynced?.(summary);
  };

  const formattedSyncTime = rates.lastSyncedAt
    ? new Date(rates.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not synced';

  return (
    <div className="rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left hover:bg-[var(--md-sys-color-surface-container-high)]/60 transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <SlidersHorizontal className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] truncate">
              Master Market Rates (Live Sync)
            </div>
            <div className="text-[11px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] truncate">
              Cement {sym}{rates.cementBag50Kg}/bag · Rebar {sym}{(rates.rebar500WPerTon / 1000).toFixed(1)}k/T · Synced {formattedSyncTime}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[var(--md-sys-color-on-surface-variant)]">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider hidden sm:inline">
            {isOpen ? 'Collapse' : 'Edit Index'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3.5 pt-2 border-t border-[var(--md-sys-color-outline-variant)] space-y-3 bg-[var(--md-sys-color-surface-container-low)]">
          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-snug">
            Maintain one central Bangladesh PWD / site procurement price list. Clicking <strong>Sync Rates to Analysis &amp; BOQ</strong> updates unit rates across Rate Analysis and linked BOQ items with automatic Undo snapshot protection.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5">
            {MARKET_RATE_FIELDS.map((field) => {
              const val = rates[field.key] ?? 0;
              return (
                <div key={field.key} className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                      {field.label}
                    </label>
                    <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] shrink-0">
                      {sym} {field.unit}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step={field.step}
                    value={val}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full min-h-[40px] px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono tabular-nums font-semibold text-[var(--md-sys-color-on-surface)] focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
                  />
                </div>
              );
            })}
          </div>

          {syncNotice && (
            <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] flex items-center gap-2 text-[11px] font-mono text-[var(--md-sys-color-on-surface)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-2.5 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset PWD Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSyncToAnalysisAndBoq}
              className="flex-1 sm:flex-initial min-h-[42px] px-3.5 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-opacity"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Rates to Analysis &amp; BOQ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
