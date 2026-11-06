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
          <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
            <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
              Brick Masonry Wall Section & Dimensions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                presets={[
                  { label: '5.0 m (16 ft)', valueSI: 5.0, title: 'Standard Room Wall' },
                  { label: '10.0 m (33 ft)', valueSI: 10.0, title: 'Medium Run Wall' },
                  { label: '15.0 m (50 ft)', valueSI: 15.0, title: 'Boundary / Long Wall' },
                ]}
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
                presets={[
                  { label: '2.7 m (9 ft)', valueSI: 2.7, title: 'Low Story Height' },
                  { label: '3.0 m (10 ft)', valueSI: 3.0, title: 'Standard Story Height' },
                  { label: '3.6 m (12 ft)', valueSI: 3.6, title: 'Commercial Story Height' },
                ]}
              />
              <UnitInput
                label="Wall Thickness"
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
                presets={[
                  { label: '125 mm (5")', valueSI: 0.125, title: '5" Partition Wall' },
                  { label: '250 mm (10")', valueSI: 0.250, title: '10" Main Load-Bearing Wall' },
                ]}
              />
            </div>
          </div>

          {/* Wall Openings: Doors, Windows, Veranda Grills */}
          <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
                Wall Openings, MS Grills &amp; Thai Aluminum Schedule
              </div>
              <button
                type="button"
                onClick={() => {
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    masonry: {
                      ...ws.masonry,
                      openings: [
                        ...(ws.masonry.openings || []),
                        {
                          id: `op-${Date.now()}`,
                          name: `Window W${(ws.masonry.openings?.length || 0) + 1}`,
                          widthM: 1.5,
                          heightM: 1.35,
                          count: 1,
                          type: 'window',
                          includeGrill: true,
                          includeThaiAluminum: true,
                        },
                      ],
                    },
                  }));
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 cursor-pointer transition-opacity"
              >
                + Add Opening
              </button>
            </div>

            <div className="space-y-2">
              {(activeWorkspace.masonry.openings || []).map((op, idx) => (
                <div
                  key={op.id || idx}
                  className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] grid grid-cols-1 sm:grid-cols-6 gap-2 items-center text-xs"
                >
                  <input
                    type="text"
                    value={op.name}
                    onChange={(e) => {
                      const updated = [...(activeWorkspace.masonry.openings || [])];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      updateActiveWorkspace((ws) => ({ ...ws, masonry: { ...ws.masonry, openings: updated } }));
                    }}
                    className="sm:col-span-2 px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-medium"
                    placeholder="e.g. Window W1"
                  />
                  <select
                    value={op.type || 'window'}
                    onChange={(e) => {
                      const updated = [...(activeWorkspace.masonry.openings || [])];
                      const newType = e.target.value as any;
                      updated[idx] = {
                        ...updated[idx],
                        type: newType,
                        includeGrill: newType !== 'door',
                        includeThaiAluminum: newType === 'window',
                      };
                      updateActiveWorkspace((ws) => ({ ...ws, masonry: { ...ws.masonry, openings: updated } }));
                    }}
                    className="px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs"
                  >
                    <option value="window">Window (Thai + Grill)</option>
                    <option value="door">Door (Wooden/Flush)</option>
                    <option value="veranda-grill">Veranda MS Grill</option>
                    <option value="ventilator">Ventilator / Louver</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">W:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={op.widthM}
                      onChange={(e) => {
                        const updated = [...(activeWorkspace.masonry.openings || [])];
                        updated[idx] = { ...updated[idx], widthM: Math.max(0, Number(e.target.value) || 0) };
                        updateActiveWorkspace((ws) => ({ ...ws, masonry: { ...ws.masonry, openings: updated } }));
                      }}
                      className="w-full px-1.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs"
                      title="Width (m)"
                    />
                    <span className="text-[10px] text-muted-foreground">H:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={op.heightM}
                      onChange={(e) => {
                        const updated = [...(activeWorkspace.masonry.openings || [])];
                        updated[idx] = { ...updated[idx], heightM: Math.max(0, Number(e.target.value) || 0) };
                        updateActiveWorkspace((ws) => ({ ...ws, masonry: { ...ws.masonry, openings: updated } }));
                      }}
                      className="w-full px-1.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs"
                      title="Height (m)"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={op.count}
                      onChange={(e) => {
                        const updated = [...(activeWorkspace.masonry.openings || [])];
                        updated[idx] = { ...updated[idx], count: Math.max(1, Number(e.target.value) || 1) };
                        updateActiveWorkspace((ws) => ({ ...ws, masonry: { ...ws.masonry, openings: updated } }));
                      }}
                      className="w-14 px-1.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="inline-flex items-center gap-1 cursor-pointer text-[10px]">
                      <input
                        type="checkbox"
                        checked={op.includeGrill ?? (op.type !== 'door')}
                        onChange={(e) => {
                          const updated = [...(activeWorkspace.masonry.openings || [])];
                          updated[idx] = { ...updated[idx], includeGrill: e.target.checked };
                          updateActiveWorkspace((ws) => ({ ...ws, masonry: { ...ws.masonry, openings: updated } }));
                        }}
                      />
                      Grill
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (activeWorkspace.masonry.openings || []).filter((_, i) => i !== idx);
                        updateActiveWorkspace((ws) => ({ ...ws, masonry: { ...ws.masonry, openings: updated } }));
                      }}
                      className="text-red-500 hover:text-red-700 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                      title="Delete opening"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
  onPushToBoq?: () => void;
}

export const MasonryFinishesMetrics: React.FC<MasonryFinishesMetricsProps> = ({
  result,
  activeWorkspace,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
  onPushToBoq,
}) => {
  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      {/* Primary Brickwork & Mortar Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          subText={`${result.mortarCementBags50Kg.toFixed(1)} bags cement, ${result.mortarSandCft.toFixed(1)} cft sand`}
        />
        <UnitValueDisplay
          label="Plaster Dry Mortar"
          category="volume"
          siValue={result.plasterDryVolM3}
          currentUnitId={getOutputUnit('mas.out.plaster', 'volume', 'm3')}
          onUnitChange={(u) => updateOutputUnit('mas.out.plaster', u)}
          customUnits={customUnits}
          subText={`${result.plasterCementBags.toFixed(1)} bags cement, ${result.plasterSandCft.toFixed(1)} cft sand`}
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

      {/* Paint, Primer & Wall Putty Schedule Card */}
      {result.paintPuttySchedule && result.paintPuttySchedule.finishingSurfaceAreaM2 > 0 && (
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--md-sys-color-primary)]">
              Wall Putty, Primer &amp; Paint Consumption Schedule
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Total Surface: <strong className="text-[var(--md-sys-color-on-surface)]">{result.paintPuttySchedule.finishingSurfaceAreaM2.toFixed(1)} m²</strong> ({result.paintPuttySchedule.finishingSurfaceAreaSft.toFixed(0)} SFT)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[11px] text-muted-foreground font-semibold">Wall Putty (2 Coats)</div>
              <div className="text-base font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
                {result.paintPuttySchedule.puttyKgRequired} <span className="text-xs font-normal">kg</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {result.paintPuttySchedule.puttyBags20Kg} bags (20kg) or {result.paintPuttySchedule.puttyBags40Kg} bags (40kg)
              </div>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[11px] text-muted-foreground font-semibold">Surface Primer / Sealer</div>
              <div className="text-base font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
                {result.paintPuttySchedule.primerLitersRequired} <span className="text-xs font-normal">Liters</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                ~{(result.paintPuttySchedule.primerLitersRequired / 3.785).toFixed(1)} US Gallons (1 coat)
              </div>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[11px] text-muted-foreground font-semibold">Emulsion / Weather Paint</div>
              <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                {result.paintPuttySchedule.paintLitersRequired} <span className="text-xs font-normal">Liters</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {result.paintPuttySchedule.paintGallons} Gallons / {result.paintPuttySchedule.paintDrums} Drums (2 coats)
              </div>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[11px] text-muted-foreground font-semibold">Coats Standard</div>
              <div className="text-xs font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-1">
                2 Putty + 1 Primer + 2 Paint
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                5% application wastage included
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MS Window/Veranda Grill & Thai Aluminum Opening Schedule Card */}
      {result.grillThaiSchedule && result.grillThaiSchedule.items.length > 0 && (
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--md-sys-color-primary)]">
              MS Window/Veranda Grill &amp; Thai Aluminum Schedule
            </span>
            <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-3">
              <span>Grill: <strong className="text-[var(--md-sys-color-on-surface)]">{result.grillThaiSchedule.totalGrillAreaSft.toFixed(1)} SFT</strong> ({result.grillThaiSchedule.totalGrillWeightKg.toFixed(1)} kg / {result.grillThaiSchedule.totalGrillWeightMaund} Maund)</span>
              <span>Thai: <strong className="text-[var(--md-sys-color-on-surface)]">{result.grillThaiSchedule.totalThaiAreaSft.toFixed(1)} SFT</strong> ({result.grillThaiSchedule.totalThaiFrameRft.toFixed(1)} RFT)</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--md-sys-color-outline-variant)]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-2.5">Opening</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5 text-center">Qty</th>
                  <th className="py-2 px-2.5 text-right">Size (W x H)</th>
                  <th className="py-2 px-2.5 text-right">Area (SFT)</th>
                  <th className="py-2 px-2.5 text-right">MS Grill Wt (kg)</th>
                  <th className="py-2 px-2.5 text-right">Thai Frame (RFT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                {result.grillThaiSchedule.items.map((it) => (
                  <tr key={it.id} className="hover:bg-[var(--md-sys-color-surface-container-highest)]/40 transition-colors">
                    <td className="py-1.5 px-2.5 font-bold text-[var(--md-sys-color-on-surface)]">{it.name}</td>
                    <td className="py-1.5 px-2.5 capitalize text-[var(--md-sys-color-on-surface-variant)]">{it.type}</td>
                    <td className="py-1.5 px-2.5 text-center font-semibold">{it.count}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono">{it.widthM.toFixed(2)}m × {it.heightM.toFixed(2)}m</td>
                    <td className="py-1.5 px-2.5 text-right font-mono">{it.totalAreaSft.toFixed(1)} sft</td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-amber-700 dark:text-amber-400">
                      {it.hasGrill ? `${it.grillWeightKg.toFixed(1)} kg` : '—'}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono">
                      {it.hasThai ? `${it.totalPerimeterRft.toFixed(1)} RFT` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1-Click Push Grill, Windows & Paint to BOQ Estimator Button */}
      {onPushToBoq && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onPushToBoq}
            className="touch-target-48 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            title="Push Brickwork, Plaster, Paint, MS Grills & Thai Windows directly to BOQ Takeoff Schedule"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-200" />
            <span>Push Brickwork, Paint, Grills &amp; Windows to BOQ Estimator</span>
          </button>
        </div>
      )}
    </div>
  );
};
