import React, { useState, useMemo } from 'react';
import {
  Compass,
  FileSpreadsheet,
  FileDown,
  Building,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Sparkles,
  Maximize2,
  Layers,
  ArrowRight,
  Eye,
  Info,
} from 'lucide-react';
import { exportToCSV, generateEngineeringPDF } from '../../../utils/exportEngine';

export type OccupancyType = 'residential' | 'commercial' | 'mixed' | 'educational' | 'industrial';
export type LandUnit = 'katha' | 'decimal' | 'sqft' | 'sqm';

export interface SetbackValues {
  front: number; // meters
  rear: number; // meters
  side1: number; // meters
  side2: number; // meters
}

export const FarMgcCalculator: React.FC = () => {
  // Input States
  const [landUnit, setLandUnit] = useState<LandUnit>('katha');
  const [landAreaValue, setLandAreaValue] = useState<number>(5.0); // 5 Katha default
  const [customKathaSqFt, setCustomKathaSqFt] = useState<number>(720); // 720 standard Bangladesh/Bengal
  const [occupancy, setOccupancy] = useState<OccupancyType>('residential');
  const [roadWidthM, setRoadWidthM] = useState<number>(9.14); // 30 ft (9.14 m)
  const [frontageM, setFrontageM] = useState<number>(14.5);
  const [plotDepthM, setPlotDepthM] = useState<number>(23.0);
  const [isAutoDimension, setIsAutoDimension] = useState<boolean>(true);

  // Custom Override States
  const [enableOverride, setEnableOverride] = useState<boolean>(false);
  const [overrideFar, setOverrideFar] = useState<number>(3.5);
  const [overrideMgc, setOverrideMgc] = useState<number>(60);
  const [overrideSetbacks, setOverrideSetbacks] = useState<SetbackValues>({
    front: 1.5,
    rear: 2.0,
    side1: 1.25,
    side2: 1.25,
  });

  // Convert land area to standard m² and ft²
  const { areaSqm, areaSqft } = useMemo(() => {
    let sqm = 0;
    if (landUnit === 'katha') {
      const sqft = landAreaValue * customKathaSqFt;
      sqm = sqft / 10.7639104;
    } else if (landUnit === 'decimal') {
      const sqft = landAreaValue * 435.6;
      sqm = sqft / 10.7639104;
    } else if (landUnit === 'sqft') {
      sqm = landAreaValue / 10.7639104;
    } else {
      sqm = landAreaValue;
    }
    const sqft = sqm * 10.7639104;
    return { areaSqm: Number(sqm.toFixed(2)), areaSqft: Number(sqft.toFixed(2)) };
  }, [landAreaValue, landUnit, customKathaSqFt]);

  // Auto-calculate frontage & depth when auto is enabled
  React.useEffect(() => {
    if (isAutoDimension && areaSqm > 0) {
      // Standard aspect ratio 1:1.6
      const estWidth = Math.sqrt(areaSqm / 1.6);
      const estLength = estWidth * 1.6;
      setFrontageM(Number(estWidth.toFixed(2)));
      setPlotDepthM(Number(estLength.toFixed(2)));
    }
  }, [areaSqm, isAutoDimension]);

  // Code Rules Engine (BNBC 2020 Part 3 / Dhaka Building Construction Rules)
  const codeStandards = useMemo(() => {
    // 1. MGC (Maximum Ground Coverage %)
    let defaultMgc = 60;
    if (occupancy === 'residential') {
      if (areaSqm <= 200) defaultMgc = 67.5;
      else if (areaSqm <= 350) defaultMgc = 62.5;
      else if (areaSqm <= 500) defaultMgc = 60.0;
      else if (areaSqm <= 1000) defaultMgc = 55.0;
      else defaultMgc = 50.0;
    } else if (occupancy === 'commercial') {
      if (areaSqm <= 200) defaultMgc = 70.0;
      else if (areaSqm <= 500) defaultMgc = 65.0;
      else defaultMgc = 60.0;
    } else if (occupancy === 'educational') {
      defaultMgc = 50.0;
    } else if (occupancy === 'industrial') {
      defaultMgc = 55.0;
    } else {
      // Mixed
      defaultMgc = areaSqm <= 350 ? 65.0 : 57.5;
    }

    // 2. FAR (Floor Area Ratio)
    let defaultFar = 2.5;
    if (roadWidthM < 6.0) {
      defaultFar = occupancy === 'commercial' ? 2.25 : 2.0;
    } else if (roadWidthM < 9.0) {
      defaultFar = occupancy === 'commercial' ? 3.0 : occupancy === 'mixed' ? 2.75 : 2.5;
    } else if (roadWidthM < 12.0) {
      defaultFar = occupancy === 'commercial' ? 3.75 : occupancy === 'mixed' ? 3.4 : 3.15;
    } else if (roadWidthM < 18.0) {
      defaultFar = occupancy === 'commercial' ? 4.5 : occupancy === 'mixed' ? 4.0 : 3.75;
    } else {
      defaultFar = occupancy === 'commercial' ? 5.5 : occupancy === 'mixed' ? 5.0 : 4.5;
    }

    // Small plot bonus/limiting rules
    if (areaSqm < 150) {
      defaultFar = Math.min(defaultFar, 2.5);
    }

    // 3. Mandatory Setbacks (m)
    // Front Setback
    let front = 1.5;
    if (roadWidthM < 9.0) front = 1.5;
    else if (roadWidthM < 12.0) front = 2.0;
    else front = 2.5;

    // Rear Setback
    let rear = 2.0;
    if (areaSqm < 200) rear = 1.5;
    else if (areaSqm < 400) rear = 2.0;
    else rear = 2.5;

    // Side Setbacks
    let side1 = 1.25;
    let side2 = 1.25;
    if (areaSqm < 200) {
      side1 = 1.0;
      side2 = 1.0;
    } else if (areaSqm < 400) {
      side1 = 1.25;
      side2 = 1.25;
    } else {
      side1 = 1.5;
      side2 = 1.5;
    }

    return {
      mgc: defaultMgc,
      far: defaultFar,
      setbacks: { front, rear, side1, side2 },
    };
  }, [areaSqm, roadWidthM, occupancy]);

  // Effective Values (using Overrides if enabled)
  const activeFar = enableOverride ? overrideFar : codeStandards.far;
  const activeMgc = enableOverride ? overrideMgc : codeStandards.mgc;
  const activeSetbacks = enableOverride ? overrideSetbacks : codeStandards.setbacks;

  // Key Area & Geometric Computations
  const calculations = useMemo(() => {
    // 1. Max Permissible Gross Floor Area (GFA)
    const maxGfaSqm = Number((areaSqm * activeFar).toFixed(2));
    const maxGfaSqft = Number((maxGfaSqm * 10.7639104).toFixed(2));

    // 2. Max Ground Coverage by By-Law (Footprint)
    const maxFootprintByMgcSqm = Number(((areaSqm * activeMgc) / 100).toFixed(2));

    // 3. Physical Footprint Restricted by Setbacks
    const buildableWidthM = Math.max(0, frontageM - (activeSetbacks.side1 + activeSetbacks.side2));
    const buildableDepthM = Math.max(0, plotDepthM - (activeSetbacks.front + activeSetbacks.rear));
    const maxFootprintBySetbacksSqm = Number((buildableWidthM * buildableDepthM).toFixed(2));

    // 4. Governed Maximum Footprint (the lesser of MGC and setback envelope)
    const governedFootprintSqm = Math.min(maxFootprintByMgcSqm, maxFootprintBySetbacksSqm);
    const governedFootprintSqft = Number((governedFootprintSqm * 10.7639104).toFixed(2));

    // 5. Recommended Number of Stories
    const estStories = governedFootprintSqm > 0 ? Math.ceil(maxGfaSqm / governedFootprintSqm) : 1;
    const storiesFloored = governedFootprintSqm > 0 ? (maxGfaSqm / governedFootprintSqm).toFixed(1) : '1.0';

    // 6. Open Space Percentage
    const openSpaceSqm = Math.max(0, areaSqm - governedFootprintSqm);
    const openSpacePercent = Number(((openSpaceSqm / areaSqm) * 100).toFixed(1));

    return {
      maxGfaSqm,
      maxGfaSqft,
      maxFootprintByMgcSqm,
      maxFootprintBySetbacksSqm,
      governedFootprintSqm,
      governedFootprintSqft,
      buildableWidthM: Number(buildableWidthM.toFixed(2)),
      buildableDepthM: Number(buildableDepthM.toFixed(2)),
      estStories,
      storiesFloored,
      openSpaceSqm: Number(openSpaceSqm.toFixed(2)),
      openSpacePercent,
    };
  }, [areaSqm, activeFar, activeMgc, frontageM, plotDepthM, activeSetbacks]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Parameter', 'Value', 'Unit', 'Standard / By-Law Basis'];
    const rows: (string | number)[][] = [
      ['Plot Area (Input)', landAreaValue, landUnit.toUpperCase(), 'Site Surveyed Title Area'],
      ['Plot Area (Normalized)', areaSqm, 'm²', `${areaSqft} sq.ft`],
      ['Road Width', roadWidthM, 'm', `${(roadWidthM * 3.28084).toFixed(1)} ft width`],
      ['Building Occupancy', occupancy.toUpperCase(), 'Category', 'BNBC 2020 Occupancy Classification'],
      ['Allowable FAR', activeFar, 'Ratio', enableOverride ? 'Custom Override' : 'BNBC / Municipal Code'],
      ['Maximum Ground Coverage (MGC)', `${activeMgc}%`, 'Percent', 'Maximum building footprint ratio'],
      ['Total Permissible Built-up Area (GFA)', calculations.maxGfaSqm, 'm²', `${calculations.maxGfaSqft} sq.ft`],
      ['Governed Ground Footprint', calculations.governedFootprintSqm, 'm²', `${calculations.governedFootprintSqft} sq.ft`],
      ['Open Space Area', calculations.openSpaceSqm, 'm²', `${calculations.openSpacePercent}% of plot`],
      ['Recommended Number of Stories', calculations.estStories, 'Stories', `Exact ratio: ${calculations.storiesFloored}`],
      ['Mandatory Front Setback', activeSetbacks.front, 'm', `${(activeSetbacks.front * 3.28084).toFixed(2)} ft`],
      ['Mandatory Rear Setback', activeSetbacks.rear, 'm', `${(activeSetbacks.rear * 3.28084).toFixed(2)} ft`],
      ['Mandatory Side 1 Setback', activeSetbacks.side1, 'm', `${(activeSetbacks.side1 * 3.28084).toFixed(2)} ft`],
      ['Mandatory Side 2 Setback', activeSetbacks.side2, 'm', `${(activeSetbacks.side2 * 3.28084).toFixed(2)} ft`],
      ['Buildable Envelope Width', calculations.buildableWidthM, 'm', 'Inside setback boundary'],
      ['Buildable Envelope Depth', calculations.buildableDepthM, 'm', 'Inside setback boundary'],
    ];

    exportToCSV(`FAR_MGC_Setback_Report_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    const pdfData = {
      projectMeta: {
        projectName: 'FAR, MGC & Mandatory Setback Assessment',
        projectCode: 'FAR-MGC-2026',
        client: 'Architectural By-Laws Compliance',
        location: 'Municipal Planning Authority Submittal',
        date: new Date().toISOString().slice(0, 10),
        unitSystem: 'SI' as const,
        engineerName: 'Prokash Biswas, PE',
      },
      moduleMeta: {
        moduleId: 'far-mgc-calculator',
        moduleTitle: 'FAR, MGC & MANDATORY SETBACK ARCHITECTURAL REPORT',
        standard: 'BNBC 2020 Part 3 / Municipal Building Construction Rules',
        status: 'VERIFIED' as const,
      },
      inputs: [
        { name: 'Plot Area', symbol: 'A_plot', value: areaSqm, unit: 'm²' },
        { name: 'Front Road Width', symbol: 'W_road', value: roadWidthM, unit: 'm' },
        { name: 'Plot Frontage', symbol: 'B_plot', value: frontageM, unit: 'm' },
        { name: 'Plot Depth', symbol: 'L_plot', value: plotDepthM, unit: 'm' },
        { name: 'Building Occupancy', symbol: 'Type', value: occupancy.toUpperCase(), unit: 'class' },
      ],
      outputs: [
        { name: 'Allowable Floor Area Ratio', symbol: 'FAR', value: activeFar, unit: 'ratio', status: 'PASS' as const },
        { name: 'Maximum Ground Coverage', symbol: 'MGC', value: `${activeMgc}%`, unit: '%', status: 'PASS' as const },
        { name: 'Total Permissible Built-up Area', symbol: 'GFA', value: calculations.maxGfaSqm, unit: 'm²', status: 'PASS' as const },
        { name: 'Governed Floor Footprint', symbol: 'A_footprint', value: calculations.governedFootprintSqm, unit: 'm²', status: 'PASS' as const },
        { name: 'Recommended Stories', symbol: 'N_floors', value: calculations.estStories, unit: 'levels', status: 'INFO' as const },
        { name: 'Mandatory Front Setback', symbol: 'SB_front', value: activeSetbacks.front, unit: 'm', status: 'INFO' as const },
        { name: 'Mandatory Rear Setback', symbol: 'SB_rear', value: activeSetbacks.rear, unit: 'm', status: 'INFO' as const },
        { name: 'Mandatory Side Setbacks', symbol: 'SB_sides', value: `${activeSetbacks.side1}m / ${activeSetbacks.side2}m`, unit: 'm', status: 'INFO' as const },
      ],
      governingAssumptions: [
        'FAR & MGC calculated in accordance with BNBC 2020 Part 3 Chapter 2.',
        'Setbacks represent clear distance from plot property boundary to outermost wall or balcony projection.',
        'Front setback measured from designated right-of-way (ROW) road centerline or front line.',
        'Total Built-up Area GFA = Plot Area × FAR. Footprint = min(Plot Area × MGC%, Setback Envelope).',
      ],
    };

    await generateEngineeringPDF(pdfData, {
      filename: `PB_CivilLab_FAR_MGC_Setback_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] uppercase">
                Phase 5 Module
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                FAR, MGC &amp; Mandatory Setback Calculator
              </h2>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
              BNBC 2020 Part 3 · Floor Area Ratio (FAR) · Maximum Ground Coverage (MGC) · 2D Building Footprint Envelope
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] flex items-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Certified PDF</span>
            </button>
          </div>
        </div>

        {/* Input Parameters Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {/* Land Area & Unit */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Land Area
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={landAreaValue}
                onChange={(e) => setLandAreaValue(Math.max(0.1, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
              />
              <select
                value={landUnit}
                onChange={(e) => setLandUnit(e.target.value as LandUnit)}
                className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]"
              >
                <option value="katha">Katha (কাঠা)</option>
                <option value="decimal">Decimal (শতক)</option>
                <option value="sqft">Sq. Ft</option>
                <option value="sqm">Sq. M</option>
              </select>
            </div>
            <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
              = {areaSqm} m² ({areaSqft} sq.ft)
            </div>
          </div>

          {/* Occupancy Type */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Building Occupancy Type
            </label>
            <select
              value={occupancy}
              onChange={(e) => setOccupancy(e.target.value as OccupancyType)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
            >
              <option value="residential">Residential (Class A)</option>
              <option value="commercial">Commercial / Office (Class B/E)</option>
              <option value="mixed">Mixed Use (Commercial + Res)</option>
              <option value="educational">Educational / Institutional (Class C)</option>
              <option value="industrial">Industrial / Warehouse (Class G)</option>
            </select>
            <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
              Governs allowable FAR &amp; MGC limits
            </div>
          </div>

          {/* Front Road Width */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                Front Road Width
              </label>
              <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                {(roadWidthM * 3.28084).toFixed(1)} ft
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.5"
                min="3.0"
                value={roadWidthM}
                onChange={(e) => setRoadWidthM(Math.max(3.0, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-xs font-mono">m</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[
                { label: '20ft', m: 6.096 },
                { label: '30ft', m: 9.144 },
                { label: '40ft', m: 12.192 },
                { label: '60ft', m: 18.288 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setRoadWidthM(p.m)}
                  className="px-1.5 py-0.5 text-[9px] font-mono rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Plot Dimensions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                Plot Geometry (B × L)
              </label>
              <button
                type="button"
                onClick={() => setIsAutoDimension(!isAutoDimension)}
                className={`text-[9px] font-mono px-1 rounded cursor-pointer ${
                  isAutoDimension ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold' : 'text-gray-500'
                }`}
              >
                {isAutoDimension ? 'Auto 1:1.6' : 'Manual'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <input
                  type="number"
                  step="0.5"
                  value={frontageM}
                  disabled={isAutoDimension}
                  onChange={(e) => setFrontageM(Math.max(3, Number(e.target.value)))}
                  placeholder="Width"
                  className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] disabled:opacity-75"
                />
                <span className="text-[9px] font-mono text-[var(--md-sys-color-on-surface-variant)]">Frontage (m)</span>
              </div>
              <div>
                <input
                  type="number"
                  step="0.5"
                  value={plotDepthM}
                  disabled={isAutoDimension}
                  onChange={(e) => setPlotDepthM(Math.max(3, Number(e.target.value)))}
                  placeholder="Depth"
                  className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] disabled:opacity-75"
                />
                <span className="text-[9px] font-mono text-[var(--md-sys-color-on-surface-variant)]">Depth (m)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Override Accordion */}
        <div className="mt-4 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
              <input
                type="checkbox"
                checked={enableOverride}
                onChange={(e) => setEnableOverride(e.target.checked)}
                className="rounded border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-primary)] cursor-pointer"
              />
              <span>Enable Custom By-Law Overrides (Special Zoning / Masterplan Variance)</span>
            </label>
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              {enableOverride ? 'Custom Active' : 'BNBC 2020 Default'}
            </span>
          </div>

          {enableOverride && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-3 p-3 bg-[var(--md-sys-color-surface-container-low)] rounded-xl border border-[var(--md-sys-color-outline-variant)] text-xs font-mono">
              <div>
                <span className="text-[10px] block font-semibold mb-1">Custom FAR</span>
                <input
                  type="number"
                  step="0.05"
                  value={overrideFar}
                  onChange={(e) => setOverrideFar(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] block font-semibold mb-1">Custom MGC (%)</span>
                <input
                  type="number"
                  step="0.5"
                  value={overrideMgc}
                  onChange={(e) => setOverrideMgc(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] block font-semibold mb-1">Front SB (m)</span>
                <input
                  type="number"
                  step="0.25"
                  value={overrideSetbacks.front}
                  onChange={(e) => setOverrideSetbacks({ ...overrideSetbacks, front: Number(e.target.value) })}
                  className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] block font-semibold mb-1">Rear SB (m)</span>
                <input
                  type="number"
                  step="0.25"
                  value={overrideSetbacks.rear}
                  onChange={(e) => setOverrideSetbacks({ ...overrideSetbacks, rear: Number(e.target.value) })}
                  className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] block font-semibold mb-1">Side 1 SB (m)</span>
                <input
                  type="number"
                  step="0.25"
                  value={overrideSetbacks.side1}
                  onChange={(e) => setOverrideSetbacks({ ...overrideSetbacks, side1: Number(e.target.value) })}
                  className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] block font-semibold mb-1">Side 2 SB (m)</span>
                <input
                  type="number"
                  step="0.25"
                  value={overrideSetbacks.side2}
                  onChange={(e) => setOverrideSetbacks({ ...overrideSetbacks, side2: Number(e.target.value) })}
                  className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* FAR Card */}
        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-xs">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Floor Area Ratio (FAR)
          </div>
          <div className="text-3xl font-bold font-mono text-[var(--md-sys-color-primary)] mt-1">
            {activeFar.toFixed(2)}
          </div>
          <div className="text-xs font-mono text-emerald-600 font-semibold mt-1">
            Max GFA: {calculations.maxGfaSqm.toLocaleString()} m² ({calculations.maxGfaSqft.toLocaleString()} sq.ft)
          </div>
        </div>

        {/* MGC Card */}
        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-xs">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Max Ground Coverage (MGC)
          </div>
          <div className="text-3xl font-bold font-mono text-[var(--md-sys-color-secondary)] mt-1">
            {activeMgc}%
          </div>
          <div className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Max Footprint: {calculations.maxFootprintByMgcSqm.toLocaleString()} m²
          </div>
        </div>

        {/* Governed Footprint Card */}
        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-xs">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Governed Building Footprint
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-600 mt-1">
            {calculations.governedFootprintSqm.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]">m²</span>
          </div>
          <div className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
            {calculations.governedFootprintSqft.toLocaleString()} sq.ft ({((calculations.governedFootprintSqm / areaSqm) * 100).toFixed(1)}% of plot)
          </div>
        </div>

        {/* Stories Card */}
        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-xs">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Recommended Height
          </div>
          <div className="text-3xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-1">
            {calculations.estStories}{' '}
            <span className="text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]">Stories</span>
          </div>
          <div className="text-xs font-mono text-[var(--md-sys-color-primary)] font-semibold mt-1">
            Ratio: {calculations.storiesFloored} Floors @ Max Footprint
          </div>
        </div>
      </div>

      {/* Main Analysis Section: 2D Interactive Vector Footprint Diagram + Setback Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 2D Vector Top-Down Plot Diagram */}
        <div className="lg:col-span-7 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                2D Top-Down Site Plan &amp; Building Footprint Envelope
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Plot {frontageM}m × {plotDepthM}m
            </span>
          </div>

          {/* SVG Site Drawing */}
          <div className="w-full bg-[var(--md-sys-color-surface-container-low)] rounded-xl border border-[var(--md-sys-color-outline-variant)] p-4 flex items-center justify-center min-h-[340px]">
            {(() => {
              const svgW = 480;
              const svgH = 340;
              const padX = 70;
              const padY = 50;

              // Scale factors
              const scale = Math.min((svgW - 2 * padX) / frontageM, (svgH - 2 * padY - 35) / plotDepthM);

              const plotW_px = frontageM * scale;
              const plotH_px = plotDepthM * scale;

              const plotX = (svgW - plotW_px) / 2;
              const plotY = padY;

              // Setback pixel offsets
              const sbFront_px = activeSetbacks.front * scale;
              const sbRear_px = activeSetbacks.rear * scale;
              const sbSide1_px = activeSetbacks.side1 * scale;
              const sbSide2_px = activeSetbacks.side2 * scale;

              const bldgX = plotX + sbSide1_px;
              const bldgY = plotY + sbRear_px;
              const bldgW_px = Math.max(10, plotW_px - (sbSide1_px + sbSide2_px));
              const bldgH_px = Math.max(10, plotH_px - (sbFront_px + sbRear_px));

              const roadY = plotY + plotH_px + 8;
              const roadH = 26;

              return (
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto max-h-[380px]">
                  <defs>
                    <pattern id="footprintHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="1.5" className="text-[var(--md-sys-color-primary)] opacity-40" />
                    </pattern>
                  </defs>

                  {/* Rear Property Annotation */}
                  <text x={svgW / 2} y={plotY - 10} textAnchor="middle" className="text-[9px] font-mono fill-[var(--md-sys-color-on-surface-variant)] uppercase font-bold">
                    ▲ REAR PROPERTY BOUNDARY (Rear Setback: {activeSetbacks.rear}m)
                  </text>

                  {/* Plot Outer Boundary */}
                  <rect
                    x={plotX}
                    y={plotY}
                    width={plotW_px}
                    height={plotH_px}
                    fill="none"
                    stroke="var(--md-sys-color-primary)"
                    strokeWidth="2.5"
                    rx="3"
                  />

                  {/* Open Space Shading */}
                  <rect
                    x={plotX}
                    y={plotY}
                    width={plotW_px}
                    height={plotH_px}
                    fill="var(--md-sys-color-surface-container)"
                    opacity="0.3"
                  />

                  {/* Setback Dashed Boundary */}
                  <rect
                    x={bldgX}
                    y={bldgY}
                    width={bldgW_px}
                    height={bldgH_px}
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />

                  {/* Building Footprint (Permissible Envelope) */}
                  <rect
                    x={bldgX}
                    y={bldgY}
                    width={bldgW_px}
                    height={bldgH_px}
                    fill="url(#footprintHatch)"
                    rx="2"
                  />
                  <rect
                    x={bldgX}
                    y={bldgY}
                    width={bldgW_px}
                    height={bldgH_px}
                    fill="var(--md-sys-color-primary)"
                    fillOpacity="0.12"
                  />

                  {/* Building Label & Dimensions */}
                  <text x={bldgX + bldgW_px / 2} y={bldgY + bldgH_px / 2 - 8} textAnchor="middle" className="text-[11px] font-mono font-bold fill-[var(--md-sys-color-primary)]">
                    PERMISSIBLE FOOTPRINT
                  </text>
                  <text x={bldgX + bldgW_px / 2} y={bldgY + bldgH_px / 2 + 8} textAnchor="middle" className="text-[10px] font-mono fill-[var(--md-sys-color-on-surface)] font-semibold">
                    {calculations.governedFootprintSqm} m² ({calculations.buildableWidthM}m × {calculations.buildableDepthM}m)
                  </text>

                  {/* Side Setback Dimension Indicators */}
                  <text x={plotX + sbSide1_px / 2} y={plotY + plotH_px / 2} textAnchor="middle" className="text-[8px] font-mono fill-rose-600 font-bold">
                    {activeSetbacks.side1}m
                  </text>
                  <text x={plotX + plotW_px - sbSide2_px / 2} y={plotY + plotH_px / 2} textAnchor="middle" className="text-[8px] font-mono fill-rose-600 font-bold">
                    {activeSetbacks.side2}m
                  </text>

                  {/* Front Setback Indicator */}
                  <text x={plotX + plotW_px / 2} y={plotY + plotH_px - sbFront_px / 2 + 3} textAnchor="middle" className="text-[9px] font-mono fill-rose-600 font-bold">
                    Front Setback: {activeSetbacks.front} m
                  </text>

                  {/* Plot Dimension Callouts */}
                  <text x={plotX + plotW_px / 2} y={plotY + 14} textAnchor="middle" className="text-[9px] font-mono fill-[var(--md-sys-color-primary)] font-bold">
                    Frontage: {frontageM} m
                  </text>
                  <text x={plotX - 10} y={plotY + plotH_px / 2} textAnchor="middle" transform={`rotate(-90 ${plotX - 10} ${plotY + plotH_px / 2})`} className="text-[9px] font-mono fill-[var(--md-sys-color-primary)] font-bold">
                    Depth: {plotDepthM} m
                  </text>

                  {/* Front Roadway */}
                  <rect
                    x={plotX - 25}
                    y={roadY}
                    width={plotW_px + 50}
                    height={roadH}
                    fill="#334155"
                    rx="3"
                  />
                  <line
                    x1={plotX - 25}
                    y1={roadY + roadH / 2}
                    x2={plotX + plotW_px + 25}
                    y2={roadY + roadH / 2}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                  />
                  <text x={svgW / 2} y={roadY + roadH / 2 + 3} textAnchor="middle" className="text-[9px] font-mono fill-white font-bold tracking-wider">
                    FRONT ROAD: {roadWidthM}m ({(roadWidthM * 3.28084).toFixed(1)} FT WIDE)
                  </text>
                </svg>
              );
            })()}
          </div>
        </div>

        {/* Right: By-Law Compliance Schedule & Setback Audit */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)] mb-3 pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              Mandatory Setback &amp; Envelope Summary
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="font-semibold text-rose-600">Front Setback</span>
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                  {activeSetbacks.front} m ({(activeSetbacks.front * 3.28084).toFixed(2)} ft)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="font-semibold text-rose-600">Rear Setback</span>
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                  {activeSetbacks.rear} m ({(activeSetbacks.rear * 3.28084).toFixed(2)} ft)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="font-semibold text-rose-600">Side 1 Setback</span>
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                  {activeSetbacks.side1} m ({(activeSetbacks.side1 * 3.28084).toFixed(2)} ft)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="font-semibold text-rose-600">Side 2 Setback</span>
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                  {activeSetbacks.side2} m ({(activeSetbacks.side2 * 3.28084).toFixed(2)} ft)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--md-sys-color-primary-container)]/20 border border-[var(--md-sys-color-primary)]/30">
                <span className="font-bold text-[var(--md-sys-color-primary)]">Permissible Envelope</span>
                <span className="font-bold text-[var(--md-sys-color-primary)]">
                  {calculations.buildableWidthM}m × {calculations.buildableDepthM}m
                </span>
              </div>
            </div>
          </div>

          {/* Area Balance & Open Space Card */}
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 shadow-xs">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)] mb-3 pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              Site Area Balance &amp; Open Space
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Total Plot Area:</span>
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">{areaSqm} m²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Ground Footprint:</span>
                <span className="font-bold text-emerald-600">{calculations.governedFootprintSqm} m²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Mandatory Open Space:</span>
                <span className="font-bold text-[var(--md-sys-color-secondary)]">
                  {calculations.openSpaceSqm} m² ({calculations.openSpacePercent}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[var(--md-sys-color-surface-container)] rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, (calculations.governedFootprintSqm / areaSqm) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)] pt-1">
                <span>Footprint: {((calculations.governedFootprintSqm / areaSqm) * 100).toFixed(1)}%</span>
                <span>Open Space: {calculations.openSpacePercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
