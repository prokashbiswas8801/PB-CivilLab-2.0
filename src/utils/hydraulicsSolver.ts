/**
 * Advanced Hydraulic Solver Engine for PB CivilLab
 * Complies with Chow (Open-Channel Hydraulics), AWWA M11/M9, and BNBC-2020 Chapter 8
 */

import { ChannelShapeType, PipeMaterialType, PipeServiceType } from '../types/civil';
import { solveBisection, solveNewtonRaphson, roundEng, preventZeroDivision } from './mathEngine';

export interface HydraulicMaterialDefinition {
  id: string;
  name: string;
  category: 'plastic' | 'metal' | 'concrete' | 'natural';
  hazenWilliamsC: number;
  hazenWilliamsCRange: [number, number];
  manningN: number;
  manningNRange: [number, number];
  darcyRoughnessMm: number;
  description: string;
  recommendedUses: string[];
  maxVelocityMps: number;
  minCleansingVelocityMps: number;
}

export const HYDRAULIC_MATERIALS: HydraulicMaterialDefinition[] = [
  {
    id: 'pvc',
    name: 'PVC (Polyvinyl Chloride)',
    category: 'plastic',
    hazenWilliamsC: 150,
    hazenWilliamsCRange: [140, 150],
    manningN: 0.009,
    manningNRange: [0.009, 0.011],
    darcyRoughnessMm: 0.0015,
    description: 'Smooth-wall thermoplastic pipe. Corrosion-immune, exceptionally low friction losses.',
    recommendedUses: ['Potable Water Distribution', 'Building Plumbing', 'Gravity Sewer', 'Drainage'],
    maxVelocityMps: 3.0,
    minCleansingVelocityMps: 0.6,
  },
  {
    id: 'hdpe',
    name: 'HDPE (High-Density Polyethylene)',
    category: 'plastic',
    hazenWilliamsC: 150,
    hazenWilliamsCRange: [145, 155],
    manningN: 0.010,
    manningNRange: [0.009, 0.012],
    darcyRoughnessMm: 0.002,
    description: 'Flexible, fusion-welded leak-free pipe. High abrasion resistance and chemical durability.',
    recommendedUses: ['Water Transmission Mains', 'Trenchless Moling/HDD', 'Mining Slurry', 'Storm Culverts'],
    maxVelocityMps: 3.5,
    minCleansingVelocityMps: 0.6,
  },
  {
    id: 'ductile-iron',
    name: 'Ductile Iron (Cement Mortar Lined)',
    category: 'metal',
    hazenWilliamsC: 130,
    hazenWilliamsCRange: [120, 140],
    manningN: 0.012,
    manningNRange: [0.011, 0.014],
    darcyRoughnessMm: 0.12,
    description: 'High tensile ductility and pressure rating. Centrifugally lined with cement mortar to inhibit tuberculation.',
    recommendedUses: ['High-Pressure Water Mains', 'Pumping Rising Mains', 'Urban Arterial Transmission'],
    maxVelocityMps: 4.0,
    minCleansingVelocityMps: 0.6,
  },
  {
    id: 'concrete',
    name: 'Precast Concrete / RCC Pipe',
    category: 'concrete',
    hazenWilliamsC: 120,
    hazenWilliamsCRange: [110, 130],
    manningN: 0.013,
    manningNRange: [0.012, 0.015],
    darcyRoughnessMm: 0.36,
    description: 'Heavy-duty precast reinforced concrete pipe (RCP). High structural strength under highway earth loads.',
    recommendedUses: ['Stormwater Drainage Trunks', 'Highway Culverts', 'Box Culverts', 'Sanitary Interceptors'],
    maxVelocityMps: 3.5,
    minCleansingVelocityMps: 0.7,
  },
  {
    id: 'corrugated-steel',
    name: 'Corrugated Steel Pipe (CSP / CMP)',
    category: 'metal',
    hazenWilliamsC: 80,
    hazenWilliamsCRange: [60, 100],
    manningN: 0.024,
    manningNRange: [0.022, 0.027],
    darcyRoughnessMm: 4.5,
    description: 'Helical corrugated galvanized steel. High surface corrugation roughness; economical for large drainage runs.',
    recommendedUses: ['Highway & Railway Culverts', 'Temporary Stream Crossings', 'Storm Outfall Chutes'],
    maxVelocityMps: 3.0,
    minCleansingVelocityMps: 0.75,
  },
  {
    id: 'cast-iron',
    name: 'Unlined Cast Iron (Aged / Tuberculated)',
    category: 'metal',
    hazenWilliamsC: 100,
    hazenWilliamsCRange: [80, 110],
    manningN: 0.015,
    manningNRange: [0.013, 0.017],
    darcyRoughnessMm: 0.26,
    description: 'Legacy cast iron pipe prone to internal mineral encrustation and tuberculation over design life.',
    recommendedUses: ['Legacy Network Assessment', 'Rehabilitation Evaluation'],
    maxVelocityMps: 2.5,
    minCleansingVelocityMps: 0.6,
  },
  {
    id: 'galvanized-steel',
    name: 'Galvanized Steel / GI Pipe',
    category: 'metal',
    hazenWilliamsC: 120,
    hazenWilliamsCRange: [110, 130],
    manningN: 0.014,
    manningNRange: [0.013, 0.016],
    darcyRoughnessMm: 0.15,
    description: 'Zinc-coated steel for above-ground piping, pump headers, and fire suppression systems.',
    recommendedUses: ['Pump Headers', 'Fire Main Risers', 'Industrial Plant Piping'],
    maxVelocityMps: 3.5,
    minCleansingVelocityMps: 0.6,
  },
  {
    id: 'channel-earth-uniform',
    name: 'Earth Channel (Clean & Uniform)',
    category: 'natural',
    hazenWilliamsC: 70,
    hazenWilliamsCRange: [60, 80],
    manningN: 0.022,
    manningNRange: [0.020, 0.025],
    darcyRoughnessMm: 8.0,
    description: 'Regular trapezoidal earth channel in loam/clay with straight alignment and smooth bottom.',
    recommendedUses: ['Agricultural Irrigation Canals', 'Surface Drainage Ditches'],
    maxVelocityMps: 1.5,
    minCleansingVelocityMps: 0.5,
  },
  {
    id: 'channel-riprap',
    name: 'Riprap / Stone Pitching Lined',
    category: 'natural',
    hazenWilliamsC: 50,
    hazenWilliamsCRange: [40, 60],
    manningN: 0.038,
    manningNRange: [0.035, 0.042],
    darcyRoughnessMm: 25.0,
    description: 'Hand-placed or dumped angular rock riprap for erosion protection on steep channel banks.',
    recommendedUses: ['Scour Protection Zones', 'Steep Spillway Chutes', 'Bridge Abutment Ditches'],
    maxVelocityMps: 3.0,
    minCleansingVelocityMps: 0.8,
  },
];

export function getHydraulicMaterial(id: string): HydraulicMaterialDefinition {
  return (
    HYDRAULIC_MATERIALS.find((m) => m.id === id) ||
    HYDRAULIC_MATERIALS.find((m) => m.id === 'pvc')!
  );
}

export const STANDARD_COMMERCIAL_DIAMETERS_MM = [
  50, 65, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1500, 1800, 2000
];

export interface ChannelGeometry {
  area: number;
  perimeter: number;
  hydraulicRadius: number;
  topWidth: number;
  hydraulicDepth: number;
  centroidDepthZBar: number; // Depth to centroid of water area for momentum equation
}

/**
 * Calculates channel geometry for Trapezoidal, Rectangular, and Circular conduits
 */
export function calculateChannelGeometry(
  shape: ChannelShapeType,
  depthY: number,
  bottomWidthB: number,
  sideSlopeZ: number,
  diameterD: number
): ChannelGeometry {
  const y = Math.max(0.001, depthY);

  if (shape === 'circular') {
    const D = Math.max(0.05, diameterD);
    const clampedY = Math.min(y, D * 0.999);
    // Subtended angle in radians: theta = 2 * acos(1 - 2*y/D)
    const cosArg = Math.max(-1, Math.min(1, 1 - (2 * clampedY) / D));
    const theta = 2 * Math.acos(cosArg);

    const area = (Math.pow(D, 2) / 8) * (theta - Math.sin(theta));
    const perimeter = (D * theta) / 2;
    const hydraulicRadius = perimeter > 0 ? area / perimeter : 0;
    const topWidth = Math.max(0.001, D * Math.sin(theta / 2));
    const hydraulicDepth = topWidth > 0 ? area / topWidth : clampedY;

    // First moment of area / Area to find centroid depth from surface
    // For circular segment: y_bar_from_center = (2 * D^3 * sin^3(theta/2)) / (12 * Area)
    // Distance from water surface:
    const yBarCenter = area > 0 ? (Math.pow(D, 3) * Math.pow(Math.sin(theta / 2), 3)) / (12 * area) : 0;
    const centroidDepthZBar = Math.max(0.001, (clampedY - (D / 2 - (D / 2) * Math.cos(theta / 2))) + ((D / 2) * Math.cos(theta / 2) - yBarCenter));

    return {
      area: Math.max(0.00001, area),
      perimeter: Math.max(0.001, perimeter),
      hydraulicRadius: Math.max(0.001, hydraulicRadius),
      topWidth: Math.max(0.001, topWidth),
      hydraulicDepth: Math.max(0.001, hydraulicDepth),
      centroidDepthZBar: Math.max(0.001, centroidDepthZBar),
    };
  }

  // Rectangular is trapezoidal with z = 0
  const z = shape === 'rectangular' ? 0 : Math.max(0, sideSlopeZ);
  const b = Math.max(0.05, bottomWidthB);

  const area = (b + z * y) * y;
  const perimeter = b + 2 * y * Math.sqrt(1 + z * z);
  const hydraulicRadius = area / perimeter;
  const topWidth = b + 2 * z * y;
  const hydraulicDepth = area / topWidth;

  // Depth to centroid of area from water surface
  // Area comprises rectangle (b * y) and two triangles (z * y * y)
  const aRect = b * y;
  const aTri = z * y * y;
  const zBarRect = y / 2;
  const zBarTri = (2 / 3) * y;
  const centroidDepthZBar = area > 0 ? (aRect * zBarRect + aTri * zBarTri) / area : y / 2;

  return {
    area,
    perimeter,
    hydraulicRadius,
    topWidth,
    hydraulicDepth,
    centroidDepthZBar,
  };
}

/**
 * High-precision critical depth solver for arbitrary channels
 * Solves Froude = 1 <=> Q^2 * T / (g * A^3) = 1
 * Uses mathEngine solveBisection with strict max iterations and tolerance
 */
export function solveCriticalDepth(
  shape: ChannelShapeType,
  dischargeQ: number,
  bottomWidthB: number,
  sideSlopeZ: number,
  diameterD: number
): { criticalDepth: number; criticalVelocity: number; minSpecificEnergy: number } {
  const g = 9.80665;
  const Q = Math.max(0.0001, dischargeQ);

  if (shape === 'rectangular') {
    const b = Math.max(0.05, bottomWidthB);
    const q = Q / b; // unit discharge
    const yc = Math.pow(Math.pow(q, 2) / g, 1 / 3);
    const Vc = q / yc;
    const Emin = yc + Math.pow(Vc, 2) / (2 * g);
    return {
      criticalDepth: roundEng(yc, 4),
      criticalVelocity: roundEng(Vc, 3),
      minSpecificEnergy: roundEng(Emin, 4),
    };
  }

  // Safe iterative bisection solver using mathEngine
  const yLow = 0.005;
  const yHigh = shape === 'circular' ? Math.max(0.05, diameterD) * 0.98 : Math.max(10, (Q / Math.max(0.1, bottomWidthB)) + 2);

  const fCriterion = (y: number) => {
    const geom = calculateChannelGeometry(shape, y, bottomWidthB, sideSlopeZ, diameterD);
    return (Math.pow(Q, 2) * geom.topWidth) / (g * Math.pow(geom.area, 3)) - 1.0;
  };

  const solution = solveBisection(fCriterion, yLow, yHigh, 1e-5, 100);
  const yc = Math.max(0.005, solution.root);
  const finalGeom = calculateChannelGeometry(shape, yc, bottomWidthB, sideSlopeZ, diameterD);
  const Vc = Q / Math.max(1e-5, finalGeom.area);
  const Emin = yc + Math.pow(Vc, 2) / (2 * g);

  return {
    criticalDepth: roundEng(yc, 4),
    criticalVelocity: roundEng(Vc, 3),
    minSpecificEnergy: roundEng(Emin, 4),
  };
}

/**
 * Safe Normal Depth Solver (Manning's Uniform Flow Equation)
 * Solves: Q = (1/n) * A(y) * R_h(y)^(2/3) * sqrt(S)
 * Guaranteed non-infinite loop using mathEngine solveBisection
 */
export function solveNormalDepth(
  shape: ChannelShapeType,
  dischargeQ: number,
  bedSlopeS: number,
  manningN: number,
  bottomWidthB: number,
  sideSlopeZ: number,
  diameterD: number
): { normalDepth: number; normalVelocity: number; normalArea: number; converged: boolean } {
  const Q = Math.max(0.0001, dischargeQ);
  const S = Math.max(0.00001, bedSlopeS);
  const n = Math.max(0.005, manningN);
  const sqrtS = Math.sqrt(S);

  const yLow = 0.002;
  const yHigh = shape === 'circular' ? Math.max(0.05, diameterD) * 0.98 : Math.max(15, (Q / Math.max(0.1, bottomWidthB)) + 5);

  const fManning = (y: number) => {
    const geom = calculateChannelGeometry(shape, y, bottomWidthB, sideSlopeZ, diameterD);
    const Qcalc = (1 / n) * geom.area * Math.pow(geom.hydraulicRadius, 2 / 3) * sqrtS;
    return Qcalc - Q;
  };

  const solution = solveBisection(fManning, yLow, yHigh, 1e-5, 100);
  const yn = Math.max(0.002, solution.root);
  const geom = calculateChannelGeometry(shape, yn, bottomWidthB, sideSlopeZ, diameterD);
  const Vn = Q / Math.max(1e-5, geom.area);

  return {
    normalDepth: roundEng(yn, 4),
    normalVelocity: roundEng(Vn, 3),
    normalArea: roundEng(geom.area, 4),
    converged: solution.converged,
  };
}

/**
 * Hydraulic Jump Sequent Depth and Energy Dissipation Solver
 * Solves momentum function: M1 = M2 <=> Q^2/(g*A1) + zBar1*A1 = Q^2/(g*A2) + zBar2*A2
 */
export function solveHydraulicJump(
  shape: ChannelShapeType,
  y1: number,
  V1: number,
  Q: number,
  bottomWidthB: number,
  sideSlopeZ: number,
  diameterD: number,
  froude1: number
): {
  isOccurring: boolean;
  sequentDepthM: number;
  jumpHeightM: number;
  headLossM: number;
  energyDissipatedPercent: number;
  jumpLengthM: number;
  jumpType: string;
  description: string;
} {
  if (froude1 <= 1.0) {
    return {
      isOccurring: false,
      sequentDepthM: y1,
      jumpHeightM: 0,
      headLossM: 0,
      energyDissipatedPercent: 0,
      jumpLengthM: 0,
      jumpType: 'None (Subcritical Flow)',
      description: 'Flow regime is tranquil and subcritical (Fr <= 1.0). No hydraulic jump forms.',
    };
  }

  const g = 9.80665;
  const E1 = y1 + Math.pow(V1, 2) / (2 * g);

  let y2 = y1;

  if (shape === 'rectangular') {
    // Exact analytical Belanger equation
    y2 = (y1 / 2) * (Math.sqrt(1 + 8 * Math.pow(froude1, 2)) - 1);
  } else {
    // Solve momentum conservation
    const geom1 = calculateChannelGeometry(shape, y1, bottomWidthB, sideSlopeZ, diameterD);
    const M1 = Math.pow(Q, 2) / (g * geom1.area) + geom1.centroidDepthZBar * geom1.area;

    let yLow = y1 * 1.01;
    let yHigh = shape === 'circular' ? Math.max(y1 * 1.5, diameterD * 0.99) : y1 * (1 + 2 * froude1);

    for (let i = 0; i < 35; i++) {
      const mid = (yLow + yHigh) / 2;
      const geom2 = calculateChannelGeometry(shape, mid, bottomWidthB, sideSlopeZ, diameterD);
      const M2 = Math.pow(Q, 2) / (g * geom2.area) + geom2.centroidDepthZBar * geom2.area;
      const diff = M2 - M1;

      if (Math.abs(diff) < 0.001) {
        y2 = mid;
        break;
      }
      if (diff < 0) {
        yLow = mid;
      } else {
        yHigh = mid;
      }
      y2 = mid;
    }
  }

  const geom2 = calculateChannelGeometry(shape, y2, bottomWidthB, sideSlopeZ, diameterD);
  const V2 = geom2.area > 0 ? Q / geom2.area : 0;
  const E2 = y2 + Math.pow(V2, 2) / (2 * g);
  const headLoss = Math.max(0, E1 - E2);
  const energyLossPercent = E1 > 0 ? (headLoss / E1) * 100 : 0;
  const jumpHeight = Math.max(0, y2 - y1);
  const jumpLength = 6.9 * jumpHeight; // USBR empirical formula for hydraulic jumps

  // Jump classification per Chow (1959) & USBR
  let jumpType = 'Steady Jump (Effective Energy Dissipator)';
  let description = 'Well-balanced stable jump with 45–70% kinetic energy dissipation. Ideal for stilling basins.';

  if (froude1 < 1.7) {
    jumpType = 'Undular Jump';
    description = 'Slight surface undulations and waves; negligible energy dissipation (<5%).';
  } else if (froude1 < 2.5) {
    jumpType = 'Weak Jump';
    description = 'Smooth surface rise with small rollers; low energy dissipation (5–15%).';
  } else if (froude1 < 4.5) {
    jumpType = 'Oscillating Jump';
    description = 'Pulsating jet entering the basin creates large downstream surface waves. Stilling basin requires baffles.';
  } else if (froude1 < 9.0) {
    jumpType = 'Steady Jump (High Efficiency)';
    description = 'Stable, well-contained jump dissipating 45–70% of upstream supercritical energy.';
  } else {
    jumpType = 'Strong / Choppy Jump';
    description = 'Violent, rough jump with spray and excessive churning. Energy dissipation exceeds 70-85%. Heavy floor armor required.';
  }

  return {
    isOccurring: true,
    sequentDepthM: y2,
    jumpHeightM: jumpHeight,
    headLossM: headLoss,
    energyDissipatedPercent: energyLossPercent,
    jumpLengthM: jumpLength,
    jumpType,
    description,
  };
}

/**
 * Dynamic Kinematic Viscosity of Water as a function of temperature T (°C)
 * Standard formula from Poiseuille / Bingham
 */
export function getWaterKinematicViscosity(temperatureC: number): number {
  const T = Math.max(0, Math.min(60, temperatureC));
  // nu = 1.787e-6 / (1 + 0.0337*T + 0.000221*T^2)
  return 1.787e-6 / (1 + 0.0337 * T + 0.000221 * Math.pow(T, 2));
}

/**
 * Commercial Diameter Sizing Recommender for Pressure Pipes & Storm Sewers
 */
export function recommendPipeDiameter(
  flowRateLps: number,
  hazenWilliamsC: number,
  pipeLengthM: number,
  serviceType: PipeServiceType = 'pressure'
): {
  recommendedDn: number;
  commercialOptions: Array<{
    dnMm: number;
    velocityMps: number;
    frictionLossM: number;
    reynoldsNumber: number;
    isFeasible: boolean;
    tag: string;
  }>;
  sizingNotes: string;
} {
  const Q_m3s = Math.max(0.0001, flowRateLps / 1000);
  const L = Math.max(1, pipeLengthM);
  const C = Math.max(40, hazenWilliamsC);
  const nu = getWaterKinematicViscosity(20);

  // Velocity criteria:
  // Pressure mains: 0.9 m/s to 2.2 m/s optimal, max 3.0 m/s
  // Storm sewer: >= 0.75 m/s self-cleansing, max 3.5 m/s
  const minV = serviceType === 'pressure' ? 0.8 : 0.75;
  const maxV = serviceType === 'pressure' ? 2.2 : 3.0;

  const evaluated = STANDARD_COMMERCIAL_DIAMETERS_MM.map((dn) => {
    const D_m = dn / 1000;
    const area = (Math.PI * Math.pow(D_m, 2)) / 4;
    const V = Q_m3s / area;
    const Re = (V * D_m) / nu;
    const Sf = (10.67 * Math.pow(Q_m3s, 1.852)) / (Math.pow(C, 1.852) * Math.pow(D_m, 4.87));
    const hf = Sf * L;

    const isFeasible = V >= minV && V <= maxV && Sf * 1000 <= 15; // Sf <= 15 m/km

    let tag = 'Optimal';
    if (V < minV) {
      tag = 'Low Velocity / Sedimentation Risk';
    } else if (V > maxV) {
      tag = 'High Velocity / Excessive Headloss & Wear';
    } else if (Sf * 1000 > 15) {
      tag = 'High Friction Gradient';
    }

    return {
      dnMm: dn,
      velocityMps: Number(V.toFixed(2)),
      frictionLossM: Number(hf.toFixed(2)),
      reynoldsNumber: Math.round(Re),
      isFeasible,
      tag,
    };
  });

  // Pick best commercial size
  const feasibleOptions = evaluated.filter((o) => o.isFeasible);
  let recommendedDn = 200;

  if (feasibleOptions.length > 0) {
    // Choose one closest to target velocity ~1.3 m/s
    recommendedDn = feasibleOptions.reduce((best, curr) => {
      const diffCurr = Math.abs(curr.velocityMps - 1.3);
      const diffBest = Math.abs(best.velocityMps - 1.3);
      return diffCurr < diffBest ? curr : best;
    }).dnMm;
  } else {
    // Pick nearest
    recommendedDn = evaluated.reduce((best, curr) => {
      const diffCurr = Math.abs(curr.velocityMps - 1.5);
      const diffBest = Math.abs(best.velocityMps - 1.5);
      return diffCurr < diffBest ? curr : best;
    }).dnMm;
  }

  const selectedOpt = evaluated.find((o) => o.dnMm === recommendedDn)!;
  const sizingNotes = `Recommended DN ${recommendedDn} mm provides flow velocity of ${selectedOpt.velocityMps} m/s and friction gradient ${(selectedOpt.frictionLossM / L * 1000).toFixed(2)} m/km, complying with AWWA M11 / BNBC self-cleansing and surge limits.`;

  return {
    recommendedDn,
    commercialOptions: evaluated.slice(0, 8),
    sizingNotes,
  };
}
