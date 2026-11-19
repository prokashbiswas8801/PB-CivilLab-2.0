import React, { useState } from 'react';
import {
  CivilWorkspace,
  CustomUnitDefinition,
  MasonryOpening,
  MasonryWallSegment,
  UnitCategoryKey,
} from '../../types/civil';
import { MasonryResult } from '../../utils/calculations';
import { parseSmartUnitInput, normalizeToBase } from '../../utils/unitEngine';
import { evaluateMathExpression } from '../ui/TechnicalInput';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';
import { MaterialTakeoff } from '../calculators/construction/MaterialTakeoff';
import {
  FileSpreadsheet,
  Box,
  Plus,
  Trash2,
  Copy,
  ClipboardPaste,
  Upload,
  Check,
  Building2,
  ArrowDownToLine,
} from 'lucide-react';
import { NumericDraftInput } from '../ui/NumericDraftInput';

export { MaterialTakeoff };

export interface MasonryFinishesInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

function parseLengthTokenMeters(rawToken: string, unitMode: 'm' | 'ft'): number {
  const cleaned = rawToken.trim();
  if (!cleaned) return 0;
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

export const MasonryFinishesInputs: React.FC<MasonryFinishesInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  const [takeoffMode, setTakeoffMode] = useState<'suite' | 'single'>('single');
  const [showWallCsvImporter, setShowWallCsvImporter] = useState<boolean>(false);
  const [wallCsvText, setWallCsvText] = useState<string>('');
  const [wallCsvUnit, setWallCsvUnit] = useState<'m' | 'ft'>('ft');

  const [showOpeningCsvImporter, setShowOpeningCsvImporter] = useState<boolean>(false);
  const [openingCsvText, setOpeningCsvText] = useState<string>('');
  const [openingCsvUnit, setOpeningCsvUnit] = useState<'m' | 'ft'>('ft');
  const [selectedOpeningIdx, setSelectedOpeningIdx] = useState<number>(0);

  const m = activeWorkspace.masonry;
  const wallSegments = Array.isArray(m.wallSegments) ? m.wallSegments : [];
  const wallEntryMode: 'single' | 'schedule' | 'direct-override' =
    m.wallEntryMode || (wallSegments.length > 0 ? 'schedule' : 'single');

  const updateMasonry = (patch: Partial<typeof m>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      masonry: { ...ws.masonry, ...patch },
    }));
  };

  const syncWallSegments = (nextSegments: MasonryWallSegment[], extraPatch?: Partial<typeof m>) => {
    let totalLen = 0;
    let totalArea = 0;
    let totalVol = 0;
    for (const seg of nextSegments) {
      const cnt = Math.max(0, seg.count || 0);
      const len = Math.max(0, seg.lengthM || 0);
      const beamDed = Math.max(0, seg.beamDepthDeductionM || 0);
      const effH =
        seg.effectiveHeightM !== undefined && seg.effectiveHeightM > 0
          ? seg.effectiveHeightM
          : Math.max(0, (seg.storyHeightM || 0) - beamDed);
      const thk = Math.max(0, seg.thicknessM || m.wallThicknessM || 0.125);
      const area = cnt * len * effH;
      totalLen += cnt * len;
      totalArea += area;
      totalVol += area * thk;
    }
    const avgHeight = totalLen > 0 ? Number((totalArea / totalLen).toFixed(3)) : m.wallHeightM;
    const avgThick = totalArea > 0 ? Number((totalVol / totalArea).toFixed(3)) : m.wallThicknessM;

    updateMasonry({
      wallSegments: nextSegments,
      wallEntryMode: nextSegments.length > 0 ? 'schedule' : 'single',
      ...(nextSegments.length > 0 && totalLen > 0
        ? {
            wallLengthM: Number(totalLen.toFixed(3)),
            wallHeightM: avgHeight,
            wallThicknessM: avgThick,
          }
        : {}),
      ...extraPatch,
    });
  };

  const addWallSegmentRow = (presetType: 'ext-10in' | 'part-5in') => {
    const idx = wallSegments.length + 1;
    const is10In = presetType === 'ext-10in';
    const storyH = 3.048; // 10'-0"
    const beamDed = 0.381; // 15"
    const seg: MasonryWallSegment = {
      id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: is10In ? `External 10" Wall W${idx}` : `Internal 5" Partition P${idx}`,
      roomTag: is10In ? 'Perimeter' : 'Partition',
      count: 1,
      lengthM: is10In ? 4.2672 : 3.6576, // 14' or 12'
      storyHeightM: storyH,
      beamDepthDeductionM: beamDed,
      effectiveHeightM: Number((storyH - beamDed).toFixed(3)),
      thicknessM: is10In ? 0.25 : 0.125,
      mortarRatioSand: is10In ? 5 : 4,
    };
    syncWallSegments([...wallSegments, seg]);
  };

  const handleCloneWallRow = (idx: number) => {
    const src = wallSegments[idx];
    if (!src) return;
    const clonedName = src.name.replace(/(\d+)$/, (_, n) => String(Number(n) + 1));
    const clone: MasonryWallSegment = {
      ...src,
      id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: clonedName === src.name ? `${src.name} (Copy)` : clonedName,
    };
    const next = [...wallSegments.slice(0, idx + 1), clone, ...wallSegments.slice(idx + 1)];
    syncWallSegments(next);
  };

  const handleBatchApplyWallSpec = (patch: { thicknessM?: number; mortarRatioSand?: number; beamDepthDeductionM?: number }) => {
    if (wallSegments.length === 0) return;
    const next = wallSegments.map((seg) => {
      const nextBeamDed =
        patch.beamDepthDeductionM !== undefined ? patch.beamDepthDeductionM : (seg.beamDepthDeductionM || 0);
      return {
        ...seg,
        ...(patch.thicknessM !== undefined ? { thicknessM: patch.thicknessM } : {}),
        ...(patch.mortarRatioSand !== undefined ? { mortarRatioSand: patch.mortarRatioSand } : {}),
        ...(patch.beamDepthDeductionM !== undefined
          ? {
              beamDepthDeductionM: nextBeamDed,
              effectiveHeightM: Number(Math.max(0.1, (seg.storyHeightM || 3.048) - nextBeamDed).toFixed(3)),
            }
          : {}),
      };
    });
    syncWallSegments(next, {
      ...(patch.thicknessM !== undefined ? { wallThicknessM: patch.thicknessM } : {}),
      ...(patch.mortarRatioSand !== undefined
        ? { mortarRatioCement: 1, mortarRatioSand: patch.mortarRatioSand }
        : {}),
    });
  };

  const applyArchitecturalRoomTemplate = (
    templateId: 'bedroom-12x14' | 'master-bed-bath' | 'drawing-dining' | 'kitchen-dado' | 'typical-3bhk'
  ) => {
    const now = Date.now();
    if (templateId === 'bedroom-12x14') {
      const segs: MasonryWallSegment[] = [
        {
          id: `ws-${now}-1`,
          name: 'Bedroom Ext Walls (14\' & 12\')',
          roomTag: 'Bedroom',
          count: 2,
          lengthM: 3.9624,
          storyHeightM: 3.048,
          beamDepthDeductionM: 0.381,
          effectiveHeightM: 2.667,
          thicknessM: 0.25,
          mortarRatioSand: 5,
        },
        {
          id: `ws-${now}-2`,
          name: 'Bedroom Int Partitions (14\' & 12\')',
          roomTag: 'Bedroom',
          count: 2,
          lengthM: 3.9624,
          storyHeightM: 3.048,
          beamDepthDeductionM: 0.381,
          effectiveHeightM: 2.667,
          thicknessM: 0.125,
          mortarRatioSand: 4,
        },
      ];
      const ops: MasonryOpening[] = [
        { id: `op-${now}-1`, name: 'Door D1 (3\'-4"×7\')', type: 'door', count: 1, widthM: 1.016, heightM: 2.1336, includeGrill: false, includeThaiAluminum: false },
        { id: `op-${now}-2`, name: 'Window W1 (5\'×4\'-6")', type: 'window', count: 2, widthM: 1.524, heightM: 1.3716, includeGrill: true, includeThaiAluminum: true },
      ];
      syncWallSegments(segs, {
        openings: ops,
        floorLengthM: 4.2672,
        floorWidthM: 3.6576,
        plasterThicknessMm: 12,
        plasterSides: 2,
        plasterRatioCement: 1,
        plasterRatioSand: 4,
        autoDeductLintels: true,
        autoAddJambSillPlaster: true,
      });
    } else if (templateId === 'master-bed-bath') {
      const segs: MasonryWallSegment[] = [
        {
          id: `ws-${now}-1`,
          name: 'Master Bed Ext Walls (16\' & 14\')',
          roomTag: 'Master Bed',
          count: 2,
          lengthM: 4.572,
          storyHeightM: 3.048,
          beamDepthDeductionM: 0.381,
          effectiveHeightM: 2.667,
          thicknessM: 0.25,
          mortarRatioSand: 5,
        },
        {
          id: `ws-${now}-2`,
          name: 'Master Bed + Attached Bath 5" Walls',
          roomTag: 'Bath & Partition',
          count: 4,
          lengthM: 3.2,
          storyHeightM: 3.048,
          beamDepthDeductionM: 0.381,
          effectiveHeightM: 2.667,
          thicknessM: 0.125,
          mortarRatioSand: 4,
        },
      ];
      const ops: MasonryOpening[] = [
        { id: `op-${now}-1`, name: 'Bed Door D1 (3\'-4"×7\')', type: 'door', count: 1, widthM: 1.016, heightM: 2.1336, includeGrill: false, includeThaiAluminum: false },
        { id: `op-${now}-2`, name: 'Bath Door D2 (2\'-6"×7\')', type: 'door', count: 1, widthM: 0.762, heightM: 2.1336, includeGrill: false, includeThaiAluminum: false },
        { id: `op-${now}-3`, name: 'Window W1 (5\'×4\'-6")', type: 'window', count: 2, widthM: 1.524, heightM: 1.3716, includeGrill: true, includeThaiAluminum: true },
        { id: `op-${now}-4`, name: 'Bath Ventilator V1 (2\'×1\'-6")', type: 'ventilator', count: 1, widthM: 0.6096, heightM: 0.4572, includeGrill: true, includeThaiAluminum: true },
      ];
      syncWallSegments(segs, {
        openings: ops,
        floorLengthM: 4.8768,
        floorWidthM: 4.2672,
        wallTileHeightM: 2.1336,
        wallTileLengthM: 7.9248,
        plasterThicknessMm: 12,
        plasterSides: 2,
        plasterRatioCement: 1,
        plasterRatioSand: 4,
        autoDeductLintels: true,
        autoAddJambSillPlaster: true,
      });
    } else if (templateId === 'drawing-dining') {
      const segs: MasonryWallSegment[] = [
        {
          id: `ws-${now}-1`,
          name: 'Drawing/Dining Ext Wall (22\')',
          roomTag: 'Drawing/Dining',
          count: 2,
          lengthM: 6.7056,
          storyHeightM: 3.048,
          beamDepthDeductionM: 0.4572,
          effectiveHeightM: 2.5908,
          thicknessM: 0.25,
          mortarRatioSand: 5,
        },
        {
          id: `ws-${now}-2`,
          name: 'Drawing/Dining Cross Walls (14\')',
          roomTag: 'Drawing/Dining',
          count: 2,
          lengthM: 4.2672,
          storyHeightM: 3.048,
          beamDepthDeductionM: 0.4572,
          effectiveHeightM: 2.5908,
          thicknessM: 0.125,
          mortarRatioSand: 4,
        },
      ];
      const ops: MasonryOpening[] = [
        { id: `op-${now}-1`, name: 'Main Entry Door MD (4\'×7\')', type: 'door', count: 1, widthM: 1.2192, heightM: 2.1336, includeGrill: false, includeThaiAluminum: false },
        { id: `op-${now}-2`, name: 'Sliding Window W1 (6\'×4\'-6")', type: 'window', count: 2, widthM: 1.8288, heightM: 1.3716, includeGrill: true, includeThaiAluminum: true },
        { id: `op-${now}-3`, name: 'Veranda Grill VG1 (8\'×4\')', type: 'veranda-grill', count: 1, widthM: 2.4384, heightM: 1.2192, includeGrill: true, includeThaiAluminum: false },
      ];
      syncWallSegments(segs, {
        openings: ops,
        floorLengthM: 6.7056,
        floorWidthM: 4.2672,
        plasterThicknessMm: 12,
        plasterSides: 2,
        plasterRatioCement: 1,
        plasterRatioSand: 4,
        autoDeductLintels: true,
        autoAddJambSillPlaster: true,
      });
    } else if (templateId === 'kitchen-dado') {
      const segs: MasonryWallSegment[] = [
        {
          id: `ws-${now}-1`,
          name: 'Kitchen Walls (10\' & 8\')',
          roomTag: 'Kitchen',
          count: 4,
          lengthM: 2.7432,
          storyHeightM: 3.048,
          beamDepthDeductionM: 0.381,
          effectiveHeightM: 2.667,
          thicknessM: 0.125,
          mortarRatioSand: 4,
        },
      ];
      const ops: MasonryOpening[] = [
        { id: `op-${now}-1`, name: 'Kitchen Door D2 (2\'-8"×7\')', type: 'door', count: 1, widthM: 0.8128, heightM: 2.1336, includeGrill: false, includeThaiAluminum: false },
        { id: `op-${now}-2`, name: 'Kitchen Window KW (4\'×3\'-6")', type: 'window', count: 1, widthM: 1.2192, heightM: 1.0668, includeGrill: true, includeThaiAluminum: true },
      ];
      syncWallSegments(segs, {
        openings: ops,
        floorLengthM: 3.048,
        floorWidthM: 2.4384,
        wallTileHeightM: 2.1336,
        wallTileLengthM: 10.9728,
        plasterThicknessMm: 12,
        plasterSides: 2,
        plasterRatioCement: 1,
        plasterRatioSand: 4,
        autoDeductLintels: true,
        autoAddJambSillPlaster: true,
      });
    } else if (templateId === 'typical-3bhk') {
      const segs: MasonryWallSegment[] = [
        {
          id: `ws-${now}-1`,
          name: 'Perimeter 10" Load-Bearing Walls',
          roomTag: 'Perimeter',
          count: 1,
          lengthM: 42.672, // 140 RFT perimeter
          storyHeightM: 3.048,
          beamDepthDeductionM: 0.4572,
          effectiveHeightM: 2.5908,
          thicknessM: 0.25,
          mortarRatioSand: 5,
        },
        {
          id: `ws-${now}-2`,
          name: 'Internal 5" Room & Bath Partitions',
          roomTag: 'Internal',
          count: 1,
          lengthM: 54.864, // 180 RFT internal walls
          storyHeightM: 3.048,
          beamDepthDeductionM: 0.381,
          effectiveHeightM: 2.667,
          thicknessM: 0.125,
          mortarRatioSand: 4,
        },
      ];
      const ops: MasonryOpening[] = [
        { id: `op-${now}-1`, name: 'Bedroom Doors D1 (3\'-4"×7\')', type: 'door', count: 4, widthM: 1.016, heightM: 2.1336, includeGrill: false, includeThaiAluminum: false },
        { id: `op-${now}-2`, name: 'Bath/Kitchen Doors D2 (2\'-6"×7\')', type: 'door', count: 4, widthM: 0.762, heightM: 2.1336, includeGrill: false, includeThaiAluminum: false },
        { id: `op-${now}-3`, name: 'Sliding Windows W1 (5\'×4\'-6")', type: 'window', count: 6, widthM: 1.524, heightM: 1.3716, includeGrill: true, includeThaiAluminum: true },
        { id: `op-${now}-4`, name: 'Bath Ventilators V1 (2\'×1\'-6")', type: 'ventilator', count: 3, widthM: 0.6096, heightM: 0.4572, includeGrill: true, includeThaiAluminum: true },
      ];
      syncWallSegments(segs, {
        openings: ops,
        floorLengthM: 12.192,
        floorWidthM: 9.144,
        wallTileHeightM: 2.1336,
        wallTileLengthM: 24.0,
        plasterThicknessMm: 12,
        plasterSides: 2,
        plasterRatioCement: 1,
        plasterRatioSand: 4,
        autoDeductLintels: true,
        autoAddJambSillPlaster: true,
      });
    }
  };

  const handleSyncFromConcreteSchedule = () => {
    const concMembers = activeWorkspace.concreteMaterials.members || [];
    let colCount = 0;
    let colWidthM = 0.3;
    let colHeightM = m.wallHeightM || 3.048;
    let beamDepthM = 0.45;

    for (const cmItem of concMembers) {
      const nameLower = cmItem.name.toLowerCase();
      if (cmItem.shape === 'circular-column' || nameLower.includes('col')) {
        colCount += Math.max(0, cmItem.count || 0);
        colWidthM = cmItem.diameterM || Math.max(cmItem.lengthM || 0, cmItem.widthM || 0) || 0.3;
        if (cmItem.heightM > 0) colHeightM = cmItem.heightM;
      } else if (cmItem.shape === 't-beam' || cmItem.shape === 'l-beam' || nameLower.includes('beam')) {
        if (cmItem.heightM > 0) beamDepthM = cmItem.heightM;
      }
    }

    updateMasonry({
      structuralDeductionMode: 'auto-beam-col',
      beamSlabDeductionDepthM: Number(beamDepthM.toFixed(3)),
      deductColumnCount: colCount > 0 ? colCount : 4,
      deductColumnWidthM: Number(colWidthM.toFixed(3)),
      deductColumnHeightM: Number(colHeightM.toFixed(3)),
    });
  };

  const parseWallCsvRows = (raw: string): MasonryWallSegment[] => {
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
    const out: MasonryWallSegment[] = [];
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].includes('\t')
        ? lines[i].split('\t').map((c) => c.trim())
        : lines[i].split(',').map((c) => c.trim());
      if (cols.length < 3) continue;
      if (i === 0 && /^(qty|count|nos|length|story)/i.test(cols[1])) continue;
      // Format: [Label, Qty, Length, StoryHeight, ThicknessInOrM]
      const name = cols[0] || `Wall W${i + 1}`;
      const count = Math.max(1, Math.round(Number(cols[1]) || 1));
      const lenM = parseLengthTokenMeters(cols[2] || '0', wallCsvUnit);
      const storyHM = parseLengthTokenMeters(cols[3] || (wallCsvUnit === 'ft' ? '10' : '3.0'), wallCsvUnit);
      const rawThk = cols[4] || '';
      let thkM = m.wallThicknessM || 0.125;
      if (rawThk.includes('10') || rawThk.includes('250') || rawThk === '0.25') thkM = 0.25;
      else if (rawThk.includes('5') || rawThk.includes('125') || rawThk === '0.125') thkM = 0.125;
      else if (Number(rawThk) > 0) thkM = parseLengthTokenMeters(rawThk, wallCsvUnit);

      if (lenM > 0 && storyHM > 0) {
        out.push({
          id: `ws-csv-${Date.now()}-${i}`,
          name,
          roomTag: thkM >= 0.2 ? 'External' : 'Partition',
          count,
          lengthM: lenM,
          storyHeightM: storyHM,
          beamDepthDeductionM: 0,
          effectiveHeightM: storyHM,
          thicknessM: thkM,
          mortarRatioSand: thkM >= 0.2 ? 5 : 4,
        });
      }
    }
    return out;
  };

  const parseOpeningCsvRows = (raw: string): MasonryOpening[] => {
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
    const out: MasonryOpening[] = [];
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].includes('\t')
        ? lines[i].split('\t').map((c) => c.trim())
        : lines[i].split(',').map((c) => c.trim());
      if (cols.length < 4) continue;
      if (i === 0 && /^(type|qty|count|width)/i.test(cols[1])) continue;
      // Format: [Name, Type, Qty, Width, Height] or [Name, Qty, Width, Height]
      let name = cols[0] || `Opening OP${i + 1}`;
      let opType: NonNullable<MasonryOpening['type']> = 'window';
      let qty = 1;
      let wM = 0;
      let hM = 0;
      if (cols.length >= 5 && isNaN(Number(cols[1]))) {
        const t = cols[1].toLowerCase();
        opType = t.includes('door')
          ? 'door'
          : t.includes('vent')
          ? 'ventilator'
          : t.includes('lintel')
          ? 'lintel'
          : t.includes('grill')
          ? 'veranda-grill'
          : 'window';
        qty = Math.max(1, Math.round(Number(cols[2]) || 1));
        wM = parseLengthTokenMeters(cols[3], openingCsvUnit);
        hM = parseLengthTokenMeters(cols[4], openingCsvUnit);
      } else {
        const nL = name.toLowerCase();
        opType = nL.includes('door') || nL.startsWith('d')
          ? 'door'
          : nL.includes('vent') || nL.startsWith('v')
          ? 'ventilator'
          : 'window';
        qty = Math.max(1, Math.round(Number(cols[1]) || 1));
        wM = parseLengthTokenMeters(cols[2], openingCsvUnit);
        hM = parseLengthTokenMeters(cols[3], openingCsvUnit);
      }
      if (wM > 0 && hM > 0) {
        out.push({
          id: `op-csv-${Date.now()}-${i}`,
          name,
          type: opType,
          count: qty,
          widthM: wM,
          heightM: hM,
          includeGrill: opType !== 'door' && opType !== 'lintel',
          includeThaiAluminum: opType === 'window',
        });
      }
    }
    return out;
  };

  const previewWallsCsv = wallCsvText.trim() ? parseWallCsvRows(wallCsvText) : [];
  const previewOpeningsCsv = openingCsvText.trim() ? parseOpeningCsvRows(openingCsvText) : [];

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
    const nextOps = [
      ...existing,
      {
        ...template,
        id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      },
    ];
    updateMasonry({ openings: nextOps });
    setSelectedOpeningIdx(nextOps.length - 1);
  };

  const handleCloneOpeningRow = (idx: number) => {
    const existing = m.openings || [];
    const src = existing[idx];
    if (!src) return;
    const clonedName = src.name.replace(/(\d+)$/, (_, n) => String(Number(n) + 1));
    const clone: MasonryOpening = {
      ...src,
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: clonedName === src.name ? `${src.name} (Copy)` : clonedName,
    };
    const next = [...existing.slice(0, idx + 1), clone, ...existing.slice(idx + 1)];
    updateMasonry({ openings: next });
    setSelectedOpeningIdx(idx + 1);
  };

  const handleApplyOpeningQuickChip = (patch: Partial<MasonryOpening>) => {
    const existing = m.openings || [];
    if (existing.length === 0) {
      const first: MasonryOpening = {
        id: `op-${Date.now()}-chip`,
        name: patch.name || 'Window W1',
        type: patch.type || 'window',
        count: patch.count ?? 1,
        widthM: patch.widthM ?? 1.524,
        heightM: patch.heightM ?? 1.3716,
        includeGrill: patch.includeGrill ?? (patch.type !== 'door'),
        includeThaiAluminum: patch.includeThaiAluminum ?? (patch.type === 'window'),
      };
      updateMasonry({ openings: [first] });
      setSelectedOpeningIdx(0);
      return;
    }
    const targetIdx = Math.min(Math.max(0, selectedOpeningIdx), existing.length - 1);
    const next = [...existing];
    next[targetIdx] = { ...next[targetIdx], ...patch };
    updateMasonry({ openings: next });
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
          <span>Wall, Room Schedule, Openings &amp; Finishes Sizer</span>
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
          {/* Wall Entry Mode Bar & Room/Floor Templates */}
          <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
                  Brick Masonry Wall Input Method &amp; Room Templates
                </div>
                <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Enter Feet-Inches (`12&apos;-6&quot;`), inline math (`14+12`), multi-wall schedules, or load a BD room template
                </div>
              </div>

              <div className="inline-flex rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-0.5 text-[11px] font-mono">
                {([
                  { id: 'single', label: 'Single Wall' },
                  { id: 'schedule', label: `Multi-Wall Grid (${wallSegments.length})` },
                  { id: 'direct-override', label: 'Direct Area/Vol' },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => updateMasonry({ wallEntryMode: tab.id })}
                    className={`px-2.5 py-1 rounded cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                      wallEntryMode === tab.id
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Room & Floor Quick Templates */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/60">
              <span className="text-[10px] font-mono font-semibold text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 mr-1">
                <Building2 className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                <span>Room &amp; Floor Templates:</span>
              </span>
              {([
                { id: 'bedroom-12x14', label: 'Bedroom (12\'×14\')' },
                { id: 'master-bed-bath', label: 'Master Bed + Bath' },
                { id: 'drawing-dining', label: 'Drawing/Dining (14\'×22\')' },
                { id: 'kitchen-dado', label: 'Kitchen (8\'×10\' + Dado)' },
                { id: 'typical-3bhk', label: 'Typical 3BHK Floor' },
              ] as const).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyArchitecturalRoomTemplate(tpl.id)}
                  className="px-2.5 py-1 text-[10px] font-mono font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* MODE 1: Single Wall Dimensions */}
            {wallEntryMode === 'single' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
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
                    { label: '3.66 m (12\'-0")', valueSI: 3.6576, title: 'Standard 12 ft Room Wall' },
                    { label: '5.0 m (16\'-5")', valueSI: 5.0, title: 'Standard Room Wall' },
                    { label: '10.0 m (32\'-10")', valueSI: 10.0, title: 'Medium Run Wall' },
                    { label: '15.0 m (49\'-3")', valueSI: 15.0, title: 'Boundary / Long Wall' },
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
                    { label: '2.59 m (8\'-6" Clear)', valueSI: 2.5908, title: '10 ft Story minus 18 in Beam' },
                    { label: '2.74 m (9\'-0")', valueSI: 2.7432, title: 'Low Story Height' },
                    { label: '3.05 m (10\'-0")', valueSI: 3.048, title: 'Standard BD Floor-to-Floor' },
                    { label: '3.66 m (12\'-0")', valueSI: 3.6576, title: 'Commercial Story Height' },
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
                    { label: '125 mm (5")', valueSI: 0.125, title: '5" Half-Brick Partition Wall' },
                    { label: '250 mm (10")', valueSI: 0.25, title: '10" Full-Brick Load-Bearing Wall' },
                  ]}
                />
              </div>
            )}

            {/* MODE 2: Fast Tabular Multi-Wall Schedule Grid */}
            {wallEntryMode === 'schedule' && (
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => addWallSegmentRow('ext-10in')}
                      className="px-2.5 py-1.5 text-[11px] font-mono font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                      <span>10&quot; External Wall</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addWallSegmentRow('part-5in')}
                      className="px-2.5 py-1.5 text-[11px] font-mono font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                      <span>5&quot; Partition Wall</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWallCsvImporter((prev) => !prev)}
                      className={`px-2.5 py-1.5 text-[11px] font-mono font-semibold rounded-lg border cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                        showWallCsvImporter
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent'
                          : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                      }`}
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Paste Excel / CSV Walls</span>
                    </button>
                  </div>

                  {wallSegments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
                      <span className="text-[var(--md-sys-color-on-surface-variant)]">Batch Apply:</span>
                      <button
                        type="button"
                        onClick={() => handleBatchApplyWallSpec({ thicknessM: 0.125, mortarRatioSand: 4 })}
                        className="px-2 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)] cursor-pointer whitespace-nowrap shrink-0"
                      >
                        All 5&quot; (1:4)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchApplyWallSpec({ thicknessM: 0.25, mortarRatioSand: 5 })}
                        className="px-2 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)] cursor-pointer whitespace-nowrap shrink-0"
                      >
                        All 10&quot; (1:5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchApplyWallSpec({ beamDepthDeductionM: 0.381 })}
                        className="px-2 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)] cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Beam Drop -15&quot;
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchApplyWallSpec({ beamDepthDeductionM: 0.4572 })}
                        className="px-2 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)] cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Beam Drop -18&quot;
                      </button>
                    </div>
                  )}
                </div>

                {/* Wall CSV / Excel Importer */}
                {showWallCsvImporter && (
                  <div className="p-3 rounded-lg border border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface)] space-y-2 text-xs font-mono">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-[var(--md-sys-color-primary)]">
                          Paste Wall Schedule from Excel / CSV (`Label, Qty, Length, StoryHeight, Thickness`)
                        </div>
                        <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                          Accepts Feet-Inches (`14&apos;-6&quot;`), decimal feet/meters, or `5&quot; / 10&quot;` thickness
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={wallCsvUnit}
                          onChange={(e) => setWallCsvUnit(e.target.value as 'm' | 'ft')}
                          className="px-2 py-1 rounded border border-[var(--md-sys-color-outline)] text-[11px] bg-[var(--md-sys-color-surface)]"
                        >
                          <option value="ft">Feet (ft / 12&apos;-6&quot;)</option>
                          <option value="m">Meters (m)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setWallCsvUnit('ft');
                            setWallCsvText(
                              [
                                'North & South Ext Wall\t2\t36\'-0"\t10\'-0"\t10"',
                                'East & West Ext Wall\t2\t28\'-0"\t10\'-0"\t10"',
                                'Bedroom 5" Partitions\t4\t14\'-0"\t10\'-0"\t5"',
                                'Bath & Kitchen Walls\t4\t8\'-6"\t10\'-0"\t5"',
                              ].join('\n')
                            );
                          }}
                          className="px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer text-[10px] whitespace-nowrap shrink-0"
                        >
                          Load Sample Floor Walls
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={wallCsvText}
                      onChange={(e) => setWallCsvText(e.target.value)}
                      placeholder={`North Ext Wall, 2, 36'-0", 10'-0", 10"\nInternal Partition, 4, 12'-6", 10'-0", 5"`}
                      className="w-full p-2 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface-container-lowest)]"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
                        Parsed Preview: <strong>{previewWallsCsv.length}</strong> wall segment(s)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={previewWallsCsv.length === 0}
                          onClick={() => {
                            syncWallSegments([...wallSegments, ...previewWallsCsv]);
                            setWallCsvText('');
                            setShowWallCsvImporter(false);
                          }}
                          className="px-3 py-1 rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Append {previewWallsCsv.length} Wall(s)</span>
                        </button>
                        <button
                          type="button"
                          disabled={previewWallsCsv.length === 0}
                          onClick={() => {
                            syncWallSegments(previewWallsCsv);
                            setWallCsvText('');
                            setShowWallCsvImporter(false);
                          }}
                          className="px-3 py-1 rounded border border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] font-bold text-[11px] disabled:opacity-40 cursor-pointer"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {wallSegments.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-[var(--md-sys-color-outline-variant)] text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                    No wall segments yet. Click <strong>10&quot; External Wall</strong>, <strong>5&quot; Partition Wall</strong>, or a <strong>Room Template</strong> above to start.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                    <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                      <thead>
                        <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase">
                          <th className="py-2 px-2">Wall / Room Label</th>
                          <th className="py-2 px-1.5 text-right">Qty</th>
                          <th className="py-2 px-1.5 text-right">Length (m)</th>
                          <th className="py-2 px-1.5 text-right">Story H (m)</th>
                          <th className="py-2 px-1.5 text-right">Beam Drop (m)</th>
                          <th className="py-2 px-1.5 text-right">Clear H</th>
                          <th className="py-2 px-1.5">Thickness</th>
                          <th className="py-2 px-2 text-right">Gross Area</th>
                          <th className="py-2 px-1.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/60">
                        {wallSegments.map((seg, idx) => {
                          const clearH = Math.max(0, (seg.storyHeightM || 0) - (seg.beamDepthDeductionM || 0));
                          const segArea = Math.max(0, seg.count || 0) * Math.max(0, seg.lengthM || 0) * clearH;
                          return (
                            <tr key={seg.id || idx} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                              <td className="py-1.5 px-2 min-w-[140px]">
                                <input
                                  type="text"
                                  value={seg.name}
                                  onChange={(e) => {
                                    const next = [...wallSegments];
                                    next[idx] = { ...next[idx], name: e.target.value };
                                    syncWallSegments(next);
                                  }}
                                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-xs font-sans font-medium"
                                />
                              </td>
                              <td className="py-1.5 px-1.5 w-[64px]">
                                <NumericDraftInput
                                  allowDecimal={false}
                                  min={0}
                                  hideUnitSelector={true}
                                  value={seg.count}
                                  onChangeValue={(val) => {
                                    const next = [...wallSegments];
                                    next[idx] = { ...next[idx], count: Math.max(0, Math.round(val)) };
                                    syncWallSegments(next);
                                  }}
                                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] text-right bg-[var(--md-sys-color-surface)]"
                                />
                              </td>
                              <td className="py-1.5 px-1.5 min-w-[100px]">
                                <NumericDraftInput
                                  min={0}
                                  baseUnit="m"
                                  unitCategory="length"
                                  value={seg.lengthM}
                                  onChangeValue={(val) => {
                                    const next = [...wallSegments];
                                    next[idx] = { ...next[idx], lengthM: Math.max(0, val) };
                                    syncWallSegments(next);
                                  }}
                                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] text-right bg-[var(--md-sys-color-surface)]"
                                />
                              </td>
                              <td className="py-1.5 px-1.5 min-w-[100px]">
                                <NumericDraftInput
                                  min={0}
                                  baseUnit="m"
                                  unitCategory="length"
                                  value={seg.storyHeightM}
                                  onChangeValue={(val) => {
                                    const next = [...wallSegments];
                                    const sH = Math.max(0, val);
                                    const bDed = next[idx].beamDepthDeductionM || 0;
                                    next[idx] = {
                                      ...next[idx],
                                      storyHeightM: sH,
                                      effectiveHeightM: Number(Math.max(0, sH - bDed).toFixed(3)),
                                    };
                                    syncWallSegments(next);
                                  }}
                                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] text-right bg-[var(--md-sys-color-surface)]"
                                />
                              </td>
                              <td className="py-1.5 px-1.5 min-w-[95px]">
                                <NumericDraftInput
                                  min={0}
                                  baseUnit="m"
                                  unitCategory="length"
                                  value={seg.beamDepthDeductionM ?? 0}
                                  onChangeValue={(val) => {
                                    const next = [...wallSegments];
                                    const bDed = Math.max(0, val);
                                    const sH = next[idx].storyHeightM || 0;
                                    next[idx] = {
                                      ...next[idx],
                                      beamDepthDeductionM: bDed,
                                      effectiveHeightM: Number(Math.max(0, sH - bDed).toFixed(3)),
                                    };
                                    syncWallSegments(next);
                                  }}
                                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] text-right bg-[var(--md-sys-color-surface)]"
                                />
                              </td>
                              <td className="py-1.5 px-1.5 text-right text-[var(--md-sys-color-on-surface-variant)] whitespace-nowrap">
                                {clearH.toFixed(2)}m
                              </td>
                              <td className="py-1.5 px-1.5 min-w-[95px]">
                                <select
                                  value={seg.thicknessM >= 0.2 ? '0.25' : '0.125'}
                                  onChange={(e) => {
                                    const next = [...wallSegments];
                                    const thk = Number(e.target.value);
                                    next[idx] = {
                                      ...next[idx],
                                      thicknessM: thk,
                                      mortarRatioSand: thk >= 0.2 ? 5 : 4,
                                    };
                                    syncWallSegments(next);
                                  }}
                                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[11px]"
                                >
                                  <option value="0.125">5&quot; (125mm)</option>
                                  <option value="0.25">10&quot; (250mm)</option>
                                </select>
                              </td>
                              <td className="py-1.5 px-2 text-right whitespace-nowrap">
                                <div className="font-bold text-[var(--md-sys-color-primary)]">
                                  {segArea.toFixed(2)} m²
                                </div>
                                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                  {(segArea * 10.7639).toFixed(1)} sft
                                </div>
                              </td>
                              <td className="py-1.5 px-1.5 text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleCloneWallRow(idx)}
                                    className="p-1 rounded hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] cursor-pointer"
                                    title="Clone Wall Row"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => syncWallSegments(wallSegments.filter((_, i) => i !== idx))}
                                    className="p-1 rounded hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-error)] cursor-pointer"
                                    title="Delete Wall Row"
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
              </div>
            )}

            {/* MODE 3: Direct Gross Area / Volume Override */}
            {wallEntryMode === 'direct-override' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <UnitInput
                  label="Direct Gross Wall Area Override"
                  category="area"
                  siValue={m.directGrossAreaOverrideM2 || m.wallLengthM * m.wallHeightM}
                  onChangeSI={(val) =>
                    updateMasonry({
                      directGrossAreaOverrideM2: val,
                      wallLengthM: val > 0 ? Number((val / Math.max(1, m.wallHeightM || 3.0)).toFixed(3)) : 0,
                      wallHeightM: m.wallHeightM > 0 ? m.wallHeightM : 3.0,
                    })
                  }
                  currentUnitId={getFieldUnit('mas.directArea', 'area', 'm2')}
                  onUnitChange={(u) => updateFieldUnit('mas.directArea', u)}
                  customUnits={customUnits}
                  presets={[
                    { label: '15 m² (161 sft)', valueSI: 15.0 },
                    { label: '46.5 m² (500 sft)', valueSI: 46.4515 },
                    { label: '92.9 m² (1000 sft)', valueSI: 92.903 },
                  ]}
                />
                <UnitInput
                  label="Direct Net Brickwork Vol (Optional)"
                  category="volume"
                  siValue={m.directNetVolumeOverrideM3 || 0}
                  onChangeSI={(val) => updateMasonry({ directNetVolumeOverrideM3: val })}
                  currentUnitId={getFieldUnit('mas.directVol', 'volume', 'm3')}
                  onUnitChange={(u) => updateFieldUnit('mas.directVol', u)}
                  customUnits={customUnits}
                  presets={[
                    { label: '0 (Compute from Area)', valueSI: 0 },
                    { label: '2.83 m³ (100 cft)', valueSI: 2.8317 },
                    { label: '10.0 m³ (353 cft)', valueSI: 10.0 },
                  ]}
                />
                <UnitInput
                  label="Nominal Wall Thickness"
                  category="length"
                  siValue={m.wallThicknessM}
                  onChangeSI={(val) => updateMasonry({ wallThicknessM: val })}
                  currentUnitId={getFieldUnit('mas.wallT', 'length', 'm')}
                  onUnitChange={(u) => updateFieldUnit('mas.wallT', u)}
                  customUnits={customUnits}
                  presets={[
                    { label: '125 mm (5")', valueSI: 0.125 },
                    { label: '250 mm (10")', valueSI: 0.25 },
                  ]}
                />
              </div>
            )}

            {/* Structural RCC Beam & Column Deduction Bar (Auto + Manual Custom) */}
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-2 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-[var(--md-sys-color-primary)] uppercase">
                    Structural RCC Beam &amp; Column Deductions from Wall
                  </span>
                  <span className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                    Auto-deduct top floor beam drop &amp; intersecting RCC columns, or enter custom structural deductions
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="inline-flex rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-0.5 text-[10px]">
                    {([
                      { id: 'none', label: 'No RCC Ded.' },
                      { id: 'auto-beam-col', label: 'Auto Beam & Col' },
                      { id: 'manual', label: 'Manual Custom' },
                    ] as const).map((modeBtn) => (
                      <button
                        key={modeBtn.id}
                        type="button"
                        onClick={() => updateMasonry({ structuralDeductionMode: modeBtn.id })}
                        className={`px-2 py-0.5 rounded cursor-pointer whitespace-nowrap shrink-0 ${
                          (m.structuralDeductionMode || 'none') === modeBtn.id
                            ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                            : 'text-[var(--md-sys-color-on-surface-variant)]'
                        }`}
                      >
                        {modeBtn.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncFromConcreteSchedule}
                    className="px-2 py-1 rounded border border-[var(--md-sys-color-primary)]/50 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10 cursor-pointer flex items-center gap-1 text-[10px] font-bold whitespace-nowrap shrink-0"
                    title="Pull Beam Depth & Column Sizes from Concrete Materials Schedule"
                  >
                    <ArrowDownToLine className="w-3 h-3" />
                    <span>Sync from Concrete Module</span>
                  </button>
                </div>
              </div>

              {m.structuralDeductionMode === 'auto-beam-col' && (
                <div className="space-y-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/60">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                        Floor Beam Drop Depth (m)
                      </span>
                      <NumericDraftInput
                        min={0}
                        baseUnit="m"
                        unitCategory="length"
                        value={m.beamSlabDeductionDepthM ?? 0}
                        onChangeValue={(val) => updateMasonry({ beamSlabDeductionDepthM: Math.max(0, val) })}
                        className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] tabular-nums bg-[var(--md-sys-color-surface)]"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                        Intersecting RCC Columns (Nos)
                      </span>
                      <NumericDraftInput
                        min={0}
                        allowDecimal={false}
                        hideUnitSelector={true}
                        value={m.deductColumnCount ?? 0}
                        onChangeValue={(val) => updateMasonry({ deductColumnCount: Math.max(0, Math.round(val)) })}
                        className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] tabular-nums bg-[var(--md-sys-color-surface)]"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                        Column Width in Wall (m)
                      </span>
                      <NumericDraftInput
                        min={0}
                        baseUnit="m"
                        unitCategory="length"
                        value={m.deductColumnWidthM ?? 0.3}
                        onChangeValue={(val) => updateMasonry({ deductColumnWidthM: Math.max(0, val) })}
                        className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] tabular-nums bg-[var(--md-sys-color-surface)]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="text-[var(--md-sys-color-on-surface-variant)]">Quick Presets:</span>
                    {[
                      { label: 'Beam 12" (0.30m)', patch: { beamSlabDeductionDepthM: 0.3048 } },
                      { label: 'Beam 15" (0.38m)', patch: { beamSlabDeductionDepthM: 0.381 } },
                      { label: 'Beam 18" (0.45m)', patch: { beamSlabDeductionDepthM: 0.4572 } },
                      { label: '2 Cols × 12"', patch: { deductColumnCount: 2, deductColumnWidthM: 0.3048 } },
                      { label: '4 Cols × 15"', patch: { deductColumnCount: 4, deductColumnWidthM: 0.381 } },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => updateMasonry(p.patch)}
                        className="px-2 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {m.structuralDeductionMode === 'manual' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/60">
                  <div>
                    <span className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                      Custom Structural Deduction Area (m²)
                    </span>
                    <NumericDraftInput
                      min={0}
                      baseUnit="m2"
                      unitCategory="area"
                      value={m.manualStructuralDeductionAreaM2 ?? 0}
                      onChangeValue={(val) => updateMasonry({ manualStructuralDeductionAreaM2: Math.max(0, val) })}
                      className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] tabular-nums bg-[var(--md-sys-color-surface)]"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                      Custom Structural Deduction Volume (m³)
                    </span>
                    <NumericDraftInput
                      min={0}
                      baseUnit="m3"
                      unitCategory="volume"
                      value={m.manualStructuralDeductionM3 ?? 0}
                      onChangeValue={(val) => updateMasonry({ manualStructuralDeductionM3: Math.max(0, val) })}
                      className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] tabular-nums bg-[var(--md-sys-color-surface)]"
                    />
                  </div>
                </div>
              )}
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
                  <option value="bd-pwd-metric">BD Standard Brick (240 × 115 × 70 mm / 9.5&quot;×4.5&quot;×2.75&quot;, 12mm joint)</option>
                  <option value="modular-metric">Modular Metric Brick (190 × 90 × 90 mm, 10mm joint = 500/m³)</option>
                  <option value="traditional-field">Traditional Field Brick (241 × 114 × 70 mm, 10mm joint)</option>
                </select>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
                  Nominal with mortar: {(m.brickLengthMm ?? 0) + (m.mortarJointMm ?? 0)} × {(m.brickWidthMm ?? 0) + (m.mortarJointMm ?? 0)} × {(m.brickHeightMm ?? 0) + (m.mortarJointMm ?? 0)} mm
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Mortar Joint (mm)
                  </label>
                  <NumericDraftInput
                    min={0}
                    max={25}
                    value={m.mortarJointMm ?? 0}
                    onChangeValue={(val) => updateMasonry({ mortarJointMm: Math.max(0, val) })}
                    className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Mortar Ratio (1:N)
                  </label>
                  <select
                    value={m.mortarRatioSand ?? 0}
                    onChange={(e) => {
                      const ratio = Number(e.target.value);
                      updateMasonry({ mortarRatioCement: ratio > 0 ? 1 : 0, mortarRatioSand: ratio });
                    }}
                    className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                  >
                    <option value="0">0 (Unset)</option>
                    <option value="4">1 : 4 (5&quot; Wall)</option>
                    <option value="5">1 : 5 (10&quot; Wall)</option>
                    <option value="6">1 : 6 (General)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Brick Waste (%)
                  </label>
                  <NumericDraftInput
                    min={0}
                    max={15}
                    value={m.brickWastagePercent ?? 0}
                    onChangeValue={(val) => updateMasonry({ brickWastagePercent: Math.max(0, val) })}
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
                  onChange={(e) => updateMasonry({ subbaseType: e.target.value as typeof m.subbaseType })}
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
                <NumericDraftInput
                  min={0}
                  value={m.khoaConcreteVolumeM3 ?? 0}
                  onChangeValue={(val) => updateMasonry({ khoaConcreteVolumeM3: Math.max(0, val) })}
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
                  <NumericDraftInput
                    min={0}
                    value={m.bfsLayerAreaM2 ?? 0}
                    onChangeValue={(val) => updateMasonry({ bfsLayerAreaM2: Math.max(0, val) })}
                    className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                  />
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
                    ~{((m.bfsLayerAreaM2 ?? 0) * 10.7639).toFixed(0)} SFT bed
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">Sand Cushion Bed (mm)</label>
                  <NumericDraftInput
                    min={0}
                    max={200}
                    value={m.bfsSandCushionThicknessMm ?? 0}
                    onChangeValue={(val) => updateMasonry({ bfsSandCushionThicknessMm: Math.max(0, val) })}
                    className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                  />
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
                    Standard sand bed: 75mm (3 in) PWD clause
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Deduction Schedule: Doors, Windows, Ventilators, RCC Lintels + CSV Paste */}
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
                <button
                  type="button"
                  onClick={() => setShowOpeningCsvImporter((prev) => !prev)}
                  className={`px-2.5 py-1.5 text-[11px] font-mono font-semibold rounded-lg border cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    showOpeningCsvImporter
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste CSV</span>
                </button>
              </div>
            </div>

            {/* Quick BD Opening Size Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/60">
              <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mr-1">
                BD Opening Size Chips {(m.openings || []).length > 0 ? `(Row #${Math.min(selectedOpeningIdx + 1, (m.openings || []).length)})` : '(Add)'}:
              </span>
              {[
                { label: 'Main Door 3\'-6"×7\'', patch: { type: 'door' as const, widthM: 1.0668, heightM: 2.1336 } },
                { label: 'Bed Door 3\'-4"×7\'', patch: { type: 'door' as const, widthM: 1.016, heightM: 2.1336 } },
                { label: 'Bath Door 2\'-6"×7\'', patch: { type: 'door' as const, widthM: 0.762, heightM: 2.1336 } },
                { label: 'Win 5\'×4\'-6"', patch: { type: 'window' as const, widthM: 1.524, heightM: 1.3716 } },
                { label: 'Win 4\'×4\'', patch: { type: 'window' as const, widthM: 1.2192, heightM: 1.2192 } },
                { label: 'Vent 2\'×1\'-6"', patch: { type: 'ventilator' as const, widthM: 0.6096, heightM: 0.4572 } },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleApplyOpeningQuickChip(chip.patch)}
                  className="px-2 py-0.5 text-[10px] font-mono rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] cursor-pointer whitespace-nowrap shrink-0"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Opening CSV Paste Importer */}
            {showOpeningCsvImporter && (
              <div className="p-3 rounded-lg border border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface)] space-y-2 text-xs font-mono">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-[var(--md-sys-color-primary)]">
                      Paste Door / Window Schedule (`Label, Type, Qty, Width, Height`)
                    </div>
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                      Accepts Feet-Inches (`3&apos;-4&quot;`) or decimal dimensions
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={openingCsvUnit}
                      onChange={(e) => setOpeningCsvUnit(e.target.value as 'm' | 'ft')}
                      className="px-2 py-1 rounded border border-[var(--md-sys-color-outline)] text-[11px] bg-[var(--md-sys-color-surface)]"
                    >
                      <option value="ft">Feet (ft / 3&apos;-4&quot;)</option>
                      <option value="m">Meters (m)</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setOpeningCsvUnit('ft');
                        setOpeningCsvText(
                          [
                            'Door D1\tdoor\t4\t3\'-4"\t7\'-0"',
                            'Bath Door D2\tdoor\t3\t2\'-6"\t7\'-0"',
                            'Window W1\twindow\t6\t5\'-0"\t4\'-6"',
                            'Ventilator V1\tventilator\t3\t2\'-0"\t1\'-6"',
                          ].join('\n')
                        );
                      }}
                      className="px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer text-[10px] whitespace-nowrap shrink-0"
                    >
                      Load Sample Openings
                    </button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={openingCsvText}
                  onChange={(e) => setOpeningCsvText(e.target.value)}
                  placeholder={`Door D1, door, 4, 3'-4", 7'-0"\nWindow W1, window, 6, 5'-0", 4'-6"`}
                  className="w-full p-2 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface-container-lowest)]"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
                    Parsed Preview: <strong>{previewOpeningsCsv.length}</strong> opening group(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={previewOpeningsCsv.length === 0}
                      onClick={() => {
                        updateMasonry({ openings: [...(m.openings || []), ...previewOpeningsCsv] });
                        setOpeningCsvText('');
                        setShowOpeningCsvImporter(false);
                      }}
                      className="px-3 py-1 rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Append {previewOpeningsCsv.length} Opening(s)</span>
                    </button>
                    <button
                      type="button"
                      disabled={previewOpeningsCsv.length === 0}
                      onClick={() => {
                        updateMasonry({ openings: previewOpeningsCsv });
                        setOpeningCsvText('');
                        setShowOpeningCsvImporter(false);
                      }}
                      className="px-3 py-1 rounded border border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] font-bold text-[11px] disabled:opacity-40 cursor-pointer"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {(m.openings || []).map((op, idx) => (
                <div
                  key={op.id || idx}
                  onClick={() => setSelectedOpeningIdx(idx)}
                  className={`p-2.5 rounded-lg border bg-[var(--md-sys-color-surface)] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs transition-colors ${
                    selectedOpeningIdx === idx
                      ? 'border-[var(--md-sys-color-primary)]'
                      : 'border-[var(--md-sys-color-outline-variant)]'
                  }`}
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
                    <NumericDraftInput
                      min={0}
                      baseUnit="m"
                      unitCategory="length"
                      value={op.widthM}
                      onChangeValue={(val) => {
                        const updated = [...(m.openings || [])];
                        updated[idx] = { ...updated[idx], widthM: Math.max(0, val) };
                        updateMasonry({ openings: updated });
                      }}
                      className="w-full px-1.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                      title="Width (m)"
                    />
                    <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">H:</span>
                    <NumericDraftInput
                      min={0}
                      baseUnit="m"
                      unitCategory="length"
                      value={op.heightM}
                      onChangeValue={(val) => {
                        const updated = [...(m.openings || [])];
                        updated[idx] = { ...updated[idx], heightM: Math.max(0, val) };
                        updateMasonry({ openings: updated });
                      }}
                      className="w-full px-1.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                      title="Height (m)"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center gap-1">
                    <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">×</span>
                    <NumericDraftInput
                      min={0}
                      allowDecimal={false}
                      hideUnitSelector={true}
                      value={op.count}
                      onChangeValue={(val) => {
                        const updated = [...(m.openings || [])];
                        updated[idx] = { ...updated[idx], count: Math.max(0, Math.round(val)) };
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
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloneOpeningRow(idx);
                        }}
                        className="text-[var(--md-sys-color-primary)] hover:opacity-80 p-1 cursor-pointer"
                        title="Clone opening item"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
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
                </div>
              ))}
            </div>

            {/* Automated RCC Lintel Bearing Deduction & Jamb/Sill Plaster Reveal Addition */}
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-2 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-[var(--md-sys-color-primary)]">
                  <input
                    type="checkbox"
                    checked={Boolean(m.autoDeductLintels)}
                    onChange={(e) => updateMasonry({ autoDeductLintels: e.target.checked })}
                  />
                  <span>Auto-Deduct RCC Lintel Bearing Above Openings</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-emerald-700 dark:text-emerald-400">
                  <input
                    type="checkbox"
                    checked={Boolean(m.autoAddJambSillPlaster)}
                    onChange={(e) => updateMasonry({ autoAddJambSillPlaster: e.target.checked })}
                  />
                  <span>Auto-Add Door/Window Jamb &amp; Sill Reveal Plaster</span>
                </label>
              </div>
              {m.autoDeductLintels && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Lintel Depth (mm, default 150mm / 6&quot;)</span>
                    <NumericDraftInput
                      min={75}
                      max={400}
                      allowDecimal={false}
                      value={m.autoLintelThicknessMm ?? 150}
                      onChangeValue={(val) => updateMasonry({ autoLintelThicknessMm: Math.max(75, Math.round(val)) })}
                      className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] tabular-nums bg-[var(--md-sys-color-surface)]"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)]">End Bearing Each Side (mm, default 150mm / 6&quot;)</span>
                    <NumericDraftInput
                      min={100}
                      max={350}
                      allowDecimal={false}
                      value={m.autoLintelBearingMm ?? 150}
                      onChangeValue={(val) => updateMasonry({ autoLintelBearingMm: Math.max(75, Math.round(val)) })}
                      className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] tabular-nums bg-[var(--md-sys-color-surface)]"
                    />
                  </div>
                </div>
              )}
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
                  value={m.plasterThicknessMm ?? 0}
                  onChange={(e) => updateMasonry({ plasterThicknessMm: Number(e.target.value) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                >
                  <option value="0">0 mm (None)</option>
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
                  value={m.plasterSides ?? 0}
                  onChange={(e) => updateMasonry({ plasterSides: Number(e.target.value) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                >
                  <option value="0">0 Faces (None)</option>
                  <option value="2">Both Sides (×2)</option>
                  <option value="1">Single Face (×1)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Plaster Mix (1:N)
                </label>
                <select
                  value={m.plasterRatioSand ?? 0}
                  onChange={(e) => {
                    const ratio = Number(e.target.value);
                    updateMasonry({ plasterRatioCement: ratio > 0 ? 1 : 0, plasterRatioSand: ratio });
                  }}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                >
                  <option value="0">0 (Unset)</option>
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
                <NumericDraftInput
                  min={0}
                  baseUnit="m"
                  unitCategory="length"
                  value={m.floorLengthM}
                  onChangeValue={(val) => updateMasonry({ floorLengthM: Math.max(0, val) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Floor Width (m)
                </label>
                <NumericDraftInput
                  min={0}
                  baseUnit="m"
                  unitCategory="length"
                  value={m.floorWidthM}
                  onChangeValue={(val) => updateMasonry({ floorWidthM: Math.max(0, val) })}
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
                  <option value="600x600">600 × 600 (24&quot;×24&quot;)</option>
                  <option value="800x800">800 × 800 (32&quot;×32&quot;)</option>
                  <option value="300x600">300 × 600 (12&quot;×24&quot;)</option>
                  <option value="400x400">400 × 400 (16&quot;×16&quot;)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Tiles / Box
                </label>
                <NumericDraftInput
                  min={0}
                  max={30}
                  allowDecimal={false}
                  value={m.tilesPerBox ?? 0}
                  onChangeValue={(val) => updateMasonry({ tilesPerBox: Math.max(0, Math.round(val)) })}
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
                <NumericDraftInput
                  min={0}
                  max={3}
                  allowDecimal={false}
                  value={m.puttyCoats ?? 0}
                  onChangeValue={(val) => updateMasonry({ puttyCoats: Math.max(0, Math.round(val)) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Paint Coats
                </label>
                <NumericDraftInput
                  min={0}
                  max={4}
                  allowDecimal={false}
                  value={m.paintCoats ?? 0}
                  onChangeValue={(val) => updateMasonry({ paintCoats: Math.max(0, Math.round(val)) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Primer Cov. (m²/L)
                </label>
                <NumericDraftInput
                  min={0}
                  value={m.primerCoverageM2PerL ?? 0}
                  onChangeValue={(val) => updateMasonry({ primerCoverageM2PerL: Math.max(0, val) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Paint Cov. (m²/L)
                </label>
                <NumericDraftInput
                  min={0}
                  value={m.paintCoverageM2PerL ?? 0}
                  onChangeValue={(val) => updateMasonry({ paintCoverageM2PerL: Math.max(0, val) })}
                  className="w-full min-h-[42px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
            </div>

            {/* Wall Tiles, Floor Skirting (4" / 6"), Tile Adhesive (20kg) & Chicken Wire Mesh */}
            <div className="pt-2.5 border-t border-[var(--md-sys-color-outline-variant)] space-y-2 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold text-[var(--md-sys-color-primary)]">
                  Wall Tiles, Floor Skirting (4&quot; / 6&quot;), Tile Adhesive &amp; 20-Gauge Wire Mesh
                </span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={Boolean(m.includeChickenWireMesh)}
                    onChange={(e) => updateMasonry({ includeChickenWireMesh: e.target.checked })}
                  />
                  <span>Include 20-Gauge Chicken Wire Mesh (RCC-Brick Junctions)</span>
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                    Wall Tile Height (m)
                  </label>
                  <NumericDraftInput
                    min={0}
                    max={4.5}
                    baseUnit="m"
                    unitCategory="length"
                    value={m.wallTileHeightM ?? 0}
                    onChangeValue={(val) => updateMasonry({ wallTileHeightM: Math.max(0, val) })}
                    className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] tabular-nums bg-[var(--md-sys-color-surface)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                    Wall Tile Run L (m)
                  </label>
                  <NumericDraftInput
                    min={0}
                    baseUnit="m"
                    unitCategory="length"
                    value={m.wallTileLengthM ?? 0}
                    onChangeValue={(val) => updateMasonry({ wallTileLengthM: Math.max(0, val) })}
                    className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] tabular-nums bg-[var(--md-sys-color-surface)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                    Skirting Height
                  </label>
                  <select
                    value={m.skirtingHeightMm ?? 100}
                    onChange={(e) => updateMasonry({ skirtingHeightMm: Number(e.target.value) })}
                    className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] text-xs bg-[var(--md-sys-color-surface)]"
                  >
                    <option value="0">0 mm (None)</option>
                    <option value="100">100 mm (4&quot; Std)</option>
                    <option value="150">150 mm (6&quot; High)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                    Skirting Run (m)
                  </label>
                  <NumericDraftInput
                    min={0}
                    baseUnit="m"
                    unitCategory="length"
                    value={m.skirtingLengthM ?? 0}
                    onChangeValue={(val) => updateMasonry({ skirtingLengthM: Math.max(0, val) })}
                    className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] tabular-nums bg-[var(--md-sys-color-surface)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                    Adhesive (kg/m²)
                  </label>
                  <NumericDraftInput
                    min={0}
                    max={12}
                    value={m.tileAdhesiveKgPerM2 ?? 4.5}
                    onChangeValue={(val) => updateMasonry({ tileAdhesiveKgPerM2: Math.max(0, val) })}
                    className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] tabular-nums bg-[var(--md-sys-color-surface)]"
                  />
                </div>
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
  const ratePerM3 = result.bricksPerM3Effective ?? 0;
  const ratePerCft = ratePerM3 / 35.314667;
  const isZeroBaseline = (result.grossWallAreaM2 ?? 0) <= 0;

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      {isZeroBaseline && (
        <div className="px-3.5 py-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-mono flex items-center justify-between gap-2">
          <span className="font-bold uppercase tracking-wider">0 BASELINE STANDBY</span>
          <span className="opacity-90">Enter wall dimensions, add schedule segments, or load a Room Template to compute brickwork &amp; finishes.</span>
        </div>
      )}
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

      {/* Structural RCC Beam & Column Deduction Summary Card */}
      {result.structuralDeductionSchedule &&
        result.structuralDeductionSchedule.totalStructuralDeductionVolM3 > 0 && (
          <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2 text-xs font-mono tabular-nums">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-[var(--md-sys-color-primary)] uppercase">
                Structural RCC Beam &amp; Column Deductions Applied
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Bricks Saved: <strong className="text-[var(--md-sys-color-on-surface)]">-{result.structuralDeductionSchedule.equivalentBricksDeductedNos.toLocaleString()} nos</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Beam Drop Deduction</span>
                <strong className="text-sm text-rose-600 dark:text-rose-400 mt-0.5 block">
                  -{result.structuralDeductionSchedule.beamDeductionVolM3.toFixed(3)} m³ (-{result.structuralDeductionSchedule.beamDeductionAreaM2.toFixed(2)} m²)
                </strong>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">RCC Column Deduction</span>
                <strong className="text-sm text-rose-600 dark:text-rose-400 mt-0.5 block">
                  -{result.structuralDeductionSchedule.columnDeductionVolM3.toFixed(3)} m³ (-{result.structuralDeductionSchedule.columnDeductionAreaM2.toFixed(2)} m²)
                </strong>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Total RCC Deducted</span>
                <strong className="text-sm text-[var(--md-sys-color-primary)] mt-0.5 block">
                  -{result.structuralDeductionSchedule.totalStructuralDeductionVolM3.toFixed(3)} m³ (-{result.structuralDeductionSchedule.totalStructuralDeductionVolCft.toFixed(1)} CFT)
                </strong>
              </div>
            </div>
          </div>
        )}

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

      {/* Automated Lintel Deduction & Jamb/Sill Plaster Reveal Schedule Card */}
      {result.lintelRevealSchedule &&
        (result.lintelRevealSchedule.autoDeductedLintelVolumeM3 > 0 ||
          result.lintelRevealSchedule.jambSillRevealPlasterAreaM2 > 0) && (
          <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2 text-xs font-mono tabular-nums">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-[var(--md-sys-color-primary)] uppercase">
                Automated RCC Lintel Deduction &amp; Jamb/Sill Reveal Plaster Schedule
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Lintel: {result.lintelRevealSchedule.lintelThicknessMm}mm deep × +{result.lintelRevealSchedule.lintelBearingMm}mm end bearing
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                  Auto-Deducted RCC Lintel Bearing Volume ({result.lintelRevealSchedule.autoDeductedLintelCount} Nos)
                </span>
                <strong className="text-base text-rose-600 dark:text-rose-400 mt-0.5 block">
                  -{result.lintelRevealSchedule.autoDeductedLintelVolumeM3.toFixed(3)} m³ (-{result.lintelRevealSchedule.autoDeductedLintelVolumeCft.toFixed(2)} CFT)
                </strong>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                  Added Jamb &amp; Sill Reveal Plaster Area
                </span>
                <strong className="text-base text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  +{result.lintelRevealSchedule.jambSillRevealPlasterAreaM2.toFixed(2)} m² (+{result.lintelRevealSchedule.jambSillRevealPlasterAreaSft.toFixed(1)} SFT)
                </strong>
              </div>
            </div>
          </div>
        )}

      {/* Wall Tiles, Floor Skirting, Tile Adhesive (20kg), Joint Grout & Chicken Wire Mesh Card */}
      {result.wallTileSkirtingAdhesiveSchedule &&
        (result.wallTileSkirtingAdhesiveSchedule.totalTiledAreaM2 > 0 ||
          result.wallTileSkirtingAdhesiveSchedule.chickenWireMeshRollsCount > 0) && (
          <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2 text-xs font-mono tabular-nums">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-[var(--md-sys-color-primary)] uppercase">
                Wall Tiles, Floor Skirting, Tile Adhesive (20kg) &amp; Wire Mesh Schedule
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Total Tiled + Skirting Surface: <strong className="text-[var(--md-sys-color-on-surface)]">{result.wallTileSkirtingAdhesiveSchedule.totalTiledAreaM2.toFixed(2)} m²</strong> ({result.wallTileSkirtingAdhesiveSchedule.totalTiledAreaSft.toFixed(1)} SFT)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Wall Tiles &amp; Boxes</span>
                <strong className="text-sm text-[var(--md-sys-color-on-surface)] mt-0.5 block">
                  {result.wallTileSkirtingAdhesiveSchedule.wallTileBoxesCount} boxes ({result.wallTileSkirtingAdhesiveSchedule.wallTilesWithWastageCount} tiles)
                </strong>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  {result.wallTileSkirtingAdhesiveSchedule.wallTileAreaSft.toFixed(1)} SFT ({result.wallTileSkirtingAdhesiveSchedule.wallTileAreaM2.toFixed(2)} m²)
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                  Floor Skirting ({result.wallTileSkirtingAdhesiveSchedule.skirtingHeightMm}mm)
                </span>
                <strong className="text-sm text-[var(--md-sys-color-on-surface)] mt-0.5 block">
                  {result.wallTileSkirtingAdhesiveSchedule.skirtingAreaSft.toFixed(1)} SFT ({result.wallTileSkirtingAdhesiveSchedule.skirtingAreaM2.toFixed(2)} m²)
                </strong>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Run: {result.wallTileSkirtingAdhesiveSchedule.skirtingLengthM.toFixed(1)} m
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                  Tile Adhesive &amp; Grout
                </span>
                <strong className="text-sm text-[var(--md-sys-color-primary)] mt-0.5 block">
                  {result.wallTileSkirtingAdhesiveSchedule.tileAdhesiveBags20Kg} bags (20kg)
                </strong>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  {result.wallTileSkirtingAdhesiveSchedule.tileAdhesiveTotalKg.toFixed(1)} kg adhesive · {result.wallTileSkirtingAdhesiveSchedule.jointGroutTotalKg.toFixed(2)} kg grout
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                  20-Gauge Chicken Wire Mesh
                </span>
                <strong className="text-sm text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {result.wallTileSkirtingAdhesiveSchedule.chickenWireMeshRollsCount} roll(s) (30m)
                </strong>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  {result.wallTileSkirtingAdhesiveSchedule.chickenWireMeshLengthM.toFixed(1)} m ({result.wallTileSkirtingAdhesiveSchedule.chickenWireMeshAreaM2.toFixed(2)} m²)
                </span>
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
