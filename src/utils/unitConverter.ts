import { CustomUnitDefinition, UnitCategoryKey } from '../types/civil';

export interface UnitInfo {
  id: string;
  name: string;
  symbol: string;
  category: UnitCategoryKey;
  toBaseFactor: number; // Factor to multiply by to get to Base SI unit
  description: string;
  isRegional?: boolean;
}

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
};

export const STANDARD_UNITS: Record<UnitCategoryKey, UnitInfo[]> = {
  length: [
    { id: 'm', name: 'Meter', symbol: 'm', category: 'length', toBaseFactor: 1.0, description: 'SI base unit of length' },
    { id: 'mm', name: 'Millimeter', symbol: 'mm', category: 'length', toBaseFactor: 0.001, description: 'Engineering drafting unit' },
    { id: 'cm', name: 'Centimeter', symbol: 'cm', category: 'length', toBaseFactor: 0.01, description: 'Metric length unit' },
    { id: 'km', name: 'Kilometer', symbol: 'km', category: 'length', toBaseFactor: 1000.0, description: 'Highway alignment unit' },
    { id: 'ft', name: 'Foot', symbol: 'ft', category: 'length', toBaseFactor: 0.3048, description: 'Imperial architectural foot' },
    { id: 'in', name: 'Inch', symbol: 'in', category: 'length', toBaseFactor: 0.0254, description: 'Imperial architectural inch' },
    { id: 'yd', name: 'Yard', symbol: 'yd', category: 'length', toBaseFactor: 0.9144, description: 'Imperial survey yard' },
    { id: 'mile', name: 'Statute Mile', symbol: 'mi', category: 'length', toBaseFactor: 1609.344, description: 'Statute road mile' },
  ],
  area: [
    { id: 'm2', name: 'Square Meter', symbol: 'm²', category: 'area', toBaseFactor: 1.0, description: 'SI base unit of area' },
    { id: 'ft2', name: 'Square Foot', symbol: 'sq ft', category: 'area', toBaseFactor: 0.09290304, description: 'Floor & slab plan area' },
    { id: 'yd2', name: 'Square Yard', symbol: 'sq yd', category: 'area', toBaseFactor: 0.83612736, description: 'Pavement surface area' },
    { id: 'acre', name: 'International Acre', symbol: 'ac', category: 'area', toBaseFactor: 4046.8564224, description: '43,560 sq ft land parcel' },
    { id: 'hectare', name: 'Hectare', symbol: 'ha', category: 'area', toBaseFactor: 10000.0, description: '10,000 m² cadastre unit' },
    // South Asian Regional Units:
    { id: 'decimal', name: 'Decimal (Satang/Shatak)', symbol: 'dec', category: 'area', toBaseFactor: 40.468564224, description: '1/100 of an acre = 435.6 sq ft', isRegional: true },
    { id: 'katha', name: 'Katha (Bengal standard)', symbol: 'katha', category: 'area', toBaseFactor: 66.8901888, description: '1.65 decimal = 720 sq ft', isRegional: true },
    { id: 'bigha', name: 'Bigha (Standard)', symbol: 'bigha', category: 'area', toBaseFactor: 1337.803776, description: '20 kathas = 14,400 sq ft', isRegional: true },
    { id: 'ganda', name: 'Ganda', symbol: 'ganda', category: 'area', toBaseFactor: 20.06705664, description: '4 karas = 216 sq ft', isRegional: true },
  ],
  volume: [
    { id: 'm3', name: 'Cubic Meter', symbol: 'm³', category: 'volume', toBaseFactor: 1.0, description: 'SI base volume unit' },
    { id: 'cft', name: 'Cubic Foot (CFT)', symbol: 'cft', category: 'volume', toBaseFactor: 0.028316846592, description: 'Traditional South Asian concrete/sand volume (35.3147 cft/m³)' },
    { id: 'liter', name: 'Liter', symbol: 'L', category: 'volume', toBaseFactor: 0.001, description: 'Water mixing volume' },
    { id: 'gal_us', name: 'US Gallon', symbol: 'US gal', category: 'volume', toBaseFactor: 0.003785411784, description: 'US liquid volume' },
    { id: 'gal_uk', name: 'Imperial Gallon', symbol: 'UK gal', category: 'volume', toBaseFactor: 0.00454609, description: 'UK liquid volume' },
    { id: 'yd3', name: 'Cubic Yard', symbol: 'cu yd', category: 'volume', toBaseFactor: 0.764554857984, description: 'Readymix batch transit yard' },
  ],
  mass: [
    { id: 'kg', name: 'Kilogram', symbol: 'kg', category: 'mass', toBaseFactor: 1.0, description: 'SI base mass unit' },
    { id: 'tonne', name: 'Metric Tonne', symbol: 'MT', category: 'mass', toBaseFactor: 1000.0, description: '1,000 kg structural steel measure' },
    { id: 'bag50', name: 'Cement Bag (50 kg)', symbol: 'bag', category: 'mass', toBaseFactor: 50.0, description: 'Standard 50 kg Portland cement bag' },
    { id: 'lb', name: 'Pound (Avoirdupois)', symbol: 'lb', category: 'mass', toBaseFactor: 0.45359237, description: 'Imperial mass pound' },
    { id: 'maund', name: 'Maund (Mon)', symbol: 'mon', category: 'mass', toBaseFactor: 37.32417216, description: 'Regional agricultural/mass weight (40 seers)', isRegional: true },
    { id: 'quintal', name: 'Quintal', symbol: 'q', category: 'mass', toBaseFactor: 100.0, description: '100 kg weight' },
  ],
  pressure: [
    { id: 'Pa', name: 'Pascal', symbol: 'Pa', category: 'pressure', toBaseFactor: 1.0, description: 'SI base stress/pressure unit' },
    { id: 'kPa', name: 'Kilopascal', symbol: 'kPa', category: 'pressure', toBaseFactor: 1000.0, description: 'Soil bearing pressure (1 kPa = 1 kN/m²)' },
    { id: 'MPa', name: 'Megapascal (N/mm²)', symbol: 'MPa', category: 'pressure', toBaseFactor: 1000000.0, description: 'Concrete compressive & steel yield strength' },
    { id: 'GPa', name: 'Gigapascal', symbol: 'GPa', category: 'pressure', toBaseFactor: 1000000000.0, description: 'Modulus of elasticity E' },
    { id: 'psi', name: 'Pounds per Sq Inch', symbol: 'psi', category: 'pressure', toBaseFactor: 6894.757293168, description: 'Imperial cylinder strength (1 MPa ≈ 145.038 psi)' },
    { id: 'ksi', name: 'Kips per Sq Inch', symbol: 'ksi', category: 'pressure', toBaseFactor: 6894757.293168, description: 'AISC structural steel yield stress' },
    { id: 'bar', name: 'Bar', symbol: 'bar', category: 'pressure', toBaseFactor: 100000.0, description: 'Atmospheric fluid pressure' },
    { id: 'tsf', name: 'Tons per Sq Foot', symbol: 'tsf', category: 'pressure', toBaseFactor: 95760.518, description: 'Geotechnical short tons per sq ft' },
  ],
  force: [
    { id: 'N', name: 'Newton', symbol: 'N', category: 'force', toBaseFactor: 1.0, description: 'SI base force unit' },
    { id: 'kN', name: 'Kilonewton', symbol: 'kN', category: 'force', toBaseFactor: 1000.0, description: 'Structural load & shear force' },
    { id: 'MN', name: 'Meganewton', symbol: 'MN', category: 'force', toBaseFactor: 1000000.0, description: 'Bridge pier foundation reaction' },
    { id: 'lbf', name: 'Pound Force', symbol: 'lbf', category: 'force', toBaseFactor: 4.4482216152605, description: 'Imperial force pound' },
    { id: 'kip', name: 'Kip (1000 lbf)', symbol: 'kip', category: 'force', toBaseFactor: 4448.2216152605, description: 'US structural engineering kip' },
    { id: 'kgf', name: 'Kilogram Force', symbol: 'kgf', category: 'force', toBaseFactor: 9.80665, description: 'Gravitational metric force' },
  ],
  distributed_load: [
    { id: 'kN/m', name: 'Kilonewton / Meter', symbol: 'kN/m', category: 'distributed_load', toBaseFactor: 1000.0, description: 'Beam line load' },
    { id: 'N/m', name: 'Newton / Meter', symbol: 'N/m', category: 'distributed_load', toBaseFactor: 1.0, description: 'SI base line load' },
    { id: 'lbf/ft', name: 'Pounds / Foot (plf)', symbol: 'plf', category: 'distributed_load', toBaseFactor: 14.5939029372, description: 'Imperial uniform load' },
    { id: 'kip/ft', name: 'Kips / Foot (klf)', symbol: 'klf', category: 'distributed_load', toBaseFactor: 14593.9029372, description: 'US structural line load' },
  ],
  density: [
    { id: 'kN/m3', name: 'Kilonewton / m³', symbol: 'kN/m³', category: 'density', toBaseFactor: 1.0, description: 'Soil gamma unit weight' },
    { id: 'kg/m3', name: 'Kilogram / m³', symbol: 'kg/m³', category: 'density', toBaseFactor: 0.00980665, description: 'Material density' },
    { id: 'pcf', name: 'Pounds / Cu Foot (pcf)', symbol: 'pcf', category: 'density', toBaseFactor: 0.15708746, description: 'Imperial unit weight' },
  ],
  moment: [
    { id: 'kN.m', name: 'Kilonewton · Meter', symbol: 'kN·m', category: 'moment', toBaseFactor: 1.0, description: 'Flexural bending moment' },
    { id: 'N.m', name: 'Newton · Meter', symbol: 'N·m', category: 'moment', toBaseFactor: 0.001, description: 'SI base moment' },
    { id: 'kip.ft', name: 'Kip · Foot', symbol: 'kip·ft', category: 'moment', toBaseFactor: 1.3558179483314, description: 'US bending moment' },
    { id: 'lbf.ft', name: 'Pound · Foot', symbol: 'lb·ft', category: 'moment', toBaseFactor: 0.0013558179483314, description: 'Imperial moment' },
  ],
  slope: [
    { id: 'ratio', name: 'Ratio (1:H / V:H)', symbol: 'ratio', category: 'slope', toBaseFactor: 1.0, description: 'Dimensionless gradient ratio' },
    { id: 'percent', name: 'Percentage Grade', symbol: '%', category: 'slope', toBaseFactor: 0.01, description: 'Civil road grade (e.g. 2% = 0.02)' },
    { id: 'degree', name: 'Angle in Degrees', symbol: '°', category: 'slope', toBaseFactor: 1.0, description: 'Friction angle or inclination' },
  ],
  velocity: [
    { id: 'm/s', name: 'Meters / Second', symbol: 'm/s', category: 'velocity', toBaseFactor: 1.0, description: 'SI base velocity' },
    { id: 'ft/s', name: 'Feet / Second', symbol: 'ft/s', category: 'velocity', toBaseFactor: 0.3048, description: 'Imperial flow velocity' },
    { id: 'km/h', name: 'Kilometers / Hour', symbol: 'km/h', category: 'velocity', toBaseFactor: 0.277777778, description: 'Metric speed' },
  ],
  flow_rate: [
    { id: 'm3/s', name: 'Cubic Meters / Second (cumec)', symbol: 'm³/s', category: 'flow_rate', toBaseFactor: 1.0, description: 'SI base discharge' },
    { id: 'cfs', name: 'Cubic Feet / Second (cusec)', symbol: 'cfs', category: 'flow_rate', toBaseFactor: 0.028316846592, description: 'Imperial discharge' },
    { id: 'L/s', name: 'Liters / Second', symbol: 'L/s', category: 'flow_rate', toBaseFactor: 0.001, description: 'Pipe flow' },
  ],
};

/**
 * High-Precision Unit Conversion Engine
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
      const rad = (value * Math.PI) / 180;
      const res = Math.tan(rad) * 100;
      return { result: res, formula: `tan(${value}°) × 100 = ${res.toFixed(3)}%` };
    }
    if (fromUnitId === 'percent' && toUnitId === 'degree') {
      const rad = Math.atan(value / 100);
      const res = (rad * 180) / Math.PI;
      return { result: res, formula: `atan(${value} / 100) = ${res.toFixed(3)}°` };
    }
    if (fromUnitId === 'degree' && toUnitId === 'ratio') {
      const rad = (value * Math.PI) / 180;
      const res = Math.tan(rad);
      return { result: res, formula: `tan(${value}°) = ${res.toFixed(4)}` };
    }
    if (fromUnitId === 'ratio' && toUnitId === 'degree') {
      const rad = Math.atan(value);
      const res = (rad * 180) / Math.PI;
      return { result: res, formula: `atan(${value}) = ${res.toFixed(3)}°` };
    }
  }

  // General linear factor conversion
  const allUnits: Array<{ id: string; toBaseFactor: number }> = [
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

  const formula = `${value} × (${fromInfo.toBaseFactor} / ${toInfo.toBaseFactor}) = ${targetValue}`;
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
  const clean = rawInput.trim();
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

  // Check if pure metric format: e.g. "3810 mm" or "3.81 m"
  const metricMmMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:mm|millimeter)$/i);
  if (metricMmMatch) {
    const mm = parseFloat(metricMmMatch[1]);
    const inches = mm / 25.4;
    return formatInchesResult(inches);
  }

  const metricMMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:m|meter|meters)$/i);
  if (metricMMatch) {
    const m = parseFloat(metricMMatch[1]);
    const inches = (m * 1000) / 25.4;
    return formatInchesResult(inches);
  }

  // Normalize common architectural delimiters: replace '--' or '-' between feet and inches
  // Replace symbols: ' -> ft, " -> in
  let totalInches = 0;
  let parsedAny = false;

  // Pattern 1: Feet part (e.g., 12', 12 ft, 12-ft)
  const feetMatch = clean.match(/([+-]?\d+(?:\.\d+)?)\s*(?:'|ft|feet)/i);
  if (feetMatch) {
    const feetVal = parseFloat(feetMatch[1]);
    totalInches += feetVal * 12;
    parsedAny = true;
  }

  // Remove the feet portion to safely parse inches/fractions
  const remainder = clean.replace(/([+-]?\d+(?:\.\d+)?)\s*(?:'|ft|feet)/i, '').replace(/^[-–—]+/, '').trim();

  // Pattern 2: Inch with fraction or decimal: e.g., "4 1/2"", "4-1/2 in", "4.5"", "1/2""
  if (remainder) {
    // Check for combined whole + fraction: "4 1/2" or "4-1/2"
    const wholeFractionMatch = remainder.match(/(\d+)\s*[-/ ]\s*(\d+)\s*\/\s*(\d+)\s*(?:"|in|inch|inches)?/i);
    if (wholeFractionMatch && wholeFractionMatch[3] !== '0') {
      const whole = parseFloat(wholeFractionMatch[1]);
      const num = parseFloat(wholeFractionMatch[2]);
      const den = parseFloat(wholeFractionMatch[3]);
      totalInches += whole + num / den;
      parsedAny = true;
    } else {
      // Check for standalone fraction: "1/2""
      const fractionOnlyMatch = remainder.match(/(\d+)\s*\/\s*(\d+)\s*(?:"|in|inch|inches)?/i);
      if (fractionOnlyMatch && fractionOnlyMatch[2] !== '0') {
        const num = parseFloat(fractionOnlyMatch[1]);
        const den = parseFloat(fractionOnlyMatch[2]);
        totalInches += num / den;
        parsedAny = true;
      } else {
        // Standalone decimal/integer inches: "4.5"", "6 in"
        const inchMatch = remainder.match(/([+-]?\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?/i);
        if (inchMatch) {
          totalInches += parseFloat(inchMatch[1]);
          parsedAny = true;
        }
      }
    }
  }

  // Fallback: If no markers were found, parse as decimal inches or decimal feet
  if (!parsedAny) {
    const numericOnly = parseFloat(clean);
    if (!isNaN(numericOnly)) {
      totalInches = numericOnly; // default to inches
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

  return formatInchesResult(totalInches);
}

function formatInchesResult(totalInches: number): FeetInchParseResult {
  const totalFeet = totalInches / 12;
  const totalMm = totalInches * 25.4;
  const totalMeters = totalMm / 1000;

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
  const normalizedString = `${sign}${ft} ft ${(remInches).toFixed(3)} in`;

  return {
    isValid: true,
    totalInches: Number(totalInches.toFixed(4)),
    totalFeet: Number(totalFeet.toFixed(4)),
    totalMeters: Number(totalMeters.toFixed(4)),
    totalMm: Number(totalMm.toFixed(2)),
    normalizedString,
    fractionString,
  };
}
