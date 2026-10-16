import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { EarthworkResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';

export interface EarthworkAlignmentInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

export const EarthworkAlignmentInputs: React.FC<EarthworkAlignmentInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5">Calculation Type</label>
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[var(--md-sys-color-surface-container)]">
          {(
            [
              { id: 'pit-excavation', label: 'Sloped Pit' },
              { id: 'trapezoidal-trench', label: 'Trench' },
              { id: 'prismoidal-road', label: 'Road Align' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  earthwork: { ...ws.earthwork, calculationType: t.id },
                }))
              }
              className={`touch-target-48 px-1 rounded-md text-xs font-semibold cursor-pointer ${
                activeWorkspace.earthwork.calculationType === t.id
                  ? 'bg-[var(--md-sys-color-surface)] font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeWorkspace.earthwork.calculationType === 'pit-excavation' && (
        <div className="grid grid-cols-3 gap-2">
          <UnitInput
            label="Pit Top Length"
            category="length"
            siValue={activeWorkspace.earthwork.pitTopLengthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, pitTopLengthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.pitL', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.pitL', u)}
            customUnits={customUnits}
            step={0.5}
          />
          <UnitInput
            label="Pit Top Width"
            category="length"
            siValue={activeWorkspace.earthwork.pitTopWidthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, pitTopWidthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.pitW', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.pitW', u)}
            customUnits={customUnits}
            step={0.5}
          />
          <UnitInput
            label="Excavation Depth"
            category="length"
            siValue={activeWorkspace.earthwork.pitDepthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, pitDepthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.pitD', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.pitD', u)}
            customUnits={customUnits}
            step={0.2}
          />
        </div>
      )}

      {activeWorkspace.earthwork.calculationType === 'trapezoidal-trench' && (
        <div className="grid grid-cols-3 gap-2">
          <UnitInput
            label="Trench Length"
            category="length"
            siValue={activeWorkspace.earthwork.trenchLengthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, trenchLengthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.trenchL', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.trenchL', u)}
            customUnits={customUnits}
            step={1}
          />
          <UnitInput
            label="Bottom Width"
            category="length"
            siValue={activeWorkspace.earthwork.trenchBottomWidthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, trenchBottomWidthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.trenchW', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.trenchW', u)}
            customUnits={customUnits}
            step={0.25}
          />
          <UnitInput
            label="Trench Depth"
            category="length"
            siValue={activeWorkspace.earthwork.trenchDepthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, trenchDepthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.trenchD', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.trenchD', u)}
            customUnits={customUnits}
            step={0.2}
          />
        </div>
      )}

      {activeWorkspace.earthwork.calculationType === 'prismoidal-road' && (
        <div className="grid grid-cols-2 gap-2">
          <UnitInput
            label="Road Align Length"
            category="length"
            siValue={activeWorkspace.earthwork.roadLengthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, roadLengthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.roadL', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.roadL', u)}
            customUnits={customUnits}
            step={5}
          />
          <UnitInput
            label="Formation Width"
            category="length"
            siValue={activeWorkspace.earthwork.formationWidthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, formationWidthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.roadW', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.roadW', u)}
            customUnits={customUnits}
            step={0.5}
          />
        </div>
      )}
    </div>
  );
};

export interface EarthworkAlignmentMetricsProps {
  result: EarthworkResult;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
}

export const EarthworkAlignmentMetrics: React.FC<EarthworkAlignmentMetricsProps> = ({
  result,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <UnitValueDisplay
        label="In-Situ Cut/Fill Volume"
        category="volume"
        siValue={result.bankVolumeM3}
        currentUnitId={getOutputUnit('earth.out.insitu', 'volume', 'm3')}
        onUnitChange={(u) => updateOutputUnit('earth.out.insitu', u)}
        customUnits={customUnits}
        highlight={true}
      />
      <UnitValueDisplay
        label="Bulked Haul Volume"
        category="volume"
        siValue={result.looseVolumeM3}
        currentUnitId={getOutputUnit('earth.out.swelled', 'volume', 'm3')}
        onUnitChange={(u) => updateOutputUnit('earth.out.swelled', u)}
        customUnits={customUnits}
      />
      <UnitValueDisplay
        label="Compacted Embankment"
        category="volume"
        siValue={result.compactedVolumeM3}
        currentUnitId={getOutputUnit('earth.out.compacted', 'volume', 'm3')}
        onUnitChange={(u) => updateOutputUnit('earth.out.compacted', u)}
        customUnits={customUnits}
      />
      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Dump Truck Trips</div>
        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
          {result.haulTruckTripsCount10M3} <span className="text-xs font-normal">loads</span>
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          Basis: 10 m³ tipper truck
        </div>
      </div>
    </div>
  );
};
