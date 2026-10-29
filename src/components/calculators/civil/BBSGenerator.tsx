import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Info,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  Wand2,
  Lightbulb,
  Check,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { exportToCSV, generateEngineeringPDF } from '../../../utils/exportEngine';
import {
  computeRebarSuggestions,
  REBAR_ROLE_DEFINITIONS,
  RebarRoleKey,
  StructuralElementTypeKey,
  SuggestionOption,
} from './rebarSuggestionEngine';

export type BarShapeType =
  | 'straight'
  | 'l-bend'
  | 'u-bar'
  | 'cranked-slab'
  | 'rectangular-stirrup'
  | 'circular-tie';

export interface BBSRow {
  id: string;
  barMark: string;
  member: string; // e.g. "Beam B1", "Column C1", "Slab S1", "Footing F1"
  shape: BarShapeType;
  diaMm: number; // 8, 10, 12, 16, 20, 25, 32
  numMembers: number;
  barsPerMember: number;
  dimA: number; // mm (Primary length)
  dimB: number; // mm (Leg / width)
  dimC: number; // mm (Return leg / height)
  dimH: number; // mm (Crank depth if applicable)
  hookType: 'standard-9d' | 'seismic-10d' | '135-deg' | 'none';
  customCuttingLengthM?: number;
}

export const REBAR_DIAMETERS = [8, 10, 12, 16, 20, 25, 32] as const;

// Unit weight: D^2 / 162.2 kg/m (IS 1786 / BNBC / ACI standard)
export function getRebarUnitWeight(diaMm: number): number {
  return Number(((diaMm * diaMm) / 162.2).toFixed(4));
}

// Calculate cutting length and bend deductions
export function calculateBarCuttingLength(row: BBSRow): {
  cuttingLengthM: number;
  bendDeductionMm: number;
  hookAdditionMm: number;
  formulaNote: string;
} {
  const d = row.diaMm;
  let rawLengthMm = 0;
  let bendDeductionMm = 0;
  let hookAdditionMm = 0;
  let formulaNote = '';

  const hookExtMm = row.hookType === 'seismic-10d' 
    ? Math.max(75, 10 * d) 
    : row.hookType === 'standard-9d' 
      ? 9 * d 
      : row.hookType === '135-deg' 
        ? Math.max(75, 10 * d) 
        : 0;

  switch (row.shape) {
    case 'straight':
      rawLengthMm = row.dimA;
      bendDeductionMm = 0;
      hookAdditionMm = 0;
      formulaNote = 'L (Straight bar, no bends)';
      break;

    case 'l-bend':
      // One 90° bend: deduction = 2d
      rawLengthMm = row.dimA + row.dimB;
      bendDeductionMm = 2 * d;
      hookAdditionMm = 0;
      formulaNote = 'A + B - 2d (1×90° bend)';
      break;

    case 'u-bar':
      // Two 90° bends: deduction = 2 × 2d = 4d
      rawLengthMm = row.dimA + row.dimB + row.dimC;
      bendDeductionMm = 2 * (2 * d);
      hookAdditionMm = 0;
      formulaNote = 'A + B + C - 4d (2×90° bends)';
      break;

    case 'cranked-slab': {
      // Bent-up bar at 45°: extra inclined length = 0.42 * H
      // End hooks: 2 × 9d, Bend deductions: 4 bends (2 × 45° = 2×1d, 2 × 45° reverse = 2×1d => total 4d)
      const crankExtra = 0.42 * (row.dimH || 0);
      hookAdditionMm = 2 * (9 * d);
      bendDeductionMm = 4 * (1 * d); // 4 bends of 45°
      rawLengthMm = row.dimA + crankExtra + hookAdditionMm;
      formulaNote = 'L + 0.42H + 2×(9d) - 4×(1d)';
      break;
    }

    case 'rectangular-stirrup': {
      // 2*(A + B) + 2 seismic hooks (10d or 75mm min) - 3×90° bends (3×2d) - 2×135° bends (2×3d)
      const perimeter = 2 * (row.dimA + row.dimB);
      hookAdditionMm = 2 * Math.max(75, 10 * d);
      bendDeductionMm = (3 * 2 * d) + (2 * 3 * d); // 6d + 6d = 12d
      rawLengthMm = perimeter + hookAdditionMm;
      formulaNote = '2(A+B) + 2×Hook(10d) - 3×2d(90°) - 2×3d(135°)';
      break;
    }

    case 'circular-tie': {
      // Circumference π*D + lap / hook (24d or 2×10d)
      const circ = Math.PI * row.dimA;
      hookAdditionMm = 2 * Math.max(75, 10 * d);
      rawLengthMm = circ + hookAdditionMm;
      bendDeductionMm = 0;
      formulaNote = 'π×D + 2×Hook(10d)';
      break;
    }
  }

  const netLengthMm = Math.max(50, rawLengthMm - bendDeductionMm);
  const cuttingLengthM = Number((netLengthMm / 1000).toFixed(3));

  return {
    cuttingLengthM,
    bendDeductionMm,
    hookAdditionMm,
    formulaNote,
  };
}

// Tension development length calculation (ACI 318 / BNBC 2020)
// L_d = (fy / (4 * tau_bd)) * db or ACI simplified: L_d = (fy / (1.1 * sqrt(f'c))) * db * psi
export function calculateDevelopmentLength(fcMpa: number, fyMpa: number, diaMm: number): {
  ldMm: number;
  lapClassAMm: number;
  lapClassBMm: number;
  compressionLapMm: number;
} {
  // tau_bd bond stress approximation: 0.16 * sqrt(fc) * 1.6 for deformed bars
  const tauBd = 0.25 * Math.sqrt(Math.max(15, fcMpa));
  const ld = Math.max(300, Math.round((fyMpa / (4 * tauBd)) * diaMm * 0.8)); // 0.8 factor for normal conditions
  const lapClassA = Math.round(ld);
  const lapClassB = Math.round(1.3 * ld);
  // Compression lap: max(0.071 * fy * db, 300mm)
  const compLap = Math.max(300, Math.round(0.071 * fyMpa * diaMm));

  return {
    ldMm: ld,
    lapClassAMm: lapClassA,
    lapClassBMm: lapClassB,
    compressionLapMm: compLap,
  };
}

// Preset BBS Schedules for Quick Start
const PRESET_SCHEDULES: Record<string, { label: string; rows: BBSRow[] }> = {
  beam: {
    label: 'Standard RCC Beam (300×500 mm)',
    rows: [
      {
        id: 'b-01',
        barMark: 'B1-01',
        member: 'Beam B1 (Bottom Main)',
        shape: 'straight',
        diaMm: 20,
        numMembers: 2,
        barsPerMember: 3,
        dimA: 5800,
        dimB: 0,
        dimC: 0,
        dimH: 0,
        hookType: 'standard-9d',
      },
      {
        id: 'b-02',
        barMark: 'B1-02',
        member: 'Beam B1 (Top Hanger)',
        shape: 'straight',
        diaMm: 12,
        numMembers: 2,
        barsPerMember: 2,
        dimA: 5800,
        dimB: 0,
        dimC: 0,
        dimH: 0,
        hookType: 'standard-9d',
      },
      {
        id: 'b-03',
        barMark: 'B1-03',
        member: 'Beam B1 (Top Extra Support)',
        shape: 'l-bend',
        diaMm: 16,
        numMembers: 2,
        barsPerMember: 2,
        dimA: 1800,
        dimB: 350,
        dimC: 0,
        dimH: 0,
        hookType: 'none',
      },
      {
        id: 'b-04',
        barMark: 'B1-04',
        member: 'Beam B1 (Closed Stirrups)',
        shape: 'rectangular-stirrup',
        diaMm: 10,
        numMembers: 2,
        barsPerMember: 38,
        dimA: 220,
        dimB: 420,
        dimC: 0,
        dimH: 0,
        hookType: 'seismic-10d',
      },
    ],
  },
  column: {
    label: 'RCC Column (400×400 mm) 3m Height',
    rows: [
      {
        id: 'c-01',
        barMark: 'C1-01',
        member: 'Column C1 (Corner Mains)',
        shape: 'l-bend',
        diaMm: 20,
        numMembers: 4,
        barsPerMember: 4,
        dimA: 3600,
        dimB: 450,
        dimC: 0,
        dimH: 0,
        hookType: 'none',
      },
      {
        id: 'c-02',
        barMark: 'C1-02',
        member: 'Column C1 (Side Mains)',
        shape: 'l-bend',
        diaMm: 16,
        numMembers: 4,
        barsPerMember: 4,
        dimA: 3600,
        dimB: 450,
        dimC: 0,
        dimH: 0,
        hookType: 'none',
      },
      {
        id: 'c-03',
        barMark: 'C1-03',
        member: 'Column C1 (Master Tie)',
        shape: 'rectangular-stirrup',
        diaMm: 10,
        numMembers: 4,
        barsPerMember: 24,
        dimA: 320,
        dimB: 320,
        dimC: 0,
        dimH: 0,
        hookType: 'seismic-10d',
      },
    ],
  },
  slab: {
    label: 'Two-Way Slab Panel (4m × 5m, 150mm Thk)',
    rows: [
      {
        id: 's-01',
        barMark: 'S1-01',
        member: 'Slab S1 (Short Span Cranked)',
        shape: 'cranked-slab',
        diaMm: 10,
        numMembers: 1,
        barsPerMember: 26,
        dimA: 4200,
        dimB: 0,
        dimC: 0,
        dimH: 100,
        hookType: 'standard-9d',
      },
      {
        id: 's-02',
        barMark: 'S1-02',
        member: 'Slab S1 (Long Span Cranked)',
        shape: 'cranked-slab',
        diaMm: 10,
        numMembers: 1,
        barsPerMember: 21,
        dimA: 5200,
        dimB: 0,
        dimC: 0,
        dimH: 100,
        hookType: 'standard-9d',
      },
      {
        id: 's-03',
        barMark: 'S1-03',
        member: 'Slab S1 (Top Extra Negative)',
        shape: 'straight',
        diaMm: 10,
        numMembers: 1,
        barsPerMember: 30,
        dimA: 1300,
        dimB: 0,
        dimC: 0,
        dimH: 0,
        hookType: 'none',
      },
    ],
  },
  footing: {
    label: 'Isolated Pad Footing (2m × 2m × 0.5m)',
    rows: [
      {
        id: 'f-01',
        barMark: 'F1-01',
        member: 'Footing F1 (X-Direction Mesh)',
        shape: 'u-bar',
        diaMm: 12,
        numMembers: 2,
        barsPerMember: 14,
        dimA: 1850,
        dimB: 350,
        dimC: 350,
        dimH: 0,
        hookType: 'none',
      },
      {
        id: 'f-02',
        barMark: 'F1-02',
        member: 'Footing F1 (Y-Direction Mesh)',
        shape: 'u-bar',
        diaMm: 12,
        numMembers: 2,
        barsPerMember: 14,
        dimA: 1850,
        dimB: 350,
        dimC: 350,
        dimH: 0,
        hookType: 'none',
      },
    ],
  },
};

export const BBSGenerator: React.FC = () => {
  const [rows, setRows] = useState<BBSRow[]>(PRESET_SCHEDULES.beam.rows);
  const [wastagePercent, setWastagePercent] = useState<number>(3.5);
  const [activeShapePreview, setActiveShapePreview] = useState<BarShapeType>('rectangular-stirrup');
  const [activeTab, setActiveTab] = useState<'schedule' | 'lapping'>('schedule');

  // Lapping & Development Length Parameters
  const [fcMpa, setFcMpa] = useState<number>(25);
  const [fyMpa, setFyMpa] = useState<number>(500);

  // Smart Rebar Suggestion Helper State
  const [selectedRowId, setSelectedRowId] = useState<string | null>(PRESET_SCHEDULES.beam.rows[0]?.id || null);
  const [isHelperOpen, setIsHelperOpen] = useState<boolean>(true);
  const [helperElementType, setHelperElementType] = useState<StructuralElementTypeKey>('beam');
  const [helperRoleKey, setHelperRoleKey] = useState<RebarRoleKey>('beam-bottom-tension');
  const [helperWidthMm, setHelperWidthMm] = useState<number>(300);
  const [helperDepthMm, setHelperDepthMm] = useState<number>(500);
  const [helperLengthMm, setHelperLengthMm] = useState<number>(6000);
  const [helperCoverMm, setHelperCoverMm] = useState<number>(40);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Compute rebar suggestions based on selected member section & code ratios
  const suggestions = useMemo(() => {
    return computeRebarSuggestions({
      roleKey: helperRoleKey,
      widthMm: Math.max(50, helperWidthMm),
      depthMm: Math.max(50, helperDepthMm),
      lengthMm: Math.max(100, helperLengthMm),
      clearCoverMm: Math.max(10, helperCoverMm),
    });
  }, [helperRoleKey, helperWidthMm, helperDepthMm, helperLengthMm, helperCoverMm]);

  // Open helper pre-configured for a specific row
  const handleOpenHelperForRow = (row: BBSRow) => {
    setSelectedRowId(row.id);
    setIsHelperOpen(true);

    const memberLower = row.member.toLowerCase();
    if (memberLower.includes('stirrup') || row.shape === 'rectangular-stirrup') {
      setHelperElementType('beam');
      setHelperRoleKey('beam-shear-stirrup');
      if (row.dimA > 0) setHelperWidthMm(row.dimA + 2 * 40);
      if (row.dimB > 0) setHelperDepthMm(row.dimB + 2 * 40);
    } else if (memberLower.includes('column') || memberLower.includes('col') || row.barMark.toLowerCase().startsWith('c')) {
      setHelperElementType('column');
      setHelperRoleKey('col-longitudinal');
      setHelperCoverMm(40);
      if (row.dimA > 0) setHelperLengthMm(row.dimA);
    } else if (memberLower.includes('slab') || row.shape === 'cranked-slab' || row.barMark.toLowerCase().startsWith('s')) {
      setHelperElementType('slab');
      setHelperRoleKey(row.shape === 'cranked-slab' ? 'slab-cranked' : 'slab-main-short');
      setHelperCoverMm(20);
      setHelperDepthMm(150);
      if (row.dimA > 0) setHelperWidthMm(row.dimA);
    } else if (memberLower.includes('footing') || row.shape === 'u-bar' || row.barMark.toLowerCase().startsWith('f')) {
      setHelperElementType('footing');
      setHelperRoleKey('footing-mesh');
      setHelperCoverMm(75);
      setHelperDepthMm(600);
      if (row.dimA > 0) setHelperWidthMm(row.dimA + 2 * 75);
    } else {
      setHelperElementType('beam');
      setHelperRoleKey('beam-bottom-tension');
      setHelperCoverMm(40);
      if (row.dimA > 0) setHelperLengthMm(row.dimA + 2 * 40);
    }
  };

  // Switch element type in helper and select default role
  const handleSelectElementType = (type: StructuralElementTypeKey) => {
    setHelperElementType(type);
    if (type === 'beam') {
      setHelperRoleKey('beam-bottom-tension');
      setHelperWidthMm(300);
      setHelperDepthMm(500);
      setHelperLengthMm(6000);
      setHelperCoverMm(40);
    } else if (type === 'column') {
      setHelperRoleKey('col-longitudinal');
      setHelperWidthMm(400);
      setHelperDepthMm(400);
      setHelperLengthMm(3600);
      setHelperCoverMm(40);
    } else if (type === 'slab') {
      setHelperRoleKey('slab-main-short');
      setHelperWidthMm(4000);
      setHelperDepthMm(150);
      setHelperLengthMm(5000);
      setHelperCoverMm(20);
    } else if (type === 'footing') {
      setHelperRoleKey('footing-mesh');
      setHelperWidthMm(2000);
      setHelperDepthMm(600);
      setHelperLengthMm(2000);
      setHelperCoverMm(75);
    }
  };

  // Apply suggestion to target row
  const handleApplySuggestion = (opt: SuggestionOption, targetRowId?: string) => {
    const rowIdToUpdate = targetRowId || selectedRowId || rows[0]?.id;
    if (!rowIdToUpdate) return;

    const role = suggestions.role;
    const dims = suggestions.recommendedDimensions;

    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowIdToUpdate) return r;
        return {
          ...r,
          shape: role.defaultShape,
          diaMm: opt.diaMm,
          barsPerMember: opt.count,
          dimA: dims.dimA > 0 ? dims.dimA : r.dimA,
          dimB: dims.dimB > 0 ? dims.dimB : r.dimB,
          dimC: dims.dimC > 0 ? dims.dimC : r.dimC,
          dimH: dims.dimH > 0 ? dims.dimH : r.dimH,
          hookType:
            role.defaultShape === 'rectangular-stirrup'
              ? 'seismic-10d'
              : role.defaultShape === 'cranked-slab'
              ? 'standard-9d'
              : r.hookType,
        };
      })
    );

    const targetRow = rows.find((r) => r.id === rowIdToUpdate);
    setAppliedToast(
      `Auto-filled [${targetRow?.barMark || 'Row'}]: ${opt.count} Nos × Ø${opt.diaMm} mm (${opt.note})`
    );
    setTimeout(() => setAppliedToast(null), 4000);
  };

  // Add suggestion as brand new row
  const handleAddSuggestedAsNewRow = (opt: SuggestionOption) => {
    const role = suggestions.role;
    const dims = suggestions.recommendedDimensions;
    const newId = `bar-${Date.now()}`;
    const prefix = role.elementType.toUpperCase().slice(0, 1);
    const newMark = `${prefix}1-${String(rows.length + 1).padStart(2, '0')}`;

    const newRow: BBSRow = {
      id: newId,
      barMark: newMark,
      member: role.label,
      shape: role.defaultShape,
      diaMm: opt.diaMm,
      numMembers: 1,
      barsPerMember: opt.count,
      dimA: dims.dimA > 0 ? dims.dimA : 3000,
      dimB: dims.dimB,
      dimC: dims.dimC,
      dimH: dims.dimH,
      hookType:
        role.defaultShape === 'rectangular-stirrup'
          ? 'seismic-10d'
          : role.defaultShape === 'cranked-slab'
          ? 'standard-9d'
          : 'none',
    };

    setRows((prev) => [...prev, newRow]);
    setSelectedRowId(newId);
    setAppliedToast(`Added new row [${newMark}]: ${opt.count} Nos × Ø${opt.diaMm} mm`);
    setTimeout(() => setAppliedToast(null), 4000);
  };

  // Add new row
  const handleAddRow = () => {
    const newId = `bar-${Date.now()}`;
    const newMark = `B-${rows.length + 1}`.padStart(5, '0');
    setRows([
      ...rows,
      {
        id: newId,
        barMark: newMark,
        member: 'New Member',
        shape: 'straight',
        diaMm: 12,
        numMembers: 1,
        barsPerMember: 4,
        dimA: 3000,
        dimB: 0,
        dimC: 0,
        dimH: 0,
        hookType: 'standard-9d',
      },
    ]);
  };

  const handleDuplicateRow = (index: number) => {
    const target = rows[index];
    const newRow: BBSRow = {
      ...target,
      id: `bar-${Date.now()}`,
      barMark: `${target.barMark}-cp`,
    };
    const updated = [...rows];
    updated.splice(index + 1, 0, newRow);
    setRows(updated);
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, patch: Partial<BBSRow>) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleLoadPreset = (key: string) => {
    if (PRESET_SCHEDULES[key]) {
      setRows(PRESET_SCHEDULES[key].rows);
    }
  };

  // Calculations per row
  const calculatedRows = useMemo(() => {
    return rows.map((r) => {
      const { cuttingLengthM, bendDeductionMm, hookAdditionMm, formulaNote } = calculateBarCuttingLength(r);
      const totalBars = r.numMembers * r.barsPerMember;
      const totalLengthM = Number((totalBars * cuttingLengthM).toFixed(2));
      const unitWt = getRebarUnitWeight(r.diaMm);
      const totalWeightKg = Number((totalLengthM * unitWt).toFixed(2));

      return {
        ...r,
        totalBars,
        cuttingLengthM,
        bendDeductionMm,
        hookAdditionMm,
        formulaNote,
        totalLengthM,
        unitWt,
        totalWeightKg,
      };
    });
  }, [rows]);

  // Grouping by bar diameter (8mm, 10mm, 12mm, 16mm, 20mm, 25mm, 32mm)
  const diameterSummary = useMemo(() => {
    const summary: Record<number, { count: number; totalLengthM: number; totalWeightKg: number }> = {};

    REBAR_DIAMETERS.forEach((d) => {
      summary[d] = { count: 0, totalLengthM: 0, totalWeightKg: 0 };
    });

    calculatedRows.forEach((r) => {
      if (!summary[r.diaMm]) {
        summary[r.diaMm] = { count: 0, totalLengthM: 0, totalWeightKg: 0 };
      }
      summary[r.diaMm].count += r.totalBars;
      summary[r.diaMm].totalLengthM += r.totalLengthM;
      summary[r.diaMm].totalWeightKg += r.totalWeightKg;
    });

    return summary;
  }, [calculatedRows]);

  // Overall totals
  const totalNetWeightKg = useMemo(() => {
    return Object.values(diameterSummary).reduce((acc, curr) => acc + curr.totalWeightKg, 0);
  }, [diameterSummary]);

  const totalGrossWeightKg = useMemo(() => {
    return totalNetWeightKg * (1 + wastagePercent / 100);
  }, [totalNetWeightKg, wastagePercent]);

  const totalNetMT = (totalNetWeightKg / 1000).toFixed(3);
  const totalGrossMT = (totalGrossWeightKg / 1000).toFixed(3);

  // Development Length table
  const devLengthTable = useMemo(() => {
    return REBAR_DIAMETERS.map((dia) => {
      const res = calculateDevelopmentLength(fcMpa, fyMpa, dia);
      return {
        dia,
        unitWt: getRebarUnitWeight(dia),
        ...res,
      };
    });
  }, [fcMpa, fyMpa]);

  // Export BBS to CSV
  const handleExportBBSCSV = () => {
    const headers = [
      'Bar Mark',
      'Structural Member',
      'Bar Shape',
      'Dia (mm)',
      'No. of Members',
      'Bars/Member',
      'Total Bars',
      'Dim A (mm)',
      'Dim B (mm)',
      'Dim C (mm)',
      'Hook Type',
      'Cutting Length (m)',
      'Total Length (m)',
      'Unit Wt (kg/m)',
      'Total Weight (kg)',
      'Formula / Deduction Note',
    ];

    const dataRows = calculatedRows.map((r) => [
      r.barMark,
      r.member,
      r.shape.toUpperCase(),
      r.diaMm,
      r.numMembers,
      r.barsPerMember,
      r.totalBars,
      r.dimA,
      r.dimB,
      r.dimC,
      r.hookType,
      r.cuttingLengthM,
      r.totalLengthM,
      r.unitWt,
      r.totalWeightKg,
      r.formulaNote,
    ]);

    // Diameter summary rows
    dataRows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    dataRows.push(['--- DIAMETER SUMMARY BREAKDOWN ---', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    dataRows.push(['Dia (mm)', 'Unit Wt (kg/m)', 'Total Bars', 'Total Length (m)', 'Net Wt (kg)', 'Net Wt (MT)', '', '', '', '', '', '', '', '', '', '']);

    REBAR_DIAMETERS.forEach((d) => {
      const s = diameterSummary[d];
      if (s.count > 0 || s.totalWeightKg > 0) {
        dataRows.push([
          `${d} mm`,
          getRebarUnitWeight(d),
          s.count,
          Number(s.totalLengthM.toFixed(2)),
          Number(s.totalWeightKg.toFixed(2)),
          Number((s.totalWeightKg / 1000).toFixed(3)),
          '', '', '', '', '', '', '', '', '', ''
        ]);
      }
    });

    dataRows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    dataRows.push(['TOTAL NET STEEL WEIGHT (KG)', totalNetWeightKg.toFixed(2), 'TOTAL NET STEEL (MT)', totalNetMT, '', '', '', '', '', '', '', '', '', '', '', '']);
    dataRows.push(['WASTAGE ALLOWANCE (%)', `${wastagePercent}%`, 'TOTAL GROSS PROCUREMENT (MT)', totalGrossMT, '', '', '', '', '', '', '', '', '', '', '', '']);

    exportToCSV(`BBS_Bar_Bending_Schedule_${new Date().toISOString().slice(0, 10)}.csv`, headers, dataRows);
  };

  // Export BBS to PDF
  const handleExportBBSPDF = async () => {
    const tableColumns = [
      'Mark',
      'Member',
      'Shape',
      'Dia',
      'Qty',
      'Cutting L (m)',
      'Total L (m)',
      'Unit Wt',
      'Total Wt (kg)',
    ];

    const tableRows = calculatedRows.map((r) => [
      r.barMark,
      r.member,
      r.shape,
      `${r.diaMm}mm`,
      `${r.totalBars} nos`,
      `${r.cuttingLengthM} m`,
      `${r.totalLengthM} m`,
      `${r.unitWt} kg/m`,
      `${r.totalWeightKg.toFixed(1)} kg`,
    ]);

    const pdfReportData = {
      projectMeta: {
        projectName: 'Structural RCC Rebar Schedule & Cutting List',
        projectCode: 'BBS-CIVIL-2026',
        client: 'Client Engineering Review',
        location: 'Site Engineering Submittal',
        date: new Date().toISOString().slice(0, 10),
        unitSystem: 'SI' as const,
        engineerName: 'Prokash Biswas, PE',
      },
      moduleMeta: {
        moduleId: 'rebar-bbs',
        moduleTitle: 'BAR BENDING SCHEDULE (BBS) & REBAR WORKBENCH',
        standard: 'BNBC-2020 / ACI-318 / IS-2502',
        status: 'VERIFIED' as const,
      },
      inputs: [
        { name: "Concrete Strength", symbol: "f'c", value: fcMpa, unit: 'MPa' },
        { name: 'Steel Yield Strength', symbol: 'fy', value: fyMpa, unit: 'MPa' },
        { name: 'Wastage Allowance', symbol: 'W_allow', value: wastagePercent, unit: '%' },
        { name: 'Total Bar Marks', symbol: 'N_marks', value: calculatedRows.length, unit: 'items' },
      ],
      outputs: [
        { name: 'Total Net Rebar Weight', symbol: 'W_net', value: totalNetWeightKg.toFixed(1), unit: 'kg', status: 'PASS' as const },
        { name: 'Total Net Rebar Tonnage', symbol: 'T_net', value: totalNetMT, unit: 'MT', status: 'PASS' as const },
        { name: 'Total Gross Procurement (+Wastage)', symbol: 'W_gross', value: totalGrossWeightKg.toFixed(1), unit: 'kg', status: 'SAFE' as const },
        { name: 'Gross Procurement Tonnage', symbol: 'T_gross', value: totalGrossMT, unit: 'MT', status: 'SAFE' as const },
      ],
      takeoffHeaders: ['Mark', 'Member', 'Shape', 'Cut L (m)', 'Qty (nos)', 'Unit Wt', 'Total Wt (kg)'],
      takeoffRows: calculatedRows.map((r) => ({
        col1: r.barMark,
        col2: r.member,
        col3: r.shape.toUpperCase(),
        col4: `${r.cuttingLengthM} m`,
        col5: `${r.totalBars} nos`,
        col6: `${r.unitWt} kg/m`,
        col7: `${r.totalWeightKg.toFixed(1)} kg`,
      })),
      governingAssumptions: [
        'Unit Weight: w = D² / 162.2 kg/m (IS 1786 / BNBC Sec 8.1)',
        'Standard Bend Deductions: 45° = 1d, 90° = 2d, 135° = 3d',
        'Seismic Stirrup Hooks: 135° hook extension = 10d (minimum 75 mm)',
        'Tension Splice Length: Class B Lap = 1.3 × Ld (ACI 318-19 Cl. 25.5.2)',
      ],
    };

    await generateEngineeringPDF(pdfReportData, {
      filename: `PB_CivilLab_BBS_Schedule_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  // Render 2D SVG preview based on bar shape
  const renderShapeSvg = (shape: BarShapeType, dia: number, dimA: number, dimB: number, dimC: number, dimH: number) => {
    const strokeWidth = Math.max(3, Math.min(8, Math.round(dia / 2.5)));

    switch (shape) {
      case 'straight':
        return (
          <svg viewBox="0 0 240 100" className="w-full h-24 stroke-current text-[var(--md-sys-color-primary)] fill-none">
            <line x1="30" y1="50" x2="210" y2="50" strokeWidth={strokeWidth} strokeLinecap="round" />
            <circle cx="30" cy="50" r="3" fill="currentColor" />
            <circle cx="210" cy="50" r="3" fill="currentColor" />
            <text x="120" y="40" textAnchor="middle" className="text-[11px] font-mono fill-current font-bold">
              L = {dimA || 'L'} mm
            </text>
          </svg>
        );

      case 'l-bend':
        return (
          <svg viewBox="0 0 240 120" className="w-full h-24 stroke-current text-[var(--md-sys-color-primary)] fill-none">
            <polyline points="40,30 40,80 200,80" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <text x="120" y="98" textAnchor="middle" className="text-[11px] font-mono fill-current font-bold">
              A = {dimA || 'A'} mm
            </text>
            <text x="25" y="55" textAnchor="middle" className="text-[11px] font-mono fill-current font-bold">
              B = {dimB || 'B'}
            </text>
            <text x="50" y="70" className="text-[9px] font-mono fill-[var(--md-sys-color-error)]">
              90° (-2d)
            </text>
          </svg>
        );

      case 'u-bar':
        return (
          <svg viewBox="0 0 240 120" className="w-full h-24 stroke-current text-[var(--md-sys-color-primary)] fill-none">
            <polyline points="40,30 40,85 200,85 200,30" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <text x="120" y="103" textAnchor="middle" className="text-[11px] font-mono fill-current font-bold">
              A = {dimA || 'A'} mm
            </text>
            <text x="25" y="55" textAnchor="middle" className="text-[11px] font-mono fill-current font-bold">
              B = {dimB || 'B'}
            </text>
            <text x="215" y="55" textAnchor="middle" className="text-[11px] font-mono fill-current font-bold">
              C = {dimC || 'C'}
            </text>
          </svg>
        );

      case 'cranked-slab':
        return (
          <svg viewBox="0 0 260 110" className="w-full h-24 stroke-current text-[var(--md-sys-color-primary)] fill-none">
            <polyline
              points="20,40 20,70 80,70 120,40 180,40 220,70 240,70 240,40"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text x="100" y="30" textAnchor="middle" className="text-[10px] font-mono fill-current font-bold">
              45° Crank (+0.42H)
            </text>
            <text x="130" y="88" textAnchor="middle" className="text-[10px] font-mono fill-current font-bold">
              L = {dimA || 'L'} mm (H = {dimH || 'H'} mm)
            </text>
          </svg>
        );

      case 'rectangular-stirrup':
        return (
          <svg viewBox="0 0 240 120" className="w-full h-24 stroke-current text-[var(--md-sys-color-primary)] fill-none">
            <rect x="50" y="25" width="140" height="70" rx="8" strokeWidth={strokeWidth} strokeLinejoin="round" />
            {/* 135 deg seismic hooks */}
            <path d="M 50,45 L 75,30" strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M 60,25 L 45,50" strokeWidth={strokeWidth} strokeLinecap="round" />
            <text x="120" y="18" textAnchor="middle" className="text-[11px] font-mono fill-current font-bold">
              A = {dimA || 'A'} mm
            </text>
            <text x="205" y="65" textAnchor="middle" className="text-[11px] font-mono fill-current font-bold">
              B = {dimB || 'B'}
            </text>
            <text x="85" y="42" className="text-[9px] font-mono fill-[var(--md-sys-color-tertiary)] font-bold">
              135° Hooks (10d)
            </text>
          </svg>
        );

      case 'circular-tie':
        return (
          <svg viewBox="0 0 240 120" className="w-full h-24 stroke-current text-[var(--md-sys-color-primary)] fill-none">
            <circle cx="120" cy="60" r="42" strokeWidth={strokeWidth} />
            <path d="M 120,18 C 135,18 145,28 135,40" strokeWidth={strokeWidth} strokeLinecap="round" />
            <text x="120" y="64" textAnchor="middle" className="text-[11px] font-mono fill-current font-bold">
              Dia = {dimA || 'D'} mm
            </text>
            <text x="120" y="112" textAnchor="middle" className="text-[9px] font-mono fill-current">
              π×D + 2×10d lap
            </text>
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Preset Toolbar */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] uppercase">
                Phase 4 Module
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                Bar Bending Schedule (BBS) &amp; Rebar Workbench
              </h2>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
              Precision Cutting Lengths · Bend Deductions (45°=1d, 90°=2d, 135°=3d) · ASTM / BNBC / IS Tonnage Grouping
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportBBSCSV}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportBBSPDF}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] flex items-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Certified PDF</span>
            </button>
          </div>
        </div>

        {/* Tab & Preset Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-1.5 p-1 bg-[var(--md-sys-color-surface-container)] rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'schedule'
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              Interactive BBS Schedule ({rows.length} Items)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lapping')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'lapping'
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              Development Length (Ld) &amp; Lapping Engine
            </button>
          </div>

          {activeTab === 'schedule' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Load Preset:
              </span>
              {Object.entries(PRESET_SCHEDULES).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleLoadPreset(key)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors"
                >
                  {key.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeTab === 'schedule' ? (
        <>
          {/* Key Metric Tonnage Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-xs">
              <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Net Total Steel Weight
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--md-sys-color-primary)] mt-1">
                {totalNetWeightKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                <span className="text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]">kg</span>
              </div>
              <div className="text-xs font-mono text-emerald-600 font-semibold mt-0.5">
                = {totalNetMT} Metric Tons
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-xs">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                  Wastage Allowance
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="15"
                    value={wastagePercent}
                    onChange={(e) => setWastagePercent(Number(e.target.value) || 0)}
                    className="w-14 px-1.5 py-0.5 text-xs text-right font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]"
                  />
                  <span className="text-xs font-mono font-bold">%</span>
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-1">
                {totalGrossWeightKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                <span className="text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]">kg</span>
              </div>
              <div className="text-xs font-mono text-[var(--md-sys-color-secondary)] font-semibold mt-0.5">
                = {totalGrossMT} MT Procurement Total
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-xs">
              <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Active Rebar Items
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-1">
                {rows.length}{' '}
                <span className="text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]">Marks</span>
              </div>
              <div className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Total Bar Count: {calculatedRows.reduce((a, b) => a + b.totalBars, 0)} nos
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-xs">
              <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Standard Bend Deductions
              </div>
              <div className="text-xs font-mono text-[var(--md-sys-color-on-surface)] space-y-0.5 mt-1">
                <div>45° Bend: <span className="font-bold text-[var(--md-sys-color-primary)]">1d</span></div>
                <div>90° Bend: <span className="font-bold text-[var(--md-sys-color-primary)]">2d</span></div>
                <div>135° Hook: <span className="font-bold text-[var(--md-sys-color-primary)]">3d (min 10d ext)</span></div>
              </div>
            </div>
          </div>

          {/* Diameter-wise Steel Weight Breakdown Grid */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                  Steel Requirement by Bar Diameter (D² / 162.2 kg/m)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                ASTM / IS 1786 Standard Diameters
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {REBAR_DIAMETERS.map((dia) => {
                const s = diameterSummary[dia];
                const pct = totalNetWeightKg > 0 ? (s.totalWeightKg / totalNetWeightKg) * 100 : 0;
                return (
                  <div
                    key={dia}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      s.totalWeightKg > 0
                        ? 'border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-primary-container)]/15'
                        : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] opacity-60'
                    }`}
                  >
                    <div className="text-sm font-bold font-mono text-[var(--md-sys-color-primary)]">
                      Ø {dia} mm
                    </div>
                    <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      {getRebarUnitWeight(dia)} kg/m
                    </div>
                    <div className="text-xs font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-1.5">
                      {s.totalWeightKg.toFixed(1)} kg
                    </div>
                    <div className="text-[10px] font-mono text-[var(--md-sys-color-secondary)]">
                      {(s.totalWeightKg / 1000).toFixed(3)} MT
                    </div>
                    {/* Visual proportion bar */}
                    <div className="w-full h-1.5 bg-[var(--md-sys-color-surface-container-high)] rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-[var(--md-sys-color-primary)] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Toast Notification */}
          {appliedToast && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs font-mono font-bold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{appliedToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setAppliedToast(null)}
                className="text-xs text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* SMART REBAR SPACING & DIAMETER SUGGESTION HELPER */}
          {isHelperOpen && (
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-primary)]/40 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                        Smart Rebar Spacing &amp; Diameter Suggestion Helper
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] uppercase">
                        BNBC / ACI 318 Ratios
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      Suggests bar diameter &amp; spacing based on structural member dimensions and typical reinforcement ratios (ρ).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                    <span className="font-semibold">Target Row:</span>
                    <select
                      value={selectedRowId || ''}
                      onChange={(e) => setSelectedRowId(e.target.value)}
                      className="px-2 py-1 text-xs font-mono font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)]"
                    >
                      {rows.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.barMark} - {r.member} ({r.shape})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Element Type & Sub-Role Switcher */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
                {/* Left Column: Element & Role Selection + Section Dimensions */}
                <div className="lg:col-span-5 space-y-3.5 pr-0 lg:pr-4 border-r-0 lg:border-r border-[var(--md-sys-color-outline-variant)]">
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase mb-1.5 text-[var(--md-sys-color-on-surface-variant)]">
                      1. Select Structural Element
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[var(--md-sys-color-surface-container)]">
                      {(['beam', 'column', 'slab', 'footing'] as StructuralElementTypeKey[]).map((el) => (
                        <button
                          key={el}
                          type="button"
                          onClick={() => handleSelectElementType(el)}
                          className={`py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all ${
                            helperElementType === el
                              ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                          }`}
                        >
                          {el}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase mb-1.5 text-[var(--md-sys-color-on-surface-variant)]">
                      2. Reinforcement Role &amp; Location
                    </label>
                    <select
                      value={helperRoleKey}
                      onChange={(e) => setHelperRoleKey(e.target.value as RebarRoleKey)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                    >
                      {Object.values(REBAR_ROLE_DEFINITIONS)
                        .filter((d) => d.elementType === helperElementType)
                        .map((def) => (
                          <option key={def.id} value={def.id}>
                            {def.label} ({def.defaultShape})
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
                      {suggestions.role.subLabel} · <span className="text-[var(--md-sys-color-primary)] font-semibold">{suggestions.role.codeReference}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase mb-1.5 text-[var(--md-sys-color-on-surface-variant)]">
                      3. Section Geometry (mm)
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                          {helperElementType === 'slab' ? 'Panel Width B' : 'Width B (mm)'}
                        </span>
                        <input
                          type="number"
                          step="25"
                          value={helperWidthMm}
                          onChange={(e) => setHelperWidthMm(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                          {helperElementType === 'slab' ? 'Slab Thickness (mm)' : 'Depth D (mm)'}
                        </span>
                        <input
                          type="number"
                          step="25"
                          value={helperDepthMm}
                          onChange={(e) => setHelperDepthMm(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                          Span / Length L (mm)
                        </span>
                        <input
                          type="number"
                          step="100"
                          value={helperLengthMm}
                          onChange={(e) => setHelperLengthMm(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">
                          Clear Cover (mm)
                        </span>
                        <input
                          type="number"
                          step="5"
                          value={helperCoverMm}
                          onChange={(e) => setHelperCoverMm(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Code Limits & Actionable Suggested Configurations */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] block">
                        Target Steel Ratio (ρ) &amp; Area (As)
                      </span>
                      <span className="text-base font-bold text-[var(--md-sys-color-primary)]">
                        {(suggestions.role.typicalRatioTarget * 100).toFixed(2)}% · {suggestions.targetAreaMm2} mm²
                      </span>
                    </div>
                    <div className="text-right text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      <div>Code Limits: {(suggestions.role.typicalRatioMin * 100).toFixed(2)}% — {(suggestions.role.typicalRatioMax * 100).toFixed(2)}%</div>
                      <div>Gross Concrete Area Ag: {suggestions.grossAreaMm2.toLocaleString()} mm²</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Recommended Spacing &amp; Diameter Options:</span>
                      </span>
                      <span className="text-[10px] font-normal text-[var(--md-sys-color-on-surface-variant)]">
                        Click &apos;Auto-Fill Row&apos; to instantly accept
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {suggestions.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
                            opt.rating === 'optimal'
                              ? 'border-[var(--md-sys-color-primary)]/50 bg-[var(--md-sys-color-primary-container)]/15 shadow-2xs'
                              : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-12 text-center text-sm font-bold font-mono text-[var(--md-sys-color-primary)] py-1 bg-[var(--md-sys-color-surface-container)] rounded-lg">
                              Ø{opt.diaMm}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono text-[var(--md-sys-color-on-surface)]">
                                  {opt.note}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                    opt.rating === 'optimal'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  }`}
                                >
                                  {opt.rating}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                                As Provided: {opt.areaProvidedMm2} mm² · Steel Ratio ρ: {opt.ratioPercent}% (Shape: {suggestions.role.defaultShape})
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApplySuggestion(opt)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                              title="Auto-fill this suggested rebar config into targeted row"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Auto-Fill Row</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddSuggestedAsNewRow(opt)}
                              className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors"
                              title="Add as brand new row in BBS Schedule"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Multi-Row BBS Table */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Bar Schedule Master Table
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHelperOpen(!isHelperOpen)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                    isHelperOpen
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-primary)]/40'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>{isHelperOpen ? 'Hide Suggestion Helper' : 'Smart Rebar Helper'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bar Mark</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[10px] font-mono uppercase text-[var(--md-sys-color-on-surface-variant)]">
                    <th className="py-2 px-2">Mark</th>
                    <th className="py-2 px-2">Member / Location</th>
                    <th className="py-2 px-2">Shape</th>
                    <th className="py-2 px-2">Dia (Ø)</th>
                    <th className="py-2 px-2">Members</th>
                    <th className="py-2 px-2">Bars/Mem</th>
                    <th className="py-2 px-2">Total Qty</th>
                    <th className="py-2 px-2">Dim A (mm)</th>
                    <th className="py-2 px-2">Dim B / C / H</th>
                    <th className="py-2 px-2">Cutting L (m)</th>
                    <th className="py-2 px-2">Total L (m)</th>
                    <th className="py-2 px-2">Total Wt (kg)</th>
                    <th className="py-2 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] font-mono">
                  {calculatedRows.map((r, idx) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRowId(r.id)}
                      className={`transition-colors cursor-pointer ${
                        selectedRowId === r.id
                          ? 'bg-[var(--md-sys-color-primary-container)]/20 border-l-2 border-l-[var(--md-sys-color-primary)]'
                          : 'hover:bg-[var(--md-sys-color-surface-container-low)]'
                      }`}
                    >
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={r.barMark}
                          onChange={(e) => handleUpdateRow(r.id, { barMark: e.target.value })}
                          className="w-16 px-1.5 py-1 text-xs font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)]"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={r.member}
                          onChange={(e) => handleUpdateRow(r.id, { member: e.target.value })}
                          className="w-32 px-1.5 py-1 text-xs rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <select
                          value={r.shape}
                          onChange={(e) => {
                            const val = e.target.value as BarShapeType;
                            handleUpdateRow(r.id, { shape: val });
                            setActiveShapePreview(val);
                          }}
                          className="px-1.5 py-1 text-xs rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        >
                          <option value="straight">Straight</option>
                          <option value="l-bend">L-Bend (90°)</option>
                          <option value="u-bar">U-Bar</option>
                          <option value="cranked-slab">Cranked (45°)</option>
                          <option value="rectangular-stirrup">Rect Stirrup (135°)</option>
                          <option value="circular-tie">Circular Tie</option>
                        </select>
                      </td>

                      <td className="py-2 px-2">
                        <select
                          value={r.diaMm}
                          onChange={(e) => handleUpdateRow(r.id, { diaMm: Number(e.target.value) })}
                          className="px-1.5 py-1 text-xs font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        >
                          {REBAR_DIAMETERS.map((d) => (
                            <option key={d} value={d}>
                              {d} mm
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          value={r.numMembers}
                          onChange={(e) => handleUpdateRow(r.id, { numMembers: Math.max(1, Number(e.target.value)) })}
                          className="w-14 px-1.5 py-1 text-xs rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-center"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          value={r.barsPerMember}
                          onChange={(e) => handleUpdateRow(r.id, { barsPerMember: Math.max(1, Number(e.target.value)) })}
                          className="w-14 px-1.5 py-1 text-xs rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-center"
                        />
                      </td>

                      <td className="py-2 px-2 font-bold text-center text-[var(--md-sys-color-on-surface)]">
                        {r.totalBars}
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="10"
                          value={r.dimA}
                          onChange={(e) => handleUpdateRow(r.id, { dimA: Math.max(0, Number(e.target.value)) })}
                          className="w-20 px-1.5 py-1 text-xs rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          {r.shape === 'cranked-slab' ? (
                            <div className="flex items-center gap-1 text-[10px]">
                              <span>H:</span>
                              <input
                                type="number"
                                step="5"
                                value={r.dimH || 0}
                                onChange={(e) => handleUpdateRow(r.id, { dimH: Number(e.target.value) })}
                                className="w-14 px-1 py-1 text-xs rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                              />
                            </div>
                          ) : (
                            <>
                              <input
                                type="number"
                                step="10"
                                placeholder="B"
                                value={r.dimB || 0}
                                onChange={(e) => handleUpdateRow(r.id, { dimB: Number(e.target.value) })}
                                className="w-14 px-1 py-1 text-xs rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                                disabled={r.shape === 'straight'}
                              />
                              {(r.shape === 'u-bar') && (
                                <input
                                  type="number"
                                  step="10"
                                  placeholder="C"
                                  value={r.dimC || 0}
                                  onChange={(e) => handleUpdateRow(r.id, { dimC: Number(e.target.value) })}
                                  className="w-14 px-1 py-1 text-xs rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                                />
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-2 font-bold text-[var(--md-sys-color-primary)]">
                        {r.cuttingLengthM} m
                      </td>

                      <td className="py-2 px-2 text-[var(--md-sys-color-on-surface)]">
                        {r.totalLengthM} m
                      </td>

                      <td className="py-2 px-2 font-bold text-emerald-600">
                        {r.totalWeightKg.toFixed(1)} kg
                      </td>

                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title={`Auto-Suggest Rebar Config for ${r.barMark}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenHelperForRow(r);
                            }}
                            className={`p-1 rounded cursor-pointer transition-colors ${
                              selectedRowId === r.id
                                ? 'text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/60 font-bold'
                                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]'
                            }`}
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Duplicate Bar Mark"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateRow(idx);
                            }}
                            className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Bar Mark"
                            disabled={rows.length <= 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRow(r.id);
                            }}
                            className="p-1 rounded text-rose-500 hover:text-rose-700 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2D SVG Shape Preview & Geometry Callouts */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                  2D Shape Bending &amp; Hook Geometry Inspector
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {(['straight', 'l-bend', 'u-bar', 'cranked-slab', 'rectangular-stirrup', 'circular-tie'] as BarShapeType[]).map((shapeKey) => (
                  <button
                    key={shapeKey}
                    type="button"
                    onClick={() => setActiveShapePreview(shapeKey)}
                    className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer uppercase ${
                      activeShapePreview === shapeKey
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                        : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                    }`}
                  >
                    {shapeKey.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)]">
              <div className="md:col-span-2 flex items-center justify-center min-h-[120px]">
                {renderShapeSvg(activeShapePreview, 16, 2500, 450, 450, 120)}
              </div>
              <div className="text-xs font-mono space-y-1.5 p-3 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <div className="font-bold text-[var(--md-sys-color-primary)] uppercase text-[11px]">
                  {activeShapePreview.toUpperCase()} RULES
                </div>
                {activeShapePreview === 'rectangular-stirrup' && (
                  <>
                    <div>Perimeter: 2(A + B)</div>
                    <div>Hooks: 2 × 10d (min 75mm)</div>
                    <div>90° Bend Ded: 3 × 2d = 6d</div>
                    <div>135° Bend Ded: 2 × 3d = 6d</div>
                    <div className="text-emerald-600 font-bold">Total Ded: 12d</div>
                  </>
                )}
                {activeShapePreview === 'cranked-slab' && (
                  <>
                    <div>Clear Span: L</div>
                    <div>45° Inclined Slope: +0.42 × H</div>
                    <div>End Hooks: 2 × 9d</div>
                    <div>4 Bends (45°): 4 × 1d</div>
                    <div className="text-emerald-600 font-bold">Net: L + 0.42H + 14d</div>
                  </>
                )}
                {activeShapePreview === 'l-bend' && (
                  <>
                    <div>Leg 1: A</div>
                    <div>Leg 2: B</div>
                    <div>90° Corner Bend: -2d</div>
                    <div className="text-emerald-600 font-bold">Cutting: A + B - 2d</div>
                  </>
                )}
                {activeShapePreview === 'u-bar' && (
                  <>
                    <div>Base: A</div>
                    <div>Legs: B + C</div>
                    <div>Two 90° Bends: -4d</div>
                    <div className="text-emerald-600 font-bold">Cutting: A + B + C - 4d</div>
                  </>
                )}
                {activeShapePreview === 'straight' && (
                  <>
                    <div>No Bends or Deductions</div>
                    <div>Cutting Length = Specified Span L</div>
                  </>
                )}
                {activeShapePreview === 'circular-tie' && (
                  <>
                    <div>Internal Dia: D</div>
                    <div>Circumference: π × D</div>
                    <div>Lap Hook: 2 × 10d (seismic)</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Development Length (Ld) & Lapping Engine Tab */
        <div className="space-y-6">
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Code-Compliant Development &amp; Lap Splice Lengths (BNBC 2020 / ACI 318-19 / IS 456)
                </h3>
                <p className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Calculates minimum tension development length (Ld), Class A (1.0 Ld), Class B (1.3 Ld), and compression splices.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono">f&apos;c (Concrete):</span>
                  <select
                    value={fcMpa}
                    onChange={(e) => setFcMpa(Number(e.target.value))}
                    className="px-2 py-1 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]"
                  >
                    <option value={20}>20 MPa (M20)</option>
                    <option value={25}>25 MPa (M25)</option>
                    <option value={30}>30 MPa (M30)</option>
                    <option value={35}>35 MPa (M35)</option>
                    <option value={40}>40 MPa (M40)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono">fy (Steel Grade):</span>
                  <select
                    value={fyMpa}
                    onChange={(e) => setFyMpa(Number(e.target.value))}
                    className="px-2 py-1 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]"
                  >
                    <option value={415}>415 MPa / 60 Grade</option>
                    <option value={500}>500 MPa / 500W Grade</option>
                    <option value={550}>550 MPa / 550W Grade</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ld Results Master Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[10px] font-mono uppercase text-[var(--md-sys-color-on-surface-variant)]">
                    <th className="py-2.5 px-3">Bar Dia (Ø)</th>
                    <th className="py-2.5 px-3">Unit Wt (kg/m)</th>
                    <th className="py-2.5 px-3">Devel. Length Ld (mm)</th>
                    <th className="py-2.5 px-3">Class A Lap (1.0 Ld)</th>
                    <th className="py-2.5 px-3 bg-[var(--md-sys-color-primary-container)]/20 font-bold text-[var(--md-sys-color-primary)]">
                      Class B Lap (1.3 Ld) - Standard
                    </th>
                    <th className="py-2.5 px-3">Compression Lap</th>
                    <th className="py-2.5 px-3">90° Hook (12d)</th>
                    <th className="py-2.5 px-3">135° Hook (10d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] font-mono">
                  {devLengthTable.map((row) => (
                    <tr key={row.dia} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                      <td className="py-2 px-3 font-bold text-sm text-[var(--md-sys-color-primary)]">
                        Ø {row.dia} mm
                      </td>
                      <td className="py-2 px-3 text-[var(--md-sys-color-on-surface-variant)]">
                        {row.unitWt}
                      </td>
                      <td className="py-2 px-3 font-semibold text-[var(--md-sys-color-on-surface)]">
                        {row.ldMm} mm ({Math.round(row.ldMm / row.dia)}d)
                      </td>
                      <td className="py-2 px-3 text-[var(--md-sys-color-on-surface)]">
                        {row.lapClassAMm} mm
                      </td>
                      <td className="py-2 px-3 bg-[var(--md-sys-color-primary-container)]/10 font-bold text-emerald-600">
                        {row.lapClassBMm} mm ({Math.round(row.lapClassBMm / row.dia)}d)
                      </td>
                      <td className="py-2 px-3 text-[var(--md-sys-color-on-surface)]">
                        {row.compressionLapMm} mm
                      </td>
                      <td className="py-2 px-3 text-[var(--md-sys-color-on-surface-variant)]">
                        {12 * row.dia} mm
                      </td>
                      <td className="py-2 px-3 text-[var(--md-sys-color-on-surface-variant)]">
                        {Math.max(75, 10 * row.dia)} mm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] space-y-1">
              <div className="font-bold text-[var(--md-sys-color-primary)]">
                Field Engineering Notes on Lap Splices:
              </div>
              <div>• Tension Splices: Class B splices (1.3 Ld) are mandatory when more than 50% of bars are spliced at any section.</div>
              <div>• Staggering Rule: Splices in adjacent bars must be staggered by at least 600 mm or 1.3 Ld.</div>
              <div>• Mechanical Couplers: For bar diameter ≥ 32 mm, mechanical couplers or welded splices are recommended over lap splices.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
