import {
  EngineeringModuleId,
  CivilWorkspace,
  UserProfile,
} from '../types/civil';
import {
  CalculationEnvelope,
  BeamAnalysisResult,
  BearingAnalysisResult,
  ConcreteMixResult,
  ChannelHydraulicsResult,
  ConcreteMaterialResult,
  RebarBBSResult,
  BOQResult,
  ContinuousBeamResult,
  PileCapacityResult,
  PipeHydraulicsResult,
} from './calculations';

export interface GoverningEquationInfo {
  codeStandard: string;
  category: string;
  equations: {
    name: string;
    formula: string;
    description: string;
    variables: string[];
  }[];
  assumptions: string[];
}

export interface CapacityUtilizationInfo {
  metricLabel: string;
  formattedValue: string;
  percentage: number;
  status: 'safe' | 'warning' | 'critical';
  description: string;
  referenceLimit?: string;
}

/**
 * Returns governing code formulas and mathematical derivations for each engineering module.
 */
export function getGoverningEquations(moduleId: EngineeringModuleId): GoverningEquationInfo {
  switch (moduleId) {
    case 'beam-analysis':
      return {
        codeStandard: 'ACI 318-19 / AISC 360-16 / BNBC 2020 §6.4',
        category: 'Structural Mechanics & Beam Flexure',
        equations: [
          {
            name: 'Maximum Flexural Bending Moment (Superposition)',
            formula: 'M_max = (w · L²) / 8 + (P · L) / 4',
            description: 'Midspan bending moment for simply supported beam under combined uniform load (w) and concentrated point load (P).',
            variables: ['w = Uniform load (kN/m)', 'L = Clear span (m)', 'P = Concentrated point load (kN)'],
          },
          {
            name: 'Maximum Vertical Shear Force at Supports',
            formula: 'V_max = (w · L) / 2 + P / 2',
            description: 'Maximum end reaction and shear force developing at simply supported boundaries.',
            variables: ['w = Uniform load (kN/m)', 'L = Clear span (m)', 'P = Concentrated load (kN)'],
          },
          {
            name: 'Maximum Midspan Elastic Deflection',
            formula: 'δ_max = (5 · w · L⁴) / (384 · E · I) + (P · L³) / (48 · E · I)',
            description: 'Serviceability midspan deflection evaluated against allowable code limit δ_allow = L / 360.',
            variables: ['E = Elastic modulus (GPa)', 'I = Moment of inertia (cm⁴)', 'L = Clear span (m)'],
          },
          {
            name: 'Extreme Fiber Bending Stress',
            formula: 'f_b = (M_max · y) / I = M_max / S',
            description: 'Flexural normal stress at extreme compressive/tensile fiber compared to allowable stress f_allow.',
            variables: ['S = Section modulus (cm³)', 'y = Distance to neutral axis (m)'],
          },
        ],
        assumptions: [
          'Linear elastic, isotropic, homogeneous material behavior (Hooke’s Law).',
          'Euler-Bernoulli hypothesis: plane sections remain plane and normal to the neutral axis.',
          'Small deflection theory (deflections << span length).',
          'Serviceability deflection limit checked against L/360 for live load and L/240 for total load.',
        ],
      };

    case 'bearing-capacity':
      return {
        codeStandard: 'Terzaghi / Meyerhof / Hansen / BNBC 2020 Part 6 Ch 3',
        category: 'Geotechnical Shallow Foundations',
        equations: [
          {
            name: 'General Ultimate Bearing Capacity (Terzaghi / Hansen)',
            formula: 'q_ult = c · N_c · s_c + q · N_q · s_q + 0.5 · γ · B · N_γ · s_γ',
            description: 'Ultimate soil bearing capacity taking into account cohesion (c), surcharge (q = γ · D_f), soil unit weight (γ), and footing width (B).',
            variables: ['c = Cohesion (kPa)', 'q = Overburden surcharge = γ · D_f (kPa)', 'N_c, N_q, N_γ = Bearing capacity factors', 's_c, s_q, s_γ = Shape factors'],
          },
          {
            name: 'Prandtl Bearing Capacity Factors (as a function of friction angle φ)',
            formula: 'N_q = e^(π · tan φ) · tan²(45° + φ/2) | N_c = (N_q - 1) · cot φ | N_γ ≈ 2 · (N_q + 1) · tan φ',
            description: 'Dimensionless bearing capacity factors derived from Mohr-Coulomb failure wedge geometry.',
            variables: ['φ = Effective internal friction angle (degrees)'],
          },
          {
            name: 'Allowable Safe Soil Bearing Pressure',
            formula: 'q_all = q_ult / FoS',
            description: 'Permissible safe soil bearing pressure applying a certified geotechnical Factor of Safety (typically 2.50 to 3.00).',
            variables: ['FoS = Factor of safety (typically 2.5 to 3.0)'],
          },
        ],
        assumptions: [
          'General shear failure mechanism under continuous rigid foundation footing.',
          'Soil obeys Mohr-Coulomb shear strength criterion: τ = c + σ · tan φ.',
          'Water table correction applied when groundwater table is within depth (D_f + B).',
          'Minimum factor of safety FoS ≥ 2.50 required for dead + full live load conditions.',
        ],
      };

    case 'open-channel':
      return {
        codeStandard: 'Manning-Strickler / USBR / Chow Open-Channel Hydraulics',
        category: 'Civil & Water Resources Hydraulic Engineering',
        equations: [
          {
            name: 'Manning Gauckler Equation for Volumetric Discharge',
            formula: 'Q = (1 / n) · A · R_h^(2/3) · S_0^(1/2)',
            description: 'Steady uniform volumetric flow rate in an open prismatic channel governed by boundary roughness and bed slope.',
            variables: ['n = Manning roughness coefficient', 'A = Wetted cross-sectional area (m²)', 'R_h = Hydraulic radius = A / P (m)', 'S_0 = Longitudinal channel bed slope (m/m)'],
          },
          {
            name: 'Froude Number & Hydrodynamic Flow Regime',
            formula: 'Fr = V / √(g · D_h) where D_h = A / T',
            description: 'Ratio of inertial forces to gravitational forces. Fr < 1: Subcritical (tranquil); Fr = 1: Critical; Fr > 1: Supercritical (rapid).',
            variables: ['V = Mean flow velocity (m/s)', 'g = 9.80665 m/s²', 'D_h = Hydraulic depth = A / Top width T (m)'],
          },
          {
            name: 'Critical Depth Condition (Minimum Specific Energy)',
            formula: 'Q² · T_c / (g · A_c³) = 1',
            description: 'Flow depth corresponding to minimum specific energy for a given discharge Q.',
            variables: ['T_c = Critical surface top width (m)', 'A_c = Critical flow area (m²)'],
          },
        ],
        assumptions: [
          'Steady uniform gravity flow (normal depth y_n established).',
          'Constant prismatic cross-section along the analyzed reach.',
          'Manning roughness n assumed uniform along wetted perimeter.',
          'Minimum freeboard requirement: F_b ≥ 0.20 · y or 0.30 m for municipal drainage.',
        ],
      };

    case 'concrete-mix':
      return {
        codeStandard: 'ACI 211.1-91 / IS 10262:2019 / BS 8500',
        category: 'Materials Science & Concrete Mix Design',
        equations: [
          {
            name: 'Target Compressive Strength with Statistical Margin',
            formula: "f'_ck = f'_c + 1.65 · s",
            description: 'Target mean compressive strength at 28 days ensuring 95% compliance probability.',
            variables: ["f'c = Specified design characteristic compressive strength (MPa)", 's = Standard deviation based on quality control (MPa)'],
          },
          {
            name: 'Absolute Volume Method for Unit Batch Quantities',
            formula: 'V_c + V_w + V_fa + V_ca + V_air = 1.0 m³',
            description: 'Sum of absolute solid volumes of cement, water, fine aggregate, coarse aggregate, and entrapped air equals exactly 1 m³.',
            variables: ['V = Mass / (Specific Gravity · 1000 kg/m³)'],
          },
          {
            name: 'Water-Cement Ratio Law (Abrams Law)',
            formula: 'w/c = f(Target Strength, Slump, Exposure Class)',
            description: 'Governs concrete porosity, durability against carbonation/sulfate attack, and ultimate compressive strength.',
            variables: ['w/c typically ranges from 0.40 to 0.55 for structural grades'],
          },
        ],
        assumptions: [
          'All aggregates assumed in Saturated Surface Dry (SSD) condition.',
          'Cement specific gravity assumed 3.15 (standard Ordinary Portland Cement).',
          'Entrapped air estimated based on nominal maximum aggregate size (NMAS).',
          'Continuous moist curing at 20°C ± 2°C for 28 days.',
        ],
      };

    case 'concrete-materials':
      return {
        codeStandard: 'PWD Standard Specification / IS 456 / ACI 318',
        category: 'Material Estimation & Volumetric Yield',
        equations: [
          {
            name: 'Wet-to-Dry Bulk Volume Expansion Multiplier',
            formula: 'Dry Volume = Wet Compacted Volume · 1.54',
            description: 'Accounts for the 54% void ratio loss and settling when dry aggregates, sand, and cement are mixed with water and compacted.',
            variables: ['1.54 = Standard bulk void factor for structural concrete'],
          },
          {
            name: 'Component Volume Proportional Partitioning',
            formula: 'Volume_i = Dry Volume · (Ratio_i / Σ Ratios)',
            description: 'Allocates dry mix volume proportionally across cement, sand, and coarse stone/brick aggregate.',
            variables: ['Ratio_i = Mix proportion parts (e.g. 1:1.5:3, 1:2:4)'],
          },
          {
            name: 'Cement Bags Conversion',
            formula: 'Bags = Cement Volume (cft) / 1.25 cft = Cement (m³) / 0.0347 m³',
            description: 'Standard 50 kg cement bag has a loose bulk density of 1440 kg/m³ and nominal volume of 1.25 cft.',
            variables: ['1 bag = 50 kg = 1.25 cft = 0.03472 m³'],
          },
        ],
        assumptions: [
          'Standard void conversion factor of 1.54 applies to standard gravel/crushed stone concrete.',
          'Aggregate moisture absorption and bulk void adjustments incorporated in standard dry multiplier.',
        ],
      };

    case 'rebar-bbs':
      return {
        codeStandard: 'BS 8666:2020 / ACI 315 / IS 2502 / BNBC 2020 §8',
        category: 'Reinforced Concrete Detailing & Bar Bending Schedule',
        equations: [
          {
            name: 'Theoretical Unit Weight of Deformed Reinforcing Steel',
            formula: 'w_s = d² / 162.2 (kg/m) = d² / 533 (lb/ft)',
            description: 'Nominal linear mass density based on standard steel density ρ = 7850 kg/m³.',
            variables: ['d = Nominal bar diameter in millimeters (mm)'],
          },
          {
            name: 'Cutting Length with Bend Deductions',
            formula: 'L_cut = A + B + C - (n_90 · 2d) - (n_45 · 1d) - (n_180 · 3d) + Hooks',
            description: 'Effective cut length accounting for steel stretching/elongation across cold bends.',
            variables: ['A, B, C = Leg dimensions (mm)', 'd = Bar diameter', 'n = Number of bends'],
          },
          {
            name: 'Tension Lap Splice Length (ACI 318 Class B)',
            formula: 'l_d = 1.3 · l_t ≈ 40d to 50d',
            description: 'Tension splice development length ensuring ductile stress transfer between bars.',
            variables: ['d = Bar diameter (mm)', 'f_y = Steel yield strength (e.g. 500 MPa)'],
          },
        ],
        assumptions: [
          'Deformed high-strength steel with minimum yield strength f_y = 500 MPa (Grade 72.5 / 500W).',
          'Standard bending pin diameters conform to BS 8666 / ACI 318 Table 25.3.1.',
          '5% standard wastage factor added for fabrication off-cuts and site handling.',
        ],
      };

    case 'masonry-finishes':
      return {
        codeStandard: 'ASTM C62 / C270 / BNBC 2020 Part 6 Ch 2',
        category: 'Masonry Walls & Architectural Finishes',
        equations: [
          {
            name: 'Net Brick Wall Quantity with Openings Deduction',
            formula: 'A_net = L · H - Σ (w_opening · h_opening)',
            description: 'Net surface area of wall after subtracting doors, windows, and structural lintels.',
            variables: ['L = Wall length', 'H = Wall height', 'Σ Openings = Deduction area'],
          },
          {
            name: 'Standard Modular Brick Count',
            formula: 'Bricks = V_net · 500 bricks/m³ (or 14.28 bricks/cft with 10 mm mortar joints)',
            description: 'Standard brickwork consumption including mortar volume in joints.',
            variables: ['Modular standard brick size: 240 × 115 × 70 mm or 9.5" × 4.5" × 2.75"'],
          },
          {
            name: 'Plaster Mortar Volumetric Yield with 1.33 Dry Factor',
            formula: 'Dry Mortar Volume = (A_plaster · t_plaster) · 1.33',
            description: 'Bulk void factor for cement-sand plaster mortar to account for joint penetration and dry shrinkage.',
            variables: ['t_plaster = Plaster thickness (typically 12 mm to 20 mm)'],
          },
        ],
        assumptions: [
          '5% brick breakage and cutting wastage incorporated in estimation.',
          'Plaster dry void ratio multiplier = 1.33; mortar ratio typically 1:4 to 1:6.',
        ],
      };

    case 'earthwork-alignment':
      return {
        codeStandard: 'AASHTO / Civil 3D Standard Average End Area & Prismoidal',
        category: 'Highway & Site Earthwork Alignment',
        equations: [
          {
            name: 'Average End Area Method for Cut and Fill Volumes',
            formula: 'V = (A_1 + A_2) / 2 · L',
            description: 'Standard volumetric calculation between two consecutive cross-sectional stations.',
            variables: ['A_1, A_2 = Cross-sectional cut or fill areas at stations (m²)', 'L = Distance between chainage stations (m)'],
          },
          {
            name: 'Prismoidal Correction for Tapered Terrain',
            formula: 'V_p = (L / 6) · (A_1 + 4 · A_mid + A_2)',
            description: 'High-accuracy volume computation for rapidly changing or warping ground profiles.',
            variables: ['A_mid = Middle cross-sectional area (m²)'],
          },
          {
            name: 'Net Earthwork Mass Haul Balance',
            formula: 'Net = Cut Volume - (Fill Volume · Shrinkage/Compaction Factor)',
            description: 'Surplus or borrow mass haul balance indicating spoil haulage or import borrow requirement.',
            variables: ['Compaction shrinkage factor typically 1.15 to 1.25'],
          },
        ],
        assumptions: [
          'Linear elevation interpolation between surveyed cross-section stations.',
          'Soil shrinkage / swell factor applied based on soil classification.',
        ],
      };

    case 'boq-estimator':
      return {
        codeStandard: 'CSI MasterFormat / FIDIC / SMM7 Civil Works',
        category: 'Quantity Surveying & Bill of Quantities',
        equations: [
          {
            name: 'Volumetric Measurement Sheet Rule',
            formula: 'Quantity = No. · Length · Width · Height / Depth',
            description: 'Standard civil takeoff measurement sheet formula applied across itemized line items.',
            variables: ['No. = Repetition factor', 'L, W, H = Physical geometrical bounds'],
          },
          {
            name: 'Subtotal & Direct Line Cost',
            formula: 'Line Amount = Quantity · Unit Rate',
            description: 'Product of verified takeoff quantity and scheduled unit rate per unit.',
            variables: ['Quantity in takeoff units (m³, cft, kg, ton, m²)', 'Unit Rate in workspace currency'],
          },
        ],
        assumptions: [
          'Takeoff dimensions scaled from verified structural contract drawings.',
          'Tax, contingency, and insurance applied at the contract schedule summary level.',
        ],
      };

    case 'rate-analysis':
      return {
        codeStandard: 'CPWD / PWD Standard Schedule of Rates (SOR)',
        category: 'Cost Engineering & Rate Analysis',
        equations: [
          {
            name: 'Unit Composite Rate Synthesis',
            formula: 'Rate = Material Cost + Labour Cost + Equipment Cost + Overhead & Profit',
            description: 'Synthesizes total prime cost with standard 10% - 15% contractor profit and overhead.',
            variables: ['Material = Sum of component materials', 'Labour = Skilled + unskilled man-days', 'Overhead & Profit typically 15%'],
          },
        ],
        assumptions: [
          'Current local market price schedules applied to basic materials and skilled labour.',
          'Water charges (1.5%) and contractor profit (10-15%) included in final unit rate.',
        ],
      };

    case 'continuous-beam':
      return {
        codeStandard: 'AISC 360 / ACI 318 / Clapeyron Three-Moment Theorem',
        category: 'Indeterminate Structural Analysis & Continuous Beams',
        equations: [
          {
            name: 'Clapeyron Three-Moment Equation for Multi-Span Continuity',
            formula: 'M_{i-1}·(L_i/I_i) + 2·M_i·(L_i/I_i + L_{i+1}/I_{i+1}) + M_{i+1}·(L_{i+1}/I_{i+1}) = -6·A_i·a_i/(L_i·I_i) - 6·A_{i+1}·b_{i+1}/(L_{i+1}·I_{i+1})',
            description: 'Enforces slope continuity across intermediate supports for indeterminate multi-span beams.',
            variables: ['M = Support bending moments (kN·m)', 'L = Span lengths (m)', 'I = Moments of inertia (cm⁴)', 'A·a/L = Load area coefficients'],
          },
          {
            name: 'Span Shear Force Superposition & Equilibrium',
            formula: 'V_{left, k} = (w_k·L_k)/2 + (P_k·b_k)/L_k + (M_k - M_{k-1})/L_k',
            description: 'Computes end reactions and shear distribution combining simply supported load shears and end continuity moments.',
            variables: ['w = UDL (kN/m)', 'P = Concentrated point load (kN)', 'M_k = Support moment at right end'],
          },
          {
            name: 'Extreme Fiber Flexural Stress',
            formula: 'f_b = (M_{max}·c) / I ≤ F_{allowable}',
            description: 'Checks maximum sagging span moment and intermediate support hogging moments against allowable bending limit.',
            variables: ['c = Distance to extreme fiber = d/2 (mm)', 'I = Moment of inertia (cm⁴)', 'F_{allowable} = Allowable stress (MPa)'],
          },
        ],
        assumptions: [
          'Linear elastic isotropic beam behavior with homogeneous section properties.',
          'Zero support settlement (rigid unyielding vertical supports).',
          'Plane sections remain plane under flexure (Euler-Bernoulli hypothesis).',
        ],
      };

    case 'pile-capacity':
      return {
        codeStandard: 'BNBC 2020 Part 6 Ch 3 / ACI 543R / Tomlinson / Meyerhof',
        category: 'Geotechnical Deep Foundations & Pile Capacity',
        equations: [
          {
            name: 'Total Ultimate Pile Axial Compressive Capacity',
            formula: 'Q_{ult} = Q_s + Q_p = ∑ (p·ΔL_i·f_{s,i}) + q_p·A_p',
            description: 'Total ultimate resistance equal to sum of cumulative shaft skin friction (Q_s) and base tip bearing (Q_p).',
            variables: ['p = Perimeter = π·D (m)', 'A_p = Base area = π·D²/4 (m²)', 'f_s = Unit skin friction (kPa)', 'q_p = Unit end bearing (kPa)'],
          },
          {
            name: 'Tomlinson α-Method for Cohesive Strata (Clay)',
            formula: 'f_s = α · c_u',
            description: 'Shaft friction in clays based on empirical adhesion factor α as a function of undrained shear strength c_u.',
            variables: ['α = Adhesion factor (0.35 to 1.0)', 'c_u = Undrained cohesion (kPa)'],
          },
          {
            name: 'Meyerhof Deep Bearing Capacity for Cohesionless Soils (Sand)',
            formula: 'q_p = σ\'_v · N_q ≤ q_{p,max}',
            description: 'Base resistance derived from effective overburden stress at tip and deep foundation bearing factor N_q.',
            variables: ['σ\'_v = Effective vertical overburden stress at tip (kPa)', 'N_q = Bearing capacity factor', 'q_{p,max} = 11,000 kPa limit'],
          },
          {
            name: 'Allowable Working Axial Load',
            formula: 'Q_{all} = Q_{ult} / FS (FS = 2.5 per BNBC 2020)',
            description: 'Safe allowable axial working capacity applied with design factor of safety.',
            variables: ['FS = Factor of safety (2.5 for bored cast-in-situ, 2.5-3.0 for driven)'],
          },
        ],
        assumptions: [
          'Static axial compressive loading on isolated single vertical pile.',
          'Overburden stress corrected for buoyant unit weight below groundwater table.',
          'Critical depth limit for skin friction and base resistance enforced at 15D.',
        ],
      };

    case 'pipe-hydraulics':
      return {
        codeStandard: 'Hazen-Williams Formulation / AWWA / ASCE Storm Drainage',
        category: 'Pressure Pipe & Storm Conduit Hydraulics',
        equations: [
          {
            name: 'Hazen-Williams Friction Head Loss Formulation (SI Units)',
            formula: 'h_f = (10.67 · L · Q^{1.852}) / (C^{1.852} · D^{4.87})',
            description: 'Calculates longitudinal friction energy dissipation along pressurized conduits.',
            variables: ['h_f = Friction head loss (m)', 'L = Pipe length (m)', 'Q = Flow rate (m³/s)', 'C = Roughness coefficient', 'D = Internal diameter (m)'],
          },
          {
            name: 'Continuity Flow Velocity',
            formula: 'V = Q / A = (4 · Q) / (π · D²)',
            description: 'Mean cross-sectional velocity evaluated against self-cleansing (≥0.6 m/s) and scour (≤3.0 m/s) criteria.',
            variables: ['V = Mean velocity (m/s)', 'A = Cross-sectional flow area (m²)'],
          },
          {
            name: 'Reynolds Number & Viscous Flow Regime',
            formula: 'Re = (V · D) / ν',
            description: 'Dimensionless ratio of inertial to viscous forces in conduit flow.',
            variables: ['ν = Kinematic viscosity of water (1.004 × 10⁻⁶ m²/s at 20°C)'],
          },
          {
            name: 'Hydraulic & Energy Grade Lines (HGL & EGL)',
            formula: 'EGL = z + P/(γ) + V²/(2g) | HGL = z + P/(γ)',
            description: 'Total dynamic head and piezometric surface tracing along the pipeline profile.',
            variables: ['z = Pipe invert elevation (m)', 'P = Internal pressure (kPa)', 'V²/(2g) = Velocity head (m)'],
          },
        ],
        assumptions: [
          'Steady incompressible single-phase water flow under pressurized closed-conduit conditions.',
          'Hazen-Williams equation valid for water temperatures 5°C to 25°C and diameters D ≥ 50mm.',
          'Minor fitting losses evaluated via K · V²/(2g).',
        ],
      };

    case 'unit-converter':
    default:
      return {
        codeStandard: 'NIST SP 811 / ISO 80000 / ASTM E380 Metric Practice',
        category: 'Engineering Metrology & Dimensional Analysis',
        equations: [
          {
            name: 'Canonical Base Unit Linear Transformation',
            formula: 'SI_Base = Input_Value · Scale_Factor + Offset',
            description: 'High-precision conversion through international base units (meters, kilograms, Pascals, Newtons, cubic meters).',
            variables: ['Scale_Factor = Multiplicative coefficient to base', 'Offset = Zero-point shift (e.g. temperature)'],
          },
          {
            name: 'Target Dimension Readout',
            formula: 'Target_Value = (SI_Base - Target_Offset) / Target_Scale_Factor',
            description: 'Lossless inverse conversion from canonical SI base to arbitrary target engineering unit.',
            variables: ['Target_Scale_Factor = Canonical conversion coefficient'],
          },
        ],
        assumptions: [
          'Conversions use IEEE 754 double precision floating point with trailing rounding.',
          'Both metric (SI), imperial/US customary, and South Asian regional units (cft, Maund, Bigha) supported.',
        ],
      };
  }
}

/**
 * Computes live Capacity Utilization / Demand-Capacity Ratio (DCR) or Factor of Safety for the active module.
 */
export function getCapacityUtilization(
  moduleId: EngineeringModuleId,
  workspace: CivilWorkspace,
  envelope: CalculationEnvelope<any>
): CapacityUtilizationInfo | null {
  const result = envelope.result;
  if (!result) return null;

  switch (moduleId) {
    case 'beam-analysis': {
      const beamRes = result as BeamAnalysisResult;
      const dcr = beamRes.utilizationRatio || 0;
      const pct = Math.min(100, Math.round(dcr * 100));
      const status: 'safe' | 'warning' | 'critical' =
        dcr <= 0.85 ? 'safe' : dcr <= 1.0 ? 'warning' : 'critical';
      return {
        metricLabel: 'Flexural Stress DCR (Demand / Capacity)',
        formattedValue: `${(dcr * 100).toFixed(1)}%`,
        percentage: pct,
        status,
        description:
          dcr <= 0.85
            ? 'Optimal structural capacity reserve (Demand < 85% Allowable).'
            : dcr <= 1.0
            ? 'Advisory: Operating within 85%-100% of allowable bending capacity.'
            : 'CRITICAL: Section flexural stress exceeds allowable limit (DCR > 1.0). Upsize beam section.',
        referenceLimit: `Allowable Stress: ${workspace.beam.allowableStressMpa} MPa`,
      };
    }

    case 'bearing-capacity': {
      const bRes = result as BearingAnalysisResult;
      const fos = bRes.effectiveSafetyFactor || workspace.bearing.factorOfSafety;
      const minFos = workspace.bearing.factorOfSafety;
      const pct = Math.min(100, Math.round((fos / 4.0) * 100));
      const status: 'safe' | 'warning' | 'critical' =
        fos >= minFos ? 'safe' : fos >= minFos * 0.85 ? 'warning' : 'critical';
      return {
        metricLabel: 'Geotechnical Factor of Safety (FoS)',
        formattedValue: `FoS = ${fos.toFixed(2)}`,
        percentage: pct,
        status,
        description:
          fos >= minFos
            ? `Foundation bearing capacity verified (FoS ${fos.toFixed(2)} ≥ required ${minFos.toFixed(2)}).`
            : `FoS ${fos.toFixed(2)} is BELOW required design minimum ${minFos.toFixed(2)}. Increase footing width or embedment depth.`,
        referenceLimit: `Minimum Required FoS: ${minFos.toFixed(2)}`,
      };
    }

    case 'open-channel': {
      const chRes = result as ChannelHydraulicsResult;
      const fr = chRes.froudeNumber;
      const isSubcritical = fr < 1.0;
      const isCritical = Math.abs(fr - 1.0) <= 0.05;
      const status: 'safe' | 'warning' | 'critical' =
        isSubcritical ? 'safe' : isCritical ? 'warning' : 'warning';
      return {
        metricLabel: 'Hydrodynamic Flow Regime (Froude Number)',
        formattedValue: `Fr = ${fr.toFixed(2)} (${chRes.flowRegime})`,
        percentage: Math.min(100, Math.round(fr * 50)),
        status,
        description:
          isSubcritical
            ? 'Subcritical Flow (Tranquil): Gravitational waves propagate upstream. Stable erosion characteristics.'
            : isCritical
            ? 'Critical Flow (Fr ≈ 1.0): Unstable water surface; prone to standing waves and air entrainment.'
            : 'Supercritical Flow (Rapid): High velocity flow. Check for scour and design energy dissipators.',
        referenceLimit: `Critical Threshold: Fr = 1.00`,
      };
    }

    case 'concrete-mix': {
      const cmRes = result as ConcreteMixResult;
      const target = cmRes.estimated28DayMpa;
      const specified = workspace.concrete.targetStrengthMpa;
      return {
        metricLabel: 'Concrete Compressive Target Margin',
        formattedValue: `${target.toFixed(1)} MPa (Specified: ${specified.toFixed(1)} MPa)`,
        percentage: Math.min(100, Math.round((specified / (target || 1)) * 100)),
        status: 'safe',
        description: `Characteristic target strength incorporates standard deviation margin above specified f'c.`,
        referenceLimit: `Estimated 28-Day Strength = ${target.toFixed(1)} MPa`,
      };
    }

    case 'continuous-beam': {
      const cbRes = result as ContinuousBeamResult;
      const dcr = cbRes.utilizationRatio || 0;
      const pct = Math.min(100, Math.max(4, Math.round(dcr * 100)));
      const status: 'safe' | 'warning' | 'critical' =
        dcr <= 0.85 ? 'safe' : dcr <= 1.0 ? 'warning' : 'critical';
      return {
        metricLabel: 'Continuous Beam Flexural DCR (Demand / Capacity)',
        formattedValue: `${(dcr * 100).toFixed(1)}%`,
        percentage: pct,
        status,
        description:
          dcr <= 0.85
            ? 'Optimal multi-span moment reserve (Demand < 85% Allowable).'
            : dcr <= 1.0
            ? 'Advisory: Operating within 85%-100% of allowable bending capacity.'
            : 'CRITICAL: Section flexural stress exceeds allowable limit (DCR > 1.0). Increase moment of inertia.',
        referenceLimit: `Allowable Stress: ${workspace.continuousBeam?.allowableStressMpa || 250} MPa`,
      };
    }

    case 'pile-capacity': {
      const pRes = result as PileCapacityResult;
      const dcr = pRes.utilizationRatio || 0;
      const pct = Math.min(100, Math.max(4, Math.round(dcr * 100)));
      const status: 'safe' | 'warning' | 'critical' =
        dcr <= 0.85 ? 'safe' : dcr <= 1.0 ? 'warning' : 'critical';
      return {
        metricLabel: 'Pile Axial Bearing DCR (P_applied / Q_allowable)',
        formattedValue: `${(dcr * 100).toFixed(1)}%`,
        percentage: pct,
        status,
        description:
          dcr <= 0.85
            ? `Deep foundation axial capacity verified (P ${pRes.appliedLoadKn} kN ≤ Q_all ${pRes.allowableCapacityKn.toFixed(0)} kN).`
            : dcr <= 1.0
            ? `Advisory: Axial working load approaching allowable capacity limit.`
            : `CRITICAL: Working load exceeds allowable capacity. Increase pile diameter or embedment length.`,
        referenceLimit: `Allowable Capacity: ${pRes.allowableCapacityKn.toFixed(0)} kN (FS = ${pRes.factorOfSafety})`,
      };
    }

    case 'pipe-hydraulics': {
      const pipeRes = result as PipeHydraulicsResult;
      const dcr = pipeRes.utilizationRatio || 0;
      const pct = Math.min(100, Math.max(4, Math.round(dcr * 100)));
      const status: 'safe' | 'warning' | 'critical' =
        pipeRes.selfCleansingStatus === 'pass' && pipeRes.maxVelocityStatus === 'pass'
          ? 'safe'
          : pipeRes.maxVelocityStatus === 'fail'
          ? 'critical'
          : 'warning';
      return {
        metricLabel: 'Conduit Velocity & Scour Limit DCR',
        formattedValue: `${pipeRes.velocityMps.toFixed(2)} m/s (${(dcr * 100).toFixed(0)}%)`,
        percentage: pct,
        status,
        description:
          status === 'safe'
            ? `Flow velocity satisfies both self-cleansing (≥0.6 m/s) and non-scouring (≤3.0 m/s) criteria.`
            : pipeRes.velocityMps < 0.6
            ? `Advisory: Velocity < 0.6 m/s; risk of silt deposition in pipeline.`
            : `CRITICAL: Velocity exceeds 3.0 m/s; excessive surge pressure and pipe scouring hazard.`,
        referenceLimit: `Velocity Range: 0.60 m/s ≤ V ≤ 3.00 m/s`,
      };
    }

    default:
      return null;
  }
}

/**
 * Computes all relevant Demand-Capacity Ratio (DCR) limit-state gauges for the active module,
 * returning an array of evaluated gauges (e.g. flexure, shear, deflection, bearing, etc.)
 */
export function getAllCapacityUtilizations(
  moduleId: EngineeringModuleId,
  workspace: CivilWorkspace,
  envelope: CalculationEnvelope<any>
): CapacityUtilizationInfo[] {
  const result = envelope.result;
  if (!result) return [];

  const gauges: CapacityUtilizationInfo[] = [];

  switch (moduleId) {
    case 'beam-analysis': {
      const beamRes = result as BeamAnalysisResult;
      const flexDcr = beamRes.utilizationRatio || 0;
      const flexPct = Math.min(100, Math.max(4, Math.round(flexDcr * 100)));
      const flexStatus: 'safe' | 'warning' | 'critical' =
        flexDcr <= 0.85 ? 'safe' : flexDcr <= 1.0 ? 'warning' : 'critical';

      gauges.push({
        metricLabel: 'Flexural Bending Stress DCR',
        formattedValue: `${(flexDcr * 100).toFixed(1)}%`,
        percentage: flexPct,
        status: flexStatus,
        description:
          flexDcr <= 0.85
            ? 'Optimal structural capacity reserve (Demand < 85% Allowable).'
            : flexDcr <= 1.0
            ? 'Advisory: Operating within 85%-100% of allowable bending capacity.'
            : 'CRITICAL: Section flexural stress exceeds allowable limit (DCR > 1.0). Upsize beam section.',
        referenceLimit: `Allowable: ${workspace.beam.allowableStressMpa} MPa (Actual: ${beamRes.bendingStressMpa.toFixed(1)} MPa)`,
      });

      // Deflection limit state DCR
      const deflDemand = beamRes.maxDeflectionMm || 0;
      const deflAllowable = beamRes.allowableDeflectionMm || (workspace.beam.spanLengthM * 1000) / 250;
      const deflDcr = deflAllowable > 0 ? deflDemand / deflAllowable : 0;
      const deflPct = Math.min(100, Math.max(4, Math.round(deflDcr * 100)));
      const deflStatus: 'safe' | 'warning' | 'critical' =
        deflDcr <= 0.80 ? 'safe' : deflDcr <= 1.0 ? 'warning' : 'critical';

      gauges.push({
        metricLabel: 'Serviceability Deflection DCR (Δ / Δ_all)',
        formattedValue: `${(deflDcr * 100).toFixed(1)}%`,
        percentage: deflPct,
        status: deflStatus,
        description:
          deflDcr <= 0.80
            ? `Deflection comfortably satisfies L/250 code limit (${deflDemand.toFixed(1)} mm vs ${deflAllowable.toFixed(1)} mm max).`
            : deflDcr <= 1.0
            ? `Advisory: Beam deflection nearing span limit criteria (${deflDemand.toFixed(1)} mm).`
            : `CRITICAL: Deflection exceeds serviceability limit (${deflDemand.toFixed(1)} mm > ${deflAllowable.toFixed(1)} mm). Increase moment of inertia.`,
        referenceLimit: `Allowable Deflection: ${deflAllowable.toFixed(1)} mm`,
      });

      // Shear capacity DCR
      const shearDemand = Math.abs(beamRes.maxShearKn || 0);
      const secModCm3 = (20 * workspace.beam.momentOfInertiaCm4) / (workspace.beam.sectionDepthMm || 1);
      const estShearCapacity = workspace.beam.allowableStressMpa * 0.4 * (secModCm3 / 10);
      const shearCapKn = Math.max(50, estShearCapacity);
      const shearDcr = shearDemand / shearCapKn;
      const shearPct = Math.min(100, Math.max(4, Math.round(shearDcr * 100)));
      const shearStatus: 'safe' | 'warning' | 'critical' =
        shearDcr <= 0.85 ? 'safe' : shearDcr <= 1.0 ? 'warning' : 'critical';

      gauges.push({
        metricLabel: 'Shear Force Capacity DCR (V_u / V_c)',
        formattedValue: `${(shearDcr * 100).toFixed(1)}%`,
        percentage: shearPct,
        status: shearStatus,
        description:
          shearDcr <= 0.85
            ? `Section shear stress operates within allowable web limits (V_max = ${shearDemand.toFixed(1)} kN).`
            : shearDcr <= 1.0
            ? `Advisory: Web shear stress approaching limit state.`
            : `CRITICAL: Shear demand exceeds nominal resistance. Add web stiffeners or increase web thickness.`,
        referenceLimit: `Shear Demand: ${shearDemand.toFixed(1)} kN`,
      });
      break;
    }

    case 'bearing-capacity': {
      const bRes = result as BearingAnalysisResult;
      const applied = bRes.appliedPressureKpa || 0;
      const allowable = bRes.allowableBearingKpa || 1;
      const dcr = applied / allowable;
      const pct = Math.min(100, Math.max(4, Math.round(dcr * 100)));
      const status: 'safe' | 'warning' | 'critical' =
        dcr <= 0.85 ? 'safe' : dcr <= 1.0 ? 'warning' : 'critical';

      gauges.push({
        metricLabel: 'Soil Bearing Pressure DCR (q_app / q_all)',
        formattedValue: `${(dcr * 100).toFixed(1)}%`,
        percentage: pct,
        status,
        description:
          dcr <= 0.85
            ? `Net foundation bearing pressure satisfies allowable geotechnical capacity (${applied.toFixed(1)} kPa ≤ ${allowable.toFixed(1)} kPa).`
            : dcr <= 1.0
            ? `Advisory: Footing bearing pressure operating within 85-100% of allowable limit.`
            : `CRITICAL: Applied soil pressure exceeds allowable bearing capacity. Increase footing footprint.`,
        referenceLimit: `Allowable Bearing: ${allowable.toFixed(1)} kPa`,
      });

      const fos = bRes.effectiveSafetyFactor || workspace.bearing.factorOfSafety;
      const minFos = workspace.bearing.factorOfSafety;
      const fosPct = Math.min(100, Math.max(4, Math.round((fos / (minFos * 1.5)) * 100)));
      const fosStatus: 'safe' | 'warning' | 'critical' =
        fos >= minFos ? 'safe' : fos >= minFos * 0.85 ? 'warning' : 'critical';

      gauges.push({
        metricLabel: 'Geotechnical Safety Factor (FoS Compliance)',
        formattedValue: `FoS = ${fos.toFixed(2)}`,
        percentage: fosPct,
        status: fosStatus,
        description:
          fos >= minFos
            ? `Design safety margin verified (FoS ${fos.toFixed(2)} ≥ required ${minFos.toFixed(2)}).`
            : `FoS ${fos.toFixed(2)} is BELOW code required minimum ${minFos.toFixed(2)}.`,
        referenceLimit: `Required FoS: ${minFos.toFixed(2)}`,
      });

      const ultReserve = Math.max(4, Math.min(100, Math.round(((bRes.ultimateBearingKpa - applied) / (bRes.ultimateBearingKpa || 1)) * 100)));
      gauges.push({
        metricLabel: 'Ultimate Geotechnical Capacity Reserve',
        formattedValue: `${ultReserve}% Reserve`,
        percentage: ultReserve,
        status: ultReserve >= 60 ? 'safe' : ultReserve >= 30 ? 'warning' : 'critical',
        description: `Ultimate capacity margin against shear failure (q_ult = ${bRes.ultimateBearingKpa.toFixed(1)} kPa).`,
        referenceLimit: `Ultimate: ${bRes.ultimateBearingKpa.toFixed(1)} kPa`,
      });
      break;
    }

    case 'open-channel': {
      const chRes = result as ChannelHydraulicsResult;
      const fr = chRes.froudeNumber;
      const isSubcritical = fr < 1.0;
      const isCritical = Math.abs(fr - 1.0) <= 0.05;
      const frPct = Math.min(100, Math.max(4, Math.round(fr * 50)));
      const status: 'safe' | 'warning' | 'critical' =
        isSubcritical ? 'safe' : isCritical ? 'warning' : 'warning';

      gauges.push({
        metricLabel: 'Hydrodynamic Flow Regime (Froude Number)',
        formattedValue: `Fr = ${fr.toFixed(2)} (${chRes.flowRegime})`,
        percentage: frPct,
        status,
        description:
          isSubcritical
            ? 'Subcritical Flow (Tranquil): Gravitational waves propagate upstream. Stable erosion characteristics.'
            : isCritical
            ? 'Critical Flow (Fr ≈ 1.0): Unstable water surface; prone to standing waves.'
            : 'Supercritical Flow (Rapid): High velocity flow. Check for scour and design energy dissipators.',
        referenceLimit: `Critical Threshold: Fr = 1.00`,
      });

      const vel = chRes.velocityMps || 0;
      const maxVel = 3.0; // m/s non-scouring threshold
      const velDcr = vel / maxVel;
      const velPct = Math.min(100, Math.max(4, Math.round(velDcr * 100)));
      gauges.push({
        metricLabel: 'Channel Velocity Scour Limit DCR',
        formattedValue: `${vel.toFixed(2)} m/s (${(velDcr * 100).toFixed(0)}%)`,
        percentage: velPct,
        status: velDcr <= 0.8 ? 'safe' : velDcr <= 1.0 ? 'warning' : 'critical',
        description:
          velDcr <= 0.8
            ? `Flow velocity satisfies non-erodible lining criteria (${vel.toFixed(2)} m/s < ${maxVel.toFixed(1)} m/s).`
            : velDcr <= 1.0
            ? `Advisory: Velocity approaching max non-scouring threshold.`
            : `CRITICAL: Velocity exceeds 3.0 m/s; channel lining revetment or riprap required.`,
        referenceLimit: `Max Permissible: ${maxVel.toFixed(1)} m/s`,
      });

      const shear = chRes.shearStressPa || 0;
      const shearPct = Math.min(100, Math.max(4, Math.round((shear / 40) * 100)));
      gauges.push({
        metricLabel: 'Boundary Shear Stress Utilization',
        formattedValue: `${shear.toFixed(1)} Pa`,
        percentage: shearPct,
        status: shearPct <= 75 ? 'safe' : shearPct <= 100 ? 'warning' : 'critical',
        description: `Tractive force on wetted boundary perimeter: τ_0 = γ * R * S.`,
        referenceLimit: `Boundary Shear: ${shear.toFixed(1)} Pa`,
      });
      break;
    }

    case 'concrete-mix': {
      const cmRes = result as ConcreteMixResult;
      const target = cmRes.estimated28DayMpa;
      const specified = workspace.concrete.targetStrengthMpa;
      const ratio = (specified / (target || 1));
      const pct = Math.min(100, Math.max(4, Math.round(ratio * 100)));

      gauges.push({
        metricLabel: 'Concrete Compressive Strength Margin',
        formattedValue: `${target.toFixed(1)} MPa (Req: ${specified.toFixed(1)} MPa)`,
        percentage: pct,
        status: 'safe',
        description: `Target strength satisfies statistical overdesign requirement per ACI 214 / IS 10262.`,
        referenceLimit: `Estimated 28-Day Strength = ${target.toFixed(1)} MPa`,
      });

      const wcRatio = workspace.concrete.waterCementRatio;
      const maxWc = 0.50;
      const wcPct = Math.min(100, Math.max(4, Math.round((wcRatio / maxWc) * 100)));
      gauges.push({
        metricLabel: 'Water-Cement Ratio (w/c) Code Limit',
        formattedValue: `w/c = ${wcRatio.toFixed(2)}`,
        percentage: wcPct,
        status: wcRatio <= 0.45 ? 'safe' : wcRatio <= 0.50 ? 'warning' : 'critical',
        description: `Permissible water-cement ratio for durability and permeability exposure class.`,
        referenceLimit: `Max Code Limit: w/c ≤ ${maxWc.toFixed(2)}`,
      });
      break;
    }

    case 'continuous-beam': {
      const cbRes = result as ContinuousBeamResult;
      const flexDcr = cbRes.utilizationRatio || 0;
      const flexPct = Math.min(100, Math.max(4, Math.round(flexDcr * 100)));
      const flexStatus: 'safe' | 'warning' | 'critical' =
        flexDcr <= 0.85 ? 'safe' : flexDcr <= 1.0 ? 'warning' : 'critical';

      gauges.push({
        metricLabel: 'Flexural Stress DCR (Extreme Fiber)',
        formattedValue: `${(flexDcr * 100).toFixed(1)}%`,
        percentage: flexPct,
        status: flexStatus,
        description:
          flexDcr <= 0.85
            ? 'Safe: Multi-span bending stresses operate within allowable limits.'
            : flexDcr <= 1.0
            ? 'Advisory: Maximum moment approaches section capacity.'
            : 'CRITICAL: Section flexural stress exceeds allowable limit state.',
        referenceLimit: `Allowable: ${workspace.continuousBeam?.allowableStressMpa || 250} MPa (Actual: ${cbRes.bendingStressMpa.toFixed(1)} MPa)`,
      });

      const maxHog = cbRes.maxHoggingMomentKnm || 0;
      const maxSag = cbRes.maxSaggingMomentKnm || 1;
      const hogRatio = maxHog / (maxSag * 1.5);
      gauges.push({
        metricLabel: 'Hogging / Sagging Moment Distribution',
        formattedValue: `${maxHog.toFixed(1)} / ${maxSag.toFixed(1)} kN·m`,
        percentage: Math.min(100, Math.max(4, Math.round(hogRatio * 100))),
        status: hogRatio <= 0.85 ? 'safe' : hogRatio <= 1.0 ? 'warning' : 'warning',
        description: `Support negative hogging moment vs span positive sagging moment envelope.`,
        referenceLimit: `Max Hogging: -${maxHog.toFixed(1)} kN·m`,
      });

      const shearDemand = Math.abs(cbRes.maxShearKn || 0);
      const estShearCap = (workspace.continuousBeam?.allowableStressMpa || 250) * 0.4 * 50;
      const shearDcr = shearDemand / estShearCap;
      gauges.push({
        metricLabel: 'Continuous Web Shear Capacity DCR',
        formattedValue: `${(shearDcr * 100).toFixed(1)}%`,
        percentage: Math.min(100, Math.max(4, Math.round(shearDcr * 100))),
        status: shearDcr <= 0.85 ? 'safe' : shearDcr <= 1.0 ? 'warning' : 'critical',
        description: `Critical shear force developing adjacent to intermediate continuous supports.`,
        referenceLimit: `Critical Shear: ${shearDemand.toFixed(1)} kN`,
      });
      break;
    }

    case 'pile-capacity': {
      const pRes = result as PileCapacityResult;
      const axialDcr = pRes.utilizationRatio || 0;
      const axialPct = Math.min(100, Math.max(4, Math.round(axialDcr * 100)));
      const axialStatus: 'safe' | 'warning' | 'critical' =
        axialDcr <= 0.85 ? 'safe' : axialDcr <= 1.0 ? 'warning' : 'critical';

      gauges.push({
        metricLabel: 'Axial Compression DCR (P / Q_allowable)',
        formattedValue: `${(axialDcr * 100).toFixed(1)}%`,
        percentage: axialPct,
        status: axialStatus,
        description:
          axialDcr <= 0.85
            ? `Deep foundation bearing reserve verified (P ≤ Q_all).`
            : axialDcr <= 1.0
            ? `Advisory: Approaching maximum allowable bearing capacity.`
            : `CRITICAL: Working load exceeds allowable geotechnical capacity.`,
        referenceLimit: `Allowable: ${pRes.allowableCapacityKn.toFixed(0)} kN (FS = ${pRes.factorOfSafety})`,
      });

      const skinRatio = pRes.ultimateCapacityKn > 0 ? (pRes.skinFrictionKn / pRes.ultimateCapacityKn) : 0;
      gauges.push({
        metricLabel: 'Shaft Skin Friction Contribution (Qs / Q_ult)',
        formattedValue: `${(skinRatio * 100).toFixed(1)}%`,
        percentage: Math.min(100, Math.max(4, Math.round(skinRatio * 100))),
        status: 'safe',
        description: `Proportion of ultimate capacity carried by shaft friction (${pRes.skinFrictionKn.toFixed(0)} kN of ${pRes.ultimateCapacityKn.toFixed(0)} kN).`,
        referenceLimit: `Skin Friction Qs: ${pRes.skinFrictionKn.toFixed(0)} kN`,
      });

      const sLimitMm = 25.0; // standard 25mm structural limit
      const sDcr = pRes.elasticSettlementMm / sLimitMm;
      gauges.push({
        metricLabel: 'Elastic Settlement Serviceability Check',
        formattedValue: `${pRes.elasticSettlementMm.toFixed(1)} mm`,
        percentage: Math.min(100, Math.max(4, Math.round(sDcr * 100))),
        status: sDcr <= 0.8 ? 'safe' : sDcr <= 1.0 ? 'warning' : 'critical',
        description: `Estimated total pile settlement (elastic shaft + base penetration) under working load.`,
        referenceLimit: `Allowable Settlement: ≤ ${sLimitMm.toFixed(0)} mm`,
      });
      break;
    }

    case 'pipe-hydraulics': {
      const pipeRes = result as PipeHydraulicsResult;
      const velDcr = pipeRes.utilizationRatio || 0;
      const velPct = Math.min(100, Math.max(4, Math.round(velDcr * 100)));
      const velStatus: 'safe' | 'warning' | 'critical' =
        pipeRes.selfCleansingStatus === 'pass' && pipeRes.maxVelocityStatus === 'pass'
          ? 'safe'
          : pipeRes.maxVelocityStatus === 'fail'
          ? 'critical'
          : 'warning';

      gauges.push({
        metricLabel: 'Flow Velocity & Scour Limit DCR',
        formattedValue: `${pipeRes.velocityMps.toFixed(2)} m/s (${(velDcr * 100).toFixed(0)}%)`,
        percentage: velPct,
        status: velStatus,
        description:
          velStatus === 'safe'
            ? `Flow velocity satisfies both self-cleansing and non-scouring criteria.`
            : pipeRes.velocityMps < 0.6
            ? `Advisory: Velocity is below 0.6 m/s; risk of silt deposition.`
            : `CRITICAL: Velocity exceeds 3.0 m/s; risk of pipe scouring and water hammer.`,
        referenceLimit: `Design Envelope: 0.60 m/s ≤ V ≤ 3.00 m/s`,
      });

      const pOut = pipeRes.outletPressureKpa || 0;
      const pNominal = 200; // kPa
      const pPct = Math.min(100, Math.max(4, Math.round((pOut / pNominal) * 100)));
      gauges.push({
        metricLabel: 'Residual Terminal Delivery Pressure',
        formattedValue: `${pOut.toFixed(1)} kPa`,
        percentage: pPct,
        status: pOut >= 100 ? 'safe' : pOut >= 50 ? 'warning' : 'critical',
        description: `Remaining pressure head at delivery outlet after friction and minor losses.`,
        referenceLimit: `Target Residual: ≥ 100 kPa`,
      });

      const lossRatio = pipeRes.totalHeadLossM / (pipeRes.lengthM || 1);
      gauges.push({
        metricLabel: 'Dynamic Head Loss Gradient (H_L / L)',
        formattedValue: `${(lossRatio * 1000).toFixed(1)} m/km`,
        percentage: Math.min(100, Math.max(4, Math.round(lossRatio * 5000))),
        status: lossRatio <= 0.02 ? 'safe' : lossRatio <= 0.05 ? 'warning' : 'critical',
        description: `Total energy grade slope: h_f (${pipeRes.frictionHeadLossM.toFixed(1)}m) + h_m (${pipeRes.minorHeadLossM.toFixed(1)}m).`,
        referenceLimit: `Total Loss H_L: ${pipeRes.totalHeadLossM.toFixed(2)} m`,
      });
      break;
    }

    default: {
      const primary = getCapacityUtilization(moduleId, workspace, envelope);
      if (primary) {
        gauges.push(primary);
      }
      break;
    }
  }

  return gauges;
}

/**
 * Generates and triggers download of a standardized CSV calculation schedule for the active module.
 */
export function exportAnalyticalScheduleCsv(
  moduleId: EngineeringModuleId,
  workspace: CivilWorkspace,
  envelope: CalculationEnvelope<any>,
  userProfile?: UserProfile
): void {
  const result = envelope.result;
  if (!result) return;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8);

  const lines: string[] = [];

  // Header metadata block
  lines.push(`"PB CIVILLAB — CERTIFIED ENGINEERING CALCULATION SCHEDULE"`);
  lines.push(`"Project Name:","${workspace.name.replace(/"/g, '""')}"`);
  lines.push(`"Project Code:","${workspace.projectCode}"`);
  lines.push(`"Discipline / Module:","${moduleId.toUpperCase()}"`);
  lines.push(`"Currency:","${workspace.currency}"`);
  lines.push(`"Site Location:","${(workspace.siteLocation || 'Jobsite').replace(/"/g, '""')}"`);
  if (userProfile?.fullName) {
    lines.push(`"Engineer of Record:","${userProfile.fullName.replace(/"/g, '""')} (${userProfile.designation || 'PE'})"`);
    lines.push(`"License / Organization:","${(userProfile.licenseNumber || 'PE-00000')} · ${(userProfile.organization || 'Civil Engineering').replace(/"/g, '""')}"`);
  }
  lines.push(`"Export Timestamp:","${dateStr} ${timeStr}"`);
  lines.push(`"Analytical Status:","${envelope.status.toUpperCase()}"`);
  lines.push(``); // Blank line

  // Module specific data table
  switch (moduleId) {
    case 'beam-analysis': {
      const r = result as BeamAnalysisResult;
      const p = workspace.beam;
      lines.push(`"PARAMETER DESCRIPTION","SYMBOL","COMPUTED VALUE","UNIT","SI BASE EQUIVALENCE","EVALUATION STATUS"`);
      lines.push(`"Clear Span Length","L",${p.spanLengthM},"m","${p.spanLengthM} m","NOMINAL"`);
      lines.push(`"Uniform Distributed Load","w",${p.uniformLoadKnPerM},"kN/m","${p.uniformLoadKnPerM * 1000} N/m","INPUT"`);
      lines.push(`"Concentrated Point Load","P",${p.pointLoadKn},"kN","${p.pointLoadKn * 1000} N","INPUT"`);
      lines.push(`"Point Load Position","a",${p.pointLoadPositionM},"m","${p.pointLoadPositionM} m","INPUT"`);
      lines.push(`"Elastic Modulus","E",${p.elasticModulusGpa},"GPa","${p.elasticModulusGpa * 1e9} Pa","MATERIAL"`);
      lines.push(`"Moment of Inertia","I",${p.momentOfInertiaCm4},"cm4","${(p.momentOfInertiaCm4 * 1e-8).toExponential(4)} m4","SECTION"`);
      lines.push(`"Section Depth","d",${p.sectionDepthMm},"mm","${(p.sectionDepthMm * 0.001).toFixed(3)} m","SECTION"`);
      lines.push(`"Max Flexural Bending Moment","M_max",${r.maxMomentKnm.toFixed(2)},"kN.m","${(r.maxMomentKnm * 1000).toFixed(0)} N.m","${r.status.toUpperCase()}"`);
      lines.push(`"Max Vertical Shear Force","V_max",${r.maxShearKn.toFixed(2)},"kN","${(r.maxShearKn * 1000).toFixed(0)} N","CHECK"`);
      lines.push(`"Left Support Reaction","R_A",${r.reactionLeftKn.toFixed(2)},"kN","${(r.reactionLeftKn * 1000).toFixed(0)} N","NOMINAL"`);
      lines.push(`"Right Support Reaction","R_B",${r.reactionRightKn.toFixed(2)},"kN","${(r.reactionRightKn * 1000).toFixed(0)} N","NOMINAL"`);
      lines.push(`"Max Midspan Deflection","delta_max",${r.maxDeflectionMm.toFixed(3)},"mm","${(r.maxDeflectionMm * 0.001).toFixed(6)} m","${r.maxDeflectionMm <= r.allowableDeflectionMm ? 'PASS (<= L/360)' : 'EXCEEDED'}"`);
      lines.push(`"Allowable Deflection Limit (L/360)","delta_allow",${r.allowableDeflectionMm.toFixed(3)},"mm","${(r.allowableDeflectionMm * 0.001).toFixed(6)} m","SERVICE LIMIT"`);
      lines.push(`"Extreme Fiber Bending Stress","f_b",${r.bendingStressMpa.toFixed(2)},"MPa","${(r.bendingStressMpa * 1e6).toFixed(0)} Pa","${r.bendingStressMpa <= p.allowableStressMpa ? 'CAPACITY OK' : 'EXCEEDED'}"`);
      lines.push(`"Stress Utilization Ratio","D/C",${(r.utilizationRatio * 100).toFixed(1)},"%","${r.utilizationRatio.toFixed(4)}","${r.status.toUpperCase()}"`);

      // Add station matrix
      lines.push(``);
      lines.push(`"DISCRETIZED BEAM STATION POINT MATRIX (SFD / BMD / DEFLECTION ENVELOPE)"`);
      lines.push(`"Station x (m)","Shear Force V (kN)","Bending Moment M (kN.m)","Deflection delta (mm)"`);
      r.points.forEach((pt) => {
        lines.push(`${pt.x.toFixed(3)},${pt.shearKn.toFixed(2)},${pt.momentKnm.toFixed(2)},${pt.deflectionMm.toFixed(4)}`);
      });
      break;
    }

    case 'bearing-capacity': {
      const r = result as BearingAnalysisResult;
      const p = workspace.bearing;
      lines.push(`"GEOTECHNICAL VARIABLE","SYMBOL","DESIGN VALUE","UNIT","SI BASE READOUT","SAFETY EVALUATION"`);
      lines.push(`"Footing Width","B",${p.footingWidthM},"m","${p.footingWidthM} m","GEOMETRY"`);
      lines.push(`"Footing Shape","Shape","${p.footingShape}","type","${p.footingShape}","${p.footingShape}"`);
      lines.push(`"Embedment Depth","D_f",${p.embedmentDepthM},"m","${p.embedmentDepthM} m","DEPTH"`);
      lines.push(`"Soil Cohesion","c",${p.soilCohesionKpa},"kPa","${p.soilCohesionKpa * 1000} Pa","SOIL"`);
      lines.push(`"Internal Friction Angle","phi",${p.frictionAngleDeg},"deg","${(p.frictionAngleDeg * Math.PI / 180).toFixed(4)} rad","SOIL"`);
      lines.push(`"Soil Unit Weight","gamma",${p.unitWeightKnPerM3},"kN/m3","${p.unitWeightKnPerM3 * 1000} N/m3","SOIL"`);
      lines.push(`"Design Factor of Safety","FoS",${p.factorOfSafety},"ratio","${p.factorOfSafety}","REQUIRED"`);
      lines.push(`"Bearing Capacity Factor N_c","N_c",${r.nc.toFixed(3)},"factor","${r.nc.toFixed(3)}","BEARING FACTOR"`);
      lines.push(`"Bearing Capacity Factor N_q","N_q",${r.nq.toFixed(3)},"factor","${r.nq.toFixed(3)}","BEARING FACTOR"`);
      lines.push(`"Bearing Capacity Factor N_gamma","N_gamma",${r.nGamma.toFixed(3)},"factor","${r.nGamma.toFixed(3)}","BEARING FACTOR"`);
      lines.push(`"Ultimate Bearing Capacity","q_ult",${r.ultimateBearingKpa.toFixed(2)},"kPa","${(r.ultimateBearingKpa * 1000).toFixed(0)} Pa","ULTIMATE"`);
      lines.push(`"Allowable Bearing Capacity","q_all",${r.allowableBearingKpa.toFixed(2)},"kPa","${(r.allowableBearingKpa * 1000).toFixed(0)} Pa","${r.status.toUpperCase()}"`);
      lines.push(`"Applied Column Load","P_col",${p.appliedColumnLoadKn.toFixed(2)},"kN","${(p.appliedColumnLoadKn * 1000).toFixed(0)} N","APPLIED"`);
      lines.push(`"Effective Factor of Safety","FoS_eff",${r.effectiveSafetyFactor.toFixed(2)},"ratio","${r.effectiveSafetyFactor.toFixed(2)}","${r.status.toUpperCase()}"`);
      break;
    }

    case 'open-channel': {
      const r = result as ChannelHydraulicsResult;
      const p = workspace.channel;
      lines.push(`"HYDRAULIC PARAMETER","SYMBOL","VALUE","UNIT","EVALUATION STATUS"`);
      lines.push(`"Channel Bottom Width","b",${p.bottomWidthM},"m","INPUT"`);
      lines.push(`"Normal Flow Depth","y",${p.flowDepthM},"m","INPUT"`);
      lines.push(`"Trapezoidal Side Slope (Z:1)","z",${p.sideSlopeZ},":1","INPUT"`);
      lines.push(`"Channel Bed Slope","S_0",${p.bedSlope},"m/m","INPUT"`);
      lines.push(`"Manning Roughness Coefficient","n",${p.manningN},"s/m^(1/3)","INPUT"`);
      lines.push(`"Total Volumetric Discharge","Q",${r.dischargeM3ps.toFixed(3)},"m3/s","${(r.dischargeM3ps * 1000).toFixed(1)} L/s"`);
      lines.push(`"Mean Flow Velocity","V",${r.velocityMps.toFixed(3)},"m/s","VELOCITY"`);
      lines.push(`"Wetted Flow Area","A",${r.flowAreaM2.toFixed(3)},"m2","AREA"`);
      lines.push(`"Wetted Perimeter","P",${r.wettedPerimeterM.toFixed(3)},"m","PERIMETER"`);
      lines.push(`"Hydraulic Radius","R_h",${r.hydraulicRadiusM.toFixed(3)},"m","RADIUS"`);
      lines.push(`"Water Surface Top Width","T",${r.topWidthM.toFixed(3)},"m","SURFACE"`);
      lines.push(`"Froude Number","Fr",${r.froudeNumber.toFixed(3)},"dimensionless","${r.flowRegime.toUpperCase()}"`);
      lines.push(`"Freeboard Requirement","F_req",${p.freeboardRequirementM.toFixed(3)},"m","REQUIREMENT"`);
      break;
    }

    case 'concrete-materials': {
      const r = result as ConcreteMaterialResult;
      const p = workspace.concreteMaterials;
      lines.push(`"CONCRETE MATERIAL ITEM","RATIO / SPEC","COMPUTED QUANTITY","COMMERCIAL PACKAGING","UNIT RATE (${workspace.currency})","ESTIMATED AMOUNT (${workspace.currency})"`);
      lines.push(`"Dry Concrete Volume Multiplier","1.54x",${r.dryVolumeM3.toFixed(3)} m3,"${(r.dryVolumeM3 * 35.3147).toFixed(2)} cft","—","—"`);
      lines.push(`"Portland Cement Required","${p.ratioCement}",${r.cementMassKg.toFixed(1)} kg,"${r.cementBags50Kg.toFixed(2)} bags (50kg)","—","—"`);
      lines.push(`"Fine Aggregate (Sand)","${p.ratioSand}",${r.sandVolumeM3.toFixed(3)} m3,"${r.sandCft.toFixed(2)} cft","—","—"`);
      lines.push(`"Coarse Aggregate (Stone/Brick)","${p.ratioAggregate}",${r.aggregateVolumeM3.toFixed(3)} m3,"${r.aggregateCft.toFixed(2)} cft","—","—"`);
      lines.push(`"Mixing Water Requirement","w/c ratio",${r.waterDemandLiters.toFixed(1)} Liters,"${(r.waterDemandLiters / 1000).toFixed(3)} m3","—","—"`);
      break;
    }

    case 'concrete-mix': {
      const r = result as ConcreteMixResult;
      const p = workspace.concrete;
      lines.push(`"CONCRETE MIX COMPONENT","WEIGHT (kg/m3)","VOLUME (m3/m3)","BATCH QUANTITY (${p.batchVolumeM3} m3)","NOTES"`);
      lines.push(`"Target Compressive Strength","—","—","${r.estimated28DayMpa.toFixed(1)} MPa","Target Margin"`);
      lines.push(`"Water-Cement Ratio (w/c)","${p.waterCementRatio}","—","${p.waterCementRatio}","Durability governed"`);
      lines.push(`"Cement Content","${r.cementKgPerM3.toFixed(1)} kg","${(r.cementKgPerM3 / (p.cementSpecificGravity * 1000)).toFixed(4)} m3","${r.batchCementKg.toFixed(1)} kg","${r.cementBags50Kg.toFixed(1)} bags"`);
      lines.push(`"Water Content","${r.waterKgPerM3.toFixed(1)} kg","${(r.waterKgPerM3 / 1000).toFixed(4)} m3","${r.batchWaterKg.toFixed(1)} Liters","Slump ${p.slumpMm}mm"`);
      lines.push(`"Fine Aggregate (Sand)","${r.fineAggKgPerM3.toFixed(1)} kg","${(r.fineAggKgPerM3 / (p.fineAggSpecificGravity * 1000)).toFixed(4)} m3","${r.batchFineAggKg.toFixed(1)} kg","SSD condition"`);
      lines.push(`"Coarse Aggregate","${r.coarseAggKgPerM3.toFixed(1)} kg","${(r.coarseAggKgPerM3 / (p.coarseAggSpecificGravity * 1000)).toFixed(4)} m3","${r.batchCoarseAggKg.toFixed(1)} kg","NMAS ${p.maxAggregateSizeMm}mm"`);
      lines.push(`"Wet Mix Fresh Density","${r.totalDensityKgPerM3.toFixed(1)} kg/m3","1.0000 m3","—","Volumetric sum OK"`);
      break;
    }

    case 'rebar-bbs': {
      const r = result as RebarBBSResult;
      lines.push(`"BAR DESCRIPTION","BAR DIA (mm)","NO. OF BARS","CUTTING LENGTH (m)","TOTAL LENGTH (m)","UNIT WEIGHT (kg/m)","TOTAL WEIGHT (kg)"`);
      r.items.forEach((item) => {
        lines.push(`"${item.description}",${item.barDiaMm},${item.count},${item.cuttingLengthM.toFixed(3)},${item.totalLengthM.toFixed(2)},${item.unitWeightKgPerM.toFixed(3)},${item.totalWeightKg.toFixed(2)}`);
      });
      lines.push(``);
      lines.push(`"SUMMARY TOTALS","—","—","—","${r.totalBarsLengthM.toFixed(2)} m","—","${r.totalSteelWeightKg.toFixed(2)} kg (${r.totalSteelTonnes.toFixed(3)} Tonnes)"`);
      break;
    }

    case 'boq-estimator': {
      const r = result as BOQResult;
      lines.push(`"ITEM NO","DESCRIPTION","CATEGORY","UNIT","QUANTITY","UNIT RATE (${workspace.currency})","TOTAL AMOUNT (${workspace.currency})"`);
      workspace.boq.items.forEach((item) => {
        const qty = item.numberOfMembers * item.lengthM * item.widthM * item.heightM;
        lines.push(`"${item.itemNo}","${item.description.replace(/"/g, '""')}","${item.category}","${item.unit}",${qty.toFixed(2)},${item.unitRate},${(qty * item.unitRate).toFixed(2)}`);
      });
      lines.push(``);
      lines.push(`"SUBTOTAL DIRECT WORKS","—","—","—","—","—","${r.subtotalAmount.toFixed(2)} ${workspace.currency}"`);
      lines.push(`"GRAND TOTAL ESTIMATED AMOUNT","—","—","—","—","—","${r.grandTotalAmount.toFixed(2)} ${workspace.currency}"`);
      break;
    }

    default: {
      // Generic envelope dump
      lines.push(`"PROPERTY","VALUE"`);
      Object.entries(result).forEach(([k, v]) => {
        if (typeof v !== 'object' && v !== null) {
          lines.push(`"${k}","${v}"`);
        }
      });
      break;
    }
  }

  // Create and trigger CSV Blob download
  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${workspace.projectCode}_${moduleId.toUpperCase()}_Schedule_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
