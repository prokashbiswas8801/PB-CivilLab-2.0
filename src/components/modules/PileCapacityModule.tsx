import React, { useState } from 'react';
import {
  CivilWorkspace,
  SoilLayer,
  PileType,
  PileAnalysisMethod,
} from '../../types/civil';
import { PileCapacityResult } from '../../utils/calculations';
import {
  HardHat,
  Layers,
  ShieldCheck,
  Plus,
  Trash2,
  BookOpen,
  BarChart3,
  Copy,
  Check,
  Grid3X3,
  TrendingDown,
  Info,
} from 'lucide-react';

export interface PileCapacityInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
}

export const PileCapacityInputs: React.FC<PileCapacityInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState<'geometry' | 'strata' | 'group' | 'structural'>('geometry');

  const pile = activeWorkspace.pile || {
    pileType: 'bored-cast-in-situ',
    method: 'combined-bnbc' as PileAnalysisMethod,
    diameterM: 0.6,
    lengthM: 22.0,
    groundwaterDepthM: 3.0,
    appliedLoadKn: 1650,
    factorOfSafety: 2.5,
    layers: [
      { id: 'l1', name: 'Soft Silty Clay (Overburden)', thicknessM: 6.0, soilType: 'clay', cohesionKpa: 28, frictionAngleDeg: 0, unitWeightKnPerM3: 17.5, sptN: 4, elasticModulusEsMpa: 12, compressionIndexCc: 0.28, initialVoidRatioE0: 0.85, overconsolidationRatioOcr: 1.0 },
      { id: 'l2', name: 'Medium Dense Silty Sand', thicknessM: 8.0, soilType: 'sand', cohesionKpa: 0, frictionAngleDeg: 30, unitWeightKnPerM3: 18.5, sptN: 14, elasticModulusEsMpa: 28 },
      { id: 'l3', name: 'Dense Bearing Sand & Gravel', thicknessM: 10.0, soilType: 'sand', cohesionKpa: 0, frictionAngleDeg: 36, unitWeightKnPerM3: 20.0, sptN: 35, elasticModulusEsMpa: 65 },
    ],
    tipBearingCohesionKpa: 0,
    tipBearingFrictionDeg: 36,
    tipBearingUnitWeightKnPerM3: 20.0,
    tipSptN: 35,
    permissibleSettlementMm: 25.0,
    pileConcreteFckMpa: 25,
    steelYieldFyMpa: 345,
    pipeWallThicknessMm: 12,
    pileGroupRows: 1,
    pileGroupCols: 1,
    pileSpacingM: 1.8,
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
      sptN: 18,
      elasticModulusEsMpa: 35,
    };
    updatePile({ layers: [...pile.layers, newLayer] });
  };

  const removeLayer = (idx: number) => {
    if (pile.layers.length <= 1) return;
    updatePile({ layers: pile.layers.filter((_, i) => i !== idx) });
  };

  const applyStratigraphyPreset = (preset: 'dhaka' | 'chittagong' | 'gravel') => {
    if (preset === 'dhaka') {
      updatePile({
        diameterM: 0.6,
        lengthM: 22.0,
        groundwaterDepthM: 3.5,
        appliedLoadKn: 1650,
        layers: [
          { id: 'd1', name: 'Very Soft Dhaka Silty Clay', thicknessM: 6.0, soilType: 'clay', cohesionKpa: 28, frictionAngleDeg: 0, unitWeightKnPerM3: 17.5, sptN: 4, elasticModulusEsMpa: 12, compressionIndexCc: 0.28, initialVoidRatioE0: 0.85, overconsolidationRatioOcr: 1.1 },
          { id: 'd2', name: 'Medium Stiff Clayey Silt (Madhupur)', thicknessM: 8.0, soilType: 'silt', cohesionKpa: 50, frictionAngleDeg: 12, unitWeightKnPerM3: 18.5, sptN: 12, elasticModulusEsMpa: 25 },
          { id: 'd3', name: 'Dense Micaceous Sand (Dupi Tila)', thicknessM: 10.0, soilType: 'sand', cohesionKpa: 0, frictionAngleDeg: 35, unitWeightKnPerM3: 19.5, sptN: 32, elasticModulusEsMpa: 55 },
        ],
        tipBearingCohesionKpa: 0,
        tipBearingFrictionDeg: 35,
        tipBearingUnitWeightKnPerM3: 19.5,
        tipSptN: 32,
      });
    } else if (preset === 'chittagong') {
      updatePile({
        diameterM: 0.75,
        lengthM: 28.0,
        groundwaterDepthM: 1.5,
        appliedLoadKn: 2200,
        layers: [
          { id: 'c1', name: 'Tidal Coastal Very Soft Clay', thicknessM: 10.0, soilType: 'clay', cohesionKpa: 18, frictionAngleDeg: 0, unitWeightKnPerM3: 16.5, sptN: 2, elasticModulusEsMpa: 8, compressionIndexCc: 0.38, initialVoidRatioE0: 1.10, overconsolidationRatioOcr: 1.0 },
          { id: 'c2', name: 'Medium Stiff Silty Clay', thicknessM: 8.0, soilType: 'clay', cohesionKpa: 45, frictionAngleDeg: 0, unitWeightKnPerM3: 18.0, sptN: 8, elasticModulusEsMpa: 20, compressionIndexCc: 0.22, initialVoidRatioE0: 0.78, overconsolidationRatioOcr: 1.2 },
          { id: 'c3', name: 'Dense Coastal Sand Strata', thicknessM: 12.0, soilType: 'sand', cohesionKpa: 0, frictionAngleDeg: 36, unitWeightKnPerM3: 20.0, sptN: 38, elasticModulusEsMpa: 70 },
        ],
        tipBearingCohesionKpa: 0,
        tipBearingFrictionDeg: 36,
        tipBearingUnitWeightKnPerM3: 20.0,
        tipSptN: 38,
      });
    } else {
      updatePile({
        diameterM: 0.6,
        lengthM: 18.0,
        groundwaterDepthM: 4.0,
        appliedLoadKn: 2000,
        layers: [
          { id: 'g1', name: 'Loose Alluvial Sand & Silt', thicknessM: 5.0, soilType: 'sand', cohesionKpa: 0, frictionAngleDeg: 29, unitWeightKnPerM3: 18.0, sptN: 9, elasticModulusEsMpa: 20 },
          { id: 'g2', name: 'Medium Dense Coarse Sand', thicknessM: 7.0, soilType: 'sand', cohesionKpa: 0, frictionAngleDeg: 33, unitWeightKnPerM3: 19.0, sptN: 22, elasticModulusEsMpa: 45 },
          { id: 'g3', name: 'Very Dense Gravel & Cobbles', thicknessM: 8.0, soilType: 'sand', cohesionKpa: 0, frictionAngleDeg: 38, unitWeightKnPerM3: 21.0, sptN: 45, elasticModulusEsMpa: 90 },
        ],
        tipBearingCohesionKpa: 0,
        tipBearingFrictionDeg: 38,
        tipBearingUnitWeightKnPerM3: 21.0,
        tipSptN: 45,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs for Ergonomic Pile Configuration */}
      <div className="flex items-center gap-1 p-1 bg-[var(--md-sys-color-surface-container)] rounded-xl overflow-x-auto text-xs font-medium">
        {[
          { id: 'geometry', label: 'Pile Geometry & Solver' },
          { id: 'strata', label: 'Soil Strata & SPT Profile' },
          { id: 'group', label: 'Pile Group & Spacing' },
          { id: 'structural', label: 'Structural & Concrete/Steel' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-bold shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Regional Presets Quick Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] shrink-0 mr-1">
          Regional Presets:
        </span>
        <button
          type="button"
          onClick={() => applyStratigraphyPreset('dhaka')}
          className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors shrink-0 cursor-pointer"
        >
          Dhaka (Dupi Tila Sand)
        </button>
        <button
          type="button"
          onClick={() => applyStratigraphyPreset('chittagong')}
          className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors shrink-0 cursor-pointer"
        >
          Chittagong Coastal Clay
        </button>
        <button
          type="button"
          onClick={() => applyStratigraphyPreset('gravel')}
          className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors shrink-0 cursor-pointer"
        >
          Coarse Sand &amp; Gravel
        </button>
      </div>

      {/* Tab 1: Pile Geometry & Solver Selection */}
      {(activeTab === 'geometry' || activeTab === 'structural') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Pile Type
            </label>
            <select
              value={pile.pileType}
              onChange={(e) => updatePile({ pileType: e.target.value as PileType })}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            >
              <option value="bored-cast-in-situ">Bored Cast-in-Situ (BCIS)</option>
              <option value="driven-precast">Driven Precast RCC</option>
              <option value="driven-steel-pipe">Driven Steel Pipe (Filled)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
              Solver Formulation
            </label>
            <select
              value={pile.method || 'combined-bnbc'}
              onChange={(e) => updatePile({ method: e.target.value as PileAnalysisMethod })}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            >
              <option value="combined-bnbc">BNBC-2020 Standard (Combined)</option>
              <option value="alpha-beta">Tomlinson α &amp; Burland β</option>
              <option value="meyerhof-spt">Meyerhof SPT Correlation</option>
              <option value="terzaghi-bowles">Terzaghi &amp; Bowles Method</option>
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
              Length L (m)
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
              Single Axial Load P (kN)
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
              Safety Factor (FS)
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
      )}

      {/* Tab 2: Soil Strata Profiler Table with SPT N-values */}
      {activeTab === 'strata' && (
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-[var(--md-sys-color-on-surface)]">
              <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Soil Stratigraphy &amp; Geotechnical Parameters</span>
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
                  <th className="py-1.5 px-2">SPT N60</th>
                  <th className="py-1.5 px-2">Cohesion cu (kPa)</th>
                  <th className="py-1.5 px-2">Friction φ (°)</th>
                  <th className="py-1.5 px-2">Unit Wt γ (kN/m³)</th>
                  <th className="py-1.5 px-2">Modulus Es (MPa)</th>
                  <th className="py-1.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pile.layers.map((layer, idx) => (
                  <tr key={layer.id} className="border-b border-[var(--md-sys-color-outline-variant)]/40 hover:bg-[var(--md-sys-color-surface-container)]">
                    <td className="py-1.5 px-2 min-w-[150px]">
                      <input
                        type="text"
                        value={layer.name}
                        onChange={(e) => updateLayer(idx, { name: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                      />
                    </td>
                    <td className="py-1.5 px-2 w-20">
                      <input
                        type="number"
                        value={layer.thicknessM}
                        onChange={(e) => updateLayer(idx, { thicknessM: Math.max(0.5, Number(e.target.value) || 1) })}
                        className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                        step="0.5"
                      />
                    </td>
                    <td className="py-1.5 px-2 w-24">
                      <select
                        value={layer.soilType}
                        onChange={(e) => updateLayer(idx, { soilType: e.target.value as any })}
                        className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                      >
                        <option value="clay">Clay</option>
                        <option value="sand">Sand</option>
                        <option value="silt">Silt</option>
                        <option value="gravel">Gravel</option>
                      </select>
                    </td>
                    <td className="py-1.5 px-2 w-16">
                      <input
                        type="number"
                        value={layer.sptN ?? 10}
                        onChange={(e) => updateLayer(idx, { sptN: Math.max(1, Number(e.target.value) || 10) })}
                        className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                        step="1"
                      />
                    </td>
                    <td className="py-1.5 px-2 w-20">
                      <input
                        type="number"
                        value={layer.cohesionKpa}
                        onChange={(e) => updateLayer(idx, { cohesionKpa: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                        step="5"
                      />
                    </td>
                    <td className="py-1.5 px-2 w-18">
                      <input
                        type="number"
                        value={layer.frictionAngleDeg}
                        onChange={(e) => updateLayer(idx, { frictionAngleDeg: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                        step="1"
                      />
                    </td>
                    <td className="py-1.5 px-2 w-18">
                      <input
                        type="number"
                        value={layer.unitWeightKnPerM3}
                        onChange={(e) => updateLayer(idx, { unitWeightKnPerM3: Math.max(10, Number(e.target.value) || 18) })}
                        className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                        step="0.5"
                      />
                    </td>
                    <td className="py-1.5 px-2 w-18">
                      <input
                        type="number"
                        value={layer.elasticModulusEsMpa ?? 25}
                        onChange={(e) => updateLayer(idx, { elasticModulusEsMpa: Math.max(2, Number(e.target.value) || 25) })}
                        className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                        step="5"
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <div>
              <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
                Water Table Depth ∇ (m)
              </label>
              <input
                type="number"
                value={pile.groundwaterDepthM}
                onChange={(e) => updatePile({ groundwaterDepthM: Math.max(0, Number(e.target.value) || 0) })}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
                Tip Bearing SPT N
              </label>
              <input
                type="number"
                value={pile.tipSptN ?? 30}
                onChange={(e) => updatePile({ tipSptN: Math.max(1, Number(e.target.value) || 30) })}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                step="1"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
                Tip Bearing Cohesion cu (kPa)
              </label>
              <input
                type="number"
                value={pile.tipBearingCohesionKpa}
                onChange={(e) => updatePile({ tipBearingCohesionKpa: Math.max(0, Number(e.target.value) || 0) })}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                step="5"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
                Tip Friction Angle φ (°)
              </label>
              <input
                type="number"
                value={pile.tipBearingFrictionDeg}
                onChange={(e) => updatePile({ tipBearingFrictionDeg: Math.max(0, Number(e.target.value) || 0) })}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                step="1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Pile Group & Spacing */}
      {activeTab === 'group' && (
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-[var(--md-sys-color-primary)]">
            <Grid3X3 className="w-4 h-4" />
            <span>Pile Group Configuration &amp; Converse-Labarre Efficiency Analysis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
                Pile Rows (m)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={pile.pileGroupRows ?? 1}
                onChange={(e) => updatePile({ pileGroupRows: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                Number of pile rows in footing cap
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
                Pile Columns (n)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={pile.pileGroupCols ?? 1}
                onChange={(e) => updatePile({ pileGroupCols: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                Number of pile columns in footing cap
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
                Center-to-Center Spacing s (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="6.0"
                value={pile.pileSpacingM ?? Math.round(pile.diameterM * 3 * 10) / 10}
                onChange={(e) => updatePile({ pileSpacingM: Math.max(0.5, Number(e.target.value) || 1.8) })}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                BNBC 2020 Clause 3.10.3 requires s ≥ 2.5D for driven, ≥ 3.0D for bored piles.
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-start gap-2">
            <Info className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0 mt-0.5" />
            <div>
              Total Piles: <strong className="text-[var(--md-sys-color-on-surface)]">{(pile.pileGroupRows ?? 1) * (pile.pileGroupCols ?? 1)} piles</strong>.
              Spacing Ratio: <strong className="text-[var(--md-sys-color-on-surface)]">{((pile.pileSpacingM ?? (pile.diameterM * 3)) / pile.diameterM).toFixed(1)} × Diameter D</strong>.
              Converse-Labarre efficiency accounts for stress field overlapping in pile groups.
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Structural & Materials */}
      {activeTab === 'structural' && (
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-[var(--md-sys-color-secondary)]">
            <HardHat className="w-4 h-4" />
            <span>Structural Material Limits &amp; Settlement Tolerances (ACI 318 / ACI 543R / BNBC-2020)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
                Concrete Strength f'c (MPa)
              </label>
              <input
                type="number"
                min="15"
                max="60"
                value={pile.pileConcreteFckMpa ?? 25}
                onChange={(e) => updatePile({ pileConcreteFckMpa: Math.max(15, Number(e.target.value) || 25) })}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                Allowable shaft stress: 0.25f'c (BCIS) / 0.33f'c (Precast)
              </span>
            </div>

            {pile.pileType === 'driven-steel-pipe' && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
                    Steel Yield fy (MPa)
                  </label>
                  <input
                    type="number"
                    min="200"
                    max="600"
                    value={pile.steelYieldFyMpa ?? 345}
                    onChange={(e) => updatePile({ steelYieldFyMpa: Math.max(200, Number(e.target.value) || 345) })}
                    className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                  />
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                    ASTM A252 Grade 3 / A36
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
                    Pipe Wall Thickness t (mm)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="40"
                    value={pile.pipeWallThicknessMm ?? 12}
                    onChange={(e) => updatePile({ pipeWallThicknessMm: Math.max(5, Number(e.target.value) || 12) })}
                    className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                  />
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                    Steel casing shell thickness
                  </span>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
                Permissible Settlement (mm)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={pile.permissibleSettlementMm ?? 25}
                onChange={(e) => updatePile({ permissibleSettlementMm: Math.max(5, Number(e.target.value) || 25) })}
                className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                BNBC 2020 limit: 25mm isolated pile
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface PileCapacityMetricsProps {
  result: PileCapacityResult;
}

export const PileCapacityMetrics: React.FC<PileCapacityMetricsProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyBreakdown = () => {
    const text = [
      `=== PB CivilLab Deep Foundation Geotechnical Analysis ===`,
      `Governing Standard: ${result.governingCode}`,
      `Pile Type: ${result.pileType} | Diameter: ${result.diameterM}m | Length: ${result.lengthM}m`,
      `Design Axial Load: ${result.appliedLoadKn} kN`,
      `Skin Friction Resistance (Qs): ${result.skinFrictionKn} kN`,
      `Base End Bearing (Qp): ${result.endBearingKn} kN`,
      `Total Ultimate Capacity (Q_ult): ${result.ultimateCapacityKn} kN`,
      `Allowable Geotechnical Capacity (Q_all): ${result.allowableCapacityKn} kN (FS = ${result.factorOfSafety})`,
      `Geotechnical DCR: ${(result.utilizationRatio * 100).toFixed(1)}% (${result.codeChecks.geotechnicalCapacityPass ? 'PASS' : 'EXCEEDED'})`,
      `Structural Shaft Limit: ${result.structuralCapacityKn} kN (${result.structuralPass ? 'PASS' : 'EXCEEDED'})`,
      `Estimated Elastic Settlement (Vesic): ${result.elasticSettlementMm} mm`,
      `Estimated Consolidation Settlement (Sc): ${result.consolidationSettlementMm} mm`,
      `Total Estimated Settlement: ${result.totalSettlementMm} mm <= ${result.permissibleSettlementMm} mm (${result.settlementPass ? 'PASS' : 'EXCEEDED'})`,
      result.pileGroupSummary ? `Pile Group Efficiency: ${(result.pileGroupSummary.groupEfficiency * 100).toFixed(1)}% | Total Group Cap: ${result.pileGroupSummary.groupAllowableCapacityKn} kN` : '',
      ``,
      `--- Step-by-Step Code Clauses ---`,
      ...result.calculationsBreakdown.map((s) => `${s.step} [${s.clauseRef}]: ${s.result}`),
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            Geotechnical DCR
          </div>
          <div className={`text-xl font-mono font-bold ${result.utilizationRatio <= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {(result.utilizationRatio * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Applied P = {result.appliedLoadKn} kN
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Total Est. Settlement
          </div>
          <div className={`text-xl font-mono font-bold ${result.settlementPass ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600'}`}>
            {result.totalSettlementMm.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">mm</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Se: {result.elasticSettlementMm.toFixed(1)} + Sc: {result.consolidationSettlementMm.toFixed(1)} mm
          </div>
        </div>
      </div>

      {/* Pile Group Summary Banner (if group > 1 pile) */}
      {result.pileGroupSummary && result.pileGroupSummary.totalPiles > 1 && (
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <span className="font-bold text-[var(--md-sys-color-on-surface)]">
              Pile Group Cap ({result.pileGroupSummary.rows} × {result.pileGroupSummary.cols} = {result.pileGroupSummary.totalPiles} Piles)
            </span>
          </div>
          <div className="flex items-center gap-4 text-[var(--md-sys-color-on-surface-variant)]">
            <span>Spacing: <strong>{result.pileGroupSummary.spacingM} m</strong> ({result.pileGroupSummary.spacingRatio.toFixed(1)}D)</span>
            <span>Converse-Labarre Efficiency η: <strong className="text-[var(--md-sys-color-primary)]">{(result.pileGroupSummary.groupEfficiency * 100).toFixed(1)}%</strong></span>
            <span>Group Q_all: <strong className="text-emerald-600 dark:text-emerald-400">{result.pileGroupSummary.groupAllowableCapacityKn.toFixed(0)} kN</strong></span>
            <span>Group DCR: <strong className={result.pileGroupSummary.groupDcr <= 1.0 ? 'text-emerald-600' : 'text-rose-600'}>{(result.pileGroupSummary.groupDcr * 100).toFixed(1)}%</strong></span>
          </div>
        </div>
      )}

      {/* Side-by-Side Method Comparison Card */}
      <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold font-mono text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Formulation Method Comparison (Alpha/Beta vs Meyerhof SPT vs Terzaghi/Bowles)</span>
          </div>
          <button
            type="button"
            onClick={handleCopyBreakdown}
            className="px-2 py-0.5 rounded text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] inline-flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Export Breakdown'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] text-left">
                <th className="py-1 px-2">Analysis Method</th>
                <th className="py-1 px-2">Shaft Friction (Qs)</th>
                <th className="py-1 px-2">End Bearing (Qp)</th>
                <th className="py-1 px-2">Ultimate (Q_ult)</th>
                <th className="py-1 px-2 font-bold text-[var(--md-sys-color-primary)]">Allowable (Q_all)</th>
                <th className="py-1 px-2 text-right">Governing Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)]/40 hover:bg-[var(--md-sys-color-surface-container)]">
                <td className="py-1.5 px-2 font-semibold">Tomlinson α &amp; Burland β</td>
                <td className="py-1.5 px-2">{result.alphaBetaCapacityKn.qs} kN</td>
                <td className="py-1.5 px-2">{result.alphaBetaCapacityKn.qp} kN</td>
                <td className="py-1.5 px-2">{result.alphaBetaCapacityKn.qult} kN</td>
                <td className="py-1.5 px-2 font-bold text-emerald-600 dark:text-emerald-400">{result.alphaBetaCapacityKn.qall} kN</td>
                <td className="py-1.5 px-2 text-right text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Analytical</td>
              </tr>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)]/40 hover:bg-[var(--md-sys-color-surface-container)]">
                <td className="py-1.5 px-2 font-semibold">Meyerhof SPT Correlation</td>
                <td className="py-1.5 px-2">{result.meyerhofSptCapacityKn.qs} kN</td>
                <td className="py-1.5 px-2">{result.meyerhofSptCapacityKn.qp} kN</td>
                <td className="py-1.5 px-2">{result.meyerhofSptCapacityKn.qult} kN</td>
                <td className="py-1.5 px-2 font-bold text-sky-600 dark:text-sky-400">{result.meyerhofSptCapacityKn.qall} kN</td>
                <td className="py-1.5 px-2 text-right text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Empirical N60</td>
              </tr>
              {result.terzaghiCapacityKn && (
                <tr className="border-b border-[var(--md-sys-color-outline-variant)]/40 hover:bg-[var(--md-sys-color-surface-container)]">
                  <td className="py-1.5 px-2 font-semibold">Terzaghi &amp; Bowles Formula</td>
                  <td className="py-1.5 px-2">{result.terzaghiCapacityKn.qs} kN</td>
                  <td className="py-1.5 px-2">{result.terzaghiCapacityKn.qp} kN</td>
                  <td className="py-1.5 px-2">{result.terzaghiCapacityKn.qult} kN</td>
                  <td className="py-1.5 px-2 font-bold text-purple-600 dark:text-purple-400">{result.terzaghiCapacityKn.qall} kN</td>
                  <td className="py-1.5 px-2 text-right text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Bearing Nq/Nc</td>
                </tr>
              )}
              <tr className="bg-[var(--md-sys-color-surface-container)] font-bold">
                <td className="py-1.5 px-2 text-[var(--md-sys-color-primary)]">BNBC-2020 Standard Design ({result.methodUsed})</td>
                <td className="py-1.5 px-2">{result.skinFrictionKn} kN</td>
                <td className="py-1.5 px-2">{result.endBearingKn} kN</td>
                <td className="py-1.5 px-2">{result.ultimateCapacityKn} kN</td>
                <td className="py-1.5 px-2 text-emerald-600 dark:text-emerald-400">{result.allowableCapacityKn} kN</td>
                <td className="py-1.5 px-2 text-right text-emerald-600 dark:text-emerald-400">DESIGN GOVERNING</td>
              </tr>
            </tbody>
          </table>
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
                <th className="py-1 px-2">Method</th>
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
                    <td className="py-1.5 px-2 text-[var(--md-sys-color-on-surface-variant)]">{contrib.methodUsed}</td>
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
