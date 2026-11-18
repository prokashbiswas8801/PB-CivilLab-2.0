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
import { NumericDraftInput } from '../ui/NumericDraftInput';
import { Plus, Trash2 } from 'lucide-react';

export interface ConcreteMaterialsInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

function computeMemberUnitVolume(m: ConcreteMemberItem): number {
  if (m.shape === 'circular-column' || m.shape === 'bored-pile') {
    const d = m.diameterM || m.widthM || 0;
    return (Math.PI * d * d * 0.25) * (m.heightM || 0);
  }
  if (m.shape === 'trapezoidal-footing') {
    const a1 = (m.lengthM || 0) * (m.widthM || 0);
    const a2 = (m.topLengthM || (m.lengthM || 0) * 0.4 || 0) * (m.topWidthM || (m.widthM || 0) * 0.4 || 0);
    const baseRectH = Math.max(0, m.baseRectHeightM || 0);
    const slopedH =
      m.slopedHeightM !== undefined && m.slopedHeightM > 0
        ? m.slopedHeightM
        : Math.max(0, (m.heightM || 0) - baseRectH);
    const baseBoxVol = a1 * baseRectH;
    const frustumVol = (slopedH / 3) * (a1 + a2 + Math.sqrt(Math.max(0, a1 * a2)));
    return baseBoxVol + frustumVol;
  }
  if (m.shape === 't-beam' || m.shape === 'l-beam') {
    const webVol = (m.lengthM || 0) * (m.widthM || 0) * (m.heightM || 0);
    const effFlangeW = Math.max(0, (m.flangeWidthM || m.widthM || 0) - (m.widthM || 0));
    const flangeVol = (m.lengthM || 0) * effFlangeW * (m.flangeThicknessM || 0);
    return webVol + flangeVol;
  }
  if (m.shape === 'staircase-waist') {
    const goingM = m.lengthM || 0;
    const riseM = m.heightM || 0;
    const flightWidthM = m.widthM || 0;
    const inclinedLenM = Math.hypot(goingM, riseM);
    const waistVol = inclinedLenM * flightWidthM * (m.waistThicknessM || 0.15);
    const stepsCount = Math.max(0, m.stepCount || 0);
    const riserM = m.riserHeightM || 0.15;
    const treadM = m.treadGoingM || 0.25;
    const stepsVol = stepsCount * 0.5 * riserM * treadM * flightWidthM;
    return waistVol + stepsVol;
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

  const addBatchedElement = (
    preset: 'footing' | 'column' | 'beam' | 't-beam' | 'slab' | 'staircase' | 'pile' | 'wall'
  ) => {
    const templates: Record<typeof preset, Omit<ConcreteMemberItem, 'id' | 'computedVolumeM3'>> = {
      footing: {
        name: `Sloped Footing F${members.length + 1}`,
        shape: 'trapezoidal-footing',
        count: 4,
        lengthM: 2.0,
        widthM: 2.0,
        heightM: 0.5,
        baseRectHeightM: 0.2,
        slopedHeightM: 0.3,
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
      't-beam': {
        name: `Flanged T-Beam TB${members.length + 1}`,
        shape: 't-beam',
        count: 3,
        lengthM: 6.0,
        widthM: 0.25,
        heightM: 0.45,
        flangeWidthM: 0.9,
        flangeThicknessM: 0.125,
      },
      slab: {
        name: `Floor Slab Panel S${members.length + 1}`,
        shape: 'rectangular',
        count: 1,
        lengthM: 6.0,
        widthM: 4.5,
        heightM: 0.15,
      },
      staircase: {
        name: `Staircase Flight ST${members.length + 1}`,
        shape: 'staircase-waist',
        count: 2,
        lengthM: 2.75,
        widthM: 1.2,
        heightM: 1.65,
        waistThicknessM: 0.15,
        stepCount: 11,
        riserHeightM: 0.15,
        treadGoingM: 0.25,
      },
      pile: {
        name: `Bored Cast-in-Situ Pile P${members.length + 1}`,
        shape: 'bored-pile',
        count: 4,
        lengthM: 0.5,
        widthM: 0.5,
        diameterM: 0.5,
        heightM: 18.0,
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
              minSI: 0,
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
            <NumericDraftInput
              min={0}
              value={cm.ratioCement}
              onChangeValue={(val) => updateCM({ ratioCement: Math.max(0, val) })}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-sm bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Sand (Fine Agg)
            </span>
            <NumericDraftInput
              min={0}
              value={cm.ratioSand}
              onChangeValue={(val) => updateCM({ ratioSand: Math.max(0, val) })}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-sm bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Stone/Khoa (Coarse)
            </span>
            <NumericDraftInput
              min={0}
              value={cm.ratioAggregate}
              onChangeValue={(val) => updateCM({ ratioAggregate: Math.max(0, val) })}
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
            <NumericDraftInput
              min={0}
              max={1.75}
              value={cm.customDryFactor ?? 0}
              onChangeValue={(val) => updateCM({ customDryFactor: Math.max(0, val) })}
              className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Water / Cement Ratio
            </label>
            <NumericDraftInput
              min={0}
              value={cm.waterCementRatio ?? 0}
              onChangeValue={(val) => updateCM({ waterCementRatio: Math.max(0, val) })}
              className={`w-full min-h-[42px] px-2 rounded-lg border font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)] ${
                (cm.waterCementRatio ?? 0) > 1.2
                  ? 'border-rose-500 ring-1 ring-rose-500/40 text-rose-700 dark:text-rose-300'
                  : 'border-[var(--md-sys-color-outline)]'
              }`}
            />
            {(cm.waterCementRatio ?? 0) > 1.2 && (
              <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                Impossible W/C &gt; 1.2 (excessive segregation).
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Batch Wastage (%)
            </label>
            <NumericDraftInput
              min={0}
              max={25}
              value={cm.wastagePercent ?? 0}
              onChangeValue={(val) => updateCM({ wastagePercent: Math.max(0, val) })}
              className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
            />
          </div>
        </div>
      </div>

      {/* Site Volume Batching Box (Farrah / কাঠের ফারা), Tagari, Sand Bulking & Chemical Admixture */}
      <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
              Site Volume Batching Box (Farrah / কাঠের ফারা), Tagari &amp; Admixture
            </div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Calibrate wooden Farrah footprint, head-pan (Tagari) capacity, moist sand bulking (0%–35%), and chemical admixture dosage
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[
              { label: '0% Dry Sand', val: 0 },
              { label: '15% Damp', val: 15 },
              { label: '22% Moist', val: 22 },
              { label: '30% Wet Fine', val: 30 },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => updateCM({ sandBulkingPercent: b.val })}
                className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                  (cm.sandBulkingPercent ?? 0) === b.val
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent font-bold'
                    : 'bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline-variant)]'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Sand Bulking (%)
            </label>
            <NumericDraftInput
              min={0}
              max={35}
              value={cm.sandBulkingPercent ?? 0}
              onChangeValue={(val) => updateCM({ sandBulkingPercent: Math.max(0, Math.min(35, val)) })}
              className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Farrah L (inch)
            </label>
            <NumericDraftInput
              min={6}
              max={24}
              value={cm.farrahBoxLengthIn ?? 12}
              onChangeValue={(val) => updateCM({ farrahBoxLengthIn: Math.max(6, val) })}
              className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Farrah W (inch)
            </label>
            <NumericDraftInput
              min={6}
              max={24}
              value={cm.farrahBoxWidthIn ?? 12}
              onChangeValue={(val) => updateCM({ farrahBoxWidthIn: Math.max(6, val) })}
              className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Tagari Vol (CFT)
            </label>
            <NumericDraftInput
              min={0.25}
              max={1.5}
              value={cm.tagariCapacityCft ?? 0.625}
              onChangeValue={(val) => updateCM({ tagariCapacityCft: Math.max(0.1, val) })}
              className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Admixture (mL/Bag)
            </label>
            <NumericDraftInput
              min={0}
              max={1500}
              value={cm.admixtureDosageMlPerBag ?? 0}
              onChangeValue={(val) => updateCM({ admixtureDosageMlPerBag: Math.max(0, val) })}
              className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
              Admix (% Cem Wt)
            </label>
            <NumericDraftInput
              min={0}
              max={5}
              value={cm.admixtureDosagePercentByWeight ?? 0}
              onChangeValue={(val) => updateCM({ admixtureDosagePercentByWeight: Math.max(0, val) })}
              className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
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
                : 'Optional: Add Sloped Footings, Columns, T/L-Beams, Slabs, Staircases or Bored Piles'}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              { id: 'footing', label: '+ Sloped Footing' },
              { id: 'column', label: '+ Column' },
              { id: 'beam', label: '+ Beam' },
              { id: 't-beam', label: '+ T-Beam' },
              { id: 'slab', label: '+ Slab' },
              { id: 'staircase', label: '+ Staircase' },
              { id: 'pile', label: '+ Bored Pile' },
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
                          diameterM:
                            shape === 'circular-column' || shape === 'bored-pile'
                              ? next[idx].diameterM || next[idx].widthM || 0.5
                              : next[idx].diameterM,
                        };
                        updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                        next[idx] = updated;
                        syncMembers(next);
                      }}
                      className="sm:col-span-4 px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-[11px] bg-[var(--md-sys-color-surface)]"
                    >
                      <option value="rectangular">Rect (Beam / Col / Slab)</option>
                      <option value="trapezoidal-footing">Trapezoidal Sloped Footing</option>
                      <option value="t-beam">Flanged T-Beam</option>
                      <option value="l-beam">Flanged L-Beam</option>
                      <option value="staircase-waist">Staircase Waist Slab + Steps</option>
                      <option value="bored-pile">Bored Cast-in-Situ Pile</option>
                      <option value="circular-column">Circular Column</option>
                      <option value="retaining-wall-stem">Tapered Retaining Wall</option>
                    </select>
                    <div className="sm:col-span-2 flex items-center gap-1">
                      <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">Qty:</span>
                      <NumericDraftInput
                        allowDecimal={false}
                        min={0}
                        value={m.count}
                        onChangeValue={(val) => {
                          const next = [...members];
                          next[idx] = { ...next[idx], count: Math.max(0, Math.round(val)) };
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

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[11px] font-mono">
                    {m.shape === 'circular-column' || m.shape === 'bored-pile' ? (
                      <>
                        <div>
                          <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Diameter D (m)</span>
                          <NumericDraftInput
                            min={0}
                            value={m.diameterM ?? m.widthM}
                            onChangeValue={(val) => {
                              const next = [...members];
                              const updated = { ...next[idx], diameterM: Math.max(0, val) };
                              updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                              next[idx] = updated;
                              syncMembers(next);
                            }}
                            className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                            {m.shape === 'bored-pile' ? 'Pile Depth L (m)' : 'Height H (m)'}
                          </span>
                          <NumericDraftInput
                            min={0}
                            value={m.heightM}
                            onChangeValue={(val) => {
                              const next = [...members];
                              const updated = { ...next[idx], heightM: Math.max(0, val) };
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
                          <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                            {m.shape === 'staircase-waist' ? 'Horiz Going (m)' : 'Length L (m)'}
                          </span>
                          <NumericDraftInput
                            min={0}
                            value={m.lengthM}
                            onChangeValue={(val) => {
                              const next = [...members];
                              const updated = { ...next[idx], lengthM: Math.max(0, val) };
                              updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                              next[idx] = updated;
                              syncMembers(next);
                            }}
                            className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                            {m.shape === 'retaining-wall-stem'
                              ? 'Base Thk (m)'
                              : m.shape === 't-beam' || m.shape === 'l-beam'
                              ? 'Web bw (m)'
                              : m.shape === 'staircase-waist'
                              ? 'Flight W (m)'
                              : 'Width W (m)'}
                          </span>
                          <NumericDraftInput
                            min={0}
                            value={m.widthM}
                            onChangeValue={(val) => {
                              const next = [...members];
                              const updated = { ...next[idx], widthM: Math.max(0, val) };
                              updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                              next[idx] = updated;
                              syncMembers(next);
                            }}
                            className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                            {m.shape === 'staircase-waist'
                              ? 'Vert Rise H (m)'
                              : m.shape === 'trapezoidal-footing'
                              ? 'Total H (m)'
                              : 'Height/Depth (m)'}
                          </span>
                          <NumericDraftInput
                            min={0}
                            value={m.heightM}
                            onChangeValue={(val) => {
                              const next = [...members];
                              const updated = { ...next[idx], heightM: Math.max(0, val) };
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
                              <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Base Box H1 (m)</span>
                              <NumericDraftInput
                                min={0}
                                value={m.baseRectHeightM ?? 0}
                                onChangeValue={(val) => {
                                  const next = [...members];
                                  const updated = { ...next[idx], baseRectHeightM: Math.max(0, val) };
                                  updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                                  next[idx] = updated;
                                  syncMembers(next);
                                }}
                                className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                              />
                            </div>
                            <div>
                              <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Top L2 (m)</span>
                              <NumericDraftInput
                                min={0}
                                value={m.topLengthM ?? 0}
                                onChangeValue={(val) => {
                                  const next = [...members];
                                  const updated = { ...next[idx], topLengthM: Math.max(0, val) };
                                  updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                                  next[idx] = updated;
                                  syncMembers(next);
                                }}
                                className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                              />
                            </div>
                            <div>
                              <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Top W2 (m)</span>
                              <NumericDraftInput
                                min={0}
                                value={m.topWidthM ?? 0}
                                onChangeValue={(val) => {
                                  const next = [...members];
                                  const updated = { ...next[idx], topWidthM: Math.max(0, val) };
                                  updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                                  next[idx] = updated;
                                  syncMembers(next);
                                }}
                                className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                              />
                            </div>
                          </>
                        )}
                        {(m.shape === 't-beam' || m.shape === 'l-beam') && (
                          <>
                            <div>
                              <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Flange bf (m)</span>
                              <NumericDraftInput
                                min={0}
                                value={m.flangeWidthM ?? 0.75}
                                onChangeValue={(val) => {
                                  const next = [...members];
                                  const updated = { ...next[idx], flangeWidthM: Math.max(0, val) };
                                  updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                                  next[idx] = updated;
                                  syncMembers(next);
                                }}
                                className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                              />
                            </div>
                            <div>
                              <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Flange hf (m)</span>
                              <NumericDraftInput
                                min={0}
                                value={m.flangeThicknessM ?? 0.125}
                                onChangeValue={(val) => {
                                  const next = [...members];
                                  const updated = { ...next[idx], flangeThicknessM: Math.max(0, val) };
                                  updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                                  next[idx] = updated;
                                  syncMembers(next);
                                }}
                                className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                              />
                            </div>
                          </>
                        )}
                        {m.shape === 'staircase-waist' && (
                          <>
                            <div>
                              <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Waist Thk (m)</span>
                              <NumericDraftInput
                                min={0}
                                value={m.waistThicknessM ?? 0.15}
                                onChangeValue={(val) => {
                                  const next = [...members];
                                  const updated = { ...next[idx], waistThicknessM: Math.max(0, val) };
                                  updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                                  next[idx] = updated;
                                  syncMembers(next);
                                }}
                                className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                              />
                            </div>
                            <div>
                              <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Steps (Nos)</span>
                              <NumericDraftInput
                                min={0}
                                allowDecimal={false}
                                value={m.stepCount ?? 10}
                                onChangeValue={(val) => {
                                  const next = [...members];
                                  const updated = { ...next[idx], stepCount: Math.max(0, Math.round(val)) };
                                  updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                                  next[idx] = updated;
                                  syncMembers(next);
                                }}
                                className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] tabular-nums bg-[var(--md-sys-color-surface)]"
                              />
                            </div>
                            <div>
                              <span className="block text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Riser R (m)</span>
                              <NumericDraftInput
                                min={0}
                                value={m.riserHeightM ?? 0.15}
                                onChangeValue={(val) => {
                                  const next = [...members];
                                  const updated = { ...next[idx], riserHeightM: Math.max(0, val) };
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
                            <NumericDraftInput
                              min={0}
                              value={m.topWidthM ?? 0}
                              onChangeValue={(val) => {
                                const next = [...members];
                                const updated = { ...next[idx], topWidthM: Math.max(0, val) };
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
  const ft = result.farrahTagariSchedule;
  const adm = result.admixtureSchedule;

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
          subText={
            ft && ft.sandBulkingPercent > 0
              ? `Dry: ${result.sandCft.toFixed(1)} cft · Moist: ${ft.bulkedSandTotalCft.toFixed(1)} cft (+${ft.sandBulkingPercent}%)`
              : `${result.sandCft.toFixed(1)} cft (${result.sandMassKg.toFixed(0)} kg)`
          }
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
              <div>1.25 CFT (0.0354 m³) per bag</div>
              <div>Wastage: ×{result.wastageMultiplier.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Site Volume Batching Box (Farrah / কাঠের ফারা) & Tagari Head-Pan Schedule */}
      {ft && result.wetVolumeM3 > 0 && (
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5 text-xs font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider">
                Site Volume Batching Box (Farrah / কাঠের ফারা) &amp; Tagari Schedule (Per 50kg Bag)
              </span>
              <span className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Base Footprint: {ft.boxLengthIn}" × {ft.boxWidthIn}" · 1 Bag Cement = {ft.cementBagBoxString} · Tagari = {ft.tagariCapacityCft} CFT
              </span>
            </div>
            {ft.sandBulkingPercent > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[11px] tabular-nums">
                Sand Bulking +{ft.sandBulkingPercent}% Applied ({ft.bulkedSandTotalCft.toFixed(1)} CFT Moist)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 tabular-nums">
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase">1 Bag Cement Gauge Box</div>
              <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">{ft.cementBagBoxString}</div>
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                 Height: {ft.cementBagBoxHeightIn.toFixed(1)}" · {(1.25 / ft.tagariCapacityCft).toFixed(1)} Tagari / bag
              </div>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase">
                Sand per 50kg Bag {ft.sandBulkingPercent > 0 ? `(Moist +${ft.sandBulkingPercent}%)` : '(Dry)'}
              </div>
              <div className="text-sm font-bold text-[var(--md-sys-color-primary)] mt-0.5">
                {ft.sandPerBagBulkedCft.toFixed(2)} CFT · {ft.sandTagarisPerBag.toFixed(1)} Tagaris
              </div>
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                {ft.sandFarrahBoxesPerBag.toFixed(2)} Farrah boxes (H={ft.bulkedSandBoxHeightIn.toFixed(1)}") · Total: {ft.totalSandTagaris} Tagaris
              </div>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase">Coarse Stone/Khoa per 50kg Bag</div>
              <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                {ft.aggPerBagCft.toFixed(2)} CFT · {ft.aggTagarisPerBag.toFixed(1)} Tagaris
              </div>
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                {ft.aggFarrahBoxesPerBag.toFixed(2)} Farrah boxes · Total: {ft.totalAggTagaris} Tagaris
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chemical Admixture & Water-Proofing Dosage Schedule */}
      {adm && (adm.totalLiters > 0 || adm.dosageMlPerBag > 0) && (
        <div className="p-3 rounded-xl border border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface-container)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
          <div>
            <div className="text-[11px] font-bold text-[var(--md-sys-color-primary)] uppercase">
              Superplasticizer / Water-Proofing Admixture Schedule
            </div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Dosage: {adm.dosageMlPerBag.toFixed(0)} mL per 50kg bag ({adm.dosagePercentByWeight.toFixed(2)}% by cement wt)
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              {adm.totalLiters.toFixed(2)} Liters ({adm.totalKg.toFixed(2)} kg)
            </div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Procurement: {adm.jerrycans20L} × 20L Jerrycan(s)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
