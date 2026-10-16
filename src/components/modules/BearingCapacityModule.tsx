import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { BearingAnalysisResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';

export interface BearingCapacityInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

export const BearingCapacityInputs: React.FC<BearingCapacityInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-xs font-semibold mb-1">Footing Shape</label>
          <select
            value={activeWorkspace.bearing.footingShape}
            onChange={(e) => {
              const shape = e.target.value as 'square' | 'strip' | 'circular' | 'rectangular';
              updateActiveWorkspace((ws) => ({
                ...ws,
                bearing: { ...ws.bearing, footingShape: shape },
              }));
            }}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          >
            <option value="square">Square Footing (B × B)</option>
            <option value="strip">Strip / Wall Footing</option>
            <option value="circular">Circular Pier Footing</option>
            <option value="rectangular">Rectangular Footing</option>
          </select>
        </div>
        <UnitInput
          label="Footing Width B"
          category="length"
          siValue={activeWorkspace.bearing.footingWidthM}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              bearing: { ...ws.bearing, footingWidthM: val },
            }));
          }}
          currentUnitId={getFieldUnit('bearing.B', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('bearing.B', u)}
          customUnits={customUnits}
          step={0.2}
        />
        <UnitInput
          label="Embedment Depth Df"
          category="length"
          siValue={activeWorkspace.bearing.embedmentDepthM}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              bearing: { ...ws.bearing, embedmentDepthM: val },
            }));
          }}
          currentUnitId={getFieldUnit('bearing.Df', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('bearing.Df', u)}
          customUnits={customUnits}
          step={0.2}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <UnitInput
          label="Column Load P"
          category="force"
          siValue={activeWorkspace.bearing.appliedColumnLoadKn * 1000}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              bearing: { ...ws.bearing, appliedColumnLoadKn: val / 1000 },
            }));
          }}
          currentUnitId={getFieldUnit('bearing.load', 'force', 'kN')}
          onUnitChange={(u) => updateFieldUnit('bearing.load', u)}
          customUnits={customUnits}
          step={50}
        />
        <UnitInput
          label="Soil Cohesion c"
          category="pressure"
          siValue={activeWorkspace.bearing.soilCohesionKpa * 1000}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              bearing: { ...ws.bearing, soilCohesionKpa: val / 1000 },
            }));
          }}
          currentUnitId={getFieldUnit('bearing.cohesion', 'pressure', 'kPa')}
          onUnitChange={(u) => updateFieldUnit('bearing.cohesion', u)}
          customUnits={customUnits}
          step={5}
        />
        <UnitInput
          label="Soil Unit Weight γ"
          category="density"
          siValue={activeWorkspace.bearing.unitWeightKnPerM3}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              bearing: { ...ws.bearing, unitWeightKnPerM3: val },
            }));
          }}
          currentUnitId={getFieldUnit('bearing.gamma', 'density', 'kN/m3')}
          onUnitChange={(u) => updateFieldUnit('bearing.gamma', u)}
          customUnits={customUnits}
          step={0.5}
        />
        <UnitInput
          label="Water Table Depth"
          category="length"
          siValue={activeWorkspace.bearing.waterTableDepthM}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              bearing: { ...ws.bearing, waterTableDepthM: val },
            }));
          }}
          currentUnitId={getFieldUnit('bearing.water', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('bearing.water', u)}
          customUnits={customUnits}
          step={0.5}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-semibold mb-1">Friction Angle φ (°)</label>
          <input
            type="number"
            step="1"
            min="0"
            max="50"
            value={activeWorkspace.bearing.frictionAngleDeg}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                bearing: { ...ws.bearing, frictionAngleDeg: val },
              }));
            }}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Factor of Safety (FS)</label>
          <input
            type="number"
            step="0.1"
            min="1.0"
            max="10.0"
            value={activeWorkspace.bearing.factorOfSafety}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                bearing: { ...ws.bearing, factorOfSafety: val },
              }));
            }}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          />
        </div>
      </div>
    </div>
  );
};

export interface BearingCapacityMetricsProps {
  result: BearingAnalysisResult;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
}

export const BearingCapacityMetrics: React.FC<BearingCapacityMetricsProps> = ({
  result,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <UnitValueDisplay
        label="Allowable Pressure (qall)"
        category="pressure"
        siValue={result.allowableBearingKpa * 1000}
        currentUnitId={getOutputUnit('bearing.out.qall', 'pressure', 'kPa')}
        onUnitChange={(u) => updateOutputUnit('bearing.out.qall', u)}
        customUnits={customUnits}
        highlight={true}
      />
      <UnitValueDisplay
        label="Ultimate Bearing (qult)"
        category="pressure"
        siValue={result.ultimateBearingKpa * 1000}
        currentUnitId={getOutputUnit('bearing.out.qult', 'pressure', 'kPa')}
        onUnitChange={(u) => updateOutputUnit('bearing.out.qult', u)}
        customUnits={customUnits}
      />
      <UnitValueDisplay
        label="Applied Pressure (qapp)"
        category="pressure"
        siValue={result.appliedPressureKpa * 1000}
        currentUnitId={getOutputUnit('bearing.out.qapp', 'pressure', 'kPa')}
        onUnitChange={(u) => updateOutputUnit('bearing.out.qapp', u)}
        customUnits={customUnits}
      />
      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Safety Factor</div>
        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
          FS = {result.effectiveSafetyFactor.toFixed(2)}
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          Footing Area: {result.footingAreaM2.toFixed(2)} m²
        </div>
      </div>
    </div>
  );
};
