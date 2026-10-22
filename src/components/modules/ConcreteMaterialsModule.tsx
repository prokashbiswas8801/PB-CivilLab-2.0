import {
  CivilWorkspace,
  BuildingCode,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { ConcreteMaterialResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';

export interface ConcreteMaterialsInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

export const ConcreteMaterialsInputs: React.FC<ConcreteMaterialsInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1">Building Code</label>
          <select
            value={activeWorkspace.concreteMaterials.code}
            onChange={(e) => {
              const val = e.target.value as BuildingCode;
              updateActiveWorkspace((ws) => ({
                ...ws,
                governingCode: val,
                concreteMaterials: { ...ws.concreteMaterials, code: val },
              }));
            }}
            className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
          >
            <option value="BNBC-2020">BNBC-2020</option>
            <option value="ACI-318">ACI-318</option>
            <option value="IS-456">IS-456</option>
          </select>
        </div>
        <div>
          <UnitInput
            label="Wet Concrete Volume"
            category="volume"
            siValue={activeWorkspace.concreteMaterials.wetVolumeM3}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                concreteMaterials: { ...ws.concreteMaterials, wetVolumeM3: val },
              }));
            }}
            currentUnitId={getFieldUnit('mat.wetVolume', 'volume', 'm3')}
            onUnitChange={(u) => updateFieldUnit('mat.wetVolume', u)}
            customUnits={customUnits}
            step={0.5}
            presets={[
              { label: '1.0 m³', valueSI: 1.0, title: 'Unit Volume Check (1 m³)' },
              { label: '6.0 m³', valueSI: 6.0, title: 'Standard Transit Mixer Truck' },
              { label: '15.0 m³', valueSI: 15.0, title: 'Beam & Slab Casting Section' },
              { label: '30.0 m³', valueSI: 30.0, title: 'Complete Floor Pour' },
            ]}
            validationRule={{
              minSI: 0.1,
              maxSI: 1000.0,
              warningAboveSI: 200.0,
              warningHint: 'Large batch volume exceeding 200 m³ typically requires continuous ready-mix supply with retarder admixtures.',
            }}
            standardRef="BNBC 2020 Part 6 / ACI 318"
            recommendedRange="1 m³ – 50 m³"
            designTip="Dry factor 1.54 is automatically applied to compute loose dry ingredients."
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold">Volumetric Mix Ratio (Cement : Sand : Agg)</label>
          <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
            Dry Factor: {activeWorkspace.concreteMaterials.customDryFactor || 1.54}
          </span>
        </div>

        {/* Quick Standard Mix Ratio Chips */}
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto">
          {[
            { label: '1 : 1.5 : 3 (M20 RCC)', c: 1, s: 1.5, a: 3, title: 'Standard Structural RCC (20 MPa)' },
            { label: '1 : 1 : 2 (M25 Column)', c: 1, s: 1, a: 2, title: 'Heavy RCC Columns & Water Tanks' },
            { label: '1 : 2 : 4 (M15 General)', c: 1, s: 2, a: 4, title: 'General Plain / Mass Concrete' },
            { label: '1 : 3 : 6 (PCC Lean)', c: 1, s: 3, a: 6, title: 'Lean Concrete Under Footings' },
          ].map((item) => {
            const isSelected =
              activeWorkspace.concreteMaterials.ratioCement === item.c &&
              activeWorkspace.concreteMaterials.ratioSand === item.s &&
              activeWorkspace.concreteMaterials.ratioAggregate === item.a;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    concreteMaterials: {
                      ...ws.concreteMaterials,
                      ratioCement: item.c,
                      ratioSand: item.s,
                      ratioAggregate: item.a,
                    },
                  }));
                }}
                className={`min-h-[32px] px-2.5 py-1 text-[11px] font-mono rounded-md border whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--md-sys-color-primary)] text-white border-transparent font-bold'
                    : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
                title={item.title}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Cement Part
            </span>
            <input
              type="number"
              step="0.25"
              min="0.5"
              value={activeWorkspace.concreteMaterials.ratioCement}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  concreteMaterials: { ...ws.concreteMaterials, ratioCement: val },
                }));
              }}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Sand (Fine Agg)
            </span>
            <input
              type="number"
              step="0.25"
              min="0.5"
              value={activeWorkspace.concreteMaterials.ratioSand}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  concreteMaterials: { ...ws.concreteMaterials, ratioSand: val },
                }));
              }}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Stone/Brick (Coarse)
            </span>
            <input
              type="number"
              step="0.25"
              min="0"
              value={activeWorkspace.concreteMaterials.ratioAggregate}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  concreteMaterials: { ...ws.concreteMaterials, ratioAggregate: val },
                }));
              }}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export interface ConcreteMaterialsMetricsProps {
  result: ConcreteMaterialResult;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
}

export const ConcreteMaterialsMetrics: React.FC<ConcreteMaterialsMetricsProps> = ({
  result,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <UnitValueDisplay
        label="Total Dry Volume"
        category="volume"
        siValue={result.totalDryVolumeWithWastageM3}
        currentUnitId={getOutputUnit('mat.out.vol', 'volume', 'm3')}
        onUnitChange={(u) => updateOutputUnit('mat.out.vol', u)}
        customUnits={customUnits}
      />
      <UnitValueDisplay
        label="Cement Required"
        category="mass"
        siValue={result.cementMassKg}
        currentUnitId={getOutputUnit('mat.out.cement', 'mass', 'bag50')}
        onUnitChange={(u) => updateOutputUnit('mat.out.cement', u)}
        customUnits={customUnits}
        highlight={true}
      />
      <UnitValueDisplay
        label="Fine Sand Volume"
        category="volume"
        siValue={result.sandVolumeM3}
        currentUnitId={getOutputUnit('mat.out.sand', 'volume', 'cft')}
        onUnitChange={(u) => updateOutputUnit('mat.out.sand', u)}
        customUnits={customUnits}
      />
      <UnitValueDisplay
        label="Coarse Agg Volume"
        category="volume"
        siValue={result.aggregateVolumeM3}
        currentUnitId={getOutputUnit('mat.out.agg', 'volume', 'cft')}
        onUnitChange={(u) => updateOutputUnit('mat.out.agg', u)}
        customUnits={customUnits}
      />
    </div>
  );
};
