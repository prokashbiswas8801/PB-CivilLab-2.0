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
  EXACT_CONVERSION,
  RegionalLandBreakdown,
  computeRegionalLandBreakdown,
  FormatNumberOptions,
  formatSmartNumber,
  formatNumberWhileTyping,
} from './unitConverter';

export type UnitDefinition = UnitInfo;

export const CANONICAL_BASE_UNITS = BASE_UNITS;
export const ALL_UNITS = STANDARD_UNITS;

// Re-export metrology types and core utilities
export {
  EXACT_CONVERSION,
  parseFeetInchString,
  computeRegionalLandBreakdown,
  formatSmartNumber,
  formatNumberWhileTyping,
};
export type { FeetInchParseResult, RegionalLandBreakdown, FormatNumberOptions };

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
    density: 'kN/m3',
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
    mm: 'in',
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

  // 1. If length and contains architectural symbols ', " or ft/in or architectural hyphen/space format (e.g. 12-6 1/2)
  if (
    category === 'length' &&
    (/['"]/.test(trimmed) ||
      /\b(?:ft|feet|in|inch|inches)\b/i.test(trimmed) ||
      /^\d+\s*[-–—]\s*\d+/.test(trimmed) ||
      /^\d+\s+\d+\s+\d+\/\d+/.test(trimmed) ||
      /^\d+\/\d+/.test(trimmed))
  ) {
    const feetInchResult = parseFeetInchString(trimmed);
    if (feetInchResult.isValid) {
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
      return {
        parsedValue: feetInchResult.totalFeet,
        detectedUnitId: 'ft',
        isValid: true,
        architecturalResult: feetInchResult,
      };
    }
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
        return { parsedValue: evaluated, detectedUnitId: currentUnitId, isValid: true };
      }
    } catch {
      // Ignore evaluation error and proceed to standard parsing
    }
  }

  // 5. Standard Float Parsing
  const numericVal = parseFloat(sanitized);
  if (!isNaN(numericVal) && isFinite(numericVal)) {
    return { parsedValue: numericVal, detectedUnitId: currentUnitId, isValid: true };
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
};

export interface ConversionFactorDetails {
  unitId: string;
  unitName: string;
  unitSymbol: string;
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
      category,
      baseUnitId: baseInfo.id,
      baseUnitSymbol: baseInfo.symbol,
      baseUnitName: baseInfo.name,
      toBaseFactor: 1,
      isBaseUnit: true,
      factorFormula: `1 ${unitId} = 1 ${baseInfo.symbol}`,
      inverseFormula: `1 ${baseInfo.symbol} = 1 ${unitId}`,
      tooltip: `${unitId} (Canonical Base SI Unit for ${category})`,
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

  const tooltip = isBase
    ? `${unit.name} (${unit.symbol}) is the canonical Base SI unit for ${category.replace('_', ' ')} (Conversion factor: 1.0).`
    : `Conversion factor relative to Base SI (${baseInfo.name} [${baseInfo.symbol}]):\n• 1 ${unit.symbol} = ${factorStr} ${baseInfo.symbol}${expStr ? ` (${expStr})` : ''}\n• ${inverseFormula}\n• Multiplier: ×${factorStr}`;

  return {
    unitId: unit.id,
    unitName: unit.name,
    unitSymbol: unit.symbol,
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
