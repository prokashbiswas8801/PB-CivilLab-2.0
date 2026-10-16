import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { ConcreteMixResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';

export interface ConcreteMixInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

export const ConcreteMixInputs: React.FC<ConcreteMixInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <UnitInput
          label="Target Compressive Strength f'c"
          category="pressure"
          siValue={activeWorkspace.concrete.targetStrengthMpa * 1000000}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              concrete: { ...ws.concrete, targetStrengthMpa: val / 1000000 },
            }));
          }}
          currentUnitId={getFieldUnit('mix.fc', 'pressure', 'MPa')}
          onUnitChange={(u) => updateFieldUnit('mix.fc', u)}
          customUnits={customUnits}
          step={5}
        />
        <UnitInput
          label="Slump Requirement"
          category="length"
          siValue={activeWorkspace.concrete.slumpMm * 0.001}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              concrete: { ...ws.concrete, slumpMm: val * 1000 },
            }));
          }}
          currentUnitId={getFieldUnit('mix.slump', 'length', 'mm')}
          onUnitChange={(u) => updateFieldUnit('mix.slump', u)}
          customUnits={customUnits}
          step={25}
        />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <UnitInput
          label="Batch Volume"
          category="volume"
          siValue={activeWorkspace.concrete.batchVolumeM3 || 1.0}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              concrete: { ...ws.concrete, batchVolumeM3: val },
            }));
          }}
          currentUnitId={getFieldUnit('mix.vol', 'volume', 'm3')}
          onUnitChange={(u) => updateFieldUnit('mix.vol', u)}
          customUnits={customUnits}
          step={0.5}
        />
        <div>
          <label className="block text-xs font-semibold mb-1">Water-Cement Ratio (w/c)</label>
          <input
            type="number"
            step="0.01"
            min="0.30"
            max="0.75"
            value={activeWorkspace.concrete.waterCementRatio}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                concrete: { ...ws.concrete, waterCementRatio: val },
              }));
            }}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          />
        </div>
        <UnitInput
          label="Max Agg Size"
          category="length"
          siValue={(activeWorkspace.concrete.maxAggregateSizeMm || 20) * 0.001}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              concrete: { ...ws.concrete, maxAggregateSizeMm: val * 1000 },
            }));
          }}
          currentUnitId={getFieldUnit('mix.aggSize', 'length', 'mm')}
          onUnitChange={(u) => updateFieldUnit('mix.aggSize', u)}
          customUnits={customUnits}
          step={5}
        />
      </div>
    </div>
  );
};

export interface ConcreteMixMetricsProps {
  result: ConcreteMixResult;
  activeWorkspace: CivilWorkspace;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
}

export const ConcreteMixMetrics: React.FC<ConcreteMixMetricsProps> = ({
  result,
  activeWorkspace,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <UnitValueDisplay
        label="Mixing Water Demand"
        category="mass"
        siValue={result.batchWaterKg}
        currentUnitId={getOutputUnit('mix.out.water', 'mass', 'kg')}
        onUnitChange={(u) => updateOutputUnit('mix.out.water', u)}
        customUnits={customUnits}
        subText={`W/C ratio = ${activeWorkspace.concrete.waterCementRatio.toFixed(2)}`}
      />
      <UnitValueDisplay
        label="Cement Content"
        category="mass"
        siValue={result.batchCementKg}
        currentUnitId={getOutputUnit('mix.out.cement', 'mass', 'bag50')}
        onUnitChange={(u) => updateOutputUnit('mix.out.cement', u)}
        customUnits={customUnits}
        highlight={true}
        subText={`Target: ${activeWorkspace.concrete.targetStrengthMpa} MPa`}
      />
      <UnitValueDisplay
        label="Coarse Agg Dry Mass"
        category="mass"
        siValue={result.batchCoarseAggKg}
        currentUnitId={getOutputUnit('mix.out.coarse', 'mass', 'kg')}
        onUnitChange={(u) => updateOutputUnit('mix.out.coarse', u)}
        customUnits={customUnits}
      />
      <UnitValueDisplay
        label="Fine Agg Dry Mass"
        category="mass"
        siValue={result.batchFineAggKg}
        currentUnitId={getOutputUnit('mix.out.fine', 'mass', 'kg')}
        onUnitChange={(u) => updateOutputUnit('mix.out.fine', u)}
        customUnits={customUnits}
      />
    </div>
  );
};
