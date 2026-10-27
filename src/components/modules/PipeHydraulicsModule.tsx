import React, { useState } from 'react';
import {
  CivilWorkspace,
  PipeMaterialType,
  PipeServiceType,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { PipeHydraulicsResult } from '../../utils/calculations';
import { HYDRAULIC_MATERIALS, STANDARD_COMMERCIAL_DIAMETERS_MM } from '../../utils/hydraulicsSolver';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Gauge,
  Info,
  Layers,
  Settings,
  Sliders,
  Thermometer,
  TrendingDown,
  Waves,
  Zap,
} from 'lucide-react';

export interface PipeHydraulicsInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits?: CustomUnitDefinition[];
  getFieldUnit?: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit?: (fieldKey: string, unitId: string) => void;
}

export const PipeHydraulicsInputs: React.FC<PipeHydraulicsInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits = [],
  getFieldUnit = (_k, _c, fallback) => fallback,
  updateFieldUnit = () => {},
}) => {
  const pipe = activeWorkspace.pipe || {
    serviceType: 'pressure',
    pipeMaterial: 'pvc',
    hazenWilliamsC: 150,
    manningN: 0.009,
    internalDiameterMm: 250,
    lengthM: 180,
    flowRateLps: 45,
    inletElevationM: 25.0,
    outletElevationM: 18.0,
    inletPressureKpa: 300,
    minorLossCoefficientK: 2.0,
    waterTempC: 20,
    stormFillingRatio: 0.8,
  };

  const [activeTab, setActiveTab] = useState<'parameters' | 'materials' | 'sizing'>('parameters');

  const updatePipe = (patch: Partial<typeof pipe>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      pipe: { ...pipe, ...patch },
    }));
  };

  const handleMaterialChange = (matId: PipeMaterialType) => {
    const mat = HYDRAULIC_MATERIALS.find((m) => m.id === matId) ||
      (matId === 'pvc-hdpe' ? HYDRAULIC_MATERIALS.find((m) => m.id === 'pvc') : undefined);

    if (mat) {
      updatePipe({
        pipeMaterial: matId,
        hazenWilliamsC: mat.hazenWilliamsC,
        manningN: mat.manningN,
      });
    }
  };

  // Instant velocity calculation for responsive preview
  const areaM2 = Math.PI * Math.pow((pipe.internalDiameterMm / 1000) / 2, 2);
  const dischargeM3s = pipe.flowRateLps / 1000;
  const currentVelocityMps = areaM2 > 0 ? dischargeM3s / areaM2 : 0;

  return (
    <div className="space-y-4">
      {/* Service Mode Selector: Pressure Water Main vs Gravity Storm Sewer */}
      <div className="flex items-center justify-between p-1.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
        <button
          type="button"
          onClick={() => updatePipe({ serviceType: 'pressure' })}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            (pipe.serviceType || 'pressure') === 'pressure'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          Pressure Pipe (Hazen-Williams & Booster)
        </button>
        <button
          type="button"
          onClick={() => updatePipe({ serviceType: 'gravity-storm' })}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            pipe.serviceType === 'gravity-storm'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          Storm Sewer / Culvert (Gravity & Sizing)
        </button>
      </div>

      {/* Material & Automated Roughness Preset Selector */}
      <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            Automated Pipe Material Roughness Presets
          </label>
          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            AWWA / Chow Standards
          </span>
        </div>

        {/* Material Selection Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
          {[
            { id: 'pvc' as PipeMaterialType, label: 'PVC', c: 150, n: 0.009 },
            { id: 'hdpe' as PipeMaterialType, label: 'HDPE', c: 150, n: 0.010 },
            { id: 'ductile-iron' as PipeMaterialType, label: 'Ductile Iron', c: 130, n: 0.012 },
            { id: 'concrete' as PipeMaterialType, label: 'Concrete (RCC)', c: 120, n: 0.013 },
            { id: 'corrugated-steel' as PipeMaterialType, label: 'Corrugated Steel', c: 80, n: 0.024 },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleMaterialChange(item.id)}
              className={`p-2 rounded-lg border text-left transition-all ${
                pipe.pipeMaterial === item.id || (item.id === 'pvc' && pipe.pipeMaterial === 'pvc-hdpe')
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-semibold'
                  : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
            >
              <div className="text-xs truncate">{item.label}</div>
              <div className="text-[10px] font-mono opacity-80 mt-0.5">
                C={item.c} · n={item.n}
              </div>
            </button>
          ))}
        </div>

        {/* Roughness Fine Tuning Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Hazen-Williams C
            </label>
            <input
              type="number"
              value={pipe.hazenWilliamsC}
              onChange={(e) =>
                updatePipe({
                  hazenWilliamsC: Math.max(40, Math.min(165, Number(e.target.value) || 130)),
                })
              }
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              step="5"
              min="40"
              max="165"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Manning Roughness n
            </label>
            <input
              type="number"
              value={pipe.manningN || 0.012}
              onChange={(e) =>
                updatePipe({
                  manningN: Math.max(0.008, Math.min(0.045, Number(e.target.value) || 0.012)),
                })
              }
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              step="0.001"
              min="0.008"
              max="0.045"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Water Temperature (°C)
            </label>
            <input
              type="number"
              value={pipe.waterTempC || 20}
              onChange={(e) =>
                updatePipe({
                  waterTempC: Math.max(4, Math.min(60, Number(e.target.value) || 20)),
                })
              }
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              step="1"
              min="4"
              max="60"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Minor Loss K (ΣK)
            </label>
            <input
              type="number"
              value={pipe.minorLossCoefficientK ?? 1.5}
              onChange={(e) =>
                updatePipe({
                  minorLossCoefficientK: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              step="0.5"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Primary Pipe Geometry & Hydraulics Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Internal Diameter Selector with standard DN buttons */}
        <div>
          <UnitInput
            label="Internal Diameter (D)"
            category="length"
            siValue={pipe.internalDiameterMm / 1000}
            onChangeSI={(val) => {
              updatePipe({ internalDiameterMm: Math.round(val * 1000) });
            }}
            currentUnitId={getFieldUnit('pipe.dia', 'length', 'mm')}
            onUnitChange={(u) => updateFieldUnit('pipe.dia', u)}
            customUnits={customUnits}
            step={25}
          />
          <div className="flex items-center gap-1 mt-1 overflow-x-auto py-0.5">
            {[100, 150, 200, 250, 300, 400, 500, 600].map((dn) => (
              <button
                key={dn}
                type="button"
                onClick={() => updatePipe({ internalDiameterMm: dn })}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                  pipe.internalDiameterMm === dn
                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]'
                }`}
              >
                DN{dn}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Length */}
        <UnitInput
          label="Pipeline Length (L)"
          category="length"
          siValue={pipe.lengthM}
          onChangeSI={(val) => updatePipe({ lengthM: Math.max(1, val) })}
          currentUnitId={getFieldUnit('pipe.length', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('pipe.length', u)}
          customUnits={customUnits}
          step={10}
        />

        {/* Design Flow Rate */}
        <div>
          <UnitInput
            label="Design Flow Rate (Q)"
            category="flow_rate"
            siValue={pipe.flowRateLps / 1000}
            onChangeSI={(val) => updatePipe({ flowRateLps: Math.max(0.1, val * 1000) })}
            currentUnitId={getFieldUnit('pipe.flow', 'flow_rate', 'L/s')}
            onUnitChange={(u) => updateFieldUnit('pipe.flow', u)}
            customUnits={customUnits}
            step={5}
          />
          <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 flex justify-between">
            <span>Est. V: {currentVelocityMps.toFixed(2)} m/s</span>
            <span className={currentVelocityMps < 0.6 ? 'text-amber-600' : currentVelocityMps > 3.0 ? 'text-red-600' : 'text-emerald-600'}>
              {currentVelocityMps < 0.6 ? 'Low (Silt)' : currentVelocityMps > 3.0 ? 'High (Scour)' : 'Optimal'}
            </span>
          </div>
        </div>
      </div>

      {/* Elevations & Pressure Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <UnitInput
          label="Inlet Invert Elevation (z₁)"
          category="length"
          siValue={pipe.inletElevationM}
          onChangeSI={(val) => updatePipe({ inletElevationM: val })}
          currentUnitId={getFieldUnit('pipe.z1', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('pipe.z1', u)}
          customUnits={customUnits}
          step={1}
        />

        <UnitInput
          label="Outlet Invert Elevation (z₂)"
          category="length"
          siValue={pipe.outletElevationM}
          onChangeSI={(val) => updatePipe({ outletElevationM: val })}
          currentUnitId={getFieldUnit('pipe.z2', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('pipe.z2', u)}
          customUnits={customUnits}
          step={1}
        />

        {pipe.serviceType === 'gravity-storm' ? (
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Design Storm Filling Ratio (y/D)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.2"
              max="1.0"
              value={pipe.stormFillingRatio ?? 0.8}
              onChange={(e) =>
                updatePipe({
                  stormFillingRatio: Math.max(0.2, Math.min(1.0, Number(e.target.value) || 0.8)),
                })
              }
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            />
            <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
              80% filling standard for maximum gravity storm capacity
            </div>
          </div>
        ) : (
          <UnitInput
            label="Inlet Pressure (P₁)"
            category="pressure"
            siValue={(pipe.inletPressureKpa || 250) * 1000}
            onChangeSI={(val) => updatePipe({ inletPressureKpa: Math.max(0, val / 1000) })}
            currentUnitId={getFieldUnit('pipe.p1', 'pressure', 'kPa')}
            onUnitChange={(u) => updateFieldUnit('pipe.p1', u)}
            customUnits={customUnits}
            step={25}
          />
        )}
      </div>
    </div>
  );
};

export interface PipeHydraulicsMetricsProps {
  result: PipeHydraulicsResult;
  customUnits?: CustomUnitDefinition[];
  getOutputUnit?: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit?: (fieldKey: string, unitId: string) => void;
}

export const PipeHydraulicsMetrics: React.FC<PipeHydraulicsMetricsProps> = ({
  result,
  customUnits = [],
  getOutputUnit = (_k, _c, fallback) => fallback,
  updateOutputUnit = () => {},
}) => {
  const isLaminar = result.flowRegime === 'Laminar';
  const isTransitional = result.flowRegime === 'Transitional';
  const isTurbulent = result.flowRegime === 'Turbulent';

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      {/* Primary Hydraulic Results: Flow, Velocity, Total Head Loss, Outlet Pressure */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UnitValueDisplay
          label="Flow Velocity (V)"
          category="velocity"
          siValue={result.velocityMps}
          currentUnitId={getOutputUnit('pipe.out.V', 'velocity', 'm/s')}
          onUnitChange={(u) => updateOutputUnit('pipe.out.V', u)}
          customUnits={customUnits}
          highlight={true}
        />
        <UnitValueDisplay
          label="Friction Head Loss (hf)"
          category="length"
          siValue={result.frictionHeadLossM}
          currentUnitId={getOutputUnit('pipe.out.hf', 'length', 'm')}
          onUnitChange={(u) => updateOutputUnit('pipe.out.hf', u)}
          customUnits={customUnits}
        />
        <UnitValueDisplay
          label="Total Head Loss (HL)"
          category="length"
          siValue={result.totalHeadLossM}
          currentUnitId={getOutputUnit('pipe.out.HL', 'length', 'm')}
          onUnitChange={(u) => updateOutputUnit('pipe.out.HL', u)}
          customUnits={customUnits}
        />
        {result.serviceType === 'gravity-storm' && result.stormSewerAnalysis ? (
          <UnitValueDisplay
            label="Gravity Capacity (Qgrav)"
            category="flow_rate"
            siValue={result.stormSewerAnalysis.gravityCapacityLps / 1000}
            currentUnitId={getOutputUnit('pipe.out.qgrav', 'flow_rate', 'L/s')}
            onUnitChange={(u) => updateOutputUnit('pipe.out.qgrav', u)}
            customUnits={customUnits}
            highlight={true}
          />
        ) : (
          <UnitValueDisplay
            label="Residual Outlet Pressure"
            category="pressure"
            siValue={result.outletPressureKpa * 1000}
            currentUnitId={getOutputUnit('pipe.out.P2', 'pressure', 'kPa')}
            onUnitChange={(u) => updateOutputUnit('pipe.out.P2', u)}
            customUnits={customUnits}
          />
        )}
      </div>

      {/* Reynolds Number & Flow Regime Analysis Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Reynolds Number Card */}
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface)]">
                <Gauge className="w-4 h-4 text-blue-600" />
                Reynolds Number (Re)
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isTurbulent
                    ? 'bg-blue-600 text-white'
                    : isTransitional
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {result.flowRegime}
              </span>
            </div>
            <div className="text-2xl font-black font-mono mt-1 text-[var(--md-sys-color-on-surface)]">
              Re = {result.reynoldsNumber.toLocaleString()}
            </div>
          </div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-2">
            {result.regimeDescription}
          </div>
          <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 pt-1 border-t border-[var(--md-sys-color-outline-variant)]">
            Kinematic Viscosity ν = {result.kinematicViscosityM2s} m²/s
          </div>
        </div>

        {/* Friction Gradient & Losses Breakdown */}
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
          <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
            <span>Friction Gradient & Minor Loss</span>
            <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-2 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Friction Slope (Sf):</span>
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                {(result.frictionSlopeMPerM * 1000).toFixed(2)} m/km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Velocity Head (V²/2g):</span>
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">{result.velocityHeadM.toFixed(3)} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Minor Loss (hm = K·hv):</span>
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">{result.minorHeadLossM.toFixed(2)} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Darcy f (Colebrook):</span>
              <span className="font-bold text-blue-600">{result.darcyFrictionFactor.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Automated Commercial Sizing Recommendation */}
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
          <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
            <span>Hydraulic Sizing Solution</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Recommended Size:</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono font-bold text-xs">
                DN {result.sizingRecommendation.recommendedDn} mm
              </span>
            </div>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-1">
              {result.sizingRecommendation.sizingNotes}
            </p>
            <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
              Current DN {result.internalDiameterMm} mm utilization: {(result.utilizationRatio * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Siphon / Negative Pressure Cavitation Warning Banner */}
      {result.cavitationWarning && (
        <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm">
                Severe Hydraulic Warning: Sub-Atmospheric Cavitation / Syphon Hazard!
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                The Hydraulic Grade Line (HGL) drops below the pipe crown elevation along the alignment. This creates negative gauge pressures, risking vapor cavity collapse, water hammer column separation, and contaminated back-siphonage through pipe gaskets. Increase inlet booster head or deepen pipeline trenching.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Storm Sewer Gravity Flow Details if enabled */}
      {result.serviceType === 'gravity-storm' && result.stormSewerAnalysis && (
        <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-950 dark:text-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-blue-600" />
              Storm Sewer Gravity Capacity Analysis (Manning Equation)
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              result.stormSewerAnalysis.isCapacitySufficient
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}>
              {result.stormSewerAnalysis.isCapacitySufficient ? 'Capacity Adequate' : 'Conduit Undersized'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] opacity-75">Design Filling (y/D):</span>
              <div className="font-bold">{(result.stormSewerAnalysis.fillingRatio * 100).toFixed(0)}% (y = {result.stormSewerAnalysis.flowDepthM} m)</div>
            </div>
            <div>
              <span className="text-[10px] opacity-75">Gravity Discharge:</span>
              <div className="font-bold">{result.stormSewerAnalysis.gravityCapacityLps.toFixed(1)} L/s</div>
            </div>
            <div>
              <span className="text-[10px] opacity-75">Flow Velocity:</span>
              <div className="font-bold">{result.stormSewerAnalysis.gravityVelocityMps.toFixed(2)} m/s</div>
            </div>
            <div>
              <span className="text-[10px] opacity-75">Storm Froude (Fr):</span>
              <div className="font-bold">{result.stormSewerAnalysis.froudeNumber.toFixed(2)} ({result.stormSewerAnalysis.flowRegime})</div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive EGL & HGL Pipeline Visual Profile Plot */}
      <PipeEglHglProfilePlot result={result} />
    </div>
  );
};

/**
 * Interactive SVG Longitudinal Profile Plot for Pressure Pipeline EGL and HGL
 */
export const PipeEglHglProfilePlot: React.FC<{ result: PipeHydraulicsResult }> = ({ result }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const stations = result.profileStations;
  if (!stations || stations.length < 2) return null;

  const svgWidth = 600;
  const svgHeight = 230;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const maxDist = stations[stations.length - 1].distanceM || 100;
  const allZ = stations.flatMap((s) => [
    s.invertElevationM,
    s.crownElevationM,
    s.hglElevationM,
    s.eglElevationM,
  ]);
  const minZ = Math.min(...allZ) - 1.0;
  const maxZ = Math.max(...allZ) + 1.5;
  const zRange = Math.max(2.0, maxZ - minZ);

  const scaleX = (dist: number) => padLeft + (dist / maxDist) * plotW;
  const scaleY = (z: number) => padTop + plotH - ((z - minZ) / zRange) * plotH;

  const invertPoints = stations.map((s) => `${scaleX(s.distanceM)},${scaleY(s.invertElevationM)}`).join(' ');
  const crownPoints = stations.map((s) => `${scaleX(s.distanceM)},${scaleY(s.crownElevationM)}`).join(' ');
  const hglPoints = stations.map((s) => `${scaleX(s.distanceM)},${scaleY(s.hglElevationM)}`).join(' ');
  const eglPoints = stations.map((s) => `${scaleX(s.distanceM)},${scaleY(s.eglElevationM)}`).join(' ');

  // Pipe barrel polygon
  const pipeBarrelPolygon = [
    ...stations.map((s) => `${scaleX(s.distanceM)},${scaleY(s.crownElevationM)}`),
    ...stations.slice().reverse().map((s) => `${scaleX(s.distanceM)},${scaleY(s.invertElevationM)}`),
  ].join(' ');

  // Head loss area between EGL and HGL (velocity head)
  const velocityHeadPolygon = [
    ...stations.map((s) => `${scaleX(s.distanceM)},${scaleY(s.eglElevationM)}`),
    ...stations.slice().reverse().map((s) => `${scaleX(s.distanceM)},${scaleY(s.hglElevationM)}`),
  ].join(' ');

  const activeStation = hoveredIndex !== null ? stations[hoveredIndex] : stations[0];

  return (
    <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
            Pipeline Energy (EGL) & Hydraulic (HGL) Grade Line Profile
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-red-500 inline-block rounded-xs"></span>
            EGL
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-blue-500 inline-block rounded-xs"></span>
            HGL
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-slate-500 inline-block rounded-xs"></span>
            Pipe Crown/Invert
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none font-mono">
          <defs>
            <linearGradient id="pipeBarrelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="pipeEglGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
            const zVal = minZ + frac * zRange;
            const yPos = scaleY(zVal);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={svgWidth - padRight}
                  y2={yPos}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="2,2"
                />
                <text
                  x={padLeft - 6}
                  y={yPos + 3}
                  textAnchor="end"
                  fontSize="8"
                  fill="currentColor"
                  opacity="0.6"
                >
                  {zVal.toFixed(1)} m
                </text>
              </g>
            );
          })}

          {/* Pipe Barrel Area */}
          <polygon points={pipeBarrelPolygon} fill="url(#pipeBarrelGrad)" />

          {/* Velocity Head Band */}
          <polygon points={velocityHeadPolygon} fill="url(#pipeEglGrad)" />

          {/* Pipe Crown and Invert lines */}
          <polyline points={crownPoints} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3,2" />
          <polyline points={invertPoints} fill="none" stroke="#334155" strokeWidth="2.5" />

          {/* HGL Line */}
          <polyline points={hglPoints} fill="none" stroke="#2563eb" strokeWidth="2.5" />

          {/* EGL Line */}
          <polyline points={eglPoints} fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="5,2" />

          {/* Cavitation / Syphon Warning Flag */}
          {result.cavitationWarning && (
            <g transform={`translate(${scaleX(maxDist * 0.5)}, ${scaleY(stations[2].crownElevationM) - 20})`}>
              <rect x="-45" y="-12" width="90" height="18" rx="4" fill="#dc2626" opacity="0.95" />
              <text x="0" y="0" textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold">
                ⚠ Negative HGL Syphon
              </text>
            </g>
          )}

          {/* Interactive Station Markers */}
          {stations.map((s, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <line
                x1={scaleX(s.distanceM)}
                y1={padTop}
                x2={scaleX(s.distanceM)}
                y2={scaleY(s.invertElevationM)}
                stroke="currentColor"
                strokeOpacity={hoveredIndex === idx ? "0.4" : "0.05"}
                strokeWidth={hoveredIndex === idx ? "1.5" : "1"}
              />
              <circle cx={scaleX(s.distanceM)} cy={scaleY(s.hglElevationM)} r={hoveredIndex === idx ? "5" : "3"} fill="#2563eb" />
              <circle cx={scaleX(s.distanceM)} cy={scaleY(s.eglElevationM)} r={hoveredIndex === idx ? "4" : "2.5"} fill="#dc2626" />
              <text
                x={scaleX(s.distanceM)}
                y={svgHeight - 12}
                textAnchor="middle"
                fontSize="8"
                fill="currentColor"
                opacity="0.7"
              >
                {s.distanceM}m
              </text>
            </g>
          ))}
        </svg>

        {/* Dynamic Station Readout Footer */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--md-sys-color-surface-container)] text-xs border-t border-[var(--md-sys-color-outline-variant)] font-mono">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">
            Chainage: <strong className="text-[var(--md-sys-color-on-surface)]">{activeStation.distanceM} m</strong>
          </span>
          <span className="text-blue-600 font-semibold">
            HGL: {activeStation.hglElevationM.toFixed(2)} m
          </span>
          <span className="text-red-600 font-semibold">
            EGL: {activeStation.eglElevationM.toFixed(2)} m
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">
            Gauge Pressure: {activeStation.pressureKpa.toFixed(1)} kPa
          </span>
        </div>
      </div>
    </div>
  );
};
