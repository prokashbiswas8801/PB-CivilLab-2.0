import React, { useState } from 'react';
import {
  CivilWorkspace,
  CustomUnitDefinition,
  MasonryOpening,
  UnitCategoryKey,
} from '../../types/civil';
import { MasonryResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';
import { MaterialTakeoff } from '../calculators/construction/MaterialTakeoff';
import { FileSpreadsheet, Box, Plus, Trash2 } from 'lucide-react';

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
  const [takeoffMode, setTakeoffMode] = useState<'suite' | 'single'>('single');
  const m = activeWorkspace.masonry;

  const updateMasonry = (patch: Partial<typeof m>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      masonry: { ...ws.masonry, ...patch },
    }));
  };

  const addOpeningPreset = (kind: MasonryOpening['type']) => {
    const existing = m.openings || [];
    const idx = existing.length + 1;
    const presets: Record<NonNullable<MasonryOpening['type']>, Omit<MasonryOpening, 'id'>> = {
      door: {
        name: `Door D${idx}`,
        widthM: 1.0,
        heightM: 2.1,
        count: 1,
        type: 'door',
        includeGrill: false,
        includeThaiAluminum: false,
      },
      window: {
        name: `Window W${idx}`,
        widthM: 1.5,
        heightM: 1.35,
        count: 1,
        type: 'window',
        includeGrill: true,
        includeThaiAluminum: true,
      },
      ventilator: {
        name: `Ventilator V${idx}`,
        widthM: 0.6,
        heightM: 0.45,
        count: 1,
        type: 'ventilator',
        includeGrill: true,
        includeThaiAluminum: false,
      },
      lintel: {
        name: `RCC Lintel L${idx}`,
        widthM: 1.8,
        heightM: 0.15,
        count: 1,
        type: 'lintel',
        includeGrill: false,
        includeThaiAluminum: false,
      },
      'veranda-grill': {
        name: `Veranda Grill G${idx}`,
        widthM: 2.4,
        heightM: 1.2,
        count: 1,
        type: 'veranda-grill',
        includeGrill: true,
        includeThaiAluminum: false,
      },
    };
    const template = presets[kind || 'window'];
    updateMasonry({
      openings: [
        ...existing,
        {
          ...template,
          id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between p-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        <button
          type="button"
          onClick={() => setTakeoffMode('single')}
          className={`flex-1 min-h-[44px] touch-target-48 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            takeoffMode === 'single'
              ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <Box className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <span>Wall, Openings, Khoa &amp; Finishes Sizer</span>
        </button>
        <button
          type="button"
          onClick={() => setTakeoffMode('suite')}
          className={`flex-1 min-h-[44px] touch-target-48 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            takeoffMode === 'suite'
              ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-[var(--md-sys-color-secondary)]" />
          <span>Multi-Trade Material Takeoff &amp; Labor Suite</span>
        </button>
      </div>

      {takeoffMode === 'suite' ? (
        <MaterialTakeoff />
      ) : (
        <div className="space-y-4">
          {/* Wall Dimensions & Brick Standard */}
          <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
            <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
              Brick Masonry Wall Section &amp; Dimensions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <UnitInput
                label="Wall Length"
                category="length"
                siValue={m.wallLengthM}
                onChangeSI={(val) => updateMasonry({ wallLengthM: val })}
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
                siValue={m.wallHeightM}
                onChangeSI={(val) => updateMasonry({ wallHeightM: val })}
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
                siValue={m.wallThicknessM}
                onChangeSI={(val) => updateMasonry({ wallThicknessM: val })}
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

            {/* Brick Standard Preset & Mortar Joint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
              <div>
                <label className="block text-xs font-semibold mb-1">Brick Standard Preset</label>
                <select
                  value={m.brickStandardType || 'bd-pwd-metric'}
                  onChange={(e) => {
                    const bType = e.target.value as 'bd-pwd-metric' | 'modular-metric' | 'traditional-field';
                    if (bType === 'modular-metric') {
                      updateMasonry({
                        brickStandardType: bType,
                        brickLengthMm: 190,
                        brickWidthMm: 90,
                        brickHeightMm: 90,
                        mortarJointMm: 10,
                      });
                    } else if (bType === 'traditional-field') {
                      updateMasonry({
                        brickStandardType: bType,
                        brickLengthMm: 241,
                        brickWidthMm: 114,
                        brickHeightMm: 70,
                        mortarJointMm: 10,
                      });
                    } else {
                      updateMasonry({
                        brickStandardType: bType,
                        brickLengthMm: 240,
                        brickWidthMm: 115,
                        brickHeightMm: 70,
                        mortarJointMm: 12,
                      });
                    }
                  }}
                  className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                >
                  <option value="bd-pwd-metric">BD Standard Brick (240 × 115 × 70 mm / 9.5"×4.5"×2.75", 12mm joint)</option>
                  <option value="modular-metric">Modular Metric Brick (190 × 90 × 90 mm, 10mm joint = 500/m³)</option>
                  <option value="traditional-field">Traditional Field Brick (241 × 114 × 70 mm, 10mm joint)</option>
                </select>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
                  Nominal with mortar: {(m.brickLengthMm || 240) + (m.mortarJointMm || 12)} × {(m.brickWidthMm || 115) + (m.mortarJointMm || 12)} × {(m.brickHeightMm || 70) + (m.mortarJointMm || 12)} mm
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Mortar Joint (mm)
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    step="1"
                    value={m.mortarJointMm ?? 12}
                    onChange={(e) => updateMasonry({ mortarJointMm: Math.max(4, Number(e.target.value) || 10) })}
                    className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Mortar Ratio (1:N)
                  </label>
                  <select
                    value={m.mortarRatioSand || 5}
                    onChange={(e) => updateMasonry({ mortarRatioCement: 1, mortarRatioSand: Number(e.target.value) })}
                    className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                  >
                    <option value="4">1 : 4 (5" Wall)</option>
                    <option value="5">1 : 5 (10" Wall)</option>
                    <option value="6">1 : 6 (General)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Brick Waste (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="0.5"
                    value={m.brickWastagePercent ?? 5}
                    onChange={(e) => updateMasonry({ brickWastagePercent: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                  />
                </div>
              </div>
            </div>

            {/* Sub-Base (BFS / HBB) & Picked Jhama Brick Khoa Estimator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
              <div>
                <label className="block text-xs font-semibold mb-1">Sub-Base Schedule (BFS / HBB)</label>
                <select
                  value={m.subbaseType || 'none'}
                  onChange={(e) => updateMasonry({ subbaseType: e.target.value as any })}
                  className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                >
                  <option value="none">None (Direct Superstructure Wall)</option>
                  <option value="bfs">Brick Flat Soling (BFS - 3.1 bricks/sft)</option>
                  <option value="hbb">Herringbone Bond (HBB - 5.2 bricks/sft)</option>
                </select>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
                  Sub-grade paving under floor slab or foundation trench
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Picked Jhama Brick Khoa — Concrete Vol (m³)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={m.khoaConcreteVolumeM3 ?? 0}
                  onChange={(e) => updateMasonry({ khoaConcreteVolumeM3: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                  placeholder="e.g. 2.5 m³ for CC / lintel / soling khoa"
                />
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
                  PWD standard: ~320 picked Jhama bricks per 1.0 m³ brick khoa concrete
                </span>
              </div>
            </div>

            {m.subbaseType && m.subbaseType !== 'none' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs font-mono">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Sub-Base Area (m²)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={m.bfsLayerAreaM2 ?? Math.round(m.wallLengthM * (m.wallThicknessM + 0.3) * 10) / 10}
                    onChange={(e) => updateMasonry({ bfsLayerAreaM2: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                  />
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
                    ~{((m.bfsLayerAreaM2 ?? m.wallLengthM * 0.5) * 10.7639).toFixed(0)} SFT bed
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">Sand Cushion Bed (mm)</label>
                  <input
                    type="number"
                    min="25"
                    max="200"
                    step="25"
                    value={m.bfsSandCushionThicknessMm ?? 75}
                    onChange={(e) => updateMasonry({ bfsSandCushionThicknessMm: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                  />
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
                    Standard sand bed: 75mm (3 in) PWD clause
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Deduction Schedule: Doors, Windows, Ventilators, RCC Lintels */}
          <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
                  Opening &amp; Lintel Deduction Schedule (D1 / W1 / V1 / L1)
                </div>
                <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Deducted automatically from gross wall volume, brickwork &amp; plastering area
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {([
                  { type: 'door', label: 'Door D1' },
                  { type: 'window', label: 'Window W1' },
                  { type: 'ventilator', label: 'Vent V1' },
                  { type: 'lintel', label: 'Lintel L1' },
                ] as const).map((btn) => (
                  <button
                    key={btn.type}
                    type="button"
                    onClick={() => addOpeningPreset(btn.type)}
                    className="px-2.5 py-1.5 text-[11px] font-mono font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {(m.openings || []).map((op, idx) => (
                <div
                  key={op.id || idx}
                  className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                >
                  <input
                    type="text"
                    value={op.name}
                    onChange={(e) => {
                      const updated = [...(m.openings || [])];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      updateMasonry({ openings: updated });
                    }}
                    className="sm:col-span-3 px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-medium bg-[var(--md-sys-color-surface)]"
                    placeholder="e.g. Window W1"
                  />
                  <select
                    value={op.type || 'window'}
                    onChange={(e) => {
                      const updated = [...(m.openings || [])];
                      const newType = e.target.value as NonNullable<MasonryOpening['type']>;
                      updated[idx] = {
                        ...updated[idx],
                        type: newType,
                        includeGrill: newType !== 'door' && newType !== 'lintel',
                        includeThaiAluminum: newType === 'window',
                      };
                      updateMasonry({ openings: updated });
                    }}
                    className="sm:col-span-3 px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                  >
                    <option value="window">Window (Thai + Grill)</option>
                    <option value="door">Door (Timber / Flush)</option>
                    <option value="ventilator">Ventilator / Louver</option>
                    <option value="lintel">RCC Lintel Band</option>
                    <option value="veranda-grill">Veranda MS Grill</option>
                  </select>
                  <div className="sm:col-span-3 flex items-center gap-1">
                    <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">W:</span>
                    <input
                      type="number"
                      step="0.05"
                      value={op.widthM}
                      onChange={(e) => {
                        const updated = [...(m.openings || [])];
                        updated[idx] = { ...updated[idx], widthM: Math.max(0, Number(e.target.value) || 0) };
                        updateMasonry({ openings: updated });
                      }}
                      className="w-full px-1.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                      title="Width (m)"
                    />
                    <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">H:</span>
                    <input
                      type="number"
                      step="0.05"
                      value={op.heightM}
                      onChange={(e) => {
                        const updated = [...(m.openings || [])];
                        updated[idx] = { ...updated[idx], heightM: Math.max(0, Number(e.target.value) || 0) };
                        updateMasonry({ openings: updated });
                      }}
                      className="w-full px-1.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                      title="Height (m)"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center gap-1">
                    <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">×</span>
                    <input
                      type="number"
                      min="1"
                      value={op.count}
                      onChange={(e) => {
                        const updated = [...(m.openings || [])];
                        updated[idx] = { ...updated[idx], count: Math.max(1, Number(e.target.value) || 1) };
                        updateMasonry({ openings: updated });
                      }}
                      className="w-full px-1.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                      title="Count"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between gap-1">
                    {op.type !== 'lintel' ? (
                      <label className="inline-flex items-center gap-1 cursor-pointer text-[10px] font-mono">
                        <input
                          type="checkbox"
                          checked={op.includeGrill ?? op.type !== 'door'}
                          onChange={(e) => {
                            const updated = [...(m.openings || [])];
                            updated[idx] = { ...updated[idx], includeGrill: e.target.checked };
                            updateMasonry({ openings: updated });
                          }}
                        />
                        Grill
                      </label>
                    ) : (
                      <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                        -{(op.widthM * op.heightM * op.count).toFixed(2)}m²
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (m.openings || []).filter((_, i) => i !== idx);
                        updateMasonry({ openings: updated });
                      }}
                      className="text-[var(--md-sys-color-error)] hover:opacity-80 p-1 cursor-pointer"
                      title="Delete deduction item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plastering, Ceramic Floor Tiles & Paint/Putty Coverage Estimator Inputs */}
          <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
            <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
              Plastering, Floor Tiles &amp; Paint / Putty Coverage Estimator
            </div>

            {/* Plastering */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Plaster Thk (mm)
                </label>
                <select
                  value={m.plasterThicknessMm || 12}
                  onChange={(e) => updateMasonry({ plasterThicknessMm: Number(e.target.value) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                >
                  <option value="12">12 mm (Internal)</option>
                  <option value="15">15 mm (Rough Face)</option>
                  <option value="20">20 mm (External)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Plaster Faces
                </label>
                <select
                  value={m.plasterSides || 2}
                  onChange={(e) => updateMasonry({ plasterSides: Number(e.target.value) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                >
                  <option value="2">Both Sides (×2)</option>
                  <option value="1">Single Face (×1)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Plaster Mix (1:N)
                </label>
                <select
                  value={m.plasterRatioSand || 4}
                  onChange={(e) => updateMasonry({ plasterRatioCement: 1, plasterRatioSand: Number(e.target.value) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                >
                  <option value="4">1 : 4 (Rich Coat)</option>
                  <option value="5">1 : 5 (Standard)</option>
                  <option value="6">1 : 6 (Ceiling/Lean)</option>
                </select>
              </div>
            </div>

            {/* Floor Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)] text-xs">
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Floor Length (m)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={m.floorLengthM}
                  onChange={(e) => updateMasonry({ floorLengthM: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Floor Width (m)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={m.floorWidthM}
                  onChange={(e) => updateMasonry({ floorWidthM: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Tile Size (mm)
                </label>
                <select
                  value={`${m.tileLengthMm}x${m.tileWidthMm}`}
                  onChange={(e) => {
                    const [tl, tw] = e.target.value.split('x').map(Number);
                    updateMasonry({ tileLengthMm: tl, tileWidthMm: tw });
                  }}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                >
                  <option value="600x600">600 × 600 (24"×24")</option>
                  <option value="800x800">800 × 800 (32"×32")</option>
                  <option value="300x600">300 × 600 (12"×24")</option>
                  <option value="400x400">400 × 400 (16"×16")</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Tiles / Box
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={m.tilesPerBox || 4}
                  onChange={(e) => updateMasonry({ tilesPerBox: Math.max(1, Number(e.target.value) || 4) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
            </div>

            {/* Paint, Primer & Wall Putty Coverage */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)] text-xs">
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Putty Coats
                </label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={m.puttyCoats ?? 2}
                  onChange={(e) => updateMasonry({ puttyCoats: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Paint Coats
                </label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={m.paintCoats ?? 2}
                  onChange={(e) => updateMasonry({ paintCoats: Math.max(1, Number(e.target.value) || 2) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Primer Cov. (m²/L)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  value={m.primerCoverageM2PerL ?? 10.0}
                  onChange={(e) => updateMasonry({ primerCoverageM2PerL: Math.max(2, Number(e.target.value) || 10) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Paint Cov. (m²/L)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  value={m.paintCoverageM2PerL ?? 11.0}
                  onChange={(e) => updateMasonry({ paintCoverageM2PerL: Math.max(2, Number(e.target.value) || 11) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
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
  const ratePerM3 = result.bricksPerM3Effective ?? 463;
  const ratePerCft = ratePerM3 / 35.314667;

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      {/* Primary Brickwork & Mortar Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border bg-[var(--md-sys-color-primary-container)]/30 border-[var(--md-sys-color-primary)]">
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">
            {result.brickStandardUsed || 'Bricks Required'}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-primary)] mt-0.5">
            {result.bricksWithWastageCount.toLocaleString()} <span className="text-xs font-normal">nos</span>
          </div>
          <div className="text-[11px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Net: {result.netWallAreaM2.toFixed(2)} m² ({ratePerM3}/m³ · {ratePerCft.toFixed(1)}/cft)
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
          <div className="text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
            {result.tileBoxesCount} <span className="text-xs font-normal">boxes</span>
          </div>
          <div className="text-[11px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] mt-1">
            {result.tilesWithWastageCount} tiles ({activeWorkspace.masonry.tilesPerBox}/box)
          </div>
        </div>
      </div>

      {/* Picked Jhama Brick Requirement for Khoa Card */}
      {result.jhamaKhoaSchedule && result.jhamaKhoaSchedule.concreteVolumeM3 > 0 && (
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-tertiary)] bg-[var(--md-sys-color-surface-container)] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold font-mono text-[var(--md-sys-color-tertiary)]">
              Picked Jhama Brick Requirement for Concrete Khoa (BD PWD Rate)
            </span>
            <span className="text-[11px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)]">
              Concrete Volume: <strong className="text-[var(--md-sys-color-on-surface)]">{result.jhamaKhoaSchedule.concreteVolumeM3.toFixed(2)} m³</strong> @ {result.jhamaKhoaSchedule.bricksPerM3Rate} bricks/m³
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 text-xs font-mono tabular-nums">
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Base Jhama Bricks</span>
              <strong className="text-base text-[var(--md-sys-color-on-surface)] mt-0.5 block">
                {result.jhamaKhoaSchedule.pickedJhamaBricksCount.toLocaleString()} nos
              </strong>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">With Breakage Allowance</span>
              <strong className="text-base text-[var(--md-sys-color-tertiary)] mt-0.5 block">
                {result.jhamaKhoaSchedule.bricksWithWastageCount.toLocaleString()} nos
              </strong>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Broken Khoa Aggregate</span>
              <strong className="text-base text-[var(--md-sys-color-primary)] mt-0.5 block">
                {result.jhamaKhoaSchedule.khoaCft.toFixed(1)} cft
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Base BFS / HBB PWD Schedule Card */}
      {result.subbaseSchedule && result.subbaseSchedule.subbaseType !== 'none' && (
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold font-mono text-[var(--md-sys-color-primary)]">
              {result.subbaseSchedule.subbaseName} (PWD Schedule of Rates)
            </span>
            <span className="text-[11px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)]">
              Bed Area: <strong className="text-[var(--md-sys-color-on-surface)]">{result.subbaseSchedule.areaSft.toFixed(0)} SFT</strong> ({result.subbaseSchedule.areaM2.toFixed(1)} m²)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs font-mono tabular-nums">
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Soling Bricks</span>
              <strong className="text-base text-amber-600 dark:text-amber-400 mt-0.5 block">
                {result.subbaseSchedule.bricksWithWastageCount.toLocaleString()} nos
              </strong>
              <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                {result.subbaseSchedule.subbaseType === 'bfs' ? '3.1 bricks/sft' : '5.2 bricks/sft'} + 3% waste
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Sand Cushion Bed</span>
              <strong className="text-base text-sky-600 dark:text-sky-400 mt-0.5 block">
                {result.subbaseSchedule.sandCushionCft.toFixed(1)} cft
              </strong>
              <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                {result.subbaseSchedule.sandCushionThicknessMm} mm bed (~{result.subbaseSchedule.sandCushionM3.toFixed(2)} m³)
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Brick Standard</span>
              <strong className="text-xs text-[var(--md-sys-color-on-surface)] mt-1 block">
                {result.brickStandardUsed || 'PWD Metric 240×115×70'}
              </strong>
              <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">1st class picked bricks</span>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Sand Bags (Cushion)</span>
              <strong className="text-base text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {result.subbaseSchedule.sandCushionBags} bags
              </strong>
              <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Local filling sand</span>
            </div>
          </div>
        </div>
      )}

      {/* Paint, Primer & Wall Putty Schedule Card */}
      {result.paintPuttySchedule && result.paintPuttySchedule.finishingSurfaceAreaM2 > 0 && (
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--md-sys-color-primary)]">
              Wall Putty, Primer &amp; Paint Consumption Schedule
            </span>
            <span className="text-[11px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)]">
              Total Surface: <strong className="text-[var(--md-sys-color-on-surface)]">{result.paintPuttySchedule.finishingSurfaceAreaM2.toFixed(1)} m²</strong> ({result.paintPuttySchedule.finishingSurfaceAreaSft.toFixed(0)} SFT)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                Wall Putty ({result.paintPuttySchedule.puttyCoats} Coats)
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
                {result.paintPuttySchedule.puttyKgRequired} <span className="text-xs font-normal">kg</span>
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono tabular-nums mt-0.5">
                {result.paintPuttySchedule.puttyBags20Kg} bags (20kg) · {result.paintPuttySchedule.puttyBags40Kg} bags (40kg)
              </div>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                Surface Primer ({result.paintPuttySchedule.primerCoats} Coat)
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
                {result.paintPuttySchedule.primerLitersRequired} <span className="text-xs font-normal">Liters</span>
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono tabular-nums mt-0.5">
                ~{(result.paintPuttySchedule.primerLitersRequired / 3.785).toFixed(1)} US Gallons
              </div>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                Emulsion / Weather ({result.paintPuttySchedule.paintCoats} Coats)
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
                {result.paintPuttySchedule.paintLitersRequired} <span className="text-xs font-normal">Liters</span>
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono tabular-nums mt-0.5">
                {result.paintPuttySchedule.paintGallons} Gal / {result.paintPuttySchedule.paintDrums} Drums
              </div>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-semibold">Coats Standard</div>
              <div className="text-xs font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-1">
                {result.paintPuttySchedule.puttyCoats} Putty + {result.paintPuttySchedule.primerCoats} Primer + {result.paintPuttySchedule.paintCoats} Paint
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono mt-0.5">
                5% application wastage incl.
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
            <div className="text-[11px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-3">
              <span>Grill: <strong className="text-[var(--md-sys-color-on-surface)]">{result.grillThaiSchedule.totalGrillAreaSft.toFixed(1)} SFT</strong> ({result.grillThaiSchedule.totalGrillWeightKg.toFixed(1)} kg / {result.grillThaiSchedule.totalGrillWeightMaund} Maund)</span>
              <span>Thai: <strong className="text-[var(--md-sys-color-on-surface)]">{result.grillThaiSchedule.totalThaiAreaSft.toFixed(1)} SFT</strong> ({result.grillThaiSchedule.totalThaiFrameRft.toFixed(1)} RFT)</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--md-sys-color-outline-variant)]">
            <table className="w-full text-left text-xs font-mono tabular-nums">
              <thead className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-2.5">Opening</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5 text-center">Qty</th>
                  <th className="py-2 px-2.5 text-right">Size (W × H)</th>
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
