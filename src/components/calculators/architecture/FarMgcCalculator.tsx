import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpenCheck,
  Building,
  Car,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileDown,
  FileSpreadsheet,
  Layers,
  Ruler,
  Send,
  Sliders,
} from 'lucide-react';
import {
  ArchitectureOccupancyType,
  FarMgcParameters,
  TakeoffLineItem,
} from '../../../types/civil';
import {
  ARCHITECTURE_FAR_PRESETS,
  ArchitecturePreset,
  buildBoqItemsFromArchitectureFootprint,
  computeArchitectureFarMgc,
  mapLegacyOccupancy,
  mapOccupancyToLegacy,
} from '../../../utils/architectureEngine';
import { exportToCSV, generateEngineeringPDF } from '../../../utils/exportEngine';
import { formatFeetInches } from '../../../utils/unitConverter';
import { DcrGaugeSuite } from '../../DcrCapacityGauge';
import { StepByStepPanel } from '../../StepByStepPanel';

export type LandUnit = 'katha' | 'decimal' | 'sqft' | 'sqm';

export interface SetbackValues {
  front: number;
  rear: number;
  side1: number;
  side2: number;
}

export interface FarMgcCalculatorProps {
  initialValues?: Partial<FarMgcParameters>;
  onChange?: (values: FarMgcParameters) => void;
  onPushFootprintToBoq?: (items: TakeoffLineItem[]) => void;
}

const SQFT_PER_SQM = 10.7639104;

export const FarMgcCalculator: React.FC<FarMgcCalculatorProps> = ({
  initialValues,
  onChange,
  onPushFootprintToBoq,
}) => {
  const initialOccType = mapLegacyOccupancy(
    initialValues?.occupancy || 'residential',
    initialValues?.occupancyType
  );
  const initialRoadM = initialValues?.frontRoadWidthM ?? initialValues?.roadWidthM ?? 6.1;

  // Core Plot & Zoning State
  const [landUnit, setLandUnit] = useState<LandUnit>(initialValues?.landUnit || 'katha');
  const [landAreaValue, setLandAreaValue] = useState<number>(initialValues?.landAreaValue ?? 5.0);
  const [customKathaSqFt, setCustomKathaSqFt] = useState<number>(initialValues?.customKathaSqFt ?? 720);
  const [occupancyType, setOccupancyType] = useState<ArchitectureOccupancyType>(initialOccType);
  const [frontRoadWidthM, setFrontRoadWidthM] = useState<number>(initialRoadM);
  const [frontageM, setFrontageM] = useState<number>(initialValues?.frontageM ?? 14.46);
  const [plotDepthM, setPlotDepthM] = useState<number>(initialValues?.plotDepthM ?? 23.13);
  const [isAutoDimension, setIsAutoDimension] = useState<boolean>(initialValues?.isAutoDimension ?? true);
  const [isCornerPlot, setIsCornerPlot] = useState<boolean>(initialValues?.isCornerPlot ?? false);
  const [roadSurrenderWidthM, setRoadSurrenderWidthM] = useState<number>(
    initialValues?.roadSurrenderWidthM ?? 0
  );

  // Proposed Building & Parking State
  const [proposedFloors, setProposedFloors] = useState<number>(initialValues?.proposedFloors ?? 6);
  const [storyHeightM, setStoryHeightM] = useState<number>(initialValues?.storyHeightM ?? 3.05);
  const [proposedGroundCoverageM2, setProposedGroundCoverageM2] = useState<number>(
    initialValues?.proposedGroundCoverageM2 ?? 195.0
  );
  const [proposedTotalFloorAreaM2, setProposedTotalFloorAreaM2] = useState<number>(
    initialValues?.proposedTotalFloorAreaM2 ?? 1050.0
  );
  const [basementCount, setBasementCount] = useState<number>(initialValues?.basementCount ?? 0);
  const [unitsCount, setUnitsCount] = useState<number>(initialValues?.unitsCount ?? 10);
  const [avgUnitAreaSqm, setAvgUnitAreaSqm] = useState<number>(initialValues?.avgUnitAreaSqm ?? 105.0);
  const [providedCarParkingBays, setProvidedCarParkingBays] = useState<number>(
    initialValues?.providedCarParkingBays ?? 5
  );
  const [providedSetbacks, setProvidedSetbacks] = useState<SetbackValues>(
    initialValues?.providedSetbacks || {
      front: 1.5,
      rear: 2.0,
      side1: 1.25,
      side2: 1.25,
    }
  );

  // Custom By-Law Variance / Override
  const [enableOverride, setEnableOverride] = useState<boolean>(initialValues?.enableOverride ?? false);
  const [overrideFar, setOverrideFar] = useState<number>(initialValues?.overrideFar ?? 3.25);
  const [overrideMgc, setOverrideMgc] = useState<number>(initialValues?.overrideMgc ?? 62.5);
  const [overrideSetbacks, setOverrideSetbacks] = useState<SetbackValues>(
    initialValues?.overrideSetbacks || {
      front: 1.5,
      rear: 2.0,
      side1: 1.25,
      side2: 1.25,
    }
  );

  // UI View Sub-Tabs & Feedback
  const [activePresetId, setActivePresetId] = useState<string>('');
  const [analysisView, setAnalysisView] = useState<'cad' | 'steps'>('cad');
  const [boqSentBanner, setBoqSentBanner] = useState<boolean>(false);

  // Keep latest onChange ref to avoid feedback render loops
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Auto-calculate frontage & depth (1:1.6 aspect ratio) when Auto Geometry is active
  const normalizedAreaSqm = useMemo(() => {
    const val = Math.max(0.1, landAreaValue);
    if (landUnit === 'katha') return (val * customKathaSqFt) / SQFT_PER_SQM;
    if (landUnit === 'decimal') return (val * 435.6) / SQFT_PER_SQM;
    if (landUnit === 'sqft') return val / SQFT_PER_SQM;
    return val;
  }, [landAreaValue, landUnit, customKathaSqFt]);

  useEffect(() => {
    if (isAutoDimension && normalizedAreaSqm > 0) {
      const estWidth = Math.sqrt(normalizedAreaSqm / 1.6);
      const estLength = estWidth * 1.6;
      setFrontageM(Number(estWidth.toFixed(2)));
      setPlotDepthM(Number(estLength.toFixed(2)));
    }
  }, [normalizedAreaSqm, isAutoDimension]);

  // Assemble unified FarMgcParameters object
  const currentParams: FarMgcParameters = useMemo(() => {
    const kathaVal = (normalizedAreaSqm * SQFT_PER_SQM) / Math.max(300, customKathaSqFt);
    const plotAreaCategory =
      kathaVal < 2.0
        ? 'below-2-katha'
        : kathaVal <= 5.0
        ? '2-to-5-katha'
        : kathaVal <= 10.0
        ? '5-to-10-katha'
        : 'above-10-katha';

    return {
      landUnit,
      landAreaValue,
      customKathaSqFt,
      occupancy: mapOccupancyToLegacy(occupancyType),
      occupancyType,
      plotAreaCategory,
      roadWidthM: frontRoadWidthM,
      frontRoadWidthM,
      frontageM,
      plotDepthM,
      isAutoDimension,
      isCornerPlot,
      roadSurrenderWidthM,
      proposedFloors,
      storyHeightM,
      proposedGroundCoverageM2,
      proposedTotalFloorAreaM2,
      basementCount,
      unitsCount,
      avgUnitAreaSqm,
      providedCarParkingBays,
      providedSetbacks,
      enableOverride,
      overrideFar,
      overrideMgc,
      overrideSetbacks,
    };
  }, [
    landUnit,
    landAreaValue,
    customKathaSqFt,
    normalizedAreaSqm,
    occupancyType,
    frontRoadWidthM,
    frontageM,
    plotDepthM,
    isAutoDimension,
    isCornerPlot,
    roadSurrenderWidthM,
    proposedFloors,
    storyHeightM,
    proposedGroundCoverageM2,
    proposedTotalFloorAreaM2,
    basementCount,
    unitsCount,
    avgUnitAreaSqm,
    providedCarParkingBays,
    providedSetbacks,
    enableOverride,
    overrideFar,
    overrideMgc,
    overrideSetbacks,
  ]);

  // Persist changes upstream
  useEffect(() => {
    onChangeRef.current?.(currentParams);
  }, [currentParams]);

  // Deterministic BNBC 2020 Calculation Envelope
  const envelope = useMemo(() => computeArchitectureFarMgc(currentParams), [currentParams]);
  const res = envelope.result!;

  // Apply Worked Example Preset
  const handleSelectPreset = (presetId: string) => {
    const preset: ArchitecturePreset | undefined = ARCHITECTURE_FAR_PRESETS.find(
      (p) => p.id === presetId
    );
    if (!preset) return;
    const p = preset.params;
    setActivePresetId(preset.id);
    setLandUnit(p.landUnit);
    setLandAreaValue(p.landAreaValue);
    setCustomKathaSqFt(p.customKathaSqFt);
    setOccupancyType(p.occupancyType || 'residential-a2');
    setFrontRoadWidthM(p.frontRoadWidthM ?? p.roadWidthM);
    setFrontageM(p.frontageM);
    setPlotDepthM(p.plotDepthM);
    setIsAutoDimension(p.isAutoDimension);
    setIsCornerPlot(Boolean(p.isCornerPlot));
    setRoadSurrenderWidthM(p.roadSurrenderWidthM ?? 0);
    setProposedFloors(p.proposedFloors ?? 6);
    setStoryHeightM(p.storyHeightM ?? 3.05);
    setProposedGroundCoverageM2(p.proposedGroundCoverageM2 ?? 195);
    setProposedTotalFloorAreaM2(p.proposedTotalFloorAreaM2 ?? 1050);
    setBasementCount(p.basementCount ?? 0);
    setUnitsCount(p.unitsCount ?? 10);
    setAvgUnitAreaSqm(p.avgUnitAreaSqm ?? 105);
    setProvidedCarParkingBays(p.providedCarParkingBays ?? 5);
    if (p.providedSetbacks) setProvidedSetbacks(p.providedSetbacks);
    setEnableOverride(p.enableOverride);
    setOverrideFar(p.overrideFar);
    setOverrideMgc(p.overrideMgc);
    setOverrideSetbacks(p.overrideSetbacks);
  };

  // Match provided setbacks & footprint quickly to code limit
  const handleMatchMandatorySetbacks = () => {
    setProvidedSetbacks({ ...res.mandatorySetbacks });
  };

  const handleFitMaxPermissibleEnvelope = () => {
    const targetGc = Number((res.governedMaxFootprintSqm * 0.98).toFixed(1));
    const targetGfa = Number(
      Math.min(res.maxPermissibleGfaSqm * 0.98, targetGc * proposedFloors).toFixed(1)
    );
    setProposedGroundCoverageM2(targetGc);
    setProposedTotalFloorAreaM2(targetGfa);
    setProvidedSetbacks({ ...res.mandatorySetbacks });
    setProvidedCarParkingBays(res.requiredCarBays);
  };

  const handlePushToBoq = () => {
    if (!onPushFootprintToBoq) return;
    const items = buildBoqItemsFromArchitectureFootprint(res);
    onPushFootprintToBoq(items);
    setBoqSentBanner(true);
    setTimeout(() => setBoqSentBanner(false), 4500);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Parameter', 'Value', 'Unit', 'BNBC 2020 / Bidhimala Basis'];
    const rows: (string | number)[][] = [
      ['Plot Area (Input)', res.landAreaInput, res.landUnit.toUpperCase(), `${res.plotAreaKatha} Katha`],
      ['Gross Plot Area', res.grossPlotAreaSqm, 'm2', `${res.grossPlotAreaSqft} sq.ft`],
      ['Road Surrender Strip', res.surrenderedAreaSqm, 'm2', `Width ${roadSurrenderWidthM} m`],
      ['Net Plot Area', res.netPlotAreaSqm, 'm2', res.plotCategoryLabel],
      ['Front Road Width (Effective)', res.effectiveRoadWidthM, 'm', `${(res.effectiveRoadWidthM * 3.28084).toFixed(1)} ft`],
      ['Occupancy Classification', res.occupancyLabel, 'Class', res.isCornerPlot ? 'Corner Plot' : 'Interior Plot'],
      ['Effective Allowable FAR', res.effectiveAllowableFar, 'Ratio', `Base ${res.baseAllowableFar} + Bonus ${res.roadWideningBonusFar}`],
      ['Proposed FAR', res.proposedFar, 'Ratio', res.farPass ? 'PASS' : 'EXCEEDS LIMIT'],
      ['Maximum Ground Coverage (MGC)', `${res.allowableMgcPercent}%`, '%', `Max ${res.maxFootprintByMgcSqm} m2`],
      ['Proposed Ground Coverage', `${res.proposedMgcPercent}%`, '%', `${res.proposedGroundCoverageM2} m2 (${res.mgcPass ? 'PASS' : 'FAIL'})`],
      ['Max Permissible GFA', res.maxPermissibleGfaSqm, 'm2', `${res.maxPermissibleGfaSqft} sq.ft`],
      ['Proposed Total Floor Area', res.proposedTotalFloorAreaM2, 'm2', `${res.proposedTotalFloorAreaSqft} sq.ft`],
      ['Governed Floor Footprint', res.governedMaxFootprintSqm, 'm2', `Recommended ${res.recommendedStories} stories`],
      ['Mandatory Setbacks (F/R/S1/S2)', `${res.mandatorySetbacks.front}/${res.mandatorySetbacks.rear}/${res.mandatorySetbacks.side1}/${res.mandatorySetbacks.side2}`, 'm', 'BNBC 2020 Part 3'],
      ['Provided Setbacks (F/R/S1/S2)', `${res.providedSetbacks.front}/${res.providedSetbacks.rear}/${res.providedSetbacks.side1}/${res.providedSetbacks.side2}`, 'm', res.setbackChecks.allPass ? 'COMPLIANT' : 'DEFICIT'],
      ['Required Parking Bays', `${res.requiredCarBays} Car + ${res.requiredMotoBays} Moto`, 'Bays', `Gross Req ${res.requiredParkingGrossSqm} m2 vs Avail ${res.availableParkingAreaSqm} m2`],
    ];
    exportToCSV(`FAR_MGC_Compliance_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // Export Certified PDF
  const handleExportPDF = async () => {
    const pdfData = {
      projectMeta: {
        projectName: 'FAR, MGC & Mandatory Setback Code Compliance',
        projectCode: 'BNBC-BYLAW-2026',
        client: 'Municipal Planning & Development Control',
        location: `${res.plotAreaKatha} Katha (${res.plotCategoryLabel})`,
        date: new Date().toISOString().slice(0, 10),
        unitSystem: 'SI' as const,
        engineerName: 'BD. CivilLab Architecture Engine',
      },
      moduleMeta: {
        moduleId: 'far-mgc-calculator',
        moduleTitle: 'BNBC 2020 FAR, MGC, SETBACK & PARKING COMPLIANCE REPORT',
        standard: 'BNBC 2020 Part 3 / Dhaka Imarat Nirman Bidhimala',
        status: res.overallCompliant ? ('VERIFIED' as const) : ('WARNING' as const),
      },
      inputs: [
        { name: 'Net Plot Area', symbol: 'A_net', value: `${res.netPlotAreaSqm} (${res.plotAreaKatha} Katha)`, unit: 'm²' },
        { name: 'Effective Front Road Width', symbol: 'W_road', value: res.effectiveRoadWidthM, unit: 'm' },
        { name: 'Plot Frontage × Depth', symbol: 'B × L', value: `${res.frontageM} × ${res.effectivePlotDepthM}`, unit: 'm' },
        { name: 'Occupancy Classification', symbol: 'Type', value: res.occupancyLabel, unit: 'class' },
        { name: 'Proposed Floors & Basements', symbol: 'N / B', value: `${res.proposedFloors}F / ${res.basementCount}B`, unit: 'levels' },
      ],
      outputs: [
        {
          name: 'Allowable vs Proposed FAR',
          symbol: 'FAR',
          value: `${res.proposedFar.toFixed(2)} / ${res.effectiveAllowableFar.toFixed(2)}`,
          unit: 'ratio',
          status: res.farPass ? ('PASS' as const) : ('FAIL' as const),
        },
        {
          name: 'Allowable vs Proposed MGC',
          symbol: 'MGC',
          value: `${res.proposedMgcPercent.toFixed(1)}% / ${res.allowableMgcPercent}%`,
          unit: '%',
          status: res.mgcPass ? ('PASS' as const) : ('FAIL' as const),
        },
        {
          name: 'Max Permissible GFA',
          symbol: 'GFA_max',
          value: res.maxPermissibleGfaSqm,
          unit: 'm²',
          status: 'INFO' as const,
        },
        {
          name: 'Governed Floor Footprint',
          symbol: 'A_foot',
          value: res.governedMaxFootprintSqm,
          unit: 'm²',
          status: 'INFO' as const,
        },
        {
          name: 'Mandatory Setbacks (F/R/S1/S2)',
          symbol: 'SB_min',
          value: `${res.mandatorySetbacks.front}/${res.mandatorySetbacks.rear}/${res.mandatorySetbacks.side1}/${res.mandatorySetbacks.side2}`,
          unit: 'm',
          status: res.setbackChecks.allPass ? ('PASS' as const) : ('FAIL' as const),
        },
        {
          name: 'Required Parking & Ramp Area',
          symbol: 'P_req',
          value: `${res.requiredCarBays}C+${res.requiredMotoBays}M (${res.requiredParkingGrossSqm} m²)`,
          unit: 'bays',
          status: res.parkingPass ? ('PASS' as const) : ('FAIL' as const),
        },
      ],
      governingAssumptions: [
        'FAR & MGC evaluated per BNBC 2020 Part 3 & Dhaka Imarat Nirman Bidhimala land-tier schedule.',
        '1 Katha standardized at customKathaSqFt (default 720 sq.ft = 66.89 m²).',
        'Parking gross area includes 6.0m aisle maneuvering (~26 m²/car) plus 1:8 basement ramp/driveway allowance.',
      ],
    };

    await generateEngineeringPDF(pdfData, {
      filename: `BD_CivilLab_BNBC_FAR_MGC_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Action & Worked Examples Header */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Building className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                BNBC 2020 FAR, MGC, Mandatory Setbacks &amp; Parking Auditor
              </h2>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                  res.overallCompliant
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                }`}
              >
                {res.overallCompliant ? 'CODE COMPLIANT' : 'BY-LAW CHECK REQUIRED'}
              </span>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">
              Dhaka Imarat Nirman Bidhimala · Road-Widening Bonus · Corner Plot &amp; Height Envelope · Parking Bays
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onPushFootprintToBoq && (
              <button
                type="button"
                onClick={handlePushToBoq}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                title="Generate foundation excavation, blinding & floor slab takeoff lines from footprint into active BOQ"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Push Buildable Footprint &amp; Excavation to BOQ</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] flex items-center gap-1.5 transition-opacity cursor-pointer whitespace-nowrap"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Certified PDF</span>
            </button>
          </div>
        </div>

        {/* Cross-Link Confirmation Notice */}
        {boqSentBanner && (
          <div className="mt-3 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Pushed excavation, soling/blinding &amp; {res.proposedFloors}-story slab concrete quantities for {res.proposedGroundCoverageM2} m² footprint to BOQ Estimator.
            </span>
          </div>
        )}

        {/* Worked Examples Presets Strip */}
        <div className="pt-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[var(--md-sys-color-on-surface-variant)] mr-1">
              Worked Examples:
            </span>
            {ARCHITECTURE_FAR_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  title={preset.description}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)]'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleFitMaxPermissibleEnvelope}
            className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)] cursor-pointer transition-colors"
            title="Auto-size proposed footprint, GFA, setbacks and car bays to comply smoothly with BNBC limits"
          >
            Auto-Fit Proposed to BNBC Max
          </button>
        </div>

        {/* Section 1: Plot & Street Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* Land Area & Unit */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                Land Area
              </label>
              <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] font-semibold">
                {res.plotAreaKatha} Katha
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={landAreaValue}
                onChange={(e) => {
                  setActivePresetId('');
                  setLandAreaValue(Math.max(0.1, Number(e.target.value) || 0.1));
                }}
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
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
            <div className="text-[10px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] mt-1">
              {res.netPlotAreaSqm} m² ({res.netPlotAreaSqft.toLocaleString()} sq.ft) · {res.plotCategoryLabel}
            </div>
          </div>

          {/* Occupancy Classification */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Occupancy Classification
            </label>
            <select
              value={occupancyType}
              onChange={(e) => {
                setActivePresetId('');
                setOccupancyType(e.target.value as ArchitectureOccupancyType);
              }}
              className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
            >
              <option value="residential-a1">Residential A1 (Single/Two-Family)</option>
              <option value="residential-a2">Residential A2 (Multi-Family Apt)</option>
              <option value="commercial">Commercial / Office (B/E)</option>
              <option value="mixed-use">Mixed-Use (Commercial + Res)</option>
              <option value="institutional">Institutional / Educational (C/D)</option>
            </select>
            <div className="mt-1.5 flex items-center gap-3 text-[11px]">
              <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-[var(--md-sys-color-on-surface)]">
                <input
                  type="checkbox"
                  checked={isCornerPlot}
                  onChange={(e) => setIsCornerPlot(e.target.checked)}
                  className="rounded border-[var(--md-sys-color-outline-variant)] cursor-pointer"
                />
                <span>Corner Plot (2 Roads)</span>
              </label>
            </div>
          </div>

          {/* Front Road Width & Surrender */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                Front Road Width
              </label>
              <span className="text-[10px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)]">
                {(frontRoadWidthM * 3.28084).toFixed(1)} ft
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.25"
                  min="1.8"
                  value={frontRoadWidthM}
                  onChange={(e) => {
                    setActivePresetId('');
                    setFrontRoadWidthM(Math.max(1.8, Number(e.target.value) || 1.8));
                  }}
                  className="w-full px-2 py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                />
                <span className="text-[10px] font-mono">m</span>
              </div>
              <div className="flex items-center gap-1" title="Road-widening setback surrender strip width (grants FAR bonus)">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="5"
                  value={roadSurrenderWidthM}
                  onChange={(e) => setRoadSurrenderWidthM(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
                />
                <span className="text-[10px] font-mono whitespace-nowrap" title="Surrender Strip (m)">Surr.</span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[
                { label: '16ft', m: 4.88 },
                { label: '20ft', m: 6.1 },
                { label: '30ft', m: 9.14 },
                { label: '40ft', m: 12.19 },
                { label: '60ft', m: 18.29 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setFrontRoadWidthM(p.m)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                    Math.abs(frontRoadWidthM - p.m) < 0.15
                      ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] font-bold'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Plot Geometry */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                Plot Geometry (B × L)
              </label>
              <button
                type="button"
                onClick={() => setIsAutoDimension(!isAutoDimension)}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border cursor-pointer ${
                  isAutoDimension
                    ? 'border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] font-bold'
                    : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                {isAutoDimension ? 'Auto 1:1.6' : 'Manual'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <input
                  type="number"
                  step="0.25"
                  min="3"
                  value={frontageM}
                  disabled={isAutoDimension}
                  onChange={(e) => setFrontageM(Math.max(3, Number(e.target.value) || 3))}
                  className="w-full px-2 py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] disabled:opacity-70"
                />
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  Frontage ({formatFeetInches(frontageM, { isMeters: true })})
                </span>
              </div>
              <div>
                <input
                  type="number"
                  step="0.25"
                  min="3"
                  value={plotDepthM}
                  disabled={isAutoDimension}
                  onChange={(e) => setPlotDepthM(Math.max(3, Number(e.target.value) || 3))}
                  className="w-full px-2 py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] disabled:opacity-70"
                />
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  Depth ({formatFeetInches(plotDepthM, { isMeters: true })})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Proposed Building Envelope, Units & Parking */}
        <div className="mt-4 pt-3.5 border-t border-[var(--md-sys-color-outline-variant)] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Proposed Floors
            </label>
            <input
              type="number"
              min="1"
              max="60"
              step="1"
              value={proposedFloors}
              onChange={(e) => setProposedFloors(Math.max(1, Math.round(Number(e.target.value) || 1)))}
              className="w-full px-2 py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
            />
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              H = {res.buildingHeightM} m
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Proposed GC (m²)
            </label>
            <input
              type="number"
              min="10"
              step="2"
              value={proposedGroundCoverageM2}
              onChange={(e) => setProposedGroundCoverageM2(Math.max(10, Number(e.target.value) || 10))}
              className="w-full px-2 py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
            />
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              {res.proposedMgcPercent.toFixed(1)}% / {res.allowableMgcPercent}%
            </span>
          </div>

          <div className="col-span-2 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Proposed Total GFA (m²)
              </label>
              <button
                type="button"
                onClick={() =>
                  setProposedTotalFloorAreaM2(
                    Number((proposedGroundCoverageM2 * proposedFloors).toFixed(1))
                  )
                }
                className="text-[10px] font-mono text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
              >
                = {proposedFloors} × GC
              </button>
            </div>
            <input
              type="number"
              min="10"
              step="10"
              value={proposedTotalFloorAreaM2}
              onChange={(e) => setProposedTotalFloorAreaM2(Math.max(10, Number(e.target.value) || 10))}
              className="w-full px-2 py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
            />
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Proposed FAR {res.proposedFar.toFixed(2)} vs Max {res.effectiveAllowableFar.toFixed(2)} ({res.proposedTotalFloorAreaSqft.toLocaleString()} sq.ft)
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Basements
            </label>
            <select
              value={basementCount}
              onChange={(e) => setBasementCount(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
            >
              <option value={0}>0 (Stilt Only)</option>
              <option value={1}>1 Basement</option>
              <option value={2}>2 Basements</option>
              <option value={3}>3 Basements</option>
            </select>
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Avail {res.availableParkingAreaSqm} m²
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Units Count
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={unitsCount}
              onChange={(e) => setUnitsCount(Math.max(1, Math.round(Number(e.target.value) || 1)))}
              className="w-full px-2 py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
            />
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Req {res.requiredCarBays} cars
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Avg Unit (m²)
            </label>
            <input
              type="number"
              min="25"
              step="5"
              value={avgUnitAreaSqm}
              onChange={(e) => setAvgUnitAreaSqm(Math.max(25, Number(e.target.value) || 25))}
              className="w-full px-2 py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
            />
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              {Math.round(avgUnitAreaSqm * SQFT_PER_SQM)} sq.ft
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Provided Cars
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={providedCarParkingBays}
              onChange={(e) => setProvidedCarParkingBays(Math.max(0, Math.round(Number(e.target.value) || 0)))}
              className="w-full px-2 py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
            />
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Cap ~{res.estimatedCarCapacity} bays
            </span>
          </div>
        </div>

        {/* Section 3: Provided Setback Verification Strip + Custom Override */}
        <div className="mt-3.5 pt-3 border-t border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Provided Setbacks (m):</span>
            </span>
            {(
              [
                { key: 'front', label: 'Front', pass: res.setbackChecks.frontPass, req: res.mandatorySetbacks.front },
                { key: 'rear', label: 'Rear', pass: res.setbackChecks.rearPass, req: res.mandatorySetbacks.rear },
                { key: 'side1', label: 'Left', pass: res.setbackChecks.side1Pass, req: res.mandatorySetbacks.side1 },
                { key: 'side2', label: isCornerPlot ? 'Right(Rd)' : 'Right', pass: res.setbackChecks.side2Pass, req: res.mandatorySetbacks.side2 },
              ] as const
            ).map((sb) => (
              <label
                key={sb.key}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border ${
                  sb.pass
                    ? 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                }`}
              >
                <span className="text-[10px] font-semibold">{sb.label}:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={providedSetbacks[sb.key]}
                  onChange={(e) =>
                    setProvidedSetbacks((prev) => ({
                      ...prev,
                      [sb.key]: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="w-12 bg-transparent font-bold tabular-nums text-right outline-none"
                />
                <span className="text-[9px] opacity-70">/{sb.req}m</span>
              </label>
            ))}
            <button
              type="button"
              onClick={handleMatchMandatorySetbacks}
              className="px-2 py-1 rounded-lg text-[10px] font-semibold border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] cursor-pointer"
            >
              Match Min
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
            <input
              type="checkbox"
              checked={enableOverride}
              onChange={(e) => setEnableOverride(e.target.checked)}
              className="rounded border-[var(--md-sys-color-outline-variant)] cursor-pointer"
            />
            <Sliders className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
            <span>Custom By-Law Override</span>
          </label>
        </div>

        {enableOverride && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 mt-3 p-3 bg-[var(--md-sys-color-surface-container-low)] rounded-xl border border-[var(--md-sys-color-outline-variant)] text-xs font-mono">
            <div>
              <span className="text-[10px] block font-semibold mb-1">Override FAR</span>
              <input
                type="number"
                step="0.05"
                value={overrideFar}
                onChange={(e) => setOverrideFar(Math.max(0.5, Number(e.target.value) || 0.5))}
                className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold tabular-nums"
              />
            </div>
            <div>
              <span className="text-[10px] block font-semibold mb-1">Override MGC (%)</span>
              <input
                type="number"
                step="0.5"
                value={overrideMgc}
                onChange={(e) => setOverrideMgc(Math.max(10, Math.min(95, Number(e.target.value) || 50)))}
                className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold tabular-nums"
              />
            </div>
            {(
              [
                { key: 'front', label: 'Req Front (m)' },
                { key: 'rear', label: 'Req Rear (m)' },
                { key: 'side1', label: 'Req Side 1 (m)' },
                { key: 'side2', label: 'Req Side 2 (m)' },
              ] as const
            ).map((f) => (
              <div key={f.key}>
                <span className="text-[10px] block font-semibold mb-1">{f.label}</span>
                <input
                  type="number"
                  step="0.1"
                  value={overrideSetbacks[f.key]}
                  onChange={(e) =>
                    setOverrideSetbacks({
                      ...overrideSetbacks,
                      [f.key]: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-bold tabular-nums"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DCR Limit-State Gauges Suite */}
      <DcrGaugeSuite
        gauges={res.dcrGauges}
        moduleKey={`far-mgc-${res.occupancyType}-${res.netPlotAreaSqm}-${res.proposedFloors}`}
        showAllInitially={true}
      />

      {/* Primary KPI Strip (Single-Elevation Tabular Summary) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Effective Allowable FAR
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[var(--md-sys-color-primary)] mt-1">
            {res.effectiveAllowableFar.toFixed(2)}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)] ml-2">
              (Prop: {res.proposedFar.toFixed(2)})
            </span>
          </div>
          <div className="text-[11px] font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
            Max GFA: {res.maxPermissibleGfaSqm.toLocaleString()} m²
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Governed Buildable Footprint
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {res.governedMaxFootprintSqm.toLocaleString()} m²
          </div>
          <div className="text-[11px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] mt-1">
            MGC Limit: {res.allowableMgcPercent}% ({res.maxFootprintByMgcSqm} m²) · Prop: {res.proposedGroundCoverageM2} m²
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Height &amp; Story Envelope
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-1">
            {res.recommendedStories} Stories
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)] ml-1.5">
              ({res.exactStoryRatio.toFixed(1)})
            </span>
          </div>
          <div className="text-[11px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Proposed: {res.proposedFloors} Floors ({res.buildingHeightM} m)
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Required Parking Bays
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-1">
            {res.requiredCarBays} Cars · {res.requiredMotoBays} Moto
          </div>
          <div
            className={`text-[11px] font-mono tabular-nums font-semibold mt-1 ${
              res.parkingPass
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            Req {res.requiredParkingGrossSqm} m² vs Avail {res.availableParkingAreaSqm} m²
          </div>
        </div>
      </div>

      {/* Main Inspection Switch: Interactive 2D CAD Visualizer vs Step-by-Step Hand Calculation Panel */}
      <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnalysisView('cad')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              analysisView === 'cad'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2D Plot &amp; Setback CAD Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setAnalysisView('steps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              analysisView === 'steps'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <BookOpenCheck className="w-3.5 h-3.5" />
            <span>Step-by-Step BNBC 2020 Derivation ({envelope.handCalculationSteps?.length || 0})</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] hidden sm:inline">
          Net Plot {res.frontageM}m × {res.effectivePlotDepthM}m · {res.plotAreaKatha} Katha
        </span>
      </div>

      {analysisView === 'steps' ? (
        <StepByStepPanel
          moduleTitle="BNBC 2020 FAR, MGC & Setbacks"
          steps={envelope.handCalculationSteps}
          scopeAndLimits={envelope.scopeAndLimits}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 7 cols: Interactive 2D Plot & Setback CAD Visualizer */}
          <div className="lg:col-span-7 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                  2D Top-Down CAD Plot &amp; Setback Envelope
                </h3>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)]">
                {res.frontageM}m ({formatFeetInches(res.frontageM, { isMeters: true })}) ×{' '}
                {res.plotDepthM}m ({formatFeetInches(res.plotDepthM, { isMeters: true })}) · {res.plotAreaKatha} Katha
              </span>
            </div>

            <div className="w-full bg-[var(--md-sys-color-surface-container-low)] rounded-xl border border-[var(--md-sys-color-outline-variant)] p-3 flex items-center justify-center">
              {(() => {
                const svgW = 540;
                const svgH = 400;
                const padLeft = 78;
                const padRight = isCornerPlot ? 84 : 64;
                const padTop = 52;
                const padBottom = 68;

                const availW = svgW - padLeft - padRight;
                const availH = svgH - padTop - padBottom;
                const scale = Math.min(availW / res.frontageM, availH / res.plotDepthM);

                const plotW_px = res.frontageM * scale;
                const plotH_px = res.plotDepthM * scale;
                const plotX = padLeft + (availW - plotW_px) / 2;
                const plotY = padTop + (availH - plotH_px) / 2;

                // Road surrender strip at front (bottom)
                const surrender_px = roadSurrenderWidthM * scale;
                const netPlotH_px = Math.max(20, plotH_px - surrender_px);

                // Mandatory setback bands (inside net plot)
                const sbFront_px = res.mandatorySetbacks.front * scale;
                const sbRear_px = res.mandatorySetbacks.rear * scale;
                const sbSide1_px = res.mandatorySetbacks.side1 * scale;
                const sbSide2_px = res.mandatorySetbacks.side2 * scale;

                const envX = plotX + sbSide1_px;
                const envY = plotY + sbRear_px;
                const envW_px = Math.max(12, plotW_px - sbSide1_px - sbSide2_px);
                const envH_px = Math.max(12, netPlotH_px - sbFront_px - sbRear_px);

                // Proposed building footprint box (aspect-matched to buildable envelope)
                const envAreaM2 = Math.max(1, res.maxFootprintBySetbacksSqm);
                const propScaleFactor = Math.sqrt(Math.max(0.1, res.proposedGroundCoverageM2 / envAreaM2));
                const propW_px = envW_px * propScaleFactor;
                const propH_px = envH_px * propScaleFactor;
                const propX = envX + (envW_px - propW_px) / 2;
                const propY = envY + (envH_px - propH_px) / 2;

                const footprintCompliant =
                  res.mgcPass && res.proposedGroundCoverageM2 <= res.maxFootprintBySetbacksSqm + 0.5;

                // Graphical scale bar calculation (pick 5m or 10m bar)
                const barMeters = res.frontageM >= 18 ? 10 : 5;
                const barPx = barMeters * scale;

                const roadY = plotY + plotH_px + 10;
                const roadH = 26;

                return (
                  <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto max-h-[410px]">
                    <defs>
                      <pattern
                        id="setbackHatch"
                        width="8"
                        height="8"
                        patternTransform="rotate(45 0 0)"
                        patternUnits="userSpaceOnUse"
                      >
                        <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.35" />
                      </pattern>
                      <pattern
                        id="surrenderHatch"
                        width="6"
                        height="6"
                        patternTransform="rotate(-45 0 0)"
                        patternUnits="userSpaceOnUse"
                      >
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#ef4444" strokeWidth="1.2" strokeOpacity="0.45" />
                      </pattern>
                      <marker id="cadArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                        <path d="M0,1 L6,3 L0,5 Z" fill="#64748b" />
                      </marker>
                    </defs>

                    {/* North Arrow Rosette (Top Right) */}
                    <g transform={`translate(${svgW - 36}, 34)`}>
                      <circle cx="0" cy="0" r="15" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--md-sys-color-outline)]" />
                      <polygon points="0,-11 4,4 0,1 -4,4" fill="var(--md-sys-color-primary)" />
                      <text x="0" y="-17" textAnchor="middle" className="text-[9px] font-mono font-bold fill-[var(--md-sys-color-on-surface)]">
                        N
                      </text>
                    </g>

                    {/* Outer Plot Area + Setback Zone Shading */}
                    <rect
                      x={plotX}
                      y={plotY}
                      width={plotW_px}
                      height={netPlotH_px}
                      fill="url(#setbackHatch)"
                      stroke="var(--md-sys-color-on-surface)"
                      strokeWidth="2"
                    />

                    {/* Road Widening Surrender Strip */}
                    {surrender_px > 2 && (
                      <g>
                        <rect
                          x={plotX}
                          y={plotY + netPlotH_px}
                          width={plotW_px}
                          height={surrender_px}
                          fill="url(#surrenderHatch)"
                          stroke="#ef4444"
                          strokeWidth="1"
                          strokeDasharray="3 2"
                        />
                        <text
                          x={plotX + plotW_px / 2}
                          y={plotY + netPlotH_px + surrender_px / 2 + 3}
                          textAnchor="middle"
                          className="text-[8px] font-mono font-bold fill-rose-600"
                        >
                          SURRENDER ({roadSurrenderWidthM}m)
                        </text>
                      </g>
                    )}

                    {/* Buildable Setback Envelope (Code Limit Dashed Box) */}
                    <rect
                      x={envX}
                      y={envY}
                      width={envW_px}
                      height={envH_px}
                      fill="var(--md-sys-color-surface)"
                      fillOpacity="0.88"
                      stroke="#0284c7"
                      strokeWidth="1.5"
                      strokeDasharray="5 3"
                    />

                    {/* Proposed Building Footprint Overlay */}
                    <rect
                      x={propX}
                      y={propY}
                      width={propW_px}
                      height={propH_px}
                      fill={footprintCompliant ? '#10b981' : '#ef4444'}
                      fillOpacity="0.22"
                      stroke={footprintCompliant ? '#059669' : '#dc2626'}
                      strokeWidth="2"
                      rx="2"
                    />

                    {/* Building Footprint Center Readout */}
                    <text
                      x={envX + envW_px / 2}
                      y={envY + envH_px / 2 - 12}
                      textAnchor="middle"
                      className="text-[10px] font-mono font-bold fill-[var(--md-sys-color-on-surface)]"
                    >
                      PROPOSED FOOTPRINT ({res.proposedFloors}F{res.basementCount > 0 ? `+${res.basementCount}B` : ''})
                    </text>
                    <text
                      x={envX + envW_px / 2}
                      y={envY + envH_px / 2 + 2}
                      textAnchor="middle"
                      className={`text-[11px] font-mono font-bold ${
                        footprintCompliant ? 'fill-emerald-700 dark:fill-emerald-400' : 'fill-rose-600'
                      }`}
                    >
                      {res.proposedGroundCoverageM2} m² ({Math.round(res.proposedGroundCoverageSqft).toLocaleString()} sq.ft)
                    </text>
                    <text
                      x={envX + envW_px / 2}
                      y={envY + envH_px / 2 + 16}
                      textAnchor="middle"
                      className="text-[9px] font-mono fill-sky-700 dark:fill-sky-400"
                    >
                      Max Envelope: {res.buildableWidthM}m × {res.buildableDepthM}m ({res.governedMaxFootprintSqm} m²)
                    </text>

                    {/* Setback Dimension Callouts */}
                    {/* Rear */}
                    <text
                      x={plotX + plotW_px / 2}
                      y={plotY + Math.max(10, sbRear_px / 2 + 3)}
                      textAnchor="middle"
                      className="text-[8.5px] font-mono font-bold fill-amber-700 dark:fill-amber-400"
                    >
                      Rear SB: {res.mandatorySetbacks.rear}m ({formatFeetInches(res.mandatorySetbacks.rear, { isMeters: true })})
                    </text>
                    {/* Front */}
                    <text
                      x={plotX + plotW_px / 2}
                      y={plotY + netPlotH_px - Math.max(4, sbFront_px / 2 - 3)}
                      textAnchor="middle"
                      className="text-[8.5px] font-mono font-bold fill-amber-700 dark:fill-amber-400"
                    >
                      Front SB: {res.mandatorySetbacks.front}m ({formatFeetInches(res.mandatorySetbacks.front, { isMeters: true })})
                    </text>
                    {/* Left Side */}
                    <text
                      x={plotX + Math.max(8, sbSide1_px / 2)}
                      y={plotY + netPlotH_px / 2}
                      textAnchor="middle"
                      transform={`rotate(-90 ${plotX + Math.max(8, sbSide1_px / 2)} ${plotY + netPlotH_px / 2})`}
                      className="text-[8px] font-mono font-bold fill-amber-700 dark:fill-amber-400"
                    >
                      L: {res.mandatorySetbacks.side1}m
                    </text>
                    {/* Right Side */}
                    <text
                      x={plotX + plotW_px - Math.max(8, sbSide2_px / 2)}
                      y={plotY + netPlotH_px / 2}
                      textAnchor="middle"
                      transform={`rotate(90 ${plotX + plotW_px - Math.max(8, sbSide2_px / 2)} ${plotY + netPlotH_px / 2})`}
                      className="text-[8px] font-mono font-bold fill-amber-700 dark:fill-amber-400"
                    >
                      R: {res.mandatorySetbacks.side2}m
                    </text>

                    {/* Outer Top Dimension Line (Plot Frontage) */}
                    <line x1={plotX} y1={plotY - 14} x2={plotX + plotW_px} y2={plotY - 14} stroke="#64748b" strokeWidth="1" />
                    <line x1={plotX} y1={plotY - 19} x2={plotX} y2={plotY - 9} stroke="#64748b" strokeWidth="1" />
                    <line x1={plotX + plotW_px} y1={plotY - 19} x2={plotX + plotW_px} y2={plotY - 9} stroke="#64748b" strokeWidth="1" />
                    <text
                      x={plotX + plotW_px / 2}
                      y={plotY - 19}
                      textAnchor="middle"
                      className="text-[9px] font-mono font-bold fill-[var(--md-sys-color-on-surface)]"
                    >
                      Frontage: {res.frontageM}m ({formatFeetInches(res.frontageM, { isMeters: true })}) · {res.plotAreaKatha} Katha
                    </text>

                    {/* Outer Left Dimension Line (Plot Depth) */}
                    <line x1={plotX - 16} y1={plotY} x2={plotX - 16} y2={plotY + plotH_px} stroke="#64748b" strokeWidth="1" />
                    <line x1={plotX - 21} y1={plotY} x2={plotX - 11} y2={plotY} stroke="#64748b" strokeWidth="1" />
                    <line x1={plotX - 21} y1={plotY + plotH_px} x2={plotX - 11} y2={plotY + plotH_px} stroke="#64748b" strokeWidth="1" />
                    <text
                      x={plotX - 24}
                      y={plotY + plotH_px / 2}
                      textAnchor="middle"
                      transform={`rotate(-90 ${plotX - 24} ${plotY + plotH_px / 2})`}
                      className="text-[9px] font-mono font-bold fill-[var(--md-sys-color-on-surface)]"
                    >
                      Depth: {res.plotDepthM}m ({formatFeetInches(res.plotDepthM, { isMeters: true })})
                    </text>

                    {/* Front Access Road Strip */}
                    <rect x={plotX - 24} y={roadY} width={plotW_px + 48} height={roadH} fill="#334155" rx="3" />
                    <line
                      x1={plotX - 20}
                      y1={roadY + roadH / 2}
                      x2={plotX + plotW_px + 20}
                      y2={roadY + roadH / 2}
                      stroke="#e2e8f0"
                      strokeWidth="1.2"
                      strokeDasharray="6 6"
                    />
                    <text
                      x={plotX + plotW_px / 2}
                      y={roadY + roadH / 2 + 3}
                      textAnchor="middle"
                      className="text-[9px] font-mono font-bold fill-white tracking-wide"
                    >
                      FRONT ACCESS ROAD: {res.frontRoadWidthM}m ({(res.frontRoadWidthM * 3.28084).toFixed(1)} ft)
                    </text>

                    {/* Secondary Corner Access Road Strip (Right Side) */}
                    {isCornerPlot && (
                      <g>
                        <rect
                          x={plotX + plotW_px + 10}
                          y={plotY - 10}
                          width={24}
                          height={plotH_px + 46}
                          fill="#334155"
                          rx="3"
                        />
                        <line
                          x1={plotX + plotW_px + 22}
                          y1={plotY - 6}
                          x2={plotX + plotW_px + 22}
                          y2={plotY + plotH_px + 32}
                          stroke="#e2e8f0"
                          strokeWidth="1.2"
                          strokeDasharray="6 6"
                        />
                        <text
                          x={plotX + plotW_px + 22}
                          y={plotY + plotH_px / 2}
                          textAnchor="middle"
                          transform={`rotate(90 ${plotX + plotW_px + 22} ${plotY + plotH_px / 2})`}
                          className="text-[8.5px] font-mono font-bold fill-white tracking-wider"
                        >
                          CORNER SIDE ROAD
                        </text>
                      </g>
                    )}

                    {/* Graphical Scale Bar (Bottom Left) */}
                    <g transform={`translate(16, ${svgH - 22})`}>
                      <rect x="0" y="0" width={barPx / 2} height="5" fill="var(--md-sys-color-on-surface)" />
                      <rect
                        x={barPx / 2}
                        y="0"
                        width={barPx / 2}
                        height="5"
                        fill="none"
                        stroke="var(--md-sys-color-on-surface)"
                        strokeWidth="1"
                      />
                      <text x="0" y="15" className="text-[8px] font-mono fill-[var(--md-sys-color-on-surface-variant)]">
                        0
                      </text>
                      <text x={barPx / 2} y="15" textAnchor="middle" className="text-[8px] font-mono fill-[var(--md-sys-color-on-surface-variant)]">
                        {barMeters / 2}m
                      </text>
                      <text x={barPx} y="15" textAnchor="middle" className="text-[8px] font-mono fill-[var(--md-sys-color-on-surface-variant)]">
                        {barMeters}m
                      </text>
                    </g>
                  </svg>
                );
              })()}
            </div>

            {/* CAD Legend Bar */}
            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-500/30 border border-amber-500/60" />
                <span>Mandatory Setback Zone</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs border border-sky-600 border-dashed" />
                <span>Max Buildable Envelope</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500/30 border border-emerald-600" />
                <span>Proposed Building Footprint</span>
              </span>
            </div>
          </div>

          {/* Right 5 cols: Setback Audit Schedule & Parking Capacity Table */}
          <div className="lg:col-span-5 space-y-4">
            {/* Setback Compliance Table */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)] mb-3 pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                Setback Compliance Schedule (BNBC 2020)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[10px] uppercase text-[var(--md-sys-color-on-surface-variant)]">
                      <th className="py-1.5 text-left">Boundary</th>
                      <th className="py-1.5 text-right">Required</th>
                      <th className="py-1.5 text-right">Provided</th>
                      <th className="py-1.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/50">
                    {(
                      [
                        {
                          label: 'Front (Road)',
                          req: res.mandatorySetbacks.front,
                          prov: res.providedSetbacks.front,
                          pass: res.setbackChecks.frontPass,
                        },
                        {
                          label: 'Rear',
                          req: res.mandatorySetbacks.rear,
                          prov: res.providedSetbacks.rear,
                          pass: res.setbackChecks.rearPass,
                        },
                        {
                          label: 'Left Side (1)',
                          req: res.mandatorySetbacks.side1,
                          prov: res.providedSetbacks.side1,
                          pass: res.setbackChecks.side1Pass,
                        },
                        {
                          label: isCornerPlot ? 'Right (Road)' : 'Right Side (2)',
                          req: res.mandatorySetbacks.side2,
                          prov: res.providedSetbacks.side2,
                          pass: res.setbackChecks.side2Pass,
                        },
                      ] as const
                    ).map((row) => (
                      <tr key={row.label}>
                        <td className="py-2 font-semibold text-[var(--md-sys-color-on-surface)]">
                          {row.label}
                        </td>
                        <td className="py-2 text-right text-[var(--md-sys-color-on-surface-variant)]">
                          {row.req.toFixed(2)} m
                        </td>
                        <td className="py-2 text-right font-bold text-[var(--md-sys-color-on-surface)]">
                          {row.prov.toFixed(2)} m
                        </td>
                        <td className="py-2 text-right">
                          <span
                            className={`font-bold ${
                              row.pass
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {row.pass ? 'PASS' : 'DEFICIT'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Parking Bays & Basement Allowance Summary */}
            <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Parking &amp; Basement Ramp Schedule</span>
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    res.parkingPass
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {res.parkingPass ? 'ADEQUATE' : 'SHORTFALL'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Required Car Bays (2.5m × 5.0m):</span>
                  <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                    {res.requiredCarBays} Nos (Provided: {res.providedCarBays})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Required Motorcycle Bays:</span>
                  <span className="font-bold text-[var(--md-sys-color-on-surface)]">{res.requiredMotoBays} Nos</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">
                    {res.basementCount > 0 ? '1:8 Ramp & Driveway Allowance:' : 'Ground Driveway Allowance:'}
                  </span>
                  <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                    {res.rampAndDrivewayAllowanceSqm} m²
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[var(--md-sys-color-outline-variant)]/60">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Total Gross Parking Required:</span>
                  <span className="font-bold text-[var(--md-sys-color-primary)]">{res.requiredParkingGrossSqm} m²</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Available Parking Floor Area:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {res.availableParkingAreaSqm} m² (~{res.estimatedCarCapacity} cars)
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[var(--md-sys-color-outline-variant)]/60">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Open Space vs Footprint:</span>
                  <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                    {res.openSpaceSqm} m² ({res.openSpacePercent}% Open)
                  </span>
                </div>
              </div>
            </div>

            {/* Active Warnings / Issues */}
            {envelope.issues.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5 text-xs">
                <div className="font-bold font-mono text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Active Code Advisory Items ({envelope.issues.length})</span>
                </div>
                <ul className="space-y-1 text-[11px] font-mono text-amber-900 dark:text-amber-200 list-disc pl-4">
                  {envelope.issues.map((iss, i) => (
                    <li key={i}>{iss.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
