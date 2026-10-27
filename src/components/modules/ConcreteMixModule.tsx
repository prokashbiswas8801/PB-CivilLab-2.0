import React, { useState } from 'react';
import {
  Droplets,
  Layers,
  Sparkles,
  ArrowRight,
  Sliders,
  Scale,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Beaker,
  FileSpreadsheet,
} from 'lucide-react';
import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { ConcreteMixResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';

export interface ConcreteMixInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
  onSyncToBoq?: () => void;
}

export const ConcreteMixInputs: React.FC<ConcreteMixInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
  onSyncToBoq,
}) => {
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);

  const concreteStrengthPresets = [
    { label: 'C20 (20 MPa)', valueSI: 20 * 1e6, title: 'Standard Residential / Low-rise Slabs' },
    { label: 'C25 (25 MPa)', valueSI: 25 * 1e6, title: 'Multi-story Frames & Structural Beams' },
    { label: 'C30 (30 MPa)', valueSI: 30 * 1e6, title: 'Commercial Columns & Heavy Foundations' },
    { label: 'C35 (35 MPa)', valueSI: 35 * 1e6, title: 'High-rise Shear Walls & Water Retaining' },
    { label: 'C40 (40 MPa)', valueSI: 40 * 1e6, title: 'Prestressed & Severe Marine Exposure' },
  ];

  const slumpPresets = [
    { label: '25mm (Pave)', valueSI: 0.025, title: 'Pavements & Vibrated Road Slabs (1")' },
    { label: '75mm (Beams)', valueSI: 0.075, title: 'Normal Reinforced Beams & Slabs (3")' },
    { label: '125mm (Cols)', valueSI: 0.125, title: 'Congested Columns & Retaining Walls (5")' },
    { label: '175mm (Pump)', valueSI: 0.175, title: 'Pumped Concrete & Tremie Cast Piles (7")' },
  ];

  const batchVolPresets = [
    { label: '0.5 m³', valueSI: 0.5 },
    { label: '1.0 m³', valueSI: 1.0 },
    { label: '3.0 m³', valueSI: 3.0 },
    { label: '6.0 m³ (Truck)', valueSI: 6.0 },
  ];

  const wcPresets = [0.38, 0.42, 0.45, 0.50, 0.55];

  const wcValue = activeWorkspace.concrete.waterCementRatio;
  const wcValidation = wcValue > 0.60
    ? { status: 'warning' as const, hint: 'W/C > 0.60 reduces durability and increases permeability under ACI 318 / BNBC 2020.' }
    : wcValue < 0.35
    ? { status: 'warning' as const, hint: 'W/C < 0.35 has low workability; superplasticizers / high-range water reducers mandatory.' }
    : null;

  const faMoisture = activeWorkspace.concrete.fineAggMoisturePercent ?? 4.0;
  const faAbsorption = activeWorkspace.concrete.fineAggAbsorptionPercent ?? 1.2;
  const caMoisture = activeWorkspace.concrete.coarseAggMoisturePercent ?? 2.0;
  const caAbsorption = activeWorkspace.concrete.coarseAggAbsorptionPercent ?? 0.8;
  const sandFM = activeWorkspace.concrete.sandFinenessModulus ?? 2.70;
  const coarseDRUW = activeWorkspace.concrete.coarseAggDryRoddedDensityKgPerM3 ?? 1600;
  const admixDose = activeWorkspace.concrete.admixtureDosePercent ?? 1.0;
  const waterReduction = activeWorkspace.concrete.admixtureWaterReductionPercent ?? 15;

  return (
    <div className="space-y-4">
      {/* Primary Mix Specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <UnitInput
          label="Target Compressive Strength f'c"
          category="pressure"
          siValue={activeWorkspace.concrete.targetStrengthMpa * 1000000}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              concrete: { ...ws.concrete, targetStrengthMpa: val / 1000000 },
            }));
          }}
          currentUnitId={getFieldUnit('mix.fc', 'pressure', 'MPa')}
          onUnitChange={(u) => updateFieldUnit('mix.fc', u)}
          customUnits={customUnits}
          step={5}
          presets={concreteStrengthPresets}
          tooltip={{
            explanation: "Specified 28-day cylinder compressive strength of concrete under standard curing.",
            standardRef: 'BNBC 2020 Part 6, §5.2 · ACI 318-19 Table 19.2.1.1',
            recommendedRange: '20 – 40 MPa (Min 20 MPa for seismic frame ductility)',
            designTip: 'Design strength includes required overdesign margin (fcr = fc + 8.3 MPa for fc ≤ 35 MPa).',
          }}
          validationRule={{
            minSI: 10 * 1e6,
            maxSI: 100 * 1e6,
            warningBelowSI: 17 * 1e6,
            warningAboveSI: 60 * 1e6,
            warningHint: "Strength below 17 MPa is non-compliant for structural RCC under BNBC 2020.",
          }}
        />

        <UnitInput
          label="Slump Requirement (Workability)"
          category="length"
          siValue={activeWorkspace.concrete.slumpMm * 0.001}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              concrete: { ...ws.concrete, slumpMm: val * 1000 },
            }));
          }}
          currentUnitId={getFieldUnit('mix.slump', 'length', 'mm')}
          onUnitChange={(u) => updateFieldUnit('mix.slump', u)}
          customUnits={customUnits}
          step={25}
          presets={slumpPresets}
          tooltip={{
            explanation: "Measures fresh concrete consistency and workability before placement.",
            standardRef: 'ASTM C143 / ACI 211.1 Table 6.3.1',
            recommendedRange: '50 – 100 mm for normal slabs; 120 – 160 mm for pumped concrete',
            designTip: 'Never add jobsite water to increase slump; use water-reducing plasticizers to prevent loss of strength.',
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <UnitInput
          label="Target Batch Volume"
          category="volume"
          siValue={activeWorkspace.concrete.batchVolumeM3 || 1.0}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              concrete: { ...ws.concrete, batchVolumeM3: val },
            }));
          }}
          currentUnitId={getFieldUnit('mix.vol', 'volume', 'm3')}
          onUnitChange={(u) => updateFieldUnit('mix.vol', u)}
          customUnits={customUnits}
          step={0.5}
          presets={batchVolPresets}
          tooltip={{
            explanation: "Target production batch volume for material takeoff and weigh-batching scale.",
            standardRef: 'ACI 304R Guide for Measuring & Mixing Concrete',
            recommendedRange: '1.0 m³ standard commercial yield; 6.0 m³ transit mixer',
          }}
        />

        {/* W/C Ratio with Presets & Guidance */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
              Water-Cement Ratio (w/c)
            </label>
            <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] font-bold">
              {wcValue <= 0.42 ? 'High Durability' : wcValue <= 0.50 ? 'Normal RCC' : 'High Porosity'}
            </span>
          </div>
          <input
            type="number"
            step="0.01"
            min="0.30"
            max="0.75"
            value={activeWorkspace.concrete.waterCementRatio}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                concrete: { ...ws.concrete, waterCementRatio: val },
              }));
            }}
            className="w-full min-h-[48px] touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
          />
          {/* Quick w/c presets */}
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            <span className="text-[9.5px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] shrink-0">
              Presets:
            </span>
            {wcPresets.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => updateActiveWorkspace((ws) => ({ ...ws, concrete: { ...ws.concrete, waterCementRatio: r } }))}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                  Math.abs(wcValue - r) < 0.005
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)] font-bold'
                    : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-outline-variant)]'
                }`}
              >
                {r.toFixed(2)}
              </button>
            ))}
          </div>
          {wcValidation && (
            <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400 leading-tight">
              ⚠️ {wcValidation.hint}
            </p>
          )}
        </div>

        <UnitInput
          label="Max Aggregate Size (Dmax)"
          category="length"
          siValue={(activeWorkspace.concrete.maxAggregateSizeMm || 20) * 0.001}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              concrete: { ...ws.concrete, maxAggregateSizeMm: val * 1000 },
            }));
          }}
          currentUnitId={getFieldUnit('mix.aggSize', 'length', 'mm')}
          onUnitChange={(u) => updateFieldUnit('mix.aggSize', u)}
          customUnits={customUnits}
          step={5}
          presets={[
            { label: '10mm (3/8")', valueSI: 0.010 },
            { label: '20mm (3/4")', valueSI: 0.020 },
            { label: '25mm (1")', valueSI: 0.025 },
          ]}
          tooltip={{
            explanation: "Nominal maximum coarse aggregate size. Governed by minimum clear spacing between rebar.",
            standardRef: 'ACI 318-19 §26.4.2.1 / ASTM C33',
            recommendedRange: '≤ 1/5 narrowest dimension or 3/4 clear spacing',
          }}
        />
      </div>

      {/* Advanced ACI 211.1 Aggregates & Moisture Corrections Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvancedParams(!showAdvancedParams)}
          className="text-xs font-mono font-bold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>
            {showAdvancedParams
              ? 'Hide ACI 211.1 Moisture & Specific Gravity Parameters'
              : 'Configure Aggregate Absorption, Moisture Content & Chemical Admixture (ACI 211.1)'}
          </span>
        </button>
      </div>

      {showAdvancedParams && (
        <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
            <Scale className="w-4 h-4" />
            <span>Aggregate Specific Gravities & Gradation Indices</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Cement S.G.
              </label>
              <input
                type="number"
                step="0.01"
                min="2.8"
                max="3.3"
                value={activeWorkspace.concrete.cementSpecificGravity || 3.15}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    concrete: { ...ws.concrete, cementSpecificGravity: val },
                  }));
                }}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Standard: 3.15</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Sand Fineness Modulus (FM)
              </label>
              <input
                type="number"
                step="0.05"
                min="2.0"
                max="3.4"
                value={sandFM}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    concrete: { ...ws.concrete, sandFinenessModulus: val },
                  }));
                }}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Typical: 2.6 – 2.9</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Fine Agg (Sand) S.G.
              </label>
              <input
                type="number"
                step="0.01"
                min="2.3"
                max="2.9"
                value={activeWorkspace.concrete.fineAggSpecificGravity || 2.60}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    concrete: { ...ws.concrete, fineAggSpecificGravity: val },
                  }));
                }}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Typical: 2.60</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Coarse Stone S.G.
              </label>
              <input
                type="number"
                step="0.01"
                min="2.3"
                max="3.0"
                value={activeWorkspace.concrete.coarseAggSpecificGravity || 2.65}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    concrete: { ...ws.concrete, coarseAggSpecificGravity: val },
                  }));
                }}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Typical: 2.65</span>
            </div>
          </div>

          {/* Moisture Content & Absorption Correction */}
          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] mb-2 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              <span>Field Moisture & Water Absorption Corrections (ASTM C70 / C128 / C127)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Sand Total Moisture (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={faMoisture}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      concrete: { ...ws.concrete, fineAggMoisturePercent: val },
                    }));
                  }}
                  className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                />
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Field wet MC: ~4.0%</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Sand Absorption (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={faAbsorption}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      concrete: { ...ws.concrete, fineAggAbsorptionPercent: val },
                    }));
                  }}
                  className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                />
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">SSD Absorption: ~1.2%</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Stone Total Moisture (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="6"
                  value={caMoisture}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      concrete: { ...ws.concrete, coarseAggMoisturePercent: val },
                    }));
                  }}
                  className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                />
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Field wet MC: ~2.0%</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Stone Absorption (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="4"
                  value={caAbsorption}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      concrete: { ...ws.concrete, coarseAggAbsorptionPercent: val },
                    }));
                  }}
                  className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                />
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">SSD Absorption: ~0.8%</span>
              </div>
            </div>
          </div>

          {/* Chemical Admixture Dosage & Water Reduction */}
          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] mb-2 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Chemical Admixture (HRWR / Superplasticizer ASTM C494)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Admixture Dose (% wt cement)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="3.0"
                  value={admixDose}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      concrete: { ...ws.concrete, admixtureDosePercent: val },
                    }));
                  }}
                  className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                />
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Standard: 0.8 – 1.2%</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Water Reduction Efficiency (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="35"
                  value={waterReduction}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      concrete: { ...ws.concrete, admixtureWaterReductionPercent: val },
                    }));
                  }}
                  className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                />
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Type F / G: 12 – 25%</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Coarse Agg DRUW (kg/m³)
                </label>
                <input
                  type="number"
                  step="25"
                  min="1300"
                  max="1900"
                  value={coarseDRUW}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      concrete: { ...ws.concrete, coarseAggDryRoddedDensityKgPerM3: val },
                    }));
                  }}
                  className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                />
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Dry-rodded density</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Module Quick Sync Button */}
      {onSyncToBoq && (
        <button
          type="button"
          onClick={onSyncToBoq}
          className="w-full min-h-[48px] touch-target-48 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:opacity-95 active:scale-[0.99] transition-transform"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>One-Click Auto-Sync Concrete Volumes to BOQ Takeoff Schedule</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export interface ConcreteMixMetricsProps {
  result: ConcreteMixResult;
  activeWorkspace: CivilWorkspace;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
  onSyncToBoq?: () => void;
}

export const ConcreteMixMetrics: React.FC<ConcreteMixMetricsProps> = ({
  result,
  activeWorkspace,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
  onSyncToBoq,
}) => {
  return (
    <div className="space-y-4">
      {/* 4 Primary Output Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
        <UnitValueDisplay
          label="Net Batched Water"
          category="mass"
          siValue={result.batchAdjustedWaterKg ?? result.batchWaterKg}
          currentUnitId={getOutputUnit('mix.out.water', 'mass', 'kg')}
          onUnitChange={(u) => updateOutputUnit('mix.out.water', u)}
          customUnits={customUnits}
          subText={`W/C = ${activeWorkspace.concrete.waterCementRatio.toFixed(2)} (${result.totalAggregateFreeWaterKgPerM3 > 0 ? `-${(result.totalAggregateFreeWaterKgPerM3 * result.batchVolumeM3).toFixed(0)}L free water` : 'SSD'})`}
        />
        <UnitValueDisplay
          label="Cement Content"
          category="mass"
          siValue={result.batchCementKg}
          currentUnitId={getOutputUnit('mix.out.cement', 'mass', 'bag50')}
          onUnitChange={(u) => updateOutputUnit('mix.out.cement', u)}
          customUnits={customUnits}
          highlight={true}
          subText={`${result.cementBags50Kg.toFixed(1)} Bags (50kg)`}
        />
        <UnitValueDisplay
          label="Coarse Agg (Field Wet)"
          category="mass"
          siValue={result.batchBatchedCoarseAggKg ?? result.batchCoarseAggKg}
          currentUnitId={getOutputUnit('mix.out.coarse', 'mass', 'kg')}
          onUnitChange={(u) => updateOutputUnit('mix.out.coarse', u)}
          customUnits={customUnits}
          subText={`Dry: ${(result.batchCoarseAggKg).toFixed(0)} kg`}
        />
        <UnitValueDisplay
          label="Fine Agg (Field Wet)"
          category="mass"
          siValue={result.batchBatchedFineAggKg ?? result.batchFineAggKg}
          currentUnitId={getOutputUnit('mix.out.fine', 'mass', 'kg')}
          onUnitChange={(u) => updateOutputUnit('mix.out.fine', u)}
          customUnits={customUnits}
          subText={`Dry: ${(result.batchFineAggKg).toFixed(0)} kg`}
        />
      </div>

      {/* Yield & Fresh Concrete Quality Snapshot */}
      <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
            Fresh Unit Weight: {result.freshConcreteUnitWeightKgPerM3.toFixed(1)} kg/m³
          </span>
          <span className="text-[var(--md-sys-color-on-surface-variant)]">·</span>
          <span className="text-[var(--md-sys-color-on-surface-variant)]">
            Batch Solid Volume: {result.totalSolidVolumeM3 ? (result.totalSolidVolumeM3 * result.batchVolumeM3).toFixed(3) : result.batchVolumeM3.toFixed(2)} m³
          </span>
          <span className="text-[var(--md-sys-color-on-surface-variant)]">·</span>
          <span className="text-[var(--md-sys-color-on-surface-variant)]">
            Relative Yield: {result.relativeYield ? result.relativeYield.toFixed(3) : '1.000'}
          </span>
        </div>

        {onSyncToBoq && (
          <button
            type="button"
            onClick={onSyncToBoq}
            className="px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-[11px] flex items-center gap-1.5 cursor-pointer hover:opacity-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sync Mix to BOQ</span>
          </button>
        )}
      </div>
    </div>
  );
};

export interface ConcreteMixVolumeTableProps {
  result: ConcreteMixResult;
  activeWorkspace: CivilWorkspace;
  onSyncToBoq?: () => void;
}

export const ConcreteMixVolumeTable: React.FC<ConcreteMixVolumeTableProps> = ({
  result,
  activeWorkspace,
  onSyncToBoq,
}) => {
  const items = result.items || [];
  const V = result.batchVolumeM3 || 1.0;

  return (
    <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-5 space-y-5">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
        <div>
          <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <span>ACI 211.1 Material Absolute Volume Breakdown & Field Moisture Schedule</span>
          </h2>
          <p className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Absolute volume method per 1.0 m³ concrete and {V} m³ batch total · Moisture adjusted field weight
          </p>
        </div>

        {onSyncToBoq && (
          <button
            type="button"
            onClick={onSyncToBoq}
            className="touch-target-48 px-3.5 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs hover:opacity-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sync to BOQ</span>
          </button>
        )}
      </div>

      {/* Absolute Volume Breakdown Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline-variant)]">
        <table className="w-full text-xs font-mono border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold bg-[var(--md-sys-color-surface-container)]">
              <th className="py-2.5 px-3 text-left">Constituent Material</th>
              <th className="py-2.5 px-2 text-center">S.G.</th>
              <th className="py-2.5 px-2 text-right">Solid Vol (m³/m³)</th>
              <th className="py-2.5 px-2 text-right">Vol %</th>
              <th className="py-2.5 px-2 text-right">Design Dry (kg/m³)</th>
              <th className="py-2.5 px-2 text-right">Field Wet (kg/m³)</th>
              <th className="py-2.5 px-3 text-right">Batch Total ({V} m³)</th>
              <th className="py-2.5 px-2 text-left">Moisture / Water Correction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {items.map((it, idx) => (
              <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                <td className="py-2 px-3 font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      it.category === 'cement'
                        ? 'bg-blue-600'
                        : it.category === 'fine-aggregate'
                          ? 'bg-amber-500'
                          : it.category === 'coarse-aggregate'
                            ? 'bg-emerald-600'
                            : it.category === 'water'
                              ? 'bg-cyan-500'
                              : it.category === 'admixture'
                                ? 'bg-purple-600'
                                : 'bg-slate-400'
                    }`}
                  />
                  <span>{it.name}</span>
                </td>
                <td className="py-2 px-2 text-center text-[var(--md-sys-color-on-surface-variant)]">
                  {it.specificGravity > 0 ? it.specificGravity.toFixed(2) : '—'}
                </td>
                <td className="py-2 px-2 text-right font-bold text-[var(--md-sys-color-primary)]">
                  {it.volumeM3PerM3.toFixed(4)}
                </td>
                <td className="py-2 px-2 text-right text-[var(--md-sys-color-on-surface-variant)]">
                  {it.volumePercent.toFixed(1)}%
                </td>
                <td className="py-2 px-2 text-right">
                  {it.dryMassKgPerM3 > 0 ? it.dryMassKgPerM3.toLocaleString() : '—'}
                </td>
                <td className="py-2 px-2 text-right font-semibold text-[var(--md-sys-color-on-surface)]">
                  {it.batchedMassKgPerM3 > 0 ? it.batchedMassKgPerM3.toLocaleString() : '—'}
                </td>
                <td className="py-2 px-3 text-right font-bold text-[var(--md-sys-color-on-surface)]">
                  {it.batchBatchedMassKg > 0 ? `${it.batchBatchedMassKg.toLocaleString()} kg` : '—'}
                </td>
                <td className="py-2 px-2 text-left text-[11px]">
                  {it.waterCorrectionKgPerM3 !== 0 ? (
                    <span
                      className={`font-semibold ${
                        it.waterCorrectionKgPerM3 > 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {it.waterCorrectionKgPerM3 > 0
                        ? `+${it.waterCorrectionKgPerM3} kg free water`
                        : `${it.waterCorrectionKgPerM3} kg plant water deduct`}
                    </span>
                  ) : it.category === 'cement' ? (
                    <span className="text-[var(--md-sys-color-on-surface-variant)]">
                      {(it.batchBatchedMassKg / 50).toFixed(1)} bags (50kg)
                    </span>
                  ) : (
                    <span className="text-[var(--md-sys-color-on-surface-variant)]">SSD neutral</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
              <td colSpan={2} className="py-2.5 px-3 text-left">
                Total Absolute Solid Volume:
              </td>
              <td className="py-2.5 px-2 text-right text-[var(--md-sys-color-primary)] font-bold">
                {result.totalSolidVolumeM3 ? result.totalSolidVolumeM3.toFixed(4) : '1.0000'} m³
              </td>
              <td className="py-2.5 px-2 text-right">100.0%</td>
              <td className="py-2.5 px-2 text-right">{result.totalDensityKgPerM3.toLocaleString()}</td>
              <td className="py-2.5 px-2 text-right text-emerald-700 dark:text-emerald-400">
                {result.freshConcreteUnitWeightKgPerM3.toLocaleString()}
              </td>
              <td className="py-2.5 px-3 text-right text-[var(--md-sys-color-primary)]">
                {(result.freshConcreteUnitWeightKgPerM3 * V).toLocaleString()} kg
              </td>
              <td className="py-2.5 px-2 text-left text-xs font-semibold">
                Yield: {result.yieldM3?.toFixed(3)} m³
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Aggregate Free Water & Net Batching Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs font-mono uppercase text-[var(--md-sys-color-primary)]">
            <Droplets className="w-4 h-4" />
            <span>Aggregate Moisture Corrections Summary</span>
          </div>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed font-mono">
            Fine Aggregate contributes <strong>{(result.items.find(i => i.category === 'fine-aggregate')?.waterCorrectionKgPerM3 || 0)} kg</strong> free water.
            Coarse Aggregate contributes <strong>{(result.items.find(i => i.category === 'coarse-aggregate')?.waterCorrectionKgPerM3 || 0)} kg</strong> free water.
          </p>
          <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-xs font-mono">
            <span>Total Aggregate Free Moisture Deducted:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              -{(result.totalAggregateFreeWaterKgPerM3 * V).toFixed(1)} Liters / Batch
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-xs font-mono">
            <span>Plant Mixer Batched Water Required:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {((result.adjustedWaterKgPerM3 || result.waterKgPerM3) * V).toFixed(1)} Liters
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs font-mono uppercase text-[var(--md-sys-color-primary)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Batch Scale Takeoff & Weighing Checklist</span>
          </div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]">
              <span>Cement (CEM I 50kg Bags):</span>
              <span className="font-bold">{result.cementBags50Kg.toFixed(1)} Bags ({result.batchCementKg.toFixed(0)} kg)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]">
              <span>Wet Sand Scale Target:</span>
              <span className="font-bold">{(result.batchBatchedFineAggKg || result.batchFineAggKg).toFixed(0)} kg</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--md-sys-color-outline-variant)]">
              <span>Wet Stone Chips Scale Target:</span>
              <span className="font-bold">{(result.batchBatchedCoarseAggKg || result.batchCoarseAggKg).toFixed(0)} kg</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Superplasticizer Dispenser:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {(result.batchAdmixtureKg || 0).toFixed(2)} kg ({(result.admixtureKgPerM3 || 0).toFixed(2)} kg/m³)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
