import React from 'react';
import {
  CivilWorkspace,
  BuildingCode,
  ConcreteMemberItem,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { ConcreteMaterialResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';
import { Plus, Trash2 } from 'lucide-react';

export interface ConcreteMaterialsInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

function computeMemberUnitVolume(m: ConcreteMemberItem): number {
  if (m.shape === 'circular-column') {
    const d = m.diameterM || m.widthM || 0;
    return (Math.PI * d * d * 0.25) * (m.heightM || 0);
  }
  if (m.shape === 'trapezoidal-footing') {
    const a1 = (m.lengthM || 0) * (m.widthM || 0);
    const a2 = (m.topLengthM || m.lengthM * 0.4 || 0) * (m.topWidthM || m.widthM * 0.4 || 0);
    return ((m.heightM || 0) / 3) * (a1 + a2 + Math.sqrt(Math.max(0, a1 * a2)));
  }
  if (m.shape === 'retaining-wall-stem') {
    return (m.lengthM || 0) * (((m.widthM || 0) + (m.topWidthM ?? m.widthM ?? 0)) / 2) * (m.heightM || 0);
  }
  return (m.lengthM || 0) * (m.widthM || 0) * (m.heightM || 0);
}

export const ConcreteMaterialsInputs: React.FC<ConcreteMaterialsInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  const cm = activeWorkspace.concreteMaterials;
  const members = Array.isArray(cm.members) ? cm.members : [];
  const batchedTotalWetM3 = members.reduce(
    (s, m) => s + Math.max(0, m.count || 0) * computeMemberUnitVolume(m),
    0
  );

  const updateCM = (patch: Partial<typeof cm>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      concreteMaterials: { ...ws.concreteMaterials, ...patch },
    }));
  };

  const syncMembers = (nextMembers: ConcreteMemberItem[]) => {
    const nextWet = nextMembers.reduce(
      (s, m) => s + Math.max(0, m.count || 0) * computeMemberUnitVolume(m),
      0
    );
    updateActiveWorkspace((ws) => ({
      ...ws,
      concreteMaterials: {
        ...ws.concreteMaterials,
        members: nextMembers,
        ...(nextMembers.length > 0 && nextWet > 0 ? { wetVolumeM3: Number(nextWet.toFixed(3)) } : {}),
      },
    }));
  };

  const addBatchedElement = (preset: 'footing' | 'column' | 'beam' | 'slab' | 'wall') => {
    const templates: Record<typeof preset, Omit<ConcreteMemberItem, 'id' | 'computedVolumeM3'>> = {
      footing: {
        name: `Pad Footing F${members.length + 1}`,
        shape: 'trapezoidal-footing',
        count: 4,
        lengthM: 2.0,
        widthM: 2.0,
        heightM: 0.45,
        topLengthM: 0.5,
        topWidthM: 0.5,
      },
      column: {
        name: `RCC Column C${members.length + 1}`,
        shape: 'rectangular',
        count: 6,
        lengthM: 0.4,
        widthM: 0.4,
        heightM: 3.3,
      },
      beam: {
        name: `Grade / Floor Beam B${members.length + 1}`,
        shape: 'rectangular',
        count: 4,
        lengthM: 5.0,
        widthM: 0.25,
        heightM: 0.45,
      },
      slab: {
        name: `Floor Slab Panel S${members.length + 1}`,
        shape: 'rectangular',
        count: 1,
        lengthM: 6.0,
        widthM: 4.5,
        heightM: 0.15,
      },
      wall: {
        name: `Retaining Wall Stem RW${members.length + 1}`,
        shape: 'retaining-wall-stem',
        count: 1,
        lengthM: 8.0,
        widthM: 0.35,
        topWidthM: 0.2,
        heightM: 3.0,
      },
    };
    const base = templates[preset];
    const singleVol = computeMemberUnitVolume({ ...base, id: 'tmp', computedVolumeM3: 0 });
    const item: ConcreteMemberItem = {
      ...base,
      id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      computedVolumeM3: Number(singleVol.toFixed(4)),
    };
    syncMembers([...members, item]);
  };

  return (
    <div className="space-y-4">
      {/* Code, Wet Volume & Coarse Aggregate Preset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1">Building Code &amp; Dry Bulking Standard</label>
          <select
            value={cm.code}
            onChange={(e) => {
              const val = e.target.value as BuildingCode;
              const codeDryFactor = val === 'IS-456' ? 1.52 : 1.54;
              updateActiveWorkspace((ws) => ({
                ...ws,
                governingCode: val,
                concreteMaterials: {
                  ...ws.concreteMaterials,
                  code: val,
                  customDryFactor: codeDryFactor,
                },
              }));
            }}
            className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
          >
            <option value="BNBC-2020">BNBC-2020 (Dry Factor 1.54)</option>
            <option value="ACI-318">ACI-318 (Dry Factor 1.54)</option>
            <option value="IS-456">IS-456 (Dry Factor 1.52)</option>
          </select>
        </div>

        <div>
          <UnitInput
            label={members.length > 0 && batchedTotalWetM3 > 0 ? 'Wet Concrete Volume (Auto-Batched)' : 'Wet Concrete Volume'}
            category="volume"
            siValue={members.length > 0 && batchedTotalWetM3 > 0 ? batchedTotalWetM3 : cm.wetVolumeM3}
            onChangeSI={(val) => updateCM({ wetVolumeM3: val })}
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
            designTip="Add individual RCC elements below for multi-member batching, or enter gross wet volume directly."
          />
        </div>
      </div>

      {/* Volumetric Mix Ratio & Quick Standard Presets */}
      <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="block text-xs font-semibold">Volumetric Mix Ratio (Cement : Sand : Aggregate)</label>
          <span className="text-[11px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)]">
            Sum = {(cm.ratioCement + cm.ratioSand + cm.ratioAggregate).toFixed(2)} parts
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { label: '1 : 1.5 : 3 (M20 RCC)', c: 1, s: 1.5, a: 3, title: 'Standard Structural RCC (20 MPa)' },
            { label: '1 : 1 : 2 (M25 Column)', c: 1, s: 1, a: 2, title: 'Heavy RCC Columns & Water Tanks' },
            { label: '1 : 2 : 4 (M15 General)', c: 1, s: 2, a: 4, title: 'General Plain / Mass Concrete' },
            { label: '1 : 3 : 6 (PCC Lean)', c: 1, s: 3, a: 6, title: 'Lean Concrete Under Footings' },
          ].map((item) => {
            const isSelected =
              cm.ratioCement === item.c &&
              cm.ratioSand === item.s &&
              cm.ratioAggregate === item.a;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => updateCM({ ratioCement: item.c, ratioSand: item.s, ratioAggregate: item.a })}
                className={`min-h-[34px] px-3 py-1 text-[11px] font-mono rounded-lg border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent font-bold shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
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
              value={cm.ratioCement}
              onChange={(e) => updateCM({ ratioCement: Math.max(0.1, Number(e.target.value) || 0) })}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-sm bg-[var(--md-sys-color-surface)]"
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
              value={cm.ratioSand}
              onChange={(e) => updateCM({ ratioSand: Math.max(0.1, Number(e.target.value) || 0) })}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-sm bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Stone/Khoa (Coarse)
            </span>
            <input
              type="number"
              step="0.25"
              min="0"
              value={cm.ratioAggregate}
              onChange={(e) => updateCM({ ratioAggregate: Math.max(0, Number(e.target.value) || 0) })}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-sm bg-[var(--md-sys-color-surface)]"
            />
          </div>
        </div>

        {/* Batching Parameters: Coarse Agg Type, Dry Factor, w/c, Wastage */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Coarse Aggregate
            </label>
            <select
              value={cm.coarseAggregateType || 'crushed-stone'}
              onChange={(e) => {
                const aggType = e.target.value as 'crushed-stone' | 'brick-shingles' | 'gravel';
                updateCM({
                  coarseAggregateType: aggType,
                  aggregateBulkDensityKgPerM3: aggType === 'brick-shingles' ? 1280 : aggType === 'gravel' ? 1600 : 1520,
                });
              }}
              className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            >
              <option value="crushed-stone">Crushed Stone (3/4" Chips)</option>
              <option value="brick-shingles">Picked Jhama Brick Khoa</option>
              <option value="gravel">Natural Gravel / Shingle</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Dry Bulking Factor
            </label>
            <input
              type="number"
              step="0.01"
              min="1.30"
              max="1.75"
              value={cm.customDryFactor || (cm.code === 'IS-456' ? 1.52 : 1.54)}
              onChange={(e) => updateCM({ customDryFactor: Math.max(1.2, Number(e.target.value) || 1.54) })}
              className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Water / Cement Ratio
            </label>
            <input
              type="number"
              step="0.02"
              min="0.30"
              max="0.75"
              value={cm.waterCementRatio || 0.45}
              onChange={(e) => updateCM({ waterCementRatio: Math.max(0.25, Number(e.target.value) || 0.45) })}
              className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Batch Wastage (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="15"
              value={cm.wastagePercent ?? 2}
              onChange={(e) => updateCM({ wastagePercent: Math.max(0, Number(e.target.value) || 0) })}
              className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
            />
          </div>
        </div>
      </div>

      {/* Multi-Element RCC Batching Schedule */}
      <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
              Multi-Element RCC Batching Schedule
            </div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              {members.length > 0
                ? `${members.length} element group(s) summing to ${batchedTotalWetM3.toFixed(3)} m³ wet volume`
                : 'Optional: Add Footings, Columns, Beams, Slabs or Retaining Walls to aggregate pour volume'}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              { id: 'footing', label: '+ Footing' },
              { id: 'column', label: '+ Column' },
              { id: 'beam', label: '+ Beam' },
              { id: 'slab', label: '+ Slab' },
              { id: 'wall', label: '+ Wall' },
            ] as const).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => addBatchedElement(btn.id)}
                className="px-2.5 py-1.5 text-[11px] font-mono font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                {btn.label.replace('+ ', '')}
              </button>
            ))}
          </div>
        </div>

        {members.length > 0 && (
          <div className="space-y-2">
            {members.map((m, idx) => {
              const unitVol = computeMemberUnitVolume(m);
              const totalVol = unitVol * Math.max(0, m.count || 0);
              return (
                <div
                  key={m.id || idx}
                  className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-2 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const next = [...members];
                        next[idx] = { ...next[idx], name: e.target.value };
                        syncMembers(next);
                      }}
                      className="sm:col-span-4 px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-medium bg-[var(--md-sys-color-surface)]"
                      placeholder="Element label"
                    />
                    <select
                      value={m.shape}
                      onChange={(e) => {
                        const next = [...members];
                        const shape = e.target.value as ConcreteMemberItem['shape'];
                        const updated: ConcreteMemberItem = {
                          ...next[idx],
                          shape,
                          diameterM: shape === 'circular-column' ? next[idx].diameterM || next[idx].widthM || 0.45 : next[idx].diameterM,
                        };
                        updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                        next[idx] = updated;
                        syncMembers(next);
                      }}
                      className="sm:col-span-4 px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-[11px] bg-[var(--md-sys-color-surface)]"
                    >
                      <option value="rectangular">Rect (Beam / Col / Slab)</option>
                      <option value="trapezoidal-footing">Trapezoidal Pad Footing</option>
                      <option value="circular-column">Circular Column / Pile</option>
                      <option value="retaining-wall-stem">Tapered Retaining Wall</option>
                    </select>
                    <div className="sm:col-span-2 flex items-center gap-1">
                      <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={m.count}
                        onChange={(e) => {
                          const next = [...members];
                          next[idx] = { ...next[idx], count: Math.max(1, Number(e.target.value) || 1) };
                          syncMembers(next);
                        }}
                        className="w-full px-1.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between gap-1 font-mono tabular-nums">
                      <span className="font-bold text-[var(--md-sys-color-primary)]">
                        {totalVol.toFixed(2)} m³
                      </span>
                      <button
                        type="button"
                        onClick={() => syncMembers(members.filter((_, i) => i !== idx))}
                        className="p-1 text-[var(--md-sys-color-error)] hover:opacity-80 cursor-pointer"
                        title="Remove element"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                    {m.shape === 'circular-column' ? (
                      <>
                        <div>
                          <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Diameter D (m)</span>
                          <input
                            type="number"
                            step="0.05"
                            min="0.1"
                            value={m.diameterM ?? m.widthM}
                            onChange={(e) => {
                              const next = [...members];
                              const updated = { ...next[idx], diameterM: Math.max(0.05, Number(e.target.value) || 0) };
                              updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                              next[idx] = updated;
                              syncMembers(next);
                            }}
                            className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Height H (m)</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={m.heightM}
                            onChange={(e) => {
                              const next = [...members];
                              const updated = { ...next[idx], heightM: Math.max(0.05, Number(e.target.value) || 0) };
                              updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                              next[idx] = updated;
                              syncMembers(next);
                            }}
                            className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Length L (m)</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0.05"
                            value={m.lengthM}
                            onChange={(e) => {
                              const next = [...members];
                              const updated = { ...next[idx], lengthM: Math.max(0.05, Number(e.target.value) || 0) };
                              updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                              next[idx] = updated;
                              syncMembers(next);
                            }}
                            className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                            {m.shape === 'retaining-wall-stem' ? 'Base Thk (m)' : 'Width W (m)'}
                          </span>
                          <input
                            type="number"
                            step="0.05"
                            min="0.05"
                            value={m.widthM}
                            onChange={(e) => {
                              const next = [...members];
                              const updated = { ...next[idx], widthM: Math.max(0.05, Number(e.target.value) || 0) };
                              updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                              next[idx] = updated;
                              syncMembers(next);
                            }}
                            className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Height/Depth (m)</span>
                          <input
                            type="number"
                            step="0.05"
                            min="0.05"
                            value={m.heightM}
                            onChange={(e) => {
                              const next = [...members];
                              const updated = { ...next[idx], heightM: Math.max(0.05, Number(e.target.value) || 0) };
                              updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                              next[idx] = updated;
                              syncMembers(next);
                            }}
                            className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                          />
                        </div>
                        {m.shape === 'trapezoidal-footing' && (
                          <>
                            <div>
                              <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Top L2 (m)</span>
                              <input
                                type="number"
                                step="0.05"
                                min="0.1"
                                value={m.topLengthM ?? 0.5}
                                onChange={(e) => {
                                  const next = [...members];
                                  const updated = { ...next[idx], topLengthM: Math.max(0.05, Number(e.target.value) || 0) };
                                  updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                                  next[idx] = updated;
                                  syncMembers(next);
                                }}
                                className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                              />
                            </div>
                            <div>
                              <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Top W2 (m)</span>
                              <input
                                type="number"
                                step="0.05"
                                min="0.1"
                                value={m.topWidthM ?? 0.5}
                                onChange={(e) => {
                                  const next = [...members];
                                  const updated = { ...next[idx], topWidthM: Math.max(0.05, Number(e.target.value) || 0) };
                                  updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                                  next[idx] = updated;
                                  syncMembers(next);
                                }}
                                className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                              />
                            </div>
                          </>
                        )}
                        {m.shape === 'retaining-wall-stem' && (
                          <div>
                            <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Top Thk (m)</span>
                            <input
                              type="number"
                              step="0.05"
                              min="0.1"
                              value={m.topWidthM ?? 0.2}
                              onChange={(e) => {
                                const next = [...members];
                                const updated = { ...next[idx], topWidthM: Math.max(0.05, Number(e.target.value) || 0) };
                                updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                                next[idx] = updated;
                                syncMembers(next);
                              }}
                              className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => syncMembers([])}
                className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] cursor-pointer"
              >
                Clear batch list (switch to manual volume)
              </button>
            </div>
          </div>
        )}
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
    <div className="space-y-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UnitValueDisplay
          label="Total Dry Volume"
          category="volume"
          siValue={result.totalDryVolumeWithWastageM3}
          currentUnitId={getOutputUnit('mat.out.vol', 'volume', 'm3')}
          onUnitChange={(u) => updateOutputUnit('mat.out.vol', u)}
          customUnits={customUnits}
          subText={`Wet: ${result.wetVolumeM3.toFixed(2)} m³ (×${result.dryVolumeFactor})`}
        />
        <UnitValueDisplay
          label="Cement Required"
          category="mass"
          siValue={result.cementMassKg}
          currentUnitId={getOutputUnit('mat.out.cement', 'mass', 'bag50')}
          onUnitChange={(u) => updateOutputUnit('mat.out.cement', u)}
          customUnits={customUnits}
          highlight={true}
          subText={`${result.cementBags50Kg.toFixed(1)} bags · ${(result.cementVolumeCft ?? result.cementVolumeM3 * 35.3147).toFixed(1)} cft`}
        />
        <UnitValueDisplay
          label="Fine Sand Volume"
          category="volume"
          siValue={result.sandVolumeM3}
          currentUnitId={getOutputUnit('mat.out.sand', 'volume', 'cft')}
          onUnitChange={(u) => updateOutputUnit('mat.out.sand', u)}
          customUnits={customUnits}
          subText={`${result.sandCft.toFixed(1)} cft (${result.sandMassKg.toFixed(0)} kg)`}
        />
        <UnitValueDisplay
          label={result.coarseAggregateType === 'brick-shingles' ? 'Brick Khoa Volume' : 'Coarse Agg Volume'}
          category="volume"
          siValue={result.aggregateVolumeM3}
          currentUnitId={getOutputUnit('mat.out.agg', 'volume', 'cft')}
          onUnitChange={(u) => updateOutputUnit('mat.out.agg', u)}
          customUnits={customUnits}
          subText={`${result.aggregateCft.toFixed(1)} cft (${result.aggregateMassKg.toFixed(0)} kg)`}
        />
      </div>

      {/* Site Batching Dispatch Strip (Water + Optional Picked Jhama Brick Khoa) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">Potable Mixing Water Demand</div>
            <div className="text-base font-bold tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
              {result.waterDemandLiters.toFixed(0)} Liters
            </div>
          </div>
          <div className="text-right text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
            <div>~{(result.waterDemandLiters / 200).toFixed(1)} drums (200L)</div>
            <div>{result.batchedMembersCount ? `${result.batchedMembersCount} batched member groups` : 'Single-batch volume'}</div>
          </div>
        </div>

        {result.jhamaBricksForKhoa && result.jhamaBricksForKhoa > 0 ? (
          <div className="p-3 rounded-xl border border-[var(--md-sys-color-tertiary)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-[var(--md-sys-color-tertiary)]">Picked Jhama Bricks for Khoa</div>
              <div className="text-base font-bold tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
                {result.jhamaBricksForKhoa.toLocaleString()} nos
              </div>
            </div>
            <div className="text-right text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
              <div>PWD Rate: ~320 bricks / m³</div>
              <div>Yield: {result.aggregateCft.toFixed(1)} cft broken khoa</div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">1-Bag Mix Conversion</div>
              <div className="text-base font-bold tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
                {result.cementBags50Kg.toFixed(1)} bags (50kg)
              </div>
            </div>
            <div className="text-right text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
              <div>0.03472 m³ / 1.226 cft per bag</div>
              <div>Wastage: ×{result.wastageMultiplier.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
