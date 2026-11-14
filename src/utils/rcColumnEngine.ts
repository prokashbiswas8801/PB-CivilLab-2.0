import {
  RcColumnDesignCode,
  RcColumnParams,
  ValidationIssue,
} from '../types/civil';
import {
  CalculationEnvelope,
  CalculationStep,
  ScopeAndLimitsMetadata,
  createEnvelope,
} from './calculations';

export interface RcColumnBarCoord {
  id: string;
  xMm: number; // relative to section centroid (-b/2 .. +b/2)
  yMm: number; // relative to section centroid (-h/2 .. +h/2)
  areaMm2: number;
}

export interface RcColumnInteractionPoint {
  cMm: number;
  aMm: number;
  epsilonT: number;
  phi: number;
  pnKn: number;
  mnKnm: number;
  phiPnKn: number;
  phiMnKnm: number;
  regime: 'pure-compression' | 'compression-controlled' | 'transition' | 'balanced' | 'tension-controlled' | 'pure-bending' | 'pure-tension';
}

export interface RcColumnAxisResult {
  axis: 'X' | 'Y';
  depthMm: number;
  widthMm: number;
  dEffectiveMm: number;
  beta1: number;
  cBalancedMm: number;
  aBalancedMm: number;
  pBalancedKn: number;
  mBalancedKnm: number;
  phiPBalancedKn: number;
  phiMBalancedKnm: number;
  phiMnAtPuKnm: number;
  mnAtPuKnm: number;
  slendernessRatioKluR: number;
  slendernessLimit: number;
  isSlender: boolean;
  pcEulerKn: number;
  magnifierDeltaNs: number;
  appliedMomentKnm: number;
  minEccentricityMomentKnm: number;
  magnifiedMomentKnm: number;
  uniaxialDcr: number;
  curve: RcColumnInteractionPoint[];
}

export interface RcColumnDesignResult {
  designCode: RcColumnDesignCode;
  widthB_Mm: number;
  depthH_Mm: number;
  clearCoverMm: number;
  grossAreaMm2: number;
  totalBarCount: number;
  longitudinalBarDiaMm: number;
  astProvidedMm2: number;
  rhoPercent: number;
  rhoOk: boolean;
  bars: RcColumnBarCoord[];
  tieBarDiaMm: number;
  tieSpacingMm: number;
  maxAllowedTieSpacingMm: number;
  tieDetailingOk: boolean;
  concreteFcMpa: number;
  rebarFyMpa: number;
  // Axial bounds
  p0Kn: number;
  phiPnMaxKn: number;
  ptTensionKn: number;
  phiPtTensionKn: number;
  // Applied loads
  axialLoadPu_Kn: number;
  momentMux_Knm: number;
  momentMuy_Knm: number;
  // Axis interaction results
  xAxis: RcColumnAxisResult;
  yAxis: RcColumnAxisResult;
  // Biaxial checks
  breslerAlpha: number;
  breslerContourDcr: number;
  axialDcr: number;
  governingDcr: number;
  status: 'nominal' | 'warning' | 'critical';
}

function getCodeConstants(code: RcColumnDesignCode, fcMpa: number, fyMpa: number) {
  const esMpa = 200000;
  const ey = fyMpa / esMpa;
  if (code === 'Eurocode-2') {
    const epsCu = 0.0035;
    const lambda = fcMpa <= 50 ? 0.8 : Math.max(0.72, 0.8 - (fcMpa - 50) / 400);
    const eta = fcMpa <= 50 ? 1.0 : Math.max(0.85, 1.0 - (fcMpa - 50) / 200);
    const alphaCc = 0.85;
    const gammaC = 1.5;
    const gammaS = 1.15;
    // EC2 uses fcd = alphaCc*fc/gammaC and fyd = fy/gammaS; for unified P-M visualization,
    // keep nominal concrete block 0.85*fc*eta and equivalent phi factors ~ 1/1.50..1/1.15.
    return {
      epsCu,
      beta1: lambda,
      alphaConcrete: alphaCc * eta,
      phiComp: 1 / gammaC, // ~0.667
      phiTens: 1 / gammaS, // ~0.870
      maxAxialCutoffFactor: 0.85,
      esMpa,
      ey,
    };
  }
  // BNBC-2020 & ACI 318-19 share identical strain-compatibility constants
  const beta1 = fcMpa <= 28 ? 0.85 : Math.max(0.65, 0.85 - 0.05 * ((fcMpa - 28) / 7));
  return {
    epsCu: 0.003,
    beta1,
    alphaConcrete: 0.85,
    phiComp: 0.65, // Tied column compression-controlled
    phiTens: 0.90, // Tension-controlled
    maxAxialCutoffFactor: 0.80,
    esMpa,
    ey,
  };
}

function buildColumnBarLayout(
  bMm: number,
  hMm: number,
  coverMm: number,
  tieDiaMm: number,
  barDiaMm: number,
  nxRaw: number,
  nyRaw: number
): RcColumnBarCoord[] {
  const nx = Math.max(2, Math.round(nxRaw));
  const ny = Math.max(2, Math.round(nyRaw));
  const area = (Math.PI * barDiaMm * barDiaMm) / 4;
  const edgeOffsetX = coverMm + tieDiaMm + barDiaMm / 2;
  const edgeOffsetY = coverMm + tieDiaMm + barDiaMm / 2;
  const xHalf = Math.max(10, bMm / 2 - edgeOffsetX);
  const yHalf = Math.max(10, hMm / 2 - edgeOffsetY);

  const bars: RcColumnBarCoord[] = [];
  let idx = 1;

  // Top & Bottom faces (full nx)
  for (let i = 0; i < nx; i++) {
    const x = nx === 1 ? 0 : -xHalf + (2 * xHalf * i) / (nx - 1);
    bars.push({ id: `B${idx++}`, xMm: x, yMm: yHalf, areaMm2: area });
    bars.push({ id: `B${idx++}`, xMm: x, yMm: -yHalf, areaMm2: area });
  }

  // Interior Left & Right side bars (excluding corners)
  for (let j = 1; j < ny - 1; j++) {
    const y = -yHalf + (2 * yHalf * j) / (ny - 1);
    bars.push({ id: `B${idx++}`, xMm: -xHalf, yMm: y, areaMm2: area });
    bars.push({ id: `B${idx++}`, xMm: xHalf, yMm: y, areaMm2: area });
  }

  return bars;
}

function evaluateSectionAtNeutralAxis(
  cMm: number,
  sectionDepthMm: number,
  sectionWidthMm: number,
  barsInBendingDir: Array<{ distFromCompEdgeMm: number; areaMm2: number }>,
  fcMpa: number,
  fyMpa: number,
  constants: ReturnType<typeof getCodeConstants>
): { pnKn: number; mnKnm: number; epsilonT: number; phi: number; aMm: number } {
  const { epsCu, beta1, alphaConcrete, phiComp, phiTens, esMpa, ey } = constants;
  const aMm = Math.min(sectionDepthMm, Math.max(0, beta1 * cMm));

  // Concrete compression force & moment about geometric centroid (sectionDepthMm / 2)
  const fcN = alphaConcrete * fcMpa * sectionWidthMm * aMm;
  const concreteArmMm = sectionDepthMm / 2 - aMm / 2;
  let totalForceN = fcN;
  let totalMomentNmm = fcN * concreteArmMm;

  for (const bar of barsInBendingDir) {
    const dBar = bar.distFromCompEdgeMm;
    const epsS = cMm > 1e-6 ? epsCu * ((cMm - dBar) / cMm) : -ey;
    const rawStress = epsS * esMpa;
    const fs = Math.max(-fyMpa, Math.min(fyMpa, rawStress));
    // Subtract displaced concrete stress if bar falls within compression block aMm
    const concreteDisplaced = dBar <= aMm ? alphaConcrete * fcMpa : 0;
    const effectiveFs = fs - concreteDisplaced;
    const fBarN = bar.areaMm2 * effectiveFs;
    const barArmMm = sectionDepthMm / 2 - dBar;
    totalForceN += fBarN;
    totalMomentNmm += fBarN * barArmMm;
  }

  const dMax = Math.max(...barsInBendingDir.map((b) => b.distFromCompEdgeMm));
  const epsilonT = cMm > 1e-6 ? epsCu * ((dMax - cMm) / cMm) : 0.02;

  let phi = phiComp;
  if (epsilonT >= ey + 0.003) {
    phi = phiTens;
  } else if (epsilonT > ey) {
    phi = phiComp + ((epsilonT - ey) / 0.003) * (phiTens - phiComp);
  }

  return {
    pnKn: totalForceN / 1000,
    mnKnm: Math.max(0, totalMomentNmm / 1e6),
    epsilonT,
    phi,
    aMm,
  };
}

function interpolateCapacityAtAxialLoad(
  curve: RcColumnInteractionPoint[],
  puKn: number
): { phiMnKnm: number; mnKnm: number } {
  if (curve.length < 2) return { phiMnKnm: 0, mnKnm: 0 };
  const sorted = [...curve].sort((a, b) => b.phiPnKn - a.phiPnKn);
  const pMax = sorted[0].phiPnKn;
  const pMin = sorted[sorted.length - 1].phiPnKn;

  if (puKn > pMax) {
    return { phiMnKnm: 0, mnKnm: 0 };
  }
  if (puKn <= pMin) {
    return { phiMnKnm: 0, mnKnm: 0 };
  }

  let phiMnKnm = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    if ((p1.phiPnKn >= puKn && puKn >= p2.phiPnKn) || (p2.phiPnKn >= puKn && puKn >= p1.phiPnKn)) {
      const denom = p1.phiPnKn - p2.phiPnKn;
      const t = Math.abs(denom) > 1e-6 ? (p1.phiPnKn - puKn) / denom : 0;
      const cand = p1.phiMnKnm + t * (p2.phiMnKnm - p1.phiMnKnm);
      if (cand > phiMnKnm) phiMnKnm = cand;
    }
  }

  // Nominal capacity at nominal Pn ~ Pu / 0.8 (for reference)
  let mnKnm = 0;
  const sortedNom = [...curve].sort((a, b) => b.pnKn - a.pnKn);
  for (let i = 0; i < sortedNom.length - 1; i++) {
    const p1 = sortedNom[i];
    const p2 = sortedNom[i + 1];
    if (p1.pnKn >= puKn && puKn >= p2.pnKn) {
      const denom = p1.pnKn - p2.pnKn;
      const t = Math.abs(denom) > 1e-6 ? (p1.pnKn - puKn) / denom : 0;
      const cand = p1.mnKnm + t * (p2.mnKnm - p1.mnKnm);
      if (cand > mnKnm) mnKnm = cand;
    }
  }

  return { phiMnKnm, mnKnm };
}

function analyzeAxis(
  axis: 'X' | 'Y',
  sectionDepthMm: number,
  sectionWidthMm: number,
  bars: RcColumnBarCoord[],
  params: RcColumnParams,
  constants: ReturnType<typeof getCodeConstants>,
  p0Kn: number,
  phiPnMaxKn: number,
  ptTensionKn: number,
  phiPtTensionKn: number
): RcColumnAxisResult {
  const fcMpa = params.concreteFcMpa;
  const fyMpa = params.rebarFyMpa;

  const barsInDir = bars.map((b) => ({
    // For X-axis bending, compression edge is top (y = +h/2); distance = h/2 - yMm
    // For Y-axis bending, compression edge is right (x = +b/2); distance = b/2 - xMm
    distFromCompEdgeMm:
      axis === 'X' ? sectionDepthMm / 2 - b.yMm : sectionWidthMm / 2 - b.xMm,
    areaMm2: b.areaMm2,
  }));

  const dEffectiveMm = Math.max(...barsInDir.map((b) => b.distFromCompEdgeMm));
  const cBalancedMm = dEffectiveMm * (constants.epsCu / (constants.epsCu + constants.ey));
  const balEval = evaluateSectionAtNeutralAxis(
    cBalancedMm,
    sectionDepthMm,
    sectionWidthMm,
    barsInDir,
    fcMpa,
    fyMpa,
    constants
  );

  // Build interaction curve by sweeping c from pure compression to pure tension
  const curve: RcColumnInteractionPoint[] = [];
  curve.push({
    cMm: sectionDepthMm * 10,
    aMm: sectionDepthMm,
    epsilonT: -constants.epsCu,
    phi: constants.phiComp,
    pnKn: p0Kn,
    mnKnm: 0,
    phiPnKn: phiPnMaxKn,
    phiMnKnm: 0,
    regime: 'pure-compression',
  });

  const cRatios = [
    3.5, 2.5, 1.8, 1.4, 1.15, 1.0, 0.9, 0.82, 0.74, 0.66, 0.58, 0.5, 0.43,
    0.36, 0.3, 0.25, 0.2, 0.16, 0.12, 0.08, 0.05,
  ];
  const cSamples = Array.from(
    new Set([
      ...cRatios.map((r) => r * sectionDepthMm),
      cBalancedMm,
    ])
  ).sort((a, b) => b - a);

  for (const cMm of cSamples) {
    const ev = evaluateSectionAtNeutralAxis(
      cMm,
      sectionDepthMm,
      sectionWidthMm,
      barsInDir,
      fcMpa,
      fyMpa,
      constants
    );
    const isBal = Math.abs(cMm - cBalancedMm) < 1e-4;
    const regime: RcColumnInteractionPoint['regime'] = isBal
      ? 'balanced'
      : ev.epsilonT <= constants.ey
      ? 'compression-controlled'
      : ev.epsilonT < constants.ey + 0.003
      ? 'transition'
      : 'tension-controlled';

    curve.push({
      cMm,
      aMm: ev.aMm,
      epsilonT: ev.epsilonT,
      phi: ev.phi,
      pnKn: ev.pnKn,
      mnKnm: ev.mnKnm,
      phiPnKn: Math.min(phiPnMaxKn, ev.phi * ev.pnKn),
      phiMnKnm: ev.phi * ev.mnKnm,
      regime,
    });
  }

  // Bisection for Pure Bending (Pn = 0)
  let cLo = 0.001;
  let cHi = sectionDepthMm;
  for (let iter = 0; iter < 30; iter++) {
    const cMid = 0.5 * (cLo + cHi);
    const ev = evaluateSectionAtNeutralAxis(
      cMid,
      sectionDepthMm,
      sectionWidthMm,
      barsInDir,
      fcMpa,
      fyMpa,
      constants
    );
    if (ev.pnKn > 0) cHi = cMid;
    else cLo = cMid;
  }
  const cPureBend = 0.5 * (cLo + cHi);
  const evPureBend = evaluateSectionAtNeutralAxis(
    cPureBend,
    sectionDepthMm,
    sectionWidthMm,
    barsInDir,
    fcMpa,
    fyMpa,
    constants
  );
  curve.push({
    cMm: cPureBend,
    aMm: evPureBend.aMm,
    epsilonT: evPureBend.epsilonT,
    phi: evPureBend.phi,
    pnKn: 0,
    mnKnm: evPureBend.mnKnm,
    phiPnKn: 0,
    phiMnKnm: evPureBend.phi * evPureBend.mnKnm,
    regime: 'pure-bending',
  });

  // Pure Tension endpoint
  curve.push({
    cMm: 0,
    aMm: 0,
    epsilonT: 0.05,
    phi: constants.phiTens,
    pnKn: ptTensionKn,
    mnKnm: 0,
    phiPnKn: phiPtTensionKn,
    phiMnKnm: 0,
    regime: 'pure-tension',
  });

  // Sort curve monotonically by descending Pn for clean plotting & interpolation
  curve.sort((a, b) => b.pnKn - a.pnKn);

  // Slenderness & Moment Magnifier (ACI 318-19 / BNBC-2020 §6.6.4)
  const rMm = 0.3 * sectionDepthMm;
  const luMm = params.unsupportedLengthLu_M * 1000;
  const kFactor = params.effectiveLengthFactorK;
  const slendernessRatioKluR = rMm > 0 ? (kFactor * luMm) / rMm : 0;
  // Single curvature conservative limit (34 - 12 * 1.0 = 22 for braced, 22 for unbraced)
  const slendernessLimit = params.isBracedFrame ? 34 : 22;
  const isSlender = slendernessRatioKluR > slendernessLimit;

  const ecMpa = 4700 * Math.sqrt(Math.max(1, fcMpa));
  const igMm4 = (sectionWidthMm * Math.pow(sectionDepthMm, 3)) / 12;
  const betaDns = Math.min(1, Math.max(0, params.sustainedLoadRatioBetaDns ?? 0.6));
  const eiEffNmm2 = (0.4 * ecMpa * igMm4) / (1 + betaDns);
  const kLuMm = Math.max(100, kFactor * luMm);
  const pcEulerKn = (Math.PI * Math.PI * eiEffNmm2) / (kLuMm * kLuMm) / 1000;

  const puPos = Math.max(0, params.axialLoadPu_Kn);
  const cmFactor = 1.0; // Conservative uniform curvature
  const denom = 1 - puPos / (0.75 * Math.max(1, pcEulerKn));
  const magnifierDeltaNs =
    puPos <= 0
      ? 1.0
      : denom <= 0.05
      ? 9.99
      : isSlender
      ? Math.max(1.0, cmFactor / denom)
      : 1.0;

  const appliedMomentKnm = Math.abs(
    axis === 'X' ? params.momentMux_Knm : params.momentMuy_Knm
  );
  // Minimum ACI eccentricity e_min = 15 + 0.03 * h (mm)
  const eMinM = (15 + 0.03 * sectionDepthMm) / 1000;
  const minEccentricityMomentKnm = puPos * eMinM;
  const governingMomentRaw = Math.max(appliedMomentKnm, minEccentricityMomentKnm);
  const magnifiedMomentKnm = governingMomentRaw * magnifierDeltaNs;

  const capAtPu = interpolateCapacityAtAxialLoad(curve, params.axialLoadPu_Kn);
  const uniaxialDcr =
    params.axialLoadPu_Kn > phiPnMaxKn
      ? params.axialLoadPu_Kn / Math.max(1, phiPnMaxKn)
      : capAtPu.phiMnKnm > 1e-4
      ? magnifiedMomentKnm / capAtPu.phiMnKnm
      : magnifiedMomentKnm > 0.01
      ? 9.99
      : 0;

  return {
    axis,
    depthMm: sectionDepthMm,
    widthMm: sectionWidthMm,
    dEffectiveMm,
    beta1: constants.beta1,
    cBalancedMm,
    aBalancedMm: balEval.aMm,
    pBalancedKn: balEval.pnKn,
    mBalancedKnm: balEval.mnKnm,
    phiPBalancedKn: balEval.phi * balEval.pnKn,
    phiMBalancedKnm: balEval.phi * balEval.mnKnm,
    phiMnAtPuKnm: capAtPu.phiMnKnm,
    mnAtPuKnm: capAtPu.mnKnm,
    slendernessRatioKluR,
    slendernessLimit,
    isSlender,
    pcEulerKn,
    magnifierDeltaNs,
    appliedMomentKnm,
    minEccentricityMomentKnm,
    magnifiedMomentKnm,
    uniaxialDcr,
    curve,
  };
}

export function computeRcColumnDesign(
  params: RcColumnParams
): CalculationEnvelope<RcColumnDesignResult> {
  if (!params) {
    return createEnvelope<RcColumnDesignResult>(null, [
      { field: 'params', message: 'RC Column parameters are missing.', severity: 'error' },
    ]);
  }
  const issues: ValidationIssue[] = [];

  if (params.widthB_Mm < 150 || params.depthH_Mm < 150) {
    issues.push({
      field: 'widthB_Mm',
      message: 'Minimum column dimension should be ≥ 150 mm (typically ≥ 250 mm under BNBC-2020 seismic frames).',
      severity: 'error',
    });
  }
  if (params.concreteFcMpa < 15 || params.rebarFyMpa < 250) {
    issues.push({
      field: 'concreteFcMpa',
      message: 'Concrete grade f\'c must be ≥ 15 MPa and rebar yield fy ≥ 250 MPa.',
      severity: 'error',
    });
  }
  if (params.clearCoverMm < 20 || params.clearCoverMm >= Math.min(params.widthB_Mm, params.depthH_Mm) / 3) {
    issues.push({
      field: 'clearCoverMm',
      message: 'Clear cover must be ≥ 20 mm and compatible with column cross-section.',
      severity: 'error',
    });
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<RcColumnDesignResult>(null, issues);
  }

  const constants = getCodeConstants(params.designCode, params.concreteFcMpa, params.rebarFyMpa);
  const bars = buildColumnBarLayout(
    params.widthB_Mm,
    params.depthH_Mm,
    params.clearCoverMm,
    params.tieBarDiaMm,
    params.longitudinalBarDiaMm,
    params.barsAlongWidthB,
    params.barsAlongDepthH
  );

  const totalBarCount = bars.length;
  const astProvidedMm2 = bars.reduce((sum, b) => sum + b.areaMm2, 0);
  const grossAreaMm2 = params.widthB_Mm * params.depthH_Mm;
  const rhoPercent = (astProvidedMm2 / grossAreaMm2) * 100;
  const rhoOk = rhoPercent >= 1.0 && rhoPercent <= 8.0;

  if (rhoPercent < 1.0) {
    issues.push({
      field: 'longitudinalBarDiaMm',
      message: `Reinforcement ratio ρ_g = ${rhoPercent.toFixed(2)}% is below code minimum 1.0% (BNBC/ACI §10.6.1).`,
      severity: 'warning',
    });
  } else if (rhoPercent > 4.0) {
    issues.push({
      field: 'longitudinalBarDiaMm',
      message: `Reinforcement ratio ρ_g = ${rhoPercent.toFixed(2)}% exceeds 4.0% practical lap-splice congestion threshold (code max 8%).`,
      severity: 'warning',
    });
  }

  // Tie spacing limits (ACI 318-19 §25.7.2.1 / BNBC 2020)
  const maxAllowedTieSpacingMm = Math.min(
    16 * params.longitudinalBarDiaMm,
    48 * params.tieBarDiaMm,
    Math.min(params.widthB_Mm, params.depthH_Mm)
  );
  const tieDetailingOk =
    params.tieSpacingMm <= maxAllowedTieSpacingMm &&
    (params.longitudinalBarDiaMm <= 32 ? params.tieBarDiaMm >= 10 : params.tieBarDiaMm >= 12);
  if (!tieDetailingOk) {
    issues.push({
      field: 'tieSpacingMm',
      message: `Tie detailing warning: Spacing ${params.tieSpacingMm} mm exceeds max s_max = ${maxAllowedTieSpacingMm.toFixed(0)} mm or tie bar diameter < 10 mm.`,
      severity: 'warning',
    });
  }

  // Pure axial bounds
  const p0Kn =
    (constants.alphaConcrete * params.concreteFcMpa * (grossAreaMm2 - astProvidedMm2) +
      params.rebarFyMpa * astProvidedMm2) /
    1000;
  const phiPnMaxKn = constants.maxAxialCutoffFactor * constants.phiComp * p0Kn;
  const ptTensionKn = -(astProvidedMm2 * params.rebarFyMpa) / 1000;
  const phiPtTensionKn = constants.phiTens * ptTensionKn;

  const xAxis = analyzeAxis(
    'X',
    params.depthH_Mm,
    params.widthB_Mm,
    bars,
    params,
    constants,
    p0Kn,
    phiPnMaxKn,
    ptTensionKn,
    phiPtTensionKn
  );

  const yAxis = analyzeAxis(
    'Y',
    params.widthB_Mm,
    params.depthH_Mm,
    bars,
    params,
    constants,
    p0Kn,
    phiPnMaxKn,
    ptTensionKn,
    phiPtTensionKn
  );

  if (params.axialLoadPu_Kn > 0.75 * xAxis.pcEulerKn && xAxis.isSlender) {
    issues.push({
      field: 'axialLoadPu_Kn',
      message: 'Applied axial load approaches Euler buckling load Pc (Pu > 0.75 Pc) — increase column stiffness or reduce Lu.',
      severity: 'error',
    });
  }

  const axialDcr =
    params.axialLoadPu_Kn >= 0
      ? params.axialLoadPu_Kn / Math.max(1, phiPnMaxKn)
      : Math.abs(params.axialLoadPu_Kn) / Math.max(1, Math.abs(phiPtTensionKn));

  // Bresler Load Contour exponent alpha (~1.15 near low axial to 1.50 near balanced)
  const puRatio = Math.max(0, Math.min(1, params.axialLoadPu_Kn / Math.max(1, phiPnMaxKn)));
  const breslerAlpha = 1.15 + 0.35 * puRatio;
  const rX = xAxis.phiMnAtPuKnm > 1e-4 ? xAxis.magnifiedMomentKnm / xAxis.phiMnAtPuKnm : xAxis.magnifiedMomentKnm > 0.01 ? 9.99 : 0;
  const rY = yAxis.phiMnAtPuKnm > 1e-4 ? yAxis.magnifiedMomentKnm / yAxis.phiMnAtPuKnm : yAxis.magnifiedMomentKnm > 0.01 ? 9.99 : 0;
  const breslerContourDcr = Math.pow(Math.pow(rX, breslerAlpha) + Math.pow(rY, breslerAlpha), 1 / breslerAlpha);

  const governingDcr = Math.max(axialDcr, xAxis.uniaxialDcr, yAxis.uniaxialDcr, breslerContourDcr);
  const status: RcColumnDesignResult['status'] =
    governingDcr > 1.0 ? 'critical' : governingDcr > 0.85 ? 'warning' : 'nominal';

  if (governingDcr > 1.0) {
    issues.push({
      field: 'momentMux_Knm',
      message: `Factored demand (Pu = ${params.axialLoadPu_Kn} kN, Mcx = ${xAxis.magnifiedMomentKnm.toFixed(1)} kN·m, Mcy = ${yAxis.magnifiedMomentKnm.toFixed(1)} kN·m) falls outside φPn–φMn interaction envelope (DCR = ${(governingDcr * 100).toFixed(1)}%).`,
      severity: 'warning',
    });
  }

  const result: RcColumnDesignResult = {
    designCode: params.designCode,
    widthB_Mm: params.widthB_Mm,
    depthH_Mm: params.depthH_Mm,
    clearCoverMm: params.clearCoverMm,
    grossAreaMm2,
    totalBarCount,
    longitudinalBarDiaMm: params.longitudinalBarDiaMm,
    astProvidedMm2,
    rhoPercent,
    rhoOk,
    bars,
    tieBarDiaMm: params.tieBarDiaMm,
    tieSpacingMm: params.tieSpacingMm,
    maxAllowedTieSpacingMm,
    tieDetailingOk,
    concreteFcMpa: params.concreteFcMpa,
    rebarFyMpa: params.rebarFyMpa,
    p0Kn,
    phiPnMaxKn,
    ptTensionKn,
    phiPtTensionKn,
    axialLoadPu_Kn: params.axialLoadPu_Kn,
    momentMux_Knm: params.momentMux_Knm,
    momentMuy_Knm: params.momentMuy_Knm,
    xAxis,
    yAxis,
    breslerAlpha,
    breslerContourDcr,
    axialDcr,
    governingDcr,
    status,
  };

  // Transparent Step-by-Step Hand Calculation Engine
  const handCalculationSteps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Gross Geometry, Reinforcement Ratio (ρ_g) & Tie Limits',
      formula: 'A_g = b · h ,   A_st = n · (π/4) · d_b² ,   ρ_g = (A_st / A_g) × 100%',
      substitution: `A_g = ${params.widthB_Mm} × ${params.depthH_Mm} = ${grossAreaMm2.toLocaleString()} mm² | ${totalBarCount}-Ø${params.longitudinalBarDiaMm}mm → A_st = ${astProvidedMm2.toFixed(0)} mm²`,
      result: `ρ_g = ${rhoPercent.toFixed(2)}% (Allowed 1.0%–8.0%), Max Tie s = ${maxAllowedTieSpacingMm.toFixed(0)} mm`,
      reasoning: `Verifies code minimum/maximum steel ratio and lateral tie spacing against buckling of longitudinal bars.`,
      isVerifiedAgainstEngine: true,
    },
    {
      stepNumber: 2,
      title: 'Pure Axial Cutoff (P_0 & φP_n,max)',
      formula: `P_0 = ${constants.alphaConcrete.toFixed(2)}·f'c·(A_g - A_st) + f_y·A_st ,   φP_n,max = ${constants.maxAxialCutoffFactor.toFixed(2)}·φ_0·P_0`,
      substitution: `P_0 = ${constants.alphaConcrete.toFixed(2)}×${params.concreteFcMpa}×(${grossAreaMm2}-${astProvidedMm2.toFixed(0)}) + ${params.rebarFyMpa}×${astProvidedMm2.toFixed(0)} N`,
      result: `P_0 = ${p0Kn.toFixed(1)} kN | φP_n,max = ${phiPnMaxKn.toFixed(1)} kN (Tension φP_t = ${phiPtTensionKn.toFixed(1)} kN)`,
      reasoning: `Sets upper compression cap accounting for accidental minimum eccentricity.`,
      isVerifiedAgainstEngine: true,
    },
    {
      stepNumber: 3,
      title: 'Balanced Strain Failure (c_b, a_b, P_b, M_b — Major X-Axis)',
      formula: `c_b = d · [ε_cu / (ε_cu + f_y/E_s)] ,   a_b = β_1 · c_b`,
      substitution: `d = ${xAxis.dEffectiveMm.toFixed(1)} mm, ε_cu = ${constants.epsCu}, β_1 = ${xAxis.beta1.toFixed(3)} → c_b = ${xAxis.cBalancedMm.toFixed(1)} mm, a_b = ${xAxis.aBalancedMm.toFixed(1)} mm`,
      result: `Balanced Point: P_b = ${xAxis.pBalancedKn.toFixed(1)} kN (φP_b = ${xAxis.phiPBalancedKn.toFixed(1)} kN), M_b = ${xAxis.mBalancedKnm.toFixed(1)} kN·m`,
      reasoning: `Concrete crushing (ε_cu) and extreme tension steel yield (ε_y = ${constants.ey.toFixed(5)}) occur simultaneously.`,
      isVerifiedAgainstEngine: true,
    },
    {
      stepNumber: 4,
      title: 'Slenderness Ratio (kL_u / r) & Moment Magnifier (δ_ns)',
      formula: 'r = 0.30·h ,   EI_eff = 0.4·E_c·I_g / (1 + β_dns) ,   δ_ns = C_m / [1 - P_u / (0.75·P_c)]',
      substitution: `X: kL_u/r_x = ${xAxis.slendernessRatioKluR.toFixed(1)} (lim ${xAxis.slendernessLimit}), P_cx = ${xAxis.pcEulerKn.toFixed(0)} kN | Y: kL_u/r_y = ${yAxis.slendernessRatioKluR.toFixed(1)}`,
      result: `δ_ns,x = ${xAxis.magnifierDeltaNs.toFixed(3)} → M_cx = ${xAxis.magnifiedMomentKnm.toFixed(1)} kN·m | δ_ns,y = ${yAxis.magnifierDeltaNs.toFixed(3)} → M_cy = ${yAxis.magnifiedMomentKnm.toFixed(1)} kN·m`,
      reasoning: `Includes ACI/BNBC minimum eccentricity (15 + 0.03h mm) and second-order P-δ magnification when slender.`,
      isVerifiedAgainstEngine: true,
    },
    {
      stepNumber: 5,
      title: 'Uniaxial Interaction Envelope Check at P_u',
      formula: 'DCR_x = M_cx / φM_nx(P_u) ,   DCR_y = M_cy / φM_ny(P_u)',
      substitution: `At P_u = ${params.axialLoadPu_Kn} kN: φM_nx = ${xAxis.phiMnAtPuKnm.toFixed(1)} kN·m, φM_ny = ${yAxis.phiMnAtPuKnm.toFixed(1)} kN·m`,
      result: `DCR_x = ${(xAxis.uniaxialDcr * 100).toFixed(1)}% ,   DCR_y = ${(yAxis.uniaxialDcr * 100).toFixed(1)}%`,
      reasoning: `Interpolates exact φP_n–φM_n strain-compatibility curve at factored axial load P_u.`,
      isVerifiedAgainstEngine: true,
    },
    {
      stepNumber: 6,
      title: 'Bresler Biaxial Load Contour & Governing Utilization',
      formula: '(M_cx / φM_nx)^α + (M_cy / φM_ny)^α ≤ 1.0',
      substitution: `α = ${breslerAlpha.toFixed(2)} | [(${xAxis.magnifiedMomentKnm.toFixed(1)}/${xAxis.phiMnAtPuKnm.toFixed(1)})^${breslerAlpha.toFixed(2)} + (${yAxis.magnifiedMomentKnm.toFixed(1)}/${yAxis.phiMnAtPuKnm.toFixed(1)})^${breslerAlpha.toFixed(2)}]^(1/α)`,
      result: `Biaxial DCR = ${(breslerContourDcr * 100).toFixed(1)}% | Governing DCR = ${(governingDcr * 100).toFixed(1)}% (${status.toUpperCase()})`,
      reasoning: `Checks concurrent biaxial bending + axial load against the 3D failure surface.`,
      isVerifiedAgainstEngine: true,
    },
  ];

  const scopeAndLimits: ScopeAndLimitsMetadata = {
    status: 'Available',
    codeReference: `${params.designCode} (ACI 318-19 Ch. 10 & 22 / BNBC 2020 Part 6 Ch. 6 / EN 1992-1-1 §5.8 & §6.1)`,
    covered: [
      'Full rectangular column strain-compatibility sweep (pure compression to pure tension)',
      'Uniaxial φPn–φMn curves about both major (X) and minor (Y) centroidal axes',
      'Slenderness kLu/r evaluation, Euler Pc, and non-sway moment magnifier δns',
      'Bresler biaxial load contour interaction and tie detailing spacing checks',
    ],
    unsupported: [
      'Shear capacity Vc + Vs and seismic special boundary element confinement (ACI Ch. 18)',
      'Circular or irregular L/T-shaped column cross-sections (rectangular b×h supported)',
      'Unbraced sway frame Q stability index / story-drift second-order magnification',
    ],
  };

  return createEnvelope<RcColumnDesignResult>(result, issues, {
    handCalculationSteps,
    scopeAndLimits,
  });
}
