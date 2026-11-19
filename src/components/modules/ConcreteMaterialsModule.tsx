import React, { useState } from 'react';
import {
  CivilWorkspace,
  BuildingCode,
  ConcreteMemberItem,
  ConcreteMemberShape,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { ConcreteMaterialResult } from '../../utils/calculations';
import { parseSmartUnitInput, normalizeToBase } from '../../utils/unitEngine';
import { evaluateMathExpression } from '../ui/TechnicalInput';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';
import { NumericDraftInput } from '../ui/NumericDraftInput';
import { Plus, Trash2, Copy, ClipboardPaste, Table2, LayoutList, Check, Upload } from 'lucide-react';

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

function parseLengthCellToMeters(rawToken: string, unitMode: 'm' | 'ft'): number {
  const cleaned = rawToken.trim();
  if (!cleaned) return 0;
  // Check for architectural feet-inches or explicit unit suffix first
  const smartRes = parseSmartUnitInput(cleaned, unitMode === 'ft' ? 'ft-in' : 'm', 'length');
  if (smartRes.isValid && Number.isFinite(smartRes.parsedValue) && smartRes.parsedValue >= 0) {
    const baseMeters = normalizeToBase(smartRes.parsedValue, smartRes.detectedUnitId, 'length');
    if (Number.isFinite(baseMeters) && baseMeters >= 0) {
      return Number(baseMeters.toFixed(4));
    }
  }
  const mathVal = evaluateMathExpression(cleaned);
  if (mathVal !== null && Number.isFinite(mathVal) && mathVal >= 0) {
    return Number((unitMode === 'ft' ? mathVal * 0.3048 : mathVal).toFixed(4));
  }
  const num = Number(cleaned);
  if (Number.isFinite(num) && num >= 0) {
    return Number((unitMode === 'ft' ? num * 0.3048 : num).toFixed(4));
  }
  return 0;
}

function inferShapeFromToken(token: string): ConcreteMemberShape {
  const t = token.trim().toLowerCase();
  if (t.includes('trap') || t.includes('footing') || t.includes('sloped')) return 'trapezoidal-footing';
  if (t.includes('t-beam') || t.includes('tbeam')) return 't-beam';
  if (t.includes('l-beam') || t.includes('lbeam')) return 'l-beam';
  if (t.includes('stair')) return 'staircase-waist';
  if (t.includes('pile')) return 'bored-pile';
  if (t.includes('circ')) return 'circular-column';
  if (t.includes('retaining') || t.includes('taper')) return 'retaining-wall-stem';
  return 'rectangular';
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
  const [scheduleViewMode, setScheduleViewMode] = useState<'table' | 'cards'>('table');
  const [selectedRowIdx, setSelectedRowIdx] = useState<number>(0);
  const [showCsvImporter, setShowCsvImporter] = useState<boolean>(false);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [csvInputUnit, setCsvInputUnit] = useState<'m' | 'ft'>('ft');

  const batchedTotalWetM3 = members.reduce(
    (s, m) => s + Math.max(0, m.count || 0) * computeMemberUnitVolume(m),
    0
  );

  const isManualOverride = Boolean(cm.useManualVolumeOverride);

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
        ...(!ws.concreteMaterials.useManualVolumeOverride && nextMembers.length > 0 && nextWet > 0
          ? { wetVolumeM3: Number(nextWet.toFixed(3)) }
          : {}),
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
        floorTag: 'Substructure',
        mixRatioPreset: 'global',
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
        floorTag: 'GF',
        mixRatioPreset: 'global',
        count: 6,
        lengthM: 0.3,
        widthM: 0.375,
        heightM: 3.05,
      },
      beam: {
        name: `Floor Beam B${members.length + 1}`,
        shape: 'rectangular',
        floorTag: 'GF',
        mixRatioPreset: 'global',
        count: 4,
        lengthM: 5.0,
        widthM: 0.25,
        heightM: 0.45,
      },
      't-beam': {
        name: `Flanged T-Beam TB${members.length + 1}`,
        shape: 't-beam',
        floorTag: 'Typical',
        mixRatioPreset: 'global',
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
        floorTag: 'Typical',
        mixRatioPreset: 'global',
        count: 1,
        lengthM: 6.0,
        widthM: 4.5,
        heightM: 0.125,
      },
      staircase: {
        name: `Staircase Flight ST${members.length + 1}`,
        shape: 'staircase-waist',
        floorTag: 'Typical',
        mixRatioPreset: 'global',
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
        floorTag: 'Substructure',
        mixRatioPreset: 'global',
        count: 4,
        lengthM: 0.5,
        widthM: 0.5,
        diameterM: 0.5,
        heightM: 18.0,
      },
      wall: {
        name: `Retaining Wall Stem RW${members.length + 1}`,
        shape: 'retaining-wall-stem',
        floorTag: 'Substructure',
        mixRatioPreset: 'global',
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
    const nextList = [...members, item];
    syncMembers(nextList);
    setSelectedRowIdx(nextList.length - 1);
  };

  const handleCloneMemberRow = (idx: number) => {
    const src = members[idx];
    if (!src) return;
    const clonedName = src.name.replace(/(\d+)$/, (_, n) => String(Number(n) + 1));
    const clone: ConcreteMemberItem = {
      ...src,
      id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: clonedName === src.name ? `${src.name} (Copy)` : clonedName,
    };
    const next = [...members.slice(0, idx + 1), clone, ...members.slice(idx + 1)];
    syncMembers(next);
    setSelectedRowIdx(idx + 1);
  };

  const handleBatchApplyMixRatio = (preset: NonNullable<ConcreteMemberItem['mixRatioPreset']>) => {
    if (members.length === 0) return;
    const next = members.map((m) => ({ ...m, mixRatioPreset: preset }));
    syncMembers(next);
  };

  const handleBatchApplyFloorTag = (floorTag: NonNullable<ConcreteMemberItem['floorTag']>) => {
    if (members.length === 0) return;
    const next = members.map((m) => ({ ...m, floorTag }));
    syncMembers(next);
  };

  const handleApplyDimensionChip = (patch: Partial<ConcreteMemberItem>) => {
    if (members.length === 0) {
      // Create a new member with this chip
      const base: ConcreteMemberItem = {
        id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: patch.name || 'RCC Member M1',
        shape: patch.shape || 'rectangular',
        floorTag: 'GF',
        mixRatioPreset: 'global',
        count: patch.count ?? 4,
        lengthM: patch.lengthM ?? 0.3,
        widthM: patch.widthM ?? 0.3,
        heightM: patch.heightM ?? 3.05,
        computedVolumeM3: 0,
        ...patch,
      };
      base.computedVolumeM3 = Number(computeMemberUnitVolume(base).toFixed(4));
      syncMembers([base]);
      setSelectedRowIdx(0);
      return;
    }
    const targetIdx = Math.min(Math.max(0, selectedRowIdx), members.length - 1);
    const next = [...members];
    const updated: ConcreteMemberItem = {
      ...next[targetIdx],
      ...patch,
    };
    updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
    next[targetIdx] = updated;
    syncMembers(next);
  };

  const parseCsvScheduleRows = (raw: string): ConcreteMemberItem[] => {
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
    const out: ConcreteMemberItem[] = [];
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].includes('\t')
        ? lines[i].split('\t').map((c) => c.trim())
        : lines[i].split(',').map((c) => c.trim());
      if (cols.length < 4) continue;
      // Skip header line if first qty/length column is non-numeric text like "Qty" or "Count"
      if (i === 0 && /^(qty|count|nos|shape|length)/i.test(cols[1]) && /^(qty|count|nos|length)/i.test(cols[2])) {
        continue;
      }
      // Support both: [Name, Shape, Qty, L, W, H] or [Name, Qty, L, W, H]
      let name = cols[0] || `Member M${i + 1}`;
      let shape: ConcreteMemberShape = 'rectangular';
      let qty = 1;
      let lM = 0;
      let wM = 0;
      let hM = 0;

      if (cols.length >= 6 && isNaN(Number(cols[1]))) {
        shape = inferShapeFromToken(cols[1]);
        qty = Math.max(1, Math.round(Number(cols[2]) || 1));
        lM = parseLengthCellToMeters(cols[3], csvInputUnit);
        wM = parseLengthCellToMeters(cols[4], csvInputUnit);
        hM = parseLengthCellToMeters(cols[5], csvInputUnit);
      } else {
        shape = inferShapeFromToken(name);
        qty = Math.max(1, Math.round(Number(cols[1]) || 1));
        lM = parseLengthCellToMeters(cols[2] || '0', csvInputUnit);
        wM = parseLengthCellToMeters(cols[3] || '0', csvInputUnit);
        hM = parseLengthCellToMeters(cols[4] || '0', csvInputUnit);
      }

      const item: ConcreteMemberItem = {
        id: `cm-csv-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
        name,
        shape,
        floorTag: 'GF',
        mixRatioPreset: 'global',
        count: qty,
        lengthM: lM,
        widthM: wM,
        diameterM: shape === 'circular-column' || shape === 'bored-pile' ? lM || wM : undefined,
        heightM: hM,
        computedVolumeM3: 0,
      };
      item.computedVolumeM3 = Number(computeMemberUnitVolume(item).toFixed(4));
      if (item.computedVolumeM3 > 0) {
        out.push(item);
      }
    }
    return out;
  };

  const previewParsedCsv = csvRawText.trim() ? parseCsvScheduleRows(csvRawText) : [];

  return (
    <div className="space-y-4">
      {/* Code, Wet Volume & Direct Override Toggle */}
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
          <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
            Supports Feet-Inches (12&apos;-6&quot;) &amp; Inline Math (e.g. 12.5 + 8.0) in all fields
          </span>
        </div>

        <div>
          {members.length > 0 && (
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Volume Source:
              </span>
              <div className="inline-flex rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-0.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => updateCM({ useManualVolumeOverride: false, wetVolumeM3: Number(batchedTotalWetM3.toFixed(3)) })}
                  className={`px-2 py-0.5 rounded cursor-pointer whitespace-nowrap shrink-0 ${
                    !isManualOverride
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                      : 'text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  Auto-Sum ({batchedTotalWetM3.toFixed(2)} m³)
                </button>
                <button
                  type="button"
                  onClick={() => updateCM({ useManualVolumeOverride: true })}
                  className={`px-2 py-0.5 rounded cursor-pointer whitespace-nowrap shrink-0 ${
                    isManualOverride
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                      : 'text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  Direct Override
                </button>
              </div>
            </div>
          )}
          <UnitInput
            label={
              !isManualOverride && members.length > 0 && batchedTotalWetM3 > 0
                ? 'Wet Concrete Volume (Auto-Batched)'
                : 'Wet Concrete Volume (Direct / Override)'
            }
            category="volume"
            siValue={
              !isManualOverride && members.length > 0 && batchedTotalWetM3 > 0
                ? batchedTotalWetM3
                : cm.wetVolumeM3
            }
            onChangeSI={(val) => updateCM({ wetVolumeM3: val, ...(members.length > 0 ? { useManualVolumeOverride: true } : {}) })}
            currentUnitId={getFieldUnit('mat.wetVolume', 'volume', 'm3')}
            onUnitChange={(u) => updateFieldUnit('mat.wetVolume', u)}
            customUnits={customUnits}
            step={0.5}
            presets={[
              { label: '1.0 m³ (35.3 cft)', valueSI: 1.0, title: 'Unit Volume Check (1 m³)' },
              { label: '2.83 m³ (100 cft)', valueSI: 2.8317, title: '100 CFT Site Pour Benchmark' },
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
            designTip="Enter math expressions (e.g. 12.5+8.2), switch units (m³ / CFT), or build from the Multi-Element Schedule below."
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
              <option value="crushed-stone">Crushed Stone (3/4&quot; Chips)</option>
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
                className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer whitespace-nowrap shrink-0 ${
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

      {/* High-Speed Multi-Element RCC Batching Schedule (Tabular Grid + Card View + CSV/Excel Paste) */}
      <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
              Multi-Element RCC Batching Schedule &amp; Tabular Takeoff
            </div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              {members.length > 0
                ? `${members.length} element group(s) summing to ${batchedTotalWetM3.toFixed(3)} m³ (${(batchedTotalWetM3 * 35.3147).toFixed(1)} CFT)`
                : 'Add Sloped Footings, Columns, T/L-Beams, Slabs, Staircases, Piles or paste from Excel/CSV'}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowCsvImporter((prev) => !prev)}
              className={`px-2.5 py-1.5 text-[11px] font-mono font-semibold rounded-lg border cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                showCsvImporter
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent'
                  : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste Excel / CSV</span>
            </button>

            {members.length > 0 && (
              <div className="inline-flex rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-0.5">
                <button
                  type="button"
                  onClick={() => setScheduleViewMode('table')}
                  className={`px-2 py-1 text-[10px] font-mono rounded flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                    scheduleViewMode === 'table'
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                      : 'text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                  title="Fast Tabular Grid with keyboard tabbing"
                >
                  <Table2 className="w-3 h-3" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleViewMode('cards')}
                  className={`px-2 py-1 text-[10px] font-mono rounded flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                    scheduleViewMode === 'cards'
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                      : 'text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                  title="Detailed Multi-Parameter Card View"
                >
                  <LayoutList className="w-3 h-3" />
                  <span>Detailed</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Member Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {([
            { id: 'footing', label: 'Sloped Footing' },
            { id: 'column', label: 'Column' },
            { id: 'beam', label: 'Beam' },
            { id: 't-beam', label: 'T-Beam' },
            { id: 'slab', label: 'Slab' },
            { id: 'staircase', label: 'Staircase' },
            { id: 'pile', label: 'Bored Pile' },
            { id: 'wall', label: 'Retaining Wall' },
          ] as const).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => addBatchedElement(btn.id)}
              className="px-2.5 py-1.5 text-[11px] font-mono font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
              <span>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Quick-Pick BD Standard Dimension Chips (applies to selected row or adds new) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/60">
          <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mr-1">
            BD Size Quick-Pick {members.length > 0 ? `(Row #${Math.min(selectedRowIdx + 1, members.length)})` : '(Add)'}:
          </span>
          {[
            { label: 'Col 10"×12"×10\'', patch: { shape: 'rectangular' as const, lengthM: 0.254, widthM: 0.3048, heightM: 3.048 } },
            { label: 'Col 12"×15"×10\'', patch: { shape: 'rectangular' as const, lengthM: 0.3048, widthM: 0.381, heightM: 3.048 } },
            { label: 'Col 12"×18"×10\'', patch: { shape: 'rectangular' as const, lengthM: 0.3048, widthM: 0.4572, heightM: 3.048 } },
            { label: 'Beam 10"×15"×16\'', patch: { shape: 'rectangular' as const, lengthM: 4.8768, widthM: 0.254, heightM: 0.381 } },
            { label: 'Beam 10"×18"×20\'', patch: { shape: 'rectangular' as const, lengthM: 6.096, widthM: 0.254, heightM: 0.4572 } },
            { label: 'Slab 5" (125mm)', patch: { shape: 'rectangular' as const, heightM: 0.125 } },
            { label: 'Slab 6" (150mm)', patch: { shape: 'rectangular' as const, heightM: 0.15 } },
            { label: 'Pile Ø20"×60\'', patch: { shape: 'bored-pile' as const, diameterM: 0.508, widthM: 0.508, heightM: 18.288 } },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleApplyDimensionChip(chip.patch)}
              className="px-2 py-0.5 text-[10px] font-mono rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Excel / CSV Paste & Import Drawer */}
        {showCsvImporter && (
          <div className="p-3 rounded-lg border border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface)] space-y-2.5 text-xs font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-bold text-[var(--md-sys-color-primary)]">
                  Paste Schedule from Excel / CSV (`Label, Shape, Qty, Length, Width, Height`)
                </div>
                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Supports Tab-separated Excel rows, CSV, Feet-Inches (`12&apos;-6&quot;`), or inline formulas (`10+2.5`)
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Input Unit:</span>
                <select
                  value={csvInputUnit}
                  onChange={(e) => setCsvInputUnit(e.target.value as 'm' | 'ft')}
                  className="px-2 py-1 rounded border border-[var(--md-sys-color-outline)] text-[11px] bg-[var(--md-sys-color-surface)]"
                >
                  <option value="ft">Feet (ft / 12&apos;-6&quot;)</option>
                  <option value="m">Meters (m)</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setCsvInputUnit('ft');
                    setCsvRawText(
                      [
                        'Footing F1\ttrapezoidal-footing\t6\t6\'-0"\t6\'-0"\t1\'-8"',
                        'Column C1\trectangular\t8\t1\'-0"\t1\'-3"\t10\'-0"',
                        'Grade Beam GB1\trectangular\t6\t18\'-0"\t0\'-10"\t1\'-6"',
                        'Floor Slab S1\trectangular\t1\t36\'-0"\t28\'-0"\t0\'-5"',
                      ].join('\n')
                    );
                  }}
                  className="px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer text-[10px] whitespace-nowrap shrink-0"
                >
                  Load Sample BD Schedule
                </button>
                <label className="px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer text-[10px] flex items-center gap-1 whitespace-nowrap shrink-0">
                  <Upload className="w-3 h-3" />
                  <span>CSV File</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setCsvRawText(reader.result);
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            <textarea
              rows={4}
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              placeholder={`Paste Excel or CSV rows here, e.g.:\nColumn C1, rectangular, 8, 1'-0", 1'-3", 10'-0"\nFloor Beam B1, rectangular, 6, 16'-6", 0'-10", 1'-6"`}
              className="w-full p-2 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface-container-lowest)]"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
                Parsed Preview: <strong>{previewParsedCsv.length}</strong> valid member row(s) (
                {previewParsedCsv
                  .reduce((s, item) => s + item.count * computeMemberUnitVolume(item), 0)
                  .toFixed(2)}{' '}
                m³)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={previewParsedCsv.length === 0}
                  onClick={() => {
                    if (previewParsedCsv.length === 0) return;
                    syncMembers([...members, ...previewParsedCsv]);
                    setCsvRawText('');
                    setShowCsvImporter(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Append {previewParsedCsv.length} Row(s)</span>
                </button>
                <button
                  type="button"
                  disabled={previewParsedCsv.length === 0}
                  onClick={() => {
                    if (previewParsedCsv.length === 0) return;
                    syncMembers(previewParsedCsv);
                    setCsvRawText('');
                    setShowCsvImporter(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] font-bold text-[11px] disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Replace Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Batch Apply Mix Ratio & Story Stage Bar */}
        {members.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[10px] font-mono">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-semibold mr-1">
                Batch Apply Mix to All:
              </span>
              {([
                { id: 'global', label: 'Use Global Mix' },
                { id: '1:1.5:3', label: '1:1.5:3 (M20)' },
                { id: '1:1:2', label: '1:1:2 (M25)' },
                { id: '1:2:4', label: '1:2:4 (M15)' },
                { id: '1:3:6', label: '1:3:6 (PCC)' },
              ] as const).map((mixBtn) => (
                <button
                  key={mixBtn.id}
                  type="button"
                  onClick={() => handleBatchApplyMixRatio(mixBtn.id)}
                  className="px-2 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] cursor-pointer whitespace-nowrap shrink-0"
                >
                  {mixBtn.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-semibold mr-1">
                Stage:
              </span>
              {(['Substructure', 'GF', 'Typical', 'Roof'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleBatchApplyFloorTag(st)}
                  className="px-2 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] cursor-pointer whitespace-nowrap shrink-0"
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Rows: Fast Tabular Grid View vs Detailed Card View */}
        {members.length > 0 && scheduleViewMode === 'table' && (
          <div className="overflow-x-auto rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  <th className="py-2 px-2">Member Label</th>
                  <th className="py-2 px-1.5">Shape</th>
                  <th className="py-2 px-1.5">Mix Ratio</th>
                  <th className="py-2 px-1.5 text-right">Qty</th>
                  <th className="py-2 px-1.5 text-right">Length (m)</th>
                  <th className="py-2 px-1.5 text-right">Width/Dia (m)</th>
                  <th className="py-2 px-1.5 text-right">Height/Depth (m)</th>
                  <th className="py-2 px-2 text-right">Wet Vol</th>
                  <th className="py-2 px-1.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/60">
                {members.map((m, idx) => {
                  const unitVol = computeMemberUnitVolume(m);
                  const totalVol = unitVol * Math.max(0, m.count || 0);
                  const isCirc = m.shape === 'circular-column' || m.shape === 'bored-pile';
                  return (
                    <tr
                      key={m.id || idx}
                      onClick={() => setSelectedRowIdx(idx)}
                      className={`transition-colors ${
                        selectedRowIdx === idx
                          ? 'bg-[var(--md-sys-color-primary)]/5'
                          : 'hover:bg-[var(--md-sys-color-surface-container-low)]'
                      }`}
                    >
                      <td className="py-1.5 px-2 min-w-[130px]">
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => {
                            const next = [...members];
                            next[idx] = { ...next[idx], name: e.target.value };
                            syncMembers(next);
                          }}
                          className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-xs font-sans font-medium"
                        />
                      </td>
                      <td className="py-1.5 px-1.5 min-w-[125px]">
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
                          className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[11px]"
                        >
                          <option value="rectangular">Rect (Col/Beam/Slab)</option>
                          <option value="trapezoidal-footing">Sloped Footing</option>
                          <option value="t-beam">T-Beam</option>
                          <option value="l-beam">L-Beam</option>
                          <option value="staircase-waist">Staircase Flight</option>
                          <option value="bored-pile">Bored Pile</option>
                          <option value="circular-column">Circular Col</option>
                          <option value="retaining-wall-stem">Retaining Wall</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-1.5 min-w-[105px]">
                        <select
                          value={m.mixRatioPreset || 'global'}
                          onChange={(e) => {
                            const next = [...members];
                            next[idx] = {
                              ...next[idx],
                              mixRatioPreset: e.target.value as ConcreteMemberItem['mixRatioPreset'],
                            };
                            syncMembers(next);
                          }}
                          className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[11px]"
                        >
                          <option value="global">Global ({cm.ratioCement}:{cm.ratioSand}:{cm.ratioAggregate})</option>
                          <option value="1:1.5:3">1:1.5:3 (M20)</option>
                          <option value="1:1:2">1:1:2 (M25)</option>
                          <option value="1:2:4">1:2:4 (M15)</option>
                          <option value="1:3:6">1:3:6 (PCC)</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-1.5 w-[72px]">
                        <NumericDraftInput
                          allowDecimal={false}
                          min={0}
                          hideUnitSelector={true}
                          value={m.count}
                          onChangeValue={(val) => {
                            const next = [...members];
                            next[idx] = { ...next[idx], count: Math.max(0, Math.round(val)) };
                            syncMembers(next);
                          }}
                          className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] text-right bg-[var(--md-sys-color-surface)]"
                        />
                      </td>
                      <td className="py-1.5 px-1.5 min-w-[105px]">
                        {isCirc ? (
                          <span className="block text-center text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                            Circular (Ø)
                          </span>
                        ) : (
                          <NumericDraftInput
                            min={0}
                            baseUnit="m"
                            unitCategory="length"
                            value={m.lengthM}
                            onChangeValue={(val) => {
                              const next = [...members];
                              const updated = { ...next[idx], lengthM: Math.max(0, val) };
                              updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                              next[idx] = updated;
                              syncMembers(next);
                            }}
                            className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] text-right bg-[var(--md-sys-color-surface)]"
                          />
                        )}
                      </td>
                      <td className="py-1.5 px-1.5 min-w-[105px]">
                        <NumericDraftInput
                          min={0}
                          baseUnit="m"
                          unitCategory="length"
                          value={isCirc ? (m.diameterM ?? m.widthM) : m.widthM}
                          onChangeValue={(val) => {
                            const next = [...members];
                            const updated = isCirc
                              ? { ...next[idx], diameterM: Math.max(0, val), widthM: Math.max(0, val) }
                              : { ...next[idx], widthM: Math.max(0, val) };
                            updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                            next[idx] = updated;
                            syncMembers(next);
                          }}
                          className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] text-right bg-[var(--md-sys-color-surface)]"
                        />
                      </td>
                      <td className="py-1.5 px-1.5 min-w-[105px]">
                        <NumericDraftInput
                          min={0}
                          baseUnit="m"
                          unitCategory="length"
                          value={m.heightM}
                          onChangeValue={(val) => {
                            const next = [...members];
                            const updated = { ...next[idx], heightM: Math.max(0, val) };
                            updated.computedVolumeM3 = Number(computeMemberUnitVolume(updated).toFixed(4));
                            next[idx] = updated;
                            syncMembers(next);
                          }}
                          className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] text-right bg-[var(--md-sys-color-surface)]"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right whitespace-nowrap">
                        <div className="font-bold text-[var(--md-sys-color-primary)]">
                          {totalVol.toFixed(2)} m³
                        </div>
                        <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                          {(totalVol * 35.3147).toFixed(1)} cft
                        </div>
                      </td>
                      <td className="py-1.5 px-1.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloneMemberRow(idx);
                            }}
                            className="p-1 rounded hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] cursor-pointer"
                            title="Clone / Duplicate Row"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              syncMembers(members.filter((_, i) => i !== idx));
                            }}
                            className="p-1 rounded hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-error)] cursor-pointer"
                            title="Remove Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detailed Multi-Parameter Card View (for Sloped Footings, Staircases, Flanged Beams) */}
        {members.length > 0 && scheduleViewMode === 'cards' && (
          <div className="space-y-2">
            {members.map((m, idx) => {
              const unitVol = computeMemberUnitVolume(m);
              const totalVol = unitVol * Math.max(0, m.count || 0);
              return (
                <div
                  key={m.id || idx}
                  onClick={() => setSelectedRowIdx(idx)}
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
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCloneMemberRow(idx)}
                          className="p-1 text-[var(--md-sys-color-primary)] hover:opacity-80 cursor-pointer"
                          title="Duplicate element"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
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
          </div>
        )}

        {members.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
              Schedule Total: <strong>{batchedTotalWetM3.toFixed(3)} m³</strong> ({(batchedTotalWetM3 * 35.3147).toFixed(1)} CFT)
            </span>
            <button
              type="button"
              onClick={() => syncMembers([])}
              className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] cursor-pointer"
            >
              Clear schedule (switch to manual volume)
            </button>
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
