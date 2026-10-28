import React, { useState, useMemo, useEffect } from 'react';
import { Settings, ArrowRightLeft, RefreshCw, Check, HelpCircle } from 'lucide-react';
import {
  CivilWorkspace,
  UnitCategoryKey,
  CustomUnitDefinition,
} from '../../types/civil';
import {
  STANDARD_UNITS,
  BASE_UNITS,
  convertDirect,
  computeRegionalLandBreakdown,
  FeetInchParseResult,
  formatSmartNumber,
  formatNumberWhileTyping,
} from '../../utils/unitConverter';
import { parseSmartUnitInput } from '../../utils/unitEngine';
import { ExplainConversionModal } from '../modals/ExplainConversionModal';

export { ExplainConversionModal };

// Common paired units for quick single-click selection per engineering category
const COMMON_CATEGORY_PAIRS: Record<
  UnitCategoryKey,
  Array<{ label: string; from: string; to: string; title?: string }>
> = {
  length: [
    { label: 'm ⇄ ft', from: 'm', to: 'ft', title: 'Metric Meters ↔ Imperial Feet' },
    { label: 'mm ⇄ in', from: 'mm', to: 'in', title: 'Rebar Millimeters ↔ Inches' },
    { label: 'm ⇄ mm', from: 'm', to: 'mm', title: 'Meters ↔ Millimeters' },
    { label: 'km ⇄ mi', from: 'km', to: 'mi', title: 'Kilometers ↔ Statute Miles' },
  ],
  area: [
    { label: 'm² ⇄ sq ft', from: 'm2', to: 'ft2', title: 'Square Meters ↔ Square Feet (SFT)' },
    { label: 'm² ⇄ acre', from: 'm2', to: 'acre', title: 'Square Meters ↔ International Acre' },
    { label: 'acre ⇄ decimal', from: 'acre', to: 'decimal', title: 'Acre ↔ Regional Decimal (100 dec/ac)' },
    { label: 'decimal ⇄ katha', from: 'decimal', to: 'katha', title: 'Regional Decimal ↔ Katha (1.65 dec/katha)' },
    { label: 'katha ⇄ bigha', from: 'katha', to: 'bigha', title: 'Katha (20 katha/bigha) ↔ Bigha' },
    { label: 'bigha ⇄ acre', from: 'bigha', to: 'acre', title: 'Bigha (3.025 bigha/ac) ↔ Acre' },
    { label: 'cent ⇄ sq ft', from: 'cent', to: 'ft2', title: 'Cent (435.6 sq ft) ↔ Square Feet' },
    { label: 'guntha ⇄ sq ft', from: 'guntha', to: 'ft2', title: 'Guntha (1,089 sq ft) ↔ Square Feet' },
    { label: 'ground ⇄ sq ft', from: 'ground', to: 'ft2', title: 'Ground (2,400 sq ft) ↔ Square Feet' },
    { label: 'kanal ⇄ marla', from: 'kanal', to: 'marla', title: 'Kanal (20 marlas) ↔ Marla' },
    { label: 'hectare ⇄ acre', from: 'hectare', to: 'acre', title: 'Hectare ↔ Acre' },
  ],
  volume: [
    { label: 'm³ ⇄ cft', from: 'm3', to: 'cft', title: 'Cubic Meters ↔ Cubic Feet (35.315 cft/m³)' },
    { label: 'm³ ⇄ Liter', from: 'm3', to: 'liter', title: 'Cubic Meters ↔ Liters' },
    { label: 'cft ⇄ US gal', from: 'cft', to: 'gal_us', title: 'Cubic Feet ↔ US Gallons' },
  ],
  mass: [
    { label: 'kg ⇄ lb', from: 'kg', to: 'lb', title: 'Kilograms ↔ Imperial Pounds' },
    { label: 'tonne ⇄ ton', from: 'tonne', to: 'ton_us', title: 'Metric Tonne (1000 kg) ↔ US Short Ton (2000 lb)' },
    { label: 'bag (50kg) ⇄ kg', from: 'bag50', to: 'kg', title: 'Cement Bags ↔ Kilograms' },
    { label: 'maund ⇄ kg', from: 'maund', to: 'kg', title: 'Regional Maund (40 seers) ↔ Kilograms' },
  ],
  pressure: [
    { label: 'MPa ⇄ psi', from: 'MPa', to: 'psi', title: 'Concrete Strength MPa ↔ PSI (1 MPa ≈ 145 psi)' },
    { label: 'kPa ⇄ psf', from: 'kPa', to: 'psf', title: 'Soil Bearing kPa ↔ PSF (Pounds per sq ft)' },
    { label: 'GPa ⇄ ksi', from: 'GPa', to: 'ksi', title: 'Modulus of Elasticity GPa ↔ KSI' },
    { label: 'bar ⇄ psi', from: 'bar', to: 'psi', title: 'Fluid Pressure Bar ↔ PSI' },
    { label: 'kPa ⇄ bar', from: 'kPa', to: 'bar', title: 'Kilopascal ↔ Bar' },
  ],
  force: [
    { label: 'kN ⇄ kip', from: 'kN', to: 'kip', title: 'Kilonewtons ↔ US Kips (1 kip ≈ 4.448 kN)' },
    { label: 'kN ⇄ lbf', from: 'kN', to: 'lbf', title: 'Kilonewtons ↔ Pound-force' },
    { label: 'kN ⇄ N', from: 'kN', to: 'N', title: 'Kilonewtons ↔ Newtons' },
    { label: 'MN ⇄ kip', from: 'MN', to: 'kip', title: 'Meganewtons ↔ Kips' },
  ],
  distributed_load: [
    { label: 'kN/m ⇄ plf', from: 'kN/m', to: 'plf', title: 'Uniform Load kN/m ↔ Pounds/foot (plf)' },
    { label: 'kN/m ⇄ klf', from: 'kN/m', to: 'klf', title: 'Uniform Load kN/m ↔ Kips/foot (klf)' },
    { label: 'kN/m ⇄ N/mm', from: 'kN/m', to: 'N/mm', title: 'kN/m ↔ N/mm' },
  ],
  density: [
    { label: 'kN/m³ ⇄ pcf', from: 'kN/m3', to: 'pcf', title: 'Soil Unit Weight kN/m³ ↔ Pounds/cu ft (pcf)' },
    { label: 'kg/m³ ⇄ pcf', from: 'kg/m3', to: 'pcf', title: 'Material Density kg/m³ ↔ PCF' },
  ],
  moment: [
    { label: 'kN·m ⇄ kip·ft', from: 'kN.m', to: 'kip.ft', title: 'Bending Moment kN·m ↔ Kip·ft' },
    { label: 'N·m ⇄ lbf·ft', from: 'N.m', to: 'lbf.ft', title: 'Newton·meters ↔ Pound-force·ft' },
  ],
  slope: [
    { label: 'degree ⇄ % grade', from: 'degree', to: 'percent', title: 'Slope Angle Degree ↔ Percent Grade' },
    { label: 'ratio (1:n) ⇄ %', from: 'ratio', to: 'percent', title: 'Slope Ratio ↔ Percent Grade' },
  ],
  velocity: [
    { label: 'm/s ⇄ ft/s', from: 'm/s', to: 'ft/s', title: 'Flow Velocity m/s ↔ ft/s' },
    { label: 'km/h ⇄ mph', from: 'km/h', to: 'mph', title: 'Speed km/h ↔ Miles per hour (mph)' },
  ],
  flow_rate: [
    { label: 'L/s ⇄ gpm', from: 'L/s', to: 'gpm', title: 'Discharge Liters/sec ↔ US Gallons/min' },
    { label: 'm³/s ⇄ cfs', from: 'm3/s', to: 'cfs', title: 'River/Channel Cumecs ↔ Cusecs' },
    { label: 'm³/h ⇄ gpm', from: 'm3/hr', to: 'gpm', title: 'Treatment Plant m³/hr ↔ GPM' },
  ],
};

export interface UnitConverterInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  availableCategoryUnits: Array<{ id: string; name: string; symbol: string; isRegional?: boolean }>;
  activeFeetInchResult: FeetInchParseResult;
  onOpenCustomUnitsModal: () => void;
  conversionResult?: {
    result: number;
    formula: string;
  };
}

export const UnitConverterInputs: React.FC<UnitConverterInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  availableCategoryUnits,
  activeFeetInchResult,
  onOpenCustomUnitsModal,
  conversionResult,
}) => {
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastSwapNotice, setLastSwapNotice] = useState<string | null>(null);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);

  const converter = activeWorkspace.converter;
  const currentCategory = converter.category;

  // Local state for freeform text typing with clean comma auto-formatting
  const [displayInputString, setDisplayInputString] = useState<string>(() =>
    converter.inputValue !== undefined && converter.inputValue !== null
      ? formatNumberWhileTyping(String(converter.inputValue)).formatted
      : ''
  );

  // Sync internal display when external workspace inputValue changes
  useEffect(() => {
    const numericFromDisplay = parseFloat(displayInputString.replace(/,/g, ''));
    if (!isNaN(converter.inputValue) && numericFromDisplay !== converter.inputValue) {
      setDisplayInputString(formatNumberWhileTyping(String(converter.inputValue)).formatted);
    }
  }, [converter.inputValue]);

  // Calculate live conversion result if not passed
  const currentConvertedValue = useMemo(() => {
    if (conversionResult) return conversionResult.result;
    try {
      const res = convertDirect(
        converter.inputValue,
        converter.fromUnit,
        converter.toUnit,
        converter.category,
        customUnits
      );
      return isNaN(res) || !isFinite(res) ? null : res;
    } catch {
      return null;
    }
  }, [conversionResult, converter.inputValue, converter.fromUnit, converter.toUnit, converter.category, customUnits]);

  // Exhaustive regional land breakdown matrix when discipline is 'area'
  const landBreakdown = useMemo(() => {
    if (currentCategory !== 'area') return null;
    return computeRegionalLandBreakdown(converter.inputValue, converter.fromUnit, customUnits);
  }, [currentCategory, converter.inputValue, converter.fromUnit, customUnits]);

  // Instant Swap handler with rotation animation and haptic visual feedback
  const handleSwapUnits = (withValueCarry: boolean = false) => {
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 380);

    const oldFrom = converter.fromUnit;
    const oldTo = converter.toUnit;

    let nextValue = converter.inputValue;
    if (withValueCarry && currentConvertedValue !== null) {
      nextValue = parseFloat(currentConvertedValue.toFixed(6));
      setDisplayInputString(formatNumberWhileTyping(String(nextValue)).formatted);
    }

    updateActiveWorkspace((ws) => ({
      ...ws,
      converter: {
        ...ws.converter,
        fromUnit: oldTo,
        toUnit: oldFrom,
        inputValue: nextValue,
      },
    }));

    const noticeText = withValueCarry
      ? `Swapped ${oldTo} ⇄ ${oldFrom} & carried converted value (${nextValue})`
      : `Swapped ${oldTo} ⇄ ${oldFrom}`;

    setLastSwapNotice(noticeText);
    setTimeout(() => setLastSwapNotice(null), 2500);
  };

  const handleApplyQuickPair = (pair: { from: string; to: string }) => {
    const isAlreadyActive =
      converter.fromUnit === pair.from && converter.toUnit === pair.to;

    const newFrom = isAlreadyActive ? pair.to : pair.from;
    const newTo = isAlreadyActive ? pair.from : pair.to;

    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 350);

    updateActiveWorkspace((ws) => ({
      ...ws,
      converter: {
        ...ws.converter,
        fromUnit: newFrom,
        toUnit: newTo,
      },
    }));

    setLastSwapNotice(`Set ${newFrom} ⇄ ${newTo}`);
    setTimeout(() => setLastSwapNotice(null), 2000);
  };

  const handleNumericInputChange = (raw: string) => {
    const typingResult = formatNumberWhileTyping(raw);
    const formatted = typingResult.formatted;
    setDisplayInputString(formatted);

    // Support mathematical expressions and smart parsing (e.g. "250 / 2", "12500", "12'-6\"")
    const parsed = parseSmartUnitInput(formatted, converter.fromUnit, converter.category);
    if (parsed.isValid && !isNaN(parsed.parsedValue)) {
      updateActiveWorkspace((ws) => ({
        ...ws,
        converter: { ...ws.converter, inputValue: parsed.parsedValue },
      }));
    } else if (typingResult.cleanNumeric !== undefined && !isNaN(typingResult.cleanNumeric)) {
      updateActiveWorkspace((ws) => ({
        ...ws,
        converter: { ...ws.converter, inputValue: typingResult.cleanNumeric! },
      }));
    } else {
      const fallbackNum = parseFloat(formatted.replace(/,/g, ''));
      if (!isNaN(fallbackNum)) {
        updateActiveWorkspace((ws) => ({
          ...ws,
          converter: { ...ws.converter, inputValue: fallbackNum },
        }));
      }
    }
  };

  const fromUnitObj = availableCategoryUnits.find((u) => u.id === converter.fromUnit);
  const toUnitObj = availableCategoryUnits.find((u) => u.id === converter.toUnit);

  const quickPairs = COMMON_CATEGORY_PAIRS[currentCategory] || [];

  return (
    <div className="space-y-4">
      {/* Category Discipline Selector */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
            Measurement Discipline Category
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExplainModalOpen(true)}
              className="text-xs font-bold text-[var(--md-sys-color-primary)] flex items-center gap-1.5 cursor-pointer hover:underline px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-primary-container)]/70 hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] transition-all shadow-xs"
              title="Explain step-by-step conversion logic using stored custom unit factors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Explain Conversion</span>
            </button>
            <button
              type="button"
              onClick={onOpenCustomUnitsModal}
              className="text-xs font-bold text-[var(--md-sys-color-primary)] flex items-center gap-1 cursor-pointer hover:underline"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Custom Units ({customUnits.length})</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 p-1 rounded-xl bg-[var(--md-sys-color-surface-container)]">
          {(
            [
              { id: 'length', label: 'Length' },
              { id: 'area', label: 'Area / Land' },
              { id: 'volume', label: 'Volume / CFT' },
              { id: 'mass', label: 'Mass / Steel' },
              { id: 'force', label: 'Force / Reaction' },
              { id: 'distributed_load', label: 'Uniform Load' },
              { id: 'pressure', label: 'Stress / Pressure' },
              { id: 'density', label: 'Unit Weight / γ' },
              { id: 'moment', label: 'Moment / Mmax' },
              { id: 'slope', label: 'Slope / Grade' },
              { id: 'velocity', label: 'Flow Velocity' },
              { id: 'flow_rate', label: 'Discharge / Q' },
            ] as { id: UnitCategoryKey; label: string }[]
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                const units = STANDARD_UNITS[cat.id];
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: {
                    ...ws.converter,
                    category: cat.id,
                    fromUnit: units[0].id,
                    toUnit: units[1] ? units[1].id : units[0].id,
                  },
                }));
              }}
              className={`min-h-[44px] touch-target-48 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                activeWorkspace.converter.category === cat.id
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Conversion Pairs Bar for Active Category */}
      {quickPairs.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] shrink-0 mr-1">
            Standard Pairs:
          </span>
          {quickPairs.map((pair) => {
            const isPairSelected =
              (converter.fromUnit === pair.from && converter.toUnit === pair.to) ||
              (converter.fromUnit === pair.to && converter.toUnit === pair.from);

            return (
              <button
                key={pair.label}
                type="button"
                onClick={() => handleApplyQuickPair(pair)}
                className={`min-h-[32px] px-2.5 py-1 text-[11px] font-mono rounded-lg border whitespace-nowrap transition-all cursor-pointer btn-tactile ${
                  isPairSelected
                    ? 'bg-[var(--md-sys-color-primary)] text-white border-transparent font-bold shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                }`}
                title={pair.title || `Switch units to ${pair.label}`}
              >
                {pair.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Conversion Direction: Source Unit (From) ⇄ Swap Button ⇄ Target Unit (To) */}
      <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
          {/* Source Unit (From) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                Source Unit (From)
              </label>
              {fromUnitObj && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] font-bold">
                  {fromUnitObj.symbol}
                </span>
              )}
            </div>
            <select
              value={converter.fromUnit}
              onChange={(e) => {
                const val = e.target.value;
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, fromUnit: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
            >
              {availableCategoryUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol}) {u.isRegional ? '★ Regional' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dedicated Central Swap Button */}
          <div className="flex items-center justify-center shrink-0 self-center sm:self-end sm:pb-0.5">
            <button
              type="button"
              onClick={() => handleSwapUnits(false)}
              className={`min-h-[48px] min-w-[48px] px-3.5 sm:px-3 rounded-xl border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] hover:bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary-container)] hover:text-white transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5 font-bold text-xs btn-tactile group ${
                isSwapping ? 'ring-2 ring-[var(--md-sys-color-primary)]' : ''
              }`}
              title={`Swap 'From' (${fromUnitObj?.symbol || converter.fromUnit}) and 'To' (${toUnitObj?.symbol || converter.toUnit})`}
              aria-label="Swap from and to units"
            >
              <ArrowRightLeft
                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                  isSwapping ? 'rotate-180 scale-125' : 'group-hover:rotate-180'
                }`}
              />
              <span className="sm:hidden font-mono">Swap (⇄)</span>
            </button>
          </div>

          {/* Target Unit (To) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                Target Unit (To)
              </label>
              {toUnitObj && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] font-bold">
                  {toUnitObj.symbol}
                </span>
              )}
            </div>
            <select
              value={converter.toUnit}
              onChange={(e) => {
                const val = e.target.value;
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
            >
              {availableCategoryUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol}) {u.isRegional ? '★ Regional' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Feedback Badge & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/60 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface-variant)] text-[11px]">
            {lastSwapNotice ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{lastSwapNotice}</span>
              </span>
            ) : (
              <span>
                Active Conversion: <strong>{fromUnitObj?.symbol || converter.fromUnit}</strong> → <strong>{toUnitObj?.symbol || converter.toUnit}</strong>
              </span>
            )}
          </div>

          {/* Action Buttons: Explain Conversion & Smart Swap */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExplainModalOpen(true)}
              className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono font-bold rounded-md border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/50 hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] transition-colors cursor-pointer inline-flex items-center gap-1.5 btn-tactile shadow-xs"
              title="Open step-by-step mathematical conversion logic and custom unit factors"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Explain Conversion</span>
            </button>

            {currentConvertedValue !== null && (
              <button
                type="button"
                onClick={() => handleSwapUnits(true)}
                className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono font-bold rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] transition-colors cursor-pointer inline-flex items-center gap-1 btn-tactile"
                title="Swap units AND set the converted result as the new input value for reverse calculation"
              >
                <RefreshCw className="w-3 h-3 shrink-0" />
                <span>Swap with Converted Value ({formatSmartNumber(currentConvertedValue, 4)} {toUnitObj?.symbol || converter.toUnit})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Input Numeric Value with Quick Value Chips & Real-time Auto-formatting */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
          <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
            Input Numeric Value ({fromUnitObj?.symbol || converter.fromUnit})
          </label>
          {/* Quick value presets */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Quick:
            </span>
            {[1, 10, 50, 100, 1000].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setDisplayInputString(formatNumberWhileTyping(String(num)).formatted);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    converter: { ...ws.converter, inputValue: num },
                  }));
                }}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                  converter.inputValue === num
                    ? 'bg-[var(--md-sys-color-primary)] text-white border-transparent font-bold'
                    : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                {num.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          inputMode="decimal"
          value={displayInputString}
          onChange={(e) => handleNumericInputChange(e.target.value)}
          placeholder="Enter numeric value or arithmetic expression (e.g. 2,500.50 or 250 / 2)"
          className="w-full min-h-[48px] touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-base bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
        />
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 flex items-center justify-between">
          <span>Real-time thousand separators active. Mathematical expressions supported.</span>
          <span>SI Base: <strong>{BASE_UNITS[currentCategory]}</strong></span>
        </div>
      </div>

      {/* Regional Land Measurement Multi-Unit Matrix (Active when category === 'area') */}
      {currentCategory === 'area' && landBreakdown && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📐</span>
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                South Asian & Regional Land Equivalence Matrix
              </label>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
              100 Decimals = 1 Acre = 43,560 sq ft
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs font-mono">
            {/* Decimal */}
            <div
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: 'decimal' },
                }));
              }}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                converter.toUnit === 'decimal' || converter.fromUnit === 'decimal'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 font-bold ring-1 ring-emerald-500'
                  : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400'
              }`}
              title="Click to set Decimal as target unit (1 Decimal = 435.6 sq ft = 40.469 m²)"
            >
              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Decimal / Shatak</span>
                <span className="text-[9px] uppercase opacity-75">1/100 Ac</span>
              </div>
              <div className="text-sm font-bold mt-0.5 text-emerald-700 dark:text-emerald-300 truncate">
                {formatSmartNumber(landBreakdown.decimals, 4)} <span className="text-[10px] font-normal">dec</span>
              </div>
            </div>

            {/* Katha */}
            <div
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: 'katha' },
                }));
              }}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                converter.toUnit === 'katha' || converter.fromUnit === 'katha'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 font-bold ring-1 ring-emerald-500'
                  : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400'
              }`}
              title="Click to set Katha as target unit (1 Katha = 720 sq ft = 1.65289 Decimals = 66.89 m²)"
            >
              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Katha (Bengal)</span>
                <span className="text-[9px] uppercase opacity-75">720 sq ft</span>
              </div>
              <div className="text-sm font-bold mt-0.5 text-emerald-700 dark:text-emerald-300 truncate">
                {formatSmartNumber(landBreakdown.katha, 4)} <span className="text-[10px] font-normal">katha</span>
              </div>
            </div>

            {/* Bigha */}
            <div
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: 'bigha' },
                }));
              }}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                converter.toUnit === 'bigha' || converter.fromUnit === 'bigha'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 font-bold ring-1 ring-emerald-500'
                  : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400'
              }`}
              title="Click to set Bigha as target unit (1 Bigha = 20 Katha = 14,400 sq ft = 33.058 Decimals)"
            >
              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Bigha (Standard)</span>
                <span className="text-[9px] uppercase opacity-75">20 Katha</span>
              </div>
              <div className="text-sm font-bold mt-0.5 text-emerald-700 dark:text-emerald-300 truncate">
                {formatSmartNumber(landBreakdown.bigha, 4)} <span className="text-[10px] font-normal">bigha</span>
              </div>
            </div>

            {/* Acre */}
            <div
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: 'acre' },
                }));
              }}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                converter.toUnit === 'acre' || converter.fromUnit === 'acre'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 font-bold ring-1 ring-emerald-500'
                  : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400'
              }`}
              title="Click to set Acre as target unit (1 Acre = 43,560 sq ft = 100 Decimals = 60.5 Katha)"
            >
              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>International Acre</span>
                <span className="text-[9px] uppercase opacity-75">43,560 sq ft</span>
              </div>
              <div className="text-sm font-bold mt-0.5 text-emerald-700 dark:text-emerald-300 truncate">
                {formatSmartNumber(landBreakdown.acres, 5)} <span className="text-[10px] font-normal">acre</span>
              </div>
            </div>

            {/* Hectare */}
            <div
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: 'hectare' },
                }));
              }}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                converter.toUnit === 'hectare' || converter.fromUnit === 'hectare'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 font-bold ring-1 ring-emerald-500'
                  : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400'
              }`}
              title="Click to set Hectare as target unit (1 Hectare = 10,000 m² = 2.471 Acres)"
            >
              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Hectare (Metric)</span>
                <span className="text-[9px] uppercase opacity-75">10,000 m²</span>
              </div>
              <div className="text-sm font-bold mt-0.5 text-emerald-700 dark:text-emerald-300 truncate">
                {formatSmartNumber(landBreakdown.hectares, 5)} <span className="text-[10px] font-normal">ha</span>
              </div>
            </div>

            {/* Cent */}
            <div
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: 'cent' },
                }));
              }}
              className="p-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400 transition-all cursor-pointer"
              title="Click to set Cent as target unit (South India, 435.6 sq ft = 1 Decimal)"
            >
              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Cent (South India)</span>
                <span className="text-[9px] uppercase opacity-75">435.6 sq ft</span>
              </div>
              <div className="text-sm font-bold mt-0.5 text-[var(--md-sys-color-on-surface)] truncate">
                {formatSmartNumber(landBreakdown.cents, 4)} <span className="text-[10px] font-normal">cent</span>
              </div>
            </div>

            {/* Guntha */}
            <div
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: 'guntha' },
                }));
              }}
              className="p-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400 transition-all cursor-pointer"
              title="Click to set Guntha as target unit (Maharashtra/Gujarat, 1,089 sq ft = 33 ft × 33 ft)"
            >
              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Guntha (West)</span>
                <span className="text-[9px] uppercase opacity-75">1,089 sq ft</span>
              </div>
              <div className="text-sm font-bold mt-0.5 text-[var(--md-sys-color-on-surface)] truncate">
                {formatSmartNumber(landBreakdown.gunthas, 4)} <span className="text-[10px] font-normal">guntha</span>
              </div>
            </div>

            {/* Ground */}
            <div
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: 'ground' },
                }));
              }}
              className="p-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400 transition-all cursor-pointer"
              title="Click to set Ground as target unit (Tamil Nadu, 2,400 sq ft)"
            >
              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Ground (Chennai)</span>
                <span className="text-[9px] uppercase opacity-75">2,400 sq ft</span>
              </div>
              <div className="text-sm font-bold mt-0.5 text-[var(--md-sys-color-on-surface)] truncate">
                {formatSmartNumber(landBreakdown.grounds, 4)} <span className="text-[10px] font-normal">ground</span>
              </div>
            </div>

            {/* Square Feet */}
            <div
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: 'ft2' },
                }));
              }}
              className="p-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400 transition-all cursor-pointer"
              title="Click to set Square Feet as target unit"
            >
              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Square Feet (SFT)</span>
                <span className="text-[9px] uppercase opacity-75">ft²</span>
              </div>
              <div className="text-sm font-bold mt-0.5 text-[var(--md-sys-color-on-surface)] truncate">
                {formatSmartNumber(landBreakdown.squareFeet, 2)} <span className="text-[10px] font-normal">sft</span>
              </div>
            </div>

            {/* Square Meters */}
            <div
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, toUnit: 'm2' },
                }));
              }}
              className="p-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-emerald-400 transition-all cursor-pointer"
              title="Click to set Square Meters as target unit"
            >
              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Square Meters</span>
                <span className="text-[9px] uppercase opacity-75">SI m²</span>
              </div>
              <div className="text-sm font-bold mt-0.5 text-[var(--md-sys-color-on-surface)] truncate">
                {formatSmartNumber(landBreakdown.squareMeters, 3)} <span className="text-[10px] font-normal">m²</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Architectural Feet-Inch String Parser Card */}
      <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📏</span>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
              Architectural Feet-Inch & Fraction Parser
            </label>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mr-1">
              Presets:
            </span>
            {[
              { label: "12'-6 1/2\"", val: "12'-6 1/2\"" },
              { label: "25'-0\"", val: "25'-0\"" },
              { label: "9'-4 3/4\"", val: "9'-4 3/4\"" },
              { label: '3500mm', val: '3500mm' },
              { label: '2.45m', val: '2.45m' },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    converter: { ...ws.converter, feetInchRawString: p.val },
                  }));
                }}
                className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="e.g. 14'-6 3/4&quot;, 12 ft 4 in, 3/4&quot;, 3810mm, or 3.81m"
            value={converter.feetInchRawString}
            onChange={(e) => {
              const str = e.target.value;
              updateActiveWorkspace((ws) => ({
                ...ws,
                converter: { ...ws.converter, feetInchRawString: str },
              }));
            }}
            className="w-full min-h-[48px] touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
          />
          {converter.feetInchRawString && (
            <button
              type="button"
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  converter: { ...ws.converter, feetInchRawString: '' },
                }));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {activeFeetInchResult.isValid ? (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                  Architectural Standard
                </span>
                <strong className="text-sm text-[var(--md-sys-color-primary)] truncate block">
                  {activeFeetInchResult.fractionString || activeFeetInchResult.normalizedString}
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                  Decimal Feet
                </span>
                <strong className="text-sm truncate block">
                  {formatSmartNumber(activeFeetInchResult.totalFeet, 4)} ft
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                  Metric (Meters)
                </span>
                <strong className="text-sm text-emerald-600 dark:text-emerald-400 truncate block">
                  {formatSmartNumber(activeFeetInchResult.totalMeters, 4)} m
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">
                  Millimeters (mm)
                </span>
                <strong className="text-sm truncate block">
                  {formatSmartNumber(activeFeetInchResult.totalMm, 1)} mm
                </strong>
              </div>
            </div>

            {/* Transfer to Main Converter Input Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Fraction: {activeFeetInchResult.fractionString || `${activeFeetInchResult.totalInches.toFixed(2)}"`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const feetVal = parseFloat(activeFeetInchResult.totalFeet.toFixed(4));
                    setDisplayInputString(formatNumberWhileTyping(String(feetVal)).formatted);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      converter: {
                        ...ws.converter,
                        category: 'length',
                        fromUnit: 'ft',
                        inputValue: feetVal,
                      },
                    }));
                  }}
                  className="px-2 py-1 text-[11px] font-mono rounded bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-primary)] cursor-pointer font-bold"
                  title="Load parsed feet into main converter input"
                >
                  Apply {activeFeetInchResult.totalFeet.toFixed(3)} ft to Input
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const metersVal = parseFloat(activeFeetInchResult.totalMeters.toFixed(4));
                    setDisplayInputString(formatNumberWhileTyping(String(metersVal)).formatted);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      converter: {
                        ...ws.converter,
                        category: 'length',
                        fromUnit: 'm',
                        inputValue: metersVal,
                      },
                    }));
                  }}
                  className="px-2 py-1 text-[11px] font-mono rounded bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-white transition-colors cursor-pointer font-bold"
                  title="Load parsed meters into main converter input"
                >
                  Apply {activeFeetInchResult.totalMeters.toFixed(3)} m to Input
                </button>
              </div>
            </div>
          </div>
        ) : (
          converter.feetInchRawString && (
            <div className="text-xs font-mono text-amber-600 dark:text-amber-400 pt-0.5">
              ⚠️ {activeFeetInchResult.errorMessage || 'Unable to parse architectural string. Try format: 12\'-6 1/2" or 3500mm'}
            </div>
          )
        )}
      </div>

      {/* Step-by-Step Conversion Logic & Custom Unit Factor Proof Modal */}
      <ExplainConversionModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        inputValue={converter.inputValue}
        fromUnitId={converter.fromUnit}
        toUnitId={converter.toUnit}
        category={converter.category}
        customUnits={customUnits}
        onSwapUnits={() => handleSwapUnits(false)}
        onOpenCustomUnitsModal={onOpenCustomUnitsModal}
      />
    </div>
  );
};

export interface UnitConverterMetricsProps {
  inputValue: number;
  fromUnit: string;
  toUnit: string;
  category: UnitCategoryKey;
  conversionResult: {
    result: number;
    formula: string;
  };
  customUnits?: CustomUnitDefinition[];
  onSwapUnits?: () => void;
  onSwapWithResult?: () => void;
  onOpenCustomUnitsModal?: () => void;
}

export const UnitConverterMetrics: React.FC<UnitConverterMetricsProps> = ({
  inputValue,
  fromUnit,
  toUnit,
  category,
  conversionResult,
  customUnits = [],
  onSwapUnits,
  onSwapWithResult,
  onOpenCustomUnitsModal,
}) => {
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Source Value</div>
          <div className="text-xl font-bold font-mono mt-0.5">
            {formatSmartNumber(inputValue)} <span className="text-xs font-normal">{fromUnit}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Converted Value</div>
          <div className="text-xl font-bold font-mono mt-0.5 text-[var(--md-sys-color-primary)]">
            {formatSmartNumber(conversionResult.result, 6)} <span className="text-xs font-normal">{toUnit}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
            <span>Conversion Formula</span>
            <button
              type="button"
              onClick={() => setIsExplainModalOpen(true)}
              className="text-[10px] font-bold text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              title="Explain step-by-step conversion logic using stored custom unit factors"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Explain</span>
            </button>
          </div>
          <div className="text-xs font-mono mt-1 opacity-90 truncate">{conversionResult.formula}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Base SI Unit</div>
          <div className="text-xs font-mono font-bold mt-1">{BASE_UNITS[category]}</div>
        </div>
      </div>

      {/* Quick Swap & Explain Conversion Action Bar in Analytical Stage */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/50 no-print">
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          Audit & Reverse Calculations:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExplainModalOpen(true)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 btn-tactile font-bold shadow-xs"
            title="Explain step-by-step conversion logic using stored custom unit factors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Explain Conversion</span>
          </button>
          {onSwapUnits && (
            <button
              type="button"
              onClick={onSwapUnits}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer flex items-center gap-1.5 btn-tactile"
              title={`Swap ${fromUnit} ⇄ ${toUnit}`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Swap ({toUnit} ⇄ {fromUnit})</span>
            </button>
          )}
          {onSwapWithResult && (
            <button
              type="button"
              onClick={onSwapWithResult}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all cursor-pointer flex items-center gap-1.5 btn-tactile"
              title="Swap units and set input to current converted result"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Swap & Invert ({formatSmartNumber(conversionResult.result, 4)} {toUnit})</span>
            </button>
          )}
        </div>
      </div>

      {/* Step-by-Step Conversion Logic & Custom Unit Factor Proof Modal */}
      <ExplainConversionModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        inputValue={inputValue}
        fromUnitId={fromUnit}
        toUnitId={toUnit}
        category={category}
        customUnits={customUnits}
        onSwapUnits={onSwapUnits}
        onOpenCustomUnitsModal={onOpenCustomUnitsModal}
      />
    </div>
  );
};
