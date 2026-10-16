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
    const regex = new RegExp(`^([+-]?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\s*(?:${escapedSymbol}|${escapedId})$`, 'i');
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
