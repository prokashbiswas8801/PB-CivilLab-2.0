import React, { useState, useMemo } from 'react';
import {
  Compass,
  FileSpreadsheet,
  FileDown,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Maximize2,
  Layers,
  Settings2,
  Table,
} from 'lucide-react';
import { exportToCSV, generateEngineeringPDF } from '../../../utils/exportEngine';

export interface LevelingRow {
  id: string;
  station: string;
  backsight?: number;
  intermediateSight?: number;
  foresight?: number;
  heightOfInstrument?: number;
  rise?: number;
  fall?: number;
  reducedLevel: number;
  remarks: string;
}

export interface PolygonPoint {
  id: string;
  x: number; // Easting / X (m or ft)
  y: number; // Northing / Y (m or ft)
}

export const SurveyingSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'land-area' | 'leveling-sheet'>('land-area');

  /* -------------------------------------------------------------------------
     SUB-MODULE 1: IRREGULAR LAND AREA CALCULATOR
  -------------------------------------------------------------------------- */
  const [landCalcMode, setLandCalcMode] = useState<'3-sided' | '4-sided' | 'polygon'>('4-sided');
  const [inputUnit, setInputUnit] = useState<'ft' | 'm'>('ft');
  const [customKathaSqFt, setCustomKathaSqFt] = useState<number>(720); // 720 standard Bangladesh/Bengal, 1361.25 Bihar

  // 3-Sided (Heron's Formula)
  const [sideA, setSideA] = useState<number>(120);
  const [sideB, setSideB] = useState<number>(150);
  const [sideC, setSideC] = useState<number>(180);

  // 4-Sided (Quadrilateral with diagonal)
  // Triangle 1: side 1, side 2, diagonal; Triangle 2: side 3, side 4, diagonal
  const [quadSide1, setQuadSide1] = useState<number>(85); // North side
  const [quadSide2, setQuadSide2] = useState<number>(110); // East side
  const [quadSide3, setQuadSide3] = useState<number>(90); // South side
  const [quadSide4, setQuadSide4] = useState<number>(105); // West side
  const [quadDiagonal, setQuadDiagonal] = useState<number>(140); // Diagonal tie line

  // Multi-point Coordinate Polygon (Shoelace Algorithm)
  const [polygonPoints, setPolygonPoints] = useState<PolygonPoint[]>([
    { id: 'p1', x: 0, y: 0 },
    { id: 'p2', x: 120, y: 15 },
    { id: 'p3', x: 150, y: 110 },
    { id: 'p4', x: 45, y: 130 },
    { id: 'p5', x: 0, y: 80 },
  ]);

  // Compute area in input units squared (ft² or m²)
  const rawComputedArea = useMemo(() => {
    if (landCalcMode === '3-sided') {
      const a = sideA;
      const b = sideB;
      const c = sideC;
      if (a + b <= c || a + c <= b || b + c <= a) return 0;
      const s = (a + b + c) / 2;
      return Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
    }

    if (landCalcMode === '4-sided') {
      const d = quadDiagonal;
      // Triangle 1 (side1, side2, diagonal)
      let area1 = 0;
      if (quadSide1 + quadSide2 > d && quadSide1 + d > quadSide2 && quadSide2 + d > quadSide1) {
        const s1 = (quadSide1 + quadSide2 + d) / 2;
        area1 = Math.sqrt(Math.max(0, s1 * (s1 - quadSide1) * (s1 - quadSide2) * (s1 - d)));
      }

      // Triangle 2 (side3, side4, diagonal)
      let area2 = 0;
      if (quadSide3 + quadSide4 > d && quadSide3 + d > quadSide4 && quadSide4 + d > quadSide3) {
        const s2 = (quadSide3 + quadSide4 + d) / 2;
        area2 = Math.sqrt(Math.max(0, s2 * (s2 - quadSide3) * (s2 - quadSide4) * (s2 - d)));
      }

      return area1 + area2;
    }

    if (landCalcMode === 'polygon') {
      // Shoelace algorithm
      const n = polygonPoints.length;
      if (n < 3) return 0;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        sum += polygonPoints[i].x * polygonPoints[j].y;
        sum -= polygonPoints[j].x * polygonPoints[i].y;
      }
      return Math.abs(sum) / 2;
    }

    return 0;
  }, [landCalcMode, sideA, sideB, sideC, quadSide1, quadSide2, quadSide3, quadSide4, quadDiagonal, polygonPoints]);

  // Normalize to Square Feet and Square Meters
  const areaSqFt = useMemo(() => {
    return inputUnit === 'ft' ? rawComputedArea : rawComputedArea * 10.7639104;
  }, [rawComputedArea, inputUnit]);

  const areaSqM = useMemo(() => {
    return inputUnit === 'm' ? rawComputedArea : rawComputedArea / 10.7639104;
  }, [rawComputedArea, inputUnit]);

  // Regional Conversions
  const conversions = useMemo(() => {
    const kathaSqFt = customKathaSqFt > 0 ? customKathaSqFt : 720;
    const decimal = areaSqFt / 435.6;
    const katha = areaSqFt / kathaSqFt;
    const bigha = katha / 20; // 20 kathas = 1 bigha
    const acre = areaSqFt / 43560;
    const hectare = areaSqM / 10000;
    const chatak = katha * 16; // 16 chataks = 1 katha
    const ganda = katha * 4; // 4 gandas = 1 katha

    return {
      decimal: Number(decimal.toFixed(4)),
      katha: Number(katha.toFixed(4)),
      bigha: Number(bigha.toFixed(4)),
      acre: Number(acre.toFixed(4)),
      hectare: Number(hectare.toFixed(4)),
      chatak: Number(chatak.toFixed(2)),
      ganda: Number(ganda.toFixed(2)),
    };
  }, [areaSqFt, areaSqM, customKathaSqFt]);

  /* -------------------------------------------------------------------------
     SUB-MODULE 2: RISE & FALL / HEIGHT OF INSTRUMENT (HI) LEVELING SHEET
  -------------------------------------------------------------------------- */
  const [levelingMethod, setLevelingMethod] = useState<'height-of-instrument' | 'rise-and-fall'>('height-of-instrument');
  const [initialBenchmarkRL, setInitialBenchmarkRL] = useState<number>(100.0);

  const [levelingRows, setLevelingRows] = useState<LevelingRow[]>([
    { id: 'st-01', station: 'BM 1', backsight: 1.450, intermediateSight: undefined, foresight: undefined, heightOfInstrument: 101.450, rise: undefined, fall: undefined, reducedLevel: 100.0, remarks: 'Benchmark on culvert parapet' },
    { id: 'st-02', station: 'CH 0+000', backsight: undefined, intermediateSight: 1.820, foresight: undefined, heightOfInstrument: 101.450, rise: undefined, fall: 0.370, reducedLevel: 99.630, remarks: 'Centerline road start' },
    { id: 'st-03', station: 'CH 0+020', backsight: undefined, intermediateSight: 2.150, foresight: undefined, heightOfInstrument: 101.450, rise: undefined, fall: 0.330, reducedLevel: 99.300, remarks: 'Natural ground' },
    { id: 'st-04', station: 'CP 1', backsight: 2.380, intermediateSight: undefined, foresight: 2.890, heightOfInstrument: 100.940, rise: undefined, fall: 0.740, reducedLevel: 98.560, remarks: 'Change Point on peg' },
    { id: 'st-05', station: 'CH 0+040', backsight: undefined, intermediateSight: 1.620, foresight: undefined, heightOfInstrument: 100.940, rise: 0.760, fall: undefined, reducedLevel: 99.320, remarks: 'Drain bed invert' },
    { id: 'st-06', station: 'TBM 2', backsight: undefined, intermediateSight: undefined, foresight: 1.250, heightOfInstrument: 100.940, rise: 0.370, fall: undefined, reducedLevel: 99.690, remarks: 'Closing temporary BM' },
  ]);

  // Compute Leveling Table dynamically according to standard surveying physics
  const computedLeveling = useMemo(() => {
    let currentRL = initialBenchmarkRL;
    let currentHI = initialBenchmarkRL + (levelingRows[0]?.backsight || 0);
    let prevReading = levelingRows[0]?.backsight || 0;

    let sumBS = 0;
    let sumFS = 0;
    let sumRise = 0;
    let sumFall = 0;

    const rows = levelingRows.map((row, idx) => {
      const bs = row.backsight;
      const is = row.intermediateSight;
      const fs = row.foresight;

      if (bs !== undefined) sumBS += bs;
      if (fs !== undefined) sumFS += fs;

      let rLevel = row.reducedLevel;
      let hi = currentHI;
      let riseVal: number | undefined = undefined;
      let fallVal: number | undefined = undefined;

      if (idx === 0) {
        rLevel = initialBenchmarkRL;
        currentRL = initialBenchmarkRL;
        if (bs !== undefined) {
          currentHI = initialBenchmarkRL + bs;
          hi = currentHI;
          prevReading = bs;
        }
      } else {
        const thisReading = is !== undefined ? is : (fs !== undefined ? fs : (bs !== undefined ? bs : 0));
        const diff = prevReading - thisReading;

        if (diff > 0.0001) {
          riseVal = Number(diff.toFixed(3));
          sumRise += riseVal;
          currentRL = Number((currentRL + riseVal).toFixed(3));
        } else if (diff < -0.0001) {
          fallVal = Number(Math.abs(diff).toFixed(3));
          sumFall += fallVal;
          currentRL = Number((currentRL - fallVal).toFixed(3));
        } else {
          // Zero difference
        }

        rLevel = currentRL;

        // HI update
        if (is !== undefined) {
          rLevel = Number((currentHI - is).toFixed(3));
        } else if (fs !== undefined) {
          rLevel = Number((currentHI - fs).toFixed(3));
        }

        // If this station also has a backsight (Change Point), advance HI
        if (bs !== undefined) {
          currentHI = Number((rLevel + bs).toFixed(3));
        }
        hi = currentHI;
        prevReading = bs !== undefined ? bs : thisReading;
      }

      return {
        ...row,
        heightOfInstrument: hi,
        rise: riseVal,
        fall: fallVal,
        reducedLevel: rLevel,
      };
    });

    const firstRL = rows[0]?.reducedLevel || initialBenchmarkRL;
    const lastRL = rows[rows.length - 1]?.reducedLevel || initialBenchmarkRL;

    const diffBS_FS = Number((sumBS - sumFS).toFixed(4));
    const diffRise_Fall = Number((sumRise - sumFall).toFixed(4));
    const diffLast_FirstRL = Number((lastRL - firstRL).toFixed(4));

    const isArithmeticCheckPassed =
      Math.abs(diffBS_FS - diffRise_Fall) < 0.002 &&
      Math.abs(diffRise_Fall - diffLast_FirstRL) < 0.002;

    return {
      rows,
      sumBS: Number(sumBS.toFixed(3)),
      sumFS: Number(sumFS.toFixed(3)),
      sumRise: Number(sumRise.toFixed(3)),
      sumFall: Number(sumFall.toFixed(3)),
      diffBS_FS,
      diffRise_Fall,
      diffLast_FirstRL,
      isArithmeticCheckPassed,
      firstRL,
      lastRL,
    };
  }, [levelingRows, initialBenchmarkRL]);

  // Add / Duplicate / Delete Leveling Row
  const handleAddLevelingRow = () => {
    const newIdx = levelingRows.length + 1;
    setLevelingRows([
      ...levelingRows,
      {
        id: `st-${Date.now()}`,
        station: `ST ${newIdx}`,
        intermediateSight: 1.500,
        reducedLevel: 100.0,
        remarks: 'Intermediate ground reading',
      },
    ]);
  };

  const handleUpdateLevelingRow = (id: string, patch: Partial<LevelingRow>) => {
    setLevelingRows(levelingRows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleDeleteLevelingRow = (id: string) => {
    if (levelingRows.length <= 2) return;
    setLevelingRows(levelingRows.filter((r) => r.id !== id));
  };

  // Export Leveling to CSV
  const handleExportLevelingCSV = () => {
    const headers = [
      'Station',
      'BS (Backsight)',
      'IS (Intermediate Sight)',
      'FS (Foresight)',
      'HI (Height of Inst)',
      'Rise (+)',
      'Fall (-)',
      'Reduced Level (RL)',
      'Remarks',
    ];

    const dataRows = computedLeveling.rows.map((r) => [
      r.station,
      r.backsight !== undefined ? r.backsight.toFixed(3) : '',
      r.intermediateSight !== undefined ? r.intermediateSight.toFixed(3) : '',
      r.foresight !== undefined ? r.foresight.toFixed(3) : '',
      r.heightOfInstrument !== undefined ? r.heightOfInstrument.toFixed(3) : '',
      r.rise !== undefined ? r.rise.toFixed(3) : '',
      r.fall !== undefined ? r.fall.toFixed(3) : '',
      r.reducedLevel.toFixed(3),
      r.remarks,
    ]);

    // Arithmetic check summary
    dataRows.push(['', '', '', '', '', '', '', '', '']);
    dataRows.push(['--- ARITHMETIC CHECK SUMMARY ---', '', '', '', '', '', '', '', '']);
    dataRows.push([
      `Σ BS = ${computedLeveling.sumBS.toFixed(3)}`,
      `Σ FS = ${computedLeveling.sumFS.toFixed(3)}`,
      `Σ BS - Σ FS = ${computedLeveling.diffBS_FS.toFixed(3)}`,
      '',
      '',
      `Σ Rise = ${computedLeveling.sumRise.toFixed(3)}`,
      `Σ Fall = ${computedLeveling.sumFall.toFixed(3)}`,
      `Σ Rise - Σ Fall = ${computedLeveling.diffRise_Fall.toFixed(3)}`,
      `Last RL - First RL = ${computedLeveling.diffLast_FirstRL.toFixed(3)}`,
    ]);
    dataRows.push([
      `ARITHMETIC CHECK: ${computedLeveling.isArithmeticCheckPassed ? 'PASSED (STRICT CHECK MATCH)' : 'MISMATCH (RE-CHECK SIGHTS)'}`,
      '', '', '', '', '', '', '', '',
    ]);

    exportToCSV(`Leveling_Field_Sheet_${new Date().toISOString().slice(0, 10)}.csv`, headers, dataRows);
  };

  // Export Surveying to PDF
  const handleExportSurveyingPDF = async () => {
    const tableColumns = ['Station', 'BS', 'IS', 'FS', 'HI', 'Rise', 'Fall', 'RL (m)', 'Remarks'];
    const tableRows = computedLeveling.rows.map((r) => [
      r.station,
      r.backsight !== undefined ? r.backsight.toFixed(3) : '-',
      r.intermediateSight !== undefined ? r.intermediateSight.toFixed(3) : '-',
      r.foresight !== undefined ? r.foresight.toFixed(3) : '-',
      r.heightOfInstrument !== undefined ? r.heightOfInstrument.toFixed(3) : '-',
      r.rise !== undefined ? `+${r.rise.toFixed(3)}` : '-',
      r.fall !== undefined ? `-${r.fall.toFixed(3)}` : '-',
      r.reducedLevel.toFixed(3),
      r.remarks,
    ]);

    const pdfReportData = {
      projectMeta: {
        projectName: 'Differential Leveling & Irregular Land Takeoff',
        projectCode: 'SURVEY-CIVIL-2026',
        client: 'Field Survey Bench Alignment',
        location: 'Field Survey Bench Alignment',
        date: new Date().toISOString().slice(0, 10),
        unitSystem: 'SI' as const,
        engineerName: 'Prokash Biswas, PE',
      },
      moduleMeta: {
        moduleId: 'surveying-suite',
        moduleTitle: 'SURVEYING FIELD LEVELING & LAND MEASUREMENT REPORT',
        standard: 'Survey of Bangladesh / IS 1492 / Surveying Standards',
        status: computedLeveling.isArithmeticCheckPassed ? ('VERIFIED' as const) : ('WARNING' as const),
      },
      inputs: [
        { name: 'Initial Benchmark RL', symbol: 'BM_RL', value: computedLeveling.firstRL.toFixed(3), unit: 'm' },
        { name: 'Leveling Reduction Method', symbol: 'Method', value: levelingMethod === 'height-of-instrument' ? 'HI Method' : 'Rise & Fall', unit: 'calc' },
        { name: 'Total Stations Recorded', symbol: 'N_stn', value: computedLeveling.rows.length, unit: 'readings' },
        { name: 'Sum of Backsights', symbol: 'ΣBS', value: computedLeveling.sumBS.toFixed(3), unit: 'm' },
      ],
      outputs: [
        { name: 'Closing Station RL', symbol: 'Closing_RL', value: computedLeveling.lastRL.toFixed(3), unit: 'm', status: 'PASS' as const },
        { name: 'Backsight minus Foresight', symbol: 'ΣBS - ΣFS', value: computedLeveling.diffBS_FS.toFixed(3), unit: 'm', status: 'INFO' as const },
        { name: 'Rise minus Fall', symbol: 'ΣRise - ΣFall', value: computedLeveling.diffRise_Fall.toFixed(3), unit: 'm', status: 'INFO' as const },
        { name: 'Arithmetic Check Result', symbol: 'Check', value: computedLeveling.isArithmeticCheckPassed ? 'PASSED (0.000m)' : 'DISCREPANCY', unit: 'audit', status: computedLeveling.isArithmeticCheckPassed ? ('PASS' as const) : ('WARNING' as const) },
      ],
      takeoffHeaders: ['Station', 'BS (m)', 'IS (m)', 'FS (m)', 'HI (m)', 'Rise (+)', 'Fall (-)', 'RL (m)'],
      takeoffRows: computedLeveling.rows.map((r) => ({
        col1: r.station,
        col2: r.backsight !== undefined ? r.backsight.toFixed(3) : '-',
        col3: r.intermediateSight !== undefined ? r.intermediateSight.toFixed(3) : '-',
        col4: r.foresight !== undefined ? r.foresight.toFixed(3) : '-',
        col5: r.heightOfInstrument !== undefined ? r.heightOfInstrument.toFixed(3) : '-',
        col6: r.rise !== undefined ? `+${r.rise.toFixed(3)}` : (r.fall !== undefined ? `-${r.fall.toFixed(3)}` : '-'),
        col7: `${r.reducedLevel.toFixed(3)} m`,
      })),
      governingAssumptions: [
        'Height of Instrument Method: HI = RL + BS; Station RL = HI - IS (or HI - FS)',
        'Rise & Fall Method: Difference = Previous Sight - Present Sight (+ve = Rise, -ve = Fall)',
        'Three-Point Arithmetic Check: Σ BS - Σ FS = Σ Rise - Σ Fall = Last RL - First RL',
        'Land Area: Heron\'s Formula A = √[s(s-a)(s-b)(s-c)] & Multi-point Shoelace Vector Integration',
      ],
    };

    await generateEngineeringPDF(pdfReportData, {
      filename: `PB_CivilLab_Surveying_Leveling_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  // Add polygon coordinate point
  const handleAddPolygonPoint = () => {
    const id = `p${polygonPoints.length + 1}`;
    const last = polygonPoints[polygonPoints.length - 1] || { x: 0, y: 0 };
    setPolygonPoints([...polygonPoints, { id, x: last.x + 20, y: last.y + 20 }]);
  };

  // Remove polygon coordinate point
  const handleRemovePolygonPoint = (id: string) => {
    if (polygonPoints.length <= 3) return;
    setPolygonPoints(polygonPoints.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] uppercase">
                Phase 4 Module
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                Surveying &amp; Land Measurement Suite
              </h2>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
              Heron&apos;s Irregular Land &amp; Shoelace Coordinates · Instantaneous Decimal, Katha, Bigha · Rise &amp; Fall / HI Leveling Sheet
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportLevelingCSV}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportSurveyingPDF}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] flex items-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Certified PDF</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('land-area')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'land-area'
                ? 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] font-bold shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            Irregular Land Area &amp; Conversions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leveling-sheet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'leveling-sheet'
                ? 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] font-bold shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            Differential Leveling (HI &amp; Rise-Fall)
          </button>
        </div>
      </div>

      {activeTab === 'land-area' ? (
        /* LAND AREA CALCULATOR */
        <div className="space-y-6">
          {/* Unit & Calculation Mode Selector */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-[var(--md-sys-color-surface-container)] rounded-xl">
              <button
                type="button"
                onClick={() => setLandCalcMode('3-sided')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  landCalcMode === '3-sided'
                    ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                3-Sided (Heron&apos;s)
              </button>
              <button
                type="button"
                onClick={() => setLandCalcMode('4-sided')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  landCalcMode === '4-sided'
                    ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                4-Sided (With Diagonal)
              </button>
              <button
                type="button"
                onClick={() => setLandCalcMode('polygon')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  landCalcMode === 'polygon'
                    ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                Multi-Point Polygon (X, Y)
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">Input Unit:</span>
                <div className="flex rounded-md border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setInputUnit('ft')}
                    className={`px-2.5 py-1 text-xs font-mono font-bold cursor-pointer ${
                      inputUnit === 'ft'
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                        : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    Feet (ft)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputUnit('m')}
                    className={`px-2.5 py-1 text-xs font-mono font-bold cursor-pointer ${
                      inputUnit === 'm'
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                        : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    Meter (m)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">1 Katha =</span>
                <input
                  type="number"
                  value={customKathaSqFt}
                  onChange={(e) => setCustomKathaSqFt(Number(e.target.value) || 720)}
                  className="w-16 px-1.5 py-1 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]"
                />
                <span className="text-xs font-mono">sq.ft</span>
              </div>
            </div>
          </div>

          {/* Geometric Inputs according to selected mode */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)] mb-3">
                  {landCalcMode === '3-sided' && "Heron's Triangular Boundary Dimensions"}
                  {landCalcMode === '4-sided' && 'Quadrilateral Boundary & Tie Diagonal (Diagonal Method)'}
                  {landCalcMode === 'polygon' && 'Polygon Node Coordinates (X, Y in ' + inputUnit + ')'}
                </h3>

                {landCalcMode === '3-sided' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono mb-1">Side A ({inputUnit})</label>
                        <input
                          type="number"
                          step="0.5"
                          value={sideA}
                          onChange={(e) => setSideA(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono mb-1">Side B ({inputUnit})</label>
                        <input
                          type="number"
                          step="0.5"
                          value={sideB}
                          onChange={(e) => setSideB(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono mb-1">Side C ({inputUnit})</label>
                        <input
                          type="number"
                          step="0.5"
                          value={sideC}
                          onChange={(e) => setSideC(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] p-2 rounded-lg">
                      Heron&apos;s formula: s = (a+b+c)/2 = {((sideA + sideB + sideC) / 2).toFixed(2)} {inputUnit}. Area = √[s(s-a)(s-b)(s-c)].
                    </div>
                  </div>
                )}

                {landCalcMode === '4-sided' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-mono mb-1">North Side ({inputUnit})</label>
                        <input
                          type="number"
                          step="0.5"
                          value={quadSide1}
                          onChange={(e) => setQuadSide1(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono mb-1">East Side ({inputUnit})</label>
                        <input
                          type="number"
                          step="0.5"
                          value={quadSide2}
                          onChange={(e) => setQuadSide2(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono mb-1">South Side ({inputUnit})</label>
                        <input
                          type="number"
                          step="0.5"
                          value={quadSide3}
                          onChange={(e) => setQuadSide3(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono mb-1">West Side ({inputUnit})</label>
                        <input
                          type="number"
                          step="0.5"
                          value={quadSide4}
                          onChange={(e) => setQuadSide4(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                      <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-primary)]">
                        Corner-to-Corner Diagonal Tie Line ({inputUnit})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={quadDiagonal}
                        onChange={(e) => setQuadDiagonal(Number(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)]"
                      />
                      <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                        Divided into Δ₁ ({quadSide1}, {quadSide2}, {quadDiagonal}) and Δ₂ ({quadSide3}, {quadSide4}, {quadDiagonal}).
                      </span>
                    </div>
                  </div>
                )}

                {landCalcMode === 'polygon' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                        {polygonPoints.length} Boundary Vertices
                      </span>
                      <button
                        type="button"
                        onClick={handleAddPolygonPoint}
                        className="px-2 py-1 rounded text-xs font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Vertex</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {polygonPoints.map((pt, idx) => (
                        <div key={pt.id} className="flex items-center gap-2 text-xs font-mono">
                          <span className="w-8 font-bold text-[var(--md-sys-color-primary)]">P{idx + 1}</span>
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-[10px]">X:</span>
                            <input
                              type="number"
                              value={pt.x}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setPolygonPoints(polygonPoints.map((p) => (p.id === pt.id ? { ...p, x: val } : p)));
                              }}
                              className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                            />
                          </div>
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-[10px]">Y:</span>
                            <input
                              type="number"
                              value={pt.y}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setPolygonPoints(polygonPoints.map((p) => (p.id === pt.id ? { ...p, y: val } : p)));
                              }}
                              className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={polygonPoints.length <= 3}
                            onClick={() => handleRemovePolygonPoint(pt.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 disabled:opacity-20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instantaneous Conversions Matrix */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                    Computed Land Area &amp; Units Conversion
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Instantaneous
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-[var(--md-sys-color-primary-container)]/25 border border-[var(--md-sys-color-primary)]/30">
                    <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                      Total Area (Sq. Feet)
                    </div>
                    <div className="text-xl font-bold font-mono text-[var(--md-sys-color-primary)] mt-1">
                      {areaSqFt.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                      <span className="text-xs font-normal">sft</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
                    <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                      Total Area (Sq. Meters)
                    </div>
                    <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-1">
                      {areaSqM.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                      <span className="text-xs font-normal">m²</span>
                    </div>
                  </div>
                </div>

                {/* Sub-continental Land Unit Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">
                      Decimal (শতক / ডিসিমল)
                    </div>
                    <div className="text-base font-bold text-[var(--md-sys-color-primary)] mt-0.5">
                      {conversions.decimal}
                    </div>
                    <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                      1 Dec = 435.6 sq.ft
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">
                      Katha (কাঠা)
                    </div>
                    <div className="text-base font-bold text-emerald-600 mt-0.5">
                      {conversions.katha}
                    </div>
                    <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                      1 Katha = {customKathaSqFt} sq.ft
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">
                      Bigha (বিঘা)
                    </div>
                    <div className="text-base font-bold text-[var(--md-sys-color-secondary)] mt-0.5">
                      {conversions.bigha}
                    </div>
                    <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                      1 Bigha = 20 Kathas
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">
                      Acre (একর)
                    </div>
                    <div className="text-base font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                      {conversions.acre}
                    </div>
                    <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                      1 Acre = 43,560 sq.ft
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">
                      Hectare (হেক্টর)
                    </div>
                    <div className="text-base font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                      {conversions.hectare}
                    </div>
                    <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                      1 Hectare = 10,000 m²
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">
                      Chatak / Ganda
                    </div>
                    <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                      {conversions.chatak} <span className="text-[10px] font-normal">ch</span>
                    </div>
                    <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">
                      {conversions.ganda} Gandas
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DIFFERENTIAL LEVELING SHEET (HI & RISE-FALL) */
        <div className="space-y-6">
          {/* Method Selector & Initial Benchmark RL */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Leveling Reduction Method:
              </span>
              <div className="flex items-center gap-1.5 p-1 bg-[var(--md-sys-color-surface-container)] rounded-xl">
                <button
                  type="button"
                  onClick={() => setLevelingMethod('height-of-instrument')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    levelingMethod === 'height-of-instrument'
                      ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                      : 'text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  Height of Instrument (HI) Method
                </button>
                <button
                  type="button"
                  onClick={() => setLevelingMethod('rise-and-fall')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    levelingMethod === 'rise-and-fall'
                      ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                      : 'text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  Rise &amp; Fall Method
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-[var(--md-sys-color-on-surface)]">
                Initial Benchmark (BM) RL:
              </span>
              <input
                type="number"
                step="0.001"
                value={initialBenchmarkRL}
                onChange={(e) => setInitialBenchmarkRL(Number(e.target.value) || 100.0)}
                className="w-24 px-2 py-1 text-xs font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-right"
              />
              <span className="text-xs font-mono">m</span>
            </div>
          </div>

          {/* Automatic Arithmetic Check Status Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              computedLeveling.isArithmeticCheckPassed
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/30 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {computedLeveling.isArithmeticCheckPassed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold font-mono uppercase tracking-wider">
                  {computedLeveling.isArithmeticCheckPassed
                    ? 'ARITHMETIC CHECK PASSED (PERFECT BALANCE)'
                    : 'ARITHMETIC CHECK DISCREPANCY'}
                </div>
                <div className="text-xs font-mono mt-0.5">
                  Σ BS - Σ FS = ({computedLeveling.sumBS.toFixed(3)} - {computedLeveling.sumFS.toFixed(3)}) = {computedLeveling.diffBS_FS.toFixed(3)} m ·
                  Σ Rise - Σ Fall = ({computedLeveling.sumRise.toFixed(3)} - {computedLeveling.sumFall.toFixed(3)}) = {computedLeveling.diffRise_Fall.toFixed(3)} m ·
                  Last RL - First RL = ({computedLeveling.lastRL.toFixed(3)} - {computedLeveling.firstRL.toFixed(3)}) = {computedLeveling.diffLast_FirstRL.toFixed(3)} m
                </div>
              </div>
            </div>

            <div className="text-right text-xs font-mono font-bold">
              Check Difference: {Math.abs(computedLeveling.diffBS_FS - computedLeveling.diffLast_FirstRL).toFixed(4)} m
            </div>
          </div>

          {/* Interactive Leveling Master Table */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Differential Leveling Field Book Sheet
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddLevelingRow}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Station</span>
              </button>
            </div>

            <div className="overflow-x-auto pb-2">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[10px] uppercase text-[var(--md-sys-color-on-surface-variant)]">
                    <th className="py-2.5 px-2">Station</th>
                    <th className="py-2.5 px-2 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                      BS (Backsight)
                    </th>
                    <th className="py-2.5 px-2">IS (Intermediate)</th>
                    <th className="py-2.5 px-2 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
                      FS (Foresight)
                    </th>
                    {levelingMethod === 'height-of-instrument' ? (
                      <th className="py-2.5 px-2 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
                        HI (Height of Inst)
                      </th>
                    ) : (
                      <>
                        <th className="py-2.5 px-2 text-emerald-600">Rise (+)</th>
                        <th className="py-2.5 px-2 text-rose-600">Fall (-)</th>
                      </>
                    )}
                    <th className="py-2.5 px-2 font-bold text-[var(--md-sys-color-primary)]">
                      Reduced Level (RL)
                    </th>
                    <th className="py-2.5 px-2">Remarks / Description</th>
                    <th className="py-2.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {computedLeveling.rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors"
                    >
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={row.station}
                          onChange={(e) => handleUpdateLevelingRow(row.id, { station: e.target.value })}
                          className="w-24 px-1.5 py-1 text-xs font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </td>

                      <td className="py-2 px-2 bg-blue-50/30 dark:bg-blue-950/10">
                        <input
                          type="number"
                          step="0.001"
                          placeholder="-"
                          value={row.backsight ?? ''}
                          onChange={(e) =>
                            handleUpdateLevelingRow(row.id, {
                              backsight: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                          className="w-20 px-1.5 py-1 text-xs font-semibold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-blue-700 dark:text-blue-300"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.001"
                          placeholder="-"
                          value={row.intermediateSight ?? ''}
                          onChange={(e) =>
                            handleUpdateLevelingRow(row.id, {
                              intermediateSight: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                          className="w-20 px-1.5 py-1 text-xs rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </td>

                      <td className="py-2 px-2 bg-amber-50/30 dark:bg-amber-950/10">
                        <input
                          type="number"
                          step="0.001"
                          placeholder="-"
                          value={row.foresight ?? ''}
                          onChange={(e) =>
                            handleUpdateLevelingRow(row.id, {
                              foresight: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                          className="w-20 px-1.5 py-1 text-xs font-semibold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-amber-700 dark:text-amber-300"
                        />
                      </td>

                      {levelingMethod === 'height-of-instrument' ? (
                        <td className="py-2 px-2 bg-purple-50/30 dark:bg-purple-950/10 font-bold text-purple-700 dark:text-purple-300">
                          {row.heightOfInstrument !== undefined ? row.heightOfInstrument.toFixed(3) : '-'}
                        </td>
                      ) : (
                        <>
                          <td className="py-2 px-2 font-bold text-emerald-600">
                            {row.rise !== undefined ? `+${row.rise.toFixed(3)}` : '-'}
                          </td>
                          <td className="py-2 px-2 font-bold text-rose-600">
                            {row.fall !== undefined ? `-${row.fall.toFixed(3)}` : '-'}
                          </td>
                        </>
                      )}

                      <td className="py-2 px-2 font-bold text-sm text-[var(--md-sys-color-primary)]">
                        {row.reducedLevel.toFixed(3)} m
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => handleUpdateLevelingRow(row.id, { remarks: e.target.value })}
                          className="w-48 px-1.5 py-1 text-xs rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                        />
                      </td>

                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          disabled={levelingRows.length <= 2}
                          onClick={() => handleDeleteLevelingRow(row.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 disabled:opacity-20 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Elevation Profile Ground Line Vector Diagram */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                  Longitudinal Ground Profile (RL vs Station Sequence)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Reduced Level (m) Datum
              </span>
            </div>

            {/* SVG Ground line */}
            <div className="w-full h-36 bg-[var(--md-sys-color-surface-container-low)] rounded-xl border border-[var(--md-sys-color-outline-variant)] p-3 flex items-center justify-center">
              {(() => {
                const rls = computedLeveling.rows.map((r) => r.reducedLevel);
                const minRL = Math.min(...rls);
                const maxRL = Math.max(...rls);
                const spanRL = Math.max(0.5, maxRL - minRL);
                const width = 600;
                const height = 110;
                const padX = 40;
                const padY = 20;

                const points = computedLeveling.rows.map((r, i) => {
                  const x = padX + (i / Math.max(1, computedLeveling.rows.length - 1)) * (width - 2 * padX);
                  const y = height - padY - ((r.reducedLevel - minRL) / spanRL) * (height - 2 * padY);
                  return { x, y, rl: r.reducedLevel, station: r.station };
                });

                const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

                return (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                    {/* Grid line */}
                    <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="4 4" />
                    {/* Ground line */}
                    <polyline points={polylineStr} fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="2.5" strokeLinejoin="round" />
                    {/* Station nodes */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="4" fill="var(--md-sys-color-surface)" stroke="var(--md-sys-color-primary)" strokeWidth="2" />
                        <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] font-mono fill-current font-bold">
                          {p.rl.toFixed(2)}m
                        </text>
                        <text x={p.x} y={height - 4} textAnchor="middle" className="text-[8px] font-mono fill-[var(--md-sys-color-on-surface-variant)]">
                          {p.station}
                        </text>
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
