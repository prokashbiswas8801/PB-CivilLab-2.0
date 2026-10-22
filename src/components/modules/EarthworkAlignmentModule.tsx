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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
            presets={[
              { label: '3.0 m', valueSI: 3.0, title: 'Single Footing Pit' },
              { label: '6.0 m', valueSI: 6.0, title: 'Combined Pit' },
              { label: '12.0 m', valueSI: 12.0, title: 'Raft Foundation Excavation' },
            ]}
            standardRef="BNBC 2020 Part 7 / OSHA 1926 Subpart P"
            recommendedRange="2.0 m – 30.0 m"
            designTip="Include working clearance (min 0.6m each side) outside formwork line."
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
            presets={[
              { label: '3.0 m', valueSI: 3.0, title: 'Single Footing Pit' },
              { label: '6.0 m', valueSI: 6.0, title: 'Combined Pit' },
              { label: '10.0 m', valueSI: 10.0, title: 'Basement Pit' },
            ]}
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
            presets={[
              { label: '1.5 m (5 ft)', valueSI: 1.5, title: 'OSHA max un-shored vertical trench depth' },
              { label: '2.5 m (8 ft)', valueSI: 2.5, title: 'Standard Basement Depth' },
              { label: '4.0 m (13 ft)', valueSI: 4.0, title: 'Deep Basement / Underground Tank' },
            ]}
            validationRule={{
              minSI: 0.2,
              maxSI: 25.0,
              warningAboveSI: 1.5,
              warningHint: 'Safety Warning: Excavations deeper than 1.5m (5 ft) require shoring, sheet piling, or safe slope angle under OSHA & BNBC 2020 Part 7.',
            }}
            standardRef="OSHA 1926.652 / BNBC 2020 Part 7"
            recommendedRange="1.0 m – 5.0 m"
            designTip="For depths > 1.5m without shoring, side slopes must be battered (e.g. 1:1 for Type B soils)."
          />
        </div>
      )}

      {activeWorkspace.earthwork.calculationType === 'trapezoidal-trench' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
            step={5}
            presets={[
              { label: '25 m', valueSI: 25, title: 'Short Pipe Laying' },
              { label: '50 m', valueSI: 50, title: 'Standard Sewer Run' },
              { label: '150 m', valueSI: 150, title: 'Street Utility Trench' },
            ]}
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
            presets={[
              { label: '0.8 m (32")', valueSI: 0.8, title: 'Small Water / Gas Pipe Trench' },
              { label: '1.2 m (4 ft)', valueSI: 1.2, title: 'Medium Sewer / Storm Drain' },
              { label: '2.0 m (6.5 ft)', valueSI: 2.0, title: 'Large Culvert / Foundation Trench' },
            ]}
            standardRef="BNBC 2020 Part 7"
            recommendedRange="0.6 m – 3.0 m"
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
            presets={[
              { label: '1.2 m (4 ft)', valueSI: 1.2, title: 'Frost Safe Utility Depth' },
              { label: '1.8 m (6 ft)', valueSI: 1.8, title: 'Standard Gravity Sewer Depth' },
              { label: '3.0 m (10 ft)', valueSI: 3.0, title: 'Deep Trunk Sewer' },
            ]}
            validationRule={{
              minSI: 0.2,
              maxSI: 15.0,
              warningAboveSI: 1.5,
              warningHint: 'Trench safety alert: Depths > 1.5m mandate trench boxes, hydraulic shoring, or stepped benching.',
            }}
          />
        </div>
      )}

      {activeWorkspace.earthwork.calculationType === 'prismoidal-road' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
            step={25}
            presets={[
              { label: '50 m', valueSI: 50, title: 'Cul-de-sac / Internal Access' },
              { label: '200 m', valueSI: 200, title: 'Residential Street Block' },
              { label: '1,000 m (1 km)', valueSI: 1000, title: 'Highway Kilometer Section' },
            ]}
            standardRef="AASHTO Green Book / RHD Bangladesh"
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
            presets={[
              { label: '5.5 m', valueSI: 5.5, title: 'Single Lane + Earthen Shoulders' },
              { label: '7.3 m', valueSI: 7.3, title: 'Standard Two-Lane Carriageway' },
              { label: '10.3 m', valueSI: 10.3, title: 'Two-Lane Highway with Paved Shoulders' },
              { label: '14.0 m', valueSI: 14.0, title: 'Four-Lane Sub-arterial' },
            ]}
            standardRef="AASHTO / RHD Standard Geometric Design"
            recommendedRange="5.5 m – 24.0 m"
            designTip="Formation width is total embankment width at finished road formation level, including shoulders."
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
