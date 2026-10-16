import {
  CivilWorkspace,
  StructuralElementType,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { RebarBBSResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';

export interface RebarBbsInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

export const RebarBbsInputs: React.FC<RebarBbsInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5">RCC Element Type</label>
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[var(--md-sys-color-surface-container)]">
          {(['slab', 'column', 'footing'] as StructuralElementType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rebarBbs: { ...ws.rebarBbs, elementType: type },
                }))
              }
              className={`touch-target-48 px-2 rounded-md text-xs font-semibold capitalize cursor-pointer ${
                activeWorkspace.rebarBbs.elementType === type
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-xs font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {activeWorkspace.rebarBbs.elementType === 'slab' && (
        <div className="grid grid-cols-2 gap-3">
          <UnitInput
            label="Slab Length"
            category="length"
            siValue={activeWorkspace.rebarBbs.slabLengthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                rebarBbs: { ...ws.rebarBbs, slabLengthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('rebar.slabLength', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('rebar.slabLength', u)}
            customUnits={customUnits}
            step={0.25}
          />
          <UnitInput
            label="Main Bar Dia"
            category="length"
            siValue={activeWorkspace.rebarBbs.mainBarDiaMm * 0.001}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                rebarBbs: { ...ws.rebarBbs, mainBarDiaMm: val * 1000 },
              }));
            }}
            currentUnitId={getFieldUnit('rebar.mainDia', 'length', 'mm')}
            onUnitChange={(u) => updateFieldUnit('rebar.mainDia', u)}
            customUnits={customUnits}
            step={2}
          />
        </div>
      )}
    </div>
  );
};

export interface RebarBbsMetricsProps {
  result: RebarBBSResult;
  activeWorkspace: CivilWorkspace;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
}

export const RebarBbsMetrics: React.FC<RebarBbsMetricsProps> = ({
  result,
  activeWorkspace,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <UnitValueDisplay
        label="Total Steel Weight"
        category="mass"
        siValue={result.totalSteelWeightKg}
        currentUnitId={getOutputUnit('rebar.out.mass', 'mass', 'kg')}
        onUnitChange={(u) => updateOutputUnit('rebar.out.mass', u)}
        customUnits={customUnits}
        highlight={true}
      />
      <UnitValueDisplay
        label="Total Bar Length"
        category="length"
        siValue={result.totalBarsLengthM}
        currentUnitId={getOutputUnit('rebar.out.len', 'length', 'm')}
        onUnitChange={(u) => updateOutputUnit('rebar.out.len', u)}
        customUnits={customUnits}
      />
      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Total Steel Tonnes</div>
        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
          {result.totalSteelTonnes.toFixed(3)} <span className="text-xs font-normal">MT</span>
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          Density: {result.steelDensityKgPerM3} kg/m³
        </div>
      </div>
      <UnitValueDisplay
        label="Total Bend Deductions"
        category="length"
        siValue={result.items.reduce((s: number, it) => s + (it.bendDeductionM || 0), 0)}
        currentUnitId={getOutputUnit('rebar.out.bend', 'length', 'm')}
        onUnitChange={(u) => updateOutputUnit('rebar.out.bend', u)}
        customUnits={customUnits}
        subText={`Hook: ${activeWorkspace.rebarBbs.hookAngle}° standard`}
      />
    </div>
  );
};
