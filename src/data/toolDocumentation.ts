import { ToolRegistryEntry, TOOL_REGISTRY_MAP } from './toolRegistry';

export interface GoverningEquation {
  name: string;
  formula: string;
  description: string;
  variables?: string[];
}

export interface StepByStepUsage {
  step: number;
  title: string;
  instruction: string;
  tip?: string;
}

export interface ToolDocumentation {
  id: string;
  title: string;
  shortLabel: string;
  discipline: string;
  standardUsed: string;
  overview: string;
  capabilities: string[];
  howItWorks: {
    methodology: string;
    governingEquations: GoverningEquation[];
    codeStandards: string[];
    assumptions: string[];
  };
  stepByStepUsage: StepByStepUsage[];
  proTipsAndBestPractices: string[];
  limitationsAndNotes: string[];
}

/**
 * Authoritative Centralized Registry of Civil Engineering & Architectural Tool Documentation
 */
export const TOOL_DOCUMENTATION: Record<string, ToolDocumentation> = {
  // =========================================================================
  // 1. RC BEAM ANALYSIS & FLEXURE (STR-01)
  // =========================================================================
  'beam-analysis': {
    id: 'beam-analysis',
    title: 'RC Beam Flexure, Shear & Deflection Solver',
    shortLabel: 'RC Beam Analysis',
    discipline: 'Structural Engineering',
    standardUsed: 'ACI 318-19 / BNBC 2020 / IS 456:2000',
    overview:
      'The Reinforced Concrete Beam Analysis Solver evaluates determinate flexural members subjected to distributed line loads and concentrated point loads. In civil structural design, beam analysis forms the core of load-path verification, allowing engineers to size rectangular cross-sections, calculate governing bending moments (M_max) and shear forces (V_max), determine extreme fiber bending stresses (f_b), and verify that service load deflections do not crack architectural partitions or cause structural distress.',
    capabilities: [
      'Solves maximum bending moment (M_max in kN·m) and shear force (V_max in kN) under combined UDL and point load',
      'Computes rectangular cross-section moment of inertia (I = b·h³/12) and section modulus (S = b·h²/6)',
      'Calculates extreme tensile/compressive bending stress (f_b = M·y / I) and compares against code allowable limit',
      'Calculates immediate elastic deflection under combined loading using superposition of standard elastic beam formulations',
      'Evaluates code-compliant allowable deflection criteria (L/360 for live-load floor serviceability and L/240 for total load)',
      'Computes real-time Demand-Capacity Ratio (DCR) for both bending stress and service deflection',
      'Generates interactive vector bending moment (BMD) and shear force (SFD) diagrams with inflection point markers',
    ],
    howItWorks: {
      methodology:
        'The calculation engine implements classical Euler-Bernoulli beam theory combined with Limit States and Working Stress (WSD/ASD) boundary checks. Reaction forces at supports are solved through static equilibrium equations (ΣFy = 0, ΣM = 0). Maximum bending moments and shear stresses are computed along the span, while maximum mid-span deflection is calculated via the Principle of Superposition combining distributed load deflection with point load deflection.',
      governingEquations: [
        {
          name: 'Maximum Bending Moment (Simply Supported UDL + Center Point Load)',
          formula: 'M_max = (w · L² / 8) + (P · L / 4)',
          description: 'Combines parabolic distributed load moment with triangular concentrated point load moment.',
          variables: ['w = Uniform load (kN/m)', 'L = Clear or effective span (m)', 'P = Concentrated point load (kN)'],
        },
        {
          name: 'Maximum Elastic Deflection (Superposition)',
          formula: 'Δ_max = (5 · w · L⁴) / (384 · E · I) + (P · L³) / (48 · E · I)',
          description: 'Calculates the center-line maximum elastic deflection assuming homogeneous gross concrete section.',
          variables: ['E = Modulus of elasticity of concrete (GPa)', 'I = Second moment of area (m⁴)'],
        },
        {
          name: 'Flexural Bending Stress',
          formula: 'f_b = (M_max · y) / I = (6 · M_max) / (b · h²)',
          description: 'Calculates the extreme fiber tensile/compressive normal stress across rectangular depth h.',
          variables: ['b = Beam width (mm)', 'h = Beam overall depth (mm)', 'y = Distance from neutral axis = h / 2'],
        },
        {
          name: 'Concrete Modulus of Elasticity (ACI 318 / BNBC)',
          formula: 'E_c = 4700 · √(f\'c) MPa',
          description: 'Standard empirical relationship for normal-weight structural concrete modulus.',
          variables: ['f\'c = Specified concrete 28-day cylinder compressive strength (MPa)'],
        },
      ],
      codeStandards: ['ACI 318-19 Section 24.2 (Deflection Limits)', 'BNBC 2020 Part 6 Chapter 6', 'IS 456:2000 Clause 23.2'],
      assumptions: [
        'Plane sections remain plane before and after bending (Bernoulli-Euler hypothesis)',
        'Deflections are small compared to the member depth and span length',
        'Gross uncracked concrete cross-section is evaluated for initial serviceability check',
        'Material behaves linearly elastic within allowable stress thresholds',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Select Support Condition',
        instruction: 'Choose between Simply-Supported (pin-roller) or Cantilever boundary configurations depending on your architectural framing.',
        tip: 'For continuous spans over multiple columns, use the STR-02 Continuous Beam FEM Solver instead.',
      },
      {
        step: 2,
        title: 'Define Beam Geometry',
        instruction: 'Enter Span Length L (meters), Width b (mm), and Depth h (mm). Use the integrated unit dropdowns if working in inches or feet.',
        tip: 'Typical span-to-depth ratio for simply supported RC beams ranges from L/12 to L/16.',
      },
      {
        step: 3,
        title: 'Specify Applied Gravity Loads',
        instruction: 'Input the combined Uniform Distributed Load w (kN/m), which includes self-weight, masonry wall dead load, and live load, plus any concentrated Point Load P (kN).',
      },
      {
        step: 4,
        title: 'Set Material Properties & Allowable Limits',
        instruction: 'Enter the Concrete Modulus of Elasticity E (default 25.0 GPa for normal C25/30 mix) and Allowable Bending Stress (default 12.0 MPa).',
      },
      {
        step: 5,
        title: 'Inspect DCR & Diagram Results',
        instruction: 'Examine the Capacity Utilization DCR gauge. If DCR > 100%, increase section depth h or width b until the status turns nominal (green).',
      },
    ],
    proTipsAndBestPractices: [
      'Self-Weight Allowance: Do not forget that reinforced concrete weighs 24 to 25 kN/m³ (150 lb/ft³). For a 300mm × 600mm beam, self-weight alone is 0.3 × 0.6 × 25 = 4.5 kN/m.',
      'Deflection Multiplier: Long-term creep and shrinkage will increase sustained load deflections by 1.5× to 2.0×. Always ensure immediate live-load deflection remains comfortably below L/360.',
      'Width-to-Depth Ratio: Maintain b/h between 0.4 and 0.6 for efficient flexural steel placement without excessive lateral-torsional instability.',
      'Direct Sync: Click "Transfer Beam to Rebar BBS" to automatically pass this span length and cross-section into the BBS detailing generator without manual re-entry.',
    ],
    limitationsAndNotes: [
      'Evaluates gross linear elastic section response. For detailed reinforcement layout (top/bottom bar count, stirrup spacing, crack width), use the companion Rebar BBS module.',
      'Does not account for axial prestressing forces or high-torsion eccentric loads.',
    ],
  },

  // =========================================================================
  // 2. CONTINUOUS BEAM FEM SOLVER (STR-02)
  // =========================================================================
  'continuous-beam': {
    id: 'continuous-beam',
    title: 'Continuous Beam Multi-Span FEM Solver',
    shortLabel: 'Continuous Beam',
    discipline: 'Structural Engineering',
    standardUsed: 'Direct Stiffness Method / Matrix Structural Analysis / ACI 318',
    overview:
      'The Continuous Beam FEM Solver utilizes the Direct Stiffness Method to solve statically indeterminate multi-span beam systems. Unlike single-span beams, continuous beams develop negative (hogging) bending moments over intermediate column supports and reduced positive (sagging) moments at mid-spans. This structural continuity provides significant economy, reduces deflection, and reflects actual monolithic cast-in-situ reinforced concrete and steel building frames.',
    capabilities: [
      'Assembles global structural stiffness matrix [K] from 1D beam flexural element matrices [k_e]',
      'Solves rotational degrees of freedom (rotational displacements θ) at intermediate supports using Gaussian matrix reduction',
      'Calculates support reactions, fixed-end moments (FEM), and intermediate support hogging moments',
      'Computes mid-span sagging moments and maximum shear force envelopes across each individual span',
      'Enables non-uniform span lengths, varying distributed loads per span, and flexible boundary restraints',
      'Calculates max sagging vs hogging moment ratio for redistribution and structural efficiency review',
    ],
    howItWorks: {
      methodology:
        'Each span is modeled as a 2-node prismatic beam element with 2 degrees of freedom per node (vertical displacement v and rotation θ). Element stiffness matrices are assembled into a global equilibrium system [K]{D} = {F} - {F_fixed}. Boundary conditions (pinned, roller, fixed) are enforced by partitioning, and internal shear forces V(x) and moments M(x) are evaluated through Hermite cubic shape functions.',
      governingEquations: [
        {
          name: 'Beam Element Flexural Stiffness Matrix',
          formula: '[k_e] = (E · I / L³) · [ 12, 6L, -12, 6L ; 6L, 4L², -6L, 2L² ; -12, -6L, 12, -6L ; 6L, 2L², -6L, 4L² ]',
          description: 'Standard Hermitian 4×4 bending element stiffness matrix connecting nodal shears and moments.',
        },
        {
          name: 'Fixed End Moments for Uniform Load',
          formula: 'FEM_left = - (w · L²) / 12,   FEM_right = + (w · L²) / 12',
          description: 'Clamped-end reaction moments caused by uniform distributed load w across span L.',
        },
        {
          name: 'Three-Moment Equation (Clapeyron Theorem Check)',
          formula: 'M_1·L_1 + 2·M_2·(L_1 + L_2) + M_3·L_2 = - (w_1·L_1³ / 4) - (w_2·L_2³ / 4)',
          description: 'Classical continuity equation used to cross-verify intermediate support moment M_2.',
        },
      ],
      codeStandards: ['Direct Stiffness Method (DSM)', 'ACI 318-19 Chapter 6 (Structural Analysis)', 'BNBC 2020 Part 6 Chapter 1'],
      assumptions: [
        'Supports are non-yielding (zero differential settlement) unless settlement values are explicitly prescribed',
        'Flexural rigidity EI is uniform along each span',
        'Axial deformations and shear deformations are secondary and neglected (Euler-Bernoulli frame assumptions)',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Configure Spans & Lengths',
        instruction: 'Define the number of continuous spans (typically 2 to 4) and enter the clear span length for Span 1, Span 2, and Span 3 in meters.',
      },
      {
        step: 2,
        title: 'Assign Loading per Span',
        instruction: 'Input the specific dead + live line load w (kN/m) for each span. You can simulate alternate span live loading to identify maximum moment envelopes.',
      },
      {
        step: 3,
        title: 'Define Cross-Section Geometry',
        instruction: 'Set the beam section width b and overall depth h in millimeters along with the concrete grade.',
      },
      {
        step: 4,
        title: 'Analyze Support Reactions & Moments',
        instruction: 'Review the intermediate support negative moments and mid-span positive moments to determine required top and bottom reinforcement.',
      },
    ],
    proTipsAndBestPractices: [
      'Moment Redistribution: Modern codes (ACI 318 / BNBC) permit up to 20% redistribution of negative moments over supports to mid-spans, provided tensile steel strain ε_t ≥ 0.0075.',
      'Hogging Steel Congestion: Support negative moments are usually much higher than positive mid-span moments. Watch out for rebar crowding over column-beam joints.',
      'Deflection Reduction: Continuity reduces mid-span deflection to approximately 1/5th of an equivalent simply supported span, saving significant concrete depth.',
    ],
    limitationsAndNotes: [
      'Assumes prismatic members. Tapered or haunched continuous beams require step-wise segment discretization.',
    ],
  },

  // =========================================================================
  // 3. REBAR BBS & REINFORCEMENT (STR-03)
  // =========================================================================
  'rebar-bbs': {
    id: 'rebar-bbs',
    title: 'Structural RCC & Bar Bending Schedule (BBS) Engine',
    shortLabel: 'Rebar BBS Schedule',
    discipline: 'Structural Detailing',
    standardUsed: 'BS 8666:2020 / SP 34 / BNBC 2020 / ACI 318',
    overview:
      'The Bar Bending Schedule (BBS) Engine computes the precise cutting length, bend deductions, unit mass, and total procurement tonnage for reinforced concrete structural elements including footings, columns, beams, and slabs. An accurate BBS is indispensable on the construction site to minimize steel wastage, eliminate fabrication delays, and ensure code compliance with hook angles, development lengths, and seismic tie geometry.',
    capabilities: [
      'Calculates exact cutting lengths using standard bend deductions (1d for 45°, 2d for 90°, 3d for 135°, and 4d for 180° hooks)',
      'Computes rebar unit mass from nominal bar diameter using standard unit weight formulation (w = d² / 162.2 kg/m)',
      'Dimensions standard closed stirrups with 135° seismic cross-ties and development hooks',
      'Calculates class B tension lap splice length (40d to 50d) based on bar diameter and concrete compressive strength',
      'Generates itemized bar schedules categorized by bar mark, diameter (8mm to 32mm), shape code, and count',
      'Summarizes total rebar demand in Kilograms (kg) and Metric Tonnes with selectable wastage allowances (2% to 5%)',
      'Offers 1-click synchronization into the master Project BOQ under Substructure or Superstructure WBS sections',
    ],
    howItWorks: {
      methodology:
        'Reinforcement detailing follows ISO/BS 8666 standards where centerline cutting lengths are computed by summing segment lengths and subtracting elongation deductions at corners. Stirrup cutting lengths account for clear cover on all 4 faces, 90-degree corner bends, and two 135-degree seismic hooks (minimum 10d or 75mm). Total weight is derived by multiplying total cutting length by standard linear density.',
      governingEquations: [
        {
          name: 'Rebar Unit Mass Formulation',
          formula: 'w_rebar = (π · d² / 4) · ρ_steel / 1000 = d² / 162.198 kg/m',
          description: 'Nominal linear mass of round carbon steel rebar based on steel density ρ = 7850 kg/m³.',
          variables: ['d = Nominal bar diameter (mm)', 'w_rebar = Unit weight (kg per linear meter)'],
        },
        {
          name: 'Closed Rectangular Stirrup Cutting Length',
          formula: 'L_stirrup = 2·(b_c + d_c) + 2·(Hook_135) - 3·(2d) - 2·(3d)',
          description: 'Total cut length considering clear concrete cover deductions and bend elongations.',
          variables: ['b_c = Core width (b - 2·cover)', 'd_c = Core depth (h - 2·cover)', 'Hook_135 = max(10d, 75mm)'],
        },
        {
          name: 'Tension Lap Splice Length (Class B)',
          formula: 'L_d = 1.3 · (f_y / (1.1 · √(f\'c))) · (α · β · γ · λ / ((c + K_tr) / d_b)) · d_b',
          description: 'ACI 318 tension development length simplification yielding approximately 40d to 50d for standard deformed bars.',
          variables: ['f_y = Yield strength of rebar (e.g. 420 or 500 MPa)', 'f\'c = Concrete cylinder strength (MPa)'],
        },
      ],
      codeStandards: ['BS 8666:2020 (Scheduling, dimensioning, bending of steel rebar)', 'BNBC 2020 Chapter 8', 'ACI 318-19 Chapter 25'],
      assumptions: [
        'Deformed high-strength rebar conforming to ASTM A615 / BDS 1313 (Grade 400 or Grade 500)',
        'Standard clear cover of 40mm for beams, 50mm for footings, and 25mm for slabs',
        'Bend radii adhere to minimum mandrel diameters specified by code',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Select Structural Element',
        instruction: 'Choose the structural component to detail: Beam, Column, Isolated Footing, or Slab.',
      },
      {
        step: 2,
        title: 'Input Element Cross-Section & Cover',
        instruction: 'Enter element length, width, depth, and clear concrete cover (e.g. 40mm for interior beams, 50mm for underground foundations).',
      },
      {
        step: 3,
        title: 'Define Longitudinal & Transverse Bars',
        instruction: 'Specify the bar diameter (e.g. 16mm or 20mm for main tension rebar; 8mm or 10mm for stirrups) and stirrup pitch/spacing (e.g. 125mm c/c).',
      },
      {
        step: 4,
        title: 'Review Cutting Schedule & Tonnage',
        instruction: 'Check the bar schedule table. The engine automatically outputs individual cut lengths, number of bars, and total tonnage in metric tonnes.',
      },
      {
        step: 5,
        title: 'Export Schedule or Sync to BOQ',
        instruction: 'Click "Export Excel (CSV)" to generate a fabrication schedule for steel benders, or "Transfer BBS to BOQ" to link the tonnage into cost estimation.',
      },
    ],
    proTipsAndBestPractices: [
      'Standard Commercial Stock Length: Remember that commercial rebar is sold in standard 12.0-meter (40-foot) lengths. Plan your cutting lengths to minimize end-offcut wastage.',
      'Seismic Hooks: Always specify 135° hooks with at least 10d or 75mm tail extension for column ties and beam stirrups in earthquake-prone zones (Zones 2, 3, 4).',
      'Weight Variance Tolerance: Mill rolling tolerances can vary rebar mass by ±4% to ±6%. Keep a 3% to 5% safety margin on site procurement orders.',
      'Staggered Splices: Never lap all longitudinal bars at the same cross-section. Stagger splices by at least 1.3× development length.',
    ],
    limitationsAndNotes: [
      'Provides schedule for standard geometric bar shapes. Complex curved shell structures or spiral pile cages should be checked against detailed fabricator shop drawings.',
    ],
  },

  // =========================================================================
  // 4. BEARING CAPACITY OF SHALLOW FOUNDATIONS (GEO-01)
  // =========================================================================
  'bearing-capacity': {
    id: 'bearing-capacity',
    title: 'Shallow Footing Bearing Capacity & Geotechnical Settlement',
    shortLabel: 'Bearing Capacity',
    discipline: 'Geotechnical Engineering',
    standardUsed: 'Terzaghi / Meyerhof General Bearing Capacity / BNBC 2020',
    overview:
      'The Shallow Foundation Bearing Capacity Solver calculates the ultimate (q_u) and allowable safe (q_all) bearing capacity of shallow footings across strip, square, circular, and rectangular geometries. In geotechnical practice, foundation failure can lead to catastrophic building collapse or excessive differential settlement. This module incorporates Terzaghi and Meyerhof bearing capacity factors (Nc, Nq, Nγ) alongside depth, shape, and water table correction factors.',
    capabilities: [
      'Evaluates ultimate bearing capacity q_u and safe allowable pressure q_all in kiloPascals (kPa / kN/m²)',
      'Calculates bearing capacity factors (Nc, Nq, Nγ) as continuous functions of soil internal friction angle (φ)',
      'Supports cohesive clays (c > 0, φ = 0), cohesionless sands (c = 0, φ > 0), and mixed c-φ soils',
      'Applies shape correction factors (s_c, s_q, s_γ) for isolated square, rectangular, strip, and circular pads',
      'Computes applied contact pressure (q_app = P / A) and verifies factor of safety (FS = q_u / q_app)',
      'Generates interactive Demand-to-Capacity Ratio (DCR) gauge and interactive foundation pressure bulb diagram',
      'Directly links footing dimensions and embedment depth into the Rebar BBS and Pit Excavation modules',
    ],
    howItWorks: {
      methodology:
        'The calculation engine uses Terzaghi’s classical superposition formulation expanded with Meyerhof and Vesic shape and depth factors. Soil shear failure modes (general shear vs local/punching shear) are assessed based on relative density and cohesion. The safe allowable bearing capacity is obtained by dividing net ultimate bearing capacity by the required factor of safety (typically 2.5 to 3.0).',
      governingEquations: [
        {
          name: 'General Bearing Capacity Formulation (Terzaghi / Meyerhof)',
          formula: 'q_ult = c · N_c · s_c · d_c + q_0 · N_q · s_q · d_q + 0.5 · γ · B · N_γ · s_γ · d_γ',
          description: 'Three-term formulation accounting for cohesion, surcharge embedment, and footing self-weight wedge.',
          variables: ['c = Cohesion (kPa)', 'q_0 = Surcharge = γ · D_f (kPa)', 'B = Footing width (m)', 'γ = Soil unit weight (kN/m³)'],
        },
        {
          name: 'Bearing Capacity Factors (Prandtl & Reissner)',
          formula: 'N_q = e^(π · tan φ) · tan²(45° + φ/2),   N_c = (N_q - 1) / tan φ,   N_γ = 2 · (N_q + 1) · tan φ',
          description: 'Theoretical factors defining the failure geometry of the logarithmic spiral shear zone.',
          variables: ['φ = Effective internal angle of friction (degrees)'],
        },
        {
          name: 'Allowable Safe Bearing Pressure',
          formula: 'q_all = (q_ult - γ · D_f) / FS + γ · D_f   ≈   q_ult / FS',
          description: 'Applies factor of safety (FS typically 2.5 to 3.0) against shear failure.',
          variables: ['FS = Factor of Safety against shear failure (default 3.0)'],
        },
      ],
      codeStandards: ['BNBC 2020 Part 6 Chapter 3', 'IS 6403:1981', 'ASTM D1194 / Bowles Foundation Analysis'],
      assumptions: [
        'Rigid footing resting on a semi-infinite, homogeneous soil stratum',
        'Shear failure develops under general shear conditions without immediate structural punching',
        'Groundwater table is assumed below the influence zone (1.5B beneath footing base) unless adjusted',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Specify Footing Geometry',
        instruction: 'Choose footing shape (Square, Rectangular, Strip) and enter Footing Width B (m), Length L (m), and Embedment Depth D_f (m).',
        tip: 'Minimum depth of foundation for frost and scour protection is typically 1.0m to 1.5m below natural ground.',
      },
      {
        step: 2,
        title: 'Input Soil Parameters from Geotechnical Report',
        instruction: 'Enter Soil Cohesion c (kPa), Internal Friction Angle φ (degrees), and Moist Unit Weight γ (kN/m³).',
        tip: 'For soft to medium clays, set φ = 0 and enter undrained shear strength c_u. For clean sand, set c = 0 and enter φ = 30° to 36°.',
      },
      {
        step: 3,
        title: 'Enter Applied Column Service Load',
        instruction: 'Input the total unfactored vertical column dead + live load P (kN) transferred to the footing.',
      },
      {
        step: 4,
        title: 'Verify Factor of Safety & Utilization',
        instruction: 'Review the effective Factor of Safety. If FS < 2.5 or DCR > 100%, increase footing width B or embedment depth D_f until satisfactory.',
      },
    ],
    proTipsAndBestPractices: [
      'Water Table Penalty: If the seasonal groundwater table rises to or above the footing base, the effective unit weight γ\' in the third term is halved (γ_sub = γ_sat - 9.81 ≈ 8 to 10 kN/m³), which can reduce bearing capacity by 30% to 50%!',
      'Local vs General Shear: For loose sands (φ < 28°) or soft clays, reduce soil parameters to c\' = 2/3 c and tan(φ\') = 2/3 tan(φ) to account for punching shear.',
      'Settlement Governance: For footings wider than 2.0m on sand, settlement (typically 25mm maximum allowable for isolated footings) almost always governs over shear failure.',
    ],
    limitationsAndNotes: [
      'Applies to isolated shallow footings. For closely spaced pads where pressure bulbs overlap by more than 20%, consider mat/raft foundation analysis.',
    ],
  },

  // =========================================================================
  // 5. PILE CAPACITY (GEO-02)
  // =========================================================================
  'pile-capacity': {
    id: 'pile-capacity',
    title: 'Deep Foundation Driven & Bored Cast-in-Situ Pile Capacity',
    shortLabel: 'Pile Capacity',
    discipline: 'Geotechnical Engineering',
    standardUsed: 'Meyerhof SPT / Alpha Method / BNBC 2020 / FHWA',
    overview:
      'The Deep Foundation Pile Capacity Solver evaluates the ultimate and safe axial compression resistance of bored cast-in-situ and driven piles through multi-layered soil profiles. Deep foundations are critical when near-surface soil strata lack adequate bearing capacity or are prone to excessive settlement. This engine computes both shaft skin friction (Q_s) along the pile embedment and base end-bearing resistance (Q_b) at the pile tip.',
    capabilities: [
      'Calculates total ultimate axial capacity (Q_ult = Q_s + Q_b) and safe design load (Q_all = Q_ult / FS)',
      'Computes skin friction along individual soil layers using the Alpha Method for clay and Beta/SPT methods for sand',
      'Evaluates base end-bearing using Meyerhof limiting resistance criteria (q_b = 40 · N_spt · (L/D) ≤ 400 · N_spt kPa)',
      'Accounts for groundwater table elevation and effective overburden stress reduction',
      'Provides selectable safety factors (typically 2.0 for static load tested piles, 2.5 for calculated piles)',
      'Evaluates structural pile capacity based on concrete compressive cylinder strength f\'c',
    ],
    howItWorks: {
      methodology:
        'The pile shaft is discretized across each stratigraphical soil layer. In clayey layers, skin friction is derived via the adhesion factor α multiplied by undrained shear strength (f_s = α · c_u). In sandy strata, skin resistance correlates with SPT blow counts N (f_s ≈ 2 · N kPa). Base resistance is calculated using Meyerhof’s end-bearing formulation capped at code empirical limits to prevent overestimating capacity in dense sands.',
      governingEquations: [
        {
          name: 'Total Ultimate Axial Pile Capacity',
          formula: 'Q_ult = Q_s + Q_b = ∑ (f_si · A_si) + (q_b · A_b)',
          description: 'Sum of integrated shaft friction over embedded area plus concentrated base end resistance.',
          variables: ['f_si = Unit shaft friction in layer i (kPa)', 'A_si = Shaft surface area = π · D · L_i (m²)', 'q_b = Unit base resistance (kPa)', 'A_b = Pile tip area = π · D² / 4 (m²)'],
        },
        {
          name: 'Clay Shaft Adhesion (Alpha Method)',
          formula: 'f_s = α · c_u,   where α = 0.55 · (c_u / p_a)^(-0.38) ≤ 1.0',
          description: 'Calculates soil-to-concrete adhesion factor as a function of undrained shear strength c_u.',
          variables: ['α = Adhesion reduction coefficient', 'c_u = Undrained soil cohesion (kPa)'],
        },
        {
          name: 'Meyerhof SPT End Bearing in Sand',
          formula: 'q_b = 40 · N_spt · (L / D)  ≤  400 · N_spt (kPa)',
          description: 'Empirical base resistance correlated to standard penetration test blow count N at pile tip.',
          variables: ['N_spt = Average uncorrected/field SPT N-value within 3D above and 3D below pile tip', 'D = Pile diameter (m)'],
        },
      ],
      codeStandards: ['BNBC 2020 Part 6 Chapter 3', 'FHWA Deep Foundations GEC-012', 'IS 2911 Part 1'],
      assumptions: [
        'Single isolated pile behavior without group reduction interaction',
        'Bored pile base has been thoroughly cleaned of bentonite slurry sediments prior to concrete pouring',
        'Load is purely concentric axial compressive gravity load without high overturning moments',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Choose Pile Type & Dimensions',
        instruction: 'Select pile construction type (Bored Cast-in-Situ or Driven Precast) and enter Pile Diameter D (e.g. 0.6m) and Embedment Length L (e.g. 20m).',
      },
      {
        step: 2,
        title: 'Configure Soil Strata Profile',
        instruction: 'Define the thickness, soil type (clay or sand), cohesion c_u, friction angle φ, and SPT-N values for each continuous geological layer.',
      },
      {
        step: 3,
        title: 'Input Tip Bearing Properties',
        instruction: 'Specify the tip stratum soil parameters where the pile terminates to compute base resistance.',
      },
      {
        step: 4,
        title: 'Review Safe Working Capacity',
        instruction: 'Check the output safe allowable capacity Q_all (kN). Verify that column design load P ≤ Q_all.',
      },
    ],
    proTipsAndBestPractices: [
      'Negative Skin Friction (Downdrag): If the pile passes through newly placed uncompacted fill or consolidating soft clay, soil settles faster than the pile, creating downward drag that subtracts from capacity!',
      'Drilling Slurry Cleaning: Over 50% of end-bearing failure in bored piles occurs due to loose muck left at the bottom. Ensure tremie pipe air-lifting or reverse circulation before casting.',
      'Group Action: For pile caps with 3 or more piles spaced closer than 3.0× diameter, apply a group efficiency reduction factor (Converse-Labarre formula).',
    ],
    limitationsAndNotes: [
      'Does not calculate lateral resistance against horizontal wind/earthquake shear. For lateral load checks, run p-y curve analysis.',
    ],
  },

  // =========================================================================
  // 6. QUANTITY TAKEOFF & BOQ ESTIMATOR (BOQ-01)
  // =========================================================================
  'boq-estimator': {
    id: 'boq-estimator',
    title: 'Quantity Takeoff & Bill of Quantities (BOQ) Master Suite',
    shortLabel: 'BOQ Estimator',
    discipline: 'Quantity Surveying & Cost Engineering',
    standardUsed: 'Standard Method of Measurement (SMM7) / POMI / PWD Schedule',
    overview:
      'The BOQ Estimator Master Suite provides an itemized, hierarchical quantity takeoff and cost estimation environment for civil infrastructure and building construction. Accurate Bills of Quantities are fundamental to commercial tendering, contractor procurement, financial disbursement schedules, and cost reconciliation. This tool organizes line items according to standard Work Breakdown Structure (WBS) chapters, applies deductions and regional price multipliers, incorporates statutory taxes and contingencies, and produces certified tender documentation.',
    capabilities: [
      'Multi-chapter WBS hierarchy (Earthwork, Substructure, Superstructure, Rebar, Masonry, Finishing, MEP)',
      'Standard L × W × H dimensional measurement sheet with member multiplier and deduction quantities',
      'Real-time search filtering by item number and description with instantaneous filtered subtotal recalculation',
      'Dynamic Floating Summary Footer Row with real-time sum of filtered Total Amounts and direct cost share',
      'Multi-currency cost formatting supporting 10+ international currencies (BDT, USD, INR, EUR, GBP, AED, SAR, etc.)',
      'Automatic contractor markup engine (Contingency %, Contractor Overhead/Profit %, Statutory VAT/AIT %)',
      '1-Click Export of Official Form A (Grand Summary) & Form B (Priced Takeoff) to CSV and certified jsPDF documents with verification QR code',
    ],
    howItWorks: {
      methodology:
        'Line item quantities are calculated as Net Quantity = (Members · L · W · H) - Deductions. Billable quantities add material wastage factors (e.g. 2% for RCC, 5% for rebar). Total line item cost is Net Qty × Unit Rate. The Grand Total combines direct item totals with compound contractor profit/overhead and statutory taxes.',
      governingEquations: [
        {
          name: 'Dimensional Volume Takeoff',
          formula: 'V_net = (Nos · L · W · H) - Deduction_Qty',
          description: 'Basic quantity takeoff formulation for linear, superficial, and volumetric civil items.',
        },
        {
          name: 'Billable Quantity with Wastage',
          formula: 'Q_billable = V_net · (1 + Wastage_% / 100)',
          description: 'Adjusts physical in-situ volume for handling, cutting, and transportation site losses.',
        },
        {
          name: 'Grand Total Project Cost',
          formula: 'Cost_grand = Subtotal · (1 + Contingency_%) · (1 + Overhead_%) · (1 + VAT_%)',
          description: 'Compounded procurement equation reflecting true commercial contract price.',
        },
      ],
      codeStandards: ['POMI (Principles of Measurement International)', 'SMM7 / NRM2', 'CPWD / PWD Standard Specification'],
      assumptions: [
        'Deductions represent void openings (doors, windows, structural voids > 0.1 m²)',
        'Unit rates reflect current material and equipment rates of the designated regional schedule',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Select Regional Rate Library & District',
        instruction: 'Choose your governing cost library (e.g. PWD 2024 or LGED) and district to apply local inflation multipliers.',
      },
      {
        step: 2,
        title: 'Add Measurement Line Items',
        instruction: 'Enter Item Number, Description, WBS Category, Unit, Number of Members, Length, Width, Height, and Unit Rate.',
      },
      {
        step: 3,
        title: 'Use Real-Time Search & Category Filters',
        instruction: 'Filter the takeoff sheet by typing keywords (e.g. "RCC" or "rebar") or selecting WBS category buttons. Observe the floating footer row recalculate instantly.',
      },
      {
        step: 4,
        title: 'Adjust Contingency & Contractor Margins',
        instruction: 'Review the Grand Reconciliation Card to set your desired Contingency Reserve %, CP&OH %, and VAT %.',
      },
      {
        step: 5,
        title: 'Export Official Tender Submittal',
        instruction: 'Click "Export Takeoff PDF" to generate an authoritative client-ready A4 submittal report featuring ISO verification QR stamps and engineer signature lines.',
      },
    ],
    proTipsAndBestPractices: [
      'Standard Deductions Rule: Under IS 1200 / SMM7, masonry openings smaller than 0.1 m² (1 sq.ft) are not deducted, and no addition is made for jambs/sills.',
      'Contingency Buffer: Always maintain a minimum 3% to 5% contingency for unforeseen underground foundation variations.',
      'Real-Time Filter Check: Use the search bar above the table to quickly check the total expenditure dedicated to specific trades (e.g. searching "paint" or "plaster").',
    ],
    limitationsAndNotes: [
      'Rates must be verified against current localized tender bids prior to final contractual financial closing.',
    ],
  },

  // =========================================================================
  // 7. GRANULAR UNIT RATE ANALYSIS (BOQ-02)
  // =========================================================================
  'rate-analysis': {
    id: 'rate-analysis',
    title: 'Granular Unit Rate & Composite Cost Analysis',
    shortLabel: 'Rate Analysis',
    discipline: 'Cost Engineering',
    standardUsed: 'CPWD / PWD Schedule of Rates Analysis Method',
    overview:
      'The Granular Unit Rate Analysis module breaks down composite construction items into primary cost drivers: raw material consumption, skilled/unskilled labor man-hours, equipment hire, water charges, and contractor overhead/profit. This analytical breakdown is crucial for defending tender pricing, negotiating variation orders, and estimating unit rates in regions experiencing rapid material price fluctuations.',
    capabilities: [
      'Deconstructs 1 m³ composite concrete (1:1.5:3, 1:2:4), brick masonry, and plastering unit rates',
      'Calculates raw material demand with dry volume conversion factors (1.54 for concrete, 1.33 for mortar)',
      'Incorporates mason, helper, and vibrator/mixer equipment wage rates',
      'Calculates Prime Cost, Water Charges (1.5%), Contractor Profit (10% to 15%), and Regional Tools & Plants',
      'Provides instantaneous conversion between Rate per m³ and Rate per CFT',
      'Offers 1-click rate synchronization to transfer the derived unit rate directly to matching BOQ takeoff items',
    ],
    howItWorks: {
      methodology:
        'Standard analytical methodology aggregates Material Cost (cement, fine aggregate, coarse aggregate) based on nominal mix proportions. Labor output constants (standard day-work labor productivity per m³) are multiplied by prevailing daily wage rates. Surcharges for water (1.5%) and contractor profit/overhead (15%) are compounded onto prime cost.',
      governingEquations: [
        {
          name: 'Prime Cost Calculation',
          formula: 'Cost_prime = ∑ (Material_Qty · Rate_mat) + ∑ (Labor_Hours · Rate_labor) + Cost_equipment',
          description: 'Direct cost of production before applying overheads and statutory taxes.',
        },
        {
          name: 'Composite Unit Rate with Overhead',
          formula: 'Rate_composite = Cost_prime · (1 + Water_% / 100) · (1 + Profit_% / 100)',
          description: 'Contractor billable unit rate applied to quantity takeoff schedules.',
        },
        {
          name: 'Metric to Imperial Unit Rate Conversion',
          formula: 'Rate_per_CFT = Rate_per_m³ / 35.3147',
          description: 'Converts rate per cubic meter to rate per cubic foot.',
        },
      ],
      codeStandards: ['PWD Analysis of Rates', 'CPWD DAR (Delhi Analysis of Rates)', 'FIDIC Red Book Cost Principles'],
      assumptions: [
        'Labor productivity aligns with standard 8-hour workday output under normal jobsite conditions',
        'Material rates represent delivered costs at site including transportation and unloading',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Select Work Trade',
        instruction: 'Choose the work type to analyze: RCC Casting, 10-inch/5-inch Brickwork, or 12mm Wall Plastering.',
      },
      {
        step: 2,
        title: 'Review Material Market Rates',
        instruction: 'Update local cement price (per 50kg bag), sand price (per m³ or CFT), and stone chips/brick chips price.',
      },
      {
        step: 3,
        title: 'Set Labor Wage Rates',
        instruction: 'Input prevailing daily wages for head mason, skilled mason, and unskilled labor helpers.',
      },
      {
        step: 4,
        title: 'Apply Derived Rate to BOQ',
        instruction: 'Click "Apply Rate to Matching BOQ Items" to update all existing takeoff line items in your active project workspace.',
      },
    ],
    proTipsAndBestPractices: [
      'CFT Conversion Shortcut: In South Asian markets, materials are often purchased in CFT while BOQ items are measured in m³. Always remember 1 m³ = 35.315 CFT.',
      'Scaffolding & Tools: For high-rise building projects, remember that scaffolding and vertical material hoisting (winch/crane) adds 3% to 5% to labor prime cost.',
    ],
    limitationsAndNotes: [
      'Labor productivity can vary significantly with adverse weather conditions and difficult site access.',
    ],
  },

  // =========================================================================
  // 8. CONCRETE MIX DESIGN (MAT-01)
  // =========================================================================
  'concrete-mix': {
    id: 'concrete-mix',
    title: 'ACI 211.1 Volumetric Concrete Mix Design',
    shortLabel: 'Concrete Mix Design',
    discipline: 'Materials & Concrete Technology',
    standardUsed: 'ACI 211.1 / ASTM C143 / ASTM C39 / BNBC 2020',
    overview:
      'The ACI 211.1 Concrete Mix Design Engine proportions trial concrete mixtures to achieve specified 28-day target compressive strength (f\'cr), desired workability (slump), and durability requirements. Unlike arbitrary nominal volume batches (1:2:4), structural concrete requires rational absolute volume mix proportioning balancing water-cementitious ratio, coarse aggregate volume fraction, and fine aggregate yield.',
    capabilities: [
      'Calculates statistical target mean strength (f\'cr = f\'c + 1.34s or f\'c + 2.33s - 3.5 MPa) per ACI 318',
      'Determines required water-cement ratio (w/c) for target strength and environmental exposure conditions',
      'Selects mixing water demand based on target slump (25mm to 175mm) and nominal maximum aggregate size (NMAS)',
      'Calculates dry-rodded coarse aggregate mass using ACI Table 6.3.6 and aggregate fineness modulus',
      'Solves fine aggregate (sand) quantity using the Absolute Volume Law (1.0 m³ - air - water - cement - coarse aggregate)',
      'Provides moisture corrections for absorption and surface moisture on aggregates',
      'Generates trial batch weights for 1 m³ and custom mixer drum volumes with 1-click sync to Project BOQ',
    ],
    howItWorks: {
      methodology:
        'The engine applies the ACI 211.1 absolute volume method. First, the required target compressive strength f\'cr is established. Second, the maximum w/c ratio is chosen based on strength vs w/c curves. Third, water requirement is selected according to desired slump and maximum aggregate size. Coarse aggregate is computed from dry-rodded unit weight. Finally, sand volume is calculated by subtracting the absolute volumes of water, cement, air, and coarse aggregate from 1.0 m³.',
      governingEquations: [
        {
          name: 'Target Mean Compressive Strength',
          formula: 'f\'cr = f\'c + 1.34 · s   or   f\'cr = f\'c + 2.33 · s - 3.45 MPa',
          description: 'Statistical target strength ensuring less than 1-in-100 probability of low test results.',
          variables: ['f\'c = Specified 28-day compressive strength (MPa)', 's = Standard deviation of batch plant (default 3.5 to 5.0 MPa)'],
        },
        {
          name: 'Absolute Volume Law',
          formula: 'V_solid = Mass / (Specific_Gravity · ρ_water)',
          description: 'Calculates the volume occupied by solid particles of cement, sand, and stone in 1 m³.',
          variables: ['ρ_water = 1000 kg/m³', 'Specific Gravity of Cement ≈ 3.15', 'Specific Gravity of Aggregates ≈ 2.65'],
        },
        {
          name: 'Fine Aggregate Volume by Difference',
          formula: 'V_sand = 1.0 m³ - (V_water + V_cement + V_coarse_agg + V_entrapped_air)',
          description: 'Ensures exactly 1.0 m³ yield for the concrete mix batch without volume deficit or overrun.',
        },
      ],
      codeStandards: ['ACI 211.1-91 (Standard Practice for Selecting Proportions for Normal Concrete)', 'BNBC 2020 Part 6 Chapter 5', 'ASTM C143'],
      assumptions: [
        'Normal-weight structural concrete using Type I / Type II Portland cement',
        'Specific gravity of cement is 3.15; aggregates are in saturated surface-dry (SSD) state unless moisture adjusted',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Specify Design Compressive Strength',
        instruction: 'Enter the structural specified 28-day cylinder compressive strength f\'c (e.g. 25 MPa or 30 MPa).',
      },
      {
        step: 2,
        title: 'Choose Slump & Maximum Aggregate Size',
        instruction: 'Select target slump (e.g. 75mm-100mm for beams/columns) and aggregate size (19mm / 3/4" or 25mm / 1").',
      },
      {
        step: 3,
        title: 'Input Aggregate Physical Properties',
        instruction: 'Enter Sand Fineness Modulus (typically 2.6 to 2.8) and Coarse Aggregate Dry Rodded Unit Weight (typically 1600 kg/m³).',
      },
      {
        step: 4,
        title: 'Review 1 m³ Batch Weights',
        instruction: 'Check the output recipe: Cement (kg), Water (kg/liters), Fine Aggregate (kg), and Coarse Aggregate (kg).',
      },
    ],
    proTipsAndBestPractices: [
      'Water is the Enemy of Strength: Adding just 10 liters of extra water per m³ to make concrete flow easier can reduce compressive strength by 2 to 3 MPa and increase shrinkage cracking!',
      'Aggregate Moisture Compensation: In the field, wet sand contains 4% to 8% surface moisture. Always deduct surface water from mixing water and increase weighed sand accordingly.',
      'Trial Batches: A laboratory trial mix must always be cast and crushed at 7 and 28 days to validate the theoretical curve before mass batching.',
    ],
    limitationsAndNotes: [
      'For self-compacting concrete (SCC) or high-strength concrete (> 50 MPa), use specialized chemical admixtures and silica fume.',
    ],
  },

  // =========================================================================
  // 9. CONCRETE BULK MATERIALS & BAG ESTIMATOR (MAT-02)
  // =========================================================================
  'concrete-materials': {
    id: 'concrete-materials',
    title: 'Concrete Bulk Technology & Bag Estimator',
    shortLabel: 'Concrete Materials',
    discipline: 'Materials & Construction',
    standardUsed: 'Volumetric Method (1.54 Dry Volume Expansion Factor)',
    overview:
      'The Concrete Bulk Technology & Bag Estimator calculates the exact quantity of commercial 50kg cement bags, sand volume (in CFT and m³), and coarse aggregate volume needed for cast-in-place concrete members. Because dry loose granular materials shrink by approximately 35% when mixed with water to form dense wet concrete, engineers use the empirical 1.54 dry volume expansion factor to ensure sufficient material is ordered.',
    capabilities: [
      'Converts wet in-situ concrete volume (m³ or CFT) into dry batch volume using the 1.54 expansion factor',
      'Computes exact 50kg cement bags required based on nominal mix ratio (e.g. 1:1.5:3, 1:2:4, 1:3:6)',
      'Calculates sand (fine aggregate) and stone chips / crushed brick requirements in CFT and m³',
      'Calculates estimated mixing water demand in liters',
      'Provides commercial cost breakdown based on local unit rates per bag and per CFT',
      'Features 1-click transfer to sync materials to project BOQ line items',
    ],
    howItWorks: {
      methodology:
        'Wet concrete volume is multiplied by the 1.54 dry expansion factor to account for void filling and compaction. Sum of ratio parts (e.g. 1 + 2 + 4 = 7 for 1:2:4 concrete) is divided into the dry volume. Cement volume is converted into 50kg bags (where 1 bag of cement = 0.0347 m³ = 1.226 CFT). Sand and stone are converted into commercial CFT.',
      governingEquations: [
        {
          name: 'Dry Volume Expansion Formulation',
          formula: 'V_dry = V_wet · 1.54',
          description: 'Empirical dry loose material volume required to produce 1 m³ of dense compacted concrete.',
        },
        {
          name: 'Cement Bags Formula',
          formula: 'Bags_cement = (V_dry · (Parts_cement / Sum_parts)) / 0.03472 m³',
          description: 'Calculates the number of standard 50kg cement bags (density ≈ 1440 kg/m³).',
        },
        {
          name: 'Aggregate Volume in CFT',
          formula: 'CFT_agg = V_dry · (Parts_agg / Sum_parts) · 35.3147',
          description: 'Converts metric dry volume of sand and gravel into commercial cubic feet (CFT).',
        },
      ],
      codeStandards: ['Standard Engineering Volumetric Formulation', 'PWD Specification for Buildings'],
      assumptions: [
        'Standard 50 kg Portland cement bag volume = 1.25 CFT = 0.0347 m³',
        'Bulk density of Portland cement = 1440 kg/m³',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Input Wet Casting Volume',
        instruction: 'Enter total wet volume of concrete needed in cubic meters (m³) or cubic feet (CFT).',
      },
      {
        step: 2,
        title: 'Select Nominal Mix Ratio',
        instruction: 'Choose standard structural mix: 1:1.5:3 (M20/M25 for RCC columns/beams), 1:2:4 (M15 for slabs/footings), or 1:3:6 (lean concrete/blinding).',
      },
      {
        step: 3,
        title: 'Review Required Raw Materials',
        instruction: 'The tool immediately displays: 50kg Cement Bags, Sand (CFT & m³), and Stone/Brick Aggregate (CFT & m³).',
      },
    ],
    proTipsAndBestPractices: [
      'Wastage Factor: Always add 3% to 5% handling wastage on site for sand and aggregate due to ground spillage during shovel loading.',
      'Brick vs Stone Chips: If using crushed brick chips (khoa), note that brick absorbs more water. Soak bricks in water for at least 12 hours prior to crushing.',
    ],
    limitationsAndNotes: [
      'Intended for volumetric site mixing. For major RMC (ready-mix concrete) batching plants, use the ACI 211.1 weight-batching solver.',
    ],
  },

  // =========================================================================
  // 10. BRICKWORK, PLASTER & FINISHES (MAT-03)
  // =========================================================================
  'masonry-finishes': {
    id: 'masonry-finishes',
    title: 'Brick Masonry, Plaster & Wall Finishes Takeoff',
    shortLabel: 'Masonry & Plaster',
    discipline: 'Building Construction & Architecture',
    standardUsed: 'IS 2212 / BNBC 2020 Part 6 Chapter 7 / CPWD Specifications',
    overview:
      'The Brick Masonry and Plastering Takeoff module calculates the exact brick count, mortar volume, sand CFT, and cement bags required for exterior (250mm / 10-inch) and interior (125mm / 5-inch) masonry walls, as well as two-sided surface plastering and wall paint. In building construction, brickwork and finishing constitute over 20% of structural costs. This engine accurately accounts for modular brick dimensions, mortar joints (10mm-12mm), window/door opening deductions, and dry mortar shrinkage.',
    capabilities: [
      'Calculates modular brick count for 10" (250mm) load-bearing walls and 5" (125mm) partition walls',
      'Accounts for mortar joint thickness (default 12mm) and brick frog indentation filling',
      'Computes dry mortar demand with 1.33 dry volume expansion factor',
      'Calculates 2-sided wall plaster volume (12mm interior / 19mm exterior) with opening deductions',
      'Provides 50kg cement bag count and fine plastering sand volume (in CFT and m³)',
      'Calculates wall paint coverage area (in m² and sq.ft) with primer and 2-coat topcoat consumption',
    ],
    howItWorks: {
      methodology:
        'Gross wall volume is calculated from length, height, and wall thickness. Door and window openings are deducted to yield Net Wall Volume. Number of bricks is computed by dividing net wall volume by the nominal brick size (including mortar joint). Wet mortar volume is the difference between total wall volume and solid brick volume, which is then multiplied by the 1.33 dry expansion factor to derive cement and sand.',
      governingEquations: [
        {
          name: 'Nominal Brick Count Formula',
          formula: 'No_bricks = V_net_wall / (L_nominal · W_nominal · H_nominal)',
          description: 'Calculates brick units using nominal dimensions including 12mm mortar joints.',
          variables: ['Standard Modular Brick with Mortar: 250mm × 125mm × 75mm (or 10" × 5" × 3")'],
        },
        {
          name: 'Dry Mortar Volume for Masonry',
          formula: 'V_dry_mortar = (V_net_wall - (No_bricks · V_actual_brick)) · 1.33',
          description: 'Mortar void volume expanded by 1.33 to account for dry loose sand-cement voids.',
        },
        {
          name: 'Plaster Area Deduction Rule',
          formula: 'A_plaster_net = 2 · (L_wall · H_wall) - Deductions_openings',
          description: 'Two-face wall plaster calculation incorporating standard opening deduction rules.',
        },
      ],
      codeStandards: ['IS 2212:1991 (Code of Practice for Brickwork)', 'BNBC 2020 Part 6 Chapter 7', 'IS 1661 (Plastering)'],
      assumptions: [
        'Standard traditional modular brick dimension: 240mm × 115mm × 70mm (actual) or 250mm × 125mm × 75mm (nominal)',
        'Plaster thickness: 12mm for smooth interior concrete/brick face; 19mm for exterior weather coat',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Input Wall Dimensions',
        instruction: 'Enter Wall Length (m), Wall Height (m), and select Wall Thickness (250mm / 10" or 125mm / 5").',
      },
      {
        step: 2,
        title: 'Define Openings Deductions',
        instruction: 'Input the total area of doors, windows, and structural openings in square meters.',
      },
      {
        step: 3,
        title: 'Choose Mortar Mix Proportions',
        instruction: 'Select mortar ratio (1:4 for load-bearing walls / exterior plaster; 1:6 for interior partitions).',
      },
      {
        step: 4,
        title: 'Review Material Summary',
        instruction: 'The tool outputs: Total Bricks (nos), Cement Bags (nos), Plastering Sand (CFT), and Paint Coverage (m²).',
      },
    ],
    proTipsAndBestPractices: [
      'Frog Orientation: Bricks must always be laid with the frog (indentation) facing upward to ensure solid key mortar bonding.',
      'Curing Duration: Brick masonry and cement plaster must be kept continuously damp for at least 7 to 10 days to prevent shrinkage hairline cracking and debonding.',
      'Wastage Allowance: Always order 5% extra bricks to account for transport breakage and half-bat cuts at corners and jambs.',
    ],
    limitationsAndNotes: [
      'Does not calculate structural reinforced masonry lintels or seismic bond beams.',
    ],
  },

  // =========================================================================
  // 11. OPEN CHANNEL HYDRAULICS (HYD-01)
  // =========================================================================
  'open-channel': {
    id: 'open-channel',
    title: 'Open Channel Flow Hydraulics (Manning Solver)',
    shortLabel: 'Open Channel Flow',
    discipline: 'Hydraulic & Drainage Engineering',
    standardUsed: 'Manning Formulation / Chow Open-Channel Hydraulics / FHWA HDS-5',
    overview:
      'The Open Channel Flow Hydraulics Solver calculates flow velocity, discharge capacity (Q), hydraulic radius, and flow regime (Froude number) in open storm-water drains, irrigation canals, and culverts. Sizing channels to prevent both sediment siltation (low velocity) and soil erosion scouring (high velocity) is an essential civil engineering design task governed by Manning’s empirical roughness formulation.',
    capabilities: [
      'Solves uniform steady discharge capacity Q in m³/s (cumecs) and liters per second (L/s)',
      'Calculates mean flow velocity V (m/s) and compares against non-silting / non-scouring thresholds',
      'Computes flow cross-sectional area A, wetted perimeter P, and hydraulic radius R = A / P',
      'Evaluates Froude Number (Fr) and determines flow regime: Subcritical (Fr < 1), Critical (Fr = 1), or Supercritical (Fr > 1)',
      'Supports trapezoidal, rectangular, and triangular channel cross-sections with side slopes',
      'Provides standard Manning roughness coefficients n for concrete lining, brickwork, earthen ditches, and vegetated channels',
      'Computes normal depth y_n using iterative Newton-Raphson numerical convergence',
    ],
    howItWorks: {
      methodology:
        'The solver evaluates the classical Gauckler-Manning-Strickler equation for steady uniform gravity flow. Geometric parameters (wetted perimeter, flow area) are computed based on channel bottom width b, flow depth y, and side slope z (horizontal:vertical). Discharge is obtained from Q = A · V. The Froude number determines hydraulic wave propagation and whether hydraulic jumps may occur.',
      governingEquations: [
        {
          name: 'Manning Uniform Flow Formulation (Metric SI)',
          formula: 'V = (1 / n) · R^(2/3) · S^(1/2)',
          description: 'Calculates mean flow velocity as a function of roughness, hydraulic radius, and longitudinal slope.',
          variables: ['n = Manning roughness coefficient', 'R = Hydraulic radius = A / P (m)', 'S = Longitudinal channel bed slope (m/m)'],
        },
        {
          name: 'Discharge Capacity Equation',
          formula: 'Q = A · V = (1 / n) · A · R^(2/3) · S^(1/2)',
          description: 'Total volumetric gravity flow rate conveyed through the cross-section.',
        },
        {
          name: 'Froude Number Flow Regime',
          formula: 'Fr = V / √(g · D_h) = V / √(g · (A / T))',
          description: 'Ratio of inertial forces to gravitational forces governing wave propagation.',
          variables: ['g = Acceleration due to gravity = 9.81 m/s²', 'D_h = Hydraulic depth = Flow Area A / Top Width T'],
        },
      ],
      codeStandards: ['Chow Open-Channel Hydraulics', 'BNBC 2020 Part 8 Chapter 4 (Storm Drainage)', 'USGS / FHWA'],
      assumptions: [
        'Flow is steady, uniform, and fully turbulent with hydrostatic pressure distribution',
        'Channel bed slope S is small such that sin(θ) ≈ tan(θ) ≈ S',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Choose Channel Cross-Section',
        instruction: 'Select channel shape: Rectangular (z = 0 for roadside concrete drains) or Trapezoidal (z = 1.0 to 1.5 for earthen canals).',
      },
      {
        step: 2,
        title: 'Define Channel Geometry',
        instruction: 'Input Bottom Width b (m), Flow Depth y (m), and Channel Longitudinal Bed Slope S (e.g. 0.001 for 1 in 1000 slope).',
      },
      {
        step: 3,
        title: 'Select Manning Roughness Coefficient n',
        instruction: 'Choose channel lining material: Smooth concrete (n = 0.013), Plastered brick (n = 0.015), or Clean earthen channel (n = 0.025).',
      },
      {
        step: 4,
        title: 'Inspect Discharge & Velocity Regime',
        instruction: 'Review Discharge Q and Flow Velocity V. Verify that velocity is between 0.6 m/s (minimum self-cleansing) and 2.5 m/s (maximum scouring limit).',
      },
    ],
    proTipsAndBestPractices: [
      'Self-Cleansing Velocity: Always ensure flow velocity exceeds 0.6 to 0.75 m/s during peak runoff to prevent silt and sand accumulation at the drain bottom.',
      'Freeboard Allowance: Always provide a minimum vertical freeboard of 150mm to 300mm above the maximum calculated water level to prevent overtopping during cloudbursts.',
      'Supercritical Hazard: Avoid designs with Fr close to 1.0 (between 0.8 and 1.2) as the flow surface becomes unstable and wave action creates unpredictable spilling.',
    ],
    limitationsAndNotes: [
      'Applies to uniform prismatic channels. Rapidly varied flow (hydraulic jumps, weir flow) requires backwater curve analysis.',
    ],
  },

  // =========================================================================
  // 12. PIPE HYDRAULICS & NETWORKS (HYD-02)
  // =========================================================================
  'pipe-hydraulics': {
    id: 'pipe-hydraulics',
    title: 'Pressurized Pipe & Storm Conduits Hydraulic Solver',
    shortLabel: 'Pipe Hydraulics',
    discipline: 'Hydraulic & Water Resources',
    standardUsed: 'Hazen-Williams / Darcy-Weisbach Formulation / AWWA',
    overview:
      'The Pressurized Pipe Hydraulic Solver calculates friction head loss, pressure drop, flow velocity, and hydraulic gradient in pressurized water supply mains, distribution networks, and pumping conduits. Proper pipe sizing ensures adequate terminal delivery pressure at fixtures while avoiding excessive pumping energy costs and water hammer surges.',
    capabilities: [
      'Solves friction head loss h_f in meters of water column using the Hazen-Williams empirical formula',
      'Calculates flow velocity V (m/s) and warns against scour or excessive water-hammer speeds (> 2.5 m/s)',
      'Computes minor friction losses across fittings, bends, and control valves (h_m = K · V² / 2g)',
      'Calculates terminal residual pressure (kPa and psi) incorporating gravity elevation differentials (Δz)',
      'Evaluates Reynolds number (Re) and verifies turbulent vs laminar flow regime',
      'Supports standard piping materials (uPVC, HDPE, Ductile Iron, Galvanized Steel, Concrete) with C-factors',
    ],
    howItWorks: {
      methodology:
        'The solver evaluates the Hazen-Williams equation for water at ambient temperatures (5°C to 25°C). Friction slope S_f (head loss per meter of pipe) is multiplied by pipe length L. Minor losses through elbows, tees, and check valves are added via their loss coefficients K. Net terminal pressure combines initial pump head, friction losses, and elevation head.',
      governingEquations: [
        {
          name: 'Hazen-Williams Head Loss Formulation (Metric SI)',
          formula: 'h_f = 10.67 · L · Q^1.852 / (C^1.852 · D^4.87)',
          description: 'Standard empirical formulation for water conduit friction head loss.',
          variables: ['h_f = Head loss (m)', 'L = Pipe length (m)', 'Q = Flow rate (m³/s)', 'C = Hazen-Williams roughness factor', 'D = Internal pipe diameter (m)'],
        },
        {
          name: 'Continuity Flow Velocity',
          formula: 'V = 4 · Q / (π · D²)',
          description: 'Average cross-sectional flow velocity.',
          variables: ['V = Velocity (m/s)', 'D = Internal diameter (m)'],
        },
        {
          name: 'Terminal Residual Pressure',
          formula: 'P_terminal = P_inlet + (z_inlet - z_outlet) · ρ · g - (h_f + h_minor) · ρ · g',
          description: 'Calculates gauge pressure available at the pipe discharge end in kiloPascals.',
        },
      ],
      codeStandards: ['AWWA C900 / C905', 'BNBC 2020 Part 8 Chapter 5 (Water Supply)', 'ISO 1452 (PVC pipes)'],
      assumptions: [
        'Water flowing at ambient temperature with kinematic viscosity ν ≈ 1.0 × 10⁻⁶ m²/s',
        'Pipe is completely primed and flowing full under positive gauge pressure',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Select Pipe Material',
        instruction: 'Choose piping material: uPVC/HDPE (C = 150), New Ductile Iron (C = 130), or Galvanized Steel (C = 120).',
      },
      {
        step: 2,
        title: 'Input Conduit Geometry',
        instruction: 'Enter Pipe Internal Diameter D (mm) and Total Pipeline Length L (meters).',
      },
      {
        step: 3,
        title: 'Define Flow Rate & Elevations',
        instruction: 'Input Design Flow Rate Q (liters per second or m³/hr), Inlet Elevation, and Outlet Elevation in meters.',
      },
      {
        step: 4,
        title: 'Review Head Loss & Delivery Pressure',
        instruction: 'Check the output Velocity V, Total Head Loss h_f, and Terminal Pressure. Ensure velocity stays within 0.9 to 2.0 m/s.',
      },
    ],
    proTipsAndBestPractices: [
      'Economical Velocity: Sizing pipes for a design velocity of 1.0 to 1.5 m/s provides the best economic balance between pipe capital cost and lifetime pumping electricity.',
      'Water Hammer Risk: Velocities over 2.5 m/s drastically increase water hammer surge pressures when valves close rapidly. Install surge relief valves or air chambers.',
      'Aging Roughness: Remember that unlined metallic pipes corrode over 20 years; their C-factor drops from 130 to 90. Design using long-term deteriorated C-factors.',
    ],
    limitationsAndNotes: [
      'Hazen-Williams is calibrated specifically for water. For viscous liquids (oil, wastewater sludge), use the Darcy-Weisbach Colebrook-White equation.',
    ],
  },

  // =========================================================================
  // 13. ROADWAY EARTHWORK & CUT/FILL (EAR-01)
  // =========================================================================
  'earthwork-alignment': {
    id: 'earthwork-alignment',
    title: 'Roadway Alignment Cut/Fill Earthwork & Mass Haul',
    shortLabel: 'Earthwork Cut & Fill',
    discipline: 'Highway & Infrastructure Engineering',
    standardUsed: 'Prismoidal Formulation / Average End-Area Method',
    overview:
      'The Roadway Alignment Earthwork Solver calculates cut and fill cross-sectional areas and cumulative embankment volumes between longitudinal chainage stations. In highway, railway, and site grading projects, balancing earthwork cut against fill minimizes haul distances, borrowing costs, and spoil dumping fees. This module applies the Average End-Area formulation alongside Prismoidal curvature corrections for trapezoidal embankments.',
    capabilities: [
      'Calculates station-by-station cut and fill cross-sectional areas for trapezoidal road formations',
      'Computes interval and cumulative bulk volumes using the Average End-Area method',
      'Applies Prismoidal corrections to eliminate end-area overestimation on rapidly tapering terrain',
      'Accounts for soil swell (expansion upon excavation) and shrinkage/compaction factors',
      'Identifies the mass-haul balance point where cumulative cut matches fill requirements',
      'Features 1-click sync to pass total excavation volume directly to the Project BOQ Earthwork section',
    ],
    howItWorks: {
      methodology:
        'At each cross-section station, the cut or fill area is calculated from formation width B, depth of cut/fill d, and side slope z (e.g. 1.5:1 for fill embankments; 1:1 for cuts). Interval volumes between successive chainages (distance L) are computed via V = (A_1 + A_2) · L / 2. Soil compaction shrinkage factors are applied to cut materials used as compacted embankment fill.',
      governingEquations: [
        {
          name: 'Trapezoidal Cross-Section Area',
          formula: 'Area = B · d + z · d²',
          description: 'Calculates cut or fill cross-sectional area across road formation width B and depth d.',
          variables: ['B = Formation roadway width (m)', 'd = Depth of cut or height of fill (m)', 'z = Side slope horizontal ratio (z:1)'],
        },
        {
          name: 'Average End-Area Volume Formula',
          formula: 'Volume = (A_1 + A_2) · L / 2',
          description: 'Standard highway engineering formula for volume between stations spaced L meters apart.',
          variables: ['A_1, A_2 = End cross-sectional areas (m²)', 'L = Interval chainage length (m)'],
        },
        {
          name: 'Prismoidal Accurate Formulation',
          formula: 'Volume_prismoidal = (L / 6) · (A_1 + 4 · A_mid + A_2)',
          description: 'High-precision volume formula accounting for non-linear longitudinal transitions.',
        },
      ],
      codeStandards: ['AASHTO Highway Drainage Guidelines', 'TRL Road Note 31', 'AASHTO Geometric Design'],
      assumptions: [
        'Ground surface across each cross-section is approximately horizontal or uniformly sloping',
        'Excavation profile transitions smoothly between adjacent chainage stations',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Define Roadway Formation Cross-Section',
        instruction: 'Enter Formation Width B (e.g. 7.3m for two-lane highway) and Side Slope ratio z (e.g. 1.5 for fill, 1.0 for cut).',
      },
      {
        step: 2,
        title: 'Enter Station Elevations or Depths',
        instruction: 'Input the Station Chainage (e.g. 0+000, 0+050, 0+100) and the corresponding cut (+) or fill (-) depths.',
      },
      {
        step: 3,
        title: 'Specify Soil Shrinkage / Swell Factor',
        instruction: 'Input compaction shrinkage percentage (typically 10% to 15% for compacted clay/silt embankments).',
      },
      {
        step: 4,
        title: 'Review Cut/Fill Volumes & Sync to BOQ',
        instruction: 'Inspect the cumulative cut and fill volumes. Click "Transfer Earthwork to BOQ" to automatically populate the Project BOQ.',
      },
    ],
    proTipsAndBestPractices: [
      'Compaction Shrinkage: When 1 m³ of natural bank earth is excavated, it swells by 20% loose, but when compacted into an embankment, it shrinks to approximately 0.85 to 0.90 m³ of its original volume. Always order 10% to 15% extra borrowing earth.',
      'Slope Stability: In deep cuts (> 3.0m), provide 1.5m wide intermediate berms every 3m of height to ensure slope stability and collect surface runoff in lined catch-water drains.',
    ],
    limitationsAndNotes: [
      'For complex multi-lane interchanges with variable crossfall superelevation, import surveyor TIN surfaces.',
    ],
  },

  // =========================================================================
  // 14. SURVEYING & LEVELING SUITE (SUR-01)
  // =========================================================================
  'surveying-suite': {
    id: 'surveying-suite',
    title: 'Surveying Field Computations & Differential Leveling Book',
    shortLabel: 'Surveying Suite',
    discipline: 'Geomatics & Field Surveying',
    standardUsed: 'Rise & Fall / Collimation Height / Gauss Shoelace Formula',
    overview:
      'The Surveying Field Suite automates differential leveling reductions, closure error corrections, and irregular land boundary polygon area calculations. Leveling runs establish benchmark elevations for road formation, drainage inverts, and building plinths. This suite supports both the Rise & Fall and Height of Instrument (HI) methods, enforces three-way mathematical balance checks, and computes multi-sided land parcel areas using Heron’s formula and Gauss’s Shoelace coordinates.',
    capabilities: [
      'Reduces differential leveling runs using Rise & Fall and Height of Instrument (HI / Collimation) methods',
      'Performs instantaneous 3-way arithmetic verification check: ΣBS - ΣFS = ΣRise - ΣFall = Last RL - First RL',
      'Evaluates allowable closure error (e_allow = c · √K mm) based on leveling class (order of accuracy)',
      'Calculates multi-sided irregular land parcel areas using coordinate geometry (Gauss Shoelace Formula)',
      'Computes triangular plot areas using Heron’s formulation with boundary tie diagonals',
      'Converts land areas across international and South Asian regional cadastral units (Sq.Meters, Sq.Feet, Acres, Hectares, Katha, Bigha, Decimal, Shotok)',
    ],
    howItWorks: {
      methodology:
        'In the Height of Instrument method, HI is computed by adding the Backsight (BS) to the benchmark Reduced Level (RL). Intermediate (IS) and Foresight (FS) readings are subtracted from HI to obtain station elevations. The arithmetic check ensures zero transcription errors. The polygon area engine evaluates the cross-product matrix of boundary coordinates (x_i, y_i).',
      governingEquations: [
        {
          name: 'Height of Instrument (HI) Method',
          formula: 'HI = RL_bm + BS,   RL_station = HI - (IS or FS)',
          description: 'Collimation plane elevation formulation for differential leveling.',
          variables: ['RL_bm = Known Benchmark Reduced Level (m)', 'BS = Backsight staff reading (m)', 'FS = Foresight staff reading (m)'],
        },
        {
          name: 'Three-Way Arithmetic Check',
          formula: '∑ BS - ∑ FS = ∑ Rise - ∑ Fall = RL_last - RL_first',
          description: 'Mandatory arithmetic identity to prove zero calculation error in the leveling field book.',
        },
        {
          name: 'Gauss Shoelace Polygon Area Theorem',
          formula: 'Area = 0.5 · | ∑ (x_i · y_{i+1} - x_{i+1} · y_i) |',
          description: 'Exact geometric formulation for any closed non-intersecting irregular polygon boundary.',
          variables: ['(x_i, y_i) = Survey total station boundary coordinates'],
        },
        {
          name: 'Heron Triangle Area Formulation',
          formula: 'Area = √(s · (s - a) · (s - b) · (s - c)),   where s = (a + b + c) / 2',
          description: 'Calculates plot sub-triangle area from 3 taped boundary/diagonal lengths.',
        },
      ],
      codeStandards: ['RICS Guidelines for Land Measurement', 'Survey of Bangladesh / Survey of India Leveling Manual', 'US Army Corps of Engineers Field Survey'],
      assumptions: [
        'Curvature and atmospheric refraction corrections are negligible for sight distances under 100 meters',
        'Staff is held vertically plumb using a circular bubble level during all sightings',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Choose Leveling Method',
        instruction: 'Select between Rise & Fall Method (recommended for detailed profiles) or Height of Instrument (HI) Method.',
      },
      {
        step: 2,
        title: 'Input Benchmark (BM) & Staff Sightings',
        instruction: 'Enter known Starting Reduced Level (RL) and enter Backsight (BS), Intermediate Sight (IS), and Foresight (FS) readings in meters.',
      },
      {
        step: 3,
        title: 'Verify Arithmetic Closure',
        instruction: 'Observe the three-way arithmetic check badge. If all 3 calculations balance identically, the run is mathematically verified.',
      },
      {
        step: 4,
        title: 'Calculate Land Plot Area',
        instruction: 'Switch to the Land Area Tab to input boundary coordinates or taped triangle sides. The engine displays the exact area in Sq.m, Sq.ft, Katha, and Decimals.',
      },
    ],
    proTipsAndBestPractices: [
      'Balanced Sight Distances: Always position the level instrument roughly midway between the backsight and foresight stations. This automatically cancels out collimation errors and earth curvature effects!',
      'Change Point Stability: Never establish a Change Point (CP / Turning Point) on loose dirt or soft turf. Always use a firm curb, steel peg, or solid stone.',
      'South Asian Cadastral Conversions: Remember standard legal conversions: 1 Decimal (Shotok) = 435.6 sq.ft = 40.47 m²; 1 Katha = 720 sq.ft = 1.65 Decimal; 1 Bigha = 20 Katha = 14,400 sq.ft.',
    ],
    limitationsAndNotes: [
      'Does not calculate GPS ellipsoidal geoid undulations. Geodetic control points should be pre-corrected.',
    ],
  },

  // =========================================================================
  // 15. SMART UNIT CONVERTER (UNI-01)
  // =========================================================================
  'unit-converter': {
    id: 'unit-converter',
    title: 'Civil & Architectural Smart Unit Converter',
    shortLabel: 'Smart Unit Converter',
    discipline: 'Engineering Utilities',
    standardUsed: 'SI / US Customary / Regional Cadastral Systems (BIPM / NIST)',
    overview:
      'The Smart Unit Converter provides bidirectional conversions across civil, structural, architectural, and land surveying measurement systems. Designed specifically for construction professionals navigating metric design drawings alongside imperial jobsite practices, it handles compound architectural feet-inch strings (e.g. 12\'-6 3/8"), structural stress/pressure (MPa, psi, kPa, ksf), and regional South Asian land parcels (Katha, Bigha, Decimal).',
    capabilities: [
      'Bidirectional conversion across Length, Area, Volume, Mass, Stress/Pressure, Force, Density, and Land Parcels',
      'Architectural Feet-Inch Fractional Parser supporting compound strings like 15\'-7 1/2" into decimal meters/feet',
      'Structural stress conversions between SI Megapascals (MPa) and US Customary pounds-per-square-inch (psi / ksi)',
      'Volume conversions between cubic meters (m³), cubic feet (CFT), gallons, and liters',
      'Specialized Rebar Diameter unit mass matrix (d²/162 kg/m vs lb/ft)',
      'Custom User Units Creation: Define custom regional units with custom scaling factors and persist in browser storage',
    ],
    howItWorks: {
      methodology:
        'The conversion engine utilizes high-precision 64-bit IEEE-754 floating point arithmetic anchored to standardized base units (meters for length, square meters for area, Pascals for pressure). Input strings undergo regex tokenization to decompose architectural feet, inches, and vulgar fractions (1/2, 1/4, 3/8, 5/16).',
      governingEquations: [
        {
          name: 'Compound Architectural Length to Meters',
          formula: 'L_meters = (Feet · 0.3048) + ((Inches + Numerator / Denominator) · 0.0254)',
          description: 'Parses fractional imperial string into exact standard metric meters.',
        },
        {
          name: 'Pressure Conversion (MPa to PSI)',
          formula: 'Pressure_psi = Pressure_MPa · 145.0377',
          description: 'Converts concrete compressive strength from Megapascals to psi.',
        },
      ],
      codeStandards: ['NIST Special Publication 811', 'ISO 80000-1 (Quantities and Units)', 'ASTM E380'],
      assumptions: [
        'Conversion constants adhere to exact international standards (1 inch = 25.4 mm exactly; 1 foot = 0.3048 m exactly)',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Select Unit Discipline / Category',
        instruction: 'Choose measurement category: Length, Area, Volume, Stress/Pressure, Mass, or Land Units.',
      },
      {
        step: 2,
        title: 'Select Source & Target Units',
        instruction: 'Pick your source unit (e.g. Megapascal MPa) and target unit (e.g. psi or bar).',
      },
      {
        step: 3,
        title: 'Input Value or Fractional String',
        instruction: 'Type your numerical value or architectural string (e.g. 24.5 or 14\'-8 1/4").',
      },
      {
        step: 4,
        title: 'Swap or Copy with 1-Click',
        instruction: 'Click the swap arrow to reverse conversion, or copy the formatted result with unit symbols.',
      },
    ],
    proTipsAndBestPractices: [
      'Quick Concrete Strength Thumb-Rule: 1 MPa ≈ 145 psi. Therefore, C20 concrete ≈ 3000 psi; C25 concrete ≈ 3600 psi; C30 concrete ≈ 4350 psi.',
      'CFT to Cubic Meter: Always remember 1 m³ = 35.315 CFT. 1 CFT = 0.0283 m³.',
      'Custom Units: If your local authority uses a unique land unit (e.g. Ganda, Bhori, Guntha), click "+ Custom Unit" to add and store it permanently.',
    ],
    limitationsAndNotes: [
      'Standard land unit definitions (like Katha or Bigha) can vary slightly by municipal district. Verify against local registration deeds.',
    ],
  },

  // =========================================================================
  // 16. ARCHITECTURE: FAR & MGC BY-LAWS (ARC-01)
  // =========================================================================
  'architecture-far': {
    id: 'architecture-far',
    title: 'Floor Area Ratio (FAR) & Building Setback Calculator',
    shortLabel: 'FAR By-Laws',
    discipline: 'Architecture & Urban Planning',
    standardUsed: 'BNBC 2020 Part 3 / RAJUK DAP Building Rules / National Building Code',
    overview:
      'The Floor Area Ratio (FAR) and Maximum Ground Coverage (MGC) Calculator determines the legal maximum buildable gross floor area, building footprint, and mandatory front, rear, and side setbacks for a given land parcel. Building regulatory authorities (such as RAJUK, CDA, KDA, or municipal corporations) strictly control urban density and daylight ventilation through FAR and setback constraints.',
    capabilities: [
      'Computes Maximum Allowable Built-Up Gross Floor Area (GFA = Plot Area × FAR)',
      'Calculates Maximum Ground Coverage (MGC %) and building footprint area in square meters and square feet',
      'Evaluates mandatory front, rear, and side setback clearances based on adjacent road width and occupancy class',
      'Provides estimated maximum floor count based on MGC and FAR utilization',
      'Supports residential, commercial, industrial, and mixed-use occupancy categories',
    ],
    howItWorks: {
      methodology:
        'The calculator matches plot size (in Katha or Sq.m) and connecting road width against statutory zoning matrices. The allowable FAR factor determines gross floor area. Deducting setbacks from plot dimensions determines the maximum buildable envelope, which is compared with allowable MGC percentage to prevent unauthorized site overbuilding.',
      governingEquations: [
        {
          name: 'Gross Floor Area (GFA)',
          formula: 'GFA_max = Plot_Area · FAR',
          description: 'Maximum legal total floor area across all building stories excluding exempted parking/services.',
        },
        {
          name: 'Maximum Ground Footprint Area',
          formula: 'Area_footprint_max = Plot_Area · (MGC_% / 100)',
          description: 'Maximum area of ground covered by the building structure.',
        },
      ],
      codeStandards: ['BNBC 2020 Part 3 (General Building Requirements)', 'Dhaka Metropolitan Building Construction Rules / DAP', 'NBC India Part 3'],
      assumptions: [
        'Exempted areas (fire stairs, open-to-sky light wells, underground parking) are subject to local planning authority waivers',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Input Plot Size & Connecting Road Width',
        instruction: 'Enter land area (in Katha, Decimal, or Sq.meters) and width of the connecting access road in feet or meters.',
      },
      {
        step: 2,
        title: 'Select Occupancy Type',
        instruction: 'Choose building use: Residential, Commercial, Mixed-Use, or Educational.',
      },
      {
        step: 3,
        title: 'Review FAR, MGC & Setbacks',
        instruction: 'The tool displays permissible FAR, Maximum Ground Coverage (%), Maximum Total Build-up Area, and Front/Rear/Side Setbacks.',
      },
    ],
    proTipsAndBestPractices: [
      'Road Width Thresholds: In most urban masterplans, connecting roads narrower than 20 feet (6.0m) penalize allowable FAR heavily. Verify road surrender requirements.',
      'Setback Heights: For high-rise buildings exceeding 10 stories (33m), side and rear setbacks must increase proportionally to provide emergency fire engine turntable access.',
    ],
    limitationsAndNotes: [
      'Special economic zones or heritage preservation districts may carry specific zoning overlays not captured in baseline tables.',
    ],
  },

  // =========================================================================
  // 17. ARCHITECTURE: STAIRCASE ERGONOMICS (ARC-02)
  // =========================================================================
  'architecture-staircase': {
    id: 'architecture-staircase',
    title: 'Building Staircase Riser & Tread Ergonomics Designer',
    shortLabel: 'Staircase By-Laws',
    discipline: 'Architectural Design & Human Factors',
    standardUsed: 'Blondel Formula (2R + T) / BNBC 2020 Part 4 / IBC',
    overview:
      'The Staircase Designer calculates compliant riser heights, tread widths, flight counts, intermediate landing dimensions, and clear headroom for commercial and residential staircases. Improper staircase dimensions cause human fatigue, tripping accidents, and violate fire egress life-safety regulations.',
    capabilities: [
      'Validates human gait ergonomics using François Blondel’s classical rule: 2R + T = 600mm to 640mm',
      'Calculates required number of risers and treads to span floor-to-floor height',
      'Verifies minimum flight width and landing width for building occupancy class',
      'Checks clear vertical headroom (minimum 2.15m / 7\'-0") along stair slope',
      'Evaluates pitch angle (optimal between 25° and 35°)',
    ],
    howItWorks: {
      methodology:
        'Floor-to-floor vertical rise is divided by trial riser height (typically 150mm for commercial, 165mm for residential) to determine integer riser count. Number of treads per flight = Number of risers - 1. Landing width must equal or exceed flight width. Blondel’s comfort formula is evaluated to guarantee safe ascent and descent.',
      governingEquations: [
        {
          name: 'Blondel Comfort Rule',
          formula: '2 · Riser + Tread = 600mm to 640mm  (24" to 25")',
          description: 'Human pace relationship ensuring natural foot cadence on stairs.',
        },
        {
          name: 'Stair Pitch Angle',
          formula: 'Angle = arctan(Riser / Tread)',
          description: 'Incline angle of stair flight (recommended between 28° and 35°).',
        },
      ],
      codeStandards: ['BNBC 2020 Part 4 (Fire Protection & Egress)', 'IBC Chapter 10', 'OSHA Standard 1910.25'],
      assumptions: [
        'Riser height must remain strictly identical across all steps in a single flight to prevent tripping',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Input Floor-to-Floor Height',
        instruction: 'Enter total vertical height between finished floor levels (e.g. 3.0m or 10\'-0").',
      },
      {
        step: 2,
        title: 'Select Stair Configuration',
        instruction: 'Choose Dog-Legged (two flights with intermediate landing), Straight Flight, or Open Well.',
      },
      {
        step: 3,
        title: 'Review Riser, Tread & Flight Dimensions',
        instruction: 'Check calculated riser height (150-165mm), tread depth (250-300mm), and total going length.',
      },
    ],
    proTipsAndBestPractices: [
      'Maximum Risers per Flight: Never provide more than 15 to 16 risers in a single flight without an intermediate resting landing.',
      'Riser Uniformity: A variation of even 6mm between successive risers is the leading cause of staircase tripping accidents.',
    ],
    limitationsAndNotes: [
      'Spiral or winding stairs require special municipal authorization for fire egress and are restricted to private residential utility access.',
    ],
  },

  // =========================================================================
  // 18. WATER TANK & RESERVOIR SIZING (ARC-03)
  // =========================================================================
  'architecture-watertank': {
    id: 'architecture-watertank',
    title: 'Underground & Overhead Water Reservoir Sizing',
    shortLabel: 'Water Tank Sizing',
    discipline: 'Building Services & Plumbing',
    standardUsed: 'BNBC 2020 Part 8 Chapter 5 / IS 1172 / Uniform Plumbing Code',
    overview:
      'The Water Reservoir Sizing Engine dimensions Underground Water Reservoirs (UGWR) and Overhead Water Tanks (OHWR) based on building occupant count, per capita daily consumption (LPCD), and emergency fire reserve storage. In municipal environments with intermittent utility water supply, properly sized reservoirs guarantee 24 to 48 hours of domestic continuity and life-safety fire sprinkler pressure.',
    capabilities: [
      'Calculates total daily domestic water demand based on occupancy type (Residential, Commercial Office, Hotel, Hospital)',
      'Allocates standard storage split: 60% in Underground Reservoir (UGWR) and 40% in Overhead Tank (OHWR)',
      'Calculates mandatory dedicated fire reserve storage per building fire hazard classification',
      'Dimensions rectangular reservoir length, width, and liquid depth incorporating 300mm freeboard',
      'Computes total stored water weight for structural roof column load analysis',
    ],
    howItWorks: {
      methodology:
        'Daily demand = Occupants × Daily per capita consumption (e.g. 135 to 150 liters/person/day for apartments). UGWR stores 1 to 1.5 days of domestic consumption plus fire reserve. Required volume in cubic meters = Total Liters / 1000. Practical length, width, and water depth are sized to fit structural column grids.',
      governingEquations: [
        {
          name: 'Daily Domestic Demand',
          formula: 'Demand_total = Occupants · LPCD',
          description: 'Gross daily water demand in liters.',
          variables: ['LPCD = Liters Per Capita per Day (e.g. 135-180 LPCD for residential; 45 LPCD for commercial)'],
        },
        {
          name: 'Reservoir Volume Sizing',
          formula: 'Volume_m³ = Stored_Liters / 1000 = Length · Width · Depth_liquid',
          description: 'Dimensions rectangular concrete reservoir structure.',
        },
      ],
      codeStandards: ['BNBC 2020 Part 8 Chapter 5', 'IS 1172 (Basic Requirements for Water Supply)', 'NFPA 22'],
      assumptions: [
        'Water density = 1000 kg/m³ = 1 kg/liter = 62.4 lb/ft³',
        'Minimum freeboard clearance between water top and slab soffit = 300mm',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Input Occupancy & User Count',
        instruction: 'Enter number of building occupants (or number of apartments and average family size).',
      },
      {
        step: 2,
        title: 'Set Per Capita Consumption & Days Storage',
        instruction: 'Select consumption rate (default 150 LPCD) and days of backup storage reserve (typically 1 to 2 days).',
      },
      {
        step: 3,
        title: 'Review UGWR & OHWR Dimensions',
        instruction: 'The tool outputs required volume in Liters, Gallons, and m³, along with recommended Length × Width × Depth.',
      },
    ],
    proTipsAndBestPractices: [
      'Structural Load on Roof: Water is heavy! An 8,000-liter overhead tank adds 8.0 metric tonnes of concentrated gravity load on your roof columns and beams. Always ensure structural verification.',
      'Suction Sump & Baffle: Always provide a 300mm depressed suction sump at the pump suction intake to prevent vortexing and air binding.',
    ],
    limitationsAndNotes: [
      'Industrial chemical or process water requirements must be estimated separately from domestic potable consumption.',
    ],
  },

  // =========================================================================
  // 19. SEPTIC TANK & SOAK PIT SIZING (ARC-04)
  // =========================================================================
  'architecture-septictank': {
    id: 'architecture-septictank',
    title: 'Septic Tank & Effluent Soak Pit Dimensioning Engine',
    shortLabel: 'Septic Tank Design',
    discipline: 'Sanitary & Environmental Engineering',
    standardUsed: 'BNBC 2020 Part 8 Chapter 6 / IS 2470 / WHO Environmental Health',
    overview:
      'The Septic Tank and Soak Pit Dimensioning Engine sizes on-site decentralized wastewater disposal systems for unsewered developments. A septic tank facilitates primary anaerobic decomposition, sedimentation of settleable solids into sludge, and scum retention. Effluent is dispersed into surrounding subsoil via perforated circular soak pits or absorption trenches.',
    capabilities: [
      'Calculates liquid sewage volume based on 24-hour hydraulic detention period',
      'Computes sludge digestion and accumulation capacity for 1, 2, or 3-year cleaning intervals',
      'Dimensions multi-chamber (two-compartment) reinforced concrete septic tanks (Length-to-Width ratio 2:1 to 3:1)',
      'Sizes circular soak pit depth and diameter based on subsoil percolation rate',
      'Specifies inlet/outlet sanitary tee baffles and ventilation pipes',
    ],
    howItWorks: {
      methodology:
        'Daily sewage flow is taken as 75% to 80% of daily domestic water consumption. Total tank capacity = Sewage Flow × Detention Time (24h) + Sludge Accumulation Volume (Occupants × Sludge rate × Cleaning interval). Chamber 1 accounts for 2/3rd of total length; Chamber 2 accounts for 1/3rd. Soak well absorption area is sized against soil percolation time.',
      governingEquations: [
        {
          name: 'Total Septic Tank Volume',
          formula: 'V_tank = V_liquid_detention + V_sludge_storage',
          description: 'Combines 24-hour hydraulic detention volume with anaerobic sludge digest capacity.',
        },
        {
          name: 'Soak Pit Side Absorption Area',
          formula: 'A_absorption = π · D_pit · Depth_effluent = Daily_Effluent / Percolation_Rate',
          description: 'Dimensions cylindrical permeable well sidewall area.',
        },
      ],
      codeStandards: ['BNBC 2020 Part 8 Chapter 6', 'IS 2470 (Design and Construction of Septic Tanks)', 'Uniform Plumbing Code'],
      assumptions: [
        'Minimum liquid depth = 1.0 meter; minimum freeboard clearance = 300mm to 450mm',
        'Groundwater table is at least 1.5m below the soak pit base to prevent groundwater contamination',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Specify User Population',
        instruction: 'Enter number of permanent building residents or commercial daily users.',
      },
      {
        step: 2,
        title: 'Select Desludging Interval',
        instruction: 'Choose cleaning frequency (typically 1, 2, or 3 years; 2 years recommended).',
      },
      {
        step: 3,
        title: 'Review Tank & Soak Pit Dimensions',
        instruction: 'The tool outputs required Tank Length, Width, Depth, Wall Thickness, and Soak Well Diameter.',
      },
    ],
    proTipsAndBestPractices: [
      'Distance from Water Wells: A soak pit must be located at least 15 to 30 meters (50 to 100 feet) away from any drinking water tubewell or reservoir to prevent pathogen migration.',
      'Two Compartments are Mandatory: Single-chamber tanks allow solids to wash out into the soak pit, clogging soil pores within months. Always provide two compartments separated by a baffled wall.',
    ],
    limitationsAndNotes: [
      'In areas with impermeable dense clay or waterlogged high water tables, soak pits will fail; consider reed beds or aerobic sewage treatment plants (STP).',
    ],
  },

  // =========================================================================
  // 20. AUTOCAD VIEWPORT SCALES (CAD-01)
  // =========================================================================
  'cad-viewport': {
    id: 'cad-viewport',
    title: 'AutoCAD Layout Viewport Scale & Zoom XP Factors',
    shortLabel: 'CAD Viewport Scales',
    discipline: 'Computer-Aided Drafting (CAD)',
    standardUsed: 'ISO 216 / Metric Drawing Scales (1:50, 1:100, 1:200)',
    overview:
      'The AutoCAD Viewport Scale Calculator determines the exact "Zoom XP" command factors and annotation scales for presenting full-size 1:1 ModelSpace drawings inside PaperSpace sheet layouts (A1, A2, A3). Using incorrect viewport scales causes dimension text mismatches, inaccurate printed drawing scales, and rejected permit submittals.',
    capabilities: [
      'Computes exact Zoom XP factor for metric drawings drawn in millimeters, centimeters, or meters',
      'Calculates viewport scale ratio for standard architectural scales (1:10, 1:20, 1:50, 1:100, 1:200, 1:500)',
      'Calculates physical model coverage area fitted inside standard ISO paper sheets (A1, A2, A3, A4)',
      'Generates exact AutoCAD command sequence (e.g. Z -> Enter -> 1/100XP -> Enter)',
    ],
    howItWorks: {
      methodology:
        'In AutoCAD, PaperSpace layouts are measured in millimeters (1 unit = 1 mm on paper). When ModelSpace is drawn in millimeters, Zoom XP = 1/Scale (e.g. 1/100XP for 1:100). When ModelSpace is drawn in meters (1 unit = 1 m), Zoom XP = 1000/Scale (e.g. 1000/100XP = 10XP).',
      governingEquations: [
        {
          name: 'Zoom XP Factor (Model in mm)',
          formula: 'Zoom_XP = 1 / Drawing_Scale_Denominator',
          description: 'Standard formula when ModelSpace units are millimeters.',
        },
        {
          name: 'Zoom XP Factor (Model in meters)',
          formula: 'Zoom_XP = 1000 / Drawing_Scale_Denominator',
          description: 'Formula when ModelSpace 1 unit represents 1.0 meter.',
        },
      ],
      codeStandards: ['ISO 128 (Technical Drawings - Presentation)', 'AIA CAD Layer Guidelines'],
      assumptions: ['PaperSpace layout sheet is set to 1:1 plotting in millimeters'],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Select ModelSpace Unit',
        instruction: 'Indicate whether you drew your building in Millimeters (mm), Meters (m), or Inches (in).',
      },
      {
        step: 2,
        title: 'Choose Target Drawing Scale',
        instruction: 'Pick your desired printed sheet scale (e.g. 1:50 for detailing; 1:100 for floor plans; 1:500 for master site plans).',
      },
      {
        step: 3,
        title: 'Execute Command in AutoCAD',
        instruction: 'Double click inside your layout viewport and type the exact generated command: "Z", then Enter, then "1/100XP", then Enter. Lock your viewport immediately.',
      },
    ],
    proTipsAndBestPractices: [
      'Always Lock Viewports: After scaling your viewport, immediately select the viewport border in PaperSpace, right-click, and set "Display Locked = Yes" to prevent accidental mouse-wheel zooming.',
      'Annotative Scaling: Enable the "Annotative" property on text and dimensions so they automatically maintain a crisp 2.5mm printed height regardless of viewport scale.',
    ],
    limitationsAndNotes: [
      'Layout page setup printer driver must be set to 1:1 plot scale (1 mm = 1 unit).',
    ],
  },

  // =========================================================================
  // 21. AUTOCAD SHORTCUTS & LISP (CAD-02)
  // =========================================================================
  'cad-shortcuts': {
    id: 'cad-shortcuts',
    title: 'AutoCAD Professional Command Aliases & Speed Drafting Hub',
    shortLabel: 'CAD Shortcuts Hub',
    discipline: 'Computer-Aided Drafting (CAD)',
    standardUsed: 'AutoCAD Native Shortcut Registry / acad.pgp',
    overview:
      'The AutoCAD Command Aliases & Speed Drafting Hub is a searchable cheat-sheet of over 60 essential keyboard shortcuts, function key toggles, and AutoLISP script snippets used by professional civil draftsmen. Memorizing keyboard aliases reduces mouse cursor travel distance by over 70%, doubling drafting speed.',
    capabilities: [
      'Searchable registry categorized by Draw, Modify, Dimension, View, and System Toggles',
      'Covers rapid navigation shortcuts (F3 Osnap, F8 Ortho, QSELECT, PURGE, OVERKILL)',
      'Includes handy AutoLISP code snippets for total rebar length summing and batch text numbering',
    ],
    howItWorks: {
      methodology:
        'Aliases mirror native AutoCAD acad.pgp definitions. Users can filter by keyword or category to instantly locate command triggers.',
      governingEquations: [],
      codeStandards: ['Autodesk AutoCAD Command Reference'],
      assumptions: ['Standard QWERTY keyboard layout running AutoCAD 2018 through 2026'],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Search by Action',
        instruction: 'Type what you want to do (e.g. "trim", "fillet", "rotate", "align", "purge") in the search box.',
      },
      {
        step: 2,
        title: 'Use One-Hand Left-Keyboard Shortcuts',
        instruction: 'Notice high-speed aliases: C (Circle), CO (Copy), EX (Extend), TR (Trim), MI (Mirror), MA (Match Properties).',
      },
    ],
    proTipsAndBestPractices: [
      'OVERKILL: Always run the OVERKILL command on engineering drawings before exporting or calculating takeoffs to delete duplicate overlapping rebar lines.',
      'PURGE & AUDIT: Run PURGE (all nested items) and AUDIT weekly to eliminate unused layers and reduce DWG file size by up to 80%.',
    ],
    limitationsAndNotes: ['Custom corporate acad.pgp files may override default letter aliases.'],
  },

  // =========================================================================
  // 22. STRUCTURAL EXCEL FORMULAS (CAD-03)
  // =========================================================================
  'cad-excel': {
    id: 'cad-excel',
    title: 'Structural Engineering Excel & Spreadsheet Formulas',
    shortLabel: 'Excel Formula Hub',
    discipline: 'Computational Engineering',
    standardUsed: 'ISO Structural Calc Sheet Standards / Excel Functions',
    overview:
      'The Structural Engineering Excel Hub provides copy-pasteable formulas for 2D linear stress interpolation, bar bending mass matrices, shear/moment envelope generation, and dynamic BOQ aggregation. Excel remains the most ubiquitous tool in civil consulting offices; using robust error-checked formulas prevents circular references and calculation mistakes.',
    capabilities: [
      'Linear & Bilinear Interpolation formulas for soil bearing factors and wind velocity pressures',
      'Dynamic rebar weight lookup matrix formulas using INDEX/MATCH and XLOOKUP',
      'Formulas for multi-tier conditional tax, VAT, and contingency calculation',
      'Text extraction formulas for parsing civil dimensions (e.g. 10x20) into length and width',
    ],
    howItWorks: {
      methodology:
        'Formulas use standard Microsoft Excel / Google Sheets syntax incorporating IFERROR, INDEX, MATCH, and SUMPRODUCT to handle engineering calculation arrays.',
      governingEquations: [
        {
          name: 'Linear Interpolation Formula in Excel',
          formula: '=y1 + (x_target - x1) * (y2 - y1) / (x2 - x1)',
          description: 'Standard formula for interpolating intermediate code table coefficients.',
        },
      ],
      codeStandards: ['Microsoft Excel 2016-365 / Google Sheets'],
      assumptions: ['Standard comma-separated argument notation in English Excel installations'],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Select Formula Type',
        instruction: 'Choose calculation need: Interpolation, Rebar Matrix, or BOQ Summation.',
      },
      {
        step: 2,
        title: 'Copy & Paste into Cell',
        instruction: 'Copy formula and replace cell coordinate references (e.g. A1, B1) with your worksheet ranges.',
      },
    ],
    proTipsAndBestPractices: [
      'Always wrap engineering formulas in =IFERROR(formula, "-") to prevent ugly #N/A and #DIV/0! errors from breaking printout summaries.',
    ],
    limitationsAndNotes: ['Formulas assume standard decimal point notation.'],
  },

  // =========================================================================
  // 23. SITE QA/QC PROTOCOLS & AUDIT (QCS-01)
  // =========================================================================
  'site-qc-protocols': {
    id: 'site-qc-protocols',
    title: 'Site Quality Control (Slump, Cubes, Rebar & Concrete)',
    shortLabel: 'Site QC Protocols',
    discipline: 'Construction QA/QC & Field Inspection',
    standardUsed: 'ASTM C143 (Slump) / ASTM C39 (Compression) / ACI 318 / BNBC 2020',
    overview:
      'The Site Quality Control Suite provides interactive inspection checklists and test validation criteria for field engineers. Overseeing pre-pour rebar placement, concrete slump workability tests, and 7/28-day cylinder/cube compressive strength results ensures that structural members constructed on the jobsite safely match structural design assumptions.',
    capabilities: [
      'Interactive Pre-Pour Rebar Inspection Checklist (clear cover, lap splice, chair bars, formwork ties, cleanliness)',
      'Slump Test Workability Verification across structural members with tolerance checking (ASTM C143)',
      'Concrete compressive strength evaluation (7-day 65-70% benchmark and 28-day 100% acceptance criteria per ACI 318)',
      'Generates signed QA/QC field audit records conforming to ISO 9001 compliance protocols',
    ],
    howItWorks: {
      methodology:
        'Checklists enforce strict sequential sign-offs prior to pouring authorization. Slump test measurements are compared with member specifications (e.g. 75-100mm for beams/columns). Concrete cylinder strengths are validated against the ACI 318 acceptance rule: every arithmetic average of any three consecutive strength tests equals or exceeds f\'c, and no individual strength test falls below f\'c by more than 3.5 MPa.',
      governingEquations: [
        {
          name: 'Concrete Cylinder Compressive Strength',
          formula: 'f_c = P_failure / Area_cylinder = (4 · P_failure) / (π · D²)',
          description: 'Crushing strength of standard 150mm × 300mm concrete test cylinder.',
        },
        {
          name: '7-Day Strength Gain Guideline',
          formula: 'f_c(7-day) ≈ 0.65 to 0.70 · f\'c(28-day)',
          description: 'Normal hardening concrete typically attains 65% to 70% of 28-day strength at 7 days.',
        },
      ],
      codeStandards: ['ASTM C143 (Slump Test)', 'ASTM C39 (Cylinder Compression)', 'ACI 318-19 Section 26.12', 'BNBC 2020 Part 2'],
      assumptions: [
        'Standard 150mm × 300mm cylinders (or 150mm cubes) cured in a 23°C water bath for 28 days',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Perform Pre-Pour Inspection',
        instruction: 'Inspect reinforcement against design drawings: verify clear cover spacers, lap splice lengths, and formwork cleanliness.',
      },
      {
        step: 2,
        title: 'Conduct Slump Test on Fresh Batch',
        instruction: 'Fill slump cone in 3 equal layers, rodding each 25 times. Measure slump subsidence in millimeters.',
      },
      {
        step: 3,
        title: 'Record Crushing Strengths',
        instruction: 'Test 3 cylinders at 7 days and 3 cylinders at 28 days in a calibrated compression testing machine.',
      },
    ],
    proTipsAndBestPractices: [
      'Rejecting Water Additions: The mixer truck driver must NEVER add unmeasured water on site to increase slump. If concrete is stiff, use an approved water-reducing superplasticizer admixture.',
      'Capping of Cylinders: Cylinder ends must be ground flat or capped with sulfur mortar (ASTM C617) before testing. Irregular ends can cause premature crushing by up to 30%!',
    ],
    limitationsAndNotes: ['For temperature extremes (< 5°C or > 35°C), follow ACI 306R Cold Weather or ACI 305R Hot Weather concreting guidelines.'],
  },

  // =========================================================================
  // 24. STORE & INVENTORY LEDGER (SM-01)
  // =========================================================================
  'store-inventory': {
    id: 'store-inventory',
    title: 'Store & Inventory Ledger (মালামাল ইন-আউট রেজিস্টার)',
    shortLabel: 'Store Ledger',
    discipline: 'Site Management & Field ERP',
    standardUsed: 'CPWD / PWD Works Manual / Store Ledger Practice',
    overview:
      'The Store & Inventory Ledger tracks site materials from arrival through issuance to structural elements. It maintains running balances, enforces minimum thresholds, tracks delivery challans/truck numbers, and analyzes material variance against theoretical BOQ requirements.',
    capabilities: [
      'Real-time material balance tracking with red LOW STOCK alerts',
      'Inward stock verification with Challan No., Truck No., and Supplier tagging',
      'Outward issue tracking scoped by Floor/Zone and Sub-Contractor/Foreman',
      'Theoretical BOQ vs. Actual Outward Consumption Wastage analysis',
      '1-Click automated transfer of depleted materials to Requisitions',
      'Instant CSV and printable A4 Store Inventory balance sheets',
    ],
    howItWorks: {
      methodology:
        'Maintains a dual-entry inventory register where every incoming Challan creates an Inward transaction (Stock += Qty) and every jobsite issue creates an Outward transaction (Stock -= Qty). The engine verifies that issue quantities do not exceed available on-site stock and computes cumulative wastage vs BOQ targets.',
      governingEquations: [
        {
          name: 'Running Inventory Balance',
          formula: 'Balance_t = Balance_{t-1} + Qty_{Inward} - Qty_{Outward}',
          description: 'Fundamental site storekeeper mass conservation principle.',
        },
        {
          name: 'Material Wastage / Variance %',
          formula: 'Wastage = ((Qty_{Actual} - Qty_{BOQ}) / Qty_{BOQ}) × 100%',
          description: 'Variance analysis indicating material leakage, site loss, or over-breakage.',
        },
      ],
      codeStandards: ['PWD Works Code Chapter 7: Stores', 'CPWD Works Manual Section 6', 'ISO 9001:2015 Material Traceability'],
      assumptions: [
        'Materials are weighed or counted upon truck arrival prior to unloading',
        'Damaged or rain-affected materials are written off with proper loss remarks',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Initialize Site Materials',
        instruction: 'Click "+ Add Material Item" to record materials with initial balance, unit, and minimum re-order threshold.',
      },
      {
        step: 2,
        title: 'Record Truck Delivery (মালামাল জমা)',
        instruction: 'Click "+ Inward Entry" upon truck arrival. Enter Challan No., Supplier, Truck No., and verified quantity.',
      },
      {
        step: 3,
        title: 'Issue to Work Head (মালামাল খরচ)',
        instruction: 'Click "- Outward Issue" to dispense materials. Specify target floor/zone and the responsible foreman.',
      },
      {
        step: 4,
        title: 'Analyze BOQ Variance',
        instruction: 'Review the Theoretical vs. Actual table to monitor if rebar or cement consumption exceeds allowable waste (3-5%).',
      },
    ],
    proTipsAndBestPractices: [
      'Cement Storage: Stack cement bags maximum 10 bags high on wooden pallets at least 150mm above the store floor to prevent moisture absorption.',
      'Rebar Rust Protection: Keep deformed bars stacked off the bare ground on timber sleepers and cover with tarpaulins to avoid excessive pitting rust.',
    ],
    limitationsAndNotes: ['Physical store audits should be performed weekly to reconcile physical count against the digital ledger.'],
  },

  // =========================================================================
  // 25. MATERIAL REQUISITIONS & PO SLIPS (SM-02)
  // =========================================================================
  'material-requisition': {
    id: 'material-requisition',
    title: 'Material Requisition & Purchase Order Generator (রিকুইজিশন)',
    shortLabel: 'Material Requisitions',
    discipline: 'Site Management & Field ERP',
    standardUsed: 'Standard Construction Procurement Practice',
    overview:
      'Generates formal multi-item material requisitions, purchase order slips, and instant WhatsApp ordering strings. Enables site engineers to request cement, rebar, aggregates, and hardware with urgency levels and seamless inward store reconciliation upon delivery.',
    capabilities: [
      'Multi-item requisition orders with stock lookup and urgency tagging (Normal, Urgent, Critical)',
      '1-Click WhatsApp text generator for direct messaging to suppliers and head office procurement',
      'Official printable A4 Requisition & PO Slip with client, contractor, and engineer signature blocks',
      'One-click "Receive into Store" button that automatically stocks arrived goods in the Store Ledger',
    ],
    howItWorks: {
      methodology:
        'Aggregates material requirements, evaluates lead times, and compiles structured procurement slips. When marked as Received, it generates corresponding Inward entries in the Store Ledger with Challan references.',
      governingEquations: [
        {
          name: 'Requisition Quantity Calculation',
          formula: 'ReqQty = (PlannedDemand + SafetyStock) - CurrentStoreBalance',
          description: 'Calculates net purchase order volume to prevent jobsite stoppage.',
        },
      ],
      codeStandards: ['FIDIC Red Book Procurement Clauses', 'Standard PWD Requisition Form 28'],
      assumptions: ['Requisitions reflect genuine work schedules for the upcoming 7 to 14 days'],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Create Requisition Order',
        instruction: 'Click "+ New Requisition". Select urgency (Normal, Urgent, Critical) and specify required-by date.',
      },
      {
        step: 2,
        title: 'Add Items & Quantities',
        instruction: 'Add line items by selecting existing store materials or entering new custom items with specifications.',
      },
      {
        step: 3,
        title: 'Send via WhatsApp or Print Slip',
        instruction: 'Click "Copy WhatsApp" to copy a cleanly formatted message or "Print Slip" for official sign-off.',
      },
      {
        step: 4,
        title: 'Receive into Store',
        instruction: 'When materials arrive, click "Receive" to input the Challan No. and auto-update store inventory balances.',
      },
    ],
    proTipsAndBestPractices: [
      'Aggregate Lead Times: Always order coarse and fine aggregate at least 48 hours prior to large slab casting to allow sampling and moisture checks.',
    ],
    limitationsAndNotes: ['Ensure delivery tickets and mill test certificates accompany high-strength rebar deliveries.'],
  },

  // =========================================================================
  // 26. SCHEDULE & ROSTER (SM-03)
  // =========================================================================
  'schedule-roster': {
    id: 'schedule-roster',
    title: 'Project Schedule, Concrete Pour & Curing Roster (শিডিউল)',
    shortLabel: 'Schedule & Roster',
    discipline: 'Site Management & Field ERP',
    standardUsed: 'CPM Scheduling & ACI 308 Curing Standards',
    overview:
      'Integrated project timeline manager tracking major structural milestones, concrete casting dates, minimum 14/28-day water curing countdowns, soffit formwork deshuttering schedules, and daily field engineer inspection checklists.',
    capabilities: [
      'Gantt-style milestone tracker with automated progress calculation',
      'Automated water-curing countdowns with active curing alert badges',
      'Code-compliant formwork deshuttering dates based on structural member type',
      'Daily site engineer quality checklists (reinforcement check, cover blocks, slump test)',
    ],
    howItWorks: {
      methodology:
        'Calculates critical curing duration and deshuttering periods from casting date based on BNBC/ACI specifications (e.g. beam soffits: 14 days, slabs: 7 days, columns/walls: 24-48 hours).',
      governingEquations: [
        {
          name: 'Curing Time Countdown',
          formula: 'DaysRemaining = TargetCuringDays - (Today - CastingDate)',
          description: 'Calculates remaining mandatory water curing period.',
        },
      ],
      codeStandards: ['BNBC 2020 Part 6 Section 5.11 (Curing)', 'ACI 308R Guide to External Curing', 'ACI 347 Guide to Formwork'],
      assumptions: ['Ambient temperature is above 10°C; standard OPC or PCC cement is utilized'],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Log Concrete Pour Event',
        instruction: 'Click "+ Add Milestone" and set category to Concrete Pour with structural member details.',
      },
      {
        step: 2,
        title: 'Track Curing Countdown',
        instruction: 'Monitor the Curing tab to ensure wet burlap or ponding continues until the green 0 days badge is achieved.',
      },
      {
        step: 3,
        title: 'Execute Quality Inspection',
        instruction: 'Open the Engineer Checklist tab to verify rebar binding, clear cover, and shuttering plumb before pouring.',
      },
    ],
    proTipsAndBestPractices: [
      'Ponding on Slabs: Form clay or sand bunds (আইল) across roof slabs to retain at least 50mm standing water for the entire 14-day curing cycle.',
    ],
    limitationsAndNotes: ['Never remove slab props until adjacent beam test cubes achieve at least 75% of characteristic 28-day strength.'],
  },

  // =========================================================================
  // 27. LABOR MUSTER ROLL & WAGES (SM-04)
  // =========================================================================
  'labor-attendance': {
    id: 'labor-attendance',
    title: 'Labor Muster Roll & Wage Sheet (হাজিরা খাতা ও মজুরি)',
    shortLabel: 'Labor Attendance',
    discipline: 'Site Management & Field ERP',
    standardUsed: 'Bangladesh Labor Act 2006 & South-Asian Site Muster Roll Practice',
    overview:
      'Digital 1-to-31 day monthly Present Book (হাজিরা খাতা) for jobsite labor. Manages trade categories (Masons, Jogalis, Bar Benders, Carpenters), records daily attendance (P, H, OT, A), logs weekly food allowances (খোরকী), and compiles net wages.',
    capabilities: [
      'Authentic 1-to-31 day monthly muster roll grid with 1-click status cycling (P = 1, H = 0.5, OT, A = 0)',
      '1-Click "Mark All Active Present Today" batch button for fast daily morning attendance',
      'Worker profile directory with daily wage rates, overtime hourly rates, and NID tracking',
      'Weekly Khoraki (খোরকী) advance payment ledger with balance deductions',
      'A4 Printable Monthly Wage Sheet & Payment Register with worker signature/thumbprint blocks',
    ],
    howItWorks: {
      methodology:
        'Computes total effective present days, overtime hours, gross earnings, and subtracts cumulative Khoraki and salary advances to calculate net payable wage per worker.',
      governingEquations: [
        {
          name: 'Monthly Gross Wages',
          formula: 'Gross = (Days_P + 0.5 × Days_H) × DailyWage + Hours_OT × Rate_OT',
          description: 'Calculates total labor earnings for the selected calendar month.',
        },
        {
          name: 'Net Payout Due',
          formula: 'NetPayable = Gross - (TotalKhoraki + AdvancesDeducted)',
          description: 'Net balance disbursed on weekly or monthly labor settlement day.',
        },
      ],
      codeStandards: ['Bangladesh Labor Act 2006 (Minimum Wage & OT Rules)', 'PWD Muster Roll Form 21'],
      assumptions: ['Normal working shift is 8 hours; additional hours qualify for overtime compensation'],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Enroll Site Workers',
        instruction: 'Click "+ Enroll Worker" to input name, trade (Mason, Helper, Bar Bender), phone, and daily wage rate.',
      },
      {
        step: 2,
        title: 'Mark Daily Attendance',
        instruction: 'Use "+ Mark All Present" for quick batch entry or click any cell in the 1-31 grid to toggle P, H, OT, or A.',
      },
      {
        step: 3,
        title: 'Disburse Weekly Khoraki',
        instruction: 'Click "Khoraki" next to a worker to record cash advances given for food and personal expenses.',
      },
      {
        step: 4,
        title: 'Generate Master Wage Sheet',
        instruction: 'Click "Print Wage Sheet" to print the certified monthly payment sheet with signature blocks.',
      },
    ],
    proTipsAndBestPractices: [
      'Daily Morning Roll Call: Conduct headcount roll call at 8:00 AM sharp to ensure accurate muster roll logging and job safety briefings.',
    ],
    limitationsAndNotes: ['Workers remain preserved in localStorage across all months until explicitly archived.'],
  },

  // =========================================================================
  // 28. FIELD NOTEBOOK & VOICE DIARY (SM-05)
  // =========================================================================
  'field-notebook': {
    id: 'field-notebook',
    title: 'Smart Field Notebook & Voice Diary (সাইট নোটবুক ও ডায়েরি)',
    shortLabel: 'Field Notebook',
    discipline: 'Site Management & Field ERP',
    standardUsed: 'Civil Site Engineer Inspection Diary Standard',
    overview:
      'Digital jobsite diary and voice-dictated field inspection log. Allows engineers to record structural observations, non-conformance defects (NCR), architectural discrepancies, and consultant instructions categorized by Grid/Floor tags.',
    capabilities: [
      'Speech-to-Text voice dictation for hands-free logging while walking rebar cages or scaffolds',
      'Categorization by Defect, Instructions, Material Issue, Safety, or Progress',
      'Location tagging by Floor and Grid Intersection (e.g. 4th Floor Grid C-3)',
      'Resolution tracking with checkbox verification and audit timestamps',
    ],
    howItWorks: {
      methodology:
        'Utilizes browser SpeechRecognition APIs with graceful text fallback to capture real-time observations, stores them with resolution workflows, and links unresolved items to the Daily Progress Report.',
      governingEquations: [
        {
          name: 'Resolution Rate %',
          formula: 'ResolvedRate = (Notes_Resolved / TotalNotes) × 100%',
          description: 'Tracks quality control responsiveness and defect closure efficiency.',
        },
      ],
      codeStandards: ['ISO 9001:2015 Non-Conformance Reporting (NCR)', 'PWD Site Order Book Rules'],
      assumptions: ['Engineers inspect structural works prior to casting and log deviations promptly'],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Start Voice Dictation or Text Note',
        instruction: 'Click "Voice Dictation" to record spoken notes hands-free, or type into the field notebook prompt.',
      },
      {
        step: 2,
        title: 'Tag Location & Category',
        instruction: 'Select category (Defect, Safety, Progress) and enter the floor/column grid tag.',
      },
      {
        step: 3,
        title: 'Track & Resolve',
        instruction: 'Mark the checkmark once the contractor corrects the rebar spacing, shuttering prop, or honeycombing.',
      },
    ],
    proTipsAndBestPractices: [
      'Grid Referencing: Always note column grid lines (e.g., Column C-4) so sub-contractors locate defective areas without ambiguity.',
    ],
    limitationsAndNotes: ['Speech recognition requires browser microphone permissions; manual typing is always available.'],
  },

  // =========================================================================
  // 29. SUB-CONTRACTOR RA BILLS (SM-06)
  // =========================================================================
  'contractor-bills': {
    id: 'contractor-bills',
    title: 'Sub-Contractor RA Bill Tracker (কন্ট্রাক্টর রানিং বিল)',
    shortLabel: 'Contractor Bills',
    discipline: 'Site Management & Field ERP',
    standardUsed: 'CPWD / PWD Running Account Bill Form 26 & Measurement Book (MB)',
    overview:
      'Professional Running Account (RA) Bill generator for sub-contractors (Rebar fabrication, Shuttering, Brickwork, Plaster, Tiles). Automatically computes cumulative quantities, gross amounts, retention deductions (5-10%), and net payable sums.',
    capabilities: [
      'Sequential RA Bill tracking (RA-01, RA-02, etc.) with cumulative measurement history',
      'Automated retention / security money deduction percentage (5% to 10%)',
      'Advance recovery and TDS/VAT deduction calculations',
      'Printable official A4 Running Account Bill with measurement details and signature certifications',
    ],
    howItWorks: {
      methodology:
        'Calculates current gross billing from measured work, subtracts retention for defects liability, deducts prior mobilization/labor advances, and generates certified net payment vouchers.',
      governingEquations: [
        {
          name: 'Current Bill Gross Amount',
          formula: 'Gross = CurrentMeasuredQty × ContractRate',
          description: 'Value of physical work executed during the current billing period.',
        },
        {
          name: 'Net Payable Bill Amount',
          formula: 'NetPayable = Gross - (Gross × Retention%) - AdvancesDeducted - TaxVAT',
          description: 'Amount certified by Site Engineer for release to the sub-contractor.',
        },
      ],
      codeStandards: ['PWD Measurement Book (MB) Rules', 'FIDIC Short Form of Contract Clause 11'],
      assumptions: ['Physical work has been jointly measured and verified by the site engineer'],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Create New RA Bill',
        instruction: 'Click "+ New RA Bill". Enter contractor name, trade (e.g. Shuttering), and unit contract rate.',
      },
      {
        step: 2,
        title: 'Enter Measured Quantities',
        instruction: 'Input previous cumulative quantity (auto-filled for recurring contractors) and current measured quantity.',
      },
      {
        step: 3,
        title: 'Apply Deductions',
        instruction: 'Confirm retention percentage (standard 5% or 10%) and enter any advance payments to be recovered.',
      },
      {
        step: 4,
        title: 'Print Certified Bill',
        instruction: 'Click "Print Bill" to generate the formal signed invoice for accounts clearance.',
      },
    ],
    proTipsAndBestPractices: [
      'Retention Release: Never release security retention money until after the contractual Defect Liability Period (usually 6 to 12 months) expires.',
    ],
    limitationsAndNotes: ['Ensure joint measurement records (MB) are signed before certifying payment.'],
  },

  // =========================================================================
  // 30. SITE PETTY CASH (SM-07)
  // =========================================================================
  'petty-cash': {
    id: 'petty-cash',
    title: 'Site Petty Cash & Daily Expense Ledger (খুচরা ক্যাশ হিসাব)',
    shortLabel: 'Petty Cash',
    discipline: 'Site Management & Field ERP',
    standardUsed: 'Standard Imprest Accounting System',
    overview:
      'Imprest cash fund tracker for site engineers. Records cash received from head office/clients, tracks daily small site expenses (labor refreshments, nails, binding wire, transport/van fare, minor tools), and maintains real-time Cash in Hand.',
    capabilities: [
      'Dual Credit/Debit imprest ledger tracking Cash In vs Cash Out',
      'Real-time Cash in Hand display with low-cash balance warnings',
      'Expense breakdown by category (Materials, Transport, Refreshments, Tools, Labor)',
      '1-Click CSV export and printable A4 Petty Cash Voucher statement',
    ],
    howItWorks: {
      methodology:
        'Maintains a continuous imprest balance where Credits increase cash and Debits decrease cash, providing audit-proof reconciliation for Head Office accounts submission.',
      governingEquations: [
        {
          name: 'Cash in Hand Formula',
          formula: 'CurrentCash = OpeningBalance + TotalReceived - TotalSpent',
          description: 'Fundamental imprest accounting equation.',
        },
      ],
      codeStandards: ['GAAP Imprest Fund Guidelines', 'PWD Cash Book Regulations'],
      assumptions: ['All cash disbursements are backed by physical receipts or voucher chits'],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Record Cash Received (Credit)',
        instruction: 'Click "+ Add Transaction", select "Cash Received", enter amount and head office voucher reference.',
      },
      {
        step: 2,
        title: 'Record Site Expense (Debit)',
        instruction: 'Select "Cash Expense", choose category (Binding Wire, Van Fare, Tea/Snacks) and party/receiver.',
      },
      {
        step: 3,
        title: 'Monitor Cash in Hand',
        instruction: 'Check the real-time balance widget to ensure adequate cash remains for daily emergencies.',
      },
      {
        step: 4,
        title: 'Export for Head Office Audit',
        instruction: 'Click "Print Statement" or "Export CSV" to submit verified expense vouchers for reimbursement.',
      },
    ],
    proTipsAndBestPractices: [
      'Voucher Chits: Staple all physical taxi/van chits, tea bills, and hardware receipts to a numbered sheet matching the voucher ID.',
    ],
    limitationsAndNotes: ['For major material purchases (> ৳25,000), use formal purchase orders rather than site petty cash.'],
  },

  // =========================================================================
  // 31. CONCRETE CUBE TEST REGISTER (SM-08)
  // =========================================================================
  'cube-tests': {
    id: 'cube-tests',
    title: 'Concrete Pour & Cube/Cylinder Crushing Register (কিউব টেস্ট)',
    shortLabel: 'Cube Test Register',
    discipline: 'Site Management & Field ERP',
    standardUsed: 'ASTM C39 / BS EN 12390-3 / BNBC 2020 Part 6',
    overview:
      'Quality assurance database logging every concrete casting pour. Automatically calculates mandatory 7-Day and 28-Day crushing test dates, records compressive crushing strengths (MPa/psi), computes Demand-Capacity Ratios (DCR), and evaluates Pass/Fail acceptance.',
    capabilities: [
      'Pour event logging with Concrete Grade (M15 to M45 / 2000 to 6000 psi), slump test (mm), and structural element',
      'Automated scheduling of 7-Day (65-75% target) and 28-Day (100% target) test dates',
      'Crushing test strength logger with instant Pass/Fail status determination',
      'Printable A4 Concrete Quality & Cube Crushing Test Certificate with lab sign-off blocks',
    ],
    howItWorks: {
      methodology:
        'Compares tested compressive crushing strength $f_c$ against the characteristic specified strength $f\'_c$. Enforces standard acceptance: 7-day strength must achieve $\\ge 67\\%$ of target and 28-day must achieve $\\ge 100\\%$.',
      governingEquations: [
        {
          name: 'Compressive Strength DCR',
          formula: 'DCR = f_{tested} / f_{target}',
          description: 'Ratio of tested crushing strength to target design grade (Pass if DCR ≥ 1.0).',
        },
        {
          name: 'Expected 7-Day Strength Benchmark',
          formula: 'f_{c,7} \\approx 0.67 \\times f\'_c',
          description: 'Standard hydration benchmark for ordinary Portland cement concrete.',
        },
      ],
      codeStandards: ['ASTM C39 (Compressive Strength of Cylindrical Concrete)', 'BS EN 12390-3 (Compressive Strength of Cubes)', 'BNBC 2020 Section 5.6'],
      assumptions: ['Specimens are cured in standard water tanks at 23°C ± 2°C in accordance with ASTM C31'],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Log Concrete Casting Event',
        instruction: 'Click "+ Log New Pour". Enter structural element (e.g. 5th Floor Slab & Beams), concrete grade, and slump.',
      },
      {
        step: 2,
        title: 'Observe Scheduled Test Dates',
        instruction: 'The system automatically calculates 7-day and 28-day target testing calendar dates.',
      },
      {
        step: 3,
        title: 'Input Crushing Machine Results',
        instruction: 'Upon crushing in the universal testing machine, click "Record Test" to log breaking strength in MPa.',
      },
      {
        step: 4,
        title: 'Export QA/QC Certificate',
        instruction: 'Click "QA Certificate" to print the official test submittal for structural consultant approval.',
      },
    ],
    proTipsAndBestPractices: [
      'Slump Tolerance: Verify concrete slump within 15 minutes of truck arrival. Slumps outside design specs (e.g. > 150mm for unplasticized mix) indicate excess water and must be rejected.',
    ],
    limitationsAndNotes: ['If 28-day strength fails, non-destructive rebound hammer (Schmidt) or core drilling (ASTM C42) is required.'],
  },

  // =========================================================================
  // 32. 1-CLICK DAILY PROGRESS REPORT (SM-09)
  // =========================================================================
  'daily-progress-report': {
    id: 'daily-progress-report',
    title: '1-Click Daily Progress Report (DPR) Aggregator (ডেইলি প্রগ্রেস রিপোর্ট)',
    shortLabel: '1-Click DPR',
    discipline: 'Site Management & Field ERP',
    standardUsed: 'Standard Consulting Engineer Daily Progress Reporting',
    overview:
      'Master jobsite progress aggregator. Synthesizes daily labor headcount by trade from the Muster Roll, material arrivals and issues from the Store Ledger, concrete casting events from the Schedule, and petty cash expenses into an official printable A4 Daily Progress Report.',
    capabilities: [
      '1-Click automated data aggregation across all 8 other Site Management modules',
      'Weather and site operational conditions picker (Sunny, Rainy, Overcast, Temp)',
      'Labor deployment breakdown by trade (Masons, Helpers, Bar Benders, Carpenters)',
      'Material deliveries (Challans) and site issues log for the selected day',
      'Printable official A4 DPR with consultant, client, and project manager sign-offs',
    ],
    howItWorks: {
      methodology:
        'Executes date-indexed cross-queries across localStorage tables (SiteWorkers, StoreLedger, MilestoneTasks, PettyCash, CubeTests) to automatically compile a cohesive daily construction digest without manual re-typing.',
      governingEquations: [
        {
          name: 'Daily Labor Headcount',
          formula: 'TotalHeadcount = \\sum Workers_{Present, Day} + 0.5 \\times \\sum Workers_{HalfDay, Day}',
          description: 'Total active workforce deployed on site on the report date.',
        },
      ],
      codeStandards: ['FIDIC Sub-Clause 4.21 (Progress Reports)', 'PWD Daily Report Standards'],
      assumptions: ['All site transactions for the day have been logged into their respective modules'],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Select Report Date',
        instruction: 'Use the date picker or previous/next day buttons to choose the target progress report date.',
      },
      {
        step: 2,
        title: 'Verify Site Conditions',
        instruction: 'Select weather (Sunny, Rainy, Overcast) and enter ambient temperature and general site status.',
      },
      {
        step: 3,
        title: 'Review Auto-Compiled Sections',
        instruction: 'Review labor headcount, material deliveries, casting milestones, and expenses auto-filled by the engine.',
      },
      {
        step: 4,
        title: 'Generate Official DPR PDF',
        instruction: 'Click "Generate Official DPR (PDF)" to preview and print the executive A4 daily submittal.',
      },
    ],
    proTipsAndBestPractices: [
      'Evening Submission: Finalize and sign the DPR before 6:30 PM each evening to submit to the Project Director and Client.',
    ],
    limitationsAndNotes: ['DPR compiles historical snapshots based on the specific selected calendar date.'],
  },
};

/**
 * Intelligent, Scalable Fallback Helper:
 * Retrieves documentation by ID. If a tool was added in the future and does not yet have
 * an explicit entry in `TOOL_DOCUMENTATION`, dynamically constructs a comprehensive,
 * structured, and context-aware guide using the tool's registry entry and metadata.
 */
export function getToolDocumentation(
  toolId: string,
  fallbackMeta?: Partial<ToolDocumentation> & {
    title?: string;
    category?: string;
    standardUsed?: string;
    description?: string;
  }
): ToolDocumentation {
  if (TOOL_DOCUMENTATION[toolId]) {
    return TOOL_DOCUMENTATION[toolId];
  }

  // Lookup in tool registry if available
  const registryEntry: ToolRegistryEntry | undefined = TOOL_REGISTRY_MAP[toolId];
  const title = fallbackMeta?.title || registryEntry?.title || toolId.replace(/-/g, ' ').toUpperCase();
  const shortLabel = fallbackMeta?.shortLabel || registryEntry?.shortLabel || title;
  const discipline = fallbackMeta?.discipline || registryEntry?.category || 'Civil Engineering';
  const standardUsed = fallbackMeta?.standardUsed || registryEntry?.standardUsed || 'BNBC 2020 / ACI 318 / International Standards';
  const overview =
    fallbackMeta?.overview ||
    registryEntry?.description ||
    `The ${title} is a specialized civil engineering calculation module in PB CivilLab designed to provide verified, rigorous analytical solutions conforming to current building codes and engineering best practices.`;

  return {
    id: toolId,
    title,
    shortLabel,
    discipline,
    standardUsed,
    overview,
    capabilities: [
      `Computes primary engineering design metrics and serviceability criteria for ${title}`,
      `Applies code-governed formulations conforming to ${standardUsed}`,
      `Performs interactive parameter validation, unit conversions, and capacity utilization checks`,
      `Generates real-time analytical schedules with instant CSV and certified PDF export capabilities`,
    ],
    howItWorks: {
      methodology: `This module implements established deterministic civil engineering formulations calibrated against ${standardUsed}. Applied boundary conditions, load configurations, and material characteristics are evaluated through verified numerical equations to guarantee structural and geotechnical safety.`,
      governingEquations: [
        {
          name: 'Governing Equilibrium & Capacity Formulation',
          formula: 'Demand (Applied Load) ≤ Capacity (Allowable Code Resistance)',
          description: 'Fundamental limit states and allowable stress design equilibrium check.',
        },
      ],
      codeStandards: [standardUsed, 'BNBC 2020 (Bangladesh National Building Code)', 'ACI / ASTM / International Standards'],
      assumptions: [
        'Inputs conform to standard dimensional and material engineering tolerances',
        'Calculations assume nominal environmental exposure unless otherwise specified',
      ],
    },
    stepByStepUsage: [
      {
        step: 1,
        title: 'Review Input Parameters',
        instruction: `Carefully enter the required geometry, material grades, and design loads in the input panel for ${title}.`,
      },
      {
        step: 2,
        title: 'Select Desired Units',
        instruction: 'Use the integrated unit selectors to switch seamlessly between Metric (SI) and US Customary / Regional units.',
      },
      {
        step: 3,
        title: 'Inspect Capacity Utilization (DCR)',
        instruction: 'Verify that the Demand-Capacity Ratio (DCR) gauge indicates a nominal green status (< 100%).',
      },
      {
        step: 4,
        title: 'Export Verified Submittals',
        instruction: 'Click "Export PDF Report" or "Export Excel (CSV)" to download client-ready, certified engineering submittals.',
      },
    ],
    proTipsAndBestPractices: [
      'Always cross-verify material specifications against project geotechnical and structural drawings.',
      'Check that units are consistently applied throughout the calculation workflow.',
      'Save important calculations to the persistent History Ledger for future project auditing and documentation.',
    ],
    limitationsAndNotes: [
      `Results generated by ${title} should be reviewed by a licensed Professional Engineer (PE / SE) prior to construction execution.`,
    ],
  };
}
