import React, { useState, useEffect, useMemo, useRef, useId, useCallback } from 'react';
import {
  UnitCategoryKey,
  CustomUnitDefinition,
} from '../types/civil';
import {
  ALL_UNITS,
  normalizeToBase,
  denormalizeFromBase,
  parseSmartUnitInput,
  getUnitDefinition,
  getCounterpartUnitId,
  getConversionFactorDetails,
  UnitDefinition,
  formatSmartNumber,
  formatFeetInches,
  computeRegionalLandBreakdown,
  EXACT_CONVERSION,
} from '../utils/unitEngine';
import { ChevronDown, Check, ArrowRightLeft, HelpCircle, AlertCircle, X, AlertTriangle, MapPin } from 'lucide-react';
import { evaluateMathExpression } from './ui/TechnicalInput';

export interface UnitInputPreset {
  label: string;
  valueSI: number;
  title?: string;
}

export interface UnitInputTooltip {
  explanation: string;
  standardRef?: string;
  recommendedRange?: string;
  designTip?: string;
}

export interface UnitInputValidationRule {
  minSI?: number;
  maxSI?: number;
  warningBelowSI?: number;
  warningAboveSI?: number;
  warningHint?: string;
  errorHint?: string;
}

export interface UnitInputProps {
  label: string;
  category: UnitCategoryKey;
  siValue: number;
  onChangeSI: (newSiValue: number) => void;
  currentUnitId: string;
  onUnitChange: (newUnitId: string) => void;
  fieldKey?: string;
  step?: number | string;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  helperText?: string;
  customUnits?: CustomUnitDefinition[];
  placeholder?: string;
  // Usability & Error Prevention Additions
  presets?: UnitInputPreset[];
  tooltip?: UnitInputTooltip | string;
  standardRef?: string;
  recommendedRange?: string;
  designTip?: string;
  validationRule?: UnitInputValidationRule;
  customValidation?: (siVal: number) => { status: 'valid' | 'warning' | 'error'; hint: string } | null;
  showCounterpartToggle?: boolean;
}

function clampSIValue(val: number, min?: number, max?: number): number {
  let out = isNaN(val) || !isFinite(val) ? 0 : val;
  if (min === undefined || min >= 0) {
    const floor = min !== undefined ? Math.max(0, min) : 0;
    if (out < floor) out = floor;
  } else if (out < min) {
    out = min;
  }
  if (max !== undefined && out > max) {
    out = max;
  }
  return out;
}

function isArchitecturalLengthDraft(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return (
    /['"]/.test(trimmed) ||
    /\b(?:ft|feet|in|inch|inches|suta|soot|sut|সুতা|সূতা)\b/i.test(trimmed) ||
    /^\d+(?:\.\d+)?\s*[-–—]\s*\d+/.test(trimmed) ||
    /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?(?:\s+\d+\/\d+)?$/.test(trimmed) ||
    /^\d+\/\d+$/.test(trimmed)
  );
}

function formatCanonicalUnitDisplay(
  siVal: number,
  unitId: string,
  category: UnitCategoryKey,
  customUnits: CustomUnitDefinition[]
): string {
  if (isNaN(siVal) || !isFinite(siVal)) return '';
  const denormVal = denormalizeFromBase(siVal, unitId, category, customUnits);

  if (category === 'length') {
    if (unitId === 'ft-in') {
      return formatFeetInches(denormVal);
    }
    if (unitId === 'ft') {
      const decFt = formatSmartNumber(denormVal, {
        maxDecimals: 2,
        minDecimals: 2,
        useGrouping: true,
        trimTrailingZeros: false,
      });
      return `${decFt}'`;
    }
  }

  return formatSmartNumber(denormVal, { maxDecimals: 4, useGrouping: true });
}

export const UnitInput: React.FC<UnitInputProps> = ({
  label,
  category,
  siValue,
  onChangeSI,
  currentUnitId,
  onUnitChange,
  fieldKey,
  min,
  max,
  disabled = false,
  className = '',
  helperText,
  customUnits = [],
  placeholder,
  presets,
  tooltip,
  standardRef,
  recommendedRange,
  designTip,
  validationRule,
  customValidation,
  showCounterpartToggle = true,
}) => {
  const reactId = useId();
  const inputId = fieldKey ? `unit-input-${fieldKey}` : `unit-input-${reactId}`;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Synthesize top-level guidance with tooltip object or string
  const resolvedTooltip: UnitInputTooltip | null = useMemo(() => {
    if (!tooltip && !standardRef && !recommendedRange && !designTip) {
      return null;
    }
    if (typeof tooltip === 'string') {
      return {
        explanation: tooltip,
        standardRef,
        recommendedRange,
        designTip,
      };
    }
    return {
      explanation: tooltip?.explanation || `Engineering parameter for ${label}.`,
      standardRef: standardRef || tooltip?.standardRef,
      recommendedRange: recommendedRange || tooltip?.recommendedRange,
      designTip: designTip || tooltip?.designTip,
    };
  }, [tooltip, standardRef, recommendedRange, designTip, label]);

  // Available units for this physical category
  const availableUnits: UnitDefinition[] = useMemo(() => {
    const standard = ALL_UNITS[category] || [];
    const customs = customUnits
      .filter((u) => u.category === category)
      .map((u) => ({
        ...u,
        system: 'universal' as const,
      }));
    return [...standard, ...customs];
  }, [category, customUnits]);

  const activeUnitInfo = useMemo(() => {
    return getUnitDefinition(currentUnitId, category, customUnits) || availableUnits[0];
  }, [currentUnitId, category, customUnits, availableUnits]);

  // High-precision conversion factor relative to base SI unit for tooltips
  const [isUnitHovered, setIsUnitHovered] = useState(false);
  const conversionFactorDetails = useMemo(() => {
    return getConversionFactorDetails(activeUnitInfo.id, category, customUnits);
  }, [activeUnitInfo.id, category, customUnits]);

  // Compute counterpart unit for rapid 1-click toggle
  const counterpartUnitId = useMemo(() => {
    return getCounterpartUnitId(activeUnitInfo.id, category);
  }, [activeUnitInfo.id, category]);

  const counterpartUnit = useMemo(() => {
    return availableUnits.find((u) => u.id === counterpartUnitId);
  }, [availableUnits, counterpartUnitId]);

  // Compute the raw numerical converted value based on active unit
  const convertedNumericValue = useMemo(() => {
    if (isNaN(siValue) || !isFinite(siValue)) return 0;
    return denormalizeFromBase(siValue, activeUnitInfo.id, category, customUnits);
  }, [siValue, activeUnitInfo.id, category, customUnits]);

  // Canonical display representation when blurred / idle
  const formattedDisplayValue = useMemo(() => {
    return formatCanonicalUnitDisplay(siValue, activeUnitInfo.id, category, customUnits);
  }, [siValue, activeUnitInfo.id, category, customUnits]);

  // Controlled local draft state so typing never causes cursor jumping or mid-typing reformatting
  const [draftText, setDraftText] = useState<string>(formattedDisplayValue);
  const isFocusedRef = useRef(false);

  // Smooth fade transition tracking when unit changes
  const [isUnitFading, setIsUnitFading] = useState(false);
  const prevUnitIdRef = useRef(activeUnitInfo.id);

  useEffect(() => {
    if (prevUnitIdRef.current !== activeUnitInfo.id) {
      prevUnitIdRef.current = activeUnitInfo.id;
      setIsUnitFading(true);
      const timer = setTimeout(() => setIsUnitFading(false), 280);
      return () => clearTimeout(timer);
    }
  }, [activeUnitInfo.id]);

  // Sync draftText when siValue or activeUnit changes outside of active typing
  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraftText(formattedDisplayValue);
    }
  }, [formattedDisplayValue]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    if (dropdownOpen || showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, showTooltip]);

  // Real-time live SI computation derived synchronously from draftText on every keystroke
  const liveSI = useMemo(() => {
    const trimmed = draftText.trim();
    if (trimmed === '') return 0;

    const isArch = category === 'length' && isArchitecturalLengthDraft(trimmed);
    if (!isArch && /[+\-*/^]/.test(trimmed)) {
      const mathVal = evaluateMathExpression(trimmed);
      if (mathVal !== null && isFinite(mathVal)) {
        return normalizeToBase(mathVal, activeUnitInfo.id, category, customUnits);
      }
    }

    const parsed = parseSmartUnitInput(trimmed, activeUnitInfo.id, category, customUnits);
    if (parsed.isValid) {
      return normalizeToBase(parsed.parsedValue, parsed.detectedUnitId, category, customUnits);
    }

    return isNaN(siValue) || !isFinite(siValue) ? 0 : siValue;
  }, [draftText, category, activeUnitInfo.id, customUnits, siValue]);

  // Determine whether inline Feet/Inches steppers should render
  const showDualLengthSteppers = useMemo(() => {
    return (
      category === 'length' &&
      (activeUnitInfo.system === 'imperial' ||
        activeUnitInfo.system === 'regional' ||
        activeUnitInfo.id === 'ft-in')
    );
  }, [category, activeUnitInfo.system, activeUnitInfo.id]);

  // Breakdown of liveSI into exact feet & inches with strict 12-inch rollover
  const stepperBreakdown = useMemo(() => {
    const safeSI = isNaN(liveSI) || !isFinite(liveSI) ? 0 : Math.max(0, liveSI);
    const totalInches = Math.round(((safeSI / EXACT_CONVERSION.IN_TO_M) + Number.EPSILON) * 1000) / 1000;
    let feet = Math.floor(totalInches / 12);
    let inches = Math.round((totalInches - feet * 12) * 100) / 100;
    if (inches >= 12) {
      feet += Math.floor(inches / 12);
      inches = Math.round((inches % 12) * 100) / 100;
    }
    const inchesLabel = Number.isInteger(inches) ? String(inches) : Number(inches.toFixed(2)).toString();
    return { feet, inches, inchesLabel };
  }, [liveSI]);

  const applySteppedInchesDelta = useCallback(
    (deltaInches: number) => {
      if (disabled) return;
      const baseSI = isNaN(liveSI) || !isFinite(liveSI) ? 0 : liveSI;
      const currentTotalInches = Math.round(((baseSI / EXACT_CONVERSION.IN_TO_M) + Number.EPSILON) * 10000) / 10000;
      const nextTotalInches = Math.round((currentTotalInches + deltaInches) * 10000) / 10000;
      const rawNewSI = nextTotalInches * EXACT_CONVERSION.IN_TO_M;
      const clampedSI = clampSIValue(rawNewSI, min, max);
      onChangeSI(clampedSI);
      setDraftText(formatCanonicalUnitDisplay(clampedSI, activeUnitInfo.id, category, customUnits));
    },
    [disabled, liveSI, min, max, onChangeSI, activeUnitInfo.id, category, customUnits]
  );

  const commitAndNormalizeDraft = useCallback(
    (textToCommit: string) => {
      const trimmed = textToCommit.trim();
      if (trimmed === '') {
        const clampedZero = clampSIValue(0, min, max);
        onChangeSI(clampedZero);
        setDraftText(formatCanonicalUnitDisplay(clampedZero, activeUnitInfo.id, category, customUnits));
        return;
      }

      const isArch = category === 'length' && isArchitecturalLengthDraft(trimmed);
      if (!isArch && /[+\-*/^]/.test(trimmed)) {
        const mathVal = evaluateMathExpression(trimmed);
        if (mathVal !== null && isFinite(mathVal)) {
          const rawSI = normalizeToBase(mathVal, activeUnitInfo.id, category, customUnits);
          const newSI = clampSIValue(rawSI, min, max);
          onChangeSI(newSI);
          setDraftText(formatCanonicalUnitDisplay(newSI, activeUnitInfo.id, category, customUnits));
          return;
        }
      }

      const parsed = parseSmartUnitInput(trimmed, activeUnitInfo.id, category, customUnits);
      if (parsed.isValid) {
        if (parsed.detectedUnitId !== activeUnitInfo.id) {
          onUnitChange(parsed.detectedUnitId);
        }
        const rawSI = normalizeToBase(parsed.parsedValue, parsed.detectedUnitId, category, customUnits);
        const newSI = clampSIValue(rawSI, min, max);
        onChangeSI(newSI);
        setDraftText(formatCanonicalUnitDisplay(newSI, parsed.detectedUnitId, category, customUnits));
      } else {
        setDraftText(formattedDisplayValue);
      }
    },
    [min, max, onChangeSI, activeUnitInfo.id, category, customUnits, onUnitChange, formattedDisplayValue]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setDraftText(valStr);

    const trimmed = valStr.trim();
    if (trimmed === '') {
      return;
    }

    const isArch = category === 'length' && isArchitecturalLengthDraft(trimmed);
    if (!isArch && /[+\-*/^]/.test(trimmed)) {
      const mathVal = evaluateMathExpression(trimmed);
      if (mathVal !== null && isFinite(mathVal)) {
        const newSI = normalizeToBase(mathVal, activeUnitInfo.id, category, customUnits);
        onChangeSI(newSI);
      }
      return;
    }

    const parsed = parseSmartUnitInput(valStr, activeUnitInfo.id, category, customUnits);
    if (parsed.isValid) {
      if (parsed.detectedUnitId !== activeUnitInfo.id) {
        onUnitChange(parsed.detectedUnitId);
      }
      const newSI = normalizeToBase(parsed.parsedValue, parsed.detectedUnitId, category, customUnits);
      onChangeSI(newSI);
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    commitAndNormalizeDraft(draftText);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitAndNormalizeDraft(draftText);
      return;
    }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && showDualLengthSteppers) {
      e.preventDefault();
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      const stepInches = e.shiftKey ? 12 : e.ctrlKey || e.metaKey ? 6 : 1;
      applySteppedInchesDelta(dir * stepInches);
    }
  };

  const handleSelectUnit = (unit: UnitDefinition) => {
    setDropdownOpen(false);
    if (unit.id === activeUnitInfo.id) return;
    onUnitChange(unit.id);
  };

  const handleToggleCounterpart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (counterpartUnit && counterpartUnit.id !== activeUnitInfo.id) {
      onUnitChange(counterpartUnit.id);
    }
  };

  // BD Site Error Guard (10.6' vs 10'-6"): detects .1 through .11 entered in feet
  const bdSiteErrorGuard = useMemo(() => {
    if (category !== 'length') return null;
    const trimmed = draftText.trim();
    const inFeetContext =
      activeUnitInfo.id === 'ft' ||
      activeUnitInfo.id === 'rft' ||
      /^\d+\.(?:1[01]|[1-9])\s*(?:'|ft|feet)$/i.test(trimmed);
    if (!inFeetContext) return null;

    const match = trimmed.match(/^(\d+)\.(1[01]|[1-9])(?:\s*(?:'|ft|feet))?$/i);
    if (!match) return null;

    const feet = parseInt(match[1], 10);
    const intendedInches = parseInt(match[2], 10);
    const fixedDecimalFeet = feet + intendedInches / 12;
    const fixedSI = clampSIValue(fixedDecimalFeet * EXACT_CONVERSION.FT_TO_M, min, max);

    const literalDecimalFeet = parseFloat(`${match[1]}.${match[2]}`);
    const literalSI = literalDecimalFeet * EXACT_CONVERSION.FT_TO_M;
    const amberFtIn = formatFeetInches(literalSI, {
      isMeters: true,
      decimalInches: true,
      precision: 1,
    }).replace(/\.0"$/, '"');

    return {
      feet,
      intendedInches,
      fixedDecimalFeet,
      fixedSI,
      amberFtIn,
      amberMetric: `${literalSI.toFixed(3)} m`,
      chipLabel: `Apply ${feet}'-${intendedInches}" (${fixedDecimalFeet.toFixed(2)}')?`,
    };
  }, [category, draftText, activeUnitInfo.id, min, max]);

  // Dynamic Real-Time Equivalence Readout (Length & Non-Length Categories)
  const liveEquivalenceLabel = useMemo(() => {
    const safeSI = isNaN(liveSI) || !isFinite(liveSI) ? 0 : liveSI;

    if (category === 'length') {
      const decFt = safeSI / EXACT_CONVERSION.FT_TO_M;
      const ftInStr = formatFeetInches(safeSI, { isMeters: true });
      const decFtStr = `${decFt.toFixed(2)}'`;
      const mmRounded = Math.round(safeSI * 1000).toLocaleString('en-US');
      const mStr = `${safeSI.toFixed(3)} m`;

      if (Math.abs(safeSI) < 1e-9) {
        return `= 0'-0" • 0.00' • 0.000 m`;
      }
      if (activeUnitInfo.id === 'ft-in') {
        return `= ${decFtStr} • ${mStr} (${mmRounded} mm)`;
      }
      return `= ${ftInStr} • ${decFtStr} • ${mStr}`;
    }

    // Non-length physical categories: SI <-> Regional / Imperial equivalents
    const fmt = (val: number, maxDec = 2) =>
      formatSmartNumber(val, { maxDecimals: maxDec, useGrouping: true });

    switch (category) {
      case 'area': {
        if (activeUnitInfo.id === 'mm2' || activeUnitInfo.id === 'cm2' || activeUnitInfo.id === 'in2') {
          const sqIn = denormalizeFromBase(safeSI, 'in2', 'area', customUnits);
          const cm2 = denormalizeFromBase(safeSI, 'cm2', 'area', customUnits);
          const mm2 = denormalizeFromBase(safeSI, 'mm2', 'area', customUnits);
          return `= ${fmt(sqIn, 3)} sq.in • ${fmt(cm2, 2)} cm² • ${fmt(mm2, 1)} mm²`;
        }
        const sft = denormalizeFromBase(safeSI, 'ft2', 'area', customUnits);
        const katha = denormalizeFromBase(safeSI, 'katha', 'area', customUnits);
        return `= ${sft.toFixed(2)} sq.ft • ${safeSI.toFixed(3)} m² • ${katha.toFixed(2)} কাঠা`;
      }
      case 'volume': {
        if (
          activeUnitInfo.id === 'liter' ||
          activeUnitInfo.id === 'ml' ||
          activeUnitInfo.id === 'gal_us' ||
          activeUnitInfo.id === 'gal_uk'
        ) {
          const liters = denormalizeFromBase(safeSI, 'liter', 'volume', customUnits);
          const galUs = denormalizeFromBase(safeSI, 'gal_us', 'volume', customUnits);
          return `= ${fmt(liters, 2)} L • ${fmt(galUs, 2)} US gal • ${safeSI.toFixed(4)} m³`;
        }
        const cft = denormalizeFromBase(safeSI, 'cft', 'volume', customUnits);
        return `= ${cft.toFixed(2)} CFT • ${safeSI.toFixed(3)} m³`;
      }
      case 'pressure': {
        const psi = denormalizeFromBase(safeSI, 'psi', 'pressure', customUnits);
        const mpa = denormalizeFromBase(safeSI, 'MPa', 'pressure', customUnits);
        const kpa = denormalizeFromBase(safeSI, 'kPa', 'pressure', customUnits);
        const psf = denormalizeFromBase(safeSI, 'psf', 'pressure', customUnits);
        if (activeUnitInfo.id === 'kPa' || activeUnitInfo.id === 'psf' || activeUnitInfo.id === 'tsf' || activeUnitInfo.id === 'Pa') {
          return `= ${fmt(psf, 1)} psf • ${fmt(kpa, 2)} kPa (${fmt(psi, 2)} psi)`;
        }
        return `= ${fmt(psi, 1)} psi • ${mpa.toFixed(2)} MPa`;
      }
      case 'force': {
        if (activeUnitInfo.id === 'N' || activeUnitInfo.id === 'lbf') {
          const lbf = denormalizeFromBase(safeSI, 'lbf', 'force', customUnits);
          return `= ${fmt(lbf, 2)} lbf • ${fmt(safeSI, 2)} N`;
        }
        const kn = denormalizeFromBase(safeSI, 'kN', 'force', customUnits);
        const kip = denormalizeFromBase(safeSI, 'kip', 'force', customUnits);
        return `= ${fmt(kip, 2)} kip • ${fmt(kn, 2)} kN`;
      }
      case 'mass': {
        const lb = denormalizeFromBase(safeSI, 'lb', 'mass', customUnits);
        const bags = denormalizeFromBase(safeSI, 'bag50', 'mass', customUnits);
        if (activeUnitInfo.id === 'tonne' || activeUnitInfo.id === 'ton_us' || activeUnitInfo.id === 'ton_uk') {
          const mt = denormalizeFromBase(safeSI, 'tonne', 'mass', customUnits);
          return `= ${fmt(mt, 3)} MT • ${fmt(safeSI, 1)} kg • ${fmt(lb, 1)} lb`;
        }
        return `= ${fmt(safeSI, 2)} kg • ${fmt(bags, 2)} bag (50kg) • ${fmt(lb, 1)} lb`;
      }
      case 'moment': {
        const knm = denormalizeFromBase(safeSI, 'kN.m', 'moment', customUnits);
        const kipFt = denormalizeFromBase(safeSI, 'kip.ft', 'moment', customUnits);
        return `= ${fmt(kipFt, 2)} kip·ft • ${fmt(knm, 2)} kN·m`;
      }
      case 'distributed_load': {
        const knm = denormalizeFromBase(safeSI, 'kN/m', 'distributed_load', customUnits);
        const kipFt = denormalizeFromBase(safeSI, 'kip/ft', 'distributed_load', customUnits);
        return `= ${fmt(kipFt, 3)} kip/ft • ${fmt(knm, 2)} kN/m`;
      }
      case 'density': {
        const pcf = denormalizeFromBase(safeSI, 'pcf', 'density', customUnits);
        const kgm3 = denormalizeFromBase(safeSI, 'kg/m3', 'density', customUnits);
        return `= ${fmt(pcf, 2)} pcf • ${fmt(safeSI, 2)} kN/m³ (${fmt(kgm3, 0)} kg/m³)`;
      }
      case 'velocity': {
        const fts = denormalizeFromBase(safeSI, 'ft/s', 'velocity', customUnits);
        if (activeUnitInfo.id === 'km/h' || activeUnitInfo.id === 'mph') {
          const kmh = denormalizeFromBase(safeSI, 'km/h', 'velocity', customUnits);
          const mph = denormalizeFromBase(safeSI, 'mph', 'velocity', customUnits);
          return `= ${fmt(mph, 2)} mph • ${fmt(kmh, 2)} km/h • ${fmt(safeSI, 2)} m/s`;
        }
        return `= ${fmt(fts, 2)} ft/s • ${fmt(safeSI, 3)} m/s`;
      }
      case 'flow_rate': {
        const cfs = denormalizeFromBase(safeSI, 'cfs', 'flow_rate', customUnits);
        const ls = denormalizeFromBase(safeSI, 'L/s', 'flow_rate', customUnits);
        return `= ${fmt(cfs, 3)} cfs • ${fmt(ls, 2)} L/s • ${fmt(safeSI, 4)} m³/s`;
      }
      case 'section_properties': {
        const in4 = denormalizeFromBase(safeSI, 'in4', 'section_properties', customUnits);
        const cm4 = denormalizeFromBase(safeSI, 'cm4', 'section_properties', customUnits);
        return `= ${fmt(in4, 2)} in⁴ • ${fmt(cm4, 1)} cm⁴`;
      }
      case 'slope': {
        const pct = denormalizeFromBase(safeSI, 'percent', 'slope', customUnits);
        const deg = denormalizeFromBase(safeSI, 'degree', 'slope', customUnits);
        return `= ${fmt(pct, 2)}% • ${fmt(safeSI, 4)} m/m • ${fmt(deg, 2)}°`;
      }
      case 'temperature': {
        const c = denormalizeFromBase(safeSI, 'c', 'temperature', customUnits);
        const f = denormalizeFromBase(safeSI, 'f', 'temperature', customUnits);
        return `= ${fmt(f, 1)} °F • ${fmt(c, 1)} °C • ${fmt(safeSI, 2)} K`;
      }
      default: {
        if (counterpartUnit && counterpartUnit.id !== activeUnitInfo.id) {
          const cVal = denormalizeFromBase(safeSI, counterpartUnit.id, category, customUnits);
          const baseUnit = availableUnits.find((u) => u.toBaseFactor === 1.0) || availableUnits[0];
          const baseStr =
            baseUnit && baseUnit.id !== activeUnitInfo.id && baseUnit.id !== counterpartUnit.id
              ? ` • ${fmt(safeSI, 3)} ${baseUnit.symbol}`
              : '';
          return `= ${fmt(cVal, 3)} ${counterpartUnit.symbol}${baseStr}`;
        }
        return `= ${fmt(safeSI, 4)}`;
      }
    }
  }, [liveSI, category, activeUnitInfo.id, customUnits, counterpartUnit, availableUnits]);

  // Explicit Zero (0) detection
  const isZeroActive =
    !disabled &&
    (siValue === 0 ||
      convertedNumericValue === 0 ||
      draftText.trim() === '0' ||
      draftText.trim() === '0.0' ||
      draftText.trim() === '0.00' ||
      draftText.trim() === "0.00'" ||
      draftText.trim() === `0'-0"` ||
      draftText.trim() === '');

  // Real-Time Validation Assessment
  const validationResult = useMemo(() => {
    if (customValidation) {
      const customRes = customValidation(siValue);
      if (customRes) return customRes;
    }

    if (validationRule) {
      if (siValue > 0 && validationRule.minSI !== undefined && siValue < validationRule.minSI) {
        return {
          status: 'error' as const,
          hint: validationRule.errorHint || `Value below physical minimum (${validationRule.minSI}).`,
        };
      }
      if (validationRule.maxSI !== undefined && siValue > validationRule.maxSI) {
        return {
          status: 'error' as const,
          hint: validationRule.errorHint || `Value exceeds physical maximum (${validationRule.maxSI}).`,
        };
      }
      if (siValue > 0 && validationRule.warningBelowSI !== undefined && siValue < validationRule.warningBelowSI) {
        return {
          status: 'warning' as const,
          hint: validationRule.warningHint || `Value below recommended standard (${validationRule.warningBelowSI}).`,
        };
      }
      if (validationRule.warningAboveSI !== undefined && siValue > validationRule.warningAboveSI) {
        return {
          status: 'warning' as const,
          hint: validationRule.warningHint || `Value exceeds recommended design threshold (${validationRule.warningAboveSI}).`,
        };
      }
    }

    return null;
  }, [siValue, validationRule, customValidation]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Header: Label, Guidance Tooltip Button & Rapid Counterpart Unit Toggle */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <label htmlFor={inputId} className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate cursor-pointer">
            {label}
          </label>

          {/* Explicit 0 Value Active Badge */}
          {isZeroActive && (
            <span
              className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 shrink-0 select-none animate-fadeIn"
              title="Parameter is currently set to zero (clean baseline or zeroed value)"
            >
              0 VALUE ACTIVE
            </span>
          )}

          {/* Interactive Engineering Guidance Tooltip Button */}
          {resolvedTooltip && (
            <div ref={tooltipRef} className="relative inline-flex items-center">
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="w-4 h-4 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-center transition-colors cursor-pointer"
                title="Click for engineering guidance, standard references & recommended ranges"
                aria-label="Field engineering guidance"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              {/* Guidance Popover Card */}
              {showTooltip && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-72 p-3 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl backdrop-blur-md text-xs font-sans space-y-2">
                  <div className="flex items-start justify-between gap-2 border-b border-[var(--md-sys-color-outline-variant)] pb-1.5">
                    <span className="font-bold text-[var(--md-sys-color-on-surface)] text-xs">
                      {label} Guidance
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTooltip(false)}
                      className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] leading-relaxed text-[var(--md-sys-color-on-surface)]">
                    {resolvedTooltip.explanation}
                  </p>

                  {(resolvedTooltip.standardRef || resolvedTooltip.recommendedRange || resolvedTooltip.designTip) && (
                    <div className="space-y-1 pt-1 border-t border-[var(--md-sys-color-outline-variant)] text-[10px] font-mono">
                      {resolvedTooltip.standardRef && (
                        <div className="flex items-baseline gap-1 text-[var(--md-sys-color-primary)] font-semibold">
                          <span className="opacity-75 font-normal">Standard:</span>
                          <span>{resolvedTooltip.standardRef}</span>
                        </div>
                      )}
                      {resolvedTooltip.recommendedRange && (
                        <div className="flex items-baseline gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <span className="opacity-75 font-normal">Typical:</span>
                          <span>{resolvedTooltip.recommendedRange}</span>
                        </div>
                      )}
                      {resolvedTooltip.designTip && (
                        <div className="text-[var(--md-sys-color-on-surface-variant)] italic pt-0.5">
                          💡 {resolvedTooltip.designTip}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 1-Click Real-time Metric <-> Imperial Counterpart Toggle & Quick ft'-in" Option */}
        <div className="flex items-center gap-1 shrink-0">
          {category === 'length' && activeUnitInfo.id !== 'ft-in' && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onUnitChange('ft-in')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] text-[var(--md-sys-color-on-surface-variant)] transition-all cursor-pointer inline-flex items-center gap-0.5 shrink-0 btn-tactile"
              title="Switch to Architectural Feet-Inch notation (ft'-in&quot;)"
            >
              <span>ft&apos;-in&quot;</span>
            </button>
          )}
          {showCounterpartToggle && counterpartUnit && counterpartUnit.id !== activeUnitInfo.id && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleToggleCounterpart}
              className="px-2 py-0.5 text-[10px] font-mono font-bold rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] text-[var(--md-sys-color-on-surface-variant)] transition-all cursor-pointer inline-flex items-center gap-1 shrink-0 btn-tactile"
              title={`Real-Time Conversion: Switch to ${counterpartUnit.name} (${counterpartUnit.symbol})`}
            >
              <ArrowRightLeft className="w-2.5 h-2.5 text-[var(--md-sys-color-primary)] shrink-0" />
              <span>⇄ {counterpartUnit.symbol}</span>
            </button>
          )}
        </div>
      </div>

      {/* Input Field with Unit Selector Dropdown Trigger */}
      <div
        className={`relative flex items-center rounded-full overflow-hidden border bg-[var(--md-sys-color-surface)] shadow-xs transition-all duration-300 focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary)] ${
          validationResult?.status === 'error'
            ? 'border-[var(--md-sys-color-error)] ring-2 ring-[var(--md-sys-color-error)]/40'
            : bdSiteErrorGuard
            ? 'border-amber-500 ring-1 ring-amber-500/40'
            : isZeroActive
            ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
            : validationResult?.status === 'warning'
            ? 'border-amber-500 ring-2 ring-amber-500/40'
            : isUnitFading
            ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 shadow-xs'
            : 'border-[var(--md-sys-color-outline)]'
        }`}
      >
        <input
          id={inputId}
          type="text"
          inputMode={category === 'length' ? 'text' : 'decimal'}
          disabled={disabled}
          value={draftText}
          placeholder={
            placeholder ||
            (activeUnitInfo.id === 'ft-in'
              ? `e.g. 12'-3" or 12'-3 1/2"`
              : category === 'length'
              ? `e.g. 12'-3", 12.25' or 3.734 m`
              : category === 'area'
              ? 'e.g. 5 katha or 2.5 dec'
              : '0')
          }
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full min-w-0 min-h-[48px] touch-target-48 bg-transparent pl-5 pr-3 py-2 text-base md:text-sm font-mono tabular-nums text-[var(--md-sys-color-on-surface)] focus:outline-hidden disabled:opacity-50 transition-all duration-300 ease-out ${
            isUnitFading
              ? 'opacity-25 scale-[0.985] text-[var(--md-sys-color-primary)]'
              : 'opacity-100 scale-100'
          }`}
        />

        {/* Unit Selector Dropdown Trigger Button */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setIsUnitHovered(false);
            }}
            onMouseEnter={() => setIsUnitHovered(true)}
            onMouseLeave={() => setIsUnitHovered(false)}
            onFocus={() => setIsUnitHovered(true)}
            onBlur={() => setIsUnitHovered(false)}
            className="flex items-center gap-1.5 min-h-[48px] touch-target-48 pl-3 pr-4 border-l border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-mono font-bold rounded-r-full transition-colors cursor-pointer"
            title={conversionFactorDetails.tooltip}
            aria-label={`Unit: ${activeUnitInfo.name}. ${conversionFactorDetails.factorFormula}. Click to change unit.`}
          >
            <span
              className={`transition-all duration-300 ease-out inline-block ${
                isUnitFading ? 'opacity-25 scale-90 text-[var(--md-sys-color-primary)]' : 'opacity-100 scale-100'
              }`}
            >
              {activeUnitInfo.symbol}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Interactive Floating Hover Card: Conversion Factor to Canonical Base SI */}
          {isUnitHovered && !dropdownOpen && (
            <div
              className="absolute right-0 bottom-full mb-2 z-50 w-64 p-3 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl backdrop-blur-md text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-150"
              role="tooltip"
            >
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--md-sys-color-outline-variant)]">
                <span className="font-bold text-[var(--md-sys-color-on-surface)] text-xs truncate">
                  {conversionFactorDetails.unitName} ({conversionFactorDetails.unitSymbol})
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    conversionFactorDetails.isBaseUnit
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                  }`}
                >
                  {conversionFactorDetails.isBaseUnit ? 'Base SI Unit' : 'SI Conversion Factor'}
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-[var(--md-sys-color-primary)] font-bold flex items-center justify-between">
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">Factor:</span>
                  <span className="text-right">{conversionFactorDetails.factorFormula}</span>
                </div>
                {!conversionFactorDetails.isBaseUnit && (
                  <div className="text-[var(--md-sys-color-on-surface-variant)] text-[10px] flex items-center justify-between">
                    <span className="uppercase tracking-wider">Inverse:</span>
                    <span className="text-right">{conversionFactorDetails.inverseFormula}</span>
                  </div>
                )}
                <div className="text-[10px] pt-1.5 border-t border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
                  <span className="uppercase tracking-wider">Base SI:</span>
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                    {conversionFactorDetails.baseUnitName} ({conversionFactorDetails.baseUnitSymbol})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Unit Dropdown Menu with Detailed Conversion Formula for Each Unit */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-64 max-h-72 overflow-y-auto rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] p-1.5 shadow-xl backdrop-blur-md">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)] mb-1 flex items-center justify-between">
                <span>Select {category.toUpperCase().replace('_', ' ')} Unit</span>
                <span className="text-[9px] font-mono opacity-70">Base: {conversionFactorDetails.baseUnitSymbol}</span>
              </div>

              {availableUnits.map((u) => {
                const isSelected = u.id === activeUnitInfo.id;
                const uDetails = getConversionFactorDetails(u.id, category, customUnits);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUnit(u)}
                    title={uDetails.tooltip}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                        : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{u.symbol}</span>
                        <span className="opacity-75 text-[11px] truncate">({u.name})</span>
                        {uDetails.isBaseUnit && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                            SI Base
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] opacity-90 mt-0.5 truncate">
                        {uDetails.factorFormula}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-primary)] ml-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Inline Dual Feet (') & Inches (") Stepper Bar (Length in Imperial/Regional/ft-in Mode) */}
      {showDualLengthSteppers && (
        <div
          className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5"
          role="group"
          aria-label={`Feet and inches precision steppers for ${label}`}
        >
          {/* Feet Stepper Group (-1' / +1') */}
          <div className="inline-flex items-center rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] overflow-hidden">
            <button
              type="button"
              disabled={disabled}
              onClick={() => applySteppedInchesDelta(-12)}
              title="Decrement by 1 foot (-1')"
              aria-label={`Decrease ${label} by 1 foot`}
              className="min-h-[34px] min-w-[36px] px-2 text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] active:scale-95 transition-colors cursor-pointer disabled:opacity-40"
            >
              -1&apos;
            </button>
            <span className="px-2 text-[11px] font-mono font-bold tabular-nums text-[var(--md-sys-color-on-surface)] border-x border-[var(--md-sys-color-outline-variant)] select-none min-w-[34px] text-center">
              {stepperBreakdown.feet}&apos;
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => applySteppedInchesDelta(12)}
              title="Increment by 1 foot (+1')"
              aria-label={`Increase ${label} by 1 foot`}
              className="min-h-[34px] min-w-[36px] px-2 text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] active:scale-95 transition-colors cursor-pointer disabled:opacity-40"
            >
              +1&apos;
            </button>
          </div>

          {/* Inches Stepper Group (-1" / +1" with Shift: ±1/2", Ctrl/Cmd: ±6") */}
          <div className="inline-flex items-center rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] overflow-hidden">
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                const stepIn = e.ctrlKey || e.metaKey ? 6 : e.shiftKey ? 0.5 : 1;
                applySteppedInchesDelta(-stepIn);
              }}
              title={'Decrement inches (-1" · Shift: -½" · Ctrl/Cmd: -6")'}
              aria-label={`Decrease ${label} by 1 inch (Shift for half inch, Ctrl or Cmd for 6 inches)`}
              className="min-h-[34px] min-w-[36px] px-2 text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] active:scale-95 transition-colors cursor-pointer disabled:opacity-40"
            >
              -1&quot;
            </button>
            <span className="px-2 text-[11px] font-mono font-bold tabular-nums text-[var(--md-sys-color-on-surface)] border-x border-[var(--md-sys-color-outline-variant)] select-none min-w-[34px] text-center">
              {stepperBreakdown.inchesLabel}&quot;
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                const stepIn = e.ctrlKey || e.metaKey ? 6 : e.shiftKey ? 0.5 : 1;
                applySteppedInchesDelta(stepIn);
              }}
              title={'Increment inches (+1" · Shift: +½" · Ctrl/Cmd: +6")'}
              aria-label={`Increase ${label} by 1 inch (Shift for half inch, Ctrl or Cmd for 6 inches)`}
              className="min-h-[34px] min-w-[36px] px-2 text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] active:scale-95 transition-colors cursor-pointer disabled:opacity-40"
            >
              +1&quot;
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Real-Time Monospace Equivalence Readout (Updates on Every Keystroke) */}
      <div
        aria-live="polite"
        className={`flex flex-wrap items-center justify-between gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-mono tabular-nums transition-colors ${
          bdSiteErrorGuard
            ? 'bg-amber-500/12 border-amber-500/45 text-amber-800 dark:text-amber-300'
            : 'bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
        }`}
      >
        {bdSiteErrorGuard ? (
          <>
            <span className="inline-flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                = {bdSiteErrorGuard.amberFtIn} • {bdSiteErrorGuard.amberMetric}
              </span>
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onChangeSI(bdSiteErrorGuard.fixedSI);
                setDraftText(
                  formatCanonicalUnitDisplay(bdSiteErrorGuard.fixedSI, activeUnitInfo.id, category, customUnits)
                );
              }}
              title={`Convert decimal entry to ${bdSiteErrorGuard.feet}'-${bdSiteErrorGuard.intendedInches}" (${bdSiteErrorGuard.fixedDecimalFeet.toFixed(2)}')`}
              className="px-2 py-0.5 text-[10px] font-mono font-bold rounded border border-amber-600/50 bg-amber-500/20 hover:bg-amber-500/35 text-amber-900 dark:text-amber-200 transition-colors cursor-pointer shrink-0"
            >
              {bdSiteErrorGuard.chipLabel}
            </button>
          </>
        ) : (
          <span className="truncate">{liveEquivalenceLabel}</span>
        )}
      </div>

      {/* Real-time Regional Land Equivalence Breakdown (BD Katha/Decimal/Bigha/Kani) */}
      {category === 'area' && activeUnitInfo.isRegional && liveSI > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono border border-emerald-500/30 animate-fadeIn">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">
            {computeRegionalLandBreakdown(
              denormalizeFromBase(liveSI, activeUnitInfo.id, category, customUnits),
              activeUnitInfo.id,
              customUnits
            ).formattedSummary}
          </span>
        </div>
      )}

      {/* Quick Engineering Preset Chips */}
      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[9.5px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] shrink-0">
            Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => {
                const clamped = clampSIValue(p.valueSI, min, max);
                onChangeSI(clamped);
                setDraftText(formatCanonicalUnitDisplay(clamped, activeUnitInfo.id, category, customUnits));
              }}
              title={p.title || `Set to ${p.label}`}
              className="px-2 py-0.5 text-[10.5px] font-mono rounded bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer btn-tactile shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Proactive Real-Time Validation Alert / Solution Hint */}
      {validationResult && (
        <div
          className={`flex items-start gap-1.5 p-2 rounded-lg text-[11px] font-mono transition-all animate-fadeIn ${
            validationResult.status === 'error'
              ? 'bg-[var(--md-sys-color-error-container)]/30 text-[var(--md-sys-color-error)] border border-[var(--md-sys-color-error)]/40'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="leading-tight">{validationResult.hint}</span>
        </div>
      )}

      {/* Optional Static Helper Text */}
      {helperText && !validationResult && (
        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
          {helperText}
        </p>
      )}
    </div>
  );
};
