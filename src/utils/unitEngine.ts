import { CustomUnitDefinition, UnitCategoryKey } from '../types/civil';
import {
  BASE_UNITS,
  STANDARD_UNITS,
  UnitInfo,
  normalizeToBase as coreNormalizeToBase,
  denormalizeFromBase as coreDenormalizeFromBase,
  convertDirect as coreConvertDirect,
  parseFeetInchString,
  FeetInchParseResult,
  formatFeetInches,
  formatFeetInchDual,
  formatLengthDual,
  FeetInchDualResult,
  FormatFeetInchesOptions,
  EXACT_CONVERSION,
  RegionalLandBreakdown,
  computeRegionalLandBreakdown,
  FormatNumberOptions,
  formatSmartNumber,
  formatNumberWhileTyping,
  parseNaturalConversionExpression,
  NaturalExpressionParseResult,
} from './unitConverter';

export type UnitDefinition = UnitInfo;

export const CANONICAL_BASE_UNITS = BASE_UNITS;
export const ALL_UNITS = STANDARD_UNITS;

// Re-export metrology types and core utilities
export {
  EXACT_CONVERSION,
  parseFeetInchString,
  formatFeetInches,
  formatFeetInchDual,
  formatLengthDual,
  computeRegionalLandBreakdown,
  formatSmartNumber,
  formatNumberWhileTyping,
  parseNaturalConversionExpression,
};
export type {
  FeetInchParseResult,
  FormatFeetInchesOptions,
  FeetInchDualResult,
  RegionalLandBreakdown,
  FormatNumberOptions,
  NaturalExpressionParseResult,
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
    flow_rate: 'L/s',
    section_properties: 'mm4',
    viscosity: 'Pa.s',
    temperature: 'c',
    energy: 'kJ',
    power: 'kW',
    time_frequency: 's',
    digital_storage: 'MB',
    fuel_economy: 'km_l',
    cad_typography: 'mm',
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
    section_properties: 'in4',
    viscosity: 'cP',
    temperature: 'f',
    energy: 'BTU',
    power: 'hp',
    time_frequency: 's',
    digital_storage: 'MB',
    fuel_economy: 'mpg_us',
    cad_typography: 'in',
  },
  regional: {
    length: 'ft',
    area: 'katha',
    volume: 'cft',
    mass: 'bag50',
    force: 'kN',
    distributed_load: 'kN/m',
    pressure: 'MPa',
    density: 'kN/m3',
    moment: 'kN.m',
    slope: 'percent',
    velocity: 'm/s',
    flow_rate: 'L/s',
    section_properties: 'mm4',
    viscosity: 'cP',
    temperature: 'c',
    energy: 'kcal',
    power: 'hp_metric',
    time_frequency: 's',
    digital_storage: 'MB',
    fuel_economy: 'km_l',
    cad_typography: 'in',
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
  return coreNormalizeToBase(value, unitId, category, customUnits);
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
  return coreDenormalizeFromBase(baseValue, targetUnitId, category, customUnits);
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
  return coreConvertDirect(value, fromUnitId, toUnitId, category, customUnits);
}

/**
 * Get Unit Definition by ID
 */
export function getUnitDefinition(
  unitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[] = []
): UnitDefinition | undefined {
  const allCategoryUnits = [
    ...(STANDARD_UNITS[category] || []),
    ...customUnits.filter((u) => u.category === category).map((u) => ({
      ...u,
      system: 'universal' as const,
    })),
  ];
  return allCategoryUnits.find((u) => u.id === unitId);
}

/**
 * Gets the primary Metric/Imperial counterpart unit ID for rapid 1-click toggling
 */
export function getCounterpartUnitId(unitId: string, category: UnitCategoryKey): string {
  const counterpartMap: Record<string, string> = {
    // Length
    m: 'ft',
    ft: 'm',
    mm: 'suta',
    suta: 'mm',
    soot: 'mm',
    in: 'mm',
    cm: 'in',
    km: 'mile',
    mile: 'km',
    mi: 'km',
    yd: 'm',
    rft: 'rm',
    rm: 'rft',
    'ft-in': 'm',
    chain: 'm',
    link: 'cm',
    fathom: 'm',
    rod: 'm',

    // Area
    m2: 'ft2',
    ft2: 'm2',
    sqm: 'ft2',
    sqft: 'm2',
    sft: 'm2',
    in2: 'cm2',
    cm2: 'in2',
    mm2: 'in2',
    yd2: 'm2',
    sqyd: 'm2',
    acre: 'hectare',
    hectare: 'acre',
    ha: 'acre',
    are: 'acre',
    sqmi: 'km2',
    km2: 'sqmi',
    decimal: 'sft',
    katha: 'decimal',
    bigha: 'acre',
    cent: 'sqft',
    guntha: 'sqft',
    ground: 'sqft',
    kanal: 'marla',
    marla: 'kanal',
    ganda: 'sft',
    chhatak: 'sft',
    kara: 'sft',

    // Volume
    m3: 'cft',
    cft: 'm3',
    cum: 'cft',
    ft3: 'm3',
    bag_cement: 'm3',
    in3: 'cm3',
    yd3: 'm3',
    liter: 'gal_us',
    L: 'gal_us',
    ml: 'fl_oz',
    gal_us: 'liter',
    gal_uk: 'liter',
    bbl: 'm3',
    fl_oz: 'ml',

    // Mass
    kg: 'lb',
    lb: 'kg',
    tonne: 'ton_us',
    MT: 'ton_us',
    ton_us: 'tonne',
    ton_uk: 'tonne',
    bag50: 'kg',
    g: 'oz',
    oz: 'g',
    mg: 'g',
    quintal: 'ton_us',
    maund: 'kg',
    seer: 'kg',
    tola: 'g',

    // Force
    kN: 'kip',
    kip: 'kN',
    N: 'lbf',
    lbf: 'N',
    MN: 'kip',
    kgf: 'lbf',
    tonf: 'kip',
    dyn: 'N',

    // Distributed Load
    'kN/m': 'kip/ft',
    'kip/ft': 'kN/m',
    'N/m': 'lbf/ft',
    'lbf/ft': 'N/m',
    'kgf/m': 'kip/ft',
    plf: 'kN/m',
    klf: 'kN/m',

    // Pressure / Stress
    MPa: 'psi',
    psi: 'MPa',
    kPa: 'psf',
    psf: 'kPa',
    GPa: 'ksi',
    ksi: 'GPa',
    bar: 'psi',
    mbar: 'psi',
    'N/mm2': 'psi',
    'kgf/cm2': 'psi',
    atm: 'kPa',
    tsf: 'kPa',
    mmHg: 'kPa',
    mmH2O: 'kPa',

    // Density
    'kN/m3': 'pcf',
    pcf: 'kN/m3',
    'kg/m3': 'pcf',
    'g/cm3': 'pcf',
    'N/m3': 'pcf',
    'tonne/m3': 'pcf',
    'lb/in3': 'kN/m3',

    // Moment
    'kN.m': 'kip.ft',
    'kip.ft': 'kN.m',
    'N.m': 'lbf.ft',
    'lbf.ft': 'N.m',
    'kip.in': 'kN.m',
    'lbf.in': 'N.m',

    // Slope
    ratio: 'percent',
    percent: 'ratio',
    degree: 'percent',
    permille: 'percent',
    in_per_ft: 'percent',

    // Velocity
    'm/s': 'ft/s',
    'ft/s': 'm/s',
    'km/h': 'mph',
    mph: 'km/h',
    knot: 'm/s',
    'mm/s': 'in/s',
    'in/s': 'mm/s',

    // Flow Rate
    'm3/s': 'cfs',
    cfs: 'm3/s',
    'L/s': 'gpm',
    gpm: 'L/s',
    'L/min': 'gpm',
    'm3/hr': 'cfs',
    gpm_uk: 'L/s',
    mgd: 'm3/s',
    'ML/day': 'm3/s',
  };

  if (counterpartMap[unitId]) {
    return counterpartMap[unitId];
  }

  // Fallback: pick standard unit from imperial or metric preset
  const isMetric = SYSTEM_PRESET_UNITS.metric[category] === unitId;
  return isMetric ? SYSTEM_PRESET_UNITS.imperial[category] : SYSTEM_PRESET_UNITS.metric[category];
}

/**
 * Smart Input Parser
 * Parses plain numbers, comma-formatted strings, simple arithmetic ("15 * 2", "250 / 2"),
 * regional land notations, and architectural expressions like:
 * "12'-6 1/2\"", "12-6 1/2", "250 mm", "14.5 ft", "18 kN/m3", "5.5 decimal", "2 katha"
 */
export function parseSmartUnitInput(
  rawString: string,
  currentUnitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[] = []
): {
  parsedValue: number;
  detectedUnitId: string;
  isValid: boolean;
  architecturalResult?: FeetInchParseResult;
  errorMessage?: string;
} {
  const trimmed = rawString.trim();
  if (!trimmed) {
    return { parsedValue: 0, detectedUnitId: currentUnitId, isValid: false, errorMessage: 'Empty input' };
  }

  // 1. If length and contains architectural symbols ', " or ft/in or architectural hyphen/space format (e.g. 12-6, 12 6, 12-6 1/2) or suta/সুতা
  if (
    category === 'length' &&
    (/['"]/.test(trimmed) ||
      /\b(?:ft|feet|in|inch|inches|suta|soot|sut|সুতা|সূতা)\b/i.test(trimmed) ||
      /^\d+(?:\.\d+)?\s*[-–—]\s*\d+/.test(trimmed) ||
      /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?(?:\s+\d+\/\d+)?$/.test(trimmed) ||
      /^\d+\/\d+$/.test(trimmed))
  ) {
    const feetInchResult = parseFeetInchString(trimmed);
    if (!feetInchResult.isValid) {
      return {
        parsedValue: 0,
        detectedUnitId: currentUnitId,
        isValid: false,
        errorMessage: feetInchResult.errorMessage,
      };
    }
    if (currentUnitId === 'ft-in') {
        return {
          parsedValue: feetInchResult.totalFeet,
          detectedUnitId: 'ft-in',
          isValid: true,
          architecturalResult: feetInchResult,
        };
      }
      if (currentUnitId === 'suta' || currentUnitId === 'soot') {
        return {
          parsedValue: feetInchResult.totalInches * 8,
          detectedUnitId: currentUnitId,
          isValid: true,
          architecturalResult: feetInchResult,
        };
      }
      if (currentUnitId === 'm') {
        return {
          parsedValue: feetInchResult.totalMeters,
          detectedUnitId: 'm',
          isValid: true,
          architecturalResult: feetInchResult,
        };
      }
      if (currentUnitId === 'mm') {
        return {
          parsedValue: feetInchResult.totalMm,
          detectedUnitId: 'mm',
          isValid: true,
          architecturalResult: feetInchResult,
        };
      }
      if (currentUnitId === 'in') {
        return {
          parsedValue: feetInchResult.totalInches,
          detectedUnitId: 'in',
          isValid: true,
          architecturalResult: feetInchResult,
        };
      }
      if (currentUnitId === 'rft') {
        return {
          parsedValue: feetInchResult.totalFeet,
          detectedUnitId: 'rft',
          isValid: true,
          architecturalResult: feetInchResult,
        };
      }
      return {
        parsedValue: feetInchResult.totalFeet,
        detectedUnitId: currentUnitId === 'ft-in' ? 'ft-in' : 'ft',
        isValid: true,
        architecturalResult: feetInchResult,
      };
  }

  // 2. Check for explicit unit suffix in the string: e.g. "250 mm", "15 cft", "500 psi", "18 kN/m3", "5 decimal"
  const allUnitsInCat = [
    ...(STANDARD_UNITS[category] || []),
    ...customUnits.filter((u) => u.category === category),
  ];

  for (const u of allUnitsInCat) {
    const escapedSymbol = u.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedId = u.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^([+-]?[0-9,]+(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)\\s*(?:${escapedSymbol}|${escapedId})$`, 'i');
    const match = trimmed.match(regex);
    if (match) {
      const cleanNumStr = match[1].replace(/,/g, '');
      const num = parseFloat(cleanNumStr);
      if (!isNaN(num)) {
        return { parsedValue: num, detectedUnitId: u.id, isValid: true };
      }
    }
  }

  // 3. Strip out thousands commas for arithmetic or numeric parsing (e.g. "1,250.5" -> "1250.5")
  const sanitized = trimmed.replace(/,/g, '');

  // 4. Safe Arithmetic Evaluation (e.g. "25 / 2", "12.5 * 2.4", "10 + 5.5")
  if (/^[0-9\s.+\-*/()]+$/.test(sanitized) && /[+\-*/]/.test(sanitized)) {
    try {
      // Evaluate only valid mathematical operations without variable access
      const evaluated = Function(`'use strict'; return (${sanitized});`)();
      if (typeof evaluated === 'number' && !isNaN(evaluated) && isFinite(evaluated)) {
        let archResult: FeetInchParseResult | undefined = undefined;
        if (category === 'length') {
          const feet = currentUnitId === 'm' ? evaluated / EXACT_CONVERSION.FT_TO_M : currentUnitId === 'in' ? evaluated / 12 : currentUnitId === 'mm' ? (evaluated / 1000) / EXACT_CONVERSION.FT_TO_M : evaluated;
          archResult = parseFeetInchString(`${feet} ft`);
        }
        return { parsedValue: evaluated, detectedUnitId: currentUnitId, isValid: true, architecturalResult: archResult };
      }
    } catch {
      // Ignore evaluation error and proceed to standard parsing
    }
  }

  // 5. Standard Float Parsing
  const numericVal = parseFloat(sanitized);
  if (!isNaN(numericVal) && isFinite(numericVal)) {
    let archResult: FeetInchParseResult | undefined = undefined;
    if (category === 'length') {
      const feet = currentUnitId === 'm' ? numericVal / EXACT_CONVERSION.FT_TO_M : currentUnitId === 'in' ? numericVal / 12 : currentUnitId === 'mm' ? (numericVal / 1000) / EXACT_CONVERSION.FT_TO_M : numericVal;
      archResult = parseFeetInchString(`${feet} ft`);
    }
    return { parsedValue: numericVal, detectedUnitId: currentUnitId, isValid: true, architecturalResult: archResult };
  }

  return { parsedValue: 0, detectedUnitId: currentUnitId, isValid: false, errorMessage: 'Invalid number format' };
}

/**
 * Metadata definitions for Canonical SI Base Units
 */
export const BASE_UNIT_INFO: Record<UnitCategoryKey, { id: string; name: string; symbol: string }> = {
  length: { id: 'm', name: 'Meter', symbol: 'm' },
  area: { id: 'm2', name: 'Square Meter', symbol: 'm²' },
  volume: { id: 'm3', name: 'Cubic Meter', symbol: 'm³' },
  mass: { id: 'kg', name: 'Kilogram', symbol: 'kg' },
  force: { id: 'N', name: 'Newton', symbol: 'N' },
  distributed_load: { id: 'N/m', name: 'Newton per Meter', symbol: 'N/m' },
  pressure: { id: 'Pa', name: 'Pascal', symbol: 'Pa' },
  density: { id: 'kN/m3', name: 'Kilonewton per Cubic Meter', symbol: 'kN/m³' },
  moment: { id: 'N.m', name: 'Newton Meter', symbol: 'N·m' },
  slope: { id: 'ratio', name: 'Decimal Ratio', symbol: 'm/m' },
  velocity: { id: 'm/s', name: 'Meter per Second', symbol: 'm/s' },
  flow_rate: { id: 'm3/s', name: 'Cubic Meter per Second', symbol: 'm³/s' },
  section_properties: { id: 'mm4', name: 'Millimeter⁴', symbol: 'mm⁴' },
  viscosity: { id: 'Pa.s', name: 'Pascal Second', symbol: 'Pa·s' },
  temperature: { id: 'k', name: 'Kelvin', symbol: 'K' },
  energy: { id: 'J', name: 'Joule', symbol: 'J' },
  power: { id: 'W', name: 'Watt', symbol: 'W' },
  time_frequency: { id: 's', name: 'Second', symbol: 's' },
  digital_storage: { id: 'B', name: 'Byte', symbol: 'B' },
  fuel_economy: { id: 'km_l', name: 'Kilometer per Liter', symbol: 'km/L' },
  cad_typography: { id: 'mm', name: 'Millimeter', symbol: 'mm' },
};

export interface ConversionFactorDetails {
  unitId: string;
  unitName: string;
  unitSymbol: string;
  description: string;
  category: UnitCategoryKey;
  baseUnitId: string;
  baseUnitSymbol: string;
  baseUnitName: string;
  toBaseFactor: number;
  isBaseUnit: boolean;
  factorFormula: string;
  inverseFormula: string;
  scientificExponent?: string;
  tooltip: string;
}

/**
 * Computes high-precision conversion factor details and formatted engineering tooltips
 * for any selected unit relative to its canonical Base SI unit.
 */
export function getConversionFactorDetails(
  unitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[] = []
): ConversionFactorDetails {
  const unit = getUnitDefinition(unitId, category, customUnits);
  const baseInfo = BASE_UNIT_INFO[category] || {
    id: BASE_UNITS[category] || 'm',
    name: 'SI Base Unit',
    symbol: BASE_UNITS[category] || 'm',
  };

  if (!unit) {
    return {
      unitId,
      unitName: unitId,
      unitSymbol: unitId,
      description: `Canonical engineering unit (${unitId})`,
      category,
      baseUnitId: baseInfo.id,
      baseUnitSymbol: baseInfo.symbol,
      baseUnitName: baseInfo.name,
      toBaseFactor: 1,
      isBaseUnit: true,
      factorFormula: `1 ${unitId} = 1 ${baseInfo.symbol}`,
      inverseFormula: `1 ${baseInfo.symbol} = 1 ${unitId}`,
      tooltip: `${unitId} — Canonical Base SI Unit for ${category.replace('_', ' ')} (1 ${unitId} = 1 ${baseInfo.symbol})`,
    };
  }

  const factor = unit.toBaseFactor;
  const isBase = unit.id === baseInfo.id || factor === 1.0;

  // Clean superscripts for powers of 10
  let expStr: string | undefined = undefined;
  if (factor > 0) {
    const log10 = Math.log10(factor);
    const roundLog = Math.round(log10);
    if (Math.abs(log10 - roundLog) < 1e-6 && roundLog !== 0) {
      const superscripts: Record<string, string> = {
        '-': '⁻',
        '0': '⁰',
        '1': '¹',
        '2': '²',
        '3': '³',
        '4': '⁴',
        '5': '⁵',
        '6': '⁶',
        '7': '⁷',
        '8': '⁸',
        '9': '⁹',
      };
      expStr = '10' + String(roundLog).split('').map((c) => superscripts[c] || c).join('');
    }
  }

  const formatNum = (num: number) => {
    return formatSmartNumber(num, { maxDecimals: 6, useGrouping: true });
  };

  const factorStr = formatNum(factor);
  const inverseVal = factor !== 0 ? 1 / factor : 0;
  const inverseStr = formatNum(inverseVal);

  const factorFormula = isBase
    ? `1 ${unit.symbol} = 1 ${baseInfo.symbol} (Base SI Unit)`
    : `1 ${unit.symbol} = ${factorStr} ${baseInfo.symbol}${expStr ? ` (${expStr})` : ''}`;

  const inverseFormula = isBase
    ? `1 ${baseInfo.symbol} = 1 ${unit.symbol}`
    : `1 ${baseInfo.symbol} ≈ ${inverseStr} ${unit.symbol}`;

  const descLine = unit.description ? `${unit.description}\n` : '';
  const tooltip = isBase
    ? `${unit.name} (${unit.symbol}): ${descLine}Canonical Base SI unit for ${category.replace('_', ' ')} (Base factor: 1.0 ${baseInfo.symbol}).`
    : `${unit.name} (${unit.symbol}) — ${unit.description || category.replace('_', ' ')}\n• Base Factor: 1 ${unit.symbol} = ${factorStr} ${baseInfo.symbol}${expStr ? ` (${expStr})` : ''}\n• Inverse: ${inverseFormula}`;

  return {
    unitId: unit.id,
    unitName: unit.name,
    unitSymbol: unit.symbol,
    description: unit.description || `${unit.name} (${unit.symbol})`,
    category,
    baseUnitId: baseInfo.id,
    baseUnitSymbol: baseInfo.symbol,
    baseUnitName: baseInfo.name,
    toBaseFactor: factor,
    isBaseUnit: isBase,
    factorFormula,
    inverseFormula,
    scientificExponent: expStr,
    tooltip,
  };
}

/**
 * Curated priority unit ordering for inline contextual unit selectors across all modules
 */
export const CURATED_CONTEXTUAL_UNITS: Record<UnitCategoryKey, string[]> = {
  length: ['m', 'mm', 'cm', 'ft-in', 'ft', 'in', 'suta', 'yd', 'km'],
  area: ['m2', 'ft2', 'in2', 'cm2', 'mm2', 'decimal', 'katha', 'bigha', 'acre', 'ha'],
  volume: ['m3', 'cft', 'liter', 'gal_us', 'cm3', 'mm3', 'yd3', 'bag_cement'],
  mass: ['kg', 'tonne', 'g', 'lb', 'bag50', 'quintal', 'ton_us'],
  force: ['kN', 'N', 'kgf', 'lbf', 'kip', 'tf', 'MN'],
  pressure: ['MPa', 'kPa', 'psi', 'kgf/cm2', 'psf', 'GPa', 'ksi', 'Pa', 'bar'],
  distributed_load: ['kN/m', 'N/m', 'kgf/m', 'plf', 'klf', 'tf/m'],
  moment: ['kN.m', 'N.m', 'kip.ft', 'lbf.ft', 'kgf.m', 'tf.m'],
  density: ['kN/m3', 'kg/m3', 'pcf', 'g/cm3', 'tonne/m3'],
  section_properties: ['mm4', 'cm4', 'in4', 'm4', 'ft4'],
  flow_rate: ['L/s', 'm3/s', 'cfs', 'gpm', 'L/min', 'm3/hr'],
  velocity: ['m/s', 'ft/s', 'km/h', 'mph', 'cm/s'],
  slope: ['percent', 'ratio', 'degree', 'permille'],
  viscosity: ['Pa.s', 'mPa.s', 'cP', 'cSt'],
  temperature: ['c', 'f', 'k'],
  energy: ['kJ', 'J', 'kWh', 'BTU', 'kcal'],
  power: ['kW', 'W', 'hp', 'TR', 'btu_hr'],
  time_frequency: ['s', 'min', 'hr', 'day', 'Hz'],
  digital_storage: ['MB', 'GB', 'KB', 'B'],
  fuel_economy: ['km_l', 'mpg_us', 'l_100km'],
  cad_typography: ['mm', 'in', 'pt', 'px'],
};

const UNIT_ALIAS_LOOKUP: Record<string, { unitId: string; category: UnitCategoryKey }> = {
  // Length
  m: { unitId: 'm', category: 'length' },
  mm: { unitId: 'mm', category: 'length' },
  cm: { unitId: 'cm', category: 'length' },
  km: { unitId: 'km', category: 'length' },
  ft: { unitId: 'ft', category: 'length' },
  in: { unitId: 'in', category: 'length' },
  'ft-in': { unitId: 'ft-in', category: 'length' },
  "ft'-in\"": { unitId: 'ft-in', category: 'length' },
  suta: { unitId: 'suta', category: 'length' },
  yd: { unitId: 'yd', category: 'length' },
  rft: { unitId: 'rft', category: 'length' },
  rm: { unitId: 'rm', category: 'length' },
  // Area
  m2: { unitId: 'm2', category: 'area' },
  'm²': { unitId: 'm2', category: 'area' },
  sqm: { unitId: 'm2', category: 'area' },
  ft2: { unitId: 'ft2', category: 'area' },
  'ft²': { unitId: 'ft2', category: 'area' },
  'sq ft': { unitId: 'ft2', category: 'area' },
  sqft: { unitId: 'ft2', category: 'area' },
  sft: { unitId: 'ft2', category: 'area' },
  in2: { unitId: 'in2', category: 'area' },
  'in²': { unitId: 'in2', category: 'area' },
  'sq in': { unitId: 'in2', category: 'area' },
  cm2: { unitId: 'cm2', category: 'area' },
  'cm²': { unitId: 'cm2', category: 'area' },
  mm2: { unitId: 'mm2', category: 'area' },
  'mm²': { unitId: 'mm2', category: 'area' },
  decimal: { unitId: 'decimal', category: 'area' },
  dec: { unitId: 'decimal', category: 'area' },
  katha: { unitId: 'katha', category: 'area' },
  bigha: { unitId: 'bigha', category: 'area' },
  acre: { unitId: 'acre', category: 'area' },
  ha: { unitId: 'ha', category: 'area' },
  // Volume
  m3: { unitId: 'm3', category: 'volume' },
  'm³': { unitId: 'm3', category: 'volume' },
  cum: { unitId: 'm3', category: 'volume' },
  cft: { unitId: 'cft', category: 'volume' },
  CFT: { unitId: 'cft', category: 'volume' },
  ft3: { unitId: 'cft', category: 'volume' },
  'ft³': { unitId: 'cft', category: 'volume' },
  liter: { unitId: 'liter', category: 'volume' },
  L: { unitId: 'liter', category: 'volume' },
  l: { unitId: 'liter', category: 'volume' },
  gal: { unitId: 'gal_us', category: 'volume' },
  gal_us: { unitId: 'gal_us', category: 'volume' },
  'US gal': { unitId: 'gal_us', category: 'volume' },
  cm3: { unitId: 'cm3', category: 'volume' },
  'cm³': { unitId: 'cm3', category: 'volume' },
  mm3: { unitId: 'mm3', category: 'volume' },
  'mm³': { unitId: 'mm3', category: 'volume' },
  // Mass
  kg: { unitId: 'kg', category: 'mass' },
  tonne: { unitId: 'tonne', category: 'mass' },
  MT: { unitId: 'tonne', category: 'mass' },
  t: { unitId: 'tonne', category: 'mass' },
  g: { unitId: 'g', category: 'mass' },
  lb: { unitId: 'lb', category: 'mass' },
  lbs: { unitId: 'lb', category: 'mass' },
  bag50: { unitId: 'bag50', category: 'mass' },
  bags: { unitId: 'bag50', category: 'mass' },
  // Force
  kN: { unitId: 'kN', category: 'force' },
  N: { unitId: 'N', category: 'force' },
  kgf: { unitId: 'kgf', category: 'force' },
  lbf: { unitId: 'lbf', category: 'force' },
  kip: { unitId: 'kip', category: 'force' },
  tf: { unitId: 'tf', category: 'force' },
  MN: { unitId: 'MN', category: 'force' },
  // Pressure / Stress
  MPa: { unitId: 'MPa', category: 'pressure' },
  kPa: { unitId: 'kPa', category: 'pressure' },
  GPa: { unitId: 'GPa', category: 'pressure' },
  Pa: { unitId: 'Pa', category: 'pressure' },
  psi: { unitId: 'psi', category: 'pressure' },
  ksi: { unitId: 'ksi', category: 'pressure' },
  psf: { unitId: 'psf', category: 'pressure' },
  'kgf/cm2': { unitId: 'kgf/cm2', category: 'pressure' },
  'kgf/cm²': { unitId: 'kgf/cm2', category: 'pressure' },
  'kg/cm2': { unitId: 'kgf/cm2', category: 'pressure' },
  'kg/cm²': { unitId: 'kgf/cm2', category: 'pressure' },
  'N/mm2': { unitId: 'MPa', category: 'pressure' },
  'N/mm²': { unitId: 'MPa', category: 'pressure' },
  bar: { unitId: 'bar', category: 'pressure' },
  // Distributed load
  'kN/m': { unitId: 'kN/m', category: 'distributed_load' },
  'N/m': { unitId: 'N/m', category: 'distributed_load' },
  'kgf/m': { unitId: 'kgf/m', category: 'distributed_load' },
  plf: { unitId: 'plf', category: 'distributed_load' },
  klf: { unitId: 'klf', category: 'distributed_load' },
  'kip/ft': { unitId: 'klf', category: 'distributed_load' },
  // Moment
  'kN.m': { unitId: 'kN.m', category: 'moment' },
  'kN·m': { unitId: 'kN.m', category: 'moment' },
  'kN-m': { unitId: 'kN.m', category: 'moment' },
  'N.m': { unitId: 'N.m', category: 'moment' },
  'N·m': { unitId: 'N.m', category: 'moment' },
  'kip.ft': { unitId: 'kip.ft', category: 'moment' },
  'kip·ft': { unitId: 'kip.ft', category: 'moment' },
  'lbf.ft': { unitId: 'lbf.ft', category: 'moment' },
  // Density
  'kN/m3': { unitId: 'kN/m3', category: 'density' },
  'kN/m³': { unitId: 'kN/m3', category: 'density' },
  'kg/m3': { unitId: 'kg/m3', category: 'density' },
  'kg/m³': { unitId: 'kg/m3', category: 'density' },
  pcf: { unitId: 'pcf', category: 'density' },
  'g/cm3': { unitId: 'g/cm3', category: 'density' },
  'g/cm³': { unitId: 'g/cm3', category: 'density' },
  // Section properties
  mm4: { unitId: 'mm4', category: 'section_properties' },
  'mm⁴': { unitId: 'mm4', category: 'section_properties' },
  cm4: { unitId: 'cm4', category: 'section_properties' },
  'cm⁴': { unitId: 'cm4', category: 'section_properties' },
  in4: { unitId: 'in4', category: 'section_properties' },
  'in⁴': { unitId: 'in4', category: 'section_properties' },
  m4: { unitId: 'm4', category: 'section_properties' },
  'm⁴': { unitId: 'm4', category: 'section_properties' },
  // Flow rate
  'L/s': { unitId: 'L/s', category: 'flow_rate' },
  'm3/s': { unitId: 'm3/s', category: 'flow_rate' },
  'm³/s': { unitId: 'm3/s', category: 'flow_rate' },
  cfs: { unitId: 'cfs', category: 'flow_rate' },
  gpm: { unitId: 'gpm', category: 'flow_rate' },
  'L/min': { unitId: 'L/min', category: 'flow_rate' },
  'm3/hr': { unitId: 'm3/hr', category: 'flow_rate' },
  // Velocity
  'm/s': { unitId: 'm/s', category: 'velocity' },
  'ft/s': { unitId: 'ft/s', category: 'velocity' },
  'km/h': { unitId: 'km/h', category: 'velocity' },
  mph: { unitId: 'mph', category: 'velocity' },
  // Temperature
  c: { unitId: 'c', category: 'temperature' },
  '°C': { unitId: 'c', category: 'temperature' },
  f: { unitId: 'f', category: 'temperature' },
  '°F': { unitId: 'f', category: 'temperature' },
};

/**
 * Resolves any engineering unit symbol or ID to its canonical unitId, category, and ordered UnitDefinitions
 */
export function resolveUnitAndCategory(
  unitSymbolOrId?: string,
  explicitCategory?: UnitCategoryKey
): {
  unitId: string;
  category: UnitCategoryKey;
  unitDef: UnitDefinition;
  contextualUnits: UnitDefinition[];
} | null {
  if (!unitSymbolOrId) return null;
  const trimmed = unitSymbolOrId.trim();
  if (!trimmed) return null;

  let resolvedUnitId: string | undefined;
  let resolvedCategory: UnitCategoryKey | undefined = explicitCategory;

  if (explicitCategory) {
    const catUnits = STANDARD_UNITS[explicitCategory] || [];
    const match = catUnits.find(
      (u) => u.id === trimmed || u.symbol === trimmed || u.id.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      resolvedUnitId = match.id;
    }
  }

  if (!resolvedUnitId && UNIT_ALIAS_LOOKUP[trimmed]) {
    resolvedUnitId = UNIT_ALIAS_LOOKUP[trimmed].unitId;
    resolvedCategory = explicitCategory || UNIT_ALIAS_LOOKUP[trimmed].category;
  }

  if (!resolvedUnitId || !resolvedCategory) {
    // Search all categories
    for (const [catKey, units] of Object.entries(STANDARD_UNITS) as [UnitCategoryKey, UnitInfo[]][]) {
      const match = units.find((u) => u.id === trimmed || u.symbol === trimmed);
      if (match) {
        resolvedUnitId = match.id;
        resolvedCategory = catKey;
        break;
      }
    }
  }

  if (!resolvedUnitId || !resolvedCategory) return null;
  const unitDef = getUnitDefinition(resolvedUnitId, resolvedCategory);
  if (!unitDef) return null;

  const allInCat = STANDARD_UNITS[resolvedCategory] || [];
  const priorityIds = CURATED_CONTEXTUAL_UNITS[resolvedCategory] || [];
  const prioritized: UnitDefinition[] = [];
  for (const pid of priorityIds) {
    const found = allInCat.find((u) => u.id === pid);
    if (found && !prioritized.some((p) => p.id === found.id)) {
      prioritized.push(found);
    }
  }
  // Ensure resolvedUnitId itself is included
  if (!prioritized.some((p) => p.id === unitDef.id)) {
    prioritized.unshift(unitDef);
  }
  return {
    unitId: unitDef.id,
    category: resolvedCategory,
    unitDef,
    contextualUnits: prioritized,
  };
}

