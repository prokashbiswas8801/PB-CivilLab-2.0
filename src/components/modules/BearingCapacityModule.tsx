import React, { useState } from 'react';
import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { BearingAnalysisResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';

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
  const [activeTab, setActiveTab] = useState<'all' | 'geometry' | 'strata' | 'loads'>('all');

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

  return (
    <div className="space-y-3.5">
      {/* Progressive Disclosure Ergonomic Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--md-sys-color-surface-container)] rounded-xl overflow-x-auto text-xs font-medium">
        {[
          { id: 'all', label: 'All Inputs' },
          { id: 'geometry', label: 'Pad Geometry' },
          { id: 'strata', label: 'Soil Strata & GWT' },
          { id: 'loads', label: 'Load & Safety FS' },
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

      {/* Tab Group 1: Footing Geometry */}
      {(activeTab === 'all' || activeTab === 'geometry') && (
        <div className="space-y-2.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]/50 border border-[var(--md-sys-color-outline-variant)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            Foundation Geometry & Shape
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
        <div className="space-y-2.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]/50 border border-[var(--md-sys-color-outline-variant)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-tertiary)] tracking-wider">
            Subgrade Soil Parameters & Water Table
          </div>
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
            Superstructure Load & Factor of Safety
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
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <UnitValueDisplay
        label="Allowable Pressure (qall)"
        category="pressure"
        siValue={result.allowableBearingKpa * 1000}
        currentUnitId={getOutputUnit('bearing.out.qall', 'pressure', 'kPa')}
        onUnitChange={(u) => updateOutputUnit('bearing.out.qall', u)}
        customUnits={customUnits}
        highlight={true}
      />
      <UnitValueDisplay
        label="Ultimate Bearing (qult)"
        category="pressure"
        siValue={result.ultimateBearingKpa * 1000}
        currentUnitId={getOutputUnit('bearing.out.qult', 'pressure', 'kPa')}
        onUnitChange={(u) => updateOutputUnit('bearing.out.qult', u)}
        customUnits={customUnits}
      />
      <UnitValueDisplay
        label="Applied Pressure (qapp)"
        category="pressure"
        siValue={result.appliedPressureKpa * 1000}
        currentUnitId={getOutputUnit('bearing.out.qapp', 'pressure', 'kPa')}
        onUnitChange={(u) => updateOutputUnit('bearing.out.qapp', u)}
        customUnits={customUnits}
      />
      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Safety Factor</div>
        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
          FS = {result.effectiveSafetyFactor.toFixed(2)}
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          Footing Area: {result.footingAreaM2.toFixed(2)} m²
        </div>
      </div>
    </div>
  );
};
