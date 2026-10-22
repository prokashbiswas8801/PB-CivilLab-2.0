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
} from './unitConverter';

export type UnitDefinition = UnitInfo;

export const CANONICAL_BASE_UNITS = BASE_UNITS;
export const ALL_UNITS = STANDARD_UNITS;

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
 * Smart Input Parser
 * Parses both plain numbers and expressions like "12'-6 1/2\"", "250 mm", "14.5 ft", "18 kN/m3"
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
    yard: 'm',
    // Area
    m2: 'ft2',
    ft2: 'm2',
    sqm: 'ft2',
    sqft: 'm2',
    sft: 'm2',
    acre: 'hectare',
    hectare: 'acre',
    // Volume
    m3: 'cft',
    cft: 'm3',
    cum: 'cft',
    ft3: 'm3',
    liter: 'gal',
    gal: 'liter',
    // Mass
    kg: 'lb',
    lb: 'kg',
    tonne: 'ton_us',
    ton_us: 'tonne',
    ton_uk: 'tonne',
    // Force
    kN: 'kip',
    kip: 'kN',
    N: 'lbf',
    lbf: 'N',
    kgf: 'lbf',
    tonf: 'kip',
    // Distributed Load
    'kN/m': 'kip/ft',
    'kip/ft': 'kN/m',
    'N/m': 'lbf/ft',
    'lbf/ft': 'N/m',
    'kgf/m': 'kip/ft',
    // Pressure / Stress
    MPa: 'psi',
    psi: 'MPa',
    kPa: 'psf',
    psf: 'kPa',
    GPa: 'ksi',
    ksi: 'GPa',
    bar: 'psi',
    'N/mm2': 'psi',
    'kgf/cm2': 'psi',
    // Density
    'kg/m3': 'pcf',
    pcf: 'kg/m3',
    'kN/m3': 'pcf',
    'g/cm3': 'pcf',
    // Moment
    'kN.m': 'kip.ft',
    'kip.ft': 'kN.m',
    'N.m': 'lbf.ft',
    'lbf.ft': 'N.m',
    // Velocity
    'm/s': 'ft/s',
    'ft/s': 'm/s',
    'km/h': 'mph',
    mph: 'km/h',
    // Flow Rate
    'm3/s': 'cfs',
    cfs: 'm3/s',
    'L/s': 'gpm',
    gpm: 'L/s',
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
 * and architectural expressions like "12'-6 1/2\"", "250 mm", "14.5 ft", "18 kN/m3"
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
  let trimmed = rawString.trim();
  if (!trimmed) {
    return { parsedValue: 0, detectedUnitId: currentUnitId, isValid: false, errorMessage: 'Empty input' };
  }

  // 1. If length and contains architectural symbols ' or " or ft/in
  if (category === 'length' && (/['"]/.test(trimmed) || /\b(?:ft|feet|in|inch|inches)\b/i.test(trimmed))) {
    const feetInchResult = parseFeetInchString(trimmed);
    if (feetInchResult.isValid) {
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
  const unitsInCat = STANDARD_UNITS[category] || [];
  for (const u of unitsInCat) {
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
