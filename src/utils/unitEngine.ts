import { CustomUnitDefinition, UnitCategoryKey } from '../types/civil';
import { parseFeetInchString, FeetInchParseResult } from './unitConverter';

export interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  category: UnitCategoryKey;
  toBaseFactor: number; // Multiplier to reach canonical Base unit
  description: string;
  isRegional?: boolean;
  system: 'metric' | 'imperial' | 'regional' | 'universal';
}

export const CANONICAL_BASE_UNITS: Record<UnitCategoryKey, string> = {
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
};

export const ALL_UNITS: Record<UnitCategoryKey, UnitDefinition[]> = {
  length: [
    { id: 'm', name: 'Meter', symbol: 'm', category: 'length', toBaseFactor: 1.0, description: 'SI base unit of length', system: 'metric' },
    { id: 'mm', name: 'Millimeter', symbol: 'mm', category: 'length', toBaseFactor: 0.001, description: 'Drafting & reinforcement rebar unit', system: 'metric' },
    { id: 'cm', name: 'Centimeter', symbol: 'cm', category: 'length', toBaseFactor: 0.01, description: 'Metric length unit', system: 'metric' },
    { id: 'km', name: 'Kilometer', symbol: 'km', category: 'length', toBaseFactor: 1000.0, description: 'Highway alignment & chainage', system: 'metric' },
    { id: 'ft', name: 'Foot', symbol: 'ft', category: 'length', toBaseFactor: 0.3048, description: 'Imperial architectural foot', system: 'imperial' },
    { id: 'in', name: 'Inch', symbol: 'in', category: 'length', toBaseFactor: 0.0254, description: 'Imperial architectural inch', system: 'imperial' },
    { id: 'yd', name: 'Yard', symbol: 'yd', category: 'length', toBaseFactor: 0.9144, description: 'Survey yard (3 ft)', system: 'imperial' },
    { id: 'mi', name: 'Mile', symbol: 'mi', category: 'length', toBaseFactor: 1609.344, description: 'Statute road mile', system: 'imperial' },
    { id: 'ft-in', name: 'Feet-Inch (Arch)', symbol: `ft'-in"`, category: 'length', toBaseFactor: 0.3048, description: `Architectural composite string (e.g. 12'-6 1/2")`, system: 'imperial' },
  ],
  area: [
    { id: 'm2', name: 'Square Meter', symbol: 'm²', category: 'area', toBaseFactor: 1.0, description: 'SI base unit of area', system: 'metric' },
    { id: 'mm2', name: 'Square Millimeter', symbol: 'mm²', category: 'area', toBaseFactor: 1e-6, description: 'Steel cross-section area (As)', system: 'metric' },
    { id: 'cm2', name: 'Square Centimeter', symbol: 'cm²', category: 'area', toBaseFactor: 1e-4, description: 'Metric section area', system: 'metric' },
    { id: 'ft2', name: 'Square Foot (SFT)', symbol: 'sq ft', category: 'area', toBaseFactor: 0.09290304, description: 'Floor & slab plan area (SFT)', system: 'imperial' },
    { id: 'in2', name: 'Square Inch', symbol: 'sq in', category: 'area', toBaseFactor: 0.00064516, description: 'Imperial rebar area', system: 'imperial' },
    { id: 'yd2', name: 'Square Yard', symbol: 'sq yd', category: 'area', toBaseFactor: 0.83612736, description: 'Pavement surface area', system: 'imperial' },
    { id: 'acre', name: 'Acre', symbol: 'ac', category: 'area', toBaseFactor: 4046.8564224, description: '43,560 sq ft land parcel', system: 'imperial' },
    { id: 'hectare', name: 'Hectare', symbol: 'ha', category: 'area', toBaseFactor: 10000.0, description: '10,000 m² cadastre unit', system: 'metric' },
    { id: 'decimal', name: 'Decimal (Satang)', symbol: 'dec', category: 'area', toBaseFactor: 40.468564224, description: '1/100 acre = 435.6 sq ft', isRegional: true, system: 'regional' },
    { id: 'katha', name: 'Katha (Bengal)', symbol: 'katha', category: 'area', toBaseFactor: 66.8901888, description: '1.65 decimal = 720 sq ft', isRegional: true, system: 'regional' },
    { id: 'bigha', name: 'Bigha (Standard)', symbol: 'bigha', category: 'area', toBaseFactor: 1337.803776, description: '20 kathas = 14,400 sq ft', isRegional: true, system: 'regional' },
    { id: 'ganda', name: 'Ganda', symbol: 'ganda', category: 'area', toBaseFactor: 20.06705664, description: '4 karas = 216 sq ft', isRegional: true, system: 'regional' },
  ],
  volume: [
    { id: 'm3', name: 'Cubic Meter', symbol: 'm³', category: 'volume', toBaseFactor: 1.0, description: 'SI base volume unit', system: 'metric' },
    { id: 'cft', name: 'Cubic Foot (CFT)', symbol: 'cft', category: 'volume', toBaseFactor: 0.028316846592, description: 'Traditional concrete/sand volume (35.315 cft/m³)', system: 'imperial' },
    { id: 'liter', name: 'Liter', symbol: 'L', category: 'volume', toBaseFactor: 0.001, description: 'Water mixing volume (1 L = 0.001 m³)', system: 'metric' },
    { id: 'gal_us', name: 'US Gallon', symbol: 'US gal', category: 'volume', toBaseFactor: 0.003785411784, description: 'US liquid volume (3.785 L)', system: 'imperial' },
    { id: 'gal_uk', name: 'Imperial Gallon', symbol: 'UK gal', category: 'volume', toBaseFactor: 0.00454609, description: 'UK liquid volume (4.546 L)', system: 'imperial' },
    { id: 'yd3', name: 'Cubic Yard', symbol: 'cu yd', category: 'volume', toBaseFactor: 0.764554857984, description: 'Readymix batch transit yard', system: 'imperial' },
  ],
  mass: [
    { id: 'kg', name: 'Kilogram', symbol: 'kg', category: 'mass', toBaseFactor: 1.0, description: 'SI base mass unit', system: 'metric' },
    { id: 'tonne', name: 'Metric Tonne', symbol: 'MT', category: 'mass', toBaseFactor: 1000.0, description: '1,000 kg structural steel measure', system: 'metric' },
    { id: 'bag50', name: 'Cement Bag (50kg)', symbol: 'bag', category: 'mass', toBaseFactor: 50.0, description: 'Standard 50 kg Portland cement bag', system: 'universal' },
    { id: 'lb', name: 'Pound (lb)', symbol: 'lb', category: 'mass', toBaseFactor: 0.45359237, description: 'Imperial mass pound', system: 'imperial' },
    { id: 'quintal', name: 'Quintal', symbol: 'q', category: 'mass', toBaseFactor: 100.0, description: '100 kg weight measure', system: 'metric' },
    { id: 'maund', name: 'Maund (Mon)', symbol: 'mon', category: 'mass', toBaseFactor: 37.32417216, description: 'Regional agricultural unit (40 seers)', isRegional: true, system: 'regional' },
  ],
  force: [
    { id: 'N', name: 'Newton', symbol: 'N', category: 'force', toBaseFactor: 1.0, description: 'SI base force unit', system: 'metric' },
    { id: 'kN', name: 'Kilonewton', symbol: 'kN', category: 'force', toBaseFactor: 1000.0, description: 'Structural load & shear force', system: 'metric' },
    { id: 'MN', name: 'Meganewton', symbol: 'MN', category: 'force', toBaseFactor: 1000000.0, description: 'Bridge pier foundation reaction', system: 'metric' },
    { id: 'lbf', name: 'Pound Force', symbol: 'lbf', category: 'force', toBaseFactor: 4.4482216152605, description: 'Imperial force pound', system: 'imperial' },
    { id: 'kip', name: 'Kip (1000 lbf)', symbol: 'kip', category: 'force', toBaseFactor: 4448.2216152605, description: 'US structural engineering kip', system: 'imperial' },
    { id: 'kgf', name: 'Kilogram Force', symbol: 'kgf', category: 'force', toBaseFactor: 9.80665, description: 'Gravitational metric force', system: 'metric' },
  ],
  distributed_load: [
    { id: 'kN/m', name: 'Kilonewton / Meter', symbol: 'kN/m', category: 'distributed_load', toBaseFactor: 1000.0, description: 'Standard metric beam line load', system: 'metric' },
    { id: 'N/m', name: 'Newton / Meter', symbol: 'N/m', category: 'distributed_load', toBaseFactor: 1.0, description: 'SI base line load', system: 'metric' },
    { id: 'N/mm', name: 'Newton / Millimeter', symbol: 'N/mm', category: 'distributed_load', toBaseFactor: 1000.0, description: 'Component edge load', system: 'metric' },
    { id: 'lbf/ft', name: 'Pounds / Foot (plf)', symbol: 'plf', category: 'distributed_load', toBaseFactor: 14.5939029372, description: 'Imperial uniform beam load', system: 'imperial' },
    { id: 'kip/ft', name: 'Kips / Foot (klf)', symbol: 'klf', category: 'distributed_load', toBaseFactor: 14593.9029372, description: 'US structural uniform load', system: 'imperial' },
    { id: 'kgf/m', name: 'Kilogram-Force / Meter', symbol: 'kgf/m', category: 'distributed_load', toBaseFactor: 9.80665, description: 'Metric gravitational line load', system: 'metric' },
  ],
  pressure: [
    { id: 'Pa', name: 'Pascal', symbol: 'Pa', category: 'pressure', toBaseFactor: 1.0, description: 'SI base stress/pressure unit', system: 'metric' },
    { id: 'kPa', name: 'Kilopascal (kN/m²)', symbol: 'kPa', category: 'pressure', toBaseFactor: 1000.0, description: 'Soil bearing pressure (1 kPa = 1 kN/m²)', system: 'metric' },
    { id: 'MPa', name: 'Megapascal (N/mm²)', symbol: 'MPa', category: 'pressure', toBaseFactor: 1000000.0, description: 'Concrete f\'c and steel fy strength', system: 'metric' },
    { id: 'GPa', name: 'Gigapascal', symbol: 'GPa', category: 'pressure', toBaseFactor: 1000000000.0, description: 'Young\'s modulus of elasticity E', system: 'metric' },
    { id: 'psi', name: 'Pounds / Sq Inch', symbol: 'psi', category: 'pressure', toBaseFactor: 6894.757293168, description: 'Imperial cylinder strength (1 MPa ≈ 145 psi)', system: 'imperial' },
    { id: 'ksi', name: 'Kips / Sq Inch', symbol: 'ksi', category: 'pressure', toBaseFactor: 6894757.293168, description: 'AISC structural steel yield stress', system: 'imperial' },
    { id: 'psf', name: 'Pounds / Sq Foot', symbol: 'psf', category: 'pressure', toBaseFactor: 47.8802589, description: 'Imperial soil bearing capacity', system: 'imperial' },
    { id: 'tsf', name: 'Tons / Sq Foot', symbol: 'tsf', category: 'pressure', toBaseFactor: 95760.518, description: 'Geotechnical short tons per sq ft', system: 'imperial' },
    { id: 'bar', name: 'Bar', symbol: 'bar', category: 'pressure', toBaseFactor: 100000.0, description: 'Fluid & hydraulic pressure (100 kPa)', system: 'metric' },
  ],
  density: [
    { id: 'kN/m3', name: 'Kilonewton / m³', symbol: 'kN/m³', category: 'density', toBaseFactor: 1.0, description: 'Canonical civil soil gamma (e.g. 18 kN/m³)', system: 'metric' },
    { id: 'N/m3', name: 'Newton / m³', symbol: 'N/m³', category: 'density', toBaseFactor: 0.001, description: 'SI base volumetric force', system: 'metric' },
    { id: 'kg/m3', name: 'Kilogram / m³', symbol: 'kg/m³', category: 'density', toBaseFactor: 0.00980665, description: 'Material density (e.g. 2400 kg/m³)', system: 'metric' },
    { id: 'pcf', name: 'Pounds / Cu Foot (pcf)', symbol: 'pcf', category: 'density', toBaseFactor: 0.15708746, description: 'Imperial soil/concrete unit weight', system: 'imperial' },
    { id: 'g/cm3', name: 'Gram / cm³', symbol: 'g/cm³', category: 'density', toBaseFactor: 9.80665, description: 'Geotechnical laboratory density', system: 'metric' },
  ],
  moment: [
    { id: 'kN.m', name: 'Kilonewton · Meter', symbol: 'kN·m', category: 'moment', toBaseFactor: 1.0, description: 'Standard structural flexural moment', system: 'metric' },
    { id: 'N.m', name: 'Newton · Meter', symbol: 'N·m', category: 'moment', toBaseFactor: 0.001, description: 'SI base moment', system: 'metric' },
    { id: 'N.mm', name: 'Newton · Millimeter', symbol: 'N·mm', category: 'moment', toBaseFactor: 1e-6, description: 'Section cross-section moment', system: 'metric' },
    { id: 'kip.ft', name: 'Kip · Foot', symbol: 'kip·ft', category: 'moment', toBaseFactor: 1.3558179483314, description: 'US structural bending moment', system: 'imperial' },
    { id: 'kip.in', name: 'Kip · Inch', symbol: 'kip·in', category: 'moment', toBaseFactor: 0.1129848290276, description: 'US section flexural capacity', system: 'imperial' },
    { id: 'lbf.ft', name: 'Pound · Foot', symbol: 'lb·ft', category: 'moment', toBaseFactor: 0.0013558179483314, description: 'Imperial torque & moment', system: 'imperial' },
  ],
  slope: [
    { id: 'ratio', name: 'Ratio (1:H / V:H)', symbol: 'ratio', category: 'slope', toBaseFactor: 1.0, description: 'Dimensionless gradient ratio', system: 'universal' },
    { id: 'percent', name: 'Percentage Grade', symbol: '%', category: 'slope', toBaseFactor: 0.01, description: 'Road gradient (e.g. 2% = 0.02)', system: 'universal' },
    { id: 'degree', name: 'Angle in Degrees', symbol: '°', category: 'slope', toBaseFactor: 1.0, description: 'Soil friction angle or slope angle', system: 'universal' },
  ],
  velocity: [
    { id: 'm/s', name: 'Meters / Second', symbol: 'm/s', category: 'velocity', toBaseFactor: 1.0, description: 'SI base velocity / hydraulic flow speed', system: 'metric' },
    { id: 'ft/s', name: 'Feet / Second', symbol: 'ft/s', category: 'velocity', toBaseFactor: 0.3048, description: 'Imperial channel flow velocity', system: 'imperial' },
    { id: 'km/h', name: 'Kilometers / Hour', symbol: 'km/h', category: 'velocity', toBaseFactor: 0.277777778, description: 'Traffic & wind velocity', system: 'metric' },
    { id: 'mph', name: 'Miles / Hour', symbol: 'mph', category: 'velocity', toBaseFactor: 0.44704, description: 'US wind design speed', system: 'imperial' },
  ],
  flow_rate: [
    { id: 'm3/s', name: 'Cubic Meters / Second (cumec)', symbol: 'm³/s', category: 'flow_rate', toBaseFactor: 1.0, description: 'SI base discharge (cumecs)', system: 'metric' },
    { id: 'cfs', name: 'Cubic Feet / Second (cusec)', symbol: 'cfs', category: 'flow_rate', toBaseFactor: 0.028316846592, description: 'Imperial discharge (cusecs)', system: 'imperial' },
    { id: 'L/s', name: 'Liters / Second', symbol: 'L/s', category: 'flow_rate', toBaseFactor: 0.001, description: 'Pipe and pump discharge', system: 'metric' },
    { id: 'gpm', name: 'US Gallons / Minute', symbol: 'gpm', category: 'flow_rate', toBaseFactor: 0.0000630901964, description: 'Pumping capacity (gpm)', system: 'imperial' },
    { id: 'm3/hr', name: 'Cubic Meters / Hour', symbol: 'm³/h', category: 'flow_rate', toBaseFactor: 0.000277777778, description: 'Treatment plant flow rate', system: 'metric' },
  ],
};

/**
 * System Presets Default Units
 */
export const SYSTEM_PRESET_UNITS: Record<'metric' | 'imperial' | 'regional', Record<UnitCategoryKey, string>> = {
  metric: {
    length: 'm',
    area: 'm2',
    volume: 'm3',
    mass: 'kg',
    force: 'kN',
    distributed_load: 'kN/m',
    pressure: 'kPa',
    density: 'kN/m3',
    moment: 'kN.m',
    slope: 'percent',
    velocity: 'm/s',
    flow_rate: 'm3/s',
  },
  imperial: {
    length: 'ft',
    area: 'ft2',
    volume: 'cft',
    mass: 'lb',
    force: 'kip',
    distributed_load: 'kip/ft',
    pressure: 'psi',
    density: 'pcf',
    moment: 'kip.ft',
    slope: 'percent',
    velocity: 'ft/s',
    flow_rate: 'cfs',
  },
  regional: {
    length: 'ft',
    area: 'katha',
    volume: 'cft',
    mass: 'bag50',
    force: 'kN',
    distributed_load: 'kN/m',
    pressure: 'MPa',
    density: 'kg/m3',
    moment: 'kN.m',
    slope: 'percent',
    velocity: 'm/s',
    flow_rate: 'm3/s',
  },
};

/**
 * Normalizes any value in a given unit to the Canonical Base SI unit
 */
export function normalizeToBase(
  value: number,
  unitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[] = []
): number {
  if (isNaN(value)) return 0;
  if (unitId === CANONICAL_BASE_UNITS[category]) return value;

  const allCategoryUnits = [
    ...(ALL_UNITS[category] || []),
    ...customUnits.filter((u) => u.category === category).map((u) => ({
      ...u,
      system: 'universal' as const,
    })),
  ];

  const info = allCategoryUnits.find((u) => u.id === unitId);
  if (!info) return value;
  return value * info.toBaseFactor;
}

/**
 * Converts a Canonical Base SI value to a target display unit
 */
export function denormalizeFromBase(
  baseValue: number,
  targetUnitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[] = []
): number {
  if (isNaN(baseValue)) return 0;
  if (targetUnitId === CANONICAL_BASE_UNITS[category]) return baseValue;

  const allCategoryUnits = [
    ...(ALL_UNITS[category] || []),
    ...customUnits.filter((u) => u.category === category).map((u) => ({
      ...u,
      system: 'universal' as const,
    })),
  ];

  const info = allCategoryUnits.find((u) => u.id === targetUnitId);
  if (!info || info.toBaseFactor === 0) return baseValue;
  return baseValue / info.toBaseFactor;
}

/**
 * Direct Unit-to-Unit Conversion
 */
export function convertDirect(
  value: number,
  fromUnitId: string,
  toUnitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[] = []
): number {
  if (fromUnitId === toUnitId) return value;

  // Handle angle/slope trigonometric conversions
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
 * Get Unit Definition by ID
 */
export function getUnitDefinition(unitId: string, category: UnitCategoryKey, customUnits: CustomUnitDefinition[] = []): UnitDefinition | undefined {
  const allCategoryUnits = [
    ...(ALL_UNITS[category] || []),
    ...customUnits.filter((u) => u.category === category).map((u) => ({
      ...u,
      system: 'universal' as const,
    })),
  ];
  return allCategoryUnits.find((u) => u.id === unitId);
}

/**
 * Smart Input Parser
 * Parses both plain numbers and expressions like "12'-6 1/2\"", "250 mm", "14.5 ft"
 */
export function parseSmartUnitInput(
  rawString: string,
  currentUnitId: string,
  category: UnitCategoryKey
): {
  parsedValue: number;
  detectedUnitId: string;
  isValid: boolean;
  errorMessage?: string;
} {
  const trimmed = rawString.trim();
  if (!trimmed) {
    return { parsedValue: 0, detectedUnitId: currentUnitId, isValid: false, errorMessage: 'Empty input' };
  }

  // 1. If length and contains architectural symbols ' or "
  if (category === 'length' && (/['"]/.test(trimmed) || /ft|in/i.test(trimmed))) {
    const feetInchResult = parseFeetInchString(trimmed);
    if (feetInchResult.isValid) {
      // If current unit is meter, return meters. If ft, return feet.
      if (currentUnitId === 'm') {
        return { parsedValue: feetInchResult.totalMeters, detectedUnitId: 'm', isValid: true };
      }
      if (currentUnitId === 'mm') {
        return { parsedValue: feetInchResult.totalMm, detectedUnitId: 'mm', isValid: true };
      }
      if (currentUnitId === 'in') {
        return { parsedValue: feetInchResult.totalInches, detectedUnitId: 'in', isValid: true };
      }
      return { parsedValue: feetInchResult.totalFeet, detectedUnitId: 'ft', isValid: true };
    }
  }

  // 2. Check for explicit unit suffix in the string: e.g. "250 mm", "15 cft", "500 psi", "18 kN/m3"
  const unitsInCat = ALL_UNITS[category] || [];
  for (const u of unitsInCat) {
    const regex = new RegExp(`^([+-]?\\d+(?:\\.\\d+)?)\\s*(${u.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${u.id})$`, 'i');
    const match = trimmed.match(regex);
    if (match) {
      const num = parseFloat(match[1]);
      if (!isNaN(num)) {
        return { parsedValue: num, detectedUnitId: u.id, isValid: true };
      }
    }
  }

  // 3. Fallback: Parse plain float
  const numericVal = parseFloat(trimmed);
  if (!isNaN(numericVal)) {
    return { parsedValue: numericVal, detectedUnitId: currentUnitId, isValid: true };
  }

  return { parsedValue: 0, detectedUnitId: currentUnitId, isValid: false, errorMessage: 'Invalid number format' };
}
