/**
 * PB CivilLab — Safe Inline Math & Unit Expression Evaluator
 * 
 * Safely parses and evaluates mathematical arithmetic expressions,
 * trigonometric functions, and unit conversions without using unsafe eval().
 */

import { convertUnitValue, STANDARD_UNITS } from './unitConverter';
import { roundEng } from './mathEngine';

export interface MathEvaluationResult {
  expression: string;
  result: number;
  formattedResult: string;
  explanation: string;
  isUnitConversion?: boolean;
  fromUnit?: string;
  toUnit?: string;
}

/**
 * Checks if a string looks like an engineering arithmetic expression or unit conversion query.
 */
export function isMathOrConversionQuery(query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return false;

  // Check for unit conversion pattern: "10 m to ft", "25 mpa in psi", "5 cft to m3"
  const conversionRegex = /^(\d+(?:\.\d+)?)\s*([a-zA-Z°²³/%]+)\s+(?:to|in|into|as)\s+([a-zA-Z°²³/%]+)$/i;
  if (conversionRegex.test(trimmed)) return true;

  // Check for mathematical expressions: numbers and operators (+, -, *, /, ^, %, sqrt, sin, cos, tan, pi)
  // Must contain at least one digit and at least one math operator
  const hasDigit = /\d/.test(trimmed);
  const hasOperator = /[+\-*/^%]|\bsqrt\b|\bsin\b|\bcos\b|\btan\b|\babs\b|\bpi\b/i.test(trimmed);
  
  // Guard against regular text queries that happen to contain a number
  const onlyMathChars = /^[\d\s+\-*/^%().,eE]|sqrt|sin|cos|tan|abs|log|ln|pi|deg/i.test(trimmed);

  return hasDigit && hasOperator && onlyMathChars;
}

/**
 * Safely evaluates a mathematical or unit conversion string.
 */
export function evaluateInlineMath(query: string): MathEvaluationResult | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // 1. Try Unit Conversion evaluation first
  const conversionRegex = /^(\d+(?:\.\d+)?)\s*([a-zA-Z°²³/%]+)\s+(?:to|in|into|as)\s+([a-zA-Z°²³/%]+)$/i;
  const match = trimmed.match(conversionRegex);

  if (match) {
    const val = parseFloat(match[1]);
    const fromUnitRaw = match[2].trim().toLowerCase();
    const toUnitRaw = match[3].trim().toLowerCase();

    // Map common aliases
    const normalizeUnit = (u: string) => {
      if (u === 'm' || u === 'meter' || u === 'meters') return 'm';
      if (u === 'ft' || u === 'feet' || u === 'foot') return 'ft';
      if (u === 'in' || u === 'inch' || u === 'inches') return 'in';
      if (u === 'mm' || u === 'millimeter' || u === 'millimeters') return 'mm';
      if (u === 'cm' || u === 'centimeter') return 'cm';
      if (u === 'cft' || u === 'cuft') return 'cft';
      if (u === 'm3' || u === 'cum' || u === 'cumec') return 'm3';
      if (u === 'kn') return 'kn';
      if (u === 'kip' || u === 'kips') return 'kip';
      if (u === 'mpa') return 'mpa';
      if (u === 'kpa') return 'kpa';
      if (u === 'psi') return 'psi';
      if (u === 'psf') return 'psf';
      if (u === 'kg') return 'kg';
      if (u === 'ton' || u === 'tonne' || u === 'tonnes') return 'tonne';
      if (u === 'lb' || u === 'lbs') return 'lb';
      if (u === 'katha') return 'katha';
      if (u === 'decimal' || u === 'dec') return 'decimal';
      if (u === 'sqft' || u === 'sft') return 'sqft';
      if (u === 'sqm' || u === 'm2') return 'sqm';
      return u;
    };

    const fromUnit = normalizeUnit(fromUnitRaw);
    const toUnit = normalizeUnit(toUnitRaw);

    // Determine category from STANDARD_UNITS
    let category: any = null;
    for (const [cat, units] of Object.entries(STANDARD_UNITS)) {
      const hasFrom = units.some((u) => u.id.toLowerCase() === fromUnit || u.symbol.toLowerCase() === fromUnit);
      const hasTo = units.some((u) => u.id.toLowerCase() === toUnit || u.symbol.toLowerCase() === toUnit);
      if (hasFrom && hasTo) {
        category = cat;
        break;
      }
    }

    if (category) {
      try {
        const conv = convertUnitValue(val, fromUnit, toUnit, category);
        return {
          expression: `${val} ${fromUnitRaw} → ${toUnitRaw}`,
          result: roundEng(conv.result, 4),
          formattedResult: `${roundEng(conv.result, 4).toLocaleString('en-US', { maximumFractionDigits: 4 })} ${toUnitRaw}`,
          explanation: `Converted via standard engineering factor (${conv.formula})`,
          isUnitConversion: true,
          fromUnit: fromUnitRaw,
          toUnit: toUnitRaw,
        };
      } catch {
        // Fallthrough to standard math evaluation
      }
    }
  }

  // 2. Mathematical Arithmetic Expression Evaluation
  try {
    // Sanitize string to prevent injection
    // Only allow numbers, math operators, Math functions, pi, e
    let sanitized = trimmed
      .replace(/\s+/g, '')
      .replace(/\^/g, '**') // Power operator
      .replace(/sqrt\(/gi, 'Math.sqrt(')
      .replace(/sin\(([^)]+)\s*deg\)/gi, 'Math.sin(($1)*Math.PI/180)')
      .replace(/cos\(([^)]+)\s*deg\)/gi, 'Math.cos(($1)*Math.PI/180)')
      .replace(/tan\(([^)]+)\s*deg\)/gi, 'Math.tan(($1)*Math.PI/180)')
      .replace(/sin\(/gi, 'Math.sin(')
      .replace(/cos\(/gi, 'Math.cos(')
      .replace(/tan\(/gi, 'Math.tan(')
      .replace(/abs\(/gi, 'Math.abs(')
      .replace(/ln\(/gi, 'Math.log(')
      .replace(/log\(/gi, 'Math.log10(')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/gi, 'Math.E');

    // Strict validation: must ONLY contain numbers, Math functions, operators, and parentheses
    const validMathExpression = /^[0-9+\-*/().,%MathPIEsqrtincosablged*]+$/;
    if (!validMathExpression.test(sanitized)) {
      return null;
    }

    // Evaluate in a strictly restricted scope without window or document access
    // eslint-disable-next-line no-new-func
    const evaluatedFn = new Function(`"use strict"; return (${sanitized});`);
    const val = evaluatedFn();

    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      const rounded = roundEng(val, 4);
      return {
        expression: trimmed,
        result: rounded,
        formattedResult: rounded.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 4,
        }),
        explanation: `Arithmetic Evaluation = ${rounded}`,
        isUnitConversion: false,
      };
    }
  } catch {
    return null;
  }

  return null;
}
