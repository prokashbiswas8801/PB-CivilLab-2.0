import {
  SectionAnalyzerParams,
  SectionShapeType,
  SectionStandardCode,
  SectionPolygonVertex,
  ValidationIssue,
} from '../types/civil';
import {
  CalculationEnvelope,
  CalculationStep,
  ScopeAndLimitsMetadata,
  createEnvelope,
} from './calculations';

/* -------------------------------------------------------------
   STANDARD STEEL SECTION CATALOGUE (mm)
------------------------------------------------------------- */
export interface SteelCatalogueEntry {
  id: string;
  name: string;
  series: 'IPE' | 'HEA' | 'HEB' | 'UB' | 'UC' | 'RHS' | 'SHS' | 'PFC';
  shape: SectionShapeType;
  depthH_Mm: number;
  widthB_Mm: number;
  webThicknessTw_Mm: number;
  flangeThicknessTf_Mm: number;
  wallThicknessT_Mm: number;
  massKgPerM: number;
}

export const STEEL_SECTION_CATALOGUE: SteelCatalogueEntry[] = [
  {
    id: 'ipe-200',
    name: 'IPE 200 (S275/S355 European Beam)',
    series: 'IPE',
    shape: 'i-beam',
    depthH_Mm: 200,
    widthB_Mm: 100,
    webThicknessTw_Mm: 5.6,
    flangeThicknessTf_Mm: 8.5,
    wallThicknessT_Mm: 5.6,
    massKgPerM: 22.4,
  },
  {
    id: 'ipe-300',
    name: 'IPE 300 (European Medium Flange I-Beam)',
    series: 'IPE',
    shape: 'i-beam',
    depthH_Mm: 300,
    widthB_Mm: 150,
    webThicknessTw_Mm: 7.1,
    flangeThicknessTf_Mm: 10.7,
    wallThicknessT_Mm: 7.1,
    massKgPerM: 42.2,
  },
  {
    id: 'ipe-400',
    name: 'IPE 400 (Heavy Girder I-Beam)',
    series: 'IPE',
    shape: 'i-beam',
    depthH_Mm: 400,
    widthB_Mm: 180,
    webThicknessTw_Mm: 8.6,
    flangeThicknessTf_Mm: 13.5,
    wallThicknessT_Mm: 8.6,
    massKgPerM: 66.3,
  },
  {
    id: 'hea-200',
    name: 'HEA 200 (Wide Flange Light)',
    series: 'HEA',
    shape: 'i-beam',
    depthH_Mm: 190,
    widthB_Mm: 200,
    webThicknessTw_Mm: 6.5,
    flangeThicknessTf_Mm: 10.0,
    wallThicknessT_Mm: 6.5,
    massKgPerM: 42.3,
  },
  {
    id: 'heb-200',
    name: 'HEB 200 (Wide Flange Column Section)',
    series: 'HEB',
    shape: 'i-beam',
    depthH_Mm: 200,
    widthB_Mm: 200,
    webThicknessTw_Mm: 9.0,
    flangeThicknessTf_Mm: 15.0,
    wallThicknessT_Mm: 9.0,
    massKgPerM: 61.3,
  },
  {
    id: 'heb-300',
    name: 'HEB 300 (Heavy Wide Flange Column)',
    series: 'HEB',
    shape: 'i-beam',
    depthH_Mm: 300,
    widthB_Mm: 300,
    webThicknessTw_Mm: 11.0,
    flangeThicknessTf_Mm: 19.0,
    wallThicknessT_Mm: 11.0,
    massKgPerM: 117.0,
  },
  {
    id: 'ub-254x146x37',
    name: 'UB 254×146×37 (UK Universal Beam)',
    series: 'UB',
    shape: 'i-beam',
    depthH_Mm: 256.0,
    widthB_Mm: 146.4,
    webThicknessTw_Mm: 6.3,
    flangeThicknessTf_Mm: 10.9,
    wallThicknessT_Mm: 6.3,
    massKgPerM: 37.0,
  },
  {
    id: 'uc-203x203x46',
    name: 'UC 203×203×46 (UK Universal Column)',
    series: 'UC',
    shape: 'i-beam',
    depthH_Mm: 203.2,
    widthB_Mm: 203.6,
    webThicknessTw_Mm: 7.2,
    flangeThicknessTf_Mm: 11.0,
    wallThicknessT_Mm: 7.2,
    massKgPerM: 46.1,
  },
  {
    id: 'rhs-200x120x8',
    name: 'RHS 200×120×8 (Hollow Box Section)',
    series: 'RHS',
    shape: 'hollow-box',
    depthH_Mm: 200,
    widthB_Mm: 120,
    webThicknessTw_Mm: 8.0,
    flangeThicknessTf_Mm: 8.0,
    wallThicknessT_Mm: 8.0,
    massKgPerM: 38.4,
  },
  {
    id: 'shs-150x150x4',
    name: 'SHS 150×150×4 (Slender Class 4 Box Demo)',
    series: 'SHS',
    shape: 'hollow-box',
    depthH_Mm: 150,
    widthB_Mm: 150,
    webThicknessTw_Mm: 4.0,
    flangeThicknessTf_Mm: 4.0,
    wallThicknessT_Mm: 4.0,
    massKgPerM: 18.2,
  },
  {
    id: 'pfc-200x75',
    name: 'PFC 200×75×23 (Parallel Flange Channel)',
    series: 'PFC',
    shape: 'channel',
    depthH_Mm: 200,
    widthB_Mm: 75,
    webThicknessTw_Mm: 6.0,
    flangeThicknessTf_Mm: 12.5,
    wallThicknessT_Mm: 6.0,
    massKgPerM: 23.4,
  },
];

/* -------------------------------------------------------------
   ANALYTICAL RESULT INTERFACES
------------------------------------------------------------- */
export type SectionClassNumber = 1 | 2 | 3 | 4;

export interface SectionSubRectangle {
  label: string;
  yMinMm: number;
  yMaxMm: number;
  zMinMm: number;
  zMaxMm: number;
  areaMm2: number;
  cyMm: number;
  czMm: number;
}

export interface SectionStressSample {
  zMm: number;
  widthMm: number;
  sigmaTotalMpa: number;
  sigmaAxialMpa: number;
  sigmaBendingYMpa: number;
  sigmaPlasticMpa: number;
  tauShearZMpa: number;
}

export interface SectionCornerStress {
  label: string;
  yMm: number;
  zMm: number;
  sigmaMpa: number;
  tauMpa: number;
  vonMisesMpa: number;
}

export interface NMInteractionPoint {
  mRatio: number; // M / M_pl_y
  nRatio: number; // N / N_pl (+ tension, - compression)
  momentKnm: number;
  axialKn: number;
  elasticMRatio?: number;
}

export interface MyMzInteractionPoint {
  myRatio: number;
  mzRatio: number;
  myKnm: number;
  mzKnm: number;
}

export interface SectionClassificationInfo {
  sectionClass: SectionClassNumber;
  classLabel: 'Class 1 (Plastic)' | 'Class 2 (Compact)' | 'Class 3 (Semi-Compact)' | 'Class 4 (Slender)';
  aiscEquivalent: 'Compact' | 'Non-Compact' | 'Slender';
  epsilon: number;
  flangeSlenderness: number;
  flangeLimitClass1: number;
  flangeLimitClass2: number;
  flangeLimitClass3: number;
  webSlenderness: number;
  webLimitClass1: number;
  webLimitClass2: number;
  webLimitClass3: number;
  governingPart: string;
  isPlasticAllowed: boolean;
  plasticBlockedReason: string | null;
}

export interface SectionAnalyzerResult {
  shape: SectionShapeType;
  presetName: string;
  designCode: SectionStandardCode;
  fyMpa: number;
  fydMpa: number;
  elasticModulusGpa: number;
  gammaM0: number;
  // Geometric Properties
  areaCm2: number;
  areaMm2: number;
  massKgPerM: number;
  centroidYMm: number; // from bottom-left bounding box origin
  centroidZMm: number;
  yMinMm: number; // relative to centroid
  yMaxMm: number;
  zMinMm: number;
  zMaxMm: number;
  depthMm: number;
  widthMm: number;
  iyCm4: number;
  izCm4: number;
  iyzCm4: number;
  ryMm: number;
  rzMm: number;
  welYTopCm3: number;
  welYBotCm3: number;
  welYMinCm3: number;
  welZMinCm3: number;
  wplYCm3: number;
  wplZCm3: number;
  shapeFactorY: number;
  shapeFactorZ: number;
  torsionConstantJCm4: number;
  // Numerical fiber verification deltas
  numericalAreaErrorPct: number;
  numericalIyErrorPct: number;
  numericalWplYErrorPct: number;
  // Classification & Guardrails
  classification: SectionClassificationInfo;
  // Elastic & Plastic Neutral Axes (relative to centroid)
  elasticNeutralAxisZMm: number | null; // Zero-stress line z_0 for pure major bending + N (if |Mz| small)
  plasticNeutralAxisZMm: number; // Relative to centroid (shifted under N)
  plasticNeutralAxisFromBottomMm: number;
  // Design Resistances
  nPlRdKn: number;
  mElYRdKnm: number;
  mElZRdKnm: number;
  mPlYRdKnm: number;
  mPlZRdKnm: number;
  mNyReducedRdKnm: number; // Exact PNA-reduced plastic moment capacity at applied N
  vPlZRdKn: number;
  // Applied Forces & Stresses
  axialForceN_Kn: number;
  momentMy_Knm: number;
  momentMz_Knm: number;
  shearVy_Kn: number;
  shearVz_Kn: number;
  torsionT_Knm: number;
  sigmaAxialMpa: number;
  sigmaTopMpa: number;
  sigmaBotMpa: number;
  sigmaMaxTensionMpa: number;
  sigmaMaxCompressionMpa: number;
  sigmaAbsMaxMpa: number;
  tauMaxShearZMpa: number;
  tauMaxShearYMpa: number;
  tauTorsionMpa: number;
  tauTotalMaxMpa: number;
  vonMisesMaxMpa: number;
  // Utilization Ratios (DCR)
  elasticStressDcr: number;
  shearStressDcr: number;
  plasticInteractionDcr: number | null; // null if blocked for Class 3/4
  governingDcr: number;
  status: 'nominal' | 'warning' | 'critical';
  // Geometry & Diagrams Data
  outlinePolygons: Array<Array<{ yMm: number; zMm: number }>>; // Outer shapes centered at centroid
  holePolygons: Array<Array<{ yMm: number; zMm: number }>>; // Inner holes centered at centroid
  stressProfile: SectionStressSample[];
  cornerStresses: SectionCornerStress[];
  nmInteractionCurve: NMInteractionPoint[];
  myMzInteractionCurve: MyMzInteractionPoint[];
}

/* -------------------------------------------------------------
   DEFAULT POLYGON & INTERNAL SLICER HELPERS
------------------------------------------------------------- */
export function createDefaultCustomPolygon(): SectionPolygonVertex[] {
  // Asymmetric L-Angle 150×100×12 mm
  return [
    { id: 'v1', yMm: 0, zMm: 0 },
    { id: 'v2', yMm: 100, zMm: 0 },
    { id: 'v3', yMm: 100, zMm: 12 },
    { id: 'v4', yMm: 12, zMm: 12 },
    { id: 'v5', yMm: 12, zMm: 150 },
    { id: 'v6', yMm: 0, zMm: 150 },
  ];
}

interface HorizontalSlice {
  zMm: number;
  dzMm: number;
  segments: Array<{ y1: number; y2: number }>; // merged y-intervals at height z
  widthMm: number;
  areaMm2: number;
  yMidWeightedSum: number;
  ySquaredIntegral: number; // ∫ y² dy across segments at this slice
}

/** Merge overlapping horizontal intervals [y1, y2] */
function mergeIntervals(intervals: Array<{ y1: number; y2: number }>): Array<{ y1: number; y2: number }> {
  const valid = intervals
    .filter((iv) => iv.y2 > iv.y1 + 1e-9)
    .sort((a, b) => a.y1 - b.y1);
  if (valid.length === 0) return [];
  const merged: Array<{ y1: number; y2: number }> = [valid[0]];
  for (let i = 1; i < valid.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = valid[i];
    if (curr.y1 <= prev.y2 + 1e-7) {
      prev.y2 = Math.max(prev.y2, curr.y2);
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

/** Ray-polygon scanline horizontal intersection intervals at height z */
function polygonScanlineIntervals(
  pts: Array<{ yMm: number; zMm: number }>,
  z: number
): Array<{ y1: number; y2: number }> {
  const xs: number[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    if ((p1.zMm <= z && p2.zMm > z) || (p2.zMm <= z && p1.zMm > z)) {
      const t = (z - p1.zMm) / (p2.zMm - p1.zMm);
      xs.push(p1.yMm + t * (p2.yMm - p1.yMm));
    }
  }
  xs.sort((a, b) => a - b);
  const intervals: Array<{ y1: number; y2: number }> = [];
  for (let i = 0; i + 1 < xs.length; i += 2) {
    if (xs[i + 1] > xs[i] + 1e-9) {
      intervals.push({ y1: xs[i], y2: xs[i + 1] });
    }
  }
  return intervals;
}

/** Exact Shoelace signed area, centroid, and moments via Green's theorem for a simple polygon */
function computePolygonExactProperties(pts: Array<{ yMm: number; zMm: number }>) {
  const n = pts.length;
  let twoA = 0;
  let cySum = 0;
  let czSum = 0;
  let iyRaw = 0;
  let izRaw = 0;
  let iyzRaw = 0;

  for (let i = 0; i < n; i++) {
    const y0 = pts[i].yMm;
    const z0 = pts[i].zMm;
    const y1 = pts[(i + 1) % n].yMm;
    const z1 = pts[(i + 1) % n].zMm;
    const cross = y0 * z1 - y1 * z0;
    twoA += cross;
    cySum += (y0 + y1) * cross;
    czSum += (z0 + z1) * cross;
    izRaw += (y0 * y0 + y0 * y1 + y1 * y1) * cross;
    iyRaw += (z0 * z0 + z0 * z1 + z1 * z1) * cross;
    iyzRaw += (y0 * z1 + 2 * y0 * z0 + 2 * y1 * z1 + y1 * z0) * cross;
  }

  const sign = twoA >= 0 ? 1 : -1;
  const area = Math.abs(twoA) / 2;
  if (area < 1e-6) {
    return { area: 0, cy: 0, cz: 0, iy: 0, iz: 0, iyz: 0 };
  }
  const cy = (sign * cySum) / (6 * area);
  const cz = (sign * czSum) / (6 * area);
  const iyOrigin = (sign * iyRaw) / 12;
  const izOrigin = (sign * izRaw) / 12;
  const iyzOrigin = (sign * iyzRaw) / 24;

  const iy = Math.max(0, iyOrigin - area * cz * cz);
  const iz = Math.max(0, izOrigin - area * cy * cy);
  const iyz = iyzOrigin - area * cy * cz;

  return { area, cy, cz, iy, iz, iyz };
}

/** Build sub-rectangles & contour polygons in uncentered bounding coordinates (origin at bottom-left) */
function buildSectionGeometry(params: SectionAnalyzerParams): {
  rects: SectionSubRectangle[];
  outlinePolygonsRaw: Array<Array<{ yMm: number; zMm: number }>>;
  holePolygonsRaw: Array<Array<{ yMm: number; zMm: number }>>;
  isPolygon: boolean;
  isCircular: boolean;
  zBoxMin: number;
  zBoxMax: number;
  yBoxMin: number;
  yBoxMax: number;
  torsionConstantJCm4: number;
  shearWebThicknessZ_Mm: number;
  shearWebThicknessY_Mm: number;
} {
  const shape = params.shape;
  const H = Math.max(1, params.depthH_Mm || 0);
  const B = Math.max(1, params.widthB_Mm || 0);
  const tw = Math.max(0.5, params.webThicknessTw_Mm || 0);
  const tf = Math.max(0.5, params.flangeThicknessTf_Mm || 0);
  const t = Math.max(0.5, params.wallThicknessT_Mm || 0);

  if (shape === 'rectangular') {
    const rects: SectionSubRectangle[] = [
      {
        label: 'Solid Rectangle',
        yMinMm: 0,
        yMaxMm: B,
        zMinMm: 0,
        zMaxMm: H,
        areaMm2: B * H,
        cyMm: B / 2,
        czMm: H / 2,
      },
    ];
    const bShort = Math.min(B, H);
    const hLong = Math.max(B, H);
    const ratio = bShort / hLong;
    const Jmm4 = hLong * Math.pow(bShort, 3) * (1 / 3 - 0.21 * ratio * (1 - Math.pow(ratio, 4) / 12));
    return {
      rects,
      outlinePolygonsRaw: [
        [
          { yMm: 0, zMm: 0 },
          { yMm: B, zMm: 0 },
          { yMm: B, zMm: H },
          { yMm: 0, zMm: H },
        ],
      ],
      holePolygonsRaw: [],
      isPolygon: false,
      isCircular: false,
      zBoxMin: 0,
      zBoxMax: H,
      yBoxMin: 0,
      yBoxMax: B,
      torsionConstantJCm4: Jmm4 / 1e4,
      shearWebThicknessZ_Mm: B,
      shearWebThicknessY_Mm: H,
    };
  }

  if (shape === 'circular') {
    const D = H;
    const R = D / 2;
    const pts: Array<{ yMm: number; zMm: number }> = [];
    for (let k = 0; k < 48; k++) {
      const ang = (k / 48) * Math.PI * 2;
      pts.push({ yMm: R + R * Math.cos(ang), zMm: R + R * Math.sin(ang) });
    }
    const Jmm4 = (Math.PI * Math.pow(D, 4)) / 32;
    return {
      rects: [],
      outlinePolygonsRaw: [pts],
      holePolygonsRaw: [],
      isPolygon: false,
      isCircular: true,
      zBoxMin: 0,
      zBoxMax: D,
      yBoxMin: 0,
      yBoxMax: D,
      torsionConstantJCm4: Jmm4 / 1e4,
      shearWebThicknessZ_Mm: D,
      shearWebThicknessY_Mm: D,
    };
  }

  if (shape === 'hollow-box') {
    const tWall = Math.min(t, B / 2 - 0.5, H / 2 - 0.5);
    const hInner = Math.max(1, H - 2 * tWall);
    const bInner = Math.max(1, B - 2 * tWall);
    const rects: SectionSubRectangle[] = [
      {
        label: 'Bottom Flange',
        yMinMm: 0,
        yMaxMm: B,
        zMinMm: 0,
        zMaxMm: tWall,
        areaMm2: B * tWall,
        cyMm: B / 2,
        czMm: tWall / 2,
      },
      {
        label: 'Top Flange',
        yMinMm: 0,
        yMaxMm: B,
        zMinMm: H - tWall,
        zMaxMm: H,
        areaMm2: B * tWall,
        cyMm: B / 2,
        czMm: H - tWall / 2,
      },
      {
        label: 'Left Web',
        yMinMm: 0,
        yMaxMm: tWall,
        zMinMm: tWall,
        zMaxMm: H - tWall,
        areaMm2: tWall * hInner,
        cyMm: tWall / 2,
        czMm: H / 2,
      },
      {
        label: 'Right Web',
        yMinMm: B - tWall,
        yMaxMm: B,
        zMinMm: tWall,
        zMaxMm: H - tWall,
        areaMm2: tWall * hInner,
        cyMm: B - tWall / 2,
        czMm: H / 2,
      },
    ];
    // Bredt-Batho closed box torsion constant J = 4 Am² / (2*(Bm + Hm)/t)
    const bm = B - tWall;
    const hm = H - tWall;
    const Am = bm * hm;
    const Jmm4 = (4 * Am * Am * tWall) / (2 * (bm + hm));
    return {
      rects,
      outlinePolygonsRaw: [
        [
          { yMm: 0, zMm: 0 },
          { yMm: B, zMm: 0 },
          { yMm: B, zMm: H },
          { yMm: 0, zMm: H },
        ],
      ],
      holePolygonsRaw: [
        [
          { yMm: tWall, zMm: tWall },
          { yMm: tWall + bInner, zMm: tWall },
          { yMm: tWall + bInner, zMm: tWall + hInner },
          { yMm: tWall, zMm: tWall + hInner },
        ],
      ],
      isPolygon: false,
      isCircular: false,
      zBoxMin: 0,
      zBoxMax: H,
      yBoxMin: 0,
      yBoxMax: B,
      torsionConstantJCm4: Jmm4 / 1e4,
      shearWebThicknessZ_Mm: 2 * tWall,
      shearWebThicknessY_Mm: 2 * tWall,
    };
  }

  if (shape === 'i-beam') {
    const tfEff = Math.min(tf, H / 2 - 0.5);
    const twEff = Math.min(tw, B);
    const hWeb = Math.max(1, H - 2 * tfEff);
    const yWebMin = (B - twEff) / 2;
    const yWebMax = (B + twEff) / 2;
    const rects: SectionSubRectangle[] = [
      {
        label: 'Bottom Flange',
        yMinMm: 0,
        yMaxMm: B,
        zMinMm: 0,
        zMaxMm: tfEff,
        areaMm2: B * tfEff,
        cyMm: B / 2,
        czMm: tfEff / 2,
      },
      {
        label: 'Web Plate',
        yMinMm: yWebMin,
        yMaxMm: yWebMax,
        zMinMm: tfEff,
        zMaxMm: H - tfEff,
        areaMm2: twEff * hWeb,
        cyMm: B / 2,
        czMm: H / 2,
      },
      {
        label: 'Top Flange',
        yMinMm: 0,
        yMaxMm: B,
        zMinMm: H - tfEff,
        zMaxMm: H,
        areaMm2: B * tfEff,
        cyMm: B / 2,
        czMm: H - tfEff / 2,
      },
    ];
    const outline: Array<{ yMm: number; zMm: number }> = [
      { yMm: 0, zMm: 0 },
      { yMm: B, zMm: 0 },
      { yMm: B, zMm: tfEff },
      { yMm: yWebMax, zMm: tfEff },
      { yMm: yWebMax, zMm: H - tfEff },
      { yMm: B, zMm: H - tfEff },
      { yMm: B, zMm: H },
      { yMm: 0, zMm: H },
      { yMm: 0, zMm: H - tfEff },
      { yMm: yWebMin, zMm: H - tfEff },
      { yMm: yWebMin, zMm: tfEff },
      { yMm: 0, zMm: tfEff },
    ];
    const Jmm4 = (2 * B * Math.pow(tfEff, 3) + hWeb * Math.pow(twEff, 3)) / 3;
    return {
      rects,
      outlinePolygonsRaw: [outline],
      holePolygonsRaw: [],
      isPolygon: false,
      isCircular: false,
      zBoxMin: 0,
      zBoxMax: H,
      yBoxMin: 0,
      yBoxMax: B,
      torsionConstantJCm4: Jmm4 / 1e4,
      shearWebThicknessZ_Mm: twEff,
      shearWebThicknessY_Mm: 2 * tfEff,
    };
  }

  if (shape === 't-section') {
    const tfEff = Math.min(tf, H - 1);
    const twEff = Math.min(tw, B);
    const hWeb = Math.max(1, H - tfEff);
    const yWebMin = (B - twEff) / 2;
    const yWebMax = (B + twEff) / 2;
    const rects: SectionSubRectangle[] = [
      {
        label: 'Vertical Stem (Web)',
        yMinMm: yWebMin,
        yMaxMm: yWebMax,
        zMinMm: 0,
        zMaxMm: hWeb,
        areaMm2: twEff * hWeb,
        cyMm: B / 2,
        czMm: hWeb / 2,
      },
      {
        label: 'Top Flange',
        yMinMm: 0,
        yMaxMm: B,
        zMinMm: hWeb,
        zMaxMm: H,
        areaMm2: B * tfEff,
        cyMm: B / 2,
        czMm: hWeb + tfEff / 2,
      },
    ];
    const outline: Array<{ yMm: number; zMm: number }> = [
      { yMm: yWebMin, zMm: 0 },
      { yMm: yWebMax, zMm: 0 },
      { yMm: yWebMax, zMm: hWeb },
      { yMm: B, zMm: hWeb },
      { yMm: B, zMm: H },
      { yMm: 0, zMm: H },
      { yMm: 0, zMm: hWeb },
      { yMm: yWebMin, zMm: hWeb },
    ];
    const Jmm4 = (B * Math.pow(tfEff, 3) + hWeb * Math.pow(twEff, 3)) / 3;
    return {
      rects,
      outlinePolygonsRaw: [outline],
      holePolygonsRaw: [],
      isPolygon: false,
      isCircular: false,
      zBoxMin: 0,
      zBoxMax: H,
      yBoxMin: 0,
      yBoxMax: B,
      torsionConstantJCm4: Jmm4 / 1e4,
      shearWebThicknessZ_Mm: twEff,
      shearWebThicknessY_Mm: tfEff,
    };
  }

  if (shape === 'channel') {
    const tfEff = Math.min(tf, H / 2 - 0.5);
    const twEff = Math.min(tw, B - 1);
    const hWeb = Math.max(1, H - 2 * tfEff);
    const rects: SectionSubRectangle[] = [
      {
        label: 'Bottom Flange',
        yMinMm: 0,
        yMaxMm: B,
        zMinMm: 0,
        zMaxMm: tfEff,
        areaMm2: B * tfEff,
        cyMm: B / 2,
        czMm: tfEff / 2,
      },
      {
        label: 'Vertical Web',
        yMinMm: 0,
        yMaxMm: twEff,
        zMinMm: tfEff,
        zMaxMm: H - tfEff,
        areaMm2: twEff * hWeb,
        cyMm: twEff / 2,
        czMm: H / 2,
      },
      {
        label: 'Top Flange',
        yMinMm: 0,
        yMaxMm: B,
        zMinMm: H - tfEff,
        zMaxMm: H,
        areaMm2: B * tfEff,
        cyMm: B / 2,
        czMm: H - tfEff / 2,
      },
    ];
    const outline: Array<{ yMm: number; zMm: number }> = [
      { yMm: 0, zMm: 0 },
      { yMm: B, zMm: 0 },
      { yMm: B, zMm: tfEff },
      { yMm: twEff, zMm: tfEff },
      { yMm: twEff, zMm: H - tfEff },
      { yMm: B, zMm: H - tfEff },
      { yMm: B, zMm: H },
      { yMm: 0, zMm: H },
    ];
    const Jmm4 = (2 * B * Math.pow(tfEff, 3) + hWeb * Math.pow(twEff, 3)) / 3;
    return {
      rects,
      outlinePolygonsRaw: [outline],
      holePolygonsRaw: [],
      isPolygon: false,
      isCircular: false,
      zBoxMin: 0,
      zBoxMax: H,
      yBoxMin: 0,
      yBoxMax: B,
      torsionConstantJCm4: Jmm4 / 1e4,
      shearWebThicknessZ_Mm: twEff,
      shearWebThicknessY_Mm: 2 * tfEff,
    };
  }

  // custom-polygon
  const pts =
    params.polygonPointsMm && params.polygonPointsMm.length >= 3
      ? params.polygonPointsMm.map((p) => ({ yMm: p.yMm, zMm: p.zMm }))
      : createDefaultCustomPolygon().map((p) => ({ yMm: p.yMm, zMm: p.zMm }));
  const yBoxMin = Math.min(...pts.map((p) => p.yMm));
  const yBoxMax = Math.max(...pts.map((p) => p.yMm));
  const zBoxMin = Math.min(...pts.map((p) => p.zMm));
  const zBoxMax = Math.max(...pts.map((p) => p.zMm));
  const polyProps = computePolygonExactProperties(pts);
  const estThickness = Math.max(4, Math.min(yBoxMax - yBoxMin, zBoxMax - zBoxMin) * 0.14);
  const approxJmm4 = (polyProps.area * estThickness * estThickness) / 3;
  return {
    rects: [],
    outlinePolygonsRaw: [pts],
    holePolygonsRaw: [],
    isPolygon: true,
    isCircular: false,
    zBoxMin,
    zBoxMax,
    yBoxMin,
    yBoxMax,
    torsionConstantJCm4: approxJmm4 / 1e4,
    shearWebThicknessZ_Mm: estThickness,
    shearWebThicknessY_Mm: estThickness,
  };
}

/* -------------------------------------------------------------
   EUROCODE 3 / AISC 360 SECTION CLASSIFICATION CHECK
------------------------------------------------------------- */
function classifyCrossSection(
  params: SectionAnalyzerParams,
  fyMpa: number,
  axialCompressionKn: number,
  momentMyKnm: number,
  depthMm: number,
  widthMm: number,
  areaMm2: number
): SectionClassificationInfo {
  const epsilon = Math.sqrt(235 / Math.max(100, fyMpa));
  const isAISC = params.designCode === 'AISC-360';
  const E_Mpa = (params.elasticModulusGpa || 210) * 1000;
  const lambdaFactor = isAISC ? Math.sqrt(E_Mpa / Math.max(100, fyMpa)) : epsilon;

  const tw = Math.max(0.5, params.webThicknessTw_Mm || 6);
  const tf = Math.max(0.5, params.flangeThicknessTf_Mm || 10);
  const tWall = Math.max(0.5, params.wallThicknessT_Mm || 6);

  // Solid rectangle / circle / solid polygon -> compact Class 1
  if (params.shape === 'rectangular' || params.shape === 'circular') {
    return {
      sectionClass: 1,
      classLabel: 'Class 1 (Plastic)',
      aiscEquivalent: 'Compact',
      epsilon,
      flangeSlenderness: Number(((widthMm / Math.max(1, depthMm)) * 10).toFixed(2)),
      flangeLimitClass1: Number((9 * epsilon).toFixed(1)),
      flangeLimitClass2: Number((10 * epsilon).toFixed(1)),
      flangeLimitClass3: Number((14 * epsilon).toFixed(1)),
      webSlenderness: Number((depthMm / Math.max(1, widthMm)).toFixed(2)),
      webLimitClass1: Number((72 * epsilon).toFixed(1)),
      webLimitClass2: Number((83 * epsilon).toFixed(1)),
      webLimitClass3: Number((124 * epsilon).toFixed(1)),
      governingPart: 'Solid Section (No Plate Local Buckling)',
      isPlasticAllowed: true,
      plasticBlockedReason: null,
    };
  }

  if (params.shape === 'custom-polygon') {
    const legMin = Math.min(widthMm, depthMm);
    const approxWall = Math.max(4, areaMm2 / Math.max(1, widthMm + depthMm));
    const slenderness = legMin / Math.max(1, approxWall);
    const lim3 = 14 * epsilon;
    const lim2 = 10 * epsilon;
    const lim1 = 9 * epsilon;
    const sectionClass: SectionClassNumber =
      slenderness <= lim1 ? 1 : slenderness <= lim2 ? 2 : slenderness <= lim3 ? 3 : 4;
    const blocked = sectionClass >= 3;
    return {
      sectionClass,
      classLabel:
        sectionClass === 1
          ? 'Class 1 (Plastic)'
          : sectionClass === 2
          ? 'Class 2 (Compact)'
          : sectionClass === 3
          ? 'Class 3 (Semi-Compact)'
          : 'Class 4 (Slender)',
      aiscEquivalent: sectionClass <= 2 ? 'Compact' : sectionClass === 3 ? 'Non-Compact' : 'Slender',
      epsilon,
      flangeSlenderness: Number(slenderness.toFixed(2)),
      flangeLimitClass1: Number(lim1.toFixed(1)),
      flangeLimitClass2: Number(lim2.toFixed(1)),
      flangeLimitClass3: Number(lim3.toFixed(1)),
      webSlenderness: Number(slenderness.toFixed(2)),
      webLimitClass1: Number(lim1.toFixed(1)),
      webLimitClass2: Number(lim2.toFixed(1)),
      webLimitClass3: Number(lim3.toFixed(1)),
      governingPart: 'Custom Polygon Outstand Proportions (A / (b+h) Estimate)',
      isPlasticAllowed: !blocked,
      plasticBlockedReason: blocked
        ? `Class ${sectionClass} thin-walled geometry (${slenderness.toFixed(1)} > ${lim2.toFixed(1)}): plastic N–M hinge capacity blocked; local buckling / elastic first-yield governs.`
        : null,
    };
  }

  // Compression web proportion alpha (EC3 Table 5.2): 0.5 for pure bending, 1.0 for pure compression
  const nPlKn = (areaMm2 * fyMpa) / 1000;
  const nRatio = Math.min(1, Math.max(0, axialCompressionKn / Math.max(1e-3, nPlKn)));
  const alpha = Math.abs(momentMyKnm) < 1e-3 && axialCompressionKn > 1e-3 ? 1.0 : Math.min(1.0, 0.5 + 0.5 * nRatio);

  if (params.shape === 'hollow-box') {
    const cFlange = Math.max(1, widthMm - 2 * tWall);
    const cWeb = Math.max(1, depthMm - 2 * tWall);
    const flangeSlenderness = cFlange / tWall;
    const webSlenderness = cWeb / tWall;

    const fLim1 = isAISC ? 1.12 * lambdaFactor : 33 * epsilon;
    const fLim2 = isAISC ? 1.40 * lambdaFactor : 38 * epsilon;
    const fLim3 = isAISC ? 1.49 * lambdaFactor : 42 * epsilon;

    // Web under combined compression & bending (EC3 Table 5.2 internal compression part)
    const wLim1 = isAISC
      ? 2.42 * lambdaFactor
      : alpha > 0.5
      ? (396 * epsilon) / Math.max(1, 13 * alpha - 1)
      : (36 * epsilon) / Math.max(0.2, alpha);
    const wLim2 = isAISC
      ? 3.76 * lambdaFactor
      : alpha > 0.5
      ? (456 * epsilon) / Math.max(1, 13 * alpha - 1)
      : (41.5 * epsilon) / Math.max(0.2, alpha);
    const wLim3 = isAISC ? 5.7 * lambdaFactor : 42 * epsilon;

    const fClass: SectionClassNumber =
      flangeSlenderness <= fLim1 ? 1 : flangeSlenderness <= fLim2 ? 2 : flangeSlenderness <= fLim3 ? 3 : 4;
    const wClass: SectionClassNumber =
      webSlenderness <= wLim1 ? 1 : webSlenderness <= wLim2 ? 2 : webSlenderness <= wLim3 ? 3 : 4;

    const sectionClass = Math.max(fClass, wClass) as SectionClassNumber;
    const blocked = sectionClass >= 3;
    return {
      sectionClass,
      classLabel:
        sectionClass === 1
          ? 'Class 1 (Plastic)'
          : sectionClass === 2
          ? 'Class 2 (Compact)'
          : sectionClass === 3
          ? 'Class 3 (Semi-Compact)'
          : 'Class 4 (Slender)',
      aiscEquivalent: sectionClass <= 2 ? 'Compact' : sectionClass === 3 ? 'Non-Compact' : 'Slender',
      epsilon,
      flangeSlenderness: Number(flangeSlenderness.toFixed(2)),
      flangeLimitClass1: Number(fLim1.toFixed(1)),
      flangeLimitClass2: Number(fLim2.toFixed(1)),
      flangeLimitClass3: Number(fLim3.toFixed(1)),
      webSlenderness: Number(webSlenderness.toFixed(2)),
      webLimitClass1: Number(wLim1.toFixed(1)),
      webLimitClass2: Number(wLim2.toFixed(1)),
      webLimitClass3: Number(wLim3.toFixed(1)),
      governingPart: fClass >= wClass ? 'Hollow Box Compression Flange' : 'Hollow Box Web',
      isPlasticAllowed: !blocked,
      plasticBlockedReason: blocked
        ? `Hollow box classified as Class ${sectionClass} (${fClass >= wClass ? `Flange c/t=${flangeSlenderness.toFixed(1)}` : `Web c/t=${webSlenderness.toFixed(1)}`}). Plastic N–M interaction is blocked; elastic limit state applies.`
        : null,
    };
  }

  // I-Beam, T-Section, Channel
  const cFlange =
    params.shape === 'channel'
      ? Math.max(1, widthMm - tw)
      : Math.max(1, (widthMm - tw) / 2);
  const cWeb =
    params.shape === 't-section'
      ? Math.max(1, depthMm - tf)
      : Math.max(1, depthMm - 2 * tf);

  const flangeSlenderness = cFlange / tf;
  const webSlenderness = cWeb / tw;

  const fLim1 = isAISC ? 0.38 * lambdaFactor : 9 * epsilon;
  const fLim2 = isAISC ? 0.56 * lambdaFactor : 10 * epsilon;
  const fLim3 = isAISC ? 1.0 * lambdaFactor : 14 * epsilon;

  const wLim1 = isAISC
    ? 3.76 * lambdaFactor * (1 - 1.54 * nRatio)
    : alpha > 0.5
    ? (396 * epsilon) / Math.max(1, 13 * alpha - 1)
    : (36 * epsilon) / Math.max(0.2, alpha);
  const wLim2 = isAISC
    ? 4.7 * lambdaFactor
    : alpha > 0.5
    ? (456 * epsilon) / Math.max(1, 13 * alpha - 1)
    : (41.5 * epsilon) / Math.max(0.2, alpha);
  const wLim3 = isAISC ? 5.7 * lambdaFactor : 124 * epsilon;

  const fClass: SectionClassNumber =
    flangeSlenderness <= fLim1 ? 1 : flangeSlenderness <= fLim2 ? 2 : flangeSlenderness <= fLim3 ? 3 : 4;
  const wClass: SectionClassNumber =
    webSlenderness <= wLim1 ? 1 : webSlenderness <= wLim2 ? 2 : webSlenderness <= wLim3 ? 3 : 4;

  const sectionClass = Math.max(fClass, wClass) as SectionClassNumber;
  const blocked = sectionClass >= 3;
  return {
    sectionClass,
    classLabel:
      sectionClass === 1
        ? 'Class 1 (Plastic)'
        : sectionClass === 2
        ? 'Class 2 (Compact)'
        : sectionClass === 3
        ? 'Class 3 (Semi-Compact)'
        : 'Class 4 (Slender)',
    aiscEquivalent: sectionClass <= 2 ? 'Compact' : sectionClass === 3 ? 'Non-Compact' : 'Slender',
    epsilon,
    flangeSlenderness: Number(flangeSlenderness.toFixed(2)),
    flangeLimitClass1: Number(fLim1.toFixed(1)),
    flangeLimitClass2: Number(fLim2.toFixed(1)),
    flangeLimitClass3: Number(fLim3.toFixed(1)),
    webSlenderness: Number(webSlenderness.toFixed(2)),
    webLimitClass1: Number(wLim1.toFixed(1)),
    webLimitClass2: Number(wLim2.toFixed(1)),
    webLimitClass3: Number(wLim3.toFixed(1)),
    governingPart: fClass >= wClass ? 'Outstand Compression Flange' : 'Web Under Bending + Compression',
    isPlasticAllowed: !blocked,
    plasticBlockedReason: blocked
      ? `Class ${sectionClass} (${fClass >= wClass ? `Flange c/t=${flangeSlenderness.toFixed(1)} > ${fLim2.toFixed(1)}` : `Web c/t=${webSlenderness.toFixed(1)} > ${wLim2.toFixed(1)}`}). Local buckling prevents full plastic hinge development; Plastic N–M interaction is blocked.`
      : null,
  };
}

/* -------------------------------------------------------------
   MAIN ANALYTICAL ENGINE
------------------------------------------------------------- */
export function computeSectionMechanics(
  params: SectionAnalyzerParams
): CalculationEnvelope<SectionAnalyzerResult> {
  if (!params) {
    return createEnvelope<SectionAnalyzerResult>(null, [
      { field: 'params', message: 'Section Analyzer parameters are missing.', severity: 'error' },
    ]);
  }
  const issues: ValidationIssue[] = [];

  const scopeAndLimits: ScopeAndLimitsMetadata = {
    status: 'Available',
    codeReference: `${params.designCode} Section Classification, Elastic Stress Superposition & Plastic N–M Interaction`,
    covered: [
      'Exact Parallel Axis Theorem & Green-theorem polygon geometry',
      'Biaxial elastic stress σ = N/A + My·z/Iy − Mz·y/Iz & shear flow τ = VQ/It',
      'Eurocode 3 / AISC 360 Class 1–4 flange & web slenderness verification',
      'Exact Plastic Neutral Axis (PNA) shift & full N–M / My–Mz interaction curves',
    ],
    unsupported: [
      'Lateral-torsional buckling (LTB) along unbraced span length L_b',
      'Warping torsion (bi-moment B_Ed) for non-uniform restrained warping',
      'Class 4 effective width reduction (A_eff, W_eff) post-buckling design',
    ],
  };

  // Validate basic material inputs
  const fyMpa = params.fyMpa || 0;
  const E_Gpa = params.elasticModulusGpa || 0;
  const gammaM0 = params.gammaM0 || 0;

  if (fyMpa <= 0) {
    issues.push({ field: 'fyMpa', message: 'Yield strength f_y must be positive (> 0 MPa).', severity: 'error' });
  }
  if (E_Gpa <= 0) {
    issues.push({ field: 'elasticModulusGpa', message: 'Elastic modulus E must be positive (> 0 GPa).', severity: 'error' });
  }
  if (gammaM0 < 0.85) {
    issues.push({ field: 'gammaM0', message: 'Partial resistance factor γ_M0 must be ≥ 0.85 (typically 1.00 EC3 / 1.11 AISC).', severity: 'error' });
  }

  // Geometry validation
  if (params.shape === 'custom-polygon') {
    if (!params.polygonPointsMm || params.polygonPointsMm.length < 3) {
      issues.push({ field: 'polygonPointsMm', message: 'Custom polygon requires at least 3 vertices.', severity: 'error' });
    }
  } else {
    if ((params.depthH_Mm || 0) <= 0) {
      issues.push({ field: 'depthH_Mm', message: 'Section depth h (or diameter D) must be greater than 0 mm.', severity: 'error' });
    }
    if (params.shape !== 'circular' && (params.widthB_Mm || 0) <= 0) {
      issues.push({ field: 'widthB_Mm', message: 'Section width b must be greater than 0 mm.', severity: 'error' });
    }
    if (params.shape === 'hollow-box') {
      if ((params.wallThicknessT_Mm || 0) <= 0 || params.wallThicknessT_Mm * 2 >= Math.min(params.widthB_Mm, params.depthH_Mm)) {
        issues.push({ field: 'wallThicknessT_Mm', message: 'Hollow box wall thickness t must satisfy 0 < 2t < min(b, h).', severity: 'error' });
      }
    }
    if (params.shape === 'i-beam' || params.shape === 't-section' || params.shape === 'channel') {
      if ((params.webThicknessTw_Mm || 0) <= 0 || (params.flangeThicknessTf_Mm || 0) <= 0) {
        issues.push({ field: 'webThicknessTw_Mm', message: 'Web thickness t_w and flange thickness t_f must be > 0 mm.', severity: 'error' });
      }
      const mult = params.shape === 't-section' ? 1 : 2;
      if (params.flangeThicknessTf_Mm * mult >= params.depthH_Mm) {
        issues.push({ field: 'flangeThicknessTf_Mm', message: 'Total flange thickness must be less than overall depth h.', severity: 'error' });
      }
      if (params.webThicknessTw_Mm > params.widthB_Mm) {
        issues.push({ field: 'webThicknessTw_Mm', message: 'Web thickness t_w cannot exceed flange width b.', severity: 'error' });
      }
    }
  }

  if (issues.some((i) => i.severity === 'error')) {
    return createEnvelope<SectionAnalyzerResult>(null, issues, { scopeAndLimits });
  }

  const geom = buildSectionGeometry(params);
  const fydMpa = fyMpa / gammaM0;

  // 1. Discretize full cross-section into 400 horizontal fiber slices for universal numerical engine & shear Q(z)
  const N_SLICES = 400;
  const totalBoxHeight = Math.max(1e-3, geom.zBoxMax - geom.zBoxMin);
  const dz = totalBoxHeight / N_SLICES;
  const slices: HorizontalSlice[] = [];

  for (let i = 0; i < N_SLICES; i++) {
    const z = geom.zBoxMin + (i + 0.5) * dz;
    let rawIntervals: Array<{ y1: number; y2: number }> = [];

    if (geom.isCircular) {
      const R = totalBoxHeight / 2;
      const dzCenter = z - R;
      const halfChord = Math.sqrt(Math.max(0, R * R - dzCenter * dzCenter));
      rawIntervals = [{ y1: R - halfChord, y2: R + halfChord }];
    } else if (geom.isPolygon) {
      rawIntervals = polygonScanlineIntervals(geom.outlinePolygonsRaw[0], z);
    } else {
      for (const r of geom.rects) {
        if (z >= r.zMinMm - 1e-9 && z <= r.zMaxMm + 1e-9) {
          rawIntervals.push({ y1: r.yMinMm, y2: r.yMaxMm });
        }
      }
    }

    const segments = mergeIntervals(rawIntervals);
    let widthMm = 0;
    let yMidWeightedSum = 0;
    let ySquaredIntegral = 0;
    for (const seg of segments) {
      const w = seg.y2 - seg.y1;
      widthMm += w;
      const yMid = 0.5 * (seg.y1 + seg.y2);
      yMidWeightedSum += w * yMid;
      // ∫_{y1}^{y2} y² dy = (y2³ - y1³)/3
      ySquaredIntegral += (Math.pow(seg.y2, 3) - Math.pow(seg.y1, 3)) / 3;
    }

    slices.push({
      zMm: z,
      dzMm: dz,
      segments,
      widthMm,
      areaMm2: widthMm * dz,
      yMidWeightedSum,
      ySquaredIntegral,
    });
  }

  // Numerical Area, Centroid, I_y, I_z, I_yz
  const numAreaMm2 = slices.reduce((acc, s) => acc + s.areaMm2, 0);
  if (numAreaMm2 < 1e-4) {
    issues.push({ field: 'polygonPointsMm', message: 'Section area is zero or self-intersecting polygon.', severity: 'error' });
    return createEnvelope<SectionAnalyzerResult>(null, issues, { scopeAndLimits });
  }
  const numCentroidY = slices.reduce((acc, s) => acc + s.yMidWeightedSum * s.dzMm, 0) / numAreaMm2;
  const numCentroidZ = slices.reduce((acc, s) => acc + s.areaMm2 * s.zMm, 0) / numAreaMm2;
  const numIyMm4 = slices.reduce((acc, s) => {
    const dZ = s.zMm - numCentroidZ;
    return acc + s.areaMm2 * dZ * dZ + (s.widthMm * Math.pow(s.dzMm, 3)) / 12;
  }, 0);
  const numIzMm4 = slices.reduce((acc, s) => {
    const izSlice = s.ySquaredIntegral * s.dzMm - s.areaMm2 * numCentroidY * numCentroidY;
    return acc + (s.ySquaredIntegral - 2 * numCentroidY * s.yMidWeightedSum + numCentroidY * numCentroidY * s.widthMm) * s.dzMm;
  }, 0);

  // Analytical Closed-Form / Parallel Axis Theorem Properties
  let areaMm2 = numAreaMm2;
  let centroidYMm = numCentroidY;
  let centroidZMm = numCentroidZ;
  let iyMm4 = numIyMm4;
  let izMm4 = numIzMm4;
  let iyzMm4 = 0;

  if (geom.rects.length > 0) {
    areaMm2 = geom.rects.reduce((acc, r) => acc + r.areaMm2, 0);
    centroidYMm = geom.rects.reduce((acc, r) => acc + r.areaMm2 * r.cyMm, 0) / areaMm2;
    centroidZMm = geom.rects.reduce((acc, r) => acc + r.areaMm2 * r.czMm, 0) / areaMm2;
    iyMm4 = geom.rects.reduce((acc, r) => {
      const b = r.yMaxMm - r.yMinMm;
      const h = r.zMaxMm - r.zMinMm;
      const d = r.czMm - centroidZMm;
      return acc + (b * Math.pow(h, 3)) / 12 + r.areaMm2 * d * d;
    }, 0);
    izMm4 = geom.rects.reduce((acc, r) => {
      const b = r.yMaxMm - r.yMinMm;
      const h = r.zMaxMm - r.zMinMm;
      const d = r.cyMm - centroidYMm;
      return acc + (h * Math.pow(b, 3)) / 12 + r.areaMm2 * d * d;
    }, 0);
    iyzMm4 = geom.rects.reduce((acc, r) => {
      return acc + r.areaMm2 * (r.cyMm - centroidYMm) * (r.czMm - centroidZMm);
    }, 0);
  } else if (geom.isCircular) {
    const D = totalBoxHeight;
    areaMm2 = (Math.PI * D * D) / 4;
    centroidYMm = D / 2;
    centroidZMm = D / 2;
    iyMm4 = (Math.PI * Math.pow(D, 4)) / 64;
    izMm4 = iyMm4;
    iyzMm4 = 0;
  } else if (geom.isPolygon) {
    const poly = computePolygonExactProperties(geom.outlinePolygonsRaw[0]);
    areaMm2 = poly.area;
    centroidYMm = poly.cy;
    centroidZMm = poly.cz;
    iyMm4 = poly.iy;
    izMm4 = poly.iz;
    iyzMm4 = poly.iyz;
  }

  // Numerical cross-check error %
  const numericalAreaErrorPct = Math.abs(numAreaMm2 - areaMm2) / Math.max(1e-6, areaMm2) * 100;
  const numericalIyErrorPct = Math.abs(numIyMm4 - iyMm4) / Math.max(1e-6, iyMm4) * 100;

  // Bounding coordinates relative to Centroid (0, 0)
  const yMinMm = geom.yBoxMin - centroidYMm;
  const yMaxMm = geom.yBoxMax - centroidYMm;
  const zMinMm = geom.zBoxMin - centroidZMm;
  const zMaxMm = geom.zBoxMax - centroidZMm;
  const depthMm = zMaxMm - zMinMm;
  const widthMm = yMaxMm - yMinMm;

  const ryMm = Math.sqrt(iyMm4 / areaMm2);
  const rzMm = Math.sqrt(izMm4 / areaMm2);

  const welYTopMm3 = iyMm4 / Math.max(1e-3, Math.abs(zMaxMm));
  const welYBotMm3 = iyMm4 / Math.max(1e-3, Math.abs(zMinMm));
  const welYMinMm3 = Math.min(welYTopMm3, welYBotMm3);
  const welZMinMm3 = izMm4 / Math.max(1e-3, Math.max(Math.abs(yMinMm), Math.abs(yMaxMm)));

  // Plastic Section Moduli W_pl_y & W_pl_z via cumulative area bisection (exact Equal Area Axis)
  const findEqualAreaZ = (targetAreaBottom: number): number => {
    let cum = 0;
    for (const s of slices) {
      if (cum + s.areaMm2 >= targetAreaBottom) {
        const frac = s.areaMm2 > 1e-9 ? (targetAreaBottom - cum) / s.areaMm2 : 0.5;
        return s.zMm - 0.5 * s.dzMm + frac * s.dzMm;
      }
      cum += s.areaMm2;
    }
    return geom.zBoxMax;
  };

  const zEaaYRaw = findEqualAreaZ(areaMm2 / 2);
  const wplYNumMm3 = slices.reduce((acc, s) => {
    return acc + s.areaMm2 * Math.abs(s.zMm - zEaaYRaw);
  }, 0);

  // Analytical Wpl_y for symmetric rectangles / circles / I-beams / RHS / Channels
  let wplYMm3 = wplYNumMm3;
  if (params.shape === 'rectangular') {
    wplYMm3 = (widthMm * depthMm * depthMm) / 4;
  } else if (params.shape === 'circular') {
    wplYMm3 = Math.pow(depthMm, 3) / 6;
  } else if (params.shape === 'i-beam') {
    const tfEff = Math.min(params.flangeThicknessTf_Mm, depthMm / 2 - 0.5);
    const twEff = Math.min(params.webThicknessTw_Mm, widthMm);
    const hWeb = depthMm - 2 * tfEff;
    wplYMm3 = widthMm * tfEff * (depthMm - tfEff) + (twEff * hWeb * hWeb) / 4;
  } else if (params.shape === 'hollow-box') {
    const tWall = Math.min(params.wallThicknessT_Mm, widthMm / 2 - 0.5, depthMm / 2 - 0.5);
    const bIn = widthMm - 2 * tWall;
    const hIn = depthMm - 2 * tWall;
    wplYMm3 = (widthMm * depthMm * depthMm - bIn * hIn * hIn) / 4;
  }
  const numericalWplYErrorPct = Math.abs(wplYNumMm3 - wplYMm3) / Math.max(1e-6, wplYMm3) * 100;

  // Wpl_z by vertical slicing (160 slices along Y)
  let wplZMm3 = 0;
  {
    const NY = 160;
    const dy = widthMm / NY;
    const yCols: Array<{ yMm: number; areaMm2: number }> = [];
    for (let j = 0; j < NY; j++) {
      const yAbs = geom.yBoxMin + (j + 0.5) * dy;
      let hSum = 0;
      for (const s of slices) {
        for (const seg of s.segments) {
          if (yAbs >= seg.y1 && yAbs <= seg.y2) {
            hSum += s.dzMm;
          }
        }
      }
      yCols.push({ yMm: yAbs, areaMm2: hSum * dy });
    }
    const halfA = yCols.reduce((a, c) => a + c.areaMm2, 0) / 2;
    let cumY = 0;
    let yEaaRaw = centroidYMm;
    for (const c of yCols) {
      if (cumY + c.areaMm2 >= halfA) {
        const frac = c.areaMm2 > 1e-9 ? (halfA - cumY) / c.areaMm2 : 0.5;
        yEaaRaw = c.yMm - 0.5 * dy + frac * dy;
        break;
      }
      cumY += c.areaMm2;
    }
    wplZMm3 = yCols.reduce((acc, c) => acc + c.areaMm2 * Math.abs(c.yMm - yEaaRaw), 0);
  }

  // Section Classification (EC3 / AISC)
  const appliedN_Kn = params.axialForceN_Kn || 0;
  const appliedMy_Knm = params.momentMy_Knm || 0;
  const appliedMz_Knm = params.momentMz_Knm || 0;
  const appliedVy_Kn = params.shearVy_Kn || 0;
  const appliedVz_Kn = params.shearVz_Kn || 0;
  const appliedT_Knm = params.torsionT_Knm || 0;

  // Magnitude of compression for web slenderness classification (negative N = compression; if user enters negative N, |N| compresses)
  const compressionForClassKn = appliedN_Kn < 0 ? Math.abs(appliedN_Kn) : Math.abs(appliedN_Kn);
  const classification = classifyCrossSection(
    params,
    fyMpa,
    compressionForClassKn,
    appliedMy_Knm,
    depthMm,
    widthMm,
    areaMm2
  );

  if (!classification.isPlasticAllowed && classification.plasticBlockedReason) {
    issues.push({
      field: 'classification',
      message: classification.plasticBlockedReason,
      severity: 'warning',
    });
  }

  // Design Resistances
  const nPlRdKn = (areaMm2 * fydMpa) / 1000;
  const mElYRdKnm = (welYMinMm3 * fydMpa) / 1e6;
  const mElZRdKnm = (welZMinMm3 * fydMpa) / 1e6;
  const mPlYRdKnm = (wplYMm3 * fydMpa) / 1e6;
  const mPlZRdKnm = (wplZMm3 * fydMpa) / 1e6;

  // Shear plastic capacity V_pl,z,Rd = A_v * (f_y / sqrt(3)) / gamma_M0
  const avZMm2 =
    params.shape === 'i-beam' || params.shape === 'channel'
      ? Math.max(geom.shearWebThicknessZ_Mm * (depthMm - 2 * params.flangeThicknessTf_Mm), areaMm2 * 0.25)
      : params.shape === 'hollow-box'
      ? (areaMm2 * depthMm) / (depthMm + widthMm)
      : params.shape === 'circular'
      ? (2 * areaMm2) / Math.PI
      : areaMm2 * (5 / 6);
  const vPlZRdKn = (avZMm2 * (fydMpa / Math.sqrt(3))) / 1000;

  // 2. Elastic Normal Stress & Transverse Shear Stress Distribution
  // σ(y, z) = N/A + My*z/Iy - Mz*y/Iz (where N > 0 tension in N, My > 0 produces +σ at +z, Mz > 0 produces -σ at +y)
  const N_N = appliedN_Kn * 1e3;
  const My_Nmm = appliedMy_Knm * 1e6;
  const Mz_Nmm = appliedMz_Knm * 1e6;
  const Vz_N = appliedVz_Kn * 1e3;
  const Vy_N = appliedVy_Kn * 1e3;

  const evalElasticSigma = (yRel: number, zRel: number) => {
    return N_N / areaMm2 + (My_Nmm * zRel) / iyMm4 - (Mz_Nmm * yRel) / izMm4;
  };

  // Elastic Neutral Axis z_0 (for y = 0 plane) where σ(0, z_0) = 0
  let elasticNeutralAxisZMm: number | null = null;
  if (Math.abs(My_Nmm) > 1e-3) {
    const z0 = -(N_N / areaMm2) * (iyMm4 / My_Nmm);
    if (z0 >= zMinMm * 1.5 && z0 <= zMaxMm * 1.5) {
      elasticNeutralAxisZMm = z0;
    }
  }

  // Plastic Neutral Axis (PNA) shift under N:
  // Target: Tension zone (+fyd) area minus Compression zone (-fyd) area = N / fyd -> A_above - A_below = -N / fyd (if bending +My puts tension on top +z)
  // Using +My direction: fibers with z > zPNA are in tension (+fyd), fibers with z < zPNA are in compression (-fyd).
  // Resultant N = (A_above - A_below)*fyd = (A - 2*A_below)*fyd => A_below = 0.5*(A - N/fyd)
  const nClampedN = Math.max(-0.999 * nPlRdKn * 1000, Math.min(0.999 * nPlRdKn * 1000, N_N));
  const targetAreaBelowMm2 = Math.max(0, Math.min(areaMm2, 0.5 * (areaMm2 - nClampedN / fydMpa)));
  const zPnaRaw = findEqualAreaZ(targetAreaBelowMm2);
  const plasticNeutralAxisZMm = zPnaRaw - centroidZMm;
  const plasticNeutralAxisFromBottomMm = zPnaRaw - geom.zBoxMin;

  // Exact Plastic Moment Capacity M_{N,y,Rd} at current applied N (bending about centroidal axis)
  const computePlasticMomentAtN = (nKnVal: number): { momentKnm: number; zPnaRelMm: number } => {
    const nRatio = nKnVal / Math.max(1e-6, nPlRdKn);
    if (Math.abs(nRatio) >= 1.0) return { momentKnm: 0, zPnaRelMm: nRatio > 0 ? zMinMm : zMaxMm };
    const aBelow = Math.max(0, Math.min(areaMm2, 0.5 * areaMm2 * (1 - nRatio)));
    const zpRaw = findEqualAreaZ(aBelow);
    // Integrate (z - centroidZ) * sign(z - zpRaw) * fyd * dA
    let mNmm = 0;
    for (const s of slices) {
      const signVal = s.zMm >= zpRaw ? 1 : -1;
      mNmm += s.areaMm2 * (s.zMm - centroidZMm) * signVal * fydMpa;
    }
    return { momentKnm: Math.abs(mNmm) / 1e6, zPnaRelMm: zpRaw - centroidZMm };
  };

  const pnaAtAppliedN = computePlasticMomentAtN(appliedN_Kn);
  const mNyReducedRdKnm = pnaAtAppliedN.momentKnm;

  // Stress Profile along 41 depth stations (using slices cumulative Q_y(z))
  // First build cumulative Q_y at every slice boundary for V*Q/(I*t)
  const PROFILE_STEPS = 41;
  const stressProfile: SectionStressSample[] = [];
  let maxTauZMpa = 0;

  for (let k = 0; k < PROFILE_STEPS; k++) {
    const frac = k / (PROFILE_STEPS - 1);
    const zRel = zMinMm + frac * depthMm;
    const zRaw = zRel + centroidZMm;

    // Width & First Moment Q_y(zRaw) = ∫_{zRaw}^{zMax} (z - centroidZ) t(z) dz
    let QyMm3 = 0;
    let widthAtZ = 0;
    let bestDist = Infinity;
    for (const s of slices) {
      const dist = Math.abs(s.zMm - zRaw);
      if (dist < bestDist) {
        bestDist = dist;
        widthAtZ = s.widthMm;
      }
      if (s.zMm >= zRaw) {
        QyMm3 += s.areaMm2 * (s.zMm - centroidZMm);
      }
    }
    const tEff = Math.max(1, widthAtZ);
    const tauShearZMpa = k === 0 || k === PROFILE_STEPS - 1 ? 0 : (Math.abs(Vz_N) * Math.abs(QyMm3)) / (iyMm4 * tEff);
    maxTauZMpa = Math.max(maxTauZMpa, tauShearZMpa);

    const sigmaAxialMpa = N_N / areaMm2;
    const sigmaBendingYMpa = (My_Nmm * zRel) / iyMm4;
    const sigmaTotalMpa = sigmaAxialMpa + sigmaBendingYMpa;
    const sigmaPlasticMpa = zRel >= plasticNeutralAxisZMm ? fydMpa : -fydMpa;

    stressProfile.push({
      zMm: zRel,
      widthMm: widthAtZ,
      sigmaTotalMpa,
      sigmaAxialMpa,
      sigmaBendingYMpa,
      sigmaPlasticMpa,
      tauShearZMpa,
    });
  }

  // Torsion shear stress τ_T
  const Jmm4 = Math.max(1, geom.torsionConstantJCm4 * 1e4);
  let tauTorsionMpa = 0;
  if (Math.abs(appliedT_Knm) > 1e-6) {
    const T_Nmm = Math.abs(appliedT_Knm) * 1e6;
    if (params.shape === 'circular') {
      tauTorsionMpa = (T_Nmm * (depthMm / 2)) / Jmm4;
    } else if (params.shape === 'hollow-box') {
      const tWall = Math.max(1, params.wallThicknessT_Mm);
      const Am = Math.max(1, (widthMm - tWall) * (depthMm - tWall));
      tauTorsionMpa = T_Nmm / (2 * Am * tWall);
    } else {
      const tMax = Math.max(params.flangeThicknessTf_Mm, params.webThicknessTw_Mm, 4);
      tauTorsionMpa = (T_Nmm * tMax) / Jmm4;
    }
  }

  // Approximate horizontal shear τ_y (1.5 * Vy / Av_y)
  const avYMm2 = Math.max(1, geom.shearWebThicknessY_Mm * widthMm);
  const tauMaxShearYMpa = Math.abs(Vy_N) > 1e-6 ? (1.25 * Math.abs(Vy_N)) / avYMm2 : 0;
  const tauTotalMaxMpa = maxTauZMpa + tauMaxShearYMpa + tauTorsionMpa;

  // Evaluate extreme corners from outline polygons
  const outlineCentered = geom.outlinePolygonsRaw.map((poly) =>
    poly.map((p) => ({ yMm: p.yMm - centroidYMm, zMm: p.zMm - centroidZMm }))
  );
  const holeCentered = geom.holePolygonsRaw.map((poly) =>
    poly.map((p) => ({ yMm: p.yMm - centroidYMm, zMm: p.zMm - centroidZMm }))
  );

  const cornerCandidates: Array<{ label: string; yMm: number; zMm: number }> = [];
  if (outlineCentered[0]) {
    outlineCentered[0].forEach((pt, idx) => {
      cornerCandidates.push({ label: `V${idx + 1}`, yMm: pt.yMm, zMm: pt.zMm });
    });
  }
  const cornerStresses: SectionCornerStress[] = cornerCandidates.map((c) => {
    const sig = evalElasticSigma(c.yMm, c.zMm);
    const tauApprox = Math.abs(c.zMm) < depthMm * 0.15 ? tauTotalMaxMpa : tauTorsionMpa;
    const vm = Math.sqrt(sig * sig + 3 * tauApprox * tauApprox);
    return {
      label: c.label,
      yMm: c.yMm,
      zMm: c.zMm,
      sigmaMpa: sig,
      tauMpa: tauApprox,
      vonMisesMpa: vm,
    };
  });

  const sigmaTopMpa = evalElasticSigma(0, zMaxMm);
  const sigmaBotMpa = evalElasticSigma(0, zMinMm);
  const allSigmas = cornerStresses.map((c) => c.sigmaMpa);
  const sigmaMaxTensionMpa = Math.max(0, ...allSigmas, sigmaTopMpa, sigmaBotMpa);
  const sigmaMaxCompressionMpa = Math.min(0, ...allSigmas, sigmaTopMpa, sigmaBotMpa);
  const sigmaAbsMaxMpa = Math.max(Math.abs(sigmaMaxTensionMpa), Math.abs(sigmaMaxCompressionMpa), ...allSigmas.map(Math.abs));
  const vonMisesMaxMpa = Math.max(
    Math.sqrt(sigmaAbsMaxMpa * sigmaAbsMaxMpa + 3 * tauTorsionMpa * tauTorsionMpa),
    Math.sqrt(Math.pow(N_N / areaMm2, 2) + 3 * tauTotalMaxMpa * tauTotalMaxMpa),
    ...cornerStresses.map((c) => c.vonMisesMpa)
  );

  // 3. Full N-M Plastic Interaction Envelope & My-Mz Biaxial Curve
  const nmInteractionCurve: NMInteractionPoint[] = [];
  const NM_STEPS = 41;
  for (let i = 0; i < NM_STEPS; i++) {
    // nRatio from +1.0 (pure tension) down to -1.0 (pure compression)
    const nRatio = 1 - (2 * i) / (NM_STEPS - 1);
    const nKnVal = nRatio * nPlRdKn;
    const cap = computePlasticMomentAtN(nKnVal);
    const mRatio = mPlYRdKnm > 1e-6 ? cap.momentKnm / mPlYRdKnm : 0;
    const elasticMRatio = Math.max(0, (1 - Math.abs(nRatio)) * (mElYRdKnm / Math.max(1e-6, mPlYRdKnm)));
    nmInteractionCurve.push({
      mRatio,
      nRatio,
      momentKnm: cap.momentKnm,
      axialKn: nKnVal,
      elasticMRatio,
    });
  }

  // Biaxial My-Mz Curve (EC3 §6.2.9.1 / Bresler power interaction: (My/MNy)^alpha + (Mz/MNz)^beta <= 1)
  const myMzInteractionCurve: MyMzInteractionPoint[] = [];
  const alphaExp = params.shape === 'rectangular' || params.shape === 'hollow-box' ? 1.66 : 2.0;
  const betaExp =
    params.shape === 'i-beam'
      ? Math.max(1.0, 5 * (Math.abs(appliedN_Kn) / Math.max(1e-3, nPlRdKn)))
      : alphaExp;
  const nRedFactorZ = Math.max(0, 1 - Math.pow(Math.abs(appliedN_Kn) / Math.max(1e-3, nPlRdKn), 2));
  const mNzReducedKnm = mPlZRdKnm * nRedFactorZ;

  for (let k = 0; k <= 32; k++) {
    const theta = (k / 32) * (Math.PI / 2);
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    // Solve (r*c)^alpha + (r*s)^beta = 1 via simple bisection
    let lo = 0;
    let hi = 1.5;
    for (let it = 0; it < 20; it++) {
      const mid = 0.5 * (lo + hi);
      const val = Math.pow(mid * c, alphaExp) + Math.pow(mid * s, betaExp);
      if (val <= 1.0) lo = mid;
      else hi = mid;
    }
    const r = lo;
    myMzInteractionCurve.push({
      myRatio: r * c,
      mzRatio: r * s,
      myKnm: r * c * mNyReducedRdKnm,
      mzKnm: r * s * mNzReducedKnm,
    });
  }

  // 4. DCR Calculations & Scope Guardrail
  const elasticStressDcr = Math.max(sigmaAbsMaxMpa / Math.max(1, fydMpa), vonMisesMaxMpa / Math.max(1, fydMpa));
  const shearStressDcr = tauTotalMaxMpa / Math.max(1, fydMpa / Math.sqrt(3));

  let plasticInteractionDcr: number | null = null;
  if (classification.isPlasticAllowed) {
    const rMy = mNyReducedRdKnm > 1e-6 ? Math.abs(appliedMy_Knm) / mNyReducedRdKnm : Math.abs(appliedMy_Knm) > 1e-4 ? 9.99 : 0;
    const rMz = mNzReducedKnm > 1e-6 ? Math.abs(appliedMz_Knm) / mNzReducedKnm : Math.abs(appliedMz_Knm) > 1e-4 ? 9.99 : 0;
    const nTerm = Math.abs(appliedN_Kn) / Math.max(1e-6, nPlRdKn);
    if (Math.abs(appliedMz_Knm) < 1e-4) {
      // Exact uniaxial N + My radial utilization relative to N-M interaction envelope
      plasticInteractionDcr = Math.max(nTerm, rMy);
    } else {
      plasticInteractionDcr = Math.max(nTerm, Math.pow(rMy, alphaExp) + Math.pow(rMz, betaExp));
    }
  }

  const governingDcr =
    classification.isPlasticAllowed && plasticInteractionDcr !== null
      ? Math.max(plasticInteractionDcr, shearStressDcr)
      : Math.max(elasticStressDcr, shearStressDcr);

  const status: 'nominal' | 'warning' | 'critical' =
    governingDcr > 1.0
      ? 'critical'
      : governingDcr > 0.85 || !classification.isPlasticAllowed
      ? 'warning'
      : 'nominal';

  // 5. Hand-Calculation Derivation Steps (Verified against Numerical Engine)
  const handCalculationSteps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Cross-Sectional Area (A) & Centroid Coordinates (ȳ, z̄)',
      formula: 'A = Σ (bᵢ · hᵢ) ,   z̄ = [ Σ (Aᵢ · zᵢ) ] / A',
      substitution: `Area A = ${(areaMm2 / 100).toFixed(2)} cm² (${areaMm2.toFixed(0)} mm²), Centroid from bottom z̄ = ${(centroidZMm - geom.zBoxMin).toFixed(2)} mm`,
      result: `A = ${(areaMm2 / 100).toFixed(2)} cm² · Mass = ${((areaMm2 / 1e6) * 7850).toFixed(2)} kg/m`,
      reasoning: `Analytical decomposition matches 400-slice numerical fiber integration within ${numericalAreaErrorPct.toFixed(3)}%.`,
      isVerifiedAgainstEngine: numericalAreaErrorPct < 0.8,
    },
    {
      stepNumber: 2,
      title: 'Parallel Axis Theorem — Second Moments of Area (I_y, I_z)',
      formula: 'I_y = Σ [ (bᵢ · hᵢ³)/12 + Aᵢ · d_{z,i}² ]',
      substitution: `I_y = ${(iyMm4 / 1e4).toFixed(1)} cm⁴, I_z = ${(izMm4 / 1e4).toFixed(1)} cm⁴, r_y = ${ryMm.toFixed(1)} mm`,
      result: `I_y = ${(iyMm4 / 1e4).toFixed(1)} cm⁴ · I_z = ${(izMm4 / 1e4).toFixed(1)} cm⁴`,
      reasoning: `Parallel axis theorem verified against 400-layer numerical quadrature (Δ = ${numericalIyErrorPct.toFixed(3)}%).`,
      isVerifiedAgainstEngine: numericalIyErrorPct < 0.8,
    },
    {
      stepNumber: 3,
      title: 'Elastic & Plastic Section Moduli (W_el, W_pl)',
      formula: 'W_el,y = I_y / |z_max| ,   W_pl,y = ∫ |z − z_EAA| dA',
      substitution: `W_el,y(min) = ${(welYMinMm3 / 1e3).toFixed(1)} cm³, W_pl,y = ${(wplYMm3 / 1e3).toFixed(1)} cm³, Shape Factor α = ${(wplYMm3 / Math.max(1, welYMinMm3)).toFixed(3)}`,
      result: `W_pl,y / W_el,y = ${(wplYMm3 / Math.max(1, welYMinMm3)).toFixed(3)}`,
      reasoning: `Plastic modulus W_pl exceeds W_el by the shape factor α (1.50 rectangle, ~1.14 I-beam), verified within ${numericalWplYErrorPct.toFixed(2)}%.`,
      isVerifiedAgainstEngine: numericalWplYErrorPct < 1.2,
    },
    {
      stepNumber: 4,
      title: `${params.designCode} Local Buckling & Section Classification`,
      formula: 'ε = √(235 / f_y) ,   Check Flange c_f/t_f & Web c_w/t_w',
      substitution: `ε = ${classification.epsilon.toFixed(3)}, Flange c/t = ${classification.flangeSlenderness} (Lim2=${classification.flangeLimitClass2}), Web c/t = ${classification.webSlenderness} (Lim2=${classification.webLimitClass2})`,
      result: `${classification.classLabel} (${classification.aiscEquivalent})`,
      reasoning: classification.isPlasticAllowed
        ? 'Flange and web satisfy Class 1/2 compactness limits; full plastic hinge & N–M redistribution permitted.'
        : classification.plasticBlockedReason || 'Class 3/4 slender plate limit reached; plastic N–M blocked and elastic yield governs.',
      isVerifiedAgainstEngine: true,
    },
    {
      stepNumber: 5,
      title: 'Elastic Stress Superposition & Shear Flow (σ_max, τ_max)',
      formula: 'σ(y,z) = N/A + (M_y·z)/I_y − (M_z·y)/I_z ,   τ = (V·Q)/(I·t)',
      substitution: `σ_N = ${(N_N / areaMm2).toFixed(2)} MPa, σ_top = ${sigmaTopMpa.toFixed(2)} MPa, σ_bot = ${sigmaBotMpa.toFixed(2)} MPa, τ_max = ${tauTotalMaxMpa.toFixed(2)} MPa`,
      result: `σ_vM,max = ${vonMisesMaxMpa.toFixed(1)} MPa vs f_yd = ${fydMpa.toFixed(1)} MPa`,
      reasoning: `Elastic DCR = ${(elasticStressDcr * 100).toFixed(1)}%, Transverse + Torsional Shear DCR = ${(shearStressDcr * 100).toFixed(1)}%.`,
      isVerifiedAgainstEngine: true,
    },
    {
      stepNumber: 6,
      title: 'Plastic Neutral Axis (PNA) Shift & N–M Interaction Capacity',
      formula: 'A_below(PNA) = 0.5 · (A − N / f_yd) ,   M_N,y,Rd = ∫ (z − z̄) · σ_pl dA',
      substitution: classification.isPlasticAllowed
        ? `N = ${appliedN_Kn.toFixed(1)} kN (N_pl = ${nPlRdKn.toFixed(1)} kN) shifts PNA by ${plasticNeutralAxisZMm.toFixed(1)} mm from centroid → M_N,y,Rd = ${mNyReducedRdKnm.toFixed(2)} kN·m`
        : `Plastic N–M interaction BLOCKED for ${classification.classLabel}; governed by elastic capacity M_el,y,Rd = ${mElYRdKnm.toFixed(2)} kN·m`,
      result: classification.isPlasticAllowed && plasticInteractionDcr !== null
        ? `Plastic N–M DCR = ${(plasticInteractionDcr * 100).toFixed(1)}%`
        : `Elastic Stress DCR = ${(elasticStressDcr * 100).toFixed(1)}% (Plastic Blocked)`,
      reasoning: classification.isPlasticAllowed
        ? `Comparing applied M_y = ${appliedMy_Knm.toFixed(1)} kN·m against axial-reduced plastic moment M_N,y,Rd = ${mNyReducedRdKnm.toFixed(2)} kN·m.`
        : 'Scope guardrail actively prevents unconservative plastic design on semi-compact or slender Class 3/4 cross-sections.',
      isVerifiedAgainstEngine: true,
    },
  ];

  const catalogueMatch = STEEL_SECTION_CATALOGUE.find((c) => c.id === params.presetId);
  const presetName = catalogueMatch
    ? catalogueMatch.name
    : `${params.shape.replace('-', ' ').toUpperCase()} (${Math.round(depthMm)}×${Math.round(widthMm)})`;

  return createEnvelope<SectionAnalyzerResult>(
    {
      shape: params.shape,
      presetName,
      designCode: params.designCode,
      fyMpa,
      fydMpa,
      elasticModulusGpa: E_Gpa,
      gammaM0,
      areaCm2: areaMm2 / 100,
      areaMm2,
      massKgPerM: (areaMm2 / 1e6) * 7850,
      centroidYMm: centroidYMm - geom.yBoxMin,
      centroidZMm: centroidZMm - geom.zBoxMin,
      yMinMm,
      yMaxMm,
      zMinMm,
      zMaxMm,
      depthMm,
      widthMm,
      iyCm4: iyMm4 / 1e4,
      izCm4: izMm4 / 1e4,
      iyzCm4: iyzMm4 / 1e4,
      ryMm,
      rzMm,
      welYTopCm3: welYTopMm3 / 1e3,
      welYBotCm3: welYBotMm3 / 1e3,
      welYMinCm3: welYMinMm3 / 1e3,
      welZMinCm3: welZMinMm3 / 1e3,
      wplYCm3: wplYMm3 / 1e3,
      wplZCm3: wplZMm3 / 1e3,
      shapeFactorY: wplYMm3 / Math.max(1e-3, welYMinMm3),
      shapeFactorZ: wplZMm3 / Math.max(1e-3, welZMinMm3),
      torsionConstantJCm4: geom.torsionConstantJCm4,
      numericalAreaErrorPct,
      numericalIyErrorPct,
      numericalWplYErrorPct,
      classification,
      elasticNeutralAxisZMm,
      plasticNeutralAxisZMm,
      plasticNeutralAxisFromBottomMm,
      nPlRdKn,
      mElYRdKnm,
      mElZRdKnm,
      mPlYRdKnm,
      mPlZRdKnm,
      mNyReducedRdKnm,
      vPlZRdKn,
      axialForceN_Kn: appliedN_Kn,
      momentMy_Knm: appliedMy_Knm,
      momentMz_Knm: appliedMz_Knm,
      shearVy_Kn: appliedVy_Kn,
      shearVz_Kn: appliedVz_Kn,
      torsionT_Knm: appliedT_Knm,
      sigmaAxialMpa: N_N / areaMm2,
      sigmaTopMpa,
      sigmaBotMpa,
      sigmaMaxTensionMpa,
      sigmaMaxCompressionMpa,
      sigmaAbsMaxMpa,
      tauMaxShearZMpa: maxTauZMpa,
      tauMaxShearYMpa,
      tauTorsionMpa,
      tauTotalMaxMpa,
      vonMisesMaxMpa,
      elasticStressDcr,
      shearStressDcr,
      plasticInteractionDcr,
      governingDcr,
      status: status,
      outlinePolygons: outlineCentered,
      holePolygons: holeCentered,
      stressProfile,
      cornerStresses,
      nmInteractionCurve,
      myMzInteractionCurve,
    },
    issues,
    { handCalculationSteps, scopeAndLimits }
  );
}
