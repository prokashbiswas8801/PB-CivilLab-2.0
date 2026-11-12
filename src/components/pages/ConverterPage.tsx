import React, { useState, useMemo } from 'react';
import {
  ArrowRightLeft,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Maximize2,
  Compass,
  Boxes,
  Gauge,
  Scale,
  Hash,
  Info,
  ChevronRight,
  TrendingUp,
  Ruler,
  BookOpen,
} from 'lucide-react';
import { useCivilLab } from '../../context/CivilLabContext';
import { AddToHistoryButton } from '../ui/AddToHistoryButton';
import { AboutThisTool, AboutThisToolButton } from '../ui';
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
  parseFeetInchString,
  formatSmartNumber,
} from '../../utils/unitConverter';
import {
  UnitConverterInputs,
  UnitConverterMetrics,
} from '../modules/UnitConverterModule';

export interface ConverterPageProps {
  activeWorkspace?: CivilWorkspace;
  updateActiveWorkspace?: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits?: CustomUnitDefinition[];
  onOpenCustomUnitsModal?: () => void;
}

// Default fallback workspace if ConverterPage is rendered outside App.tsx workspace provider
const DEFAULT_FALLBACK_WORKSPACE: CivilWorkspace = {
  id: 'default',
  name: 'Default Workspace',
  unitSystem: 'metric',
  converter: {
    category: 'area',
    fromUnit: 'katha',
    toUnit: 'ft2',
    inputValue: 1,
    feetInchRawString: "12'-6 1/2\"",
    regionalLandPreset: 'standard',
  },
} as unknown as CivilWorkspace;

export const ConverterPage: React.FC<ConverterPageProps> = ({
  activeWorkspace: externalWorkspace,
  updateActiveWorkspace: externalUpdateWorkspace,
  customUnits = [],
  onOpenCustomUnitsModal = () => {},
}) => {
  const { userProfile, addSavedHistoryItem } = useCivilLab();

  // Local fallback workspace state if not provided via props
  const [localWorkspace, setLocalWorkspace] = useState<CivilWorkspace>(DEFAULT_FALLBACK_WORKSPACE);

  const activeWorkspace = externalWorkspace || localWorkspace;
  const updateActiveWorkspace = externalUpdateWorkspace || setLocalWorkspace;

  const converter = activeWorkspace.converter;
  const currentCategory = converter.category;

  // Active category unit list
  const availableCategoryUnits = useMemo(() => {
    const std = STANDARD_UNITS[currentCategory] || [];
    const customs = customUnits
      .filter((u) => u.category === currentCategory)
      .map((u) => ({
        id: u.id,
        name: `${u.name} (Custom)`,
        symbol: u.symbol,
        isRegional: false,
      }));
    return [...std, ...customs];
  }, [currentCategory, customUnits]);

  // Active Feet-Inch Parse result
  const activeFeetInchResult = useMemo(() => {
    return parseFeetInchString(converter.feetInchRawString || '');
  }, [converter.feetInchRawString]);

  // Conversion result
  const activeConversionResult = useMemo(() => {
    try {
      const result = convertDirect(
        converter.inputValue,
        converter.fromUnit,
        converter.toUnit,
        converter.category,
        customUnits
      );
      const formula = `1 ${converter.fromUnit} → ${converter.toUnit}`;
      return { result, formula };
    } catch {
      return { result: 0, formula: 'Error' };
    }
  }, [
    converter.inputValue,
    converter.fromUnit,
    converter.toUnit,
    converter.category,
    customUnits,
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Banner */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-bold text-lg">
              📐
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                Universal Civil Engineering Unit Converter
              </h1>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                All 21 Disciplines • BNBC-2020 & Regional Standards • Exact Fractional SI / Imperial / Bangladesh Land Matrices
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AddToHistoryButton
            item={{
              type: 'conversion',
              title: `${converter.inputValue} ${converter.fromUnit} → ${formatSmartNumber(activeConversionResult.result, 4)} ${converter.toUnit}`,
              moduleId: `converter-${converter.category}`,
              summary: `${converter.inputValue} ${converter.fromUnit} = ${formatSmartNumber(activeConversionResult.result, 6)} ${converter.toUnit} in ${converter.category}`,
              status: 'valid',
              keyMetrics: [
                { label: 'Category', value: converter.category },
                { label: 'Input Value', value: `${converter.inputValue} ${converter.fromUnit}` },
                { label: 'Result', value: `${formatSmartNumber(activeConversionResult.result, 4)} ${converter.toUnit}` },
                { label: 'Base Unit', value: BASE_UNITS[converter.category] },
              ],
              inputs: {
                inputValue: converter.inputValue,
                fromUnit: converter.fromUnit,
                toUnit: converter.toUnit,
                category: converter.category,
              },
              results: {
                result: activeConversionResult.result,
                formula: activeConversionResult.formula,
              },
              tags: ['unit-converter', converter.category, 'engineering-conversion'],
            }}
            label="Save to History"
          />
          <AboutThisToolButton toolId="unit-converter" targetId="converter-about-section" />
        </div>
      </div>

      {/* Main Core Converter Interface */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
        <UnitConverterInputs
          activeWorkspace={activeWorkspace}
          updateActiveWorkspace={updateActiveWorkspace}
          customUnits={customUnits}
          availableCategoryUnits={availableCategoryUnits}
          activeFeetInchResult={activeFeetInchResult}
          onOpenCustomUnitsModal={onOpenCustomUnitsModal}
          conversionResult={activeConversionResult}
        />

        <UnitConverterMetrics
          inputValue={converter.inputValue}
          fromUnit={converter.fromUnit}
          toUnit={converter.toUnit}
          category={converter.category}
          conversionResult={activeConversionResult}
          customUnits={customUnits}
          onSwapUnits={() => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              converter: {
                ...ws.converter,
                fromUnit: ws.converter.toUnit,
                toUnit: ws.converter.fromUnit,
              },
            }));
          }}
          onSwapWithResult={() => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              converter: {
                ...ws.converter,
                fromUnit: ws.converter.toUnit,
                toUnit: ws.converter.fromUnit,
                inputValue: parseFloat(activeConversionResult.result.toFixed(6)),
              },
            }));
          }}
          onOpenCustomUnitsModal={onOpenCustomUnitsModal}
        />
      </div>

      {/* Quick Reference Engineering Conversion Tables & Practical Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Bangladesh Land Equivalence */}
        <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🌾</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
              Bangladesh Land Standards
            </h3>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">1 Decimal (শতক):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">435.6 sft (40.47 m²)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">1 Katha (কাঠা, Std):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">720 sft (1.65 Dec)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">1 Bigha (বিঘা):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">14,400 sft (20 Katha)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">1 Acre (একর):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">43,560 sft (100 Dec)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">1 Kani (কানি):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">17,280 sft (20 Ganda)</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">1 Hectare (হেক্টর):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">10,000 m² (2.471 Ac)</strong>
            </div>
          </div>
        </div>

        {/* Card 2: BNBC-2020 Rebar Unit Weights */}
        <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🔩</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
              Rebar Standard Weight (d²/162.2)
            </h3>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">8mm (#2.5, 2.5 সুতা):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">0.395 kg/m (0.120 kg/ft)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">10mm (#3, 3 সুতা):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">0.617 kg/m (0.188 kg/ft)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">12mm (#4, 4 সুতা):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">0.888 kg/m (0.271 kg/ft)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">16mm (#5, 5 সুতা):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">1.578 kg/m (0.481 kg/ft)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">20mm (#6, 6 সুতা):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">2.466 kg/m (0.752 kg/ft)</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">25mm (#8, 8 সুতা):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">3.853 kg/m (1.174 kg/ft)</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Construction Materials Bulk Density */}
        <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🏗️</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
              Material Densities & Capacities
            </h3>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">1 Bag Cement (50kg):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">1.226 CFT (0.0347 m³)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Cement Bulk Density:</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">1,440 kg/m³ (90 pcf)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Plain Concrete (PCC):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">24 kN/m³ (145 pcf)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Reinforced Concrete (RCC):</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">25 kN/m³ (150 pcf)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Structural Steel:</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">78.5 kN/m³ (7,850 kg/m³)</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">1 Brass Quarry Material:</span>
              <strong className="text-[var(--md-sys-color-on-surface)]">100 CFT (2.83 m³)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable About This Tool Section */}
      <AboutThisTool
        toolId="unit-converter"
        id="converter-about-section"
        defaultExpanded={false}
      />
    </div>
  );
};
