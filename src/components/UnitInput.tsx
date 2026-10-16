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
  UnitDefinition,
} from '../utils/unitEngine';
import { ChevronDown, Check } from 'lucide-react';

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
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Compute the display numerical value based on active unit
  const computedDisplayValue = useMemo(() => {
    if (isNaN(siValue)) return '';
    const converted = denormalizeFromBase(siValue, activeUnitInfo.id, category, customUnits);
    if (Number.isInteger(converted)) return converted.toString();
    // High-precision representation without floating point jitter
    return parseFloat(converted.toPrecision(8)).toString();
  }, [siValue, activeUnitInfo.id, category, customUnits]);

  const [rawText, setRawText] = useState<string>(computedDisplayValue);
  const isFocusedRef = useRef(false);

  // Keep rawText synced when siValue or activeUnit changes outside of manual editing
  useEffect(() => {
    if (!isFocusedRef.current) {
      setRawText(computedDisplayValue);
    }
  }, [computedDisplayValue]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setRawText(valStr);

    const parsed = parseSmartUnitInput(valStr, activeUnitInfo.id, category);
    if (parsed.isValid) {
      // If user typed an explicit unit suffix (e.g. "250 mm" in an "m" field), switch unit or convert
      if (parsed.detectedUnitId !== activeUnitInfo.id) {
        onUnitChange(parsed.detectedUnitId);
      }
      const newSI = normalizeToBase(parsed.parsedValue, parsed.detectedUnitId, category, customUnits);
      onChangeSI(newSI);
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    setRawText(computedDisplayValue);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleSelectUnit = (unit: UnitDefinition) => {
    setDropdownOpen(false);
    if (unit.id === activeUnitInfo.id) return;
    onUnitChange(unit.id);
    // The physical SI value remains invariant! Only the display value updates to the new unit.
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
          {label}
        </label>
        {activeUnitInfo.isRegional && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-tertiary)]">
            Regional
          </span>
        )}
      </div>

      <div className="relative flex items-center rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-xs transition-colors focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-1 focus-within:ring-[var(--md-sys-color-primary)]">
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
          className="w-full min-w-0 touch-target-48 bg-transparent px-3 py-2 text-sm font-mono text-[var(--md-sys-color-on-surface)] focus:outline-hidden disabled:opacity-50"
        />

        {/* Unit Selector Dropdown Trigger Button */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 touch-target-48 px-3 border-l border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-mono font-bold rounded-r-lg transition-colors cursor-pointer"
            title={`Active Unit: ${activeUnitInfo.name} (${activeUnitInfo.symbol}). Click to switch.`}
          >
            <span>{activeUnitInfo.symbol}</span>
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

      {helperText && (
        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
          {helperText}
        </p>
      )}
    </div>
  );
};
