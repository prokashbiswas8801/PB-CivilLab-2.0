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
 * EXACT PHYSICAL CONVERSION FACTORS (derived from SI definitions)
 * Zero truncation or hardcoded drift
 */
export const EXACT_CONVERSION = {
  // Volume: 1 ft = 0.3048 m => 1 cft = 0.3048^3 m3
  CFT_TO_M3: 0.028316846592,
  M3_TO_CFT: 1 / 0.028316846592, // ~35.31466672148859

  // Area: 1 sft = 0.3048^2 m2
  SFT_TO_M2: 0.09290304,
  M2_TO_SFT: 1 / 0.09290304, // ~10.763910416709722

  // Length: 1 ft = 0.3048 m, 1 in = 0.0254 m
  FT_TO_M: 0.3048,
  M_TO_FT: 1 / 0.3048, // ~3.2808398950131233
  IN_TO_M: 0.0254,
  M_TO_IN: 1 / 0.0254, // ~39.37007874015748

  // Force & Stress
  KN_TO_N: 1000,
  N_TO_KN: 0.001,
  MPA_TO_PA: 1000000,
  PA_TO_MPA: 1e-6,
  KPA_TO_PA: 1000,
  PA_TO_KPA: 0.001,
  GPA_TO_PA: 1000000000,
  PA_TO_GPA: 1e-9,

  // Moment: 1 kip.ft = 4448.2216152605 N * 0.3048 m = 1355.8179483314022 N.m
  KIP_FT_TO_NM: 1355.8179483314022,
  NM_TO_KIP_FT: 1 / 1355.8179483314022,
  KNM_TO_NM: 1000,
  NM_TO_KNM: 0.001,

  // Mass
  LB_TO_KG: 0.45359237,
  KG_TO_LB: 1 / 0.45359237,
  TONNE_TO_KG: 1000,
  KG_TO_TONNE: 0.001,
  CEMENT_BAG_KG: 50.0,
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
    { id: 'mm', name: 'Millimeter', symbol: 'mm', category: 'length', toBaseFactor: 0.001, description: 'Drafting & reinforcement rebar unit', system: 'metric' },
    { id: 'cm', name: 'Centimeter', symbol: 'cm', category: 'length', toBaseFactor: 0.01, description: 'Metric length unit', system: 'metric' },
    { id: 'km', name: 'Kilometer', symbol: 'km', category: 'length', toBaseFactor: 1000.0, description: 'Highway alignment & chainage', system: 'metric' },
    { id: 'ft', name: 'Foot', symbol: 'ft', category: 'length', toBaseFactor: EXACT_CONVERSION.FT_TO_M, description: 'Imperial architectural foot', system: 'imperial' },
    { id: 'in', name: 'Inch', symbol: 'in', category: 'length', toBaseFactor: EXACT_CONVERSION.IN_TO_M, description: 'Imperial architectural inch', system: 'imperial' },
    { id: 'yd', name: 'Yard', symbol: 'yd', category: 'length', toBaseFactor: 0.9144, description: 'Survey yard (3 ft)', system: 'imperial' },
    { id: 'mi', name: 'Statute Mile', symbol: 'mi', category: 'length', toBaseFactor: 1609.344, description: 'Statute road mile', system: 'imperial' },
    { id: 'mile', name: 'Mile (Statute)', symbol: 'mi', category: 'length', toBaseFactor: 1609.344, description: 'Statute road mile alias', system: 'imperial' },
    { id: 'rft', name: 'Running Foot (RFT)', symbol: 'rft', category: 'length', toBaseFactor: EXACT_CONVERSION.FT_TO_M, description: 'Linear construction takeoff foot', system: 'imperial' },
    { id: 'rm', name: 'Running Meter (RMT)', symbol: 'rm', category: 'length', toBaseFactor: 1.0, description: 'Linear construction takeoff meter', system: 'metric' },
    { id: 'ft-in', name: 'Feet-Inch (Arch)', symbol: `ft'-in"`, category: 'length', toBaseFactor: EXACT_CONVERSION.FT_TO_M, description: `Architectural composite string (e.g. 12'-6 1/2")`, system: 'imperial' },
  ],
  area: [
    { id: 'm2', name: 'Square Meter', symbol: 'm²', category: 'area', toBaseFactor: 1.0, description: 'SI base unit of area', system: 'metric' },
    { id: 'mm2', name: 'Square Millimeter', symbol: 'mm²', category: 'area', toBaseFactor: 1e-6, description: 'Steel cross-section area (As)', system: 'metric' },
    { id: 'cm2', name: 'Square Centimeter', symbol: 'cm²', category: 'area', toBaseFactor: 1e-4, description: 'Metric section area', system: 'metric' },
    { id: 'ft2', name: 'Square Foot (SFT)', symbol: 'sq ft', category: 'area', toBaseFactor: EXACT_CONVERSION.SFT_TO_M2, description: 'Floor & slab plan area (SFT)', system: 'imperial' },
    { id: 'sft', name: 'Square Foot (Alias)', symbol: 'sft', category: 'area', toBaseFactor: EXACT_CONVERSION.SFT_TO_M2, description: 'Traditional construction square foot', system: 'imperial' },
    { id: 'sqft', name: 'Square Foot (sqft)', symbol: 'sq ft', category: 'area', toBaseFactor: EXACT_CONVERSION.SFT_TO_M2, description: 'Square foot alias', system: 'imperial' },
    { id: 'in2', name: 'Square Inch', symbol: 'sq in', category: 'area', toBaseFactor: 0.00064516, description: 'Imperial rebar area', system: 'imperial' },
    { id: 'yd2', name: 'Square Yard', symbol: 'sq yd', category: 'area', toBaseFactor: 0.83612736, description: 'Pavement surface area', system: 'imperial' },
    { id: 'acre', name: 'International Acre', symbol: 'ac', category: 'area', toBaseFactor: 4046.8564224, description: '43,560 sq ft land parcel', system: 'imperial' },
    { id: 'hectare', name: 'Hectare', symbol: 'ha', category: 'area', toBaseFactor: 10000.0, description: '10,000 m² cadastre unit', system: 'metric' },
    { id: 'ha', name: 'Hectare (Alias)', symbol: 'ha', category: 'area', toBaseFactor: 10000.0, description: '10,000 m² cadastre unit', system: 'metric' },
    { id: 'sqm', name: 'Square Meter (sqm)', symbol: 'm²', category: 'area', toBaseFactor: 1.0, description: 'Square meter alias', system: 'metric' },
    { id: 'sqyd', name: 'Square Yard (sqyd)', symbol: 'sq yd', category: 'area', toBaseFactor: 0.83612736, description: 'Square yard alias', system: 'imperial' },
    // South Asian Regional Land Units:
    { id: 'decimal', name: 'Decimal (Satang/Shatak)', symbol: 'dec', category: 'area', toBaseFactor: 40.468564224, description: '1/100 of an acre = 435.6 sq ft', isRegional: true, system: 'regional' },
    { id: 'katha', name: 'Katha (Bengal standard)', symbol: 'katha', category: 'area', toBaseFactor: 66.8901888, description: '1.65 decimal = 720 sq ft', isRegional: true, system: 'regional' },
    { id: 'bigha', name: 'Bigha (Standard)', symbol: 'bigha', category: 'area', toBaseFactor: 1337.803776, description: '20 kathas = 14,400 sq ft', isRegional: true, system: 'regional' },
    { id: 'ganda', name: 'Ganda', symbol: 'ganda', category: 'area', toBaseFactor: 20.06705664, description: '4 karas = 216 sq ft', isRegional: true, system: 'regional' },
    { id: 'cent', name: 'Cent', symbol: 'cent', category: 'area', toBaseFactor: 40.468564224, description: '1/100 of an acre = 435.6 sq ft (South India)', isRegional: true, system: 'regional' },
    { id: 'guntha', name: 'Guntha (Gunta)', symbol: 'guntha', category: 'area', toBaseFactor: 101.17141056, description: '1/40 of an acre = 1,089 sq ft (33 ft × 33 ft)', isRegional: true, system: 'regional' },
    { id: 'ground', name: 'Ground', symbol: 'ground', category: 'area', toBaseFactor: 222.967296, description: 'Standard South Indian land measure = 2,400 sq ft', isRegional: true, system: 'regional' },
    { id: 'kanal', name: 'Kanal', symbol: 'kanal', category: 'area', toBaseFactor: 505.8570528, description: '1/8 of an acre = 20 marlas = 5,445 sq ft', isRegional: true, system: 'regional' },
    { id: 'marla', name: 'Marla', symbol: 'marla', category: 'area', toBaseFactor: 25.29285264, description: '1/160 of an acre = 272.25 sq ft', isRegional: true, system: 'regional' },
  ],
  volume: [
    { id: 'm3', name: 'Cubic Meter', symbol: 'm³', category: 'volume', toBaseFactor: 1.0, description: 'SI base volume unit', system: 'metric' },
    { id: 'cft', name: 'Cubic Foot (CFT)', symbol: 'cft', category: 'volume', toBaseFactor: EXACT_CONVERSION.CFT_TO_M3, description: 'Traditional concrete/sand volume (35.315 cft/m³)', system: 'imperial' },
    { id: 'ft3', name: 'Cubic Foot (Alias)', symbol: 'cu ft', category: 'volume', toBaseFactor: EXACT_CONVERSION.CFT_TO_M3, description: 'Imperial cubic foot', system: 'imperial' },
    { id: 'cum', name: 'Cubic Meter (cum)', symbol: 'cu m', category: 'volume', toBaseFactor: 1.0, description: 'Takeoff volume alias', system: 'metric' },
    { id: 'liter', name: 'Liter', symbol: 'L', category: 'volume', toBaseFactor: 0.001, description: 'Water mixing volume (1 L = 0.001 m³)', system: 'metric' },
    { id: 'L', name: 'Liter (Alias)', symbol: 'L', category: 'volume', toBaseFactor: 0.001, description: 'Water mixing volume', system: 'metric' },
    { id: 'ml', name: 'Milliliter', symbol: 'mL', category: 'volume', toBaseFactor: 1e-6, description: 'Admixture fluid measure', system: 'metric' },
    { id: 'gal_us', name: 'US Gallon', symbol: 'US gal', category: 'volume', toBaseFactor: 0.003785411784, description: 'US liquid volume (3.785 L)', system: 'imperial' },
    { id: 'gal_uk', name: 'Imperial Gallon', symbol: 'UK gal', category: 'volume', toBaseFactor: 0.00454609, description: 'UK liquid volume (4.546 L)', system: 'imperial' },
    { id: 'yd3', name: 'Cubic Yard', symbol: 'cu yd', category: 'volume', toBaseFactor: 0.764554857984, description: 'Readymix batch transit yard', system: 'imperial' },
  ],
  mass: [
    { id: 'kg', name: 'Kilogram', symbol: 'kg', category: 'mass', toBaseFactor: 1.0, description: 'SI base mass unit', system: 'metric' },
    { id: 'tonne', name: 'Metric Tonne', symbol: 'MT', category: 'mass', toBaseFactor: EXACT_CONVERSION.TONNE_TO_KG, description: '1,000 kg structural steel measure', system: 'metric' },
    { id: 'MT', name: 'Metric Tonne (Alias)', symbol: 'MT', category: 'mass', toBaseFactor: EXACT_CONVERSION.TONNE_TO_KG, description: '1,000 kg structural steel measure', system: 'metric' },
    { id: 'ton_us', name: 'Short Ton (US)', symbol: 'ton (US)', category: 'mass', toBaseFactor: 907.18474, description: '2,000 lbs short ton', system: 'imperial' },
    { id: 'ton_uk', name: 'Long Ton (UK)', symbol: 'ton (UK)', category: 'mass', toBaseFactor: 1016.0469088, description: '2,240 lbs long ton', system: 'imperial' },
    { id: 'bag50', name: 'Cement Bag (50 kg)', symbol: 'bag', category: 'mass', toBaseFactor: EXACT_CONVERSION.CEMENT_BAG_KG, description: 'Standard 50 kg Portland cement bag', system: 'universal' },
    { id: 'lb', name: 'Pound (Avoirdupois)', symbol: 'lb', category: 'mass', toBaseFactor: EXACT_CONVERSION.LB_TO_KG, description: 'Imperial mass pound', system: 'imperial' },
    { id: 'g', name: 'Gram', symbol: 'g', category: 'mass', toBaseFactor: 0.001, description: 'Laboratory material mass', system: 'metric' },
    { id: 'maund', name: 'Maund (Mon)', symbol: 'mon', category: 'mass', toBaseFactor: 37.32417216, description: 'Regional agricultural/mass weight (40 seers)', isRegional: true, system: 'regional' },
    { id: 'quintal', name: 'Quintal', symbol: 'q', category: 'mass', toBaseFactor: 100.0, description: '100 kg weight measure', system: 'metric' },
  ],
  pressure: [
    { id: 'Pa', name: 'Pascal', symbol: 'Pa', category: 'pressure', toBaseFactor: 1.0, description: 'SI base stress/pressure unit', system: 'metric' },
    { id: 'kPa', name: 'Kilopascal (kN/m²)', symbol: 'kPa', category: 'pressure', toBaseFactor: EXACT_CONVERSION.KPA_TO_PA, description: 'Soil bearing pressure (1 kPa = 1 kN/m²)', system: 'metric' },
    { id: 'MPa', name: 'Megapascal (N/mm²)', symbol: 'MPa', category: 'pressure', toBaseFactor: EXACT_CONVERSION.MPA_TO_PA, description: 'Concrete compressive & steel yield strength', system: 'metric' },
    { id: 'GPa', name: 'Gigapascal', symbol: 'GPa', category: 'pressure', toBaseFactor: EXACT_CONVERSION.GPA_TO_PA, description: 'Modulus of elasticity E', system: 'metric' },
    { id: 'psi', name: 'Pounds per Sq Inch', symbol: 'psi', category: 'pressure', toBaseFactor: 6894.757293168361, description: 'Imperial cylinder strength (1 MPa ≈ 145.038 psi)', system: 'imperial' },
    { id: 'ksi', name: 'Kips per Sq Inch', symbol: 'ksi', category: 'pressure', toBaseFactor: 6894757.293168361, description: 'AISC structural steel yield stress', system: 'imperial' },
    { id: 'psf', name: 'Pounds per Sq Foot', symbol: 'psf', category: 'pressure', toBaseFactor: 47.88025898033584, description: 'Imperial soil bearing capacity', system: 'imperial' },
    { id: 'tsf', name: 'Tons per Sq Foot', symbol: 'tsf', category: 'pressure', toBaseFactor: 95760.51796067168, description: 'Geotechnical short tons per sq ft', system: 'imperial' },
    { id: 'bar', name: 'Bar', symbol: 'bar', category: 'pressure', toBaseFactor: 100000.0, description: 'Atmospheric & fluid pressure (100 kPa)', system: 'metric' },
    { id: 'kgf/cm2', name: 'Kilogram-Force / cm²', symbol: 'kgf/cm²', category: 'pressure', toBaseFactor: 98066.5, description: 'Metric technical pressure (1 kgf/cm² ≈ 0.098 MPa)', system: 'metric' },
    { id: 'atm', name: 'Standard Atmosphere', symbol: 'atm', category: 'pressure', toBaseFactor: 101325.0, description: 'Standard atmospheric pressure (101.325 kPa)', system: 'universal' },
  ],
  force: [
    { id: 'N', name: 'Newton', symbol: 'N', category: 'force', toBaseFactor: 1.0, description: 'SI base force unit', system: 'metric' },
    { id: 'kN', name: 'Kilonewton', symbol: 'kN', category: 'force', toBaseFactor: EXACT_CONVERSION.KN_TO_N, description: 'Structural load & shear force', system: 'metric' },
    { id: 'MN', name: 'Meganewton', symbol: 'MN', category: 'force', toBaseFactor: 1000000.0, description: 'Bridge pier foundation reaction', system: 'metric' },
    { id: 'lbf', name: 'Pound Force', symbol: 'lbf', category: 'force', toBaseFactor: 4.4482216152605, description: 'Imperial force pound', system: 'imperial' },
    { id: 'kip', name: 'Kip (1000 lbf)', symbol: 'kip', category: 'force', toBaseFactor: 4448.2216152605, description: 'US structural engineering kip', system: 'imperial' },
    { id: 'kgf', name: 'Kilogram Force', symbol: 'kgf', category: 'force', toBaseFactor: 9.80665, description: 'Gravitational metric force', system: 'metric' },
    { id: 'tonf', name: 'Metric Ton-Force', symbol: 'tonf', category: 'force', toBaseFactor: 9806.65, description: 'Gravitational metric tonne force', system: 'metric' },
  ],
  distributed_load: [
    { id: 'N/m', name: 'Newton / Meter', symbol: 'N/m', category: 'distributed_load', toBaseFactor: 1.0, description: 'SI base line load', system: 'metric' },
    { id: 'kN/m', name: 'Kilonewton / Meter', symbol: 'kN/m', category: 'distributed_load', toBaseFactor: EXACT_CONVERSION.KN_TO_N, description: 'Standard metric beam line load', system: 'metric' },
    { id: 'N/mm', name: 'Newton / Millimeter', symbol: 'N/mm', category: 'distributed_load', toBaseFactor: EXACT_CONVERSION.KN_TO_N, description: 'Component edge load (1 N/mm = 1 kN/m)', system: 'metric' },
    { id: 'lbf/ft', name: 'Pounds / Foot (plf)', symbol: 'plf', category: 'distributed_load', toBaseFactor: 14.593902937206368, description: 'Imperial uniform load', system: 'imperial' },
    { id: 'plf', name: 'Pounds / Foot (Alias)', symbol: 'plf', category: 'distributed_load', toBaseFactor: 14.593902937206368, description: 'Imperial uniform load alias', system: 'imperial' },
    { id: 'kip/ft', name: 'Kips / Foot (klf)', symbol: 'klf', category: 'distributed_load', toBaseFactor: 14593.902937206368, description: 'US structural line load', system: 'imperial' },
    { id: 'klf', name: 'Kips / Foot (Alias)', symbol: 'klf', category: 'distributed_load', toBaseFactor: 14593.902937206368, description: 'US structural uniform load alias', system: 'imperial' },
    { id: 'kgf/m', name: 'Kilogram Force / Meter', symbol: 'kgf/m', category: 'distributed_load', toBaseFactor: 9.80665, description: 'Metric gravitational line load', system: 'metric' },
  ],
  density: [
    { id: 'kN/m3', name: 'Kilonewton / m³', symbol: 'kN/m³', category: 'density', toBaseFactor: 1.0, description: 'Canonical civil soil gamma (e.g. 18 kN/m³)', system: 'metric' },
    { id: 'N/m3', name: 'Newton / m³', symbol: 'N/m³', category: 'density', toBaseFactor: 0.001, description: 'SI base volumetric force', system: 'metric' },
    { id: 'kg/m3', name: 'Kilogram / m³', symbol: 'kg/m³', category: 'density', toBaseFactor: 0.00980665, description: 'Material density (e.g. 2400 kg/m³)', system: 'metric' },
    { id: 'pcf', name: 'Pounds / Cu Foot (pcf)', symbol: 'pcf', category: 'density', toBaseFactor: 0.157087463, description: 'Imperial unit weight (pcf)', system: 'imperial' },
    { id: 'g/cm3', name: 'Gram / cm³', symbol: 'g/cm³', category: 'density', toBaseFactor: 9.80665, description: 'Geotechnical laboratory density', system: 'metric' },
  ],
  moment: [
    { id: 'N.m', name: 'Newton · Meter', symbol: 'N·m', category: 'moment', toBaseFactor: 1.0, description: 'SI base moment unit', system: 'metric' },
    { id: 'kN.m', name: 'Kilonewton · Meter', symbol: 'kN·m', category: 'moment', toBaseFactor: EXACT_CONVERSION.KNM_TO_NM, description: 'Standard structural flexural moment', system: 'metric' },
    { id: 'N.mm', name: 'Newton · Millimeter', symbol: 'N·mm', category: 'moment', toBaseFactor: 0.001, description: 'Section cross-section moment', system: 'metric' },
    { id: 'kip.ft', name: 'Kip · Foot', symbol: 'kip·ft', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM, description: 'US structural bending moment', system: 'imperial' },
    { id: 'kip.in', name: 'Kip · Inch', symbol: 'kip·in', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM / 12, description: 'US section flexural capacity', system: 'imperial' },
    { id: 'lbf.ft', name: 'Pound · Foot', symbol: 'lb·ft', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM / 1000, description: 'Imperial torque & moment', system: 'imperial' },
    { id: 'lbf.in', name: 'Pound · Inch', symbol: 'lb·in', category: 'moment', toBaseFactor: EXACT_CONVERSION.KIP_FT_TO_NM / 12000, description: 'Imperial inch torque', system: 'imperial' },
  ],
  slope: [
    { id: 'ratio', name: 'Ratio (1:H / V:H)', symbol: 'ratio', category: 'slope', toBaseFactor: 1.0, description: 'Dimensionless gradient ratio', system: 'universal' },
    { id: 'percent', name: 'Percentage Grade', symbol: '%', category: 'slope', toBaseFactor: 0.01, description: 'Civil road grade (e.g. 2% = 0.02)', system: 'universal' },
    { id: 'degree', name: 'Angle in Degrees', symbol: '°', category: 'slope', toBaseFactor: 1.0, description: 'Friction angle or inclination', system: 'universal' },
  ],
  velocity: [
    { id: 'm/s', name: 'Meters / Second', symbol: 'm/s', category: 'velocity', toBaseFactor: 1.0, description: 'SI base velocity / hydraulic flow speed', system: 'metric' },
    { id: 'ft/s', name: 'Feet / Second', symbol: 'ft/s', category: 'velocity', toBaseFactor: EXACT_CONVERSION.FT_TO_M, description: 'Imperial channel flow velocity', system: 'imperial' },
    { id: 'km/h', name: 'Kilometers / Hour', symbol: 'km/h', category: 'velocity', toBaseFactor: 1 / 3.6, description: 'Traffic & hydraulic speed (1/3.6 m/s)', system: 'metric' },
    { id: 'mph', name: 'Miles / Hour', symbol: 'mph', category: 'velocity', toBaseFactor: 0.44704, description: 'US wind design speed', system: 'imperial' },
    { id: 'knot', name: 'Knot (Nautical Mile/h)', symbol: 'kt', category: 'velocity', toBaseFactor: 0.514444444, description: 'Nautical & meteorological wind speed', system: 'universal' },
  ],
  flow_rate: [
    { id: 'm3/s', name: 'Cubic Meters / Second (cumec)', symbol: 'm³/s', category: 'flow_rate', toBaseFactor: 1.0, description: 'SI base discharge (cumecs)', system: 'metric' },
    { id: 'cfs', name: 'Cubic Feet / Second (cusec)', symbol: 'cfs', category: 'flow_rate', toBaseFactor: EXACT_CONVERSION.CFT_TO_M3, description: 'Imperial discharge (cusecs)', system: 'imperial' },
    { id: 'L/s', name: 'Liters / Second', symbol: 'L/s', category: 'flow_rate', toBaseFactor: 0.001, description: 'Pipe and pump discharge', system: 'metric' },
    { id: 'gpm', name: 'US Gallons / Minute', symbol: 'gpm', category: 'flow_rate', toBaseFactor: 0.0000630901964, description: 'Pumping capacity (gpm)', system: 'imperial' },
    { id: 'm3/hr', name: 'Cubic Meters / Hour', symbol: 'm³/h', category: 'flow_rate', toBaseFactor: 1 / 3600, description: 'Treatment plant flow rate', system: 'metric' },
    { id: 'mgd', name: 'Million Gallons / Day (MGD)', symbol: 'MGD', category: 'flow_rate', toBaseFactor: 0.043812636, description: 'Municipal water supply discharge', system: 'imperial' },
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

  if (category === 'slope') {
    if (fromUnitId === 'degree' && toUnitId === 'percent') {
      return Math.tan((value * Math.PI) / 180) * 100;
    }
    if (fromUnitId === 'percent' && toUnitId === 'degree') {
      return (Math.atan(value / 100) * 180) / Math.PI;
    }
    if (fromUnitId === 'degree' && toUnitId === 'ratio') {
      return Math.tan((value * Math.PI) / 180);
    }
    if (fromUnitId === 'ratio' && toUnitId === 'degree') {
      return (Math.atan(value) * 180) / Math.PI;
    }
    if (fromUnitId === 'percent' && toUnitId === 'ratio') {
      return value / 100;
    }
    if (fromUnitId === 'ratio' && toUnitId === 'percent') {
      return value * 100;
    }
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
    if (fromUnitId === 'degree' && toUnitId === 'percent') {
      const res = Math.tan((value * Math.PI) / 180) * 100;
      return { result: res, formula: `tan(${value}°) × 100 = ${res.toFixed(4)}%` };
    }
    if (fromUnitId === 'percent' && toUnitId === 'degree') {
      const res = (Math.atan(value / 100) * 180) / Math.PI;
      return { result: res, formula: `atan(${value} / 100) = ${res.toFixed(4)}°` };
    }
    if (fromUnitId === 'degree' && toUnitId === 'ratio') {
      const res = Math.tan((value * Math.PI) / 180);
      return { result: res, formula: `tan(${value}°) = ${res.toFixed(5)}` };
    }
    if (fromUnitId === 'ratio' && toUnitId === 'degree') {
      const res = (Math.atan(value) * 180) / Math.PI;
      return { result: res, formula: `atan(${value}) = ${res.toFixed(4)}°` };
    }
    if (fromUnitId === 'percent' && toUnitId === 'ratio') {
      const res = value / 100;
      return { result: res, formula: `${value}% / 100 = ${res.toFixed(4)}` };
    }
    if (fromUnitId === 'ratio' && toUnitId === 'percent') {
      const res = value * 100;
      return { result: res, formula: `${value} × 100 = ${res.toFixed(2)}%` };
    }
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
   FEET-INCH DECIMAL PARSER
------------------------------------------------------------- */
export interface FeetInchParseResult {
  isValid: boolean;
  totalInches: number;
  totalFeet: number;
  totalMeters: number;
  totalMm: number;
  normalizedString: string;
  fractionString: string;
  errorMessage?: string;
}

/**
 * Parses diverse architectural/construction notations including:
 * - 12'--4 1/2"
 * - 12' 4-1/2"
 * - 12 ft 6.5 in
 * - 150 in
 * - 3810 mm
 * - 12.5 ft
 * - 4 3/8"
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

  // Pattern 3: Explicit Feet marker (e.g. 12', 12 ft, 12 feet, 12'-6 1/2", 12' 4.5", 12'6")
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
  const absInches = Math.abs(totalInches);
  const ft = Math.floor(absInches / 12);
  const remInches = absInches - ft * 12;
  const wholeInches = Math.floor(remInches);
  const fracPart = remInches - wholeInches;

  // Nearest 1/16 inch
  const sixteenths = Math.round(fracPart * 16);
  let fractionText = '';
  let finalWholeInches = wholeInches;

  if (sixteenths === 16) {
    finalWholeInches += 1;
  } else if (sixteenths > 0) {
    // Simplify fraction
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const div = gcd(sixteenths, 16);
    fractionText = ` ${sixteenths / div}/${16 / div}`;
  }

  const fractionString = `${sign}${ft}'-${finalWholeInches}${fractionText}"`;
  const normalizedString = `${sign}${ft} ft ${remInches.toFixed(3)} in`;

  return {
    isValid: true,
    totalInches,
    totalFeet,
    totalMeters,
    totalMm,
    normalizedString,
    fractionString,
  };
}
