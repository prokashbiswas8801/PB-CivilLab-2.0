// Rebar Spacing & Diameter Suggestion Helper Engine
// Formulated under BNBC 2020 / ACI 318-19 / IS 456-2000

export type StructuralElementTypeKey = 'beam' | 'column' | 'slab' | 'footing';

export type RebarRoleKey =
  | 'beam-bottom-tension'
  | 'beam-top-hanger'
  | 'beam-top-support'
  | 'beam-shear-stirrup'
  | 'col-longitudinal'
  | 'col-lateral-ties'
  | 'col-seismic-ties'
  | 'slab-main-short'
  | 'slab-main-long'
  | 'slab-cranked'
  | 'slab-distribution'
  | 'footing-mesh';

export interface RebarRoleDefinition {
  id: RebarRoleKey;
  elementType: StructuralElementTypeKey;
  label: string;
  subLabel: string;
  defaultShape: 'straight' | 'l-bend' | 'u-bar' | 'cranked-slab' | 'rectangular-stirrup' | 'circular-tie';
  suggestedDiaMm: number[]; // e.g. [12, 16, 20, 25]
  defaultDiaMm: number;
  typicalRatioMin: number; // e.g. 0.008 (0.8%)
  typicalRatioTarget: number; // e.g. 0.012 (1.2%)
  typicalRatioMax: number; // e.g. 0.020 (2.0%)
  codeReference: string;
}

export const REBAR_ROLE_DEFINITIONS: Record<RebarRoleKey, RebarRoleDefinition> = {
  'beam-bottom-tension': {
    id: 'beam-bottom-tension',
    elementType: 'beam',
    label: 'Beam Bottom Tension Flexure',
    subLabel: 'Primary midspan tension bars (0.8% - 1.5% steel ratio)',
    defaultShape: 'straight',
    suggestedDiaMm: [16, 20, 25],
    defaultDiaMm: 20,
    typicalRatioMin: 0.004,
    typicalRatioTarget: 0.011,
    typicalRatioMax: 0.021,
    codeReference: 'BNBC 2020 Sec 8.2 / ACI 318-19 Table 9.6.1.2',
  },
  'beam-top-hanger': {
    id: 'beam-top-hanger',
    elementType: 'beam',
    label: 'Beam Top Hanger Bars',
    subLabel: 'Nominal stirrup hanger reinforcement (2 to 3 bars)',
    defaultShape: 'straight',
    suggestedDiaMm: [12, 16],
    defaultDiaMm: 12,
    typicalRatioMin: 0.002,
    typicalRatioTarget: 0.0035,
    typicalRatioMax: 0.006,
    codeReference: 'ACI 318-19 Sec 9.7.7.1',
  },
  'beam-top-support': {
    id: 'beam-top-support',
    elementType: 'beam',
    label: 'Beam Top Negative Support Extra',
    subLabel: 'Negative hogging moment over column joints',
    defaultShape: 'l-bend',
    suggestedDiaMm: [16, 20, 25],
    defaultDiaMm: 16,
    typicalRatioMin: 0.005,
    typicalRatioTarget: 0.012,
    typicalRatioMax: 0.022,
    codeReference: 'BNBC 2020 Part 6 Chap 6',
  },
  'beam-shear-stirrup': {
    id: 'beam-shear-stirrup',
    elementType: 'beam',
    label: 'Beam Closed Shear Stirrups',
    subLabel: 'Transverse closed hoops with 135° seismic hooks',
    defaultShape: 'rectangular-stirrup',
    suggestedDiaMm: [8, 10, 12],
    defaultDiaMm: 10,
    typicalRatioMin: 0.0015,
    typicalRatioTarget: 0.003,
    typicalRatioMax: 0.006,
    codeReference: 'ACI 318-19 Table 9.7.6.2.2 / BNBC Sec 8.2.10',
  },
  'col-longitudinal': {
    id: 'col-longitudinal',
    elementType: 'column',
    label: 'Column Longitudinal Mains',
    subLabel: 'Vertical axial & moment rebar (1.0% - 2.5% steel ratio)',
    defaultShape: 'l-bend',
    suggestedDiaMm: [16, 20, 25, 32],
    defaultDiaMm: 20,
    typicalRatioMin: 0.010,
    typicalRatioTarget: 0.018,
    typicalRatioMax: 0.040,
    codeReference: 'BNBC 2020 Sec 8.1.11 / ACI 318 Table 10.6.1.1',
  },
  'col-lateral-ties': {
    id: 'col-lateral-ties',
    elementType: 'column',
    label: 'Column Lateral Closed Ties',
    subLabel: 'Transverse buckling restraint (s ≤ min(16db, 48dt, b, 300mm))',
    defaultShape: 'rectangular-stirrup',
    suggestedDiaMm: [8, 10, 12],
    defaultDiaMm: 10,
    typicalRatioMin: 0.002,
    typicalRatioTarget: 0.004,
    typicalRatioMax: 0.008,
    codeReference: 'ACI 318-19 Sec 25.7.2.1 / BNBC 8.1.11.4',
  },
  'col-seismic-ties': {
    id: 'col-seismic-ties',
    elementType: 'column',
    label: 'Column Seismic Confinement Zone',
    subLabel: 'High-ductility end zone links (spacing ≤ 100mm)',
    defaultShape: 'rectangular-stirrup',
    suggestedDiaMm: [10, 12],
    defaultDiaMm: 10,
    typicalRatioMin: 0.004,
    typicalRatioTarget: 0.007,
    typicalRatioMax: 0.012,
    codeReference: 'ACI 318-19 Sec 18.7.5.2 / BNBC 2020 Chap 8',
  },
  'slab-main-short': {
    id: 'slab-main-short',
    elementType: 'slab',
    label: 'Slab Short Span Main Flexure',
    subLabel: 'Primary bottom bending reinforcement (spacing 125-150mm)',
    defaultShape: 'straight',
    suggestedDiaMm: [10, 12],
    defaultDiaMm: 10,
    typicalRatioMin: 0.0018,
    typicalRatioTarget: 0.0028,
    typicalRatioMax: 0.0055,
    codeReference: 'ACI 318-19 Sec 7.6.1.1 / BNBC Sec 8.1.10',
  },
  'slab-main-long': {
    id: 'slab-main-long',
    elementType: 'slab',
    label: 'Slab Long Span Main Flexure',
    subLabel: 'Secondary bottom bending reinforcement (spacing 150-175mm)',
    defaultShape: 'straight',
    suggestedDiaMm: [10, 12],
    defaultDiaMm: 10,
    typicalRatioMin: 0.0018,
    typicalRatioTarget: 0.0024,
    typicalRatioMax: 0.0045,
    codeReference: 'BNBC 2020 Part 6 Chap 6',
  },
  'slab-cranked': {
    id: 'slab-cranked',
    elementType: 'slab',
    label: 'Slab Cranked (Bent-up) Bar',
    subLabel: '45° inclined bent-up bar transitioning to top support',
    defaultShape: 'cranked-slab',
    suggestedDiaMm: [10, 12],
    defaultDiaMm: 10,
    typicalRatioMin: 0.0018,
    typicalRatioTarget: 0.0028,
    typicalRatioMax: 0.0050,
    codeReference: 'IS 456-2000 Cl. 26.5.2 / BNBC 2020',
  },
  'slab-distribution': {
    id: 'slab-distribution',
    elementType: 'slab',
    label: 'Slab Temperature & Shrinkage Mesh',
    subLabel: 'Distribution bars (spacing ≤ 5h or 450mm)',
    defaultShape: 'straight',
    suggestedDiaMm: [8, 10],
    defaultDiaMm: 8,
    typicalRatioMin: 0.0018,
    typicalRatioTarget: 0.0020,
    typicalRatioMax: 0.0035,
    codeReference: 'ACI 318-19 Sec 24.4.3.2 / BNBC Sec 8.1.10.4',
  },
  'footing-mesh': {
    id: 'footing-mesh',
    elementType: 'footing',
    label: 'Isolated Footing Bottom Mesh',
    subLabel: 'Two-way tension mesh mat (spacing 125-175mm)',
    defaultShape: 'u-bar',
    suggestedDiaMm: [12, 16, 20],
    defaultDiaMm: 16,
    typicalRatioMin: 0.0018,
    typicalRatioTarget: 0.0032,
    typicalRatioMax: 0.0060,
    codeReference: 'ACI 318-19 Sec 13.3.1 / BNBC 2020 Sec 8.1.12',
  },
};

export interface SuggestionOption {
  diaMm: number;
  count: number;
  spacingMm?: number;
  areaProvidedMm2: number;
  ratioPercent: number; // e.g. 1.15%
  rating: 'optimal' | 'acceptable' | 'heavy' | 'light';
  note: string;
}

export interface RebarSuggestionResult {
  role: RebarRoleDefinition;
  grossAreaMm2: number;
  targetAreaMm2: number;
  minAreaMm2: number;
  maxAreaMm2: number;
  options: SuggestionOption[];
  recommendedDimensions: {
    dimA: number;
    dimB: number;
    dimC: number;
    dimH: number;
  };
}

export interface ElementInputParameters {
  roleKey: RebarRoleKey;
  widthMm: number; // B (e.g. 300 for beam, 400 for col, 4000 for slab panel width)
  depthMm: number; // D or thickness (e.g. 500 for beam, 400 for col, 150 for slab)
  lengthMm: number; // Span or height (e.g. 6000 for beam, 3000 for col)
  clearCoverMm: number; // e.g. 40 for beam/col, 20 for slab, 75 for footing
}

export function computeRebarSuggestions(params: ElementInputParameters): RebarSuggestionResult {
  const role = REBAR_ROLE_DEFINITIONS[params.roleKey];
  const { widthMm, depthMm, lengthMm, clearCoverMm } = params;

  // Concrete gross section area
  let grossAreaMm2 = widthMm * depthMm;
  if (role.elementType === 'slab') {
    // For slab, evaluate per 1 meter width (1000mm)
    grossAreaMm2 = 1000 * depthMm;
  }

  const targetAreaMm2 = Math.round(grossAreaMm2 * role.typicalRatioTarget);
  const minAreaMm2 = Math.round(grossAreaMm2 * role.typicalRatioMin);
  const maxAreaMm2 = Math.round(grossAreaMm2 * role.typicalRatioMax);

  const options: SuggestionOption[] = [];

  // Generate candidate options for each suggested bar diameter
  for (const dia of role.suggestedDiaMm) {
    const barArea = (Math.PI * dia * dia) / 4;

    if (role.id === 'beam-shear-stirrup' || role.id === 'col-lateral-ties' || role.id === 'col-seismic-ties') {
      // Transverse Stirrup / Tie Spacing Calculation
      let suggestedSpacing = 150;
      if (role.id === 'beam-shear-stirrup') {
        const effectiveDepth = Math.max(100, depthMm - clearCoverMm - 20);
        suggestedSpacing = Math.min(200, Math.round((effectiveDepth / 2) / 25) * 25);
        suggestedSpacing = Math.max(100, Math.min(suggestedSpacing, 200));
      } else if (role.id === 'col-seismic-ties') {
        suggestedSpacing = 100;
      } else {
        // Normal column tie spacing s <= min(16db, 48dt, b, 300)
        suggestedSpacing = Math.min(300, Math.min(widthMm, 16 * 20));
        suggestedSpacing = Math.max(125, Math.min(200, Math.round(suggestedSpacing / 25) * 25));
      }

      // Total count across element length
      const count = Math.max(4, Math.round(lengthMm / suggestedSpacing) + 1);
      const legsArea = 2 * barArea; // 2-legged closed stirrup

      options.push({
        diaMm: dia,
        count,
        spacingMm: suggestedSpacing,
        areaProvidedMm2: Math.round(legsArea),
        ratioPercent: Number(((legsArea / (widthMm * suggestedSpacing)) * 100).toFixed(2)),
        rating: dia === role.defaultDiaMm ? 'optimal' : 'acceptable',
        note: `Spacing @ ${suggestedSpacing} mm c/c (${count} stirrups along ${lengthMm} mm span)`,
      });
    } else if (role.elementType === 'slab') {
      // Slab spacing s = (1000 * As_bar) / As_req
      const rawSpacing = (1000 * barArea) / targetAreaMm2;
      // Round to standard 25mm increments (e.g. 100, 125, 150, 175, 200)
      let spacing = Math.round(rawSpacing / 25) * 25;
      spacing = Math.max(100, Math.min(spacing, 250)); // Max code limit

      // Total bars for the given slab panel width
      const totalBars = Math.max(3, Math.round(widthMm / spacing) + 1);
      const areaPerMeter = (1000 / spacing) * barArea;
      const ratioPercent = Number(((areaPerMeter / grossAreaMm2) * 100).toFixed(2));

      let rating: SuggestionOption['rating'] = 'optimal';
      if (ratioPercent < role.typicalRatioMin * 100) rating = 'light';
      else if (ratioPercent > role.typicalRatioMax * 100) rating = 'heavy';
      else if (dia === role.defaultDiaMm) rating = 'optimal';
      else rating = 'acceptable';

      options.push({
        diaMm: dia,
        count: totalBars,
        spacingMm: spacing,
        areaProvidedMm2: Math.round(areaPerMeter),
        ratioPercent,
        rating,
        note: `Ø${dia} @ ${spacing} mm c/c (${totalBars} bars across ${widthMm} mm width)`,
      });
    } else {
      // Discrete Longitudinal Bars (Beams, Columns, Footings)
      let targetCount = Math.round(targetAreaMm2 / barArea);

      // Enforce practical geometry minimums
      if (role.elementType === 'column') {
        targetCount = Math.max(4, targetCount); // At least 4 corner bars for rectangular column
        if (targetCount % 2 !== 0) targetCount += 1; // Even number of bars
      } else if (role.elementType === 'beam') {
        targetCount = Math.max(2, targetCount); // At least 2 bars
      } else if (role.elementType === 'footing') {
        const spacing = 150;
        targetCount = Math.max(4, Math.round(widthMm / spacing) + 1);
      }

      const areaProvided = Math.round(targetCount * barArea);
      const ratioPercent = Number(((areaProvided / grossAreaMm2) * 100).toFixed(2));

      let rating: SuggestionOption['rating'] = 'optimal';
      if (ratioPercent < role.typicalRatioMin * 100) rating = 'light';
      else if (ratioPercent > role.typicalRatioMax * 100) rating = 'heavy';
      else if (dia === role.defaultDiaMm) rating = 'optimal';
      else rating = 'acceptable';

      options.push({
        diaMm: dia,
        count: targetCount,
        areaProvidedMm2: areaProvided,
        ratioPercent,
        rating,
        note: `${targetCount} Nos × Ø${dia} mm (As = ${areaProvided} mm², ρ = ${ratioPercent}%)`,
      });
    }
  }

  // Recommended Dimensions based on clear cover and element type
  let dimA = 0;
  let dimB = 0;
  let dimC = 0;
  let dimH = 0;

  if (role.defaultShape === 'straight') {
    dimA = Math.max(500, lengthMm - 2 * clearCoverMm);
  } else if (role.defaultShape === 'l-bend') {
    dimA = Math.max(500, lengthMm - clearCoverMm);
    dimB = Math.max(200, depthMm - 2 * clearCoverMm);
  } else if (role.defaultShape === 'u-bar') {
    dimA = Math.max(500, widthMm - 2 * clearCoverMm);
    dimB = Math.max(200, depthMm - 2 * clearCoverMm);
    dimC = Math.max(200, depthMm - 2 * clearCoverMm);
  } else if (role.defaultShape === 'cranked-slab') {
    dimA = Math.max(500, lengthMm);
    dimH = Math.max(50, depthMm - 2 * clearCoverMm);
  } else if (role.defaultShape === 'rectangular-stirrup') {
    dimA = Math.max(100, widthMm - 2 * clearCoverMm);
    dimB = Math.max(100, depthMm - 2 * clearCoverMm);
  }

  return {
    role,
    grossAreaMm2,
    targetAreaMm2,
    minAreaMm2,
    maxAreaMm2,
    options,
    recommendedDimensions: {
      dimA,
      dimB,
      dimC,
      dimH,
    },
  };
}

/* --------------------------------------------------------------------------
   BNBC 2020 / ACI 318-19 BEAM FLEXURAL & SHEAR REINFORCEMENT DESIGN ENGINE
--------------------------------------------------------------------------- */

export interface BeamFlexureDesignInput {
  governingMomentKnm: number; // Factored design moment Mu (sagging)
  governingShearKn?: number; // Factored design shear Vu
  spanLengthM: number;
  widthMm?: number; // section width b
  depthMm?: number; // overall section height h
  concreteGradeFckMpa?: number; // f'c default 25 MPa
  steelGradeFyMpa?: number; // fy default 420 MPa (Grade 60)
  clearCoverMm?: number; // default 40 mm
  isContinuous?: boolean;
  hoggingMomentKnm?: number; // negative design moment over supports
}

export interface BeamBarSelection {
  diaMm: number;
  count: number;
  asProvidedMm2: number;
  asRequiredMm2: number;
  layers: number;
}

export interface BeamStirrupSelection {
  diaMm: number;
  spacingMm: number;
  legs: number;
  totalCount: number;
}

export interface BeamFlexureDesignResult {
  widthMm: number;
  depthMm: number;
  effectiveDepthMm: number;
  asRequiredMm2: number;
  asMinMm2: number;
  steelRatioPercent: number;
  bottomBars: BeamBarSelection;
  topBars: BeamBarSelection;
  stirrups: BeamStirrupSelection;
  codeReference: string;
}

export function computeBeamFlexureAndShearDesign(
  input: BeamFlexureDesignInput
): BeamFlexureDesignResult {
  const widthMm = Math.max(150, input.widthMm || 250);
  const depthMm = Math.max(250, input.depthMm || 500);
  const spanLengthM = Math.max(1.0, input.spanLengthM || 5.0);
  const fck = Math.max(15, input.concreteGradeFckMpa || 25);
  const fy = Math.max(250, input.steelGradeFyMpa || 420);
  const cover = Math.max(25, input.clearCoverMm || 40);
  const muSagging = Math.max(0.1, Math.abs(input.governingMomentKnm || 25.0));
  const muHogging = input.hoggingMomentKnm ? Math.max(0, Math.abs(input.hoggingMomentKnm)) : 0;
  const vuKn = input.governingShearKn !== undefined ? Math.abs(input.governingShearKn) : (muSagging * 4) / spanLengthM;

  // Approximate effective depth (assuming 10mm stirrup and ~16-20mm main bar)
  const d = Math.max(150, depthMm - cover - 10 - 10);

  // Helper for flexural tension steel As per ACI 318-19 / BNBC 2020
  const solveAs = (muKnm: number) => {
    const phi = 0.90; // Tension-controlled flexure reduction factor
    const muNmm = muKnm * 1e6;
    const rn = muNmm / (phi * widthMm * d * d);

    // Beta 1 factor
    const m = fy / (0.85 * fck);
    const discriminant = Math.max(0, 1 - (2 * m * rn) / fy);
    const rhoCalculated = (1 / m) * (1 - Math.sqrt(discriminant));

    // Minimum steel ratio per BNBC 2020 Sec 8.2 / ACI 318-19 Table 9.6.1.2
    const rhoMin1 = (0.25 * Math.sqrt(fck)) / fy;
    const rhoMin2 = 1.4 / fy;
    const rhoMin = Math.max(rhoMin1, rhoMin2);

    // Maximum steel ratio (0.85 * beta1 * fc/fy * (0.003 / (0.003 + 0.005)))
    const beta1 = fck <= 28 ? 0.85 : Math.max(0.65, 0.85 - (0.05 * (fck - 28)) / 7);
    const rhoMax = 0.85 * beta1 * (fck / fy) * (0.003 / 0.008);

    const rhoGov = Math.min(rhoMax, Math.max(rhoCalculated, rhoMin));
    const asReq = Math.round(rhoGov * widthMm * d);

    return { asReq, asMin: Math.round(rhoMin * widthMm * d), rhoGov };
  };

  const sagging = solveAs(muSagging);
  const hogging = muHogging > 0 ? solveAs(muHogging) : null;

  // Practical bar selector: choose from [16, 20, 25, 12] mm bars
  const selectBarCombination = (asReqMm2: number, minBars: number = 2, maxBars: number = 5): BeamBarSelection => {
    const candidates = [16, 20, 25, 12];
    let bestSelection: BeamBarSelection = {
      diaMm: 16,
      count: minBars,
      asProvidedMm2: Math.round(minBars * ((Math.PI * 16 * 16) / 4)),
      asRequiredMm2: asReqMm2,
      layers: 1,
    };
    let minOverdesign = Infinity;

    for (const dia of candidates) {
      const barArea = (Math.PI * dia * dia) / 4;
      let count = Math.max(minBars, Math.ceil(asReqMm2 / barArea));
      if (count > maxBars) continue;

      const asProvided = Math.round(count * barArea);
      const overdesign = asProvided - asReqMm2;

      // Prefer 2 to 4 bars with reasonable excess
      if (asProvided >= asReqMm2 && overdesign < minOverdesign) {
        minOverdesign = overdesign;
        bestSelection = {
          diaMm: dia,
          count,
          asProvidedMm2: asProvided,
          asRequiredMm2: asReqMm2,
          layers: count > 4 ? 2 : 1,
        };
      }
    }
    return bestSelection;
  };

  // Bottom Tension Steel
  const bottomBars = selectBarCombination(sagging.asReq, 2, 5);

  // Top Steel: If hogging moment exists, design for hogging; otherwise 2 hanger bars (Ø12mm or Ø16mm)
  let topBars: BeamBarSelection;
  if (hogging && hogging.asReq > 0) {
    topBars = selectBarCombination(hogging.asReq, 2, 4);
  } else {
    // Nominal top hanger bars (minimum 2-Ø12mm or 2-Ø16mm)
    const hangerDia = depthMm >= 550 ? 16 : 12;
    const hangerArea = Math.round(2 * ((Math.PI * hangerDia * hangerDia) / 4));
    topBars = {
      diaMm: hangerDia,
      count: 2,
      asProvidedMm2: hangerArea,
      asRequiredMm2: sagging.asMin,
      layers: 1,
    };
  }

  // Shear Stirrup Design per BNBC 2020 / ACI 318-19
  // Vc = 0.17 * sqrt(f'c) * b * d (in N) = ... * 1e-3 (in kN)
  const vcKn = 0.17 * Math.sqrt(fck) * widthMm * d * 1e-3;
  const phiV = 0.75;
  const vsReqKn = Math.max(0, vuKn / phiV - vcKn);

  const stirrupDia = 8; // standard 8mm or 10mm shear tie
  const avMm2 = 2 * ((Math.PI * stirrupDia * stirrupDia) / 4); // 2 legs = 100.5 mm²

  let stirrupSpacing = 150;
  if (vsReqKn > 0) {
    // s = (Av * fy * d) / (Vs * 1000)
    const rawSpacing = (avMm2 * fy * d) / (vsReqKn * 1000);
    stirrupSpacing = Math.min(200, Math.max(100, Math.floor(rawSpacing / 25) * 25));
  } else {
    // Nominal maximum spacing: min(d/2, 200mm)
    stirrupSpacing = Math.min(200, Math.max(100, Math.floor((d / 2) / 25) * 25));
  }

  const totalStirrups = Math.max(5, Math.round((spanLengthM * 1000) / stirrupSpacing) + 1);

  return {
    widthMm,
    depthMm,
    effectiveDepthMm: Math.round(d),
    asRequiredMm2: sagging.asReq,
    asMinMm2: sagging.asMin,
    steelRatioPercent: Number((sagging.rhoGov * 100).toFixed(2)),
    bottomBars,
    topBars,
    stirrups: {
      diaMm: stirrupDia,
      spacingMm: stirrupSpacing,
      legs: 2,
      totalCount: totalStirrups,
    },
    codeReference: 'BNBC-2020 Sec 8.2 / ACI 318-19 Strength Design',
  };
}

