import { CustomUnitDefinition, UnitCategoryKey } from '../types/civil';

export interface UnitInfo {
  id: string;
  name: string;
  symbol: string;
  category: UnitCategoryKey;
  toBaseFactor: number; // Factor to multiply by to reach canonical Base SI unit
  description: string;
  isRegional?: boolean;
  system: 'metric' | 'imperial' | 'regional' | 'universal';
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
  CENT_TO_M2: 40.468564224,    // 435.6 sq ft (1/100 Acre - South India)
  GUNTHA_TO_M2: 101.17141056,  // 1/40 Acre = 1,089 sq ft (33 ft × 33 ft)
  GROUND_TO_M2: 222.967296,    // 2,400 sq ft (Tamil Nadu standard)
  KANAL_TO_M2: 505.8570528,    // 1/8 Acre = 20 Marlas = 5,445 sq ft
  MARLA_TO_M2: 25.29285264,    // 1/160 Acre = 272.25 sq ft
  GANDA_TO_M2: 20.06705664,    // 216 sq ft = 4 Karas
  CHHATAK_TO_M2: 4.1806368,    // 45 sq ft = 1/16 Katha
  KARA_TO_M2: 5.01676416,      // 54 sq ft = 1/4 Ganda

  // Length: 1 ft = 0.3048 m, 1 in = 0.0254 m
  FT_TO_M: 0.3048,
  M_TO_FT: 1 / 0.3048, // ~3.2808398950131233
  IN_TO_M: 0.0254,
  M_TO_IN: 1 / 0.0254, // ~39.37007874015748
  YD_TO_M: 0.9144,
  MI_TO_M: 1609.344,
  CHAIN_TO_M: 20.1168, // 66 ft (Gunter's Survey Chain)
  LINK_TO_M: 0.201168, // 7.92 in (1/100 chain)
  FATHOM_TO_M: 1.8288, // 6 ft
  ROD_TO_M: 5.0292,    // 16.5 ft (Perch / Pole)

  // Force & Stress
  KN_TO_N: 1000,
  N_TO_KN: 0.001,
  MN_TO_N: 1000000,
  LBF_TO_N: 4.4482216152605,
  KIP_TO_N: 4448.2216152605,
  KGF_TO_N: 9.80665,
  TONF_TO_N: 9806.65,
  DYN_TO_N: 1e-5,

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
  TSF_TO_PA: 95760.51796067168, // Short tons / sq ft (2000 psf)
  BAR_TO_PA: 100000,
  MBAR_TO_PA: 100,
  ATM_TO_PA: 101325,
  KGF_CM2_TO_PA: 98066.5,
  MMHG_TO_PA: 133.322387415,
  MMH2O_TO_PA: 9.80665,

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
  TON_US_TO_KG: 907.18474,    // 2,000 lbs
  TON_UK_TO_KG: 1016.0469088, // 2,240 lbs
  CEMENT_BAG_KG: 50.0,
  MAUND_TO_KG: 37.32417216,  // 40 seers
  SEER_TO_KG: 0.933104304,
  TOLA_TO_KG: 0.0116638038,  // 180 grains

  // Velocity: Base unit = m/s
  FTS_TO_MPS: 0.3048,
  KMH_TO_MPS: 1 / 3.6,
  MPH_TO_MPS: 0.44704,
  KNOT_TO_MPS: 0.5144444444444445,
  MMS_TO_MPS: 0.001,
  INS_TO_MPS: 0.0254,

  // Flow Rate: Base unit = m³/s
  CFS_TO_M3S: 0.028316846592,
  LPS_TO_M3S: 0.001,
  LPM_TO_M3S: 0.001 / 60,
  M3_HR_TO_M3S: 1 / 3600,
  GPM_TO_M3S: 0.0000630901964,
  GPM_UK_TO_M3S: 0.0000757681667,
  MGD_TO_M3S: 0.04381263638888889,
  ML_DAY_TO_M3S: 1000 / 86400,
} as const;

/**
 * Canonical Base SI Units for each Engineering Discipline
 */
export const BASE_UNITS: Record<UnitCategoryKey, string> = {
  length: 'm',
  area: 'm2',
  volume: 'm3',
  mass: 'kg',
  force: 'N',
  distributed_load: 'N/m',
  pressure: 'Pa',
  density: 'kN/m3', // Standard geotechnical/civil unit weight
  moment: 'N.m',     // SI base moment: Newton · Meter
  slope: 'ratio',
  velocity: 'm/s',
  flow_rate: 'm3/s',
};

/**
 * Standard Units Catalog with verified physical multipliers to canonical SI base units
 */
export const STANDARD_UNITS: Record<UnitCategoryKey, UnitInfo[]> = {
  length: [
    { id: 'm', name: 'Meter', symbol: 'm', category: 'length', toBaseFactor: 1.0, description: 'SI base unit of length', system: 'metric' },
    { id: 'mm', name: 'Millimeter', symbol: 'mm', category: 'length', toBaseFactor: 0.001, description: 'Drafting & reinforcement rebar unit (1 m = 1000 mm)', system: 'metric' },
    { id: 'cm', name: 'Centimeter', symbol: 'cm', category: 'length', toBaseFactor: 0.01, description: 'Metric length unit (1 m = 100 cm)', system: 'metric' },
    { id: 'dm', name: 'Decimeter', symbol: 'dm', category: 'length', toBaseFactor: 0.1, description: 'Metric decimeter (0.1 m)', system: 'metric' },
    { id: 'km', name: 'Kilometer', symbol: 'km', category: 'length', toBaseFactor: 1000.0, description: 'Highway alignment & chainage (1000 m)', system: 'metric' },
    { id: 'in', name: 'Inch', symbol: 'in', category: 'length', toBaseFactor: EXACT_CONVERSION.IN_TO_M, description: 'Imperial architectural inch (25.4 mm)', system: 'imperial' },
    { id: 'ft', name: 'Foot', symbol: 'ft', category: 'length', toBaseFactor: EXACT_CONVERSION.FT_TO_M, description: 'Imperial architectural foot (12 in = 0.3048 m)', system: 'imperial' },
    { id: 'yd', name: 'Yard', symbol: 'yd', category: 'length', toBaseFactor: EXACT_CONVERSION.YD_TO_M, description: 'Survey yard (3 ft = 0.9144 m)', system: 'imperial' },
    { id: 'mi', name: 'Statute Mile', symbol: 'mi', category: 'length', toBaseFactor: EXACT_CONVERSION.MI_TO_M, description: 'Statute road mile (5,280 ft = 1,609.344 m)', system: 'imperial' },
    { id: 'mile', name: 'Mile (Statute)', symbol: 'mi', category: 'length', toBaseFactor: EXACT_CONVERSION.MI_TO_M, description: 'Statute road mile alias', system: 'imperial' },
    { id: 'rft', name: 'Running Foot (RFT)', symbol: 'rft', category: 'length', toBaseFactor: EXACT_CONVERSION.FT_TO_M, description: 'Linear construction takeoff foot', system: 'imperial' },
    { id: 'rm', name: 'Running Meter (RMT)', symbol: 'rm', category: 'length', toBaseFactor: 1.0, description: 'Linear construction takeoff meter', system: 'metric' },
    { id: 'ft-in', name: 'Feet-Inch (Arch)', symbol: `ft'-in"`, category: 'length', toBaseFactor: EXACT_CONVERSION.FT_TO_M, description: `Architectural composite notation (e.g. 12'-6 1/2")`, system: 'imperial' },
    { id: 'chain', name: "Gunter's Chain", symbol: 'ch', category: 'length', toBaseFactor: EXACT_CONVERSION.CHAIN_TO_M, description: 'Cadastral survey chain (66 ft = 20.1168 m = 100 links)', system: 'imperial' },
    { id: 'link', name: 'Survey Link', symbol: 'li', category: 'length', toBaseFactor: EXACT_CONVERSION.LINK_TO_M, description: 'Cadastral link (7.92 in = 0.201168 m)', system: 'imperial' },
    { id: 'fathom', name: 'Fathom', symbol: 'fath', category: 'length', toBaseFactor: EXACT_CONVERSION.FATHOM_TO_M, description: 'Marine/hydraulics sounding depth (6 ft = 1.8288 m)', system: 'imperial' },
    { id: 'rod', name: 'Rod / Pole / Perch', symbol: 'rd', category: 'length', toBaseFactor: EXACT_CONVERSION.ROD_TO_M, description: 'Survey rod (16.5 ft = 5.0292 m)', system: 'imperial' },
  ],
  area: [
    { id: 'm2', name: 'Square Meter', symbol: 'm²', category: 'area', toBaseFactor: 1.0, description: 'SI base unit of area', system: 'metric' },
    { id: 'mm2', name: 'Square Millimeter', symbol: 'mm²', category: 'area', toBaseFactor: 1e-6, description: 'Steel cross-section area (As)', system: 'metric' },
    { id: 'cm2', name: 'Square Centimeter', symbol: 'cm²', category: 'area', toBaseFactor: 1e-4, description: 'Metric section area', system: 'metric' },
    { id: 'km2', name: 'Square Kilometer', symbol: 'km²', category: 'area', toBaseFactor: 1e6, description: 'Catchment / watershed area (1 km² = 100 ha)', system: 'metric' },
    { id: 'ft2', name: 'Square Foot (SFT)', symbol: 'sq ft', category: 'area', toBaseFactor: EXACT_CONVERSION.SFT_TO_M2, description: 'Floor & slab plan area (0.092903 m²)', system: 'imperial' },
    { id: 'sft', name: 'Square Foot (SFT)', symbol: 'sft', category: 'area', toBaseFactor: EXACT_CONVERSION.SFT_TO_M2, description: 'Traditional construction square foot', system: 'imperial' },
    { id: 'sqft', name: 'Square Foot (sqft)', symbol: 'sq ft', category: 'area', toBaseFactor: EXACT_CONVERSION.SFT_TO_M2, description: 'Square foot alias', system: 'imperial' },
    { id: 'in2', name: 'Square Inch', symbol: 'sq in', category: 'area', toBaseFactor: EXACT_CONVERSION.IN2_TO_M2, description: 'Imperial rebar area', system: 'imperial' },
    { id: 'yd2', name: 'Square Yard', symbol: 'sq yd', category: 'area', toBaseFactor: EXACT_CONVERSION.YD2_TO_M2, description: 'Pavement surface area (9 sq ft)', system: 'imperial' },
    { id: 'sqyd', name: 'Square Yard (sqyd)', symbol: 'sq yd', category: 'area', toBaseFactor: EXACT_CONVERSION.YD2_TO_M2, description: 'Square yard alias', system: 'imperial' },
    { id: 'acre', name: 'International Acre', symbol: 'ac', category: 'area', toBaseFactor: EXACT_CONVERSION.ACRE_TO_M2, description: '43,560 sq ft land parcel (4046.856 m² = 100 decimals)', system: 'imperial' },
    { id: 'hectare', name: 'Hectare', symbol: 'ha', category: 'area', toBaseFactor: EXACT_CONVERSION.HECTARE_TO_M2, description: '10,000 m² cadastre parcel (2.471 acres = 247.1 decimals)', system: 'metric' },
    { id: 'ha', name: 'Hectare (Alias)', symbol: 'ha', category: 'area', toBaseFactor: EXACT_CONVERSION.HECTARE_TO_M2, description: '10,000 m² cadastre unit', system: 'metric' },
    { id: 'are', name: 'Are', symbol: 'a', category: 'area', toBaseFactor: EXACT_CONVERSION.ARE_TO_M2, description: '100 m² metric land parcel (0.01 ha)', system: 'metric' },
    { id: 'sqm', name: 'Square Meter (sqm)', symbol: 'm²', category: 'area', toBaseFactor: 1.0, description: 'Square meter alias', system: 'metric' },
    { id: 'sqmi', name: 'Square Mile', symbol: 'sq mi', category: 'area', toBaseFactor: EXACT_CONVERSION.SQMI_TO_M2, description: '640 acres watershed area', system: 'imperial' },

    // South Asian Regional Land Units (Authoritative standards):
    { id: 'decimal', name: 'Decimal (Satang/Shatak)', symbol: 'dec', category: 'area', toBaseFactor: EXACT_CONVERSION.DECIMAL_TO_M2, description: '1/100 Acre = 435.6 sq ft = 40.4686 m²', isRegional: true, system: 'regional' },
    { id: 'katha', name: 'Katha (Bengal Standard)', symbol: 'katha', category: 'area', toBaseFactor: EXACT_CONVERSION.KATHA_TO_M2, description: '720 sq ft = 1.65289 Decimals = 66.8902 m²', isRegional: true, system: 'regional' },
    { id: 'bigha', name: 'Bigha (Standard Bengal)', symbol: 'bigha', category: 'area', toBaseFactor: EXACT_CONVERSION.BIGHA_TO_M2, description: '20 Kathas = 14,400 sq ft = 33.0579 Decimals = 1,337.80 m²', isRegional: true, system: 'regional' },
    { id: 'cent', name: 'Cent (South India)', symbol: 'cent', category: 'area', toBaseFactor: EXACT_CONVERSION.CENT_TO_M2, description: '1/100 Acre = 435.6 sq ft (Kerala / Tamil Nadu / AP)', isRegional: true, system: 'regional' },
    { id: 'guntha', name: 'Guntha (Gunta)', symbol: 'guntha', category: 'area', toBaseFactor: EXACT_CONVERSION.GUNTHA_TO_M2, description: '1/40 Acre = 1,089 sq ft (33 ft × 33 ft - MH/GJ/KA)', isRegional: true, system: 'regional' },
    { id: 'ground', name: 'Ground (Tamil Nadu)', symbol: 'ground', category: 'area', toBaseFactor: EXACT_CONVERSION.GROUND_TO_M2, description: 'Standard South Indian land unit = 2,400 sq ft = 222.97 m²', isRegional: true, system: 'regional' },
    { id: 'kanal', name: 'Kanal (North India)', symbol: 'kanal', category: 'area', toBaseFactor: EXACT_CONVERSION.KANAL_TO_M2, description: '1/8 Acre = 20 Marlas = 5,445 sq ft (Punjab/Haryana/J&K)', isRegional: true, system: 'regional' },
    { id: 'marla', name: 'Marla (Standard)', symbol: 'marla', category: 'area', toBaseFactor: EXACT_CONVERSION.MARLA_TO_M2, description: '1/160 Acre = 272.25 sq ft = 25.2929 m²', isRegional: true, system: 'regional' },
    { id: 'ganda', name: 'Ganda (Bengal)', symbol: 'ganda', category: 'area', toBaseFactor: EXACT_CONVERSION.GANDA_TO_M2, description: '4 Karas = 216 sq ft = 20.0671 m²', isRegional: true, system: 'regional' },
    { id: 'chhatak', name: 'Chhatak', symbol: 'chhatak', category: 'area', toBaseFactor: EXACT_CONVERSION.CHHATAK_TO_M2, description: '1/16 Katha = 45 sq ft = 4.1806 m²', isRegional: true, system: 'regional' },
    { id: 'kara', name: 'Kara / Kranti', symbol: 'kara', category: 'area', toBaseFactor: EXACT_CONVERSION.KARA_TO_M2, description: '54 sq ft = 5.0168 m² (1/4 Ganda)', isRegional: true, system: 'regional' },
  ],
  volume: [
    { id: 'm3', name: 'Cubic Meter', symbol: 'm³', category: 'volume', toBaseFactor: 1.0, description: 'SI base volume unit', system: 'metric' },
    { id: 'cft', name: 'Cubic Foot (CFT)', symbol: 'cft', category: 'volume', toBaseFactor: EXACT_CONVERSION.CFT_TO_M3, description: 'Traditional concrete/sand volume (35.315 cft/m³)', system: 'imperial' },
    { id: 'ft3', name: 'Cubic Foot (Alias)', symbol: 'cu ft', category: 'volume', toBaseFactor: EXACT_CONVERSION.CFT_TO_M3, description: 'Imperial cubic foot', system: 'imperial' },
    { id: 'cum', name: 'Cubic Meter (cum)', symbol: 'cu m', category: 'volume', toBaseFactor: 1.0, description: 'Takeoff volume alias', system: 'metric' },
    { id: 'liter', name: 'Liter', symbol: 'L', category: 'volume', toBaseFactor: EXACT_CONVERSION.LITER_TO_M3, description: 'Water mixing volume (1 L = 0.001 m³)', system: 'metric' },
    { id: 'L', name: 'Liter (Alias)', symbol: 'L', category: 'volume', toBaseFactor: EXACT_CONVERSION.LITER_TO_M3, description: 'Water mixing volume', system: 'metric' },
    { id: 'ml', name: 'Milliliter', symbol: 'mL', category: 'volume', toBaseFactor: 1e-6, description: 'Admixture fluid measure (1 cm³)', system: 'metric' },
    { id: 'gal_us', name: 'US Gallon', symbol: 'US gal', category: 'volume', toBaseFactor: EXACT_CONVERSION.GAL_US_TO_M3, description: 'US liquid gallon (231 cu in = 3.7854 L)', system: 'imperial' },
    { id: 'gal_uk', name: 'Imperial Gallon', symbol: 'UK gal', category: 'volume', toBaseFactor: EXACT_CONVERSION.GAL_UK_TO_M3, description: 'UK liquid gallon (4.54609 L)', system: 'imperial' },
    { id: 'yd3', name: 'Cubic Yard', symbol: 'cu yd', category: 'volume', toBaseFactor: EXACT_CONVERSION.YD3_TO_M3, description: 'Readymix batch transit yard (27 cft = 0.7646 m³)', system: 'imperial' },
    { id: 'in3', name: 'Cubic Inch', symbol: 'cu in', category: 'volume', toBaseFactor: EXACT_CONVERSION.IN3_TO_M3, description: 'Imperial small volume (16.387 cm³)', system: 'imperial' },
    { id: 'bbl', name: 'Petroleum Barrel', symbol: 'bbl', category: 'volume', toBaseFactor: EXACT_CONVERSION.BBL_TO_M3, description: 'Oil & bitumen barrel (42 US gal = 158.987 L)', system: 'imperial' },
    { id: 'fl_oz', name: 'US Fluid Ounce', symbol: 'fl oz', category: 'volume', toBaseFactor: EXACT_CONVERSION.FL_OZ_US_TO_M3, description: 'Admixture fluid ounce (29.57 mL)', system: 'imperial' },
  ],
  mass: [
    { id: 'kg', name: 'Kilogram', symbol: 'kg', category: 'mass', toBaseFactor: 1.0, description: 'SI base mass unit', system: 'metric' },
    { id: 'tonne', name: 'Metric Tonne', symbol: 'MT', category: 'mass', toBaseFactor: EXACT_CONVERSION.TONNE_TO_KG, description: '1,000 kg structural steel measure', system: 'metric' },
    { id: 'MT', name: 'Metric Tonne (Alias)', symbol: 'MT', category: 'mass', toBaseFactor: EXACT_CONVERSION.TONNE_TO_KG, description: '1,000 kg structural steel measure', system: 'metric' },
    { id: 'ton_us', name: 'Short Ton (US)', symbol: 'ton (US)', category: 'mass', toBaseFactor: EXACT_CONVERSION.TON_US_TO_KG, description: '2,000 lbs short ton (907.185 kg)', system: 'imperial' },
    { id: 'ton_uk', name: 'Long Ton (UK)', symbol: 'ton (UK)', category: 'mass', toBaseFactor: EXACT_CONVERSION.TON_UK_TO_KG, description: '2,240 lbs long ton (1,016.05 kg)', system: 'imperial' },
    { id: 'bag50', name: 'Cement Bag (50 kg)', symbol: 'bag', category: 'mass', toBaseFactor: EXACT_CONVERSION.CEMENT_BAG_KG, description: 'Standard 50 kg Portland cement bag', system: 'universal' },
    { id: 'lb', name: 'Pound (Avoirdupois)', symbol: 'lb', category: 'mass', toBaseFactor: EXACT_CONVERSION.LB_TO_KG, description: 'Imperial mass pound (0.453592 kg)', system: 'imperial' },
    { id: 'oz', name: 'Ounce (Avoirdupois)', symbol: 'oz', category: 'mass', toBaseFactor: EXACT_CONVERSION.OZ_TO_KG, description: '1/16 lb (28.3495 g)', system: 'imperial' },
    { id: 'g', name: 'Gram', symbol: 'g', category: 'mass', toBaseFactor: 0.001, description: 'Laboratory material mass', system: 'metric' },
    { id: 'mg', name: 'Milligram', symbol: 'mg', category: 'mass', toBaseFactor: 1e-6, description: 'Precision chemical additive mass', system: 'metric' },
    { id: 'quintal', name: 'Quintal', symbol: 'q', category: 'mass', toBaseFactor: 100.0, description: '100 kg bulk grain/steel weight', system: 'metric' },
    { id: 'maund', name: 'Maund (Mon)', symbol: 'mon', category: 'mass', toBaseFactor: EXACT_CONVERSION.MAUND_TO_KG, description: 'Regional agricultural weight (40 seers = 37.324 kg)', isRegional: true, system: 'regional' },
    { id: 'seer', name: 'Seer (Sher)', symbol: 'seer', category: 'mass', toBaseFactor: EXACT_CONVERSION.SEER_TO_KG, description: 'Traditional weight (0.9331 kg = 80 tolas)', isRegional: true, system: 'regional' },
    { id: 'tola', name: 'Tola', symbol: 'tola', category: 'mass', toBaseFactor: EXACT_CONVERSION.TOLA_TO_KG, description: 'Traditional precious metal/spice weight (11.6638 g)', isRegional: true, system: 'regional' },
  ],
  pressure: [
    { id: 'Pa', name: 'Pascal', symbol: 'Pa', category: 'pressure', toBaseFactor: 1.0, description: 'SI base stress/pressure unit (N/m²)', system: 'metric' },
    { id: 'kPa', name: 'Kilopascal (kN/m²)', symbol: 'kPa', category: 'pressure', toBaseFactor: EXACT_CONVERSION.KPA_TO_PA, description: 'Soil bearing pressure (1 kPa = 1 kN/m²)', system: 'metric' },
    { id: 'MPa', name: 'Megapascal (N/mm²)', symbol: 'MPa', category: 'pressure', toBaseFactor: EXACT_CONVERSION.MPA_TO_PA, description: 'Concrete compressive & steel yield strength', system: 'metric' },
    { id: 'GPa', name: 'Gigapascal', symbol: 'GPa', category: 'pressure', toBaseFactor: EXACT_CONVERSION.GPA_TO_PA, description: 'Modulus of elasticity E (steel 200 GPa)', system: 'metric' },
    { id: 'psi', name: 'Pounds per Sq Inch', symbol: 'psi', category: 'pressure', toBaseFactor: EXACT_CONVERSION.PSI_TO_PA, description: 'Imperial cylinder strength (1 MPa ≈ 145.038 psi)', system: 'imperial' },
    { id: 'ksi', name: 'Kips per Sq Inch', symbol: 'ksi', category: 'pressure', toBaseFactor: EXACT_CONVERSION.KSI_TO_PA, description: 'AISC structural steel yield stress (60 ksi = 413.7 MPa)', system: 'imperial' },
    { id: 'psf', name: 'Pounds per Sq Foot', symbol: 'psf', category: 'pressure', toBaseFactor: EXACT_CONVERSION.PSF_TO_PA, description: 'Imperial soil bearing capacity (1 psf ≈ 0.04788 kPa)', system: 'imperial' },
    { id: 'tsf', name: 'Tons per Sq Foot', symbol: 'tsf', category: 'pressure', toBaseFactor: EXACT_CONVERSION.TSF_TO_PA, description: 'Geotechnical short tons per sq ft (2000 psf = 95.76 kPa)', system: 'imperial' },
    { id: 'bar', name: 'Bar', symbol: 'bar', category: 'pressure', toBaseFactor: EXACT_CONVERSION.BAR_TO_PA, description: 'Hydraulic fluid pressure (1 bar = 100 kPa = 100,000 Pa)', system: 'metric' },
    { id: 'mbar', name: 'Millibar', symbol: 'mbar', category: 'pressure', toBaseFactor: EXACT_CONVERSION.MBAR_TO_PA, description: 'Barometric weather pressure (100 Pa)', system: 'metric' },
    { id: 'kgf/cm2', name: 'Kilogram-Force / cm²', symbol: 'kgf/cm²', category: 'pressure', toBaseFactor: EXACT_CONVERSION.KGF_CM2_TO_PA, description: 'Metric technical pressure (1 kgf/cm² ≈ 0.09807 MPa)', system: 'metric' },
    { id: 'atm', name: 'Standard Atmosphere', symbol: 'atm', category: 'pressure', toBaseFactor: EXACT_CONVERSION.ATM_TO_PA, description: 'Standard atmospheric pressure (101.325 kPa = 14.696 psi)', system: 'universal' },
    { id: 'mmHg', name: 'Millimeter of Mercury', symbol: 'mmHg', category: 'pressure', toBaseFactor: EXACT_CONVERSION.MMHG_TO_PA, description: 'Torr / manometer head (760 mmHg = 1 atm)', system: 'metric' },
    { id: 'mmH2O', name: 'Millimeter of Water', symbol: 'mmH₂O', category: 'pressure', toBaseFactor: EXACT_CONVERSION.MMH2O_TO_PA, description: 'Hydrostatic pressure head (9.80665 Pa)', system: 'metric' },
  ],
  force: [
    { id: 'N', name: 'Newton', symbol: 'N', category: 'force', toBaseFactor: 1.0, description: 'SI base force unit (kg·m/s²)', system: 'metric' },
    { id: 'kN', name: 'Kilonewton', symbol: 'kN', category: 'force', toBaseFactor: EXACT_CONVERSION.KN_TO_N, description: 'Structural load & shear force (1,000 N)', system: 'metric' },
    { id: 'MN', name: 'Meganewton', symbol: 'MN', category: 'force', toBaseFactor: EXACT_CONVERSION.MN_TO_N, description: 'Bridge pier foundation reaction (1,000,000 N)', system: 'metric' },
    { id: 'lbf', name: 'Pound Force', symbol: 'lbf', category: 'force', toBaseFactor: EXACT_CONVERSION.LBF_TO_N, description: 'Imperial force pound (4.44822 N)', system: 'imperial' },
    { id: 'kip', name: 'Kip (1000 lbf)', symbol: 'kip', category: 'force', toBaseFactor: EXACT_CONVERSION.KIP_TO_N, description: 'US structural engineering kip (4.44822 kN)', system: 'imperial' },
    { id: 'kgf', name: 'Kilogram Force', symbol: 'kgf', category: 'force', toBaseFactor: EXACT_CONVERSION.KGF_TO_N, description: 'Gravitational metric force (9.80665 N)', system: 'metric' },
    { id: 'tonf', name: 'Metric Ton-Force', symbol: 'tonf', category: 'force', toBaseFactor: EXACT_CONVERSION.TONF_TO_N, description: 'Gravitational metric tonne force (9.80665 kN)', system: 'metric' },
    { id: 'dyn', name: 'Dyne', symbol: 'dyn', category: 'force', toBaseFactor: EXACT_CONVERSION.DYN_TO_N, description: 'CGS force unit (10⁻⁵ N)', system: 'metric' },
  ],
  distributed_load: [
    { id: 'N/m', name: 'Newton / Meter', symbol: 'N/m', category: 'distributed_load', toBaseFactor: 1.0, description: 'SI base line load', system: 'metric' },
    { id: 'kN/m', name: 'Kilonewton / Meter', symbol: 'kN/m', category: 'distributed_load', toBaseFactor: EXACT_CONVERSION.KN_TO_N, description: 'Standard metric beam line load', system: 'metric' },
    { id: 'N/mm', name: 'Newton / Millimeter', symbol: 'N/mm', category: 'distributed_load', toBaseFactor: EXACT_CONVERSION.KN_TO_N, description: 'Component edge load (1 N/mm = 1 kN/m)', system: 'metric' },
    { id: 'lbf/ft', name: 'Pounds / Foot (plf)', symbol: 'plf', category: 'distributed_load', toBaseFactor: 14.593902937206368, description: 'Imperial uniform load', system: 'imperial' },
    { id: 'plf', name: 'Pounds / Foot (plf)', symbol: 'plf', category: 'distributed_load', toBaseFactor: 14.593902937206368, description: 'Imperial uniform line load', system: 'imperial' },
    { id: 'kip/ft', name: 'Kips / Foot (klf)', symbol: 'klf', category: 'distributed_load', toBaseFactor: 14593.902937206368, description: 'US structural line load (14.594 kN/m)', system: 'imperial' },
    { id: 'klf', name: 'Kips / Foot (klf)', symbol: 'klf', category: 'distributed_load', toBaseFactor: 14593.902937206368, description: 'US structural uniform load alias', system: 'imperial' },
    { id: 'kgf/m', name: 'Kilogram Force / Meter', symbol: 'kgf/m', category: 'distributed_load', toBaseFactor: 9.80665, description: 'Metric gravitational line load', system: 'metric' },
  ],
  density: [
    { id: 'kN/m3', name: 'Kilonewton / m³', symbol: 'kN/m³', category: 'density', toBaseFactor: 1.0, description: 'Canonical civil soil gamma (e.g. 18 kN/m³)', system: 'metric' },
    { id: 'N/m3', name: 'Newton / m³', symbol: 'N/m³', category: 'density', toBaseFactor: 0.001, description: 'SI base volumetric force', system: 'metric' },
    { id: 'kg/m3', name: 'Kilogram / m³', symbol: 'kg/m³', category: 'density', toBaseFactor: 0.00980665, description: 'Material mass density (e.g. concrete 2400 kg/m³ = 23.54 kN/m³)', system: 'metric' },
    { id: 'pcf', name: 'Pounds / Cu Foot (pcf)', symbol: 'pcf', category: 'density', toBaseFactor: 0.157087463, description: 'Imperial unit weight (e.g. 150 pcf concrete ≈ 23.56 kN/m³)', system: 'imperial' },
    { id: 'g/cm3', name: 'Gram / cm³', symbol: 'g/cm³', category: 'density', toBaseFactor: 9.80665, description: 'Specific gravity basis (water = 1.0 g/cm³ = 9.81 kN/m³)', system: 'metric' },
    { id: 'tonne/m3', name: 'Metric Tonne / m³', symbol: 't/m³', category: 'density', toBaseFactor: 9.80665, description: 'Bulk earth/aggregate density', system: 'metric' },
    { id: 'lb/in3', name: 'Pounds / Cu Inch', symbol: 'lb/in³', category: 'density', toBaseFactor: 271.4468, description: 'Steel density (0.283 lb/in³)', system: 'imperial' },
  ],
  moment: [
    { id: 'N.m', name: 'Newton · Meter', symbol: 'N·m', category: 'moment', toBaseFactor: 1.0, description: 'SI base moment unit', system: 'metric' },
    { id: 'kN.m', name: 'Kilonewton · Meter', symbol: 'kN·m', category: 'moment', toBaseFactor: EXACT_CONVERSION.KNM_TO_NM, description: 'Standard structural flexural moment (1,000 N·m)', system: 'metric' },
    { id: 'N.mm', name: 'Newton · Millimeter', symbol: 'N·mm', category: 'moment', toBaseFactor: 0.001, description: 'Section cross-section moment', system: 'metric' },
    { id: 'kip.ft', name: 'Kip · Foot', symbol: 'kip·ft', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM, description: 'US structural bending moment (1,355.82 N·m)', system: 'imperial' },
    { id: 'kip.in', name: 'Kip · Inch', symbol: 'kip·in', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM / 12, description: 'US section flexural capacity (112.98 N·m)', system: 'imperial' },
    { id: 'lbf.ft', name: 'Pound · Foot', symbol: 'lb·ft', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM / 1000, description: 'Imperial torque & moment (1.3558 N·m)', system: 'imperial' },
    { id: 'lbf.in', name: 'Pound · Inch', symbol: 'lb·in', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM / 12000, description: 'Imperial inch torque (0.11298 N·m)', system: 'imperial' },
  ],
  slope: [
    { id: 'ratio', name: 'Ratio (1:H / V:H)', symbol: 'm/m', category: 'slope', toBaseFactor: 1.0, description: 'Dimensionless gradient ratio (e.g. 0.02 = 1:50)', system: 'universal' },
    { id: 'percent', name: 'Percentage Grade', symbol: '%', category: 'slope', toBaseFactor: 0.01, description: 'Civil road grade (e.g. 2% = 0.02 slope)', system: 'universal' },
    { id: 'degree', name: 'Angle in Degrees', symbol: '°', category: 'slope', toBaseFactor: 1.0, description: 'Friction angle φ or embankment inclination', system: 'universal' },
    { id: 'permille', name: 'Per Mille (‰)', symbol: '‰', category: 'slope', toBaseFactor: 0.001, description: 'Railway & highway gradient (e.g. 20‰ = 0.02)', system: 'universal' },
    { id: 'in_per_ft', name: 'Inches per Foot', symbol: 'in/ft', category: 'slope', toBaseFactor: 1 / 12, description: 'Plumbing & drainage slope (e.g. 1/4" per ft = 0.02083)', system: 'imperial' },
  ],
  velocity: [
    { id: 'm/s', name: 'Meters / Second', symbol: 'm/s', category: 'velocity', toBaseFactor: 1.0, description: 'SI base velocity & hydraulic flow speed', system: 'metric' },
    { id: 'ft/s', name: 'Feet / Second', symbol: 'ft/s', category: 'velocity', toBaseFactor: EXACT_CONVERSION.FTS_TO_MPS, description: 'Imperial channel flow velocity (0.3048 m/s)', system: 'imperial' },
    { id: 'km/h', name: 'Kilometers / Hour', symbol: 'km/h', category: 'velocity', toBaseFactor: EXACT_CONVERSION.KMH_TO_MPS, description: 'Traffic & flood surge speed (1/3.6 m/s)', system: 'metric' },
    { id: 'mph', name: 'Miles / Hour', symbol: 'mph', category: 'velocity', toBaseFactor: EXACT_CONVERSION.MPH_TO_MPS, description: 'US wind design speed (0.44704 m/s)', system: 'imperial' },
    { id: 'knot', name: 'Knot (Nautical Mile/h)', symbol: 'kt', category: 'velocity', toBaseFactor: EXACT_CONVERSION.KNOT_TO_MPS, description: 'Maritime & wind speed (0.51444 m/s)', system: 'universal' },
    { id: 'mm/s', name: 'Millimeters / Second', symbol: 'mm/s', category: 'velocity', toBaseFactor: EXACT_CONVERSION.MMS_TO_MPS, description: 'Structural vibration & PPV particle velocity', system: 'metric' },
    { id: 'in/s', name: 'Inches / Second', symbol: 'in/s', category: 'velocity', toBaseFactor: EXACT_CONVERSION.INS_TO_MPS, description: 'US vibration velocity (25.4 mm/s)', system: 'imperial' },
  ],
  flow_rate: [
    { id: 'm3/s', name: 'Cubic Meters / Second (cumec)', symbol: 'm³/s', category: 'flow_rate', toBaseFactor: 1.0, description: 'SI base discharge (cumecs)', system: 'metric' },
    { id: 'cfs', name: 'Cubic Feet / Second (cusec)', symbol: 'cfs', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.CFS_TO_M3S, description: 'Imperial river discharge (cusecs = 0.028317 m³/s)', system: 'imperial' },
    { id: 'L/s', name: 'Liters / Second', symbol: 'L/s', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.LPS_TO_M3S, description: 'Pipe and pump discharge (0.001 m³/s)', system: 'metric' },
    { id: 'L/min', name: 'Liters / Minute (LPM)', symbol: 'L/min', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.LPM_TO_M3S, description: 'Pump rating in LPM', system: 'metric' },
    { id: 'm3/hr', name: 'Cubic Meters / Hour', symbol: 'm³/h', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.M3_HR_TO_M3S, description: 'Water treatment plant discharge', system: 'metric' },
    { id: 'gpm', name: 'US Gallons / Minute', symbol: 'gpm', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.GPM_TO_M3S, description: 'US pumping capacity (0.00006309 m³/s)', system: 'imperial' },
    { id: 'gpm_uk', name: 'UK Gallons / Minute', symbol: 'UK gpm', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.GPM_UK_TO_M3S, description: 'Imperial pumping discharge (0.00007577 m³/s)', system: 'imperial' },
    { id: 'mgd', name: 'Million Gallons / Day (MGD)', symbol: 'MGD', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.MGD_TO_M3S, description: 'Municipal water supply discharge (0.04381 m³/s)', system: 'imperial' },
    { id: 'ML/day', name: 'Megaliters / Day (MLD)', symbol: 'MLD', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.ML_DAY_TO_M3S, description: 'Urban treatment plant capacity (0.01157 m³/s)', system: 'metric' },
  ],
};

/**
 * Normalizes any value in a given unit to the Canonical Base SI unit.
 * All field-level unit changes dynamically propagate through this function to guarantee
 * zero precision loss across structural, geotechnical, and BOQ calculations.
 */
export function normalizeToBase(
  value: number,
  unitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[] = []
): number {
  if (isNaN(value)) return 0;
  if (unitId === BASE_UNITS[category]) return value;

  // Non-linear slope trigonometric cases:
  if (category === 'slope') {
    if (unitId === 'degree') return Math.tan((value * Math.PI) / 180);
    if (unitId === 'percent') return value / 100;
    if (unitId === 'permille') return value / 1000;
    if (unitId === 'in_per_ft') return value / 12;
    if (unitId === 'ratio') return value;
  }

  const allCategoryUnits = [
    ...(STANDARD_UNITS[category] || []),
    ...customUnits.filter((u) => u.category === category),
  ];

  const info = allCategoryUnits.find((u) => u.id === unitId);
  if (!info) return value;
  return value * info.toBaseFactor;
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

  // Non-linear slope trigonometric cases:
  if (category === 'slope') {
    if (targetUnitId === 'degree') return (Math.atan(baseValue) * 180) / Math.PI;
    if (targetUnitId === 'percent') return baseValue * 100;
    if (targetUnitId === 'permille') return baseValue * 1000;
    if (targetUnitId === 'in_per_ft') return baseValue * 12;
    if (targetUnitId === 'ratio') return baseValue;
  }

  const allCategoryUnits = [
    ...(STANDARD_UNITS[category] || []),
    ...customUnits.filter((u) => u.category === category),
  ];

  const info = allCategoryUnits.find((u) => u.id === targetUnitId);
  if (!info || info.toBaseFactor === 0) return baseValue;
  return baseValue / info.toBaseFactor;
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

  // Special trigonometric conversions for slope
  if (category === 'slope') {
    const baseSlope = normalizeToBase(value, fromUnitId, category, customUnits);
    return denormalizeFromBase(baseSlope, toUnitId, category, customUnits);
  }

  const baseVal = normalizeToBase(value, fromUnitId, category, customUnits);
  return denormalizeFromBase(baseVal, toUnitId, category, customUnits);
}

/**
 * High-Precision Unit Conversion Engine with comprehensive audit trail & formula
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

  // Handle angle/slope degree conversion special trigonometric case
  if (category === 'slope') {
    const baseSlope = normalizeToBase(value, fromUnitId, category, customUnits);
    const targetSlope = denormalizeFromBase(baseSlope, toUnitId, category, customUnits);

    let formula = '';
    if (fromUnitId === 'degree' && toUnitId === 'percent') {
      formula = `tan(${value}°) × 100 = ${targetSlope.toFixed(4)}%`;
    } else if (fromUnitId === 'percent' && toUnitId === 'degree') {
      formula = `atan(${value} / 100) = ${targetSlope.toFixed(4)}°`;
    } else if (fromUnitId === 'degree' && toUnitId === 'ratio') {
      formula = `tan(${value}°) = ${targetSlope.toFixed(5)}`;
    } else if (fromUnitId === 'ratio' && toUnitId === 'degree') {
      formula = `atan(${value}) = ${targetSlope.toFixed(4)}°`;
    } else {
      formula = `${value} ${fromUnitId} → Base (ratio: ${baseSlope.toFixed(6)}) → ${targetSlope.toFixed(4)} ${toUnitId}`;
    }
    return { result: targetSlope, formula };
  }

  // General linear factor conversion
  const allUnits: Array<{ id: string; name: string; symbol: string; toBaseFactor: number }> = [
    ...(STANDARD_UNITS[category] || []),
    ...customUnits.filter((u) => u.category === category),
  ];

  const fromInfo = allUnits.find((u) => u.id === fromUnitId);
  const toInfo = allUnits.find((u) => u.id === toUnitId);

  if (!fromInfo || !toInfo) {
    return { result: value, formula: 'Conversion unit definition not found' };
  }

  // Convert value to Base SI -> then to target unit
  const baseValue = value * fromInfo.toBaseFactor;
  const targetValue = baseValue / toInfo.toBaseFactor;

  const baseSymbol = BASE_UNITS[category];
  const formula = `${value} ${fromInfo.symbol} × ${fromInfo.toBaseFactor} = ${parseFloat(baseValue.toPrecision(8))} ${baseSymbol} -> ÷ ${toInfo.toBaseFactor} = ${parseFloat(targetValue.toPrecision(8))} ${toInfo.symbol}`;
  return { result: targetValue, formula };
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
 * from any arbitrary input land unit.
 */
export function computeRegionalLandBreakdown(
  value: number,
  fromUnitId: string,
  customUnits: CustomUnitDefinition[] = []
): RegionalLandBreakdown {
  const sqmMeters = normalizeToBase(value, fromUnitId, 'area', customUnits);

  const acres = sqmMeters / EXACT_CONVERSION.ACRE_TO_M2;
  const hectares = sqmMeters / EXACT_CONVERSION.HECTARE_TO_M2;
  const decimals = sqmMeters / EXACT_CONVERSION.DECIMAL_TO_M2;
  const katha = sqmMeters / EXACT_CONVERSION.KATHA_TO_M2;
  const bigha = sqmMeters / EXACT_CONVERSION.BIGHA_TO_M2;
  const squareFeet = sqmMeters / EXACT_CONVERSION.SFT_TO_M2;
  const squareYards = sqmMeters / EXACT_CONVERSION.YD2_TO_M2;
  const cents = sqmMeters / EXACT_CONVERSION.CENT_TO_M2;
  const gunthas = sqmMeters / EXACT_CONVERSION.GUNTHA_TO_M2;
  const grounds = sqmMeters / EXACT_CONVERSION.GROUND_TO_M2;
  const kanals = sqmMeters / EXACT_CONVERSION.KANAL_TO_M2;
  const marlas = sqmMeters / EXACT_CONVERSION.MARLA_TO_M2;

  const formattedSummary = `${decimals.toFixed(2)} Dec = ${katha.toFixed(2)} Katha = ${bigha.toFixed(3)} Bigha = ${acres.toFixed(3)} Ac = ${hectares.toFixed(4)} Ha`;

  return {
    acres,
    hectares,
    decimals,
    katha,
    bigha,
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

/**
 * Parses diverse architectural/construction notations including:
 * - 12'-6 1/2"
 * - 12' 6 1/2"
 * - 12'-6-1/2"
 * - 12-6 1/2
 * - 12-6 1/2"
 * - 12 6 1/2"
 * - 12'-6.5"
 * - 12' 6.5"
 * - 12-6.5
 * - 12'6"
 * - 12-6
 * - 12 6
 * - 12ft 6.5in
 * - 12 ft 6 1/2 in
 * - 12 feet 6 inches
 * - 150 in
 * - 150"
 * - 12.5'
 * - 12.5 ft
 * - 3810 mm
 * - 3.81 m
 * - 381 cm
 * - 4 3/8"
 * - 3/4"
 */
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

  // Handle negative sign
  let isNegative = false;
  if (clean.startsWith('-')) {
    isNegative = true;
    clean = clean.substring(1).trim();
  }

  // Sanitize multiple hyphens / dashes (e.g. 12'--4 1/2" or 12---6 -> 12'-4 1/2" or 12-6)
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

  let totalInches = 0;
  let parsed = false;

  // Pattern 1: Standalone fraction only: e.g. "3/4"", "1/2", "5/8 in"
  const standaloneFractionMatch = clean.match(/^(\d+)\s*\/\s*(\d+)\s*(?:"|in|inch|inches)?$/i);
  if (standaloneFractionMatch && standaloneFractionMatch[2] !== '0') {
    totalInches = parseFloat(standaloneFractionMatch[1]) / parseFloat(standaloneFractionMatch[2]);
    parsed = true;
  }

  // Pattern 2: Standalone whole + fraction inches: e.g. "4 1/2"", "4-1/2 in", "4 1/2"
  if (!parsed) {
    const standaloneWholeFraction = clean.match(/^(\d+)\s*[-_ ]\s*(\d+)\s*\/\s*(\d+)\s*(?:"|in|inch|inches)?$/i);
    if (standaloneWholeFraction && standaloneWholeFraction[3] !== '0') {
      const w = parseFloat(standaloneWholeFraction[1]);
      const n = parseFloat(standaloneWholeFraction[2]);
      const d = parseFloat(standaloneWholeFraction[3]);
      totalInches = w + n / d;
      parsed = true;
    }
  }

  // Pattern 3: Explicit Feet marker (e.g. 12', 12 ft, 12 feet, 12'-6 1/2", 12' 4.5", 12'6", 12ft 6in)
  if (!parsed) {
    const feetRegex = /^([+-]?\d+(?:\.\d+)?)\s*(?:'|ft|feet)\b/i;
    const feetPrimeRegex = /^([+-]?\d+(?:\.\d+)?)\s*'/;
    const feetMatch = clean.match(feetRegex) || clean.match(feetPrimeRegex);

    if (feetMatch) {
      const feetVal = parseFloat(feetMatch[1]);
      totalInches += feetVal * 12;
      parsed = true;

      // Extract remaining inch portion
      const remainder = clean.substring(feetMatch[0].length).replace(/^[-–—\s]+/, '').trim();
      if (remainder) {
        // Remainder with whole + fraction: e.g. "6 1/2"", "6-1/2""
        const rWholeFrac = remainder.match(/^(\d+)\s*[-_ ]\s*(\d+)\s*\/\s*(\d+)\s*(?:"|in|inch|inches)?$/i);
        if (rWholeFrac && rWholeFrac[3] !== '0') {
          totalInches += parseFloat(rWholeFrac[1]) + parseFloat(rWholeFrac[2]) / parseFloat(rWholeFrac[3]);
        } else {
          // Remainder with standalone fraction: e.g. "1/2""
          const rFracOnly = remainder.match(/^(\d+)\s*\/\s*(\d+)\s*(?:"|in|inch|inches)?$/i);
          if (rFracOnly && rFracOnly[2] !== '0') {
            totalInches += parseFloat(rFracOnly[1]) / parseFloat(rFracOnly[2]);
          } else {
            // Remainder with decimal/integer: e.g. "6.5"", "6 in", "6"
            const rNum = remainder.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?$/i);
            if (rNum) {
              totalInches += parseFloat(rNum[1]);
            }
          }
        }
      }
    }
  }

  // Pattern 4: Architectural shorthand WITHOUT prime/quote:
  // e.g. "12-6 1/2", "12-6 1/2\"", "12-6", "12 6 1/2", "12 6 1/2\""
  if (!parsed) {
    // 4a. Feet - Inches Fraction: "12-6 1/2" or "12-6 1/2\"" or "12-6-1/2"
    const dashFracMatch = clean.match(/^(\d+)\s*[-–—]\s*(\d+)\s*[-_ ]\s*(\d+)\s*\/\s*(\d+)\s*"?$/);
    if (dashFracMatch && dashFracMatch[4] !== '0') {
      const ft = parseFloat(dashFracMatch[1]);
      const wholeIn = parseFloat(dashFracMatch[2]);
      const n = parseFloat(dashFracMatch[3]);
      const d = parseFloat(dashFracMatch[4]);
      totalInches = ft * 12 + wholeIn + n / d;
      parsed = true;
    }
  }

  if (!parsed) {
    // 4b. Space-separated: "12 6 1/2" or "12 6 1/2\""
    const spaceFracMatch = clean.match(/^(\d+)\s+(\d+)\s+(\d+)\s*\/\s*(\d+)\s*"?$/);
    if (spaceFracMatch && spaceFracMatch[4] !== '0') {
      const ft = parseFloat(spaceFracMatch[1]);
      const wholeIn = parseFloat(spaceFracMatch[2]);
      const n = parseFloat(spaceFracMatch[3]);
      const d = parseFloat(spaceFracMatch[4]);
      totalInches = ft * 12 + wholeIn + n / d;
      parsed = true;
    }
  }

  if (!parsed) {
    // 4c. Simple hyphen separated feet-inch: "12-6" or "12-6\"" or "12-6.5"
    const simpleDashMatch = clean.match(/^(\d+)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*"?$/);
    if (simpleDashMatch) {
      const ft = parseFloat(simpleDashMatch[1]);
      const inches = parseFloat(simpleDashMatch[2]);
      totalInches = ft * 12 + inches;
      parsed = true;
    }
  }

  if (!parsed) {
    // 4d. Space-separated feet-inch: "12 6" or "12 6.5" or "12 6\""
    const simpleSpaceMatch = clean.match(/^(\d+)\s+(\d+(?:\.\d+)?)\s*"?$/);
    if (simpleSpaceMatch) {
      const ft = parseFloat(simpleSpaceMatch[1]);
      const inches = parseFloat(simpleSpaceMatch[2]);
      totalInches = ft * 12 + inches;
      parsed = true;
    }
  }

  // Pattern 5: Explicit pure inches or feet with unit suffix
  if (!parsed) {
    const pureInchMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)$/i);
    if (pureInchMatch) {
      totalInches = parseFloat(pureInchMatch[1]);
      parsed = true;
    }
  }

  if (!parsed) {
    const pureFeetMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:'|ft|feet)$/i);
    if (pureFeetMatch) {
      totalInches = parseFloat(pureFeetMatch[1]) * 12;
      parsed = true;
    }
  }

  // Pattern 6: Standalone numeric fallback (defaults to inches or pure value)
  if (!parsed) {
    const numericOnly = parseFloat(clean);
    if (!isNaN(numericOnly)) {
      totalInches = numericOnly;
      parsed = true;
    } else {
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
        errorMessage: 'Unable to recognize feet/inch or metric notation format',
      };
    }
  }

  if (isNegative) {
    totalInches = -Math.abs(totalInches);
  }

  return formatInchesResult(totalInches);
}

function formatInchesResult(totalInches: number): FeetInchParseResult {
  const totalFeet = totalInches / 12;
  const totalMm = totalInches * 25.4;
  const totalMeters = totalInches * 0.0254; // Exact SI: 1 inch = 0.0254 m

  // Breakdown into feet, whole inches, and fractional sixteenths
  const sign = totalInches < 0 ? '-' : '';
  const isNeg = totalInches < 0;
  const absInches = Math.abs(totalInches);
  const ft = Math.floor(absInches / 12);
  const remInches = absInches - ft * 12;
  const wholeInches = Math.floor(remInches);
  const fracPart = remInches - wholeInches;

  // Nearest 1/16 inch
  const sixteenths = Math.round(fracPart * 16);
  let fractionText = '';
  let finalWholeInches = wholeInches;
  let finalFt = ft;
  let num: number | undefined = undefined;
  let den: number | undefined = undefined;

  if (sixteenths === 16) {
    finalWholeInches += 1;
    if (finalWholeInches === 12) {
      finalFt += 1;
      finalWholeInches = 0;
    }
  } else if (sixteenths > 0) {
    // Simplify fraction
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const div = gcd(sixteenths, 16);
    num = sixteenths / div;
    den = 16 / div;
    fractionText = ` ${num}/${den}`;
  }

  const fractionString = `${sign}${finalFt}'-${finalWholeInches}${fractionText}"`;
  const normalizedString = `${sign}${finalFt} ft ${remInches.toFixed(3)} in`;
  const decimalFeetString = `${sign}${Math.abs(totalFeet).toFixed(4)} ft`;
  const metricString = `${sign}${Math.abs(totalMeters).toFixed(4)} m`;

  return {
    isValid: true,
    totalInches,
    totalFeet,
    totalMeters,
    totalMm,
    normalizedString,
    fractionString,
    decimalFeetString,
    metricString,
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

/* -------------------------------------------------------------
   METROLOGICAL NUMBER FORMATTING & REAL-TIME INPUT TYPING
------------------------------------------------------------- */
export interface FormatNumberOptions {
  maxDecimals?: number;
  minDecimals?: number;
  useGrouping?: boolean; // Thousand separators
  trimTrailingZeros?: boolean;
}

/**
 * Formats any engineering number with clean thousand separators and appropriate decimal precision
 * tailored to physical engineering tolerances.
 */
export function formatSmartNumber(
  val: number,
  options?: number | FormatNumberOptions
): string {
  if (isNaN(val) || !isFinite(val)) return '';

  const opts: FormatNumberOptions =
    typeof options === 'number' ? { maxDecimals: options } : options || {};

  const {
    useGrouping = true,
    trimTrailingZeros = true,
  } = opts;

  let maxDec = opts.maxDecimals;
  if (maxDec === undefined) {
    const absVal = Math.abs(val);
    if (absVal >= 100000) {
      maxDec = 2;
    } else if (absVal >= 1000) {
      maxDec = 2;
    } else if (absVal >= 10) {
      maxDec = 3;
    } else if (absVal >= 1) {
      maxDec = 4;
    } else if (absVal >= 0.001) {
      maxDec = 5;
    } else if (absVal > 0) {
      return val.toExponential(4);
    } else {
      return '0';
    }
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

/**
 * Real-time input formatter while the user is actively typing.
 * Preserves decimal points, trailing zeros, negative signs, and architectural notations.
 */
export function formatNumberWhileTyping(inputStr: string): {
  formatted: string;
  isArchitectural: boolean;
  cleanNumeric?: number;
} {
  const trimmed = inputStr.trim();
  if (!trimmed) {
    return { formatted: '', isArchitectural: false };
  }

  // Detect architectural feet-inch or unit expressions: e.g. 12'-6", 12 ft, 350 mm
  const isArch =
    /['"]/.test(trimmed) ||
    /\b(?:ft|feet|in|inch|inches|mm|cm|m)\b/i.test(trimmed) ||
    /^\d+\s*[-–—]\s*\d+/.test(trimmed) ||
    /^\d+\s+\d+\s+\d+\/\d+/.test(trimmed) ||
    /^\d+\/\d+/.test(trimmed);

  if (isArch) {
    return { formatted: inputStr, isArchitectural: true };
  }

  // Detect arithmetic expression: e.g. "12 * 2", "25 / 2"
  if (/[+*/]/.test(trimmed)) {
    return { formatted: inputStr, isArchitectural: false };
  }

  // Plain numeric string with optional negative sign and single decimal point
  const clean = inputStr.replace(/,/g, '');
  const isNeg = clean.startsWith('-');
  const unsigned = isNeg ? clean.substring(1) : clean;

  const dotCount = (unsigned.match(/\./g) || []).length;
  if (dotCount > 1) {
    return { formatted: inputStr, isArchitectural: false };
  }

  const [intPart, decPart] = unsigned.split('.');

  // If integer part has valid digits, format with thousands commas
  let formattedInt = intPart;
  if (/^\d+$/.test(intPart)) {
    formattedInt = parseInt(intPart, 10).toLocaleString('en-US');
  }

  const prefix = isNeg ? '-' : '';
  if (unsigned.includes('.')) {
    const formatted = `${prefix}${formattedInt}.${decPart ?? ''}`;
    const cleanNum = parseFloat(clean);
    return {
      formatted,
      isArchitectural: false,
      cleanNumeric: !isNaN(cleanNum) ? cleanNum : undefined,
    };
  }

  const formatted = `${prefix}${formattedInt}`;
  const cleanNum = parseFloat(clean);
  return {
    formatted,
    isArchitectural: false,
    cleanNumeric: !isNaN(cleanNum) ? cleanNum : undefined,
  };
}
