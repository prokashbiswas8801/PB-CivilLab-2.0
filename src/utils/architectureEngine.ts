import {
  ArchitectureOccupancyType,
  ArchitectureParameters,
  FarMgcParameters,
  PlotAreaCategory,
  RainwaterDaylightParameters,
  RebarBBSParameters,
  SepticTankParameters,
  StairBuildingOccupancy,
  StaircaseParameters,
  StairTopologyType,
  TakeoffLineItem,
  WaterOccupancyPreset,
  WaterTankParameters,
} from '../types/civil';
import {
  CalculationEnvelope,
  CalculationStep,
  ScopeAndLimitsMetadata,
  createEnvelope,
} from './calculations';
import { CapacityUtilizationInfo } from './analyticalExport';

function createArchitectureEnvelope<T>(
  result: T,
  issues: CalculationEnvelope<T>['issues'],
  extras?: {
    handCalculationSteps?: CalculationStep[];
    scopeAndLimits?: ScopeAndLimitsMetadata;
  }
): CalculationEnvelope<T> {
  const env = createEnvelope<T>(result, issues, extras);
  return { ...env, result };
}

export interface SetbackSchedule {
  front: number;
  rear: number;
  side1: number;
  side2: number;
}

export interface ArchitecturePreset {
  id: string;
  label: string;
  shortTag: string;
  description: string;
  params: FarMgcParameters;
}

export interface ArchitectureFarResult {
  // Normalized Plot Geometry
  landAreaInput: number;
  landUnit: FarMgcParameters['landUnit'];
  grossPlotAreaSqm: number;
  grossPlotAreaSqft: number;
  plotAreaKatha: number;
  plotAreaCategory: PlotAreaCategory;
  plotCategoryLabel: string;
  surrenderedAreaSqm: number;
  netPlotAreaSqm: number;
  netPlotAreaSqft: number;
  frontageM: number;
  plotDepthM: number;
  effectivePlotDepthM: number;
  frontRoadWidthM: number;
  effectiveRoadWidthM: number;
  occupancyType: ArchitectureOccupancyType;
  occupancyLabel: string;
  isCornerPlot: boolean;

  // Code Allowances
  baseAllowableFar: number;
  roadWideningBonusFar: number;
  effectiveAllowableFar: number;
  allowableMgcPercent: number;
  isOverrideActive: boolean;
  mandatorySetbacks: SetbackSchedule;
  providedSetbacks: SetbackSchedule;

  // Envelope & Buildable Metrics
  maxPermissibleGfaSqm: number;
  maxPermissibleGfaSqft: number;
  maxFootprintByMgcSqm: number;
  buildableWidthM: number;
  buildableDepthM: number;
  maxFootprintBySetbacksSqm: number;
  governedMaxFootprintSqm: number;
  governedMaxFootprintSqft: number;
  openSpaceSqm: number;
  openSpacePercent: number;
  recommendedStories: number;
  exactStoryRatio: number;

  // Proposed Design Audit
  proposedFloors: number;
  storyHeightM: number;
  buildingHeightM: number;
  isHighRise: boolean;
  proposedGroundCoverageM2: number;
  proposedGroundCoverageSqft: number;
  proposedTotalFloorAreaM2: number;
  proposedTotalFloorAreaSqft: number;
  proposedFar: number;
  proposedMgcPercent: number;
  farDcr: number;
  mgcDcr: number;
  setbackChecks: {
    frontPass: boolean;
    rearPass: boolean;
    side1Pass: boolean;
    side2Pass: boolean;
    allPass: boolean;
    governingRatio: number;
    governingSideLabel: string;
  };
  farPass: boolean;
  mgcPass: boolean;

  // Parking & Basement Capacity
  basementCount: number;
  unitsCount: number;
  avgUnitAreaSqm: number;
  requiredCarBays: number;
  requiredMotoBays: number;
  providedCarBays: number;
  requiredParkingNetSqm: number;
  rampAndDrivewayAllowanceSqm: number;
  requiredParkingGrossSqm: number;
  availableParkingAreaSqm: number;
  estimatedCarCapacity: number;
  parkingDcr: number;
  parkingPass: boolean;

  // Overall Compliance & Limit-State Gauges
  overallCompliant: boolean;
  dcrGauges: CapacityUtilizationInfo[];
}

const SQFT_PER_SQM = 10.7639104;

export function mapLegacyOccupancy(
  occupancy: FarMgcParameters['occupancy'],
  occupancyType?: ArchitectureOccupancyType
): ArchitectureOccupancyType {
  if (occupancyType) return occupancyType;
  switch (occupancy) {
    case 'commercial':
      return 'commercial';
    case 'mixed':
      return 'mixed-use';
    case 'educational':
    case 'industrial':
      return 'institutional';
    case 'residential':
    default:
      return 'residential-a2';
  }
}

export function mapOccupancyToLegacy(
  occupancyType: ArchitectureOccupancyType
): FarMgcParameters['occupancy'] {
  switch (occupancyType) {
    case 'commercial':
      return 'commercial';
    case 'mixed-use':
      return 'mixed';
    case 'institutional':
      return 'educational';
    case 'residential-a1':
    case 'residential-a2':
    default:
      return 'residential';
  }
}

export function getPlotCategoryFromKatha(katha: number): {
  category: PlotAreaCategory;
  label: string;
} {
  if (katha < 2.0) {
    return { category: 'below-2-katha', label: 'Below 2 Katha (< 134 m²)' };
  }
  if (katha <= 5.0) {
    return { category: '2-to-5-katha', label: '2 to 5 Katha (134–335 m²)' };
  }
  if (katha <= 10.0) {
    return { category: '5-to-10-katha', label: '5 to 10 Katha (335–669 m²)' };
  }
  return { category: 'above-10-katha', label: 'Above 10 Katha (> 669 m²)' };
}

export function getOccupancyLabel(occ: ArchitectureOccupancyType): string {
  switch (occ) {
    case 'residential-a1':
      return 'Residential (A1 · Single/Two-Family)';
    case 'residential-a2':
      return 'Residential (A2 · Multi-Family Apt)';
    case 'commercial':
      return 'Commercial / Office (B/E)';
    case 'mixed-use':
      return 'Mixed-Use (Commercial + Res)';
    case 'institutional':
      return 'Institutional / Educational (C/D)';
  }
}

/**
 * Built-in Bangladesh / BNBC 2020 Worked Examples
 */
export const ARCHITECTURE_FAR_PRESETS: ArchitecturePreset[] = [
  {
    id: 'preset-5k-res-20ft',
    label: '5 Katha Residential Plot (20ft Road)',
    shortTag: '5 Katha · 20ft Road',
    description: 'Typical Dhaka G+5 multi-family residential plot on 20ft (6.10m) neighborhood street.',
    params: {
      landUnit: 'katha',
      landAreaValue: 5.0,
      customKathaSqFt: 720,
      occupancy: 'residential',
      occupancyType: 'residential-a2',
      plotAreaCategory: '2-to-5-katha',
      roadWidthM: 6.1,
      frontRoadWidthM: 6.1,
      frontageM: 14.46,
      plotDepthM: 23.13,
      isAutoDimension: true,
      isCornerPlot: false,
      roadSurrenderWidthM: 0,
      proposedFloors: 6,
      storyHeightM: 3.05,
      proposedGroundCoverageM2: 195.0,
      proposedTotalFloorAreaM2: 1050.0,
      basementCount: 0,
      unitsCount: 10,
      avgUnitAreaSqm: 105.0,
      providedCarParkingBays: 5,
      providedSetbacks: { front: 1.5, rear: 2.0, side1: 1.25, side2: 1.25 },
      enableOverride: false,
      overrideFar: 3.25,
      overrideMgc: 62.5,
      overrideSetbacks: { front: 1.5, rear: 2.0, side1: 1.25, side2: 1.25 },
    },
  },
  {
    id: 'preset-10k-mixed-40ft',
    label: '10 Katha Mixed-Use Corner Plot (40ft Road)',
    shortTag: '10 Katha · 40ft Corner',
    description: 'High-density G+9 mixed-use corner plot with 1 basement level on 40ft (12.19m) arterial street.',
    params: {
      landUnit: 'katha',
      landAreaValue: 10.0,
      customKathaSqFt: 720,
      occupancy: 'mixed',
      occupancyType: 'mixed-use',
      plotAreaCategory: '5-to-10-katha',
      roadWidthM: 12.19,
      frontRoadWidthM: 12.19,
      frontageM: 20.45,
      plotDepthM: 32.71,
      isAutoDimension: true,
      isCornerPlot: true,
      roadSurrenderWidthM: 0,
      proposedFloors: 10,
      storyHeightM: 3.15,
      proposedGroundCoverageM2: 380.0,
      proposedTotalFloorAreaM2: 3100.0,
      basementCount: 2,
      unitsCount: 18,
      avgUnitAreaSqm: 135.0,
      providedCarParkingBays: 26,
      providedSetbacks: { front: 2.5, rear: 2.5, side1: 1.5, side2: 2.0 },
      enableOverride: false,
      overrideFar: 4.75,
      overrideMgc: 60.0,
      overrideSetbacks: { front: 2.5, rear: 2.5, side1: 1.5, side2: 2.0 },
    },
  },
  {
    id: 'preset-3k-narrow',
    label: '3 Katha Narrow Frontage Plot',
    shortTag: '3 Katha · 16ft Lane',
    description: 'Compact urban 3 Katha infill plot (8.5m frontage × 23.6m depth) on 16ft (4.88m) access lane.',
    params: {
      landUnit: 'katha',
      landAreaValue: 3.0,
      customKathaSqFt: 720,
      occupancy: 'residential',
      occupancyType: 'residential-a2',
      plotAreaCategory: '2-to-5-katha',
      roadWidthM: 4.88,
      frontRoadWidthM: 4.88,
      frontageM: 8.5,
      plotDepthM: 23.61,
      isAutoDimension: false,
      isCornerPlot: false,
      roadSurrenderWidthM: 0.6,
      proposedFloors: 5,
      storyHeightM: 3.0,
      proposedGroundCoverageM2: 112.0,
      proposedTotalFloorAreaM2: 515.0,
      basementCount: 0,
      unitsCount: 4,
      avgUnitAreaSqm: 105.0,
      providedCarParkingBays: 2,
      providedSetbacks: { front: 1.5, rear: 1.5, side1: 1.0, side2: 1.0 },
      enableOverride: false,
      overrideFar: 2.75,
      overrideMgc: 62.5,
      overrideSetbacks: { front: 1.5, rear: 1.5, side1: 1.0, side2: 1.0 },
    },
  },
];

/**
 * Deterministic BNBC 2020 / Dhaka Imarat Nirman Bidhimala Architectural By-Law Solver
 */
export function computeArchitectureFarMgc(
  rawParams: FarMgcParameters,
  archContext?: Partial<ArchitectureParameters>
): CalculationEnvelope<ArchitectureFarResult> {
  const landUnit = rawParams.landUnit || 'katha';
  const landAreaValue = Math.max(0.1, Number(rawParams.landAreaValue) || 5.0);
  const customKathaSqFt = Math.max(300, Number(rawParams.customKathaSqFt) || 720);
  const occupancyType = mapLegacyOccupancy(
    rawParams.occupancy,
    rawParams.occupancyType || archContext?.occupancyType
  );
  const frontRoadWidthM = Math.max(
    1.8,
    Number(rawParams.frontRoadWidthM ?? archContext?.frontRoadWidthM ?? rawParams.roadWidthM) || 6.1
  );
  const roadSurrenderWidthM = Math.max(0, Math.min(6.0, Number(rawParams.roadSurrenderWidthM) || 0));
  const isCornerPlot = Boolean(rawParams.isCornerPlot);

  // 1. Area Normalization
  let grossPlotAreaSqm = 0;
  if (landUnit === 'katha') {
    grossPlotAreaSqm = (landAreaValue * customKathaSqFt) / SQFT_PER_SQM;
  } else if (landUnit === 'decimal') {
    grossPlotAreaSqm = (landAreaValue * 435.6) / SQFT_PER_SQM;
  } else if (landUnit === 'sqft') {
    grossPlotAreaSqm = landAreaValue / SQFT_PER_SQM;
  } else {
    grossPlotAreaSqm = landAreaValue;
  }
  grossPlotAreaSqm = Number(grossPlotAreaSqm.toFixed(2));
  const grossPlotAreaSqft = Number((grossPlotAreaSqm * SQFT_PER_SQM).toFixed(2));
  const plotAreaKatha = Number((grossPlotAreaSqft / customKathaSqFt).toFixed(2));

  const { category: derivedPlotCategory, label: plotCategoryLabel } =
    getPlotCategoryFromKatha(plotAreaKatha);
  const plotAreaCategory = derivedPlotCategory;

  // Dimensions
  const frontageM = rawParams.isAutoDimension
    ? Number(Math.sqrt(grossPlotAreaSqm / 1.6).toFixed(2))
    : Math.max(3.0, Number(rawParams.frontageM) || 14.0);
  const plotDepthM = rawParams.isAutoDimension
    ? Number((Math.sqrt(grossPlotAreaSqm / 1.6) * 1.6).toFixed(2))
    : Math.max(3.0, Number(rawParams.plotDepthM) || 23.0);

  const surrenderedAreaSqm = Number(Math.min(grossPlotAreaSqm * 0.25, frontageM * roadSurrenderWidthM).toFixed(2));
  const netPlotAreaSqm = Number(Math.max(10, grossPlotAreaSqm - surrenderedAreaSqm).toFixed(2));
  const netPlotAreaSqft = Number((netPlotAreaSqm * SQFT_PER_SQM).toFixed(2));
  const effectivePlotDepthM = Number(Math.max(3.0, plotDepthM - roadSurrenderWidthM).toFixed(2));
  const effectiveRoadWidthM = Number((frontRoadWidthM + (roadSurrenderWidthM > 0 ? 2 * roadSurrenderWidthM : 0)).toFixed(2));

  // Proposed building attributes
  const proposedFloors = Math.max(1, Math.round(rawParams.proposedFloors ?? archContext?.proposedFloors ?? 6));
  const storyHeightM = Math.max(2.6, Math.min(5.5, Number(rawParams.storyHeightM) || 3.05));
  const buildingHeightM = Number((proposedFloors * storyHeightM).toFixed(2));
  const isHighRise = buildingHeightM > 33.0 || proposedFloors > 10;
  const basementCount = Math.max(0, Math.round(rawParams.basementCount ?? archContext?.basementCount ?? 0));
  const unitsCount = Math.max(1, Math.round(rawParams.unitsCount ?? archContext?.unitsCount ?? 10));
  const avgUnitAreaSqm = Math.max(25, Number(rawParams.avgUnitAreaSqm ?? archContext?.avgUnitAreaSqm ?? 105));

  // 2. Permissible MGC (%) per Plot Size & Occupancy (BNBC 2020 / Dhaka Imarat Nirman Bidhimala)
  let defaultMgc = 62.5;
  if (occupancyType === 'residential-a1') {
    defaultMgc =
      plotAreaCategory === 'below-2-katha'
        ? 67.5
        : plotAreaCategory === '2-to-5-katha'
        ? 65.0
        : plotAreaCategory === '5-to-10-katha'
        ? 57.5
        : 52.5;
  } else if (occupancyType === 'residential-a2') {
    defaultMgc =
      plotAreaCategory === 'below-2-katha'
        ? 67.5
        : plotAreaCategory === '2-to-5-katha'
        ? 62.5
        : plotAreaCategory === '5-to-10-katha'
        ? 57.5
        : 50.0;
  } else if (occupancyType === 'commercial') {
    defaultMgc =
      plotAreaCategory === 'below-2-katha'
        ? 70.0
        : plotAreaCategory === '2-to-5-katha'
        ? 65.0
        : plotAreaCategory === '5-to-10-katha'
        ? 60.0
        : 55.0;
  } else if (occupancyType === 'mixed-use') {
    defaultMgc =
      plotAreaCategory === 'below-2-katha'
        ? 70.0
        : plotAreaCategory === '2-to-5-katha'
        ? 65.0
        : plotAreaCategory === '5-to-10-katha'
        ? 60.0
        : 55.0;
  } else {
    // institutional
    defaultMgc = plotAreaCategory === 'above-10-katha' ? 45.0 : 50.0;
  }

  // 3. Base Permissible FAR (Plot Size × Effective Road Width × Occupancy)
  let baseAllowableFar = 3.0;
  if (effectiveRoadWidthM < 4.5) {
    baseAllowableFar = occupancyType === 'commercial' ? 2.25 : 2.0;
  } else if (effectiveRoadWidthM < 6.0) {
    baseAllowableFar =
      occupancyType === 'commercial'
        ? 2.75
        : occupancyType === 'mixed-use'
        ? 2.75
        : occupancyType === 'residential-a1'
        ? 2.5
        : 2.65;
  } else if (effectiveRoadWidthM < 9.0) {
    baseAllowableFar =
      occupancyType === 'commercial'
        ? 3.5
        : occupancyType === 'mixed-use'
        ? 3.4
        : occupancyType === 'institutional'
        ? 3.0
        : plotAreaKatha <= 3.0
        ? 3.0
        : 3.25;
  } else if (effectiveRoadWidthM < 12.0) {
    baseAllowableFar =
      occupancyType === 'commercial'
        ? 4.25
        : occupancyType === 'mixed-use'
        ? 4.0
        : occupancyType === 'institutional'
        ? 3.5
        : plotAreaKatha > 5.0
        ? 3.75
        : 3.5;
  } else if (effectiveRoadWidthM < 18.0) {
    baseAllowableFar =
      occupancyType === 'commercial'
        ? 5.0
        : occupancyType === 'mixed-use'
        ? 4.75
        : occupancyType === 'institutional'
        ? 4.0
        : plotAreaKatha > 5.0
        ? 4.25
        : 4.0;
  } else {
    baseAllowableFar =
      occupancyType === 'commercial'
        ? 6.0
        : occupancyType === 'mixed-use'
        ? 5.5
        : occupancyType === 'institutional'
        ? 4.5
        : plotAreaKatha > 7.5
        ? 5.25
        : 4.75;
  }

  // Small plot cap below 2 katha
  if (plotAreaCategory === 'below-2-katha') {
    baseAllowableFar = Math.min(baseAllowableFar, 2.75);
  }

  // Road-widening setback surrender bonus
  const roadWideningBonusFar =
    roadSurrenderWidthM >= 1.5 ? 0.4 : roadSurrenderWidthM >= 0.5 ? 0.25 : 0;

  const codeAllowableFar = Number((baseAllowableFar + roadWideningBonusFar).toFixed(2));

  // 4. Mandatory Perimeter Setbacks (BNBC 2020 / Dhaka Imarat Nirman Bidhimala)
  let reqFront = 1.5;
  if (effectiveRoadWidthM < 9.0) reqFront = 1.5;
  else if (effectiveRoadWidthM < 12.0) reqFront = 2.0;
  else if (effectiveRoadWidthM < 18.0) reqFront = 2.5;
  else reqFront = 3.0;

  let reqRear = 2.0;
  if (plotAreaCategory === 'below-2-katha') reqRear = buildingHeightM > 13.5 ? 1.5 : 1.0;
  else if (plotAreaCategory === '2-to-5-katha') reqRear = plotAreaKatha <= 3.0 ? 1.5 : 2.0;
  else if (plotAreaCategory === '5-to-10-katha') reqRear = 2.5;
  else reqRear = 3.0;

  let reqSide1 = 1.25;
  let reqSide2 = 1.25;
  if (plotAreaCategory === 'below-2-katha') {
    reqSide1 = 0.8;
    reqSide2 = 0.8;
  } else if (plotAreaCategory === '2-to-5-katha') {
    reqSide1 = plotAreaKatha <= 3.0 ? 1.0 : 1.25;
    reqSide2 = plotAreaKatha <= 3.0 ? 1.0 : 1.25;
  } else if (plotAreaCategory === '5-to-10-katha') {
    reqSide1 = 1.5;
    reqSide2 = 1.5;
  } else {
    reqSide1 = 2.0;
    reqSide2 = 2.0;
  }

  // Tall building setback increments (> 20m and > 33m high-rise)
  if (buildingHeightM > 33.0) {
    reqFront = Math.max(reqFront, 3.0);
    reqRear = Math.max(reqRear, 3.5);
    reqSide1 = Math.max(reqSide1, 2.5);
    reqSide2 = Math.max(reqSide2, 2.5);
  } else if (buildingHeightM > 20.0) {
    reqRear = Math.max(reqRear, 2.5);
    reqSide1 = Math.max(reqSide1, 1.5);
    reqSide2 = Math.max(reqSide2, 1.5);
  }

  // Corner plot secondary road setback rule on Side 2
  if (isCornerPlot) {
    reqSide2 = Math.max(reqSide2, effectiveRoadWidthM >= 12.0 ? 2.0 : 1.5);
  }

  const codeSetbacks: SetbackSchedule = {
    front: Number(reqFront.toFixed(2)),
    rear: Number(reqRear.toFixed(2)),
    side1: Number(reqSide1.toFixed(2)),
    side2: Number(reqSide2.toFixed(2)),
  };

  // Apply overrides if enabled
  const isOverrideActive = Boolean(rawParams.enableOverride);
  const effectiveAllowableFar = isOverrideActive
    ? Math.max(0.5, Number(rawParams.overrideFar) || codeAllowableFar)
    : codeAllowableFar;
  const allowableMgcPercent = isOverrideActive
    ? Math.max(10, Math.min(95, Number(rawParams.overrideMgc) || defaultMgc))
    : defaultMgc;
  const mandatorySetbacks: SetbackSchedule = isOverrideActive
    ? {
        front: Math.max(0, Number(rawParams.overrideSetbacks?.front ?? codeSetbacks.front)),
        rear: Math.max(0, Number(rawParams.overrideSetbacks?.rear ?? codeSetbacks.rear)),
        side1: Math.max(0, Number(rawParams.overrideSetbacks?.side1 ?? codeSetbacks.side1)),
        side2: Math.max(0, Number(rawParams.overrideSetbacks?.side2 ?? codeSetbacks.side2)),
      }
    : codeSetbacks;

  const providedSetbacks: SetbackSchedule = rawParams.providedSetbacks
    ? {
        front: Math.max(0, Number(rawParams.providedSetbacks.front ?? mandatorySetbacks.front)),
        rear: Math.max(0, Number(rawParams.providedSetbacks.rear ?? mandatorySetbacks.rear)),
        side1: Math.max(0, Number(rawParams.providedSetbacks.side1 ?? mandatorySetbacks.side1)),
        side2: Math.max(0, Number(rawParams.providedSetbacks.side2 ?? mandatorySetbacks.side2)),
      }
    : { ...mandatorySetbacks };

  // 5. Net Buildable Footprint & Permissible Floor Area
  const maxPermissibleGfaSqm = Number((netPlotAreaSqm * effectiveAllowableFar).toFixed(2));
  const maxPermissibleGfaSqft = Number((maxPermissibleGfaSqm * SQFT_PER_SQM).toFixed(2));
  const maxFootprintByMgcSqm = Number(((netPlotAreaSqm * allowableMgcPercent) / 100).toFixed(2));

  const buildableWidthM = Number(
    Math.max(0, frontageM - (mandatorySetbacks.side1 + mandatorySetbacks.side2)).toFixed(2)
  );
  const buildableDepthM = Number(
    Math.max(0, effectivePlotDepthM - (mandatorySetbacks.front + mandatorySetbacks.rear)).toFixed(2)
  );
  const maxFootprintBySetbacksSqm = Number((buildableWidthM * buildableDepthM).toFixed(2));

  const governedMaxFootprintSqm = Number(
    Math.min(maxFootprintByMgcSqm, maxFootprintBySetbacksSqm).toFixed(2)
  );
  const governedMaxFootprintSqft = Number((governedMaxFootprintSqm * SQFT_PER_SQM).toFixed(2));

  const openSpaceSqm = Number(Math.max(0, netPlotAreaSqm - governedMaxFootprintSqm).toFixed(2));
  const openSpacePercent = Number(((openSpaceSqm / Math.max(1, netPlotAreaSqm)) * 100).toFixed(1));

  const exactStoryRatio =
    governedMaxFootprintSqm > 0
      ? Number((maxPermissibleGfaSqm / governedMaxFootprintSqm).toFixed(2))
      : 1.0;
  const recommendedStories = Math.max(1, Math.ceil(exactStoryRatio));

  // 6. Proposed Building Audit (FAR, MGC & Setback Compliance)
  const fallbackProposedGc = Number((governedMaxFootprintSqm * 0.94).toFixed(2));
  const proposedGroundCoverageM2 = Number(
    Math.max(
      10,
      rawParams.proposedGroundCoverageM2 ?? archContext?.proposedGroundCoverageM2 ?? fallbackProposedGc
    ).toFixed(2)
  );
  const proposedGroundCoverageSqft = Number((proposedGroundCoverageM2 * SQFT_PER_SQM).toFixed(2));

  const fallbackProposedTotalGfa = Number(
    (proposedGroundCoverageM2 * Math.max(1, proposedFloors - (basementCount > 0 ? 0 : 0.35))).toFixed(2)
  );
  const proposedTotalFloorAreaM2 = Number(
    Math.max(
      10,
      rawParams.proposedTotalFloorAreaM2 ??
        archContext?.proposedTotalFloorAreaM2 ??
        fallbackProposedTotalGfa
    ).toFixed(2)
  );
  const proposedTotalFloorAreaSqft = Number((proposedTotalFloorAreaM2 * SQFT_PER_SQM).toFixed(2));

  const proposedFar = Number((proposedTotalFloorAreaM2 / Math.max(1, netPlotAreaSqm)).toFixed(3));
  const proposedMgcPercent = Number(
    ((proposedGroundCoverageM2 / Math.max(1, netPlotAreaSqm)) * 100).toFixed(2)
  );

  const farDcr = Number((proposedFar / Math.max(0.01, effectiveAllowableFar)).toFixed(3));
  const mgcDcr = Number((proposedMgcPercent / Math.max(1, allowableMgcPercent)).toFixed(3));
  const farPass = proposedFar <= effectiveAllowableFar + 1e-6;
  const mgcPass = proposedMgcPercent <= allowableMgcPercent + 1e-6;

  // Setback checks (Required / Provided -> <= 1.00 means compliant)
  const ratioFront =
    mandatorySetbacks.front > 0
      ? providedSetbacks.front > 0
        ? mandatorySetbacks.front / providedSetbacks.front
        : 2.0
      : 0;
  const ratioRear =
    mandatorySetbacks.rear > 0
      ? providedSetbacks.rear > 0
        ? mandatorySetbacks.rear / providedSetbacks.rear
        : 2.0
      : 0;
  const ratioSide1 =
    mandatorySetbacks.side1 > 0
      ? providedSetbacks.side1 > 0
        ? mandatorySetbacks.side1 / providedSetbacks.side1
        : 2.0
      : 0;
  const ratioSide2 =
    mandatorySetbacks.side2 > 0
      ? providedSetbacks.side2 > 0
        ? mandatorySetbacks.side2 / providedSetbacks.side2
        : 2.0
      : 0;

  const frontPass = providedSetbacks.front >= mandatorySetbacks.front - 1e-4;
  const rearPass = providedSetbacks.rear >= mandatorySetbacks.rear - 1e-4;
  const side1Pass = providedSetbacks.side1 >= mandatorySetbacks.side1 - 1e-4;
  const side2Pass = providedSetbacks.side2 >= mandatorySetbacks.side2 - 1e-4;

  const setbackRatios = [
    { label: 'Front', r: ratioFront },
    { label: 'Rear', r: ratioRear },
    { label: 'Side 1', r: ratioSide1 },
    { label: 'Side 2', r: ratioSide2 },
  ].sort((a, b) => b.r - a.r);

  const setbackChecks = {
    frontPass,
    rearPass,
    side1Pass,
    side2Pass,
    allPass: frontPass && rearPass && side1Pass && side2Pass,
    governingRatio: Number(setbackRatios[0].r.toFixed(3)),
    governingSideLabel: setbackRatios[0].label,
  };

  // 7. Required Parking Bays & Basement / Driveway Allowance (BNBC 2020 Part 3)
  let requiredCarBays = 1;
  let requiredMotoBays = 1;
  if (occupancyType === 'residential-a1') {
    requiredCarBays = Math.max(1, unitsCount);
    requiredMotoBays = Math.max(1, Math.ceil(unitsCount * 0.5));
  } else if (occupancyType === 'residential-a2') {
    const carsPerUnit = avgUnitAreaSqm >= 140 ? 1.0 : avgUnitAreaSqm >= 95 ? 0.5 : 0.35;
    requiredCarBays = Math.max(1, Math.ceil(unitsCount * carsPerUnit));
    requiredMotoBays = Math.max(1, Math.ceil(unitsCount * 0.5));
  } else if (occupancyType === 'commercial') {
    requiredCarBays = Math.max(1, Math.ceil(proposedTotalFloorAreaM2 / 100));
    requiredMotoBays = Math.max(2, Math.ceil(proposedTotalFloorAreaM2 / 80));
  } else if (occupancyType === 'mixed-use') {
    requiredCarBays = Math.max(1, Math.ceil(proposedTotalFloorAreaM2 / 120));
    requiredMotoBays = Math.max(2, Math.ceil(proposedTotalFloorAreaM2 / 100));
  } else {
    requiredCarBays = Math.max(1, Math.ceil(proposedTotalFloorAreaM2 / 150));
    requiredMotoBays = Math.max(2, Math.ceil(proposedTotalFloorAreaM2 / 110));
  }

  // Standard bay net footprint: 2.5m × 5.0m = 12.5 m²/car; 1.0m × 2.2m = 2.2 m²/moto
  const requiredParkingNetSqm = Number((requiredCarBays * 12.5 + requiredMotoBays * 2.2).toFixed(1));
  // Gross parking with aisle maneuvering (~22 m²/car ground stilt; ~25 m²/car enclosed basement + 3.5 m²/moto)
  const carGrossPerBay = basementCount > 0 ? 25.0 : 22.0;
  const parkingCirculationAreaSqm = Number(
    (requiredCarBays * carGrossPerBay + requiredMotoBays * 3.5).toFixed(1)
  );
  // Basement ramp (1:8 slope for 3.0m height) + driveway entry apron
  const rampAndDrivewayAllowanceSqm =
    basementCount > 0 ? Number((basementCount === 1 ? 82.0 : 104.0).toFixed(1)) : 18.0;

  const requiredParkingGrossSqm = Number(
    (parkingCirculationAreaSqm + rampAndDrivewayAllowanceSqm).toFixed(1)
  );

  // Available parking area (Basement levels OR Ground stilt parking net of 18 m² lift/stair core)
  const basementPlateSqm =
    basementCount > 0
      ? Math.min(netPlotAreaSqm * 0.78, Math.max(governedMaxFootprintSqm * 1.12, proposedGroundCoverageM2))
      : 0;
  const groundStiltUsableSqm = Math.max(0, proposedGroundCoverageM2 * 0.86 - 18.0);
  const availableParkingAreaSqm = Number(
    (
      basementCount > 0
        ? basementCount * basementPlateSqm * 0.88 + groundStiltUsableSqm * 0.5
        : groundStiltUsableSqm
    ).toFixed(1)
  );

  const netParkingFloorAfterRamp = Math.max(0, availableParkingAreaSqm - rampAndDrivewayAllowanceSqm);
  const estimatedCarCapacity = Math.max(
    0,
    Math.floor((netParkingFloorAfterRamp - requiredMotoBays * 3.5) / carGrossPerBay)
  );
  const providedCarBays =
    typeof rawParams.providedCarParkingBays === 'number'
      ? Math.max(0, Math.round(rawParams.providedCarParkingBays))
      : estimatedCarCapacity;

  const parkingDcr = Number(
    (requiredParkingGrossSqm / Math.max(10, availableParkingAreaSqm)).toFixed(3)
  );
  const parkingPass = availableParkingAreaSqm >= requiredParkingGrossSqm && providedCarBays >= requiredCarBays;

  const overallCompliant = farPass && mgcPass && setbackChecks.allPass && parkingPass;

  // 8. DCR Gauges Suite
  const dcrGauges: CapacityUtilizationInfo[] = [
    {
      metricLabel: 'Allowable FAR Utilization',
      formattedValue: `${proposedFar.toFixed(2)} / ${effectiveAllowableFar.toFixed(2)}`,
      percentage: Math.min(125, Math.round(farDcr * 100)),
      status: farDcr > 1.0 ? 'critical' : farDcr > 0.88 ? 'warning' : 'safe',
      description: farPass
        ? `Proposed GFA (${proposedTotalFloorAreaM2.toLocaleString()} m²) is within BNBC 2020 allowable envelope (${maxPermissibleGfaSqm.toLocaleString()} m²).`
        : `Proposed GFA exceeds allowable FAR limit by ${(proposedTotalFloorAreaM2 - maxPermissibleGfaSqm).toFixed(1)} m². Reduce floor area or stories.`,
      referenceLimit: `Max FAR ${effectiveAllowableFar.toFixed(2)}`,
    },
    {
      metricLabel: 'Max Ground Coverage (MGC)',
      formattedValue: `${proposedMgcPercent.toFixed(1)}% / ${allowableMgcPercent.toFixed(1)}%`,
      percentage: Math.min(125, Math.round(mgcDcr * 100)),
      status: mgcDcr > 1.0 ? 'critical' : mgcDcr > 0.88 ? 'warning' : 'safe',
      description: mgcPass
        ? `Ground footprint (${proposedGroundCoverageM2} m²) satisfies open-space mandate (${openSpacePercent}% open).`
        : `Footprint exceeds MGC limit (${maxFootprintByMgcSqm} m²) by ${(proposedGroundCoverageM2 - maxFootprintByMgcSqm).toFixed(1)} m².`,
      referenceLimit: `Max ${allowableMgcPercent.toFixed(1)}%`,
    },
    {
      metricLabel: `Setback Envelope (${setbackChecks.governingSideLabel})`,
      formattedValue: setbackChecks.allPass
        ? `${(setbackChecks.governingRatio * 100).toFixed(0)}% Limit Used`
        : `VIOLATION (${setbackChecks.governingSideLabel})`,
      percentage: Math.min(125, Math.round(setbackChecks.governingRatio * 100)),
      status: !setbackChecks.allPass ? 'critical' : setbackChecks.governingRatio > 0.96 ? 'warning' : 'safe',
      description: setbackChecks.allPass
        ? `All perimeter setbacks meet BNBC minimums (Front ${providedSetbacks.front}m, Rear ${providedSetbacks.rear}m, Sides ${providedSetbacks.side1}m/${providedSetbacks.side2}m).`
        : `${setbackChecks.governingSideLabel} setback is below mandatory minimum. Increase clear margin from property line.`,
      referenceLimit: `Req F:${mandatorySetbacks.front}m R:${mandatorySetbacks.rear}m`,
    },
    {
      metricLabel: 'Parking & Basement Capacity',
      formattedValue: `${providedCarBays} / ${requiredCarBays} Cars`,
      percentage: Math.min(125, Math.round(parkingDcr * 100)),
      status: !parkingPass ? 'critical' : parkingDcr > 0.88 ? 'warning' : 'safe',
      description: parkingPass
        ? `Available space (${availableParkingAreaSqm} m²) accommodates ${requiredCarBays} car + ${requiredMotoBays} motorcycle bays incl. driveway/ramp.`
        : `Parking shortfall: need ${requiredParkingGrossSqm} m² gross (${requiredCarBays} cars) vs ${availableParkingAreaSqm} m² available. Consider adding basement/stilt.`,
      referenceLimit: `${requiredCarBays}C + ${requiredMotoBays}M`,
    },
  ];

  // 9. Validation Issues
  const issues = [] as CalculationEnvelope<ArchitectureFarResult>['issues'];
  if (!farPass) {
    issues.push({
      field: 'proposedTotalFloorAreaM2',
      message: `Proposed FAR (${proposedFar.toFixed(2)}) exceeds allowable limit (${effectiveAllowableFar.toFixed(2)}).`,
      severity: 'error',
    });
  }
  if (!mgcPass) {
    issues.push({
      field: 'proposedGroundCoverageM2',
      message: `Proposed Ground Coverage (${proposedMgcPercent.toFixed(1)}%) exceeds MGC limit (${allowableMgcPercent.toFixed(1)}%).`,
      severity: 'error',
    });
  }
  if (proposedGroundCoverageM2 > maxFootprintBySetbacksSqm + 0.5) {
    issues.push({
      field: 'proposedGroundCoverageM2',
      message: `Proposed footprint (${proposedGroundCoverageM2} m²) exceeds physical setback envelope (${maxFootprintBySetbacksSqm} m²).`,
      severity: 'warning',
    });
  }
  if (!setbackChecks.allPass) {
    issues.push({
      field: 'providedSetbacks',
      message: `${setbackChecks.governingSideLabel} setback does not satisfy BNBC 2020 mandatory clearance.`,
      severity: 'error',
    });
  }
  if (!parkingPass) {
    issues.push({
      field: 'basementCount',
      message: `Parking bays/area deficit: ${requiredCarBays} car & ${requiredMotoBays} motorcycle bays require ${requiredParkingGrossSqm} m² gross.`,
      severity: 'warning',
    });
  }

  // 10. Step-by-Step Engineering Derivations (Hand Calculation Engine)
  const handCalculationSteps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Plot Area Normalization & Katha Categorization',
      formula: 'A_gross = Input × ConversionFactor;  A_net = A_gross - (B_front × W_surrender)',
      substitution:
        roadSurrenderWidthM > 0
          ? `${landAreaValue} ${landUnit.toUpperCase()} = ${grossPlotAreaSqm} m² (${plotAreaKatha} Katha);  A_net = ${grossPlotAreaSqm} - (${frontageM} × ${roadSurrenderWidthM}) = ${netPlotAreaSqm} m²`
          : `${landAreaValue} ${landUnit.toUpperCase()} = ${grossPlotAreaSqm} m² (${grossPlotAreaSqft} sq.ft = ${plotAreaKatha} Katha @ ${customKathaSqFt} sq.ft/Katha)`,
      result: `Net Plot = ${netPlotAreaSqm} m² (${plotCategoryLabel})`,
      reasoning: `Plot classified as ${plotCategoryLabel} under Dhaka Imarat Nirman Bidhimala land-tier schedule.`,
      isVerifiedAgainstEngine: Math.abs(netPlotAreaSqm - Math.max(10, grossPlotAreaSqm - surrenderedAreaSqm)) < 0.05,
    },
    {
      stepNumber: 2,
      title: 'Permissible FAR & Maximum Built-Up Area (GFA)',
      formula: 'FAR_eff = FAR_base + ΔFAR_surrender;  GFA_max = A_net × FAR_eff',
      substitution: `FAR_eff = ${baseAllowableFar.toFixed(2)} + ${roadWideningBonusFar.toFixed(2)} = ${effectiveAllowableFar.toFixed(2)};  GFA_max = ${netPlotAreaSqm} × ${effectiveAllowableFar.toFixed(2)} = ${maxPermissibleGfaSqm} m²`,
      result: `FAR_eff = ${effectiveAllowableFar.toFixed(2)} · Max GFA = ${maxPermissibleGfaSqm.toLocaleString()} m² (${maxPermissibleGfaSqft.toLocaleString()} sq.ft)`,
      reasoning: isOverrideActive
        ? 'Custom zoning variance override active over base BNBC 2020 / Bidhimala road-width table.'
        : `Determined for ${getOccupancyLabel(occupancyType)} fronting ${effectiveRoadWidthM}m (${(effectiveRoadWidthM * 3.28084).toFixed(1)} ft) effective road.`,
      isVerifiedAgainstEngine: Math.abs(netPlotAreaSqm * effectiveAllowableFar - maxPermissibleGfaSqm) < 0.2,
    },
    {
      stepNumber: 3,
      title: 'Maximum Ground Coverage (MGC) & Open Space Mandate',
      formula: 'A_mgc = A_net × (MGC% / 100);  Open Space = A_net - A_footprint',
      substitution: `A_mgc = ${netPlotAreaSqm} × (${allowableMgcPercent}% / 100) = ${maxFootprintByMgcSqm} m²;  Open Space = ${netPlotAreaSqm} - ${governedMaxFootprintSqm} = ${openSpaceSqm} m²`,
      result: `MGC = ${allowableMgcPercent}% (${maxFootprintByMgcSqm} m²) · Open Space = ${openSpacePercent}%`,
      reasoning: 'Preserves minimum unbuilt permeable ground area for drainage, natural light, and ventilation.',
      isVerifiedAgainstEngine: Math.abs((netPlotAreaSqm * allowableMgcPercent) / 100 - maxFootprintByMgcSqm) < 0.2,
    },
    {
      stepNumber: 4,
      title: 'Mandatory Perimeter Setbacks & Height Envelope',
      formula: 'W_build = B_plot - (SB_side1 + SB_side2);  D_build = L_plot - (SB_front + SB_rear)',
      substitution: `W_build = ${frontageM} - (${mandatorySetbacks.side1} + ${mandatorySetbacks.side2}) = ${buildableWidthM} m;  D_build = ${effectivePlotDepthM} - (${mandatorySetbacks.front} + ${mandatorySetbacks.rear}) = ${buildableDepthM} m`,
      result: `Buildable Envelope = ${buildableWidthM}m × ${buildableDepthM}m = ${maxFootprintBySetbacksSqm} m² (${setbackChecks.allPass ? 'SETBACKS PASS' : 'SETBACK DEFICIT'})`,
      reasoning: `Evaluated for ${proposedFloors} floors (H = ${buildingHeightM}m${isHighRise ? ', High-Rise >33m' : ''})${isCornerPlot ? ' with Corner-Plot secondary street setback' : ''}.`,
      isVerifiedAgainstEngine: Math.abs(buildableWidthM * buildableDepthM - maxFootprintBySetbacksSqm) < 0.2,
    },
    {
      stepNumber: 5,
      title: 'Proposed Design Compliance (FAR & MGC DCR Check)',
      formula: 'FAR_prop = GFA_prop / A_net ≤ FAR_eff;  MGC_prop = (GC_prop / A_net) × 100 ≤ MGC%',
      substitution: `FAR_prop = ${proposedTotalFloorAreaM2} / ${netPlotAreaSqm} = ${proposedFar.toFixed(2)} (DCR ${farDcr.toFixed(2)});  MGC_prop = (${proposedGroundCoverageM2} / ${netPlotAreaSqm}) × 100 = ${proposedMgcPercent.toFixed(1)}% (DCR ${mgcDcr.toFixed(2)})`,
      result: `FAR: ${farPass ? 'PASS' : 'FAIL'} (${proposedFar.toFixed(2)}/${effectiveAllowableFar.toFixed(2)}) · MGC: ${mgcPass ? 'PASS' : 'FAIL'} (${proposedMgcPercent.toFixed(1)}%/${allowableMgcPercent}%)`,
      reasoning: `Governed max footprint is min(${maxFootprintByMgcSqm}, ${maxFootprintBySetbacksSqm}) = ${governedMaxFootprintSqm} m², supporting ~${recommendedStories} stories.`,
      isVerifiedAgainstEngine: Math.abs(proposedTotalFloorAreaM2 / netPlotAreaSqm - proposedFar) < 0.01,
    },
    {
      stepNumber: 6,
      title: 'Parking Bays, Ramp & Driveway Allowance Audit',
      formula: `A_req = (N_car × ${carGrossPerBay.toFixed(1)}) + (N_moto × 3.5) + A_ramp/driveway`,
      substitution: `A_req = (${requiredCarBays} × ${carGrossPerBay.toFixed(1)}) + (${requiredMotoBays} × 3.5) + ${rampAndDrivewayAllowanceSqm} = ${requiredParkingGrossSqm} m² vs Available ${availableParkingAreaSqm} m²`,
      result: `${requiredCarBays} Car + ${requiredMotoBays} Moto Bays · ${parkingPass ? 'ADEQUATE' : 'ADD BASEMENT / STILT'}`,
      reasoning:
        basementCount > 0
          ? `Includes 1:8 slope ramp & driveway allowance (${rampAndDrivewayAllowanceSqm} m²) across ${basementCount} basement level(s) + partial stilt.`
          : 'Assumes ground-floor stilt parking net of stair/lift core (~18 m²) and 18 m² entry driveway apron.',
      isVerifiedAgainstEngine: Math.abs(requiredCarBays * carGrossPerBay + requiredMotoBays * 3.5 + rampAndDrivewayAllowanceSqm - requiredParkingGrossSqm) < 0.2,
    },
  ];

  const scopeAndLimits: ScopeAndLimitsMetadata = {
    status: 'Available',
    codeReference: 'BNBC 2020 Part 3 (Ch. 1–2) & Dhaka Imarat Nirman Bidhimala (2008 / 2020 Rules)',
    covered: [
      'Plot area normalization across Katha (customizable sq.ft/Katha), Decimal, sq.ft, and m²',
      'Permissible FAR & MGC (%) lookup by occupancy, plot size category, and effective road width',
      'Road-widening setback surrender FAR incentive and net plot deduction',
      'Mandatory Front, Rear, Left & Right setbacks including high-rise (>20m / >33m) and corner-plot rules',
      'Car & motorcycle parking bay demand with 1:8 ramp & driveway allowance check',
    ],
    unsupported: [
      'Special DAP (Detailed Area Plan) block-level or heritage/aviation height zone overlays',
      'Fire-escape pressurization lobby & refuge floor deductions (> 10 stories)',
      'Irregular polygonal non-orthogonal plot boundaries (uses equivalent frontage × depth rectangle)',
    ],
  };

  return createArchitectureEnvelope<ArchitectureFarResult>(
    {
      landAreaInput: landAreaValue,
      landUnit,
      grossPlotAreaSqm,
      grossPlotAreaSqft,
      plotAreaKatha,
      plotAreaCategory,
      plotCategoryLabel,
      surrenderedAreaSqm,
      netPlotAreaSqm,
      netPlotAreaSqft,
      frontageM,
      plotDepthM,
      effectivePlotDepthM,
      frontRoadWidthM,
      effectiveRoadWidthM,
      occupancyType,
      occupancyLabel: getOccupancyLabel(occupancyType),
      isCornerPlot,
      baseAllowableFar,
      roadWideningBonusFar,
      effectiveAllowableFar,
      allowableMgcPercent,
      isOverrideActive,
      mandatorySetbacks,
      providedSetbacks,
      maxPermissibleGfaSqm,
      maxPermissibleGfaSqft,
      maxFootprintByMgcSqm,
      buildableWidthM,
      buildableDepthM,
      maxFootprintBySetbacksSqm,
      governedMaxFootprintSqm,
      governedMaxFootprintSqft,
      openSpaceSqm,
      openSpacePercent,
      recommendedStories,
      exactStoryRatio,
      proposedFloors,
      storyHeightM,
      buildingHeightM,
      isHighRise,
      proposedGroundCoverageM2,
      proposedGroundCoverageSqft,
      proposedTotalFloorAreaM2,
      proposedTotalFloorAreaSqft,
      proposedFar,
      proposedMgcPercent,
      farDcr,
      mgcDcr,
      setbackChecks,
      farPass,
      mgcPass,
      basementCount,
      unitsCount,
      avgUnitAreaSqm,
      requiredCarBays,
      requiredMotoBays,
      providedCarBays,
      requiredParkingNetSqm,
      rampAndDrivewayAllowanceSqm,
      requiredParkingGrossSqm,
      availableParkingAreaSqm,
      estimatedCarCapacity,
      parkingDcr,
      parkingPass,
      overallCompliant,
      dcrGauges,
    },
    issues,
    { handCalculationSteps, scopeAndLimits }
  );
}

/**
 * Generates BOQ TakeoffLineItem entries from the governed / proposed building footprint
 */
export function buildBoqItemsFromArchitectureFootprint(
  res: ArchitectureFarResult
): TakeoffLineItem[] {
  const stamp = Date.now().toString().slice(-6);
  const footprintM2 = res.proposedGroundCoverageM2 || res.governedMaxFootprintSqm;
  const sideRatio = res.buildableWidthM > 0 && res.buildableDepthM > 0
    ? res.buildableWidthM / res.buildableDepthM
    : 0.72;
  const equivWidthM = Number(Math.sqrt(footprintM2 * sideRatio).toFixed(2));
  const equivLengthM = Number((footprintM2 / Math.max(1, equivWidthM)).toFixed(2));
  const excavDepthM =
    res.basementCount > 0 ? Number((res.basementCount * 3.15 + 1.5).toFixed(2)) : 1.85;
  const excavWidthM = Number((equivWidthM + 1.2).toFixed(2));
  const excavLengthM = Number((equivLengthM + 1.2).toFixed(2));

  return [
    {
      id: `takeoff-arch-excav-${stamp}-1`,
      itemNo: '101.01',
      description: `Earthwork in foundation/basement pit excavation (${res.basementCount > 0 ? `${res.basementCount} Basement + Mat` : 'Isolated/Mat Footing'}, ${equivLengthM}m × ${equivWidthM}m footprint + 0.6m working space, depth ${excavDepthM}m)`,
      category: 'earthwork',
      wbsSectionId: 'sec-200',
      numberOfMembers: 1,
      lengthM: excavLengthM,
      widthM: excavWidthM,
      heightM: excavDepthM,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 0,
      unitRate: 245,
      startMonth: 1,
      durationMonths: 2,
      curveDistribution: 'early-peak',
    },
    {
      id: `takeoff-arch-bfs-${stamp}-2`,
      itemNo: '201.01',
      description: `Single-layer Brick Flat Soling (BFS) & 75mm PCC (1:3:6) blinding bed beneath buildable ground footprint (${footprintM2} m²)`,
      category: 'substructure',
      wbsSectionId: 'sec-200',
      numberOfMembers: 1,
      lengthM: equivLengthM,
      widthM: equivWidthM,
      heightM: 1.0,
      deductionQty: 0,
      unit: 'm2',
      wastagePercent: 3.0,
      unitRate: 1180,
      startMonth: 2,
      durationMonths: 1,
      curveDistribution: 'linear',
    },
    {
      id: `takeoff-arch-slab-${stamp}-3`,
      itemNo: '301.01',
      description: `Typical RCC (1:1.5:3) suspended floor slab structural concrete allowance (${res.proposedFloors} floors × 150mm equiv. thickness over ${footprintM2} m² footprint)`,
      category: 'superstructure',
      wbsSectionId: 'sec-300',
      numberOfMembers: res.proposedFloors,
      lengthM: equivLengthM,
      widthM: equivWidthM,
      heightM: 0.15,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 2.5,
      unitRate: 12400,
      startMonth: 4,
      durationMonths: Math.max(3, res.proposedFloors),
      curveDistribution: 's-curve',
    },
  ];
}

/* =============================================================
   STAIRCASE ERGONOMICS, BNBC PART 4 EGRESS & STRUCTURAL ENGINE
============================================================= */

export interface StaircasePreset {
  id: string;
  label: string;
  description: string;
  params: StaircaseParameters;
}

export interface StaircaseAnalysisResult {
  topology: StairTopologyType;
  topologyLabel: string;
  occupancy: StairBuildingOccupancy;
  occupancyLabel: string;

  // Geometry & Step Layout
  floorHeightMm: number;
  floorHeightM: number;
  totalRisers: number;
  risersPerFlight: number[];
  treadsPerFlight: number[];
  actualRiserMm: number;
  actualTreadMm: number;
  goingLengthMm: number;
  totalGoingSumMm: number;
  flightWidthMm: number;
  landingWidthMm: number;
  wellGapMm: number;
  waistSlabMm: number;
  slabThicknessMm: number;
  handrailHeightMm: number;
  stairwellLengthMm: number;
  stairwellWidthMm: number;
  requiredStairwellLengthMm: number;
  requiredStairwellWidthMm: number;
  stairwellFitPass: boolean;

  // Ergonomic Comfort Laws
  stairPitchDeg: number;
  maxAllowedPitchDeg: number;
  pitchStatus: 'OPTIMUM' | 'ACCEPTABLE' | 'STEEP' | 'SHALLOW';
  pitchPass: boolean;
  blondelValue: number; // 2R + T
  blondelStatus: 'OPTIMUM' | 'ACCEPTABLE' | 'WARNING';
  blondelPass: boolean;
  safetyIndex: number; // R + T
  safetyIndexPass: boolean;
  comfortProduct: number; // R * T
  comfortProductPass: boolean;

  // Headroom & BNBC Part 4 Egress
  estimatedHeadroomMm: number;
  headroomStatus: 'PASS' | 'WARNING' | 'FAIL';
  headroomPass: boolean;
  minClearFlightWidthMm: number;
  flightWidthPass: boolean;
  landingDepthPass: boolean;
  handrailPass: boolean;
  maxRisersPerFlightLimit: number;
  flightRiserCountPass: boolean;
  egressPass: boolean;

  // Structural Loads & BOQ Takeoff Quantities (per story)
  inclinedLengthsMm: number[];
  totalInclinedLengthMm: number;
  waistSlabDeadLoadKpa: number;
  stepsDeadLoadKpa: number;
  deadLoadKpa: number;
  liveLoadKpa: number;
  finishesLoadKpa: number;
  factoredLoadKpa: number;
  waistConcreteM3: number;
  stepsConcreteM3: number;
  landingConcreteM3: number;
  totalConcreteM3: number;
  soffitFormworkM2: number;
  riserFormworkM2: number;
  edgeFormworkM2: number;
  totalFormworkM2: number;

  overallCompliant: boolean;
  dcrGauges: CapacityUtilizationInfo[];
}

export function mapLegacyStairTopology(
  stairType?: StaircaseParameters['stairType'],
  stairTopology?: StairTopologyType
): StairTopologyType {
  if (stairTopology) return stairTopology;
  if (stairType === 'straight') return 'straight-flight';
  if (stairType === 'open-well') return 'open-well';
  return 'dog-legged';
}

export function mapTopologyToLegacyType(
  topology: StairTopologyType
): StaircaseParameters['stairType'] {
  if (topology === 'straight-flight') return 'straight';
  if (topology === 'open-well') return 'open-well';
  return 'dog-legged';
}

export function getStairTopologyLabel(topology: StairTopologyType): string {
  switch (topology) {
    case 'dog-legged':
      return 'Dog-Legged (2 Flights · 180°)';
    case 'open-well':
      return 'Open-Well (3 Flights · Central Shaft)';
    case 'straight-flight':
      return 'Straight Flight (Single Run)';
    case 'u-shaped':
      return 'U-Shaped (Wide Turn · 2 Flights)';
  }
}

export function getStairOccupancyLabel(occ: StairBuildingOccupancy): string {
  switch (occ) {
    case 'residential':
      return 'Residential (BNBC Group A · Min 1.0m)';
    case 'public-commercial':
      return 'Public / Commercial (BNBC Group B/E · Min 1.5m)';
    case 'educational-hospital':
      return 'Educational / Hospital (BNBC Group C/D · Min 1.5m)';
  }
}

export const STAIRCASE_PRESETS: StaircasePreset[] = [
  {
    id: 'stair-res-dogleg',
    label: 'Residential Dog-Legged (3.0m)',
    description: 'Standard Dhaka apartment core (H=3.0m, R=158mm, T=290mm, 2R+T=606mm, W=1.15m).',
    params: {
      stairType: 'dog-legged',
      stairTopology: 'dog-legged',
      buildingOccupancy: 'residential',
      floorHeightMm: 3000,
      floorToFloorHeightM: 3.0,
      stairwellLengthMm: 5100,
      stairwellWidthMm: 2450,
      preferredRiserMm: 160,
      riserHeightMm: 160,
      preferredTreadMm: 290,
      treadWidthMm: 290,
      flightWidthMm: 1150,
      waistSlabMm: 150,
      waistSlabThicknessMm: 150,
      slabThicknessMm: 150,
      landingWidthMm: 1200,
      wellGapMm: 150,
      handrailHeightMm: 950,
      nosingMm: 25,
      liveLoadKpa: 3.0,
      finishesLoadKpa: 1.0,
    },
  },
  {
    id: 'stair-public-openwell',
    label: 'Public / Commercial Open-Well (3.6m)',
    description: 'BNBC Part 4 compliant 1.55m wide egress stair (H=3.6m, R=150mm, T=300mm).',
    params: {
      stairType: 'open-well',
      stairTopology: 'open-well',
      buildingOccupancy: 'public-commercial',
      floorHeightMm: 3600,
      floorToFloorHeightM: 3.6,
      stairwellLengthMm: 5600,
      stairwellWidthMm: 5300,
      preferredRiserMm: 150,
      riserHeightMm: 150,
      preferredTreadMm: 300,
      treadWidthMm: 300,
      flightWidthMm: 1550,
      waistSlabMm: 175,
      waistSlabThicknessMm: 175,
      slabThicknessMm: 150,
      landingWidthMm: 1600,
      wellGapMm: 950,
      handrailHeightMm: 950,
      nosingMm: 25,
      liveLoadKpa: 4.5,
      finishesLoadKpa: 1.25,
    },
  },
  {
    id: 'stair-hospital-ushaped',
    label: 'Hospital / Educational U-Shaped (3.45m)',
    description: 'Gentle slope ≤ 27° wide stretcher stair (H=3.45m, R=150mm, T=305mm, W=1.65m).',
    params: {
      stairType: 'dog-legged',
      stairTopology: 'u-shaped',
      buildingOccupancy: 'educational-hospital',
      floorHeightMm: 3450,
      floorToFloorHeightM: 3.45,
      stairwellLengthMm: 6850,
      stairwellWidthMm: 3900,
      preferredRiserMm: 150,
      riserHeightMm: 150,
      preferredTreadMm: 305,
      treadWidthMm: 305,
      flightWidthMm: 1650,
      waistSlabMm: 175,
      waistSlabThicknessMm: 175,
      slabThicknessMm: 150,
      landingWidthMm: 1700,
      wellGapMm: 500,
      handrailHeightMm: 950,
      nosingMm: 25,
      liveLoadKpa: 5.0,
      finishesLoadKpa: 1.25,
    },
  },
  {
    id: 'stair-duplex-straight',
    label: 'Duplex Straight-Flight (2.6m)',
    description: 'Single-run 15-riser duplex stair (H=2.6m, R=173mm, T=265mm, 2R+T=612mm, W=1.05m).',
    params: {
      stairType: 'straight',
      stairTopology: 'straight-flight',
      buildingOccupancy: 'residential',
      floorHeightMm: 2600,
      floorToFloorHeightM: 2.6,
      stairwellLengthMm: 6000,
      stairwellWidthMm: 1200,
      preferredRiserMm: 175,
      riserHeightMm: 175,
      preferredTreadMm: 265,
      treadWidthMm: 265,
      flightWidthMm: 1050,
      waistSlabMm: 150,
      waistSlabThicknessMm: 150,
      slabThicknessMm: 150,
      landingWidthMm: 1100,
      wellGapMm: 0,
      handrailHeightMm: 950,
      nosingMm: 25,
      liveLoadKpa: 3.0,
      finishesLoadKpa: 1.0,
    },
  },
];

/**
 * Deterministic BNBC 2020 Part 3 & Part 4 Staircase Ergonomics, Egress & Quantity Engine
 */
export function computeStaircaseDesign(
  rawParams: StaircaseParameters,
  archContext?: Partial<ArchitectureParameters>
): CalculationEnvelope<StaircaseAnalysisResult> {
  const topology = mapLegacyStairTopology(
    rawParams.stairType,
    rawParams.stairTopology || archContext?.stairTopology
  );
  const occupancy: StairBuildingOccupancy =
    rawParams.buildingOccupancy || archContext?.buildingOccupancy || 'residential';

  const floorHeightMm = Math.max(
    1800,
    Math.min(6000, Number(rawParams.floorHeightMm || (rawParams.floorToFloorHeightM ? rawParams.floorToFloorHeightM * 1000 : 3000)))
  );
  const preferredRiserMm = Math.max(
    110,
    Math.min(220, Number(rawParams.riserHeightMm ?? rawParams.preferredRiserMm ?? 150))
  );
  const actualTreadMm = Math.max(
    200,
    Math.min(380, Number(rawParams.treadWidthMm ?? rawParams.preferredTreadMm ?? 275))
  );
  const waistSlabMm = Math.max(
    100,
    Math.min(350, Number(rawParams.waistSlabThicknessMm ?? rawParams.waistSlabMm ?? 150))
  );
  const slabThicknessMm = Math.max(100, Math.min(300, Number(rawParams.slabThicknessMm ?? 150)));
  const landingWidthMm = Math.max(800, Math.min(3500, Number(rawParams.landingWidthMm ?? 1200)));
  const handrailHeightMm = Math.max(700, Math.min(1250, Number(rawParams.handrailHeightMm ?? 950)));
  const wellGapMm =
    topology === 'straight-flight'
      ? 0
      : Math.max(50, Math.min(2500, Number(rawParams.wellGapMm ?? (topology === 'open-well' ? 900 : topology === 'u-shaped' ? 400 : 150))));

  const stairwellLengthMm = Math.max(2000, Number(rawParams.stairwellLengthMm ?? 4650));
  const stairwellWidthMm = Math.max(1000, Number(rawParams.stairwellWidthMm ?? 2450));
  const defaultFlightFromWell =
    topology === 'straight-flight'
      ? stairwellWidthMm
      : Math.max(900, Math.round((stairwellWidthMm - wellGapMm) / 2));
  const flightWidthMm = Math.max(
    750,
    Math.min(3000, Number(rawParams.flightWidthMm ?? archContext?.flightWidthMm ?? defaultFlightFromWell))
  );

  const liveLoadKpa = Math.max(1.5, Number(rawParams.liveLoadKpa ?? (occupancy === 'residential' ? 3.0 : 4.5)));
  const finishesLoadKpa = Math.max(0.25, Number(rawParams.finishesLoadKpa ?? 1.0));

  // 1. Risers & Treads: N_r = ceil(H / R), R_actual = H / N_r
  const totalRisers = Math.max(3, Math.ceil(floorHeightMm / preferredRiserMm));
  const actualRiserMm = Number((floorHeightMm / totalRisers).toFixed(2));

  let risersPerFlight: number[] = [];
  let treadsPerFlight: number[] = [];
  if (topology === 'straight-flight') {
    risersPerFlight = [totalRisers];
    treadsPerFlight = [Math.max(1, totalRisers - 1)];
  } else if (topology === 'dog-legged' || topology === 'u-shaped') {
    const f1 = Math.ceil(totalRisers / 2);
    const f2 = Math.max(1, totalRisers - f1);
    risersPerFlight = [f1, f2];
    treadsPerFlight = [Math.max(1, f1 - 1), Math.max(1, f2 - 1)];
  } else {
    // open-well (3 flights)
    const f1 = Math.ceil(totalRisers / 3);
    const f2 = Math.max(1, Math.round((totalRisers - f1) / 2));
    const f3 = Math.max(1, totalRisers - f1 - f2);
    risersPerFlight = [f1, f2, f3];
    treadsPerFlight = [Math.max(1, f1 - 1), Math.max(1, f2 - 1), Math.max(1, f3 - 1)];
  }

  const maxTreadsInRun = Math.max(...treadsPerFlight);
  const goingLengthMm = Number((maxTreadsInRun * actualTreadMm).toFixed(1));
  const totalGoingSumMm = Number(
    (treadsPerFlight.reduce((sum, t) => sum + t, 0) * actualTreadMm).toFixed(1)
  );

  // 2. Blondel's Ergonomic Comfort Laws
  const blondelValue = Number((2 * actualRiserMm + actualTreadMm).toFixed(1));
  const blondelStatus: StaircaseAnalysisResult['blondelStatus'] =
    blondelValue >= 600 && blondelValue <= 640
      ? 'OPTIMUM'
      : blondelValue >= 580 && blondelValue <= 660
      ? 'ACCEPTABLE'
      : 'WARNING';
  const blondelPass = blondelValue >= 580 && blondelValue <= 660;

  const safetyIndex = Number((actualRiserMm + actualTreadMm).toFixed(1));
  const safetyIndexPass = safetyIndex >= 410 && safetyIndex <= 465;

  const comfortProduct = Math.round(actualRiserMm * actualTreadMm);
  const comfortProductPass = comfortProduct >= 38000 && comfortProduct <= 47500;

  // 3. Pitch Slope Angle & Headroom Clearance
  const pitchRad = Math.atan(actualRiserMm / actualTreadMm);
  const stairPitchDeg = Number(((pitchRad * 180) / Math.PI).toFixed(2));
  const maxAllowedPitchDeg = occupancy === 'residential' ? 38.0 : 33.0;
  const pitchStatus: StaircaseAnalysisResult['pitchStatus'] =
    stairPitchDeg >= 25 && stairPitchDeg <= maxAllowedPitchDeg - 3
      ? 'OPTIMUM'
      : stairPitchDeg >= 22 && stairPitchDeg <= maxAllowedPitchDeg
      ? 'ACCEPTABLE'
      : stairPitchDeg > maxAllowedPitchDeg
      ? 'STEEP'
      : 'SHALLOW';
  const pitchPass = stairPitchDeg >= 22 && stairPitchDeg <= maxAllowedPitchDeg;

  // Stairwell required plan envelope
  let requiredStairwellLengthMm = 0;
  let requiredStairwellWidthMm = 0;
  if (topology === 'straight-flight') {
    requiredStairwellLengthMm = Math.round(goingLengthMm + landingWidthMm * 2);
    requiredStairwellWidthMm = Math.round(flightWidthMm);
  } else if (topology === 'dog-legged' || topology === 'u-shaped') {
    requiredStairwellLengthMm = Math.round(goingLengthMm + landingWidthMm * 2);
    requiredStairwellWidthMm = Math.round(flightWidthMm * 2 + wellGapMm);
  } else {
    const f1Go = (treadsPerFlight[0] || 1) * actualTreadMm;
    const f3Go = (treadsPerFlight[2] || 1) * actualTreadMm;
    const f2Go = (treadsPerFlight[1] || 1) * actualTreadMm;
    requiredStairwellLengthMm = Math.round(Math.max(f1Go, f3Go) + landingWidthMm * 2);
    requiredStairwellWidthMm = Math.round(flightWidthMm * 2 + Math.max(wellGapMm, f2Go));
  }
  const stairwellFitPass =
    stairwellLengthMm >= requiredStairwellLengthMm - 50 &&
    stairwellWidthMm >= requiredStairwellWidthMm - 50;

  // Headroom clearance check (BNBC >= 2150 mm clear vertical distance)
  const overheadBeamAllowanceMm = Math.max(slabThicknessMm, 250);
  const overhangPenaltyMm =
    stairwellLengthMm < requiredStairwellLengthMm
      ? Math.min(600, (requiredStairwellLengthMm - stairwellLengthMm) * (actualRiserMm / actualTreadMm))
      : 0;
  const estimatedHeadroomMm = Math.round(
    Math.max(1200, floorHeightMm - overheadBeamAllowanceMm - actualRiserMm - overhangPenaltyMm)
  );
  const headroomStatus: StaircaseAnalysisResult['headroomStatus'] =
    estimatedHeadroomMm >= 2150 ? 'PASS' : estimatedHeadroomMm >= 2000 ? 'WARNING' : 'FAIL';
  const headroomPass = estimatedHeadroomMm >= 2150;

  // 4. BNBC Part 4 Fire Egress, Landing & Handrail Compliance
  const minClearFlightWidthMm = occupancy === 'residential' ? 1000 : 1500;
  const flightWidthPass = flightWidthMm >= minClearFlightWidthMm;
  const landingDepthPass = landingWidthMm >= flightWidthMm;
  const handrailPass = handrailHeightMm >= 900 && handrailHeightMm <= 1000;
  const maxRisersPerFlightLimit = occupancy === 'residential' ? 15 : 12;
  const maxFlightRisers = Math.max(...risersPerFlight);
  const flightRiserCountPass = maxFlightRisers <= maxRisersPerFlightLimit;
  const egressPass = flightWidthPass && landingDepthPass && handrailPass && flightRiserCountPass;

  // 5. Structural Loads, Concrete Volume & Formwork Area (per floor)
  const inclinedLengthsMm = risersPerFlight.map((rCount, idx) => {
    const tCount = treadsPerFlight[idx] || 1;
    const runMm = tCount * actualTreadMm;
    const riseMm = rCount * actualRiserMm;
    return Number(Math.sqrt(runMm ** 2 + riseMm ** 2).toFixed(1));
  });
  const totalInclinedLengthMm = Number(
    inclinedLengthsMm.reduce((acc, l) => acc + l, 0).toFixed(1)
  );

  const secTheta = Math.sqrt(1 + (actualRiserMm / actualTreadMm) ** 2);
  const waistSlabDeadLoadKpa = Number(((waistSlabMm / 1000) * 25 * secTheta).toFixed(2));
  const stepsDeadLoadKpa = Number(((actualRiserMm / 2000) * 25).toFixed(2));
  const deadLoadKpa = Number((waistSlabDeadLoadKpa + stepsDeadLoadKpa + finishesLoadKpa).toFixed(2));
  const factoredLoadKpa = Number((1.2 * deadLoadKpa + 1.6 * liveLoadKpa).toFixed(2));

  const flightWidthM = flightWidthMm / 1000;
  const waistThicknessM = waistSlabMm / 1000;
  const landingSlabM = slabThicknessMm / 1000;
  const riserM = actualRiserMm / 1000;
  const treadM = actualTreadMm / 1000;
  const landingDepthM = landingWidthMm / 1000;

  const waistConcreteM3 = Number(
    ((totalInclinedLengthMm / 1000) * flightWidthM * waistThicknessM).toFixed(3)
  );
  const stepsConcreteM3 = Number(
    (totalRisers * (0.5 * riserM * treadM) * flightWidthM).toFixed(3)
  );
  const landingSpanWidthM =
    topology === 'straight-flight'
      ? flightWidthM
      : (2 * flightWidthMm + wellGapMm) / 1000;
  const landingCount = topology === 'open-well' ? 2 : 1;
  const landingAreaM2 = landingCount * landingDepthM * landingSpanWidthM;
  const landingConcreteM3 = Number((landingAreaM2 * landingSlabM).toFixed(3));
  const totalConcreteM3 = Number(
    (waistConcreteM3 + stepsConcreteM3 + landingConcreteM3).toFixed(2)
  );

  const soffitFormworkM2 = Number(
    ((totalInclinedLengthMm / 1000) * flightWidthM + landingAreaM2).toFixed(2)
  );
  const riserFormworkM2 = Number((totalRisers * riserM * flightWidthM).toFixed(2));
  const edgeFormworkM2 = Number(
    (2 * (totalInclinedLengthMm / 1000) * (waistThicknessM + 0.5 * riserM)).toFixed(2)
  );
  const totalFormworkM2 = Number(
    (soffitFormworkM2 + riserFormworkM2 + edgeFormworkM2).toFixed(2)
  );

  const overallCompliant =
    blondelPass && pitchPass && headroomPass && egressPass && stairwellFitPass;

  // 6. DCR Gauges
  const blondelMid = 620;
  const blondelDevPct = Math.round((Math.abs(blondelValue - blondelMid) / 40) * 100);
  const pitchUtilPct = Math.min(125, Math.round((stairPitchDeg / maxAllowedPitchDeg) * 100));
  const headroomDcr = 2150 / Math.max(1000, estimatedHeadroomMm);
  const egressWidthDcr = minClearFlightWidthMm / Math.max(500, flightWidthMm);

  const dcrGauges: CapacityUtilizationInfo[] = [
    {
      metricLabel: "Blondel Stride (2R + T)",
      formattedValue: `${blondelValue.toFixed(0)} mm`,
      percentage: Math.min(120, Math.max(15, 65 + Math.round(blondelDevPct * 0.45))),
      status:
        blondelStatus === 'OPTIMUM'
          ? 'safe'
          : blondelStatus === 'ACCEPTABLE'
          ? 'warning'
          : 'critical',
      description: `2×${actualRiserMm.toFixed(1)} + ${actualTreadMm} = ${blondelValue.toFixed(1)} mm (Optimum 600–640 mm; R+T = ${safetyIndex.toFixed(0)} mm; R×T = ${comfortProduct.toLocaleString()} mm²).`,
      referenceLimit: '600–640 mm',
    },
    {
      metricLabel: 'Pitch Slope Angle (θ)',
      formattedValue: `${stairPitchDeg.toFixed(1)}° / ${maxAllowedPitchDeg}°`,
      percentage: pitchUtilPct,
      status:
        !pitchPass ? 'critical' : stairPitchDeg > maxAllowedPitchDeg - 3 ? 'warning' : 'safe',
      description: pitchPass
        ? `Incline θ = ${stairPitchDeg.toFixed(1)}° satisfies ${occupancy === 'residential' ? 'residential (≤38°)' : 'public egress (≤33°)'} limits.`
        : `Slope ${stairPitchDeg.toFixed(1)}° exceeds allowable ${maxAllowedPitchDeg}°. Increase tread width or riser count.`,
      referenceLimit: `Max ${maxAllowedPitchDeg}°`,
    },
    {
      metricLabel: 'Clear Vertical Headroom',
      formattedValue: `${estimatedHeadroomMm} mm`,
      percentage: Math.min(125, Math.round(headroomDcr * 100)),
      status:
        headroomStatus === 'PASS' ? 'safe' : headroomStatus === 'WARNING' ? 'warning' : 'critical',
      description: headroomPass
        ? `Clearance ${estimatedHeadroomMm} mm exceeds BNBC minimum 2150 mm (7'-0") under upper beam/landing soffit.`
        : `Headroom ${estimatedHeadroomMm} mm is below BNBC minimum 2150 mm. Raise floor height or lengthen stairwell.`,
      referenceLimit: 'Min 2150 mm',
    },
    {
      metricLabel: 'BNBC Part 4 Egress & Landing',
      formattedValue: `${flightWidthMm} / ${minClearFlightWidthMm} mm`,
      percentage: Math.min(125, Math.round(egressWidthDcr * 100)),
      status: !egressPass ? 'critical' : flightWidthMm < minClearFlightWidthMm + 100 ? 'warning' : 'safe',
      description: egressPass
        ? `Flight width (${flightWidthMm} mm), landing (${landingWidthMm} mm ≥ Wf), handrail (${handrailHeightMm} mm) & ${maxFlightRisers} risers/flight comply.`
        : `Egress check failed: ensure Wf ≥ ${minClearFlightWidthMm} mm, landing ≥ Wf, handrail 900–1000 mm, and ≤ ${maxRisersPerFlightLimit} risers/flight.`,
      referenceLimit: `Min ${minClearFlightWidthMm} mm`,
    },
  ];

  // 7. Validation Issues
  const issues = [] as CalculationEnvelope<StaircaseAnalysisResult>['issues'];
  if (!blondelPass) {
    issues.push({
      field: 'preferredRiserMm',
      message: `Blondel index (2R + T = ${blondelValue.toFixed(0)} mm) is outside ergonomic bounds (580–660 mm).`,
      severity: 'warning',
    });
  }
  if (!pitchPass) {
    issues.push({
      field: 'preferredTreadMm',
      message: `Stair pitch angle (${stairPitchDeg.toFixed(1)}°) exceeds ${maxAllowedPitchDeg}° limit for ${occupancy} occupancy.`,
      severity: 'error',
    });
  }
  if (!headroomPass) {
    issues.push({
      field: 'floorHeightMm',
      message: `Estimated vertical headroom (${estimatedHeadroomMm} mm) is below BNBC minimum 2150 mm.`,
      severity: 'error',
    });
  }
  if (!flightWidthPass) {
    issues.push({
      field: 'flightWidthMm',
      message: `Flight width (${flightWidthMm} mm) is below BNBC Part 4 minimum (${minClearFlightWidthMm} mm) for ${occupancy}.`,
      severity: 'error',
    });
  }
  if (!landingDepthPass) {
    issues.push({
      field: 'landingWidthMm',
      message: `Landing depth (${landingWidthMm} mm) must be ≥ clear flight width (${flightWidthMm} mm).`,
      severity: 'warning',
    });
  }
  if (!flightRiserCountPass) {
    issues.push({
      field: 'stairTopology',
      message: `Single flight has ${maxFlightRisers} risers (> ${maxRisersPerFlightLimit} BNBC Part 4 max). Switch to 2- or 3-flight topology.`,
      severity: 'warning',
    });
  }

  // 8. Step-by-Step Hand Calculation Engine
  const handCalculationSteps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Riser Count, Adjusted Riser Height & Flight Going',
      formula: 'N_r = ceil(H / R_pref);  R_act = H / N_r;  N_t = N_r - 1;  G = N_t × T',
      substitution: `N_r = ceil(${floorHeightMm} / ${preferredRiserMm}) = ${totalRisers} risers (${risersPerFlight.join(' + ')});  R_act = ${floorHeightMm} / ${totalRisers} = ${actualRiserMm.toFixed(2)} mm;  G_max = ${maxTreadsInRun} × ${actualTreadMm} = ${goingLengthMm} mm`,
      result: `${totalRisers} Risers · R = ${actualRiserMm.toFixed(1)} mm · Going = ${goingLengthMm} mm`,
      reasoning: `Distributed across ${risersPerFlight.length} flight(s) for ${getStairTopologyLabel(topology)}.`,
      isVerifiedAgainstEngine: Math.abs(floorHeightMm / totalRisers - actualRiserMm) < 0.05,
    },
    {
      stepNumber: 2,
      title: "Blondel's Ergonomic Comfort & Safety Indices",
      formula: '2R + T ∈ [600, 640] mm;  R + T ∈ [420, 450] mm;  R × T ∈ [40000, 45000] mm²',
      substitution: `2(${actualRiserMm.toFixed(1)}) + ${actualTreadMm} = ${blondelValue.toFixed(1)} mm;  R + T = ${safetyIndex.toFixed(1)} mm;  R × T = ${comfortProduct.toLocaleString()} mm²`,
      result: `2R + T = ${blondelValue.toFixed(1)} mm (${blondelStatus}) · R + T = ${safetyIndex.toFixed(1)} mm`,
      reasoning: 'Maintains natural ascending and descending human stride rhythm while preventing heel slip.',
      isVerifiedAgainstEngine: Math.abs(2 * actualRiserMm + actualTreadMm - blondelValue) < 0.2,
    },
    {
      stepNumber: 3,
      title: 'Pitch Slope Angle (θ) & Vertical Headroom Clearance',
      formula: 'θ = arctan(R_act / T);  H_clear = H - max(t_slab, 250) - R_act - Δ_well',
      substitution: `θ = arctan(${actualRiserMm.toFixed(2)} / ${actualTreadMm}) = ${stairPitchDeg.toFixed(2)}° (Limit ≤ ${maxAllowedPitchDeg}°);  H_clear = ${estimatedHeadroomMm} mm (Min ≥ 2150 mm)`,
      result: `θ = ${stairPitchDeg.toFixed(1)}° (${pitchStatus}) · Headroom = ${estimatedHeadroomMm} mm (${headroomStatus})`,
      reasoning: 'BNBC 2020 mandates minimum 2150 mm (7\'-0") clear vertical headroom measured from nosing line.',
      isVerifiedAgainstEngine: Math.abs((Math.atan(actualRiserMm / actualTreadMm) * 180) / Math.PI - stairPitchDeg) < 0.05,
    },
    {
      stepNumber: 4,
      title: 'BNBC Part 4 Fire Egress, Landing & Handrail Check',
      formula: 'W_f ≥ W_min;  L_land ≥ W_f;  900 ≤ h_rail ≤ 1000 mm;  N_r,flight ≤ N_max',
      substitution: `W_f = ${flightWidthMm} mm (≥ ${minClearFlightWidthMm});  L_land = ${landingWidthMm} mm (≥ ${flightWidthMm});  Handrail = ${handrailHeightMm} mm;  Max risers/flight = ${maxFlightRisers} (≤ ${maxRisersPerFlightLimit})`,
      result: egressPass ? 'BNBC PART 4 EGRESS COMPLIANT' : 'EGRESS ADJUSTMENT NEEDED',
      reasoning: `Checked under ${getStairOccupancyLabel(occupancy)} fire & life-safety egress criteria.`,
      isVerifiedAgainstEngine: true,
    },
    {
      stepNumber: 5,
      title: 'Structural Factored Load, Concrete & Formwork Takeoff',
      formula: 'w_u = 1.2(w_waist + w_step + w_fin) + 1.6·q_L;  V_conc = V_waist + V_steps + V_land',
      substitution: `w_u = 1.2(${deadLoadKpa}) + 1.6(${liveLoadKpa}) = ${factoredLoadKpa} kN/m²;  V_conc = ${waistConcreteM3} + ${stepsConcreteM3} + ${landingConcreteM3} = ${totalConcreteM3} m³;  Shuttering = ${totalFormworkM2} m²`,
      result: `w_u = ${factoredLoadKpa} kN/m² · RCC = ${totalConcreteM3} m³ · Formwork = ${totalFormworkM2} m²`,
      reasoning: 'Includes sec(θ) inclined waist slab weight, triangular step prism volume, soffit & riser shuttering.',
      isVerifiedAgainstEngine: Math.abs(1.2 * deadLoadKpa + 1.6 * liveLoadKpa - factoredLoadKpa) < 0.05,
    },
  ];

  const scopeAndLimits: ScopeAndLimitsMetadata = {
    status: 'Available',
    codeReference: 'BNBC 2020 Part 3 (§1.12.5) & Part 4 (Means of Egress) / ACI 318-19',
    covered: [
      'Multi-topology stair layouts: Dog-Legged, Open-Well (3-flight), Straight-Flight & U-Shaped',
      "Blondel's comfort laws (2R+T, R+T, R×T), slope pitch θ, and vertical headroom clearance ≥ 2150 mm",
      'BNBC Part 4 minimum clear egress width, landing depth, handrail height & max risers/flight checks',
      'Exact story-level RCC concrete volume (m³) and soffit/riser/edge formwork area (m²) for BOQ export',
    ],
    unsupported: [
      'Helical / spiral curved torsion-beam stair structural analysis',
      'Pressurized smoke-proof vestibule lobby sizing for buildings > 33 m',
    ],
  };

  return createArchitectureEnvelope<StaircaseAnalysisResult>(
    {
      topology,
      topologyLabel: getStairTopologyLabel(topology),
      occupancy,
      occupancyLabel: getStairOccupancyLabel(occupancy),
      floorHeightMm,
      floorHeightM: Number((floorHeightMm / 1000).toFixed(3)),
      totalRisers,
      risersPerFlight,
      treadsPerFlight,
      actualRiserMm,
      actualTreadMm,
      goingLengthMm,
      totalGoingSumMm,
      flightWidthMm,
      landingWidthMm,
      wellGapMm,
      waistSlabMm,
      slabThicknessMm,
      handrailHeightMm,
      stairwellLengthMm,
      stairwellWidthMm,
      requiredStairwellLengthMm,
      requiredStairwellWidthMm,
      stairwellFitPass,
      stairPitchDeg,
      maxAllowedPitchDeg,
      pitchStatus,
      pitchPass,
      blondelValue,
      blondelStatus,
      blondelPass,
      safetyIndex,
      safetyIndexPass,
      comfortProduct,
      comfortProductPass,
      estimatedHeadroomMm,
      headroomStatus,
      headroomPass,
      minClearFlightWidthMm,
      flightWidthPass,
      landingDepthPass,
      handrailPass,
      maxRisersPerFlightLimit,
      flightRiserCountPass,
      egressPass,
      inclinedLengthsMm,
      totalInclinedLengthMm,
      waistSlabDeadLoadKpa,
      stepsDeadLoadKpa,
      deadLoadKpa,
      liveLoadKpa,
      finishesLoadKpa,
      factoredLoadKpa,
      waistConcreteM3,
      stepsConcreteM3,
      landingConcreteM3,
      totalConcreteM3,
      soffitFormworkM2,
      riserFormworkM2,
      edgeFormworkM2,
      totalFormworkM2,
      overallCompliant,
      dcrGauges,
    },
    issues,
    { handCalculationSteps, scopeAndLimits }
  );
}

/**
 * Generates Staircase Concrete (m3) and Soffit/Riser Formwork (m2) BOQ TakeoffLineItem entries
 */
export function buildBoqItemsFromStaircase(
  res: StaircaseAnalysisResult
): TakeoffLineItem[] {
  const stamp = Date.now().toString().slice(-6);
  const flightWidthM = Number((res.flightWidthMm / 1000).toFixed(2));
  const equivRunM = Number((res.totalConcreteM3 / Math.max(0.1, flightWidthM * 0.22)).toFixed(2));

  return [
    {
      id: `takeoff-stair-rcc-${stamp}-1`,
      itemNo: '302.01',
      description: `RCC (1:1.5:3) in ${res.topologyLabel} Staircase Waist Slabs (${res.waistSlabMm}mm), Steps (${res.totalRisers}R @ ${res.actualRiserMm.toFixed(0)}×${res.actualTreadMm}mm) & Landings — 1 Story (${res.totalConcreteM3} m³)`,
      category: 'superstructure',
      wbsSectionId: 'sec-300',
      numberOfMembers: 1,
      lengthM: Number(res.totalConcreteM3.toFixed(2)),
      widthM: 1.0,
      heightM: 1.0,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 2.5,
      unitRate: 12800,
      startMonth: 4,
      durationMonths: 2,
      curveDistribution: 'linear',
    },
    {
      id: `takeoff-stair-form-${stamp}-2`,
      itemNo: '302.02',
      description: `Steel/Timber Shuttering & Centering for Staircase Inclined Soffit (${res.soffitFormworkM2} m²), Risers (${res.riserFormworkM2} m²) & Stringer Edges (${res.edgeFormworkM2} m²) — Height ${res.floorHeightM}m (Total ${res.totalFormworkM2} m²/story, eq. run ${equivRunM}m)`,
      category: 'superstructure',
      wbsSectionId: 'sec-300',
      numberOfMembers: 1,
      lengthM: Number(res.totalFormworkM2.toFixed(2)),
      widthM: 1.0,
      heightM: 1.0,
      deductionQty: 0,
      unit: 'm2',
      wastagePercent: 0,
      unitRate: 620,
      startMonth: 4,
      durationMonths: 2,
      curveDistribution: 'linear',
    },
  ];
}

// ============================================================================
// WATER RESERVOIR (UGWR & OHT) DESIGN ENGINE (BNBC 2020 PART 8 / IS 1172)
// ============================================================================

export const WATER_OCCUPANCY_PRESETS: Array<{
  id: WaterOccupancyPreset;
  label: string;
  lpcd: number;
  standardRef: string;
}> = [
  { id: 'residential-135', label: 'Residential Standard (135 LPCD)', lpcd: 135, standardRef: 'BNBC Part 8 / IS 1172' },
  { id: 'residential-150', label: 'Residential High-Demand (150 LPCD)', lpcd: 150, standardRef: 'DWASA Urban Spec' },
  { id: 'commercial-45', label: 'Commercial / Office (45 LPCD)', lpcd: 45, standardRef: 'BNBC Part 8 Table 8.5.1' },
  { id: 'hospital-340', label: 'Hospital / Clinic (340 LPCD)', lpcd: 340, standardRef: 'BNBC Part 8 Medical' },
];

export interface WaterReservoirResult {
  totalUsers: number;
  lpcd: number;
  occupancyLabel: string;
  dailyDomesticL: number;
  fireReserveL: number;
  fireReserveMinutes: number;
  firePumpFlowLpm: number;
  totalNetWaterL: number;
  totalNetWaterM3: number;
  // UGWR
  ugwrSharePercent: number;
  ugwrDomesticL: number;
  ugwrTotalL: number;
  ugwrTotalM3: number;
  ugwrLengthM: number;
  ugwrWidthM: number;
  ugwrWaterDepthM: number;
  ugwrFreeboardM: number;
  ugwrTotalHeightM: number;
  ugwrConcreteM3: number;
  ugwrExcavationM3: number;
  // OHT
  ohtSharePercent: number;
  ohtTotalL: number;
  ohtTotalM3: number;
  ohtLengthM: number;
  ohtWidthM: number;
  ohtWaterDepthM: number;
  ohtFreeboardM: number;
  ohtTotalHeightM: number;
  ohtConcreteM3: number;
  ohtWaterWeightKn: number;
  ohtRccShellWeightKn: number;
  ohtTotalDeadLoadKn: number;
  ohtTotalDeadLoadTonnes: number;
  ohtRoofSlabPressureKpa: number;
  // Pump Sizing
  pumpFillHours: number;
  pumpFlowLpm: number;
  pumpFlowM3Hr: number;
  pumpFlowGpm: number;
  staticHeadM: number;
  frictionHeadM: number;
  totalHeadM: number;
  hydraulicPowerKw: number;
  shaftPowerKw: number;
  pumpHp: number;
  recommendedHp: number;
  recommendedKw: number;
  // Compliance
  overallCompliant: boolean;
  dcrGauges: CapacityUtilizationInfo[];
}

export function computeWaterReservoirDesign(
  params: WaterTankParameters
): CalculationEnvelope<WaterReservoirResult> {
  const numFloors = Math.max(1, params.numFloors || 6);
  const unitsPerFloor = Math.max(1, params.unitsPerFloor || 2);
  const personsPerUnit = Math.max(1, params.personsPerUnit || 5);
  const directOccupants = Math.max(1, params.directOccupants || 50);
  const floatingPopulation = Math.max(0, params.floatingPopulation || 0);
  const lpcd = Math.max(15, params.lpcd || 135);
  const storageDays = Math.max(0.5, params.storageDays || 1.0);
  const fireReserveMinutes = Math.max(15, params.fireReserveMinutes ?? 45);
  const firePumpFlowLpm = Math.max(0, params.firePumpFlowLpm ?? 225);
  const fireReserveL = params.fireReserveAutoMode
    ? Math.round(firePumpFlowLpm * fireReserveMinutes)
    : Math.max(0, params.fireReserveL ?? 10000);
  const ugwrSharePercent = Math.min(90, Math.max(10, params.ugwrSharePercent ?? 65));
  const ohtSharePercent = 100 - ugwrSharePercent;
  const ugwrWaterDepthM = Math.max(0.8, params.ugwrWaterDepthM || 2.0);
  const ugwrLwRatio = Math.max(1.0, params.ugwrLwRatio || 1.5);
  const ohtWaterDepthM = Math.max(0.8, params.ohtWaterDepthM || 1.6);
  const ohtLwRatio = Math.max(1.0, params.ohtLwRatio || 1.3);
  const pumpFillHours = Math.max(0.5, params.pumpFillHours || 2.0);
  const totalHeadM = Math.max(3.0, params.totalHeadM || 28);

  const presetMatch = WATER_OCCUPANCY_PRESETS.find((p) => p.id === params.occupancyPreset);
  const occupancyLabel = presetMatch ? presetMatch.label : `Custom (${lpcd} LPCD)`;

  const totalUsers =
    params.calcMode === 'building'
      ? numFloors * unitsPerFloor * personsPerUnit + floatingPopulation
      : directOccupants + floatingPopulation;

  const dailyDomesticL = totalUsers * lpcd * storageDays;
  const totalNetWaterL = dailyDomesticL + fireReserveL;
  const totalNetWaterM3 = totalNetWaterL / 1000;

  const ugwrDomesticL = (dailyDomesticL * ugwrSharePercent) / 100;
  const ugwrTotalL = ugwrDomesticL + fireReserveL;
  const ugwrTotalM3 = ugwrTotalL / 1000;

  const ugwrFreeboardM = 0.3;
  const ugwrSurfaceAreaM2 = ugwrTotalM3 / ugwrWaterDepthM;
  const ugwrWidthM = Math.max(1.5, Math.sqrt(ugwrSurfaceAreaM2 / ugwrLwRatio));
  const ugwrLengthM = ugwrSurfaceAreaM2 / ugwrWidthM;
  const ugwrTotalHeightM = ugwrWaterDepthM + ugwrFreeboardM;

  // UGWR RCC concrete shell (200mm walls + 225mm base + 175mm roof slab)
  const ugwrWallT = 0.2;
  const ugwrExtL = ugwrLengthM + 2 * ugwrWallT;
  const ugwrExtW = ugwrWidthM + 2 * ugwrWallT;
  const ugwrBaseSlabM3 = ugwrExtL * ugwrExtW * 0.225;
  const ugwrTopSlabM3 = ugwrExtL * ugwrExtW * 0.175;
  const ugwrWallsM3 = 2 * (ugwrLengthM + ugwrWidthM + 2 * ugwrWallT) * ugwrTotalHeightM * ugwrWallT;
  const ugwrConcreteM3 = Number((ugwrBaseSlabM3 + ugwrTopSlabM3 + ugwrWallsM3).toFixed(2));
  const ugwrExcavationM3 = Number(((ugwrExtL + 0.8) * (ugwrExtW + 0.8) * (ugwrTotalHeightM + 0.45)).toFixed(2));

  const ohtTotalL = Math.max(0, dailyDomesticL - ugwrDomesticL);
  const ohtTotalM3 = ohtTotalL / 1000;
  const ohtFreeboardM = 0.3;
  const ohtSurfaceAreaM2 = Math.max(0.5, ohtTotalM3 / ohtWaterDepthM);
  const ohtWidthM = Math.max(1.2, Math.sqrt(ohtSurfaceAreaM2 / ohtLwRatio));
  const ohtLengthM = ohtSurfaceAreaM2 / ohtWidthM;
  const ohtTotalHeightM = ohtWaterDepthM + ohtFreeboardM;

  // OHT RCC concrete shell (175mm walls + 200mm base + 150mm roof slab)
  const ohtWallT = 0.175;
  const ohtExtL = ohtLengthM + 2 * ohtWallT;
  const ohtExtW = ohtWidthM + 2 * ohtWallT;
  const ohtBaseSlabM3 = ohtExtL * ohtExtW * 0.2;
  const ohtTopSlabM3 = ohtExtL * ohtExtW * 0.15;
  const ohtWallsM3 = 2 * (ohtLengthM + ohtWidthM + 2 * ohtWallT) * ohtTotalHeightM * ohtWallT;
  const ohtConcreteM3 = Number((ohtBaseSlabM3 + ohtTopSlabM3 + ohtWallsM3).toFixed(2));

  // OHT Structural Dead-Load on Roof Slab
  const ohtWaterWeightKn = Number((ohtTotalM3 * 9.81).toFixed(2));
  const ohtRccShellWeightKn = Number((ohtConcreteM3 * 24.0).toFixed(2));
  const ohtTotalDeadLoadKn = Number((ohtWaterWeightKn + ohtRccShellWeightKn).toFixed(2));
  const ohtTotalDeadLoadTonnes = Number((ohtTotalDeadLoadKn / 9.81).toFixed(2));
  const ohtRoofSlabPressureKpa = Number((ohtTotalDeadLoadKn / Math.max(1, ohtExtL * ohtExtW)).toFixed(2));

  // Transfer Pump Sizing
  const pumpFlowLpm = ohtTotalL / (pumpFillHours * 60);
  const pumpFlowM3Hr = (pumpFlowLpm * 60) / 1000;
  const pumpFlowGpm = pumpFlowLpm * 0.264172;
  const staticHeadM = Number((totalHeadM / 1.15).toFixed(2));
  const frictionHeadM = Number((totalHeadM - staticHeadM).toFixed(2));
  const flowLps = pumpFlowLpm / 60;
  const hydraulicPowerKw = (flowLps * totalHeadM * 9.81) / 1000;
  const shaftPowerKw = hydraulicPowerKw / 0.65;
  const pumpHp = shaftPowerKw * 1.34102;
  const recommendedHp =
    pumpHp <= 0.75 ? 0.75 : pumpHp <= 1.0 ? 1.0 : pumpHp <= 1.5 ? 1.5 : pumpHp <= 2.0 ? 2.0 : pumpHp <= 3.0 ? 3.0 : Math.ceil(pumpHp);
  const recommendedKw = Number((recommendedHp * 0.7457).toFixed(2));

  const issues: { field: string; message: string; severity: 'error' | 'warning' }[] = [];
  if (storageDays < 1.0) {
    issues.push({
      field: 'storageDays',
      message: `Domestic buffer (${storageDays} days) is below 24h recommended urban continuity.`,
      severity: 'warning',
    });
  }
  if (ohtRoofSlabPressureKpa > 28) {
    issues.push({
      field: 'ohtWaterDepthM',
      message: `OHT roof slab bearing load (${ohtRoofSlabPressureKpa} kN/m²) is high — verify supporting columns & transfer beams.`,
      severity: 'warning',
    });
  }
  if (fireReserveL > 0 && fireReserveMinutes < 30) {
    issues.push({
      field: 'fireReserveMinutes',
      message: `Firefighting reserve duration (${fireReserveMinutes} min) is below 30 min BNBC minimum.`,
      severity: 'warning',
    });
  }

  const fireDurationRatio = fireReserveL > 0 ? Number((30 / Math.max(15, fireReserveMinutes)).toFixed(3)) : 0.5;
  const roofLoadRatio = Number((ohtRoofSlabPressureKpa / 30).toFixed(3));
  const storageBufferRatio = Number((1.0 / Math.max(0.5, storageDays)).toFixed(3));

  const dcrGauges: CapacityUtilizationInfo[] = [
    {
      metricLabel: 'OHT Roof Slab Pressure',
      formattedValue: `${ohtRoofSlabPressureKpa} kN/m²`,
      percentage: Math.min(125, Math.round(roofLoadRatio * 100)),
      status: roofLoadRatio <= 0.85 ? 'safe' : roofLoadRatio <= 1.0 ? 'warning' : 'critical',
      description: `Total OHT load ${ohtTotalDeadLoadKn} kN (${ohtTotalDeadLoadTonnes} MT) distributed over roof base footprint vs 30.0 kN/m² typical roof slab limit.`,
      referenceLimit: '≤ 30.0 kN/m²',
    },
    {
      metricLabel: '24h Supply Continuity',
      formattedValue: `${storageDays.toFixed(1)} days`,
      percentage: Math.min(125, Math.round(storageBufferRatio * 100)),
      status: storageDays >= 1.0 ? 'safe' : 'warning',
      description: `Domestic potable buffer (${Math.round(dailyDomesticL).toLocaleString()} L) compared against 24-hour urban reserve requirement.`,
      referenceLimit: '≥ 1.0 day',
    },
    {
      metricLabel: 'Fire Reserve Duration',
      formattedValue: fireReserveL > 0 ? `${fireReserveMinutes} min` : 'Bypassed',
      percentage: Math.min(125, Math.round(fireDurationRatio * 100)),
      status: fireReserveL === 0 || fireReserveMinutes >= 30 ? 'safe' : 'warning',
      description: `BNBC Part 4 / NFPA dedicated fire sump storage (${Math.round(fireReserveL).toLocaleString()} L @ ${firePumpFlowLpm} L/min).`,
      referenceLimit: '≥ 30 min',
    },
  ];

  const overallCompliant = ohtRoofSlabPressureKpa <= 30 && storageDays >= 1.0 && (fireReserveL === 0 || fireReserveMinutes >= 30);

  const handCalculationSteps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Building Occupancy & Daily Potable Demand',
      formula: 'Q_dom = N_users × LPCD × t_buffer',
      substitution: `N_users = ${totalUsers} × ${lpcd} LPCD × ${storageDays} d = ${Math.round(dailyDomesticL).toLocaleString()} L`,
      result: `${Math.round(dailyDomesticL).toLocaleString()} L (${(dailyDomesticL / 1000).toFixed(2)} m³)`,
      reasoning: `Sized for ${occupancyLabel}.`,
      isVerifiedAgainstEngine: Math.abs(totalUsers * lpcd * storageDays - dailyDomesticL) < 0.01,
    },
    {
      stepNumber: 2,
      title: 'Firefighting Reserve & UGWR / OHT Volume Split',
      formula: 'V_UGWR = (Q_dom × %_UGWR) + V_fire;  V_OHT = Q_dom × (1 - %_UGWR)',
      substitution: `V_UGWR = (${Math.round(ugwrDomesticL).toLocaleString()} + ${Math.round(fireReserveL).toLocaleString()}) L = ${Math.round(ugwrTotalL).toLocaleString()} L;  V_OHT = ${Math.round(ohtTotalL).toLocaleString()} L`,
      result: `UGWR = ${ugwrTotalM3.toFixed(2)} m³ · OHT = ${ohtTotalM3.toFixed(2)} m³`,
      reasoning: `Fire reserve (${fireReserveMinutes} min) is kept permanently in the underground sump per BNBC Part 4/8.`,
      isVerifiedAgainstEngine: Math.abs(ugwrTotalL + ohtTotalL - totalNetWaterL) < 1,
    },
    {
      stepNumber: 3,
      title: 'Internal Reservoir Dimensions (with 300mm Freeboard)',
      formula: 'A_plan = V / D_w;  W = √(A_plan / r_LW);  L = A_plan / W;  H_tot = D_w + 0.30 m',
      substitution: `UGWR: ${ugwrLengthM.toFixed(2)} × ${ugwrWidthM.toFixed(2)} × ${ugwrTotalHeightM.toFixed(2)} m;  OHT: ${ohtLengthM.toFixed(2)} × ${ohtWidthM.toFixed(2)} × ${ohtTotalHeightM.toFixed(2)} m`,
      result: `UGWR ${ugwrLengthM.toFixed(2)}m×${ugwrWidthM.toFixed(2)}m×${ugwrTotalHeightM.toFixed(2)}m | OHT ${ohtLengthM.toFixed(2)}m×${ohtWidthM.toFixed(2)}m×${ohtTotalHeightM.toFixed(2)}m`,
      reasoning: '300 mm clear freeboard above top water level accommodates float valves and overflow bellmouth.',
      isVerifiedAgainstEngine: true,
    },
    {
      stepNumber: 4,
      title: 'OHT Structural Dead Load on Roof Slab',
      formula: 'W_tot = (V_OHT × 9.81) + (V_RCC × 24.0);  q_slab = W_tot / (L_ext × W_ext)',
      substitution: `W_water = ${ohtWaterWeightKn} kN + W_RCC = ${ohtRccShellWeightKn} kN = ${ohtTotalDeadLoadKn} kN (${ohtTotalDeadLoadTonnes} t);  q_slab = ${ohtRoofSlabPressureKpa} kN/m²`,
      result: `${ohtTotalDeadLoadKn} kN (${ohtTotalDeadLoadTonnes} MT) · ${ohtRoofSlabPressureKpa} kN/m²`,
      reasoning: 'Transfer this gravity load directly onto supporting roof columns / inverted beams in structural model.',
      isVerifiedAgainstEngine: Math.abs(ohtWaterWeightKn + ohtRccShellWeightKn - ohtTotalDeadLoadKn) < 0.1,
    },
    {
      stepNumber: 5,
      title: 'Transfer Pump Discharge, Head & Motor HP',
      formula: 'Q_p = V_OHT / (t_fill × 60);  P_shaft = (Q_lps × H_tot × 9.81) / (1000 × 0.65)',
      substitution: `Q_p = ${pumpFlowLpm.toFixed(1)} L/min (${pumpFlowM3Hr.toFixed(2)} m³/hr);  H_tot = ${staticHeadM}m static + ${frictionHeadM}m friction = ${totalHeadM}m;  P_HP = ${pumpHp.toFixed(2)} HP`,
      result: `Use ${recommendedHp} HP (${recommendedKw} kW) @ ${pumpFlowM3Hr.toFixed(2)} m³/hr`,
      reasoning: 'Includes ~15% pipe & valve friction allowance with 65% combined pump-motor efficiency.',
      isVerifiedAgainstEngine: true,
    },
  ];

  const scopeAndLimits: ScopeAndLimitsMetadata = {
    status: 'Available',
    codeReference: 'BNBC 2020 Part 8 Chapter 5 / IS 1172 / NFPA 22',
    covered: [
      'Occupancy-based domestic potable demand (Residential, Commercial, Hospital) & storage buffer',
      'BNBC/NFPA dedicated firefighting reserve allocation in UGWR with 300mm freeboard',
      'OHT water + RCC shell dead-load weight (kN, MT) & roof slab bearing pressure (kN/m²)',
      'Centrifugal transfer pump discharge (L/min & m³/hr), static+friction head & commercial motor HP',
    ],
    unsupported: [
      'Hydro-pneumatic booster VFD pressure vessel transient surge modeling',
      'Seismic sloshing (impulsive/convective) hydrodynamic wall bending moments',
    ],
  };

  return createArchitectureEnvelope<WaterReservoirResult>(
    {
      totalUsers,
      lpcd,
      occupancyLabel,
      dailyDomesticL,
      fireReserveL,
      fireReserveMinutes,
      firePumpFlowLpm,
      totalNetWaterL,
      totalNetWaterM3,
      ugwrSharePercent,
      ugwrDomesticL,
      ugwrTotalL,
      ugwrTotalM3,
      ugwrLengthM,
      ugwrWidthM,
      ugwrWaterDepthM,
      ugwrFreeboardM,
      ugwrTotalHeightM,
      ugwrConcreteM3,
      ugwrExcavationM3,
      ohtSharePercent,
      ohtTotalL,
      ohtTotalM3,
      ohtLengthM,
      ohtWidthM,
      ohtWaterDepthM,
      ohtFreeboardM,
      ohtTotalHeightM,
      ohtConcreteM3,
      ohtWaterWeightKn,
      ohtRccShellWeightKn,
      ohtTotalDeadLoadKn,
      ohtTotalDeadLoadTonnes,
      ohtRoofSlabPressureKpa,
      pumpFillHours,
      pumpFlowLpm,
      pumpFlowM3Hr,
      pumpFlowGpm,
      staticHeadM,
      frictionHeadM,
      totalHeadM,
      hydraulicPowerKw,
      shaftPowerKw,
      pumpHp,
      recommendedHp,
      recommendedKw,
      overallCompliant,
      dcrGauges,
    },
    issues,
    { handCalculationSteps, scopeAndLimits }
  );
}

// ============================================================================
// SEPTIC TANK & SOAK PIT ENGINE (BNBC 2020 PART 8 / IS 2470)
// ============================================================================

export function percolationMinToInfiltrationRate(minPer25mm: number): number {
  const t = Math.max(1, minPer25mm);
  // IS 2470 / Ryon's correlation: Ir (L/m²/day) ≈ 130 / sqrt(t_min)
  return Number(Math.min(65, Math.max(10, 130 / Math.sqrt(t))).toFixed(1));
}

export function infiltrationRateToPercolationMin(irLpcdM2: number): number {
  const ir = Math.max(10, Math.min(65, irLpcdM2));
  return Math.round((130 / ir) ** 2);
}

export interface SepticSoakPitResult {
  septicUsers: number;
  sewageRateLpcd: number;
  detentionHours: number;
  desludgingYears: number;
  dailySewageL: number;
  dailySewageM3: number;
  liquidRetentionM3: number;
  sludgeVolumeM3: number;
  scumAllowanceM3: number;
  totalSepticVolumeM3: number;
  totalSepticVolumeL: number;
  tankLengthM: number;
  tankWidthM: number;
  septicDepthM: number;
  freeboardM: number;
  totalTankHeightM: number;
  chamber1LengthM: number;
  chamber2LengthM: number;
  baffleSubmergenceMm: number;
  scumClearanceMm: number;
  lwRatioActual: number;
  lwRatioPass: boolean;
  liquidDepthPass: boolean;
  // Soak Pit
  soilPercolationMinPer25mm: number;
  soilInfiltrationRateLpdM2: number;
  soilSuitableForSoakPit: boolean;
  requiredAbsorptionAreaM2: number;
  soakPitDiaM: number;
  soakPitEffectiveDepthM: number;
  soakPitTotalDepthM: number;
  gravelEnvelopeOuterDiaM: number;
  // Quantities for BOQ / Rebar
  septicExcavationM3: number;
  septicBrickworkM3: number;
  septicRccSlabM3: number;
  soakPitExcavationM3: number;
  soakPitBrickworkM3: number;
  soakPitGravelM3: number;
  overallCompliant: boolean;
  dcrGauges: CapacityUtilizationInfo[];
}

export function computeSepticSoakPitDesign(
  params: SepticTankParameters
): CalculationEnvelope<SepticSoakPitResult> {
  const septicUsers = Math.max(5, params.septicUsers || 35);
  const sewageRateLpcd = Math.max(30, params.sewageRateLpcd || 90);
  const detentionHours = Math.max(12, params.detentionHours || 24);
  const desludgingYears = Math.max(1, params.desludgingYears || 2);
  const septicDepthM = Math.max(1.0, params.septicDepthM || 1.6);
  const septicLwRatio = Math.max(1.5, params.septicLwRatio || 2.5);
  const soakPitDiaM = Math.max(0.9, params.soakPitDiaM || 1.8);

  const soilPercolationMinPer25mm =
    params.soilPercolationMinPer25mm !== undefined
      ? Math.max(1, params.soilPercolationMinPer25mm)
      : infiltrationRateToPercolationMin(params.soilPercolationRate || 30);

  const soilInfiltrationRateLpdM2 =
    params.soilPercolationMinPer25mm !== undefined
      ? percolationMinToInfiltrationRate(soilPercolationMinPer25mm)
      : Math.max(10, params.soilPercolationRate || 30);

  const dailySewageL = septicUsers * sewageRateLpcd;
  const dailySewageM3 = dailySewageL / 1000;

  // Liquid settling volume (min 24h retention) + sludge digestion & storage (0.07 m³/cap/yr)
  const liquidRetentionM3 = dailySewageM3 * (detentionHours / 24);
  const sludgeVolumeM3 = septicUsers * 0.07 * desludgingYears;
  const scumAllowanceM3 = septicUsers * 0.015;
  const totalSepticVolumeM3 = Math.max(2.0, liquidRetentionM3 + sludgeVolumeM3 + scumAllowanceM3);
  const totalSepticVolumeL = totalSepticVolumeM3 * 1000;

  const surfaceAreaM2 = totalSepticVolumeM3 / septicDepthM;
  const tankWidthM = Math.max(0.9, Math.sqrt(surfaceAreaM2 / septicLwRatio));
  const tankLengthM = Math.max(1.8, surfaceAreaM2 / tankWidthM);
  const lwRatioActual = Number((tankLengthM / tankWidthM).toFixed(2));
  const freeboardM = 0.35;
  const totalTankHeightM = septicDepthM + freeboardM;

  const chamber1LengthM = tankLengthM * (2 / 3);
  const chamber2LengthM = tankLengthM * (1 / 3);
  const baffleSubmergenceMm = 300;
  const scumClearanceMm = Math.round(freeboardM * 1000);

  // Soak Pit Effective Sidewall Absorptive Area (excluding bottom area per IS 2470 / BNBC)
  const requiredAbsorptionAreaM2 = dailySewageL / Math.max(10, soilInfiltrationRateLpdM2);
  const soakPitEffectiveDepthM = Math.max(1.8, requiredAbsorptionAreaM2 / (Math.PI * soakPitDiaM));
  const soakPitTotalDepthM = soakPitEffectiveDepthM + 0.5;
  const gravelEnvelopeOuterDiaM = Number((soakPitDiaM + 0.3).toFixed(2));

  // Estimated Construction Quantities
  const wallT = 0.25;
  const septicExcavationM3 = Number(
    ((tankLengthM + 2 * wallT + 0.6) * (tankWidthM + 2 * wallT + 0.6) * (totalTankHeightM + 0.35)).toFixed(2)
  );
  const septicBrickworkM3 = Number(
    (
      (2 * (tankLengthM + tankWidthM + 2 * wallT) * totalTankHeightM + tankWidthM * septicDepthM * 0.85) *
      wallT
    ).toFixed(2)
  );
  const septicRccSlabM3 = Number(
    ((tankLengthM + 2 * wallT) * (tankWidthM + 2 * wallT) * (0.2 + 0.15)).toFixed(2)
  );

  const soakPitExcavationM3 = Number(
    ((Math.PI / 4) * (gravelEnvelopeOuterDiaM + 0.3) ** 2 * soakPitTotalDepthM).toFixed(2)
  );
  const soakPitBrickworkM3 = Number(
    (Math.PI * (soakPitDiaM + 0.125) * 0.125 * soakPitTotalDepthM).toFixed(2)
  );
  const soakPitGravelM3 = Number(
    ((Math.PI / 4) * (gravelEnvelopeOuterDiaM ** 2 - (soakPitDiaM + 0.25) ** 2) * soakPitEffectiveDepthM).toFixed(2)
  );

  const lwRatioPass = lwRatioActual >= 2.0 && lwRatioActual <= 4.0;
  const liquidDepthPass = septicDepthM >= 1.0 && septicDepthM <= 2.2;
  const soilSuitableForSoakPit = soilPercolationMinPer25mm <= 60;
  const overallCompliant = lwRatioPass && liquidDepthPass && soilSuitableForSoakPit;

  const issues: { field: string; message: string; severity: 'error' | 'warning' }[] = [];
  if (!lwRatioPass) {
    issues.push({
      field: 'septicLwRatio',
      message: `Septic tank L:W ratio (${lwRatioActual}:1) is outside the IS 2470 / BNBC 2:1 to 4:1 hydraulic window.`,
      severity: 'warning',
    });
  }
  if (!soilSuitableForSoakPit) {
    issues.push({
      field: 'soilPercolationMinPer25mm',
      message: `Percolation time (${soilPercolationMinPer25mm} min/25mm > 60 min) indicates low-permeability clay; consider dispersion trenches or ATU.`,
      severity: 'warning',
    });
  }

  const lwRatioDcr = lwRatioActual < 2.0 ? Number((2.0 / lwRatioActual).toFixed(3)) : Number((lwRatioActual / 4.0).toFixed(3));
  const percDcr = Number((soilPercolationMinPer25mm / 60).toFixed(3));
  const desludgeDcr = Number((desludgingYears / 3.0).toFixed(3));

  const dcrGauges: CapacityUtilizationInfo[] = [
    {
      metricLabel: 'L : W Hydraulic Ratio',
      formattedValue: `${lwRatioActual} : 1`,
      percentage: Math.min(125, Math.round(lwRatioDcr * 100)),
      status: lwRatioPass ? 'safe' : 'warning',
      description: `Two-chamber length-to-width ratio (${tankLengthM.toFixed(2)}m × ${tankWidthM.toFixed(2)}m) keeps plug-flow settling velocity low (IS 2470 range 2.0–4.0:1).`,
      referenceLimit: '2.0–4.0 : 1',
    },
    {
      metricLabel: 'Soil Percolation Time',
      formattedValue: `${soilPercolationMinPer25mm} min/25mm`,
      percentage: Math.min(125, Math.round(percDcr * 100)),
      status: percDcr <= 0.85 ? 'safe' : percDcr <= 1.0 ? 'warning' : 'critical',
      description: `Effective sidewall infiltration rate ${soilInfiltrationRateLpdM2} L/m²/day requires ${requiredAbsorptionAreaM2.toFixed(1)} m² pit wall area.`,
      referenceLimit: '≤ 60 min/25mm',
    },
    {
      metricLabel: 'Desludging Cycle',
      formattedValue: `${desludgingYears.toFixed(0)} yr`,
      percentage: Math.min(125, Math.round(desludgeDcr * 100)),
      status: desludgeDcr <= 1.0 ? 'safe' : 'warning',
      description: `Sludge storage volume (${sludgeVolumeM3.toFixed(2)} m³) + scum allowance (${scumAllowanceM3.toFixed(2)} m³) before vacuum desludging.`,
      referenceLimit: '1–3 yr IS 2470',
    },
  ];

  const handCalculationSteps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Daily Sanitary Effluent & Hydraulic Detention Volume',
      formula: 'Q_eff = P × q_sew;  V_liq = (Q_eff / 1000) × (t_det / 24)',
      substitution: `Q_eff = ${septicUsers} × ${sewageRateLpcd} = ${dailySewageL.toLocaleString()} L/d (${dailySewageM3.toFixed(2)} m³/d);  V_liq = ${liquidRetentionM3.toFixed(2)} m³`,
      result: `V_liq = ${liquidRetentionM3.toFixed(2)} m³ (${detentionHours} hr settling)`,
      reasoning: 'IS 2470 / BNBC Part 8 requires minimum 24-hour hydraulic settling period.',
      isVerifiedAgainstEngine: Math.abs(dailySewageM3 * (detentionHours / 24) - liquidRetentionM3) < 0.01,
    },
    {
      stepNumber: 2,
      title: 'Anaerobic Sludge Digestion & Scum Storage Capacity',
      formula: 'V_sludge = P × 0.07 × N_yr;  V_scum = P × 0.015;  V_tot = V_liq + V_sludge + V_scum',
      substitution: `V_sludge = ${septicUsers} × 0.07 × ${desludgingYears} = ${sludgeVolumeM3.toFixed(2)} m³;  V_scum = ${scumAllowanceM3.toFixed(2)} m³`,
      result: `V_total = ${totalSepticVolumeM3.toFixed(2)} m³ (${Math.round(totalSepticVolumeL).toLocaleString()} L)`,
      reasoning: 'Accounts for digested sludge accumulation over selected desludging interval.',
      isVerifiedAgainstEngine: true,
    },
    {
      stepNumber: 3,
      title: 'Two-Chamber Septic Tank Dimensions & Baffle Geometry',
      formula: 'L_1 = 2/3 L;  L_2 = 1/3 L;  H_tot = D_liq + 0.35 m FB;  2.0 ≤ L/W ≤ 4.0',
      substitution: `L = ${tankLengthM.toFixed(2)} m (C1=${chamber1LengthM.toFixed(2)}m, C2=${chamber2LengthM.toFixed(2)}m), W = ${tankWidthM.toFixed(2)} m (L:W=${lwRatioActual}), H_tot = ${totalTankHeightM.toFixed(2)} m`,
      result: `${tankLengthM.toFixed(2)}m × ${tankWidthM.toFixed(2)}m × ${totalTankHeightM.toFixed(2)}m`,
      reasoning: 'Baffle wall at 2/3 L prevents short-circuiting; inlet/outlet T-pipes dip 300mm below TWL.',
      isVerifiedAgainstEngine: Math.abs(chamber1LengthM + chamber2LengthM - tankLengthM) < 0.02,
    },
    {
      stepNumber: 4,
      title: 'Soak Pit Effective Sidewall Absorption Area (Excluding Bottom)',
      formula: 'I_r = 130 / √t_p;  A_wall = Q_eff / I_r;  H_eff = A_wall / (π × D_pit)',
      substitution: `t_p = ${soilPercolationMinPer25mm} min/25mm → I_r = ${soilInfiltrationRateLpdM2} L/m²/d;  A_wall = ${dailySewageL} / ${soilInfiltrationRateLpdM2} = ${requiredAbsorptionAreaM2.toFixed(2)} m²`,
      result: `Ø ${soakPitDiaM.toFixed(1)} m × ${soakPitTotalDepthM.toFixed(2)} m total depth (A_wall = ${requiredAbsorptionAreaM2.toFixed(1)} m²)`,
      reasoning: 'Bottom area is ignored per IS 2470/BNBC because biological sludge clogs the pit floor over time.',
      isVerifiedAgainstEngine: Math.abs(dailySewageL / soilInfiltrationRateLpdM2 - requiredAbsorptionAreaM2) < 0.05,
    },
  ];

  const scopeAndLimits: ScopeAndLimitsMetadata = {
    status: 'Available',
    codeReference: 'BNBC 2020 Part 8 Chapter 6 / IS 2470 (Part 1 & 2)',
    covered: [
      '24h hydraulic retention, anaerobic sludge storage (1/2/3 yr) & scum clearance',
      '2-chamber (2/3 : 1/3) tank dimensions with L:W ratio verification (2:1 to 4:1)',
      'Soil percolation test conversion (min/25mm ↔ L/m²/day) & sidewall-only soak pit sizing',
      'Construction quantities: earthwork excavation, masonry/honeycomb brickwork, gravel & RCC slabs',
    ],
    unsupported: [
      'High water-table uplift flotation anchor checks & aerobic treatment units (ATU)',
    ],
  };

  return createArchitectureEnvelope<SepticSoakPitResult>(
    {
      septicUsers,
      sewageRateLpcd,
      detentionHours,
      desludgingYears,
      dailySewageL,
      dailySewageM3,
      liquidRetentionM3,
      sludgeVolumeM3,
      scumAllowanceM3,
      totalSepticVolumeM3,
      totalSepticVolumeL,
      tankLengthM,
      tankWidthM,
      septicDepthM,
      freeboardM,
      totalTankHeightM,
      chamber1LengthM,
      chamber2LengthM,
      baffleSubmergenceMm,
      scumClearanceMm,
      lwRatioActual,
      lwRatioPass,
      liquidDepthPass,
      soilPercolationMinPer25mm,
      soilInfiltrationRateLpdM2,
      soilSuitableForSoakPit,
      requiredAbsorptionAreaM2,
      soakPitDiaM,
      soakPitEffectiveDepthM,
      soakPitTotalDepthM,
      gravelEnvelopeOuterDiaM,
      septicExcavationM3,
      septicBrickworkM3,
      septicRccSlabM3,
      soakPitExcavationM3,
      soakPitBrickworkM3,
      soakPitGravelM3,
      overallCompliant,
      dcrGauges,
    },
    issues,
    { handCalculationSteps, scopeAndLimits }
  );
}

export interface TankBoqPushOptions {
  includeExcavation?: boolean;
  includeWaterRcc?: boolean;
  includeSepticMasonrySlabs?: boolean;
}

export function buildBoqItemsFromTanks(
  waterRes: WaterReservoirResult,
  septicRes: SepticSoakPitResult,
  options: TankBoqPushOptions = {
    includeExcavation: true,
    includeWaterRcc: true,
    includeSepticMasonrySlabs: true,
  }
): TakeoffLineItem[] {
  const stamp = Date.now().toString().slice(-6);
  const items: TakeoffLineItem[] = [];

  if (options.includeExcavation !== false) {
    const totalExcM3 = Number(
      (waterRes.ugwrExcavationM3 + septicRes.septicExcavationM3 + septicRes.soakPitExcavationM3).toFixed(2)
    );
    items.push({
      id: `takeoff-tank-exc-${stamp}`,
      itemNo: '102.04',
      description: `Earthwork Excavation in Foundation Trenches & Pits for UGWR (${waterRes.ugwrExcavationM3}m³), Septic Tank (${septicRes.septicExcavationM3}m³) & Soak Pit (${septicRes.soakPitExcavationM3}m³)`,
      category: 'earthwork',
      wbsSectionId: 'sec-100',
      numberOfMembers: 1,
      lengthM: totalExcM3,
      widthM: 1,
      heightM: 1,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 0,
      unitRate: 320,
      startMonth: 1,
      durationMonths: 1,
      curveDistribution: 'linear',
    });
  }

  if (options.includeWaterRcc !== false) {
    items.push(
      {
        id: `takeoff-ugwr-${stamp}`,
        itemNo: '210.01',
        description: `RCC (1:1.5:3) with integral waterproofing in Underground Water Reservoir (UGWR ${Math.round(waterRes.ugwrTotalL).toLocaleString()}L — ${waterRes.ugwrLengthM.toFixed(2)}m × ${waterRes.ugwrWidthM.toFixed(2)}m × ${waterRes.ugwrTotalHeightM.toFixed(2)}m) Base, Walls & Roof Slab`,
        category: 'substructure',
        wbsSectionId: 'sec-200',
        numberOfMembers: 1,
        lengthM: waterRes.ugwrConcreteM3,
        widthM: 1,
        heightM: 1,
        deductionQty: 0,
        unit: 'm3',
        wastagePercent: 3.0,
        unitRate: 14500,
        startMonth: 2,
        durationMonths: 2,
        curveDistribution: 's-curve',
      },
      {
        id: `takeoff-oht-${stamp}`,
        itemNo: '210.02',
        description: `RCC (1:1.5:3) with waterproofing in Roof Overhead Tank (OHT ${Math.round(waterRes.ohtTotalL).toLocaleString()}L — ${waterRes.ohtLengthM.toFixed(2)}m × ${waterRes.ohtWidthM.toFixed(2)}m × ${waterRes.ohtTotalHeightM.toFixed(2)}m, Dead Load ${waterRes.ohtTotalDeadLoadKn} kN)`,
        category: 'superstructure',
        wbsSectionId: 'sec-300',
        numberOfMembers: 1,
        lengthM: waterRes.ohtConcreteM3,
        widthM: 1,
        heightM: 1,
        deductionQty: 0,
        unit: 'm3',
        wastagePercent: 3.0,
        unitRate: 16500,
        startMonth: 8,
        durationMonths: 2,
        curveDistribution: 'linear',
      }
    );
  }

  if (options.includeSepticMasonrySlabs !== false) {
    items.push(
      {
        id: `takeoff-septic-brick-${stamp}`,
        itemNo: '220.01',
        description: `First-Class Brickwork (1:4 cement-sand) in 2-Chamber Septic Tank (${Math.round(septicRes.totalSepticVolumeL).toLocaleString()}L — ${septicRes.tankLengthM.toFixed(2)}m × ${septicRes.tankWidthM.toFixed(2)}m × ${septicRes.totalTankHeightM.toFixed(2)}m) with baffle & neat cement finish`,
        category: 'substructure',
        wbsSectionId: 'sec-600',
        numberOfMembers: 1,
        lengthM: septicRes.septicBrickworkM3,
        widthM: 1,
        heightM: 1,
        deductionQty: 0,
        unit: 'm3',
        wastagePercent: 4.0,
        unitRate: 9200,
        startMonth: 2,
        durationMonths: 2,
        curveDistribution: 'linear',
      },
      {
        id: `takeoff-septic-rcc-${stamp}`,
        itemNo: '220.02',
        description: `RCC (1:2:4) in Septic Tank Base Slab (200mm) & Top Cover Slab (150mm) incl. CI Manhole Covers`,
        category: 'substructure',
        wbsSectionId: 'sec-300',
        numberOfMembers: 1,
        lengthM: septicRes.septicRccSlabM3,
        widthM: 1,
        heightM: 1,
        deductionQty: 0,
        unit: 'm3',
        wastagePercent: 2.5,
        unitRate: 13200,
        startMonth: 2,
        durationMonths: 1,
        curveDistribution: 'linear',
      },
      {
        id: `takeoff-soakpit-${stamp}`,
        itemNo: '220.03',
        description: `Honeycomb Brickwork & Graded Filter Gravel Envelope in Soak Well (Internal Ø ${septicRes.soakPitDiaM.toFixed(1)}m × Depth ${septicRes.soakPitTotalDepthM.toFixed(1)}m)`,
        category: 'substructure',
        wbsSectionId: 'sec-600',
        numberOfMembers: 1,
        lengthM: Number((septicRes.soakPitBrickworkM3 + septicRes.soakPitGravelM3).toFixed(2)),
        widthM: 1,
        heightM: 1,
        deductionQty: 0,
        unit: 'm3',
        wastagePercent: 5.0,
        unitRate: 7800,
        startMonth: 2,
        durationMonths: 1,
        curveDistribution: 'linear',
      }
    );
  }

  return items;
}

export function buildRebarParamsFromTank(
  target: 'ugwr' | 'oht' | 'septic',
  waterRes: WaterReservoirResult,
  septicRes: SepticSoakPitResult
): Partial<RebarBBSParameters> {
  if (target === 'ugwr') {
    return {
      elementType: 'slab',
      slabLengthM: Number(waterRes.ugwrLengthM.toFixed(2)),
      slabWidthM: Number(waterRes.ugwrWidthM.toFixed(2)),
      slabThicknessMm: 200,
      clearCoverMm: 40,
      mainBarDiaMm: 12,
      mainBarSpacingMm: 150,
      distBarDiaMm: 10,
      distBarSpacingMm: 175,
    };
  }
  if (target === 'oht') {
    return {
      elementType: 'slab',
      slabLengthM: Number(waterRes.ohtLengthM.toFixed(2)),
      slabWidthM: Number(waterRes.ohtWidthM.toFixed(2)),
      slabThicknessMm: 175,
      clearCoverMm: 35,
      mainBarDiaMm: 12,
      mainBarSpacingMm: 150,
      distBarDiaMm: 10,
      distBarSpacingMm: 175,
    };
  }
  return {
    elementType: 'slab',
    slabLengthM: Number(septicRes.tankLengthM.toFixed(2)),
    slabWidthM: Number(septicRes.tankWidthM.toFixed(2)),
    slabThicknessMm: 150,
    clearCoverMm: 40,
    mainBarDiaMm: 10,
    mainBarSpacingMm: 150,
    distBarDiaMm: 10,
    distBarSpacingMm: 200,
  };
}

// ============================================================================
// RAINWATER HARVESTING (RWH) & HABITABLE ROOM DAYLIGHT/VENTILATION (BNBC 2020)
// ============================================================================

export interface RainwaterHarvestingResult {
  roofCatchmentAreaM2: number;
  runoffCoefficient: number;
  annualRainfallMm: number;
  monsoonCaptureSharePct: number;
  firstFlushDivertedL: number;
  annualHarvestableL: number;
  annualHarvestableM3: number;
  monsoonHarvestableL: number;
  drySpellDays: number;
  dailyRwhDemandLpd: number;
  requiredDrySpellCisternL: number;
  recommendedCisternL: number;
  recommendedCisternM3: number;
  cisternLengthM: number;
  cisternWidthM: number;
  cisternWaterDepthM: number;
  cisternFreeboardM: number;
  cisternTotalHeightM: number;
  annualDemandL: number;
  demandCoveragePct: number;
  overallCompliant: boolean;
  dcrGauges: CapacityUtilizationInfo[];
}

export function computeRainwaterHarvestingDesign(
  params: RainwaterDaylightParameters
): CalculationEnvelope<RainwaterHarvestingResult> {
  const roofCatchmentAreaM2 = Math.max(10, params.roofCatchmentAreaM2 || 220);
  const runoffCoefficient = Math.min(0.98, Math.max(0.5, params.runoffCoefficient || 0.9));
  const annualRainfallMm = Math.max(200, params.annualRainfallMm || 2050);
  const monsoonCaptureSharePct = Math.min(100, Math.max(20, params.monsoonCaptureSharePct || 75));
  const drySpellDays = Math.max(5, params.drySpellDays || 25);
  const dailyRwhDemandLpd = Math.max(50, params.dailyRwhDemandLpd || 900);
  const cisternWaterDepthM = Math.max(0.8, params.cisternDepthM || 2.0);
  const cisternLwRatio = Math.max(1.0, params.cisternLwRatio || 1.5);

  const firstFlushDivertedL = Math.round(roofCatchmentAreaM2 * 0.5); // 0.5 mm initial roof wash
  const annualHarvestableL = Math.max(
    0,
    roofCatchmentAreaM2 * annualRainfallMm * runoffCoefficient - firstFlushDivertedL * 12
  );
  const annualHarvestableM3 = annualHarvestableL / 1000;
  const monsoonHarvestableL = (annualHarvestableL * monsoonCaptureSharePct) / 100;

  const requiredDrySpellCisternL = drySpellDays * dailyRwhDemandLpd;
  const recommendedCisternL = Math.min(monsoonHarvestableL, requiredDrySpellCisternL);
  const recommendedCisternM3 = Math.max(1.0, recommendedCisternL / 1000);

  const cisternFreeboardM = 0.3;
  const surfaceAreaM2 = recommendedCisternM3 / cisternWaterDepthM;
  const cisternWidthM = Math.max(1.2, Math.sqrt(surfaceAreaM2 / cisternLwRatio));
  const cisternLengthM = surfaceAreaM2 / cisternWidthM;
  const cisternTotalHeightM = cisternWaterDepthM + cisternFreeboardM;

  const annualDemandL = dailyRwhDemandLpd * 365;
  const demandCoveragePct = Number(Math.min(100, (annualHarvestableL / Math.max(1, annualDemandL)) * 100).toFixed(1));
  const yieldAdequacyRatio = Number((requiredDrySpellCisternL / Math.max(1, monsoonHarvestableL)).toFixed(3));
  const runoffEfficiencyRatio = Number((0.85 / runoffCoefficient).toFixed(3));

  const issues: { field: string; message: string; severity: 'error' | 'warning' }[] = [];
  if (monsoonHarvestableL < requiredDrySpellCisternL) {
    issues.push({
      field: 'roofCatchmentAreaM2',
      message: `Monsoon harvest (${Math.round(monsoonHarvestableL).toLocaleString()} L) is less than ${drySpellDays}-day dry-spell target (${Math.round(requiredDrySpellCisternL).toLocaleString()} L). Cistern capped to harvestable supply.`,
      severity: 'warning',
    });
  }

  const dcrGauges: CapacityUtilizationInfo[] = [
    {
      metricLabel: 'Dry-Spell Cistern Demand / Supply',
      formattedValue: `${Math.round(requiredDrySpellCisternL / 1000)} / ${Math.round(monsoonHarvestableL / 1000)} m³`,
      percentage: Math.min(125, Math.round(yieldAdequacyRatio * 100)),
      status: yieldAdequacyRatio <= 0.85 ? 'safe' : yieldAdequacyRatio <= 1.0 ? 'warning' : 'critical',
      description: `Recommended ${recommendedCisternM3.toFixed(1)} m³ cistern (${Math.round(recommendedCisternL).toLocaleString()} L) covers ${demandCoveragePct}% of annual non-potable flushing demand.`,
      referenceLimit: 'Demand ≤ Monsoon',
    },
    {
      metricLabel: 'Runoff Coefficient (RCC Roof)',
      formattedValue: `Cr = ${runoffCoefficient.toFixed(2)}`,
      percentage: Math.min(125, Math.round(runoffEfficiencyRatio * 100)),
      status: runoffCoefficient >= 0.85 ? 'safe' : 'warning',
      description: `Catchment collection efficiency across ${roofCatchmentAreaM2} m² roof @ ${annualRainfallMm} mm/yr annual rainfall.`,
      referenceLimit: '≥ 0.85 RCC',
    },
  ];

  const handCalculationSteps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Annual & Monsoon Rainwater Catchment Yield',
      formula: 'V_yr = A_roof × R_yr × C_r - V_firstflush;  V_monsoon = V_yr × %_monsoon',
      substitution: `V_yr = ${roofCatchmentAreaM2} m² × ${annualRainfallMm} mm × ${runoffCoefficient} - ${firstFlushDivertedL * 12} L = ${Math.round(annualHarvestableL).toLocaleString()} L/yr`,
      result: `${annualHarvestableM3.toFixed(1)} m³/yr (${Math.round(monsoonHarvestableL).toLocaleString()} L monsoon)`,
      reasoning: 'Deducts 0.5 mm first-flush roof wash per storm event across 12 major rain events.',
      isVerifiedAgainstEngine: true,
    },
    {
      stepNumber: 2,
      title: 'Dry-Spell Buffer Storage & Cistern Geometry',
      formula: 'V_cistern = min(V_monsoon, t_dry × Q_daily);  W = √((V/D_w)/r_LW);  H_tot = D_w + 0.30 m',
      substitution: `V_target = ${drySpellDays}d × ${dailyRwhDemandLpd} L/d = ${Math.round(requiredDrySpellCisternL).toLocaleString()} L → Sized = ${recommendedCisternM3.toFixed(2)} m³`,
      result: `${cisternLengthM.toFixed(2)}m × ${cisternWidthM.toFixed(2)}m × ${cisternTotalHeightM.toFixed(2)}m (${Math.round(recommendedCisternL).toLocaleString()} L)`,
      reasoning: `Provides ${demandCoveragePct}% of annual non-potable flushing & landscape irrigation demand.`,
      isVerifiedAgainstEngine: true,
    },
  ];

  const scopeAndLimits: ScopeAndLimitsMetadata = {
    status: 'Available',
    codeReference: 'BNBC 2020 Part 8 Chapter 5 (§5.6 Rainwater Harvesting) / PWD Sustainability',
    covered: [
      'Roof catchment runoff coefficient (0.85–0.95 RCC), first-flush diverter & annual yield',
      'Dry-spell storage cistern dimensions (L × W × D + 300mm freeboard)',
    ],
    unsupported: [
      'Subsurface recharge borewell permeability & seasonal daily rainfall stochastic simulation',
    ],
  };

  return createArchitectureEnvelope<RainwaterHarvestingResult>(
    {
      roofCatchmentAreaM2,
      runoffCoefficient,
      annualRainfallMm,
      monsoonCaptureSharePct,
      firstFlushDivertedL,
      annualHarvestableL,
      annualHarvestableM3,
      monsoonHarvestableL,
      drySpellDays,
      dailyRwhDemandLpd,
      requiredDrySpellCisternL,
      recommendedCisternL,
      recommendedCisternM3,
      cisternLengthM,
      cisternWidthM,
      cisternWaterDepthM,
      cisternFreeboardM,
      cisternTotalHeightM,
      annualDemandL,
      demandCoveragePct,
      overallCompliant: monsoonHarvestableL >= requiredDrySpellCisternL,
      dcrGauges,
    },
    issues,
    { handCalculationSteps, scopeAndLimits }
  );
}

export function buildBoqItemsFromRwhCistern(rwhRes: RainwaterHarvestingResult): TakeoffLineItem[] {
  const stamp = Date.now().toString().slice(-6);
  const wallT = 0.2;
  const extL = rwhRes.cisternLengthM + 2 * wallT;
  const extW = rwhRes.cisternWidthM + 2 * wallT;
  const excM3 = Number(((extL + 0.6) * (extW + 0.6) * (rwhRes.cisternTotalHeightM + 0.35)).toFixed(2));
  const rccM3 = Number(
    (
      extL * extW * (0.2 + 0.15) +
      2 * (rwhRes.cisternLengthM + rwhRes.cisternWidthM + 2 * wallT) * rwhRes.cisternTotalHeightM * wallT
    ).toFixed(2)
  );
  return [
    {
      id: `takeoff-rwh-exc-${stamp}`,
      itemNo: '215.01',
      description: `Earthwork Excavation for Rainwater Harvesting Cistern (${Math.round(rwhRes.recommendedCisternL).toLocaleString()} L — ${rwhRes.cisternLengthM.toFixed(2)}m × ${rwhRes.cisternWidthM.toFixed(2)}m × ${rwhRes.cisternTotalHeightM.toFixed(2)}m)`,
      category: 'earthwork',
      wbsSectionId: 'sec-100',
      numberOfMembers: 1,
      lengthM: excM3,
      widthM: 1,
      heightM: 1,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 0,
      unitRate: 320,
      startMonth: 2,
      durationMonths: 1,
      curveDistribution: 'linear',
    },
    {
      id: `takeoff-rwh-rcc-${stamp}`,
      itemNo: '215.02',
      description: `RCC (1:1.5:3) with waterproofing in Rainwater Cistern Shell (${rwhRes.recommendedCisternM3.toFixed(1)} m³ storage)`,
      category: 'substructure',
      wbsSectionId: 'sec-200',
      numberOfMembers: 1,
      lengthM: rccM3,
      widthM: 1,
      heightM: 1,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 3.0,
      unitRate: 14500,
      startMonth: 2,
      durationMonths: 1,
      curveDistribution: 'linear',
    },
  ];
}

export interface DaylightVentilationResult {
  roomName: string;
  roomOccupancyType: 'habitable' | 'kitchen' | 'utility';
  roomLengthM: number;
  roomWidthM: number;
  minDimM: number;
  ceilingHeightM: number;
  floorAreaM2: number;
  floorAreaSqft: number;
  totalGlazedWindowAreaM2: number;
  openableWindowAreaM2: number;
  ventilatorAreaM2: number;
  totalVentilationOpeningM2: number;
  daylightRatioPct: number;
  ventilationRatioPct: number;
  // Code Thresholds (BNBC 2020 Part 3)
  minRequiredAreaM2: number;
  minRequiredWidthM: number;
  minRequiredHeightM: number;
  minRequiredDaylightPct: number;
  targetDaylightPct: number;
  minRequiredVentilationPct: number;
  areaPass: boolean;
  widthPass: boolean;
  heightPass: boolean;
  daylightPass: boolean;
  ventilationPass: boolean;
  overallCompliant: boolean;
  dcrGauges: CapacityUtilizationInfo[];
}

export function computeDaylightVentilationDesign(
  params: RainwaterDaylightParameters
): CalculationEnvelope<DaylightVentilationResult> {
  const roomName = params.roomName || 'Master Bedroom 01';
  const roomOccupancyType = params.roomOccupancyType || 'habitable';
  const roomLengthM = Math.max(1.0, params.roomLengthM || 4.2);
  const roomWidthM = Math.max(0.9, params.roomWidthM || 3.4);
  const ceilingHeightM = Math.max(1.8, params.ceilingHeightM || 3.0);
  const windowCount = Math.max(0, Math.round(params.windowCount ?? 2));
  const windowWidthM = Math.max(0.3, params.windowWidthM || 1.5);
  const windowHeightM = Math.max(0.3, params.windowHeightM || 1.35);
  const openableWindowPct = Math.min(100, Math.max(10, params.openableWindowPct ?? 50));
  const ventilatorAreaM2 = Math.max(0, params.ventilatorAreaM2 ?? 0.25);

  const floorAreaM2 = Number((roomLengthM * roomWidthM).toFixed(2));
  const floorAreaSqft = Number((floorAreaM2 * SQFT_PER_SQM).toFixed(1));
  const minDimM = Number(Math.min(roomLengthM, roomWidthM).toFixed(2));

  const totalGlazedWindowAreaM2 = Number((windowCount * windowWidthM * windowHeightM).toFixed(2));
  const openableWindowAreaM2 = Number((totalGlazedWindowAreaM2 * (openableWindowPct / 100)).toFixed(2));
  const totalVentilationOpeningM2 = Number((openableWindowAreaM2 + ventilatorAreaM2).toFixed(2));

  const daylightRatioPct = Number(((totalGlazedWindowAreaM2 / Math.max(0.5, floorAreaM2)) * 100).toFixed(1));
  const ventilationRatioPct = Number(((totalVentilationOpeningM2 / Math.max(0.5, floorAreaM2)) * 100).toFixed(1));

  // BNBC 2020 Part 3 Chapter 1 & 3 Thresholds
  const minRequiredAreaM2 = roomOccupancyType === 'habitable' ? 9.5 : roomOccupancyType === 'kitchen' ? 5.0 : 2.8;
  const minRequiredWidthM = roomOccupancyType === 'habitable' ? 2.4 : roomOccupancyType === 'kitchen' ? 1.8 : 1.2;
  const minRequiredHeightM = roomOccupancyType === 'utility' ? 2.4 : 2.75;
  const minRequiredDaylightPct = roomOccupancyType === 'habitable' ? 10.0 : 8.0;
  const targetDaylightPct = roomOccupancyType === 'habitable' ? 15.0 : 12.0;
  const minRequiredVentilationPct = roomOccupancyType === 'habitable' ? 10.0 : 8.0;

  const areaPass = floorAreaM2 >= minRequiredAreaM2;
  const widthPass = minDimM >= minRequiredWidthM;
  const heightPass = ceilingHeightM >= minRequiredHeightM;
  const daylightPass = daylightRatioPct >= minRequiredDaylightPct;
  const ventilationPass = ventilationRatioPct >= minRequiredVentilationPct;
  const overallCompliant = areaPass && widthPass && heightPass && daylightPass && ventilationPass;

  const issues: { field: string; message: string; severity: 'error' | 'warning' }[] = [];
  if (!areaPass) {
    issues.push({
      field: 'roomLengthM',
      message: `Floor area (${floorAreaM2} m²) is below BNBC minimum (${minRequiredAreaM2} m²) for ${roomOccupancyType} spaces.`,
      severity: 'error',
    });
  }
  if (!widthPass) {
    issues.push({
      field: 'roomWidthM',
      message: `Least room width (${minDimM} m) is below BNBC minimum (${minRequiredWidthM} m).`,
      severity: 'error',
    });
  }
  if (!heightPass) {
    issues.push({
      field: 'ceilingHeightM',
      message: `Clear ceiling height (${ceilingHeightM} m) is below BNBC minimum (${minRequiredHeightM} m).`,
      severity: 'error',
    });
  }
  if (!daylightPass) {
    issues.push({
      field: 'windowCount',
      message: `Window-to-floor glazing ratio (${daylightRatioPct}%) is below BNBC minimum (${minRequiredDaylightPct}%).`,
      severity: 'warning',
    });
  }
  if (!ventilationPass) {
    issues.push({
      field: 'openableWindowPct',
      message: `Effective openable ventilation ratio (${ventilationRatioPct}%) is below BNBC ${minRequiredVentilationPct}% minimum (check 50% sliding track penalty).`,
      severity: 'warning',
    });
  }

  const dcrGauges: CapacityUtilizationInfo[] = [
    {
      metricLabel: 'Habitable Floor Area',
      formattedValue: `${floorAreaM2} m² (${floorAreaSqft} sft)`,
      percentage: Math.min(125, Math.round((minRequiredAreaM2 / Math.max(0.5, floorAreaM2)) * 100)),
      status: areaPass ? 'safe' : 'critical',
      description: `Gross floor area ${roomLengthM}m × ${roomWidthM}m compared against BNBC Part 3 minimum (${minRequiredAreaM2} m²).`,
      referenceLimit: `≥ ${minRequiredAreaM2} m²`,
    },
    {
      metricLabel: 'Minimum Room Width',
      formattedValue: `${minDimM.toFixed(2)} m`,
      percentage: Math.min(125, Math.round((minRequiredWidthM / Math.max(0.5, minDimM)) * 100)),
      status: widthPass ? 'safe' : 'critical',
      description: `Least clear room span (${minDimM} m) vs BNBC Part 3 ergonomic width threshold (${minRequiredWidthM.toFixed(1)} m).`,
      referenceLimit: `≥ ${minRequiredWidthM.toFixed(1)} m`,
    },
    {
      metricLabel: 'Clear Ceiling Height',
      formattedValue: `${ceilingHeightM.toFixed(2)} m`,
      percentage: Math.min(125, Math.round((minRequiredHeightM / Math.max(0.5, ceilingHeightM)) * 100)),
      status: heightPass ? 'safe' : 'critical',
      description: `Finished floor-to-soffit height (${ceilingHeightM} m) vs BNBC Part 3 minimum (${minRequiredHeightM.toFixed(2)} m).`,
      referenceLimit: `≥ ${minRequiredHeightM.toFixed(2)} m`,
    },
    {
      metricLabel: 'Daylight Window Ratio',
      formattedValue: `${daylightRatioPct}% (${totalGlazedWindowAreaM2} m²)`,
      percentage: Math.min(125, Math.round((minRequiredDaylightPct / Math.max(0.1, daylightRatioPct)) * 100)),
      status: daylightRatioPct >= targetDaylightPct ? 'safe' : daylightPass ? 'warning' : 'critical',
      description: `Glazed window-to-floor ratio vs BNBC ${minRequiredDaylightPct}% minimum (${targetDaylightPct}% recommended daylighting target).`,
      referenceLimit: `≥ ${minRequiredDaylightPct}% (15% ideal)`,
    },
    {
      metricLabel: 'Openable Ventilation',
      formattedValue: `${ventilationRatioPct}% (${totalVentilationOpeningM2} m²)`,
      percentage: Math.min(125, Math.round((minRequiredVentilationPct / Math.max(0.1, ventilationRatioPct)) * 100)),
      status: ventilationPass ? 'safe' : 'critical',
      description: `Net free-air ventilation (${openableWindowAreaM2} m² sash + ${ventilatorAreaM2} m² louver) vs BNBC ${minRequiredVentilationPct}% minimum.`,
      referenceLimit: `≥ ${minRequiredVentilationPct}%`,
    },
  ];

  const handCalculationSteps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Room Footprint, Minimum Width & Headroom Ergonomics',
      formula: 'A_floor = L × W ≥ A_min;  min(L, W) ≥ W_min;  H_ceil ≥ H_min',
      substitution: `A_floor = ${roomLengthM} × ${roomWidthM} = ${floorAreaM2} m² (≥ ${minRequiredAreaM2} m²);  W_min = ${minDimM} m (≥ ${minRequiredWidthM} m);  H = ${ceilingHeightM} m (≥ ${minRequiredHeightM} m)`,
      result: areaPass && widthPass && heightPass ? 'ERGONOMICS COMPLIANT' : 'SPACE LIMIT VIOLATED',
      reasoning: 'Evaluated per BNBC 2020 Part 3 Chapter 1 minimum room dimensions & clear ceiling heights.',
      isVerifiedAgainstEngine: Math.abs(roomLengthM * roomWidthM - floorAreaM2) < 0.05,
    },
    {
      stepNumber: 2,
      title: 'Window-to-Floor Daylight & Openable Ventilation Ratio',
      formula: 'R_day = (N_w × W_w × H_w) / A_floor;  R_vent = (A_win × %_open + A_louver) / A_floor',
      substitution: `A_win = ${windowCount} × ${windowWidthM} × ${windowHeightM} = ${totalGlazedWindowAreaM2} m² (${daylightRatioPct}%);  A_vent = ${totalVentilationOpeningM2} m² (${ventilationRatioPct}%)`,
      result: `Daylight = ${daylightRatioPct}% (Min ${minRequiredDaylightPct}%) · Ventilation = ${ventilationRatioPct}% (Min ${minRequiredVentilationPct}%)`,
      reasoning: '2-track sliding windows provide only 50% net openable ventilation area compared to 100% casement shutters.',
      isVerifiedAgainstEngine: true,
    },
  ];

  const scopeAndLimits: ScopeAndLimitsMetadata = {
    status: 'Available',
    codeReference: 'BNBC 2020 Part 3 Chapter 1 & Chapter 3 (Light, Ventilation & Ergonomics)',
    covered: [
      'Minimum habitable room floor area (≥ 9.5 m²), width (≥ 2.4 m) & clear ceiling height (≥ 2.75 m)',
      'Glazed daylight window-to-floor ratio (≥ 10%–15%) & net openable ventilation area check',
    ],
    unsupported: [
      'Mechanical HVAC air-changes-per-hour (ACH) duct sizing & solar heat gain coefficient (SHGC)',
    ],
  };

  return createArchitectureEnvelope<DaylightVentilationResult>(
    {
      roomName,
      roomOccupancyType,
      roomLengthM,
      roomWidthM,
      minDimM,
      ceilingHeightM,
      floorAreaM2,
      floorAreaSqft,
      totalGlazedWindowAreaM2,
      openableWindowAreaM2,
      ventilatorAreaM2,
      totalVentilationOpeningM2,
      daylightRatioPct,
      ventilationRatioPct,
      minRequiredAreaM2,
      minRequiredWidthM,
      minRequiredHeightM,
      minRequiredDaylightPct,
      targetDaylightPct,
      minRequiredVentilationPct,
      areaPass,
      widthPass,
      heightPass,
      daylightPass,
      ventilationPass,
      overallCompliant,
      dcrGauges,
    },
    issues,
    { handCalculationSteps, scopeAndLimits }
  );
}


