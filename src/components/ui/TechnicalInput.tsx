import React, { useState, useEffect, useRef, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Info, AlertCircle, Calculator, ChevronDown, Check } from 'lucide-react';
import { UnitCategoryKey } from '../../types/civil';
import { cleanPrecision } from '../../utils/unitConverter';
import {
  resolveUnitAndCategory,
  convertDirect,
  parseSmartUnitInput,
  formatFeetInches,
  getConversionFactorDetails,
  UnitDefinition,
} from '../../utils/unitEngine';

/**
 * High-precision, zero-eval recursive-descent math parser
 * Safely evaluates algebraic expressions like `12*2.5`, `150/3`, `(2+4)*5`, `10^2`, `sqrt(144)`, `pi*4`
 */
export function evaluateMathExpression(input: string): number | null {
  const sanitized = input.trim().replace(/\s+/g, '').replace(/,/g, '');
  if (!sanitized) return null;

  // Direct number check (fast path)
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(sanitized)) {
    const num = Number(sanitized);
    return isFinite(num) ? num : null;
  }

  try {
    let index = 0;

    function parseExpression(): number {
      let result = parseTerm();
      while (index < sanitized.length) {
        const op = sanitized[index];
        if (op === '+' || op === '-') {
          index++;
          const nextTerm = parseTerm();
          result = op === '+' ? result + nextTerm : result - nextTerm;
        } else {
          break;
        }
      }
      return result;
    }

    function parseTerm(): number {
      let result = parseFactor();
      while (index < sanitized.length) {
        const op = sanitized[index];
        if (op === '*' || op === '×') {
          index++;
          result *= parseFactor();
        } else if (op === '/' || op === '÷') {
          index++;
          const denom = parseFactor();
          if (denom === 0) return NaN;
          result /= denom;
        } else {
          break;
        }
      }
      return result;
    }

    function parseFactor(): number {
      const base = parseUnary();
      if (index < sanitized.length && sanitized[index] === '^') {
        index++;
        const exponent = parseFactor();
        return Math.pow(base, exponent);
      }
      return base;
    }

    function parseUnary(): number {
      if (sanitized[index] === '-') {
        index++;
        return -parseUnary();
      }
      if (sanitized[index] === '+') {
        index++;
        return parseUnary();
      }
      return parsePrimary();
    }

    function parsePrimary(): number {
      if (sanitized.startsWith('sqrt(', index)) {
        index += 5;
        const arg = parseExpression();
        if (sanitized[index] === ')') index++;
        return Math.sqrt(arg);
      }

      if (sanitized[index] === '(') {
        index++;
        const sub = parseExpression();
        if (sanitized[index] === ')') index++;
        return sub;
      }

      const match = sanitized.slice(index).match(/^(\d+(\.\d+)?([eE][+-]?\d+)?)/);
      if (match) {
        index += match[0].length;
        return parseFloat(match[0]);
      }

      if (sanitized.slice(index).toLowerCase().startsWith('pi')) {
        index += 2;
        return Math.PI;
      }

      throw new Error('Unexpected token');
    }

    const value = parseExpression();
    if (index === sanitized.length && !isNaN(value) && isFinite(value)) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export interface TechnicalInputProps {
  id?: string;
  symbol?: React.ReactNode | string;
  unit?: string;
  unitCategory?: UnitCategoryKey;
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  precision?: number;
  className?: string;
  error?: string;
  ariaLabel?: string;
}

export const TechnicalInput: React.FC<TechnicalInputProps> = ({
  id,
  symbol,
  unit,
  unitCategory,
  value,
  onChange,
  min,
  max,
  placeholder,
  disabled = false,
  readOnly = false,
  precision,
  className = '',
  error,
  ariaLabel,
}) => {
  const autoId = useId();
  const inputId = id || autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);

  const resolvedUnit = useMemo(() => {
    if (!unit) return null;
    return resolveUnitAndCategory(unit, unitCategory);
  }, [unit, unitCategory]);

  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => resolvedUnit?.unitId || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    openUpward: false,
  });

  useEffect(() => {
    if (resolvedUnit && (!selectedUnitId || !resolvedUnit.contextualUnits.some((u) => u.id === selectedUnitId))) {
      setSelectedUnitId(resolvedUnit.unitId);
    }
  }, [resolvedUnit, selectedUnitId]);

  const activeUnitDef: UnitDefinition | null = useMemo(() => {
    if (!resolvedUnit) return null;
    return resolvedUnit.contextualUnits.find((u) => u.id === selectedUnitId) || resolvedUnit.unitDef;
  }, [resolvedUnit, selectedUnitId]);

  const activeFactorDetails = useMemo(() => {
    if (!resolvedUnit || !activeUnitDef) return null;
    return getConversionFactorDetails(activeUnitDef.id, resolvedUnit.category);
  }, [resolvedUnit, activeUnitDef]);

  const formatVal = (v: number | string, targetUnitId?: string): string => {
    if (v === '' || v === undefined || v === null || isNaN(Number(v))) return '';
    const num = Number(v);
    if (!Number.isFinite(num) || num === 0) return '0';

    const effUnitId = targetUnitId || selectedUnitId || resolvedUnit?.unitId;
    if (resolvedUnit && effUnitId && effUnitId !== resolvedUnit.unitId) {
      if (resolvedUnit.category === 'length' && effUnitId === 'ft-in') {
        const feetVal = convertDirect(num, resolvedUnit.unitId, 'ft', 'length');
        return formatFeetInches(feetVal, { isMeters: false });
      }
      const conv = convertDirect(num, resolvedUnit.unitId, effUnitId, resolvedUnit.category);
      if (!Number.isFinite(conv) || conv === 0) return '0';
      return precision !== undefined ? conv.toFixed(precision) : String(cleanPrecision(conv, 6));
    }

    if (precision !== undefined) {
      return num.toFixed(precision);
    }
    return String(v);
  };

  const [textVal, setTextVal] = useState<string>(() => formatVal(value));
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalSuccess, setEvalSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setTextVal(formatVal(value));
    }
  }, [value, precision, selectedUnitId, resolvedUnit?.unitId]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerBtnRef.current &&
        !triggerBtnRef.current.contains(target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(target)
      ) {
        setDropdownOpen(false);
      }
    };
    const handleWindowChange = () => {
      if (!triggerBtnRef.current) return;
      const rect = triggerBtnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 240 && rect.top > 240;
      setDropdownCoords({
        top: openUpward ? rect.top - 6 : rect.bottom + 6,
        left: Math.max(8, Math.min(window.innerWidth - 232, rect.right - 224)),
        openUpward,
      });
    };
    handleWindowChange();
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleWindowChange, true);
    window.addEventListener('resize', handleWindowChange);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleWindowChange, true);
      window.removeEventListener('resize', handleWindowChange);
    };
  }, [dropdownOpen]);

  const toBaseNumber = (rawVal: number, unitIdToUse: string): number => {
    if (rawVal === 0 || !resolvedUnit || !unitIdToUse || unitIdToUse === resolvedUnit.unitId) {
      return rawVal;
    }
    const effectiveFrom = unitIdToUse === 'ft-in' ? 'ft' : unitIdToUse;
    return convertDirect(rawVal, effectiveFrom, resolvedUnit.unitId, resolvedUnit.category);
  };

  const commitEvaluation = () => {
    isFocusedRef.current = false;
    const raw = textVal.trim();
    if (!raw) {
      onChange(0);
      setTextVal('0');
      return;
    }

    const activeId = activeUnitDef?.id || resolvedUnit?.unitId || '';
    if (resolvedUnit && activeId) {
      const smart = parseSmartUnitInput(raw, activeId, resolvedUnit.category);
      if (smart.isValid && Number.isFinite(smart.parsedValue)) {
        let baseVal = toBaseNumber(smart.parsedValue, smart.detectedUnitId);
        if (min !== undefined && baseVal < min) baseVal = min;
        if (max !== undefined && baseVal > max) baseVal = max;
        onChange(cleanPrecision(baseVal, 8));
        setTextVal(formatVal(baseVal, activeId));
        setIsEvaluating(false);
        return;
      }
    }

    const calculated = evaluateMathExpression(raw);
    if (calculated !== null) {
      let finalVal = toBaseNumber(calculated, activeId);
      if (min !== undefined && finalVal < min) finalVal = min;
      if (max !== undefined && finalVal > max) finalVal = max;

      onChange(cleanPrecision(finalVal, 8));
      setTextVal(formatVal(finalVal, activeId));

      if (raw.includes('+') || raw.includes('-') || raw.includes('*') || raw.includes('/') || raw.includes('^')) {
        setEvalSuccess(true);
        setTimeout(() => setEvalSuccess(false), 1200);
      }
    } else {
      setTextVal(formatVal(value));
    }
    setIsEvaluating(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTextVal(v);
    const hasMathOp = /[+\-*/^()]/.test(v);
    setIsEvaluating(hasMathOp);

    const activeId = activeUnitDef?.id || resolvedUnit?.unitId || '';
    if (!hasMathOp && v.trim() !== '' && !isNaN(Number(v))) {
      const baseVal = toBaseNumber(Number(v), activeId);
      onChange(cleanPrecision(baseVal, 8));
    }
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEvaluation();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setTextVal(formatVal(value));
      setIsEvaluating(false);
      inputRef.current?.blur();
    }
  };

  const isZeroActive =
    !disabled &&
    (Number(value) === 0 ||
      textVal.trim() === '0' ||
      textVal.trim() === '0.0' ||
      textVal.trim() === '0.00' ||
      textVal.trim() === '');

  return (
    <div
      className={`relative flex items-stretch rounded-xl border transition-all ${
        error
          ? 'border-red-500 bg-red-50/10'
          : evalSuccess
            ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]'
            : isZeroActive
              ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
              : 'border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary)]'
      } bg-[var(--md-sys-color-surface)] ${className}`}
    >
      {/* Left Mathematical Symbol Badge */}
      {symbol && (
        <div className="flex items-center justify-center pl-3 pr-2.5 rounded-l-xl bg-[var(--md-sys-color-surface-container-low)] border-r border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] font-mono text-xs font-semibold select-none shrink-0 min-w-[36px]">
          {symbol}
        </div>
      )}

      {/* Main High-Density Numeric Input */}
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        inputMode={resolvedUnit?.category === 'length' && activeUnitDef?.id === 'ft-in' ? 'text' : 'decimal'}
        value={textVal}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={commitEvaluation}
        onKeyDown={handleKeyDown}
        placeholder={activeUnitDef?.id === 'ft-in' ? `12'-6"` : placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-label={ariaLabel}
        className={`w-full min-w-0 bg-transparent px-3 py-2 text-xs font-mono font-medium text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/50 focus:outline-none tabular-nums ${
          !symbol ? 'rounded-l-xl' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />

      {/* Evaluation Indicator */}
      {isEvaluating && (
        <div
          className="flex items-center pr-2 text-[var(--md-sys-color-primary)] animate-pulse"
          title="Press Enter or Blur to evaluate math"
        >
          <Calculator className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Right Engineering Unit Selector or Static Badge */}
      {resolvedUnit && activeUnitDef ? (
        <>
          <button
            ref={triggerBtnRef}
            type="button"
            disabled={disabled || readOnly}
            onClick={() => setDropdownOpen((prev) => !prev)}
            title={activeFactorDetails?.tooltip || `Unit: ${activeUnitDef.name} (${activeUnitDef.symbol})`}
            className="flex items-center justify-center gap-0.5 pl-2.5 pr-2.5 rounded-r-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] border-l border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] font-mono text-[11px] font-bold select-none shrink-0 whitespace-nowrap cursor-pointer transition-colors"
          >
            <span>{activeUnitDef.symbol}</span>
            <ChevronDown className={`w-3 h-3 opacity-75 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                ref={dropdownMenuRef}
                style={{
                  position: 'fixed',
                  top: dropdownCoords.openUpward ? undefined : `${dropdownCoords.top}px`,
                  bottom: dropdownCoords.openUpward
                    ? `${window.innerHeight - dropdownCoords.top}px`
                    : undefined,
                  left: `${dropdownCoords.left}px`,
                  width: '224px',
                  zIndex: 9999,
                }}
                className="max-h-64 overflow-y-auto rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] p-1.5 shadow-2xl backdrop-blur-md text-xs font-mono"
              >
                <div className="px-2 py-1 text-[9.5px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)] mb-1 flex items-center justify-between">
                  <span>{resolvedUnit.category.replace('_', ' ')} Unit</span>
                  <span className="opacity-75">Base: {resolvedUnit.unitDef.symbol}</span>
                </div>
                {resolvedUnit.contextualUnits.map((u) => {
                  const isSelected = u.id === activeUnitDef.id;
                  const details = getConversionFactorDetails(u.id, resolvedUnit.category);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        setSelectedUnitId(u.id);
                        setTextVal(formatVal(value, u.id));
                      }}
                      title={details.tooltip}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                          : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                      }`}
                    >
                      <div className="min-w-0 pr-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[11px]">{u.symbol}</span>
                          <span className="text-[10px] opacity-75 truncate">({u.name})</span>
                        </div>
                        <div className="text-[9.5px] text-[var(--md-sys-color-on-surface-variant)] opacity-85 truncate">
                          {details.factorFormula}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-primary)]" />
                      )}
                    </button>
                  );
                })}
              </div>,
              document.body
            )}
        </>
      ) : unit ? (
        <div className="flex items-center justify-center pl-2.5 pr-3 rounded-r-xl bg-[var(--md-sys-color-surface-container-low)] border-l border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] font-mono text-[11px] font-semibold select-none shrink-0 whitespace-nowrap badge-unit">
          {unit}
        </div>
      ) : null}
    </div>
  );
};

export interface TechnicalFormFieldProps extends TechnicalInputProps {
  label: string;
  tooltip?: string;
  containerClassName?: string;
  required?: boolean;
}

export const TechnicalFormField: React.FC<TechnicalFormFieldProps> = ({
  label,
  tooltip,
  containerClassName = '',
  required = false,
  error,
  ...inputProps
}) => {
  const isZeroActive =
    !inputProps.disabled &&
    (Number(inputProps.value) === 0 ||
      String(inputProps.value).trim() === '0' ||
      String(inputProps.value).trim() === '');

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <label
            htmlFor={inputProps.id}
            className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1 cursor-pointer select-none truncate"
          >
            <span>{label}</span>
            {required && <span className="text-red-500">*</span>}
          </label>
          {isZeroActive && (
            <span
              className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 shrink-0 select-none animate-fadeIn"
              title="Parameter is currently set to zero (clean baseline or zeroed value)"
            >
              0 VALUE ACTIVE
            </span>
          )}
        </div>
        {tooltip && (
          <span
            className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-0.5 hover:text-[var(--md-sys-color-primary)] cursor-help shrink-0"
            title={tooltip}
          >
            <Info className="w-3 h-3" />
          </span>
        )}
      </div>

      <TechnicalInput error={error} {...inputProps} />

      {error && (
        <p className="text-[11px] font-mono text-red-500 flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
