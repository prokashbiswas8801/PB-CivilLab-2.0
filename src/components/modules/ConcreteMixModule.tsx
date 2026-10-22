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
  const concreteStrengthPresets = [
    { label: 'C20 (20 MPa)', valueSI: 20 * 1e6, title: 'Standard Residential / Low-rise Slabs' },
    { label: 'C25 (25 MPa)', valueSI: 25 * 1e6, title: 'Multi-story Frames & Structural Beams' },
    { label: 'C30 (30 MPa)', valueSI: 30 * 1e6, title: 'Commercial Columns & Heavy Foundations' },
    { label: 'C35 (35 MPa)', valueSI: 35 * 1e6, title: 'High-rise Shear Walls & Water Retaining' },
    { label: 'C40 (40 MPa)', valueSI: 40 * 1e6, title: 'Prestressed & Severe Marine Exposure' },
  ];

  const slumpPresets = [
    { label: '25mm (Pave)', valueSI: 0.025, title: 'Pavements & Vibrated Road Slabs (1")' },
    { label: '75mm (Beams)', valueSI: 0.075, title: 'Normal Reinforced Beams & Slabs (3")' },
    { label: '125mm (Cols)', valueSI: 0.125, title: 'Congested Columns & Retaining Walls (5")' },
    { label: '175mm (Pump)', valueSI: 0.175, title: 'Pumped Concrete & Tremie Cast Piles (7")' },
  ];

  const batchVolPresets = [
    { label: '0.5 m³', valueSI: 0.5 },
    { label: '1.0 m³', valueSI: 1.0 },
    { label: '3.0 m³', valueSI: 3.0 },
    { label: '6.0 m³ (Truck)', valueSI: 6.0 },
  ];

  const wcPresets = [0.40, 0.45, 0.50, 0.55];

  const wcValue = activeWorkspace.concrete.waterCementRatio;
  const wcValidation = wcValue > 0.60
    ? { status: 'warning' as const, hint: 'W/C > 0.60 reduces durability and increases permeability under ACI 318 / BNBC 2020.' }
    : wcValue < 0.35
    ? { status: 'warning' as const, hint: 'W/C < 0.35 has low workability; superplasticizers / high-range water reducers mandatory.' }
    : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
          presets={concreteStrengthPresets}
          tooltip={{
            explanation: "Specified 28-day cylinder compressive strength of concrete under standard curing.",
            standardRef: 'BNBC 2020 Part 6, §5.2 · ACI 318-19 Table 19.2.1.1',
            recommendedRange: '20 – 40 MPa (Min 20 MPa for seismic frame ductility)',
            designTip: 'Design strength includes required overdesign margin (fcr = fc + 8.3 MPa for fc ≤ 35 MPa).',
          }}
          validationRule={{
            minSI: 10 * 1e6,
            maxSI: 100 * 1e6,
            warningBelowSI: 17 * 1e6,
            warningAboveSI: 60 * 1e6,
            warningHint: "Strength below 17 MPa is non-compliant for structural RCC under BNBC 2020.",
          }}
        />

        <UnitInput
          label="Slump Requirement (Workability)"
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
          presets={slumpPresets}
          tooltip={{
            explanation: "Measures fresh concrete consistency and workability before placement.",
            standardRef: 'ASTM C143 / ACI 211.1 Table 6.3.1',
            recommendedRange: '50 – 100 mm for normal slabs; 120 – 160 mm for pumped concrete',
            designTip: 'Never add jobsite water to increase slump; use water-reducing plasticizers to prevent loss of strength.',
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          presets={batchVolPresets}
          tooltip={{
            explanation: "Target production batch volume for material takeoff and weigh-batching scale.",
            standardRef: 'ACI 304R Guide for Measuring & Mixing Concrete',
            recommendedRange: '1.0 m³ standard commercial yield',
          }}
        />

        {/* W/C Ratio with Presets & Guidance */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
              Water-Cement Ratio (w/c)
            </label>
            <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] font-bold">
              {wcValue <= 0.45 ? 'Low Permeability' : wcValue <= 0.55 ? 'Normal RCC' : 'High Porosity'}
            </span>
          </div>
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
            className="w-full min-h-[48px] touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
          />
          {/* Quick w/c presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[9.5px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] shrink-0">
              Presets:
            </span>
            {wcPresets.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => updateActiveWorkspace((ws) => ({ ...ws, concrete: { ...ws.concrete, waterCementRatio: r } }))}
                className="px-2 py-0.5 text-[10.5px] font-mono rounded bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer btn-tactile"
              >
                {r.toFixed(2)}
              </button>
            ))}
          </div>
          {wcValidation && (
            <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400 leading-tight">
              ⚠️ {wcValidation.hint}
            </p>
          )}
        </div>

        <UnitInput
          label="Max Aggregate Size (Dmax)"
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
          presets={[
            { label: '12.5mm (1/2")', valueSI: 0.0125 },
            { label: '20mm (3/4")', valueSI: 0.020 },
            { label: '25mm (1")', valueSI: 0.025 },
          ]}
          tooltip={{
            explanation: "Nominal maximum coarse aggregate size. Governed by minimum clear spacing between rebar.",
            standardRef: 'ACI 318-19 §26.4.2.1 / ASTM C33',
            recommendedRange: '≤ 1/5 narrowest dimension or 3/4 clear spacing',
          }}
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
