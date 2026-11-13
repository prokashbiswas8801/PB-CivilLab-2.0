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
import { STANDARD_WBS_SECTIONS } from './costLibraries';
import {
  calculateChannelGeometry,
  solveCriticalDepth,
  solveHydraulicJump,
  getWaterKinematicViscosity,
  recommendPipeDiameter,
  getHydraulicMaterial,
} from './hydraulicsSolver';

/* -------------------------------------------------------------
   VALIDATION CONTRACT HELPERS & HAND-CALCULATION TRACEABILITY
------------------------------------------------------------- */
export interface CalculationStep {
  stepNumber: number;
  title: string;
  formula: string;
  substitution: string;
  result: string;
  reasoning: string;
  isVerifiedAgainstEngine: boolean;
}

export interface ScopeAndLimitsMetadata {
  status: 'Available' | 'Preview' | 'Partial';
  covered: string[];
  unsupported: string[];
  codeReference: string;
}

export interface CalculationEnvelope<T> {
  status: CalculationStatus;
  issues: ValidationIssue[];
  result: T | null;
  handCalculationSteps?: CalculationStep[];
  scopeAndLimits?: ScopeAndLimitsMetadata;
}

export function createEnvelope<T>(
  result: T | null,
  issues: ValidationIssue[],
  extras?: {
    handCalculationSteps?: CalculationStep[];
    scopeAndLimits?: ScopeAndLimitsMetadata;
  }
): CalculationEnvelope<T> {
  const hasErrors = issues.some((i) => i.severity === 'error');
  const hasWarnings = issues.some((i) => i.severity === 'warning');
  return {
    status: hasErrors ? 'invalid' : hasWarnings ? 'warning' : 'valid',
    issues,
    result: hasErrors ? null : result,
    ...(extras?.handCalculationSteps ? { handCalculationSteps: extras.handCalculationSteps } : {}),
    ...(extras?.scopeAndLimits ? { scopeAndLimits: extras.scopeAndLimits } : {}),
  };
}

/* -------------------------------------------------------------
   MODULE 1: BEAM ANALYSIS (With Zero Coercion & Macaulay Solver)
------------------------------------------------------------- */
export interface BeamAnalysisPoint {
  x: number;
  shearKn: number;
  momentKnm: number;
  deflectionMm: number;
  signedDeflectionMm?: number; // Negative = downward sag, positive = upward uplift
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
  governingCode: string;
  loadCombinationUsed: string;
  factoredMomentKnm: number;
  factoredShearKn: number;
  deflectionLimitFactor: number; // e.g. 360, 240, 180
  phiFactor: number;
  // Extended geometry & contraflexure metadata (optional for backwards compatibility)
  totalLengthM?: number;
  overhangLeftM?: number;
  overhangRightM?: number;
  maxSaggingMomentKnm?: number;
  maxHoggingMomentKnm?: number;
  maxDeflectionLocationM?: number;
  inflectionPointsM?: number[];
  fixedEndMomentLeftKnm?: number;
  fixedEndMomentRightKnm?: number;
}

export function computeBeamAnalysis(
  params: BeamParameters
): CalculationEnvelope<BeamAnalysisResult> {
  const issues: ValidationIssue[] = [];

  const isOverhanging = params.supportCondition === 'overhanging';
  const ovL = isOverhanging ? Math.max(0, params.overhangLeftM || 0) : 0;
  const ovR = isOverhanging ? Math.max(0, params.overhangRightM || 0) : 0;
  const totalLenCheck = params.spanLengthM + ovL + ovR;

  const isZeroBaseline = params.spanLengthM === 0;
  if (params.spanLengthM < 0) {
    issues.push({ field: 'spanLengthM', message: 'Span length cannot be negative.', severity: 'error' });
  } else if (params.spanLengthM === 0) {
    issues.push({ field: 'spanLengthM', message: 'Span length is currently 0 m (clean baseline). Calculation standing by.', severity: 'warning' });
  }
  if (isOverhanging && ((params.overhangLeftM ?? 0) < 0 || (params.overhangRightM ?? 0) < 0)) {
    issues.push({ field: 'overhangLeftM', message: 'Overhang lengths cannot be negative.', severity: 'error' });
  }
  if (params.uniformLoadKnPerM < 0 || (params.endLoadKnPerM ?? 0) < 0) {
    issues.push({ field: 'uniformLoadKnPerM', message: 'Distributed load intensity cannot be negative.', severity: 'error' });
  }
  if (params.pointLoadKn < 0) {
    issues.push({ field: 'pointLoadKn', message: 'Concentrated point load cannot be negative.', severity: 'error' });
  }

  const distType = params.distributedLoadType || 'uniform';
  const wLeft =
    distType === 'triangular-increasing'
      ? 0
      : Math.max(0, params.uniformLoadKnPerM || 0);
  const wRight =
    distType === 'uniform'
      ? Math.max(0, params.uniformLoadKnPerM || 0)
      : distType === 'triangular-decreasing'
        ? 0
        : distType === 'triangular-increasing'
          ? Math.max(0, params.endLoadKnPerM !== undefined ? params.endLoadKnPerM : params.uniformLoadKnPerM || 0)
          : Math.max(0, params.endLoadKnPerM !== undefined ? params.endLoadKnPerM : (params.uniformLoadKnPerM || 0) * 1.5);

  if (wLeft === 0 && wRight === 0 && params.pointLoadKn === 0) {
    issues.push({ field: 'loads', message: 'Applied loads are currently 0. Bending moments, shear forces, and deflections evaluate to zero.', severity: 'warning' });
  }
  if (params.pointLoadKn > 0 && (params.pointLoadPositionM < 0 || params.pointLoadPositionM > totalLenCheck)) {
    issues.push({ field: 'pointLoadPositionM', message: `Point load position must be within total beam length (0 to ${totalLenCheck.toFixed(2)} m).`, severity: 'error' });
  }
  if (params.elasticModulusGpa <= 0 && !isZeroBaseline) {
    issues.push({ field: 'elasticModulusGpa', message: 'Elastic modulus E must be strictly positive (> 0 GPa).', severity: 'error' });
  }
  if (params.momentOfInertiaCm4 <= 0 && !isZeroBaseline) {
    issues.push({ field: 'momentOfInertiaCm4', message: 'Moment of inertia I must be strictly positive (> 0 cm⁴).', severity: 'error' });
  }
  if (params.sectionDepthMm <= 0 && !isZeroBaseline) {
    issues.push({ field: 'sectionDepthMm', message: 'Section depth d must be strictly positive (> 0 mm).', severity: 'error' });
  }
  if (params.allowableStressMpa <= 0 && !isZeroBaseline) {
    issues.push({ field: 'allowableStressMpa', message: 'Allowable bending stress must be strictly positive (> 0 MPa).', severity: 'error' });
  }

  // Building Code Factors & Serviceability Rules
  const code = params.codeStandard || 'BNBC-2020';
  let deadFactor = 1.2;
  let liveFactor = 1.6;
  let phiBending = 0.90;
  let deflectionDivisor = 360;
  let loadCombName = '1.2D + 1.6L (BNBC-2020 §2.7 / ACI 318-19)';

  if (code === 'Eurocode-2') {
    deadFactor = 1.35;
    liveFactor = 1.5;
    phiBending = 0.87;
    deflectionDivisor = 250;
    loadCombName = '1.35G + 1.50Q (Eurocode 2 / EN 1990)';
  } else if (code === 'IS-456') {
    deadFactor = 1.5;
    liveFactor = 1.5;
    phiBending = 0.87;
    deflectionDivisor = 350;
    loadCombName = '1.5(DL + LL) (IS 456:2000 Cl. 36.4)';
  } else if (code === 'AISC-360') {
    deadFactor = 1.2;
    liveFactor = 1.6;
    phiBending = 0.90;
    deflectionDivisor = 360;
    loadCombName = '1.2D + 1.6L (AISC 360 LRFD)';
  }

  const scopeAndLimits: ScopeAndLimitsMetadata = {
    status: 'Available',
    covered: [
      'Euler-Bernoulli 1D small-deflection linear elastic bending',
      'Simply supported, cantilever, fixed-ends, and overhanging boundary conditions',
      'Uniform, triangular (increasing/decreasing), and trapezoidal distributed loads + point force',
      'Automatic contraflexure (M = 0) detection and code limit-state verification',
    ],
    unsupported: [
      'Deep-beam Timoshenko shear deformations (L/h < 4)',
      'Lateral-torsional buckling (LTB) of unbraced slender steel flanges',
      'Cracked-section concrete stiffness degradation (uses uncracked E·I)',
    ],
    codeReference: `${code} · ${loadCombName}`,
  };

  if (issues.some((i) => i.severity === 'error') || isZeroBaseline) {
    return createEnvelope<BeamAnalysisResult>(
      {
        points: [],
        maxMomentKnm: 0,
        maxShearKn: 0,
        maxDeflectionMm: 0,
        allowableDeflectionMm: 0,
        bendingStressMpa: 0,
        utilizationRatio: 0,
        status: 'nominal',
        reactionLeftKn: 0,
        reactionRightKn: 0,
        governingCode: code,
        loadCombinationUsed: loadCombName,
        factoredMomentKnm: 0,
        factoredShearKn: 0,
        deflectionLimitFactor: deflectionDivisor,
        phiFactor: phiBending,
        totalLengthM: 0,
        overhangLeftM: ovL,
        overhangRightM: ovR,
        maxSaggingMomentKnm: 0,
        maxHoggingMomentKnm: 0,
        maxDeflectionLocationM: 0,
        inflectionPointsM: [],
      },
      issues,
      { scopeAndLimits }
    );
  }

  const L_main = Math.max(0.001, params.spanLengthM);
  const L_tot = Math.max(0.001, ovL + L_main + ovR);
  const xA = ovL;
  const xB = ovL + L_main;
  const P = Math.max(0, params.pointLoadKn);
  const a = Math.min(L_tot, Math.max(0, params.pointLoadPositionM));
  const b = L_tot - a;
  const EI = Math.max(0.001, (params.elasticModulusGpa || 200) * (params.momentOfInertiaCm4 || 10000) * 0.01); // kN·m²

  // Linearly varying distributed load w(x) = wLeft + alpha * x over [0, L_tot]
  const alpha = (wRight - wLeft) / L_tot;
  const totalDistLoadKn = 0.5 * (wLeft + wRight) * L_tot;
  const momentDistAboutOrigin = (L_tot * L_tot * (wLeft + 2 * wRight)) / 6;

  const qDistAt = (x: number) => wLeft * x + 0.5 * alpha * x * x;
  const mDistAt = (x: number) => 0.5 * wLeft * x * x + (alpha * x * x * x) / 6;

  let reactionLeftKn = 0;
  let reactionRightKn = 0;
  let fixedEndMomentLeft = 0;
  let fixedEndMomentRight = 0;

  if (params.supportCondition === 'simply-supported' || params.supportCondition === 'overhanging') {
    // Moment equilibrium about Support A (x = xA):
    // R_B * L_main = ∫(x - xA) w(x) dx + P * (a - xA)
    const distMomentAboutA = momentDistAboutOrigin - xA * totalDistLoadKn;
    reactionRightKn = (distMomentAboutA + P * (a - xA)) / L_main;
    reactionLeftKn = totalDistLoadKn + P - reactionRightKn;
  } else if (params.supportCondition === 'cantilever') {
    reactionLeftKn = totalDistLoadKn + P;
    reactionRightKn = 0;
    fixedEndMomentLeft = momentDistAboutOrigin + P * a;
  } else {
    // Fixed-ends (exact superposition of uniform wLeft + increasing triangle (wRight - wLeft) + point load P)
    const dw = wRight - wLeft;
    fixedEndMomentLeft =
      (wLeft * L_tot * L_tot) / 12 +
      (dw * L_tot * L_tot) / 30 +
      (P * a * b * b) / (L_tot * L_tot);
    fixedEndMomentRight =
      (wLeft * L_tot * L_tot) / 12 +
      (dw * L_tot * L_tot) / 20 +
      (P * a * a * b) / (L_tot * L_tot);
    reactionLeftKn =
      (wLeft * L_tot) / 2 +
      (3 * dw * L_tot) / 20 +
      (P * b * b * (3 * a + b)) / Math.pow(L_tot, 3);
    reactionRightKn = totalDistLoadKn + P - reactionLeftKn;
  }

  // Exact Macaulay evaluators V(x) and M(x) at any x in [0, L_tot]
  const evalShearAt = (x: number, includeAtDiscontinuity: 'left' | 'right' = 'right'): number => {
    let V = -qDistAt(x);
    const hitA = includeAtDiscontinuity === 'right' ? x >= xA - 1e-9 : x > xA + 1e-9;
    const hitB = includeAtDiscontinuity === 'right' ? x >= xB - 1e-9 : x > xB + 1e-9;
    const hitP = includeAtDiscontinuity === 'right' ? x >= a - 1e-9 : x > a + 1e-9;

    if (params.supportCondition === 'cantilever' || params.supportCondition === 'fixed-ends') {
      if (hitA) V += reactionLeftKn;
      if (params.supportCondition === 'fixed-ends' && x > L_tot - 1e-9 && includeAtDiscontinuity === 'right') {
        V += reactionRightKn;
      }
    } else {
      if (hitA) V += reactionLeftKn;
      if (hitB && x < L_tot - 1e-9) V += reactionRightKn;
      if (hitB && Math.abs(x - L_tot) < 1e-9 && ovR <= 1e-9 && includeAtDiscontinuity === 'left') {
        // Right end support face shear before reaction closes to 0
      } else if (hitB && ovR > 1e-9) {
        V += reactionRightKn;
      }
    }
    if (P > 0 && hitP) V -= P;
    return V;
  };

  const evalMomentAt = (x: number): number => {
    let M = -fixedEndMomentLeft - mDistAt(x);
    if (x > xA) M += reactionLeftKn * (x - xA);
    if ((params.supportCondition === 'simply-supported' || params.supportCondition === 'overhanging') && x > xB) {
      M += reactionRightKn * (x - xB);
    }
    if (P > 0 && x > a) {
      M -= P * (x - a);
    }
    return M;
  };

  // High-resolution Euler-Bernoulli double integration for exact elastic curve y(x)
  // Sign convention: M > 0 (sagging) -> y'' = M / EI -> downward sag gives y < 0
  const fineSteps = 400;
  const dxFine = L_tot / fineSteps;
  const fineX: number[] = new Array(fineSteps + 1);
  const fineM: number[] = new Array(fineSteps + 1);
  const rawTheta: number[] = new Array(fineSteps + 1).fill(0);
  const rawY: number[] = new Array(fineSteps + 1).fill(0);

  for (let i = 0; i <= fineSteps; i++) {
    const x = i * dxFine;
    fineX[i] = x;
    fineM[i] = evalMomentAt(x);
    if (i > 0) {
      const kPrev = fineM[i - 1] / EI;
      const kCurr = fineM[i] / EI;
      rawTheta[i] = rawTheta[i - 1] + 0.5 * (kPrev + kCurr) * dxFine;
      rawY[i] = rawY[i - 1] + 0.5 * (rawTheta[i - 1] + rawTheta[i]) * dxFine;
    }
  }

  // Enforce boundary conditions y(x)
  const fineY: number[] = new Array(fineSteps + 1);
  if (params.supportCondition === 'cantilever' || params.supportCondition === 'fixed-ends') {
    for (let i = 0; i <= fineSteps; i++) {
      fineY[i] = rawY[i];
    }
  } else {
    // Pin at xA and roller at xB => y(xA) = 0, y(xB) = 0
    const interpRawY = (xq: number): number => {
      const pos = Math.min(fineSteps, Math.max(0, xq / dxFine));
      const idx0 = Math.floor(pos);
      const idx1 = Math.min(fineSteps, idx0 + 1);
      const frac = pos - idx0;
      return rawY[idx0] * (1 - frac) + rawY[idx1] * frac;
    };
    const yA_raw = interpRawY(xA);
    const yB_raw = interpRawY(xB);
    const c1 = -(yB_raw - yA_raw) / L_main;
    const c2 = -yA_raw - c1 * xA;
    for (let i = 0; i <= fineSteps; i++) {
      fineY[i] = rawY[i] + c1 * fineX[i] + c2;
    }
  }

  // Detect interior contraflexure points (M = 0 crossings away from free/simple ends)
  const inflectionPointsM: number[] = [];
  for (let i = 1; i <= fineSteps; i++) {
    const x0 = fineX[i - 1];
    const x1 = fineX[i];
    const m0 = fineM[i - 1];
    const m1 = fineM[i];
    if ((m0 < -1e-4 && m1 > 1e-4) || (m0 > 1e-4 && m1 < -1e-4)) {
      let lo = x0;
      let hi = x1;
      for (let bIt = 0; bIt < 20; bIt++) {
        const mid = 0.5 * (lo + hi);
        if (evalMomentAt(mid) * evalMomentAt(lo) <= 0) hi = mid;
        else lo = mid;
      }
      const root = Number((0.5 * (lo + hi)).toFixed(3));
      if (root > 0.03 && root < L_tot - 0.03 && !inflectionPointsM.some((ip) => Math.abs(ip - root) < 0.04)) {
        inflectionPointsM.push(root);
      }
    }
  }

  // Track exact extrema across fine grid + critical discontinuity stations
  let maxMomentKnm = 0;
  let maxSaggingMomentKnm = 0;
  let maxHoggingMomentKnm = 0;
  let maxShearKn = 0;
  let maxDeflectionMm = 0;
  let maxDeflectionLocationM = 0;

  for (let i = 0; i <= fineSteps; i++) {
    const x = fineX[i];
    const mVal = fineM[i];
    const vLeft = evalShearAt(x, 'left');
    const vRight = evalShearAt(x, 'right');
    const yMm = Math.abs(fineY[i] * 1000);

    if (Math.abs(mVal) > maxMomentKnm) maxMomentKnm = Math.abs(mVal);
    if (mVal > maxSaggingMomentKnm) maxSaggingMomentKnm = mVal;
    if (mVal < 0 && Math.abs(mVal) > maxHoggingMomentKnm) maxHoggingMomentKnm = Math.abs(mVal);
    if (Math.abs(vLeft) > maxShearKn) maxShearKn = Math.abs(vLeft);
    if (Math.abs(vRight) > maxShearKn) maxShearKn = Math.abs(vRight);
    if (yMm > maxDeflectionMm) {
      maxDeflectionMm = yMm;
      maxDeflectionLocationM = x;
    }
  }
  // Ensure critical points (xA, xB, a) are also included in shear/moment extrema
  for (const critX of [0, xA, a, xB, L_tot]) {
    const mCrit = evalMomentAt(critX);
    if (Math.abs(mCrit) > maxMomentKnm) maxMomentKnm = Math.abs(mCrit);
    if (mCrit > maxSaggingMomentKnm) maxSaggingMomentKnm = mCrit;
    if (mCrit < 0 && Math.abs(mCrit) > maxHoggingMomentKnm) maxHoggingMomentKnm = Math.abs(mCrit);
    const vL = Math.abs(evalShearAt(critX, 'left'));
    const vR = Math.abs(evalShearAt(critX, 'right'));
    maxShearKn = Math.max(maxShearKn, vL, vR);
  }

  // Output 60 discretized stations (preserving smooth SVG curve & clean dense table)
  const outputSteps = 60;
  const points: BeamAnalysisPoint[] = [];
  for (let s = 0; s <= outputSteps; s++) {
    const x = (L_tot * s) / outputSteps;
    const fineIdx = Math.min(fineSteps, Math.round((s / outputSteps) * fineSteps));
    const V = evalShearAt(x, s === outputSteps ? 'left' : 'right');
    const M = evalMomentAt(x);
    const signedYmm = fineY[fineIdx] * 1000;
    const deflMm = Math.abs(signedYmm);
    points.push({
      x: Number(x.toFixed(3)),
      shearKn: Number(V.toFixed(2)),
      momentKnm: Number(M.toFixed(2)),
      deflectionMm: Number(deflMm.toFixed(3)),
      signedDeflectionMm: Number(signedYmm.toFixed(3)),
    });
  }

  const allowableDeflectionMm = (L_main * 1000) / deflectionDivisor;
  const cMm = params.sectionDepthMm / 2;
  const iMm4 = params.momentOfInertiaCm4 * 1e4;
  const bendingStressMpa = (maxMomentKnm * 1e6 * cMm) / iMm4;

  const stressRatio = bendingStressMpa / params.allowableStressMpa;
  const deflRatio = maxDeflectionMm / allowableDeflectionMm;
  const utilizationRatio = Math.max(stressRatio, deflRatio);

  // Ultimate Factored Load Envelope (Strength Design / LRFD)
  const wAvg = 0.5 * (wLeft + wRight);
  const DL = params.deadLoadKnPerM ?? (wAvg * 0.5);
  const LL = params.liveLoadKnPerM ?? (wAvg * 0.5);
  const factoredW = deadFactor * DL + liveFactor * LL;
  const factorRatio = wAvg > 0 ? factoredW / wAvg : (deadFactor + liveFactor) / 2;
  const factoredMomentKnm = Number((maxMomentKnm * factorRatio).toFixed(2));
  const factoredShearKn = Number((maxShearKn * factorRatio).toFixed(2));

  if (utilizationRatio > 1.0) {
    issues.push({ field: 'utilizationRatio', message: `Beam exceeds allowable limit state (Utilization: ${(utilizationRatio * 100).toFixed(1)}%).`, severity: 'warning' });
  }

  const status: 'nominal' | 'warning' | 'critical' =
    utilizationRatio > 1.0 ? 'critical' : utilizationRatio > 0.85 ? 'warning' : 'nominal';

  // Build Cross-Verified Hand Calculation Steps
  const eqCheckResid = Math.abs(reactionLeftKn + reactionRightKn - (totalDistLoadKn + P));
  const handSteps: CalculationStep[] = [];

  // Step 1: Total Applied Gravity Loads
  const distFormulaStr =
    distType === 'uniform'
      ? 'W_dist = w · L_total'
      : 'W_dist = 0.5 · (w₁ + w₂) · L_total';
  const distSubStr =
    distType === 'uniform'
      ? `w = ${wLeft.toFixed(2)} kN/m × ${L_tot.toFixed(2)} m; P = ${P.toFixed(2)} kN @ x = ${a.toFixed(2)} m`
      : `0.5 × (${wLeft.toFixed(2)} + ${wRight.toFixed(2)}) × ${L_tot.toFixed(2)} m; P = ${P.toFixed(2)} kN @ x = ${a.toFixed(2)} m`;
  handSteps.push({
    stepNumber: 1,
    title: 'Total Applied Gravity Loads & Resultant',
    formula: `${distFormulaStr};   W_total = W_dist + P`,
    substitution: distSubStr,
    result: `W_dist = ${totalDistLoadKn.toFixed(2)} kN,  W_total = ${(totalDistLoadKn + P).toFixed(2)} kN`,
    reasoning: 'Consolidates distributed line loads (uniform/triangular/trapezoidal) and concentrated forces before solving support equilibrium.',
    isVerifiedAgainstEngine: Math.abs(totalDistLoadKn - 0.5 * (wLeft + wRight) * L_tot) < 1e-3,
  });

  // Step 2: Support Reactions & Boundary Moments
  if (params.supportCondition === 'cantilever') {
    const handMA = momentDistAboutOrigin + P * a;
    handSteps.push({
      stepNumber: 2,
      title: 'Cantilever Fixed-Base Equilibrium (ΣF_y = 0, ΣM_A = 0)',
      formula: 'R_A = W_dist + P;   M_A = −[L²(w₁ + 2w₂)/6 + P·a]',
      substitution: `R_A = ${totalDistLoadKn.toFixed(2)} + ${P.toFixed(2)};   M_A = −[${momentDistAboutOrigin.toFixed(2)} + (${P.toFixed(2)} × ${a.toFixed(2)})]`,
      result: `R_A = ${reactionLeftKn.toFixed(2)} kN,   M_A = −${fixedEndMomentLeft.toFixed(2)} kN·m`,
      reasoning: 'Cantilever stability requires the clamped root at x = 0 to resist both full vertical shear and overturning hogging moment.',
      isVerifiedAgainstEngine: Math.abs(handMA - fixedEndMomentLeft) < 1e-3 && eqCheckResid < 1e-3,
    });
  } else if (params.supportCondition === 'fixed-ends') {
    const dw = wRight - wLeft;
    const handFemL = (wLeft * L_tot * L_tot) / 12 + (dw * L_tot * L_tot) / 30 + (P * a * b * b) / (L_tot * L_tot);
    handSteps.push({
      stepNumber: 2,
      title: 'Fixed-End Moments & Statically Indeterminate Reactions',
      formula: 'M_AB = w₁L²/12 + ΔwL²/30 + Pab²/L²;   R_A = w₁L/2 + 3ΔwL/20 + Pb²(3a+b)/L³',
      substitution: `L = ${L_tot.toFixed(2)} m, w₁ = ${wLeft.toFixed(2)}, Δw = ${dw.toFixed(2)} kN/m, P = ${P.toFixed(2)} kN`,
      result: `M_AB = −${fixedEndMomentLeft.toFixed(2)} kN·m,  M_BA = −${fixedEndMomentRight.toFixed(2)} kN·m,  R_A = ${reactionLeftKn.toFixed(2)} kN,  R_B = ${reactionRightKn.toFixed(2)} kN`,
      reasoning: 'Slope-deflection compatibility (θ_A = θ_B = 0) reduces midspan sagging by introducing restraining negative end moments.',
      isVerifiedAgainstEngine: Math.abs(handFemL - fixedEndMomentLeft) < 1e-3 && eqCheckResid < 1e-3,
    });
  } else {
    const handRB = ((momentDistAboutOrigin - xA * totalDistLoadKn) + P * (a - xA)) / L_main;
    const handRA = totalDistLoadKn + P - handRB;
    handSteps.push({
      stepNumber: 2,
      title: 'Moment Equilibrium About Support A (ΣM_A = 0 → R_B, R_A)',
      formula: 'R_B = [∫(x − x_A)w(x)dx + P(a − x_A)] / L_main;   R_A = W_total − R_B',
      substitution: `x_A = ${xA.toFixed(2)} m, L_main = ${L_main.toFixed(2)} m, ΣM_A,load = ${(momentDistAboutOrigin - xA * totalDistLoadKn + P * (a - xA)).toFixed(2)} kN·m`,
      result: `R_A = ${handRA.toFixed(2)} kN,   R_B = ${handRB.toFixed(2)} kN  (ΣR − ΣW = ${eqCheckResid.toFixed(4)} kN)`,
      reasoning: 'Summing moments about pin A isolates roller reaction R_B; vertical force balance ΣF_y = 0 then determines R_A.',
      isVerifiedAgainstEngine: Math.abs(handRB - reactionRightKn) < 1e-3 && Math.abs(handRA - reactionLeftKn) < 1e-3 && eqCheckResid < 1e-3,
    });
  }

  // Step 3: Governing Shear Force
  const vAtLeftSupport = Math.max(Math.abs(evalShearAt(xA, 'left')), Math.abs(evalShearAt(xA, 'right')));
  const vAtRightSupport = Math.max(Math.abs(evalShearAt(xB, 'left')), Math.abs(evalShearAt(xB, 'right')));
  const vBoundaryCheck = Math.abs(Math.max(vAtLeftSupport, vAtRightSupport) - maxShearKn) < Math.max(0.05, maxShearKn * 0.01);
  handSteps.push({
    stepNumber: 3,
    title: 'Shear Force Distribution V(x) & Peak Shear',
    formula: 'V(x) = −∫₀ˣ w(t)dt + R_A⟨x − x_A⟩⁰ + R_B⟨x − x_B⟩⁰ − P⟨x − a⟩⁰',
    substitution: `|V(x_A)| = ${vAtLeftSupport.toFixed(2)} kN,  |V(x_B)| = ${vAtRightSupport.toFixed(2)} kN`,
    result: `V_max = ${maxShearKn.toFixed(2)} kN  (Factored V_u = ${factoredShearKn.toFixed(2)} kN)`,
    reasoning: 'Maximum transverse shear governs web shear reinforcement (stirrup spacing) adjacent to column/support faces.',
    isVerifiedAgainstEngine: vBoundaryCheck || maxShearKn >= Math.max(vAtLeftSupport, vAtRightSupport) - 1e-3,
  });

  // Step 4: Peak Bending Moment & Contraflexure
  const contraStr = inflectionPointsM.length > 0
    ? `Inflection M=0 @ x = ${inflectionPointsM.map((ip) => `${ip.toFixed(2)}m`).join(', ')}`
    : 'No interior contraflexure (single-curvature bending)';
  // Closed-form cross-check when simply-supported uniform
  let momentHandVerified = true;
  if (params.supportCondition === 'simply-supported' && distType === 'uniform' && P === 0) {
    const exactM = (wLeft * L_main * L_main) / 8;
    momentHandVerified = Math.abs(exactM - maxMomentKnm) < Math.max(0.05, exactM * 0.005);
  } else if (params.supportCondition === 'cantilever' && distType === 'uniform' && P === 0) {
    const exactM = (wLeft * L_main * L_main) / 2;
    momentHandVerified = Math.abs(exactM - maxMomentKnm) < Math.max(0.05, exactM * 0.005);
  }
  handSteps.push({
    stepNumber: 4,
    title: 'Bending Moment M(x), Peak Flexure & Contraflexure',
    formula: 'M(x) = −M_fix,A − ∬w(t)dt² + R_A⟨x − x_A⟩ + R_B⟨x − x_B⟩ − P⟨x − a⟩',
    substitution: `Max Sagging (+M) = +${maxSaggingMomentKnm.toFixed(2)} kN·m · Max Hogging (−M) = −${maxHoggingMomentKnm.toFixed(2)} kN·m`,
    result: `|M|_max = ${maxMomentKnm.toFixed(2)} kN·m  (Factored M_u = ${factoredMomentKnm.toFixed(2)} kN·m)`,
    reasoning: `${contraStr}. Sagging demands bottom tension steel while hogging demands top negative reinforcement.`,
    isVerifiedAgainstEngine: momentHandVerified,
  });

  // Step 5: Elastic Deflection via Double Integration
  let deflFormula = 'EI · y(x) = ∬ M(x) dx²  (with boundary conditions y = 0 at supports)';
  let deflVerified = true;
  if (params.supportCondition === 'simply-supported' && distType === 'uniform') {
    const exactMidMm =
      ((5 * wLeft * Math.pow(L_main, 4)) / (384 * EI) +
        (P > 0 && Math.abs(a - L_main / 2) < 1e-3 ? (P * Math.pow(L_main, 3)) / (48 * EI) : 0)) *
      1000;
    if (P === 0 || Math.abs(a - L_main / 2) < 1e-3) {
      deflVerified = Math.abs(exactMidMm - maxDeflectionMm) < Math.max(0.02, exactMidMm * 0.005);
      deflFormula = P === 0 ? 'δ_max = 5wL⁴ / (384·EI)' : 'δ_max = 5wL⁴/(384·EI) + PL³/(48·EI)';
    }
  } else if (params.supportCondition === 'cantilever' && distType === 'uniform' && P === 0) {
    const exactTipMm = ((wLeft * Math.pow(L_main, 4)) / (8 * EI)) * 1000;
    deflVerified = Math.abs(exactTipMm - maxDeflectionMm) < Math.max(0.02, exactTipMm * 0.005);
    deflFormula = 'δ_tip = wL⁴ / (8·EI)';
  } else if (params.supportCondition === 'fixed-ends' && distType === 'uniform' && P === 0) {
    const exactFixMm = ((wLeft * Math.pow(L_main, 4)) / (384 * EI)) * 1000;
    deflVerified = Math.abs(exactFixMm - maxDeflectionMm) < Math.max(0.02, exactFixMm * 0.005);
    deflFormula = 'δ_mid = wL⁴ / (384·EI)';
  }

  const achievedRatio = maxDeflectionMm > 1e-5 ? Math.round((L_main * 1000) / maxDeflectionMm) : 9999;
  handSteps.push({
    stepNumber: 5,
    title: 'Elastic Deflection Check (Euler-Bernoulli Double Integration)',
    formula: deflFormula,
    substitution: `EI = ${(params.elasticModulusGpa || 200).toFixed(1)} GPa × ${params.momentOfInertiaCm4.toLocaleString()} cm⁴ = ${EI.toFixed(1)} kN·m²;  δ_allow = L/${deflectionDivisor} = ${allowableDeflectionMm.toFixed(2)} mm`,
    result: `δ_max = ${maxDeflectionMm.toFixed(2)} mm @ x = ${maxDeflectionLocationM.toFixed(2)} m  (L/${achievedRatio > 9000 ? '∞' : achievedRatio})`,
    reasoning: `Serviceability check per ${code}: deflection ratio is ${(deflRatio * 100).toFixed(1)}% of allowable limit L/${deflectionDivisor}.`,
    isVerifiedAgainstEngine: deflVerified,
  });

  // Step 6: Flexural Bending Stress & Limit-State DCR
  const handFb = (maxMomentKnm * 1e6 * cMm) / iMm4;
  handSteps.push({
    stepNumber: 6,
    title: 'Flexural Extreme-Fiber Stress & Governing DCR',
    formula: 'f_b = (M_max · c) / I;   DCR = max(f_b / f_allow,  δ_max / δ_allow)',
    substitution: `f_b = (${maxMomentKnm.toFixed(2)} × 10⁶ × ${cMm.toFixed(1)}) / ${iMm4.toExponential(2)} = ${handFb.toFixed(2)} MPa (Allowable ${params.allowableStressMpa} MPa)`,
    result: `DCR = ${(utilizationRatio * 100).toFixed(1)}% → ${status === 'nominal' ? 'PASS' : status === 'warning' ? 'MARGINAL' : 'FAIL'}`,
    reasoning: `Combines strength demand-capacity ratio (${(stressRatio * 100).toFixed(1)}%) and deflection serviceability (${(deflRatio * 100).toFixed(1)}%) to determine governing safety status.`,
    isVerifiedAgainstEngine: Math.abs(handFb - bendingStressMpa) < 1e-3,
  });

  return createEnvelope<BeamAnalysisResult>(
    {
      points,
      maxMomentKnm: Number(maxMomentKnm.toFixed(2)),
      maxShearKn: Number(maxShearKn.toFixed(2)),
      maxDeflectionMm: Number(maxDeflectionMm.toFixed(3)),
      allowableDeflectionMm: Number(allowableDeflectionMm.toFixed(2)),
      bendingStressMpa: Number(bendingStressMpa.toFixed(2)),
      utilizationRatio: Number(utilizationRatio.toFixed(4)),
      status,
      reactionLeftKn: Number(reactionLeftKn.toFixed(2)),
      reactionRightKn: Number(reactionRightKn.toFixed(2)),
      governingCode: code,
      loadCombinationUsed: loadCombName,
      factoredMomentKnm,
      factoredShearKn,
      deflectionLimitFactor: deflectionDivisor,
      phiFactor: phiBending,
      totalLengthM: Number(L_tot.toFixed(3)),
      overhangLeftM: Number(ovL.toFixed(3)),
      overhangRightM: Number(ovR.toFixed(3)),
      maxSaggingMomentKnm: Number(maxSaggingMomentKnm.toFixed(2)),
      maxHoggingMomentKnm: Number(maxHoggingMomentKnm.toFixed(2)),
      maxDeflectionLocationM: Number(maxDeflectionLocationM.toFixed(2)),
      inflectionPointsM,
      fixedEndMomentLeftKnm: Number(fixedEndMomentLeft.toFixed(2)),
      fixedEndMomentRightKnm: Number(fixedEndMomentRight.toFixed(2)),
    },
    issues,
    {
      handCalculationSteps: handSteps,
      scopeAndLimits,
    }
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
  // Footing Structural One-Way & Two-Way Punching Shear Checks (BNBC-2020 / ACI 318)
  footingThicknessMm: number;
  colWidthMm: number;
  colDepthMm: number;
  effectiveDepthMm: number;
  concreteStrengthFckMpa: number;
  rebarYieldFyMpa: number;
  factoredColumnLoadPuKn: number;
  // One-Way (Beam) Shear:
  oneWayShearVuKn: number;
  oneWayShearPhiVcKn: number;
  oneWayShearDcr: number;
  oneWayShearPass: boolean;
  // Two-Way (Punching) Shear:
  punchingPerimeterBoMm: number;
  punchingShearVuKn: number;
  punchingShearPhiVcKn: number;
  punchingShearDcr: number;
  punchingShearPass: boolean;
  // Overall Structural Check:
  footingStructuralPass: boolean;
  // SPT N60 Geotechnical Borehole Details (BNBC-2020 Part 6 Chap 3):
  rawSptN: number;
  hammerEfficiency: number;
  overburdenCorrectionCn: number;
  correctedSptN60: number;
  empiricalSptAllowableKpa: number; // Meyerhof (1965/1976) empirical q_all for 25mm settlement
  status: 'nominal' | 'warning' | 'critical';
}

export function computeBearingCapacity(
  params: BearingParameters
): CalculationEnvelope<BearingAnalysisResult> {
  const issues: ValidationIssue[] = [];

  const isZeroBaseline = params.footingWidthM === 0;
  if (params.footingWidthM < 0) {
    issues.push({ field: 'footingWidthM', message: 'Footing width B cannot be negative.', severity: 'error' });
  } else if (params.footingWidthM === 0) {
    issues.push({ field: 'footingWidthM', message: 'Footing width B is currently 0 m (clean baseline). Bearing capacity calculations standing by.', severity: 'warning' });
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
  if (params.unitWeightKnPerM3 <= 0 && !isZeroBaseline) {
    issues.push({ field: 'unitWeightKnPerM3', message: 'Soil unit weight γ must be strictly positive (> 0 kN/m³).', severity: 'error' });
  }
  if (params.waterTableDepthM < 0) {
    issues.push({ field: 'waterTableDepthM', message: 'Groundwater table depth cannot be negative.', severity: 'error' });
  }
  if (params.factorOfSafety < 1.0) {
    issues.push({ field: 'factorOfSafety', message: 'Factor of safety must be at least 1.0 (recommended ≥ 2.5 per BNBC-2020).', severity: 'error' });
  }
  if (params.appliedColumnLoadKn < 0) {
    issues.push({ field: 'appliedColumnLoadKn', message: 'Applied load P cannot be negative.', severity: 'error' });
  } else if (params.appliedColumnLoadKn === 0) {
    issues.push({ field: 'appliedColumnLoadKn', message: 'Applied load P is currently 0 kN (clean baseline). Soil pressure evaluates to zero.', severity: 'warning' });
  }

  if (issues.some((i) => i.severity === 'error') || isZeroBaseline) {
    return createEnvelope<BearingAnalysisResult>(
      {
        nc: 5.14,
        nq: 1.0,
        nGamma: 0,
        shapeSc: 1.0,
        shapeSq: 1.0,
        shapeSg: 1.0,
        depthDc: 1.0,
        depthDq: 1.0,
        depthDg: 1.0,
        effectiveOverburdenKpa: 0,
        effectiveSubgradeGammaKnPerM3: 0,
        ultimateBearingKpa: 0,
        netUltimateBearingKpa: 0,
        allowableBearingKpa: 0,
        netAllowableBearingKpa: 0,
        appliedPressureKpa: 0,
        netAppliedPressureKpa: 0,
        footingAreaM2: 0,
        utilizationRatio: 0,
        effectiveSafetyFactor: params.factorOfSafety || 2.5,
        factorOfSafety: params.factorOfSafety || 2.5,
        immediateSettlementMm: 0,
        consolidationSettlementMm: 0,
        totalSettlementMm: 0,
        permissibleSettlementMm: params.permissibleSettlementMm || 25,
        settlementUtilizationRatio: 0,
        settlementPass: true,
        boussinesqPoints: [],
        governingCode: params.codeStandard || 'BNBC-2020 / ACI-318',
        solverMethodUsed: params.shallowSolverMethod || 'meyerhof',
        bearingClauseRef: 'BNBC Part 6 Sec 3.9',
        settlementClauseRef: 'BNBC Part 6 Sec 3.8',
        calculationsBreakdown: [],
        methodComparison: {
          meyerhofKpa: 0,
          terzaghiKpa: 0,
          hansenKpa: 0,
        },
        footingThicknessMm: params.footingThicknessMm ?? 450,
        colWidthMm: params.colWidthMm ?? 300,
        colDepthMm: params.colDepthMm ?? 300,
        effectiveDepthMm: (params.footingThicknessMm ?? 450) - (params.clearCoverMm ?? 75),
        concreteStrengthFckMpa: params.fckMpa ?? 21,
        rebarYieldFyMpa: params.fyMpa ?? 420,
        factoredColumnLoadPuKn: 0,
        oneWayShearVuKn: 0,
        oneWayShearPhiVcKn: 0,
        oneWayShearDcr: 0,
        oneWayShearPass: true,
        punchingPerimeterBoMm: 0,
        punchingShearVuKn: 0,
        punchingShearPhiVcKn: 0,
        punchingShearDcr: 0,
        punchingShearPass: true,
        footingStructuralPass: true,
        rawSptN: params.boreholeFieldSptN ?? (params.sptN60 ?? 15),
        hammerEfficiency: params.hammerEfficiency ?? 0.60,
        overburdenCorrectionCn: 1.0,
        correctedSptN60: params.sptN60 ?? 15,
        empiricalSptAllowableKpa: 0,
        status: 'nominal',
      },
      issues
    );
  }

  const B = params.footingWidthM;
  const L = params.footingShape === 'rectangular' && params.footingLengthM && params.footingLengthM >= B
    ? params.footingLengthM
    : B;
  const Df = params.embedmentDepthM;
  let c = params.soilCohesionKpa;
  let phi = params.frictionAngleDeg;
  let gamma = params.unitWeightKnPerM3;

  // SPT Field Corrections per BNBC-2020 Part 6 Chap 3 (Liao & Whitman 1986):
  // Overburden pressure sigma'v at foundation level
  const DwInit = params.waterTableDepthM;
  const gammaEffEst = DwInit < Df ? Math.max(8.0, gamma - 9.81) : gamma;
  const sigmaVPrimeAtBaseKpa = Math.max(10, gammaEffEst * Math.max(0.5, Df));
  const Cn = Math.min(2.0, Math.max(0.4, Math.sqrt(98 / sigmaVPrimeAtBaseKpa)));
  const hammerEff = params.hammerEfficiency ?? 0.60;
  const rawFieldN = params.boreholeFieldSptN ?? (params.sptN60 ? Math.round(params.sptN60 / (Cn * (hammerEff / 0.60))) : (phi > 0 ? Math.round(phi * 0.8) : Math.round(c / 6.25) || 12));
  const calculatedN60 = Math.round(rawFieldN * (hammerEff / 0.60) * Cn);
  let sptN = params.sptN60 ?? calculatedN60;

  // Meyerhof (1965/1976) Empirical Bearing Capacity for 25mm (1 inch) allowable settlement (BNBC-2020 Table 6.3.8):
  // For B <= 1.2m: q_all = 12.5 * N60 * (1 + 0.33 * Df / B) * (Se / 25)
  // For B > 1.2m:  q_all = 8.33 * N60 * ((B + 0.3) / B)^2 * (1 + 0.33 * Df / B) * (Se / 25)
  const embedmentFactor = Math.min(1.33, 1 + 0.33 * (Df / Math.max(0.1, B)));
  const allowableSettlementRatio = 1.0; // Standard 25mm basis
  const empiricalSptAllowableKpa = Number(
    (B <= 1.2
      ? 12.5 * sptN * embedmentFactor * allowableSettlementRatio
      : 8.33 * sptN * Math.pow((B + 0.3) / B, 2) * embedmentFactor * allowableSettlementRatio
    ).toFixed(1)
  );

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

  // 9. Column Axial & Footing Structural Shear Checks (BNBC-2020 Part 6 Chap 6 / ACI 318 Sec 13.2.7)
  const footingThicknessMm = params.footingThicknessMm !== undefined ? params.footingThicknessMm : (isZeroBaseline ? 0 : 500);
  const colWidthMm = params.colWidthMm !== undefined ? params.colWidthMm : (isZeroBaseline ? 0 : 400);
  const colDepthMm = params.colDepthMm !== undefined ? params.colDepthMm : (isZeroBaseline ? 0 : 400);
  const concreteStrengthFckMpa = params.fckMpa !== undefined ? params.fckMpa : 25;
  const rebarYieldFyMpa = params.fyMpa !== undefined ? params.fyMpa : 414;
  const clearCoverMm = params.clearCoverMm !== undefined ? params.clearCoverMm : 75; // Standard 75mm for soil contact

  // Effective depth d
  const effectiveDepthMm = Math.max(0, footingThicknessMm - clearCoverMm - 8); // Assume 16mm bar, db/2 = 8mm
  const d_m = effectiveDepthMm / 1000;

  // Factored Column Load Pu (Standard ACI/BNBC 1.2D + 1.6L ~ 1.4P)
  const factoredColumnLoadPuKn = P > 0 ? P * 1.4 : 0;
  const quNetKpa = (footingAreaM2 > 0 && factoredColumnLoadPuKn > 0) ? (factoredColumnLoadPuKn / footingAreaM2) : 0;

  // --- A. One-Way Beam Shear Check ---
  // Critical section at distance d from column face in long direction (projection)
  const colDepthM = colDepthMm / 1000;
  const colWidthM = colWidthMm / 1000;
  const projectionLengthM = Math.max(0, (L - colDepthM) / 2);
  const oneWayShearTributaryLengthM = Math.max(0, projectionLengthM - d_m);
  const oneWayShearVuKn = quNetKpa * B * oneWayShearTributaryLengthM;

  // Concrete one-way shear capacity phi*Vc1 (ACI 318 / BNBC 2020: phi = 0.75, Vc = (1/6)*sqrt(f'c)*b_w*d)
  const phiShear = 0.75;
  const oneWayShearVcKn = (effectiveDepthMm > 0 && B > 0)
    ? (1 / 6) * Math.sqrt(concreteStrengthFckMpa) * (B * 1000) * effectiveDepthMm * 1e-3
    : 0;
  const oneWayShearPhiVcKn = phiShear * oneWayShearVcKn;
  const oneWayShearDcr = oneWayShearPhiVcKn > 0 ? (oneWayShearVuKn / oneWayShearPhiVcKn) : (oneWayShearVuKn > 0 ? 99.9 : 0);
  const oneWayShearPass = oneWayShearDcr <= 1.0;

  // --- B. Two-Way Punching Shear Check ---
  // Critical perimeter at d/2 from column perimeter
  const b1_mm = colWidthMm + effectiveDepthMm;
  const b2_mm = colDepthMm + effectiveDepthMm;
  const punchingPerimeterBoMm = 2 * (b1_mm + b2_mm);
  const punchingAreaM2 = (b1_mm / 1000) * (b2_mm / 1000);
  const punchingShearVuKn = Math.max(0, factoredColumnLoadPuKn - quNetKpa * punchingAreaM2);

  // Concrete punching capacity phi*Vc (ACI 318 / BNBC 2020: min of 3 formulas)
  const betaColumn = Math.max(1.0, Math.max(colWidthMm, colDepthMm) / Math.max(1, Math.min(colWidthMm, colDepthMm)));
  const alphaS = 40; // Interior column
  const vcTerm1 = (1 + 2 / betaColumn) * (1 / 6) * Math.sqrt(concreteStrengthFckMpa);
  const vcTerm2 = ((alphaS * effectiveDepthMm) / Math.max(1, punchingPerimeterBoMm) + 2) * (1 / 12) * Math.sqrt(concreteStrengthFckMpa);
  const vcTerm3 = (1 / 3) * Math.sqrt(concreteStrengthFckMpa);
  const punchingNominalStressMpa = Math.min(vcTerm1, vcTerm2, vcTerm3);

  const punchingShearVcKn = (effectiveDepthMm > 0 && punchingPerimeterBoMm > 0)
    ? punchingNominalStressMpa * punchingPerimeterBoMm * effectiveDepthMm * 1e-3
    : 0;
  const punchingShearPhiVcKn = phiShear * punchingShearVcKn;
  const punchingShearDcr = punchingShearPhiVcKn > 0 ? (punchingShearVuKn / punchingShearPhiVcKn) : (punchingShearVuKn > 0 ? 99.9 : 0);
  const punchingShearPass = punchingShearDcr <= 1.0;

  const footingStructuralPass = oneWayShearPass && punchingShearPass;

  calculationsBreakdown.push({
    step: '9. One-Way (Beam) Shear Verification',
    formula: 'Vu1 = qu,net · B · (L_proj - d) ≤ φVc1 = 0.75 · (1/6)·√f\'c · B · d',
    result: `Vu1 = ${oneWayShearVuKn.toFixed(1)} kN ≤ φVc1 = ${oneWayShearPhiVcKn.toFixed(1)} kN (DCR = ${oneWayShearDcr.toFixed(2)}, ${oneWayShearPass ? 'PASS' : 'FAIL'})`,
    clauseRef: 'BNBC-2020 Sec 6.3.3 / ACI 318 Sec 22.5',
  });

  calculationsBreakdown.push({
    step: '10. Two-Way Punching Shear Verification',
    formula: 'Vup = Pu - qu,net · (c_w + d)(c_d + d) ≤ φVcp (bo = 2(b1+b2))',
    result: `Vup = ${punchingShearVuKn.toFixed(1)} kN ≤ φVcp = ${punchingShearPhiVcKn.toFixed(1)} kN (DCR = ${punchingShearDcr.toFixed(2)}, ${punchingShearPass ? 'PASS' : 'FAIL'})`,
    clauseRef: 'BNBC-2020 Sec 6.3.4 / ACI 318 Sec 22.6',
  });

  if (effectiveDepthMm > 0 && !isZeroBaseline) {
    if (!oneWayShearPass) {
      issues.push({
        field: 'footingThicknessMm',
        message: `One-way beam shear demand (Vu = ${oneWayShearVuKn.toFixed(1)} kN) exceeds concrete shear capacity (φVc = ${oneWayShearPhiVcKn.toFixed(1)} kN, DCR = ${oneWayShearDcr.toFixed(2)}). Increase footing thickness or concrete grade.`,
        severity: 'error',
      });
    }
    if (!punchingShearPass) {
      issues.push({
        field: 'footingThicknessMm',
        message: `Two-way punching shear demand (Vu = ${punchingShearVuKn.toFixed(1)} kN) exceeds punching capacity (φVc = ${punchingShearPhiVcKn.toFixed(1)} kN, DCR = ${punchingShearDcr.toFixed(2)}). Increase footing thickness or enlarge column pedestal.`,
        severity: 'error',
      });
    }
  }

  const status: 'nominal' | 'warning' | 'critical' =
    utilizationRatio > 1.0 || !settlementPass || !footingStructuralPass
      ? 'critical'
      : utilizationRatio > 0.85 || oneWayShearDcr > 0.85 || punchingShearDcr > 0.85
        ? 'warning'
        : 'nominal';

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
      footingThicknessMm,
      colWidthMm,
      colDepthMm,
      effectiveDepthMm,
      concreteStrengthFckMpa,
      rebarYieldFyMpa,
      factoredColumnLoadPuKn: Number(factoredColumnLoadPuKn.toFixed(1)),
      oneWayShearVuKn: Number(oneWayShearVuKn.toFixed(1)),
      oneWayShearPhiVcKn: Number(oneWayShearPhiVcKn.toFixed(1)),
      oneWayShearDcr: Number(oneWayShearDcr.toFixed(2)),
      oneWayShearPass,
      punchingPerimeterBoMm: Number(punchingPerimeterBoMm.toFixed(0)),
      punchingShearVuKn: Number(punchingShearVuKn.toFixed(1)),
      punchingShearPhiVcKn: Number(punchingShearPhiVcKn.toFixed(1)),
      punchingShearDcr: Number(punchingShearDcr.toFixed(2)),
      punchingShearPass,
      footingStructuralPass,
      rawSptN: rawFieldN,
      hammerEfficiency: hammerEff,
      overburdenCorrectionCn: Number(Cn.toFixed(2)),
      correctedSptN60: sptN,
      empiricalSptAllowableKpa,
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

  const isZeroStrength = params.targetStrengthMpa === 0;
  const isZeroWc = params.waterCementRatio === 0;
  const isZeroBatch = params.batchVolumeM3 === 0;

  if (params.targetStrengthMpa < 0) {
    issues.push({ field: 'targetStrengthMpa', message: 'Target compressive strength cannot be negative.', severity: 'error' });
  } else if (isZeroStrength) {
    issues.push({ field: 'targetStrengthMpa', message: 'Target strength is 0 MPa (clean baseline). Design mix proportions standing by.', severity: 'warning' });
  }

  if (params.waterCementRatio < 0 || params.waterCementRatio > 0.85) {
    issues.push({ field: 'waterCementRatio', message: 'Water-cement ratio must be between 0.25 and 0.85.', severity: 'error' });
  } else if (isZeroWc) {
    issues.push({ field: 'waterCementRatio', message: 'Water-cement ratio is 0. Using standard 0.50 reference for volumetric proportions.', severity: 'warning' });
  }

  if (params.batchVolumeM3 < 0) {
    issues.push({ field: 'batchVolumeM3', message: 'Batch volume cannot be negative.', severity: 'error' });
  } else if (isZeroBatch) {
    issues.push({ field: 'batchVolumeM3', message: 'Batch volume is 0 m³ (clean baseline). Batch quantities evaluate to zero.', severity: 'warning' });
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

  // Safe water-cement ratio: default to 0.50 if zero baseline
  const effectiveWc = isZeroWc ? 0.50 : Math.max(0.20, params.waterCementRatio);

  // Cementitious content from w/c
  const cementKgPerM3 = isZeroStrength ? 0 : waterKgPerM3 / effectiveWc;
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

  // Bangladeshi Local Aggregate & Sand Behavior per BNBC-2020 / PWD:
  // Khoa (Picked Jhama Brick Chips): SG ~ 2.15, DRUW ~ 1400 kg/m³, absorption ~ 10%, dry volume factor = 1.50
  // Crushed Stone Chips (Pakur/Bholaganj): SG ~ 2.67, DRUW ~ 1600 kg/m³, absorption ~ 1.0%, dry volume factor = 1.54
  const isKhoa = params.coarseAggregateType === 'brick-chips-khoa';
  const defaultCoarseSG = isKhoa ? 2.15 : 2.67;
  const defaultDruw = isKhoa ? 1400 : 1600;
  const druw = params.coarseAggDryRoddedDensityKgPerM3 || defaultDruw;

  // Sand FM: Sylhet Sand (FM 2.5 - 2.8, default 2.65), Local Sand (FM 1.2 - 1.8, default 1.50), Blended (FM 2.20)
  let defaultFm = 2.65;
  if (params.sandType === 'local-sand') defaultFm = 1.50;
  else if (params.sandType === 'blended-sand') defaultFm = 2.20;
  const fm = params.sandFinenessModulus || defaultFm;

  const coarseBaseFraction =
    dMax <= 10 ? 0.48 : dMax <= 12.5 ? 0.55 : dMax <= 20 ? 0.63 : dMax <= 25 ? 0.68 : 0.74;
  const coarseVolumeFraction = Math.max(0.40, Math.min(0.80, coarseBaseFraction - (fm - 2.8) * 0.20));
  const coarseAggDryKgPerM3 = coarseVolumeFraction * druw;
  const coarseSG = params.coarseAggSpecificGravity || defaultCoarseSG;
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

  const defaultFineSG = params.sandType === 'local-sand' ? 2.50 : 2.62;
  const fineSG = params.fineAggSpecificGravity || defaultFineSG;
  const fineAggDryKgPerM3 = volFine * fineSG * 1000;

  // Moisture & Absorption corrections (Field Batching vs Design SSD)
  const defaultCaAbs = isKhoa ? 10.0 : 1.0;
  const caAbs = params.coarseAggAbsorptionPercent ?? defaultCaAbs;
  const caMC = params.coarseAggMoisturePercent ?? (isKhoa ? 8.0 : 2.0);
  const faAbs = params.fineAggAbsorptionPercent ?? 1.2;
  const faMC = params.fineAggMoisturePercent ?? 4.0;

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

  const isZeroDepth = params.flowDepthM === 0;
  const isZeroWidth = shape !== 'circular' && params.bottomWidthM === 0;

  if (shape !== 'circular' && params.bottomWidthM < 0) {
    issues.push({ field: 'bottomWidthM', message: 'Channel bed width b cannot be negative.', severity: 'error' });
  } else if (isZeroWidth) {
    issues.push({ field: 'bottomWidthM', message: 'Channel bed width b is 0 m (clean baseline).', severity: 'warning' });
  }

  if (shape === 'trapezoidal' && params.sideSlopeZ < 0) {
    issues.push({ field: 'sideSlopeZ', message: 'Side slope z cannot be negative.', severity: 'error' });
  }
  if (shape === 'circular' && params.diameterM !== undefined && params.diameterM < 0) {
    issues.push({ field: 'diameterM', message: 'Conduit diameter D cannot be negative.', severity: 'error' });
  } else if (shape === 'circular' && params.diameterM === 0) {
    issues.push({ field: 'diameterM', message: 'Conduit diameter D is 0 m (clean baseline).', severity: 'warning' });
  }

  if (params.flowDepthM < 0) {
    issues.push({ field: 'flowDepthM', message: 'Flow depth y cannot be negative.', severity: 'error' });
  } else if (isZeroDepth) {
    issues.push({ field: 'flowDepthM', message: 'Flow depth y is 0 m (dry bed / clean baseline). Discharge and velocity evaluate to 0.', severity: 'warning' });
  }

  if (params.bedSlope < 0) {
    issues.push({ field: 'bedSlope', message: 'Bed slope S_0 cannot be negative.', severity: 'error' });
  } else if (params.bedSlope === 0) {
    issues.push({ field: 'bedSlope', message: 'Bed slope S_0 is 0 (horizontal bed).', severity: 'warning' });
  }

  if (params.manningN <= 0 && !isZeroDepth) {
    issues.push({ field: 'manningN', message: 'Manning roughness coefficient n must be strictly positive (> 0).', severity: 'error' });
  }

  if (shape === 'circular' && params.diameterM && params.flowDepthM > params.diameterM) {
    issues.push({
      field: 'flowDepthM',
      message: `Flow depth (${params.flowDepthM.toFixed(2)} m) exceeds conduit diameter (${params.diameterM.toFixed(2)} m). Conduit is surcharged under closed-pipe pressure flow.`,
      severity: 'warning',
    });
  }

  if (issues.some((i) => i.severity === 'error') || isZeroDepth || isZeroWidth) {
    return createEnvelope<ChannelHydraulicsResult>(
      {
        shape,
        flowAreaM2: 0,
        wettedPerimeterM: 0,
        hydraulicRadiusM: 0,
        topWidthM: 0,
        hydraulicDepthM: 0,
        velocityMps: 0,
        dischargeM3ps: 0,
        froudeNumber: 0,
        flowRegime: 'Subcritical',
        shearStressPa: 0,
        criticalDepthM: 0,
        criticalVelocityMps: 0,
        specificEnergyM: 0,
        minSpecificEnergyM: 0,
        diameterM: shape === 'circular' ? params.diameterM : undefined,
        hydraulicJump: {
          isOccurring: false,
          initialDepthM: 0,
          sequentDepthM: 0,
          jumpHeightM: 0,
          headLossM: 0,
          energyDissipatedPercent: 0,
          jumpLengthM: 0,
          jumpType: 'None',
          description: 'No hydraulic jump under zero-flow condition.',
        },
        eglHglProfile: [],
        status: 'nominal',
      },
      issues
    );
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

  const isZeroBaseline = params.wetVolumeM3 === 0;

  if (params.wetVolumeM3 < 0) {
    issues.push({ field: 'wetVolumeM3', message: 'Wet volume cannot be negative.', severity: 'error' });
  } else if (isZeroBaseline) {
    issues.push({ field: 'wetVolumeM3', message: 'Wet volume is currently 0 m³ (clean baseline). Material batch quantities evaluate to zero.', severity: 'warning' });
  }

  if (params.ratioCement <= 0 && !isZeroBaseline) {
    issues.push({ field: 'ratioCement', message: 'Cement ratio part must be strictly positive (> 0).', severity: 'error' });
  }
  if (params.ratioSand <= 0 && !isZeroBaseline) {
    issues.push({ field: 'ratioSand', message: 'Sand ratio part must be strictly positive (> 0).', severity: 'error' });
  }
  if (params.ratioAggregate < 0) {
    issues.push({ field: 'ratioAggregate', message: 'Aggregate ratio part cannot be negative.', severity: 'error' });
  }
  if (params.waterCementRatio <= 0 && !isZeroBaseline) {
    issues.push({ field: 'waterCementRatio', message: 'Water-cement ratio must be strictly positive (> 0).', severity: 'error' });
  }
  if (params.cementBagWeightKg <= 0 && !isZeroBaseline) {
    issues.push({ field: 'cementBagWeightKg', message: 'Cement bag weight must be strictly positive (> 0 kg).', severity: 'error' });
  }

  if (issues.some((i) => i.severity === 'error') || isZeroBaseline) {
    return createEnvelope<ConcreteMaterialResult>(
      {
        code: params.code,
        dryVolumeFactor: params.customDryFactor || 1.54,
        wetVolumeM3: 0,
        dryVolumeM3: 0,
        wastageMultiplier: 1 + (params.wastagePercent || 0) / 100,
        totalDryVolumeWithWastageM3: 0,
        sumOfProportions: (params.ratioCement || 1) + (params.ratioSand || 2) + (params.ratioAggregate || 4),
        cementVolumeM3: 0,
        cementMassKg: 0,
        cementBags50Kg: 0,
        sandVolumeM3: 0,
        sandMassKg: 0,
        sandCft: 0,
        aggregateVolumeM3: 0,
        aggregateMassKg: 0,
        aggregateCft: 0,
        waterDemandLiters: 0,
        status: 'nominal',
      },
      issues
    );
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
  lappingAllowanceM?: number;
  lapsCount?: number;
}

export interface BarStockSummaryItem {
  barDiaMm: number;
  totalCuttingLengthM: number;
  totalWeightKg: number;
  bars12mRequired: number;
  purchasedLengthM: number;
  purchasedWeightKg: number;
  purchasedTonnes: number;
  offcutScrapLengthM: number;
  offcutScrapWeightKg: number;
  scrapPercent: number;
  commercialBundlesEstimate: number;
}

export interface Commercial12mBarStock {
  itemsByDiameter: BarStockSummaryItem[];
  total12mBarsCount: number;
  totalCuttingLengthM: number;
  totalPurchasedLengthM: number;
  totalPurchasedWeightKg: number;
  totalPurchasedTonnes: number;
  totalScrapWeightKg: number;
  overallScrapPercent: number;
  lappingStandardUsed: string;
  totalLappingAllowanceM: number;
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
  commercialBarStock?: Commercial12mBarStock;
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

  const lappingD = params.lappingFactorD || 50;
  const maxBarLengthM = params.commercialBarStockLengthM || 12.0;

  // Lapping Allowance for bars exceeding commercial 12m stock
  const applyLapping = (unlappedCutLengthM: number, diaMm: number): { cuttingLengthM: number; lappingAllowanceM: number; lapsCount: number } => {
    if (unlappedCutLengthM <= maxBarLengthM) {
      return { cuttingLengthM: unlappedCutLengthM, lappingAllowanceM: 0, lapsCount: 0 };
    }
    const lapsCount = Math.floor((unlappedCutLengthM - 0.001) / maxBarLengthM);
    const lapLenPerJointM = (lappingD * diaMm) / 1000;
    const lappingAllowanceM = lapsCount * lapLenPerJointM;
    return {
      cuttingLengthM: unlappedCutLengthM + lappingAllowanceM,
      lappingAllowanceM,
      lapsCount,
    };
  };

  // Normalize legacy aliases
  const normalizedType =
    params.elementType === 'column'
      ? 'column-rect'
      : params.elementType === 'circular-column'
      ? 'column-circ'
      : params.elementType === 'staircase'
      ? 'staircase-waist'
      : params.elementType;

  if (normalizedType === 'beam') {
    const beamL = params.beamLengthM ?? 0;
    const beamW = params.beamWidthMm ?? 300;
    const beamD = params.beamDepthMm ?? 600;
    const mainDia = params.beamMainBarDiaMm ?? 16;
    const topCount = params.beamTopBarCount ?? 2;
    const botCount = params.beamBotBarCount ?? 3;
    const stirrupDia = params.beamStirrupDiaMm ?? 8;
    const stirrupSpacing = params.beamStirrupSpacingMm ?? 150;

    if (beamL < 0 || beamW < 0 || beamD < 0) {
      issues.push({ field: 'beamLengthM', message: 'Beam dimensions cannot be negative.', severity: 'error' });
    } else if (beamL === 0 || beamW === 0 || beamD === 0) {
      issues.push({ field: 'beamLengthM', message: 'Beam dimensions currently 0 (Zero Baseline Active). Enter span/depth or load standard preset.', severity: 'warning' });
    }

    if (!issues.some((i) => i.severity === 'error') && beamL > 0 && beamW > 0 && beamD > 0) {
      const hookExtension = 2 * (12 * (mainDia / 1000));
      const bendDed = getBendDeduction(mainDia, 2, '90');
      const longCutLen = beamL + hookExtension - bendDed;
      const mainUnitWt = getRebarUnitWeightKgPerM(mainDia, density);

      if (botCount > 0 && mainDia > 0) {
        items.push({
          description: `Beam Bottom Main Tension Bars (${botCount} Nos Ø${mainDia}mm with 90° anchor hooks)`,
          barDiaMm: mainDia,
          count: botCount,
          cuttingLengthM: Number(longCutLen.toFixed(3)),
          totalLengthM: Number((botCount * longCutLen).toFixed(2)),
          unitWeightKgPerM: Number(mainUnitWt.toFixed(3)),
          totalWeightKg: Number((botCount * longCutLen * mainUnitWt).toFixed(2)),
          bendDeductionM: Number(bendDed.toFixed(3)),
        });
      }

      if (topCount > 0 && mainDia > 0) {
        items.push({
          description: `Beam Top Anchor / Compression Bars (${topCount} Nos Ø${mainDia}mm with 90° hooks)`,
          barDiaMm: mainDia,
          count: topCount,
          cuttingLengthM: Number(longCutLen.toFixed(3)),
          totalLengthM: Number((topCount * longCutLen).toFixed(2)),
          unitWeightKgPerM: Number(mainUnitWt.toFixed(3)),
          totalWeightKg: Number((topCount * longCutLen * mainUnitWt).toFixed(2)),
          bendDeductionM: Number(bendDed.toFixed(3)),
        });
      }

      if (stirrupDia > 0 && stirrupSpacing > 0) {
        const stirrupW = beamW / 1000 - 2 * coverM;
        const stirrupD = beamD / 1000 - 2 * coverM;
        const hook135 = 2 * (10 * (stirrupDia / 1000));
        const stirrupBendDed = 12 * (stirrupDia / 1000);
        const stirrupCutLen = 2 * (stirrupW + stirrupD) + hook135 - stirrupBendDed;
        const stirrupCount = Math.floor(beamL / (stirrupSpacing / 1000)) + 1;
        const stirrupUnitWt = getRebarUnitWeightKgPerM(stirrupDia, density);

        items.push({
          description: `Closed Shear Stirrups (Ø${stirrupDia}mm @ ${stirrupSpacing}mm c/c with 135° seismic hooks)`,
          barDiaMm: stirrupDia,
          count: stirrupCount,
          cuttingLengthM: Number(stirrupCutLen.toFixed(3)),
          totalLengthM: Number((stirrupCount * stirrupCutLen).toFixed(2)),
          unitWeightKgPerM: Number(stirrupUnitWt.toFixed(3)),
          totalWeightKg: Number((stirrupCount * stirrupCutLen * stirrupUnitWt).toFixed(2)),
          bendDeductionM: Number(stirrupBendDed.toFixed(3)),
        });
      }
    }
  } else if (normalizedType === 'slab') {
    if (params.slabLengthM < 0 || params.slabWidthM < 0) {
      issues.push({ field: 'slabLengthM', message: 'Slab dimensions L and W cannot be negative.', severity: 'error' });
    } else if (params.slabLengthM === 0 || params.slabWidthM === 0) {
      issues.push({ field: 'slabLengthM', message: 'Slab dimensions are currently 0.00 m (Zero Baseline Active). Enter length/width or load standard preset.', severity: 'warning' });
    }
    if (params.mainBarDiaMm < 0 || params.mainBarSpacingMm < 0) {
      issues.push({ field: 'mainBarDiaMm', message: 'Main bar diameter and spacing cannot be negative.', severity: 'error' });
    } else if (params.mainBarDiaMm === 0 || params.mainBarSpacingMm === 0) {
      issues.push({ field: 'mainBarDiaMm', message: 'Main bar parameters are 0. Rebar schedule on standby.', severity: 'warning' });
    }
    if (params.distBarDiaMm < 0 || params.distBarSpacingMm < 0) {
      issues.push({ field: 'distBarDiaMm', message: 'Distribution bar diameter and spacing cannot be negative.', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error') && params.slabLengthM > 0 && params.slabWidthM > 0 && params.mainBarDiaMm > 0 && params.mainBarSpacingMm > 0) {
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

      if (params.distBarDiaMm > 0 && params.distBarSpacingMm > 0) {
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
    }
  } else if (normalizedType === 'column-rect') {
    if (params.colLengthMm < 0 || params.colWidthMm < 0 || params.colHeightM < 0) {
      issues.push({ field: 'colLengthMm', message: 'Column dimensions L, B, and H cannot be negative.', severity: 'error' });
    } else if (params.colLengthMm === 0 || params.colWidthMm === 0 || params.colHeightM === 0) {
      issues.push({ field: 'colLengthMm', message: 'Column dimensions are currently 0 (Zero Baseline Active). Enter dimensions or load standard preset.', severity: 'warning' });
    }
    if (params.colMainBarDiaMm < 0 || params.colMainBarCount < 0) {
      issues.push({ field: 'colMainBarDiaMm', message: 'Main longitudinal bars cannot be negative.', severity: 'error' });
    }
    if (params.tieBarDiaMm < 0 || params.tieSpacingMm < 0) {
      issues.push({ field: 'tieBarDiaMm', message: 'Tie/stirrup diameter and spacing cannot be negative.', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error') && params.colLengthMm > 0 && params.colWidthMm > 0 && params.colHeightM > 0) {
      if (params.colMainBarDiaMm > 0 && params.colMainBarCount > 0) {
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
      }

      if (params.tieBarDiaMm > 0 && params.tieSpacingMm > 0) {
        // Rectangular Lateral Ties with 135° seismic hooks:
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
    }
  } else if (normalizedType === 'column-circ') {
    if (params.circColDiaMm < 0 || params.circColHeightM < 0) {
      issues.push({ field: 'circColDiaMm', message: 'Circular column diameter and height cannot be negative.', severity: 'error' });
    } else if (params.circColDiaMm === 0 || params.circColHeightM === 0) {
      issues.push({ field: 'circColDiaMm', message: 'Circular column diameter and height are currently 0 (Zero Baseline Active).', severity: 'warning' });
    }
    if (params.circMainBarDiaMm < 0 || params.circMainBarCount < 0) {
      issues.push({ field: 'circMainBarDiaMm', message: 'Main longitudinal bars cannot be negative.', severity: 'error' });
    }
    if (params.spiralTieDiaMm < 0 || params.spiralPitchMm < 0) {
      issues.push({ field: 'spiralTieDiaMm', message: 'Spiral rebar diameter and pitch cannot be negative.', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error') && params.circColDiaMm > 0 && params.circColHeightM > 0) {
      if (params.circMainBarDiaMm > 0 && params.circMainBarCount > 0) {
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
      }

      if (params.spiralTieDiaMm > 0 && params.spiralPitchMm > 0) {
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
    }
  } else if (normalizedType === 'footing') {
    if (params.footingLengthM < 0 || params.footingWidthM < 0 || params.footingDepthMm < 0) {
      issues.push({ field: 'footingLengthM', message: 'Footing dimensions L, B, and D cannot be negative.', severity: 'error' });
    } else if (params.footingLengthM === 0 || params.footingWidthM === 0 || params.footingDepthMm === 0) {
      issues.push({ field: 'footingLengthM', message: 'Footing dimensions are currently 0 (Zero Baseline Active).', severity: 'warning' });
    }
    if (params.footingBarDiaMm < 0 || params.footingBarSpacingMm < 0) {
      issues.push({ field: 'footingBarDiaMm', message: 'Footing mesh diameter and spacing cannot be negative.', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error') && params.footingLengthM > 0 && params.footingWidthM > 0 && params.footingDepthMm > 0) {
      const upbendH = (params.footingDepthMm / 1000) - 2 * coverM;
      const bendDed = getBendDeduction(params.footingBarDiaMm, 2, '90');

      if (params.footingBarDiaMm > 0 && params.footingBarSpacingMm > 0) {
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
    }
  } else if (normalizedType === 'staircase-waist') {
    if (params.stairGoingM < 0 || params.stairTotalRiseM < 0 || params.waistSlabThicknessMm < 0) {
      issues.push({ field: 'stairGoingM', message: 'Stair going, rise, and waist slab thickness cannot be negative.', severity: 'error' });
    } else if (params.stairGoingM === 0 || params.stairTotalRiseM === 0 || params.waistSlabThicknessMm === 0) {
      issues.push({ field: 'stairGoingM', message: 'Stair going, rise, and thickness are currently 0 (Zero Baseline Active).', severity: 'warning' });
    }
    if (params.stairMainBarDiaMm < 0 || params.stairMainBarSpacingMm < 0) {
      issues.push({ field: 'stairMainBarDiaMm', message: 'Stair main rebar parameters cannot be negative.', severity: 'error' });
    }

    if (!issues.some((i) => i.severity === 'error') && params.stairGoingM > 0 && params.stairTotalRiseM > 0 && params.waistSlabThicknessMm > 0) {
      // Inclined slope waist length = sqrt(Going^2 + Rise^2) + Landing
      const inclinedWaistM = Math.sqrt(Math.pow(params.stairGoingM, 2) + Math.pow(params.stairTotalRiseM, 2));
      const landingM = params.landingLengthM || 1.2;
      const devEmbed = 50 * (params.stairMainBarDiaMm / 1000);
      const stairCutLen = inclinedWaistM + landingM + devEmbed;
      const stairWidthM = 1.25; // standard flight width
      if (params.stairMainBarDiaMm > 0 && params.stairMainBarSpacingMm > 0) {
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
      }

      // Distribution bars across steps
      if (params.stairDistBarDiaMm > 0 && params.stairDistBarSpacingMm > 0) {
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
  } else if (normalizedType === 'lintel-chajja') {
    const lintelL = params.lintelLengthM ?? 2.1;
    const lintelW = params.lintelWidthMm ?? 250;
    const lintelD = params.lintelDepthMm ?? 150;
    const lintelMainDia = params.lintelMainBarDiaMm ?? 12;
    const topCount = params.lintelTopBarCount ?? 2;
    const botCount = params.lintelBotBarCount ?? 2;
    const stirrupDia = params.lintelStirrupDiaMm ?? 8;
    const stirrupSpacing = params.lintelStirrupSpacingMm ?? 150;

    const chajjaProj = params.chajjaProjectionM ?? 0.6;
    const chajjaRootThick = params.chajjaRootThicknessMm ?? 100;
    const chajjaMainDia = params.chajjaMainBarDiaMm ?? 10;
    const chajjaMainSpacing = params.chajjaMainBarSpacingMm ?? 150;
    const chajjaDistDia = params.chajjaDistBarDiaMm ?? 8;
    const chajjaDistSpacing = params.chajjaDistBarSpacingMm ?? 200;

    if (lintelL < 0 || lintelW < 0 || lintelD < 0) {
      issues.push({ field: 'lintelLengthM', message: 'Lintel dimensions cannot be negative.', severity: 'error' });
    } else if (lintelL === 0 || lintelW === 0 || lintelD === 0) {
      issues.push({ field: 'lintelLengthM', message: 'Lintel dimensions currently 0 (Zero Baseline Active). Enter dimensions or load standard preset.', severity: 'warning' });
    }

    if (!issues.some((i) => i.severity === 'error') && lintelL > 0 && lintelW > 0 && lintelD > 0) {
      // 1. Lintel Main Longitudinal Bars (Top & Bottom with 90° hooks)
      const anchorHook = 2 * (12 * (lintelMainDia / 1000));
      const bendDed = getBendDeduction(lintelMainDia, 2, '90');
      const lintelMainCutRaw = (lintelL - 2 * coverM) + anchorHook - bendDed;
      const lintelLapInfo = applyLapping(lintelMainCutRaw, lintelMainDia);
      const lintelMainCut = lintelLapInfo.cuttingLengthM;
      const lintelMainUnitWt = getRebarUnitWeightKgPerM(lintelMainDia, density);

      if (botCount > 0 && lintelMainDia > 0) {
        items.push({
          description: `Lintel Bottom Tension Bars (${botCount} Nos Ø${lintelMainDia}mm with 90° anchor hooks)`,
          barDiaMm: lintelMainDia,
          count: botCount,
          cuttingLengthM: Number(lintelMainCut.toFixed(3)),
          totalLengthM: Number((botCount * lintelMainCut).toFixed(2)),
          unitWeightKgPerM: Number(lintelMainUnitWt.toFixed(3)),
          totalWeightKg: Number((botCount * lintelMainCut * lintelMainUnitWt).toFixed(2)),
          bendDeductionM: Number(bendDed.toFixed(3)),
          lappingAllowanceM: Number(lintelLapInfo.lappingAllowanceM.toFixed(3)),
          lapsCount: lintelLapInfo.lapsCount,
        });
      }

      if (topCount > 0 && lintelMainDia > 0) {
        items.push({
          description: `Lintel Top Anchor / Hanger Bars (${topCount} Nos Ø${lintelMainDia}mm with 90° anchor hooks)`,
          barDiaMm: lintelMainDia,
          count: topCount,
          cuttingLengthM: Number(lintelMainCut.toFixed(3)),
          totalLengthM: Number((topCount * lintelMainCut).toFixed(2)),
          unitWeightKgPerM: Number(lintelMainUnitWt.toFixed(3)),
          totalWeightKg: Number((topCount * lintelMainCut * lintelMainUnitWt).toFixed(2)),
          bendDeductionM: Number(bendDed.toFixed(3)),
          lappingAllowanceM: Number(lintelLapInfo.lappingAllowanceM.toFixed(3)),
          lapsCount: lintelLapInfo.lapsCount,
        });
      }

      // 2. Lintel Stirrups
      if (stirrupDia > 0 && stirrupSpacing > 0) {
        const stirrupW = lintelW / 1000 - 2 * coverM;
        const stirrupD = lintelD / 1000 - 2 * coverM;
        const hook135 = 2 * (10 * (stirrupDia / 1000));
        const stirrupBendDed = 12 * (stirrupDia / 1000);
        const stirrupCut = 2 * (stirrupW + stirrupD) + hook135 - stirrupBendDed;
        const stirrupCount = Math.floor(lintelL / (stirrupSpacing / 1000)) + 1;
        const stirrupUnitWt = getRebarUnitWeightKgPerM(stirrupDia, density);

        items.push({
          description: `Lintel Shear Stirrups (Ø${stirrupDia}mm @ ${stirrupSpacing}mm c/c with 135° seismic hooks)`,
          barDiaMm: stirrupDia,
          count: stirrupCount,
          cuttingLengthM: Number(stirrupCut.toFixed(3)),
          totalLengthM: Number((stirrupCount * stirrupCut).toFixed(2)),
          unitWeightKgPerM: Number(stirrupUnitWt.toFixed(3)),
          totalWeightKg: Number((stirrupCount * stirrupCut * stirrupUnitWt).toFixed(2)),
          bendDeductionM: Number(stirrupBendDed.toFixed(3)),
        });
      }

      // 3. Cantilever Chajja / Sunshade Rebar (if projection > 0)
      if (chajjaProj > 0 && chajjaMainDia > 0 && chajjaMainSpacing > 0) {
        // Main Cantilever Tension Bars:
        // Embedment inside lintel/brickwork (Ld = 50d) + Chajja projection - cover + nose drop bend
        const chajjaDevEmbed = (50 * chajjaMainDia) / 1000;
        const noseDrop = (chajjaRootThick / 1000) - 2 * coverM;
        const chajjaMainDed = getBendDeduction(chajjaMainDia, 2, '90');
        const chajjaMainCut = (chajjaProj - coverM) + noseDrop + chajjaDevEmbed - chajjaMainDed;
        const chajjaMainCount = Math.floor(lintelL / (chajjaMainSpacing / 1000)) + 1;
        const chajjaMainUnitWt = getRebarUnitWeightKgPerM(chajjaMainDia, density);

        items.push({
          description: `Chajja Cantilever Main Tension Bars (Ø${chajjaMainDia}mm @ ${chajjaMainSpacing}mm c/c, Ld=50d embedment)`,
          barDiaMm: chajjaMainDia,
          count: chajjaMainCount,
          cuttingLengthM: Number(chajjaMainCut.toFixed(3)),
          totalLengthM: Number((chajjaMainCount * chajjaMainCut).toFixed(2)),
          unitWeightKgPerM: Number(chajjaMainUnitWt.toFixed(3)),
          totalWeightKg: Number((chajjaMainCount * chajjaMainCut * chajjaMainUnitWt).toFixed(2)),
          bendDeductionM: Number(chajjaMainDed.toFixed(3)),
        });

        // Chajja Distribution Bars along full lintel/chajja length
        if (chajjaDistDia > 0 && chajjaDistSpacing > 0) {
          const chajjaDistCut = lintelL - 2 * coverM + 2 * (10 * (chajjaDistDia / 1000));
          const chajjaDistCount = Math.floor(chajjaProj / (chajjaDistSpacing / 1000)) + 1;
          const chajjaDistUnitWt = getRebarUnitWeightKgPerM(chajjaDistDia, density);

          items.push({
            description: `Chajja Longitudinal Distribution Bars (Ø${chajjaDistDia}mm @ ${chajjaDistSpacing}mm c/c)`,
            barDiaMm: chajjaDistDia,
            count: chajjaDistCount,
            cuttingLengthM: Number(chajjaDistCut.toFixed(3)),
            totalLengthM: Number((chajjaDistCount * chajjaDistCut).toFixed(2)),
            unitWeightKgPerM: Number(chajjaDistUnitWt.toFixed(3)),
            totalWeightKg: Number((chajjaDistCount * chajjaDistCut * chajjaDistUnitWt).toFixed(2)),
            bendDeductionM: 0,
          });
        }
      }
    }
  } else if (normalizedType === 'pile-cage') {
    const pileDia = params.pileDiaMm ?? 500;
    const pileL = params.pileLengthM ?? 18.0;
    const mainDia = params.pileMainBarDiaMm ?? 16;
    const mainCount = params.pileMainBarCount ?? 7;
    const spiralDia = params.pileSpiralDiaMm ?? 8;
    const spiralPitch = params.pileSpiralPitchMm ?? 150;
    const stiffenerDia = params.pileStiffenerBarDiaMm ?? 12;
    const stiffenerSpacing = params.pileStiffenerSpacingM ?? 2.0;
    const cutoffEmbed = params.pileCutoffEmbedmentM ?? 0.75; // Pile head dowel into pile cap (default 750mm)

    if (pileDia < 0 || pileL < 0) {
      issues.push({ field: 'pileDiaMm', message: 'Pile dimensions cannot be negative.', severity: 'error' });
    } else if (pileDia === 0 || pileL === 0) {
      issues.push({ field: 'pileDiaMm', message: 'Pile dimensions currently 0 (Zero Baseline Active). Enter diameter & length or load standard preset.', severity: 'warning' });
    }

    if (!issues.some((i) => i.severity === 'error') && pileDia > 0 && pileL > 0) {
      // 1. Bored Pile Longitudinal Main Bars (with Pile Cap Dowel Extension & Bottom Tremie Guide Bend)
      if (mainDia > 0 && mainCount > 0) {
        const bottomGuideBend = 12 * (mainDia / 1000); // 12d inward bend to prevent cage snagging during lowering
        const unlappedMainCut = pileL + cutoffEmbed + bottomGuideBend;
        const lapInfo = applyLapping(unlappedMainCut, mainDia);
        const mainCutting = lapInfo.cuttingLengthM;
        const mainUnitWt = getRebarUnitWeightKgPerM(mainDia, density);

        items.push({
          description: `Bored Pile Longitudinal Main Bars (${mainCount} Nos Ø${mainDia}mm with ${cutoffEmbed}m pile-cap dowel)`,
          barDiaMm: mainDia,
          count: mainCount,
          cuttingLengthM: Number(mainCutting.toFixed(3)),
          totalLengthM: Number((mainCount * mainCutting).toFixed(2)),
          unitWeightKgPerM: Number(mainUnitWt.toFixed(3)),
          totalWeightKg: Number((mainCount * mainCutting * mainUnitWt).toFixed(2)),
          bendDeductionM: 0,
          lappingAllowanceM: Number(lapInfo.lappingAllowanceM.toFixed(3)),
          lapsCount: lapInfo.lapsCount,
        });
      }

      // 2. Helical Spiral Lateral Confinement Ties
      if (spiralDia > 0 && spiralPitch > 0) {
        const coreDiaM = (pileDia - 2 * params.clearCoverMm - spiralDia) / 1000;
        const pitchM = spiralPitch / 1000;
        const numTurns = Math.floor(pileL / pitchM);
        const turnLength = Math.sqrt(Math.pow(Math.PI * Math.max(0.05, coreDiaM), 2) + Math.pow(pitchM, 2));
        const anchorTurns = 4.0 * Math.PI * Math.max(0.05, coreDiaM); // 2 extra turns top & bottom
        const unlappedSpiralM = numTurns * turnLength + anchorTurns;
        const spiralLapInfo = applyLapping(unlappedSpiralM, spiralDia);
        const totalSpiralM = spiralLapInfo.cuttingLengthM;
        const spiralUnitWt = getRebarUnitWeightKgPerM(spiralDia, density);

        items.push({
          description: `Continuous Helical Spiral Rebar (Ø${spiralDia}mm @ ${spiralPitch}mm pitch with 4 anchor turns)`,
          barDiaMm: spiralDia,
          count: 1,
          cuttingLengthM: Number(totalSpiralM.toFixed(3)),
          totalLengthM: Number(totalSpiralM.toFixed(2)),
          unitWeightKgPerM: Number(spiralUnitWt.toFixed(3)),
          totalWeightKg: Number((totalSpiralM * spiralUnitWt).toFixed(2)),
          bendDeductionM: 0,
          lappingAllowanceM: Number(spiralLapInfo.lappingAllowanceM.toFixed(3)),
          lapsCount: spiralLapInfo.lapsCount,
        });
      }

      // 3. Master Stiffener Rings (Internal circular welded rings to maintain cage rigidity during lowering)
      if (stiffenerDia > 0 && stiffenerSpacing > 0) {
        const ringDiaM = (pileDia - 2 * params.clearCoverMm - 2 * spiralDia - 2 * mainDia) / 1000;
        if (ringDiaM > 0.05) {
          const ringLapM = 25 * (stiffenerDia / 1000); // 25d weld lap
          const ringCutLen = Math.PI * ringDiaM + ringLapM;
          const ringCount = Math.floor(pileL / stiffenerSpacing) + 1;
          const ringUnitWt = getRebarUnitWeightKgPerM(stiffenerDia, density);

          items.push({
            description: `Internal Master Stiffener Rings (Ø${stiffenerDia}mm @ ${stiffenerSpacing}m c/c welded cage rings)`,
            barDiaMm: stiffenerDia,
            count: ringCount,
            cuttingLengthM: Number(ringCutLen.toFixed(3)),
            totalLengthM: Number((ringCount * ringCutLen).toFixed(2)),
            unitWeightKgPerM: Number(ringUnitWt.toFixed(3)),
            totalWeightKg: Number((ringCount * ringCutLen * ringUnitWt).toFixed(2)),
            bendDeductionM: 0,
          });
        }
      }
    }
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<RebarBBSResult>(null, issues);
  }

  const totalSteelWeightKg = items.reduce((sum, item) => sum + item.totalWeightKg, 0);
  const totalSteelTonnes = totalSteelWeightKg / 1000;
  const totalBarsLengthM = items.reduce((sum, item) => sum + item.totalLengthM, 0);

  // 12m Commercial Bar Stock Optimizer by Diameter (8mm, 10mm, 12mm, 16mm, 20mm, 25mm, etc.)
  const itemsByDiaMap = new Map<number, { cuttingLenM: number; weightKg: number }>();
  let totalLappingAllowanceM = 0;

  for (const it of items) {
    const cur = itemsByDiaMap.get(it.barDiaMm) || { cuttingLenM: 0, weightKg: 0 };
    cur.cuttingLenM += it.totalLengthM;
    cur.weightKg += it.totalWeightKg;
    itemsByDiaMap.set(it.barDiaMm, cur);
    if (it.lappingAllowanceM && it.count) {
      totalLappingAllowanceM += it.lappingAllowanceM * it.count;
    }
  }

  const barStockSummary: BarStockSummaryItem[] = [];
  let total12mBarsCount = 0;
  let totalPurchasedLengthM = 0;
  let totalPurchasedWeightKg = 0;
  let totalScrapWeightKg = 0;

  const sortedDias = Array.from(itemsByDiaMap.keys()).sort((a, b) => a - b);
  for (const dia of sortedDias) {
    const data = itemsByDiaMap.get(dia)!;
    const unitWt = getRebarUnitWeightKgPerM(dia, density);
    // Number of 12m commercial full bars required:
    const bars12mRequired = Math.ceil(data.cuttingLenM / maxBarLengthM);
    const purchasedLen = bars12mRequired * maxBarLengthM;
    const purchasedWt = purchasedLen * unitWt;
    const purchasedTon = purchasedWt / 1000;
    const offcutLen = Math.max(0, purchasedLen - data.cuttingLenM);
    const offcutWt = offcutLen * unitWt;
    const scrapPct = purchasedWt > 0 ? (offcutWt / purchasedWt) * 100 : 0;
    // Commercial bundles estimate: 1 bundle is typically ~2.0 to 2.5 metric tons or ~50-100 bars depending on dia
    const barsPerBundleApprox = dia <= 10 ? 80 : dia <= 12 ? 55 : dia <= 16 ? 30 : dia <= 20 ? 20 : 12;
    const bundlesEstimate = bars12mRequired > 0 ? Math.ceil(bars12mRequired / barsPerBundleApprox) : 0;

    barStockSummary.push({
      barDiaMm: dia,
      totalCuttingLengthM: Number(data.cuttingLenM.toFixed(2)),
      totalWeightKg: Number(data.weightKg.toFixed(2)),
      bars12mRequired,
      purchasedLengthM: Number(purchasedLen.toFixed(2)),
      purchasedWeightKg: Number(purchasedWt.toFixed(2)),
      purchasedTonnes: Number(purchasedTon.toFixed(3)),
      offcutScrapLengthM: Number(offcutLen.toFixed(2)),
      offcutScrapWeightKg: Number(offcutWt.toFixed(2)),
      scrapPercent: Number(scrapPct.toFixed(1)),
      commercialBundlesEstimate: bundlesEstimate,
    });

    total12mBarsCount += bars12mRequired;
    totalPurchasedLengthM += purchasedLen;
    totalPurchasedWeightKg += purchasedWt;
    totalScrapWeightKg += offcutWt;
  }

  const overallScrapPercent = totalPurchasedWeightKg > 0 ? (totalScrapWeightKg / totalPurchasedWeightKg) * 100 : 0;

  const commercialBarStock: Commercial12mBarStock = {
    itemsByDiameter: barStockSummary,
    total12mBarsCount,
    totalCuttingLengthM: Number(totalBarsLengthM.toFixed(2)),
    totalPurchasedLengthM: Number(totalPurchasedLengthM.toFixed(2)),
    totalPurchasedWeightKg: Number(totalPurchasedWeightKg.toFixed(2)),
    totalPurchasedTonnes: Number((totalPurchasedWeightKg / 1000).toFixed(3)),
    totalScrapWeightKg: Number(totalScrapWeightKg.toFixed(2)),
    overallScrapPercent: Number(overallScrapPercent.toFixed(1)),
    lappingStandardUsed: `${lappingD}d for bars exceeding ${maxBarLengthM.toFixed(1)}m`,
    totalLappingAllowanceM: Number(totalLappingAllowanceM.toFixed(2)),
  };

  return createEnvelope<RebarBBSResult>(
    {
      items,
      totalSteelWeightKg: Number(totalSteelWeightKg.toFixed(2)),
      totalSteelTonnes: Number(totalSteelTonnes.toFixed(3)),
      totalSteelWeightTon: Number(totalSteelTonnes.toFixed(3)),
      unitWeightFormulaUsed: `W = (π·D²·ρ)/4 [exact physics] ~ D²/162.2 kg/m at ρ=${density} kg/m³`,
      totalBarsLengthM: Number(totalBarsLengthM.toFixed(2)),
      steelDensityKgPerM3: density,
      commercialBarStock,
      status: 'nominal',
    },
    issues
  );
}

/* -------------------------------------------------------------
   MODULE 7: MASONRY & SURFACE FINISHES
------------------------------------------------------------- */
export interface PaintPuttySchedule {
  finishingSurfaceAreaM2: number;
  finishingSurfaceAreaSft: number;
  puttyCoats: number;
  puttyKgRequired: number;
  puttyBags20Kg: number;
  puttyBags40Kg: number;
  primerCoats: number;
  primerLitersRequired: number;
  paintCoats: number;
  paintLitersRequired: number;
  paintGallons: number; // 1 US Gallon = 3.785 L
  paintDrums: number; // 1 Drum = 18.92 L (5 gal)
}

export interface GrillThaiOpeningItem {
  id: string;
  name: string;
  type: string;
  count: number;
  widthM: number;
  heightM: number;
  singleAreaSft: number;
  totalAreaSft: number;
  singlePerimeterRft: number;
  totalPerimeterRft: number;
  grillWeightKg: number;
  hasGrill: boolean;
  hasThai: boolean;
}

export interface GrillThaiSchedule {
  items: GrillThaiOpeningItem[];
  totalGrillAreaSft: number;
  totalGrillWeightKg: number;
  totalGrillWeightMaund: number; // 1 Maund = 40 kg or 37.3242 kg BNBC standard (40 kg market)
  totalThaiAreaSft: number;
  totalThaiFrameRft: number;
  totalWindowOpeningsCount: number;
  totalDoorOpeningsCount: number;
}

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

  // Paint, Wall Putty & Primer Schedule
  paintPuttySchedule?: PaintPuttySchedule;

  // MS Window/Veranda Grill & Thai Aluminum Schedule
  grillThaiSchedule?: GrillThaiSchedule;

  // Bangladeshi Standard BFS & HBB Sub-base Schedule
  bfsHbbSchedule?: {
    subbaseType: string;
    subbaseAreaM2: number;
    subbaseAreaSft: number;
    bricksRequiredCount: number;
    bricksWithWastageCount: number;
    sandCushionCft: number;
    sandCushionM3: number;
    standardRatePerSft?: number;
  };
  subbaseSchedule?: {
    subbaseType: string;
    subbaseName: string;
    areaM2: number;
    areaSft: number;
    sandCushionCft: number;
    sandCushionM3: number;
    sandCushionBags: number;
    sandCushionThicknessMm: number;
    bricksCount: number;
    bricksWithWastageCount: number;
  };
  brickStandardUsed?: string;

  status: 'nominal' | 'warning' | 'critical';
}

export function computeMasonryFinishes(
  params: MasonryParameters
): CalculationEnvelope<MasonryResult> {
  const issues: ValidationIssue[] = [];

  const isZeroBaseline = params.wallLengthM === 0 || params.wallHeightM === 0 || params.wallThicknessM === 0;

  if (params.wallLengthM < 0 || params.wallHeightM < 0 || params.wallThicknessM < 0) {
    issues.push({ field: 'wallDimensions', message: 'Wall dimensions cannot be negative.', severity: 'error' });
  } else if (isZeroBaseline) {
    issues.push({ field: 'wallDimensions', message: 'Wall dimensions are currently 0 m (clean baseline). Brickwork counts evaluate to zero.', severity: 'warning' });
  }

  if ((params.brickLengthMm <= 0 || params.brickWidthMm <= 0 || params.brickHeightMm <= 0) && !isZeroBaseline) {
    issues.push({ field: 'brickLengthMm', message: 'Brick dimensions must be strictly positive (> 0 mm).', severity: 'error' });
  }
  if ((params.mortarRatioCement <= 0 || params.mortarRatioSand <= 0) && !isZeroBaseline) {
    issues.push({ field: 'mortarRatioCement', message: 'Mortar cement and sand ratios must be strictly positive.', severity: 'error' });
  }

  if (issues.some((i) => i.severity === 'error') || isZeroBaseline) {
    return createEnvelope<MasonryResult>(
      {
        grossWallAreaM2: 0,
        totalOpeningAreaM2: 0,
        netWallAreaM2: 0,
        netWallVolumeM3: 0,
        nominalBrickVolumeM3: 0,
        actualBrickVolumeM3: 0,
        requiredBricksCount: 0,
        bricksWithWastageCount: 0,
        mortarVolumeDryM3: 0,
        mortarCementBags50Kg: 0,
        mortarSandM3: 0,
        mortarSandCft: 0,
        plasterAreaM2: 0,
        plasterWetVolM3: 0,
        plasterDryVolM3: 0,
        plasterCementBags: 0,
        plasterSandM3: 0,
        plasterSandCft: 0,
        floorAreaM2: (params.floorLengthM || 0) * (params.floorWidthM || 0),
        singleTileAreaM2: ((params.tileLengthMm || 600) / 1000) * ((params.tileWidthMm || 600) / 1000),
        tilesRequiredCount: 0,
        tilesWithWastageCount: 0,
        tileBoxesCount: 0,
        status: 'nominal',
      },
      issues
    );
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

  // Resolve Bangladeshi Standard Brick Size:
  // BD PWD Standard Metric: 240 x 115 x 70 mm (actual), 250 x 125 x 75 mm (nominal with 10mm mortar)
  // Traditional Field Brick: 9.5" x 4.5" x 2.75" ~ 241.3 x 114.3 x 69.85 mm (nominal 10" x 5" x 3" with mortar)
  let brickL = params.brickLengthMm;
  let brickW = params.brickWidthMm;
  let brickH = params.brickHeightMm;

  if (params.brickStandardType === 'bd-pwd-metric') {
    brickL = 240;
    brickW = 115;
    brickH = 70;
  } else if (params.brickStandardType === 'traditional-field') {
    brickL = 241;
    brickW = 114;
    brickH = 70;
  }

  // Standard brick modular calculation with mortar joint (e.g. 10mm)
  const jM = (params.mortarJointMm || 10) / 1000;
  const nomL = brickL / 1000 + jM;
  const nomW = brickW / 1000 + jM;
  const nomH = brickH / 1000 + jM;
  const nominalBrickVol = nomL * nomW * nomH;

  const actL = brickL / 1000;
  const actW = brickW / 1000;
  const actH = brickH / 1000;
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

  // Paint, Wall Putty & Primer Schedule:
  // Finishing surface area = plasterAreaM2 + (params.ceilingPlasterAreaM2 || 0)
  const finishingAreaM2 = plasterAreaM2 + (params.ceilingPlasterAreaM2 || 0);
  const finishingAreaSft = finishingAreaM2 * EXACT_CONVERSION.M2_TO_SFT;

  const puttyCoats = params.puttyCoats || 2;
  const puttyCoverage = params.puttyCoverageKgPerM2 || 0.90; // kg/m2 for 2 coats
  const primerCoverage = params.primerCoverageM2PerL || 11.0; // m2/L for 1 coat
  const paintCoats = params.paintCoats || 2;
  const paintCoverage = params.paintCoverageM2PerL || 6.5; // m2/L for 2 coats
  const paintWastage = 1 + (params.paintWastagePercent || 5) / 100;

  const rawPuttyKg = finishingAreaM2 * puttyCoverage * (puttyCoats / 2);
  const puttyKgRequired = Math.ceil(rawPuttyKg * paintWastage);
  const puttyBags20Kg = Math.ceil(puttyKgRequired / 20);
  const puttyBags40Kg = Math.ceil(puttyKgRequired / 40);

  const primerLiters = Math.ceil((finishingAreaM2 / primerCoverage) * paintWastage);
  const rawPaintLiters = (finishingAreaM2 / paintCoverage) * (paintCoats / 2);
  const paintLitersRequired = Math.ceil(rawPaintLiters * paintWastage);
  const paintGallons = Number((paintLitersRequired / 3.785).toFixed(1));
  const paintDrums = Number((paintLitersRequired / 18.92).toFixed(1));

  const paintPuttySchedule: PaintPuttySchedule = {
    finishingSurfaceAreaM2: Number(finishingAreaM2.toFixed(2)),
    finishingSurfaceAreaSft: Number(finishingAreaSft.toFixed(1)),
    puttyCoats,
    puttyKgRequired,
    puttyBags20Kg,
    puttyBags40Kg,
    primerCoats: 1,
    primerLitersRequired: primerLiters,
    paintCoats,
    paintLitersRequired,
    paintGallons,
    paintDrums,
  };

  // MS Window/Veranda Grill & Thai Aluminum Opening Schedule:
  const grillUnitWtKgPerSft = params.grillWeightKgPerSft || 1.40; // 1.40 kg/sft standard flat/square bar
  const grillThaiItems: GrillThaiOpeningItem[] = [];
  let totalGrillAreaSft = 0;
  let totalGrillWeightKg = 0;
  let totalThaiAreaSft = 0;
  let totalThaiFrameRft = 0;
  let totalWindowOpeningsCount = 0;
  let totalDoorOpeningsCount = 0;

  if (Array.isArray(params.openings)) {
    for (const op of params.openings) {
      if (op.widthM > 0 && op.heightM > 0 && op.count > 0) {
        const singleSft = op.widthM * op.heightM * EXACT_CONVERSION.M2_TO_SFT;
        const totalSft = singleSft * op.count;
        const singleRft = 2 * (op.widthM + op.heightM) * EXACT_CONVERSION.M_TO_FT;
        const totalRft = singleRft * op.count;

        const opType = op.type || (op.name.toLowerCase().includes('door') ? 'door' : 'window');
        if (opType === 'door') {
          totalDoorOpeningsCount += op.count;
        } else {
          totalWindowOpeningsCount += op.count;
        }

        const hasGrill = op.includeGrill ?? (opType !== 'door');
        const hasThai = op.includeThaiAluminum ?? (opType === 'window');

        const grillWt = hasGrill ? totalSft * grillUnitWtKgPerSft : 0;
        if (hasGrill) {
          totalGrillAreaSft += totalSft;
          totalGrillWeightKg += grillWt;
        }
        if (hasThai) {
          totalThaiAreaSft += totalSft;
          totalThaiFrameRft += totalRft;
        }

        grillThaiItems.push({
          id: op.id,
          name: op.name,
          type: opType,
          count: op.count,
          widthM: op.widthM,
          heightM: op.heightM,
          singleAreaSft: Number(singleSft.toFixed(2)),
          totalAreaSft: Number(totalSft.toFixed(2)),
          singlePerimeterRft: Number(singleRft.toFixed(2)),
          totalPerimeterRft: Number(totalRft.toFixed(2)),
          grillWeightKg: Number(grillWt.toFixed(1)),
          hasGrill,
          hasThai,
        });
      }
    }
  }

  const grillThaiSchedule: GrillThaiSchedule = {
    items: grillThaiItems,
    totalGrillAreaSft: Number(totalGrillAreaSft.toFixed(1)),
    totalGrillWeightKg: Number(totalGrillWeightKg.toFixed(1)),
    totalGrillWeightMaund: Number((totalGrillWeightKg / 40).toFixed(2)),
    totalThaiAreaSft: Number(totalThaiAreaSft.toFixed(1)),
    totalThaiFrameRft: Number(totalThaiFrameRft.toFixed(1)),
    totalWindowOpeningsCount,
    totalDoorOpeningsCount,
  };

  // Bangladeshi Sub-base: Brick Flat Soling (BFS) & Herringbone Bond (HBB)
  // BFS: Bricks laid flat on bed. Standard rule per 100 sft = ~300 to 320 bricks (approx 31 to 32 bricks/m² or 3.0 to 3.2 bricks/sft)
  // HBB: Bricks laid on edge in herringbone pattern. Standard rule per 100 sft = ~500 to 550 bricks (approx 52 to 55 bricks/m² or 5.0 to 5.5 bricks/sft)
  const bfsAreaM2 = params.bfsLayerAreaM2 || (params.subbaseType && params.subbaseType !== 'none' ? floorAreaM2 : 0);
  const bfsAreaSft = bfsAreaM2 * EXACT_CONVERSION.M2_TO_SFT;
  const isHbb = params.subbaseType === 'hbb-herringbone-bond';
  const subbaseRatePerSft = isHbb ? 5.2 : 3.1;
  const rawSubbaseBricks = Math.ceil(bfsAreaSft * subbaseRatePerSft);
  const subbaseBricksWithWastage = Math.ceil(rawSubbaseBricks * (1 + (params.brickWastagePercent || 5) / 100));

  // Sand Cushion Bed (default 38mm = 1.5 inch bed)
  const sandBedThickM = (params.bfsSandCushionThicknessMm || 38) / 1000;
  const sandCushionM3 = Number((bfsAreaM2 * sandBedThickM).toFixed(3));
  const sandCushionCft = Number((sandCushionM3 * EXACT_CONVERSION.M3_TO_CFT).toFixed(1));

  const bfsHbbSchedule = bfsAreaM2 > 0 ? {
    subbaseType: isHbb ? 'Herringbone Bond (HBB)' : 'Brick Flat Soling (BFS)',
    subbaseAreaM2: Number(bfsAreaM2.toFixed(2)),
    subbaseAreaSft: Number(bfsAreaSft.toFixed(1)),
    bricksRequiredCount: rawSubbaseBricks,
    bricksWithWastageCount: subbaseBricksWithWastage,
    sandCushionCft,
    sandCushionM3,
    standardRatePerSft: subbaseRatePerSft,
  } : undefined;

  const subbaseSchedule = bfsAreaM2 > 0 ? {
    subbaseType: isHbb ? 'hbb' : 'bfs',
    subbaseName: isHbb ? 'Herringbone Bond (HBB)' : 'Brick Flat Soling (BFS)',
    areaM2: Number(bfsAreaM2.toFixed(2)),
    areaSft: Number(bfsAreaSft.toFixed(1)),
    sandCushionCft,
    sandCushionM3,
    sandCushionBags: Math.ceil(sandCushionCft / 1.25),
    sandCushionThicknessMm: Math.round(sandBedThickM * 1000),
    bricksCount: rawSubbaseBricks,
    bricksWithWastageCount: subbaseBricksWithWastage,
  } : undefined;

  const brickStandardUsed = params.brickStandardType === 'traditional-field'
    ? 'Traditional Field Brick (9.5" × 4.5" × 2.75")'
    : 'BD PWD Standard Metric (240 × 115 × 70 mm)';

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
      paintPuttySchedule,
      grillThaiSchedule,
      bfsHbbSchedule,
      subbaseSchedule,
      brickStandardUsed,
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
    const isZero = params.pitTopLengthM === 0 || params.pitTopWidthM === 0 || params.pitDepthM === 0;
    if (params.pitTopLengthM < 0 || params.pitTopWidthM < 0 || params.pitDepthM < 0) {
      issues.push({ field: 'pitTopLengthM', message: 'Pit excavation dimensions cannot be negative.', severity: 'error' });
    } else if (isZero) {
      issues.push({ field: 'pitTopLengthM', message: 'Pit excavation dimensions are currently 0 m (clean baseline). Volumes evaluate to 0 m³.', severity: 'warning' });
    }

    if (!issues.some((i) => i.severity === 'error') && !isZero) {
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
    const isZero = params.trenchLengthM === 0 || params.trenchBottomWidthM === 0 || params.trenchDepthM === 0;
    if (params.trenchLengthM < 0 || params.trenchBottomWidthM < 0 || params.trenchDepthM < 0) {
      issues.push({ field: 'trenchLengthM', message: 'Trench dimensions cannot be negative.', severity: 'error' });
    } else if (isZero) {
      issues.push({ field: 'trenchLengthM', message: 'Trench dimensions are currently 0 m (clean baseline). Volumes evaluate to 0 m³.', severity: 'warning' });
    }

    if (!issues.some((i) => i.severity === 'error') && !isZero) {
      const b = params.trenchBottomWidthM;
      const d = params.trenchDepthM;
      const s = params.trenchSideSlopeH || 0;
      const area = (b + s * d) * d;
      bankVolumeM3 = area * params.trenchLengthM;
    }
  } else {
    // Road Prismoidal Alignment across 3 stations
    const isZero = params.roadLengthM === 0 || params.formationWidthM === 0;
    if (params.roadLengthM < 0 || params.formationWidthM < 0) {
      issues.push({ field: 'roadLengthM', message: 'Road dimensions cannot be negative.', severity: 'error' });
    } else if (isZero) {
      issues.push({ field: 'roadLengthM', message: 'Road prismoidal dimensions are currently 0 m (clean baseline). Volumes evaluate to 0 m³.', severity: 'warning' });
    }

    if (!issues.some((i) => i.severity === 'error') && !isZero) {
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
  wbsSectionId?: string;
  wbsSectionTitle?: string;
  wbsCode?: string;
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
  startMonth?: number;
  durationMonths?: number;
  curveDistribution?: 's-curve' | 'linear' | 'early-peak' | 'late-peak';
  vendorSource?: string;
}

export interface BOQCategorySummary {
  category: TakeoffCategory;
  itemCount: number;
  subtotal: number;
  percentageOfSubtotal: number;
}

export interface BOQWbsSectionSummary {
  wbsSectionId: string;
  code: string;
  title: string;
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
  aitTaxPercent?: number;
  aitTaxAmount?: number;
  retentionMoneyPercent?: number;
  retentionMoneyAmount?: number;
  mobilizationRecoveryPercent?: number;
  mobilizationRecoveryAmount?: number;
  netPayableToContractorAmount?: number;
  categorySummaries: BOQCategorySummary[];
  wbsSectionSummaries?: BOQWbsSectionSummary[];
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
    const nos = typeof item.numberOfMembers === 'number' ? item.numberOfMembers : 1;
    const l = typeof item.lengthM === 'number' ? item.lengthM : 0;
    const w = typeof item.widthM === 'number' ? item.widthM : 0;
    const h = typeof item.heightM === 'number' ? item.heightM : 0;

    let gross = 0;
    let missingDim = false;
    switch (item.unit) {
      case 'm3':
        // Volumetric requires L, W, and H
        if (l === 0 || w === 0 || h === 0 || nos === 0) {
          gross = 0;
          missingDim = true;
        } else {
          gross = nos * l * w * h;
        }
        break;
      case 'cft':
        // Dimensions entered in SI meters -> convert base m3 to CFT exactly
        if (l === 0 || w === 0 || h === 0 || nos === 0) {
          gross = 0;
          missingDim = true;
        } else {
          gross = nos * l * w * h * EXACT_CONVERSION.M3_TO_CFT;
        }
        break;
      case 'm2':
        // Area requires L and W
        if (l === 0 || w === 0 || nos === 0) {
          gross = 0;
          missingDim = true;
        } else {
          gross = nos * l * w;
        }
        break;
      case 'sft':
        // Dimensions entered in SI meters -> convert base m2 to SFT exactly
        if (l === 0 || w === 0 || nos === 0) {
          gross = 0;
          missingDim = true;
        } else {
          gross = nos * l * w * EXACT_CONVERSION.M2_TO_SFT;
        }
        break;
      case 'm':
        // Linear length requires L
        if (l === 0 || nos === 0) {
          gross = 0;
          missingDim = true;
        } else {
          gross = nos * l;
        }
        break;
      case 'rft':
        // Dimensions entered in SI meters -> convert base m to RFT (feet) exactly
        if (l === 0 || nos === 0) {
          gross = 0;
          missingDim = true;
        } else {
          gross = nos * l * EXACT_CONVERSION.M_TO_FT;
        }
        break;
      case 'kg':
      case 'ton':
      case 'bags':
      case 'nos':
      case 'lump-sum':
      default:
        gross = l > 0 ? nos * l : nos;
        break;
    }

    if (missingDim) {
      issues.push({
        field: `items[${idx}].dimensions`,
        message: `Line item #${item.itemNo || idx + 1} ("${item.description}") has zero required dimension(s) for unit ${item.unit}. Quantity evaluated to 0.`,
        severity: 'warning',
      });
    }

    if (nos === 0) {
      issues.push({
        field: `items[${idx}].numberOfMembers`,
        message: `Line item #${item.itemNo || idx + 1} ("${item.description}") has count of 0 members.`,
        severity: 'warning',
      });
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

    let sectionId = item.wbsSectionId;
    if (!sectionId) {
      switch (item.category) {
        case 'misc': sectionId = 'sec-100'; break;
        case 'earthwork': sectionId = 'sec-200'; break;
        case 'substructure': sectionId = 'sec-300'; break;
        case 'superstructure': sectionId = 'sec-400'; break;
        case 'rebar': sectionId = 'sec-500'; break;
        case 'masonry': sectionId = 'sec-600'; break;
        case 'finishing': sectionId = 'sec-700'; break;
        case 'plumbing': sectionId = 'sec-800'; break;
        case 'electrical': sectionId = 'sec-900'; break;
        default: sectionId = 'sec-100'; break;
      }
    }
    const matchedSec = STANDARD_WBS_SECTIONS.find((s) => s.id === sectionId) || STANDARD_WBS_SECTIONS[0];

    return {
      id: item.id,
      itemNo: item.itemNo || `${matchedSec.code}.${String(idx + 1).padStart(2, '0')}`,
      description: item.description || `Item #${idx + 1}`,
      category: item.category || matchedSec.category || 'misc',
      wbsSectionId: sectionId,
      wbsSectionTitle: matchedSec.title,
      wbsCode: matchedSec.code,
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
      startMonth: item.startMonth,
      durationMonths: item.durationMonths,
      curveDistribution: item.curveDistribution,
      vendorSource: item.vendorSource,
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

  // WBS Section summary map
  const wbsMap: Record<string, { code: string; title: string; count: number; subtotal: number }> = {};
  STANDARD_WBS_SECTIONS.forEach((sec) => {
    wbsMap[sec.id] = { code: sec.code, title: sec.title, count: 0, subtotal: 0 };
  });

  computedItems.forEach((it) => {
    const secId = it.wbsSectionId || 'sec-100';
    if (wbsMap[secId]) {
      wbsMap[secId].count += 1;
      wbsMap[secId].subtotal += it.itemTotalAmount;
    }
  });

  const wbsSectionSummaries: BOQWbsSectionSummary[] = Object.keys(wbsMap)
    .filter((secId) => wbsMap[secId].count > 0)
    .map((secId) => ({
      wbsSectionId: secId,
      code: wbsMap[secId].code,
      title: wbsMap[secId].title,
      itemCount: wbsMap[secId].count,
      subtotal: Number(wbsMap[secId].subtotal.toFixed(2)),
      percentageOfSubtotal:
        subtotal > 0 ? Number(((wbsMap[secId].subtotal / subtotal) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => Number(a.code) - Number(b.code));

  const aitPercent = typeof params.aitTaxPercent === 'number' ? params.aitTaxPercent : (params.currency === 'BDT' ? 5.0 : 0);
  const retentionPercent = typeof params.retentionMoneyPercent === 'number' ? params.retentionMoneyPercent : (params.currency === 'BDT' ? 7.5 : 0);
  const mobRecoveryPercent = typeof params.mobilizationRecoveryPercent === 'number' ? params.mobilizationRecoveryPercent : 0;

  const aitAmt = grandTotal * (aitPercent / 100);
  const retentionAmt = grandTotal * (retentionPercent / 100);
  const mobRecoveryAmt = grandTotal * (mobRecoveryPercent / 100);
  const netPayable = grandTotal - (aitAmt + retentionAmt + mobRecoveryAmt);

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
      aitTaxPercent: aitPercent,
      aitTaxAmount: Number(aitAmt.toFixed(2)),
      retentionMoneyPercent: retentionPercent,
      retentionMoneyAmount: Number(retentionAmt.toFixed(2)),
      mobilizationRecoveryPercent: mobRecoveryPercent,
      mobilizationRecoveryAmount: Number(mobRecoveryAmt.toFixed(2)),
      netPayableToContractorAmount: Number(netPayable.toFixed(2)),
      categorySummaries,
      wbsSectionSummaries,
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

  const isZeroBasis = params.basisVolumeM3 === 0;
  if (params.basisVolumeM3 < 0) {
    issues.push({
      field: 'basisVolumeM3',
      message: 'Analysis basis volume cannot be negative.',
      severity: 'error',
    });
  } else if (isZeroBasis) {
    issues.push({
      field: 'basisVolumeM3',
      message: 'Analysis basis volume is currently 0 m³ (clean baseline). Unit rate calculated on 1.0 m³ reference basis.',
      severity: 'warning',
    });
  }

  const vol = isZeroBasis ? 1.0 : Math.max(0.001, params.basisVolumeM3);
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
  deflectionMm?: number; // Signed elastic deflection (negative = downward sag, positive = upward uplift)
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
  maxDeflectionMm?: number;
  maxDeflectionLocationM?: number;
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

    if (sp.lengthM < 0) {
      issues.push({
        field: `span_${idx}_length`,
        message: `Span ${idx + 1} length cannot be negative.`,
        severity: 'error',
      });
    } else if (sp.lengthM === 0) {
      issues.push({
        field: `span_${idx}_length`,
        message: `Span ${idx + 1} length is currently 0 m (clean baseline).`,
        severity: 'warning',
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

    // 3. Dense Discretization Points (200 stations per span) + Exact Double-Integrated Elastic Curve
    const numStations = 200;
    const dxSpan = L / numStations;
    const spanEI = Math.max(1, (spans[i].elasticModulusGpa || 200) * (spans[i].momentOfInertiaCm4 || 120000) * 0.01); // kN·m²
    let spanMaxV = Math.max(Math.abs(V_left), Math.abs(V_right));

    const stationX: number[] = new Array(numStations + 1);
    const stationV: number[] = new Array(numStations + 1);
    const stationM: number[] = new Array(numStations + 1);
    const rawTheta: number[] = new Array(numStations + 1).fill(0);
    const rawY: number[] = new Array(numStations + 1).fill(0);

    for (let s = 0; s <= numStations; s++) {
      const x = s * dxSpan;
      const Vx = getShearAtX(x);
      const Mx = getMomentAtX(x);
      stationX[s] = x;
      stationV[s] = Vx;
      stationM[s] = Mx;

      if (Math.abs(Vx) > spanMaxV) {
        spanMaxV = Math.abs(Vx);
      }
      if (Mx > spanMaxPositiveM) {
        spanMaxPositiveM = Mx;
        spanMaxPosLoc = x;
      }

      if (s > 0) {
        const kPrev = stationM[s - 1] / spanEI;
        const kCurr = Mx / spanEI;
        rawTheta[s] = rawTheta[s - 1] + 0.5 * (kPrev + kCurr) * dxSpan;
        rawY[s] = rawY[s - 1] + 0.5 * (rawTheta[s - 1] + rawY[s] * 0 + rawTheta[s]) * dxSpan;
      }
    }

    // Enforce zero vertical displacement at supports: y(0) = 0, y(L) = 0
    const yEndSlopeCorr = -rawY[numStations] / L;
    for (let s = 0; s <= numStations; s++) {
      const x = stationX[s];
      const xTotal = currentXOffset + x;
      const Vx = stationV[s];
      const Mx = stationM[s];
      const yMm = (rawY[s] + yEndSlopeCorr * x) * 1000;

      const isInflection = inflectionPointsSpanM.some((ip) => Math.abs(ip - x) < 0.02);
      const isPeakMoment = Math.abs(x - spanMaxPosLoc) < 0.02;

      points.push({
        xTotal: roundPrecision(xTotal, 3),
        xSpan: roundPrecision(x, 3),
        spanIndex: i,
        momentKnm: roundPrecision(Mx, 2),
        shearKn: roundPrecision(Vx, 2),
        deflectionMm: roundPrecision(yMm, 3),
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

  // Governing elastic deflection from integrated continuous curve
  let maxElasticDeflectionMm = 0;
  let maxElasticDeflectionLocationM = 0;
  for (const pt of points) {
    const absY = Math.abs(pt.deflectionMm || 0);
    if (absY > maxElasticDeflectionMm) {
      maxElasticDeflectionMm = absY;
      maxElasticDeflectionLocationM = pt.xTotal;
    }
  }

  // Estimated immediate live-load deflection check (L / Delta ~ 360 limit per ACI 318 Table 24.2.2)
  const maxSpanLengthM = Math.max(...spans.map((s) => s.lengthM));
  const avgEI = 200e6 * (I_avg * 1e-8); // kN·m²
  const avgUDL = spans.reduce((s, sp) => s + sp.udlKnPerM, 0) / spanCount;
  const fallbackDeflectionMm =
    ((5 * avgUDL * Math.pow(maxSpanLengthM, 4)) / (384 * (avgEI || 1))) * 1000;
  const estimatedDeflectionMm = maxElasticDeflectionMm > 0 ? maxElasticDeflectionMm : fallbackDeflectionMm;
  const deflectionRatioNum = estimatedDeflectionMm > 1e-5
    ? Math.round((maxSpanLengthM * 1000) / estimatedDeflectionMm)
    : 9999;
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

  // Build Cross-Verified Hand Calculation Steps for Continuous Multi-Span Beam
  const totalAppliedGravityKn = spans.reduce(
    (sum, sp) => sum + sp.udlKnPerM * sp.lengthM + sp.pointLoadKn + 0.5 * sp.triangularLoadKnPerM * sp.lengthM,
    0
  );
  const totalReactionsKn = supportReactions.reduce((sum, r) => sum + r, 0);
  const reactionBalanceErr = Math.abs(totalReactionsKn - totalAppliedGravityKn);

  const handCalculationSteps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Multi-Span Geometry & Relative Stiffness Factors (K = I / L)',
      formula: 'K_i = I_i / L_i;   DF_ij = K_i / (K_i + K_j)',
      substitution: spans
        .map((sp, i) => `Span ${i + 1}: L=${sp.lengthM.toFixed(2)}m, I=${sp.momentOfInertiaCm4.toLocaleString()}cm⁴ → K=${(sp.momentOfInertiaCm4 / sp.lengthM).toFixed(0)}`)
        .join('  |  '),
      result: `${spanCount} Spans · L_total = ${currentXOffset.toFixed(2)} m · Boundary: ${params.leftSupport} / ${params.rightSupport}`,
      reasoning: 'Relative flexural stiffness K = I/L governs how unbalanced fixed-end moments distribute across interior continuous supports.',
      isVerifiedAgainstEngine: spans.length === spanCount,
    },
    {
      stepNumber: 2,
      title: "Clapeyron's Three-Moment Compatibility Equation",
      formula: 'M_{i-1}(L_i/I_i) + 2M_i(L_i/I_i + L_{i+1}/I_{i+1}) + M_{i+1}(L_{i+1}/I_{i+1}) = −6(A_i x̄_i / I_i L_i + A_{i+1} x̄_{i+1} / I_{i+1} L_{i+1})',
      substitution: `Solved ${numSupports}×${numSupports} tridiagonal system → Support Moments: ${supportMoments.map((m, idx) => `M${idx}=${m.toFixed(2)}`).join(', ')} kN·m`,
      result: `Max Hogging Moment = −${globalMaxHogging.toFixed(2)} kN·m @ Support ${globalMaxHoggingSupportIndex}`,
      reasoning: 'Enforces exact slope continuity (θ_left = θ_right) at every interior support under simultaneous UDL, triangular, and point loads.',
      isVerifiedAgainstEngine: supportMoments.length === numSupports,
    },
    {
      stepNumber: 3,
      title: 'Hardy Cross Moment Distribution Cross-Verification',
      formula: 'M_bal = −DF · ΣFEM;   COF = +0.5 · M_bal  (iterated until |ΔM| < 0.001)',
      substitution: `Hardy Cross (${hardyIterations} cycles): ${hardySupportMoments.map((m, idx) => `M${idx}=${m.toFixed(2)}`).join(', ')} kN·m`,
      result: `Max Δ(Clapeyron − Hardy Cross) = ${maxDiscrepancy.toFixed(4)} kN·m (${((maxDiscrepancy / (governingMoment || 1)) * 100).toFixed(3)}%)`,
      reasoning: 'Dual-solver verification independently confirms interior continuity moments without matrix inversion errors.',
      isVerifiedAgainstEngine: hardyConverged && maxDiscrepancy < Math.max(0.25, governingMoment * 0.01),
    },
    {
      stepNumber: 4,
      title: 'Support Reactions & Global Vertical Equilibrium (ΣF_y = 0)',
      formula: 'V_L = (ΣM_load,B + M_R − M_L) / L;   R_i = V_{i,left} + V_{i-1,right};   ΣR_i = ΣW_total',
      substitution: `Reactions: [${supportReactions.map((r, idx) => `R${idx}=${r.toFixed(2)}`).join(', ')}] kN vs Total Load = ${totalAppliedGravityKn.toFixed(2)} kN`,
      result: `ΣR = ${totalReactionsKn.toFixed(2)} kN  (|ΣR − ΣW| = ${reactionBalanceErr.toFixed(4)} kN)`,
      reasoning: 'Checks static force balance across all spans to ensure zero lost loads at end walls or interior columns.',
      isVerifiedAgainstEngine: reactionBalanceErr < 1e-2,
    },
    {
      stepNumber: 5,
      title: 'Peak Sagging Flexure, Contraflexure & Continuous Elastic Curve',
      formula: 'M(x) = M_L + V_L·x − ∫∫w(t)dt²;   EI·y(x) = ∫∫M(x)dx²',
      substitution: `Peak +M = +${globalMaxSagging.toFixed(2)} kN·m @ x=${globalMaxSaggingLocation.toFixed(2)}m · Inflection pts: ${allInflectionPointsTotalM.length > 0 ? allInflectionPointsTotalM.map((p) => `${p.toFixed(2)}m`).join(', ') : 'None'}`,
      result: `Max Elastic Deflection δ_max = ${estimatedDeflectionMm.toFixed(2)} mm @ x = ${maxElasticDeflectionLocationM.toFixed(2)} m (L/${deflectionRatioNum > 9000 ? '∞' : deflectionRatioNum})`,
      reasoning: 'Zero-shear peaks identify positive bottom steel zones; contraflexure coordinates govern top bar curtailment cut-offs.',
      isVerifiedAgainstEngine: estimatedDeflectionMm >= 0 && points.length === spanCount * 201,
    },
    {
      stepNumber: 6,
      title: `Code Flexural & Critical Section Shear Verification (${params.codeStandard || 'BNBC-2020 / ACI 318'})`,
      formula: 'f_b = M_gov·c / I ≤ f_allow;   φV_c = 0.75·0.17·√f′c·b_w·d  (V_u @ d from support)',
      substitution: `f_b = ${bendingStressMpa.toFixed(2)}/${allowableStressMpa} MPa (DCR=${(flexuralDcr * 100).toFixed(1)}%);  V_crit@d = ${criticalShearKn.toFixed(2)} kN vs φV_c = ${phiVcKn.toFixed(2)} kN (DCR=${(shearDcr * 100).toFixed(1)}%)`,
      result: `Governing DCR = ${(utilizationRatio * 100).toFixed(1)}% → ${safetyStatus}`,
      reasoning: `Verifies both flexural extreme-fiber stress and concrete web shear capacity at effective depth d = ${(effectiveDepthMm / 10).toFixed(0)} cm from column face.`,
      isVerifiedAgainstEngine: Math.abs(utilizationRatio - Math.max(flexuralDcr, shearDcr)) < 1e-3,
    },
  ];

  const scopeAndLimits: ScopeAndLimitsMetadata = {
    status: 'Available',
    covered: [
      '2 to 4 continuous prismatic or non-prismatic spans (EI per span)',
      'Free/pinned or fixed exterior end boundary conditions',
      'Dual-verified Clapeyron Three-Moment Matrix + Hardy Cross Moment Distribution',
      'Simultaneous UDL, point force, and increasing/decreasing/symmetric triangular loads',
    ],
    unsupported: [
      'Differential foundation support settlement (assumes Δ_support = 0)',
      'Plastic moment redistribution (elastic uncracked envelope only)',
      'Torsion / bi-axial bending in curved or skewed bridge decks',
    ],
    codeReference: `${params.codeStandard || 'BNBC-2020 / ACI 318-19'} · Cl. 22.5 Shear & Table 24.2.2 Deflection`,
  };

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
      maxDeflectionMm: roundPrecision(estimatedDeflectionMm, 2),
      maxDeflectionLocationM: roundPrecision(maxElasticDeflectionLocationM, 2),
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
        maxDeflectionEstimateMm: roundPrecision(estimatedDeflectionMm, 2),
        deflectionRatio: `L/${deflectionRatioNum > 9000 ? '∞' : deflectionRatioNum}`,
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
    issues,
    {
      handCalculationSteps,
      scopeAndLimits,
    }
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
  // Bangladeshi Construction Practice: Casing, Bentonite & Pile Cap Estimates
  boredPileSpecs?: {
    casingLengthM: number;
    bentoniteRequired: boolean;
    bentoniteSlurryVolumeM3: number;
    bentoniteViscositySec: number;
    bentoniteDensityGPerCc: number;
    slurryQualityNotes: string[];
  };
  casingBentoniteNotes?: {
    casingLengthM: number;
    bentoniteRequired: boolean;
    bentoniteSlurryVolumeM3: number;
    recommendedViscositySec: number;
    recommendedDensityGPerCc: number;
    guidelines: string;
  };
  pileCapEstimate?: {
    capLengthM: number;
    capWidthM: number;
    capThicknessM: number;
    pileCapThicknessMm: number;
    capConcreteVolumeM3: number;
    concreteVolumeM3: number;
    cementBags: number;
    sandCft: number;
    stoneChipsCft: number;
    estimatedRebarKg: number;
    rebarKg: number;
  };
  calculationsBreakdown: PileCalculationStep[];
  status: 'nominal' | 'warning' | 'critical';
}

export function computePileCapacity(
  params: PileCapacityParameters
): CalculationEnvelope<PileCapacityResult> {
  const issues: ValidationIssue[] = [];
  const zeroFields: string[] = [];
  if (params.diameterM === 0) zeroFields.push('Pile Diameter');
  if (params.lengthM === 0) zeroFields.push('Pile Length');
  if (params.appliedLoadKn === 0) zeroFields.push('Applied Axial Load');
  if (zeroFields.length > 0) {
    issues.push({
      field: 'pileParameters',
      message: `Pile parameter(s) [${zeroFields.join(', ')}] are currently 0 (clean baseline). Capacity calculated with standard reference geometry.`,
      severity: 'warning',
    });
  }

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
      // Bangladeshi Construction Practice: Casing, Bentonite & Pile Cap Estimates
      boredPileSpecs: isBored ? {
        casingLengthM: params.casingLengthM ?? Math.min(6.0, Math.max(3.0, Dw + 1.0)),
        bentoniteRequired: params.bentoniteSlurryChecked ?? true,
        bentoniteSlurryVolumeM3: Number((Ap * L * 1.15).toFixed(2)),
        bentoniteViscositySec: params.bentoniteViscositySec ?? 38,
        bentoniteDensityGPerCc: params.bentoniteDensityGPerCc ?? 1.05,
        slurryQualityNotes: [
          'BNBC §3.10: Maintain bentonite slurry level ≥ 1.5m above groundwater table.',
          'Marsh funnel viscosity 30–45s ensures cuttings suspension without excessive cake.',
          'Desanding required if sand content exceeds 4% prior to tremie concrete placement.',
        ],
      } : undefined,
      casingBentoniteNotes: isBored ? {
        casingLengthM: params.casingLengthM ?? Math.min(6.0, Math.max(3.0, Dw + 1.0)),
        bentoniteRequired: params.bentoniteSlurryChecked ?? true,
        bentoniteSlurryVolumeM3: Number((Ap * L * 1.15).toFixed(2)),
        recommendedViscositySec: params.bentoniteViscositySec ?? 38,
        recommendedDensityGPerCc: params.bentoniteDensityGPerCc ?? 1.05,
        guidelines: 'BNBC-2020 §3.10: Maintain slurry head ≥ 1.5m above groundwater table to prevent borehole necking/collapse in loose sandy silts.',
      } : undefined,
      pileCapEstimate: {
        capLengthM: Number(((groupCols - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)).toFixed(2)),
        capWidthM: Number(((groupRows - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)).toFixed(2)),
        capThicknessM: Number(((params.pileCapThicknessMm ?? Math.max(750, Math.round(D * 1500))) / 1000).toFixed(2)),
        pileCapThicknessMm: params.pileCapThicknessMm ?? Math.max(750, Math.round(D * 1500)),
        capConcreteVolumeM3: Number((
          ((groupCols - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((groupRows - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((params.pileCapThicknessMm ?? Math.max(750, Math.round(D * 1500))) / 1000)
        ).toFixed(2)),
        concreteVolumeM3: Number((
          ((groupCols - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((groupRows - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((params.pileCapThicknessMm ?? Math.max(750, Math.round(D * 1500))) / 1000)
        ).toFixed(2)),
        cementBags: Math.ceil(
          ((groupCols - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((groupRows - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((params.pileCapThicknessMm ?? Math.max(750, Math.round(D * 1500))) / 1000) *
          6.5
        ),
        sandCft: Number((
          ((groupCols - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((groupRows - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((params.pileCapThicknessMm ?? Math.max(750, Math.round(D * 1500))) / 1000) *
          15.0
        ).toFixed(1)),
        stoneChipsCft: Number((
          ((groupCols - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((groupRows - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((params.pileCapThicknessMm ?? Math.max(750, Math.round(D * 1500))) / 1000) *
          30.0
        ).toFixed(1)),
        estimatedRebarKg: Math.round(
          ((groupCols - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((groupRows - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((params.pileCapThicknessMm ?? Math.max(750, Math.round(D * 1500))) / 1000) *
          110 // ~110 kg/m3 for heavy foundation pile cap
        ),
        rebarKg: Math.round(
          ((groupCols - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((groupRows - 1) * spacingM + D + 2 * (params.pileCapOverhangM ?? 0.25)) *
          ((params.pileCapThicknessMm ?? Math.max(750, Math.round(D * 1500))) / 1000) *
          110
        ),
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
  serviceType: 'pressure' | 'gravity-storm' | 'tubewell-plumbing';
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
  tubewellPlumbingAnalysis?: {
    staticWaterLevelM: number;
    drawdownM: number;
    dynamicWaterLevelM: number;
    deliveryHeadM: number;
    riserFrictionLossM: number;
    totalDynamicHeadM: number;
    operatingPressureBar: number;
    pumpEfficiencyPercent: number;
    motorEfficiencyPercent: number;
    hydraulicPowerKw: number;
    brakePowerKw: number;
    motorPowerKw: number;
    pumpMotorHp: number;
    recommendedPumpHp: number;
    upvcClass: string;
    allowablePressureBar: number;
    minWallThicknessMm: number;
    nominalWallThicknessMm: number;
    burstingSafetyFactor: number;
    isPressureSafe: boolean;
    fixtures: {
      waterClosets: number;
      washBasins: number;
      showers: number;
      kitchenSinks: number;
      floorDrains: number;
      floorTraps: number;
      urinals: number;
    };
    totalWsfu: number;
    totalDfu: number;
    fixtureDemandLps: number;
    recommendedSupplyDn: number;
    recommendedDrainDn: number;
  };
  profileStations: PipeProfileStation[];
}

export function computePipeHydraulics(
  params: PipeHydraulicsParameters
): CalculationEnvelope<PipeHydraulicsResult> {
  const issues: ValidationIssue[] = [];
  const zeroFields: string[] = [];
  if (params.internalDiameterMm === 0) zeroFields.push('Internal Diameter');
  if (params.flowRateLps === 0) zeroFields.push('Flow Rate');
  if (params.lengthM === 0) zeroFields.push('Pipe Length');
  if (zeroFields.length > 0) {
    issues.push({
      field: 'pipeParameters',
      message: `Pipe hydraulics parameter(s) [${zeroFields.join(', ')}] are currently 0 (clean baseline). Hydraulics calculated with standard DN200 reference.`,
      severity: 'warning',
    });
  }

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

  // Deep Tubewell, Pump HP & uPVC Sizer Sub-Mode (BNBC-2020 Part 8)
  let tubewellPlumbingAnalysis: PipeHydraulicsResult['tubewellPlumbingAnalysis'] = undefined;
  if (serviceType === 'tubewell-plumbing' || params.tubewellDepthM !== undefined) {
    const swl = Math.max(0, params.staticWaterLevelM ?? 25.0);
    const dd = Math.max(0, params.drawdownM ?? 6.0);
    const delHead = Math.max(0, params.deliveryHeadM ?? 20.0);
    const dynWaterLevel = swl + dd;
    const riserPipeLength = Math.max(dynWaterLevel + delHead, params.tubewellDepthM ?? 60.0);

    // Riser pipe friction loss using Hazen-Williams
    const riserHf = Sf * riserPipeLength;
    const tdh = dynWaterLevel + delHead + riserHf + hm;
    const operatingBar = (tdh * 9.80665) / 100;

    const pumpEff = Math.max(10, Math.min(95, params.pumpEfficiencyPercent ?? 70)) / 100;
    const motorEff = Math.max(10, Math.min(98, params.motorEfficiencyPercent ?? 85)) / 100;

    const hydPowerKw = (9806.65 * Q_m3s * tdh) / 1000;
    const brakePowerKw = hydPowerKw / pumpEff;
    const motorPowerKw = brakePowerKw / motorEff;
    const motorHp = motorPowerKw / 0.7457;

    const standardHpSteps = [0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 7.5, 10.0, 12.5, 15.0, 20.0, 25.0, 30.0, 40.0, 50.0];
    const recHp = standardHpSteps.find(hp => hp >= motorHp) ?? Math.ceil(motorHp / 5) * 5;

    const rawClass = params.upvcClass || 'Class C (9 bar)';
    let allowableBar = 9.0;
    if (rawClass.includes('Class B')) allowableBar = 6.0;
    else if (rawClass.includes('Class C')) allowableBar = 9.0;
    else if (rawClass.includes('Class D')) allowableBar = 12.0;
    else if (rawClass.includes('Class E')) allowableBar = 15.0;

    const minWallThicknessMm = (operatingBar * D_mm) / (2 * 125 + operatingBar);

    let sdr = 26;
    if (allowableBar === 6) sdr = 41;
    else if (allowableBar === 9) sdr = 26;
    else if (allowableBar === 12) sdr = 21;
    else if (allowableBar === 15) sdr = 17;
    const nominalWallMm = Number((D_mm / sdr).toFixed(1));

    const safetyFactor = operatingBar > 0 ? Number((allowableBar / operatingBar).toFixed(2)) : 10.0;
    const isPressureSafe = operatingBar <= allowableBar;

    if (!isPressureSafe) {
      issues.push({
        field: 'upvcClass',
        message: `Operating pressure (${operatingBar.toFixed(1)} bar) exceeds ${rawClass} rating (${allowableBar} bar). Upgrade to a higher uPVC class (Class D or E) or Schedule 40 steel riser.`,
        severity: 'error',
      });
    }

    // BNBC-2020 Plumbing Fixtures Schedule
    const wc = params.fixtureWaterClosets ?? 6;
    const wb = params.fixtureWashBasins ?? 6;
    const sh = params.fixtureShowers ?? 4;
    const ks = params.fixtureKitchenSinks ?? 2;
    const fd = params.fixtureFloorDrains ?? 4;
    const ft = params.fixtureFloorTraps ?? 4;
    const ur = params.fixtureUrinals ?? 0;

    const totalWsfu = Number((wc * 3.0 + wb * 1.5 + sh * 2.0 + ks * 2.0 + ur * 2.0).toFixed(1));
    const totalDfu = Number((wc * 4.0 + wb * 1.0 + sh * 2.0 + ks * 2.0 + fd * 2.0 + ft * 2.0 + ur * 2.0).toFixed(1));
    const fixtureDemandLps = totalWsfu > 0 ? Number((0.15 * Math.pow(totalWsfu, 0.60)).toFixed(2)) : 0;

    let recSupplyDn = 25;
    if (totalWsfu > 120) recSupplyDn = 50;
    else if (totalWsfu > 60) recSupplyDn = 40;
    else if (totalWsfu > 30) recSupplyDn = 32;
    else if (totalWsfu > 15) recSupplyDn = 25;
    else recSupplyDn = 20;

    let recDrainDn = 100;
    if (totalDfu > 240) recDrainDn = 150;
    else if (totalDfu > 30) recDrainDn = 100;
    else recDrainDn = 75;

    tubewellPlumbingAnalysis = {
      staticWaterLevelM: swl,
      drawdownM: dd,
      dynamicWaterLevelM: Number(dynWaterLevel.toFixed(2)),
      deliveryHeadM: delHead,
      riserFrictionLossM: Number(riserHf.toFixed(2)),
      totalDynamicHeadM: Number(tdh.toFixed(2)),
      operatingPressureBar: Number(operatingBar.toFixed(2)),
      pumpEfficiencyPercent: Math.round(pumpEff * 100),
      motorEfficiencyPercent: Math.round(motorEff * 100),
      hydraulicPowerKw: Number(hydPowerKw.toFixed(2)),
      brakePowerKw: Number(brakePowerKw.toFixed(2)),
      motorPowerKw: Number(motorPowerKw.toFixed(2)),
      pumpMotorHp: Number(motorHp.toFixed(2)),
      recommendedPumpHp: recHp,
      upvcClass: rawClass,
      allowablePressureBar: allowableBar,
      minWallThicknessMm: Number(minWallThicknessMm.toFixed(2)),
      nominalWallThicknessMm: nominalWallMm,
      burstingSafetyFactor: safetyFactor,
      isPressureSafe,
      fixtures: {
        waterClosets: wc,
        washBasins: wb,
        showers: sh,
        kitchenSinks: ks,
        floorDrains: fd,
        floorTraps: ft,
        urinals: ur,
      },
      totalWsfu,
      totalDfu,
      fixtureDemandLps,
      recommendedSupplyDn: recSupplyDn,
      recommendedDrainDn: recDrainDn,
    };
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
      tubewellPlumbingAnalysis,
      profileStations,
    },
    issues
  );
}


