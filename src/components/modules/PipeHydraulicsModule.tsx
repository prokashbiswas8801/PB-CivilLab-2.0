import React, { useState } from 'react';
import {
  CivilWorkspace,
  PipeMaterialType,
  PipeServiceType,
  CustomUnitDefinition,
  UnitCategoryKey,
  TakeoffLineItem,
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
      {/* Service Mode Selector: Pressure Water Main vs Gravity Storm Sewer vs Deep Tubewell & Plumbing */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-1.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
        <button
          type="button"
          onClick={() => updatePipe({ serviceType: 'pressure' })}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            (pipe.serviceType || 'pressure') === 'pressure'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          Pressure Pipe Main
        </button>
        <button
          type="button"
          onClick={() => updatePipe({ serviceType: 'gravity-storm' })}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            pipe.serviceType === 'gravity-storm'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          Storm Sewer (Gravity)
        </button>
        <button
          type="button"
          onClick={() => updatePipe({ serviceType: 'tubewell-plumbing', pipeMaterial: 'pvc' })}
          className={`flex-1 min-w-[180px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            pipe.serviceType === 'tubewell-plumbing'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          Tubewell &amp; Plumbing Sizer (BNBC)
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
          onChangeSI={(val) => updatePipe({ lengthM: Math.max(0, val) })}
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
            onChangeSI={(val) => updatePipe({ flowRateLps: Math.max(0, val * 1000) })}
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
          min={-1000}
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
          min={-1000}
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

      {/* Deep Tubewell & BNBC-2020 Plumbing Fixtures Schedule Panel (Active in tubewell-plumbing mode) */}
      {pipe.serviceType === 'tubewell-plumbing' && (
        <div className="space-y-3.5 p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold font-mono text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-600" />
              <span>Deep Tubewell, Submersible Pump &amp; uPVC Sizer (BNBC-2020 Part 8)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-600 text-white font-semibold">
              BDS 845 / ISO 1452
            </span>
          </div>

          {/* Submersible Pump & Well Geohydrology Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold mb-1">Tubewell Depth (m)</label>
              <input
                type="number"
                step="5"
                min="10"
                max="350"
                value={pipe.tubewellDepthM ?? 60}
                onChange={(e) => updatePipe({ tubewellDepthM: Math.max(0, Number(e.target.value)) })}
                className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Borehole depth</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Static Water Level SWL (m)</label>
              <input
                type="number"
                step="1"
                min="1"
                max="100"
                value={pipe.staticWaterLevelM ?? 25}
                onChange={(e) => updatePipe({ staticWaterLevelM: Math.max(0, Number(e.target.value)) })}
                className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Resting water table</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Pumping Drawdown (m)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={pipe.drawdownM ?? 6}
                onChange={(e) => updatePipe({ drawdownM: Math.max(0, Number(e.target.value)) })}
                className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Cone of depression</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Overhead Tank Head (m)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={pipe.deliveryHeadM ?? 20}
                onChange={(e) => updatePipe({ deliveryHeadM: Math.max(0, Number(e.target.value)) })}
                className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Rooftop OHT elevation</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">uPVC Pipe Class</label>
              <select
                value={pipe.upvcClass || 'Class C (9 bar)'}
                onChange={(e) => updatePipe({ upvcClass: e.target.value as any })}
                className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              >
                <option value="Class B (6 bar)">Class B: 6 bar (60m head)</option>
                <option value="Class C (9 bar)">Class C: 9 bar (90m head - BDS 845)</option>
                <option value="Class D (12 bar)">Class D: 12 bar (120m head)</option>
                <option value="Class E (15 bar)">Class E: 15 bar (150m head)</option>
              </select>
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">ISO 1452 pressure rating</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Pump Efficiency (%)</label>
              <input
                type="number"
                step="5"
                min="40"
                max="95"
                value={pipe.pumpEfficiencyPercent ?? 70}
                onChange={(e) => updatePipe({ pumpEfficiencyPercent: Math.max(10, Math.min(95, Number(e.target.value))) })}
                className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Submersible bowl eff.</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Motor Efficiency (%)</label>
              <input
                type="number"
                step="5"
                min="50"
                max="98"
                value={pipe.motorEfficiencyPercent ?? 85}
                onChange={(e) => updatePipe({ motorEfficiencyPercent: Math.max(10, Math.min(98, Number(e.target.value))) })}
                className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Wet stator motor eff.</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Riser DN (mm)</label>
              <select
                value={pipe.internalDiameterMm || 50}
                onChange={(e) => updatePipe({ internalDiameterMm: Number(e.target.value) })}
                className="w-full min-h-[40px] px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              >
                <option value="40">DN 40 mm (1.5")</option>
                <option value="50">DN 50 mm (2")</option>
                <option value="65">DN 65 mm (2.5")</option>
                <option value="75">DN 75 mm (3")</option>
                <option value="100">DN 100 mm (4")</option>
                <option value="150">DN 150 mm (6")</option>
              </select>
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Column pipe diameter</span>
            </div>
          </div>

          {/* BNBC-2020 Plumbing Fixtures Schedule Table */}
          <div className="pt-2 border-t border-blue-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                BNBC-2020 Building Fixture Count (WSFU &amp; DFU Schedule)
              </span>
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                BNBC Part 8 Table 8.1.1 &amp; 8.2.1
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Water Closets (WC)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pipe.fixtureWaterClosets ?? 6}
                  onChange={(e) => updatePipe({ fixtureWaterClosets: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs"
                />
                <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">3 WSFU · 4 DFU</span>
              </div>

              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Wash Basins (WB)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pipe.fixtureWashBasins ?? 6}
                  onChange={(e) => updatePipe({ fixtureWashBasins: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs"
                />
                <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">1.5 WSFU · 1 DFU</span>
              </div>

              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Showers
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pipe.fixtureShowers ?? 4}
                  onChange={(e) => updatePipe({ fixtureShowers: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs"
                />
                <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">2 WSFU · 2 DFU</span>
              </div>

              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Kitchen Sinks
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pipe.fixtureKitchenSinks ?? 2}
                  onChange={(e) => updatePipe({ fixtureKitchenSinks: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs"
                />
                <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">2 WSFU · 2 DFU</span>
              </div>

              <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/30">
                <label className="block text-[10px] font-semibold text-amber-700 dark:text-amber-400 mb-1">
                  Floor Drains (FD)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pipe.fixtureFloorDrains ?? 4}
                  onChange={(e) => updatePipe({ fixtureFloorDrains: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                />
                <span className="text-[9px] text-amber-600">Strainer only (2 DFU)</span>
              </div>

              <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/30">
                <label className="block text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  Floor Traps (FT)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pipe.fixtureFloorTraps ?? 4}
                  onChange={(e) => updatePipe({ fixtureFloorTraps: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                />
                <span className="text-[9px] text-emerald-600">Water Seal Trap (2 DFU)</span>
              </div>

              <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <label className="block text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Urinals
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pipe.fixtureUrinals ?? 0}
                  onChange={(e) => updatePipe({ fixtureUrinals: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs"
                />
                <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">2 WSFU · 2 DFU</span>
              </div>
            </div>

            <div className="p-2 mt-2 rounded bg-blue-500/10 border border-blue-500/20 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              <strong>BNBC-2020 Clause 2.4 Definition:</strong> <em>Floor Drain (FD)</em> provides surface water intake via a removable grating/strainer. <em>Floor Trap (FT / Nahani Trap)</em> incorporates a minimum 50 mm deep water seal to block foul sewer gases.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface PipeHydraulicsMetricsProps {
  result: PipeHydraulicsResult;
  activeWorkspace?: CivilWorkspace;
  updateActiveWorkspace?: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits?: CustomUnitDefinition[];
  getOutputUnit?: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit?: (fieldKey: string, unitId: string) => void;
}

export const PipeHydraulicsMetrics: React.FC<PipeHydraulicsMetricsProps> = ({
  result,
  activeWorkspace,
  updateActiveWorkspace,
  customUnits = [],
  getOutputUnit = (_k, _c, fallback) => fallback,
  updateOutputUnit = () => {},
}) => {
  const isLaminar = result.flowRegime === 'Laminar';
  const isTransitional = result.flowRegime === 'Transitional';
  const isTurbulent = result.flowRegime === 'Turbulent';
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSyncPlumbingToBoq = () => {
    if (!result.tubewellPlumbingAnalysis || !updateActiveWorkspace) return;
    const a = result.tubewellPlumbingAnalysis;
    const now = Date.now();
    const newItems: TakeoffLineItem[] = [
      {
        id: `plumb-pump-${now}`,
        itemNo: 'PL-01',
        description: `Submersible deep tubewell water pump (Rated ${a.recommendedPumpHp} HP, ${a.totalDynamicHeadM}m TDH) with automatic control panel`,
        category: 'plumbing',
        numberOfMembers: 1,
        lengthM: 1,
        widthM: 0,
        heightM: 0,
        deductionQty: 0,
        unit: 'nos',
        wastagePercent: 0,
        unitRate: 65000,
      },
      {
        id: `plumb-riser-${now}`,
        itemNo: 'PL-02',
        description: `Heavy duty uPVC riser column & delivery pipe (${a.upvcClass}, DN ${result.internalDiameterMm} mm) with threaded joints`,
        category: 'plumbing',
        numberOfMembers: 1,
        lengthM: result.lengthM || 60,
        widthM: 0,
        heightM: 0,
        deductionQty: 0,
        unit: 'm',
        wastagePercent: 5,
        unitRate: 480,
      },
      {
        id: `plumb-wc-${now}`,
        itemNo: 'PL-03',
        description: `European water closet (WC) suite with dual-flush ceramic cistern, plastic seat cover & CP angle stopcock`,
        category: 'plumbing',
        numberOfMembers: a.fixtures.waterClosets || 1,
        lengthM: 1,
        widthM: 0,
        heightM: 0,
        deductionQty: 0,
        unit: 'nos',
        wastagePercent: 0,
        unitRate: 8500,
      },
      {
        id: `plumb-wb-${now}`,
        itemNo: 'PL-04',
        description: `Vitreous china wash basin with CP pillar tap, 32mm bottle trap & flexible braided connector`,
        category: 'plumbing',
        numberOfMembers: a.fixtures.washBasins || 1,
        lengthM: 1,
        widthM: 0,
        heightM: 0,
        deductionQty: 0,
        unit: 'nos',
        wastagePercent: 0,
        unitRate: 4200,
      },
      {
        id: `plumb-sh-${now}`,
        itemNo: 'PL-05',
        description: `Overhead shower rose with arm & concealed brass stopcock`,
        category: 'plumbing',
        numberOfMembers: a.fixtures.showers || 1,
        lengthM: 1,
        widthM: 0,
        heightM: 0,
        deductionQty: 0,
        unit: 'nos',
        wastagePercent: 0,
        unitRate: 2800,
      },
      {
        id: `plumb-ks-${now}`,
        itemNo: 'PL-06',
        description: `Stainless steel kitchen sink (single bowl) with CP swivel swan-neck bib cock & 40mm waste trap`,
        category: 'plumbing',
        numberOfMembers: a.fixtures.kitchenSinks || 1,
        lengthM: 1,
        widthM: 0,
        heightM: 0,
        deductionQty: 0,
        unit: 'nos',
        wastagePercent: 0,
        unitRate: 5500,
      },
      {
        id: `plumb-fd-${now}`,
        itemNo: 'PL-07',
        description: `Floor Drain (FD): PVC/CI floor drain with removable stainless steel strainer grating (strainer type)`,
        category: 'plumbing',
        numberOfMembers: a.fixtures.floorDrains || 1,
        lengthM: 1,
        widthM: 0,
        heightM: 0,
        deductionQty: 0,
        unit: 'nos',
        wastagePercent: 0,
        unitRate: 650,
      },
      {
        id: `plumb-ft-${now}`,
        itemNo: 'PL-08',
        description: `Floor Trap (FT / Nahani Trap): Deep water-seal floor trap (min 50mm seal) with integrated mosquito barrier grating`,
        category: 'plumbing',
        numberOfMembers: a.fixtures.floorTraps || 1,
        lengthM: 1,
        widthM: 0,
        heightM: 0,
        deductionQty: 0,
        unit: 'nos',
        wastagePercent: 0,
        unitRate: 950,
      },
    ];

    updateActiveWorkspace((ws) => {
      const existingWithoutPlumb = (ws.boq.items || []).filter(item => !item.id.startsWith('plumb-'));
      return {
        ...ws,
        boq: {
          ...ws.boq,
          items: [...existingWithoutPlumb, ...newItems],
        },
      };
    });

    setSyncNotice(`Synced ${newItems.length} plumbing line items to BOQ!`);
    setTimeout(() => setSyncNotice(null), 3500);
  };

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      {/* Deep Tubewell, Submersible Pump & uPVC Plumbing Analysis Card (when in tubewell mode) */}
      {result.tubewellPlumbingAnalysis && (() => {
        const a = result.tubewellPlumbingAnalysis;
        return (
          <div className="p-4 rounded-xl border border-blue-500/40 bg-blue-500/5 space-y-3 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                    <span>Deep Tubewell &amp; Submersible Pump Sizing</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                      {a.recommendedPumpHp} HP PUMP RECOMMENDED
                    </span>
                  </h4>
                  <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    BNBC-2020 Part 8 · BDS 845 / ISO 1452 Pipe Pressure Containment
                  </div>
                </div>
              </div>

              {updateActiveWorkspace && (
                <button
                  type="button"
                  onClick={handleSyncPlumbingToBoq}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{syncNotice ? syncNotice : 'Sync Fixtures & Pipes to BOQ Plumbing'}</span>
                </button>
              )}
            </div>

            {/* Submersible Pump Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Dynamic Water Level</span>
                <strong className="text-sm text-[var(--md-sys-color-on-surface)]">{a.dynamicWaterLevelM} m</strong>
                <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] block mt-0.5">SWL ({a.staticWaterLevelM}m) + DD ({a.drawdownM}m)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Total Dynamic Head (TDH)</span>
                <strong className="text-sm text-blue-600">{a.totalDynamicHeadM} m</strong>
                <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] block mt-0.5">hf,riser ({a.riserFrictionLossM}m) + delivery</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Brake Power / Motor</span>
                <strong className="text-sm text-[var(--md-sys-color-on-surface)]">{a.brakePowerKw} kW / {a.motorPowerKw} kW</strong>
                <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] block mt-0.5">Req. Motor: {a.pumpMotorHp} HP</span>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-500/40">
                <span className="text-[10px] text-blue-700 dark:text-blue-300 block font-semibold">Recommended Commercial Pump</span>
                <strong className="text-base text-blue-700 dark:text-blue-200 block">{a.recommendedPumpHp} HP Submersible</strong>
                <span className="text-[9px] text-blue-600 block mt-0.5">Rated for {a.totalDynamicHeadM}m TDH</span>
              </div>
            </div>

            {/* uPVC Class Bursting & BDS 845 Check */}
            <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                  uPVC Pipe Class Bursting Resistance (BDS 845 / ISO 1452)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.isPressureSafe ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/20 text-rose-600'}`}>
                  {a.isPressureSafe ? 'PRESSURE SAFE' : 'EXCEEDS CLASS RATING'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                <div>Operating: <strong className="text-[var(--md-sys-color-on-surface)]">{a.operatingPressureBar} bar</strong></div>
                <div>Class Rating: <strong className="text-[var(--md-sys-color-on-surface)]">{a.allowablePressureBar} bar ({a.upvcClass})</strong></div>
                <div>Min Wall req. (emin): <strong className="text-[var(--md-sys-color-on-surface)]">{a.minWallThicknessMm} mm</strong></div>
                <div>Safety Factor: <strong className={a.isPressureSafe ? 'text-emerald-600' : 'text-rose-600'}>{a.burstingSafetyFactor}x</strong></div>
              </div>
            </div>

            {/* BNBC-2020 Fixtures Demand & Sizing Summary */}
            <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                  BNBC-2020 Water Supply &amp; Drainage Schedule
                </span>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Peak Demand: <strong className="text-[var(--md-sys-color-on-surface)]">{a.fixtureDemandLps} L/s</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                <div>Total WSFU: <strong className="text-[var(--md-sys-color-on-surface)]">{a.totalWsfu}</strong></div>
                <div>Total DFU: <strong className="text-[var(--md-sys-color-on-surface)]">{a.totalDfu}</strong></div>
                <div>Rec. Supply Pipe: <strong className="text-blue-600">DN {a.recommendedSupplyDn} mm</strong></div>
                <div>Rec. Waste Stack: <strong className="text-blue-600">DN {a.recommendedDrainDn} mm</strong></div>
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1.5 pt-1.5 border-t border-[var(--md-sys-color-outline-variant)]/50">
                Schedule count: {a.fixtures.waterClosets} WCs · {a.fixtures.washBasins} Basins · {a.fixtures.showers} Showers · {a.fixtures.kitchenSinks} Sinks · <span className="font-bold text-amber-600">{a.fixtures.floorDrains} Floor Drains (FD, strainer)</span> · <span className="font-bold text-emerald-600">{a.fixtures.floorTraps} Floor Traps (FT, water seal)</span>
              </div>
            </div>
          </div>
        );
      })()}
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
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none font-nikosh">
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
