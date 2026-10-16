import {
  BeamParameters,
  BearingParameters,
  ConcreteMixParameters,
  ChannelParameters,
  ConcreteMaterialParameters,
  RebarBBSParameters,
  MasonryParameters,
  EarthworkParameters,
  BOQParameters,
  RateAnalysisParameters,
  TakeoffLineItem,
  TakeoffUnit,
  TakeoffCategory,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  RateAnalysisWorkType,
  ValidationIssue,
  CalculationStatus,
} from '../types/civil';
import { EXACT_CONVERSION } from './unitConverter';

/* -------------------------------------------------------------
   VALIDATION CONTRACT HELPERS
------------------------------------------------------------- */
export interface CalculationEnvelope<T> {
  status: CalculationStatus;
  issues: ValidationIssue[];
  result: T | null;
}

export function createEnvelope<T>(
  result: T | null,
  issues: ValidationIssue[]
): CalculationEnvelope<T> {
  const hasErrors = issues.some((i) => i.severity === 'error');
  const hasWarnings = issues.some((i) => i.severity === 'warning');
  return {
    status: hasErrors ? 'invalid' : hasWarnings ? 'warning' : 'valid',
    issues,
    result: hasErrors ? null : result,
  };
}

/* -------------------------------------------------------------
   MODULE 1: BEAM ANALYSIS (With Zero Coercion)
------------------------------------------------------------- */
export interface BeamAnalysisPoint {
  x: number;
  shearKn: number;
  momentKnm: number;
  deflectionMm: number;
}

export interface BeamAnalysisResult {
  points: BeamAnalysisPoint[];
  maxMomentKnm: number;
  maxShearKn: number;
  maxDeflectionMm: number;
  allowableDeflectionMm: number;
  bendingStressMpa: number;
  utilizationRatio: number;
  status: 'nominal' | 'warning' | 'critical';
  reactionLeftKn: number;
  reactionRightKn: number;
}

export function computeBeamAnalysis(
  params: BeamParameters
): CalculationEnvelope<BeamAnalysisResult> {
  const issues: ValidationIssue[] = [];

  if (params.spanLengthM <= 0) {
    issues.push({ field: 'spanLengthM', message: 'Span length must be strictly positive (> 0 m).', severity: 'error' });
  }
  if (params.uniformLoadKnPerM < 0) {
    issues.push({ field: 'uniformLoadKnPerM', message: 'Uniform load cannot be negative.', severity: 'error' });
  }
  if (params.pointLoadKn < 0) {
    issues.push({ field: 'pointLoadKn', message: 'Concentrated point load cannot be negative.', severity: 'error' });
  }
  if (params.pointLoadKn > 0 && (params.pointLoadPositionM < 0 || params.pointLoadPositionM > params.spanLengthM)) {
    issues.push({ field: 'pointLoadPositionM', message: `Point load position must be within span (0 to ${params.spanLengthM} m).`, severity: 'error' });
  }
  if (params.elasticModulusGpa <= 0) {
    issues.push({ field: 'elasticModulusGpa', message: 'Elastic modulus E must be strictly positive (> 0 GPa).', severity: 'error' });
  }
  if (params.momentOfInertiaCm4 <= 0) {
    issues.push({ field: 'momentOfInertiaCm4', message: 'Moment of inertia I must be strictly positive (> 0 cm⁴).', severity: 'error' });
  }
  if (params.sectionDepthMm <= 0) {
    issues.push({ field: 'sectionDepthMm', message: 'Section depth d must be strictly positive (> 0 mm).', severity: 'error' });
  }
  if (params.allowableStressMpa <= 0) {
    issues.push({ field: 'allowableStressMpa', message: 'Allowable bending stress must be strictly positive (> 0 MPa).', severity: 'error' });
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<BeamAnalysisResult>(null, issues);
  }

  const L = params.spanLengthM;
  const w = params.uniformLoadKnPerM;
  const P = params.pointLoadKn;
  const a = params.pointLoadPositionM;
  const b = L - a;
  const EI = params.elasticModulusGpa * params.momentOfInertiaCm4 * 0.01; // kN·m²

  const steps = 40;
  const points: BeamAnalysisPoint[] = [];

  let reactionLeftKn = 0;
  let reactionRightKn = 0;

  if (params.supportCondition === 'simply-supported') {
    reactionLeftKn = (w * L) / 2 + (P * b) / L;
    reactionRightKn = (w * L) / 2 + (P * a) / L;
  } else if (params.supportCondition === 'cantilever') {
    reactionLeftKn = w * L + P;
    reactionRightKn = 0;
  } else {
    // Fixed-ends
    reactionLeftKn = (w * L) / 2 + (P * b * b * (3 * a + b)) / Math.pow(L, 3);
    reactionRightKn = w * L + P - reactionLeftKn;
  }

  let maxMomentKnm = 0;
  let maxShearKn = 0;
  let maxDeflectionMm = 0;

  const fixedEndMomentLeft =
    params.supportCondition === 'fixed-ends'
      ? (w * L * L) / 12 + (P * a * b * b) / (L * L)
      : params.supportCondition === 'cantilever'
        ? (w * L * L) / 2 + P * a
        : 0;

  for (let i = 0; i <= steps; i++) {
    const x = (L * i) / steps;
    let V = reactionLeftKn - w * x;
    if (x > a) V -= P;

    let M = reactionLeftKn * x - (w * x * x) / 2 - fixedEndMomentLeft;
    if (x > a) M -= P * (x - a);

    let deflectionM = 0;
    if (params.supportCondition === 'simply-supported') {
      const udlDefl =
        (w * x * (Math.pow(L, 3) - 2 * L * x * x + Math.pow(x, 3))) / (24 * EI);
      let pointDefl = 0;
      if (x <= a) {
        pointDefl = (P * b * x * (L * L - b * b - x * x)) / (6 * L * EI);
      } else {
        const xPrime = L - x;
        pointDefl = (P * a * xPrime * (L * L - a * a - xPrime * xPrime)) / (6 * L * EI);
      }
      deflectionM = udlDefl + pointDefl;
    } else if (params.supportCondition === 'cantilever') {
      const udlDefl = (w * x * x * (6 * L * L - 4 * L * x + x * x)) / (24 * EI);
      let pointDefl = 0;
      if (x <= a) {
        pointDefl = (P * x * x * (3 * a - x)) / (6 * EI);
      } else {
        pointDefl = (P * a * a * (3 * x - a)) / (6 * EI);
      }
      deflectionM = udlDefl + pointDefl;
    } else {
      const udlDefl = (w * x * x * Math.pow(L - x, 2)) / (24 * EI);
      const pointDefl =
        ((P * Math.pow(L, 3)) / (192 * EI)) *
        Math.sin((Math.PI * x) / L) *
        Math.sin((Math.PI * a) / L);
      deflectionM = udlDefl + pointDefl;
    }

    const deflMm = Math.abs(deflectionM * 1000);
    points.push({
      x: Number(x.toFixed(2)),
      shearKn: Number(V.toFixed(2)),
      momentKnm: Number(M.toFixed(2)),
      deflectionMm: Number(deflMm.toFixed(2)),
    });

    if (Math.abs(M) > maxMomentKnm) maxMomentKnm = Math.abs(M);
    if (Math.abs(V) > maxShearKn) maxShearKn = Math.abs(V);
    if (deflMm > maxDeflectionMm) maxDeflectionMm = deflMm;
  }

  const allowableDeflectionMm = (L * 1000) / 360;
  const cMm = params.sectionDepthMm / 2;
  const iMm4 = params.momentOfInertiaCm4 * 1e4;
  const bendingStressMpa = (maxMomentKnm * 1e6 * cMm) / iMm4;

  const stressRatio = bendingStressMpa / params.allowableStressMpa;
  const deflRatio = maxDeflectionMm / allowableDeflectionMm;
  const utilizationRatio = Math.max(stressRatio, deflRatio);

  if (utilizationRatio > 1.0) {
    issues.push({ field: 'utilizationRatio', message: `Beam exceeds allowable limit state (Utilization: ${(utilizationRatio * 100).toFixed(1)}%).`, severity: 'warning' });
  }

  const status: 'nominal' | 'warning' | 'critical' =
    utilizationRatio > 1.0 ? 'critical' : utilizationRatio > 0.85 ? 'warning' : 'nominal';

  return createEnvelope<BeamAnalysisResult>(
    {
      points,
      maxMomentKnm,
      maxShearKn,
      maxDeflectionMm,
      allowableDeflectionMm,
      bendingStressMpa,
      utilizationRatio,
      status,
      reactionLeftKn,
      reactionRightKn,
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 2: BEARING CAPACITY (With Zero Coercion)
------------------------------------------------------------- */
export interface BearingAnalysisResult {
  nc: number;
  nq: number;
  nGamma: number;
  ultimateBearingKpa: number;
  allowableBearingKpa: number;
  appliedPressureKpa: number;
  footingAreaM2: number;
  utilizationRatio: number;
  effectiveSafetyFactor: number;
  status: 'nominal' | 'warning' | 'critical';
}

export function computeBearingCapacity(
  params: BearingParameters
): CalculationEnvelope<BearingAnalysisResult> {
  const issues: ValidationIssue[] = [];

  if (params.footingWidthM <= 0) {
    issues.push({ field: 'footingWidthM', message: 'Footing width B must be strictly positive (> 0 m).', severity: 'error' });
  }
  if (params.embedmentDepthM < 0) {
    issues.push({ field: 'embedmentDepthM', message: 'Embedment depth D_f cannot be negative.', severity: 'error' });
  }
  if (params.soilCohesionKpa < 0) {
    issues.push({ field: 'soilCohesionKpa', message: 'Soil cohesion cannot be negative.', severity: 'error' });
  }
  if (params.frictionAngleDeg < 0 || params.frictionAngleDeg > 50) {
    issues.push({ field: 'frictionAngleDeg', message: 'Friction angle φ must be between 0° and 50°.', severity: 'error' });
  }
  if (params.unitWeightKnPerM3 <= 0) {
    issues.push({ field: 'unitWeightKnPerM3', message: 'Soil unit weight γ must be strictly positive (> 0 kN/m³).', severity: 'error' });
  }
  if (params.waterTableDepthM < 0) {
    issues.push({ field: 'waterTableDepthM', message: 'Groundwater table depth cannot be negative.', severity: 'error' });
  }
  if (params.factorOfSafety < 1.0) {
    issues.push({ field: 'factorOfSafety', message: 'Factor of safety must be at least 1.0 (recommended ≥ 2.5).', severity: 'error' });
  }
  if (params.appliedColumnLoadKn <= 0) {
    issues.push({ field: 'appliedColumnLoadKn', message: 'Applied load P must be strictly positive (> 0 kN).', severity: 'error' });
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<BearingAnalysisResult>(null, issues);
  }

  const phiRad = (params.frictionAngleDeg * Math.PI) / 180;
  const nq =
    phiRad === 0
      ? 1.0
      : Math.exp(Math.PI * Math.tan(phiRad)) * Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
  const nc = phiRad === 0 ? 5.14 : (nq - 1) / Math.tan(phiRad);
  const nGamma = phiRad === 0 ? 0 : 2 * (nq + 1) * Math.tan(phiRad);

  let sc = 1.0;
  let sg = 1.0;
  if (params.footingShape === 'square') {
    sc = 1.3;
    sg = 0.8;
  } else if (params.footingShape === 'circular') {
    sc = 1.3;
    sg = 0.6;
  }

  const gammaSub = Math.max(0, params.unitWeightKnPerM3 - 9.81);
  const gammaEffTop =
    params.waterTableDepthM <= 0
      ? gammaSub
      : params.waterTableDepthM < params.embedmentDepthM
        ? (params.unitWeightKnPerM3 * params.waterTableDepthM +
            gammaSub * (params.embedmentDepthM - params.waterTableDepthM)) /
          params.embedmentDepthM
        : params.unitWeightKnPerM3;

  const gammaEffBottom =
    params.waterTableDepthM <= params.embedmentDepthM
      ? gammaSub
      : params.waterTableDepthM < params.embedmentDepthM + params.footingWidthM
        ? gammaSub +
          ((params.waterTableDepthM - params.embedmentDepthM) / params.footingWidthM) *
            (params.unitWeightKnPerM3 - gammaSub)
        : params.unitWeightKnPerM3;

  const qOverburden = gammaEffTop * params.embedmentDepthM;
  const ultimateBearingKpa =
    sc * params.soilCohesionKpa * nc +
    qOverburden * nq +
    0.5 * sg * gammaEffBottom * params.footingWidthM * nGamma;

  const allowableBearingKpa = ultimateBearingKpa / params.factorOfSafety;

  const footingAreaM2 =
    params.footingShape === 'circular'
      ? Math.PI * Math.pow(params.footingWidthM / 2, 2)
      : params.footingShape === 'square'
        ? params.footingWidthM * params.footingWidthM
        : params.footingWidthM * 1.0;

  const appliedPressureKpa = params.appliedColumnLoadKn / footingAreaM2;
  const utilizationRatio = appliedPressureKpa / allowableBearingKpa;
  const effectiveSafetyFactor = ultimateBearingKpa / appliedPressureKpa;

  if (utilizationRatio > 1.0) {
    issues.push({ field: 'appliedPressureKpa', message: `Applied pressure (${appliedPressureKpa.toFixed(1)} kPa) exceeds allowable bearing capacity (${allowableBearingKpa.toFixed(1)} kPa).`, severity: 'warning' });
  }

  const status: 'nominal' | 'warning' | 'critical' =
    utilizationRatio > 1.0 ? 'critical' : utilizationRatio > 0.85 ? 'warning' : 'nominal';

  return createEnvelope<BearingAnalysisResult>(
    {
      nc,
      nq,
      nGamma,
      ultimateBearingKpa,
      allowableBearingKpa,
      appliedPressureKpa,
      footingAreaM2,
      utilizationRatio,
      effectiveSafetyFactor,
      status,
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 3: ACI 211 CONCRETE MIX (With Zero Coercion)
------------------------------------------------------------- */
export interface ConcreteMixResult {
  waterKgPerM3: number;
  cementKgPerM3: number;
  coarseAggKgPerM3: number;
  fineAggKgPerM3: number;
  totalDensityKgPerM3: number;
  batchCementKg: number;
  batchWaterKg: number;
  batchFineAggKg: number;
  batchCoarseAggKg: number;
  cementBags50Kg: number;
  estimated28DayMpa: number;
  status: 'nominal' | 'warning' | 'critical';
}

export function computeConcreteMix(
  params: ConcreteMixParameters
): CalculationEnvelope<ConcreteMixResult> {
  const issues: ValidationIssue[] = [];

  if (params.targetStrengthMpa <= 0) {
    issues.push({ field: 'targetStrengthMpa', message: 'Target compressive strength must be strictly positive (> 0 MPa).', severity: 'error' });
  }
  if (params.waterCementRatio <= 0 || params.waterCementRatio > 0.85) {
    issues.push({ field: 'waterCementRatio', message: 'Water-cement ratio must be between 0.25 and 0.85.', severity: 'error' });
  }
  if (params.batchVolumeM3 <= 0) {
    issues.push({ field: 'batchVolumeM3', message: 'Batch volume must be strictly positive (> 0 m³).', severity: 'error' });
  }
  if (params.slumpMm < 0) {
    issues.push({ field: 'slumpMm', message: 'Slump cannot be negative.', severity: 'error' });
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<ConcreteMixResult>(null, issues);
  }

  const baseWater =
    params.maxAggregateSizeMm === 10 ? 205 : params.maxAggregateSizeMm === 20 ? 186 : 165;
  const slumpAdjustment = ((params.slumpMm - 90) / 25) * 5.5;
  const waterKgPerM3 = baseWater + slumpAdjustment;
  const cementKgPerM3 = waterKgPerM3 / params.waterCementRatio;

  const volWater = waterKgPerM3 / 1000;
  const volCement = cementKgPerM3 / (params.cementSpecificGravity * 1000);
  const volAir = params.airEntrainmentPercent / 100;
  const coarseVolumeFraction =
    params.maxAggregateSizeMm === 10 ? 0.5 : params.maxAggregateSizeMm === 20 ? 0.64 : 0.72;
  const volCoarse = coarseVolumeFraction * 0.61;
  const coarseAggKgPerM3 = volCoarse * params.coarseAggSpecificGravity * 1000;
  const volFine = 1.0 - (volWater + volCement + volAir + volCoarse);

  if (volFine <= 0) {
    issues.push({ field: 'waterCementRatio', message: 'Mix proportions exceed total solid volume in 1 m³.', severity: 'error' });
    return createEnvelope<ConcreteMixResult>(null, issues);
  }

  const fineAggKgPerM3 = volFine * params.fineAggSpecificGravity * 1000;
  const totalDensityKgPerM3 =
    waterKgPerM3 + cementKgPerM3 + coarseAggKgPerM3 + fineAggKgPerM3;
  const estimated28DayMpa = 96.5 / Math.pow(7.2, 1.35 * params.waterCementRatio);

  const V = params.batchVolumeM3;
  const status: 'nominal' | 'warning' | 'critical' =
    estimated28DayMpa < params.targetStrengthMpa * 0.92
      ? 'critical'
      : estimated28DayMpa < params.targetStrengthMpa
        ? 'warning'
        : 'nominal';

  return createEnvelope<ConcreteMixResult>(
    {
      waterKgPerM3,
      cementKgPerM3,
      coarseAggKgPerM3,
      fineAggKgPerM3,
      totalDensityKgPerM3,
      batchCementKg: cementKgPerM3 * V,
      batchWaterKg: waterKgPerM3 * V,
      batchFineAggKg: fineAggKgPerM3 * V,
      batchCoarseAggKg: coarseAggKgPerM3 * V,
      cementBags50Kg: (cementKgPerM3 * V) / 50,
      estimated28DayMpa,
      status,
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 4: OPEN CHANNEL HYDRAULICS (With Zero Coercion)
------------------------------------------------------------- */
export interface ChannelHydraulicsResult {
  flowAreaM2: number;
  wettedPerimeterM: number;
  hydraulicRadiusM: number;
  topWidthM: number;
  hydraulicDepthM: number;
  velocityMps: number;
  dischargeM3ps: number;
  froudeNumber: number;
  flowRegime: 'Subcritical' | 'Critical' | 'Supercritical';
  shearStressPa: number;
  status: 'nominal' | 'warning' | 'critical';
}

export function computeChannelHydraulics(
  params: ChannelParameters
): CalculationEnvelope<ChannelHydraulicsResult> {
  const issues: ValidationIssue[] = [];

  if (params.bottomWidthM <= 0) {
    issues.push({ field: 'bottomWidthM', message: 'Channel bed width b must be strictly positive (> 0 m).', severity: 'error' });
  }
  if (params.sideSlopeZ < 0) {
    issues.push({ field: 'sideSlopeZ', message: 'Side slope z cannot be negative.', severity: 'error' });
  }
  if (params.flowDepthM <= 0) {
    issues.push({ field: 'flowDepthM', message: 'Flow depth y must be strictly positive (> 0 m).', severity: 'error' });
  }
  if (params.bedSlope <= 0) {
    issues.push({ field: 'bedSlope', message: 'Bed slope S_0 must be strictly positive (> 0).', severity: 'error' });
  }
  if (params.manningN <= 0) {
    issues.push({ field: 'manningN', message: 'Manning roughness coefficient n must be strictly positive (> 0).', severity: 'error' });
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<ChannelHydraulicsResult>(null, issues);
  }

  const b = params.bottomWidthM;
  const z = params.sideSlopeZ;
  const y = params.flowDepthM;
  const S = params.bedSlope;
  const n = params.manningN;

  const flowAreaM2 = (b + z * y) * y;
  const wettedPerimeterM = b + 2 * y * Math.sqrt(1 + z * z);
  const hydraulicRadiusM = flowAreaM2 / wettedPerimeterM;
  const topWidthM = b + 2 * z * y;
  const hydraulicDepthM = flowAreaM2 / topWidthM;

  const velocityMps = (1 / n) * Math.pow(hydraulicRadiusM, 2 / 3) * Math.sqrt(S);
  const dischargeM3ps = flowAreaM2 * velocityMps;
  const froudeNumber = velocityMps / Math.sqrt(9.80665 * hydraulicDepthM);

  const flowRegime: 'Subcritical' | 'Critical' | 'Supercritical' =
    froudeNumber < 0.98
      ? 'Subcritical'
      : froudeNumber <= 1.02
        ? 'Critical'
        : 'Supercritical';

  const shearStressPa = 9810 * hydraulicRadiusM * S;
  const status: 'nominal' | 'warning' | 'critical' =
    velocityMps > 4.5 ? 'critical' : froudeNumber >= 0.9 && froudeNumber <= 1.15 ? 'warning' : 'nominal';

  return createEnvelope<ChannelHydraulicsResult>(
    {
      flowAreaM2,
      wettedPerimeterM,
      hydraulicRadiusM,
      topWidthM,
      hydraulicDepthM,
      velocityMps,
      dischargeM3ps,
      froudeNumber,
      flowRegime,
      shearStressPa,
      status,
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 5: MATERIAL & CONCRETE TECHNOLOGY (BNBC/ACI/IS)
------------------------------------------------------------- */
export interface ConcreteMaterialResult {
  code: string;
  dryVolumeFactor: number;
  wetVolumeM3: number;
  dryVolumeM3: number;
  wastageMultiplier: number;
  totalDryVolumeWithWastageM3: number;
  sumOfProportions: number;
  
  // Cement
  cementVolumeM3: number;
  cementMassKg: number;
  cementBags50Kg: number;
  
  // Sand
  sandVolumeM3: number;
  sandMassKg: number;
  sandCft: number; // 1 m3 = 35.3147 cft
  
  // Coarse Aggregate
  aggregateVolumeM3: number;
  aggregateMassKg: number;
  aggregateCft: number;

  // Water
  waterDemandLiters: number;
  
  status: 'nominal' | 'warning' | 'critical';
}

export function computeConcreteMaterials(
  params: ConcreteMaterialParameters
): CalculationEnvelope<ConcreteMaterialResult> {
  const issues: ValidationIssue[] = [];

  if (params.wetVolumeM3 <= 0) {
    issues.push({ field: 'wetVolumeM3', message: 'Wet volume must be strictly positive (> 0 m³).', severity: 'error' });
  }
  if (params.ratioCement <= 0) {
    issues.push({ field: 'ratioCement', message: 'Cement ratio part must be strictly positive (> 0).', severity: 'error' });
  }
  if (params.ratioSand <= 0) {
    issues.push({ field: 'ratioSand', message: 'Sand ratio part must be strictly positive (> 0).', severity: 'error' });
  }
  if (params.ratioAggregate < 0) {
    issues.push({ field: 'ratioAggregate', message: 'Aggregate ratio part cannot be negative.', severity: 'error' });
  }
  if (params.waterCementRatio <= 0) {
    issues.push({ field: 'waterCementRatio', message: 'Water-cement ratio must be strictly positive (> 0).', severity: 'error' });
  }
  if (params.cementBagWeightKg <= 0) {
    issues.push({ field: 'cementBagWeightKg', message: 'Cement bag weight must be strictly positive (> 0 kg).', severity: 'error' });
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<ConcreteMaterialResult>(null, issues);
  }

  // Dynamic code-governed dry volume factor
  // BNBC 2020 specifies 1.54; ACI 318 specifies 1.54; IS 456 specifies 1.52 to 1.54
  let dryFactor = params.customDryFactor || 1.54;
  if (!params.customDryFactor) {
    if (params.code === 'BNBC-2020') dryFactor = 1.54;
    else if (params.code === 'ACI-318') dryFactor = 1.54;
    else if (params.code === 'IS-456') dryFactor = 1.52;
  }

  const wastageMultiplier = 1 + (params.wastagePercent || 0) / 100;
  const dryVolumeM3 = params.wetVolumeM3 * dryFactor;
  const totalDryVolume = dryVolumeM3 * wastageMultiplier;

  const sumRatio = params.ratioCement + params.ratioSand + params.ratioAggregate;
  if (sumRatio <= 0) {
    issues.push({ field: 'ratioCement', message: 'Sum of mix ratio parts must be greater than 0.', severity: 'error' });
    return createEnvelope<ConcreteMaterialResult>(null, issues);
  }

  const cementVol = (params.ratioCement / sumRatio) * totalDryVolume;
  const sandVol = (params.ratioSand / sumRatio) * totalDryVolume;
  const aggVol = (params.ratioAggregate / sumRatio) * totalDryVolume;

  const cementMass = cementVol * (params.cementBulkDensityKgPerM3 || 1440);
  const sandMass = sandVol * (params.sandBulkDensityKgPerM3 || 1600);
  const aggMass = aggVol * (params.aggregateBulkDensityKgPerM3 || 1520);

  const cementBags = cementMass / params.cementBagWeightKg;
  const waterDemandLiters = cementMass * params.waterCementRatio;

  const sandCft = sandVol * EXACT_CONVERSION.M3_TO_CFT;
  const aggregateCft = aggVol * EXACT_CONVERSION.M3_TO_CFT;

  return createEnvelope<ConcreteMaterialResult>(
    {
      code: params.code,
      dryVolumeFactor: dryFactor,
      wetVolumeM3: params.wetVolumeM3,
      dryVolumeM3,
      wastageMultiplier,
      totalDryVolumeWithWastageM3: totalDryVolume,
      sumOfProportions: sumRatio,
      cementVolumeM3: cementVol,
      cementMassKg: cementMass,
      cementBags50Kg: cementBags,
      sandVolumeM3: sandVol,
      sandMassKg: sandMass,
      sandCft,
      aggregateVolumeM3: aggVol,
      aggregateMassKg: aggMass,
      aggregateCft,
      waterDemandLiters,
      status: 'nominal',
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 6: REBAR THEORETICAL MASS & BAR BENDING SCHEDULE (BBS)
------------------------------------------------------------- */
export interface BBSItem {
  description: string;
  barDiaMm: number;
  count: number;
  cuttingLengthM: number;
  totalLengthM: number;
  unitWeightKgPerM: number; // D^2 / 162.2
  totalWeightKg: number;
  bendDeductionM: number;
}

export interface RebarBBSResult {
  items: BBSItem[];
  totalSteelWeightKg: number;
  totalSteelTonnes: number;
  unitWeightFormulaUsed: string;
  totalBarsLengthM: number;
  steelDensityKgPerM3: number;
  status: 'nominal' | 'warning' | 'critical';
}

/**
 * Theoretical unit weight of rebar:
 * Approximation: D^2 / 162.2 (kg/m)
 * Exact physics: (pi * D^2 / 4) * 1e-6 * 7850 = D^2 * 0.00616538 kg/m (~ D^2 / 162.196)
 */
export function getRebarUnitWeightKgPerM(diaMm: number, densityKgPerM3: number = 7850): number {
  return (Math.PI * Math.pow(diaMm / 1000, 2) / 4) * densityKgPerM3;
}

export function computeRebarBBS(
  params: RebarBBSParameters
): CalculationEnvelope<RebarBBSResult> {
  const issues: ValidationIssue[] = [];

  if (params.clearCoverMm < 0) {
    issues.push({ field: 'clearCoverMm', message: 'Clear cover cannot be negative.', severity: 'error' });
  }

  const items: BBSItem[] = [];
  const coverM = params.clearCoverMm / 1000;
  const density = params.rebarDensityKgPerM3 || 7850;

  // Bend deduction factors: 45° = 1D, 90° = 2D, 135° = 3D, 180° = 4D
  const getBendDeduction = (diaMm: number, bendCount: number, angle: '90' | '135' | '180') => {
    const factor = angle === '90' ? 2 : angle === '135' ? 3 : 4;
    return (bendCount * factor * diaMm) / 1000; // in meters
  };

  if (params.elementType === 'slab') {
    if (params.slabLengthM <= 0 || params.slabWidthM <= 0) {
      issues.push({ field: 'slabLengthM', message: 'Slab dimensions L and W must be strictly positive (> 0 m).', severity: 'error' });
    }
    if (params.mainBarDiaMm <= 0 || params.mainBarSpacingMm <= 0) {
      issues.push({ field: 'mainBarDiaMm', message: 'Main bar diameter and spacing must be strictly positive.', severity: 'error' });
    }
    if (params.distBarDiaMm <= 0 || params.distBarSpacingMm <= 0) {
      issues.push({ field: 'distBarDiaMm', message: 'Distribution bar diameter and spacing must be strictly positive.', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error')) {
      // Main bars along short span (slabWidthM), spaced along long span (slabLengthM)
      const mainBarCount = Math.floor((params.slabLengthM - 2 * coverM) / (params.mainBarSpacingMm / 1000)) + 1;
      // Straight bar + 2 end development L-bends or hooks
      const hookExtension = 2 * (12 * (params.mainBarDiaMm / 1000));
      const bendDeduction = getBendDeduction(params.mainBarDiaMm, 2, '90');
      const mainCuttingLen = (params.slabWidthM - 2 * coverM) + hookExtension - bendDeduction;
      const mainUnitWt = getRebarUnitWeightKgPerM(params.mainBarDiaMm, density);

      items.push({
        description: `Slab Main Bottom Bars (Ø${params.mainBarDiaMm}mm @ ${params.mainBarSpacingMm}mm c/c)`,
        barDiaMm: params.mainBarDiaMm,
        count: mainBarCount,
        cuttingLengthM: Number(mainCuttingLen.toFixed(3)),
        totalLengthM: Number((mainBarCount * mainCuttingLen).toFixed(2)),
        unitWeightKgPerM: Number(mainUnitWt.toFixed(3)),
        totalWeightKg: Number((mainBarCount * mainCuttingLen * mainUnitWt).toFixed(2)),
        bendDeductionM: Number(bendDeduction.toFixed(3)),
      });

      // Distribution bars along long span, spaced along short span
      const distBarCount = Math.floor((params.slabWidthM - 2 * coverM) / (params.distBarSpacingMm / 1000)) + 1;
      const distHook = 2 * (10 * (params.distBarDiaMm / 1000));
      const distBendDed = getBendDeduction(params.distBarDiaMm, 2, '90');
      const distCuttingLen = (params.slabLengthM - 2 * coverM) + distHook - distBendDed;
      const distUnitWt = getRebarUnitWeightKgPerM(params.distBarDiaMm, density);

      items.push({
        description: `Slab Distribution Bars (Ø${params.distBarDiaMm}mm @ ${params.distBarSpacingMm}mm c/c)`,
        barDiaMm: params.distBarDiaMm,
        count: distBarCount,
        cuttingLengthM: Number(distCuttingLen.toFixed(3)),
        totalLengthM: Number((distBarCount * distCuttingLen).toFixed(2)),
        unitWeightKgPerM: Number(distUnitWt.toFixed(3)),
        totalWeightKg: Number((distBarCount * distCuttingLen * distUnitWt).toFixed(2)),
        bendDeductionM: Number(distBendDed.toFixed(3)),
      });
    }
  } else if (params.elementType === 'column-rect') {
    if (params.colLengthMm <= 0 || params.colWidthMm <= 0 || params.colHeightM <= 0) {
      issues.push({ field: 'colLengthMm', message: 'Column dimensions L, B, and H must be strictly positive.', severity: 'error' });
    }
    if (params.colMainBarDiaMm <= 0 || params.colMainBarCount <= 0) {
      issues.push({ field: 'colMainBarDiaMm', message: 'Main longitudinal bars must be strictly positive (> 0).', severity: 'error' });
    }
    if (params.tieBarDiaMm <= 0 || params.tieSpacingMm <= 0) {
      issues.push({ field: 'tieBarDiaMm', message: 'Tie/stirrup diameter and spacing must be strictly positive.', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error')) {
      // Longitudinal bars with foundation lap & floor development hook
      const devHook = 50 * (params.colMainBarDiaMm / 1000); // 50d lap
      const mainCutting = params.colHeightM + devHook;
      const mainUnitWt = getRebarUnitWeightKgPerM(params.colMainBarDiaMm, density);

      items.push({
        description: `Column Longitudinal Main Bars (${params.colMainBarCount} Nos Ø${params.colMainBarDiaMm}mm)`,
        barDiaMm: params.colMainBarDiaMm,
        count: params.colMainBarCount,
        cuttingLengthM: Number(mainCutting.toFixed(3)),
        totalLengthM: Number((params.colMainBarCount * mainCutting).toFixed(2)),
        unitWeightKgPerM: Number(mainUnitWt.toFixed(3)),
        totalWeightKg: Number((params.colMainBarCount * mainCutting * mainUnitWt).toFixed(2)),
        bendDeductionM: 0,
      });

      // Rectangular Lateral Ties with 135° seismic hooks:
      // Perimeter = 2 * (a + b) + 2 * (hook 10d) - bend deductions
      const tieL = params.colLengthMm / 1000 - 2 * coverM;
      const tieW = params.colWidthMm / 1000 - 2 * coverM;
      const hook135 = 2 * (10 * (params.tieBarDiaMm / 1000));
      // 3 of 90° bends (3*2d) and 2 of 135° bends (2*3d) = 12d
      const tieBendDed = 12 * (params.tieBarDiaMm / 1000);
      const tieCutting = 2 * (tieL + tieW) + hook135 - tieBendDed;
      const tieCount = Math.floor(params.colHeightM / (params.tieSpacingMm / 1000)) + 1;
      const tieUnitWt = getRebarUnitWeightKgPerM(params.tieBarDiaMm, density);

      items.push({
        description: `Lateral Rectangular Ties (Ø${params.tieBarDiaMm}mm @ ${params.tieSpacingMm}mm c/c with 135° hooks)`,
        barDiaMm: params.tieBarDiaMm,
        count: tieCount,
        cuttingLengthM: Number(tieCutting.toFixed(3)),
        totalLengthM: Number((tieCount * tieCutting).toFixed(2)),
        unitWeightKgPerM: Number(tieUnitWt.toFixed(3)),
        totalWeightKg: Number((tieCount * tieCutting * tieUnitWt).toFixed(2)),
        bendDeductionM: Number(tieBendDed.toFixed(3)),
      });
    }
  } else if (params.elementType === 'column-circ') {
    if (params.circColDiaMm <= 0 || params.circColHeightM <= 0) {
      issues.push({ field: 'circColDiaMm', message: 'Circular column diameter and height must be strictly positive.', severity: 'error' });
    }
    if (params.circMainBarDiaMm <= 0 || params.circMainBarCount <= 0) {
      issues.push({ field: 'circMainBarDiaMm', message: 'Main longitudinal bars must be strictly positive.', severity: 'error' });
    }
    if (params.spiralTieDiaMm <= 0 || params.spiralPitchMm <= 0) {
      issues.push({ field: 'spiralTieDiaMm', message: 'Spiral rebar diameter and pitch must be strictly positive.', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error')) {
      const devHook = 50 * (params.circMainBarDiaMm / 1000);
      const mainCutting = params.circColHeightM + devHook;
      const mainUnitWt = getRebarUnitWeightKgPerM(params.circMainBarDiaMm, density);

      items.push({
        description: `Circular Column Longitudinal Bars (${params.circMainBarCount} Nos Ø${params.circMainBarDiaMm}mm)`,
        barDiaMm: params.circMainBarDiaMm,
        count: params.circMainBarCount,
        cuttingLengthM: Number(mainCutting.toFixed(3)),
        totalLengthM: Number((params.circMainBarCount * mainCutting).toFixed(2)),
        unitWeightKgPerM: Number(mainUnitWt.toFixed(3)),
        totalWeightKg: Number((params.circMainBarCount * mainCutting * mainUnitWt).toFixed(2)),
        bendDeductionM: 0,
      });

      // Helical Spiral Length formula: L_spiral = n * sqrt( (pi * D_core)^2 + pitch^2 ) + extra turns for anchor
      const coreDiaM = params.circColDiaMm / 1000 - 2 * coverM;
      const pitchM = params.spiralPitchMm / 1000;
      const numTurns = Math.floor(params.circColHeightM / pitchM);
      const turnLength = Math.sqrt(Math.pow(Math.PI * coreDiaM, 2) + Math.pow(pitchM, 2));
      const anchorTurns = 2.5 * Math.PI * coreDiaM; // 2.5 extra turns at ends for anchorage
      const totalSpiralM = numTurns * turnLength + anchorTurns;
      const spiralUnitWt = getRebarUnitWeightKgPerM(params.spiralTieDiaMm, density);

      items.push({
        description: `Continuous Helical Spiral Ties (Ø${params.spiralTieDiaMm}mm @ ${params.spiralPitchMm}mm pitch)`,
        barDiaMm: params.spiralTieDiaMm,
        count: 1,
        cuttingLengthM: Number(totalSpiralM.toFixed(3)),
        totalLengthM: Number(totalSpiralM.toFixed(2)),
        unitWeightKgPerM: Number(spiralUnitWt.toFixed(3)),
        totalWeightKg: Number((totalSpiralM * spiralUnitWt).toFixed(2)),
        bendDeductionM: 0,
      });
    }
  } else if (params.elementType === 'footing') {
    if (params.footingLengthM <= 0 || params.footingWidthM <= 0 || params.footingDepthMm <= 0) {
      issues.push({ field: 'footingLengthM', message: 'Footing dimensions L, B, and D must be strictly positive.', severity: 'error' });
    }
    if (params.footingBarDiaMm <= 0 || params.footingBarSpacingMm <= 0) {
      issues.push({ field: 'footingBarDiaMm', message: 'Footing mesh diameter and spacing must be strictly positive.', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error')) {
      const upbendH = (params.footingDepthMm / 1000) - 2 * coverM;
      const bendDed = getBendDeduction(params.footingBarDiaMm, 2, '90');

      // Bars along Length (spaced along Width)
      const countX = Math.floor((params.footingWidthM - 2 * coverM) / (params.footingBarSpacingMm / 1000)) + 1;
      const cutX = (params.footingLengthM - 2 * coverM) + 2 * upbendH - bendDed;
      const unitWt = getRebarUnitWeightKgPerM(params.footingBarDiaMm, density);

      items.push({
        description: `Footing Longitudinal Mesh Bars (Ø${params.footingBarDiaMm}mm @ ${params.footingBarSpacingMm}mm c/c with L-bends)`,
        barDiaMm: params.footingBarDiaMm,
        count: countX,
        cuttingLengthM: Number(cutX.toFixed(3)),
        totalLengthM: Number((countX * cutX).toFixed(2)),
        unitWeightKgPerM: Number(unitWt.toFixed(3)),
        totalWeightKg: Number((countX * cutX * unitWt).toFixed(2)),
        bendDeductionM: Number(bendDed.toFixed(3)),
      });

      // Bars along Width (spaced along Length)
      const countY = Math.floor((params.footingLengthM - 2 * coverM) / (params.footingBarSpacingMm / 1000)) + 1;
      const cutY = (params.footingWidthM - 2 * coverM) + 2 * upbendH - bendDed;

      items.push({
        description: `Footing Transverse Mesh Bars (Ø${params.footingBarDiaMm}mm @ ${params.footingBarSpacingMm}mm c/c with L-bends)`,
        barDiaMm: params.footingBarDiaMm,
        count: countY,
        cuttingLengthM: Number(cutY.toFixed(3)),
        totalLengthM: Number((countY * cutY).toFixed(2)),
        unitWeightKgPerM: Number(unitWt.toFixed(3)),
        totalWeightKg: Number((countY * cutY * unitWt).toFixed(2)),
        bendDeductionM: Number(bendDed.toFixed(3)),
      });
    }
  } else if (params.elementType === 'staircase-waist') {
    if (params.stairGoingM <= 0 || params.stairTotalRiseM <= 0 || params.waistSlabThicknessMm <= 0) {
      issues.push({ field: 'stairGoingM', message: 'Stair going, rise, and waist slab thickness must be strictly positive.', severity: 'error' });
    }
    if (params.stairMainBarDiaMm <= 0 || params.stairMainBarSpacingMm <= 0) {
      issues.push({ field: 'stairMainBarDiaMm', message: 'Stair main rebar parameters must be strictly positive.', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error')) {
      // Inclined slope waist length = sqrt(Going^2 + Rise^2) + Landing
      const inclinedWaistM = Math.sqrt(Math.pow(params.stairGoingM, 2) + Math.pow(params.stairTotalRiseM, 2));
      const landingM = params.landingLengthM || 1.2;
      const devEmbed = 50 * (params.stairMainBarDiaMm / 1000);
      const stairCutLen = inclinedWaistM + landingM + devEmbed;
      const stairWidthM = 1.25; // standard flight width
      const mainCount = Math.floor((stairWidthM - 2 * coverM) / (params.stairMainBarSpacingMm / 1000)) + 1;
      const mainUnitWt = getRebarUnitWeightKgPerM(params.stairMainBarDiaMm, density);

      items.push({
        description: `Staircase Waist Slab Main Inclined Bars (Ø${params.stairMainBarDiaMm}mm @ ${params.stairMainBarSpacingMm}mm c/c)`,
        barDiaMm: params.stairMainBarDiaMm,
        count: mainCount,
        cuttingLengthM: Number(stairCutLen.toFixed(3)),
        totalLengthM: Number((mainCount * stairCutLen).toFixed(2)),
        unitWeightKgPerM: Number(mainUnitWt.toFixed(3)),
        totalWeightKg: Number((mainCount * stairCutLen * mainUnitWt).toFixed(2)),
        bendDeductionM: 0,
      });

      // Distribution bars across steps
      const distCutLen = stairWidthM - 2 * coverM;
      const distCount = Math.floor((inclinedWaistM + landingM) / (params.stairDistBarSpacingMm / 1000)) + 1;
      const distUnitWt = getRebarUnitWeightKgPerM(params.stairDistBarDiaMm, density);

      items.push({
        description: `Staircase Distribution Transverse Bars (Ø${params.stairDistBarDiaMm}mm @ ${params.stairDistBarSpacingMm}mm c/c)`,
        barDiaMm: params.stairDistBarDiaMm,
        count: distCount,
        cuttingLengthM: Number(distCutLen.toFixed(3)),
        totalLengthM: Number((distCount * distCutLen).toFixed(2)),
        unitWeightKgPerM: Number(distUnitWt.toFixed(3)),
        totalWeightKg: Number((distCount * distCutLen * distUnitWt).toFixed(2)),
        bendDeductionM: 0,
      });
    }
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<RebarBBSResult>(null, issues);
  }

  const totalSteelWeightKg = items.reduce((sum, item) => sum + item.totalWeightKg, 0);
  const totalSteelTonnes = totalSteelWeightKg / 1000;
  const totalBarsLengthM = items.reduce((sum, item) => sum + item.totalLengthM, 0);

  return createEnvelope<RebarBBSResult>(
    {
      items,
      totalSteelWeightKg: Number(totalSteelWeightKg.toFixed(2)),
      totalSteelTonnes: Number(totalSteelTonnes.toFixed(3)),
      unitWeightFormulaUsed: `W = (π·D²·ρ)/4 [exact physics] ~ D²/162.2 kg/m at ρ=${density} kg/m³`,
      totalBarsLengthM: Number(totalBarsLengthM.toFixed(2)),
      steelDensityKgPerM3: density,
      status: 'nominal',
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 7: MASONRY & SURFACE FINISHES
------------------------------------------------------------- */
export interface MasonryResult {
  grossWallAreaM2: number;
  totalOpeningAreaM2: number;
  netWallAreaM2: number;
  netWallVolumeM3: number;

  // Brick counts
  nominalBrickVolumeM3: number;
  actualBrickVolumeM3: number;
  requiredBricksCount: number;
  bricksWithWastageCount: number;

  // Mortar in masonry
  mortarVolumeDryM3: number;
  mortarCementBags50Kg: number;
  mortarSandM3: number;
  mortarSandCft: number;

  // Plastering coat
  plasterAreaM2: number;
  plasterWetVolM3: number;
  plasterDryVolM3: number;
  plasterCementBags: number;
  plasterSandM3: number;
  plasterSandCft: number;

  // Floor Tiles
  floorAreaM2: number;
  singleTileAreaM2: number;
  tilesRequiredCount: number;
  tilesWithWastageCount: number;
  tileBoxesCount: number;

  status: 'nominal' | 'warning' | 'critical';
}

export function computeMasonryFinishes(
  params: MasonryParameters
): CalculationEnvelope<MasonryResult> {
  const issues: ValidationIssue[] = [];

  if (params.wallLengthM <= 0 || params.wallHeightM <= 0 || params.wallThicknessM <= 0) {
    issues.push({ field: 'wallLengthM', message: 'Wall dimensions (L, H, thickness) must be strictly positive (> 0 m).', severity: 'error' });
  }
  if (params.brickLengthMm <= 0 || params.brickWidthMm <= 0 || params.brickHeightMm <= 0) {
    issues.push({ field: 'brickLengthMm', message: 'Brick dimensions must be strictly positive (> 0 mm).', severity: 'error' });
  }
  if (params.mortarRatioCement <= 0 || params.mortarRatioSand <= 0) {
    issues.push({ field: 'mortarRatioCement', message: 'Mortar cement and sand ratios must be strictly positive.', severity: 'error' });
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<MasonryResult>(null, issues);
  }

  const grossWallAreaM2 = params.wallLengthM * params.wallHeightM;
  let totalOpeningAreaM2 = 0;
  if (Array.isArray(params.openings)) {
    for (const op of params.openings) {
      if (op.widthM > 0 && op.heightM > 0 && op.count > 0) {
        totalOpeningAreaM2 += op.widthM * op.heightM * op.count;
      }
    }
  }

  if (totalOpeningAreaM2 >= grossWallAreaM2) {
    issues.push({ field: 'openings', message: 'Opening deductions exceed or equal total wall surface area.', severity: 'error' });
    return createEnvelope<MasonryResult>(null, issues);
  }

  const netWallAreaM2 = grossWallAreaM2 - totalOpeningAreaM2;
  const netWallVolumeM3 = netWallAreaM2 * params.wallThicknessM;

  // Standard brick modular calculation with mortar joint (e.g. 10mm)
  const jM = (params.mortarJointMm || 10) / 1000;
  const nomL = params.brickLengthMm / 1000 + jM;
  const nomW = params.brickWidthMm / 1000 + jM;
  const nomH = params.brickHeightMm / 1000 + jM;
  const nominalBrickVol = nomL * nomW * nomH;

  const actL = params.brickLengthMm / 1000;
  const actW = params.brickWidthMm / 1000;
  const actH = params.brickHeightMm / 1000;
  const actualBrickVol = actL * actW * actH;

  const rawBricks = Math.ceil(netWallVolumeM3 / nominalBrickVol);
  const brickWastage = 1 + (params.brickWastagePercent || 5) / 100;
  const bricksWithWastage = Math.ceil(rawBricks * brickWastage);

  // Wet volume of mortar = netWallVolume - (rawBricks * actualBrickVol)
  const wetMortarVol = Math.max(0, netWallVolumeM3 - rawBricks * actualBrickVol);
  // Dry volume factor for mortar is 1.33 (33% shrinkage + voids)
  const dryMortarVol = wetMortarVol * 1.33;
  const mortarSum = params.mortarRatioCement + params.mortarRatioSand;
  const mortarCementM3 = (params.mortarRatioCement / mortarSum) * dryMortarVol;
  const mortarSandM3 = (params.mortarRatioSand / mortarSum) * dryMortarVol;
  const mortarCementBags = (mortarCementM3 * 1440) / 50;
  const mortarSandCft = mortarSandM3 * EXACT_CONVERSION.M3_TO_CFT;

  // Plastering Coat Calculation:
  const plasterSides = params.plasterSides || 2;
  const plasterAreaM2 = netWallAreaM2 * plasterSides;
  const plasterThickM = (params.plasterThicknessMm || 12) / 1000;
  const plasterWetVolM3 = plasterAreaM2 * plasterThickM;
  // Dry volume factor for plaster: 1.33 plus uneven joint fill (approx 1.35)
  const plasterDryVolM3 = plasterWetVolM3 * 1.35;
  const plasterSum = (params.plasterRatioCement || 1) + (params.plasterRatioSand || 4);
  const plasterCementM3 = ((params.plasterRatioCement || 1) / plasterSum) * plasterDryVolM3;
  const plasterSandM3 = ((params.plasterRatioSand || 4) / plasterSum) * plasterDryVolM3;
  const plasterCementBags = (plasterCementM3 * 1440) / 50;
  const plasterSandCft = plasterSandM3 * EXACT_CONVERSION.M3_TO_CFT;

  // Floor Tiles:
  const floorAreaM2 = (params.floorLengthM || 0) * (params.floorWidthM || 0);
  const singleTileAreaM2 =
    ((params.tileLengthMm || 600) / 1000) * ((params.tileWidthMm || 600) / 1000);
  const rawTiles = singleTileAreaM2 > 0 && floorAreaM2 > 0 ? Math.ceil(floorAreaM2 / singleTileAreaM2) : 0;
  const tileWastage = 1 + (params.tileWastagePercent || 5) / 100;
  const tilesWithWastage = Math.ceil(rawTiles * tileWastage);
  const boxes = params.tilesPerBox > 0 ? Math.ceil(tilesWithWastage / params.tilesPerBox) : 0;

  return createEnvelope<MasonryResult>(
    {
      grossWallAreaM2: Number(grossWallAreaM2.toFixed(2)),
      totalOpeningAreaM2: Number(totalOpeningAreaM2.toFixed(2)),
      netWallAreaM2: Number(netWallAreaM2.toFixed(2)),
      netWallVolumeM3: Number(netWallVolumeM3.toFixed(3)),
      nominalBrickVolumeM3: nominalBrickVol,
      actualBrickVolumeM3: actualBrickVol,
      requiredBricksCount: rawBricks,
      bricksWithWastageCount: bricksWithWastage,
      mortarVolumeDryM3: Number(dryMortarVol.toFixed(3)),
      mortarCementBags50Kg: Number(mortarCementBags.toFixed(1)),
      mortarSandM3: Number(mortarSandM3.toFixed(3)),
      mortarSandCft: Number(mortarSandCft.toFixed(1)),
      plasterAreaM2: Number(plasterAreaM2.toFixed(2)),
      plasterWetVolM3: Number(plasterWetVolM3.toFixed(3)),
      plasterDryVolM3: Number(plasterDryVolM3.toFixed(3)),
      plasterCementBags: Number(plasterCementBags.toFixed(1)),
      plasterSandM3: Number(plasterSandM3.toFixed(3)),
      plasterSandCft: Number(plasterSandCft.toFixed(1)),
      floorAreaM2: Number(floorAreaM2.toFixed(2)),
      singleTileAreaM2: Number(singleTileAreaM2.toFixed(4)),
      tilesRequiredCount: rawTiles,
      tilesWithWastageCount: tilesWithWastage,
      tileBoxesCount: boxes,
      status: 'nominal',
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 8: EARTHWORK & ROAD PRISMOIDAL ALIGNMENT
------------------------------------------------------------- */
export interface EarthworkResult {
  calculationType: string;
  soilClassification: string;
  bankVolumeM3: number; // in-situ volume
  looseVolumeM3: number; // swelled volume for hauling
  compactedVolumeM3: number; // shrunk volume after compaction
  swellFactor: number;
  shrinkageFactor: number;
  haulTruckTripsCount10M3: number;

  // Prismoidal breakdown (if road alignment):
  areaStation1M2?: number;
  areaStationMidM2?: number;
  areaStation3M2?: number;
  prismoidalVolumeM3?: number;
  trapezoidalVolumeM3?: number; // for comparison (end-area)
  prismoidalCorrectionM3?: number;

  status: 'nominal' | 'warning' | 'critical';
}

export function computeEarthwork(
  params: EarthworkParameters
): CalculationEnvelope<EarthworkResult> {
  const issues: ValidationIssue[] = [];

  // Bulking and shrinkage factors by soil type:
  // Sand/gravel: swell 15%, shrinkage 88%
  // Common earth: swell 25%, shrinkage 80%
  // Dense clay: swell 40%, shrinkage 75%
  // Blasted rock: swell 60%, shrinkage 125%
  let swellPercent = 25;
  let shrinkagePercent = 80;

  if (params.soilType === 'sand-gravel') {
    swellPercent = 15;
    shrinkagePercent = 88;
  } else if (params.soilType === 'common-earth') {
    swellPercent = 25;
    shrinkagePercent = 80;
  } else if (params.soilType === 'dense-clay') {
    swellPercent = 40;
    shrinkagePercent = 75;
  } else if (params.soilType === 'blasted-rock') {
    swellPercent = 60;
    shrinkagePercent = 125;
  }

  if (typeof params.customSwellPercent === 'number' && params.customSwellPercent >= 0) {
    swellPercent = params.customSwellPercent;
  }
  if (typeof params.customShrinkagePercent === 'number' && params.customShrinkagePercent > 0) {
    shrinkagePercent = params.customShrinkagePercent;
  }

  let bankVolumeM3 = 0;
  let a1 = 0;
  let aMid = 0;
  let a3 = 0;
  let prismoidalVol = 0;
  let endAreaVol = 0;

  if (params.calculationType === 'pit-excavation') {
    if (params.pitTopLengthM <= 0 || params.pitTopWidthM <= 0 || params.pitDepthM <= 0) {
      issues.push({ field: 'pitTopLengthM', message: 'Pit excavation dimensions must be strictly positive (> 0 m).', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error')) {
      // Sloped pit frustum formula: V = (d / 6) * [ A_top + A_bottom + 4 * A_mid ]
      // with side slope s (H:1V), bottom dimensions:
      const L_top = params.pitTopLengthM;
      const W_top = params.pitTopWidthM;
      const d = params.pitDepthM;
      const s = params.pitSideSlopeH || 0;

      const L_bot = L_top - 2 * s * d;
      const W_bot = W_top - 2 * s * d;

      if (L_bot <= 0 || W_bot <= 0) {
        issues.push({ field: 'pitSideSlopeH', message: 'Side slope is too steep for depth, causing negative bottom dimension.', severity: 'error' });
        return createEnvelope<EarthworkResult>(null, issues);
      }

      const A_top = L_top * W_top;
      const A_bot = L_bot * W_bot;
      const A_mid = ((L_top + L_bot) / 2) * ((W_top + W_bot) / 2);

      bankVolumeM3 = (d / 6) * (A_top + A_bot + 4 * A_mid);
    }
  } else if (params.calculationType === 'trapezoidal-trench') {
    if (params.trenchLengthM <= 0 || params.trenchBottomWidthM <= 0 || params.trenchDepthM <= 0) {
      issues.push({ field: 'trenchLengthM', message: 'Trench length, bottom width, and depth must be strictly positive (> 0 m).', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error')) {
      const b = params.trenchBottomWidthM;
      const d = params.trenchDepthM;
      const s = params.trenchSideSlopeH || 0;
      const area = (b + s * d) * d;
      bankVolumeM3 = area * params.trenchLengthM;
    }
  } else {
    // Road Prismoidal Alignment across 3 stations (L total length, station 1, station 2 mid, station 3)
    if (params.roadLengthM <= 0 || params.formationWidthM <= 0) {
      issues.push({ field: 'roadLengthM', message: 'Road length and formation width must be strictly positive (> 0 m).', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error')) {
      const b = params.formationWidthM;
      const s = params.sideSlopeS || 1.5;
      const d1 = params.depthStation1M || 0;
      const d2 = params.depthStation2M || 0;
      const d3 = params.depthStation3M || 0;

      // Cross-sectional areas of trapezoidal road cut/fill: A = (b + s*d)*d
      a1 = (b + s * d1) * d1;
      aMid = (b + s * d2) * d2;
      a3 = (b + s * d3) * d3;

      // Prismoidal formula: V = (L / 6) * [A1 + 4*Am + A3]
      prismoidalVol = (params.roadLengthM / 6) * (a1 + 4 * aMid + a3);
      // End-area method for comparison: V = (L / 2) * [(A1 + Am)/2 + (Am + A3)/2]
      const halfL = params.roadLengthM / 2;
      endAreaVol = halfL * ((a1 + aMid) / 2 + (aMid + a3) / 2);
      bankVolumeM3 = prismoidalVol;
    }
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<EarthworkResult>(null, issues);
  }

  const swellFactor = 1 + swellPercent / 100;
  const looseVolumeM3 = bankVolumeM3 * swellFactor;
  const shrinkageFactor = shrinkagePercent / 100;
  const compactedVolumeM3 = bankVolumeM3 * shrinkageFactor;
  const haulTruckTrips = Math.ceil(looseVolumeM3 / 10); // standard 10 m3 tipper truck

  return createEnvelope<EarthworkResult>(
    {
      calculationType: params.calculationType,
      soilClassification: params.soilType,
      bankVolumeM3: Number(bankVolumeM3.toFixed(2)),
      looseVolumeM3: Number(looseVolumeM3.toFixed(2)),
      compactedVolumeM3: Number(compactedVolumeM3.toFixed(2)),
      swellFactor,
      shrinkageFactor,
      haulTruckTripsCount10M3: haulTruckTrips,
      areaStation1M2: Number(a1.toFixed(2)),
      areaStationMidM2: Number(aMid.toFixed(2)),
      areaStation3M2: Number(a3.toFixed(2)),
      prismoidalVolumeM3: Number(prismoidalVol.toFixed(2)),
      trapezoidalVolumeM3: Number(endAreaVol.toFixed(2)),
      prismoidalCorrectionM3: Number((endAreaVol - prismoidalVol).toFixed(2)),
      status: 'nominal',
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 9: QUANTITY TAKEOFF & BOQ ESTIMATOR
------------------------------------------------------------- */
export interface ComputedTakeoffItem {
  id: string;
  itemNo: string;
  description: string;
  category: TakeoffCategory;
  numberOfMembers: number;
  lengthM: number;
  widthM: number;
  heightM: number;
  deductionQty: number;
  unit: TakeoffUnit;
  grossQty: number;
  netQty: number;
  wastagePercent: number;
  wastageQty: number;
  totalBillableQty: number;
  unitRate: number;
  itemTotalAmount: number;
}

export interface BOQCategorySummary {
  category: TakeoffCategory;
  itemCount: number;
  subtotal: number;
  percentageOfSubtotal: number;
}

export interface BOQResult {
  currency: CurrencyCode;
  currencySymbol: string;
  items: ComputedTakeoffItem[];
  subtotalAmount: number;
  contingencyPercent: number;
  contingencyAmount: number;
  contractorOverheadPercent: number;
  contractorOverheadAmount: number;
  vatTaxPercent: number;
  vatTaxAmount: number;
  grandTotalAmount: number;
  categorySummaries: BOQCategorySummary[];
  totalItemCount: number;
  status: 'nominal' | 'warning' | 'critical';
}

export function getCurrencySymbol(code: CurrencyCode): string {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return found ? found.symbol : '$';
}

export function computeBOQEstimator(params: BOQParameters): CalculationEnvelope<BOQResult> {
  const issues: ValidationIssue[] = [];

  if (!params.items || params.items.length === 0) {
    issues.push({
      field: 'items',
      message: 'Takeoff sheet currently contains no line items.',
      severity: 'warning',
    });
  }

  if (params.contingencyPercent < 0 || params.contingencyPercent > 50) {
    issues.push({
      field: 'contingencyPercent',
      message: 'Contingency percentage must be between 0% and 50%.',
      severity: 'warning',
    });
  }

  if (params.contractorOverheadPercent < 0 || params.contractorOverheadPercent > 60) {
    issues.push({
      field: 'contractorOverheadPercent',
      message: 'Contractor Profit & Overhead (CP&OH) percentage should be between 0% and 60%.',
      severity: 'warning',
    });
  }

  if (params.vatTaxPercent < 0 || params.vatTaxPercent > 50) {
    issues.push({
      field: 'vatTaxPercent',
      message: 'VAT/Tax percentage should be between 0% and 50%.',
      severity: 'warning',
    });
  }

  const symbol = getCurrencySymbol(params.currency || 'USD');

  const computedItems: ComputedTakeoffItem[] = (params.items || []).map((item, idx) => {
    const nos = item.numberOfMembers > 0 ? item.numberOfMembers : 1;
    const l = item.lengthM > 0 ? item.lengthM : 0;
    const w = item.widthM > 0 ? item.widthM : 0;
    const h = item.heightM > 0 ? item.heightM : 0;

    let gross = 0;
    switch (item.unit) {
      case 'm3':
        gross = nos * (l > 0 ? l : 1) * (w > 0 ? w : 1) * (h > 0 ? h : 1);
        break;
      case 'cft':
        // Dimensions entered in SI meters -> convert base m3 to CFT exactly
        gross = nos * (l > 0 ? l : 1) * (w > 0 ? w : 1) * (h > 0 ? h : 1) * EXACT_CONVERSION.M3_TO_CFT;
        break;
      case 'm2':
        gross = nos * (l > 0 ? l : 1) * (w > 0 ? w : 1);
        break;
      case 'sft':
        // Dimensions entered in SI meters -> convert base m2 to SFT exactly
        gross = nos * (l > 0 ? l : 1) * (w > 0 ? w : 1) * EXACT_CONVERSION.M2_TO_SFT;
        break;
      case 'm':
        gross = nos * (l > 0 ? l : 1);
        break;
      case 'rft':
        // Dimensions entered in SI meters -> convert base m to RFT (feet) exactly
        gross = nos * (l > 0 ? l : 1) * EXACT_CONVERSION.M_TO_FT;
        break;
      case 'kg':
      case 'ton':
      case 'bags':
      case 'nos':
      case 'lump-sum':
      default:
        gross = nos * (l > 0 ? l : 1);
        break;
    }

    const deduction = Math.max(0, item.deductionQty || 0);
    const net = Math.max(0, gross - deduction);
    const wastagePct = Math.max(0, item.wastagePercent || 0);
    const wastageQty = net * (wastagePct / 100);
    const billableQty = net + wastageQty;
    const rate = Math.max(0, item.unitRate || 0);
    const itemTotal = billableQty * rate;

    if (item.unitRate <= 0) {
      issues.push({
        field: `items[${idx}].unitRate`,
        message: `Line item #${item.itemNo || idx + 1} ("${item.description}") has zero unit rate.`,
        severity: 'warning',
      });
    }

    return {
      id: item.id,
      itemNo: item.itemNo || `${idx + 1}`,
      description: item.description || `Item #${idx + 1}`,
      category: item.category || 'misc',
      numberOfMembers: nos,
      lengthM: l,
      widthM: w,
      heightM: h,
      deductionQty: deduction,
      unit: item.unit,
      grossQty: Number(gross.toFixed(3)),
      netQty: Number(net.toFixed(3)),
      wastagePercent: wastagePct,
      wastageQty: Number(wastageQty.toFixed(3)),
      totalBillableQty: Number(billableQty.toFixed(3)),
      unitRate: rate,
      itemTotalAmount: Number(itemTotal.toFixed(2)),
    };
  });

  const subtotal = computedItems.reduce((acc, it) => acc + it.itemTotalAmount, 0);
  const contingencyAmt = subtotal * ((params.contingencyPercent || 0) / 100);
  const cpAndOhAmt = (subtotal + contingencyAmt) * ((params.contractorOverheadPercent || 0) / 100);
  const vatTaxAmt = (subtotal + contingencyAmt + cpAndOhAmt) * ((params.vatTaxPercent || 0) / 100);
  const grandTotal = subtotal + contingencyAmt + cpAndOhAmt + vatTaxAmt;

  // Category summary map
  const catMap: Record<TakeoffCategory, { count: number; subtotal: number }> = {
    earthwork: { count: 0, subtotal: 0 },
    substructure: { count: 0, subtotal: 0 },
    superstructure: { count: 0, subtotal: 0 },
    rebar: { count: 0, subtotal: 0 },
    masonry: { count: 0, subtotal: 0 },
    finishing: { count: 0, subtotal: 0 },
    plumbing: { count: 0, subtotal: 0 },
    electrical: { count: 0, subtotal: 0 },
    misc: { count: 0, subtotal: 0 },
  };

  computedItems.forEach((it) => {
    if (catMap[it.category]) {
      catMap[it.category].count += 1;
      catMap[it.category].subtotal += it.itemTotalAmount;
    }
  });

  const categorySummaries: BOQCategorySummary[] = (
    Object.keys(catMap) as TakeoffCategory[]
  )
    .filter((cat) => catMap[cat].count > 0)
    .map((cat) => ({
      category: cat,
      itemCount: catMap[cat].count,
      subtotal: Number(catMap[cat].subtotal.toFixed(2)),
      percentageOfSubtotal:
        subtotal > 0 ? Number(((catMap[cat].subtotal / subtotal) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.subtotal - a.subtotal);

  return createEnvelope<BOQResult>(
    {
      currency: params.currency || 'USD',
      currencySymbol: symbol,
      items: computedItems,
      subtotalAmount: Number(subtotal.toFixed(2)),
      contingencyPercent: params.contingencyPercent,
      contingencyAmount: Number(contingencyAmt.toFixed(2)),
      contractorOverheadPercent: params.contractorOverheadPercent,
      contractorOverheadAmount: Number(cpAndOhAmt.toFixed(2)),
      vatTaxPercent: params.vatTaxPercent,
      vatTaxAmount: Number(vatTaxAmt.toFixed(2)),
      grandTotalAmount: Number(grandTotal.toFixed(2)),
      categorySummaries,
      totalItemCount: computedItems.length,
      status: 'nominal',
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 10: GRANULAR RATE ANALYSIS (1 m³ RCC & CIVIL TRADES)
------------------------------------------------------------- */
export interface RateAnalysisMaterialBreakdown {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  percentageOfMaterial: number;
}

export interface RateAnalysisLaborBreakdown {
  trade: string;
  daysRequired: number;
  dailyWage: number;
  totalCost: number;
}

export interface RateAnalysisEquipmentBreakdown {
  equipment: string;
  ratePerUnit: number;
  totalCost: number;
}

export interface RateAnalysisResult {
  workType: RateAnalysisWorkType;
  workDescription: string;
  basisVolumeM3: number;
  currency: CurrencyCode;
  currencySymbol: string;
  materials: RateAnalysisMaterialBreakdown[];
  materialsCost: number;
  labors: RateAnalysisLaborBreakdown[];
  laborsCost: number;
  equipment: RateAnalysisEquipmentBreakdown[];
  equipmentCost: number;
  primeCost: number;
  waterElectricityPercent: number;
  waterElectricityCost: number;
  subtotalBeforeProfit: number;
  contractorProfitPercent: number;
  contractorProfitCost: number;
  grandTotalCost: number;
  unitRatePerM3: number;
  unitRatePerCft: number;
  costDistributionPercent: {
    materials: number;
    labor: number;
    equipment: number;
    waterElectricity: number;
    contractorProfit: number;
  };
  status: 'nominal' | 'warning' | 'critical';
}

export function computeRateAnalysis(
  params: RateAnalysisParameters
): CalculationEnvelope<RateAnalysisResult> {
  const issues: ValidationIssue[] = [];

  if (params.basisVolumeM3 <= 0) {
    issues.push({
      field: 'basisVolumeM3',
      message: 'Analysis basis volume must be strictly greater than 0 m³.',
      severity: 'error',
    });
  }

  const vol = Math.max(0.001, params.basisVolumeM3);
  const symbol = getCurrencySymbol(params.currency || 'USD');

  let desc = '';
  const materials: RateAnalysisMaterialBreakdown[] = [];

  switch (params.workType) {
    case 'rcc-1-1.5-3': {
      desc = 'RCC Structural Concrete (1:1.5:3, ~M20/C20) with Rebar & Shuttering';
      const dryVol = 1.54 * vol;
      const sumProp = 5.5;
      const cementM3 = dryVol / sumProp;
      const cementBags = (cementM3 * 1440) / 50;
      const sandM3 = cementM3 * 1.5;
      const stoneM3 = cementM3 * 3.0;
      const rebarKg = (params.rebarAllowanceKgPerM3 || 100) * vol;
      const admixKg = (params.admixtureDoseKgPerM3 || 0) * vol;

      materials.push(
        {
          name: 'Portland Cement (50kg bags)',
          quantity: Number(cementBags.toFixed(2)),
          unit: 'bags',
          unitPrice: params.cementPricePerBag,
          totalCost: Number((cementBags * params.cementPricePerBag).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Coarse Sand (FM 2.5)',
          quantity: Number(sandM3.toFixed(3)),
          unit: 'm³',
          unitPrice: params.sandPricePerM3,
          totalCost: Number((sandM3 * params.sandPricePerM3).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Graded Stone Chips (20mm down)',
          quantity: Number(stoneM3.toFixed(3)),
          unit: 'm³',
          unitPrice: params.stoneChipsPricePerM3,
          totalCost: Number((stoneM3 * params.stoneChipsPricePerM3).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Deformed Rebar (Grade 60/500W)',
          quantity: Number(rebarKg.toFixed(1)),
          unit: 'kg',
          unitPrice: params.rebarPricePerKg,
          totalCost: Number((rebarKg * params.rebarPricePerKg).toFixed(2)),
          percentageOfMaterial: 0,
        }
      );

      if (admixKg > 0 && params.admixturePricePerKg > 0) {
        materials.push({
          name: 'Chemical Plasticizer / Retarder',
          quantity: Number(admixKg.toFixed(2)),
          unit: 'kg',
          unitPrice: params.admixturePricePerKg,
          totalCost: Number((admixKg * params.admixturePricePerKg).toFixed(2)),
          percentageOfMaterial: 0,
        });
      }
      break;
    }
    case 'rcc-1-2-4': {
      desc = 'RCC Structural Concrete (1:2:4, ~M15/C15) with Reinforcement';
      const dryVol = 1.54 * vol;
      const sumProp = 7.0;
      const cementM3 = dryVol / sumProp;
      const cementBags = (cementM3 * 1440) / 50;
      const sandM3 = cementM3 * 2.0;
      const stoneM3 = cementM3 * 4.0;
      const rebarKg = (params.rebarAllowanceKgPerM3 || 80) * vol;

      materials.push(
        {
          name: 'Portland Cement (50kg bags)',
          quantity: Number(cementBags.toFixed(2)),
          unit: 'bags',
          unitPrice: params.cementPricePerBag,
          totalCost: Number((cementBags * params.cementPricePerBag).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Coarse Sand (FM 2.2)',
          quantity: Number(sandM3.toFixed(3)),
          unit: 'm³',
          unitPrice: params.sandPricePerM3,
          totalCost: Number((sandM3 * params.sandPricePerM3).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Graded Stone Chips (20mm down)',
          quantity: Number(stoneM3.toFixed(3)),
          unit: 'm³',
          unitPrice: params.stoneChipsPricePerM3,
          totalCost: Number((stoneM3 * params.stoneChipsPricePerM3).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Deformed Rebar (Grade 60/500W)',
          quantity: Number(rebarKg.toFixed(1)),
          unit: 'kg',
          unitPrice: params.rebarPricePerKg,
          totalCost: Number((rebarKg * params.rebarPricePerKg).toFixed(2)),
          percentageOfMaterial: 0,
        }
      );
      break;
    }
    case 'pcc-1-3-6': {
      desc = 'PCC Bed / Mass Concrete (1:3:6) for Sub-base & Footing Bedding';
      const dryVol = 1.54 * vol;
      const sumProp = 10.0;
      const cementM3 = dryVol / sumProp;
      const cementBags = (cementM3 * 1440) / 50;
      const sandM3 = cementM3 * 3.0;
      const stoneM3 = cementM3 * 6.0;

      materials.push(
        {
          name: 'Portland Cement (50kg bags)',
          quantity: Number(cementBags.toFixed(2)),
          unit: 'bags',
          unitPrice: params.cementPricePerBag,
          totalCost: Number((cementBags * params.cementPricePerBag).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Medium Sand',
          quantity: Number(sandM3.toFixed(3)),
          unit: 'm³',
          unitPrice: params.sandPricePerM3,
          totalCost: Number((sandM3 * params.sandPricePerM3).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Brick Shingles / Coarse Gravel (40mm)',
          quantity: Number(stoneM3.toFixed(3)),
          unit: 'm³',
          unitPrice: params.stoneChipsPricePerM3 * 0.85,
          totalCost: Number((stoneM3 * params.stoneChipsPricePerM3 * 0.85).toFixed(2)),
          percentageOfMaterial: 0,
        }
      );
      break;
    }
    case 'brickwork-1-6': {
      desc = 'First Class Brick Masonry in 1:6 Cement-Sand Mortar';
      const bricksNos = 500 * vol;
      const dryMortarM3 = 0.3 * vol;
      const cementM3 = dryMortarM3 / 7;
      const cementBags = (cementM3 * 1440) / 50;
      const sandM3 = cementM3 * 6;
      const brickPriceEach = (params.brickPricePer1000 || 12000) / 1000;

      materials.push(
        {
          name: 'First Class Clay Bricks (Standard)',
          quantity: Number(bricksNos.toFixed(0)),
          unit: 'Nos',
          unitPrice: brickPriceEach,
          totalCost: Number((bricksNos * brickPriceEach).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Portland Cement (Mortar)',
          quantity: Number(cementBags.toFixed(2)),
          unit: 'bags',
          unitPrice: params.cementPricePerBag,
          totalCost: Number((cementBags * params.cementPricePerBag).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Local Masonry Sand',
          quantity: Number(sandM3.toFixed(3)),
          unit: 'm³',
          unitPrice: params.sandPricePerM3,
          totalCost: Number((sandM3 * params.sandPricePerM3).toFixed(2)),
          percentageOfMaterial: 0,
        }
      );
      break;
    }
    case 'plaster-1-4': {
      desc = '12mm Wall Cement Plaster in 1:4 Cement-Sand Mortar';
      // 1 m³ of mortar yields ~75 m² of finished 12mm plaster with joints
      const dryMortarM3 = 1.33 * vol;
      const cementM3 = dryMortarM3 / 5;
      const cementBags = (cementM3 * 1440) / 50;
      const sandM3 = cementM3 * 4;

      materials.push(
        {
          name: 'Portland Cement (Plaster)',
          quantity: Number(cementBags.toFixed(2)),
          unit: 'bags',
          unitPrice: params.cementPricePerBag,
          totalCost: Number((cementBags * params.cementPricePerBag).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Fine Plaster Sand (FM 1.5)',
          quantity: Number(sandM3.toFixed(3)),
          unit: 'm³',
          unitPrice: params.sandPricePerM3,
          totalCost: Number((sandM3 * params.sandPricePerM3).toFixed(2)),
          percentageOfMaterial: 0,
        }
      );
      break;
    }
    case 'rebar-fabrication': {
      desc = 'Fabrication, Bending, Binding, and Placing of Rebar (per Metric Ton / 1000 kg)';
      const steelKg = 1000 * vol;
      const bindingWireKg = 10 * vol;
      const coverBlocksNos = 80 * vol;

      materials.push(
        {
          name: 'High-Yield Deformed Steel Rebar (500W)',
          quantity: Number(steelKg.toFixed(1)),
          unit: 'kg',
          unitPrice: params.rebarPricePerKg,
          totalCost: Number((steelKg * params.rebarPricePerKg).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Annealed G.I. Binding Wire (20-22 SWG)',
          quantity: Number(bindingWireKg.toFixed(1)),
          unit: 'kg',
          unitPrice: params.rebarPricePerKg * 1.3,
          totalCost: Number((bindingWireKg * params.rebarPricePerKg * 1.3).toFixed(2)),
          percentageOfMaterial: 0,
        },
        {
          name: 'Concrete Cover Spacers (40mm/25mm)',
          quantity: Number(coverBlocksNos.toFixed(0)),
          unit: 'Nos',
          unitPrice: 0.15,
          totalCost: Number((coverBlocksNos * 0.15).toFixed(2)),
          percentageOfMaterial: 0,
        }
      );
      break;
    }
  }

  const materialsCost = materials.reduce((acc, m) => acc + m.totalCost, 0);
  materials.forEach((m) => {
    m.percentageOfMaterial =
      materialsCost > 0 ? Number(((m.totalCost / materialsCost) * 100).toFixed(1)) : 0;
  });

  // Labors breakdown
  const masonCost = (params.masonDaysRequired || 0) * (params.masonDailyWage || 0) * vol;
  const laborerCost = (params.laborerDaysRequired || 0) * (params.laborerDailyWage || 0) * vol;
  const barBenderCost = (params.barBenderDaysRequired || 0) * (params.barBenderDailyWage || 0) * vol;

  const labors: RateAnalysisLaborBreakdown[] = [
    {
      trade: 'Skilled Head Mason (Rajmistri)',
      daysRequired: Number(((params.masonDaysRequired || 0) * vol).toFixed(3)),
      dailyWage: params.masonDailyWage,
      totalCost: Number(masonCost.toFixed(2)),
    },
    {
      trade: 'General Helper / Laborer (Jogali)',
      daysRequired: Number(((params.laborerDaysRequired || 0) * vol).toFixed(3)),
      dailyWage: params.laborerDailyWage,
      totalCost: Number(laborerCost.toFixed(2)),
    },
  ];

  if (params.workType.startsWith('rcc') || params.workType === 'rebar-fabrication') {
    labors.push({
      trade: 'Steel Fitter / Bar Bender',
      daysRequired: Number(((params.barBenderDaysRequired || 0) * vol).toFixed(3)),
      dailyWage: params.barBenderDailyWage,
      totalCost: Number(barBenderCost.toFixed(2)),
    });
  }

  const laborsCost = labors.reduce((acc, l) => acc + l.totalCost, 0);

  // Equipment & Shuttering hire
  const mixerCost = (params.mixerHirePerM3 || 0) * vol;
  const vibratorCost = (params.vibratorHirePerM3 || 0) * vol;
  const shutteringCost = (params.shutteringScaffoldingPerM3 || 0) * vol;

  const equipment: RateAnalysisEquipmentBreakdown[] = [
    {
      equipment: 'Concrete Batch Mixer Machine Hire',
      ratePerUnit: params.mixerHirePerM3,
      totalCost: Number(mixerCost.toFixed(2)),
    },
    {
      equipment: 'High-Frequency Needle Vibrator (Petrol/Electric)',
      ratePerUnit: params.vibratorHirePerM3,
      totalCost: Number(vibratorCost.toFixed(2)),
    },
    {
      equipment: 'Steel / Timber Shuttering & Scaffolding Centering',
      ratePerUnit: params.shutteringScaffoldingPerM3,
      totalCost: Number(shutteringCost.toFixed(2)),
    },
  ];

  const equipmentCost = equipment.reduce((acc, eq) => acc + eq.totalCost, 0);

  const primeCost = materialsCost + laborsCost + equipmentCost;
  const waterElectPct = Math.max(0, params.waterElectricityPercent || 1.5);
  const waterElectCost = primeCost * (waterElectPct / 100);
  const subtotalBeforeProfit = primeCost + waterElectCost;
  const profitPct = Math.max(0, params.contractorProfitPercent || 10.0);
  const contractorProfitCost = subtotalBeforeProfit * (profitPct / 100);
  const grandTotalCost = subtotalBeforeProfit + contractorProfitCost;

  const unitRatePerM3 = grandTotalCost / vol;
  const unitRatePerCft = unitRatePerM3 / EXACT_CONVERSION.M3_TO_CFT;

  const costDistributionPercent = {
    materials: grandTotalCost > 0 ? Number(((materialsCost / grandTotalCost) * 100).toFixed(1)) : 0,
    labor: grandTotalCost > 0 ? Number(((laborsCost / grandTotalCost) * 100).toFixed(1)) : 0,
    equipment: grandTotalCost > 0 ? Number(((equipmentCost / grandTotalCost) * 100).toFixed(1)) : 0,
    waterElectricity:
      grandTotalCost > 0 ? Number(((waterElectCost / grandTotalCost) * 100).toFixed(1)) : 0,
    contractorProfit:
      grandTotalCost > 0 ? Number(((contractorProfitCost / grandTotalCost) * 100).toFixed(1)) : 0,
  };

  if (materialsCost <= 0) {
    issues.push({
      field: 'materialsCost',
      message: 'Zero material cost detected. Please verify material rates.',
      severity: 'warning',
    });
  }

  if (laborsCost <= 0) {
    issues.push({
      field: 'laborsCost',
      message: 'Zero labor cost detected. Please verify labor wage inputs.',
      severity: 'warning',
    });
  }

  return createEnvelope<RateAnalysisResult>(
    {
      workType: params.workType,
      workDescription: desc,
      basisVolumeM3: vol,
      currency: params.currency || 'USD',
      currencySymbol: symbol,
      materials,
      materialsCost: Number(materialsCost.toFixed(2)),
      labors,
      laborsCost: Number(laborsCost.toFixed(2)),
      equipment,
      equipmentCost: Number(equipmentCost.toFixed(2)),
      primeCost: Number(primeCost.toFixed(2)),
      waterElectricityPercent: waterElectPct,
      waterElectricityCost: Number(waterElectCost.toFixed(2)),
      subtotalBeforeProfit: Number(subtotalBeforeProfit.toFixed(2)),
      contractorProfitPercent: profitPct,
      contractorProfitCost: Number(contractorProfitCost.toFixed(2)),
      grandTotalCost: Number(grandTotalCost.toFixed(2)),
      unitRatePerM3: Number(unitRatePerM3.toFixed(2)),
      unitRatePerCft: Number(unitRatePerCft.toFixed(2)),
      costDistributionPercent,
      status: 'nominal',
    },
    issues
  );
}

