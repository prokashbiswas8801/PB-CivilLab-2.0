import React, { useState } from 'react';
import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
  ChannelShapeType,
} from '../../types/civil';
import { ChannelHydraulicsResult } from '../../utils/calculations';
import { HYDRAULIC_MATERIALS } from '../../utils/hydraulicsSolver';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';
import {
  Waves,
  AlertTriangle,
  Info,
  Sliders,
  TrendingDown,
  Layers,
  Activity,
  CheckCircle2,
  Gauge,
  ArrowRight,
} from 'lucide-react';

export interface OpenChannelInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

export const OpenChannelInputs: React.FC<OpenChannelInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  const channel = activeWorkspace.channel;
  const currentShape: ChannelShapeType =
    channel.shape || (channel.sideSlopeZ === 0 ? 'rectangular' : 'trapezoidal');

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    channel.materialId || (channel.manningN <= 0.011 ? 'pvc' : channel.manningN <= 0.014 ? 'concrete' : 'channel-earth-uniform')
  );

  const handleShapeChange = (shape: ChannelShapeType) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      channel: {
        ...ws.channel,
        shape,
        sideSlopeZ: shape === 'rectangular' ? 0 : shape === 'circular' ? 0 : ws.channel.sideSlopeZ || 1.5,
        diameterM: ws.channel.diameterM || 1.2,
      },
    }));
  };

  const handleMaterialPreset = (matId: string) => {
    const mat = HYDRAULIC_MATERIALS.find((m) => m.id === matId);
    if (!mat) return;
    setSelectedMaterialId(matId);
    updateActiveWorkspace((ws) => ({
      ...ws,
      channel: {
        ...ws.channel,
        manningN: mat.manningN,
        materialId: matId,
      },
    }));
  };

  return (
    <div className="space-y-4">
      {/* Channel Geometry Shape Selector */}
      <div>
        <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Channel Cross-Section Geometry
          </span>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Manning & Froude Solvers
          </span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'trapezoidal' as ChannelShapeType, label: 'Trapezoidal', sub: 'b + side slope z:1', icon: '⏢' },
            { id: 'rectangular' as ChannelShapeType, label: 'Rectangular', sub: 'Flume / Box Culvert', icon: '▭' },
            { id: 'circular' as ChannelShapeType, label: 'Circular Conduit', sub: 'Gravity Storm Sewer', icon: '◯' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleShapeChange(item.id)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                currentShape === item.id
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs'
                  : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-base font-mono font-bold opacity-75">{item.icon}</span>
              </div>
              <div className="text-[11px] opacity-75 mt-0.5">{item.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Dimensional Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentShape === 'circular' ? (
          <UnitInput
            label="Internal Diameter (D)"
            category="length"
            siValue={channel.diameterM || 1.2}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                channel: { ...ws.channel, diameterM: Math.max(0.1, val) },
              }));
            }}
            currentUnitId={getFieldUnit('hyd.D', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('hyd.D', u)}
            customUnits={customUnits}
            step={0.1}
          />
        ) : (
          <UnitInput
            label="Bed Width (b)"
            category="length"
            siValue={channel.bottomWidthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                channel: { ...ws.channel, bottomWidthM: Math.max(0.1, val) },
              }));
            }}
            currentUnitId={getFieldUnit('hyd.b', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('hyd.b', u)}
            customUnits={customUnits}
            step={0.2}
          />
        )}

        <UnitInput
          label={currentShape === 'circular' ? 'Flow Depth (y ≤ D)' : 'Flow Depth (y)'}
          category="length"
          siValue={channel.flowDepthM}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              channel: { ...ws.channel, flowDepthM: Math.max(0.01, val) },
            }));
          }}
          currentUnitId={getFieldUnit('hyd.y', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('hyd.y', u)}
          customUnits={customUnits}
          step={0.1}
        />
      </div>

      {/* Slope & Roughness Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <UnitInput
          label="Bed Slope (S₀)"
          category="slope"
          siValue={channel.bedSlope}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              channel: { ...ws.channel, bedSlope: Math.max(0.00001, val) },
            }));
          }}
          currentUnitId={getFieldUnit('hyd.slope', 'slope', 'ratio')}
          onUnitChange={(u) => updateFieldUnit('hyd.slope', u)}
          customUnits={customUnits}
          step={0.0005}
        />

        {currentShape === 'trapezoidal' ? (
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Side Slope z (z:1 H:V)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={channel.sideSlopeZ}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value) || 0);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  channel: { ...ws.channel, sideSlopeZ: val },
                }));
              }}
              placeholder="1.5 for earth, 0.5 for rock"
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            />
            <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
              Horizontal:Vertical ratio
            </div>
          </div>
        ) : (
          <UnitInput
            label="Freeboard Requirement"
            category="length"
            siValue={channel.freeboardRequirementM || 0.3}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                channel: { ...ws.channel, freeboardRequirementM: Math.max(0, val) },
              }));
            }}
            currentUnitId={getFieldUnit('hyd.freeboard', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('hyd.freeboard', u)}
            customUnits={customUnits}
            step={0.05}
          />
        )}

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Manning Roughness n
          </label>
          <input
            type="number"
            step="0.001"
            min="0.008"
            max="0.08"
            value={channel.manningN}
            onChange={(e) => {
              const val = Math.max(0.008, Math.min(0.08, Number(e.target.value) || 0.015));
              updateActiveWorkspace((ws) => ({
                ...ws,
                channel: { ...ws.channel, manningN: val },
              }));
            }}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          />
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Gauckler-Manning coefficient
          </div>
        </div>
      </div>

      {/* Automated Roughness Coefficient Selector */}
      <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            Automated Roughness Presets (n)
          </span>
          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Chow & ASCE Engineering Standard
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'pvc', label: 'PVC', n: 0.009 },
            { id: 'hdpe', label: 'HDPE', n: 0.010 },
            { id: 'ductile-iron', label: 'Ductile Iron', n: 0.012 },
            { id: 'concrete', label: 'Concrete (Precast/Lined)', n: 0.013 },
            { id: 'corrugated-steel', label: 'Corrugated Steel (CSP)', n: 0.024 },
            { id: 'channel-earth-uniform', label: 'Earth Uniform', n: 0.022 },
            { id: 'channel-riprap', label: 'Riprap / Rock', n: 0.038 },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleMaterialPreset(preset.id)}
              className={`px-2.5 py-1 text-xs rounded-lg border font-mono transition-colors ${
                Math.abs(channel.manningN - preset.n) < 0.0005
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                  : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
            >
              {preset.label} <span className="opacity-75">n={preset.n}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export interface OpenChannelMetricsProps {
  result: ChannelHydraulicsResult;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
}

export const OpenChannelMetrics: React.FC<OpenChannelMetricsProps> = ({
  result,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
}) => {
  const isSupercritical = result.flowRegime === 'Supercritical';
  const isCritical = result.flowRegime === 'Critical';
  const isSubcritical = result.flowRegime === 'Subcritical';

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      {/* Primary Hydraulic Discharge & Velocity Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UnitValueDisplay
          label="Flow Discharge (Q)"
          category="flow_rate"
          siValue={result.dischargeM3ps}
          currentUnitId={getOutputUnit('hyd.out.Q', 'flow_rate', 'm3/s')}
          onUnitChange={(u) => updateOutputUnit('hyd.out.Q', u)}
          customUnits={customUnits}
          highlight={true}
        />
        <UnitValueDisplay
          label="Mean Velocity (V)"
          category="velocity"
          siValue={result.velocityMps}
          currentUnitId={getOutputUnit('hyd.out.V', 'velocity', 'm/s')}
          onUnitChange={(u) => updateOutputUnit('hyd.out.V', u)}
          customUnits={customUnits}
        />
        <UnitValueDisplay
          label="Wetted Flow Area (A)"
          category="area"
          siValue={result.flowAreaM2}
          currentUnitId={getOutputUnit('hyd.out.A', 'area', 'm2')}
          onUnitChange={(u) => updateOutputUnit('hyd.out.A', u)}
          customUnits={customUnits}
        />
        <UnitValueDisplay
          label="Hydraulic Radius (Rh)"
          category="length"
          siValue={result.hydraulicRadiusM}
          currentUnitId={getOutputUnit('hyd.out.Rh', 'length', 'm')}
          onUnitChange={(u) => updateOutputUnit('hyd.out.Rh', u)}
          customUnits={customUnits}
        />
      </div>

      {/* Flow Regime & Froude Number Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Froude & Regime Status */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            isSupercritical
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
              : isCritical
              ? 'bg-purple-500/10 border-purple-500/40 text-purple-900 dark:text-purple-200'
              : 'bg-blue-500/10 border-blue-500/40 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4" />
                Froude Number (Fr)
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isSupercritical
                    ? 'bg-amber-500 text-white'
                    : isCritical
                    ? 'bg-purple-500 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {result.flowRegime}
              </span>
            </div>
            <div className="text-2xl font-black font-mono mt-1">
              Fr = {result.froudeNumber.toFixed(3)}
            </div>
          </div>
          <div className="text-[11px] opacity-85 mt-2">
            {isSupercritical
              ? 'Supercritical (Fr > 1.0): Rapid shooting flow with upstream control. Hydraulic jump risk downstream.'
              : isCritical
              ? 'Critical Flow (Fr ≈ 1.0): Flow operates at minimum specific energy with unstable surface ripples.'
              : 'Subcritical (Fr < 1.0): Tranquil, stable flow with downstream tailwater control. Gravity waves travel upstream.'}
          </div>
        </div>

        {/* Critical Depth & Specific Energy */}
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
          <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
            <span>Critical Depth & Energy</span>
            <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-2 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Critical Depth (yc):</span>
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">{result.criticalDepthM.toFixed(3)} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Critical Velocity (Vc):</span>
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">{result.criticalVelocityMps.toFixed(2)} m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Specific Energy (E):</span>
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">{result.specificEnergyM.toFixed(3)} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Min Energy (Emin):</span>
              <span className="font-bold text-blue-600">{result.minSpecificEnergyM.toFixed(3)} m</span>
            </div>
          </div>
        </div>

        {/* Circular / Boundary Metrics */}
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
          <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
            <span>{result.shape === 'circular' ? 'Storm Conduit Metrics' : 'Boundary Shear Stress'}</span>
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          {result.shape === 'circular' && result.fillingRatio !== undefined ? (
            <div className="mt-2 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Conduit Diameter:</span>
                <span className="font-bold">{result.diameterM?.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Filling Ratio (y/D):</span>
                <span className={`font-bold ${result.fillingRatio > 0.85 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {(result.fillingRatio * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Full Discharge (Qfull):</span>
                <span className="font-bold">{result.fullDischargeM3ps?.toFixed(3)} m³/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Q / Qfull:</span>
                <span className="font-bold">
                  {result.fullDischargeM3ps ? (result.dischargeM3ps / result.fullDischargeM3ps).toFixed(2) : '-'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Bed Shear (τ₀):</span>
                <span className="font-bold">{result.shearStressPa.toFixed(2)} N/m² (Pa)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Top Water Width:</span>
                <span className="font-bold">{result.topWidthM.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Hydraulic Depth:</span>
                <span className="font-bold">{result.hydraulicDepthM.toFixed(3)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Wetted Perimeter:</span>
                <span className="font-bold">{result.wettedPerimeterM.toFixed(2)} m</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hydraulic Jump Analysis Banner (Supercritical Flow Transition) */}
      {result.hydraulicJump.isOccurring && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  Hydraulic Jump Warning: Supercritical Transition (Fr = {result.froudeNumber.toFixed(2)})
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-600 text-white font-mono font-semibold">
                  {result.hydraulicJump.jumpType}
                </span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                {result.hydraulicJump.description} A hydraulic jump will form where supercritical flow enters downstream subcritical conditions, generating intense turbulence and energy dissipation.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-500/20 text-xs font-mono">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <div className="text-[10px] opacity-75">Initial Depth (y₁)</div>
                  <div className="font-bold text-sm">{result.hydraulicJump.initialDepthM.toFixed(3)} m</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <div className="text-[10px] opacity-75">Sequent Depth (y₂)</div>
                  <div className="font-bold text-sm text-amber-700 dark:text-amber-300">
                    {result.hydraulicJump.sequentDepthM.toFixed(3)} m
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <div className="text-[10px] opacity-75">Head Loss (ΔE)</div>
                  <div className="font-bold text-sm text-red-600 dark:text-red-400">
                    {result.hydraulicJump.headLossM.toFixed(3)} m ({result.hydraulicJump.energyDissipatedPercent}%)
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <div className="text-[10px] opacity-75">Jump Length (Lj)</div>
                  <div className="font-bold text-sm">{result.hydraulicJump.jumpLengthM.toFixed(2)} m</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive EGL & HGL Profile Visualizer Component */}
      <OpenChannelEglHglPlot result={result} />
    </div>
  );
};

/**
 * Interactive SVG Longitudinal Profile Plot for EGL and HGL
 */
export const OpenChannelEglHglPlot: React.FC<{ result: ChannelHydraulicsResult }> = ({ result }) => {
  const [hoveredStation, setHoveredStation] = useState<number | null>(null);
  const profile = result.eglHglProfile;
  if (!profile || profile.length < 2) return null;

  // ViewBox coordinates
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const maxStation = profile[profile.length - 1].stationM || 100;
  const allZ = profile.flatMap((p) => [p.bedElevationM, p.waterSurfaceHglM, p.energyLineEglM, p.criticalLineZ]);
  const minZ = Math.min(...allZ) - 0.2;
  const maxZ = Math.max(...allZ) + 0.4;
  const zRange = Math.max(0.5, maxZ - minZ);

  const scaleX = (st: number) => padLeft + (st / maxStation) * plotW;
  const scaleY = (z: number) => padTop + plotH - ((z - minZ) / zRange) * plotH;

  // Polyline points
  const bedPoints = profile.map((p) => `${scaleX(p.stationM)},${scaleY(p.bedElevationM)}`).join(' ');
  const hglPoints = profile.map((p) => `${scaleX(p.stationM)},${scaleY(p.waterSurfaceHglM)}`).join(' ');
  const eglPoints = profile.map((p) => `${scaleX(p.stationM)},${scaleY(p.energyLineEglM)}`).join(' ');
  const critPoints = profile.map((p) => `${scaleX(p.stationM)},${scaleY(p.criticalLineZ)}`).join(' ');

  // Water polygon between bed and water surface
  const waterPolygon = [
    ...profile.map((p) => `${scaleX(p.stationM)},${scaleY(p.waterSurfaceHglM)}`),
    ...profile.slice().reverse().map((p) => `${scaleX(p.stationM)},${scaleY(p.bedElevationM)}`),
  ].join(' ');

  // Velocity head band between HGL and EGL
  const velocityHeadPolygon = [
    ...profile.map((p) => `${scaleX(p.stationM)},${scaleY(p.energyLineEglM)}`),
    ...profile.slice().reverse().map((p) => `${scaleX(p.stationM)},${scaleY(p.waterSurfaceHglM)}`),
  ].join(' ');

  const activeData = hoveredStation !== null ? profile[hoveredStation] : profile[0];

  return (
    <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
            Longitudinal Energy (EGL) & Hydraulic (HGL) Grade Line Profile
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-red-500 inline-block rounded-xs"></span>
            EGL (Total Energy)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-blue-500 inline-block rounded-xs"></span>
            HGL (Water Surface)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 border-t border-dashed border-amber-500 inline-block"></span>
            Critical Depth (yc)
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none font-mono">
          <defs>
            <linearGradient id="channelWaterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="velocityHeadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
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
                  {zVal.toFixed(2)} m
                </text>
              </g>
            );
          })}

          {/* Shaded water polygon */}
          <polygon points={waterPolygon} fill="url(#channelWaterGrad)" />

          {/* Shaded velocity head band */}
          <polygon points={velocityHeadPolygon} fill="url(#velocityHeadGrad)" />

          {/* Bed Profile */}
          <polyline
            points={bedPoints}
            fill="none"
            stroke="#475569"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Critical Depth line */}
          <polyline
            points={critPoints}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />

          {/* HGL Line */}
          <polyline
            points={hglPoints}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
          />

          {/* EGL Line */}
          <polyline
            points={eglPoints}
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
          />

          {/* Hydraulic Jump Graphic indicator if supercritical */}
          {result.hydraulicJump.isOccurring && (
            <g transform={`translate(${scaleX(maxStation * 0.7)}, ${scaleY(profile[0].waterSurfaceHglM) - 15})`}>
              <rect x="-40" y="-12" width="80" height="18" rx="4" fill="#f59e0b" opacity="0.95" />
              <text x="0" y="0" textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold">
                ⚡ Jump Zone
              </text>
            </g>
          )}

          {/* Hover interactive markers */}
          {profile.map((p, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredStation(idx)}
              onMouseLeave={() => setHoveredStation(null)}
            >
              <line
                x1={scaleX(p.stationM)}
                y1={padTop}
                x2={scaleX(p.stationM)}
                y2={scaleY(p.bedElevationM)}
                stroke="currentColor"
                strokeOpacity={hoveredStation === idx ? "0.4" : "0.05"}
                strokeWidth={hoveredStation === idx ? "1.5" : "1"}
              />
              <circle
                cx={scaleX(p.stationM)}
                cy={scaleY(p.waterSurfaceHglM)}
                r={hoveredStation === idx ? "5" : "3"}
                fill="#2563eb"
              />
              <circle
                cx={scaleX(p.stationM)}
                cy={scaleY(p.energyLineEglM)}
                r={hoveredStation === idx ? "4" : "2.5"}
                fill="#dc2626"
              />
              {/* Station X Axis labels */}
              <text
                x={scaleX(p.stationM)}
                y={svgHeight - 12}
                textAnchor="middle"
                fontSize="8"
                fill="currentColor"
                opacity="0.7"
              >
                {p.stationM}m
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Readout Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--md-sys-color-surface-container)] text-xs border-t border-[var(--md-sys-color-outline-variant)] font-mono">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">
            Station: <strong className="text-[var(--md-sys-color-on-surface)]">{activeData.stationM.toFixed(1)} m</strong>
          </span>
          <span className="text-blue-600 font-semibold">
            HGL: {activeData.waterSurfaceHglM.toFixed(2)} m
          </span>
          <span className="text-red-600 font-semibold">
            EGL: {activeData.energyLineEglM.toFixed(2)} m
          </span>
          <span className="text-amber-600 font-semibold">
            Velocity Head (V²/2g): {activeData.velocityHeadM.toFixed(3)} m
          </span>
        </div>
      </div>
    </div>
  );
};
