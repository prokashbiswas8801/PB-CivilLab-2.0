import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Compass,
  FileDown,
  FileSpreadsheet,
  Layers,
  Send,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  RebarBBSParameters,
  StairBuildingOccupancy,
  StaircaseParameters,
  StairTopologyType,
  TakeoffLineItem,
} from '../../../types/civil';
import {
  buildBoqItemsFromStaircase,
  computeStaircaseDesign,
  mapLegacyStairTopology,
  mapTopologyToLegacyType,
  STAIRCASE_PRESETS,
} from '../../../utils/architectureEngine';
import { exportToCSV, generateEngineeringPDF } from '../../../utils/exportEngine';
import { formatFeetInches } from '../../../utils/unitConverter';
import { DcrGaugeSuite } from '../../DcrCapacityGauge';
import { StepByStepPanel } from '../../StepByStepPanel';

export interface StaircaseDesignerProps {
  initialValues?: Partial<StaircaseParameters>;
  onChange?: (values: StaircaseParameters) => void;
  onSendToRebarBbs?: (stairParams: Partial<RebarBBSParameters>) => void;
  onSendStaircaseToBoq?: (items: TakeoffLineItem[]) => void;
}

export const StaircaseDesigner: React.FC<StaircaseDesignerProps> = ({
  initialValues,
  onChange,
  onSendToRebarBbs,
  onSendStaircaseToBoq,
}) => {
  const initialTopology = mapLegacyStairTopology(
    initialValues?.stairType,
    initialValues?.stairTopology
  );

  // Configuration States
  const [stairTopology, setStairTopology] = useState<StairTopologyType>(initialTopology);
  const [buildingOccupancy, setBuildingOccupancy] = useState<StairBuildingOccupancy>(
    initialValues?.buildingOccupancy || 'residential'
  );
  const [floorHeightMm, setFloorHeightMm] = useState<number>(
    initialValues?.floorHeightMm ??
      (initialValues?.floorToFloorHeightM
        ? Math.round(initialValues.floorToFloorHeightM * 1000)
        : 3000)
  );
  const [preferredRiserMm, setPreferredRiserMm] = useState<number>(
    initialValues?.riserHeightMm ?? initialValues?.preferredRiserMm ?? 150
  );
  const [preferredTreadMm, setPreferredTreadMm] = useState<number>(
    initialValues?.treadWidthMm ?? initialValues?.preferredTreadMm ?? 275
  );
  const [flightWidthMm, setFlightWidthMm] = useState<number>(
    initialValues?.flightWidthMm ?? 1150
  );
  const [landingWidthMm, setLandingWidthMm] = useState<number>(
    initialValues?.landingWidthMm ?? 1200
  );
  const [waistSlabMm, setWaistSlabMm] = useState<number>(
    initialValues?.waistSlabThicknessMm ?? initialValues?.waistSlabMm ?? 150
  );
  const [slabThicknessMm, setSlabThicknessMm] = useState<number>(
    initialValues?.slabThicknessMm ?? 150
  );
  const [wellGapMm, setWellGapMm] = useState<number>(initialValues?.wellGapMm ?? 150);
  const [handrailHeightMm, setHandrailHeightMm] = useState<number>(
    initialValues?.handrailHeightMm ?? 950
  );
  const [stairwellLengthMm, setStairwellLengthMm] = useState<number>(
    initialValues?.stairwellLengthMm ?? 4650
  );
  const [stairwellWidthMm, setStairwellWidthMm] = useState<number>(
    initialValues?.stairwellWidthMm ?? 2450
  );
  const [nosingMm, setNosingMm] = useState<number>(initialValues?.nosingMm ?? 25);
  const [liveLoadKpa, setLiveLoadKpa] = useState<number>(initialValues?.liveLoadKpa ?? 3.0);
  const [finishesLoadKpa, setFinishesLoadKpa] = useState<number>(
    initialValues?.finishesLoadKpa ?? 1.0
  );

  const [activePresetId, setActivePresetId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'schematics' | 'steps'>('schematics');
  const [boqSentNotice, setBoqSentNotice] = useState<boolean>(false);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const currentParams: StaircaseParameters = useMemo(
    () => ({
      stairType: mapTopologyToLegacyType(stairTopology),
      stairTopology,
      buildingOccupancy,
      floorHeightMm,
      floorToFloorHeightM: Number((floorHeightMm / 1000).toFixed(3)),
      stairwellLengthMm,
      stairwellWidthMm,
      preferredRiserMm,
      riserHeightMm: preferredRiserMm,
      preferredTreadMm,
      treadWidthMm: preferredTreadMm,
      flightWidthMm,
      waistSlabMm,
      waistSlabThicknessMm: waistSlabMm,
      slabThicknessMm,
      landingWidthMm,
      wellGapMm,
      handrailHeightMm,
      nosingMm,
      liveLoadKpa,
      finishesLoadKpa,
    }),
    [
      stairTopology,
      buildingOccupancy,
      floorHeightMm,
      stairwellLengthMm,
      stairwellWidthMm,
      preferredRiserMm,
      preferredTreadMm,
      flightWidthMm,
      waistSlabMm,
      slabThicknessMm,
      landingWidthMm,
      wellGapMm,
      handrailHeightMm,
      nosingMm,
      liveLoadKpa,
      finishesLoadKpa,
    ]
  );

  useEffect(() => {
    onChangeRef.current?.(currentParams);
  }, [currentParams]);

  const envelope = useMemo(() => computeStaircaseDesign(currentParams), [currentParams]);
  const res = envelope.result!;

  const handleTopologyChange = (nextTopology: StairTopologyType) => {
    setActivePresetId('');
    setStairTopology(nextTopology);
    if (nextTopology === 'straight-flight') {
      setWellGapMm(0);
    } else if (nextTopology === 'open-well' && wellGapMm < 600) {
      setWellGapMm(900);
    } else if (nextTopology === 'u-shaped' && wellGapMm < 300) {
      setWellGapMm(450);
    } else if (nextTopology === 'dog-legged' && (wellGapMm === 0 || wellGapMm > 300)) {
      setWellGapMm(150);
    }
  };

  const handleOccupancyChange = (nextOcc: StairBuildingOccupancy) => {
    setActivePresetId('');
    setBuildingOccupancy(nextOcc);
    if (nextOcc === 'residential') {
      setLiveLoadKpa(3.0);
    } else if (nextOcc === 'public-commercial') {
      setLiveLoadKpa(4.5);
      if (flightWidthMm < 1500) setFlightWidthMm(1550);
      if (landingWidthMm < 1500) setLandingWidthMm(1600);
    } else {
      setLiveLoadKpa(5.0);
      if (flightWidthMm < 1500) setFlightWidthMm(1650);
      if (landingWidthMm < 1500) setLandingWidthMm(1700);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = STAIRCASE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const p = preset.params;
    setActivePresetId(preset.id);
    setStairTopology(p.stairTopology || 'dog-legged');
    setBuildingOccupancy(p.buildingOccupancy || 'residential');
    setFloorHeightMm(p.floorHeightMm);
    setPreferredRiserMm(p.preferredRiserMm);
    setPreferredTreadMm(p.preferredTreadMm);
    setFlightWidthMm(p.flightWidthMm ?? 1150);
    setLandingWidthMm(p.landingWidthMm);
    setWaistSlabMm(p.waistSlabMm);
    setSlabThicknessMm(p.slabThicknessMm);
    setWellGapMm(p.wellGapMm ?? 150);
    setHandrailHeightMm(p.handrailHeightMm ?? 950);
    setStairwellLengthMm(p.stairwellLengthMm);
    setStairwellWidthMm(p.stairwellWidthMm);
    setNosingMm(p.nosingMm);
    setLiveLoadKpa(p.liveLoadKpa);
    setFinishesLoadKpa(p.finishesLoadKpa);
  };

  const handleFitMinStairwell = () => {
    setStairwellLengthMm(res.requiredStairwellLengthMm);
    setStairwellWidthMm(res.requiredStairwellWidthMm);
  };

  const handleSendToBoq = () => {
    if (!onSendStaircaseToBoq) return;
    const items = buildBoqItemsFromStaircase(res);
    onSendStaircaseToBoq(items);
    setBoqSentNotice(true);
    setTimeout(() => setBoqSentNotice(false), 4500);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Parameter', 'Value', 'Unit', 'BNBC 2020 Evaluation'];
    const rows: (string | number)[][] = [
      ['Stair Topology', res.topologyLabel, '-', res.occupancyLabel],
      ['Floor-to-Floor Height (H)', res.floorHeightMm, 'mm', `${res.floorHeightM} m`],
      ['Total Risers (Nr)', res.totalRisers, 'nos', `Flights: ${res.risersPerFlight.join(' + ')}`],
      ['Actual Riser (R)', res.actualRiserMm, 'mm', `Tread (T): ${res.actualTreadMm} mm`],
      ['Going Length (Primary Flight)', res.goingLengthMm, 'mm', `Req Well: ${res.requiredStairwellLengthMm} × ${res.requiredStairwellWidthMm} mm`],
      ['Pitch Angle (θ)', res.stairPitchDeg, 'deg', `${res.pitchStatus} (Max ${res.maxAllowedPitchDeg}°)`],
      ['Blondel Comfort (2R + T)', res.blondelValue, 'mm', `${res.blondelStatus} (600–640 mm)`],
      ['Safety Index (R + T)', res.safetyIndex, 'mm', res.safetyIndexPass ? 'PASS (410–465)' : 'CHECK'],
      ['Comfort Product (R × T)', res.comfortProduct, 'mm2', res.comfortProductPass ? 'PASS' : 'CHECK'],
      ['Vertical Headroom Clearance', res.estimatedHeadroomMm, 'mm', `${res.headroomStatus} (Min 2150 mm)`],
      ['Clear Flight Width (Wf)', res.flightWidthMm, 'mm', `Min ${res.minClearFlightWidthMm} mm (${res.flightWidthPass ? 'PASS' : 'FAIL'})`],
      ['Landing Depth / Handrail', `${res.landingWidthMm} / ${res.handrailHeightMm}`, 'mm', res.egressPass ? 'EGRESS PASS' : 'EGRESS CHECK'],
      ['Design Factored Load (wu)', res.factoredLoadKpa, 'kN/m2', `Dead ${res.deadLoadKpa} + Live ${res.liveLoadKpa}`],
      ['Staircase Concrete Volume / Story', res.totalConcreteM3, 'm3', `Waist ${res.waistConcreteM3} + Steps ${res.stepsConcreteM3} + Land ${res.landingConcreteM3}`],
      ['Staircase Formwork Area / Story', res.totalFormworkM2, 'm2', `Soffit ${res.soffitFormworkM2} + Risers ${res.riserFormworkM2} + Edges ${res.edgeFormworkM2}`],
    ];
    exportToCSV(`BD_CivilLab_Staircase_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // PDF Export
  const handleExportPDF = async () => {
    const pdfData = {
      projectMeta: {
        projectName: 'Staircase Ergonomics, BNBC Part 4 Egress & Structural Takeoff',
        projectCode: 'STAIR-BNBC-2026',
        client: 'Architectural & Structural Engineering',
        location: res.occupancyLabel,
        date: new Date().toISOString().slice(0, 10),
        unitSystem: 'SI' as const,
        engineerName: 'BD. CivilLab Architecture Engine',
      },
      moduleMeta: {
        moduleId: 'staircase-designer',
        moduleTitle: 'STAIRCASE GEOMETRY, EGRESS & QUANTITY REPORT',
        standard: 'BNBC 2020 Part 3 (§1.12.5) & Part 4 / ACI 318-19 / Blondel Rules',
        status: res.overallCompliant ? ('VERIFIED' as const) : ('WARNING' as const),
      },
      inputs: [
        { name: 'Staircase Topology', symbol: 'Type', value: res.topologyLabel, unit: '-' },
        { name: 'Floor-to-Floor Height', symbol: 'H', value: res.floorHeightMm, unit: 'mm' },
        { name: 'Riser × Tread (Actual)', symbol: 'R × T', value: `${res.actualRiserMm} × ${res.actualTreadMm}`, unit: 'mm' },
        { name: 'Flight Width & Landing', symbol: 'Wf / L', value: `${res.flightWidthMm} / ${res.landingWidthMm}`, unit: 'mm' },
        { name: 'Waist Slab Thickness', symbol: 'tw', value: res.waistSlabMm, unit: 'mm' },
      ],
      outputs: [
        { name: 'Riser Count & Distribution', symbol: 'Nr', value: `${res.totalRisers} (${res.risersPerFlight.join('+')})`, unit: 'nos', status: 'PASS' as const },
        { name: 'Blondel Comfort (2R + T)', symbol: '2R+T', value: res.blondelValue, unit: 'mm', status: res.blondelPass ? ('PASS' as const) : ('WARNING' as const) },
        { name: 'Pitch Angle', symbol: 'theta', value: `${res.stairPitchDeg}°`, unit: 'deg', status: res.pitchPass ? ('PASS' as const) : ('FAIL' as const) },
        { name: 'Vertical Headroom', symbol: 'H_clr', value: res.estimatedHeadroomMm, unit: 'mm', status: res.headroomPass ? ('PASS' as const) : ('FAIL' as const) },
        { name: 'BNBC Part 4 Egress Check', symbol: 'Egress', value: res.egressPass ? 'COMPLIANT' : 'CHECK', unit: '-', status: res.egressPass ? ('PASS' as const) : ('FAIL' as const) },
        { name: 'Concrete Volume / Story', symbol: 'V_rcc', value: res.totalConcreteM3, unit: 'm³', status: 'INFO' as const },
        { name: 'Shuttering Area / Story', symbol: 'A_fw', value: res.totalFormworkM2, unit: 'm²', status: 'INFO' as const },
      ],
      governingAssumptions: [
        "Blondel's ergonomic comfort envelope: 2R + T = 600–640 mm, R + T = 420–450 mm, R × T = 40,000–45,000 mm².",
        'BNBC 2020 Part 4 clear flight width ≥ 1000 mm (Residential) or ≥ 1500 mm (Public/Commercial/Hospital); landing ≥ flight width.',
        'Minimum vertical headroom clearance ≥ 2150 mm (7\'-0") below upper flight or landing soffit.',
      ],
    };

    await generateEngineeringPDF(pdfData, {
      filename: `BD_CivilLab_Staircase_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  // --- SVG 1: Live Sectional Elevation View ---
  const renderSectionalElevation = () => {
    const svgW = 560;
    const svgH = 310;
    const stepsCount = res.treadsPerFlight[0] || 9;
    const flightGoingMm = stepsCount * res.actualTreadMm;
    const flightRiseMm = (res.risersPerFlight[0] || 10) * res.actualRiserMm;
    const totalDrawWidthMm = res.landingWidthMm * 2 + flightGoingMm;

    const padX = 56;
    const padY = 44;
    const scale = Math.min(
      (svgW - padX * 2) / Math.max(1500, totalDrawWidthMm),
      (svgH - padY * 2 - 20) / Math.max(1200, flightRiseMm + 600)
    );

    const p0x = padX;
    const p0y = svgH - 52;
    const landPx = res.landingWidthMm * scale;
    const treadPx = res.actualTreadMm * scale;
    const riserPx = res.actualRiserMm * scale;
    const waistPx = res.waistSlabMm * scale;
    const railPx = Math.max(24, Math.min(58, res.handrailHeightMm * scale));

    let stepsD = `M ${p0x} ${p0y} L ${p0x + landPx} ${p0y}`;
    let cx = p0x + landPx;
    let cy = p0y;
    for (let i = 0; i < stepsCount; i++) {
      cy -= riserPx;
      stepsD += ` L ${cx} ${cy}`;
      cx += treadPx;
      stepsD += ` L ${cx} ${cy}`;
    }
    // Final riser up to mid/upper landing level
    cy -= riserPx;
    stepsD += ` L ${cx} ${cy}`;
    const upperEndX = cx + landPx;
    stepsD += ` L ${upperEndX} ${cy}`;

    // Waist soffit perpendicular vertical thickness approximation
    const soffitDrop = waistPx / Math.max(0.5, Math.cos((res.stairPitchDeg * Math.PI) / 180));
    const headMarkerX = p0x + landPx + Math.min(stepsCount - 1, 2) * treadPx;
    const headBaseY = p0y - Math.min(stepsCount - 1, 2) * riserPx;
    const headTopY = Math.max(18, headBaseY - Math.min(130, res.estimatedHeadroomMm * scale * 0.65));

    return (
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full h-auto bg-slate-950 rounded-xl border border-[var(--md-sys-color-outline-variant)]"
      >
        <defs>
          <pattern id="stairSecGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width={svgW} height={svgH} fill="url(#stairSecGrid)" />

        {/* Datum Lines */}
        <line x1="16" y1={p0y} x2={svgW - 16} y2={p0y} stroke="#475569" strokeWidth="1" strokeDasharray="5 3" />
        <text x="20" y={p0y + 14} fill="#94a3b8" fontSize="9.5" className="font-mono">
          LVL +0.00 m (Lower Floor)
        </text>

        <line x1="16" y1={cy} x2={svgW - 16} y2={cy} stroke="#475569" strokeWidth="1" strokeDasharray="5 3" />
        <text x="20" y={cy - 7} fill="#94a3b8" fontSize="9.5" className="font-mono">
          LVL +{(flightRiseMm / 1000).toFixed(2)} m ({res.topology === 'straight-flight' ? 'Upper Floor' : 'Mid Landing'})
        </text>

        {/* Waist Concrete Body Polygon */}
        <polygon
          points={`
            ${p0x},${p0y}
            ${p0x + landPx},${p0y}
            ${cx},${cy}
            ${upperEndX},${cy}
            ${upperEndX},${cy + waistPx}
            ${cx + 4},${cy + soffitDrop}
            ${p0x + landPx + 4},${p0y + soffitDrop}
            ${p0x},${p0y + waistPx}
          `}
          fill="#1d4ed8"
          fillOpacity="0.28"
          stroke="#60a5fa"
          strokeWidth="1.2"
        />

        {/* Step Tread & Riser Profile */}
        <path d={stepsD} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="miter" />

        {/* Handrail & Posts */}
        <path
          d={`M ${p0x + 8} ${p0y - railPx} L ${p0x + landPx} ${p0y - railPx} L ${cx} ${cy - railPx} L ${upperEndX - 8} ${cy - railPx}`}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
        />
        <line x1={p0x + 8} y1={p0y} x2={p0x + 8} y2={p0y - railPx} stroke="#f59e0b" strokeWidth="1.5" />
        <line x1={p0x + landPx} y1={p0y} x2={p0x + landPx} y2={p0y - railPx} stroke="#f59e0b" strokeWidth="1.3" />
        <line x1={cx} y1={cy} x2={cx} y2={cy - railPx} stroke="#f59e0b" strokeWidth="1.3" />
        <line x1={upperEndX - 8} y1={cy} x2={upperEndX - 8} y2={cy - railPx} stroke="#f59e0b" strokeWidth="1.5" />
        <text x={p0x + 14} y={p0y - railPx - 5} fill="#fbbf24" fontSize="9" className="font-mono">
          Rail {res.handrailHeightMm}mm
        </text>

        {/* Pitch Angle Arc */}
        <path
          d={`M ${p0x + landPx + 36} ${p0y} A 36 36 0 0 0 ${p0x + landPx + 36 * Math.cos((res.stairPitchDeg * Math.PI) / 180)} ${p0y - 36 * Math.sin((res.stairPitchDeg * Math.PI) / 180)}`}
          fill="none"
          stroke="#f472b6"
          strokeWidth="1.8"
        />
        <text
          x={p0x + landPx + 42}
          y={p0y - 10}
          fill="#f472b6"
          fontSize="10.5"
          fontWeight="bold"
          className="font-mono"
        >
          θ = {res.stairPitchDeg.toFixed(1)}°
        </text>

        {/* Headroom Clearance Vertical Line */}
        <line
          x1={headMarkerX}
          y1={headBaseY}
          x2={headMarkerX}
          y2={headTopY}
          stroke={res.headroomPass ? '#10b981' : '#ef4444'}
          strokeWidth="1.8"
          strokeDasharray="4 2"
        />
        <line
          x1={headMarkerX - 18}
          y1={headTopY}
          x2={headMarkerX + 46}
          y2={headTopY}
          stroke={res.headroomPass ? '#10b981' : '#ef4444'}
          strokeWidth="1.4"
        />
        <text
          x={headMarkerX + 6}
          y={headTopY + 13}
          fill={res.headroomPass ? '#34d399' : '#f87171'}
          fontSize="9.5"
          fontWeight="bold"
          className="font-mono"
        >
          Headroom: {res.estimatedHeadroomMm}mm (≥2150)
        </text>

        {/* Bottom Dimension Bar */}
        <text x={p0x + landPx / 2} y={p0y + 32} textAnchor="middle" fill="#cbd5e1" fontSize="9" className="font-mono">
          Land {res.landingWidthMm}
        </text>
        <text x={p0x + landPx + (cx - (p0x + landPx)) / 2} y={p0y + 32} textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="bold" className="font-mono">
          Going = {(stepsCount * res.actualTreadMm).toFixed(0)} mm ({stepsCount}T × {res.actualTreadMm} | tw={res.waistSlabMm}mm)
        </text>
      </svg>
    );
  };

  // --- SVG 2: Live Plan Footprint View (Multi-Topology) ---
  const renderPlanFootprint = () => {
    const svgW = 560;
    const svgH = 310;
    const padX = 58;
    const padY = 40;

    const availW = svgW - padX * 2;
    const availH = svgH - padY * 2 - 20;

    const planLen = Math.max(res.stairwellLengthMm, res.requiredStairwellLengthMm);
    const planWid = Math.max(res.stairwellWidthMm, res.requiredStairwellWidthMm);
    const scale = Math.min(availW / planLen, availH / planWid);

    const boxW = planLen * scale;
    const boxH = planWid * scale;
    const x0 = (svgW - boxW) / 2;
    const y0 = padY + (availH - boxH) / 2;

    const landPx = res.landingWidthMm * scale;
    const fwPx = res.flightWidthMm * scale;
    const gapPx = res.wellGapMm * scale;
    const treadPx = res.actualTreadMm * scale;

    const f1Treads = res.treadsPerFlight[0] || 8;
    const f2Treads = res.treadsPerFlight[1] || 8;
    const f3Treads = res.treadsPerFlight[2] || 6;

    return (
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full h-auto bg-slate-950 rounded-xl border border-[var(--md-sys-color-outline-variant)]"
      >
        <defs>
          <marker id="planArrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,1 L6,3.5 L0,6 Z" fill="#fbbf24" />
          </marker>
        </defs>

        {/* Outer Provided Stairwell Boundary */}
        <rect
          x={x0}
          y={y0}
          width={res.stairwellLengthMm * scale}
          height={res.stairwellWidthMm * scale}
          fill="#0f172a"
          stroke={res.stairwellFitPass ? '#475569' : '#ef4444'}
          strokeWidth="2"
          strokeDasharray={res.stairwellFitPass ? undefined : '5 3'}
        />

        {res.topology === 'straight-flight' ? (
          <g>
            {/* Lower Landing */}
            <rect x={x0} y={y0} width={landPx} height={fwPx} fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />
            <text x={x0 + landPx / 2} y={y0 + fwPx / 2 + 3} textAnchor="middle" fill="#cbd5e1" fontSize="9" className="font-mono">
              START
            </text>

            {/* Single Straight Flight */}
            <rect
              x={x0 + landPx}
              y={y0}
              width={f1Treads * treadPx}
              height={fwPx}
              fill="#0c4a6e"
              fillOpacity="0.4"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {Array.from({ length: f1Treads }).map((_, idx) => (
              <line
                key={idx}
                x1={x0 + landPx + idx * treadPx}
                y1={y0}
                x2={x0 + landPx + idx * treadPx}
                y2={y0 + fwPx}
                stroke="#38bdf8"
                strokeWidth="0.9"
                strokeOpacity="0.7"
              />
            ))}
            <line
              x1={x0 + landPx + 10}
              y1={y0 + fwPx / 2}
              x2={x0 + landPx + f1Treads * treadPx - 10}
              y2={y0 + fwPx / 2}
              stroke="#fbbf24"
              strokeWidth="2"
              markerEnd="url(#planArrow)"
            />
            <text
              x={x0 + landPx + (f1Treads * treadPx) / 2}
              y={y0 + fwPx / 2 - 7}
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="9.5"
              fontWeight="bold"
              className="font-mono"
            >
              UP ({res.risersPerFlight[0]}R)
            </text>

            {/* Upper Landing */}
            <rect
              x={x0 + landPx + f1Treads * treadPx}
              y={y0}
              width={landPx}
              height={fwPx}
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            <text
              x={x0 + landPx + f1Treads * treadPx + landPx / 2}
              y={y0 + fwPx / 2 + 3}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="9"
              className="font-mono"
            >
              UPPER
            </text>
          </g>
        ) : res.topology === 'open-well' ? (
          <g>
            {/* Left Entry/Exit Landing Strip */}
            <rect
              x={x0}
              y={y0}
              width={landPx}
              height={fwPx * 2 + Math.max(gapPx, f2Treads * treadPx)}
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            {/* Right Turn Landing Strip */}
            <rect
              x={x0 + landPx + Math.max(f1Treads, f3Treads) * treadPx}
              y={y0}
              width={landPx}
              height={fwPx * 2 + Math.max(gapPx, f2Treads * treadPx)}
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />

            {/* Flight 1 (Bottom: Left to Right) */}
            <rect
              x={x0 + landPx}
              y={y0 + fwPx + Math.max(gapPx, f2Treads * treadPx)}
              width={f1Treads * treadPx}
              height={fwPx}
              fill="#0c4a6e"
              fillOpacity="0.45"
              stroke="#38bdf8"
              strokeWidth="1.4"
            />
            {Array.from({ length: f1Treads }).map((_, i) => (
              <line
                key={`f1-${i}`}
                x1={x0 + landPx + i * treadPx}
                y1={y0 + fwPx + Math.max(gapPx, f2Treads * treadPx)}
                x2={x0 + landPx + i * treadPx}
                y2={y0 + fwPx * 2 + Math.max(gapPx, f2Treads * treadPx)}
                stroke="#38bdf8"
                strokeWidth="0.8"
              />
            ))}
            <line
              x1={x0 + landPx + 8}
              y1={y0 + fwPx * 1.5 + Math.max(gapPx, f2Treads * treadPx)}
              x2={x0 + landPx + f1Treads * treadPx - 8}
              y2={y0 + fwPx * 1.5 + Math.max(gapPx, f2Treads * treadPx)}
              stroke="#fbbf24"
              strokeWidth="1.8"
              markerEnd="url(#planArrow)"
            />

            {/* Flight 2 (Right Mid-Run: Bottom to Top) */}
            <rect
              x={x0 + landPx + Math.max(f1Treads, f3Treads) * treadPx - fwPx}
              y={y0 + fwPx}
              width={fwPx}
              height={Math.max(gapPx, f2Treads * treadPx)}
              fill="#0c4a6e"
              fillOpacity="0.45"
              stroke="#38bdf8"
              strokeWidth="1.4"
            />
            {Array.from({ length: f2Treads }).map((_, i) => (
              <line
                key={`f2-${i}`}
                x1={x0 + landPx + Math.max(f1Treads, f3Treads) * treadPx - fwPx}
                y1={y0 + fwPx + i * treadPx}
                x2={x0 + landPx + Math.max(f1Treads, f3Treads) * treadPx}
                y2={y0 + fwPx + i * treadPx}
                stroke="#38bdf8"
                strokeWidth="0.8"
              />
            ))}

            {/* Flight 3 (Top: Right to Left) */}
            <rect
              x={x0 + landPx}
              y={y0}
              width={f3Treads * treadPx}
              height={fwPx}
              fill="#0c4a6e"
              fillOpacity="0.45"
              stroke="#38bdf8"
              strokeWidth="1.4"
            />
            {Array.from({ length: f3Treads }).map((_, i) => (
              <line
                key={`f3-${i}`}
                x1={x0 + landPx + i * treadPx}
                y1={y0}
                x2={x0 + landPx + i * treadPx}
                y2={y0 + fwPx}
                stroke="#38bdf8"
                strokeWidth="0.8"
              />
            ))}
            <line
              x1={x0 + landPx + f3Treads * treadPx - 8}
              y1={y0 + fwPx / 2}
              x2={x0 + landPx + 8}
              y2={y0 + fwPx / 2}
              stroke="#fbbf24"
              strokeWidth="1.8"
              markerEnd="url(#planArrow)"
            />

            {/* Central Open Well Void */}
            <rect
              x={x0 + landPx + 4}
              y={y0 + fwPx + 4}
              width={Math.max(16, Math.max(f1Treads, f3Treads) * treadPx - fwPx - 8)}
              height={Math.max(16, Math.max(gapPx, f2Treads * treadPx) - 8)}
              fill="#020617"
              stroke="#64748b"
              strokeDasharray="3 2"
            />
            <text
              x={x0 + landPx + (Math.max(f1Treads, f3Treads) * treadPx - fwPx) / 2}
              y={y0 + fwPx + Math.max(gapPx, f2Treads * treadPx) / 2 + 3}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="8.5"
              className="font-mono"
            >
              OPEN WELL ({res.wellGapMm}mm)
            </text>
          </g>
        ) : (
          /* Dog-Legged & U-Shaped 2-Flight Layout */
          <g>
            {/* Bottom/Top Entry Landing Strip */}
            <rect
              x={x0}
              y={y0}
              width={landPx}
              height={fwPx * 2 + gapPx}
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            <text x={x0 + landPx / 2} y={y0 + fwPx * 1.5 + gapPx + 3} textAnchor="middle" fill="#cbd5e1" fontSize="8.5" className="font-mono">
              ENTRY
            </text>
            <text x={x0 + landPx / 2} y={y0 + fwPx * 0.5 + 3} textAnchor="middle" fill="#34d399" fontSize="8.5" className="font-mono">
              EXIT
            </text>

            {/* Intermediate Half-Turn Landing */}
            <rect
              x={x0 + landPx + Math.max(f1Treads, f2Treads) * treadPx}
              y={y0}
              width={landPx}
              height={fwPx * 2 + gapPx}
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            <text
              x={x0 + landPx + Math.max(f1Treads, f2Treads) * treadPx + landPx / 2}
              y={y0 + (fwPx * 2 + gapPx) / 2 + 3}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="8.5"
              className="font-mono"
            >
              MID LAND
            </text>

            {/* Flight 1 (Bottom: Left -> Right) */}
            <rect
              x={x0 + landPx}
              y={y0 + fwPx + gapPx}
              width={f1Treads * treadPx}
              height={fwPx}
              fill="#0c4a6e"
              fillOpacity="0.45"
              stroke="#38bdf8"
              strokeWidth="1.4"
            />
            {Array.from({ length: f1Treads }).map((_, i) => (
              <line
                key={`dl1-${i}`}
                x1={x0 + landPx + i * treadPx}
                y1={y0 + fwPx + gapPx}
                x2={x0 + landPx + i * treadPx}
                y2={y0 + fwPx * 2 + gapPx}
                stroke="#38bdf8"
                strokeWidth="0.9"
              />
            ))}
            <line
              x1={x0 + landPx + 8}
              y1={y0 + fwPx * 1.5 + gapPx}
              x2={x0 + landPx + f1Treads * treadPx - 8}
              y2={y0 + fwPx * 1.5 + gapPx}
              stroke="#fbbf24"
              strokeWidth="2"
              markerEnd="url(#planArrow)"
            />
            <text
              x={x0 + landPx + (f1Treads * treadPx) / 2}
              y={y0 + fwPx * 1.5 + gapPx - 6}
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="9"
              fontWeight="bold"
              className="font-mono"
            >
              F1 UP ({res.risersPerFlight[0]}R)
            </text>

            {/* Well Gap Zone */}
            <rect
              x={x0 + landPx}
              y={y0 + fwPx}
              width={Math.max(f1Treads, f2Treads) * treadPx}
              height={gapPx}
              fill="#020617"
              stroke="#475569"
              strokeWidth="0.8"
              strokeDasharray="3 2"
            />

            {/* Flight 2 (Top: Right -> Left) */}
            <rect
              x={x0 + landPx}
              y={y0}
              width={f2Treads * treadPx}
              height={fwPx}
              fill="#0c4a6e"
              fillOpacity="0.45"
              stroke="#38bdf8"
              strokeWidth="1.4"
            />
            {Array.from({ length: f2Treads }).map((_, i) => (
              <line
                key={`dl2-${i}`}
                x1={x0 + landPx + i * treadPx}
                y1={y0}
                x2={x0 + landPx + i * treadPx}
                y2={y0 + fwPx}
                stroke="#38bdf8"
                strokeWidth="0.9"
              />
            ))}
            <line
              x1={x0 + landPx + f2Treads * treadPx - 8}
              y1={y0 + fwPx / 2}
              x2={x0 + landPx + 8}
              y2={y0 + fwPx / 2}
              stroke="#fbbf24"
              strokeWidth="2"
              markerEnd="url(#planArrow)"
            />
            <text
              x={x0 + landPx + (f2Treads * treadPx) / 2}
              y={y0 + fwPx / 2 - 6}
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="9"
              fontWeight="bold"
              className="font-mono"
            >
              F2 UP ({res.risersPerFlight[1]}R)
            </text>
          </g>
        )}

        {/* Plan Footprint Dimension Footer */}
        <text x={svgW / 2} y={svgH - 14} textAnchor="middle" fill="#cbd5e1" fontSize="9.5" className="font-mono">
          Flight Wf = {res.flightWidthMm}mm · Well Gap = {res.wellGapMm}mm · Req Envelope: {res.requiredStairwellLengthMm} × {res.requiredStairwellWidthMm} mm (Well: {res.stairwellLengthMm} × {res.stairwellWidthMm} mm)
        </text>
      </svg>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Dual Cross-Links */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                Staircase Ergonomics, BNBC Part 4 Egress &amp; Takeoff Designer
              </h2>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                  res.overallCompliant
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                {res.overallCompliant ? 'BNBC EGRESS & ERGONOMICS PASS' : 'CHECK EGRESS / WELL FIT'}
              </span>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">
              Multi-Topology (Dog-Legged · Open-Well · Straight · U-Shaped) · Blondel Laws · Headroom · Dual Rebar &amp; BOQ Sync
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSendToRebarBbs && (
              <button
                type="button"
                onClick={() =>
                  onSendToRebarBbs({
                    stairGoingM: Number((res.goingLengthMm / 1000).toFixed(2)),
                    stairTotalRiseM: Number((res.floorHeightMm / 1000).toFixed(2)),
                    waistSlabThicknessMm: res.waistSlabMm,
                    riserMm: Math.round(res.actualRiserMm),
                    treadMm: res.actualTreadMm,
                    landingLengthM: Number((res.landingWidthMm / 1000).toFixed(2)),
                  })
                }
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                title="Transfer waist slab, riser/tread & going geometry into Rebar BBS"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Send Staircase to Rebar BBS</span>
              </button>
            )}

            {onSendStaircaseToBoq && (
              <button
                type="button"
                onClick={handleSendToBoq}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                title="Compute exact waist + step concrete (m³) and soffit/riser formwork (m²) and push to BOQ"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Staircase Concrete &amp; Formwork to BOQ</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {boqSentNotice && (
          <div className="mt-3 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Pushed {res.totalConcreteM3} m³ RCC concrete and {res.totalFormworkM2} m² soffit/riser formwork for 1 story ({res.topologyLabel}) to BOQ Estimator.
            </span>
          </div>
        )}

        {/* Worked Presets Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3">
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[var(--md-sys-color-on-surface-variant)] mr-1">
            Worked Presets:
          </span>
          {STAIRCASE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              title={preset.description}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                activePresetId === preset.id
                  ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)]'
                  : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* DCR Gauges Suite */}
      <DcrGaugeSuite
        gauges={res.dcrGauges}
        moduleKey={`stair-${res.topology}-${res.occupancy}-${res.totalRisers}`}
        showAllInitially={true}
      />

      {/* Main Layout: Left Interactive Sliders & Parameters | Right Live Dual Schematics + Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-2">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              <span>Topology, Egress &amp; Live Sliders</span>
            </h3>
            <button
              type="button"
              onClick={handleFitMinStairwell}
              className="text-[10px] font-mono font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
            >
              Fit Min Stairwell
            </button>
          </div>

          {/* 4-Topology Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] block">
              Staircase Topology
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'dog-legged', label: 'Dog-Legged (2F)' },
                  { id: 'open-well', label: 'Open-Well (3F)' },
                  { id: 'straight-flight', label: 'Straight Flight' },
                  { id: 'u-shaped', label: 'U-Shaped (Wide)' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTopologyChange(item.id)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    stairTopology === item.id
                      ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Building Occupancy (BNBC Part 4) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] block">
              Building Occupancy (BNBC Part 4 Egress)
            </label>
            <select
              value={buildingOccupancy}
              onChange={(e) => handleOccupancyChange(e.target.value as StairBuildingOccupancy)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
            >
              <option value="residential">Residential (Group A · Min Width 1.00 m · ≤38°)</option>
              <option value="public-commercial">Public / Commercial (Group B/E · Min 1.50 m · ≤33°)</option>
              <option value="educational-hospital">Educational / Hospital (Group C/D · Min 1.50 m · ≤33°)</option>
            </select>
          </div>

          {/* Live Synchronized Range Sliders */}
          <div className="space-y-3 pt-1">
            {/* Floor Height (H) Slider + Number */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-[var(--md-sys-color-on-surface)]">
                  Floor-to-Floor Height (H)
                </label>
                <span className="font-mono tabular-nums text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  {(floorHeightMm / 1000).toFixed(2)} m ({formatFeetInches(floorHeightMm / 1000, { isMeters: true })})
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="range"
                  min={2400}
                  max={5000}
                  step={25}
                  value={floorHeightMm}
                  onChange={(e) => {
                    setActivePresetId('');
                    setFloorHeightMm(Number(e.target.value));
                  }}
                  aria-label="Floor height slider"
                  className="flex-1 accent-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <input
                  type="number"
                  min={1800}
                  max={6000}
                  step={25}
                  value={floorHeightMm}
                  onChange={(e) => setFloorHeightMm(Math.max(1800, Number(e.target.value) || 2400))}
                  className="w-20 px-2 py-1 text-xs font-mono tabular-nums font-bold text-right rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                />
              </div>
            </div>

            {/* Riser (R) Slider + Number */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-[var(--md-sys-color-on-surface)]">
                  Preferred Riser Height (R)
                </label>
                <span className="font-mono tabular-nums text-[11px] text-[var(--md-sys-color-primary)]">
                  Actual R = {res.actualRiserMm.toFixed(1)} mm ({res.totalRisers} risers)
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="range"
                  min={125}
                  max={200}
                  step={1}
                  value={preferredRiserMm}
                  onChange={(e) => {
                    setActivePresetId('');
                    setPreferredRiserMm(Number(e.target.value));
                  }}
                  aria-label="Riser height slider"
                  className="flex-1 accent-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <input
                  type="number"
                  min={110}
                  max={220}
                  step={1}
                  value={preferredRiserMm}
                  onChange={(e) => setPreferredRiserMm(Math.max(110, Number(e.target.value) || 150))}
                  className="w-20 px-2 py-1 text-xs font-mono tabular-nums font-bold text-right rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                />
              </div>
            </div>

            {/* Tread (T) Slider + Number */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-[var(--md-sys-color-on-surface)]">
                  Tread Width (T)
                </label>
                <span className="font-mono tabular-nums text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  2R + T = {res.blondelValue.toFixed(0)} mm
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="range"
                  min={220}
                  max={340}
                  step={5}
                  value={preferredTreadMm}
                  onChange={(e) => {
                    setActivePresetId('');
                    setPreferredTreadMm(Number(e.target.value));
                  }}
                  aria-label="Tread width slider"
                  className="flex-1 accent-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <input
                  type="number"
                  min={200}
                  max={380}
                  step={5}
                  value={preferredTreadMm}
                  onChange={(e) => setPreferredTreadMm(Math.max(200, Number(e.target.value) || 275))}
                  className="w-20 px-2 py-1 text-xs font-mono tabular-nums font-bold text-right rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                />
              </div>
            </div>

            {/* Flight Width (Wf) Slider + Number */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-[var(--md-sys-color-on-surface)]">
                  Clear Flight Width (W_f)
                </label>
                <span className="font-mono tabular-nums text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  BNBC Min: {res.minClearFlightWidthMm} mm
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="range"
                  min={850}
                  max={2400}
                  step={25}
                  value={flightWidthMm}
                  onChange={(e) => {
                    setActivePresetId('');
                    setFlightWidthMm(Number(e.target.value));
                  }}
                  aria-label="Flight width slider"
                  className="flex-1 accent-[var(--md-sys-color-primary)] cursor-pointer"
                />
                <input
                  type="number"
                  min={750}
                  max={3000}
                  step={25}
                  value={flightWidthMm}
                  onChange={(e) => setFlightWidthMm(Math.max(750, Number(e.target.value) || 1150))}
                  className="w-20 px-2 py-1 text-xs font-mono tabular-nums font-bold text-right rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                />
              </div>
            </div>
          </div>

          {/* Secondary Dimensions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[var(--md-sys-color-outline-variant)] text-xs font-mono">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Landing Depth (mm)
              </label>
              <input
                type="number"
                step={50}
                value={landingWidthMm}
                onChange={(e) => setLandingWidthMm(Math.max(800, Number(e.target.value) || 1000))}
                className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Waist Slab tw (mm)
              </label>
              <input
                type="number"
                step={10}
                value={waistSlabMm}
                onChange={(e) => setWaistSlabMm(Math.max(100, Number(e.target.value) || 150))}
                className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Well Gap (mm)
              </label>
              <input
                type="number"
                step={50}
                disabled={stairTopology === 'straight-flight'}
                value={wellGapMm}
                onChange={(e) => setWellGapMm(Math.max(50, Number(e.target.value) || 150))}
                className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold tabular-nums disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Handrail H (mm)
              </label>
              <input
                type="number"
                step={25}
                value={handrailHeightMm}
                onChange={(e) => setHandrailHeightMm(Math.max(700, Number(e.target.value) || 950))}
                className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Stairwell L (mm)
              </label>
              <input
                type="number"
                step={100}
                value={stairwellLengthMm}
                onChange={(e) => setStairwellLengthMm(Math.max(2000, Number(e.target.value) || 4000))}
                className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Stairwell W (mm)
              </label>
              <input
                type="number"
                step={100}
                value={stairwellWidthMm}
                onChange={(e) => setStairwellWidthMm(Math.max(1000, Number(e.target.value) || 2400))}
                className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold tabular-nums"
              />
            </div>
          </div>

          {/* Loads Row */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[var(--md-sys-color-outline-variant)] text-xs font-mono">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Live Load q_L (kN/m²)
              </label>
              <input
                type="number"
                step={0.5}
                value={liveLoadKpa}
                onChange={(e) => setLiveLoadKpa(Math.max(1.5, Number(e.target.value) || 3.0))}
                className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Finishes Load (kN/m²)
              </label>
              <input
                type="number"
                step={0.25}
                value={finishesLoadKpa}
                onChange={(e) => setFinishesLoadKpa(Math.max(0.25, Number(e.target.value) || 1.0))}
                className="w-full px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Right Column: KPIs, Live Dual Schematics (Elevation + Plan), and Step-by-Step Panel */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tabular KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Risers &amp; Steps
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-primary)] mt-0.5">
                {res.totalRisers} <span className="text-xs font-normal">({res.risersPerFlight.join('+')})</span>
              </div>
              <div className="text-[10px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                R={res.actualRiserMm.toFixed(1)} · T={res.actualTreadMm} mm
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Blondel Laws
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
                {res.blondelValue.toFixed(0)} <span className="text-xs font-normal">mm</span>
              </div>
              <div className="text-[10px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                R+T={res.safetyIndex.toFixed(0)} · R×T={res.comfortProduct.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Slope &amp; Headroom
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
                {res.stairPitchDeg.toFixed(1)}°
              </div>
              <div className="text-[10px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Clear {res.estimatedHeadroomMm} mm ({res.headroomStatus})
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Story Takeoff (1 Flr)
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                {res.totalConcreteM3} <span className="text-xs font-normal">m³</span>
              </div>
              <div className="text-[10px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Formwork: {res.totalFormworkM2} m² · wu={res.factoredLoadKpa} kPa
              </div>
            </div>
          </div>

          {/* View Mode Switcher: Live Schematics vs Step-by-Step Derivations */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--md-sys-color-outline-variant)] pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('schematics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  viewMode === 'schematics'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Elevation &amp; Plan Footprint CAD</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('steps')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  viewMode === 'steps'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <BookOpenCheck className="w-3.5 h-3.5" />
                <span>Step-by-Step Derivation ({envelope.handCalculationSteps?.length || 0})</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              {res.topologyLabel}
            </span>
          </div>

          {viewMode === 'steps' ? (
            <StepByStepPanel
              moduleTitle="Staircase Ergonomics & BNBC Part 4 Egress"
              steps={envelope.handCalculationSteps}
              scopeAndLimits={envelope.scopeAndLimits}
            />
          ) : (
            <div className="space-y-4">
              {/* Dual Interactive SVG Schematics */}
              <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                    1. Sectional Elevation View (Waist Slab, Slope &amp; Headroom)
                  </span>
                  <span className="text-[var(--md-sys-color-primary)]">
                    Inclined Waist: {res.inclinedLengthsMm[0]} mm
                  </span>
                </div>
                {renderSectionalElevation()}
              </div>

              <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                    2. Architectural Plan Footprint ({res.topologyLabel})
                  </span>
                  <span className={res.stairwellFitPass ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 font-bold'}>
                    {res.stairwellFitPass ? 'FITS STAIRWELL' : 'EXCEEDS STAIRWELL'}
                  </span>
                </div>
                {renderPlanFootprint()}
              </div>

              {/* Active Egress / Structural Summary Footer */}
              <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>BNBC Part 4 Egress &amp; BOQ Volume Breakdown</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono tabular-nums">
                  <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                    <div className="text-[10px] uppercase text-[var(--md-sys-color-on-surface-variant)]">Clear Width &amp; Landing</div>
                    <div className="font-bold mt-0.5">Wf={res.flightWidthMm} · Land={res.landingWidthMm}mm</div>
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      Min {res.minClearFlightWidthMm}mm · Max {res.maxRisersPerFlightLimit}R/flight
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                    <div className="text-[10px] uppercase text-[var(--md-sys-color-on-surface-variant)]">RCC Concrete (1 Story)</div>
                    <div className="font-bold mt-0.5">{res.totalConcreteM3} m³</div>
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      Waist {res.waistConcreteM3} + Steps {res.stepsConcreteM3} + Land {res.landingConcreteM3}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                    <div className="text-[10px] uppercase text-[var(--md-sys-color-on-surface-variant)]">Formwork Shuttering</div>
                    <div className="font-bold mt-0.5">{res.totalFormworkM2} m²</div>
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      Soffit {res.soffitFormworkM2} + Risers {res.riserFormworkM2} + Edge {res.edgeFormworkM2}
                    </div>
                  </div>
                </div>

                {envelope.issues.length > 0 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] font-mono text-amber-800 dark:text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Active Design Advisories ({envelope.issues.length})</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {envelope.issues.map((iss, idx) => (
                        <li key={idx}>{iss.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
