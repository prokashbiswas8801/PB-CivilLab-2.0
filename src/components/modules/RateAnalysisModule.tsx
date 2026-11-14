import React, { useState } from 'react';
import {
  Calculator,
  ArrowRight,
  TrendingUp,
  Percent,
  Sliders,
  DollarSign,
  Layers,
  Wrench,
  Users,
  HardHat,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  CivilWorkspace,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  RateAnalysisWorkType,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { getCurrencySymbol, RateAnalysisResult } from '../../utils/calculations';
import { RATE_ANALYSIS_TRADE_PRESETS } from '../../utils/rateResolver';
import { MasterMarketRatesPanel } from './MasterMarketRatesPanel';
import { UnitInput } from '../UnitInput';

export interface RateAnalysisInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
  onApplyRateToBOQ: () => void;
}

export const RateAnalysisInputs: React.FC<RateAnalysisInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
  onApplyRateToBOQ,
}) => {
  const [showAdvancedIndices, setShowAdvancedIndices] = useState(false);

  const localCostIndex = activeWorkspace.rateAnalysis.localCostIndex ?? 1.0;
  const materialCostIndex = activeWorkspace.rateAnalysis.materialCostIndex ?? 1.0;
  const laborCostIndex = activeWorkspace.rateAnalysis.laborCostIndex ?? 1.0;
  const equipmentCostIndex = activeWorkspace.rateAnalysis.equipmentCostIndex ?? 1.0;

  const costIndexPresets = [
    { label: 'Base Schedule', value: 1.00, hint: 'PWD / CPWD standard schedule base rates (1.00x)' },
    { label: 'Metro / Urban (+15%)', value: 1.15, hint: 'Metropolitan logistical overhead & high-density transport (+15%)' },
    { label: 'Remote Site (+25%)', value: 1.25, hint: 'Remote haulage, hill-tracts, or island site logistics (+25%)' },
    { label: 'Peak Inflation (+40%)', value: 1.40, hint: 'High material price volatility & sudden commodity surge (+40%)' },
    { label: 'Bulk Discount (-10%)', value: 0.90, hint: 'Large volume developer procurement discount (-10%)' },
  ];

  const currentWorkType = activeWorkspace.rateAnalysis.workType;
  const activePreset = RATE_ANALYSIS_TRADE_PRESETS.find((p) => p.workType === currentWorkType);

  return (
    <div className="space-y-4">
      {/* Synchronized Master Market Material & Labor Rates Drawer */}
      <MasterMarketRatesPanel
        activeWorkspace={activeWorkspace}
        updateActiveWorkspace={updateActiveWorkspace}
        currency={activeWorkspace.rateAnalysis.currency}
      />

      {/* Engineering Trade Work Type & PWD/LGED Presets */}
      <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
            <Calculator className="w-4 h-4" />
            <span>Engineering Trade Work Type</span>
          </label>
          <span className="text-xs font-mono tabular-nums font-bold text-[var(--md-sys-color-on-surface)]">
            {getCurrencySymbol(activeWorkspace.rateAnalysis.currency)} ({activeWorkspace.rateAnalysis.currency})
          </span>
        </div>

        <select
          value={currentWorkType}
          onChange={(e) => {
            const wt = e.target.value as RateAnalysisWorkType;
            const preset = RATE_ANALYSIS_TRADE_PRESETS.find((p) => p.workType === wt);
            updateActiveWorkspace((ws) => ({
              ...ws,
              rateAnalysis: {
                ...ws.rateAnalysis,
                workType: wt,
                ...(preset
                  ? {
                      rebarAllowanceKgPerM3: preset.rebarAllowanceKgPerM3,
                      admixtureDoseKgPerM3: preset.admixtureDoseKgPerM3,
                      masonDaysRequired: preset.masonDaysRequired,
                      laborerDaysRequired: preset.laborerDaysRequired,
                      barBenderDaysRequired: preset.barBenderDaysRequired,
                      mixerHirePerM3: preset.mixerHirePerM3,
                      vibratorHirePerM3: preset.vibratorHirePerM3,
                      shutteringScaffoldingPerM3: preset.shutteringScaffoldingPerM3,
                      wastagePercent: preset.wastagePercent,
                      waterElectricityPercent: preset.waterElectricityPercent,
                    }
                  : {}),
              },
            }));
          }}
          className="w-full min-h-[48px] touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono font-bold text-[var(--md-sys-color-on-surface)] focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
        >
          <option value="rcc-1-1.5-3">RCC Structural Concrete (1:1.5:3, Column/Beam) with Rebar & Shuttering</option>
          <option value="rcc-1-2-4">RCC Structural Concrete (1:2:4, Slab/Footing) with Reinforcement</option>
          <option value="pcc-1-3-6">PCC Foundation Bed Lean Concrete (1:3:6) with Brick Khoa</option>
          <option value="brickwork-125mm-1-4">125mm (5&quot;) Brick Partition Wall in 1:4 Cement-Sand Mortar (per m²)</option>
          <option value="brickwork-1-6">250mm (10&quot;) First-Class Brick Masonry in 1:6 Mortar (per m³)</option>
          <option value="plaster-1-4">12mm Wall Cement Plastering in 1:4 Mortar (per m³ Mortar)</option>
          <option value="patent-stone-1-2-4">1:2:4 Patent Stone / Floor Screed with Neat Cement Finish</option>
          <option value="rebar-fabrication">Rebar Cutting, Bending & Placing Fabrication (1 Metric Ton)</option>
        </select>

        {/* PWD / LGED Trade Presets Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
            <span>PWD / LGED Trade Presets (Crew + Plant)</span>
            {activePreset && (
              <span className="text-[var(--md-sys-color-primary)] font-semibold truncate max-w-[60%]">
                {activePreset.shortTag}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-1.5">
            {RATE_ANALYSIS_TRADE_PRESETS.map((preset) => {
              const isActive = currentWorkType === preset.workType;
              return (
                <button
                  key={preset.workType}
                  type="button"
                  onClick={() => {
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      rateAnalysis: {
                        ...ws.rateAnalysis,
                        workType: preset.workType,
                        basisVolumeM3: preset.basisVolumeM3,
                        rebarAllowanceKgPerM3: preset.rebarAllowanceKgPerM3,
                        admixtureDoseKgPerM3: preset.admixtureDoseKgPerM3,
                        masonDaysRequired: preset.masonDaysRequired,
                        laborerDaysRequired: preset.laborerDaysRequired,
                        barBenderDaysRequired: preset.barBenderDaysRequired,
                        mixerHirePerM3: preset.mixerHirePerM3,
                        vibratorHirePerM3: preset.vibratorHirePerM3,
                        shutteringScaffoldingPerM3: preset.shutteringScaffoldingPerM3,
                        wastagePercent: preset.wastagePercent,
                        waterElectricityPercent: preset.waterElectricityPercent,
                      },
                    }));
                  }}
                  title={preset.codeNote}
                  className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)] font-bold'
                      : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <div className="text-[11px] leading-tight truncate">{preset.label}</div>
                  <div className={`text-[9.5px] font-mono mt-0.5 truncate ${isActive ? 'opacity-90' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}>
                    {preset.shortTag}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            {currentWorkType === 'brickwork-125mm-1-4' || currentWorkType === 'rebar-fabrication' ? (
              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  {currentWorkType === 'brickwork-125mm-1-4' ? 'Analysis Basis Area (m²)' : 'Analysis Basis Mass (Metric Ton)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={activeWorkspace.rateAnalysis.basisVolumeM3}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      rateAnalysis: { ...ws.rateAnalysis, basisVolumeM3: Number.isFinite(val) && val >= 0 ? val : 0 },
                    }));
                  }}
                  className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
                />
              </div>
            ) : (
              <UnitInput
                label="Basis Volume"
                category="volume"
                siValue={activeWorkspace.rateAnalysis.basisVolumeM3}
                onChangeSI={(val) => {
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    rateAnalysis: { ...ws.rateAnalysis, basisVolumeM3: val },
                  }));
                }}
                currentUnitId={getFieldUnit('rate.vol', 'volume', 'm3')}
                onUnitChange={(u) => updateFieldUnit('rate.vol', u)}
                customUnits={customUnits}
                step={0.5}
                min={0}
              />
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
              Project Currency Code
            </label>
            <select
              value={activeWorkspace.rateAnalysis.currency}
              onChange={(e) => {
                const curr = e.target.value as CurrencyCode;
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  currency: curr,
                  boq: { ...ws.boq, currency: curr },
                  rateAnalysis: { ...ws.rateAnalysis, currency: curr },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Local Material Cost Index (LMCI) Controller */}
      <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)]/60 border border-[var(--md-sys-color-outline-variant)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
              Local Material Cost Index (LMCI)
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
            {localCostIndex.toFixed(2)}x {localCostIndex !== 1.0 ? `(${localCostIndex > 1.0 ? '+' : ''}${((localCostIndex - 1) * 100).toFixed(0)}%)` : 'Baseline'}
          </span>
        </div>

        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-snug">
          Adjustable regional inflation multiplier applied dynamically across all materials, labor wages, and plant hire to match real-time site procurement indices.
        </p>

        {/* Preset index buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] shrink-0">
            Presets:
          </span>
          {costIndexPresets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: {
                    ...ws.rateAnalysis,
                    localCostIndex: p.value,
                  },
                }));
              }}
              title={p.hint}
              className={`px-2 py-1 text-[10.5px] font-mono rounded-md border transition-colors cursor-pointer ${
                Math.abs(localCostIndex - p.value) < 0.001
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)] font-bold shadow-xs'
                  : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Slider & manual input */}
        <div className="flex items-center gap-3 pt-1">
          <input
            type="range"
            min="0.50"
            max="2.50"
            step="0.05"
            value={localCostIndex}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                rateAnalysis: { ...ws.rateAnalysis, localCostIndex: val },
              }));
            }}
            className="flex-1 accent-[var(--md-sys-color-primary)] cursor-pointer"
          />
          <div className="w-24 shrink-0">
            <input
              type="number"
              step="0.01"
              min="0.20"
              max="5.00"
              value={localCostIndex}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, localCostIndex: val },
                }));
              }}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono font-bold text-center"
            />
          </div>
          {localCostIndex !== 1.0 && (
            <button
              type="button"
              onClick={() => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: {
                    ...ws.rateAnalysis,
                    localCostIndex: 1.0,
                    materialCostIndex: 1.0,
                    laborCostIndex: 1.0,
                    equipmentCostIndex: 1.0,
                  },
                }));
              }}
              title="Reset to 1.00x baseline"
              className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Toggle Advanced Component Indices */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvancedIndices(!showAdvancedIndices)}
            className="text-[11px] font-mono text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>{showAdvancedIndices ? 'Hide granular component indices' : 'Customize individual Material / Labor / Equipment indices'}</span>
          </button>
        </div>

        {showAdvancedIndices && (
          <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono pt-2">
            <div>
              <label className="block text-[10px] uppercase text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Material Index ({materialCostIndex.toFixed(2)}x)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="3.0"
                value={materialCostIndex}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    rateAnalysis: { ...ws.rateAnalysis, materialCostIndex: val },
                  }));
                }}
                className="w-full touch-target-48 px-2 rounded border border-[var(--md-sys-color-outline)] text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Labor Index ({laborCostIndex.toFixed(2)}x)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="3.0"
                value={laborCostIndex}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    rateAnalysis: { ...ws.rateAnalysis, laborCostIndex: val },
                  }));
                }}
                className="w-full touch-target-48 px-2 rounded border border-[var(--md-sys-color-outline)] text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Plant/Hire Index ({equipmentCostIndex.toFixed(2)}x)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="3.0"
                value={equipmentCostIndex}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    rateAnalysis: { ...ws.rateAnalysis, equipmentCostIndex: val },
                  }));
                }}
                className="w-full touch-target-48 px-2 rounded border border-[var(--md-sys-color-outline)] text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Material Market Rates */}
      <div className="space-y-2 p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>Base Material Market Procurement Rates</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                Cement ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/50kg bag)
              </label>
              {activeWorkspace.rateAnalysis.cementPricePerBag === 0 && (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                  0 ACTIVE
                </span>
              )}
            </div>
            <input
              type="number"
              step="any"
              min="0"
              value={activeWorkspace.rateAnalysis.cementPricePerBag}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, cementPricePerBag: isNaN(val) ? 0 : val },
                }));
              }}
              className={`w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border font-mono text-xs bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] ${
                activeWorkspace.rateAnalysis.cementPricePerBag === 0
                  ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                  : 'border-[var(--md-sys-color-outline)]'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                Coarse Sand ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)
              </label>
              {activeWorkspace.rateAnalysis.sandPricePerM3 === 0 && (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                  0 ACTIVE
                </span>
              )}
            </div>
            <input
              type="number"
              step="any"
              min="0"
              value={activeWorkspace.rateAnalysis.sandPricePerM3}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, sandPricePerM3: isNaN(val) ? 0 : val },
                }));
              }}
              className={`w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border font-mono text-xs bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] ${
                activeWorkspace.rateAnalysis.sandPricePerM3 === 0
                  ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                  : 'border-[var(--md-sys-color-outline)]'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                Stone Chips ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)
              </label>
              {activeWorkspace.rateAnalysis.stoneChipsPricePerM3 === 0 && (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                  0 ACTIVE
                </span>
              )}
            </div>
            <input
              type="number"
              step="any"
              min="0"
              value={activeWorkspace.rateAnalysis.stoneChipsPricePerM3}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, stoneChipsPricePerM3: isNaN(val) ? 0 : val },
                }));
              }}
              className={`w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border font-mono text-xs bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] ${
                activeWorkspace.rateAnalysis.stoneChipsPricePerM3 === 0
                  ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                  : 'border-[var(--md-sys-color-outline)]'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                Rebar Steel ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/kg)
              </label>
              {activeWorkspace.rateAnalysis.rebarPricePerKg === 0 && (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                  0 ACTIVE
                </span>
              )}
            </div>
            <input
              type="number"
              step="any"
              min="0"
              value={activeWorkspace.rateAnalysis.rebarPricePerKg}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, rebarPricePerKg: isNaN(val) ? 0 : val },
                }));
              }}
              className={`w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border font-mono text-xs bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] ${
                activeWorkspace.rateAnalysis.rebarPricePerKg === 0
                  ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                  : 'border-[var(--md-sys-color-outline)]'
              }`}
            />
          </div>
        </div>

        {activeWorkspace.rateAnalysis.workType.startsWith('rcc') && (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                  Rebar Allowance (kg/m³ concrete)
                </label>
                {activeWorkspace.rateAnalysis.rebarAllowanceKgPerM3 === 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                    0 ACTIVE
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                min="0"
                value={activeWorkspace.rateAnalysis.rebarAllowanceKgPerM3}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    rateAnalysis: { ...ws.rateAnalysis, rebarAllowanceKgPerM3: isNaN(val) ? 0 : val },
                  }));
                }}
                className={`w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border font-mono text-xs bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] ${
                  activeWorkspace.rateAnalysis.rebarAllowanceKgPerM3 === 0
                    ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                    : 'border-[var(--md-sys-color-outline)]'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                  Admixture Price ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/kg)
                </label>
                {(activeWorkspace.rateAnalysis.admixturePricePerKg ?? 0) === 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                    0 ACTIVE
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                min="0"
                value={activeWorkspace.rateAnalysis.admixturePricePerKg ?? 0}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    rateAnalysis: { ...ws.rateAnalysis, admixturePricePerKg: isNaN(val) ? 0 : val },
                  }));
                }}
                className={`w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border font-mono text-xs bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] ${
                  (activeWorkspace.rateAnalysis.admixturePricePerKg ?? 0) === 0
                    ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                    : 'border-[var(--md-sys-color-outline)]'
                }`}
              />
            </div>
          </div>
        )}

        {(activeWorkspace.rateAnalysis.workType === 'brickwork-1-6' ||
          activeWorkspace.rateAnalysis.workType === 'brickwork-125mm-1-4') && (
          <div className="pt-1">
            <div className="flex items-center gap-1.5 mb-1">
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                Clay Brick Price ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)} per 1000 Nos)
              </label>
              {(activeWorkspace.rateAnalysis.brickPricePer1000 ?? 0) === 0 && (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                  0 ACTIVE
                </span>
              )}
            </div>
            <input
              type="number"
              step="any"
              min="0"
              value={activeWorkspace.rateAnalysis.brickPricePer1000 ?? 0}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, brickPricePer1000: isNaN(val) ? 0 : val },
                }));
              }}
              className={`w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border font-mono text-xs bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] ${
                (activeWorkspace.rateAnalysis.brickPricePer1000 ?? 0) === 0
                  ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                  : 'border-[var(--md-sys-color-outline)]'
              }`}
            />
          </div>
        )}

        {(currentWorkType === 'pcc-1-3-6' ||
          currentWorkType === 'brickwork-1-6' ||
          currentWorkType === 'brickwork-125mm-1-4' ||
          currentWorkType === 'plaster-1-4' ||
          currentWorkType === 'patent-stone-1-2-4') && (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Local Sand FM 1.5 ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={activeWorkspace.rateAnalysis.localSandPricePerM3 ?? activeWorkspace.rateAnalysis.sandPricePerM3}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    rateAnalysis: { ...ws.rateAnalysis, localSandPricePerM3: isNaN(val) ? 0 : val },
                  }));
                }}
                className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
              />
            </div>
            {(currentWorkType === 'pcc-1-3-6' || currentWorkType === 'patent-stone-1-2-4') && (
              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Brick Khoa / Pea Gravel ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={activeWorkspace.rateAnalysis.brickKhoaPricePerM3 ?? Math.round(activeWorkspace.rateAnalysis.stoneChipsPricePerM3 * 0.65)}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      rateAnalysis: { ...ws.rateAnalysis, brickKhoaPricePerM3: isNaN(val) ? 0 : val },
                    }));
                  }}
                  className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono tabular-nums text-xs bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Labor Daily Wages & Man-days */}
      <div className="space-y-2 p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>Daily Labor Wages & Required Man-days</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Head Mason ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/day)
            </label>
            <input
              type="number"
              step="50"
              value={activeWorkspace.rateAnalysis.masonDailyWage}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, masonDailyWage: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Mason Days Required
            </label>
            <input
              type="number"
              step="0.05"
              value={activeWorkspace.rateAnalysis.masonDaysRequired}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, masonDaysRequired: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              General Laborer ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/day)
            </label>
            <input
              type="number"
              step="50"
              value={activeWorkspace.rateAnalysis.laborerDailyWage}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, laborerDailyWage: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Laborer Days Required
            </label>
            <input
              type="number"
              step="0.1"
              value={activeWorkspace.rateAnalysis.laborerDaysRequired}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, laborerDaysRequired: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Bar Bender / Fitter ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/day)
            </label>
            <input
              type="number"
              step="50"
              value={activeWorkspace.rateAnalysis.barBenderDailyWage}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, barBenderDailyWage: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Bar Bender Days Required
            </label>
            <input
              type="number"
              step="0.05"
              value={activeWorkspace.rateAnalysis.barBenderDaysRequired}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, barBenderDaysRequired: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            />
          </div>
        </div>
      </div>

      {/* Equipment Hire, Shuttering & Markups */}
      <div className="space-y-2 p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5" />
          <span>Plant Hire, Shuttering & Markups</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Mixer Hire ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)
            </label>
            <input
              type="number"
              step="10"
              value={activeWorkspace.rateAnalysis.mixerHirePerM3}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, mixerHirePerM3: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Vibrator Hire ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)
            </label>
            <input
              type="number"
              step="5"
              value={activeWorkspace.rateAnalysis.vibratorHirePerM3}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, vibratorHirePerM3: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Shuttering ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)
            </label>
            <input
              type="number"
              step="20"
              value={activeWorkspace.rateAnalysis.shutteringScaffoldingPerM3}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, shutteringScaffoldingPerM3: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Water & Electricity (%)
            </label>
            <input
              type="number"
              step="0.5"
              value={activeWorkspace.rateAnalysis.waterElectricityPercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, waterElectricityPercent: val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Contractor Profit (%)
            </label>
            <input
              type="number"
              step="1.0"
              min="0"
              value={activeWorkspace.rateAnalysis.contractorProfitPercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, contractorProfitPercent: isNaN(val) ? 0 : val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Material Wastage (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="20"
              value={activeWorkspace.rateAnalysis.wastagePercent ?? 2.5}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, wastagePercent: isNaN(val) ? 0 : val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              VAT &amp; AIT Tax (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="35"
              value={activeWorkspace.rateAnalysis.vatAitPercent ?? 7.5}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, vatAitPercent: isNaN(val) ? 0 : val },
                }));
              }}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onApplyRateToBOQ}
        className="w-full min-h-[48px] touch-target-48 py-3 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:opacity-95 active:scale-[0.99] transition-transform"
      >
        <ArrowRight className="w-4 h-4" />
        <span>Apply Analyzed Rate to BOQ Takeoff Schedule</span>
      </button>
    </div>
  );
};

export interface RateAnalysisTablesProps {
  rateResult: RateAnalysisResult;
  onApplyRateToBOQ?: () => void;
}

export const RateAnalysisTables: React.FC<RateAnalysisTablesProps> = ({
  rateResult,
  onApplyRateToBOQ,
}) => {
  const formatCur = (val: number) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const isIndexed = Math.abs(rateResult.localCostIndex - 1.0) > 0.001;
  const unitLabel = rateResult.basisUnitLabel || 'm³';
  const subUnitLabel = unitLabel === 'm²' ? 'sft' : unitLabel === 'Ton' ? 'kg' : 'cft';
  const subUnitRate = unitLabel === 'Ton' ? rateResult.unitRatePerM3 / 1000 : rateResult.unitRatePerCft;
  const directPerM3 = rateResult.directCostPerM3 ?? rateResult.subtotalBeforeProfit / Math.max(0.001, rateResult.basisVolumeM3);
  const directPerSub =
    unitLabel === 'm²'
      ? directPerM3 / 10.7639104
      : unitLabel === 'Ton'
        ? directPerM3 / 1000
        : directPerM3 / 35.3146667;
  const quotedPerM3 = rateResult.commercialQuotedRatePerM3 ?? rateResult.unitRatePerM3 * (1 + (rateResult.vatAitPercent ?? 7.5) / 100);
  const quotedPerSub =
    unitLabel === 'Ton'
      ? quotedPerM3 / 1000
      : rateResult.commercialQuotedRatePerCft ?? subUnitRate * (1 + (rateResult.vatAitPercent ?? 7.5) / 100);
  const profitPerM3 = rateResult.netProfitPerM3 ?? rateResult.contractorProfitCost / Math.max(0.001, rateResult.basisVolumeM3);
  const profitPerSub =
    unitLabel === 'Ton'
      ? profitPerM3 / 1000
      : rateResult.netProfitPerCft ?? profitPerM3 / (unitLabel === 'm²' ? 10.7639104 : 35.3146667);

  return (
    <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 space-y-6">
      {/* Header Banner with Composite Unit Rates */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <span>Granular Cost Rate Analysis</span>
            </h2>
            {isIndexed && (
              <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold">
                LMCI {rateResult.localCostIndex.toFixed(2)}x
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            {rateResult.workDescription} · Basis: {rateResult.basisVolumeM3} {unitLabel}
          </p>
        </div>

        <div className="flex items-center gap-4 text-right font-mono tabular-nums">
          <div>
            <span className="text-[11px] block text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Analyzed Rate / {unitLabel}
            </span>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-xl font-bold text-[var(--md-sys-color-primary)]">
                {rateResult.currencySymbol} {formatCur(rateResult.unitRatePerM3)}
              </span>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">/ {unitLabel}</span>
            </div>
            {isIndexed && (
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] line-through block">
                Base: {rateResult.currencySymbol} {formatCur(rateResult.baseUnitRatePerM3)}
              </span>
            )}
          </div>

          <div className="pl-4 border-l border-[var(--md-sys-color-outline-variant)]">
            <span className="text-[11px] block text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Rate / {subUnitLabel}
            </span>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-base font-bold text-[var(--md-sys-color-tertiary)]">
                {rateResult.currencySymbol} {formatCur(subUnitRate)}
              </span>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">/ {subUnitLabel}</span>
            </div>
            <span className="text-[9.5px] text-[var(--md-sys-color-on-surface-variant)] block">
              {unitLabel === 'm²' ? '(1 m² = 10.764 sft)' : unitLabel === 'Ton' ? '(1 Ton = 1000 kg)' : '(1 m³ = 35.315 cft)'}
            </span>
          </div>
        </div>
      </div>

      {/* Cost Sensitivity & Margin Breakdown Card */}
      <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Cost Sensitivity &amp; Margin Breakdown</span>
          </div>
          <span className="text-[11px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)]">
            CP&amp;OH {rateResult.contractorProfitPercent}% · VAT/AIT {(rateResult.vatAitPercent ?? 7.5).toFixed(1)}% · Wastage {(rateResult.materialWastagePercent ?? 2.5).toFixed(1)}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono tabular-nums">
          <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Direct Execution Cost
            </div>
            <div className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              {rateResult.currencySymbol} {formatCur(directPerM3)} <span className="text-[11px] font-normal text-[var(--md-sys-color-on-surface-variant)]">/ {unitLabel}</span>
            </div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              {rateResult.currencySymbol} {formatCur(directPerSub)} / {subUnitLabel} (Break-even)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
              Commercial Quoted Rate (incl. VAT/AIT)
            </div>
            <div className="text-base font-bold text-[var(--md-sys-color-primary)]">
              {rateResult.currencySymbol} {formatCur(quotedPerM3)} <span className="text-[11px] font-normal text-[var(--md-sys-color-on-surface-variant)]">/ {unitLabel}</span>
            </div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              {rateResult.currencySymbol} {formatCur(quotedPerSub)} / {subUnitLabel} (Tender Quote)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Net Contractor Profit Margin
            </div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              +{rateResult.currencySymbol} {formatCur(profitPerM3)} <span className="text-[11px] font-normal text-[var(--md-sys-color-on-surface-variant)]">/ {unitLabel}</span>
            </div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              +{rateResult.currencySymbol} {formatCur(profitPerSub)} / {subUnitLabel} ({rateResult.contractorProfitPercent}% CP&amp;OH)
            </div>
          </div>
        </div>
      </div>

      {/* Cost Distribution Progress Bar */}
      <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-semibold text-[var(--md-sys-color-on-surface)]">
          <span>Cost Composition Distribution</span>
          <span className="text-[var(--md-sys-color-primary)] font-bold">
            Total {rateResult.currencySymbol} {formatCur(rateResult.grandTotalCost)}
          </span>
        </div>
        <div className="h-2.5 w-full bg-[var(--md-sys-color-surface-container-high)] rounded-full overflow-hidden flex">
          <div
            style={{ width: `${rateResult.costDistributionPercent.materials}%` }}
            className="bg-blue-600 h-full"
            title={`Materials: ${rateResult.costDistributionPercent.materials}%`}
          />
          <div
            style={{ width: `${rateResult.costDistributionPercent.labor}%` }}
            className="bg-amber-500 h-full"
            title={`Labor: ${rateResult.costDistributionPercent.labor}%`}
          />
          <div
            style={{ width: `${rateResult.costDistributionPercent.equipment}%` }}
            className="bg-emerald-600 h-full"
            title={`Equipment: ${rateResult.costDistributionPercent.equipment}%`}
          />
          <div
            style={{ width: `${rateResult.costDistributionPercent.waterElectricity}%` }}
            className="bg-cyan-500 h-full"
            title={`Water & Electricity: ${rateResult.costDistributionPercent.waterElectricity}%`}
          />
          <div
            style={{ width: `${rateResult.costDistributionPercent.contractorProfit}%` }}
            className="bg-purple-600 h-full"
            title={`Profit & Overhead: ${rateResult.costDistributionPercent.contractorProfit}%`}
          />
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2 text-[10.5px] font-mono text-[var(--md-sys-color-on-surface-variant)] pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            Materials ({rateResult.costDistributionPercent.materials}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            Labor ({rateResult.costDistributionPercent.labor}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            Equipment ({rateResult.costDistributionPercent.equipment}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
            Utilities ({rateResult.costDistributionPercent.waterElectricity}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
            Overhead & Profit ({rateResult.costDistributionPercent.contractorProfit}%)
          </span>
        </div>
      </div>

      {/* 1. Materials Breakdown Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>1. Direct Material Components Schedule</span>
          </h3>
          <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            {rateResult.currencySymbol} {formatCur(rateResult.materialsCost)}
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline-variant)]">
          <table className="w-full text-xs font-mono border-collapse min-w-[540px]">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold bg-[var(--md-sys-color-surface-container)]">
                <th className="py-2.5 px-3 text-left">Material Description</th>
                <th className="py-2.5 px-2 text-right">Quantity</th>
                <th className="py-2.5 px-2 text-center">Unit</th>
                <th className="py-2.5 px-2 text-right">Base Price</th>
                {isIndexed && <th className="py-2.5 px-2 text-right">LMCI Rate</th>}
                <th className="py-2.5 px-3 text-right">Total Cost ({rateResult.currencySymbol})</th>
                <th className="py-2.5 px-2 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
              {rateResult.materials.map((m, i) => (
                <tr key={i} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                  <td className="py-2 px-3 font-semibold text-[var(--md-sys-color-on-surface)]">{m.name}</td>
                  <td className="py-2 px-2 text-right">{m.quantity}</td>
                  <td className="py-2 px-2 text-center">{m.unit}</td>
                  <td className="py-2 px-2 text-right text-[var(--md-sys-color-on-surface-variant)]">{formatCur(m.unitPrice)}</td>
                  {isIndexed && (
                    <td className="py-2 px-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                      {formatCur(m.indexedUnitPrice ?? m.unitPrice)}
                    </td>
                  )}
                  <td className="py-2 px-3 text-right font-bold text-[var(--md-sys-color-on-surface)]">
                    {formatCur(m.totalCost)}
                  </td>
                  <td className="py-2 px-2 text-right text-[var(--md-sys-color-on-surface-variant)]">{m.percentageOfMaterial}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {(rateResult.materialWastageCost ?? 0) > 0 && (
                <tr className="border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)]">
                  <td colSpan={isIndexed ? 5 : 4} className="py-2 px-3 text-left">
                    + Site Material Wastage &amp; Handling ({(rateResult.materialWastagePercent ?? 2.5).toFixed(1)}%):
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-[var(--md-sys-color-on-surface)]">
                    +{rateResult.currencySymbol} {formatCur(rateResult.materialWastageCost ?? 0)}
                  </td>
                  <td></td>
                </tr>
              )}
              <tr className="font-bold border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
                <td colSpan={isIndexed ? 5 : 4} className="py-2.5 px-3 text-left">Materials Subtotal (incl. Wastage):</td>
                <td className="py-2.5 px-3 text-right text-[var(--md-sys-color-primary)]">
                  {rateResult.currencySymbol} {formatCur(rateResult.materialsCost)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 2. Labor Breakdown Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span>2. Direct Labor Wages & Productivity Schedule</span>
          </h3>
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            {rateResult.currencySymbol} {formatCur(rateResult.laborsCost)}
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline-variant)]">
          <table className="w-full text-xs font-mono border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold bg-[var(--md-sys-color-surface-container)]">
                <th className="py-2.5 px-3 text-left">Labor Craft / Trade</th>
                <th className="py-2.5 px-2 text-right">Required Man-days</th>
                <th className="py-2.5 px-2 text-right">Base Wage</th>
                {isIndexed && <th className="py-2.5 px-2 text-right">Indexed Wage</th>}
                <th className="py-2.5 px-3 text-right">Total ({rateResult.currencySymbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
              {rateResult.labors.map((l, i) => (
                <tr key={i} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                  <td className="py-2 px-3 font-semibold text-[var(--md-sys-color-on-surface)]">{l.trade}</td>
                  <td className="py-2 px-2 text-right">{l.daysRequired}</td>
                  <td className="py-2 px-2 text-right text-[var(--md-sys-color-on-surface-variant)]">{formatCur(l.dailyWage)}</td>
                  {isIndexed && (
                    <td className="py-2 px-2 text-right font-semibold text-amber-600 dark:text-amber-400">
                      {formatCur(l.indexedDailyWage)}
                    </td>
                  )}
                  <td className="py-2 px-3 text-right font-bold text-[var(--md-sys-color-on-surface)]">
                    {formatCur(l.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
                <td colSpan={isIndexed ? 4 : 3} className="py-2.5 px-3 text-left">Labor Subtotal:</td>
                <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">
                  {rateResult.currencySymbol} {formatCur(rateResult.laborsCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 3. Equipment & Plant Hire Schedule */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-emerald-500" />
            <span>3. Plant Machinery & Formwork Centering</span>
          </h3>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {rateResult.currencySymbol} {formatCur(rateResult.equipmentCost)}
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline-variant)]">
          <table className="w-full text-xs font-mono border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold bg-[var(--md-sys-color-surface-container)]">
                <th className="py-2.5 px-3 text-left">Machinery / Shuttering Item</th>
                <th className="py-2.5 px-2 text-right">Base Rate</th>
                {isIndexed && <th className="py-2.5 px-2 text-right">Indexed Rate</th>}
                <th className="py-2.5 px-3 text-right">Total ({rateResult.currencySymbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
              {rateResult.equipment.map((eq, i) => (
                <tr key={i} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                  <td className="py-2 px-3 font-semibold text-[var(--md-sys-color-on-surface)]">{eq.equipment}</td>
                  <td className="py-2 px-2 text-right text-[var(--md-sys-color-on-surface-variant)]">{formatCur(eq.ratePerUnit)}</td>
                  {isIndexed && (
                    <td className="py-2 px-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCur(eq.indexedRatePerUnit)}
                    </td>
                  )}
                  <td className="py-2 px-3 text-right font-bold text-[var(--md-sys-color-on-surface)]">
                    {formatCur(eq.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
                <td colSpan={isIndexed ? 3 : 2} className="py-2.5 px-3 text-left">Equipment & Shuttering Subtotal:</td>
                <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                  {rateResult.currencySymbol} {formatCur(rateResult.equipmentCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. Complete Statutory Markup & Profit Summary Stack */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-purple-500" />
          <span>4. Statutory Markups, Utilities & Contractor Profit Stack</span>
        </h3>
        <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
          <div className="divide-y divide-[var(--md-sys-color-outline-variant)] text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 bg-[var(--md-sys-color-surface)]">
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                Direct Prime Cost (Materials + Labor + Machinery):
              </span>
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                {rateResult.currencySymbol} {formatCur(rateResult.primeCost)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[var(--md-sys-color-surface)]">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">
                Water & Electrical Charges ({rateResult.waterElectricityPercent}%):
              </span>
              <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                {rateResult.currencySymbol} {formatCur(rateResult.waterElectricityCost)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[var(--md-sys-color-surface-container-low)]">
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                Subtotal before Contractor Profit:
              </span>
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                {rateResult.currencySymbol} {formatCur(rateResult.subtotalBeforeProfit)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[var(--md-sys-color-surface)]">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">
                Contractor Profit & Overhead ({rateResult.contractorProfitPercent}%):
              </span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {rateResult.currencySymbol} {formatCur(rateResult.contractorProfitCost)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container-high)] text-sm font-bold">
              <span className="text-[var(--md-sys-color-on-surface)]">
                Analyzed Rate Cost ({rateResult.basisVolumeM3} {unitLabel}):
              </span>
              <span className="text-base text-[var(--md-sys-color-primary)]">
                {rateResult.currencySymbol} {formatCur(rateResult.grandTotalCost)}
              </span>
            </div>
            {(rateResult.vatAitCost ?? 0) > 0 && (
              <>
                <div className="flex items-center justify-between p-2.5 bg-[var(--md-sys-color-surface)]">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">
                    + Statutory VAT &amp; AIT Reserve ({(rateResult.vatAitPercent ?? 7.5).toFixed(1)}%):
                  </span>
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                    {rateResult.currencySymbol} {formatCur(rateResult.vatAitCost ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container)] text-sm font-bold">
                  <span className="text-[var(--md-sys-color-on-surface)]">
                    Commercial Tender Quote (incl. VAT &amp; AIT):
                  </span>
                  <span className="text-base text-emerald-600 dark:text-emerald-400">
                    {rateResult.currencySymbol} {formatCur(rateResult.commercialQuotedTotalCost ?? rateResult.grandTotalCost)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {onApplyRateToBOQ && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onApplyRateToBOQ}
            className="w-full min-h-[48px] touch-target-48 py-3 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:opacity-95 active:scale-[0.99] transition-transform"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Apply Analyzed Rate ({rateResult.currencySymbol} {formatCur(rateResult.unitRatePerM3)}/{unitLabel}) to Matching BOQ Schedule Items</span>
          </button>
        </div>
      )}
    </div>
  );
};
