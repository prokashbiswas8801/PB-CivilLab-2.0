import React from 'react';
import { Settings, ArrowRightLeft } from 'lucide-react';
import {
  CivilWorkspace,
  UnitCategoryKey,
  CustomUnitDefinition,
} from '../../types/civil';
import { STANDARD_UNITS, BASE_UNITS } from '../../utils/unitConverter';

export interface UnitConverterInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  availableCategoryUnits: Array<{ id: string; name: string; symbol: string; isRegional?: boolean }>;
  activeFeetInchResult: {
    isValid: boolean;
    totalFeet: number;
    totalInches: number;
    totalMeters: number;
    totalMm: number;
  };
  onOpenCustomUnitsModal: () => void;
}

export const UnitConverterInputs: React.FC<UnitConverterInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  availableCategoryUnits,
  activeFeetInchResult,
  onOpenCustomUnitsModal,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold">Measurement Discipline Category</label>
          <button
            type="button"
            onClick={onOpenCustomUnitsModal}
            className="text-xs font-bold text-[var(--md-sys-color-primary)] flex items-center gap-1 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Custom Units ({customUnits.length})</span>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 p-1 rounded-lg bg-[var(--md-sys-color-surface-container)]">
          {(
            [
              { id: 'length', label: 'Length' },
              { id: 'area', label: 'Area / Land' },
              { id: 'volume', label: 'Volume / CFT' },
              { id: 'mass', label: 'Mass / Steel' },
              { id: 'force', label: 'Force / Reaction' },
              { id: 'distributed_load', label: 'Uniform Load' },
              { id: 'pressure', label: 'Stress / Pressure' },
              { id: 'density', label: 'Unit Weight / γ' },
              { id: 'moment', label: 'Moment / Mmax' },
              { id: 'slope', label: 'Slope / Grade' },
              { id: 'velocity', label: 'Flow Velocity' },
              { id: 'flow_rate', label: 'Discharge / Q' },
            ] as { id: UnitCategoryKey; label: string }[]
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                const units = STANDARD_UNITS[cat.id];
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: {
                    ...ws.converter,
                    category: cat.id,
                    fromUnit: units[0].id,
                    toUnit: units[1] ? units[1].id : units[0].id,
                  },
                }));
              }}
              className={`touch-target-48 px-2 rounded text-xs font-semibold cursor-pointer ${
                activeWorkspace.converter.category === cat.id
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-xs font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1">Source Unit (From)</label>
          <select
            value={activeWorkspace.converter.fromUnit}
            onChange={(e) => {
              const val = e.target.value;
              updateActiveWorkspace((ws) => ({
                ...ws,
                converter: { ...ws.converter, fromUnit: val },
              }));
            }}
            className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
          >
            {availableCategoryUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol}) {u.isRegional ? '★ Regional' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Target Unit (To)</label>
          <select
            value={activeWorkspace.converter.toUnit}
            onChange={(e) => {
              const val = e.target.value;
              updateActiveWorkspace((ws) => ({
                ...ws,
                converter: { ...ws.converter, toUnit: val },
              }));
            }}
            className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
          >
            {availableCategoryUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol}) {u.isRegional ? '★ Regional' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold">Input Numeric Value</label>
          <button
            type="button"
            onClick={() => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                converter: {
                  ...ws.converter,
                  fromUnit: ws.converter.toUnit,
                  toUnit: ws.converter.fromUnit,
                },
              }));
            }}
            className="text-xs font-bold text-[var(--md-sys-color-primary)] flex items-center gap-1 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Swap Units</span>
          </button>
        </div>
        <input
          type="number"
          step="any"
          value={activeWorkspace.converter.inputValue}
          onChange={(e) => {
            const val = Number(e.target.value);
            updateActiveWorkspace((ws) => ({
              ...ws,
              converter: { ...ws.converter, inputValue: val },
            }));
          }}
          className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-base"
        />
      </div>

      {/* Architectural Feet-Inch String Parser Card */}
      <div className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
            Architectural Feet-Inch Parser
          </label>
          <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
            e.g. 12&apos;-4 1/2&quot;
          </span>
        </div>
        <input
          type="text"
          placeholder="e.g. 14'-6 3/4&quot; or 25.5'"
          value={activeWorkspace.converter.feetInchRawString}
          onChange={(e) => {
            const str = e.target.value;
            updateActiveWorkspace((ws) => ({
              ...ws,
              converter: { ...ws.converter, feetInchRawString: str },
            }));
          }}
          className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
        />
        {activeFeetInchResult.isValid && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
            <div>
              <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">Decimal Feet</span>
              <strong>{activeFeetInchResult.totalFeet.toFixed(3)} ft</strong>
            </div>
            <div>
              <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">Decimal Inches</span>
              <strong>{activeFeetInchResult.totalInches.toFixed(2)} in</strong>
            </div>
            <div>
              <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">Metric (m)</span>
              <strong>{activeFeetInchResult.totalMeters.toFixed(3)} m</strong>
            </div>
            <div>
              <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">Millimeters</span>
              <strong>{activeFeetInchResult.totalMm.toFixed(1)} mm</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export interface UnitConverterMetricsProps {
  inputValue: number;
  fromUnit: string;
  toUnit: string;
  category: UnitCategoryKey;
  conversionResult: {
    result: number;
    formula: string;
  };
}

export const UnitConverterMetrics: React.FC<UnitConverterMetricsProps> = ({
  inputValue,
  fromUnit,
  toUnit,
  category,
  conversionResult,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <div>
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Source Value</div>
        <div className="text-xl font-bold font-mono mt-0.5">{inputValue} {fromUnit}</div>
      </div>
      <div>
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Converted Value</div>
        <div className="text-xl font-bold font-mono mt-0.5 text-[var(--md-sys-color-primary)]">
          {Number(conversionResult.result.toFixed(4))} <span className="text-xs font-normal">{toUnit}</span>
        </div>
      </div>
      <div>
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Conversion Formula</div>
        <div className="text-xs font-mono mt-1 opacity-90 truncate">{conversionResult.formula}</div>
      </div>
      <div>
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Base SI Unit</div>
        <div className="text-xs font-mono font-bold mt-1">{BASE_UNITS[category]}</div>
      </div>
    </div>
  );
};
