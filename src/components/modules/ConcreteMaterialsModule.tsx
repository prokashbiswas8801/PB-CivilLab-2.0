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
            min={0.1}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">Volumetric Mix Ratio (Cement : Sand : Agg)</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            step="0.25"
            value={activeWorkspace.concreteMaterials.ratioCement}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                concreteMaterials: { ...ws.concreteMaterials, ratioCement: val },
              }));
            }}
            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm"
          />
          <input
            type="number"
            step="0.25"
            value={activeWorkspace.concreteMaterials.ratioSand}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                concreteMaterials: { ...ws.concreteMaterials, ratioSand: val },
              }));
            }}
            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm"
          />
          <input
            type="number"
            step="0.25"
            value={activeWorkspace.concreteMaterials.ratioAggregate}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                concreteMaterials: { ...ws.concreteMaterials, ratioAggregate: val },
              }));
            }}
            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm"
          />
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
