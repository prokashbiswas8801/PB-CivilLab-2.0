import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UnitCategoryKey, CustomUnitDefinition } from '../types/civil';
import {
  ALL_UNITS,
  denormalizeFromBase,
  getUnitDefinition,
  UnitDefinition,
  CANONICAL_BASE_UNITS,
} from '../utils/unitEngine';
import { ChevronDown, Check } from 'lucide-react';

export interface UnitValueDisplayProps {
  label: string;
  siValue: number;
  category: UnitCategoryKey;
  currentUnitId: string;
  onUnitChange: (newUnitId: string) => void;
  precision?: number;
  customUnits?: CustomUnitDefinition[];
  highlight?: boolean;
  subText?: string;
  className?: string;
}

export const UnitValueDisplay: React.FC<UnitValueDisplayProps> = ({
  label,
  siValue,
  category,
  currentUnitId,
  onUnitChange,
  precision = 2,
  customUnits = [],
  highlight = false,
  subText,
  className = '',
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const convertedValue = useMemo(() => {
    if (isNaN(siValue)) return 0;
    return denormalizeFromBase(siValue, activeUnitInfo.id, category, customUnits);
  }, [siValue, activeUnitInfo.id, category, customUnits]);

  // Formatted string
  const displayFormatted = useMemo(() => {
    if (isNaN(convertedValue)) return '—';
    if (Number.isInteger(convertedValue)) return convertedValue.toLocaleString();
    return convertedValue.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  }, [convertedValue, precision]);

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

  const baseUnitSymbol = CANONICAL_BASE_UNITS[category];

  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        highlight
          ? 'bg-[var(--md-sys-color-primary-container)]/30 border-[var(--md-sys-color-primary)]'
          : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]'
      } ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">
        <span className="font-semibold truncate">{label}</span>
        {activeUnitInfo.id !== baseUnitSymbol && (
          <span className="text-[10px] font-mono opacity-80" title="Canonical SI base readout">
            SI: {Number(siValue.toFixed(precision))} {baseUnitSymbol}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-0.5">
        <div
          className={`text-xl font-bold font-mono truncate ${
            highlight ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          {displayFormatted}
        </div>

        {/* Dropdown unit badge button */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-mono font-bold text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
            title={`Display Unit: ${activeUnitInfo.name}. Click to change.`}
          >
            <span>{activeUnitInfo.symbol}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-48 max-h-60 overflow-y-auto rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] p-1 shadow-xl backdrop-blur-md">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)] mb-1">
                Display Unit
              </div>
              {availableUnits.map((u) => {
                const isSelected = u.id === activeUnitInfo.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onUnitChange(u.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-mono text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                        : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                    }`}
                  >
                    <span className="truncate">{u.name} ({u.symbol})</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-primary)]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {subText && (
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 truncate">
          {subText}
        </div>
      )}
    </div>
  );
};
