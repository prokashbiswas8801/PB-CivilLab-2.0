import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { MasonryResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';

export interface MasonryFinishesInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

export const MasonryFinishesInputs: React.FC<MasonryFinishesInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <UnitInput
          label="Wall Length"
          category="length"
          siValue={activeWorkspace.masonry.wallLengthM}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              masonry: { ...ws.masonry, wallLengthM: val },
            }));
          }}
          currentUnitId={getFieldUnit('mas.wallL', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('mas.wallL', u)}
          customUnits={customUnits}
          step={0.5}
        />
        <UnitInput
          label="Wall Height"
          category="length"
          siValue={activeWorkspace.masonry.wallHeightM}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              masonry: { ...ws.masonry, wallHeightM: val },
            }));
          }}
          currentUnitId={getFieldUnit('mas.wallH', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('mas.wallH', u)}
          customUnits={customUnits}
          step={0.2}
        />
        <UnitInput
          label="Thickness"
          category="length"
          siValue={activeWorkspace.masonry.wallThicknessM}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              masonry: { ...ws.masonry, wallThicknessM: val },
            }));
          }}
          currentUnitId={getFieldUnit('mas.wallT', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('mas.wallT', u)}
          customUnits={customUnits}
          step={0.125}
        />
      </div>
    </div>
  );
};

export interface MasonryFinishesMetricsProps {
  result: MasonryResult;
  activeWorkspace: CivilWorkspace;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
}

export const MasonryFinishesMetrics: React.FC<MasonryFinishesMetricsProps> = ({
  result,
  activeWorkspace,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-primary-container)]/30 border-[var(--md-sys-color-primary)]">
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Modular Bricks</div>
        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-primary)] mt-0.5">
          {result.bricksWithWastageCount.toLocaleString()} <span className="text-xs font-normal">nos</span>
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          Net Wall Area: {result.netWallAreaM2.toFixed(2)} m²
        </div>
      </div>
      <UnitValueDisplay
        label="Dry Wall Mortar"
        category="volume"
        siValue={result.mortarVolumeDryM3}
        currentUnitId={getOutputUnit('mas.out.mortar', 'volume', 'm3')}
        onUnitChange={(u) => updateOutputUnit('mas.out.mortar', u)}
        customUnits={customUnits}
      />
      <UnitValueDisplay
        label="Plaster Dry Mortar"
        category="volume"
        siValue={result.plasterDryVolM3}
        currentUnitId={getOutputUnit('mas.out.plaster', 'volume', 'm3')}
        onUnitChange={(u) => updateOutputUnit('mas.out.plaster', u)}
        customUnits={customUnits}
      />
      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Floor Tiles Required</div>
        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
          {result.tileBoxesCount} <span className="text-xs font-normal">boxes</span>
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          {result.tilesWithWastageCount} tiles ({activeWorkspace.masonry.tilesPerBox}/box)
        </div>
      </div>
    </div>
  );
};
