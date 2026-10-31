import React, { useState, useEffect, useRef, useId } from 'react';
import { Info, AlertCircle, Calculator } from 'lucide-react';

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
  value,
  onChange,
  min,
  max,
  step = 1,
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

  // Format initial display
  const formatVal = (v: number | string): string => {
    if (v === '' || v === undefined || v === null || isNaN(Number(v))) return '';
    const num = Number(v);
    if (precision !== undefined) {
      return num.toFixed(precision);
    }
    return String(v);
  };

  const [textVal, setTextVal] = useState<string>(() => formatVal(value));
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalSuccess, setEvalSuccess] = useState<boolean>(false);

  // Synchronize when external value updates
  useEffect(() => {
    setTextVal(formatVal(value));
  }, [value, precision]);

  const commitEvaluation = () => {
    const raw = textVal.trim();
    if (!raw) {
      onChange(0);
      setTextVal('0');
      return;
    }

    const calculated = evaluateMathExpression(raw);
    if (calculated !== null) {
      let finalVal = calculated;
      if (min !== undefined && finalVal < min) finalVal = min;
      if (max !== undefined && finalVal > max) finalVal = max;

      onChange(finalVal);
      setTextVal(precision !== undefined ? finalVal.toFixed(precision) : String(finalVal));

      if (raw.includes('+') || raw.includes('-') || raw.includes('*') || raw.includes('/') || raw.includes('^')) {
        setEvalSuccess(true);
        setTimeout(() => setEvalSuccess(false), 1200);
      }
    } else {
      // Revert to valid previous value
      setTextVal(formatVal(value));
    }
    setIsEvaluating(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTextVal(v);
    const hasMathOp = /[+\-*/^()]/.test(v);
    setIsEvaluating(hasMathOp);

    // If it's a direct valid number, update immediately
    if (!hasMathOp && v !== '' && !isNaN(Number(v))) {
      onChange(Number(v));
    }
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

  return (
    <div className={`relative flex items-stretch rounded border transition-colors ${
      error
        ? 'border-red-500 bg-red-50/10'
        : evalSuccess
          ? 'border-[var(--md-sys-color-primary)] ring-1 ring-[var(--md-sys-color-primary)]'
          : 'border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-outline-variant)] focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-1 focus-within:ring-[var(--md-sys-color-primary)]'
    } bg-[var(--md-sys-color-surface)] ${className}`}>
      {/* Left Mathematical Symbol Badge */}
      {symbol && (
        <div className="flex items-center justify-center px-2.5 bg-[var(--md-sys-color-surface-container-low)] border-r border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] font-mono text-xs font-semibold select-none shrink-0 min-w-[34px]">
          {symbol}
        </div>
      )}

      {/* Main High-Density Numeric Input */}
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        inputMode="decimal"
        value={textVal}
        onChange={handleChange}
        onBlur={commitEvaluation}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-label={ariaLabel}
        className={`w-full min-w-0 bg-transparent px-2.5 py-1.5 text-xs font-mono font-medium text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/50 focus:outline-none tabular-nums ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />

      {/* Evaluation Indicator */}
      {isEvaluating && (
        <div
          className="flex items-center pr-1.5 text-[var(--md-sys-color-primary)] animate-pulse"
          title="Press Enter or Blur to evaluate math"
        >
          <Calculator className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Right Engineering Unit Badge */}
      {unit && (
        <div className="flex items-center justify-center px-2 bg-[var(--md-sys-color-surface-container-low)] border-l border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] font-mono text-[11px] font-semibold select-none shrink-0 whitespace-nowrap badge-unit">
          {unit}
        </div>
      )}
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
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      <div className="flex items-center justify-between gap-1.5">
        <label
          htmlFor={inputProps.id}
          className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1 cursor-pointer select-none"
        >
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>
        {tooltip && (
          <span
            className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-0.5 hover:text-[var(--md-sys-color-primary)] cursor-help"
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
