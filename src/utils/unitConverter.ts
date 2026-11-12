import { CustomUnitDefinition, UnitCategoryKey } from '../types/civil';

export interface UnitInfo {
  id: string;
  name: string;
  symbol: string;
  category: UnitCategoryKey;
  toBaseFactor: number; // Linear multiplier to reach canonical Base unit
  toBase?: (val: number) => number; // Optional exact functional/affine transformation to canonical Base
  fromBase?: (baseVal: number) => number; // Optional exact functional/affine transformation from canonical Base
  description: string;
  isRegional?: boolean;
  system: 'metric' | 'imperial' | 'regional' | 'universal';
  bengaliName?: string;
  bengaliSymbol?: string;
  aliases?: string[];
}

/**
 * High-precision floating-point rounding mitigation
 */
export function cleanPrecision(val: number, precision: number = 10): number {
  if (isNaN(val) || !isFinite(val)) return val;
  const factor = Math.pow(10, precision);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * EXACT PHYSICAL CONVERSION FACTORS (derived from SI definitions & NIST SP 811)
 * Zero truncation or hardcoded drift
 */
export const EXACT_CONVERSION = {
  // Volume: 1 ft = 0.3048 m => 1 cft = 0.3048^3 m3
  CFT_TO_M3: 0.028316846592,
  M3_TO_CFT: 1 / 0.028316846592, // ~35.31466672148859
  IN3_TO_M3: 0.000016387064,
  YD3_TO_M3: 0.764554857984,
  LITER_TO_M3: 0.001,
  GAL_US_TO_M3: 0.003785411784,
  GAL_UK_TO_M3: 0.00454609,
  BBL_TO_M3: 0.158987294928,
  FL_OZ_US_TO_M3: 0.0000295735295625,

  // Area: 1 sft = 0.3048^2 m2 = 0.09290304 m2
  SFT_TO_M2: 0.09290304,
  M2_TO_SFT: 1 / 0.09290304, // ~10.763910416709722
  IN2_TO_M2: 0.00064516,
  YD2_TO_M2: 0.83612736,
  ACRE_TO_M2: 4046.8564224, // 43,560 sq ft * 0.09290304
  HECTARE_TO_M2: 10000.0,
  ARE_TO_M2: 100.0,
  SQMI_TO_M2: 2589988.110336, // 640 acres

  // South Asian Regional Land Units (Exact Mathematical Formulations based on 435.6 sq ft/decimal):
  DECIMAL_TO_M2: 40.468564224, // 1/100 Acre = 435.6 sq ft
  KATHA_TO_M2: 66.8901888,     // 720 sq ft (Bengal Standard = 1.65289 Decimals)
  BIGHA_TO_M2: 1337.803776,    // 20 Kathas = 14,400 sq ft (Standard Bengal Bigha)
  KANI_TO_M2: 1605.3645312,    // 1 Kani = 17,280 sq ft = 20 Gondas = 39.67 Decimals (Sylhet/Ctg 40 Decimal standard)
  KANI_SHAHI_TO_M2: 4856.22770688, // 1 Shahi Kani (Chattogram/Noakhali) = 120 Decimals = 52,272 sq ft
  CENT_TO_M2: 40.468564224,    // 435.6 sq ft (1/100 Acre - South India)
  GUNTHA_TO_M2: 101.17141056,  // 1/40 Acre = 1,089 sq ft (33 ft × 33 ft)
  GROUND_TO_M2: 222.967296,    // 2,400 sq ft (Tamil Nadu standard)
  KANAL_TO_M2: 505.8570528,    // 1/8 Acre = 20 Marlas = 5,445 sq ft
  MARLA_TO_M2: 25.29285264,    // 1/160 Acre = 272.25 sq ft
  GANDA_TO_M2: 20.06705664,    // 216 sq ft
  GONDA_TO_M2: 80.26822656,    // 1 Gonda (1/20 Kani) = 864 sq ft = 1.983 Decimals = 80.268 m²
  CHHATAK_TO_M2: 4.1806368,    // 45 sq ft = 1/16 Katha = 1.033 Decimal
  KARA_TO_M2: 20.06705664,     // 216 sq ft (4 Karas = 1 Gonda in regional 864 sq ft system)
  KRANTI_TO_M2: 6.68901888,    // 1 Kranti = 1/3 Kara = 72 sq ft = 6.689 m²
  TIL_TO_M2: 0.334450944,      // 1 Til = 1/20 Kranti = 3.6 sq ft
  DHUR_TO_M2: 0.334450944,     // 1 Dhur = 3.6 sq ft

  // Length: 1 ft = 0.3048 m, 1 in = 0.0254 m, 1 suta = 1/8 in = 3.175 mm
  FT_TO_M: 0.3048,
  M_TO_FT: 1 / 0.3048, // ~3.2808398950131233
  IN_TO_M: 0.0254,
  M_TO_IN: 1 / 0.0254, // ~39.37007874015748
  SUTA_TO_M: 0.003175, // 1/8 inch = 3.175 mm
  M_TO_SUTA: 1 / 0.003175,
  YD_TO_M: 0.9144,
  MI_TO_M: 1609.344,
  NMI_TO_M: 1852.0,
  CHAIN_TO_M: 20.1168, // 66 ft (Gunter's Survey Chain)
  LINK_TO_M: 0.201168, // 7.92 in (1/100 chain)
  FATHOM_TO_M: 1.8288, // 6 ft
  ROD_TO_M: 5.0292,    // 16.5 ft (Perch / Pole)
  FURLONG_TO_M: 201.168, // 660 ft
  HAAT_TO_M: 0.4572,   // 18 in = 1.5 ft
  GAJ_TO_M: 0.9144,    // 3 ft = 1 Yard
  ANGUL_TO_M: 0.01905, // 0.75 in (Traditional finger width)

  // Volume: Cement bag nominal batch volume = 1.25 cft = 0.03539605824 m3 (BNBC/PWD standard)
  BAG_CEMENT_VOL_M3: 1.25 * 0.028316846592,

  // Force & Stress
  KN_TO_N: 1000,
  N_TO_KN: 0.001,
  MN_TO_N: 1000000,
  LBF_TO_N: 4.4482216152605,
  KIP_TO_N: 4448.2216152605,
  KGF_TO_N: 9.80665,
  TONF_TO_N: 9806.65,
  TONF_US_TO_N: 8896.44323,
  DYN_TO_N: 1e-5,
  POUNDAL_TO_N: 0.138255,

  // Pressure & Stress: Base unit = Pascal (Pa = N/m²)
  MPA_TO_PA: 1000000,
  PA_TO_MPA: 1e-6,
  KPA_TO_PA: 1000,
  PA_TO_KPA: 0.001,
  GPA_TO_PA: 1000000000,
  PA_TO_GPA: 1e-9,
  PSI_TO_PA: 6894.757293168361,
  KSI_TO_PA: 6894757.293168361,
  PSF_TO_PA: 47.88025898033584,
  TSF_TO_PA: 95760.51796067168,
  BAR_TO_PA: 100000,
  MBAR_TO_PA: 100,
  ATM_TO_PA: 101325,
  KGF_CM2_TO_PA: 98066.5,
  TF_M2_TO_PA: 9806.65,
  MMHG_TO_PA: 133.322387415,
  INHG_TO_PA: 3386.389,
  MMH2O_TO_PA: 9.80665,
  MH2O_TO_PA: 9806.65,
  FTH2O_TO_PA: 2989.06692,

  // Moment: 1 kip.ft = 4448.2216152605 N * 0.3048 m = 1355.8179483314022 N.m
  KIP_FT_TO_NM: 1355.8179483314022,
  NM_TO_KIP_FT: 1 / 1355.8179483314022,
  KNM_TO_NM: 1000,
  NM_TO_KNM: 0.001,

  // Mass: Base unit = kg
  LB_TO_KG: 0.45359237,
  KG_TO_LB: 1 / 0.45359237,
  OZ_TO_KG: 0.028349523125,
  TONNE_TO_KG: 1000,
  KG_TO_TONNE: 0.001,
  TON_US_TO_KG: 907.18474,
  TON_UK_TO_KG: 1016.0469088,
  SLUG_TO_KG: 14.5939029,
  CEMENT_BAG_KG: 50.0,
  MAUND_TO_KG: 37.32417216,
  SEER_TO_KG: 0.933104304,
  CHHATAK_WT_TO_KG: 0.058319019,
  TOLA_TO_KG: 0.0116638038,
  ANA_TO_KG: 0.0116638038 / 16,
  RATI_TO_KG: 0.0116638038 / 96,
  CARAT_TO_KG: 0.0002,

  // Velocity: Base unit = m/s
  FTS_TO_MPS: 0.3048,
  KMH_TO_MPS: 1 / 3.6,
  MPH_TO_MPS: 0.44704,
  KNOT_TO_MPS: 0.5144444444444445,
  MMS_TO_MPS: 0.001,
  INS_TO_MPS: 0.0254,
  MACH_TO_MPS: 340.29,

  // Flow Rate: Base unit = m³/s
  CFS_TO_M3S: 0.028316846592,
  LPS_TO_M3S: 0.001,
  LPM_TO_M3S: 0.001 / 60,
  M3_HR_TO_M3S: 1 / 3600,
  GPM_TO_M3S: 0.0000630901964,
  GPM_UK_TO_M3S: 0.0000757681667,
  MGD_TO_M3S: 0.04381263638888889,
  ML_DAY_TO_M3S: 1000 / 86400,
  CFM_TO_M3S: 0.0004719474432,

  // Energy: Base unit = Joule (J)
  KJ_TO_J: 1000,
  MJ_TO_J: 1e6,
  GJ_TO_J: 1e9,
  WH_TO_J: 3600,
  KWH_TO_J: 3.6e6,
  MWH_TO_J: 3.6e9,
  CAL_TO_J: 4.184,
  KCAL_TO_J: 4184,
  BTU_TO_J: 1055.05585262,
  THERM_TO_J: 105480400,
  FT_LBF_TO_J: 1.3558179483314004,
  EV_TO_J: 1.602176634e-19,

  // Power: Base unit = Watt (W)
  KW_TO_W: 1000,
  MW_TO_W: 1e6,
  HP_TO_W: 745.6998715822702,
  HP_METRIC_TO_W: 735.49875,
  BTU_HR_TO_W: 0.29307107,
  TR_TO_W: 3516.85284,
  KCAL_HR_TO_W: 1.163,

  // Typography & CAD: Base unit = mm
  POINT_TO_MM: 25.4 / 72,
  PICA_TO_MM: 25.4 / 6,
  PX96_TO_MM: 25.4 / 96,
  PX300_TO_MM: 25.4 / 300,
  TWIP_TO_MM: 25.4 / 1440,
} as const;

/**
 * Canonical Base SI Units for all 21 Disciplines
 */
export const BASE_UNITS: Record<UnitCategoryKey, string> = {
  length: 'm',
  area: 'm2',
  volume: 'm3',
  mass: 'kg',
  force: 'N',
  distributed_load: 'N/m',
  pressure: 'Pa',
  density: 'kN/m3',
  moment: 'N.m',
  slope: 'ratio',
  velocity: 'm/s',
  flow_rate: 'm3/s',
  section_properties: 'mm4',
  viscosity: 'Pa.s',
  temperature: 'k',
  energy: 'J',
  power: 'W',
  time_frequency: 's',
  digital_storage: 'B',
  fuel_economy: 'km_l',
  cad_typography: 'mm',
};

/**
 * Standard Units Catalog with verified physical multipliers and exact functional formulas
 */
export const STANDARD_UNITS: Record<UnitCategoryKey, UnitInfo[]> = {
  length: [
    { id: 'm', name: 'Meter', symbol: 'm', category: 'length', toBaseFactor: 1.0, description: 'SI base unit of length', system: 'metric', bengaliName: 'মিটার', bengaliSymbol: 'মি.' },
    { id: 'mm', name: 'Millimeter', symbol: 'mm', category: 'length', toBaseFactor: 0.001, description: 'Drafting & reinforcement rebar unit (1 m = 1000 mm)', system: 'metric', bengaliName: 'মিলিমিটার', bengaliSymbol: 'মিমি' },
    { id: 'cm', name: 'Centimeter', symbol: 'cm', category: 'length', toBaseFactor: 0.01, description: 'Metric length unit (1 m = 100 cm)', system: 'metric', bengaliName: 'সেন্টিমিটার', bengaliSymbol: 'সেমি' },
    { id: 'dm', name: 'Decimeter', symbol: 'dm', category: 'length', toBaseFactor: 0.1, description: 'Metric decimeter (0.1 m)', system: 'metric' },
    { id: 'km', name: 'Kilometer', symbol: 'km', category: 'length', toBaseFactor: 1000.0, description: 'Highway alignment & chainage (1000 m)', system: 'metric', bengaliName: 'কিলোমিটার', bengaliSymbol: 'কিমি' },
    { id: 'in', name: 'Inch', symbol: 'in', category: 'length', toBaseFactor: EXACT_CONVERSION.IN_TO_M, description: 'Imperial architectural inch (25.4 mm)', system: 'imperial', bengaliName: 'ইঞ্চি', bengaliSymbol: 'ইঞ্চি' },
    { id: 'ft', name: 'Foot', symbol: 'ft', category: 'length', toBaseFactor: EXACT_CONVERSION.FT_TO_M, description: 'Imperial architectural foot (12 in = 0.3048 m)', system: 'imperial', bengaliName: 'ফুট / ফিট', bengaliSymbol: 'ফুট' },
    { id: 'suta', name: 'Suta (সুতা / 1/8 inch)', symbol: 'suta', category: 'length', toBaseFactor: EXACT_CONVERSION.SUTA_TO_M, description: 'Bangladesh site rebar/timber unit (1 in = 8 suta = 3.175 mm)', isRegional: true, system: 'regional', bengaliName: 'সুতা / সূত', bengaliSymbol: 'সুতা' },
    { id: 'haat', name: 'Haat / Cubit (হাত = 18 in)', symbol: 'haat', category: 'length', toBaseFactor: EXACT_CONVERSION.HAAT_TO_M, description: 'Traditional Bengali land length (1 Haat = 18 in = 1.5 ft = 0.4572 m)', isRegional: true, system: 'regional', bengaliName: 'হাত', bengaliSymbol: 'হাত' },
    { id: 'gaj', name: 'Gaj / Yard (গজ = 3 ft)', symbol: 'gaj', category: 'length', toBaseFactor: EXACT_CONVERSION.GAJ_TO_M, description: 'Traditional Bengali yard (1 Gaj = 3 ft = 36 in = 0.9144 m)', isRegional: true, system: 'regional', bengaliName: 'গজ', bengaliSymbol: 'গজ' },
    { id: 'angul', name: 'Angul (আঙুল = 0.75 in)', symbol: 'angul', category: 'length', toBaseFactor: EXACT_CONVERSION.ANGUL_TO_M, description: 'Traditional finger breadth (1 Angul = 0.75 in = 19.05 mm)', isRegional: true, system: 'regional', bengaliName: 'আঙুল', bengaliSymbol: 'আঙুল' },
    { id: 'yd', name: 'Yard', symbol: 'yd', category: 'length', toBaseFactor: EXACT_CONVERSION.YD_TO_M, description: 'Survey yard (3 ft = 0.9144 m)', system: 'imperial' },
    { id: 'mi', name: 'Statute Mile', symbol: 'mi', category: 'length', toBaseFactor: EXACT_CONVERSION.MI_TO_M, description: 'Statute road mile (5,280 ft = 1,609.344 m)', system: 'imperial' },
    { id: 'nmi', name: 'Nautical Mile', symbol: 'nmi', category: 'length', toBaseFactor: EXACT_CONVERSION.NMI_TO_M, description: 'Maritime nautical mile (1,852 m)', system: 'universal' },
    { id: 'um', name: 'Micrometer (µm)', symbol: 'µm', category: 'length', toBaseFactor: 1e-6, description: 'Micron for grain size and coating thickness (10⁻⁶ m)', system: 'metric' },
    { id: 'mil', name: 'Mil / Thou (0.001 in)', symbol: 'mil', category: 'length', toBaseFactor: 0.0000254, description: '1/1000 inch for membrane / geomembrane thickness', system: 'imperial' },
    { id: 'fathom', name: 'Fathom (6 ft)', symbol: 'fath', category: 'length', toBaseFactor: EXACT_CONVERSION.FATHOM_TO_M, description: 'Marine/hydraulics sounding depth (6 ft = 1.8288 m)', system: 'imperial' },
    { id: 'furlong', name: 'Furlong (660 ft)', symbol: 'fur', category: 'length', toBaseFactor: EXACT_CONVERSION.FURLONG_TO_M, description: 'Traditional survey distance (660 ft = 201.168 m = 1/8 mile)', system: 'imperial' },
    { id: 'chain', name: "Gunter's Chain (66 ft)", symbol: 'ch', category: 'length', toBaseFactor: EXACT_CONVERSION.CHAIN_TO_M, description: 'Cadastral survey chain (66 ft = 20.1168 m = 100 links)', system: 'imperial' },
    { id: 'link', name: 'Survey Link (7.92 in)', symbol: 'li', category: 'length', toBaseFactor: EXACT_CONVERSION.LINK_TO_M, description: 'Cadastral link (7.92 in = 0.201168 m = 1/100 chain)', system: 'imperial' },
    { id: 'rod', name: 'Rod / Pole / Perch (16.5 ft)', symbol: 'rd', category: 'length', toBaseFactor: EXACT_CONVERSION.ROD_TO_M, description: 'Survey rod (16.5 ft = 5.0292 m)', system: 'imperial' },
    { id: 'rft', name: 'Running Foot (RFT)', symbol: 'rft', category: 'length', toBaseFactor: EXACT_CONVERSION.FT_TO_M, description: 'Linear construction takeoff foot (0.3048 m)', system: 'imperial' },
    { id: 'rm', name: 'Running Meter (RMT)', symbol: 'rm', category: 'length', toBaseFactor: 1.0, description: 'Linear construction takeoff meter', system: 'metric' },
    { id: 'ft-in', name: 'Feet-Inch (Arch / Site)', symbol: `ft'-in"`, category: 'length', toBaseFactor: EXACT_CONVERSION.FT_TO_M, description: `Architectural composite notation (e.g. 12'-6" or 12' 6" 4 suta)`, system: 'imperial' },
  ],
  area: [
    { id: 'm2', name: 'Square Meter', symbol: 'm²', category: 'area', toBaseFactor: 1.0, description: 'SI base unit of area', system: 'metric', bengaliName: 'বর্গমিটার', bengaliSymbol: 'বর্গমি.' },
    { id: 'mm2', name: 'Square Millimeter', symbol: 'mm²', category: 'area', toBaseFactor: 1e-6, description: 'Steel cross-section area (As)', system: 'metric' },
    { id: 'cm2', name: 'Square Centimeter', symbol: 'cm²', category: 'area', toBaseFactor: 1e-4, description: 'Metric section area', system: 'metric' },
    { id: 'km2', name: 'Square Kilometer', symbol: 'km²', category: 'area', toBaseFactor: 1e6, description: 'Catchment / watershed area (1 km² = 100 ha)', system: 'metric', bengaliName: 'বর্গকিলোমিটার', bengaliSymbol: 'বর্গকিমি' },
    { id: 'ha', name: 'Hectare', symbol: 'ha', category: 'area', toBaseFactor: EXACT_CONVERSION.HECTARE_TO_M2, description: '10,000 m² cadastre parcel (2.471 acres = 247.1 decimals)', system: 'metric', bengaliName: 'হেক্টর', bengaliSymbol: 'হে.' },
    { id: 'are', name: 'Are', symbol: 'a', category: 'area', toBaseFactor: EXACT_CONVERSION.ARE_TO_M2, description: '100 m² metric land parcel (0.01 ha)', system: 'metric' },
    { id: 'in2', name: 'Square Inch', symbol: 'sq in', category: 'area', toBaseFactor: EXACT_CONVERSION.IN2_TO_M2, description: 'Imperial rebar area', system: 'imperial' },
    { id: 'ft2', name: 'Square Foot (SFT)', symbol: 'sq ft', category: 'area', toBaseFactor: EXACT_CONVERSION.SFT_TO_M2, description: 'Floor & slab plan area (0.092903 m²)', system: 'imperial', bengaliName: 'বর্গফুট / এসএফটি', bengaliSymbol: 'বর্গফুট' },
    { id: 'yd2', name: 'Square Yard', symbol: 'sq yd', category: 'area', toBaseFactor: EXACT_CONVERSION.YD2_TO_M2, description: 'Pavement surface area (9 sq ft)', system: 'imperial' },
    { id: 'acre', name: 'International Acre', symbol: 'ac', category: 'area', toBaseFactor: EXACT_CONVERSION.ACRE_TO_M2, description: '43,560 sq ft land parcel (4046.856 m² = 100 decimals)', system: 'imperial', bengaliName: 'একর', bengaliSymbol: 'একর' },
    { id: 'sqmi', name: 'Square Mile', symbol: 'sq mi', category: 'area', toBaseFactor: EXACT_CONVERSION.SQMI_TO_M2, description: '640 acres watershed area (2.59 km²)', system: 'imperial' },

    // South Asian Regional Land Units (Authoritative standards):
    { id: 'decimal', name: 'Decimal / Shatak (শতক / ডেসিমাল)', symbol: 'dec', category: 'area', toBaseFactor: EXACT_CONVERSION.DECIMAL_TO_M2, description: '1/100 Acre = 435.6 sq ft = 40.4686 m²', isRegional: true, system: 'regional', bengaliName: 'শতাংশ / শতক / ডেসিমাল', bengaliSymbol: 'শতক' },
    { id: 'katha', name: 'Katha (কাঠা / Bengal Standard)', symbol: 'katha', category: 'area', toBaseFactor: EXACT_CONVERSION.KATHA_TO_M2, description: '720 sq ft = 1.65289 Decimals = 66.8902 m²', isRegional: true, system: 'regional', bengaliName: 'কাঠা', bengaliSymbol: 'কাঠা' },
    { id: 'bigha', name: 'Bigha (বিঘা / Standard Bengal)', symbol: 'bigha', category: 'area', toBaseFactor: EXACT_CONVERSION.BIGHA_TO_M2, description: '20 Kathas = 14,400 sq ft = 33.0579 Decimals = 1,337.80 m²', isRegional: true, system: 'regional', bengaliName: 'বিঘা', bengaliSymbol: 'বিঘা' },
    { id: 'chhatak', name: 'Chattak (ছটাক)', symbol: 'chhatak', category: 'area', toBaseFactor: EXACT_CONVERSION.CHHATAK_TO_M2, description: '1/16 Katha = 45 sq ft = 1.033 Decimal = 4.1806 m²', isRegional: true, system: 'regional', bengaliName: 'ছটাক', bengaliSymbol: 'ছটাক' },
    { id: 'kani', name: 'Kani (কানি / Sylhet & Ctg Standard)', symbol: 'kani', category: 'area', toBaseFactor: EXACT_CONVERSION.KANI_TO_M2, description: '1 Kani = 17,280 sq ft = 20 Gondas = 39.67 Decimals = 1,605.36 m²', isRegional: true, system: 'regional', bengaliName: 'কানি (স্ট্যান্ডার্ড)', bengaliSymbol: 'কানি' },
    { id: 'kani_shahi', name: 'Shahi Kani (শাহী কানি - নোয়াখালী/চট্টগ্রাম)', symbol: 'shahi_kani', category: 'area', toBaseFactor: EXACT_CONVERSION.KANI_SHAHI_TO_M2, description: '1 Shahi Kani = 120 Decimals = 52,272 sq ft = 4,856.23 m²', isRegional: true, system: 'regional', bengaliName: 'শাহী কানি (১২০ শতক)', bengaliSymbol: 'শাহী কানি' },
    { id: 'gonda', name: 'Gonda (গণ্ডা / 1/20 Kani)', symbol: 'gonda', category: 'area', toBaseFactor: EXACT_CONVERSION.GONDA_TO_M2, description: '864 sq ft = 4 Karas = 1.983 Decimals = 80.268 m²', isRegional: true, system: 'regional', bengaliName: 'গণ্ডা', bengaliSymbol: 'গণ্ডা' },
    { id: 'kara', name: 'Kara (কড়া)', symbol: 'kara', category: 'area', toBaseFactor: EXACT_CONVERSION.KARA_TO_M2, description: '216 sq ft = 1/4 Gonda = 0.4958 Decimal = 20.067 m²', isRegional: true, system: 'regional', bengaliName: 'কড়া', bengaliSymbol: 'কড়া' },
    { id: 'kranti', name: 'Kranti (ক্রান্তি / 1/3 Kara)', symbol: 'kranti', category: 'area', toBaseFactor: EXACT_CONVERSION.KRANTI_TO_M2, description: '72 sq ft = 1/3 Kara = 6.689 m²', isRegional: true, system: 'regional', bengaliName: 'ক্রান্তি', bengaliSymbol: 'ক্রান্তি' },
    { id: 'til', name: 'Til (তিল / 1/20 Kranti)', symbol: 'til', category: 'area', toBaseFactor: EXACT_CONVERSION.TIL_TO_M2, description: '3.6 sq ft = 1/20 Kranti = 0.3345 m²', isRegional: true, system: 'regional', bengaliName: 'তিল', bengaliSymbol: 'তিল' },
    { id: 'dhur', name: 'Dhur (ধূর)', symbol: 'dhur', category: 'area', toBaseFactor: EXACT_CONVERSION.DHUR_TO_M2, description: '3.6 sq ft subcontinental cadastre unit = 0.3345 m²', isRegional: true, system: 'regional', bengaliName: 'ধূর', bengaliSymbol: 'ধূর' },
    { id: 'cent', name: 'Cent (South India)', symbol: 'cent', category: 'area', toBaseFactor: EXACT_CONVERSION.CENT_TO_M2, description: '1/100 Acre = 435.6 sq ft (Kerala / Tamil Nadu)', isRegional: true, system: 'regional' },
    { id: 'guntha', name: 'Guntha (Gunta)', symbol: 'guntha', category: 'area', toBaseFactor: EXACT_CONVERSION.GUNTHA_TO_M2, description: '1/40 Acre = 1,089 sq ft (33 ft × 33 ft - MH/GJ/KA)', isRegional: true, system: 'regional' },
    { id: 'ground', name: 'Ground (Tamil Nadu)', symbol: 'ground', category: 'area', toBaseFactor: EXACT_CONVERSION.GROUND_TO_M2, description: 'Standard South Indian land unit = 2,400 sq ft = 222.97 m²', isRegional: true, system: 'regional' },
    { id: 'kanal', name: 'Kanal (North India)', symbol: 'kanal', category: 'area', toBaseFactor: EXACT_CONVERSION.KANAL_TO_M2, description: '1/8 Acre = 20 Marlas = 5,445 sq ft (Punjab/Haryana/J&K)', isRegional: true, system: 'regional' },
    { id: 'marla', name: 'Marla (Standard)', symbol: 'marla', category: 'area', toBaseFactor: EXACT_CONVERSION.MARLA_TO_M2, description: '1/160 Acre = 272.25 sq ft = 25.2929 m²', isRegional: true, system: 'regional' },
  ],
  volume: [
    { id: 'm3', name: 'Cubic Meter', symbol: 'm³', category: 'volume', toBaseFactor: 1.0, description: 'SI base volume unit', system: 'metric', bengaliName: 'ঘনমিটার (কিউমিক)', bengaliSymbol: 'মি³' },
    { id: 'mm3', name: 'Cubic Millimeter', symbol: 'mm³', category: 'volume', toBaseFactor: 1e-9, description: 'Micro-volume / aggregate porosity', system: 'metric' },
    { id: 'cm3', name: 'Cubic Centimeter (cc / mL)', symbol: 'cm³', category: 'volume', toBaseFactor: 1e-6, description: 'Fluid milliliter measure (1 cm³ = 1 mL)', system: 'metric' },
    { id: 'cft', name: 'Cubic Foot (CFT)', symbol: 'cft', category: 'volume', toBaseFactor: EXACT_CONVERSION.CFT_TO_M3, description: 'Traditional concrete/sand volume (35.315 cft/m³)', system: 'imperial', bengaliName: 'ঘনফুট (সিএফটি)', bengaliSymbol: 'সিএফটি' },
    { id: 'in3', name: 'Cubic Inch', symbol: 'cu in', category: 'volume', toBaseFactor: EXACT_CONVERSION.IN3_TO_M3, description: 'Imperial small volume (16.387 cm³)', system: 'imperial' },
    { id: 'yd3', name: 'Cubic Yard', symbol: 'cu yd', category: 'volume', toBaseFactor: EXACT_CONVERSION.YD3_TO_M3, description: 'Readymix batch transit yard (27 cft = 0.7646 m³)', system: 'imperial' },
    { id: 'liter', name: 'Liter', symbol: 'L', category: 'volume', toBaseFactor: EXACT_CONVERSION.LITER_TO_M3, description: 'Water mixing volume (1 L = 0.001 m³)', system: 'metric', bengaliName: 'লিটার', bengaliSymbol: 'লি.' },
    { id: 'ml', name: 'Milliliter', symbol: 'mL', category: 'volume', toBaseFactor: 1e-6, description: 'Admixture fluid measure (1 cm³)', system: 'metric' },
    { id: 'gal_us', name: 'US Gallon', symbol: 'US gal', category: 'volume', toBaseFactor: EXACT_CONVERSION.GAL_US_TO_M3, description: 'US liquid gallon (231 cu in = 3.7854 L)', system: 'imperial' },
    { id: 'gal_uk', name: 'Imperial Gallon', symbol: 'UK gal', category: 'volume', toBaseFactor: EXACT_CONVERSION.GAL_UK_TO_M3, description: 'UK liquid gallon (4.54609 L)', system: 'imperial' },
    { id: 'bbl', name: 'Petroleum Barrel', symbol: 'bbl', category: 'volume', toBaseFactor: EXACT_CONVERSION.BBL_TO_M3, description: 'Oil & bitumen barrel (42 US gal = 158.987 L)', system: 'imperial' },
    { id: 'fl_oz', name: 'US Fluid Ounce', symbol: 'fl oz', category: 'volume', toBaseFactor: EXACT_CONVERSION.FL_OZ_US_TO_M3, description: 'Admixture fluid ounce (29.57 mL)', system: 'imperial' },
    { id: 'brass', name: 'Cubic Brass (100 CFT)', symbol: 'brass', category: 'volume', toBaseFactor: EXACT_CONVERSION.CFT_TO_M3 * 100, description: 'South Asian aggregate & sand bulk measure (100 CFT = 2.8317 m³)', isRegional: true, system: 'regional', bengaliName: 'ব্রাস (১০০ সিএফটি)', bengaliSymbol: 'ব্রাস' },
    { id: 'truck_load', name: 'Truck Load (Std 350 CFT)', symbol: 'truck', category: 'volume', toBaseFactor: EXACT_CONVERSION.CFT_TO_M3 * 350, description: 'Standard 10-wheeler dump truck bulk earth/sand capacity (350 CFT ≈ 9.91 m³)', isRegional: true, system: 'regional', bengaliName: 'ট্রাক লোড (৩৫০ সিএফটি)', bengaliSymbol: 'ট্রাক' },
    { id: 'bag_cement', name: 'Cement Bag Volume (1.25 CFT)', symbol: 'bag', category: 'volume', toBaseFactor: EXACT_CONVERSION.BAG_CEMENT_VOL_M3, description: 'Standard cement bag volume in batching (1.25 CFT = 0.0354 m³)', isRegional: true, system: 'regional', bengaliName: 'সিমেন্ট ব্যাগ ভলিউম (১.২৫ সিএফটি)', bengaliSymbol: 'ব্যাগ' },
  ],
  mass: [
    { id: 'kg', name: 'Kilogram', symbol: 'kg', category: 'mass', toBaseFactor: 1.0, description: 'SI base mass unit', system: 'metric', bengaliName: 'কিলোগ্রাম / কেজি', bengaliSymbol: 'কেজি' },
    { id: 'g', name: 'Gram', symbol: 'g', category: 'mass', toBaseFactor: 0.001, description: 'Laboratory material mass', system: 'metric', bengaliName: 'গ্রাম', bengaliSymbol: 'গ্রাম' },
    { id: 'mg', name: 'Milligram', symbol: 'mg', category: 'mass', toBaseFactor: 1e-6, description: 'Precision chemical additive mass', system: 'metric' },
    { id: 'tonne', name: 'Metric Tonne', symbol: 'MT', category: 'mass', toBaseFactor: EXACT_CONVERSION.TONNE_TO_KG, description: '1,000 kg structural steel measure', system: 'metric', bengaliName: 'মেট্রিক টন', bengaliSymbol: 'টন' },
    { id: 'quintal', name: 'Quintal (100 kg)', symbol: 'q', category: 'mass', toBaseFactor: 100.0, description: '100 kg bulk grain/steel weight', system: 'metric', bengaliName: 'কুইন্টাল', bengaliSymbol: 'কুইন্টাল' },
    { id: 'lb', name: 'Pound (Avoirdupois)', symbol: 'lb', category: 'mass', toBaseFactor: EXACT_CONVERSION.LB_TO_KG, description: 'Imperial mass pound (0.453592 kg)', system: 'imperial', bengaliName: 'পাউন্ড', bengaliSymbol: 'পাউন্ড' },
    { id: 'oz', name: 'Ounce (Avoirdupois)', symbol: 'oz', category: 'mass', toBaseFactor: EXACT_CONVERSION.OZ_TO_KG, description: '1/16 lb (28.3495 g)', system: 'imperial' },
    { id: 'kip_mass', name: 'Kip Mass (1,000 lb)', symbol: 'kip', category: 'mass', toBaseFactor: EXACT_CONVERSION.LB_TO_KG * 1000, description: 'Imperial mass kip (453.592 kg)', system: 'imperial' },
    { id: 'ton_us', name: 'Short Ton (US 2,000 lb)', symbol: 'ton (US)', category: 'mass', toBaseFactor: EXACT_CONVERSION.TON_US_TO_KG, description: '2,000 lbs short ton (907.185 kg)', system: 'imperial' },
    { id: 'ton_uk', name: 'Long Ton (UK 2,240 lb)', symbol: 'ton (UK)', category: 'mass', toBaseFactor: EXACT_CONVERSION.TON_UK_TO_KG, description: '2,240 lbs long ton (1,016.05 kg)', system: 'imperial' },
    { id: 'slug', name: 'Slug', symbol: 'slug', category: 'mass', toBaseFactor: EXACT_CONVERSION.SLUG_TO_KG, description: 'Imperial engineering mass unit (32.174 lb = 14.5939 kg)', system: 'imperial' },
    { id: 'maund', name: 'Maund / Mon (মণ = 40 Seer)', symbol: 'mon', category: 'mass', toBaseFactor: EXACT_CONVERSION.MAUND_TO_KG, description: 'Regional agricultural/site weight (40 seers = 37.324 kg)', isRegional: true, system: 'regional', bengaliName: 'মণ', bengaliSymbol: 'মণ' },
    { id: 'seer', name: 'Seer / Sher (সের = 80 Tolas)', symbol: 'seer', category: 'mass', toBaseFactor: EXACT_CONVERSION.SEER_TO_KG, description: 'Traditional weight (0.9331 kg = 80 tolas)', isRegional: true, system: 'regional', bengaliName: 'সের', bengaliSymbol: 'সের' },
    { id: 'chhatak_wt', name: 'Weight Chatak (ছটাক ওজন = 58.32 g)', symbol: 'chhatak_wt', category: 'mass', toBaseFactor: EXACT_CONVERSION.CHHATAK_WT_TO_KG, description: 'Traditional weight chatak (1/16 Seer = 58.32 g)', isRegional: true, system: 'regional', bengaliName: 'ছটাক (ওজন)', bengaliSymbol: 'ছটাক' },
    { id: 'tola', name: 'Tola / Bhori (তোলা / ভরি = 11.66 g)', symbol: 'tola', category: 'mass', toBaseFactor: EXACT_CONVERSION.TOLA_TO_KG, description: 'Precious metal/reinforcement wire weight (11.6638 g)', isRegional: true, system: 'regional', bengaliName: 'তোলা / ভরি', bengaliSymbol: 'তোলা' },
    { id: 'ana', name: 'Ana (আনা = 1/16 Tola)', symbol: 'ana', category: 'mass', toBaseFactor: EXACT_CONVERSION.ANA_TO_KG, description: 'Sub-tola traditional weight (0.729 g)', isRegional: true, system: 'regional', bengaliName: 'আনা', bengaliSymbol: 'আনা' },
    { id: 'rati', name: 'Rati (রতি = 1/96 Tola)', symbol: 'rati', category: 'mass', toBaseFactor: EXACT_CONVERSION.RATI_TO_KG, description: 'Fine jeweller traditional weight (0.1215 g)', isRegional: true, system: 'regional', bengaliName: 'রতি', bengaliSymbol: 'রতি' },
    { id: 'carat', name: 'Carat (Diamond / Gem)', symbol: 'ct', category: 'mass', toBaseFactor: EXACT_CONVERSION.CARAT_TO_KG, description: 'Jewellery carat (0.200 g = 200 mg)', system: 'universal' },
    { id: 'bag50', name: 'Cement Bag (50 kg)', symbol: 'bag', category: 'mass', toBaseFactor: EXACT_CONVERSION.CEMENT_BAG_KG, description: 'Standard 50 kg Portland cement bag', system: 'universal', bengaliName: 'সিমেন্ট ব্যাগ (৫০ কেজি)', bengaliSymbol: 'ব্যাগ' },
  ],
  force: [
    { id: 'N', name: 'Newton', symbol: 'N', category: 'force', toBaseFactor: 1.0, description: 'SI base force unit (kg·m/s²)', system: 'metric' },
    { id: 'kN', name: 'Kilonewton', symbol: 'kN', category: 'force', toBaseFactor: EXACT_CONVERSION.KN_TO_N, description: 'Structural load & shear force (1,000 N)', system: 'metric' },
    { id: 'MN', name: 'Meganewton', symbol: 'MN', category: 'force', toBaseFactor: EXACT_CONVERSION.MN_TO_N, description: 'Bridge pier foundation reaction (1,000,000 N)', system: 'metric' },
    { id: 'dyn', name: 'Dyne', symbol: 'dyn', category: 'force', toBaseFactor: EXACT_CONVERSION.DYN_TO_N, description: 'CGS force unit (10⁻⁵ N)', system: 'metric' },
    { id: 'gf', name: 'Gram Force', symbol: 'gf', category: 'force', toBaseFactor: 0.00980665, description: 'Gravitational gram force (9.80665 mN)', system: 'metric' },
    { id: 'kgf', name: 'Kilogram Force', symbol: 'kgf', category: 'force', toBaseFactor: EXACT_CONVERSION.KGF_TO_N, description: 'Gravitational metric force (9.80665 N)', system: 'metric' },
    { id: 'tf', name: 'Metric Ton-Force', symbol: 'tf', category: 'force', toBaseFactor: EXACT_CONVERSION.TONF_TO_N, description: 'Gravitational metric tonne force (9.80665 kN)', system: 'metric' },
    { id: 'lbf', name: 'Pound Force', symbol: 'lbf', category: 'force', toBaseFactor: EXACT_CONVERSION.LBF_TO_N, description: 'Imperial force pound (4.44822 N)', system: 'imperial' },
    { id: 'kip', name: 'Kip (1000 lbf)', symbol: 'kip', category: 'force', toBaseFactor: EXACT_CONVERSION.KIP_TO_N, description: 'US structural engineering kip (4.44822 kN)', system: 'imperial' },
    { id: 'tonf_us', name: 'US Ton-Force (2000 lbf)', symbol: 'tonf (US)', category: 'force', toBaseFactor: EXACT_CONVERSION.TONF_US_TO_N, description: 'US short ton-force (8.8964 kN)', system: 'imperial' },
    { id: 'poundal', name: 'Poundal', symbol: 'pdl', category: 'force', toBaseFactor: EXACT_CONVERSION.POUNDAL_TO_N, description: 'Imperial foot-pound-second force (0.138255 N)', system: 'imperial' },
  ],
  pressure: [
    { id: 'Pa', name: 'Pascal', symbol: 'Pa', category: 'pressure', toBaseFactor: 1.0, description: 'SI base stress/pressure unit (N/m²)', system: 'metric' },
    { id: 'kPa', name: 'Kilopascal (kN/m²)', symbol: 'kPa', category: 'pressure', toBaseFactor: EXACT_CONVERSION.KPA_TO_PA, description: 'Soil bearing pressure (1 kPa = 1 kN/m²)', system: 'metric' },
    { id: 'MPa', name: 'Megapascal (N/mm²)', symbol: 'MPa', category: 'pressure', toBaseFactor: EXACT_CONVERSION.MPA_TO_PA, description: 'Concrete compressive & steel yield strength', system: 'metric' },
    { id: 'GPa', name: 'Gigapascal', symbol: 'GPa', category: 'pressure', toBaseFactor: EXACT_CONVERSION.GPA_TO_PA, description: 'Modulus of elasticity E (steel 200 GPa)', system: 'metric' },
    { id: 'psi', name: 'Pounds per Sq Inch', symbol: 'psi', category: 'pressure', toBaseFactor: EXACT_CONVERSION.PSI_TO_PA, description: 'Imperial cylinder strength (1 MPa ≈ 145.038 psi)', system: 'imperial' },
    { id: 'ksi', name: 'Kips per Sq Inch', symbol: 'ksi', category: 'pressure', toBaseFactor: EXACT_CONVERSION.KSI_TO_PA, description: 'AISC structural steel yield stress (60 ksi = 413.7 MPa)', system: 'imperial' },
    { id: 'psf', name: 'Pounds per Sq Foot', symbol: 'psf', category: 'pressure', toBaseFactor: EXACT_CONVERSION.PSF_TO_PA, description: 'Imperial soil bearing capacity (1 psf ≈ 0.04788 kPa)', system: 'imperial' },
    { id: 'ksf', name: 'Kips per Sq Foot', symbol: 'ksf', category: 'pressure', toBaseFactor: EXACT_CONVERSION.TSF_TO_PA / 2, description: 'US soil bearing (1 ksf = 1000 psf = 47.88 kPa)', system: 'imperial' },
    { id: 'tsf', name: 'Tons per Sq Foot', symbol: 'tsf', category: 'pressure', toBaseFactor: EXACT_CONVERSION.TSF_TO_PA, description: 'Geotechnical short tons per sq ft (2000 psf = 95.76 kPa)', system: 'imperial' },
    { id: 'kgf/cm2', name: 'Kilogram-Force / cm²', symbol: 'kgf/cm²', category: 'pressure', toBaseFactor: EXACT_CONVERSION.KGF_CM2_TO_PA, description: 'Metric technical pressure (1 kgf/cm² ≈ 0.09807 MPa)', system: 'metric' },
    { id: 'tf/m2', name: 'Tonne-Force / m²', symbol: 'tf/m²', category: 'pressure', toBaseFactor: EXACT_CONVERSION.TF_M2_TO_PA, description: 'Soil bearing pressure in metric tonnes/m²', system: 'metric' },
    { id: 'bar', name: 'Bar', symbol: 'bar', category: 'pressure', toBaseFactor: EXACT_CONVERSION.BAR_TO_PA, description: 'Hydraulic fluid pressure (1 bar = 100 kPa = 100,000 Pa)', system: 'metric' },
    { id: 'mbar', name: 'Millibar', symbol: 'mbar', category: 'pressure', toBaseFactor: EXACT_CONVERSION.MBAR_TO_PA, description: 'Barometric weather pressure (100 Pa)', system: 'metric' },
    { id: 'atm', name: 'Standard Atmosphere', symbol: 'atm', category: 'pressure', toBaseFactor: EXACT_CONVERSION.ATM_TO_PA, description: 'Standard atmospheric pressure (101.325 kPa = 14.696 psi)', system: 'universal' },
    { id: 'mmHg', name: 'Millimeter of Mercury (Torr)', symbol: 'mmHg', category: 'pressure', toBaseFactor: EXACT_CONVERSION.MMHG_TO_PA, description: 'Torr / manometer head (760 mmHg = 1 atm)', system: 'metric' },
    { id: 'inHg', name: 'Inch of Mercury', symbol: 'inHg', category: 'pressure', toBaseFactor: EXACT_CONVERSION.INHG_TO_PA, description: 'Barometric inch of mercury (3.386 kPa)', system: 'imperial' },
    { id: 'mmH2O', name: 'Millimeter of Water', symbol: 'mmH₂O', category: 'pressure', toBaseFactor: EXACT_CONVERSION.MMH2O_TO_PA, description: 'Hydrostatic pressure head (9.80665 Pa)', system: 'metric' },
    { id: 'mH2O', name: 'Meter of Water Head', symbol: 'mH₂O', category: 'pressure', toBaseFactor: EXACT_CONVERSION.MH2O_TO_PA, description: 'Hydraulic water column head (9.80665 kPa)', system: 'metric' },
    { id: 'ftH2O', name: 'Foot of Water Head', symbol: 'ftH₂O', category: 'pressure', toBaseFactor: EXACT_CONVERSION.FTH2O_TO_PA, description: 'Imperial water column head (2.989 kPa)', system: 'imperial' },
    {
      id: 'psig',
      name: 'Pounds per Sq Inch Gauge (psig)',
      symbol: 'psig',
      category: 'pressure',
      toBaseFactor: EXACT_CONVERSION.PSI_TO_PA,
      toBase: (psig) => (psig + 14.6959488) * EXACT_CONVERSION.PSI_TO_PA,
      fromBase: (pa) => pa / EXACT_CONVERSION.PSI_TO_PA - 14.6959488,
      description: 'Gauge pressure referenced to 1 atm ambient (0 psig = 14.7 psi absolute)',
      system: 'imperial',
    },
    {
      id: 'bar_g',
      name: 'Bar Gauge (barg)',
      symbol: 'barg',
      category: 'pressure',
      toBaseFactor: EXACT_CONVERSION.BAR_TO_PA,
      toBase: (barg) => (barg + 1.01325) * 100000,
      fromBase: (pa) => pa / 100000 - 1.01325,
      description: 'Gauge pressure relative to atmospheric ambient (0 barg = 1.01325 bar absolute)',
      system: 'metric',
    },
  ],
  moment: [
    { id: 'N.m', name: 'Newton · Meter', symbol: 'N·m', category: 'moment', toBaseFactor: 1.0, description: 'SI base moment unit', system: 'metric' },
    { id: 'kN.m', name: 'Kilonewton · Meter', symbol: 'kN·m', category: 'moment', toBaseFactor: EXACT_CONVERSION.KNM_TO_NM, description: 'Standard structural flexural moment (1,000 N·m)', system: 'metric' },
    { id: 'MN.m', name: 'Meganewton · Meter', symbol: 'MN·m', category: 'moment', toBaseFactor: 1e6, description: 'Heavy foundation / bridge cantilever moment', system: 'metric' },
    { id: 'N.mm', name: 'Newton · Millimeter', symbol: 'N·mm', category: 'moment', toBaseFactor: 0.001, description: 'Section cross-section moment', system: 'metric' },
    { id: 'kgf.cm', name: 'Kilogram-Force · Centimeter', symbol: 'kgf·cm', category: 'moment', toBaseFactor: 0.0980665, description: 'Mechanical bolt torque unit', system: 'metric' },
    { id: 'kgf.m', name: 'Kilogram-Force · Meter', symbol: 'kgf·m', category: 'moment', toBaseFactor: 9.80665, description: 'Metric structural torque', system: 'metric' },
    { id: 'tf.m', name: 'Tonne-Force · Meter', symbol: 'tf·m', category: 'moment', toBaseFactor: 9806.65, description: 'Foundation overturning moment', system: 'metric' },
    { id: 'lbf.in', name: 'Pound · Inch', symbol: 'lb·in', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM / 12000, description: 'Imperial inch torque (0.11298 N·m)', system: 'imperial' },
    { id: 'lbf.ft', name: 'Pound · Foot', symbol: 'lb·ft', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM / 1000, description: 'Imperial torque & moment (1.3558 N·m)', system: 'imperial' },
    { id: 'kip.in', name: 'Kip · Inch', symbol: 'kip·in', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM / 12, description: 'US section flexural capacity (112.98 N·m)', system: 'imperial' },
    { id: 'kip.ft', name: 'Kip · Foot', symbol: 'kip·ft', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM, description: 'US structural bending moment (1,355.82 N·m)', system: 'imperial' },
  ],
  distributed_load: [
    { id: 'N/m', name: 'Newton / Meter', symbol: 'N/m', category: 'distributed_load', toBaseFactor: 1.0, description: 'SI base line load', system: 'metric' },
    { id: 'kN/m', name: 'Kilonewton / Meter', symbol: 'kN/m', category: 'distributed_load', toBaseFactor: EXACT_CONVERSION.KN_TO_N, description: 'Standard metric beam line load', system: 'metric' },
    { id: 'MN/m', name: 'Meganewton / Meter', symbol: 'MN/m', category: 'distributed_load', toBaseFactor: 1e6, description: 'Heavy retaining wall line reaction', system: 'metric' },
    { id: 'N/mm', name: 'Newton / Millimeter', symbol: 'N/mm', category: 'distributed_load', toBaseFactor: EXACT_CONVERSION.KN_TO_N, description: 'Component edge load (1 N/mm = 1 kN/m)', system: 'metric' },
    { id: 'kgf/m', name: 'Kilogram Force / Meter', symbol: 'kgf/m', category: 'distributed_load', toBaseFactor: 9.80665, description: 'Metric gravitational line load', system: 'metric' },
    { id: 'tf/m', name: 'Tonne Force / Meter', symbol: 'tf/m', category: 'distributed_load', toBaseFactor: 9806.65, description: 'Strip footing linear contact pressure', system: 'metric' },
    { id: 'plf', name: 'Pounds / Foot (plf)', symbol: 'plf', category: 'distributed_load', toBaseFactor: 14.593902937206368, description: 'Imperial uniform line load (14.594 N/m)', system: 'imperial' },
    { id: 'klf', name: 'Kips / Foot (klf)', symbol: 'klf', category: 'distributed_load', toBaseFactor: 14593.902937206368, description: 'US structural uniform load (14.594 kN/m)', system: 'imperial' },
    { id: 'lb/in', name: 'Pounds / Inch', symbol: 'lb/in', category: 'distributed_load', toBaseFactor: 175.126835246, description: 'Imperial linear pressure', system: 'imperial' },
    { id: 'kip/in', name: 'Kips / Inch', symbol: 'kip/in', category: 'distributed_load', toBaseFactor: 175126.835246, description: 'High intensity structural bearing line load', system: 'imperial' },
  ],
  section_properties: [
    { id: 'mm4', name: 'Millimeter⁴ (Moment of Inertia)', symbol: 'mm⁴', category: 'section_properties', toBaseFactor: 1.0, description: 'SI steel/concrete cross-section inertia Ix, Iy', system: 'metric' },
    { id: 'cm4', name: 'Centimeter⁴', symbol: 'cm⁴', category: 'section_properties', toBaseFactor: 1e4, description: 'Metric handbook section inertia (1 cm⁴ = 10,000 mm⁴)', system: 'metric' },
    { id: 'm4', name: 'Meter⁴', symbol: 'm⁴', category: 'section_properties', toBaseFactor: 1e12, description: 'Large civil bridge section inertia', system: 'metric' },
    { id: 'in4', name: 'Inch⁴', symbol: 'in⁴', category: 'section_properties', toBaseFactor: 416231.4256, description: 'AISC structural steel table inertia (1 in⁴ = 416,231 mm⁴)', system: 'imperial' },
    { id: 'ft4', name: 'Foot⁴', symbol: 'ft⁴', category: 'section_properties', toBaseFactor: 86309690.6, description: 'Large foundation footing moment of inertia', system: 'imperial' },
    { id: 'mm3_sec', name: 'Millimeter³ (Section Modulus Z/S)', symbol: 'mm³', category: 'section_properties', toBaseFactor: 1.0, description: 'Elastic section modulus Sx / plastic modulus Zx', system: 'metric' },
    { id: 'cm3_sec', name: 'Centimeter³', symbol: 'cm³', category: 'section_properties', toBaseFactor: 1000.0, description: 'Metric handbook modulus (1 cm³ = 1000 mm³)', system: 'metric' },
    { id: 'in3_sec', name: 'Inch³', symbol: 'in³', category: 'section_properties', toBaseFactor: 16387.064, description: 'AISC section modulus (1 in³ = 16,387 mm³)', system: 'imperial' },
  ],
  density: [
    { id: 'kN/m3', name: 'Kilonewton / m³', symbol: 'kN/m³', category: 'density', toBaseFactor: 1.0, description: 'Canonical civil soil gamma (e.g. 18 kN/m³)', system: 'metric' },
    { id: 'N/m3', name: 'Newton / m³', symbol: 'N/m³', category: 'density', toBaseFactor: 0.001, description: 'SI base volumetric force', system: 'metric' },
    { id: 'kg/m3', name: 'Kilogram / m³', symbol: 'kg/m³', category: 'density', toBaseFactor: 0.00980665, description: 'Material mass density (e.g. concrete 2400 kg/m³ = 23.54 kN/m³)', system: 'metric' },
    { id: 'g/cm3', name: 'Gram / cm³', symbol: 'g/cm³', category: 'density', toBaseFactor: 9.80665, description: 'Specific gravity basis (water = 1.0 g/cm³ = 9.81 kN/m³)', system: 'metric' },
    { id: 'g/L', name: 'Gram / Liter', symbol: 'g/L', category: 'density', toBaseFactor: 0.00980665, description: 'Dissolved solid / salinity density', system: 'metric' },
    { id: 'pcf', name: 'Pounds / Cu Foot (pcf)', symbol: 'pcf', category: 'density', toBaseFactor: 0.157087463, description: 'Imperial unit weight (e.g. 150 pcf concrete ≈ 23.56 kN/m³)', system: 'imperial' },
    { id: 'lb/in3', name: 'Pounds / Cu Inch', symbol: 'lb/in³', category: 'density', toBaseFactor: 271.4468, description: 'Steel density (0.283 lb/in³ = 490 pcf = 76.97 kN/m³)', system: 'imperial' },
    { id: 'kip/ft3', name: 'Kips / Cu Foot', symbol: 'kip/ft³', category: 'density', toBaseFactor: 157.087463, description: 'High-density geotechnical ballast', system: 'imperial' },
    { id: 'lb/gal', name: 'Pounds / US Gallon', symbol: 'lb/gal', category: 'density', toBaseFactor: 1.17511, description: 'Drilling mud density (water = 8.34 lb/gal)', system: 'imperial' },
    { id: 'kg/L', name: 'Kilogram / Liter', symbol: 'kg/L', category: 'density', toBaseFactor: 9.80665, description: 'Liquid batch density', system: 'metric' },
    { id: 'tonne/m3', name: 'Metric Tonne / m³', symbol: 't/m³', category: 'density', toBaseFactor: 9.80665, description: 'Bulk earth/aggregate density', system: 'metric' },
  ],
  flow_rate: [
    { id: 'm3/s', name: 'Cubic Meters / Second (cumec)', symbol: 'm³/s', category: 'flow_rate', toBaseFactor: 1.0, description: 'SI base discharge (cumecs)', system: 'metric' },
    { id: 'L/s', name: 'Liters / Second', symbol: 'L/s', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.LPS_TO_M3S, description: 'Pipe and pump discharge (0.001 m³/s)', system: 'metric' },
    { id: 'L/min', name: 'Liters / Minute (LPM)', symbol: 'L/min', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.LPM_TO_M3S, description: 'Pump rating in LPM', system: 'metric' },
    { id: 'L/hr', name: 'Liters / Hour', symbol: 'L/h', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.LPS_TO_M3S / 3600, description: 'Drip irrigation discharge', system: 'metric' },
    { id: 'm3/min', name: 'Cubic Meters / Minute', symbol: 'm³/min', category: 'flow_rate', toBaseFactor: 1 / 60, description: 'Blower & intake ventilation rate', system: 'metric' },
    { id: 'm3/hr', name: 'Cubic Meters / Hour', symbol: 'm³/h', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.M3_HR_TO_M3S, description: 'Water treatment plant discharge', system: 'metric' },
    { id: 'ML/day', name: 'Megaliters / Day (MLD)', symbol: 'MLD', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.ML_DAY_TO_M3S, description: 'Urban treatment plant capacity (0.01157 m³/s)', system: 'metric' },
    { id: 'cfs', name: 'Cubic Feet / Second (cusec)', symbol: 'cfs', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.CFS_TO_M3S, description: 'Imperial river discharge (cusecs = 0.028317 m³/s)', system: 'imperial' },
    { id: 'cfm', name: 'Cubic Feet / Minute (CFM)', symbol: 'CFM', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.CFM_TO_M3S, description: 'HVAC airflow rating (1 CFM ≈ 0.4719 L/s)', system: 'imperial' },
    { id: 'gpm', name: 'US Gallons / Minute', symbol: 'gpm', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.GPM_TO_M3S, description: 'US pumping capacity (0.00006309 m³/s)', system: 'imperial' },
    { id: 'gpm_uk', name: 'UK Gallons / Minute', symbol: 'UK gpm', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.GPM_UK_TO_M3S, description: 'Imperial pumping discharge (0.00007577 m³/s)', system: 'imperial' },
    { id: 'mgd', name: 'Million Gallons / Day (MGD)', symbol: 'MGD', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.MGD_TO_M3S, description: 'Municipal water supply discharge (0.04381 m³/s)', system: 'imperial' },
  ],
  viscosity: [
    { id: 'Pa.s', name: 'Pascal · Second (Dynamic)', symbol: 'Pa·s', category: 'viscosity', toBaseFactor: 1.0, description: 'SI base dynamic viscosity unit (1 Pa·s = 10 Poise)', system: 'metric' },
    { id: 'mPa.s', name: 'Millipascal · Second', symbol: 'mPa·s', category: 'viscosity', toBaseFactor: 0.001, description: 'Water viscosity at 20°C (1.002 mPa·s = 1.002 cP)', system: 'metric' },
    { id: 'P', name: 'Poise (CGS)', symbol: 'P', category: 'viscosity', toBaseFactor: 0.1, description: 'CGS dynamic viscosity unit (0.1 Pa·s)', system: 'metric' },
    { id: 'cP', name: 'Centipoise', symbol: 'cP', category: 'viscosity', toBaseFactor: 0.001, description: 'Standard fluid viscosity unit (1 cP = 1 mPa·s)', system: 'metric' },
    { id: 'lb_ft_s', name: 'Pound / (Foot · Second)', symbol: 'lb/(ft·s)', category: 'viscosity', toBaseFactor: 1.4881639, description: 'Imperial dynamic viscosity', system: 'imperial' },
    { id: 'm2_s', name: 'm² / Second (Kinematic)', symbol: 'm²/s', category: 'viscosity', toBaseFactor: 1.0, description: 'SI base kinematic viscosity ν = μ / ρ', system: 'metric' },
    { id: 'mm2_s', name: 'mm² / Second', symbol: 'mm²/s', category: 'viscosity', toBaseFactor: 1e-6, description: 'Kinematic viscosity (1 mm²/s = 1 cSt)', system: 'metric' },
    { id: 'St', name: 'Stokes (CGS)', symbol: 'St', category: 'viscosity', toBaseFactor: 1e-4, description: 'CGS kinematic unit (1 cm²/s = 10⁻⁴ m²/s)', system: 'metric' },
    { id: 'cSt', name: 'Centistokes', symbol: 'cSt', category: 'viscosity', toBaseFactor: 1e-6, description: 'Common oil & bitumen kinematic unit (1 cSt = 10⁻⁶ m²/s)', system: 'metric' },
    { id: 'ft2_s', name: 'Foot² / Second', symbol: 'ft²/s', category: 'viscosity', toBaseFactor: 0.09290304, description: 'Imperial kinematic viscosity', system: 'imperial' },
    { id: 'm_s_perm', name: 'Permeability k (m/s)', symbol: 'm/s', category: 'viscosity', toBaseFactor: 1.0, description: 'Soil hydraulic conductivity k (clean gravel ~10⁻² m/s, clay ~10⁻⁹ m/s)', system: 'metric' },
    { id: 'cm_s_perm', name: 'Permeability k (cm/s)', symbol: 'cm/s', category: 'viscosity', toBaseFactor: 0.01, description: 'Geotechnical soil coefficient of permeability', system: 'metric' },
    { id: 'm_day', name: 'Permeability (m/day)', symbol: 'm/day', category: 'viscosity', toBaseFactor: 1 / 86400, description: 'Hydrogeological groundwater seepage velocity', system: 'metric' },
    { id: 'ft_day', name: 'Permeability (ft/day)', symbol: 'ft/day', category: 'viscosity', toBaseFactor: 0.3048 / 86400, description: 'US aquifer hydraulic conductivity', system: 'imperial' },
    { id: 'gal_day_ft2', name: 'Gallon / (Day · ft²)', symbol: 'gpd/ft²', category: 'viscosity', toBaseFactor: 0.003785411784 / (86400 * 0.09290304), description: 'US Meinzer aquifer permeability unit', system: 'imperial' },
  ],
  temperature: [
    {
      id: 'k',
      name: 'Kelvin',
      symbol: 'K',
      category: 'temperature',
      toBaseFactor: 1.0,
      toBase: (k) => k,
      fromBase: (k) => k,
      description: 'SI thermodynamic absolute temperature base unit',
      system: 'metric',
    },
    {
      id: 'c',
      name: 'Celsius',
      symbol: '°C',
      category: 'temperature',
      toBaseFactor: 1.0,
      toBase: (c) => c + 273.15,
      fromBase: (k) => k - 273.15,
      description: 'Metric Celsius scale (0°C water freezing, 100°C boiling)',
      system: 'metric',
      bengaliName: 'সেলসিয়াস',
      bengaliSymbol: '°সে.',
    },
    {
      id: 'f',
      name: 'Fahrenheit',
      symbol: '°F',
      category: 'temperature',
      toBaseFactor: 5 / 9,
      toBase: (f) => ((f - 32) * 5) / 9 + 273.15,
      fromBase: (k) => ((k - 273.15) * 9) / 5 + 32,
      description: 'Imperial Fahrenheit scale (32°F freezing, 212°F boiling)',
      system: 'imperial',
      bengaliName: 'ফারেনহাইট',
      bengaliSymbol: '°ফা.',
    },
    {
      id: 'r',
      name: 'Rankine',
      symbol: '°R',
      category: 'temperature',
      toBaseFactor: 5 / 9,
      toBase: (r) => (r * 5) / 9,
      fromBase: (k) => (k * 9) / 5,
      description: 'Absolute imperial Rankine temperature scale (°R = °F + 459.67)',
      system: 'imperial',
    },
  ],
  energy: [
    { id: 'J', name: 'Joule', symbol: 'J', category: 'energy', toBaseFactor: 1.0, description: 'SI base energy & mechanical work (1 N·m = 1 W·s)', system: 'metric' },
    { id: 'kJ', name: 'Kilojoule', symbol: 'kJ', category: 'energy', toBaseFactor: EXACT_CONVERSION.KJ_TO_J, description: 'Structural blast & pile hammer impact energy', system: 'metric' },
    { id: 'MJ', name: 'Megajoule', symbol: 'MJ', category: 'energy', toBaseFactor: EXACT_CONVERSION.MJ_TO_J, description: 'Seismic wave energy release', system: 'metric' },
    { id: 'GJ', name: 'Gigajoule', symbol: 'GJ', category: 'energy', toBaseFactor: EXACT_CONVERSION.GJ_TO_J, description: 'HVAC district heating / industrial gas energy', system: 'metric' },
    { id: 'Wh', name: 'Watt · Hour', symbol: 'Wh', category: 'energy', toBaseFactor: EXACT_CONVERSION.WH_TO_J, description: 'Electrical energy', system: 'metric' },
    { id: 'kWh', name: 'Kilowatt · Hour (Unit)', symbol: 'kWh', category: 'energy', toBaseFactor: EXACT_CONVERSION.KWH_TO_J, description: 'Commercial utility electric meter billing unit (3.6 MJ)', system: 'universal', bengaliName: 'কিলোওয়াট-ঘণ্টা (ইউনিট)', bengaliSymbol: 'kWh' },
    { id: 'MWh', name: 'Megawatt · Hour', symbol: 'MWh', category: 'energy', toBaseFactor: EXACT_CONVERSION.MWH_TO_J, description: 'Power grid substation output energy', system: 'universal' },
    { id: 'cal', name: 'Calorie (Thermochemical)', symbol: 'cal', category: 'energy', toBaseFactor: EXACT_CONVERSION.CAL_TO_J, description: 'Heat to raise 1g water by 1°C (4.184 J)', system: 'metric' },
    { id: 'kcal', name: 'Kilocalorie', symbol: 'kcal', category: 'energy', toBaseFactor: EXACT_CONVERSION.KCAL_TO_J, description: 'Thermal combustion & building heating value (4,184 J)', system: 'metric' },
    { id: 'BTU', name: 'British Thermal Unit', symbol: 'BTU', category: 'energy', toBaseFactor: EXACT_CONVERSION.BTU_TO_J, description: 'Imperial heat energy (1,055.06 J)', system: 'imperial' },
    { id: 'therm', name: 'Therm', symbol: 'thm', category: 'energy', toBaseFactor: EXACT_CONVERSION.THERM_TO_J, description: 'Natural gas energy (100,000 BTU = 105.48 MJ)', system: 'imperial' },
    { id: 'ft_lbf', name: 'Foot · Pound-force', symbol: 'ft·lbf', category: 'energy', toBaseFactor: EXACT_CONVERSION.FT_LBF_TO_J, description: 'Pile driving hammer kinetic energy (1.3558 J)', system: 'imperial' },
    { id: 'eV', name: 'Electronvolt', symbol: 'eV', category: 'energy', toBaseFactor: EXACT_CONVERSION.EV_TO_J, description: 'Atomic binding energy (1.602 × 10⁻¹⁹ J)', system: 'universal' },
  ],
  power: [
    { id: 'W', name: 'Watt', symbol: 'W', category: 'power', toBaseFactor: 1.0, description: 'SI base power unit (1 J/s)', system: 'metric' },
    { id: 'kW', name: 'Kilowatt', symbol: 'kW', category: 'power', toBaseFactor: EXACT_CONVERSION.KW_TO_W, description: 'Electric motor, pump & generator power rating', system: 'metric' },
    { id: 'MW', name: 'Megawatt', symbol: 'MW', category: 'power', toBaseFactor: EXACT_CONVERSION.MW_TO_W, description: 'Power plant generation capacity (1,000,000 W)', system: 'metric' },
    { id: 'hp', name: 'Horsepower (Mechanical HP)', symbol: 'hp', category: 'power', toBaseFactor: EXACT_CONVERSION.HP_TO_W, description: 'Imperial mechanical horsepower (745.70 W = 550 ft·lbf/s)', system: 'imperial' },
    { id: 'hp_metric', name: 'Metric Horsepower (PS / Cheval)', symbol: 'PS', category: 'power', toBaseFactor: EXACT_CONVERSION.HP_METRIC_TO_W, description: 'Metric horsepower (75 kgf·m/s = 735.50 W)', system: 'metric' },
    { id: 'btu_hr', name: 'BTU / Hour', symbol: 'BTU/h', category: 'power', toBaseFactor: EXACT_CONVERSION.BTU_HR_TO_W, description: 'HVAC heating and air conditioning rating (0.2931 W)', system: 'imperial' },
    { id: 'TR', name: 'Ton of Refrigeration (TR)', symbol: 'TR', category: 'power', toBaseFactor: EXACT_CONVERSION.TR_TO_W, description: 'Building cooling capacity (1 TR = 12,000 BTU/hr = 3.51685 kW)', system: 'universal' },
    { id: 'kcal_hr', name: 'Kilocalorie / Hour', symbol: 'kcal/h', category: 'power', toBaseFactor: EXACT_CONVERSION.KCAL_HR_TO_W, description: 'Industrial boiler & furnace rating (1.163 W)', system: 'metric' },
  ],
  velocity: [
    { id: 'm/s', name: 'Meters / Second', symbol: 'm/s', category: 'velocity', toBaseFactor: 1.0, description: 'SI base velocity & hydraulic flow speed', system: 'metric' },
    { id: 'km/h', name: 'Kilometers / Hour', symbol: 'km/h', category: 'velocity', toBaseFactor: EXACT_CONVERSION.KMH_TO_MPS, description: 'Traffic, wind surge & design road speed (1/3.6 m/s)', system: 'metric', bengaliName: 'কিমি / ঘণ্টা', bengaliSymbol: 'কিমি/ঘণ্টা' },
    { id: 'cm/s', name: 'Centimeters / Second', symbol: 'cm/s', category: 'velocity', toBaseFactor: 0.01, description: 'Soil drainage & low speed seepage velocity', system: 'metric' },
    { id: 'ft/s', name: 'Feet / Second', symbol: 'ft/s', category: 'velocity', toBaseFactor: EXACT_CONVERSION.FTS_TO_MPS, description: 'Imperial channel flow velocity (0.3048 m/s)', system: 'imperial' },
    { id: 'mph', name: 'Miles / Hour', symbol: 'mph', category: 'velocity', toBaseFactor: EXACT_CONVERSION.MPH_TO_MPS, description: 'US wind design speed (0.44704 m/s)', system: 'imperial' },
    { id: 'knot', name: 'Knot (Nautical Mile/h)', symbol: 'kt', category: 'velocity', toBaseFactor: EXACT_CONVERSION.KNOT_TO_MPS, description: 'Maritime & cyclone wind speed (0.51444 m/s)', system: 'universal' },
    { id: 'mach', name: 'Mach (at sea level 20°C)', symbol: 'Ma', category: 'velocity', toBaseFactor: EXACT_CONVERSION.MACH_TO_MPS, description: 'Speed of sound in air (340.29 m/s = 1,225 km/h)', system: 'universal' },
  ],
  slope: [
    { id: 'ratio', name: 'Ratio (1:H / V:H)', symbol: 'm/m', category: 'slope', toBaseFactor: 1.0, description: 'Dimensionless gradient ratio (e.g. 0.02 = 1:50)', system: 'universal' },
    { id: 'percent', name: 'Percentage Grade', symbol: '%', category: 'slope', toBaseFactor: 0.01, description: 'Civil road grade (e.g. 2% = 0.02 slope)', system: 'universal' },
    {
      id: 'degree',
      name: 'Angle in Degrees',
      symbol: '°',
      category: 'slope',
      toBaseFactor: 1.0,
      toBase: (deg) => Math.tan((deg * Math.PI) / 180),
      fromBase: (ratio) => (Math.atan(ratio) * 180) / Math.PI,
      description: 'Friction angle φ or embankment inclination',
      system: 'universal',
    },
    {
      id: 'rad',
      name: 'Angle in Radians',
      symbol: 'rad',
      category: 'slope',
      toBaseFactor: 1.0,
      toBase: (rad) => Math.tan(rad),
      fromBase: (ratio) => Math.atan(ratio),
      description: 'Mathematical radian angle',
      system: 'universal',
    },
    {
      id: 'gon',
      name: 'Gradian (gon / grad)',
      symbol: 'gon',
      category: 'slope',
      toBaseFactor: 1.0,
      toBase: (gon) => Math.tan((gon * Math.PI) / 200),
      fromBase: (ratio) => (Math.atan(ratio) * 200) / Math.PI,
      description: 'European survey gradian (400 gon = 360°)',
      system: 'universal',
    },
    { id: 'permille', name: 'Per Mille (‰)', symbol: '‰', category: 'slope', toBaseFactor: 0.001, description: 'Railway & highway gradient (e.g. 20‰ = 0.02)', system: 'universal' },
    { id: 'in_per_ft', name: 'Inches per Foot', symbol: 'in/ft', category: 'slope', toBaseFactor: 1 / 12, description: 'Plumbing & drainage slope (e.g. 1/4" per ft = 0.02083)', system: 'imperial' },
    {
      id: 'arcmin',
      name: 'Arcminute',
      symbol: 'arcmin',
      category: 'slope',
      toBaseFactor: 1.0,
      toBase: (min) => Math.tan((min * Math.PI) / 10800),
      fromBase: (ratio) => (Math.atan(ratio) * 10800) / Math.PI,
      description: '1/60th of a degree',
      system: 'universal',
    },
    {
      id: 'arcsec',
      name: 'Arcsecond',
      symbol: 'arcsec',
      category: 'slope',
      toBaseFactor: 1.0,
      toBase: (sec) => Math.tan((sec * Math.PI) / 648000),
      fromBase: (ratio) => (Math.atan(ratio) * 648000) / Math.PI,
      description: 'Theodolite survey precision (1/3600th of a degree)',
      system: 'universal',
    },
    {
      id: 'rev',
      name: 'Revolution (Turn)',
      symbol: 'rev',
      category: 'slope',
      toBaseFactor: 1.0,
      toBase: (rev) => Math.tan((rev * 360 * Math.PI) / 180),
      fromBase: (ratio) => (Math.atan(ratio) * 180) / Math.PI / 360,
      description: 'Complete 360° circular rotation',
      system: 'universal',
    },
  ],
  time_frequency: [
    { id: 's', name: 'Second', symbol: 's', category: 'time_frequency', toBaseFactor: 1.0, description: 'SI base time unit', system: 'universal' },
    { id: 'ms', name: 'Millisecond', symbol: 'ms', category: 'time_frequency', toBaseFactor: 0.001, description: 'Vibration & blast wave response time (10⁻³ s)', system: 'metric' },
    { id: 'us', name: 'Microsecond', symbol: 'µs', category: 'time_frequency', toBaseFactor: 1e-6, description: 'Ultrasonic pulse velocity testing time', system: 'metric' },
    { id: 'ns', name: 'Nanosecond', symbol: 'ns', category: 'time_frequency', toBaseFactor: 1e-9, description: 'Laser EDM transit timing', system: 'metric' },
    { id: 'min', name: 'Minute', symbol: 'min', category: 'time_frequency', toBaseFactor: 60.0, description: '60 seconds', system: 'universal' },
    { id: 'hr', name: 'Hour', symbol: 'hr', category: 'time_frequency', toBaseFactor: 3600.0, description: '3,600 seconds', system: 'universal' },
    { id: 'day', name: 'Day', symbol: 'd', category: 'time_frequency', toBaseFactor: 86400.0, description: '24 hours = 86,400 seconds', system: 'universal' },
    { id: 'week', name: 'Week', symbol: 'wk', category: 'time_frequency', toBaseFactor: 604800.0, description: '7 days schedule roster duration', system: 'universal' },
    { id: 'month', name: 'Month (Average 30.44 d)', symbol: 'mo', category: 'time_frequency', toBaseFactor: 2629800.0, description: 'Civil project calendar month (30.4375 days)', system: 'universal' },
    { id: 'year', name: 'Year (365.25 d)', symbol: 'yr', category: 'time_frequency', toBaseFactor: 31557600.0, description: 'Asset lifecycle & design return period (365.25 days)', system: 'universal' },
    { id: 'Hz', name: 'Hertz (Frequency)', symbol: 'Hz', category: 'time_frequency', toBaseFactor: 1.0, description: 'Structural natural frequency & vibration cycles per sec', system: 'universal' },
    { id: 'kHz', name: 'Kilohertz', symbol: 'kHz', category: 'time_frequency', toBaseFactor: 1000.0, description: 'Ultrasonic concrete pulse velocity frequency', system: 'universal' },
    { id: 'MHz', name: 'Megahertz', symbol: 'MHz', category: 'time_frequency', toBaseFactor: 1e6, description: 'Ground Penetrating Radar (GPR) frequency (400 - 900 MHz)', system: 'universal' },
    { id: 'GHz', name: 'Gigahertz', symbol: 'GHz', category: 'time_frequency', toBaseFactor: 1e9, description: 'Micro-radar and satellite communication frequency', system: 'universal' },
    { id: 'RPM', name: 'Revolutions / Minute', symbol: 'RPM', category: 'time_frequency', toBaseFactor: 1 / 60, description: 'Pump, engine & mixer motor shaft rotational speed', system: 'universal' },
    { id: 'rad_s', name: 'Radian / Second', symbol: 'rad/s', category: 'time_frequency', toBaseFactor: 1 / (2 * Math.PI), description: 'Angular circular frequency ω = 2πf', system: 'universal' },
  ],
  digital_storage: [
    { id: 'B', name: 'Byte', symbol: 'B', category: 'digital_storage', toBaseFactor: 1.0, description: 'Standard 8-bit digital byte', system: 'universal' },
    { id: 'bit', name: 'Bit', symbol: 'bit', category: 'digital_storage', toBaseFactor: 0.125, description: 'Fundamental binary unit (1 Byte = 8 bits)', system: 'universal' },
    { id: 'KB', name: 'Kilobyte (Decimal 10³ B)', symbol: 'KB', category: 'digital_storage', toBaseFactor: 1000.0, description: '1,000 Bytes', system: 'universal' },
    { id: 'MB', name: 'Megabyte (Decimal 10⁶ B)', symbol: 'MB', category: 'digital_storage', toBaseFactor: 1e6, description: '1,000,000 Bytes (CAD file size)', system: 'universal' },
    { id: 'GB', name: 'Gigabyte (Decimal 10⁹ B)', symbol: 'GB', category: 'digital_storage', toBaseFactor: 1e9, description: '1,000,000,000 Bytes (BIM model & LiDAR point cloud)', system: 'universal' },
    { id: 'TB', name: 'Terabyte (Decimal 10¹² B)', symbol: 'TB', category: 'digital_storage', toBaseFactor: 1e12, description: '1,000 GB drone photogrammetry server storage', system: 'universal' },
    { id: 'PB', name: 'Petabyte (Decimal 10¹⁵ B)', symbol: 'PB', category: 'digital_storage', toBaseFactor: 1e15, description: 'Enterprise geospatial & satellite imagery archive', system: 'universal' },
    { id: 'KiB', name: 'Kibibyte (Binary 2¹⁰ B)', symbol: 'KiB', category: 'digital_storage', toBaseFactor: 1024.0, description: '1,024 Bytes IEC binary prefix', system: 'universal' },
    { id: 'MiB', name: 'Mebibyte (Binary 2²⁰ B)', symbol: 'MiB', category: 'digital_storage', toBaseFactor: 1048576.0, description: '1,048,576 Bytes RAM / OS standard', system: 'universal' },
    { id: 'GiB', name: 'Gibibyte (Binary 2³⁰ B)', symbol: 'GiB', category: 'digital_storage', toBaseFactor: 1073741824.0, description: '1,073,741,824 Bytes storage drive capacity', system: 'universal' },
    { id: 'TiB', name: 'Tebibyte (Binary 2⁴⁰ B)', symbol: 'TiB', category: 'digital_storage', toBaseFactor: 1099511627776.0, description: '1,024 GiB file server volume', system: 'universal' },
    { id: 'bps', name: 'Bits / Second', symbol: 'bps', category: 'digital_storage', toBaseFactor: 0.125, description: 'Base network transfer speed (bits/sec)', system: 'universal' },
    { id: 'Kbps', name: 'Kilobits / Second', symbol: 'Kbps', category: 'digital_storage', toBaseFactor: 125.0, description: 'Telemetry & IoT site sensor data transmission', system: 'universal' },
    { id: 'Mbps', name: 'Megabits / Second', symbol: 'Mbps', category: 'digital_storage', toBaseFactor: 125000.0, description: 'Broadband network bandwidth (100 Mbps ≈ 12.5 MB/s)', system: 'universal' },
    { id: 'Gbps', name: 'Gigabits / Second', symbol: 'Gbps', category: 'digital_storage', toBaseFactor: 125000000.0, description: 'Fiber optic LAN transfer rate', system: 'universal' },
    { id: 'MB_s', name: 'Megabytes / Second', symbol: 'MB/s', category: 'digital_storage', toBaseFactor: 1e6, description: 'Disk write / download speed in megabytes per sec', system: 'universal' },
  ],
  fuel_economy: [
    {
      id: 'km_l',
      name: 'Kilometers / Liter (km/L)',
      symbol: 'km/L',
      category: 'fuel_economy',
      toBaseFactor: 1.0,
      description: 'Standard SI metric fuel efficiency distance per volume',
      system: 'metric',
      bengaliName: 'কিলোমিটার / লিটার',
      bengaliSymbol: 'কিমি/লি.',
    },
    {
      id: 'l_100km',
      name: 'Liters / 100 km (L/100km)',
      symbol: 'L/100km',
      category: 'fuel_economy',
      toBaseFactor: 1.0,
      toBase: (l) => (l <= 0 ? 0 : 100 / l),
      fromBase: (kmL) => (kmL <= 0 ? 0 : 100 / kmL),
      description: 'European standard fuel consumption (reciprocal: 100 ÷ L/100km = km/L)',
      system: 'metric',
    },
    {
      id: 'mpg_us',
      name: 'Miles per Gallon (US MPG)',
      symbol: 'mpg (US)',
      category: 'fuel_economy',
      toBaseFactor: 0.425143707,
      description: 'US automotive fuel efficiency (1 US MPG ≈ 0.42514 km/L)',
      system: 'imperial',
    },
    {
      id: 'mpg_uk',
      name: 'Miles per Gallon (UK Imperial MPG)',
      symbol: 'mpg (UK)',
      category: 'fuel_economy',
      toBaseFactor: 0.35400619,
      description: 'British imperial fuel efficiency (1 UK MPG ≈ 0.35401 km/L)',
      system: 'imperial',
    },
    {
      id: 'mi_l',
      name: 'Miles / Liter',
      symbol: 'mi/L',
      category: 'fuel_economy',
      toBaseFactor: 1.609344,
      description: 'Miles per liter efficiency',
      system: 'imperial',
    },
  ],
  cad_typography: [
    { id: 'mm', name: 'Millimeter (CAD Base)', symbol: 'mm', category: 'cad_typography', toBaseFactor: 1.0, description: 'Standard engineering CAD / drafting drawing unit', system: 'metric' },
    { id: 'in', name: 'Inch', symbol: 'in', category: 'cad_typography', toBaseFactor: 25.4, description: 'Architectural drawing inch (1 in = 25.4 mm)', system: 'imperial' },
    { id: 'pt', name: 'PostScript Point (1/72 in)', symbol: 'pt', category: 'cad_typography', toBaseFactor: EXACT_CONVERSION.POINT_TO_MM, description: 'Typography & font point size (1 pt = 1/72 in = 0.3528 mm)', system: 'universal' },
    { id: 'pc', name: 'Pica (12 pt)', symbol: 'pc', category: 'cad_typography', toBaseFactor: EXACT_CONVERSION.PICA_TO_MM, description: 'Publishing pica column width (1 pc = 12 pt = 4.2333 mm)', system: 'universal' },
    { id: 'px_96', name: 'Pixel at 96 DPI (Web CSS px)', symbol: 'px (96)', category: 'cad_typography', toBaseFactor: EXACT_CONVERSION.PX96_TO_MM, description: 'Standard web screen pixel at 96 DPI (1 px = 0.2646 mm)', system: 'universal' },
    { id: 'px_300', name: 'Pixel at 300 DPI (High-Res Print)', symbol: 'px (300)', category: 'cad_typography', toBaseFactor: EXACT_CONVERSION.PX300_TO_MM, description: 'Press-ready print pixel at 300 DPI (1 px = 0.0847 mm)', system: 'universal' },
    { id: 'twip', name: 'Twip (1/20 pt = 1/1440 in)', symbol: 'twip', category: 'cad_typography', toBaseFactor: EXACT_CONVERSION.TWIP_TO_MM, description: 'Twentieth of a point (1 twip = 17.639 µm)', system: 'universal' },
  ],
};

/**
 * Normalizes any value in a given unit to the Canonical Base SI unit.
 * Supports linear multipliers and functional/affine callbacks with high-precision rounding.
 */
export function normalizeToBase(
  value: number,
  unitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[] = []
): number {
  if (isNaN(value)) return 0;
  if (unitId === BASE_UNITS[category]) return value;

  // Custom unit check
  const custom = customUnits.find((u) => u.category === category && u.id === unitId);
  if (custom) {
    return cleanPrecision(value * custom.toBaseFactor);
  }

  const allCategoryUnits = STANDARD_UNITS[category] || [];
  const info = allCategoryUnits.find((u) => u.id === unitId);
  if (!info) return value;

  // Exact functional/affine transform (e.g. Temperature °C/°F -> K, L/100km -> km/L, Slope degrees -> ratio)
  if (info.toBase) {
    return cleanPrecision(info.toBase(value));
  }

  return cleanPrecision(value * info.toBaseFactor);
}

/**
 * Converts a Canonical Base SI value to a target display unit with full precision.
 */
export function denormalizeFromBase(
  baseValue: number,
  targetUnitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[] = []
): number {
  if (isNaN(baseValue)) return 0;
  if (targetUnitId === BASE_UNITS[category]) return baseValue;

  const custom = customUnits.find((u) => u.category === category && u.id === targetUnitId);
  if (custom && custom.toBaseFactor !== 0) {
    return cleanPrecision(baseValue / custom.toBaseFactor);
  }

  const allCategoryUnits = STANDARD_UNITS[category] || [];
  const info = allCategoryUnits.find((u) => u.id === targetUnitId);
  if (!info) return baseValue;

  // Exact functional/affine transform from base (e.g. Kelvin -> °C/°F, km/L -> L/100km, ratio -> degrees)
  if (info.fromBase) {
    return cleanPrecision(info.fromBase(baseValue));
  }

  if (info.toBaseFactor === 0) return baseValue;
  return cleanPrecision(baseValue / info.toBaseFactor);
}

/**
 * Direct Unit-to-Unit Conversion without intermediate precision loss.
 */
export function convertDirect(
  value: number,
  fromUnitId: string,
  toUnitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[] = []
): number {
  if (fromUnitId === toUnitId) return value;
  const baseVal = normalizeToBase(value, fromUnitId, category, customUnits);
  return denormalizeFromBase(baseVal, toUnitId, category, customUnits);
}

/**
 * High-Precision Unit Conversion Engine with comprehensive audit trail & formula derivation
 */
export function convertUnitValue(
  value: number,
  fromUnitId: string,
  toUnitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[] = []
): { result: number; formula: string } {
  if (fromUnitId === toUnitId) {
    return { result: value, formula: `${value} ${fromUnitId} = ${value} ${toUnitId}` };
  }

  const allUnits: UnitInfo[] = [
    ...(STANDARD_UNITS[category] || []),
    ...customUnits
      .filter((u) => u.category === category)
      .map((u) => ({
        id: u.id,
        name: u.name,
        symbol: u.symbol,
        category: u.category,
        toBaseFactor: u.toBaseFactor,
        description: u.description,
        isRegional: u.isRegional,
        system: 'universal' as const,
      })),
  ];

  const fromInfo = allUnits.find((u) => u.id === fromUnitId);
  const toInfo = allUnits.find((u) => u.id === toUnitId);

  if (!fromInfo || !toInfo) {
    return { result: value, formula: 'Conversion unit definition not found' };
  }

  const baseVal = normalizeToBase(value, fromUnitId, category, customUnits);
  const targetVal = denormalizeFromBase(baseVal, toUnitId, category, customUnits);

  // Exact specialized formula derivations:
  let formula = '';
  if (category === 'temperature') {
    if (fromUnitId === 'c' && toUnitId === 'f') {
      formula = `(${value}°C × 9/5) + 32 = ${targetVal.toFixed(2)}°F`;
    } else if (fromUnitId === 'f' && toUnitId === 'c') {
      formula = `(${value}°F - 32) × 5/9 = ${targetVal.toFixed(2)}°C`;
    } else if (fromUnitId === 'c' && toUnitId === 'k') {
      formula = `${value}°C + 273.15 = ${targetVal.toFixed(2)} K`;
    } else if (fromUnitId === 'k' && toUnitId === 'c') {
      formula = `${value} K - 273.15 = ${targetVal.toFixed(2)}°C`;
    } else if (fromUnitId === 'f' && toUnitId === 'k') {
      formula = `((${value}°F - 32) × 5/9) + 273.15 = ${targetVal.toFixed(2)} K`;
    } else {
      formula = `${value} ${fromInfo.symbol} → Base ${baseVal.toFixed(2)} K → ${targetVal.toFixed(2)} ${toInfo.symbol}`;
    }
    return { result: targetVal, formula };
  }

  if (category === 'fuel_economy') {
    if (fromUnitId === 'l_100km' && toUnitId === 'km_l') {
      formula = `100 ÷ ${value} L/100km = ${targetVal.toFixed(2)} km/L`;
    } else if (fromUnitId === 'km_l' && toUnitId === 'l_100km') {
      formula = `100 ÷ ${value} km/L = ${targetVal.toFixed(2)} L/100km`;
    } else if (fromUnitId === 'mpg_us' && toUnitId === 'km_l') {
      formula = `${value} MPG (US) × 0.42514 = ${targetVal.toFixed(3)} km/L`;
    } else {
      formula = `${value} ${fromInfo.symbol} ⇄ ${targetVal.toFixed(3)} ${toInfo.symbol}`;
    }
    return { result: targetVal, formula };
  }

  if (category === 'slope') {
    if (fromUnitId === 'degree' && toUnitId === 'percent') {
      formula = `tan(${value}°) × 100 = ${targetVal.toFixed(4)}%`;
    } else if (fromUnitId === 'percent' && toUnitId === 'degree') {
      formula = `atan(${value} / 100) = ${targetVal.toFixed(4)}°`;
    } else if (fromUnitId === 'degree' && toUnitId === 'ratio') {
      formula = `tan(${value}°) = ${targetVal.toFixed(5)}`;
    } else {
      formula = `${value} ${fromInfo.symbol} → Gradient ${baseVal.toFixed(5)} → ${targetVal.toFixed(4)} ${toInfo.symbol}`;
    }
    return { result: targetVal, formula };
  }

  if (category === 'area' && (fromInfo.isRegional || toInfo.isRegional)) {
    formula = `1 ${fromInfo.name} (${fromInfo.toBaseFactor} m²) ⇄ ${toInfo.name} (${toInfo.toBaseFactor} m²) = ${parseFloat(targetVal.toPrecision(7))} ${toInfo.symbol}`;
    return { result: targetVal, formula };
  }

  const baseSymbol = BASE_UNITS[category];
  formula = `${value} ${fromInfo.symbol} × ${fromInfo.toBaseFactor} = ${parseFloat(baseVal.toPrecision(7))} ${baseSymbol} ÷ ${toInfo.toBaseFactor} = ${parseFloat(targetVal.toPrecision(7))} ${toInfo.symbol}`;
  return { result: targetVal, formula };
}

/* -------------------------------------------------------------
   REGIONAL LAND CONVERSION MATRIX
   Simultaneously resolves Decimal, Katha, Bigha, Acre, Hectare
------------------------------------------------------------- */
export interface RegionalLandBreakdown {
  acres: number;
  hectares: number;
  decimals: number;
  katha: number;
  bigha: number;
  chataks: number;
  kanis: number;
  shahiKanis: number;
  gondas: number;
  karas: number;
  krantis: number;
  tils: number;
  dhurs: number;
  squareFeet: number;
  squareMeters: number;
  squareYards: number;
  cents: number;
  gunthas: number;
  grounds: number;
  kanals: number;
  marlas: number;
  formattedSummary: string;
}

/**
 * Computes exhaustive cross-conversion across all South Asian and International land units
 * from any arbitrary input land unit, with support for regional presets.
 */
export function computeRegionalLandBreakdown(
  value: number,
  fromUnitId: string,
  customUnits: CustomUnitDefinition[] = [],
  preset: 'standard' | 'rajshahi' | 'chattogram' = 'standard'
): RegionalLandBreakdown {
  const sqmMeters = normalizeToBase(value, fromUnitId, 'area', customUnits);

  // Katha factor based on regional preset:
  // Standard BD = 720 sft, Rajshahi / North Bengal custom = 435.6 sft (1 Katha = 1 Decimal)
  const kathaSft = preset === 'rajshahi' ? 435.6 : 720;
  const kathaM2 = kathaSft * EXACT_CONVERSION.SFT_TO_M2;
  const bighaM2 = kathaM2 * 20;

  const acres = sqmMeters / EXACT_CONVERSION.ACRE_TO_M2;
  const hectares = sqmMeters / EXACT_CONVERSION.HECTARE_TO_M2;
  const decimals = sqmMeters / EXACT_CONVERSION.DECIMAL_TO_M2;
  const katha = sqmMeters / kathaM2;
  const bigha = sqmMeters / bighaM2;
  const chataks = sqmMeters / EXACT_CONVERSION.CHHATAK_TO_M2;
  const kanis = sqmMeters / EXACT_CONVERSION.KANI_TO_M2;
  const shahiKanis = sqmMeters / EXACT_CONVERSION.KANI_SHAHI_TO_M2;
  const gondas = sqmMeters / EXACT_CONVERSION.GONDA_TO_M2;
  const karas = sqmMeters / EXACT_CONVERSION.KARA_TO_M2;
  const krantis = sqmMeters / EXACT_CONVERSION.KRANTI_TO_M2;
  const tils = sqmMeters / EXACT_CONVERSION.TIL_TO_M2;
  const dhurs = sqmMeters / EXACT_CONVERSION.DHUR_TO_M2;
  const squareFeet = sqmMeters / EXACT_CONVERSION.SFT_TO_M2;
  const squareYards = sqmMeters / EXACT_CONVERSION.YD2_TO_M2;
  const cents = sqmMeters / EXACT_CONVERSION.CENT_TO_M2;
  const gunthas = sqmMeters / EXACT_CONVERSION.GUNTHA_TO_M2;
  const grounds = sqmMeters / EXACT_CONVERSION.GROUND_TO_M2;
  const kanals = sqmMeters / EXACT_CONVERSION.KANAL_TO_M2;
  const marlas = sqmMeters / EXACT_CONVERSION.MARLA_TO_M2;

  const formattedSummary = `${decimals.toFixed(2)} Dec = ${katha.toFixed(2)} Katha = ${chataks.toFixed(1)} Chatak = ${bigha.toFixed(3)} Bigha = ${kanis.toFixed(3)} Kani`;

  return {
    acres,
    hectares,
    decimals,
    katha,
    bigha,
    chataks,
    kanis,
    shahiKanis,
    gondas,
    karas,
    krantis,
    tils,
    dhurs,
    squareFeet,
    squareMeters: sqmMeters,
    squareYards,
    cents,
    gunthas,
    grounds,
    kanals,
    marlas,
    formattedSummary,
  };
}

/* -------------------------------------------------------------
   ADVANCED ARCHITECTURAL FEET-INCH PARSER
   Handles fractional inches (e.g. 12'-6 1/2"), decimal feet, meters, mm
------------------------------------------------------------- */
export interface FeetInchParseResult {
  isValid: boolean;
  totalInches: number;
  totalFeet: number;
  totalMeters: number;
  totalMm: number;
  normalizedString: string;
  fractionString: string;
  decimalFeetString: string;
  metricString: string;
  breakdown?: {
    feet: number;
    wholeInches: number;
    fractionText: string;
    numerator?: number;
    denominator?: number;
    isNegative: boolean;
  };
  errorMessage?: string;
}

function formatInchesResult(inches: number): FeetInchParseResult {
  const isNeg = inches < 0;
  const absInches = Math.abs(inches);
  const totalFeet = inches / 12;
  const totalMeters = (inches * 25.4) / 1000;
  const totalMm = inches * 25.4;

  const ft = Math.floor(absInches / 12);
  const remInches = absInches - ft * 12;
  const wholeInches = Math.floor(remInches);
  const fracPart = remInches - wholeInches;
  const num16 = Math.round(fracPart * 16);

  let finalFt = ft;
  let finalWholeInches = wholeInches;
  let fractionText = '';
  let num = 0;
  let den = 16;

  if (num16 === 16) {
    finalWholeInches += 1;
    if (finalWholeInches === 12) {
      finalFt += 1;
      finalWholeInches = 0;
    }
  } else if (num16 > 0) {
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const div = gcd(num16, 16);
    num = num16 / div;
    den = 16 / div;
    fractionText = ` ${num}/${den}`;
  }

  const sign = isNeg ? '-' : '';
  const exactSutaTotal = remInches * 8;
  const wholeSuta = Math.round(exactSutaTotal % 8);
  const sutaNote = wholeSuta > 0 ? ` (${wholeSuta} suta)` : '';

  return {
    isValid: true,
    totalInches: inches,
    totalFeet,
    totalMeters,
    totalMm,
    normalizedString: `${sign}${finalFt} ft ${remInches.toFixed(3)} in`,
    fractionString: `${sign}${finalFt}'-${finalWholeInches}${fractionText}"${sutaNote}`,
    decimalFeetString: `${sign}${Math.abs(totalFeet).toFixed(4)} ft`,
    metricString: `${sign}${Math.abs(totalMeters).toFixed(4)} m`,
    breakdown: {
      feet: finalFt,
      wholeInches: finalWholeInches,
      fractionText,
      numerator: num,
      denominator: den,
      isNegative: isNeg,
    },
  };
}

export function parseFeetInchString(rawInput: string): FeetInchParseResult {
  let clean = rawInput.trim();
  if (!clean) {
    return {
      isValid: false,
      totalInches: 0,
      totalFeet: 0,
      totalMeters: 0,
      totalMm: 0,
      normalizedString: '',
      fractionString: '',
      decimalFeetString: '',
      metricString: '',
      errorMessage: 'Input string is empty',
    };
  }

  // Translate Bengali numerals (০-৯) to Latin digits (0-9)
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  clean = clean.replace(/[০-৯]/g, (d) => String(bengaliDigits.indexOf(d)));

  // Normalize Bengali words for suta/feet/inch
  clean = clean
    .replace(/\b(?:সুতা|সূতা|সুত)\b/gi, 'suta')
    .replace(/\b(?:ইঞ্চি|ইঞ্চ)\b/gi, 'in')
    .replace(/\b(?:ফিট|ফুট)\b/gi, 'ft');

  let isNegative = false;
  if (clean.startsWith('-')) {
    isNegative = true;
    clean = clean.substring(1).trim();
  }

  clean = clean.replace(/[-–—]{2,}/g, '-');

  // Check if pure metric format: e.g. "3810 mm", "3.81 m", "381 cm"
  const metricMmMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:mm|millimeter|millimeters)$/i);
  if (metricMmMatch) {
    const mm = parseFloat(metricMmMatch[1]);
    const inches = (isNegative ? -1 : 1) * (mm / 25.4);
    return formatInchesResult(inches);
  }

  const metricMMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:m|meter|meters)$/i);
  if (metricMMatch) {
    const m = parseFloat(metricMMatch[1]);
    const inches = (isNegative ? -1 : 1) * ((m * 1000) / 25.4);
    return formatInchesResult(inches);
  }

  const metricCmMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:cm|centimeter|centimeters)$/i);
  if (metricCmMatch) {
    const cm = parseFloat(metricCmMatch[1]);
    const inches = (isNegative ? -1 : 1) * ((cm * 10) / 25.4);
    return formatInchesResult(inches);
  }

  // Pattern: 12'-6 1/2", 12' 6 1/2", 12-6 1/2, 12'6", 12' 6", 12-6, 12ft 6in
  const archMatch = clean.match(
    /^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)?\s*[-–—\s]?\s*(\d+(?:\.\d+)?)?\s*(?:"|in|inch|inches)?\s*(\d+)\/(\d+)?\s*(?:"|in|inch|inches)?$/i
  );

  if (archMatch) {
    const ft = parseFloat(archMatch[1]) || 0;
    const inWhole = parseFloat(archMatch[2]) || 0;
    const num = parseFloat(archMatch[3]) || 0;
    const den = parseFloat(archMatch[4]) || 1;
    const totalInches = (isNegative ? -1 : 1) * (ft * 12 + inWhole + (den !== 0 ? num / den : 0));
    return formatInchesResult(totalInches);
  }

  // Feet and decimal inches or simple feet-inch without fraction: e.g. 12'-6", 12' 6", 12-6, 12'
  const simpleArchMatch = clean.match(
    /^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)?\s*[-–—\s]?\s*(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?$/i
  );
  if (simpleArchMatch) {
    const ft = parseFloat(simpleArchMatch[1]) || 0;
    const inVal = parseFloat(simpleArchMatch[2]) || 0;
    const totalInches = (isNegative ? -1 : 1) * (ft * 12 + inVal);
    return formatInchesResult(totalInches);
  }

  // Single feet measurement: e.g. 12', 12.5 ft, 12ft
  const feetOnlyMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)$/i);
  if (feetOnlyMatch) {
    const ft = parseFloat(feetOnlyMatch[1]) || 0;
    return formatInchesResult((isNegative ? -1 : 1) * ft * 12);
  }

  // Single inches measurement: e.g. 150", 150 in, 150 inches
  const inchesOnlyMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)$/i);
  if (inchesOnlyMatch) {
    const inVal = parseFloat(inchesOnlyMatch[1]) || 0;
    return formatInchesResult((isNegative ? -1 : 1) * inVal);
  }

  // Suta input: e.g. 4 suta, 6 suta
  const sutaMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:suta|soot|sut)\b/i);
  if (sutaMatch) {
    const sutaVal = parseFloat(sutaMatch[1]) || 0;
    return formatInchesResult((isNegative ? -1 : 1) * (sutaVal / 8));
  }

  // Plain numeric fallback
  const plainNum = parseFloat(clean);
  if (!isNaN(plainNum)) {
    return formatInchesResult((isNegative ? -1 : 1) * plainNum * 12);
  }

  return {
    isValid: false,
    totalInches: 0,
    totalFeet: 0,
    totalMeters: 0,
    totalMm: 0,
    normalizedString: '',
    fractionString: '',
    decimalFeetString: '',
    metricString: '',
    errorMessage: `Unrecognized feet-inch format: "${rawInput}"`,
  };
}

export interface FormatFeetInchesOptions {
  isMeters?: boolean;
  useFractions?: boolean;
  maxDenominator?: number;
  showZeroInches?: boolean;
  decimalInches?: boolean;
  precision?: number;
  showSuta?: boolean;
}

export function formatFeetInches(value: number, options?: FormatFeetInchesOptions): string {
  if (isNaN(value) || !isFinite(value)) return '—';
  const totalFeet = options?.isMeters ? value / EXACT_CONVERSION.FT_TO_M : value;
  const isNegative = totalFeet < -1e-9;
  const absFeet = Math.abs(totalFeet);
  if (absFeet < 1e-9) return `0'-0"`;

  const sign = isNegative ? '-' : '';
  const totalInches = absFeet * 12;
  let ft = Math.floor(absFeet);
  let remInches = totalInches - ft * 12;

  if (remInches >= 11.999999) {
    ft += 1;
    remInches = 0;
  }

  if (options?.decimalInches) {
    const prec = options?.precision ?? 2;
    return `${sign}${ft}'-${remInches.toFixed(prec)}"`;
  }

  const denom = options?.maxDenominator || 16;
  const wholeInches = Math.floor(remInches);
  const fracPart = remInches - wholeInches;
  const numerator = Math.round(fracPart * denom);

  let finalFt = ft;
  let finalWholeInches = wholeInches;
  let fractionText = '';

  if (numerator === denom) {
    finalWholeInches += 1;
    if (finalWholeInches === 12) {
      finalFt += 1;
      finalWholeInches = 0;
    }
  } else if (numerator > 0) {
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const div = gcd(numerator, denom);
    fractionText = ` ${numerator / div}/${denom / div}`;
  }

  let sutaText = '';
  if (options?.showSuta) {
    const wholeSuta = Math.round((remInches * 8) % 8);
    if (wholeSuta > 0) sutaText = ` (${wholeSuta} suta)`;
  }

  return `${sign}${finalFt}'-${finalWholeInches}${fractionText}"${sutaText}`;
}

export interface FormatNumberOptions {
  maxDecimals?: number;
  minDecimals?: number;
  useGrouping?: boolean;
  trimTrailingZeros?: boolean;
}

export function formatSmartNumber(val: number, options?: number | FormatNumberOptions): string {
  if (isNaN(val) || !isFinite(val)) return '';
  const opts: FormatNumberOptions = typeof options === 'number' ? { maxDecimals: options } : options || {};
  const { useGrouping = true, trimTrailingZeros = true } = opts;

  let maxDec = opts.maxDecimals;
  if (maxDec === undefined) {
    const absVal = Math.abs(val);
    if (absVal >= 100000) maxDec = 2;
    else if (absVal >= 1000) maxDec = 2;
    else if (absVal >= 10) maxDec = 3;
    else if (absVal >= 1) maxDec = 4;
    else if (absVal >= 0.001) maxDec = 5;
    else if (absVal > 0) return val.toExponential(4);
    else return '0';
  }

  const minDec = opts.minDecimals ?? 0;
  if (Number.isInteger(val) && minDec === 0) {
    return useGrouping ? val.toLocaleString('en-US') : val.toString();
  }

  const factor = Math.pow(10, maxDec);
  const rounded = Math.round((val + Number.EPSILON) * factor) / factor;
  const parts = rounded.toString().split('.');
  const intPart = parseInt(parts[0], 10);
  const formattedInt = useGrouping ? intPart.toLocaleString('en-US') : intPart.toString();

  let decPart = parts[1] || '';
  if (!trimTrailingZeros && decPart.length < minDec) {
    decPart = decPart.padEnd(minDec, '0');
  }

  return decPart ? `${formattedInt}.${decPart}` : formattedInt;
}

export function formatNumberWhileTyping(inputStr: string): {
  formatted: string;
  isArchitectural: boolean;
  cleanNumeric?: number;
} {
  const trimmed = inputStr.trim();
  if (!trimmed) return { formatted: '', isArchitectural: false };

  const isArch =
    /['"]/.test(trimmed) ||
    /\b(?:ft|feet|in|inch|inches|mm|cm|m|suta)\b/i.test(trimmed) ||
    /^\d+\s*[-–—]\s*\d+/.test(trimmed) ||
    /^\d+\s+\d+\s+\d+\/\d+/.test(trimmed) ||
    /^\d+\/\d+/.test(trimmed);

  if (isArch) return { formatted: inputStr, isArchitectural: true };
  if (/[+*/]/.test(trimmed)) return { formatted: inputStr, isArchitectural: false };

  const clean = inputStr.replace(/,/g, '');
  const isNeg = clean.startsWith('-');
  const unsigned = isNeg ? clean.substring(1) : clean;
  if ((unsigned.match(/\./g) || []).length > 1) return { formatted: inputStr, isArchitectural: false };

  const [intPart, decPart] = unsigned.split('.');
  let formattedInt = intPart;
  if (/^\d+$/.test(intPart)) formattedInt = parseInt(intPart, 10).toLocaleString('en-US');

  const prefix = isNeg ? '-' : '';
  const cleanNum = parseFloat(clean);
  const formatted = unsigned.includes('.') ? `${prefix}${formattedInt}.${decPart ?? ''}` : `${prefix}${formattedInt}`;
  return { formatted, isArchitectural: false, cleanNumeric: !isNaN(cleanNum) ? cleanNum : undefined };
}

/* -------------------------------------------------------------
   NATURAL CONVERSION EXPRESSION PARSER
   Supports: "5 katha to sft", "25 mpa to psi", "100 c to f", "12'-6 1/2" in mm"
------------------------------------------------------------- */
export interface NaturalExpressionParseResult {
  parsed: boolean;
  category?: UnitCategoryKey;
  fromUnit?: string;
  toUnit?: string;
  inputValue?: number;
  result?: number;
  formattedResult?: string;
  expressionSummary?: string;
}

/**
 * Parses natural language conversion queries across English and Bengali keywords
 */
export function parseNaturalConversionExpression(
  query: string,
  customUnits: CustomUnitDefinition[] = []
): NaturalExpressionParseResult {
  let text = query.trim().toLowerCase();
  if (!text) return { parsed: false };

  // Translate Bengali digits ০-৯ to 0-9
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  text = text.replace(/[০-৯]/g, (d) => String(bnDigits.indexOf(d)));

  // Common synonym map to canonical unit IDs
  const aliasMap: Record<string, { category: UnitCategoryKey; unitId: string }> = {
    // Length
    meter: { category: 'length', unitId: 'm' },
    meters: { category: 'length', unitId: 'm' },
    m: { category: 'length', unitId: 'm' },
    মিটার: { category: 'length', unitId: 'm' },
    millimeter: { category: 'length', unitId: 'mm' },
    millimeters: { category: 'length', unitId: 'mm' },
    mm: { category: 'length', unitId: 'mm' },
    মিমি: { category: 'length', unitId: 'mm' },
    cm: { category: 'length', unitId: 'cm' },
    centimeter: { category: 'length', unitId: 'cm' },
    সেমি: { category: 'length', unitId: 'cm' },
    km: { category: 'length', unitId: 'km' },
    kilometer: { category: 'length', unitId: 'km' },
    কিমি: { category: 'length', unitId: 'km' },
    ft: { category: 'length', unitId: 'ft' },
    foot: { category: 'length', unitId: 'ft' },
    feet: { category: 'length', unitId: 'ft' },
    ফুট: { category: 'length', unitId: 'ft' },
    ফিট: { category: 'length', unitId: 'ft' },
    in: { category: 'length', unitId: 'in' },
    inch: { category: 'length', unitId: 'in' },
    inches: { category: 'length', unitId: 'in' },
    ইঞ্চি: { category: 'length', unitId: 'in' },
    suta: { category: 'length', unitId: 'suta' },
    সুতা: { category: 'length', unitId: 'suta' },
    haat: { category: 'length', unitId: 'haat' },
    হাত: { category: 'length', unitId: 'haat' },
    gaj: { category: 'length', unitId: 'gaj' },
    গজ: { category: 'length', unitId: 'gaj' },
    angul: { category: 'length', unitId: 'angul' },
    আঙুল: { category: 'length', unitId: 'angul' },

    // Area / Land
    katha: { category: 'area', unitId: 'katha' },
    কাঠা: { category: 'area', unitId: 'katha' },
    decimal: { category: 'area', unitId: 'decimal' },
    shatak: { category: 'area', unitId: 'decimal' },
    শতক: { category: 'area', unitId: 'decimal' },
    শতাংশ: { category: 'area', unitId: 'decimal' },
    ডেসিমাল: { category: 'area', unitId: 'decimal' },
    bigha: { category: 'area', unitId: 'bigha' },
    বিঘা: { category: 'area', unitId: 'bigha' },
    chhatak: { category: 'area', unitId: 'chhatak' },
    ছটাক: { category: 'area', unitId: 'chhatak' },
    kani: { category: 'area', unitId: 'kani' },
    কানি: { category: 'area', unitId: 'kani' },
    gonda: { category: 'area', unitId: 'gonda' },
    গণ্ডা: { category: 'area', unitId: 'gonda' },
    kara: { category: 'area', unitId: 'kara' },
    কড়া: { category: 'area', unitId: 'kara' },
    sft: { category: 'area', unitId: 'ft2' },
    sqft: { category: 'area', unitId: 'ft2' },
    'sq ft': { category: 'area', unitId: 'ft2' },
    বর্গফুট: { category: 'area', unitId: 'ft2' },
    sqm: { category: 'area', unitId: 'm2' },
    m2: { category: 'area', unitId: 'm2' },
    'm²': { category: 'area', unitId: 'm2' },
    বর্গমিটার: { category: 'area', unitId: 'm2' },
    acre: { category: 'area', unitId: 'acre' },
    acres: { category: 'area', unitId: 'acre' },
    একর: { category: 'area', unitId: 'acre' },
    hectare: { category: 'area', unitId: 'ha' },
    ha: { category: 'area', unitId: 'ha' },
    হেক্টর: { category: 'area', unitId: 'ha' },

    // Volume
    cft: { category: 'volume', unitId: 'cft' },
    cuft: { category: 'volume', unitId: 'cft' },
    সিএফটি: { category: 'volume', unitId: 'cft' },
    ঘনফুট: { category: 'volume', unitId: 'cft' },
    m3: { category: 'volume', unitId: 'm3' },
    'm³': { category: 'volume', unitId: 'm3' },
    cum: { category: 'volume', unitId: 'm3' },
    ঘনমিটার: { category: 'volume', unitId: 'm3' },
    liter: { category: 'volume', unitId: 'liter' },
    liters: { category: 'volume', unitId: 'liter' },
    লিটার: { category: 'volume', unitId: 'liter' },
    l: { category: 'volume', unitId: 'liter' },
    brass: { category: 'volume', unitId: 'brass' },
    ব্রাস: { category: 'volume', unitId: 'brass' },
    gallon: { category: 'volume', unitId: 'gal_us' },
    gallons: { category: 'volume', unitId: 'gal_us' },
    gpm: { category: 'flow_rate', unitId: 'gpm' },

    // Pressure
    mpa: { category: 'pressure', unitId: 'MPa' },
    kpa: { category: 'pressure', unitId: 'kPa' },
    pa: { category: 'pressure', unitId: 'Pa' },
    psi: { category: 'pressure', unitId: 'psi' },
    ksi: { category: 'pressure', unitId: 'ksi' },
    bar: { category: 'pressure', unitId: 'bar' },
    psf: { category: 'pressure', unitId: 'psf' },
    tsf: { category: 'pressure', unitId: 'tsf' },

    // Temperature
    c: { category: 'temperature', unitId: 'c' },
    celsius: { category: 'temperature', unitId: 'c' },
    সেলসিয়াস: { category: 'temperature', unitId: 'c' },
    f: { category: 'temperature', unitId: 'f' },
    fahrenheit: { category: 'temperature', unitId: 'f' },
    ফারেনহাইট: { category: 'temperature', unitId: 'f' },
    k: { category: 'temperature', unitId: 'k' },
    kelvin: { category: 'temperature', unitId: 'k' },

    // Mass
    kg: { category: 'mass', unitId: 'kg' },
    কেজি: { category: 'mass', unitId: 'kg' },
    kilogram: { category: 'mass', unitId: 'kg' },
    lb: { category: 'mass', unitId: 'lb' },
    lbs: { category: 'mass', unitId: 'lb' },
    pound: { category: 'mass', unitId: 'lb' },
    pounds: { category: 'mass', unitId: 'lb' },
    maund: { category: 'mass', unitId: 'maund' },
    mon: { category: 'mass', unitId: 'maund' },
    মণ: { category: 'mass', unitId: 'maund' },
    seer: { category: 'mass', unitId: 'seer' },
    সের: { category: 'mass', unitId: 'seer' },
    tola: { category: 'mass', unitId: 'tola' },
    তোলা: { category: 'mass', unitId: 'tola' },
    ভরি: { category: 'mass', unitId: 'tola' },
    ton: { category: 'mass', unitId: 'tonne' },
    tonne: { category: 'mass', unitId: 'tonne' },
    টন: { category: 'mass', unitId: 'tonne' },

    // Power
    hp: { category: 'power', unitId: 'hp' },
    kw: { category: 'power', unitId: 'kW' },
    tr: { category: 'power', unitId: 'TR' },

    // Velocity
    'km/h': { category: 'velocity', unitId: 'km/h' },
    kmh: { category: 'velocity', unitId: 'km/h' },
    mph: { category: 'velocity', unitId: 'mph' },
    'm/s': { category: 'velocity', unitId: 'm/s' },
  };

  // Match expressions: e.g. "5 katha to sft", "100 c in f", "25 mpa = psi", "12'-6 1/2\" to mm"
  const regex = /^([+-]?\d+(?:\.\d+)?|(?:\d+['\-].*))\s+([a-zA-Z\u0980-\u09FF²/°]+)\s+(?:to|in|into|as|=|→)\s+([a-zA-Z\u0980-\u09FF²/°]+)$/i;
  const match = text.match(regex);

  if (match) {
    const valRaw = match[1];
    const fromRaw = match[2];
    const toRaw = match[3];

    let numericVal = parseFloat(valRaw);
    if (isNaN(numericVal)) {
      const arch = parseFeetInchString(valRaw);
      if (arch.isValid) numericVal = arch.totalFeet;
    }

    const fromMatch = aliasMap[fromRaw];
    const toMatch = aliasMap[toRaw];

    if (fromMatch && toMatch && fromMatch.category === toMatch.category) {
      let resVal = 0;
      try {
        resVal = convertDirect(numericVal, fromMatch.unitId, toMatch.unitId, fromMatch.category, customUnits);
      } catch {
        // ignore
      }
      return {
        parsed: true,
        category: fromMatch.category,
        fromUnit: fromMatch.unitId,
        toUnit: toMatch.unitId,
        inputValue: numericVal,
        result: resVal,
        formattedResult: formatSmartNumber(resVal, 4),
        expressionSummary: `${numericVal} ${fromMatch.unitId} → ${toMatch.unitId} (${fromMatch.category})`,
      };
    }

    if (fromMatch) {
      const targetUnit = toMatch?.unitId || BASE_UNITS[fromMatch.category];
      let resVal = 0;
      try {
        resVal = convertDirect(numericVal, fromMatch.unitId, targetUnit, fromMatch.category, customUnits);
      } catch {
        // ignore
      }
      return {
        parsed: true,
        category: fromMatch.category,
        fromUnit: fromMatch.unitId,
        toUnit: targetUnit,
        inputValue: numericVal,
        result: resVal,
        formattedResult: formatSmartNumber(resVal, 4),
        expressionSummary: `${numericVal} ${fromMatch.unitId} (${fromMatch.category})`,
      };
    }
  }

  return { parsed: false };
}
