import React, { useState } from 'react';
import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
  SoilLayer,
} from '../../types/civil';
import { BearingAnalysisResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';
import {
  Layers,
  ShieldCheck,
  Plus,
  Trash2,
  BarChart3,
  Copy,
  Check,
  Info,
} from 'lucide-react';

export interface BearingCapacityInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

export const BearingCapacityInputs: React.FC<BearingCapacityInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'geometry' | 'strata' | 'loads' | 'settlement'>('all');
  const [showMultiLayer, setShowMultiLayer] = useState<boolean>(
    Boolean(activeWorkspace.bearing.layers && activeWorkspace.bearing.layers.length > 0)
  );

  const applyGeotechPreset = (
    width: number,
    depth: number,
    load: number,
    c: number,
    phi: number,
    gamma: number,
    waterDepth: number,
    shape: 'square' | 'strip' | 'circular' | 'rectangular'
  ) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      bearing: {
        ...ws.bearing,
        footingWidthM: width,
        embedmentDepthM: depth,
        appliedColumnLoadKn: load,
        soilCohesionKpa: c,
        frictionAngleDeg: phi,
        unitWeightKnPerM3: gamma,
        waterTableDepthM: waterDepth,
        footingShape: shape,
      },
    }));
  };

  const layers = activeWorkspace.bearing.layers || [
    {
      id: 'b-l1',
      name: 'Upper Footing Foundation Strata',
      thicknessM: activeWorkspace.bearing.embedmentDepthM + 1.0,
      soilType: 'sand',
      cohesionKpa: activeWorkspace.bearing.soilCohesionKpa,
      frictionAngleDeg: activeWorkspace.bearing.frictionAngleDeg,
      unitWeightKnPerM3: activeWorkspace.bearing.unitWeightKnPerM3,
      sptN: activeWorkspace.bearing.sptN60 || 15,
      elasticModulusEsMpa: activeWorkspace.bearing.elasticModulusEsMpa || 25,
      compressionIndexCc: activeWorkspace.bearing.compressionIndexCc || 0.25,
      recompressionIndexCr: activeWorkspace.bearing.recompressionIndexCr || 0.04,
      initialVoidRatioE0: activeWorkspace.bearing.initialVoidRatioE0 || 0.75,
      overconsolidationRatioOcr: activeWorkspace.bearing.overconsolidationRatioOcr || 1.0,
    },
    {
      id: 'b-l2',
      name: 'Lower Influence Zone Subgrade',
      thicknessM: activeWorkspace.bearing.footingWidthM * 2,
      soilType: 'clay',
      cohesionKpa: Math.max(20, activeWorkspace.bearing.soilCohesionKpa * 1.2),
      frictionAngleDeg: Math.max(0, activeWorkspace.bearing.frictionAngleDeg - 10),
      unitWeightKnPerM3: activeWorkspace.bearing.unitWeightKnPerM3,
      sptN: Math.max(4, Math.round((activeWorkspace.bearing.sptN60 || 15) * 0.8)),
      elasticModulusEsMpa: Math.max(10, Math.round((activeWorkspace.bearing.elasticModulusEsMpa || 25) * 0.7)),
      compressionIndexCc: 0.30,
      recompressionIndexCr: 0.05,
      initialVoidRatioE0: 0.85,
      overconsolidationRatioOcr: 1.2,
    },
  ];

  const updateLayers = (newLayers: SoilLayer[]) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      bearing: {
        ...ws.bearing,
        layers: newLayers,
      },
    }));
  };

  const addLayer = () => {
    const newL: SoilLayer = {
      id: `layer-${Date.now()}`,
      name: `Strata Layer ${layers.length + 1}`,
      thicknessM: 2.0,
      soilType: 'sand',
      cohesionKpa: 0,
      frictionAngleDeg: 30,
      unitWeightKnPerM3: 18.5,
      sptN: 16,
      elasticModulusEsMpa: 30,
      compressionIndexCc: 0.20,
      recompressionIndexCr: 0.03,
      initialVoidRatioE0: 0.70,
      overconsolidationRatioOcr: 1.0,
    };
    updateLayers([...layers, newL]);
  };

  const updateSingleLayer = (idx: number, patch: Partial<SoilLayer>) => {
    const updated = layers.map((ly, i) => (i === idx ? { ...ly, ...patch } : ly));
    updateLayers(updated);
  };

  const removeLayer = (idx: number) => {
    if (layers.length <= 1) return;
    updateLayers(layers.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3.5">
      {/* Progressive Disclosure Ergonomic Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--md-sys-color-surface-container)] rounded-xl overflow-x-auto text-xs font-medium">
        {[
          { id: 'all', label: 'All Inputs' },
          { id: 'geometry', label: 'Pad Geometry & Solver' },
          { id: 'strata', label: 'Soil Strata & GWT' },
          { id: 'loads', label: 'Load & Safety FS' },
          { id: 'settlement', label: 'Settlement & OCR' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer btn-tactile ${
              activeTab === tab.id
                ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-bold shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Geotechnical Quick Presets Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] shrink-0 mr-1">
          Soil Presets:
        </span>
        <button
          type="button"
          onClick={() => applyGeotechPreset(1.8, 1.5, 650, 15, 26, 18.0, 3.5, 'square')}
          className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors shrink-0 cursor-pointer"
        >
          Sandy Clay (1.8m)
        </button>
        <button
          type="button"
          onClick={() => applyGeotechPreset(2.4, 2.0, 1100, 0, 34, 19.5, 4.0, 'square')}
          className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors shrink-0 cursor-pointer"
        >
          Dense Sand (2.4m)
        </button>
        <button
          type="button"
          onClick={() => applyGeotechPreset(1.5, 1.2, 450, 22, 18, 17.0, 0.8, 'square')}
          className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors shrink-0 cursor-pointer"
        >
          High GWT Wet Clay
        </button>
      </div>

      {/* Tab Group 1: Footing Geometry & Solver Method */}
      {(activeTab === 'all' || activeTab === 'geometry') && (
        <div className="space-y-2.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]/50 border border-[var(--md-sys-color-outline-variant)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            Foundation Geometry &amp; Governing Solver Formulation
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-xs font-semibold mb-1">Solver Formulation</label>
              <select
                value={activeWorkspace.bearing.shallowSolverMethod || 'meyerhof'}
                onChange={(e) => {
                  const solver = e.target.value as 'meyerhof' | 'terzaghi' | 'hansen';
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, shallowSolverMethod: solver },
                  }));
                }}
                className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              >
                <option value="meyerhof">Meyerhof (1963) - BNBC Standard</option>
                <option value="terzaghi">Terzaghi (1943) - Classical Theory</option>
                <option value="hansen">Hansen (1970) - High Precision</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Footing Shape</label>
              <select
                value={activeWorkspace.bearing.footingShape}
                onChange={(e) => {
                  const shape = e.target.value as 'square' | 'strip' | 'circular' | 'rectangular';
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, footingShape: shape },
                  }));
                }}
                className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              >
                <option value="square">Square Footing (B × B)</option>
                <option value="strip">Strip / Wall Footing</option>
                <option value="circular">Circular Pier Footing</option>
                <option value="rectangular">Rectangular Footing</option>
              </select>
            </div>
            <UnitInput
              label="Footing Width B"
              category="length"
              siValue={activeWorkspace.bearing.footingWidthM}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  bearing: { ...ws.bearing, footingWidthM: val },
                }));
              }}
              currentUnitId={getFieldUnit('bearing.B', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('bearing.B', u)}
              customUnits={customUnits}
              step={0.2}
              presets={[
                { label: '1.2 m', valueSI: 1.2, title: 'Isolated Small Column Footing' },
                { label: '1.8 m', valueSI: 1.8, title: 'Standard Pad Footing' },
                { label: '2.4 m', valueSI: 2.4, title: 'Medium-Heavy Column Footing' },
                { label: '3.2 m', valueSI: 3.2, title: 'Large Combined / Core Footing' },
              ]}
              validationRule={{
                minSI: 0.5,
                maxSI: 10.0,
                warningBelowSI: 0.8,
                warningAboveSI: 5.0,
                warningHint: 'Pad footings exceeding 5.0m width are typically more cost-effective as raft/mat foundations or deep piles.',
              }}
              standardRef="BNBC 2020 Part 6 / ACI 318 / Bowles"
              recommendedRange="1.0 m – 3.5 m (isolated pad)"
              designTip="Footing contact area A = B² (square) or B × L (rectangular). Minimum thickness ≥ 150 mm (6 in)."
            />
            <UnitInput
              label="Embedment Depth Df"
              category="length"
              siValue={activeWorkspace.bearing.embedmentDepthM}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  bearing: { ...ws.bearing, embedmentDepthM: val },
                }));
              }}
              currentUnitId={getFieldUnit('bearing.Df', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('bearing.Df', u)}
              customUnits={customUnits}
              step={0.2}
              presets={[
                { label: '1.0 m', valueSI: 1.0, title: 'Minimum BNBC Embedment' },
                { label: '1.5 m', valueSI: 1.5, title: 'Standard Foundation Depth' },
                { label: '2.0 m', valueSI: 2.0, title: 'Deep Frost / Scour Zone' },
                { label: '2.5 m', valueSI: 2.5, title: 'Basement Level / Deep Trench' },
              ]}
              validationRule={{
                minSI: 0.4,
                maxSI: 8.0,
                warningBelowSI: 0.9,
                warningHint: 'Embedment Df should be ≥ 1.0m under BNBC 2020 to prevent seasonal moisture fluctuations and topsoil erosion.',
              }}
              standardRef="BNBC 2020 Sec 3.9 / Terzaghi"
              recommendedRange="1.0 m – 2.5 m"
              designTip="Surcharge term q = γ · Df directly contributes to bearing capacity through bearing factor Nq."
            />
          </div>
        </div>
      )}

      {/* Tab Group 2: Soil Strata & Water Table */}
      {(activeTab === 'all' || activeTab === 'strata') && (
        <div className="space-y-3 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]/50 border border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-tertiary)] tracking-wider">
              Subgrade Soil Parameters &amp; Water Table
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Stratigraphy Profile:</span>
              <button
                type="button"
                onClick={() => {
                  const toggled = !showMultiLayer;
                  setShowMultiLayer(toggled);
                  if (toggled && (!activeWorkspace.bearing.layers || activeWorkspace.bearing.layers.length === 0)) {
                    updateLayers(layers);
                  }
                }}
                className={`px-2 py-0.5 rounded text-xs font-mono font-semibold cursor-pointer border ${showMultiLayer ? 'bg-[var(--md-sys-color-primary)] text-white border-transparent' : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline)]'}`}
              >
                {showMultiLayer ? 'Multi-Strata Active' : 'Single Layer'}
              </button>
            </div>
          </div>

          {/* If Multi-Strata is Active, render Stratigraphy Table */}
          {showMultiLayer ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-[var(--md-sys-color-on-surface)] font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Subgrade Strata Table (Influence Zone: Df to Df + 2B)</span>
                </div>
                <button
                  type="button"
                  onClick={addLayer}
                  className="px-2 py-1 rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Stratum</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] text-left">
                      <th className="py-1 px-2">Stratum</th>
                      <th className="py-1 px-2">Thickness (m)</th>
                      <th className="py-1 px-2">Type</th>
                      <th className="py-1 px-2">SPT N60</th>
                      <th className="py-1 px-2">cu (kPa)</th>
                      <th className="py-1 px-2">φ (°)</th>
                      <th className="py-1 px-2">γ (kN/m³)</th>
                      <th className="py-1 px-2">Es (MPa)</th>
                      <th className="py-1 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {layers.map((layer, idx) => (
                      <tr key={layer.id} className="border-b border-[var(--md-sys-color-outline-variant)]/40 hover:bg-[var(--md-sys-color-surface-container)]">
                        <td className="py-1.5 px-2 min-w-[130px]">
                          <input
                            type="text"
                            value={layer.name}
                            onChange={(e) => updateSingleLayer(idx, { name: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-18">
                          <input
                            type="number"
                            value={layer.thicknessM}
                            onChange={(e) => updateSingleLayer(idx, { thicknessM: Math.max(0.5, Number(e.target.value) || 1) })}
                            className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                            step="0.5"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-20">
                          <select
                            value={layer.soilType}
                            onChange={(e) => updateSingleLayer(idx, { soilType: e.target.value as any })}
                            className="w-full px-1.5 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
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
                            value={layer.sptN ?? 15}
                            onChange={(e) => updateSingleLayer(idx, { sptN: Math.max(1, Number(e.target.value) || 15) })}
                            className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                            step="1"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-18">
                          <input
                            type="number"
                            value={layer.cohesionKpa}
                            onChange={(e) => updateSingleLayer(idx, { cohesionKpa: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                            step="5"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-16">
                          <input
                            type="number"
                            value={layer.frictionAngleDeg}
                            onChange={(e) => updateSingleLayer(idx, { frictionAngleDeg: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                            step="1"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-18">
                          <input
                            type="number"
                            value={layer.unitWeightKnPerM3}
                            onChange={(e) => updateSingleLayer(idx, { unitWeightKnPerM3: Math.max(10, Number(e.target.value) || 18) })}
                            className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                            step="0.5"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-18">
                          <input
                            type="number"
                            value={layer.elasticModulusEsMpa ?? 25}
                            onChange={(e) => updateSingleLayer(idx, { elasticModulusEsMpa: Math.max(5, Number(e.target.value) || 25) })}
                            className="w-full px-2 py-1 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                            step="5"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeLayer(idx)}
                            disabled={layers.length <= 1}
                            className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer disabled:opacity-30"
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
          ) : null}

          {/* Primary Soil Properties & GWT */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <UnitInput
              label="Soil Cohesion c"
              category="pressure"
              siValue={activeWorkspace.bearing.soilCohesionKpa * 1000}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  bearing: { ...ws.bearing, soilCohesionKpa: val / 1000 },
                }));
              }}
              currentUnitId={getFieldUnit('bearing.cohesion', 'pressure', 'kPa')}
              onUnitChange={(u) => updateFieldUnit('bearing.cohesion', u)}
              customUnits={customUnits}
              step={5}
              presets={[
                { label: '0 kPa', valueSI: 0, title: 'Clean Sand / Gravel (Cohesionless)' },
                { label: '15 kPa', valueSI: 15000, title: 'Sandy Silt / Soft Clay' },
                { label: '30 kPa', valueSI: 30000, title: 'Medium Stiff Clay' },
                { label: '60 kPa', valueSI: 60000, title: 'Very Stiff Clay' },
              ]}
              standardRef="ASTM D2166 / Terzaghi"
              recommendedRange="0 – 100 kPa"
              designTip="For granular cohesionless sands, set c = 0 kPa. For undrained clay analysis, c is undrained cohesion cu."
            />
            <div>
              <label className="block text-xs font-semibold mb-1">Friction Angle φ (°)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="50"
                value={activeWorkspace.bearing.frictionAngleDeg}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, frictionAngleDeg: val },
                  }));
                }}
                className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <div className="flex items-center gap-1 mt-1 overflow-x-auto">
                {[
                  { label: '26°', val: 26, title: 'Loose Silty Sand (N ≈ 8-10)' },
                  { label: '30°', val: 30, title: 'Medium Dense Sand (N ≈ 15-20)' },
                  { label: '34°', val: 34, title: 'Dense Sand (N ≈ 30)' },
                  { label: '38°', val: 38, title: 'Very Dense Gravelly Sand (N > 40)' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      updateActiveWorkspace((ws) => ({
                        ...ws,
                        bearing: { ...ws.bearing, frictionAngleDeg: item.val },
                      }));
                    }}
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                      activeWorkspace.bearing.frictionAngleDeg === item.val
                        ? 'bg-[var(--md-sys-color-primary)] text-white border-transparent'
                        : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                    }`}
                    title={item.title}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <UnitInput
              label="Soil Unit Weight γ"
              category="density"
              siValue={activeWorkspace.bearing.unitWeightKnPerM3}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  bearing: { ...ws.bearing, unitWeightKnPerM3: val },
                }));
              }}
              currentUnitId={getFieldUnit('bearing.gamma', 'density', 'kN/m3')}
              onUnitChange={(u) => updateFieldUnit('bearing.gamma', u)}
              customUnits={customUnits}
              step={0.5}
              presets={[
                { label: '17.0 kN/m³', valueSI: 17.0, title: 'Loose / Organic Silty Soil' },
                { label: '18.5 kN/m³', valueSI: 18.5, title: 'Medium Dense Sand / Stiff Clay' },
                { label: '20.0 kN/m³', valueSI: 20.0, title: 'Dense Compacted Glacial Till' },
              ]}
              standardRef="ASTM D7263 / Bowles"
              recommendedRange="16.0 – 21.0 kN/m³"
              designTip="Moist bulk unit weight above groundwater level. Submerged soil is reduced by water density (9.81 kN/m³)."
            />
            <UnitInput
              label="Water Table Depth ∇"
              category="length"
              siValue={activeWorkspace.bearing.waterTableDepthM}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  bearing: { ...ws.bearing, waterTableDepthM: val },
                }));
              }}
              currentUnitId={getFieldUnit('bearing.water', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('bearing.water', u)}
              customUnits={customUnits}
              step={0.5}
              presets={[
                { label: '0.5 m', valueSI: 0.5, title: 'High GWT Flooded / Submerged' },
                { label: '1.5 m', valueSI: 1.5, title: 'At Footing Base Level (Df)' },
                { label: '3.5 m', valueSI: 3.5, title: 'Deep GWT (Below Influence Depth Df+B)' },
              ]}
              validationRule={{
                minSI: 0,
                maxSI: 25.0,
                warningBelowSI: activeWorkspace.bearing.embedmentDepthM,
                warningHint: `Water Table Alert: GWT (${activeWorkspace.bearing.waterTableDepthM}m) is at or above footing base (Df = ${activeWorkspace.bearing.embedmentDepthM}m). Effective buoyant density γ' = (${activeWorkspace.bearing.unitWeightKnPerM3} - 9.81) = ${(activeWorkspace.bearing.unitWeightKnPerM3 - 9.81).toFixed(1)} kN/m³ applies, cutting soil shear resistance nearly in half.`,
              }}
              standardRef="BNBC 2020 Sec 3.10 / Meyerhof"
              recommendedRange="0.0 – 10.0 m"
              designTip="When GWT is within B below footing base, the second surcharge term is interpolated using buoyant unit weight."
            />
          </div>
        </div>
      )}

      {/* Tab Group 3: Loading & Safety Factor */}
      {(activeTab === 'all' || activeTab === 'loads') && (
        <div className="space-y-2.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]/50 border border-[var(--md-sys-color-outline-variant)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-secondary)] tracking-wider">
            Superstructure Load &amp; Factor of Safety
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <UnitInput
              label="Column Load P"
              category="force"
              siValue={activeWorkspace.bearing.appliedColumnLoadKn * 1000}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  bearing: { ...ws.bearing, appliedColumnLoadKn: val / 1000 },
                }));
              }}
              currentUnitId={getFieldUnit('bearing.load', 'force', 'kN')}
              onUnitChange={(u) => updateFieldUnit('bearing.load', u)}
              customUnits={customUnits}
              step={50}
              presets={[
                { label: '400 kN', valueSI: 400000, title: '2-3 Story Residential Column' },
                { label: '800 kN', valueSI: 800000, title: '4-5 Story Building Column' },
                { label: '1500 kN', valueSI: 1500000, title: 'Medium Commercial Frame Column' },
                { label: '2500 kN', valueSI: 2500000, title: 'Heavy High-Rise Transfer Column' },
              ]}
              standardRef="BNBC 2020 Chapter 2 / ASCE 7-16"
              recommendedRange="200 – 4000 kN"
              designTip="Applied service axial dead load + live load transferred from the superstructure column."
            />
            <div>
              <label className="block text-xs font-semibold mb-1">Target Factor of Safety (FS)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="10.0"
                value={activeWorkspace.bearing.factorOfSafety}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, factorOfSafety: val },
                  }));
                }}
                className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <div className="flex items-center gap-1 mt-1 overflow-x-auto">
                {[
                  { label: '2.5', val: 2.5, title: 'Temporary / Wind Load Combinations' },
                  { label: '3.0 (BNBC)', val: 3.0, title: 'BNBC 2020 Standard Gravity Load FS' },
                  { label: '3.5', val: 3.5, title: 'Critical Infrastructure / High Risk Structures' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      updateActiveWorkspace((ws) => ({
                        ...ws,
                        bearing: { ...ws.bearing, factorOfSafety: item.val },
                      }));
                    }}
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                      activeWorkspace.bearing.factorOfSafety === item.val
                        ? 'bg-[var(--md-sys-color-primary)] text-white border-transparent'
                        : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                    }`}
                    title={item.title}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Group 4: Automated Settlement & OCR Parameters */}
      {(activeTab === 'all' || activeTab === 'settlement') && (
        <div className="space-y-2.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]/50 border border-[var(--md-sys-color-outline-variant)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            Settlement Parameters &amp; Overconsolidation (BNBC-2020 Clause 3.8 / Bowles)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-xs font-semibold mb-1">Standard Code</label>
              <select
                value={activeWorkspace.bearing.codeStandard || 'BNBC-2020'}
                onChange={(e) => {
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, codeStandard: e.target.value as any },
                  }));
                }}
                className="w-full min-h-[44px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              >
                <option value="BNBC-2020">BNBC-2020 (Bangladesh)</option>
                <option value="ACI-318">ACI 318 / ASCE 7</option>
                <option value="IS-456">IS 1904 / IS 456</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">SPT N60 Value</label>
              <input
                type="number"
                min="2"
                max="60"
                value={activeWorkspace.bearing.sptN60 || 15}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, sptN60: val },
                  }));
                }}
                className="w-full min-h-[44px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Modulus Es (MPa)</label>
              <input
                type="number"
                step="1"
                min="5"
                max="200"
                value={activeWorkspace.bearing.elasticModulusEsMpa || 25}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, elasticModulusEsMpa: val },
                  }));
                }}
                className="w-full min-h-[44px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Poisson's Ratio (μ)</label>
              <input
                type="number"
                step="0.05"
                min="0.15"
                max="0.49"
                value={activeWorkspace.bearing.poissonRatio ?? 0.30}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, poissonRatio: val },
                  }));
                }}
                className="w-full min-h-[44px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Clay Layer Hc (m)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={activeWorkspace.bearing.clayLayerThicknessM ?? 4.0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, clayLayerThicknessM: val },
                  }));
                }}
                className="w-full min-h-[44px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Overconsolidation (OCR)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="10.0"
                value={activeWorkspace.bearing.overconsolidationRatioOcr ?? 1.0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, overconsolidationRatioOcr: val },
                  }));
                }}
                className="w-full min-h-[44px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
                {(activeWorkspace.bearing.overconsolidationRatioOcr ?? 1.0) <= 1.0 ? 'Normally Consolidated' : 'Overconsolidated (Cr applies)'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Compression Index Cc</label>
              <input
                type="number"
                step="0.02"
                min="0.05"
                max="0.8"
                value={activeWorkspace.bearing.compressionIndexCc ?? 0.25}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, compressionIndexCc: val },
                  }));
                }}
                className="w-full min-h-[44px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Permissible S_all (mm)</label>
              <input
                type="number"
                step="5"
                min="10"
                max="100"
                value={activeWorkspace.bearing.permissibleSettlementMm || 25}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    bearing: { ...ws.bearing, permissibleSettlementMm: val },
                  }));
                }}
                className="w-full min-h-[44px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface BearingCapacityMetricsProps {
  result: BearingAnalysisResult;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
}

export const BearingCapacityMetrics: React.FC<BearingCapacityMetricsProps> = ({
  result,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyBreakdown = () => {
    const text = [
      `=== PB CivilLab Shallow Foundation Geotechnical Analysis ===`,
      `Governing Standard: BNBC-2020 Part 6 / ACI 318`,
      `Active Solver: ${result.solverMethodUsed ? result.solverMethodUsed.toUpperCase() : 'MEYERHOF (1963)'}`,
      `Effective Overburden (q0): ${result.effectiveOverburdenKpa.toFixed(1)} kPa`,
      `Ultimate Bearing (q_ult): ${result.ultimateBearingKpa.toFixed(1)} kPa`,
      `Allowable Bearing (q_all): ${result.allowableBearingKpa.toFixed(1)} kPa (FS = ${result.factorOfSafety})`,
      `Applied Contact Pressure (q_contact): ${result.appliedPressureKpa.toFixed(1)} kPa`,
      `Bearing Utilization DCR: ${(result.utilizationRatio * 100).toFixed(1)}%`,
      `Immediate Elastic Settlement (Se): ${result.immediateSettlementMm.toFixed(1)} mm`,
      `Consolidation Settlement (Sc): ${result.consolidationSettlementMm.toFixed(1)} mm`,
      `Total Estimated Settlement (St): ${result.totalSettlementMm.toFixed(1)} mm <= ${result.permissibleSettlementMm} mm (${result.settlementPass ? 'PASS' : 'EXCEEDED'})`,
      result.methodComparison ? `Method Comparison -> Meyerhof: ${result.methodComparison.meyerhofKpa} kPa | Terzaghi: ${result.methodComparison.terzaghiKpa} kPa | Hansen: ${result.methodComparison.hansenKpa} kPa` : '',
      ``,
      `--- Step-by-Step Code Clauses ---`,
      ...result.calculationsBreakdown.map((s) => `${s.step} [${s.clauseRef}]: ${s.result}`),
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      {/* 4 Main Output Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UnitValueDisplay
          label="Allowable Bearing (q_all)"
          category="pressure"
          siValue={result.allowableBearingKpa * 1000}
          currentUnitId={getOutputUnit('bearing.out.qall', 'pressure', 'kPa')}
          onUnitChange={(u) => updateOutputUnit('bearing.out.qall', u)}
          customUnits={customUnits}
          highlight={true}
        />
        <UnitValueDisplay
          label="Ultimate Bearing (q_ult)"
          category="pressure"
          siValue={result.ultimateBearingKpa * 1000}
          currentUnitId={getOutputUnit('bearing.out.qult', 'pressure', 'kPa')}
          onUnitChange={(u) => updateOutputUnit('bearing.out.qult', u)}
          customUnits={customUnits}
        />
        <UnitValueDisplay
          label="Applied Pressure (q_contact)"
          category="pressure"
          siValue={result.appliedPressureKpa * 1000}
          currentUnitId={getOutputUnit('bearing.out.qapp', 'pressure', 'kPa')}
          onUnitChange={(u) => updateOutputUnit('bearing.out.qapp', u)}
          customUnits={customUnits}
        />
        <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Total Settlement (St)</div>
          <div className={`text-xl font-bold font-mono mt-0.5 ${result.settlementPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            {result.totalSettlementMm.toFixed(1)} <span className="text-xs font-normal">mm</span>
          </div>
          <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Se: {result.immediateSettlementMm.toFixed(1)}mm · Sc: {result.consolidationSettlementMm.toFixed(1)}mm
          </div>
        </div>
      </div>

      {/* Side-by-Side Solver Comparison Card */}
      {result.methodComparison && (
        <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold font-mono text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Shallow Bearing Solvers Comparison (Meyerhof vs Terzaghi vs Hansen)</span>
            </div>
            <button
              type="button"
              onClick={handleCopyBreakdown}
              className="px-2 py-0.5 rounded text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] inline-flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Export Audit'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] text-left">
                  <th className="py-1 px-2">Solver Formulation</th>
                  <th className="py-1 px-2">Allowable Bearing (q_all)</th>
                  <th className="py-1 px-2">Ultimate Bearing (q_ult)</th>
                  <th className="py-1 px-2 text-right">Governing Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b border-[var(--md-sys-color-outline-variant)]/40 ${result.solverMethodUsed === 'meyerhof' || !result.solverMethodUsed ? 'bg-[var(--md-sys-color-surface-container)] font-bold' : ''}`}>
                  <td className="py-1.5 px-2">Meyerhof (1963) - General Equation</td>
                  <td className="py-1.5 px-2 text-emerald-600 dark:text-emerald-400">{result.methodComparison.meyerhofKpa} kPa</td>
                  <td className="py-1.5 px-2">{(result.methodComparison.meyerhofKpa * result.factorOfSafety).toFixed(1)} kPa</td>
                  <td className="py-1.5 px-2 text-right text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {result.solverMethodUsed === 'meyerhof' || !result.solverMethodUsed ? 'ACTIVE' : 'Analytical'}
                  </td>
                </tr>
                <tr className={`border-b border-[var(--md-sys-color-outline-variant)]/40 ${result.solverMethodUsed === 'terzaghi' ? 'bg-[var(--md-sys-color-surface-container)] font-bold' : ''}`}>
                  <td className="py-1.5 px-2">Terzaghi (1943) - Classical Theory</td>
                  <td className="py-1.5 px-2 text-sky-600 dark:text-sky-400">{result.methodComparison.terzaghiKpa} kPa</td>
                  <td className="py-1.5 px-2">{(result.methodComparison.terzaghiKpa * result.factorOfSafety).toFixed(1)} kPa</td>
                  <td className="py-1.5 px-2 text-right text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {result.solverMethodUsed === 'terzaghi' ? 'ACTIVE' : 'Classical'}
                  </td>
                </tr>
                <tr className={`${result.solverMethodUsed === 'hansen' ? 'bg-[var(--md-sys-color-surface-container)] font-bold' : ''}`}>
                  <td className="py-1.5 px-2">Hansen (1970) - Inclination &amp; Depth Factors</td>
                  <td className="py-1.5 px-2 text-purple-600 dark:text-purple-400">{result.methodComparison.hansenKpa} kPa</td>
                  <td className="py-1.5 px-2">{(result.methodComparison.hansenKpa * result.factorOfSafety).toFixed(1)} kPa</td>
                  <td className="py-1.5 px-2 text-right text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {result.solverMethodUsed === 'hansen' ? 'ACTIVE' : 'Comprehensive'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety & DCR Verification Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
            Effective FS: <strong className="font-bold text-[var(--md-sys-color-primary)]">{result.effectiveSafetyFactor.toFixed(2)}</strong> (Target ≥ 2.5)
          </span>
          <span className="text-[var(--md-sys-color-on-surface-variant)]">
            Bearing DCR: {(result.utilizationRatio * 100).toFixed(1)}%
          </span>
          <span className="text-[var(--md-sys-color-on-surface-variant)]">
            Settlement DCR: {(result.settlementUtilizationRatio * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${result.status === 'nominal' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : result.status === 'warning' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30' : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'}`}>
            {result.status === 'nominal' ? 'PASS (BNBC-2020 / ACI Compliant)' : result.status === 'warning' ? 'WARNING (Near Limit)' : 'CRITICAL (Exceeds Capacity)'}
          </span>
        </div>
      </div>
    </div>
  );
};
