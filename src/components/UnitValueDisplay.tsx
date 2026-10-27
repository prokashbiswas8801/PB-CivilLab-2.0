import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UnitCategoryKey, CustomUnitDefinition } from '../types/civil';
import {
  ALL_UNITS,
  denormalizeFromBase,
  getUnitDefinition,
  UnitDefinition,
  CANONICAL_BASE_UNITS,
  getConversionFactorDetails,
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

  // High-precision conversion factor relative to base SI unit
  const [isUnitHovered, setIsUnitHovered] = useState(false);
  const conversionFactorDetails = useMemo(() => {
    return getConversionFactorDetails(activeUnitInfo.id, category, customUnits);
  }, [activeUnitInfo.id, category, customUnits]);

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

  // Smooth fade transition tracking when unit system changes
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
      className={`p-3 rounded-xl border transition-all duration-300 ${
        isUnitFading
          ? 'border-[var(--md-sys-color-primary)] ring-1 ring-[var(--md-sys-color-primary)]/40 shadow-xs'
          : highlight
          ? 'bg-[var(--md-sys-color-primary-container)]/30 border-[var(--md-sys-color-primary)]'
          : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]'
      } ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">
        <span className="font-semibold truncate">{label}</span>
        {activeUnitInfo.id !== baseUnitSymbol && (
          <span className="text-[10px] font-mono opacity-80" title="Canonical SI base readout">
            SI: {Math.abs(siValue) > 0 && Math.abs(siValue) < 0.01 ? parseFloat(siValue.toPrecision(4)) : Number(siValue.toFixed(precision))} {baseUnitSymbol}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-0.5">
        <div
          className={`text-xl font-bold font-mono truncate transition-all duration-300 ease-out ${
            isUnitFading
              ? 'opacity-25 scale-[0.985] text-[var(--md-sys-color-primary)] translate-y-0.5'
              : highlight
              ? 'opacity-100 scale-100 text-[var(--md-sys-color-primary)] translate-y-0'
              : 'opacity-100 scale-100 text-[var(--md-sys-color-on-surface)] translate-y-0'
          }`}
        >
          {displayFormatted}
        </div>

        {/* Dropdown unit badge button */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setIsUnitHovered(false);
            }}
            onMouseEnter={() => setIsUnitHovered(true)}
            onMouseLeave={() => setIsUnitHovered(false)}
            onFocus={() => setIsUnitHovered(true)}
            onBlur={() => setIsUnitHovered(false)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-mono font-bold text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
            title={conversionFactorDetails.tooltip}
            aria-label={`Unit: ${activeUnitInfo.name}. ${conversionFactorDetails.factorFormula}. Click to change.`}
          >
            <span className={`transition-all duration-300 ease-out inline-block ${
              isUnitFading ? 'opacity-25 scale-90 text-[var(--md-sys-color-primary)]' : 'opacity-100 scale-100'
            }`}>
              {activeUnitInfo.symbol}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
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
                  {conversionFactorDetails.isBaseUnit ? 'Base SI Unit' : 'SI Factor'}
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

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-64 max-h-60 overflow-y-auto rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] p-1.5 shadow-xl backdrop-blur-md">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)] mb-1 flex items-center justify-between">
                <span>Display Unit</span>
                <span className="text-[9px] font-mono opacity-70">Base: {conversionFactorDetails.baseUnitSymbol}</span>
              </div>
              {availableUnits.map((u) => {
                const isSelected = u.id === activeUnitInfo.id;
                const uDetails = getConversionFactorDetails(u.id, category, customUnits);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onUnitChange(u.id);
                      setDropdownOpen(false);
                    }}
                    title={uDetails.tooltip}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-colors cursor-pointer ${
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

      {subText && (
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 truncate">
          {subText}
        </div>
      )}
    </div>
  );
};
