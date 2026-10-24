import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  UnitDefinition,
} from '../utils/unitEngine';
import { ChevronDown, Check, ArrowRightLeft, HelpCircle, AlertCircle, X } from 'lucide-react';

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

function formatNumberWithSeparators(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '';
  if (Number.isInteger(val)) {
    return val.toLocaleString('en-US');
  }
  // Decimal: limit precision up to 4 decimals without noisy trailing zeros
  const rounded = parseFloat(val.toFixed(4));
  const parts = rounded.toString().split('.');
  const intPart = parseInt(parts[0], 10).toLocaleString('en-US');
  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
}

export const UnitInput: React.FC<UnitInputProps> = ({
  label,
  category,
  siValue,
  onChangeSI,
  currentUnitId,
  onUnitChange,
  step = 'any',
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

  // Formatted display representation (with thousand commas on idle)
  const formattedDisplayValue = useMemo(() => {
    if (isNaN(siValue) || !isFinite(siValue)) return '';
    return formatNumberWithSeparators(convertedNumericValue);
  }, [siValue, convertedNumericValue]);

  const [rawText, setRawText] = useState<string>(formattedDisplayValue);
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

  // Keep rawText synced when siValue or activeUnit changes outside of manual editing
  useEffect(() => {
    if (!isFocusedRef.current) {
      setRawText(formattedDisplayValue);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setRawText(valStr);

    const parsed = parseSmartUnitInput(valStr, activeUnitInfo.id, category);
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
    setRawText(formattedDisplayValue);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    // On focus, switch to clean editable numeric value without thousand commas
    if (Number.isInteger(convertedNumericValue)) {
      setRawText(convertedNumericValue.toString());
    } else {
      setRawText(parseFloat(convertedNumericValue.toPrecision(8)).toString());
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

  // Real-Time Validation Assessment
  const validationResult = useMemo(() => {
    if (customValidation) {
      const customRes = customValidation(siValue);
      if (customRes) return customRes;
    }

    if (validationRule) {
      if (validationRule.minSI !== undefined && siValue < validationRule.minSI) {
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
      if (validationRule.warningBelowSI !== undefined && siValue < validationRule.warningBelowSI) {
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
          <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
            {label}
          </label>

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

        {/* 1-Click Real-time Metric <-> Imperial Counterpart Toggle */}
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

      {/* Input Field with Unit Selector Dropdown Trigger */}
      <div
        className={`relative flex items-center rounded-lg border bg-[var(--md-sys-color-surface)] shadow-xs transition-all duration-300 focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-1 focus-within:ring-[var(--md-sys-color-primary)] ${
          validationResult?.status === 'error'
            ? 'border-[var(--md-sys-color-error)] ring-1 ring-[var(--md-sys-color-error)]/40'
            : validationResult?.status === 'warning'
            ? 'border-amber-500 ring-1 ring-amber-500/40'
            : isUnitFading
            ? 'border-[var(--md-sys-color-primary)] ring-1 ring-[var(--md-sys-color-primary)]/40 shadow-xs'
            : 'border-[var(--md-sys-color-outline)]'
        }`}
      >
        <input
          type={category === 'length' ? 'text' : 'number'}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          value={rawText}
          placeholder={placeholder || (category === 'length' ? `e.g. 12'-6" or 3.8` : '0')}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`w-full min-w-0 min-h-[48px] touch-target-48 bg-transparent px-3 py-2 text-sm font-mono text-[var(--md-sys-color-on-surface)] focus:outline-hidden disabled:opacity-50 transition-all duration-300 ease-out ${
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
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 min-h-[48px] touch-target-48 px-3 border-l border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-mono font-bold rounded-r-lg transition-colors cursor-pointer"
            title={`Active Unit: ${activeUnitInfo.name} (${activeUnitInfo.symbol}). Click to pick other units.`}
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

          {/* Unit Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-56 max-h-72 overflow-y-auto rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] p-1.5 shadow-xl backdrop-blur-md">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)] mb-1">
                Select {category.toUpperCase().replace('_', ' ')} Unit
              </div>

              {availableUnits.map((u) => {
                const isSelected = u.id === activeUnitInfo.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUnit(u)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                        : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold mr-1.5">{u.symbol}</span>
                      <span className="opacity-75 text-[11px] truncate">({u.name})</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-primary)]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
              onClick={() => onChangeSI(p.valueSI)}
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
