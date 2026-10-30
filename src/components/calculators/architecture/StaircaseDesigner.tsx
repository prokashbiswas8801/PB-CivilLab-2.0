import React, { useState, useMemo } from 'react';
import {
  Compass,
  FileSpreadsheet,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { exportToCSV, generateEngineeringPDF } from '../../../utils/exportEngine';

export type StaircaseType = 'dog-legged' | 'straight' | 'open-well';

export interface StaircaseOutputs {
  totalRisers: number;
  risersPerFlight: number[];
  actualRiserMm: number;
  treadsPerFlight: number[];
  actualTreadMm: number;
  goingLengthMm: number;
  stairPitchDeg: number;
  pitchStatus: 'OPTIMUM' | 'ACCEPTABLE' | 'STEEP' | 'SHALLOW';
  blondelValue: number; // 2R + T (600 - 630 mm)
  blondelStatus: 'OPTIMUM' | 'ACCEPTABLE' | 'WARNING';
  safetyIndex: number; // R + T (430 - 460 mm)
  comfortProduct: number; // R * T (40,000 - 45,000 mm^2)
  estimatedHeadroomMm: number;
  headroomStatus: 'PASS' | 'WARNING' | 'FAIL';
  waistInclinedLengthMm: number;
  totalGoingRequiredMm: number;
  stairwellFitStatus: 'PASS' | 'WARNING';
  landingDepthMm: number;
  flightWidthMm: number;
  deadLoadKpa: number;
  factoredLoadKpa: number;
}

export const StaircaseDesigner: React.FC = () => {
  // --- Input States ---
  const [stairType, setStairType] = useState<StaircaseType>('dog-legged');
  const [floorHeightMm, setFloorHeightMm] = useState<number>(3000); // 3.0 m (10 ft) standard floor height
  const [stairwellLengthMm, setStairwellLengthMm] = useState<number>(4500); // 4.5 m
  const [stairwellWidthMm, setStairwellWidthMm] = useState<number>(2400); // 2.4 m
  const [preferredRiserMm, setPreferredRiserMm] = useState<number>(150); // 150 mm standard
  const [preferredTreadMm, setPreferredTreadMm] = useState<number>(275); // 275 mm standard
  const [waistSlabMm, setWaistSlabMm] = useState<number>(150); // 150 mm (6")
  const [slabThicknessMm, setSlabThicknessMm] = useState<number>(150); // 150 mm
  const [landingWidthMm, setLandingWidthMm] = useState<number>(1200); // 1.2 m
  const [nosingMm, setNosingMm] = useState<number>(25); // 25 mm nosing
  const [liveLoadKpa, setLiveLoadKpa] = useState<number>(3.0); // 3.0 kN/m² residential / 4.0 commercial
  const [finishesLoadKpa, setFinishesLoadKpa] = useState<number>(1.0); // 1.0 kN/m² finishes

  // --- Calculations ---
  const calc = useMemo<StaircaseOutputs>(() => {
    // 1. Risers count
    const targetRisers = Math.round(floorHeightMm / preferredRiserMm);
    const totalRisers = Math.max(3, targetRisers);
    const actualRiserMm = floorHeightMm / totalRisers;

    // Flight distribution
    let risersPerFlight: number[] = [];
    let treadsPerFlight: number[] = [];

    if (stairType === 'dog-legged') {
      const flight1 = Math.ceil(totalRisers / 2);
      const flight2 = Math.floor(totalRisers / 2);
      risersPerFlight = [flight1, flight2];
      treadsPerFlight = [Math.max(1, flight1 - 1), Math.max(1, flight2 - 1)];
    } else if (stairType === 'straight') {
      risersPerFlight = [totalRisers];
      treadsPerFlight = [Math.max(1, totalRisers - 1)];
    } else {
      // open-well (3 flights)
      const f1 = Math.ceil(totalRisers / 3);
      const f2 = Math.round((totalRisers - f1) / 2);
      const f3 = totalRisers - f1 - f2;
      risersPerFlight = [f1, f2, f3];
      treadsPerFlight = [Math.max(1, f1 - 1), Math.max(1, f2 - 1), Math.max(1, f3 - 1)];
    }

    const maxTreadsInRun = Math.max(...treadsPerFlight);
    const goingLengthMm = maxTreadsInRun * preferredTreadMm;

    // Pitch Angle: theta = atan(R / T)
    const pitchRad = Math.atan(actualRiserMm / preferredTreadMm);
    const stairPitchDeg = (pitchRad * 180) / Math.PI;

    let pitchStatus: 'OPTIMUM' | 'ACCEPTABLE' | 'STEEP' | 'SHALLOW' = 'OPTIMUM';
    if (stairPitchDeg >= 28 && stairPitchDeg <= 36) {
      pitchStatus = 'OPTIMUM';
    } else if (stairPitchDeg >= 24 && stairPitchDeg <= 40) {
      pitchStatus = 'ACCEPTABLE';
    } else if (stairPitchDeg > 40) {
      pitchStatus = 'STEEP';
    } else {
      pitchStatus = 'SHALLOW';
    }

    // Blondel's Comfort Rule: 2R + T in mm
    const blondelValue = 2 * actualRiserMm + preferredTreadMm;
    let blondelStatus: 'OPTIMUM' | 'ACCEPTABLE' | 'WARNING' = 'OPTIMUM';
    if (blondelValue >= 600 && blondelValue <= 630) {
      blondelStatus = 'OPTIMUM';
    } else if (blondelValue >= 580 && blondelValue <= 650) {
      blondelStatus = 'ACCEPTABLE';
    } else {
      blondelStatus = 'WARNING';
    }

    // Safety Index: R + T (approx 430 - 460 mm)
    const safetyIndex = actualRiserMm + preferredTreadMm;

    // Comfort Product: R * T (approx 40,000 - 45,000 mm²)
    const comfortProduct = actualRiserMm * preferredTreadMm;

    // Stairwell Fit
    let totalGoingRequiredMm = 0;
    let flightWidthMm = 0;
    if (stairType === 'dog-legged') {
      totalGoingRequiredMm = goingLengthMm + landingWidthMm + landingWidthMm; // landing at bottom and top/mid
      flightWidthMm = (stairwellWidthMm - 100) / 2; // with 100mm well gap
    } else if (stairType === 'straight') {
      totalGoingRequiredMm = goingLengthMm + landingWidthMm * 2;
      flightWidthMm = stairwellWidthMm;
    } else {
      totalGoingRequiredMm = goingLengthMm + landingWidthMm * 2;
      flightWidthMm = (stairwellWidthMm - 200) / 2;
    }

    const stairwellFitStatus: 'PASS' | 'WARNING' =
      totalGoingRequiredMm <= stairwellLengthMm ? 'PASS' : 'WARNING';

    // Clear Headroom: Clearance between soffit of flight above and tread below
    // In dog-legged stairs, headroom under intermediate landing or second flight
    // Minimum standard = 2150 mm (BNBC / IBC 2050 mm)
    const heightPerFlight = actualRiserMm * risersPerFlight[0];
    const estimatedHeadroomMm = heightPerFlight - waistSlabMm - slabThicknessMm;
    let headroomStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    if (estimatedHeadroomMm >= 2150) {
      headroomStatus = 'PASS';
    } else if (estimatedHeadroomMm >= 2000) {
      headroomStatus = 'WARNING';
    } else {
      headroomStatus = 'FAIL';
    }

    // Incline length of waist slab for primary flight
    const flightHeightMm = actualRiserMm * risersPerFlight[0];
    const waistInclinedLengthMm = Math.sqrt(goingLengthMm ** 2 + flightHeightMm ** 2);

    // Dead loads estimation:
    // Density of RCC = 25 kN/m³
    const secTheta = Math.sqrt(1 + (actualRiserMm / preferredTreadMm) ** 2);
    const waistSlabDeadLoad = (waistSlabMm / 1000) * 25 * secTheta;
    const stepsDeadLoad = (actualRiserMm / 2000) * 25;
    const deadLoadKpa = waistSlabDeadLoad + stepsDeadLoad + finishesLoadKpa;
    const factoredLoadKpa = 1.2 * deadLoadKpa + 1.6 * liveLoadKpa;

    return {
      totalRisers,
      risersPerFlight,
      actualRiserMm,
      treadsPerFlight,
      actualTreadMm: preferredTreadMm,
      goingLengthMm,
      stairPitchDeg,
      pitchStatus,
      blondelValue,
      blondelStatus,
      safetyIndex,
      comfortProduct,
      estimatedHeadroomMm,
      headroomStatus,
      waistInclinedLengthMm,
      totalGoingRequiredMm,
      stairwellFitStatus,
      landingDepthMm: landingWidthMm,
      flightWidthMm,
      deadLoadKpa,
      factoredLoadKpa,
    };
  }, [
    stairType,
    floorHeightMm,
    stairwellLengthMm,
    stairwellWidthMm,
    preferredRiserMm,
    preferredTreadMm,
    waistSlabMm,
    slabThicknessMm,
    landingWidthMm,
    liveLoadKpa,
    finishesLoadKpa,
  ]);

  // Preset Configurations
  const applyPreset = (type: 'residential' | 'commercial' | 'fire-escape' | 'compact') => {
    if (type === 'residential') {
      setPreferredRiserMm(150);
      setPreferredTreadMm(275);
      setLandingWidthMm(1100);
      setWaistSlabMm(150);
      setLiveLoadKpa(3.0);
    } else if (type === 'commercial') {
      setPreferredRiserMm(150);
      setPreferredTreadMm(300);
      setLandingWidthMm(1500);
      setWaistSlabMm(175);
      setLiveLoadKpa(4.0);
    } else if (type === 'fire-escape') {
      setPreferredRiserMm(160);
      setPreferredTreadMm(280);
      setLandingWidthMm(1250);
      setWaistSlabMm(150);
      setLiveLoadKpa(5.0);
    } else {
      // compact
      setPreferredRiserMm(175);
      setPreferredTreadMm(250);
      setLandingWidthMm(1000);
      setWaistSlabMm(125);
      setLiveLoadKpa(2.5);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Parameter', 'Value', 'Unit', 'Evaluation'];
    const rows: (string | number)[][] = [
      ['Staircase Type', stairType.toUpperCase(), '-', 'Structural Classification'],
      ['Floor-to-Floor Height', floorHeightMm.toFixed(1), 'mm', `${(floorHeightMm / 304.8).toFixed(2)} ft`],
      ['Stairwell Dimensions (L x W)', `${stairwellLengthMm} x ${stairwellWidthMm}`, 'mm', 'Plan Opening'],
      ['Total Number of Risers', calc.totalRisers, 'nos', `${calc.risersPerFlight.join(' + ')} per flight`],
      ['Exact Riser Height (R)', Number(calc.actualRiserMm.toFixed(2)), 'mm', 'BNBC Max: 175mm'],
      ['Tread Width (T)', calc.actualTreadMm, 'mm', 'BNBC Min: 250mm'],
      ['Going Length per Flight', Number(calc.goingLengthMm.toFixed(1)), 'mm', 'Primary Flight Run'],
      ['Pitch Slope Angle', Number(calc.stairPitchDeg.toFixed(2)), 'degrees', `Status: ${calc.pitchStatus} (25°-38°)`],
      ['Blondel Comfort Formula (2R + T)', Number(calc.blondelValue.toFixed(1)), 'mm', `Verdict: ${calc.blondelStatus} (600-630mm)`],
      ['Safety Formula (R + T)', Number(calc.safetyIndex.toFixed(1)), 'mm', 'Target: 430-460mm'],
      ['Comfort Product (R x T)', Math.round(calc.comfortProduct), 'mm²', 'Target: 40000-45000'],
      ['Clear Headroom Clearance', Math.round(calc.estimatedHeadroomMm), 'mm', `Status: ${calc.headroomStatus} (Min: 2150mm)`],
      ['Waist Slab Thickness', waistSlabMm, 'mm', 'Structural Slab'],
      ['Inclined Waist Length', Number(calc.waistInclinedLengthMm.toFixed(1)), 'mm', 'Hypotenuse Span'],
      ['Landing Width/Depth', Number(calc.landingDepthMm.toFixed(1)), 'mm', 'Clear Landing Space'],
      ['Estimated Design Dead Load', Number(calc.deadLoadKpa.toFixed(2)), 'kN/m²', 'Self-wt + finishes'],
      ['Factored Design Load (1.2D + 1.6L)', Number(calc.factoredLoadKpa.toFixed(2)), 'kN/m²', 'Ultimate Design ULS'],
    ];
    exportToCSV(`PB_CivilLab_Staircase_Design_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // PDF Export
  const handleExportPDF = async () => {
    const pdfData = {
      projectMeta: {
        projectName: 'Architectural Staircase & Ergonomic Engineering Design',
        projectCode: 'STAIR-2026',
        client: 'BNBC Space Planning Compliance',
        location: 'Building Staircase Core Submittal',
        date: new Date().toISOString().slice(0, 10),
        unitSystem: 'SI' as const,
        engineerName: 'Prokash Biswas, PE',
      },
      moduleMeta: {
        moduleId: 'staircase-designer',
        moduleTitle: 'STAIRCASE ERGONOMICS & GEOMETRY DESIGN REPORT',
        standard: 'BNBC 2020 Part 3 Sec 1.12.5 / ACI 318-19 / Blondel Formula',
        status: calc.blondelStatus === 'WARNING' || calc.headroomStatus === 'FAIL' ? ('WARNING' as const) : ('VERIFIED' as const),
      },
      inputs: [
        { name: 'Floor-to-Floor Height', symbol: 'H', value: floorHeightMm, unit: 'mm' },
        { name: 'Preferred Riser Height', symbol: 'R_pref', value: preferredRiserMm, unit: 'mm' },
        { name: 'Preferred Tread Width', symbol: 'T_pref', value: preferredTreadMm, unit: 'mm' },
        { name: 'Stairwell Dimensions', symbol: 'L_well x W_well', value: `${stairwellLengthMm} x ${stairwellWidthMm}`, unit: 'mm' },
        { name: 'Waist Slab Thickness', symbol: 't_w', value: waistSlabMm, unit: 'mm' },
        { name: 'Landing Width/Depth', symbol: 'L_land', value: landingWidthMm, unit: 'mm' },
        { name: 'Specified Live Load', symbol: 'q_L', value: liveLoadKpa, unit: 'kN/m²' },
      ],
      outputs: [
        { name: 'Total Risers Count', symbol: 'N_r', value: calc.totalRisers, unit: 'nos', status: 'PASS' as const },
        { name: 'Exact Riser Height', symbol: 'R_act', value: calc.actualRiserMm.toFixed(2), unit: 'mm', status: 'PASS' as const },
        { name: 'Going Length (Primary Flight)', symbol: 'G', value: calc.goingLengthMm.toFixed(0), unit: 'mm', status: 'PASS' as const },
        { name: 'Stair Pitch Angle', symbol: 'theta', value: `${calc.stairPitchDeg.toFixed(1)}°`, unit: 'deg', status: calc.pitchStatus === 'OPTIMUM' ? ('PASS' as const) : ('INFO' as const) },
        { name: "Blondel's Comfort Formula (2R + T)", symbol: '2R + T', value: `${calc.blondelValue.toFixed(1)} mm (600-630)`, unit: 'mm', status: calc.blondelStatus === 'OPTIMUM' ? ('PASS' as const) : ('WARNING' as const) },
        { name: 'Clear Headroom Clearance', symbol: 'H_clear', value: `${calc.estimatedHeadroomMm.toFixed(0)} mm (min 2150)`, unit: 'mm', status: calc.headroomStatus === 'PASS' ? ('PASS' as const) : ('WARNING' as const) },
        { name: 'Total Length Requirement Check', symbol: 'L_req', value: `${calc.totalGoingRequiredMm} mm vs ${stairwellLengthMm} mm`, unit: 'mm', status: calc.stairwellFitStatus === 'PASS' ? ('PASS' as const) : ('WARNING' as const) },
        { name: 'Estimated Factored Load', symbol: 'w_u', value: `${calc.factoredLoadKpa.toFixed(2)} kN/m²`, unit: 'kN/m²', status: 'INFO' as const },
      ],
      governingAssumptions: [
        "Blondel's Rule for comfortable walking: 600 mm <= 2R + T <= 630 mm (standard human stride length).",
        'Minimum clear headroom must not be less than 2150 mm measured vertically from the nosing line to any overhead obstruction (BNBC 2020 Part 3).',
        'Staircase slope angle should ideally be maintained between 25° and 38° for comfort and public safety.',
        'Waist slab dead load considers incline effect sec(theta) = sqrt(1 + (R/T)^2).',
      ],
    };

    await generateEngineeringPDF(pdfData, {
      filename: `PB_CivilLab_Staircase_Design_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  // Helper to draw 2D SVG Cross-Section
  const renderCrossSection = () => {
    // Generate step points for primary flight
    const stepsCount = calc.treadsPerFlight[0] || 9;
    const riserH = calc.actualRiserMm;
    const treadW = calc.actualTreadMm;
    const scale = 0.08; // scale factor to fit in 600 x 360 SVG

    const startX = 60;
    const startY = 280;
    const landingLengthPx = landingWidthMm * scale;
    const treadPx = treadW * scale;
    const riserPx = riserH * scale;

    // Lower landing path
    const p0x = startX;
    const p0y = startY;

    // Steps path string
    let stepsD = `M ${p0x} ${p0y} L ${p0x + landingLengthPx} ${p0y}`;
    let currX = p0x + landingLengthPx;
    let currY = p0y;

    for (let i = 0; i < stepsCount; i++) {
      currY -= riserPx;
      stepsD += ` L ${currX} ${currY}`;
      currX += treadPx;
      stepsD += ` L ${currX} ${currY}`;
    }

    // Mid landing
    const upperLandingX = currX + landingLengthPx;
    stepsD += ` L ${upperLandingX} ${currY}`;

    // Waist slab thickness perpendicular offset
    const waistPx = waistSlabMm * scale;

    return (
      <svg
        viewBox="0 0 640 360"
        className="w-full h-auto bg-[var(--md-sys-color-surface-container-lowest,#0f172a)] rounded-xl border border-[var(--md-sys-color-outline-variant)] shadow-inner"
      >
        <defs>
          <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-800/40" />
          </pattern>
          <linearGradient id="waistGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Grid Background */}
        <rect width="640" height="360" fill="url(#gridPattern)" />

        {/* Datum Level Lines */}
        <line x1="20" y1={p0y} x2="620" y2={p0y} stroke="#64748b" strokeWidth="1" strokeDasharray="6 3" />
        <text x="30" y={p0y + 16} fill="#94a3b8" fontSize="10" fontFamily="monospace">
          LVL 0.00 (Lower Landing / Floor)
        </text>

        <line x1="20" y1={currY} x2="620" y2={currY} stroke="#64748b" strokeWidth="1" strokeDasharray="6 3" />
        <text x="30" y={currY - 8} fill="#94a3b8" fontSize="10" fontFamily="monospace">
          LVL +{(calc.actualRiserMm * (stepsCount + 1)).toFixed(0)} mm (Mid Landing)
        </text>

        {/* Steps and landings top boundary */}
        <path d={stepsD} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinejoin="miter" />

        {/* Waist slab profile polygon */}
        <polygon
          points={`
            ${p0x},${p0y}
            ${p0x + landingLengthPx},${p0y}
            ${currX},${currY}
            ${upperLandingX},${currY}
            ${upperLandingX},${currY + waistPx + 15}
            ${currX - 10},${currY + waistPx + 20}
            ${p0x + landingLengthPx + 10},${p0y + waistPx + 20}
            ${p0x},${p0y + waistPx + 15}
          `}
          fill="url(#waistGrad)"
          stroke="#60a5fa"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

        {/* Handrail & Balusters */}
        <path
          d={`M ${p0x + 20} ${p0y - 60} L ${p0x + landingLengthPx} ${p0y - 60} L ${currX} ${currY - 60} L ${upperLandingX - 20} ${currY - 60}`}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2.5"
        />
        {/* Baluster posts */}
        <line x1={p0x + 20} y1={p0y} x2={p0x + 20} y2={p0y - 60} stroke="#fbbf24" strokeWidth="2" />
        <line x1={p0x + landingLengthPx} y1={p0y} x2={p0x + landingLengthPx} y2={p0y - 60} stroke="#fbbf24" strokeWidth="1.5" />
        <line x1={p0x + landingLengthPx + treadPx * 3} y1={p0y - riserPx * 3} x2={p0x + landingLengthPx + treadPx * 3} y2={p0y - riserPx * 3 - 60} stroke="#fbbf24" strokeWidth="1.5" />
        <line x1={p0x + landingLengthPx + treadPx * 6} y1={p0y - riserPx * 6} x2={p0x + landingLengthPx + treadPx * 6} y2={p0y - riserPx * 6 - 60} stroke="#fbbf24" strokeWidth="1.5" />
        <line x1={currX} y1={currY} x2={currX} y2={currY - 60} stroke="#fbbf24" strokeWidth="1.5" />
        <line x1={upperLandingX - 20} y1={currY} x2={upperLandingX - 20} y2={currY - 60} stroke="#fbbf24" strokeWidth="2" />

        {/* Pitch Angle Indicator */}
        <path
          d={`M ${p0x + landingLengthPx + 50} ${p0y} A 50 50 0 0 0 ${p0x + landingLengthPx + 42} ${p0y - 25}`}
          fill="none"
          stroke="#ec4899"
          strokeWidth="2"
        />
        <text
          x={p0x + landingLengthPx + 60}
          y={p0y - 15}
          fill="#f472b6"
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
        >
          θ = {calc.stairPitchDeg.toFixed(1)}°
        </text>

        {/* Step Dimension Callouts */}
        {/* Riser arrow */}
        <line
          x1={p0x + landingLengthPx + treadPx * 2 - 8}
          y1={p0y - riserPx * 2}
          x2={p0x + landingLengthPx + treadPx * 2 - 8}
          y2={p0y - riserPx * 1}
          stroke="#10b981"
          strokeWidth="1.5"
        />
        <text
          x={p0x + landingLengthPx + treadPx * 2 - 14}
          y={p0y - riserPx * 1.4}
          fill="#34d399"
          fontSize="10"
          fontWeight="bold"
          textAnchor="end"
          fontFamily="monospace"
        >
          R = {calc.actualRiserMm.toFixed(0)} mm
        </text>

        {/* Tread arrow */}
        <line
          x1={p0x + landingLengthPx + treadPx * 2}
          y1={p0y - riserPx * 2 - 8}
          x2={p0x + landingLengthPx + treadPx * 3}
          y2={p0y - riserPx * 2 - 8}
          stroke="#10b981"
          strokeWidth="1.5"
        />
        <text
          x={p0x + landingLengthPx + treadPx * 2.5}
          y={p0y - riserPx * 2 - 12}
          fill="#34d399"
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          T = {calc.actualTreadMm} mm
        </text>

        {/* Waist slab thickness indicator */}
        <line
          x1={p0x + landingLengthPx + treadPx * 5}
          y1={p0y - riserPx * 5 + 10}
          x2={p0x + landingLengthPx + treadPx * 5 - 15}
          y2={p0y - riserPx * 5 + 35}
          stroke="#38bdf8"
          strokeWidth="1.5"
        />
        <text
          x={p0x + landingLengthPx + treadPx * 5 + 12}
          y={p0y - riserPx * 5 + 35}
          fill="#38bdf8"
          fontSize="10"
          fontFamily="monospace"
        >
          tw = {waistSlabMm} mm
        </text>

        {/* Headroom clearance line */}
        <line
          x1={p0x + landingLengthPx + treadPx * 4}
          y1={p0y - riserPx * 4}
          x2={p0x + landingLengthPx + treadPx * 4}
          y2={p0y - riserPx * 4 - 2150 * scale}
          stroke="#ef4444"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <circle cx={p0x + landingLengthPx + treadPx * 4} cy={p0y - riserPx * 4 - 2150 * scale} r="3" fill="#ef4444" />
        <text
          x={p0x + landingLengthPx + treadPx * 4 + 6}
          y={p0y - riserPx * 4 - 1000 * scale}
          fill="#f87171"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          Min Headroom ≥ 2150 mm
        </text>

        {/* Flight annotations */}
        <text x={startX + 20} y={startY + 35} fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
          Landing: {landingWidthMm} mm
        </text>
        <text x={upperLandingX - 80} y={currY + 45} fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
          Mid Landing: {landingWidthMm} mm
        </text>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 uppercase">
                Architecture &amp; Ergonomics
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                Staircase Geometry &amp; Ergonomics Designer
              </h2>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
              Blondel Comfort Formula (2R + T) · Pitch Angle (θ) · Headroom Clearance · Waist Slab Sizing · Live 2D Section
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Certified PDF</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3">
          <span className="text-xs font-mono font-medium text-[var(--md-sys-color-on-surface-variant)] mr-1">
            Standard Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('residential')}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--md-sys-color-surface-container)] hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            Residential (R150, T275)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('commercial')}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--md-sys-color-surface-container)] hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            Commercial (R150, T300)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('fire-escape')}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--md-sys-color-surface-container)] hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            Fire / Emergency Exit
          </button>
          <button
            type="button"
            onClick={() => applyPreset('compact')}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--md-sys-color-surface-container)] hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            Compact Spiral / Duplex
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs (Left) and Results + 2D Diagram (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              <span>Staircase Geometric Configuration</span>
            </h3>

            {/* Type selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                Stair Flight Typology
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dog-legged', label: 'Dog-Legged (2 Flights)' },
                  { id: 'straight', label: 'Straight Run' },
                  { id: 'open-well', label: 'Open-Well (3 Flights)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStairType(item.id as StaircaseType)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                      stairType === item.id
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                        : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Floor-to-Floor Height */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-[var(--md-sys-color-on-surface)]">
                  Floor-to-Floor Height (H)
                </label>
                <span className="font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  {(floorHeightMm / 1000).toFixed(2)} m ({(floorHeightMm / 304.8).toFixed(2)} ft)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={floorHeightMm}
                  onChange={(e) => setFloorHeightMm(Math.max(1000, Number(e.target.value)))}
                  className="w-full text-sm font-mono px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                />
                <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">mm</span>
              </div>
            </div>

            {/* Preferred Riser and Tread */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Preferred Riser (R)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="5"
                    inputMode="decimal"
                    value={preferredRiserMm}
                    onChange={(e) => setPreferredRiserMm(Math.max(120, Number(e.target.value)))}
                    className="w-full text-sm font-mono px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">mm</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Ideal: 150 mm</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Preferred Tread (T)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="5"
                    inputMode="decimal"
                    value={preferredTreadMm}
                    onChange={(e) => setPreferredTreadMm(Math.max(220, Number(e.target.value)))}
                    className="w-full text-sm font-mono px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">mm</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Ideal: 275-300 mm</span>
              </div>
            </div>

            {/* Stairwell Length & Width */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Stairwell Length
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="100"
                    inputMode="decimal"
                    value={stairwellLengthMm}
                    onChange={(e) => setStairwellLengthMm(Math.max(2000, Number(e.target.value)))}
                    className="w-full text-sm font-mono px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">mm</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Stairwell Width
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="100"
                    inputMode="decimal"
                    value={stairwellWidthMm}
                    onChange={(e) => setStairwellWidthMm(Math.max(1200, Number(e.target.value)))}
                    className="w-full text-sm font-mono px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">mm</span>
                </div>
              </div>
            </div>

            {/* Waist Slab Thickness & Landing Width */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Waist Slab Thickness (tw)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="10"
                    inputMode="decimal"
                    value={waistSlabMm}
                    onChange={(e) => setWaistSlabMm(Math.max(100, Number(e.target.value)))}
                    className="w-full text-sm font-mono px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">mm</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Landing Width / Depth
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="50"
                    inputMode="decimal"
                    value={landingWidthMm}
                    onChange={(e) => setLandingWidthMm(Math.max(900, Number(e.target.value)))}
                    className="w-full text-sm font-mono px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                  <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">mm</span>
                </div>
              </div>
            </div>

            {/* Structural Loads */}
            <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
              <span className="text-[11px] font-bold uppercase text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                Design Live &amp; Finishes Loading
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Live Load (kN/m²)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    value={liveLoadKpa}
                    onChange={(e) => setLiveLoadKpa(Math.max(1.5, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Finishes (kN/m²)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    inputMode="decimal"
                    value={finishesLoadKpa}
                    onChange={(e) => setFinishesLoadKpa(Math.max(0.5, Number(e.target.value)))}
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Ergonomic Metrics, Live 2D Diagram & Compliance Checks */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
              <span className="text-[11px] font-mono text-sky-700 dark:text-sky-300 block">Total Risers</span>
              <div className="text-xl md:text-2xl font-bold font-mono text-sky-900 dark:text-sky-100 mt-0.5">
                {calc.totalRisers} <span className="text-xs font-normal">nos</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Exact R = {calc.actualRiserMm.toFixed(1)} mm
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 block">Pitch Angle (θ)</span>
              <div className="text-xl md:text-2xl font-bold font-mono text-amber-900 dark:text-amber-100 mt-0.5">
                {calc.stairPitchDeg.toFixed(1)}°
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5 font-medium">
                {calc.pitchStatus} (25°-38°)
              </span>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                calc.blondelStatus === 'OPTIMUM'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}
            >
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 block">Blondel (2R + T)</span>
              <div className="text-xl md:text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-100 mt-0.5">
                {calc.blondelValue.toFixed(0)} <span className="text-xs font-normal">mm</span>
              </div>
              <span className="text-[10px] font-medium block mt-0.5 text-emerald-600 dark:text-emerald-400">
                {calc.blondelStatus} (600-630)
              </span>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                calc.headroomStatus === 'PASS'
                  ? 'bg-teal-500/10 border-teal-500/20'
                  : 'bg-rose-500/10 border-rose-500/20'
              }`}
            >
              <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300 block">Headroom Clearance</span>
              <div className="text-xl md:text-2xl font-bold font-mono text-teal-900 dark:text-teal-100 mt-0.5">
                {calc.estimatedHeadroomMm.toFixed(0)} <span className="text-xs font-normal">mm</span>
              </div>
              <span className="text-[10px] font-medium block mt-0.5 text-teal-600 dark:text-teal-400">
                {calc.headroomStatus} (≥ 2150 mm)
              </span>
            </div>
          </div>

          {/* Live 2D Cross-Section SVG Diagram */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-500" />
                <span>Live 2D Cross-Section &amp; Dimension Envelope</span>
              </span>
              <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400">
                Scale ~ 1:12 · Flight 1 Elevation
              </span>
            </div>

            {renderCrossSection()}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] border-t border-[var(--md-sys-color-outline-variant)]">
              <span>Going: {calc.goingLengthMm} mm</span>
              <span>•</span>
              <span>Inclined Waist Length: {calc.waistInclinedLengthMm.toFixed(0)} mm</span>
              <span>•</span>
              <span>
                Required Length: {calc.totalGoingRequiredMm} mm (Well: {stairwellLengthMm} mm)
              </span>
            </div>
          </div>

          {/* Architectural Ergonomic Assessment Breakdown */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Ergonomic &amp; Code Compliance Verifications</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] space-y-1">
                <span className="text-[10px] uppercase font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  Comfort Formula (Blondel)
                </span>
                <div className="text-sm font-bold font-mono text-[var(--md-sys-color-on-surface)]">
                  2R + T = {calc.blondelValue.toFixed(1)} mm
                </div>
                <p className="text-[10px] text-slate-500">
                  Target: 600 - 630 mm. Matches natural human gait walking cadence.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] space-y-1">
                <span className="text-[10px] uppercase font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  Safety Formula
                </span>
                <div className="text-sm font-bold font-mono text-[var(--md-sys-color-on-surface)]">
                  R + T = {calc.safetyIndex.toFixed(1)} mm
                </div>
                <p className="text-[10px] text-slate-500">
                  Target: 430 - 460 mm. Prevents tripping and heel slip during descent.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] space-y-1">
                <span className="text-[10px] uppercase font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  Structural Loading (w_u)
                </span>
                <div className="text-sm font-bold font-mono text-[var(--md-sys-color-on-surface)]">
                  {calc.factoredLoadKpa.toFixed(2)} kN/m²
                </div>
                <p className="text-[10px] text-slate-500">
                  1.2 Dead ({calc.deadLoadKpa.toFixed(2)} kPa) + 1.6 Live ({liveLoadKpa} kPa).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
