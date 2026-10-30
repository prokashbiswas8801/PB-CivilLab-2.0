import React, { useState } from 'react';
import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { MasonryResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';
import { MaterialTakeoff } from '../calculators/construction/MaterialTakeoff';
import { FileSpreadsheet, Box } from 'lucide-react';

export { MaterialTakeoff };

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
  const [takeoffMode, setTakeoffMode] = useState<'suite' | 'single'>('suite');

  return (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between p-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        <button
          type="button"
          onClick={() => setTakeoffMode('suite')}
          className={`flex-1 min-h-[44px] touch-target-48 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            takeoffMode === 'suite'
              ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-500" />
          <span>Multi-Trade Material Takeoff &amp; Labor Suite</span>
        </button>
        <button
          type="button"
          onClick={() => setTakeoffMode('single')}
          className={`flex-1 min-h-[44px] touch-target-48 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            takeoffMode === 'single'
              ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <Box className="w-4 h-4 text-sky-500" />
          <span>Single Wall Sizer</span>
        </button>
      </div>

      {takeoffMode === 'suite' ? (
        <MaterialTakeoff />
      ) : (
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
      )}
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
