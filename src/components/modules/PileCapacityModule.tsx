import React from 'react';
import {
  CivilWorkspace,
  SoilLayer,
  PileType,
} from '../../types/civil';
import { PileCapacityResult } from '../../utils/calculations';
import { HardHat, Layers, ShieldCheck, Plus, Trash2 } from 'lucide-react';

export interface PileCapacityInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
}

export const PileCapacityInputs: React.FC<PileCapacityInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
}) => {
  const pile = activeWorkspace.pile || {
    pileType: 'bored-cast-in-situ',
    diameterM: 0.6,
    lengthM: 22.0,
    groundwaterDepthM: 3.0,
    appliedLoadKn: 1650,
    factorOfSafety: 2.5,
    layers: [
      { id: 'l1', name: 'Soft Silty Clay (Overburden)', thicknessM: 6.0, soilType: 'clay', cohesionKpa: 28, frictionAngleDeg: 0, unitWeightKnPerM3: 17.5 },
      { id: 'l2', name: 'Medium Dense Silty Sand', thicknessM: 8.0, soilType: 'sand', cohesionKpa: 0, frictionAngleDeg: 30, unitWeightKnPerM3: 18.5 },
      { id: 'l3', name: 'Dense Bearing Sand & Gravel', thicknessM: 10.0, soilType: 'sand', cohesionKpa: 0, frictionAngleDeg: 36, unitWeightKnPerM3: 20.0 },
    ],
    tipBearingCohesionKpa: 0,
    tipBearingFrictionDeg: 36,
    tipBearingUnitWeightKnPerM3: 20.0,
  };

  const updatePile = (patch: Partial<typeof pile>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      pile: { ...pile, ...patch },
    }));
  };

  const updateLayer = (idx: number, patch: Partial<SoilLayer>) => {
    const updated = pile.layers.map((ly, i) => (i === idx ? { ...ly, ...patch } : ly));
    updatePile({ layers: updated });
  };

  const addLayer = () => {
    const newLayer: SoilLayer = {
      id: `layer-${Date.now()}`,
      name: `Strata Layer ${pile.layers.length + 1}`,
      thicknessM: 5.0,
      soilType: 'sand',
      cohesionKpa: 0,
      frictionAngleDeg: 32,
      unitWeightKnPerM3: 19.0,
    };
    updatePile({ layers: [...pile.layers, newLayer] });
  };

  const removeLayer = (idx: number) => {
    if (pile.layers.length <= 1) return;
    updatePile({ layers: pile.layers.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      {/* Top Pile Geometry & Load Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Pile Foundation Type
          </label>
          <select
            value={pile.pileType}
            onChange={(e) => updatePile({ pileType: e.target.value as PileType })}
            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          >
            <option value="bored-cast-in-situ">Bored Cast-in-Situ (BCIS)</option>
            <option value="driven-precast">Driven Precast RCC Pile</option>
            <option value="driven-steel-pipe">Driven Steel Pipe / H-Pile</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Diameter D (m)
          </label>
          <input
            type="number"
            value={pile.diameterM}
            onChange={(e) => updatePile({ diameterM: Math.max(0.2, Number(e.target.value) || 0.6) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="0.05"
            min="0.2"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Embedment Length L (m)
          </label>
          <input
            type="number"
            value={pile.lengthM}
            onChange={(e) => updatePile({ lengthM: Math.max(1.0, Number(e.target.value) || 20) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="1.0"
            min="1.0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Design Axial Load P (kN)
          </label>
          <input
            type="number"
            value={pile.appliedLoadKn}
            onChange={(e) => updatePile({ appliedLoadKn: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="50"
            min="0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Water Table Depth Dw (m)
          </label>
          <input
            type="number"
            value={pile.groundwaterDepthM}
            onChange={(e) => updatePile({ groundwaterDepthM: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="0.5"
            min="0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Safety Factor (BNBC/ACI)
          </label>
          <input
            type="number"
            value={pile.factorOfSafety}
            onChange={(e) => updatePile({ factorOfSafety: Math.max(1.5, Number(e.target.value) || 2.5) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="0.1"
            min="1.5"
            max="4.0"
          />
        </div>
      </div>

      {/* Soil Strata Table */}
      <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-[var(--md-sys-color-on-surface)]">
            <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Soil Stratification &amp; Geotechnical Parameters</span>
          </div>
          <button
            type="button"
            onClick={addLayer}
            className="px-2.5 py-1 rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Stratum</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] text-left">
                <th className="py-1.5 px-2">Layer Description</th>
                <th className="py-1.5 px-2">Thickness (m)</th>
                <th className="py-1.5 px-2">Soil Type</th>
                <th className="py-1.5 px-2">Cohesion cu (kPa)</th>
                <th className="py-1.5 px-2">Friction φ (deg)</th>
                <th className="py-1.5 px-2">Unit Wt γ (kN/m³)</th>
                <th className="py-1.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pile.layers.map((layer, idx) => (
                <tr key={layer.id} className="border-b border-[var(--md-sys-color-outline-variant)]/40 hover:bg-[var(--md-sys-color-surface-container)]">
                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      value={layer.name}
                      onChange={(e) => updateLayer(idx, { name: e.target.value })}
                      className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                    />
                  </td>
                  <td className="py-1.5 px-2 w-24">
                    <input
                      type="number"
                      value={layer.thicknessM}
                      onChange={(e) => updateLayer(idx, { thicknessM: Math.max(0.5, Number(e.target.value) || 1) })}
                      className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                      step="0.5"
                    />
                  </td>
                  <td className="py-1.5 px-2 w-28">
                    <select
                      value={layer.soilType}
                      onChange={(e) => updateLayer(idx, { soilType: e.target.value as 'clay' | 'sand' })}
                      className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                    >
                      <option value="clay">Clay (Cohesive)</option>
                      <option value="sand">Sand (Cohesionless)</option>
                    </select>
                  </td>
                  <td className="py-1.5 px-2 w-24">
                    <input
                      type="number"
                      value={layer.cohesionKpa}
                      onChange={(e) => updateLayer(idx, { cohesionKpa: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                      step="5"
                      disabled={layer.soilType === 'sand'}
                    />
                  </td>
                  <td className="py-1.5 px-2 w-24">
                    <input
                      type="number"
                      value={layer.frictionAngleDeg}
                      onChange={(e) => updateLayer(idx, { frictionAngleDeg: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                      step="1"
                      disabled={layer.soilType === 'clay'}
                    />
                  </td>
                  <td className="py-1.5 px-2 w-24">
                    <input
                      type="number"
                      value={layer.unitWeightKnPerM3}
                      onChange={(e) => updateLayer(idx, { unitWeightKnPerM3: Math.max(10, Number(e.target.value) || 18) })}
                      className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                      step="0.5"
                    />
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeLayer(idx)}
                      disabled={pile.layers.length <= 1}
                      className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer disabled:opacity-30"
                      title="Remove Stratum"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export interface PileCapacityMetricsProps {
  result: PileCapacityResult;
}

export const PileCapacityMetrics: React.FC<PileCapacityMetricsProps> = ({ result }) => {
  return (
    <div className="space-y-4">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Allowable Capacity (Q_all)
          </div>
          <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {result.allowableCapacityKn.toFixed(0)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">kN</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            FS = {result.factorOfSafety} (BNBC-2020)
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Total Ultimate (Q_ult)
          </div>
          <div className="text-xl font-mono font-bold text-[var(--md-sys-color-on-surface)]">
            {result.ultimateCapacityKn.toFixed(0)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">kN</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Qs ({result.skinFrictionKn.toFixed(0)}) + Qp ({result.endBearingKn.toFixed(0)})
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Demand-Capacity Ratio
          </div>
          <div className={`text-xl font-mono font-bold ${result.utilizationRatio <= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {(result.utilizationRatio * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Working Load P = {result.appliedLoadKn} kN
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Est. Elastic Settlement
          </div>
          <div className="text-xl font-mono font-bold text-sky-600 dark:text-sky-400">
            {result.elasticSettlementMm.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">mm</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Vesic shaft + tip compression
          </div>
        </div>
      </div>

      {/* Layer-by-Layer Contributions Table */}
      <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
        <div className="text-xs font-bold font-mono text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Stratum Shaft Friction Contributions (Tomlinson α &amp; β Methods)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] text-left">
                <th className="py-1 px-2">Strata Layer</th>
                <th className="py-1 px-2">Depth Interval</th>
                <th className="py-1 px-2">Unit Friction (fs)</th>
                <th className="py-1 px-2 text-right">Shaft Resistance (Qs)</th>
                <th className="py-1 px-2 text-right">% of Total Qs</th>
              </tr>
            </thead>
            <tbody>
              {result.layerContributions.map((contrib, idx) => {
                const pct = result.skinFrictionKn > 0 ? (contrib.frictionKn / result.skinFrictionKn) * 100 : 0;
                return (
                  <tr key={idx} className="border-b border-[var(--md-sys-color-outline-variant)]/40 hover:bg-[var(--md-sys-color-surface-container)]">
                    <td className="py-1.5 px-2 font-bold text-[var(--md-sys-color-on-surface)]">{contrib.layerName}</td>
                    <td className="py-1.5 px-2">{contrib.depthFromM} m → {contrib.depthToM} m</td>
                    <td className="py-1.5 px-2">{contrib.unitFrictionKpa} kPa</td>
                    <td className="py-1.5 px-2 text-right font-bold text-sky-600 dark:text-sky-400">{contrib.frictionKn} kN</td>
                    <td className="py-1.5 px-2 text-right text-[var(--md-sys-color-on-surface-variant)]">{pct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
