import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  Layers,
  Droplets,
  Building,
  TrendingUp,
  CheckCircle2,
  Sun,
  FileDown,
  Printer,
} from 'lucide-react';
import { FarMgcCalculator } from '../calculators/architecture/FarMgcCalculator';
import { StaircaseDesigner } from '../calculators/architecture/StaircaseDesigner';
import { BuildingServicesSizer } from '../calculators/architecture/BuildingServicesSizer';
import {
  BuildingServicesEnvPlanner,
  ServicesSubMode,
} from '../calculators/architecture/BuildingServicesEnvPlanner';
import { AboutThisTool, AboutThisToolButton } from '../ui';
import { BRAND_LOGO_SRC } from '../Logo';
import {
  ArchitectureParameters,
  ArchitectureTab,
  TakeoffLineItem,
  RebarBBSParameters,
  FarMgcParameters,
  StaircaseParameters,
  WaterTankParameters,
  SepticTankParameters,
  RainwaterDaylightParameters,
  UserProfile,
} from '../../types/civil';
import { createDefaultArchitectureParameters } from '../../utils/storage';
import {
  buildBoqItemsFromRwhCistern,
  buildBoqItemsFromTanks,
  buildRebarParamsFromTank,
  computeArchitectureFarMgc,
  computeDaylightVentilationDesign,
  computeRainwaterHarvestingDesign,
  computeSepticSoakPitDesign,
  computeStaircaseDesign,
  computeWaterReservoirDesign,
} from '../../utils/architectureEngine';
import {
  ArchitectureSubmittalPayload,
  exportArchitectureSubmittalPDF,
  printArchitectureSubmittalA4,
} from '../../utils/exportEngine';

export type { ArchitectureTab };

export interface ArchitectureByLawsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ArchitectureTab;
  architecture?: ArchitectureParameters;
  onUpdateArchitecture?: (updater: (prev: ArchitectureParameters) => ArchitectureParameters) => void;
  onSendTankToBOQ?: (items: TakeoffLineItem[]) => void;
  onPushFootprintToBoq?: (items: TakeoffLineItem[]) => void;
  onSendStaircaseToRebar?: (stairParams: Partial<RebarBBSParameters>) => void;
  onSendStaircaseToBoq?: (items: TakeoffLineItem[]) => void;
  onSendTankToRebar?: (rebarParams: Partial<RebarBBSParameters>) => void;
  userProfile?: UserProfile;
  projectName?: string;
  projectCode?: string;
  siteLocation?: string;
}

export const ArchitectureByLawsModal: React.FC<ArchitectureByLawsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'far',
  architecture,
  onUpdateArchitecture,
  onSendTankToBOQ,
  onPushFootprintToBoq,
  onSendStaircaseToRebar,
  onSendStaircaseToBoq,
  onSendTankToRebar,
  userProfile,
  projectName,
  projectCode,
  siteLocation,
}) => {
  const [activeTab, setActiveTab] = useState<ArchitectureTab>(initialTab);
  const [servicesSubMode, setServicesSubMode] = useState<ServicesSubMode>('rainwater');
  const [tankSentNotice, setTankSentNotice] = useState<boolean>(false);
  const [stairSentNotice, setStairSentNotice] = useState<boolean>(false);
  const [tankRebarNotice, setTankRebarNotice] = useState<boolean>(false);
  const [exportBusy, setExportBusy] = useState<'pdf' | 'print' | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Active architecture snapshot with clean fallback
  const arch: ArchitectureParameters = architecture || createDefaultArchitectureParameters();

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const handleUpdateFar = (farMgc: FarMgcParameters) => {
    onUpdateArchitecture?.((prev) => ({
      ...prev,
      farMgc,
      occupancyType: farMgc.occupancyType,
      plotAreaCategory: farMgc.plotAreaCategory,
      frontRoadWidthM: farMgc.frontRoadWidthM ?? farMgc.roadWidthM,
      proposedFloors: farMgc.proposedFloors,
      proposedGroundCoverageM2: farMgc.proposedGroundCoverageM2,
      proposedTotalFloorAreaM2: farMgc.proposedTotalFloorAreaM2,
      basementCount: farMgc.basementCount,
      unitsCount: farMgc.unitsCount,
      avgUnitAreaSqm: farMgc.avgUnitAreaSqm,
    }));
  };

  const handleUpdateStair = (staircase: StaircaseParameters) => {
    onUpdateArchitecture?.((prev) => ({
      ...prev,
      staircase,
      stairTopology: staircase.stairTopology,
      buildingOccupancy: staircase.buildingOccupancy,
      floorToFloorHeightM:
        staircase.floorToFloorHeightM ?? Number((staircase.floorHeightMm / 1000).toFixed(3)),
      riserHeightMm: staircase.riserHeightMm ?? staircase.preferredRiserMm,
      treadWidthMm: staircase.treadWidthMm ?? staircase.preferredTreadMm,
      flightWidthMm: staircase.flightWidthMm,
      landingWidthMm: staircase.landingWidthMm,
      waistSlabThicknessMm: staircase.waistSlabThicknessMm ?? staircase.waistSlabMm,
      wellGapMm: staircase.wellGapMm,
    }));
  };

  const handleUpdateWater = (waterTank: WaterTankParameters) => {
    onUpdateArchitecture?.((prev) => ({ ...prev, waterTank }));
  };

  const handleUpdateSeptic = (septicTank: SepticTankParameters) => {
    onUpdateArchitecture?.((prev) => ({ ...prev, septicTank }));
  };

  const handleUpdateRainwaterDaylight = (rainwaterDaylight: RainwaterDaylightParameters) => {
    onUpdateArchitecture?.((prev) => ({ ...prev, rainwaterDaylight }));
  };

  const handleDirectSendTankToBOQ = () => {
    if (!onSendTankToBOQ) return;
    if (activeTab === 'services') {
      const defaults = createDefaultArchitectureParameters();
      const rwhEnv = computeRainwaterHarvestingDesign(
        arch.rainwaterDaylight || defaults.rainwaterDaylight!
      );
      if (rwhEnv.result) {
        onSendTankToBOQ(buildBoqItemsFromRwhCistern(rwhEnv.result));
        setTankSentNotice(true);
        setTimeout(() => setTankSentNotice(false), 4000);
      }
      return;
    }

    const waterEnv = computeWaterReservoirDesign(arch.waterTank);
    const septicEnv = computeSepticSoakPitDesign(arch.septicTank);
    if (!waterEnv.result || !septicEnv.result) return;
    const items = buildBoqItemsFromTanks(waterEnv.result, septicEnv.result, {
      includeExcavation: true,
      includeWaterRcc: true,
      includeSepticMasonrySlabs: true,
    });
    onSendTankToBOQ(items);
    setTankSentNotice(true);
    setTimeout(() => setTankSentNotice(false), 4000);
  };

  const handleDirectSendTankToRebar = (rebarParams?: Partial<RebarBBSParameters>) => {
    if (!onSendTankToRebar) return;
    if (rebarParams) {
      onSendTankToRebar(rebarParams);
    } else {
      const waterEnv = computeWaterReservoirDesign(arch.waterTank);
      const septicEnv = computeSepticSoakPitDesign(arch.septicTank);
      if (!waterEnv.result || !septicEnv.result) return;
      const target = activeTab === 'septictank' ? 'septic' : 'ugwr';
      onSendTankToRebar(buildRebarParamsFromTank(target, waterEnv.result, septicEnv.result));
    }
    setTankRebarNotice(true);
    setTimeout(() => setTankRebarNotice(false), 4000);
  };

  const handleDirectSendStaircaseToRebar = () => {
    if (!onSendStaircaseToRebar) return;
    const sc = arch.staircase;
    const targetRisers = Math.max(
      3,
      Math.round(sc.floorHeightMm / Math.max(50, sc.preferredRiserMm))
    );
    const actualRiserMm = sc.floorHeightMm / targetRisers;
    const risersFlight1 = Math.ceil(targetRisers / 2);
    const treadsFlight1 = Math.max(1, risersFlight1 - 1);
    const goingLengthMm = treadsFlight1 * sc.preferredTreadMm;

    onSendStaircaseToRebar({
      stairGoingM: Number((goingLengthMm / 1000).toFixed(2)),
      stairTotalRiseM: Number((sc.floorHeightMm / 1000).toFixed(2)),
      waistSlabThicknessMm: sc.waistSlabMm,
      riserMm: Math.round(actualRiserMm),
      treadMm: sc.preferredTreadMm,
      landingLengthM: Number((sc.landingWidthMm / 1000).toFixed(2)),
    });
    setStairSentNotice(true);
    setTimeout(() => setStairSentNotice(false), 4000);
  };

  const collectActiveCadSvgs = (): SVGSVGElement[] => {
    if (!modalContentRef.current) return [];
    const allSvgs = Array.from(modalContentRef.current.querySelectorAll('svg'));
    return allSvgs.filter((svg) => {
      if (svg.dataset.archSvg === 'true') return true;
      const vbWidth = svg.viewBox?.baseVal?.width || 0;
      return vbWidth >= 250;
    });
  };

  const buildActiveSubmittalPayload = (): ArchitectureSubmittalPayload => {
    const svgElements = collectActiveCadSvgs();
    const defaults = createDefaultArchitectureParameters();
    const baseMeta = {
      projectName: projectName || 'Building Development Project',
      projectCode: projectCode || 'ARC-01',
      siteLocation: siteLocation || 'Dhaka / Municipal Jurisdiction',
      userProfile,
      brandLogoSrc: BRAND_LOGO_SRC,
      svgElements,
    };

    if (activeTab === 'far') {
      const env = computeArchitectureFarMgc(arch.farMgc, arch);
      const r = env.result!;
      return {
        ...baseMeta,
        tabId: 'far',
        tabTitle: 'FAR, MGC, Setbacks & Parking Compliance Audit',
        codeStandard: 'BNBC 2020 Part 3 & Imarat Nirman Bidhimala',
        status: r.overallCompliant ? 'PASS' : r.farPass && r.mgcPass ? 'WARNING' : 'FAIL',
        inputs: [
          { name: 'Plot Area Input', symbol: 'A_plot', value: `${r.landAreaInput} ${r.landUnit.toUpperCase()}`, unit: 'area', notes: `${r.grossPlotAreaSqm} m² (${r.plotAreaKatha} Katha)` },
          { name: 'Occupancy Category', symbol: 'Occ', value: r.occupancyLabel, unit: 'class', notes: r.plotCategoryLabel },
          { name: 'Front Road Width', symbol: 'W_rd', value: r.effectiveRoadWidthM, unit: 'm', notes: `${(r.effectiveRoadWidthM * 3.28084).toFixed(1)} ft effective` },
          { name: 'Proposed Floors & Coverage', symbol: 'N / GC', value: `${r.proposedFloors}F / ${r.proposedGroundCoverageM2} m²`, unit: 'stories/m²', notes: `Proposed GFA ${r.proposedTotalFloorAreaM2} m²` },
          { name: 'Provided Setbacks (F/R/S1/S2)', symbol: 'SB', value: `${r.providedSetbacks.front}/${r.providedSetbacks.rear}/${r.providedSetbacks.side1}/${r.providedSetbacks.side2}`, unit: 'm', notes: r.isCornerPlot ? 'Corner plot' : 'Standard plot' },
        ],
        dcrSummary: r.dcrGauges.map((g) => ({
          label: g.metricLabel,
          demand: g.formattedValue,
          capacity: g.referenceLimit || 'Allowable',
          ratio: Number((g.percentage / 100).toFixed(2)),
          status: g.status === 'safe' ? 'PASS' : g.status === 'warning' ? 'WARNING' : 'FAIL',
        })),
        steps: (env.handCalculationSteps || []).map((s) => ({
          stepNumber: s.stepNumber,
          title: s.title,
          formula: s.formula,
          substitution: s.substitution,
          result: s.result,
          reasoning: s.reasoning,
        })),
      };
    }

    if (activeTab === 'staircase') {
      const env = computeStaircaseDesign(arch.staircase, arch);
      const r = env.result!;
      return {
        ...baseMeta,
        tabId: 'staircase',
        tabTitle: 'Staircase Ergonomics, Egress & Waist-Slab Quantities',
        codeStandard: 'BNBC 2020 Part 3 & Part 4 (Blondel 2R+T)',
        status: r.overallCompliant ? 'PASS' : r.blondelPass && r.headroomPass ? 'WARNING' : 'FAIL',
        inputs: [
          { name: 'Staircase Topology', symbol: 'Type', value: r.topologyLabel, unit: 'config', notes: r.occupancyLabel },
          { name: 'Floor-to-Floor Height', symbol: 'H', value: r.floorHeightMm, unit: 'mm', notes: `${r.totalRisers} risers (${r.risersPerFlight.join('+')} per flight)` },
          { name: 'Actual Riser / Tread', symbol: 'R / T', value: `${r.actualRiserMm} / ${r.actualTreadMm}`, unit: 'mm', notes: `Pitch ${r.stairPitchDeg}°` },
          { name: 'Flight & Landing Width', symbol: 'W / L_w', value: `${r.flightWidthMm} / ${r.landingWidthMm}`, unit: 'mm', notes: `Waist slab ${r.waistSlabMm} mm` },
          { name: 'Stairwell Envelope', symbol: 'L × W', value: `${r.stairwellLengthMm} × ${r.stairwellWidthMm}`, unit: 'mm', notes: `Concrete ${r.totalConcreteM3} m³ / story` },
        ],
        dcrSummary: r.dcrGauges.map((g) => ({
          label: g.metricLabel,
          demand: g.formattedValue,
          capacity: g.referenceLimit || 'Code Limit',
          ratio: Number((g.percentage / 100).toFixed(2)),
          status: g.status === 'safe' ? 'PASS' : g.status === 'warning' ? 'WARNING' : 'FAIL',
        })),
        steps: (env.handCalculationSteps || []).map((s) => ({
          stepNumber: s.stepNumber,
          title: s.title,
          formula: s.formula,
          substitution: s.substitution,
          result: s.result,
          reasoning: s.reasoning,
        })),
      };
    }

    if (activeTab === 'watertank') {
      const env = computeWaterReservoirDesign(arch.waterTank);
      const r = env.result!;
      return {
        ...baseMeta,
        tabId: 'watertank',
        tabTitle: 'UGWR & OHT Potable / Fire Reservoir & Pump Sizing',
        codeStandard: 'BNBC 2020 Part 8 Ch. 5 / IS 1172 / NFPA 22',
        status: r.overallCompliant ? 'PASS' : 'WARNING',
        inputs: [
          { name: 'Occupancy Demand Standard', symbol: 'LPCD', value: `${r.lpcd} L/p/d`, unit: 'LPCD', notes: `${r.totalUsers} users (${r.occupancyLabel})` },
          { name: 'UGWR Volume (incl. Fire)', symbol: 'V_ugwr', value: `${Math.round(r.ugwrTotalL).toLocaleString()} L`, unit: 'L', notes: `${r.ugwrLengthM.toFixed(2)}m × ${r.ugwrWidthM.toFixed(2)}m × ${r.ugwrTotalHeightM.toFixed(2)}m` },
          { name: 'OHT Roof Volume', symbol: 'V_oht', value: `${Math.round(r.ohtTotalL).toLocaleString()} L`, unit: 'L', notes: `${r.ohtLengthM.toFixed(2)}m × ${r.ohtWidthM.toFixed(2)}m × ${r.ohtTotalHeightM.toFixed(2)}m` },
          { name: 'OHT Dead Load on Roof', symbol: 'W_oht', value: `${r.ohtTotalDeadLoadKn} kN`, unit: 'kN', notes: `${r.ohtTotalDeadLoadTonnes} MT (${r.ohtRoofSlabPressureKpa} kN/m²)` },
          { name: 'Transfer Pump Duty', symbol: 'Q / H', value: `${r.pumpFlowLpm} L/min (${r.pumpFlowM3Hr} m³/hr)`, unit: 'flow', notes: `${r.recommendedHp} HP @ ${r.totalHeadM}m TDH` },
        ],
        dcrSummary: r.dcrGauges.map((g) => ({
          label: g.metricLabel,
          demand: g.formattedValue,
          capacity: g.referenceLimit || 'Limit',
          ratio: Number((g.percentage / 100).toFixed(2)),
          status: g.status === 'safe' ? 'PASS' : g.status === 'warning' ? 'WARNING' : 'FAIL',
        })),
        steps: (env.handCalculationSteps || []).map((s) => ({
          stepNumber: s.stepNumber,
          title: s.title,
          formula: s.formula,
          substitution: s.substitution,
          result: s.result,
          reasoning: s.reasoning,
        })),
      };
    }

    if (activeTab === 'septictank') {
      const env = computeSepticSoakPitDesign(arch.septicTank);
      const r = env.result!;
      return {
        ...baseMeta,
        tabId: 'septictank',
        tabTitle: '2-Chamber Septic Tank & Brick Soak Pit Design',
        codeStandard: 'BNBC 2020 Part 8 Ch. 6 / IS 2470',
        status: r.overallCompliant ? 'PASS' : r.soilSuitableForSoakPit ? 'WARNING' : 'FAIL',
        inputs: [
          { name: 'Design Users & Sewage Rate', symbol: 'P / q', value: `${r.septicUsers} / ${r.sewageRateLpcd}`, unit: 'p / LPCD', notes: `Daily flow ${Math.round(r.dailySewageL).toLocaleString()} L/day` },
          { name: 'Detention & Desludging', symbol: 't / N', value: `${r.detentionHours}h / ${r.desludgingYears} yr`, unit: 'hr / yr', notes: `Total cap ${r.totalSepticVolumeM3.toFixed(2)} m³` },
          { name: 'Septic Tank Clear Geometry', symbol: 'L×W×H', value: `${r.tankLengthM.toFixed(2)}×${r.tankWidthM.toFixed(2)}×${r.totalTankHeightM.toFixed(2)}`, unit: 'm', notes: `C1=${r.chamber1LengthM.toFixed(2)}m, C2=${r.chamber2LengthM.toFixed(2)}m` },
          { name: 'Soil Percolation Time', symbol: 't_p', value: `${r.soilPercolationMinPer25mm} min/25mm`, unit: 'min', notes: `Infiltration ${r.soilInfiltrationRateLpdM2} L/m²/day` },
          { name: 'Soak Pit Geometry', symbol: 'Ø × D', value: `${r.soakPitDiaM.toFixed(1)}m × ${r.soakPitTotalDepthM.toFixed(2)}m`, unit: 'm', notes: `Sidewall area ${r.requiredAbsorptionAreaM2.toFixed(1)} m²` },
        ],
        dcrSummary: r.dcrGauges.map((g) => ({
          label: g.metricLabel,
          demand: g.formattedValue,
          capacity: g.referenceLimit || 'IS 2470',
          ratio: Number((g.percentage / 100).toFixed(2)),
          status: g.status === 'safe' ? 'PASS' : g.status === 'warning' ? 'WARNING' : 'FAIL',
        })),
        steps: (env.handCalculationSteps || []).map((s) => ({
          stepNumber: s.stepNumber,
          title: s.title,
          formula: s.formula,
          substitution: s.substitution,
          result: s.result,
          reasoning: s.reasoning,
        })),
      };
    }

    // activeTab === 'services'
    const rwhParams = arch.rainwaterDaylight || defaults.rainwaterDaylight!;
    if (servicesSubMode === 'rainwater') {
      const env = computeRainwaterHarvestingDesign(rwhParams);
      const r = env.result!;
      return {
        ...baseMeta,
        tabId: 'services-rainwater',
        tabTitle: 'Rainwater Harvesting (RWH) Catchment & Cistern Sizer',
        codeStandard: 'BNBC 2020 Part 8 §5.6 / PWD Sustainability',
        status: r.overallCompliant ? 'PASS' : 'WARNING',
        inputs: [
          { name: 'Roof Catchment Area', symbol: 'A_roof', value: r.roofCatchmentAreaM2, unit: 'm²', notes: `Runoff Cr = ${r.runoffCoefficient}` },
          { name: 'Annual Rainfall & Monsoon Share', symbol: 'R_yr', value: `${r.annualRainfallMm} mm (${r.monsoonCaptureSharePct}%)`, unit: 'mm', notes: `Annual yield ${r.annualHarvestableM3.toFixed(1)} m³/yr` },
          { name: 'Dry-Spell Buffer & Demand', symbol: 't_dry / Q', value: `${r.drySpellDays} d / ${r.dailyRwhDemandLpd} LPD`, unit: 'd / LPD', notes: `Target ${Math.round(r.requiredDrySpellCisternL).toLocaleString()} L` },
          { name: 'Recommended Cistern Geometry', symbol: 'L×W×H', value: `${r.cisternLengthM.toFixed(2)}×${r.cisternWidthM.toFixed(2)}×${r.cisternTotalHeightM.toFixed(2)}`, unit: 'm', notes: `${Math.round(r.recommendedCisternL).toLocaleString()} L (${r.demandCoveragePct}% demand)` },
        ],
        dcrSummary: r.dcrGauges.map((g) => ({
          label: g.metricLabel,
          demand: g.formattedValue,
          capacity: g.referenceLimit || 'Limit',
          ratio: Number((g.percentage / 100).toFixed(2)),
          status: g.status === 'safe' ? 'PASS' : g.status === 'warning' ? 'WARNING' : 'FAIL',
        })),
        steps: (env.handCalculationSteps || []).map((s) => ({
          stepNumber: s.stepNumber,
          title: s.title,
          formula: s.formula,
          substitution: s.substitution,
          result: s.result,
          reasoning: s.reasoning,
        })),
      };
    }

    const dlEnv = computeDaylightVentilationDesign(rwhParams);
    const d = dlEnv.result!;
    return {
      ...baseMeta,
      tabId: 'services-daylight',
      tabTitle: 'Habitable Room Daylight, Ventilation & Ergonomics Audit',
      codeStandard: 'BNBC 2020 Part 3 Ch. 1 & Ch. 3',
      status: d.overallCompliant ? 'PASS' : d.areaPass && d.widthPass && d.heightPass ? 'WARNING' : 'FAIL',
      inputs: [
        { name: 'Room Label & Occupancy', symbol: 'Space', value: `${d.roomName} (${d.roomOccupancyType})`, unit: 'type', notes: `${d.roomLengthM}m × ${d.roomWidthM}m = ${d.floorAreaM2} m²` },
        { name: 'Clear Ceiling Height', symbol: 'H_ceil', value: d.ceilingHeightM, unit: 'm', notes: `Min required ${d.minRequiredHeightM} m` },
        { name: 'Glazed Window Area & Daylight', symbol: 'R_day', value: `${d.totalGlazedWindowAreaM2} m² (${d.daylightRatioPct}%)`, unit: '%', notes: `BNBC Min ${d.minRequiredDaylightPct}%` },
        { name: 'Openable Ventilation + Louver', symbol: 'R_vent', value: `${d.totalVentilationOpeningM2} m² (${d.ventilationRatioPct}%)`, unit: '%', notes: `BNBC Min ${d.minRequiredVentilationPct}%` },
      ],
      dcrSummary: d.dcrGauges.map((g) => ({
        label: g.metricLabel,
        demand: g.formattedValue,
        capacity: g.referenceLimit || 'BNBC Min',
        ratio: Number((g.percentage / 100).toFixed(2)),
        status: g.status === 'safe' ? 'PASS' : g.status === 'warning' ? 'WARNING' : 'FAIL',
      })),
      steps: (dlEnv.handCalculationSteps || []).map((s) => ({
        stepNumber: s.stepNumber,
        title: s.title,
        formula: s.formula,
        substitution: s.substitution,
        result: s.result,
        reasoning: s.reasoning,
      })),
    };
  };

  const handleExportSubmittalPdf = async () => {
    try {
      setExportBusy('pdf');
      const payload = buildActiveSubmittalPayload();
      await exportArchitectureSubmittalPDF(payload);
    } finally {
      setExportBusy(null);
    }
  };

  const handlePrintSubmittalA4 = async () => {
    try {
      setExportBusy('print');
      const payload = buildActiveSubmittalPayload();
      await printArchitectureSubmittalA4(payload);
    } finally {
      setExportBusy(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl max-h-[92vh] bg-[var(--md-sys-color-surface,#ffffff)] dark:bg-slate-900 border border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-[var(--md-sys-color-surface-container-lowest,#fafafa)] dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface,#0f172a)] dark:text-white">
                    Architecture, Space Planning &amp; Building Services Suite
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[var(--md-sys-color-on-surface-variant,#64748b)] dark:text-slate-400 font-mono">
                    BNBC 2020 · FAR &amp; Setbacks · Staircase · UGWR &amp; OHT · Septic &amp; Soak Well · Rainwater &amp; Daylight
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportSubmittalPdf}
                  disabled={exportBusy !== null}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Export certified A4 submittal PDF with 2D CAD schematic, compliance summary & derivations"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{exportBusy === 'pdf' ? 'Compiling PDF...' : 'Export Submittal PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintSubmittalA4}
                  disabled={exportBusy !== null}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700 disabled:opacity-60 text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open clean A4 print sheet with embedded CAD diagram and engineer signature stamp"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{exportBusy === 'print' ? 'Preparing Print...' : 'Print A4'}</span>
                </button>
                <AboutThisToolButton
                  toolId={`architecture-${activeTab}`}
                  onClick={() => {
                    document.getElementById(`arch-doc-${activeTab}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-2 border-b border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 bg-[var(--md-sys-color-surface-container-low,#f8fafc)] dark:bg-slate-900/60 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('far')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'far'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>FAR, MGC &amp; Setbacks</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('staircase')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'staircase'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Staircase Geometry &amp; Ergonomics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('watertank')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'watertank'
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <Droplets className="w-4 h-4" />
                <span>Water Reservoirs (UGWR &amp; OHT)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('septictank')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'septictank'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Septic Tank &amp; Soak Well</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'services'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Rainwater, Daylight &amp; Ventilation</span>
              </button>
            </div>

            {/* Quick Action Toolbar Linking Architecture to BOQ & Rebar BBS */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-[var(--md-sys-color-outline-variant,#e2e8f0)] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  Cross-Module Estimation Workflows:
                </span>
                {tankSentNotice && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {activeTab === 'services' ? 'RWH Cistern Sent to BOQ' : 'Tank Quantities Sent to BOQ'}
                  </span>
                )}
                {stairSentNotice && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Staircase Sent to Rebar BBS
                  </span>
                )}
                {tankRebarNotice && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tank Slab Sent to Rebar BBS
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDirectSendTankToBOQ}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Compute Tank / Cistern concrete & brickwork volumes and push directly to BOQ"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    {activeTab === 'services'
                      ? 'Send RWH Cistern to BOQ'
                      : 'Send Tank Concrete & Brickwork to BOQ'}
                  </span>
                </button>

                {(activeTab === 'watertank' || activeTab === 'septictank') && onSendTankToRebar && (
                  <button
                    type="button"
                    onClick={() => handleDirectSendTankToRebar()}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Transfer active tank slab geometry directly into Rebar BBS"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>
                      {activeTab === 'septictank' ? 'Send Septic Cover to Rebar BBS' : 'Send UGWR Slab to Rebar BBS'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDirectSendStaircaseToRebar}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Send Staircase waist slab thickness, riser, tread, and flight dimensions directly to Rebar BBS"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Send Staircase to Rebar BBS</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div
              ref={modalContentRef}
              className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6"
            >
              {activeTab === 'far' && (
                <FarMgcCalculator
                  initialValues={arch.farMgc}
                  onChange={handleUpdateFar}
                  onPushFootprintToBoq={onPushFootprintToBoq}
                />
              )}

              {activeTab === 'staircase' && (
                <StaircaseDesigner
                  initialValues={arch.staircase}
                  onChange={handleUpdateStair}
                  onSendToRebarBbs={onSendStaircaseToRebar}
                  onSendStaircaseToBoq={onSendStaircaseToBoq}
                />
              )}

              {activeTab === 'watertank' && (
                <BuildingServicesSizer
                  initialTab="water-reservoirs"
                  initialWaterValues={arch.waterTank}
                  initialSepticValues={arch.septicTank}
                  onWaterChange={handleUpdateWater}
                  onSepticChange={handleUpdateSeptic}
                  onSendToBOQ={onSendTankToBOQ}
                  onSendTankToRebar={handleDirectSendTankToRebar}
                />
              )}

              {activeTab === 'septictank' && (
                <BuildingServicesSizer
                  initialTab="septic-system"
                  initialWaterValues={arch.waterTank}
                  initialSepticValues={arch.septicTank}
                  onWaterChange={handleUpdateWater}
                  onSepticChange={handleUpdateSeptic}
                  onSendToBOQ={onSendTankToBOQ}
                  onSendTankToRebar={handleDirectSendTankToRebar}
                />
              )}

              {activeTab === 'services' && (
                <BuildingServicesEnvPlanner
                  initialValues={arch.rainwaterDaylight}
                  onChange={handleUpdateRainwaterDaylight}
                  onSendRwhToBoq={onSendTankToBOQ}
                  subMode={servicesSubMode}
                  onSubModeChange={setServicesSubMode}
                />
              )}

              {/* Dedicated "About This Tool" Documentation Section */}
              <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <AboutThisTool
                  key={`arch-doc-${activeTab}`}
                  toolId={`architecture-${activeTab}`}
                  id={`arch-doc-${activeTab}`}
                  defaultExpanded={false}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
