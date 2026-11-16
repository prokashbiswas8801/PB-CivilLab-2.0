import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
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
import { evaluateMathExpression } from './TechnicalInput';

export interface NumericDraftInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number | string | undefined | null;
  onChangeValue: (val: number) => void;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  emptyFallback?: number;
  highlightZero?: boolean;
  allowEmpty?: boolean;
  onEmpty?: () => void;
  /**
   * Canonical unit in which `value` and `onChangeValue` are stored by the parent module
   * (e.g., 'mm', 'm', 'MPa', 'kPa', 'kN', 'kN/m', 'kN.m', 'm2', 'ft2', 'm3', 'cft', 'kg', 'g', 'L/s').
   * If omitted, NumericDraftInput automatically inspects surrounding label/header context.
   */
  baseUnit?: string;
  unitCategory?: UnitCategoryKey;
  hideUnitSelector?: boolean;
}

function extractUnitTokenFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  // Match parenthesized or bracketed unit tokens like "(MPa)", "(mm)", "(kN/m)", "[m]"
  const matches = Array.from(text.matchAll(/[([]([^()[\]]+)[)\]]/g));
  for (let i = 0; i < matches.length; i++) {
    const candidate = matches[i][1].trim();
    // Skip numeric equivalence readouts like "(18.0 in)" or "(5 ft)" or "(1000 kg)"
    if (/^[+-]?\d/.test(candidate)) continue;
    if (resolveUnitAndCategory(candidate)) {
      return candidate;
    }
    // Check if candidate has prefix like "X, Y in m" or "in mm"
    const inMatch = candidate.match(/\bin\s+([A-Za-z°²³⁴/.-]+)$/);
    if (inMatch && resolveUnitAndCategory(inMatch[1])) {
      return inMatch[1];
    }
  }
  return null;
}

/**
 * String-draft numeric input enforcing the Unrestricted Zero Baseline AND Dynamic Contextual Unit Freedom:
 * - Allows user to clear the field completely (`""`), type `0` cleanly, enter decimals (`0.5`, `.25`),
 *   or enter architectural feet-inches (`12'-4 1/2"`) when a length unit is active.
 * - Renders a compact M3 inline unit selector dropdown immediately adjacent to the input box whenever
 *   a physical unit context is provided via `baseUnit` or detected from the field's label/table header.
 * - Real-time bidirectional auto-conversion normalizes any selected unit back to `baseUnit` with zero precision loss.
 */
export const NumericDraftInput: React.FC<NumericDraftInputProps> = ({
  value,
  onChangeValue,
  allowNegative = false,
  allowDecimal = true,
  emptyFallback = 0,
  highlightZero = false,
  allowEmpty = false,
  onEmpty,
  min,
  max,
  className = '',
  onFocus,
  onBlur,
  onKeyDown,
  baseUnit,
  unitCategory,
  hideUnitSelector = false,
  ...rest
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);

  const [inferredUnitToken, setInferredUnitToken] = useState<string | null>(null);

  // Automatically detect physical unit from surrounding label / table column header when baseUnit is not explicitly passed
  useLayoutEffect(() => {
    if (baseUnit || hideUnitSelector) {
      setInferredUnitToken(null);
      return;
    }
    const el = inputRef.current;
    if (!el) return;

    // 1. Check placeholder / aria-label / title
    const fromAttr =
      extractUnitTokenFromText(rest.placeholder) ||
      extractUnitTokenFromText(rest['aria-label']) ||
      extractUnitTokenFromText(rest.title);
    if (fromAttr) {
      setInferredUnitToken(fromAttr);
      return;
    }

    // 2. Check enclosing field container's <label>
    const fieldContainer = el.closest('div');
    if (fieldContainer) {
      const directLabel = fieldContainer.querySelector('label');
      const fromDirectLabel = extractUnitTokenFromText(directLabel?.textContent);
      if (fromDirectLabel) {
        setInferredUnitToken(fromDirectLabel);
        return;
      }
      const parentContainer = fieldContainer.parentElement;
      if (parentContainer) {
        const parentLabel = parentContainer.querySelector('label');
        const fromParentLabel = extractUnitTokenFromText(parentLabel?.textContent);
        if (fromParentLabel) {
          setInferredUnitToken(fromParentLabel);
          return;
        }
      }
    }

    // 3. Check enclosing table column <th> header
    const td = el.closest('td');
    if (td && td.parentElement) {
      const colIndex = Array.from(td.parentElement.children).indexOf(td);
      const table = td.closest('table');
      if (table && colIndex >= 0) {
        const ths = table.querySelectorAll('thead th');
        if (ths[colIndex]) {
          const fromTh = extractUnitTokenFromText(ths[colIndex].textContent);
          if (fromTh) {
            setInferredUnitToken(fromTh);
            return;
          }
        }
      }
    }
  }, [baseUnit, hideUnitSelector, rest.placeholder, rest['aria-label'], rest.title]);

  const resolvedUnit = useMemo(() => {
    if (hideUnitSelector) return null;
    const token = baseUnit || inferredUnitToken;
    if (!token) return null;
    return resolveUnitAndCategory(token, unitCategory);
  }, [baseUnit, inferredUnitToken, unitCategory, hideUnitSelector]);

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
    return (
      resolvedUnit.contextualUnits.find((u) => u.id === selectedUnitId) ||
      resolvedUnit.unitDef
    );
  }, [resolvedUnit, selectedUnitId]);

  const activeFactorDetails = useMemo(() => {
    if (!resolvedUnit || !activeUnitDef) return null;
    return getConversionFactorDetails(activeUnitDef.id, resolvedUnit.category);
  }, [resolvedUnit, activeUnitDef]);

  const formatPropValue = (
    v: number | string | undefined | null,
    targetUnitId?: string
  ): string => {
    if (v === '' || v === undefined || v === null) return '';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return '0';
    if (n === 0) return '0';

    const effUnitId = targetUnitId || selectedUnitId || resolvedUnit?.unitId;
    if (!resolvedUnit || !effUnitId || effUnitId === resolvedUnit.unitId) {
      return String(cleanPrecision(n, 8));
    }

    if (resolvedUnit.category === 'length' && effUnitId === 'ft-in') {
      const feetVal = convertDirect(n, resolvedUnit.unitId, 'ft', 'length');
      if (!Number.isFinite(feetVal) || feetVal === 0) return '0';
      return formatFeetInches(feetVal, { isMeters: false });
    }

    const converted = convertDirect(n, resolvedUnit.unitId, effUnitId, resolvedUnit.category);
    if (!Number.isFinite(converted) || converted === 0) return '0';
    return String(cleanPrecision(converted, 6));
  };

  const [draft, setDraft] = useState<string>(() => formatPropValue(value));

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(formatPropValue(value));
    }
  }, [value, selectedUnitId, resolvedUnit?.unitId]);

  // Close portal dropdown on outside click or scroll/resize
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

  const clampBaseValue = (num: number): number => {
    if (!Number.isFinite(num)) return emptyFallback;
    if (num === 0) return 0;
    let out = num;
    if (!allowNegative && out < 0) out = 0;
    const minNum = min !== undefined ? Number(min) : undefined;
    const maxNum = max !== undefined ? Number(max) : undefined;
    if (minNum !== undefined && Number.isFinite(minNum) && out < minNum) out = minNum;
    if (maxNum !== undefined && Number.isFinite(maxNum) && out > maxNum) out = maxNum;
    return cleanPrecision(out, 8);
  };

  const parseDraftToBaseValue = (
    rawString: string,
    unitIdToUse: string
  ): { isValid: boolean; baseValue: number; detectedUnitId?: string } => {
    const trimmed = rawString.trim();
    if (!trimmed || trimmed === '-' || trimmed === '.' || trimmed === '-.') {
      return { isValid: false, baseValue: emptyFallback };
    }

    if (resolvedUnit && unitIdToUse) {
      if (trimmed === '0' || trimmed === `0'-0"` || trimmed === "0'") {
        return { isValid: true, baseValue: 0, detectedUnitId: unitIdToUse };
      }

      const smart = parseSmartUnitInput(trimmed, unitIdToUse, resolvedUnit.category);
      if (smart.isValid && Number.isFinite(smart.parsedValue)) {
        if (smart.parsedValue === 0) {
          return { isValid: true, baseValue: 0, detectedUnitId: smart.detectedUnitId };
        }
        const effectiveFromUnit = smart.detectedUnitId === 'ft-in' ? 'ft' : smart.detectedUnitId;
        const baseVal =
          effectiveFromUnit === resolvedUnit.unitId
            ? smart.parsedValue
            : convertDirect(
                smart.parsedValue,
                effectiveFromUnit,
                resolvedUnit.unitId,
                resolvedUnit.category
              );
        if (Number.isFinite(baseVal)) {
          return {
            isValid: true,
            baseValue: allowDecimal ? baseVal : Math.round(baseVal),
            detectedUnitId: smart.detectedUnitId,
          };
        }
      }

      // Check arithmetic expression
      if (/[+*/^()]/.test(trimmed)) {
        const evaluated = evaluateMathExpression(trimmed);
        if (evaluated !== null && Number.isFinite(evaluated)) {
          if (evaluated === 0) return { isValid: true, baseValue: 0 };
          const effectiveFromUnit = unitIdToUse === 'ft-in' ? 'ft' : unitIdToUse;
          const baseVal =
            effectiveFromUnit === resolvedUnit.unitId
              ? evaluated
              : convertDirect(evaluated, effectiveFromUnit, resolvedUnit.unitId, resolvedUnit.category);
          if (Number.isFinite(baseVal)) {
            return { isValid: true, baseValue: allowDecimal ? baseVal : Math.round(baseVal) };
          }
        }
      }
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      if (resolvedUnit && unitIdToUse && unitIdToUse !== resolvedUnit.unitId) {
        if (parsed === 0) return { isValid: true, baseValue: 0 };
        const effectiveFromUnit = unitIdToUse === 'ft-in' ? 'ft' : unitIdToUse;
        const baseVal = convertDirect(parsed, effectiveFromUnit, resolvedUnit.unitId, resolvedUnit.category);
        if (Number.isFinite(baseVal)) {
          return { isValid: true, baseValue: allowDecimal ? baseVal : Math.round(baseVal) };
        }
      }
      return { isValid: true, baseValue: allowDecimal ? parsed : Math.round(parsed) };
    }

    return { isValid: false, baseValue: emptyFallback };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    const isLengthMode = resolvedUnit?.category === 'length';
    if (!isLengthMode && !resolvedUnit) {
      // Strict numeric pattern when no physical unit selector is active
      const pattern = allowNegative
        ? allowDecimal
          ? /^-?\d*\.?\d*$/
          : /^-?\d*$/
        : allowDecimal
          ? /^\d*\.?\d*$/
          : /^\d*$/;

      if (raw !== '' && !pattern.test(raw)) {
        return;
      }
    } else if (!isLengthMode) {
      // Allow numbers, decimals, and basic math operators
      if (raw !== '' && !/^[0-9.,+\-*/^()\s]*$/.test(raw)) {
        return;
      }
    }

    // Strip sticky leading zero (e.g. "05" -> "5", "-05" -> "-5") while keeping "0", "0.", "0'-..."
    if (/^0\d/.test(raw) && !/^0\d*\s*['"/-]/.test(raw)) {
      raw = raw.replace(/^0+/, '') || '0';
    } else if (/^-0\d/.test(raw)) {
      raw = '-' + (raw.slice(1).replace(/^0+/, '') || '0');
    }

    setDraft(raw);

    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
      if (raw === '') {
        if (allowEmpty && onEmpty) {
          onEmpty();
        } else {
          onChangeValue(emptyFallback);
        }
      }
      return;
    }

    // Wait to commit if user is mid-typing a fraction or feet-inch separator like "12'-" or "12'-4 " or "12'-4 1/"
    if (isLengthMode && /['"\-/]\s*$/.test(raw)) {
      return;
    }

    const activeId = activeUnitDef?.id || resolvedUnit?.unitId || '';
    const res = parseDraftToBaseValue(raw, activeId);
    if (res.isValid) {
      onChangeValue(clampBaseValue(res.baseValue));
    }
  };

  const commitDraft = () => {
    const trimmed = draft.trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') {
      if (allowEmpty && onEmpty) {
        onEmpty();
        setDraft('');
        return;
      }
      const fb = clampBaseValue(emptyFallback);
      onChangeValue(fb);
      setDraft(formatPropValue(fb));
      return;
    }

    const activeId = activeUnitDef?.id || resolvedUnit?.unitId || '';
    const res = parseDraftToBaseValue(trimmed, activeId);
    if (res.isValid) {
      const nextUnitId =
        res.detectedUnitId && resolvedUnit?.contextualUnits.some((u) => u.id === res.detectedUnitId)
          ? res.detectedUnitId
          : activeId;
      if (nextUnitId && nextUnitId !== selectedUnitId) {
        setSelectedUnitId(nextUnitId);
      }
      const clampedBase = clampBaseValue(res.baseValue);
      onChangeValue(clampedBase);
      setDraft(formatPropValue(clampedBase, nextUnitId));
    } else {
      setDraft(formatPropValue(value));
    }
  };

  const handleSelectUnit = (u: UnitDefinition) => {
    setDropdownOpen(false);
    setSelectedUnitId(u.id);
    setDraft(formatPropValue(value, u.id));
  };

  const isZero =
    !rest.disabled &&
    (Number(value) === 0 || draft.trim() === '' || draft.trim() === '0' || draft.trim() === `0'-0"`);
  const zeroRingClass = highlightZero && isZero ? 'border-amber-500/50 bg-amber-500/[0.03]' : '';

  if (!resolvedUnit || !activeUnitDef) {
    return (
      <input
        {...rest}
        ref={inputRef}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        value={draft}
        onChange={handleChange}
        onFocus={(e) => {
          isFocusedRef.current = true;
          onFocus?.(e);
        }}
        onBlur={(e) => {
          isFocusedRef.current = false;
          commitDraft();
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitDraft();
          } else if (e.key === 'Escape') {
            setDraft(formatPropValue(value));
          }
          onKeyDown?.(e);
        }}
        className={`${className} ${zeroRingClass}`.trim()}
      />
    );
  }

  // Extract width/flex/grid-span classes from className so wrapper div sizes properly in flex/grid layouts
  const widthMatch = className.match(/\b(w-full|w-1\/2|w-1\/3|w-2\/3|w-\d+|flex-1)\b/);
  const colSpanMatch = className.match(/\b(col-span-\d+|col-span-full)\b/);
  const wrapperWidthClass = [widthMatch ? widthMatch[1] : 'w-full', colSpanMatch ? colSpanMatch[1] : '']
    .filter(Boolean)
    .join(' ');
  const isCompactFixedWidth = /^w-(10|12|14|16|20|24)\b/.test(wrapperWidthClass);

  // Clean input className to seamlessly join with the right-hand M3 inline unit selector button
  const cleanedInputClass = className
    .replace(/\b(w-full|w-1\/2|w-1\/3|w-2\/3|w-\d+|flex-1|col-span-\d+|col-span-full)\b/g, 'w-full flex-1 min-w-[52px]')
    .replace(/\brounded(-[a-z0-9]+)?\b/g, '')
    .trim();

  return (
    <div
      ref={wrapperRef}
      className={`relative inline-flex items-stretch rounded-xl ${wrapperWidthClass} ${
        isCompactFixedWidth ? 'min-w-[106px]' : ''
      }`}
    >
      <input
        {...rest}
        ref={inputRef}
        type="text"
        inputMode={
          resolvedUnit.category === 'length' && activeUnitDef.id === 'ft-in'
            ? 'text'
            : allowDecimal
              ? 'decimal'
              : 'numeric'
        }
        value={draft}
        placeholder={
          activeUnitDef.id === 'ft-in'
            ? `12'-6"`
            : rest.placeholder
        }
        onChange={handleChange}
        onFocus={(e) => {
          isFocusedRef.current = true;
          onFocus?.(e);
        }}
        onBlur={(e) => {
          isFocusedRef.current = false;
          commitDraft();
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitDraft();
          } else if (e.key === 'Escape') {
            setDraft(formatPropValue(value));
          }
          onKeyDown?.(e);
        }}
        className={`${cleanedInputClass} ${zeroRingClass} rounded-l-xl rounded-r-none border-r-0 focus:z-10`.trim()}
      />

      <button
        ref={triggerBtnRef}
        type="button"
        disabled={rest.disabled}
        onClick={() => setDropdownOpen((prev) => !prev)}
        title={activeFactorDetails?.tooltip || `Unit: ${activeUnitDef.name} (${activeUnitDef.symbol})`}
        aria-label={`Select unit (current: ${activeUnitDef.symbol})`}
        className="shrink-0 inline-flex items-center justify-center gap-0.5 px-2 rounded-r-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] font-mono text-[10.5px] font-bold transition-colors cursor-pointer select-none disabled:opacity-50"
      >
        <span className="truncate max-w-[44px]">{activeUnitDef.symbol}</span>
        <ChevronDown
          className={`w-3 h-3 opacity-75 shrink-0 transition-transform ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
        />
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
              <span className="opacity-75">Base: { resolvedUnit.unitDef.symbol }</span>
            </div>
            {resolvedUnit.contextualUnits.map((u) => {
              const isSelected = u.id === activeUnitDef.id;
              const details = getConversionFactorDetails(u.id, resolvedUnit.category);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUnit(u)}
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
    </div>
  );
};
