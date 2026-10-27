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
  ContinuousBeamParameters,
  ContinuousBeamSpan,
  PileCapacityParameters,
  SoilLayer,
  PipeHydraulicsParameters,
} from '../types/civil';
import { EXACT_CONVERSION } from './unitConverter';
import {
  calculateChannelGeometry,
  solveCriticalDepth,
  solveHydraulicJump,
  getWaterKinematicViscosity,
  recommendPipeDiameter,
  getHydraulicMaterial,
} from './hydraulicsSolver';

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
export interface BearingCalculationStep {
  step: string;
  formula: string;
  result: string;
  clauseRef?: string;
}

export interface BoussinesqStressPoint {
  depthM: number;
  sigmaV0Kpa: number;
  deltaSigmaKpa: number;
  totalSigmaKpa: number;
  ratio: number;
}

export interface BearingAnalysisResult {
  nc: number;
  nq: number;
  nGamma: number;
  shapeSc: number;
  shapeSq: number;
  shapeSg: number;
  depthDc: number;
  depthDq: number;
  depthDg: number;
  effectiveOverburdenKpa: number;
  effectiveSubgradeGammaKnPerM3: number;
  ultimateBearingKpa: number;
  netUltimateBearingKpa: number;
  allowableBearingKpa: number;
  netAllowableBearingKpa: number;
  appliedPressureKpa: number;
  netAppliedPressureKpa: number;
  footingAreaM2: number;
  utilizationRatio: number;
  effectiveSafetyFactor: number;
  factorOfSafety: number;
  // Automated Settlement Breakdown (BNBC-2020 Clause 3.8 / Bowles)
  immediateSettlementMm: number;
  consolidationSettlementMm: number;
  totalSettlementMm: number;
  permissibleSettlementMm: number;
  settlementUtilizationRatio: number;
  settlementPass: boolean;
  // Visual Isobar Profile & Calculation Breakdown
  boussinesqPoints: BoussinesqStressPoint[];
  governingCode: string;
  solverMethodUsed: string;
  bearingClauseRef: string;
  settlementClauseRef: string;
  calculationsBreakdown: BearingCalculationStep[];
  methodComparison: {
    meyerhofKpa: number;
    terzaghiKpa: number;
    hansenKpa: number;
  };
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
    issues.push({ field: 'factorOfSafety', message: 'Factor of safety must be at least 1.0 (recommended ≥ 2.5 per BNBC-2020).', severity: 'error' });
  }
  if (params.appliedColumnLoadKn <= 0) {
    issues.push({ field: 'appliedColumnLoadKn', message: 'Applied load P must be strictly positive (> 0 kN).', severity: 'error' });
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<BearingAnalysisResult>(null, issues);
  }

  const B = params.footingWidthM;
  const L = params.footingShape === 'rectangular' && params.footingLengthM && params.footingLengthM >= B
    ? params.footingLengthM
    : B;
  const Df = params.embedmentDepthM;
  let c = params.soilCohesionKpa;
  let phi = params.frictionAngleDeg;
  let gamma = params.unitWeightKnPerM3;
  let sptN = params.sptN60 || (phi > 0 ? Math.round(phi * 0.8) : Math.round(c / 6.25) || 12);
  let EsMpa = params.elasticModulusEsMpa && params.elasticModulusEsMpa > 0
    ? params.elasticModulusEsMpa
    : phi > 0
      ? Math.max(12, 0.766 * sptN)
      : Math.max(8, 0.4 * c);
  let Cc = params.compressionIndexCc || 0.25;
  let e0 = params.initialVoidRatioE0 || 0.85;
  const Cr = params.recompressionIndexCr || Cc * 0.15;
  const ocr = params.overconsolidationRatioOcr || 1.0;

  // Multi-layer stratigraphy weighting if strata layers are provided
  if (params.layers && params.layers.length > 0) {
    let currentZ = 0;
    const influenceTop = Df;
    const influenceBottom = Df + 2 * B;
    let totalInterpWeight = 0;
    let sumC = 0;
    let sumPhi = 0;
    let sumGamma = 0;
    let sumEs = 0;
    let sumSpt = 0;

    for (const lyr of params.layers) {
      const lyrTop = currentZ;
      const lyrBot = currentZ + lyr.thicknessM;
      currentZ = lyrBot;

      const overlapStart = Math.max(influenceTop, lyrTop);
      const overlapEnd = Math.min(influenceBottom, lyrBot);
      const overlapH = overlapEnd - overlapStart;

      if (overlapH > 0) {
        totalInterpWeight += overlapH;
        sumC += lyr.cohesionKpa * overlapH;
        sumPhi += lyr.frictionAngleDeg * overlapH;
        sumGamma += lyr.unitWeightKnPerM3 * overlapH;
        sumEs += (lyr.elasticModulusEsMpa || 25) * overlapH;
        sumSpt += (lyr.sptN || 15) * overlapH;
        if (lyr.compressionIndexCc) Cc = lyr.compressionIndexCc;
        if (lyr.initialVoidRatioE0) e0 = lyr.initialVoidRatioE0;
      }
    }

    if (totalInterpWeight > 0) {
      c = sumC / totalInterpWeight;
      phi = sumPhi / totalInterpWeight;
      gamma = sumGamma / totalInterpWeight;
      EsMpa = sumEs / totalInterpWeight;
      sptN = Math.round(sumSpt / totalInterpWeight);
    }
  }

  const FS = params.factorOfSafety;
  const P = params.appliedColumnLoadKn;
  const phiRad = (phi * Math.PI) / 180;
  const solverMethod = params.shallowSolverMethod || 'meyerhof';

  // 1. Classical Bearing Capacity Factors (BNBC-2020 Part 6 Section 3.9 / Meyerhof / Hansen / Terzaghi)
  // Meyerhof & Hansen factors:
  const nqMeyerhof =
    phi === 0
      ? 1.0
      : Math.exp(Math.PI * Math.tan(phiRad)) * Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
  const ncMeyerhof = phi === 0 ? 5.14 : (nqMeyerhof - 1) / Math.tan(phiRad);
  const nGammaMeyerhof = phi === 0 ? 0 : 2 * (nqMeyerhof + 1) * Math.tan(phiRad); // Meyerhof (BNBC Table 6.3.7)

  // Terzaghi Classical Bearing Factors (Terzaghi 1943 / Bowles):
  const aTerz = Math.exp((0.75 * Math.PI - phiRad / 2) * Math.tan(phiRad));
  const nqTerzaghi = phi === 0 ? 1.0 : (Math.pow(aTerz, 2) / (2 * Math.pow(Math.cos(Math.PI / 4 + phiRad / 2), 2)));
  const ncTerzaghi = phi === 0 ? 5.70 : (nqTerzaghi - 1) / Math.tan(phiRad);
  const nGammaTerzaghi = phi === 0 ? 0 : 2 * (nqTerzaghi + 1) * Math.tan(phiRad);

  // Hansen Bearing Factors:
  const nGammaHansen = phi === 0 ? 0 : 1.5 * (nqMeyerhof - 1) * Math.tan(phiRad);

  // Governing factors based on selected solver
  let nq = nqMeyerhof;
  let nc = ncMeyerhof;
  let nGamma = nGammaMeyerhof;
  if (solverMethod === 'terzaghi') {
    nq = nqTerzaghi;
    nc = ncTerzaghi;
    nGamma = nGammaTerzaghi;
  } else if (solverMethod === 'hansen') {
    nGamma = nGammaHansen;
  }

  // 2. Shape Factors (BNBC-2020 Table 6.3.6)
  let sc = 1.0;
  let sq = 1.0;
  let sg = 1.0;

  if (solverMethod === 'terzaghi') {
    if (params.footingShape === 'square') {
      sc = 1.3;
      sq = 1.0;
      sg = 0.8;
    } else if (params.footingShape === 'circular') {
      sc = 1.3;
      sq = 1.0;
      sg = 0.6;
    } else if (params.footingShape === 'rectangular') {
      sc = 1 + 0.2 * (B / L);
      sq = 1.0;
      sg = Math.max(0.6, 1 - 0.2 * (B / L));
    } else {
      sc = 1.0;
      sq = 1.0;
      sg = 1.0;
    }
  } else {
    // Meyerhof / Hansen Shape Factors
    if (params.footingShape === 'square') {
      sc = 1.3;
      sq = 1.2;
      sg = 0.8;
    } else if (params.footingShape === 'circular') {
      sc = 1.3;
      sq = 1.2;
      sg = 0.6;
    } else if (params.footingShape === 'rectangular') {
      sc = 1 + 0.2 * (B / L);
      sq = 1 + (B / L) * Math.tan(phiRad);
      sg = Math.max(0.6, 1 - 0.4 * (B / L));
    } else {
      sc = 1.0;
      sq = 1.0;
      sg = 1.0;
    }
  }

  // 3. Depth Factors (Hansen / BNBC Section 3.9.3)
  const k = Math.min(1.0, Df / Math.max(0.1, B));
  const dc = solverMethod === 'terzaghi' ? 1.0 : 1 + 0.4 * k;
  const dq = solverMethod === 'terzaghi' ? 1.0 : 1 + 2 * Math.tan(phiRad) * Math.pow(1 - Math.sin(phiRad), 2) * k;
  const dg = 1.0;

  // 4. Groundwater Table Correction (BNBC Section 3.9.4)
  const gammaWater = 9.81;
  const gammaSub = Math.max(7.5, gamma - gammaWater);
  const Dw = params.waterTableDepthM;

  // Overburden effective unit weight (above foundation base)
  let gammaEffTop = gamma;
  if (Dw <= 0) {
    gammaEffTop = gammaSub;
  } else if (Dw < Df) {
    gammaEffTop = (gamma * Dw + gammaSub * (Df - Dw)) / Math.max(0.1, Df);
  }

  // Subgrade effective unit weight in wedge zone (from base to base + B)
  let gammaEffBottom = gamma;
  if (Dw <= Df) {
    gammaEffBottom = gammaSub;
  } else if (Dw < Df + B) {
    const dSub = Dw - Df;
    gammaEffBottom = gammaSub + (dSub / B) * (gamma - gammaSub);
  }

  const qOverburden = gammaEffTop * Df;

  // 5. Ultimate & Allowable Bearing Capacities (Governing and Comparison Methods)
  const ultimateBearingKpa =
    sc * dc * c * nc +
    sq * dq * qOverburden * nq +
    0.5 * sg * dg * gammaEffBottom * B * nGamma;

  // Parallel evaluation for method comparison
  const qUltMeyerhof =
    1.3 * (1 + 0.4 * k) * c * ncMeyerhof +
    1.2 * (1 + 2 * Math.tan(phiRad) * Math.pow(1 - Math.sin(phiRad), 2) * k) * qOverburden * nqMeyerhof +
    0.5 * 0.8 * 1.0 * gammaEffBottom * B * nGammaMeyerhof;

  const qUltTerzaghi =
    1.3 * c * ncTerzaghi +
    1.0 * qOverburden * nqTerzaghi +
    0.5 * 0.8 * gammaEffBottom * B * nGammaTerzaghi;

  const qUltHansen =
    sc * dc * c * ncMeyerhof +
    sq * dq * qOverburden * nqMeyerhof +
    0.5 * sg * dg * gammaEffBottom * B * nGammaHansen;

  const netUltimateBearingKpa = Math.max(0, ultimateBearingKpa - qOverburden);
  const allowableBearingKpa = ultimateBearingKpa / FS;
  const netAllowableBearingKpa = netUltimateBearingKpa / FS;

  // Footing Plan Area
  const footingAreaM2 =
    params.footingShape === 'circular'
      ? Math.PI * Math.pow(B / 2, 2)
      : params.footingShape === 'square'
        ? B * B
        : params.footingShape === 'rectangular'
          ? B * L
          : B * 1.0; // strip per linear meter

  const appliedPressureKpa = P / footingAreaM2;
  const netAppliedPressureKpa = Math.max(0, appliedPressureKpa - qOverburden);
  const utilizationRatio = appliedPressureKpa / allowableBearingKpa;
  const effectiveSafetyFactor = ultimateBearingKpa / Math.max(0.1, appliedPressureKpa);

  // 6. Automated Settlement Estimation (BNBC-2020 Clause 3.8 / Bowles / Schmertmann)
  const EsKpa = EsMpa * 1000;
  const poisson = params.poissonRatio || (phi > 0 ? 0.30 : 0.40);

  // Influence factor for rigid footing
  let Is = 0.82; // Square rigid
  if (params.footingShape === 'circular') Is = 0.79;
  else if (params.footingShape === 'strip') Is = 1.80;
  else if (params.footingShape === 'rectangular') Is = 0.82 * Math.sqrt(L / B);

  // Se = q_net * B * (1 - mu^2) / Es * Is (converted to mm)
  const immediateSettlementMm =
    ((netAppliedPressureKpa * B * (1 - Math.pow(poisson, 2))) / EsKpa) * Is * 1000;

  // Primary Consolidation Settlement Sc (with OCR overconsolidation check)
  let consolidationSettlementMm = 0;
  const Hc = params.clayLayerThicknessM || (c > 10 ? 4.0 : 0);

  if (Hc > 0 && c > 5) {
    const sigmaV0 = qOverburden + gammaEffBottom * (Hc / 2);
    const deltaSigma = P / ((B + Hc / 2) * (L + Hc / 2));
    if (sigmaV0 > 0 && deltaSigma > 0) {
      const sigmaPreconsolidation = sigmaV0 * ocr;
      if (sigmaV0 + deltaSigma <= sigmaPreconsolidation) {
        // Entirely on recompression curve
        consolidationSettlementMm =
          ((Cr * Hc) / (1 + e0)) * Math.log10((sigmaV0 + deltaSigma) / sigmaV0) * 1000;
      } else if (sigmaV0 < sigmaPreconsolidation) {
        // Two branches: recompression up to sigma_p, then virgin compression
        const sRecomp = ((Cr * Hc) / (1 + e0)) * Math.log10(sigmaPreconsolidation / sigmaV0) * 1000;
        const sVirgin = ((Cc * Hc) / (1 + e0)) * Math.log10((sigmaV0 + deltaSigma) / sigmaPreconsolidation) * 1000;
        consolidationSettlementMm = sRecomp + sVirgin;
      } else {
        // Normally consolidated virgin compression
        consolidationSettlementMm =
          ((Cc * Hc) / (1 + e0)) * Math.log10((sigmaV0 + deltaSigma) / sigmaV0) * 1000;
      }
    }
  }

  const totalSettlementMm = immediateSettlementMm + consolidationSettlementMm;
  const permissibleSettlementMm =
    params.permissibleSettlementMm || (phi > 25 ? 25.0 : 40.0); // BNBC-2020 Table 6.3.1 (25mm sand, 40-50mm clay)
  const settlementUtilizationRatio = totalSettlementMm / permissibleSettlementMm;
  const settlementPass = totalSettlementMm <= permissibleSettlementMm;

  // 7. Boussinesq Stress Isobar Curve Points for Visualization (z = 0 to 3B)
  const boussinesqPoints: BoussinesqStressPoint[] = [];
  const depthIntervals = [0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0];
  for (const factor of depthIntervals) {
    const z = factor * B;
    const deltaSigma = P / ((B + z) * (L + z));
    const sigmaV0 = qOverburden + gammaEffBottom * z;
    boussinesqPoints.push({
      depthM: Number((Df + z).toFixed(2)),
      sigmaV0Kpa: Number(sigmaV0.toFixed(1)),
      deltaSigmaKpa: Number(deltaSigma.toFixed(1)),
      totalSigmaKpa: Number((sigmaV0 + deltaSigma).toFixed(1)),
      ratio: Number((deltaSigma / Math.max(1, appliedPressureKpa)).toFixed(3)),
    });
  }

  // 8. Calculation Breakdown Steps with Code Clauses
  const governingCode = params.codeStandard || 'BNBC-2020 / ACI-318';
  const bearingClauseRef =
    solverMethod === 'terzaghi'
      ? 'BNBC-2020 Part 6, Chap 3, Sec 3.9 (Terzaghi Formulation)'
      : solverMethod === 'hansen'
        ? 'BNBC-2020 Part 6, Chap 3, Sec 3.9 (Hansen General Equation)'
        : 'BNBC-2020 Part 6, Chap 3, Sec 3.9 (Meyerhof Eq. 6.3.1)';
  const settlementClauseRef = 'BNBC-2020 Part 6, Chap 3, Sec 3.8 & Table 6.3.1';

  const solverMethodUsed =
    solverMethod === 'terzaghi'
      ? 'Terzaghi Classical Method'
      : solverMethod === 'hansen'
        ? 'Hansen General Formulation'
        : 'Meyerhof General Method (BNBC-2020 Standard)';

  const calculationsBreakdown: BearingCalculationStep[] = [
    {
      step: `1. Bearing Capacity Factors (${solverMethod.toUpperCase()})`,
      formula: 'Nq = e^(π·tanφ)·tan²(45+φ/2), Nc = (Nq-1)/tanφ, Nγ = 2(Nq+1)tanφ',
      result: `Nc = ${nc.toFixed(2)}, Nq = ${nq.toFixed(2)}, Nγ = ${nGamma.toFixed(2)} (for φ = ${phi.toFixed(1)}°)`,
      clauseRef: 'BNBC Table 6.3.7',
    },
    {
      step: '2. Footing Shape & Embedment Depth Factors',
      formula: 'sc, sq, sγ (Table 6.3.6) & dc, dq, dγ (Sec 3.9.3)',
      result: `sc = ${sc.toFixed(2)}, sq = ${sq.toFixed(2)}, sγ = ${sg.toFixed(2)} | dc = ${dc.toFixed(2)}, dq = ${dq.toFixed(2)}`,
      clauseRef: 'BNBC Sec 3.9.3',
    },
    {
      step: '3. Groundwater & Surcharge Integration',
      formula: 'q = γ_eff · D_f & γ_subgrade in wedge zone',
      result: `q = ${qOverburden.toFixed(1)} kPa, γ_subgrade = ${gammaEffBottom.toFixed(1)} kN/m³ (GWT at -${Dw.toFixed(1)}m)`,
      clauseRef: 'BNBC Sec 3.9.4',
    },
    {
      step: '4. Gross & Net Ultimate Bearing Capacity (q_ult)',
      formula: 'q_ult = c·Nc·sc·dc + q·Nq·sq·dq + 0.5·γ·B·Nγ·sγ·dγ',
      result: `q_ult = ${ultimateBearingKpa.toFixed(1)} kPa | q_net,ult = ${netUltimateBearingKpa.toFixed(1)} kPa`,
      clauseRef: 'BNBC Eq. 6.3.1',
    },
    {
      step: '5. Allowable Bearing Capacity & Contact Pressure',
      formula: 'q_all = q_ult / FS & q_applied = P / Area',
      result: `q_all = ${allowableBearingKpa.toFixed(1)} kPa (FS = ${FS}) vs q_applied = ${appliedPressureKpa.toFixed(1)} kPa`,
      clauseRef: 'BNBC Sec 3.9.5',
    },
    {
      step: '6. Immediate Elastic Settlement (Se)',
      formula: 'Se = q_net · B · (1 - μ²) / Es · Is',
      result: `Se = ${immediateSettlementMm.toFixed(1)} mm (Es = ${EsMpa.toFixed(1)} MPa, μ = ${poisson}, Is = ${Is})`,
      clauseRef: 'BNBC Sec 3.8.3',
    },
    {
      step: '7. Primary Consolidation Settlement (Sc)',
      formula: ocr > 1.0 ? 'Sc = Cr·Hc/(1+e0)·log(σ\'p/σ\'v0) + Cc·Hc/(1+e0)·log(σ\'v1/σ\'p)' : 'Sc = [Cc·Hc / (1 + e0)] · log10((σ\'v0 + Δσ) / σ\'v0)',
      result: `Sc = ${consolidationSettlementMm.toFixed(1)} mm (Hc = ${Hc}m, Cc = ${Cc}, Cr = ${Cr.toFixed(3)}, OCR = ${ocr})`,
      clauseRef: 'BNBC Sec 3.8.4',
    },
    {
      step: '8. Total Settlement Compliance Verification',
      formula: 'S_total = Se + Sc ≤ S_permissible',
      result: `S_total = ${totalSettlementMm.toFixed(1)} mm ≤ ${permissibleSettlementMm.toFixed(1)} mm (${settlementPass ? 'PASS' : 'EXCEEDED'})`,
      clauseRef: 'BNBC Table 6.3.1',
    },
  ];

  if (utilizationRatio > 1.0) {
    issues.push({
      field: 'appliedPressureKpa',
      message: `Applied pressure (${appliedPressureKpa.toFixed(1)} kPa) exceeds allowable bearing capacity (${allowableBearingKpa.toFixed(1)} kPa). Increase footing size.`,
      severity: 'error',
    });
  }

  if (!settlementPass) {
    issues.push({
      field: 'permissibleSettlementMm',
      message: `Estimated total settlement (${totalSettlementMm.toFixed(1)} mm) exceeds BNBC permissible limit of ${permissibleSettlementMm} mm. Ground improvement or pile foundation recommended.`,
      severity: 'warning',
    });
  }

  const status: 'nominal' | 'warning' | 'critical' =
    utilizationRatio > 1.0 || !settlementPass ? 'critical' : utilizationRatio > 0.85 ? 'warning' : 'nominal';

  return createEnvelope<BearingAnalysisResult>(
    {
      nc: Number(nc.toFixed(3)),
      nq: Number(nq.toFixed(3)),
      nGamma: Number(nGamma.toFixed(3)),
      shapeSc: Number(sc.toFixed(3)),
      shapeSq: Number(sq.toFixed(3)),
      shapeSg: Number(sg.toFixed(3)),
      depthDc: Number(dc.toFixed(3)),
      depthDq: Number(dq.toFixed(3)),
      depthDg: Number(dg.toFixed(3)),
      effectiveOverburdenKpa: Number(qOverburden.toFixed(1)),
      effectiveSubgradeGammaKnPerM3: Number(gammaEffBottom.toFixed(2)),
      ultimateBearingKpa: Number(ultimateBearingKpa.toFixed(1)),
      netUltimateBearingKpa: Number(netUltimateBearingKpa.toFixed(1)),
      allowableBearingKpa: Number(allowableBearingKpa.toFixed(1)),
      netAllowableBearingKpa: Number(netAllowableBearingKpa.toFixed(1)),
      appliedPressureKpa: Number(appliedPressureKpa.toFixed(1)),
      netAppliedPressureKpa: Number(netAppliedPressureKpa.toFixed(1)),
      footingAreaM2: Number(footingAreaM2.toFixed(3)),
      utilizationRatio: Number(utilizationRatio.toFixed(3)),
      effectiveSafetyFactor: Number(effectiveSafetyFactor.toFixed(2)),
      factorOfSafety: FS,
      immediateSettlementMm: Number(immediateSettlementMm.toFixed(1)),
      consolidationSettlementMm: Number(consolidationSettlementMm.toFixed(1)),
      totalSettlementMm: Number(totalSettlementMm.toFixed(1)),
      permissibleSettlementMm: Number(permissibleSettlementMm.toFixed(1)),
      settlementUtilizationRatio: Number(settlementUtilizationRatio.toFixed(3)),
      settlementPass,
      boussinesqPoints,
      governingCode,
      solverMethodUsed,
      bearingClauseRef,
      settlementClauseRef,
      calculationsBreakdown,
      methodComparison: {
        meyerhofKpa: Number(qUltMeyerhof.toFixed(1)),
        terzaghiKpa: Number(qUltTerzaghi.toFixed(1)),
        hansenKpa: Number(qUltHansen.toFixed(1)),
      },
      status,
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 3: ACI 211 CONCRETE MIX (With Zero Coercion)
------------------------------------------------------------- */
export interface MaterialVolumeItem {
  name: string;
  category: 'cement' | 'fine-aggregate' | 'coarse-aggregate' | 'water' | 'admixture' | 'air';
  specificGravity: number;
  dryMassKgPerM3: number;
  batchedMassKgPerM3: number;
  volumeM3PerM3: number;
  volumePercent: number;
  batchDryMassKg: number;
  batchBatchedMassKg: number;
  batchVolumeM3: number;
  moisturePercent: number;
  absorptionPercent: number;
  freeMoisturePercent: number;
  waterCorrectionKgPerM3: number;
}

export interface ConcreteMixResult {
  waterKgPerM3: number;
  adjustedWaterKgPerM3: number;
  cementKgPerM3: number;
  coarseAggKgPerM3: number;
  batchedCoarseAggKgPerM3: number;
  fineAggKgPerM3: number;
  batchedFineAggKgPerM3: number;
  admixtureKgPerM3: number;
  admixtureVolumeM3: number;
  totalDensityKgPerM3: number;
  freshConcreteUnitWeightKgPerM3: number;
  batchCementKg: number;
  batchWaterKg: number;
  batchAdjustedWaterKg: number;
  batchFineAggKg: number;
  batchBatchedFineAggKg: number;
  batchCoarseAggKg: number;
  batchBatchedCoarseAggKg: number;
  batchAdmixtureKg: number;
  cementBags50Kg: number;
  estimated28DayMpa: number;
  status: 'nominal' | 'warning' | 'critical';
  batchVolumeM3: number;
  cementBags: number;
  fineAggM3: number;
  coarseAggM3: number;
  items: MaterialVolumeItem[];
  totalSolidVolumeM3: number;
  yieldM3: number;
  relativeYield: number;
  totalAggregateFreeWaterKgPerM3: number;
  designWaterReductionPercent: number;
  fineAggSolidVolumeM3: number;
  coarseAggSolidVolumeM3: number;
  cementSolidVolumeM3: number;
  waterSolidVolumeM3: number;
  airVolumeM3: number;
  admixtureSolidVolumeM3: number;
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

  const dMax = params.maxAggregateSizeMm || 20;
  const baseWater =
    dMax <= 10 ? 205 : dMax <= 12.5 ? 198 : dMax <= 20 ? 186 : dMax <= 25 ? 179 : 165;
  const slump = params.slumpMm ?? 75;
  const slumpAdjustment = ((slump - 90) / 25) * 5.5;
  const initialWaterDemand = baseWater + slumpAdjustment;

  // Chemical admixture water reduction credit (superplasticizer / HRWR)
  const admixDosePercent = params.admixtureDosePercent ?? 1.0;
  const admixSG = params.admixtureSpecificGravity ?? 1.15;
  const waterReductionPercent = admixDosePercent > 0 ? (params.admixtureWaterReductionPercent ?? 15) : 0;
  const waterKgPerM3 = Math.max(120, initialWaterDemand * (1 - waterReductionPercent / 100));

  // Cementitious content from w/c
  const cementKgPerM3 = waterKgPerM3 / params.waterCementRatio;
  const cementSG = params.cementSpecificGravity || 3.15;
  const volCement = cementKgPerM3 / (cementSG * 1000);

  // Admixture mass and volume
  const admixtureKgPerM3 = cementKgPerM3 * (admixDosePercent / 100);
  const volAdmixture = admixtureKgPerM3 / (admixSG * 1000);

  // Water volume
  const volWater = waterKgPerM3 / 1000;

  // Air volume
  const airPercent = params.airEntrainmentPercent || 1.5;
  const volAir = airPercent / 100;

  // Coarse aggregate volume based on ACI 211.1 Table 6.3.6 (DRUW and Fineness Modulus)
  const druw = params.coarseAggDryRoddedDensityKgPerM3 || 1600;
  const fm = params.sandFinenessModulus || 2.70;
  const coarseBaseFraction =
    dMax <= 10 ? 0.48 : dMax <= 12.5 ? 0.55 : dMax <= 20 ? 0.63 : dMax <= 25 ? 0.68 : 0.74;
  const coarseVolumeFraction = Math.max(0.40, Math.min(0.80, coarseBaseFraction - (fm - 2.8) * 0.20));
  const coarseAggDryKgPerM3 = coarseVolumeFraction * druw;
  const coarseSG = params.coarseAggSpecificGravity || 2.65;
  const volCoarse = coarseAggDryKgPerM3 / (coarseSG * 1000);

  // Fine aggregate by absolute volume difference
  const volFine = 1.0 - (volCement + volWater + volAir + volAdmixture + volCoarse);

  if (volFine <= 0.05) {
    issues.push({
      field: 'waterCementRatio',
      message: 'Mix proportions exceed total solid volume in 1 m³ (Fine aggregate volume negative or deficient). Reduce coarse aggregate fraction or adjust w/c.',
      severity: 'error',
    });
    return createEnvelope<ConcreteMixResult>(null, issues);
  }

  const fineSG = params.fineAggSpecificGravity || 2.60;
  const fineAggDryKgPerM3 = volFine * fineSG * 1000;

  // Moisture & Absorption corrections (Field Batching vs Design SSD)
  const faAbs = params.fineAggAbsorptionPercent ?? 1.2;
  const faMC = params.fineAggMoisturePercent ?? 4.0;
  const caAbs = params.coarseAggAbsorptionPercent ?? 0.8;
  const caMC = params.coarseAggMoisturePercent ?? 2.0;

  const faFreeMoisture = faMC - faAbs; // %
  const caFreeMoisture = caMC - caAbs; // %

  const faWaterContribKg = fineAggDryKgPerM3 * (faFreeMoisture / 100);
  const caWaterContribKg = coarseAggDryKgPerM3 * (caFreeMoisture / 100);
  const totalFreeWaterKg = faWaterContribKg + caWaterContribKg;

  // Batched mixing water added at batching plant mixer
  const adjustedWaterKgPerM3 = Math.max(0, waterKgPerM3 - totalFreeWaterKg);

  // Batched (wet field) aggregate masses
  const batchedFineAggKgPerM3 = fineAggDryKgPerM3 * (1 + faMC / 100);
  const batchedCoarseAggKgPerM3 = coarseAggDryKgPerM3 * (1 + caMC / 100);

  // Fresh concrete unit weight & total density
  const totalDensityKgPerM3 =
    cementKgPerM3 + waterKgPerM3 + fineAggDryKgPerM3 + coarseAggDryKgPerM3 + admixtureKgPerM3;
  const freshConcreteUnitWeightKgPerM3 =
    cementKgPerM3 + adjustedWaterKgPerM3 + batchedFineAggKgPerM3 + batchedCoarseAggKgPerM3 + admixtureKgPerM3;

  const V = params.batchVolumeM3 || 1.0;

  // Yield verification
  const yieldM3 = freshConcreteUnitWeightKgPerM3 > 0 ? (freshConcreteUnitWeightKgPerM3 / 2400) : 1.0;
  const relativeYield = Number((yieldM3 / 1.0).toFixed(3));

  // Compressive strength curve estimate (Abrams Law)
  const estimated28DayMpa = 96.5 / Math.pow(7.2, 1.35 * params.waterCementRatio);
  const status: 'nominal' | 'warning' | 'critical' =
    estimated28DayMpa < params.targetStrengthMpa * 0.92
      ? 'critical'
      : estimated28DayMpa < params.targetStrengthMpa
        ? 'warning'
        : 'nominal';

  // Construct precise material volume items
  const items: MaterialVolumeItem[] = [
    {
      name: 'Portland Cement (Type I/II or CEM I)',
      category: 'cement',
      specificGravity: cementSG,
      dryMassKgPerM3: Number(cementKgPerM3.toFixed(1)),
      batchedMassKgPerM3: Number(cementKgPerM3.toFixed(1)),
      volumeM3PerM3: Number(volCement.toFixed(4)),
      volumePercent: Number((volCement * 100).toFixed(2)),
      batchDryMassKg: Number((cementKgPerM3 * V).toFixed(1)),
      batchBatchedMassKg: Number((cementKgPerM3 * V).toFixed(1)),
      batchVolumeM3: Number((volCement * V).toFixed(4)),
      moisturePercent: 0,
      absorptionPercent: 0,
      freeMoisturePercent: 0,
      waterCorrectionKgPerM3: 0,
    },
    {
      name: 'Fine Aggregate (Sand, FM ' + fm.toFixed(2) + ')',
      category: 'fine-aggregate',
      specificGravity: fineSG,
      dryMassKgPerM3: Number(fineAggDryKgPerM3.toFixed(1)),
      batchedMassKgPerM3: Number(batchedFineAggKgPerM3.toFixed(1)),
      volumeM3PerM3: Number(volFine.toFixed(4)),
      volumePercent: Number((volFine * 100).toFixed(2)),
      batchDryMassKg: Number((fineAggDryKgPerM3 * V).toFixed(1)),
      batchBatchedMassKg: Number((batchedFineAggKgPerM3 * V).toFixed(1)),
      batchVolumeM3: Number((volFine * V).toFixed(4)),
      moisturePercent: faMC,
      absorptionPercent: faAbs,
      freeMoisturePercent: Number(faFreeMoisture.toFixed(2)),
      waterCorrectionKgPerM3: Number(faWaterContribKg.toFixed(1)),
    },
    {
      name: `Coarse Aggregate (${dMax}mm Crushed Stone)`,
      category: 'coarse-aggregate',
      specificGravity: coarseSG,
      dryMassKgPerM3: Number(coarseAggDryKgPerM3.toFixed(1)),
      batchedMassKgPerM3: Number(batchedCoarseAggKgPerM3.toFixed(1)),
      volumeM3PerM3: Number(volCoarse.toFixed(4)),
      volumePercent: Number((volCoarse * 100).toFixed(2)),
      batchDryMassKg: Number((coarseAggDryKgPerM3 * V).toFixed(1)),
      batchBatchedMassKg: Number((batchedCoarseAggKgPerM3 * V).toFixed(1)),
      batchVolumeM3: Number((volCoarse * V).toFixed(4)),
      moisturePercent: caMC,
      absorptionPercent: caAbs,
      freeMoisturePercent: Number(caFreeMoisture.toFixed(2)),
      waterCorrectionKgPerM3: Number(caWaterContribKg.toFixed(1)),
    },
    {
      name: 'Mixing Water (Net Batched at Plant)',
      category: 'water',
      specificGravity: 1.0,
      dryMassKgPerM3: Number(waterKgPerM3.toFixed(1)),
      batchedMassKgPerM3: Number(adjustedWaterKgPerM3.toFixed(1)),
      volumeM3PerM3: Number(volWater.toFixed(4)),
      volumePercent: Number((volWater * 100).toFixed(2)),
      batchDryMassKg: Number((waterKgPerM3 * V).toFixed(1)),
      batchBatchedMassKg: Number((adjustedWaterKgPerM3 * V).toFixed(1)),
      batchVolumeM3: Number((volWater * V).toFixed(4)),
      moisturePercent: 0,
      absorptionPercent: 0,
      freeMoisturePercent: 0,
      waterCorrectionKgPerM3: Number((-totalFreeWaterKg).toFixed(1)),
    },
    {
      name: 'Chemical Admixture (HRWR / Superplasticizer)',
      category: 'admixture',
      specificGravity: admixSG,
      dryMassKgPerM3: Number(admixtureKgPerM3.toFixed(2)),
      batchedMassKgPerM3: Number(admixtureKgPerM3.toFixed(2)),
      volumeM3PerM3: Number(volAdmixture.toFixed(4)),
      volumePercent: Number((volAdmixture * 100).toFixed(2)),
      batchDryMassKg: Number((admixtureKgPerM3 * V).toFixed(2)),
      batchBatchedMassKg: Number((admixtureKgPerM3 * V).toFixed(2)),
      batchVolumeM3: Number((volAdmixture * V).toFixed(4)),
      moisturePercent: 0,
      absorptionPercent: 0,
      freeMoisturePercent: 0,
      waterCorrectionKgPerM3: 0,
    },
    {
      name: 'Entrained / Trapped Air Voids',
      category: 'air',
      specificGravity: 0.0,
      dryMassKgPerM3: 0,
      batchedMassKgPerM3: 0,
      volumeM3PerM3: Number(volAir.toFixed(4)),
      volumePercent: Number((volAir * 100).toFixed(2)),
      batchDryMassKg: 0,
      batchBatchedMassKg: 0,
      batchVolumeM3: Number((volAir * V).toFixed(4)),
      moisturePercent: 0,
      absorptionPercent: 0,
      freeMoisturePercent: 0,
      waterCorrectionKgPerM3: 0,
    },
  ];

  return createEnvelope<ConcreteMixResult>(
    {
      waterKgPerM3: Number(waterKgPerM3.toFixed(1)),
      adjustedWaterKgPerM3: Number(adjustedWaterKgPerM3.toFixed(1)),
      cementKgPerM3: Number(cementKgPerM3.toFixed(1)),
      coarseAggKgPerM3: Number(coarseAggDryKgPerM3.toFixed(1)),
      batchedCoarseAggKgPerM3: Number(batchedCoarseAggKgPerM3.toFixed(1)),
      fineAggKgPerM3: Number(fineAggDryKgPerM3.toFixed(1)),
      batchedFineAggKgPerM3: Number(batchedFineAggKgPerM3.toFixed(1)),
      admixtureKgPerM3: Number(admixtureKgPerM3.toFixed(2)),
      admixtureVolumeM3: Number(volAdmixture.toFixed(4)),
      totalDensityKgPerM3: Number(totalDensityKgPerM3.toFixed(1)),
      freshConcreteUnitWeightKgPerM3: Number(freshConcreteUnitWeightKgPerM3.toFixed(1)),
      batchCementKg: Number((cementKgPerM3 * V).toFixed(1)),
      batchWaterKg: Number((waterKgPerM3 * V).toFixed(1)),
      batchAdjustedWaterKg: Number((adjustedWaterKgPerM3 * V).toFixed(1)),
      batchFineAggKg: Number((fineAggDryKgPerM3 * V).toFixed(1)),
      batchBatchedFineAggKg: Number((batchedFineAggKgPerM3 * V).toFixed(1)),
      batchCoarseAggKg: Number((coarseAggDryKgPerM3 * V).toFixed(1)),
      batchBatchedCoarseAggKg: Number((batchedCoarseAggKgPerM3 * V).toFixed(1)),
      batchAdmixtureKg: Number((admixtureKgPerM3 * V).toFixed(2)),
      cementBags50Kg: Number(((cementKgPerM3 * V) / 50).toFixed(1)),
      estimated28DayMpa: Number(estimated28DayMpa.toFixed(1)),
      status,
      batchVolumeM3: V,
      cementBags: Number(((cementKgPerM3 * V) / 50).toFixed(1)),
      fineAggM3: Number((volFine * V).toFixed(3)),
      coarseAggM3: Number((volCoarse * V).toFixed(3)),
      items,
      totalSolidVolumeM3: Number((volCement + volFine + volCoarse + volWater + volAdmixture + volAir).toFixed(4)),
      yieldM3: Number(yieldM3.toFixed(3)),
      relativeYield,
      totalAggregateFreeWaterKgPerM3: Number(totalFreeWaterKg.toFixed(1)),
      designWaterReductionPercent: waterReductionPercent,
      fineAggSolidVolumeM3: Number(volFine.toFixed(4)),
      coarseAggSolidVolumeM3: Number(volCoarse.toFixed(4)),
      cementSolidVolumeM3: Number(volCement.toFixed(4)),
      waterSolidVolumeM3: Number(volWater.toFixed(4)),
      airVolumeM3: Number(volAir.toFixed(4)),
      admixtureSolidVolumeM3: Number(volAdmixture.toFixed(4)),
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 4: OPEN CHANNEL HYDRAULICS (With Zero Coercion)
------------------------------------------------------------- */
export interface ChannelHydraulicsResult {
  shape: 'trapezoidal' | 'rectangular' | 'circular';
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
  criticalDepthM: number;
  criticalVelocityMps: number;
  specificEnergyM: number;
  minSpecificEnergyM: number;
  diameterM?: number;
  fillingRatio?: number;
  fullDischargeM3ps?: number;
  fullVelocityMps?: number;
  hydraulicJump: {
    isOccurring: boolean;
    initialDepthM: number;
    sequentDepthM: number;
    jumpHeightM: number;
    headLossM: number;
    energyDissipatedPercent: number;
    jumpLengthM: number;
    jumpType: string;
    description: string;
  };
  eglHglProfile: Array<{
    stationM: number;
    bedElevationM: number;
    waterSurfaceHglM: number;
    energyLineEglM: number;
    criticalLineZ: number;
    velocityHeadM: number;
  }>;
  status: 'nominal' | 'warning' | 'critical';
}

export function computeChannelHydraulics(
  params: ChannelParameters
): CalculationEnvelope<ChannelHydraulicsResult> {
  const issues: ValidationIssue[] = [];
  const shape = params.shape || (params.sideSlopeZ === 0 ? 'rectangular' : 'trapezoidal');

  if (shape !== 'circular' && params.bottomWidthM <= 0) {
    issues.push({ field: 'bottomWidthM', message: 'Channel bed width b must be strictly positive (> 0 m).', severity: 'error' });
  }
  if (shape === 'trapezoidal' && params.sideSlopeZ < 0) {
    issues.push({ field: 'sideSlopeZ', message: 'Side slope z cannot be negative.', severity: 'error' });
  }
  if (shape === 'circular' && (!params.diameterM || params.diameterM <= 0)) {
    issues.push({ field: 'diameterM', message: 'Conduit diameter D must be strictly positive (> 0 m).', severity: 'error' });
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

  if (shape === 'circular' && params.diameterM && params.flowDepthM > params.diameterM) {
    issues.push({
      field: 'flowDepthM',
      message: `Flow depth (${params.flowDepthM.toFixed(2)} m) exceeds conduit diameter (${params.diameterM.toFixed(2)} m). Conduit is surcharged under closed-pipe pressure flow.`,
      severity: 'warning',
    });
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<ChannelHydraulicsResult>(null, issues);
  }

  const b = shape === 'circular' ? 0 : Math.max(0.01, params.bottomWidthM || 2.0);
  const z = shape === 'rectangular' ? 0 : Math.max(0, params.sideSlopeZ || 0);
  const D = shape === 'circular' ? Math.max(0.05, params.diameterM || 1.0) : 1.0;
  const y = params.flowDepthM;
  const S = Math.max(0.00001, params.bedSlope);
  const n = Math.max(0.005, params.manningN);

  const geom = calculateChannelGeometry(shape, y, b, z, D);
  const flowAreaM2 = geom.area;
  const wettedPerimeterM = geom.perimeter;
  const hydraulicRadiusM = geom.hydraulicRadius;
  const topWidthM = geom.topWidth;
  const hydraulicDepthM = geom.hydraulicDepth;

  // Manning's Equation: V = (1/n) * R_h^(2/3) * S_0^(1/2)
  const velocityMps = (1 / n) * Math.pow(hydraulicRadiusM, 2 / 3) * Math.sqrt(S);
  const dischargeM3ps = flowAreaM2 * velocityMps;
  const g = 9.80665;
  const velocityHeadM = Math.pow(velocityMps, 2) / (2 * g);
  const specificEnergyM = y + velocityHeadM;

  // Froude Number: Fr = V / sqrt(g * D_h)
  const froudeNumber = velocityMps / Math.sqrt(g * hydraulicDepthM);
  const flowRegime: 'Subcritical' | 'Critical' | 'Supercritical' =
    froudeNumber < 0.98
      ? 'Subcritical'
      : froudeNumber <= 1.02
        ? 'Critical'
        : 'Supercritical';

  const shearStressPa = 9810 * hydraulicRadiusM * S;

  // Critical Depth & Minimum Specific Energy
  const crit = solveCriticalDepth(shape, dischargeM3ps, b, z, D);

  // Hydraulic Jump analysis
  const jump = solveHydraulicJump(shape, y, velocityMps, dischargeM3ps, b, z, D, froudeNumber);

  if (froudeNumber > 1.0) {
    issues.push({
      field: 'froudeNumber',
      message: `Supercritical flow detected (Fr = ${froudeNumber.toFixed(2)} > 1.0). High-velocity shooting flow poses severe bed scour hazard. Hydraulic jump expected with sequent depth y2 = ${jump.sequentDepthM.toFixed(2)} m and ${jump.energyDissipatedPercent.toFixed(1)}% kinetic energy loss.`,
      severity: 'warning',
    });
  }

  // Circular full conduit metrics
  let fullDischargeM3ps: number | undefined;
  let fullVelocityMps: number | undefined;
  let fillingRatio: number | undefined;

  if (shape === 'circular') {
    fillingRatio = Math.min(1.0, y / D);
    const fullArea = (Math.PI * Math.pow(D, 2)) / 4;
    const fullRh = D / 4;
    fullVelocityMps = (1 / n) * Math.pow(fullRh, 2 / 3) * Math.sqrt(S);
    fullDischargeM3ps = fullArea * fullVelocityMps;

    if (fillingRatio > 0.85) {
      issues.push({
        field: 'flowDepthM',
        message: `Filling ratio (${(fillingRatio * 100).toFixed(1)}%) exceeds 85%. Circular conduits experience hydraulic instability near full capacity (peak discharge occurs at y/D ≈ 0.938).`,
        severity: 'warning',
      });
    }
  }

  // Longitudinal EGL/HGL Profile Stations (100m default or channelLengthM)
  const reachL = Math.max(20, params.channelLengthM || 100);
  const steps = 5;
  const eglHglProfile: Array<{
    stationM: number;
    bedElevationM: number;
    waterSurfaceHglM: number;
    energyLineEglM: number;
    criticalLineZ: number;
    velocityHeadM: number;
  }> = [];

  for (let i = 0; i <= steps; i++) {
    const station = (i / steps) * reachL;
    // Invert bed slopes down from station 0 to reachL
    const bedZ = (reachL - station) * S;
    const hglZ = bedZ + y;
    const eglZ = hglZ + velocityHeadM;
    const criticalZ = bedZ + crit.criticalDepth;

    eglHglProfile.push({
      stationM: Number(station.toFixed(1)),
      bedElevationM: Number(bedZ.toFixed(3)),
      waterSurfaceHglM: Number(hglZ.toFixed(3)),
      energyLineEglM: Number(eglZ.toFixed(3)),
      criticalLineZ: Number(criticalZ.toFixed(3)),
      velocityHeadM: Number(velocityHeadM.toFixed(3)),
    });
  }

  const status: 'nominal' | 'warning' | 'critical' =
    velocityMps > 4.5
      ? 'critical'
      : froudeNumber >= 0.9 && froudeNumber <= 1.15
        ? 'warning'
        : froudeNumber > 1.2
          ? 'warning'
          : 'nominal';

  return createEnvelope<ChannelHydraulicsResult>(
    {
      shape,
      flowAreaM2: Number(flowAreaM2.toFixed(4)),
      wettedPerimeterM: Number(wettedPerimeterM.toFixed(4)),
      hydraulicRadiusM: Number(hydraulicRadiusM.toFixed(4)),
      topWidthM: Number(topWidthM.toFixed(4)),
      hydraulicDepthM: Number(hydraulicDepthM.toFixed(4)),
      velocityMps: Number(velocityMps.toFixed(3)),
      dischargeM3ps: Number(dischargeM3ps.toFixed(4)),
      froudeNumber: Number(froudeNumber.toFixed(3)),
      flowRegime,
      shearStressPa: Number(shearStressPa.toFixed(2)),
      criticalDepthM: Number(crit.criticalDepth.toFixed(3)),
      criticalVelocityMps: Number(crit.criticalVelocity.toFixed(3)),
      specificEnergyM: Number(specificEnergyM.toFixed(3)),
      minSpecificEnergyM: Number(crit.minSpecificEnergy.toFixed(3)),
      diameterM: shape === 'circular' ? D : undefined,
      fillingRatio: shape === 'circular' ? Number(fillingRatio!.toFixed(3)) : undefined,
      fullDischargeM3ps: fullDischargeM3ps ? Number(fullDischargeM3ps.toFixed(4)) : undefined,
      fullVelocityMps: fullVelocityMps ? Number(fullVelocityMps.toFixed(3)) : undefined,
      hydraulicJump: {
        isOccurring: jump.isOccurring,
        initialDepthM: Number(y.toFixed(3)),
        sequentDepthM: Number(jump.sequentDepthM.toFixed(3)),
        jumpHeightM: Number(jump.jumpHeightM.toFixed(3)),
        headLossM: Number(jump.headLossM.toFixed(3)),
        energyDissipatedPercent: Number(jump.energyDissipatedPercent.toFixed(1)),
        jumpLengthM: Number(jump.jumpLengthM.toFixed(2)),
        jumpType: jump.jumpType,
        description: jump.description,
      },
      eglHglProfile,
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
  totalSteelWeightTon: number;
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
      totalSteelWeightTon: Number(totalSteelTonnes.toFixed(3)),
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
  indexedUnitPrice?: number;
  totalCost: number;
  percentageOfMaterial: number;
}

export interface RateAnalysisLaborBreakdown {
  trade: string;
  daysRequired: number;
  dailyWage: number;
  indexedDailyWage: number;
  totalCost: number;
}

export interface RateAnalysisEquipmentBreakdown {
  equipment: string;
  ratePerUnit: number;
  indexedRatePerUnit: number;
  totalCost: number;
}

export interface RateAnalysisResult {
  workType: RateAnalysisWorkType;
  workDescription: string;
  basisVolumeM3: number;
  currency: CurrencyCode;
  currencySymbol: string;
  localCostIndex: number;
  materialCostIndex: number;
  laborCostIndex: number;
  equipmentCostIndex: number;
  materials: RateAnalysisMaterialBreakdown[];
  materialsCost: number;
  baseMaterialsCost: number;
  labors: RateAnalysisLaborBreakdown[];
  laborsCost: number;
  baseLaborsCost: number;
  equipment: RateAnalysisEquipmentBreakdown[];
  equipmentCost: number;
  baseEquipmentCost: number;
  primeCost: number;
  basePrimeCost: number;
  waterElectricityPercent: number;
  waterElectricityCost: number;
  subtotalBeforeProfit: number;
  contractorProfitPercent: number;
  contractorProfitCost: number;
  grandTotalCost: number;
  baseGrandTotalCost: number;
  unitRatePerM3: number;
  unitRatePerCft: number;
  baseUnitRatePerM3: number;
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

  const localIndex = Math.max(0.1, params.localCostIndex ?? 1.0);
  const matIndex = Math.max(0.1, (params.materialCostIndex ?? 1.0) * localIndex);
  const labIndex = Math.max(0.1, (params.laborCostIndex ?? 1.0) * localIndex);
  const eqIndex = Math.max(0.1, (params.equipmentCostIndex ?? 1.0) * localIndex);

  // Apply material cost index to unit rates
  materials.forEach((m) => {
    m.indexedUnitPrice = Number((m.unitPrice * matIndex).toFixed(2));
    m.totalCost = Number((m.quantity * m.indexedUnitPrice).toFixed(2));
  });

  const materialsCost = materials.reduce((acc, m) => acc + m.totalCost, 0);
  const baseMaterialsCost = materials.reduce((acc, m) => acc + (m.quantity * m.unitPrice), 0);
  materials.forEach((m) => {
    m.percentageOfMaterial =
      materialsCost > 0 ? Number(((m.totalCost / materialsCost) * 100).toFixed(1)) : 0;
  });

  // Labors breakdown with labor wage escalation index
  const baseMasonWage = params.masonDailyWage || 0;
  const indexedMasonWage = Number((baseMasonWage * labIndex).toFixed(2));
  const masonDays = Number(((params.masonDaysRequired || 0) * vol).toFixed(3));
  const masonCost = masonDays * indexedMasonWage;

  const baseLaborerWage = params.laborerDailyWage || 0;
  const indexedLaborerWage = Number((baseLaborerWage * labIndex).toFixed(2));
  const laborerDays = Number(((params.laborerDaysRequired || 0) * vol).toFixed(3));
  const laborerCost = laborerDays * indexedLaborerWage;

  const baseBarBenderWage = params.barBenderDailyWage || 0;
  const indexedBarBenderWage = Number((baseBarBenderWage * labIndex).toFixed(2));
  const barBenderDays = Number(((params.barBenderDaysRequired || 0) * vol).toFixed(3));
  const barBenderCost = barBenderDays * indexedBarBenderWage;

  const labors: RateAnalysisLaborBreakdown[] = [
    {
      trade: 'Skilled Head Mason (Rajmistri)',
      daysRequired: masonDays,
      dailyWage: baseMasonWage,
      indexedDailyWage: indexedMasonWage,
      totalCost: Number(masonCost.toFixed(2)),
    },
    {
      trade: 'General Helper / Laborer (Jogali)',
      daysRequired: laborerDays,
      dailyWage: baseLaborerWage,
      indexedDailyWage: indexedLaborerWage,
      totalCost: Number(laborerCost.toFixed(2)),
    },
  ];

  if (params.workType.startsWith('rcc') || params.workType === 'rebar-fabrication') {
    labors.push({
      trade: 'Steel Fitter / Bar Bender',
      daysRequired: barBenderDays,
      dailyWage: baseBarBenderWage,
      indexedDailyWage: indexedBarBenderWage,
      totalCost: Number(barBenderCost.toFixed(2)),
    });
  }

  const laborsCost = labors.reduce((acc, l) => acc + l.totalCost, 0);
  const baseLaborsCost = labors.reduce((acc, l) => acc + (l.daysRequired * l.dailyWage), 0);

  // Equipment & Shuttering hire with equipment hire index
  const baseMixerRate = params.mixerHirePerM3 || 0;
  const indexedMixerRate = Number((baseMixerRate * eqIndex).toFixed(2));
  const mixerCost = indexedMixerRate * vol;

  const baseVibratorRate = params.vibratorHirePerM3 || 0;
  const indexedVibratorRate = Number((baseVibratorRate * eqIndex).toFixed(2));
  const vibratorCost = indexedVibratorRate * vol;

  const baseShutteringRate = params.shutteringScaffoldingPerM3 || 0;
  const indexedShutteringRate = Number((baseShutteringRate * eqIndex).toFixed(2));
  const shutteringCost = indexedShutteringRate * vol;

  const equipment: RateAnalysisEquipmentBreakdown[] = [
    {
      equipment: 'Concrete Batch Mixer Machine Hire',
      ratePerUnit: baseMixerRate,
      indexedRatePerUnit: indexedMixerRate,
      totalCost: Number(mixerCost.toFixed(2)),
    },
    {
      equipment: 'High-Frequency Needle Vibrator (Petrol/Electric)',
      ratePerUnit: baseVibratorRate,
      indexedRatePerUnit: indexedVibratorRate,
      totalCost: Number(vibratorCost.toFixed(2)),
    },
    {
      equipment: 'Steel / Timber Shuttering & Scaffolding Centering',
      ratePerUnit: baseShutteringRate,
      indexedRatePerUnit: indexedShutteringRate,
      totalCost: Number(shutteringCost.toFixed(2)),
    },
  ];

  const equipmentCost = equipment.reduce((acc, eq) => acc + eq.totalCost, 0);
  const baseEquipmentCost = equipment.reduce((acc, eq) => acc + (eq.ratePerUnit * vol), 0);

  const primeCost = materialsCost + laborsCost + equipmentCost;
  const basePrimeCost = baseMaterialsCost + baseLaborsCost + baseEquipmentCost;

  const waterElectPct = Math.max(0, params.waterElectricityPercent || 1.5);
  const waterElectCost = primeCost * (waterElectPct / 100);
  const subtotalBeforeProfit = primeCost + waterElectCost;

  const profitPct = Math.max(0, params.contractorProfitPercent || 10.0);
  const contractorProfitCost = subtotalBeforeProfit * (profitPct / 100);
  const grandTotalCost = subtotalBeforeProfit + contractorProfitCost;

  const unitRatePerM3 = grandTotalCost / vol;
  const unitRatePerCft = unitRatePerM3 / EXACT_CONVERSION.M3_TO_CFT;

  // Base grand total before index
  const baseWaterElectCost = basePrimeCost * (waterElectPct / 100);
  const baseSubtotalBeforeProfit = basePrimeCost + baseWaterElectCost;
  const baseContractorProfitCost = baseSubtotalBeforeProfit * (profitPct / 100);
  const baseGrandTotalCost = baseSubtotalBeforeProfit + baseContractorProfitCost;
  const baseUnitRatePerM3 = baseGrandTotalCost / vol;

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
      localCostIndex: localIndex,
      materialCostIndex: params.materialCostIndex ?? 1.0,
      laborCostIndex: params.laborCostIndex ?? 1.0,
      equipmentCostIndex: params.equipmentCostIndex ?? 1.0,
      materials,
      materialsCost: Number(materialsCost.toFixed(2)),
      baseMaterialsCost: Number(baseMaterialsCost.toFixed(2)),
      labors,
      laborsCost: Number(laborsCost.toFixed(2)),
      baseLaborsCost: Number(baseLaborsCost.toFixed(2)),
      equipment,
      equipmentCost: Number(equipmentCost.toFixed(2)),
      baseEquipmentCost: Number(baseEquipmentCost.toFixed(2)),
      primeCost: Number(primeCost.toFixed(2)),
      basePrimeCost: Number(basePrimeCost.toFixed(2)),
      waterElectricityPercent: waterElectPct,
      waterElectricityCost: Number(waterElectCost.toFixed(2)),
      subtotalBeforeProfit: Number(subtotalBeforeProfit.toFixed(2)),
      contractorProfitPercent: profitPct,
      contractorProfitCost: Number(contractorProfitCost.toFixed(2)),
      grandTotalCost: Number(grandTotalCost.toFixed(2)),
      baseGrandTotalCost: Number(baseGrandTotalCost.toFixed(2)),
      unitRatePerM3: Number(unitRatePerM3.toFixed(2)),
      unitRatePerCft: Number(unitRatePerCft.toFixed(2)),
      baseUnitRatePerM3: Number(baseUnitRatePerM3.toFixed(2)),
      costDistributionPercent,
      status: 'nominal',
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 12: CONTINUOUS BEAM MULTI-SPAN ANALYSIS
   (THREE-MOMENT THEOREM & MOMENT DISTRIBUTION METHOD)
------------------------------------------------------------- */
export interface ContinuousBeamPoint {
  xTotal: number;
  xSpan: number;
  spanIndex: number;
  momentKnm: number;
  shearKn: number;
  isInflection?: boolean;
  isPeakMoment?: boolean;
  isZeroShear?: boolean;
}

export interface CriticalCoordinatePoint {
  id: string;
  spanIndex: number;
  xSpanM: number;
  xTotalM: number;
  type: 'max-sagging-moment' | 'max-hogging-moment' | 'zero-shear' | 'inflection-point' | 'max-shear' | 'support';
  label: string;
  shearKn: number;
  momentKnm: number;
  significance: string;
}

export interface ContinuousSpanResult {
  spanIndex: number;
  lengthM: number;
  leftReactionKn: number;
  rightReactionKn: number;
  maxPositiveMomentKnm: number;
  maxPositiveMomentLocationM: number;
  maxPositiveMomentTotalLocationM: number;
  maxNegativeMomentLeftKnm: number;
  maxNegativeMomentRightKnm: number;
  maxShearKn: number;
  criticalShearAtDKn: number;
  inflectionPointsM: number[];
  inflectionPointsTotalM: number[];
  zeroShearLocationsM: number[];
  criticalPoints: CriticalCoordinatePoint[];
}

export interface MethodComparisonEntry {
  supportIndex: number;
  clapeyronMomentKnm: number;
  hardyCrossMomentKnm: number;
  deltaKnm: number;
}

export interface ContinuousBeamResult {
  spanCount: number;
  totalLengthM: number;
  supportMomentsKnm: number[]; // M_0, M_1, ..., M_n (Clapeyron Theorem)
  momentDistributionMomentsKnm: number[]; // M_0, M_1, ..., M_n (Hardy Cross Method)
  supportReactionsKn: number[]; // R_0, R_1, ..., R_n
  spans: ContinuousSpanResult[];
  points: ContinuousBeamPoint[];
  maxSaggingMomentKnm: number;
  maxSaggingLocationM: number;
  maxHoggingMomentKnm: number;
  maxHoggingSupportIndex: number;
  maxShearKn: number;
  maxShearLocationM: number;
  allInflectionPointsTotalM: number[];
  criticalCoordinates: CriticalCoordinatePoint[];
  bendingStressMpa: number;
  allowableStressMpa: number;
  flexuralDcr: number;
  criticalShearKn: number;
  concreteShearCapacityVcKn: number;
  shearStressMpa: number;
  allowableShearStressMpa: number;
  shearDcr: number;
  utilizationRatio: number;
  safetyStatus: 'PASS' | 'WARNING' | 'FAIL';
  governingFailureMode: 'Flexural Tension / Compression' | 'Support Shear Overstress' | 'Adequate';
  codeChecks: {
    flexurePass: boolean;
    shearPass: boolean;
    maxDeflectionEstimateMm: number;
    deflectionRatio: string;
    deflectionPass: boolean;
    governingCode: string;
  };
  momentDistributionSummary: {
    converged: boolean;
    iterations: number;
    maxDiscrepancyPercent: number;
    methodComparison: MethodComparisonEntry[];
  };
  status: 'nominal' | 'warning' | 'critical';
}

/**
 * Precision numerical rounding helper to eliminate floating point artifacts.
 */
function roundPrecision(val: number, decimals: number = 3): number {
  if (!Number.isFinite(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function computeContinuousBeam(
  params: ContinuousBeamParameters
): CalculationEnvelope<ContinuousBeamResult> {
  const issues: ValidationIssue[] = [];
  const spanCount = Math.max(2, Math.min(4, params.spanCount || 2));
  const rawSpans = (params.spans || []).slice(0, spanCount);

  if (rawSpans.length < spanCount) {
    issues.push({
      field: 'spans',
      message: `Expected ${spanCount} span definitions, but found ${rawSpans.length}.`,
      severity: 'error',
    });
    return createEnvelope<ContinuousBeamResult>(null, issues);
  }

  // Sanitize and normalize span geometry & loads
  const spans = rawSpans.map((sp, idx) => {
    const lengthM = Math.max(0.2, sp.lengthM || 6.0);
    const I = Math.max(10, sp.momentOfInertiaCm4 || 120000);
    const E = Math.max(1, sp.elasticModulusGpa || 200);
    const w = Math.max(0, sp.udlKnPerM || 0);
    const P = Math.max(0, sp.pointLoadKn || 0);
    const a = Math.min(lengthM, Math.max(0, sp.pointLoadPositionM ?? lengthM / 2));
    const wTri = Math.max(0, sp.triangularLoadKnPerM || 0);
    const triPattern = sp.triangularLoadPattern || 'increasing';

    if (sp.lengthM <= 0) {
      issues.push({
        field: `span_${idx}_length`,
        message: `Span ${idx + 1} length must be strictly positive (> 0 m).`,
        severity: 'error',
      });
    }

    return {
      ...sp,
      lengthM,
      momentOfInertiaCm4: I,
      elasticModulusGpa: E,
      udlKnPerM: w,
      pointLoadKn: P,
      pointLoadPositionM: a,
      triangularLoadKnPerM: wTri,
      triangularLoadPattern: triPattern,
    };
  });

  const numSupports = spanCount + 1;

  /* ==============================================================
     SOLVER ENGINE 1: CLAPEYRON'S THREE-MOMENT THEOREM (TRIDIAGONAL)
     ============================================================== */
  const matrixA: number[][] = Array.from({ length: numSupports }, () =>
    new Array(numSupports).fill(0)
  );
  const vectorB: number[] = new Array(numSupports).fill(0);

  // Helper: compute Three-Moment load terms (6*A*x_bar / L) for span i
  // When measured about left support (termLeft) vs about right support (termRight)
  function getThreeMomentSpanTerms(span: typeof spans[0]) {
    const L = span.lengthM;
    const I = span.momentOfInertiaCm4;
    const w = span.udlKnPerM;
    const P = span.pointLoadKn;
    const a = span.pointLoadPositionM;
    const b = L - a;
    const wTri = span.triangularLoadKnPerM;
    const pattern = span.triangularLoadPattern;

    // 1. UDL term: 6 * (w L^3 / 12) * (L / 2) / L = w L^3 / 4
    const termUDL = (w * Math.pow(L, 3)) / (4 * I);

    // 2. Point load term:
    // Centroid from left is (L + a)/3 -> termLeft = P a b (L + a) / (L * I)
    // Centroid from right is (L + b)/3 -> termRight = P a b (L + b) / (L * I)
    const termPtLeft = P > 0 ? (P * a * b * (L + a)) / (L * I) : 0;
    const termPtRight = P > 0 ? (P * a * b * (L + b)) / (L * I) : 0;

    // 3. Triangular load term:
    let termTriLeft = 0;
    let termTriRight = 0;
    if (wTri > 0) {
      if (pattern === 'increasing') {
        // 0 at left to wTri at right
        termTriLeft = ((2 / 15) * wTri * Math.pow(L, 3)) / I;
        termTriRight = ((7 / 60) * wTri * Math.pow(L, 3)) / I;
      } else if (pattern === 'decreasing') {
        // wTri at left to 0 at right
        termTriLeft = ((7 / 60) * wTri * Math.pow(L, 3)) / I;
        termTriRight = ((2 / 15) * wTri * Math.pow(L, 3)) / I;
      } else {
        // symmetric center peak
        const sym = ((5 / 32) * wTri * Math.pow(L, 3)) / I;
        termTriLeft = sym;
        termTriRight = sym;
      }
    }

    return {
      termAboutLeft: termUDL + termPtLeft + termTriLeft,
      termAboutRight: termUDL + termPtRight + termTriRight,
    };
  }

  // Left boundary condition (Support 0)
  if (params.leftSupport === 'fixed') {
    const L1 = spans[0].lengthM;
    const I1 = spans[0].momentOfInertiaCm4;
    matrixA[0][0] = (2 * L1) / I1;
    matrixA[0][1] = L1 / I1;
    const terms = getThreeMomentSpanTerms(spans[0]);
    vectorB[0] = -terms.termAboutRight;
  } else {
    // Pinned: M_0 = 0
    matrixA[0][0] = 1;
    vectorB[0] = 0;
  }

  // Intermediate supports 1 to spanCount - 1 (Clapeyron's Three-Moment Theorem)
  for (let i = 1; i < spanCount; i++) {
    const leftSpan = spans[i - 1];
    const rightSpan = spans[i];

    const L_left = leftSpan.lengthM;
    const I_left = leftSpan.momentOfInertiaCm4;
    const L_right = rightSpan.lengthM;
    const I_right = rightSpan.momentOfInertiaCm4;

    matrixA[i][i - 1] = L_left / I_left;
    matrixA[i][i] = 2 * (L_left / I_left + L_right / I_right);
    matrixA[i][i + 1] = L_right / I_right;

    const termsLeft = getThreeMomentSpanTerms(leftSpan);
    const termsRight = getThreeMomentSpanTerms(rightSpan);

    vectorB[i] = -(termsLeft.termAboutLeft + termsRight.termAboutRight);
  }

  // Right boundary condition (Support spanCount)
  const lastIdx = spanCount;
  if (params.rightSupport === 'fixed') {
    const Ln = spans[spanCount - 1].lengthM;
    const In = spans[spanCount - 1].momentOfInertiaCm4;
    matrixA[lastIdx][lastIdx - 1] = Ln / In;
    matrixA[lastIdx][lastIdx] = (2 * Ln) / In;
    const terms = getThreeMomentSpanTerms(spans[spanCount - 1]);
    vectorB[lastIdx] = -terms.termAboutLeft;
  } else {
    // Pinned: M_n = 0
    matrixA[lastIdx][lastIdx] = 1;
    vectorB[lastIdx] = 0;
  }

  // Gaussian elimination with partial pivoting for numerical stability
  const n = numSupports;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(matrixA[k][i]) > Math.abs(matrixA[maxRow][i])) {
        maxRow = k;
      }
    }
    const tempRow = matrixA[i];
    matrixA[i] = matrixA[maxRow];
    matrixA[maxRow] = tempRow;
    const tempB = vectorB[i];
    vectorB[i] = vectorB[maxRow];
    vectorB[maxRow] = tempB;

    const pivot = matrixA[i][i];
    if (Math.abs(pivot) < 1e-12) continue;

    for (let k = i + 1; k < n; k++) {
      const factor = matrixA[k][i] / pivot;
      for (let j = i; j < n; j++) {
        matrixA[k][j] -= factor * matrixA[i][j];
      }
      vectorB[k] -= factor * vectorB[i];
    }
  }

  const clapeyronSupportMoments = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = vectorB[i];
    for (let j = i + 1; j < n; j++) {
      sum -= matrixA[i][j] * clapeyronSupportMoments[j];
    }
    clapeyronSupportMoments[i] = Math.abs(matrixA[i][i]) > 1e-12 ? sum / matrixA[i][i] : 0;
  }

  /* ==============================================================
     SOLVER ENGINE 2: MOMENT DISTRIBUTION METHOD (HARDY CROSS)
     ============================================================== */
  // Members: Each span i has left joint i and right joint i+1
  // Member index left: 2*i, member index right: 2*i + 1
  const numMembers = 2 * spanCount;
  const fem = new Array(numMembers).fill(0);

  // Compute Fixed-End Moments for each span
  for (let i = 0; i < spanCount; i++) {
    const sp = spans[i];
    const L = sp.lengthM;
    const w = sp.udlKnPerM;
    const P = sp.pointLoadKn;
    const a = sp.pointLoadPositionM;
    const b = L - a;
    const wTri = sp.triangularLoadKnPerM;
    const pat = sp.triangularLoadPattern;

    // UDL
    let femL = -(w * L * L) / 12;
    let femR = +(w * L * L) / 12;

    // Point Load
    if (P > 0) {
      femL -= (P * a * b * b) / (L * L);
      femR += (P * a * a * b) / (L * L);
    }

    // Triangular Load
    if (wTri > 0) {
      if (pat === 'increasing') {
        femL -= (wTri * L * L) / 30;
        femR += (wTri * L * L) / 20;
      } else if (pat === 'decreasing') {
        femL -= (wTri * L * L) / 20;
        femR += (wTri * L * L) / 30;
      } else {
        femL -= (5 * wTri * L * L) / 96;
        femR += (5 * wTri * L * L) / 96;
      }
    }

    fem[2 * i] = femL;
    fem[2 * i + 1] = femR;
  }

  // Joint stiffness K = 4EI/L (or 3EI/L for pinned exterior end)
  const memberStiffness = new Array(numMembers).fill(0);
  for (let i = 0; i < spanCount; i++) {
    const sp = spans[i];
    const EI = sp.elasticModulusGpa * 1e6 * (sp.momentOfInertiaCm4 * 1e-8);
    const k = (4 * EI) / sp.lengthM;
    memberStiffness[2 * i] = k;
    memberStiffness[2 * i + 1] = k;
  }

  // Distribution Factors at each joint
  const df = new Array(numMembers).fill(0);
  // Joint 0:
  df[0] = params.leftSupport === 'fixed' ? 0.0 : 1.0;
  // Joint n:
  df[numMembers - 1] = params.rightSupport === 'fixed' ? 0.0 : 1.0;
  // Interior joints 1 to spanCount - 1:
  for (let i = 1; i < spanCount; i++) {
    const kLeft = memberStiffness[2 * i - 1];
    const kRight = memberStiffness[2 * i];
    const kTotal = kLeft + kRight;
    df[2 * i - 1] = kTotal > 0 ? kLeft / kTotal : 0.5;
    df[2 * i] = kTotal > 0 ? kRight / kTotal : 0.5;
  }

  // Hardy Cross iterative moment distribution
  const hardyMoments = [...fem];
  let hardyConverged = false;
  let hardyIterations = 0;
  const maxHardyIter = 60;
  const hardyTolerance = 1e-5;

  for (let iter = 0; iter < maxHardyIter; iter++) {
    hardyIterations = iter + 1;
    let maxUnbalance = 0;
    const deltas = new Array(numMembers).fill(0);

    // 1. Joint 0 release
    if (params.leftSupport !== 'fixed') {
      const unbal = hardyMoments[0];
      if (Math.abs(unbal) > maxUnbalance) maxUnbalance = Math.abs(unbal);
      deltas[0] = -df[0] * unbal;
    }

    // 2. Interior joints
    for (let j = 1; j < spanCount; j++) {
      const leftIdx = 2 * j - 1;
      const rightIdx = 2 * j;
      const unbalance = hardyMoments[leftIdx] + hardyMoments[rightIdx];
      if (Math.abs(unbalance) > maxUnbalance) maxUnbalance = Math.abs(unbalance);
      deltas[leftIdx] = -df[leftIdx] * unbalance;
      deltas[rightIdx] = -df[rightIdx] * unbalance;
    }

    // 3. Joint n release
    if (params.rightSupport !== 'fixed') {
      const unbal = hardyMoments[numMembers - 1];
      if (Math.abs(unbal) > maxUnbalance) maxUnbalance = Math.abs(unbal);
      deltas[numMembers - 1] = -df[numMembers - 1] * unbal;
    }

    // Apply distributed moments
    for (let m = 0; m < numMembers; m++) {
      hardyMoments[m] += deltas[m];
    }

    if (maxUnbalance < hardyTolerance) {
      hardyConverged = true;
      break;
    }

    // Carry-over (factor 0.5 to opposite member end)
    for (let i = 0; i < spanCount; i++) {
      const leftIdx = 2 * i;
      const rightIdx = 2 * i + 1;
      hardyMoments[leftIdx] += 0.5 * deltas[rightIdx];
      hardyMoments[rightIdx] += 0.5 * deltas[leftIdx];
    }
  }

  // Extract support moments from Hardy Cross for cross-verification
  const hardySupportMoments: number[] = [hardyMoments[0]];
  for (let j = 1; j < spanCount; j++) {
    // Continuous moment at joint j: by sign convention hogging is negative
    const mBal = (hardyMoments[2 * j - 1] - hardyMoments[2 * j]) / 2;
    hardySupportMoments.push(mBal);
  }
  hardySupportMoments.push(hardyMoments[numMembers - 1]);

  // Use Clapeyron moments as governing analytical solution
  const supportMoments = clapeyronSupportMoments;

  // Comparison metrics between Clapeyron and Hardy Cross
  const methodComparison: MethodComparisonEntry[] = supportMoments.map((cM, idx) => {
    const hM = hardySupportMoments[idx] || 0;
    return {
      supportIndex: idx,
      clapeyronMomentKnm: roundPrecision(cM, 2),
      hardyCrossMomentKnm: roundPrecision(hM, 2),
      deltaKnm: roundPrecision(Math.abs(cM - hM), 3),
    };
  });

  const maxDiscrepancy = Math.max(
    ...methodComparison.map((e) => Math.abs(e.deltaKnm))
  );

  /* ==============================================================
     SPAN STATIC EQUILIBRIUM, REACTIONS & EXACT CONTINUOUS ENVELOPES
     ============================================================== */
  const spanResults: ContinuousSpanResult[] = [];
  const points: ContinuousBeamPoint[] = [];
  const allCriticalCoordinates: CriticalCoordinatePoint[] = [];
  const allInflectionPointsTotalM: number[] = [];
  const supportReactions = new Array(numSupports).fill(0);

  let currentXOffset = 0;
  let globalMaxSagging = 0;
  let globalMaxSaggingLocation = 0;
  let globalMaxHogging = 0;
  let globalMaxHoggingSupportIndex = 0;
  let globalMaxShear = 0;
  let globalMaxShearLocation = 0;

  for (let i = 0; i < spanCount; i++) {
    const span = spans[i];
    const L = span.lengthM;
    const w = span.udlKnPerM;
    const P = span.pointLoadKn;
    const a = span.pointLoadPositionM;
    const b = L - a;
    const wTri = span.triangularLoadKnPerM;
    const triPattern = span.triangularLoadPattern;

    const M_left = supportMoments[i];
    const M_right = supportMoments[i + 1];

    // Compute moments of applied loads about the right end:
    // UDL: w * L^2 / 2
    let M_loads_about_right = (w * L * L) / 2;
    let totalSpanLoad = w * L;

    // Point load: P * b
    if (P > 0) {
      M_loads_about_right += P * b;
      totalSpanLoad += P;
    }

    // Triangular load:
    if (wTri > 0) {
      const W_tri = 0.5 * wTri * L;
      totalSpanLoad += W_tri;
      if (triPattern === 'increasing') {
        // Centroid from right is L / 3
        M_loads_about_right += W_tri * (L / 3);
      } else if (triPattern === 'decreasing') {
        // Centroid from right is 2L / 3
        M_loads_about_right += W_tri * ((2 * L) / 3);
      } else {
        // Symmetric: Centroid at L / 2
        M_loads_about_right += W_tri * (L / 2);
      }
    }

    // Statics: V_left * L + M_left - M_right - M_loads_about_right = 0
    // Note: Standard convention where M_left and M_right are negative for hogging
    const V_left = (M_loads_about_right + M_right - M_left) / L;
    const V_right = totalSpanLoad - V_left;

    supportReactions[i] += V_left;
    supportReactions[i + 1] += V_right;

    // Analytical functions for V(x) and M(x) within span i
    function getShearAtX(x: number): number {
      let Vx = V_left - w * x;
      if (x >= a && P > 0) Vx -= P;
      if (wTri > 0) {
        if (triPattern === 'increasing') {
          Vx -= (wTri * x * x) / (2 * L);
        } else if (triPattern === 'decreasing') {
          Vx -= wTri * x - (wTri * x * x) / (2 * L);
        } else {
          // Symmetric
          if (x <= L / 2) {
            Vx -= (wTri * x * x) / L;
          } else {
            const W_half = (wTri * L) / 4;
            const xRem = x - L / 2;
            Vx -= W_half + wTri * xRem - (wTri * xRem * xRem) / L;
          }
        }
      }
      return Vx;
    }

    function getMomentAtX(x: number): number {
      let Mx = M_left + V_left * x - (w * x * x) / 2;
      if (x >= a && P > 0) Mx -= P * (x - a);
      if (wTri > 0) {
        if (triPattern === 'increasing') {
          Mx -= (wTri * Math.pow(x, 3)) / (6 * L);
        } else if (triPattern === 'decreasing') {
          Mx -= (wTri * x * x) / 2 - (wTri * Math.pow(x, 3)) / (6 * L);
        } else {
          // Symmetric
          if (x <= L / 2) {
            Mx -= (wTri * Math.pow(x, 3)) / (3 * L);
          } else {
            const W_half = (wTri * L) / 4;
            const xRem = x - L / 2;
            const M_half = (wTri * Math.pow(L, 2)) / 24;
            Mx -=
              M_half +
              W_half * xRem +
              (wTri * xRem * xRem) / 2 -
              (wTri * Math.pow(xRem, 3)) / (3 * L);
          }
        }
      }
      return Mx;
    }

    // 1. Analytical Zero Shear Search (Exact Maximum Positive Sagging Moment)
    const zeroShearLocations: number[] = [];

    // Solve for x where V(x) = 0 analytically when possible
    if (w > 0 && wTri === 0) {
      const x0_1 = V_left / w;
      if (x0_1 >= 0 && x0_1 < a) zeroShearLocations.push(x0_1);

      if (P > 0) {
        const x0_2 = (V_left - P) / w;
        if (x0_2 >= a && x0_2 <= L) zeroShearLocations.push(x0_2);
      }
    } else {
      // Numerical root search for zero crossings of shear
      const testSegments = 100;
      let prevVx = getShearAtX(0);
      for (let seg = 1; seg <= testSegments; seg++) {
        const xSeg = (seg / testSegments) * L;
        const vx = getShearAtX(xSeg);
        if ((prevVx > 0 && vx <= 0) || (prevVx < 0 && vx >= 0)) {
          // Bisection root refine
          let xLow = ((seg - 1) / testSegments) * L;
          let xHigh = xSeg;
          for (let bIter = 0; bIter < 20; bIter++) {
            const xMid = (xLow + xHigh) / 2;
            if (getShearAtX(xMid) * getShearAtX(xLow) <= 0) {
              xHigh = xMid;
            } else {
              xLow = xMid;
            }
          }
          zeroShearLocations.push((xLow + xHigh) / 2);
        }
        prevVx = vx;
      }
    }

    // Also include point load location if shear steps across zero
    if (P > 0 && a > 0 && a < L) {
      const vBefore = getShearAtX(a - 1e-5);
      const vAfter = getShearAtX(a + 1e-5);
      if (vBefore >= 0 && vAfter <= 0 && !zeroShearLocations.some((z) => Math.abs(z - a) < 0.05)) {
        zeroShearLocations.push(a);
      }
    }

    // Determine span maximum positive sagging moment
    let spanMaxPositiveM = 0;
    let spanMaxPosLoc = L / 2;
    for (const zLoc of zeroShearLocations) {
      const mz = getMomentAtX(zLoc);
      if (mz > spanMaxPositiveM) {
        spanMaxPositiveM = mz;
        spanMaxPosLoc = zLoc;
      }
    }

    // 2. High-Precision Inflection Points (M(x) = 0) via Bisection Root Finding
    const inflectionPointsSpanM: number[] = [];
    const scanSteps = 100;
    let prevScanM = getMomentAtX(0);

    for (let st = 1; st <= scanSteps; st++) {
      const xSt = (st / scanSteps) * L;
      const mSt = getMomentAtX(xSt);
      if ((prevScanM < 0 && mSt >= 0) || (prevScanM > 0 && mSt <= 0)) {
        let low = ((st - 1) / scanSteps) * L;
        let high = xSt;
        for (let bIter = 0; bIter < 25; bIter++) {
          const mid = (low + high) / 2;
          if (getMomentAtX(mid) * getMomentAtX(low) <= 0) {
            high = mid;
          } else {
            low = mid;
          }
        }
        const root = (low + high) / 2;
        if (!inflectionPointsSpanM.some((ip) => Math.abs(ip - root) < 0.05)) {
          inflectionPointsSpanM.push(roundPrecision(root, 3));
          allInflectionPointsTotalM.push(roundPrecision(currentXOffset + root, 3));
        }
      }
      prevScanM = mSt;
    }

    // 3. Dense Discretization Points (200 stations per span)
    const numStations = 200;
    let spanMaxV = Math.max(Math.abs(V_left), Math.abs(V_right));

    for (let s = 0; s <= numStations; s++) {
      const x = (s / numStations) * L;
      const xTotal = currentXOffset + x;
      const Vx = getShearAtX(x);
      const Mx = getMomentAtX(x);

      if (Math.abs(Vx) > spanMaxV) {
        spanMaxV = Math.abs(Vx);
      }
      if (Mx > spanMaxPositiveM) {
        spanMaxPositiveM = Mx;
        spanMaxPosLoc = x;
      }

      const isInflection = inflectionPointsSpanM.some((ip) => Math.abs(ip - x) < 0.02);
      const isPeakMoment = Math.abs(x - spanMaxPosLoc) < 0.02;

      points.push({
        xTotal: roundPrecision(xTotal, 3),
        xSpan: roundPrecision(x, 3),
        spanIndex: i,
        momentKnm: roundPrecision(Mx, 2),
        shearKn: roundPrecision(Vx, 2),
        isInflection,
        isPeakMoment,
        isZeroShear: zeroShearLocations.some((z) => Math.abs(z - x) < 0.02),
      });
    }

    // Critical shear at distance d from support face (ACI 318 / BNBC 2020)
    const effDepthM = Math.max(0.2, ((params.sectionDepthMm || 600) - 50) / 1000);
    const dLeftM = Math.min(L / 2, effDepthM);
    const dRightM = Math.max(L / 2, L - effDepthM);
    const shearAtDLeft = Math.abs(getShearAtX(dLeftM));
    const shearAtDRight = Math.abs(getShearAtX(dRightM));
    const criticalShearAtD = Math.max(shearAtDLeft, shearAtDRight);

    // Track global extrema
    if (spanMaxPositiveM > globalMaxSagging) {
      globalMaxSagging = spanMaxPositiveM;
      globalMaxSaggingLocation = currentXOffset + spanMaxPosLoc;
    }
    if (spanMaxV > globalMaxShear) {
      globalMaxShear = spanMaxV;
      globalMaxShearLocation = currentXOffset + (Math.abs(V_left) >= Math.abs(V_right) ? 0 : L);
    }

    // Assemble critical points ledger for this span
    const spanCriticals: CriticalCoordinatePoint[] = [];

    // Max Sagging
    spanCriticals.push({
      id: `span-${i}-m-pos`,
      spanIndex: i,
      xSpanM: roundPrecision(spanMaxPosLoc, 3),
      xTotalM: roundPrecision(currentXOffset + spanMaxPosLoc, 3),
      type: 'max-sagging-moment',
      label: `Span ${i + 1} Sagging (+M)`,
      shearKn: roundPrecision(getShearAtX(spanMaxPosLoc), 2),
      momentKnm: roundPrecision(spanMaxPositiveM, 2),
      significance: 'Governing mid-span positive flexure (bottom rebar design)',
    });

    // Inflections
    inflectionPointsSpanM.forEach((ip, idx) => {
      spanCriticals.push({
        id: `span-${i}-inf-${idx}`,
        spanIndex: i,
        xSpanM: ip,
        xTotalM: roundPrecision(currentXOffset + ip, 3),
        type: 'inflection-point',
        label: `Inflection Point ${idx + 1}`,
        shearKn: roundPrecision(getShearAtX(ip), 2),
        momentKnm: 0,
        significance: 'Zero-moment contra-flexure point (bar curtailment cut-off)',
      });
    });

    allCriticalCoordinates.push(...spanCriticals);

    spanResults.push({
      spanIndex: i,
      lengthM: L,
      leftReactionKn: roundPrecision(V_left, 2),
      rightReactionKn: roundPrecision(V_right, 2),
      maxPositiveMomentKnm: roundPrecision(spanMaxPositiveM, 2),
      maxPositiveMomentLocationM: roundPrecision(spanMaxPosLoc, 2),
      maxPositiveMomentTotalLocationM: roundPrecision(currentXOffset + spanMaxPosLoc, 2),
      maxNegativeMomentLeftKnm: roundPrecision(M_left, 2),
      maxNegativeMomentRightKnm: roundPrecision(M_right, 2),
      maxShearKn: roundPrecision(spanMaxV, 2),
      criticalShearAtDKn: roundPrecision(criticalShearAtD, 2),
      inflectionPointsM: inflectionPointsSpanM,
      inflectionPointsTotalM: inflectionPointsSpanM.map((ip) => roundPrecision(currentXOffset + ip, 3)),
      zeroShearLocationsM: zeroShearLocations.map((z) => roundPrecision(z, 2)),
      criticalPoints: spanCriticals,
    });

    currentXOffset += L;
  }

  // Find governing hogging moment across all supports
  supportMoments.forEach((m, idx) => {
    if (m < 0 && Math.abs(m) > globalMaxHogging) {
      globalMaxHogging = Math.abs(m);
      globalMaxHoggingSupportIndex = idx;
    }
  });

  /* ==============================================================
     ACI 318 / BNBC 2020 CODE CAPACITY & LIMIT STATE VERIFICATIONS
     ============================================================== */
  const d_mm = params.sectionDepthMm || 600;
  const b_mm = params.sectionWidthMm || Math.max(250, Math.round(d_mm * 0.5));
  const fck = params.concreteGradeFckMpa || 25;
  const allowableStressMpa = params.allowableStressMpa || 250;

  const I_avg = spans.reduce((sum, s) => sum + s.momentOfInertiaCm4, 0) / spanCount;
  const c_mm = d_mm / 2;
  const i_mm4 = I_avg * 1e4;
  const governingMoment = Math.max(globalMaxSagging, globalMaxHogging);
  const bendingStressMpa = (governingMoment * 1e6 * c_mm) / (i_mm4 || 1);
  const flexuralDcr = bendingStressMpa / allowableStressMpa;

  // Concrete Nominal Shear Capacity V_c per ACI 318 Section 22.5.5 / BNBC 2020 §6.3:
  // phi * V_c = 0.75 * 0.17 * sqrt(f'c) * b_w * d
  const effectiveDepthMm = Math.max(150, d_mm - 50);
  const phiShear = 0.75;
  const phiVcKn = (phiShear * 0.17 * Math.sqrt(fck) * b_mm * effectiveDepthMm) / 1000;
  const criticalShearKn = Math.max(...spanResults.map((sp) => sp.criticalShearAtDKn));
  const shearDcr = criticalShearKn / (phiVcKn || 1);

  // Nominal beam shear stress tau = V_max / (b * d)
  const shearStressMpa = (globalMaxShear * 1000) / (b_mm * effectiveDepthMm);
  const allowableShearStressMpa = 0.75 * 0.17 * Math.sqrt(fck);

  // Governing utilization DCR
  const utilizationRatio = Math.max(flexuralDcr, shearDcr);

  // Estimated immediate live-load deflection check (L / Delta ~ 360 limit per ACI 318 Table 24.2.2)
  const maxSpanLengthM = Math.max(...spans.map((s) => s.lengthM));
  const avgEI = 200e6 * (I_avg * 1e-8); // kN·m²
  const avgUDL = spans.reduce((s, sp) => s + sp.udlKnPerM, 0) / spanCount;
  const estimatedDeflectionMm =
    ((5 * avgUDL * Math.pow(maxSpanLengthM, 4)) / (384 * (avgEI || 1))) * 1000;
  const deflectionRatioNum = Math.round((maxSpanLengthM * 1000) / (estimatedDeflectionMm || 1));
  const deflectionPass = deflectionRatioNum >= 360;

  // Code validation & issues
  let status: 'nominal' | 'warning' | 'critical' = 'nominal';
  let safetyStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  let governingFailureMode: 'Flexural Tension / Compression' | 'Support Shear Overstress' | 'Adequate' = 'Adequate';

  if (utilizationRatio > 1.0) {
    status = 'critical';
    safetyStatus = 'FAIL';
    governingFailureMode = flexuralDcr >= shearDcr
      ? 'Flexural Tension / Compression'
      : 'Support Shear Overstress';

    issues.push({
      field: 'utilizationRatio',
      message: `Continuous beam section fails ACI 318 / BNBC 2020 limit state (DCR = ${(utilizationRatio * 100).toFixed(1)}% > 100%). ${governingFailureMode}.`,
      severity: 'error',
    });
  } else if (utilizationRatio > 0.85) {
    status = 'warning';
    safetyStatus = 'WARNING';
    governingFailureMode = flexuralDcr >= shearDcr
      ? 'Flexural Tension / Compression'
      : 'Support Shear Overstress';

    issues.push({
      field: 'utilizationRatio',
      message: `Beam operating near limit state capacity (DCR = ${(utilizationRatio * 100).toFixed(1)}%). Recommended to increase beam width or depth.`,
      severity: 'warning',
    });
  }

  if (shearDcr > 1.0) {
    issues.push({
      field: 'shearCapacity',
      message: `Critical section shear (${criticalShearKn.toFixed(1)} kN at d=${(effectiveDepthMm / 10).toFixed(0)}cm from support) exceeds concrete shear capacity phi*Vc (${phiVcKn.toFixed(1)} kN). Mandatory shear stirrups required.`,
      severity: 'error',
    });
  }

  return createEnvelope<ContinuousBeamResult>(
    {
      spanCount,
      totalLengthM: roundPrecision(currentXOffset, 2),
      supportMomentsKnm: supportMoments.map((m) => roundPrecision(m, 2)),
      momentDistributionMomentsKnm: hardySupportMoments.map((m) => roundPrecision(m, 2)),
      supportReactionsKn: supportReactions.map((r) => roundPrecision(r, 2)),
      spans: spanResults,
      points,
      maxSaggingMomentKnm: roundPrecision(globalMaxSagging, 2),
      maxSaggingLocationM: roundPrecision(globalMaxSaggingLocation, 2),
      maxHoggingMomentKnm: roundPrecision(globalMaxHogging, 2),
      maxHoggingSupportIndex: globalMaxHoggingSupportIndex,
      maxShearKn: roundPrecision(globalMaxShear, 2),
      maxShearLocationM: roundPrecision(globalMaxShearLocation, 2),
      allInflectionPointsTotalM,
      criticalCoordinates: allCriticalCoordinates,
      bendingStressMpa: roundPrecision(bendingStressMpa, 2),
      allowableStressMpa: roundPrecision(allowableStressMpa, 1),
      flexuralDcr: roundPrecision(flexuralDcr, 3),
      criticalShearKn: roundPrecision(criticalShearKn, 2),
      concreteShearCapacityVcKn: roundPrecision(phiVcKn, 2),
      shearStressMpa: roundPrecision(shearStressMpa, 2),
      allowableShearStressMpa: roundPrecision(allowableShearStressMpa, 2),
      shearDcr: roundPrecision(shearDcr, 3),
      utilizationRatio: roundPrecision(utilizationRatio, 3),
      safetyStatus,
      governingFailureMode,
      codeChecks: {
        flexurePass: flexuralDcr <= 1.0,
        shearPass: shearDcr <= 1.0,
        maxDeflectionEstimateMm: roundPrecision(estimatedDeflectionMm, 1),
        deflectionRatio: `L/${deflectionRatioNum}`,
        deflectionPass,
        governingCode: params.codeStandard || 'ACI-318 / BNBC-2020',
      },
      momentDistributionSummary: {
        converged: hardyConverged,
        iterations: hardyIterations,
        maxDiscrepancyPercent: roundPrecision(
          (maxDiscrepancy / (governingMoment || 1)) * 100,
          2
        ),
        methodComparison,
      },
      status,
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 13: PILE FOUNDATION BEARING CAPACITY (BNBC-2020 / ACI / TOMLINSON)
------------------------------------------------------------- */
export interface PileLayerContribution {
  layerName: string;
  soilType: 'clay' | 'sand' | 'silt' | 'gravel';
  depthFromM: number;
  depthToM: number;
  effectiveThicknessM: number;
  sptN?: number;
  effectiveStressKpa: number;
  alphaOrBeta: number;
  methodUsed: string;
  unitFrictionKpa: number;
  frictionKn: number;
}

export interface PileCalculationStep {
  step: string;
  formula: string;
  result: string;
  clauseRef?: string;
}

export interface PileCapacityResult {
  pileType: string;
  methodUsed: string;
  diameterM: number;
  lengthM: number;
  perimeterM: number;
  crossSectionAreaM2: number;
  skinFrictionKn: number;
  endBearingKn: number;
  ultimateCapacityKn: number;
  allowableCapacityKn: number;
  appliedLoadKn: number;
  factorOfSafety: number;
  effectiveSafetyFactor: number;
  utilizationRatio: number;
  unitEndBearingKpa: number;
  overburdenAtTipKpa: number;
  layerContributions: PileLayerContribution[];
  // Structural Capacity of Concrete Core / Steel (BNBC Clause 3.10.4.1 / ACI 318)
  structuralCapacityKn: number;
  structuralUtilizationRatio: number;
  structuralPass: boolean;
  // Multi-Component Vesic & Consolidation Settlement Model (mm)
  settlementShaftMm: number;
  settlementBaseMm: number;
  settlementInteractionMm: number;
  elasticSettlementMm: number;
  consolidationSettlementMm: number;
  totalSettlementMm: number;
  permissibleSettlementMm: number;
  settlementPass: boolean;
  // Side-by-Side Method Comparison Breakdown
  alphaBetaCapacityKn: { qs: number; qp: number; qult: number; qall: number };
  meyerhofSptCapacityKn: { qs: number; qp: number; qult: number; qall: number };
  terzaghiCapacityKn: { qs: number; qp: number; qult: number; qall: number };
  // Pile Group Efficiency & Capacity Summary
  pileGroupSummary?: {
    rows: number;
    cols: number;
    totalPiles: number;
    spacingM: number;
    spacingRatio: number;
    efficiency: number;
    groupEfficiency: number;
    totalAllowableCapacityKn: number;
    groupAllowableCapacityKn: number;
    totalAppliedLoadKn: number;
    groupUtilizationRatio: number;
    groupDcr: number;
  };
  // Code Verification
  governingCode: string;
  codeChecks: {
    geotechnicalCapacityPass: boolean;
    structuralCapacityPass: boolean;
    settlementPass: boolean;
    governingCode: string;
    bnbcClauses: string[];
  };
  calculationsBreakdown: PileCalculationStep[];
  status: 'nominal' | 'warning' | 'critical';
}

export function computePileCapacity(
  params: PileCapacityParameters
): CalculationEnvelope<PileCapacityResult> {
  const issues: ValidationIssue[] = [];

  const D = Math.max(0.2, params.diameterM || 0.6);
  const L = Math.max(1.0, params.lengthM || 20.0);
  const P = Math.max(0, params.appliedLoadKn || 1500);
  const FS = Math.max(1.5, params.factorOfSafety || 2.5);
  const Dw = Math.max(0, params.groundwaterDepthM ?? 3.0);
  const method = params.method || 'combined-bnbc';
  const governingCode = params.codeStandard || 'BNBC-2020 / ACI-318';

  const Ap = (Math.PI * Math.pow(D, 2)) / 4;
  const p = Math.PI * D;
  const isBored = params.pileType === 'bored-cast-in-situ';
  const isSteelPipe = params.pileType === 'driven-steel-pipe';
  const isDrivenPrecast = params.pileType === 'driven-precast';

  // Default soil strata if layers empty
  const layers: SoilLayer[] =
    params.layers && params.layers.length > 0
      ? params.layers
      : [
          {
            id: 'l1',
            name: 'Soft Silty Clay (Upper Overburden)',
            thicknessM: 6.0,
            soilType: 'clay',
            cohesionKpa: 30,
            frictionAngleDeg: 0,
            unitWeightKnPerM3: 17.5,
            sptN: 4,
            elasticModulusEsMpa: 12,
            compressionIndexCc: 0.28,
            initialVoidRatioE0: 0.90,
          },
          {
            id: 'l2',
            name: 'Medium Stiff Clayey Silt',
            thicknessM: 8.0,
            soilType: 'silt',
            cohesionKpa: 55,
            frictionAngleDeg: 15,
            unitWeightKnPerM3: 18.5,
            sptN: 10,
            elasticModulusEsMpa: 22,
            compressionIndexCc: 0.18,
            initialVoidRatioE0: 0.78,
          },
          {
            id: 'l3',
            name: 'Dense Bearing Sand & Gravel Strata',
            thicknessM: 10.0,
            soilType: 'sand',
            cohesionKpa: 0,
            frictionAngleDeg: 36,
            unitWeightKnPerM3: 20.0,
            sptN: 32,
            elasticModulusEsMpa: 60,
          },
        ];

  let currentDepth = 0;
  let overburdenStressKpa = 0;
  const layerContribs: PileLayerContribution[] = [];

  // Parallel accumulators for comparative methods
  let totalQsAlphaBeta = 0;
  let totalQsMeyerhofSpt = 0;
  let totalQsTerzaghi = 0;
  let totalQsGoverning = 0;

  // Process skin friction layer by layer (Qs = Σ fi * As)
  for (const layer of layers) {
    if (currentDepth >= L) break;

    const layerTop = currentDepth;
    const layerBottom = currentDepth + layer.thicknessM;
    const effectiveBottom = Math.min(layerBottom, L);
    const thickM = effectiveBottom - layerTop;

    if (thickM <= 0) {
      currentDepth = layerBottom;
      continue;
    }

    const midDepth = layerTop + thickM / 2;

    // Overburden effective vertical stress at mid-depth
    let gammaEff = layer.unitWeightKnPerM3;
    if (midDepth > Dw) {
      gammaEff = Math.max(8.0, layer.unitWeightKnPerM3 - 9.81);
    }
    const layerSigmaV = overburdenStressKpa + gammaEff * (thickM / 2);
    overburdenStressKpa += gammaEff * thickM;

    // 1. Alpha Method (Tomlinson / BNBC-2020 Clause 3.10.3.3) for Cohesive Clays/Silts
    const cu = layer.cohesionKpa > 0 ? layer.cohesionKpa : (layer.sptN || 6) * 6.25;
    const psi = cu / Math.max(10, layerSigmaV);
    let alpha = 1.0;
    if (cu <= 25) {
      alpha = 1.0;
    } else if (psi <= 1.0) {
      alpha = Math.min(1.0, 0.5 * Math.pow(psi, -0.5));
    } else {
      alpha = Math.min(1.0, 0.5 * Math.pow(psi, -0.25));
    }
    const boredFactorAlpha = isBored ? 0.80 : 1.0;
    const fsAlpha = Math.min(130, alpha * cu * boredFactorAlpha);

    // 2. Beta Method (Burland / Meyerhof / BNBC-2020 Clause 3.10.3.2) for Cohesionless Soils
    const phi = layer.frictionAngleDeg > 0 ? layer.frictionAngleDeg : 30;
    const phiRad = (phi * Math.PI) / 180;
    const Ks = isBored
      ? 0.70 * (1 - Math.sin(phiRad))
      : 1.25 * (1 - Math.sin(phiRad));
    const deltaRad = isBored ? 0.75 * phiRad : 0.90 * phiRad;
    const beta = Ks * Math.tan(deltaRad);
    const zCrit = 15 * D; // Meyerhof critical depth limit
    const effectiveSigmaBeta = Math.min(layerSigmaV, gammaEff * zCrit);
    const fsBeta = Math.min(isBored ? 120 : 150, beta * effectiveSigmaBeta);

    // 3. Meyerhof SPT Method (BNBC-2020 Clause 3.10.3.4)
    const sptN = layer.sptN || (phi > 0 ? Math.round(phi * 0.9) : Math.round(cu / 6.25) || 10);
    let fsSpt = 0;
    if (layer.soilType === 'clay') {
      fsSpt = Math.min(120, alpha * (sptN * 6.25) * boredFactorAlpha);
    } else {
      // Sand/gravel/silt: fs = 2.0 * N (driven) or 1.2 * N (bored)
      fsSpt = Math.min(isBored ? 100 : 130, (isBored ? 1.2 : 2.0) * sptN);
    }

    // 4. Terzaghi / Bowles Method
    let fsTerzaghi = 0;
    if (layer.soilType === 'clay') {
      fsTerzaghi = Math.min(125, alpha * cu * boredFactorAlpha);
    } else {
      const K_terz = isBored ? (1 - Math.sin(phiRad)) : 1.4 * (1 - Math.sin(phiRad));
      fsTerzaghi = Math.min(isBored ? 115 : 140, K_terz * effectiveSigmaBeta * Math.tan(0.80 * phiRad));
    }

    // Determine unit friction based on selected governing solver method
    let unitFrictionKpa = 0;
    let methodTag = '';
    let alphaOrBeta = 0;

    if (method === 'alpha-beta') {
      if (layer.soilType === 'clay' || (layer.cohesionKpa > 20 && layer.frictionAngleDeg < 15)) {
        unitFrictionKpa = fsAlpha;
        methodTag = 'Tomlinson Alpha';
        alphaOrBeta = alpha;
      } else {
        unitFrictionKpa = fsBeta;
        methodTag = 'Burland Beta';
        alphaOrBeta = beta;
      }
    } else if (method === 'meyerhof-spt') {
      unitFrictionKpa = fsSpt;
      methodTag = 'Meyerhof SPT';
      alphaOrBeta = sptN;
    } else if (method === 'terzaghi-bowles') {
      unitFrictionKpa = fsTerzaghi;
      methodTag = 'Terzaghi / Bowles';
      alphaOrBeta = beta;
    } else {
      // Combined BNBC-2020 Standard:
      if (layer.soilType === 'clay') {
        unitFrictionKpa = fsAlpha;
        methodTag = 'BNBC Alpha (Clay)';
        alphaOrBeta = alpha;
      } else {
        unitFrictionKpa = Math.min(fsBeta, fsSpt * 1.15);
        methodTag = 'BNBC Beta/SPT (Sand)';
        alphaOrBeta = beta;
      }
    }

    const frictionAreaM2 = p * thickM;
    const layerQs = unitFrictionKpa * frictionAreaM2;
    totalQsGoverning += layerQs;

    // Track parallel methods for comparison
    const qsAlphaBetaLayer = (layer.soilType === 'clay' ? fsAlpha : fsBeta) * frictionAreaM2;
    const qsSptLayer = fsSpt * frictionAreaM2;
    const qsTerzaghiLayer = fsTerzaghi * frictionAreaM2;

    totalQsAlphaBeta += qsAlphaBetaLayer;
    totalQsMeyerhofSpt += qsSptLayer;
    totalQsTerzaghi += qsTerzaghiLayer;

    layerContribs.push({
      layerName: layer.name,
      soilType: layer.soilType,
      depthFromM: Number(layerTop.toFixed(2)),
      depthToM: Number(effectiveBottom.toFixed(2)),
      effectiveThicknessM: Number(thickM.toFixed(2)),
      sptN,
      effectiveStressKpa: Number(layerSigmaV.toFixed(1)),
      alphaOrBeta: Number(alphaOrBeta.toFixed(3)),
      methodUsed: methodTag,
      unitFrictionKpa: Number(unitFrictionKpa.toFixed(1)),
      frictionKn: Number(layerQs.toFixed(1)),
    });

    currentDepth = layerBottom;
  }

  // 5. End Bearing Qp = qp * Ap (BNBC-2020 Clause 3.10.3.5 / Skempton / Meyerhof / Terzaghi)
  const tipCohesion = params.tipBearingCohesionKpa ?? 0;
  const tipPhi = params.tipBearingFrictionDeg ?? 35;
  const tipPhiRad = (tipPhi * Math.PI) / 180;
  const tipSpt = params.tipSptN || (tipPhi > 0 ? Math.round(tipPhi * 1.0) : Math.round(tipCohesion / 6.25) || 30);

  let qpAlphaBeta = 0;
  let qpSpt = 0;
  let qpTerzaghi = 0;
  let unitEndBearingKpa = 0;

  if (tipCohesion > 25 && tipPhi < 15) {
    // Cohesive clay tip: qp = Nc* * cu = 9 * cu (Skempton) with bored reduction
    const boredFactor = isBored ? 0.80 : 1.0;
    unitEndBearingKpa = 9 * tipCohesion * boredFactor;
    qpAlphaBeta = unitEndBearingKpa;
    qpSpt = 9 * (tipSpt * 6.25) * boredFactor;
    qpTerzaghi = unitEndBearingKpa;
  } else {
    // Cohesionless sand/gravel tip:
    // Meyerhof deep bearing factor Nq*
    const NqMeyerhof =
      Math.exp(Math.PI * Math.tan(tipPhiRad)) *
      Math.pow(Math.tan(Math.PI / 4 + tipPhiRad / 2), 2);
    const tipSigmaV = Math.min(overburdenStressKpa, 15 * D * 19.0);
    const qpLimit = Math.min(11000, 50 * NqMeyerhof * Math.tan(tipPhiRad));
    const qpMeyerhofTheoretical = Math.min(qpLimit, tipSigmaV * NqMeyerhof);

    // Terzaghi / Berezantsev deep base resistance:
    const NqTerzaghi = Math.exp(1.8 * Math.PI * Math.tan(tipPhiRad)) * Math.pow(Math.tan(Math.PI / 4 + tipPhiRad / 2), 2);
    qpTerzaghi = Math.min(10000, tipSigmaV * NqTerzaghi);

    // Meyerhof SPT base resistance (BNBC Clause 3.10.3.5):
    // Driven: qp = 400 * N * (L/D) <= 4000 * N kPa
    // Bored: qp = 150 * N <= 4500 kPa
    const LOverD = Math.min(10, L / D);
    const qpSptVal = isBored
      ? Math.min(4500, 150 * tipSpt)
      : Math.min(4000 * tipSpt, 400 * tipSpt * LOverD);

    qpAlphaBeta = qpMeyerhofTheoretical;
    qpSpt = qpSptVal;

    if (method === 'alpha-beta') {
      unitEndBearingKpa = qpMeyerhofTheoretical;
    } else if (method === 'meyerhof-spt') {
      unitEndBearingKpa = qpSptVal;
    } else if (method === 'terzaghi-bowles') {
      unitEndBearingKpa = qpTerzaghi;
    } else {
      // Combined BNBC:
      unitEndBearingKpa = Math.min(qpMeyerhofTheoretical, qpSptVal);
    }
  }

  const endBearingKn = unitEndBearingKpa * Ap;
  const totalSkinFrictionKn = totalQsGoverning;
  const ultimateCapacityKn = totalSkinFrictionKn + endBearingKn;
  const allowableCapacityKn = ultimateCapacityKn / FS;
  const utilizationRatio = P / Math.max(1, allowableCapacityKn);
  const effectiveSafetyFactor = ultimateCapacityKn / Math.max(1, P);

  // Parallel method results for comparison card
  const qpAlphaBetaKn = qpAlphaBeta * Ap;
  const qpSptKn = qpSpt * Ap;
  const qpTerzaghiKn = qpTerzaghi * Ap;

  const alphaBetaCapacityKn = {
    qs: Number(totalQsAlphaBeta.toFixed(1)),
    qp: Number(qpAlphaBetaKn.toFixed(1)),
    qult: Number((totalQsAlphaBeta + qpAlphaBetaKn).toFixed(1)),
    qall: Number(((totalQsAlphaBeta + qpAlphaBetaKn) / FS).toFixed(1)),
  };
  const meyerhofSptCapacityKn = {
    qs: Number(totalQsMeyerhofSpt.toFixed(1)),
    qp: Number(qpSptKn.toFixed(1)),
    qult: Number((totalQsMeyerhofSpt + qpSptKn).toFixed(1)),
    qall: Number(((totalQsMeyerhofSpt + qpSptKn) / FS).toFixed(1)),
  };
  const terzaghiCapacityKn = {
    qs: Number(totalQsTerzaghi.toFixed(1)),
    qp: Number(qpTerzaghiKn.toFixed(1)),
    qult: Number((totalQsTerzaghi + qpTerzaghiKn).toFixed(1)),
    qall: Number(((totalQsTerzaghi + qpTerzaghiKn) / FS).toFixed(1)),
  };

  // 6. Structural Axial Compressive Capacity of Pile Shaft (BNBC Clause 3.10.4.1 / ACI 318 / ACI 543R)
  const fckMpa = params.pileConcreteFckMpa || 25;
  let structuralCapacityKn = 0;

  if (isSteelPipe) {
    const wallThickM = (params.pipeWallThicknessMm || 12) / 1000;
    const Din = Math.max(0.1, D - 2 * wallThickM);
    const Asteel = (Math.PI / 4) * (Math.pow(D, 2) - Math.pow(Din, 2));
    const Acore = (Math.PI / 4) * Math.pow(Din, 2);
    const fyMpa = params.steelYieldFyMpa || 355;
    // BNBC / ACI 543R for concrete-filled steel pipe: P_allow = 0.33*fy*Asteel + 0.35*fck*Acore
    structuralCapacityKn = (0.33 * fyMpa * 1000 * Asteel) + (0.35 * fckMpa * 1000 * Acore);
  } else if (isDrivenPrecast) {
    // Driven precast RCC pile: Allowable stress = 0.33 * f'ck (BNBC Sec 3.10.4.1)
    const allowableStressMpa = 0.33 * fckMpa;
    structuralCapacityKn = allowableStressMpa * 1000 * Ap;
  } else {
    // Bored cast-in-situ without casing: Allowable stress = 0.25 * f'ck = 6.25 MPa for 25 MPa concrete
    const allowableStressMpa = 0.25 * fckMpa;
    structuralCapacityKn = allowableStressMpa * 1000 * Ap;
  }

  const structuralUtilizationRatio = P / Math.max(1, structuralCapacityKn);
  const structuralPass = P <= structuralCapacityKn;

  // 7. Multi-Component Vesic Elastic Settlement Analysis (BNBC Clause 3.10.4.2 / Vesic 1977)
  const EpileKpa = (params.elasticModulusPileGpa || 25) * 1e6; // 25 GPa concrete = 25,000,000 kPa
  const Qws = totalSkinFrictionKn / FS;
  const Qwp = endBearingKn / FS;

  // Shaft elastic compression: Ss = (Qwp + xi * Qws) * L / (Ap * Ep)
  const xi = isBored ? 0.60 : 0.50;
  const settlementShaftMm = (((Qwp + xi * Qws) * L) / ((Ap * EpileKpa) || 1)) * 1000;

  // Base settlement: Sb = Cp * Qwp / (D * qp)
  const Cp = isBored ? 0.045 : 0.09;
  const settlementBaseMm = ((Cp * Qwp) / ((D * unitEndBearingKpa) || 1)) * 1000;

  // Shaft-to-base interaction: Sbs = Cs * Qws / (L * qp)
  const Cs = (0.93 + 0.16 * Math.sqrt(L / D)) * Cp;
  const settlementInteractionMm = ((Cs * Qws) / ((L * unitEndBearingKpa) || 1)) * 1000;

  const elasticSettlementMm = settlementShaftMm + settlementBaseMm + settlementInteractionMm;

  // 8. Long-Term Primary Consolidation Settlement (Sc) under Equivalent Raft Dispersion
  // Per BNBC-2020 Clause 3.10.4.3 & Tomlinson:
  // Friction pile equivalent raft placed at depth z_raft = (2/3) * L
  let consolidationSettlementMm = 0;
  const raftDepthM = (2 / 3) * L;
  const Beq = D;
  const Leq = D;

  // Scan layers located below raft depth for compressible clay
  let currentLayerZ = 0;
  for (const lyr of layers) {
    const lyrTop = currentLayerZ;
    const lyrBot = currentLayerZ + lyr.thicknessM;
    currentLayerZ = lyrBot;

    if (lyrBot > raftDepthM && lyr.soilType === 'clay' && (lyr.compressionIndexCc || 0) > 0) {
      const zMid = Math.max(raftDepthM, lyrTop) + Math.min(lyrBot - Math.max(raftDepthM, lyrTop), lyr.thicknessM) / 2;
      const zFromRaft = zMid - raftDepthM;
      const sigmaV0 = (overburdenStressKpa * (zMid / L));
      const deltaSigma = P / ((Beq + zFromRaft) * (Leq + zFromRaft));

      if (sigmaV0 > 5 && deltaSigma > 1) {
        const CcVal = lyr.compressionIndexCc || 0.25;
        const e0Val = lyr.initialVoidRatioE0 || 0.85;
        const Hclay = lyr.thicknessM;
        consolidationSettlementMm += ((CcVal * Hclay) / (1 + e0Val)) * Math.log10((sigmaV0 + deltaSigma) / sigmaV0) * 1000;
      }
    }
  }

  const totalSettlementMm = elasticSettlementMm + consolidationSettlementMm;
  const permissibleSettlementMm = params.permissibleSettlementMm || 25.0; // BNBC Clause 3.10.4.2 (25mm allowable)
  const settlementPass = totalSettlementMm <= permissibleSettlementMm;

  // 9. Pile Group Efficiency & Capacity (Converse-Labarre Formulation)
  const groupRows = params.pileGroupRows || 1;
  const groupCols = params.pileGroupCols || 1;
  const totalPiles = groupRows * groupCols;
  const spacingM = params.pileSpacingM || (3.0 * D);
  let groupEfficiency = 1.0;

  if (totalPiles > 1) {
    const thetaRad = Math.atan(D / spacingM);
    const thetaDeg = (thetaRad * 180) / Math.PI;
    const m = groupRows;
    const n = groupCols;
    groupEfficiency = Math.max(0.60, 1.0 - (thetaDeg / 90) * (((n - 1) * m + (m - 1) * n) / (m * n)));
  }

  const totalAllowableCapacityKn = allowableCapacityKn * totalPiles * groupEfficiency;
  const totalAppliedLoadKn = P * totalPiles;
  const groupUtilizationRatio = totalAppliedLoadKn / Math.max(1, totalAllowableCapacityKn);

  const pileGroupSummary = {
    rows: groupRows,
    cols: groupCols,
    totalPiles,
    spacingM,
    spacingRatio: Number((spacingM / D).toFixed(2)),
    efficiency: Number(groupEfficiency.toFixed(3)),
    groupEfficiency: Number(groupEfficiency.toFixed(3)),
    totalAllowableCapacityKn: Number(totalAllowableCapacityKn.toFixed(0)),
    groupAllowableCapacityKn: Number(totalAllowableCapacityKn.toFixed(0)),
    totalAppliedLoadKn: Number(totalAppliedLoadKn.toFixed(0)),
    groupUtilizationRatio: Number(groupUtilizationRatio.toFixed(3)),
    groupDcr: Number(groupUtilizationRatio.toFixed(3)),
  };

  // 10. Step-by-Step Calculation Breakdown with BNBC & ACI Clauses
  const calculationsBreakdown: PileCalculationStep[] = [
    {
      step: '1. Pile Geometry & Gross Cross-Section Area',
      formula: 'Ap = π·D² / 4, Perimeter p = π·D',
      result: `Ap = ${Ap.toFixed(4)} m², Perimeter p = ${p.toFixed(3)} m (D = ${D}m, L = ${L}m, Type = ${params.pileType.toUpperCase()})`,
      clauseRef: 'BNBC Sec 3.10.1',
    },
    {
      step: '2. Shaft Skin Friction Accumulation (Qs = Σ fs·As)',
      formula: 'Cohesive: fs = α·cu (Clause 3.10.3.3) | Cohesionless: fs = β·σ\'v (Clause 3.10.3.2)',
      result: `Total Qs = ${totalSkinFrictionKn.toFixed(1)} kN across ${layerContribs.length} soil strata`,
      clauseRef: 'BNBC Sec 3.10.3',
    },
    {
      step: '3. Base End Bearing Mobilization (Qp = qp·Ap)',
      formula: 'qp = min(σ\'v·Nq*, 50·Nq*·tanφ, 11000 kPa) or 9·cu',
      result: `unit qp = ${unitEndBearingKpa.toFixed(1)} kPa → Qp = ${endBearingKn.toFixed(1)} kN (Tip at z = -${L}m)`,
      clauseRef: 'BNBC Sec 3.10.3.5',
    },
    {
      step: '4. Total Ultimate & Allowable Geotechnical Capacity',
      formula: 'Q_ult = Qs + Qp & Q_all = Q_ult / FS',
      result: `Q_ult = ${ultimateCapacityKn.toFixed(1)} kN → Q_all = ${allowableCapacityKn.toFixed(1)} kN (FS = ${FS})`,
      clauseRef: 'BNBC Sec 3.10.3.1',
    },
    {
      step: '5. Structural Pile Core Capacity (Section Check)',
      formula: isSteelPipe ? 'P_struct = 0.33·fy·Asteel + 0.35·f\'ck·Acore' : isBored ? 'P_struct = 0.25·f\'ck·Ap' : 'P_struct = 0.33·f\'ck·Ap',
      result: `P_struct = ${structuralCapacityKn.toFixed(0)} kN (f\'ck = ${fckMpa} MPa) vs Applied P = ${P} kN (${structuralPass ? 'PASS' : 'EXCEEDED'})`,
      clauseRef: 'BNBC Sec 3.10.4.1 / ACI 543R',
    },
    {
      step: '6. Vesic Elastic Settlement (Ss + Sb + Sbs)',
      formula: 'Ss (Shaft) + Sb (Base) + Sbs (Interaction)',
      result: `Ss = ${settlementShaftMm.toFixed(1)}mm, Sb = ${settlementBaseMm.toFixed(1)}mm, Sbs = ${settlementInteractionMm.toFixed(1)}mm → Elastic Se = ${elasticSettlementMm.toFixed(1)}mm`,
      clauseRef: 'BNBC Sec 3.10.4.2',
    },
    {
      step: '7. Long-Term Primary Consolidation Settlement (Sc)',
      formula: 'Sc = [Cc·Hc / (1+e0)] · log10((σ\'v0 + Δσ) / σ\'v0) via Equivalent Raft at 2/3 L',
      result: `Sc = ${consolidationSettlementMm.toFixed(1)} mm → Total Settlement St = ${totalSettlementMm.toFixed(1)} mm ≤ ${permissibleSettlementMm} mm (${settlementPass ? 'PASS' : 'EXCEEDED'})`,
      clauseRef: 'BNBC Sec 3.10.4.3',
    },
  ];

  if (utilizationRatio > 1.0) {
    issues.push({
      field: 'appliedLoadKn',
      message: `Applied working load (${P} kN) exceeds allowable geotechnical capacity (${allowableCapacityKn.toFixed(0)} kN). DCR = ${(utilizationRatio * 100).toFixed(1)}%. Increase pile diameter or depth.`,
      severity: 'error',
    });
  }

  if (!structuralPass) {
    issues.push({
      field: 'appliedLoadKn',
      message: `Applied axial load (${P} kN) exceeds allowable structural capacity of the pile (${structuralCapacityKn.toFixed(0)} kN). Increase concrete grade or pile section.`,
      severity: 'error',
    });
  }

  if (!settlementPass) {
    issues.push({
      field: 'permissibleSettlementMm',
      message: `Estimated total pile settlement (${totalSettlementMm.toFixed(1)} mm) exceeds BNBC permissible limit of ${permissibleSettlementMm} mm.`,
      severity: 'warning',
    });
  }

  const geotechnicalPass = utilizationRatio <= 1.0;
  const status: 'nominal' | 'warning' | 'critical' =
    !geotechnicalPass || !structuralPass || !settlementPass
      ? 'critical'
      : utilizationRatio > 0.85 || structuralUtilizationRatio > 0.85
        ? 'warning'
        : 'nominal';

  return createEnvelope<PileCapacityResult>(
    {
      pileType: params.pileType,
      methodUsed: method,
      diameterM: D,
      lengthM: L,
      perimeterM: Number(p.toFixed(3)),
      crossSectionAreaM2: Number(Ap.toFixed(4)),
      skinFrictionKn: Number(totalSkinFrictionKn.toFixed(1)),
      endBearingKn: Number(endBearingKn.toFixed(1)),
      ultimateCapacityKn: Number(ultimateCapacityKn.toFixed(1)),
      allowableCapacityKn: Number(allowableCapacityKn.toFixed(1)),
      appliedLoadKn: P,
      factorOfSafety: FS,
      effectiveSafetyFactor: Number(effectiveSafetyFactor.toFixed(2)),
      utilizationRatio: Number(utilizationRatio.toFixed(3)),
      unitEndBearingKpa: Number(unitEndBearingKpa.toFixed(1)),
      overburdenAtTipKpa: Number(overburdenStressKpa.toFixed(1)),
      layerContributions: layerContribs,
      structuralCapacityKn: Number(structuralCapacityKn.toFixed(1)),
      structuralUtilizationRatio: Number(structuralUtilizationRatio.toFixed(3)),
      structuralPass,
      settlementShaftMm: Number(settlementShaftMm.toFixed(2)),
      settlementBaseMm: Number(settlementBaseMm.toFixed(2)),
      settlementInteractionMm: Number(settlementInteractionMm.toFixed(2)),
      elasticSettlementMm: Number(elasticSettlementMm.toFixed(2)),
      consolidationSettlementMm: Number(consolidationSettlementMm.toFixed(2)),
      totalSettlementMm: Number(totalSettlementMm.toFixed(2)),
      permissibleSettlementMm: Number(permissibleSettlementMm.toFixed(1)),
      settlementPass,
      alphaBetaCapacityKn,
      meyerhofSptCapacityKn,
      terzaghiCapacityKn,
      pileGroupSummary,
      governingCode,
      codeChecks: {
        geotechnicalCapacityPass: geotechnicalPass,
        structuralCapacityPass: structuralPass,
        settlementPass,
        governingCode,
        bnbcClauses: [
          'BNBC-2020 Part 6, Chapter 3, Section 3.10 (Deep Foundations)',
          'BNBC Clause 3.10.3.2 (Beta Method for Cohesionless Soils)',
          'BNBC Clause 3.10.3.3 (Alpha Method for Cohesive Soils)',
          'BNBC Clause 3.10.3.4 (SPT Correlations for Piles)',
          'BNBC Clause 3.10.3.5 (End Bearing Capacities for Deep Foundations)',
          'BNBC Clause 3.10.4.1 (Structural Permissible Stress of Pile Core)',
          'BNBC Clause 3.10.4.2 (Permissible Settlement Limit of 25 mm)',
          'BNBC Clause 3.10.4.3 (Equivalent Raft Group Consolidation Settlement)',
        ],
      },
      calculationsBreakdown,
      status,
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 14: PIPE HYDRAULICS (HAZEN-WILLIAMS PRESSURE & STORM FLOW)
------------------------------------------------------------- */
export interface PipeProfileStation {
  distanceM: number;
  invertElevationM: number;
  crownElevationM: number;
  centerlineElevationM: number;
  hglElevationM: number;
  eglElevationM: number;
  pressureKpa: number;
  isNegativePressure: boolean;
}

export interface PipeHydraulicsResult {
  serviceType: 'pressure' | 'gravity-storm';
  pipeMaterial: string;
  materialName: string;
  hazenWilliamsC: number;
  manningN: number;
  internalDiameterMm: number;
  lengthM: number;
  flowRateLps: number;
  flowRateM3ps: number;
  flowAreaM2: number;
  velocityMps: number;
  hydraulicRadiusM: number;
  reynoldsNumber: number;
  kinematicViscosityM2s: number;
  flowRegime: 'Laminar' | 'Transitional' | 'Turbulent';
  regimeDescription: string;
  frictionSlopeMPerM: number;
  frictionHeadLossM: number;
  minorHeadLossM: number;
  totalHeadLossM: number;
  velocityHeadM: number;
  inletTotalHeadM: number;
  outletTotalHeadM: number;
  inletPressureKpa: number;
  outletPressureKpa: number;
  inletHglM: number;
  outletHglM: number;
  inletEglM: number;
  outletEglM: number;
  selfCleansingStatus: 'pass' | 'fail';
  maxVelocityStatus: 'pass' | 'warning' | 'fail';
  cavitationWarning: boolean;
  utilizationRatio: number;
  status: 'nominal' | 'warning' | 'critical';
  darcyFrictionFactor: number;
  darcyHeadLossM: number;
  darcyTotalHeadLossM: number;
  equivalentRoughnessMm: number;
  sizingRecommendation: {
    recommendedDn: number;
    sizingNotes: string;
    commercialOptions: Array<{
      dnMm: number;
      velocityMps: number;
      frictionLossM: number;
      reynoldsNumber: number;
      isFeasible: boolean;
      tag: string;
    }>;
  };
  stormSewerAnalysis?: {
    fillingRatio: number;
    flowDepthM: number;
    wettedAreaM2: number;
    hydraulicRadiusM: number;
    gravityCapacityLps: number;
    gravityVelocityMps: number;
    froudeNumber: number;
    flowRegime: string;
    isCapacitySufficient: boolean;
  };
  profileStations: PipeProfileStation[];
}

export function computePipeHydraulics(
  params: PipeHydraulicsParameters
): CalculationEnvelope<PipeHydraulicsResult> {
  const issues: ValidationIssue[] = [];

  const serviceType = params.serviceType || 'pressure';
  const matInfo = getHydraulicMaterial(params.pipeMaterial);
  const C = Math.max(40, Math.min(160, params.hazenWilliamsC || matInfo.hazenWilliamsC));
  const n = Math.max(0.008, Math.min(0.040, params.manningN || matInfo.manningN));
  const D_mm = Math.max(25, params.internalDiameterMm || 200);
  const D_m = D_mm / 1000;
  const L = Math.max(1, params.lengthM || 100);
  const Q_lps = Math.max(0.1, params.flowRateLps || 25);
  const Q_m3s = Q_lps / 1000;
  const K = Math.max(0, params.minorLossCoefficientK || 1.5);
  const z1 = params.inletElevationM ?? 15.0;
  const z2 = params.outletElevationM ?? 10.0;
  const P_in_kpa = Math.max(0, params.inletPressureKpa || 250);
  const T_c = params.waterTempC || 20;

  const Area = (Math.PI * Math.pow(D_m, 2)) / 4;
  const V = Q_m3s / Area;
  const Rh = D_m / 4;

  // Hazen-Williams friction slope:
  // S_f = 10.67 * Q^1.852 / (C^1.852 * D^4.87)
  const Sf =
    (10.67 * Math.pow(Q_m3s, 1.852)) /
    (Math.pow(C, 1.852) * Math.pow(D_m, 4.87));

  const hf = Sf * L;
  const g = 9.80665;
  const hv = Math.pow(V, 2) / (2 * g);
  const hm = K * hv;
  const totalHeadLoss = hf + hm;

  // Kinematic viscosity of water at temperature T (°C)
  const nu = getWaterKinematicViscosity(T_c);
  const Re = (V * D_m) / nu;

  let flowRegime: 'Laminar' | 'Transitional' | 'Turbulent' = 'Turbulent';
  let regimeDescription = 'Fully developed turbulent flow (Re > 4000). Friction dominated by inertial mixing and surface roughness.';
  if (Re < 2000) {
    flowRegime = 'Laminar';
    regimeDescription = 'Laminar streamline flow (Re < 2000). Highly viscous; velocity profile is parabolic.';
  } else if (Re <= 4000) {
    flowRegime = 'Transitional';
    regimeDescription = 'Transitional critical boundary (2000 <= Re <= 4000). Unstable fluctuations between laminar and turbulent flow.';
  }

  // Darcy-Weisbach comparison
  const epsilonMm = matInfo.darcyRoughnessMm;
  const epsilonM = epsilonMm / 1000;

  let darcyF: number;
  if (Re < 2000) {
    darcyF = Re > 0 ? 64 / Re : 0.032;
  } else if (Re >= 4000) {
    const relRoughness = epsilonM / (3.7 * D_m);
    const reTerm = 5.74 / Math.pow(Re, 0.9);
    const logArg = relRoughness + reTerm;
    darcyF = 0.25 / Math.pow(Math.log10(logArg), 2);
  } else {
    const f2000 = 64 / 2000;
    const relRoughness4000 = epsilonM / (3.7 * D_m);
    const reTerm4000 = 5.74 / Math.pow(4000, 0.9);
    const f4000 = 0.25 / Math.pow(Math.log10(relRoughness4000 + reTerm4000), 2);
    const t = (Re - 2000) / 2000;
    darcyF = f2000 + t * (f4000 - f2000);
  }

  const darcyHeadLossM = darcyF * (L / D_m) * hv;
  const darcyTotalHeadLossM = darcyHeadLossM + hm;

  // Elevation and Grade Lines
  // Pressure head in meters of water: P / (rho * g) = P_kpa / 9.80665
  const HinletTotal = z1 + D_m / 2 + P_in_kpa / g + hv;
  const HoutletTotal = HinletTotal - totalHeadLoss;
  const P_out_head = Math.max(0, HoutletTotal - (z2 + D_m / 2) - hv);
  const P_out_kpa = P_out_head * g;

  const inletHglM = HinletTotal - hv;
  const outletHglM = HoutletTotal - hv;

  // Velocity checks
  const selfCleansing: 'pass' | 'fail' = V >= matInfo.minCleansingVelocityMps ? 'pass' : 'fail';
  const maxVelocity: 'pass' | 'warning' | 'fail' =
    V <= matInfo.maxVelocityMps ? 'pass' : V <= matInfo.maxVelocityMps + 0.8 ? 'warning' : 'fail';
  const utilizationRatio = V / matInfo.maxVelocityMps;

  // Multi-station Profile Plotting (5 stations)
  const profileStations: PipeProfileStation[] = [];
  let cavitationWarning = false;
  const stationsCount = 5;

  for (let i = 0; i <= stationsCount; i++) {
    const ratio = i / stationsCount;
    const dist = ratio * L;
    const invertZ = z1 - ratio * (z1 - z2);
    const crownZ = invertZ + D_m;
    const centerZ = invertZ + D_m / 2;

    // Linear friction loss + concentrated minor loss
    const lossSoFar = ratio * hf + (ratio > 0 ? hm : 0);
    const eglZ = HinletTotal - lossSoFar;
    const hglZ = eglZ - hv;

    const pressureHead = hglZ - centerZ;
    const pKpa = pressureHead * g;
    const isNegative = hglZ < crownZ;

    if (isNegative) {
      cavitationWarning = true;
    }

    profileStations.push({
      distanceM: Number(dist.toFixed(1)),
      invertElevationM: Number(invertZ.toFixed(3)),
      crownElevationM: Number(crownZ.toFixed(3)),
      centerlineElevationM: Number(centerZ.toFixed(3)),
      hglElevationM: Number(hglZ.toFixed(3)),
      eglElevationM: Number(eglZ.toFixed(3)),
      pressureKpa: Number(pKpa.toFixed(1)),
      isNegativePressure: isNegative,
    });
  }

  // Commercial Pipe Sizing Evaluation
  const sizingRec = recommendPipeDiameter(Q_lps, C, L, serviceType);

  // Storm Sewer Gravity Mode Analysis (if selected)
  let stormSewerAnalysis: PipeHydraulicsResult['stormSewerAnalysis'] = undefined;
  if (serviceType === 'gravity-storm') {
    const stormFilling = Math.max(0.1, Math.min(1.0, params.stormFillingRatio || 0.8));
    const flowDepth = D_m * stormFilling;
    // Circular partial flow
    const cosVal = Math.max(-1, Math.min(1, 1 - (2 * flowDepth) / D_m));
    const theta = 2 * Math.acos(cosVal);
    const wettedArea = (Math.pow(D_m, 2) / 8) * (theta - Math.sin(theta));
    const wettedP = (D_m * theta) / 2;
    const stormRh = wettedP > 0 ? wettedArea / wettedP : 0;
    const bedSlope = Math.max(0.0001, (z1 - z2) / L);
    const stormV = (1 / n) * Math.pow(stormRh, 2 / 3) * Math.sqrt(bedSlope);
    const stormQ_m3s = wettedArea * stormV;
    const stormQ_lps = stormQ_m3s * 1000;
    const topW = Math.max(0.001, D_m * Math.sin(theta / 2));
    const hydD = wettedArea / topW;
    const stormFr = stormV / Math.sqrt(g * hydD);

    stormSewerAnalysis = {
      fillingRatio: Number(stormFilling.toFixed(2)),
      flowDepthM: Number(flowDepth.toFixed(3)),
      wettedAreaM2: Number(wettedArea.toFixed(4)),
      hydraulicRadiusM: Number(stormRh.toFixed(4)),
      gravityCapacityLps: Number(stormQ_lps.toFixed(1)),
      gravityVelocityMps: Number(stormV.toFixed(2)),
      froudeNumber: Number(stormFr.toFixed(3)),
      flowRegime: stormFr < 0.98 ? 'Subcritical' : stormFr <= 1.02 ? 'Critical' : 'Supercritical',
      isCapacitySufficient: stormQ_lps >= Q_lps,
    };

    if (stormQ_lps < Q_lps) {
      issues.push({
        field: 'flowRateLps',
        message: `Design storm flow (${Q_lps.toFixed(1)} L/s) exceeds gravity capacity (${stormQ_lps.toFixed(1)} L/s) at ${(stormFilling * 100).toFixed(0)}% filling. Increase pipe diameter to DN ${sizingRec.recommendedDn} mm or steepen bed slope.`,
        severity: 'error',
      });
    }
  }

  let status: 'nominal' | 'warning' | 'critical' = 'nominal';
  if (V < matInfo.minCleansingVelocityMps) {
    status = 'warning';
    issues.push({
      field: 'velocity',
      message: `Flow velocity (${V.toFixed(2)} m/s) is below recommended self-cleansing velocity (${matInfo.minCleansingVelocityMps} m/s) for ${matInfo.name}. Risk of sediment deposition and blockage.`,
      severity: 'warning',
    });
  } else if (V > matInfo.maxVelocityMps) {
    status = 'critical';
    issues.push({
      field: 'velocity',
      message: `Flow velocity (${V.toFixed(2)} m/s) exceeds non-scouring threshold (${matInfo.maxVelocityMps} m/s) for ${matInfo.name}. Severe risk of erosion, cavitation, and transient surge pressures (water hammer).`,
      severity: 'error',
    });
  }

  if (cavitationWarning) {
    issues.push({
      field: 'inletPressureKpa',
      message: `Hydraulic Grade Line drops below pipe crown elevation. Sub-atmospheric siphon condition detected! Risk of column separation, vapor cavitation, and back-siphonage contamination.`,
      severity: 'error',
    });
    status = 'critical';
  } else if (serviceType === 'pressure' && P_out_kpa < 70) {
    issues.push({
      field: 'outletPressure',
      message: `Residual outlet pressure (${P_out_kpa.toFixed(1)} kPa) is below minimum municipal service threshold (70 kPa / 0.7 bar). Increase pipe diameter or upstream head.`,
      severity: 'warning',
    });
  }

  return createEnvelope<PipeHydraulicsResult>(
    {
      serviceType,
      pipeMaterial: params.pipeMaterial,
      materialName: matInfo.name,
      hazenWilliamsC: C,
      manningN: n,
      internalDiameterMm: D_mm,
      lengthM: L,
      flowRateLps: Q_lps,
      flowRateM3ps: Number(Q_m3s.toFixed(6)),
      flowAreaM2: Number(Area.toFixed(5)),
      velocityMps: Number(V.toFixed(2)),
      hydraulicRadiusM: Number(Rh.toFixed(4)),
      reynoldsNumber: Math.round(Re),
      kinematicViscosityM2s: Number(nu.toExponential(4)),
      flowRegime,
      regimeDescription,
      frictionSlopeMPerM: Number(Sf.toFixed(5)),
      frictionHeadLossM: Number(hf.toFixed(2)),
      minorHeadLossM: Number(hm.toFixed(2)),
      totalHeadLossM: Number(totalHeadLoss.toFixed(2)),
      velocityHeadM: Number(hv.toFixed(3)),
      inletTotalHeadM: Number(HinletTotal.toFixed(2)),
      outletTotalHeadM: Number(HoutletTotal.toFixed(2)),
      inletPressureKpa: P_in_kpa,
      outletPressureKpa: Number(P_out_kpa.toFixed(1)),
      inletHglM: Number(inletHglM.toFixed(2)),
      outletHglM: Number(outletHglM.toFixed(2)),
      inletEglM: Number(HinletTotal.toFixed(2)),
      outletEglM: Number(HoutletTotal.toFixed(2)),
      selfCleansingStatus: selfCleansing,
      maxVelocityStatus: maxVelocity,
      cavitationWarning,
      utilizationRatio: Number(utilizationRatio.toFixed(3)),
      status,
      darcyFrictionFactor: Number(darcyF.toFixed(4)),
      darcyHeadLossM: Number(darcyHeadLossM.toFixed(2)),
      darcyTotalHeadLossM: Number(darcyTotalHeadLossM.toFixed(2)),
      equivalentRoughnessMm: epsilonMm,
      sizingRecommendation: sizingRec,
      stormSewerAnalysis,
      profileStations,
    },
    issues
  );
}


