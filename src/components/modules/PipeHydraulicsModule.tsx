import React from 'react';
import {
  CivilWorkspace,
  PipeMaterialType,
} from '../../types/civil';
import { PipeHydraulicsResult } from '../../utils/calculations';
import { Waves, Activity, ShieldCheck, Gauge } from 'lucide-react';

export interface PipeHydraulicsInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
}

export const PipeHydraulicsInputs: React.FC<PipeHydraulicsInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
}) => {
  const pipe = activeWorkspace.pipe || {
    pipeMaterial: 'pvc-hdpe',
    hazenWilliamsC: 150,
    internalDiameterMm: 250,
    lengthM: 180,
    flowRateLps: 45,
    inletElevationM: 25.0,
    outletElevationM: 18.0,
    inletPressureKpa: 300,
    minorLossCoefficientK: 2.0,
    waterTempC: 20,
  };

  const updatePipe = (patch: Partial<typeof pipe>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      pipe: { ...pipe, ...patch },
    }));
  };

  const handleMaterialChange = (mat: PipeMaterialType) => {
    const cMap: Record<PipeMaterialType, number> = {
      'pvc-hdpe': 150,
      'ductile-iron': 130,
      'cast-iron': 100,
      'concrete': 120,
      'galvanized-steel': 120,
    };
    updatePipe({
      pipeMaterial: mat,
      hazenWilliamsC: cMap[mat] || 130,
    });
  };

  return (
    <div className="space-y-4">
      {/* Pipe Material & Hazen-Williams Roughness */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Pipe Material
          </label>
          <select
            value={pipe.pipeMaterial}
            onChange={(e) => handleMaterialChange(e.target.value as PipeMaterialType)}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          >
            <option value="pvc-hdpe">PVC / HDPE (C = 150)</option>
            <option value="ductile-iron">Ductile Iron (Cement Lined, C = 130)</option>
            <option value="concrete">Precast Concrete / RCC (C = 120)</option>
            <option value="galvanized-steel">Galvanized Steel / GI (C = 120)</option>
            <option value="cast-iron">Unlined Cast Iron (C = 100)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Hazen-Williams Roughness C
          </label>
          <input
            type="number"
            value={pipe.hazenWilliamsC}
            onChange={(e) => updatePipe({ hazenWilliamsC: Math.max(40, Math.min(160, Number(e.target.value) || 130)) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="5"
            min="40"
            max="160"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Internal Diameter D (mm)
          </label>
          <input
            type="number"
            value={pipe.internalDiameterMm}
            onChange={(e) => updatePipe({ internalDiameterMm: Math.max(25, Number(e.target.value) || 200) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="25"
            min="25"
          />
        </div>
      </div>

      {/* Hydraulic Flow, Length & Pressure Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Flow Rate Q (L/s)
          </label>
          <input
            type="number"
            value={pipe.flowRateLps}
            onChange={(e) => updatePipe({ flowRateLps: Math.max(0.1, Number(e.target.value) || 10) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="5"
            min="0.1"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Pipe Length L (m)
          </label>
          <input
            type="number"
            value={pipe.lengthM}
            onChange={(e) => updatePipe({ lengthM: Math.max(1, Number(e.target.value) || 50) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="10"
            min="1"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Inlet Pressure (kPa)
          </label>
          <input
            type="number"
            value={pipe.inletPressureKpa}
            onChange={(e) => updatePipe({ inletPressureKpa: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="25"
            min="0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Inlet Elevation z1 (m)
          </label>
          <input
            type="number"
            value={pipe.inletElevationM}
            onChange={(e) => updatePipe({ inletElevationM: Number(e.target.value) || 0 })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="1"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Outlet Elevation z2 (m)
          </label>
          <input
            type="number"
            value={pipe.outletElevationM}
            onChange={(e) => updatePipe({ outletElevationM: Number(e.target.value) || 0 })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="1"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Minor Loss Coeff ΣK
          </label>
          <input
            type="number"
            value={pipe.minorLossCoefficientK}
            onChange={(e) => updatePipe({ minorLossCoefficientK: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="0.5"
            min="0"
          />
        </div>
      </div>
    </div>
  );
};

export interface PipeHydraulicsMetricsProps {
  result: PipeHydraulicsResult;
}

export const PipeHydraulicsMetrics: React.FC<PipeHydraulicsMetricsProps> = ({ result }) => {
  return (
    <div className="space-y-4">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Flow Velocity (V)
          </div>
          <div className="text-xl font-mono font-bold text-sky-600 dark:text-sky-400">
            {result.velocityMps.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">m/s</span>
          </div>
          <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            {result.selfCleansingStatus === 'pass' ? '✓ Self-Cleansing' : '⚠ Sub-Critical Sluggish'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Friction Head Loss (h_f)
          </div>
          <div className="text-xl font-mono font-bold text-rose-600 dark:text-rose-400">
            {result.frictionHeadLossM.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">m</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Slope Sf = {result.frictionSlopeMPerM} m/m
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Residual Outlet Pressure
          </div>
          <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {result.outletPressureKpa.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">kPa</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Delivery Terminal Head
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Reynolds Number (Re)
          </div>
          <div className="text-xl font-mono font-bold text-[var(--md-sys-color-on-surface)]">
            {result.reynoldsNumber.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-[var(--md-sys-color-primary)]">
            Flow Regime: {result.flowRegime}
          </div>
        </div>
      </div>

      {/* Hydraulic Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="font-bold text-[var(--md-sys-color-primary)]">Energy Grade Line (EGL)</div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Inlet EGL: <strong>{result.inletTotalHeadM} m</strong>
          </div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Outlet EGL: <strong>{result.outletTotalHeadM} m</strong>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Velocity Head: {result.velocityHeadM} m
          </div>
        </div>

        <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="font-bold text-[var(--md-sys-color-primary)]">Head Loss Breakdown</div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Friction Loss h_f: <strong>{result.frictionHeadLossM} m</strong>
          </div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Minor Loss h_m: <strong>{result.minorHeadLossM} m</strong>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Total Dynamic Loss: {result.totalHeadLossM} m
          </div>
        </div>

        <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="font-bold text-[var(--md-sys-color-primary)]">Cross-Sectional Properties</div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Flow Area A: <strong>{result.flowAreaM2} m²</strong>
          </div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Hydraulic Radius R: <strong>{result.hydraulicRadiusM} m</strong>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Discharge Q: {result.flowRateM3ps} m³/s ({result.flowRateLps} L/s)
          </div>
        </div>
      </div>
    </div>
  );
};
