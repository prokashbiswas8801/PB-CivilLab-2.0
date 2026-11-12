import React, { useState } from 'react';
import {
  CivilWorkspace,
  StructuralElementType,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { RebarBBSResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';
import { FileSpreadsheet, FileDown, Layers, TableProperties } from 'lucide-react';
import { BBSGenerator } from '../calculators/civil/BBSGenerator';

export { BBSGenerator };

export interface RebarBbsInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

export const RebarBbsInputs: React.FC<RebarBbsInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  const [bbsMode, setBbsMode] = useState<'element' | 'workbench'>('workbench');
  const bbs = activeWorkspace.rebarBbs;

  const updateBBS = (patch: Partial<typeof bbs>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      rebarBbs: { ...ws.rebarBbs, ...patch },
    }));
  };

  const currentType = (
    bbs.elementType === 'column' ? 'column-rect' :
    bbs.elementType === 'circular-column' ? 'column-circ' :
    bbs.elementType === 'staircase' ? 'staircase-waist' :
    bbs.elementType
  ) as StructuralElementType;

  return (
    <div className="space-y-4">
      {/* Workbench vs Single Element Mode Switcher */}
      <div className="flex items-center justify-between p-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        <button
          type="button"
          onClick={() => setBbsMode('workbench')}
          className={`flex-1 min-h-[44px] touch-target-48 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            bbsMode === 'workbench'
              ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <TableProperties className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <span>Multi-Row Bar Bending Schedule (BBS Workbench)</span>
        </button>
        <button
          type="button"
          onClick={() => setBbsMode('element')}
          className={`flex-1 min-h-[44px] touch-target-48 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            bbsMode === 'element'
              ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <Layers className="w-4 h-4 text-[var(--md-sys-color-secondary)]" />
          <span>Single RCC Element Sizer (Slab, Beam, Col, Footing)</span>
        </button>
      </div>

      {bbsMode === 'workbench' ? (
        <BBSGenerator />
      ) : (
        <>
          {/* RCC Element Type Switcher */}
          <div>
        <label className="block text-xs font-semibold mb-1.5 text-[var(--md-sys-color-on-surface)]">
          RCC Structural Element
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 p-1 rounded-xl bg-[var(--md-sys-color-surface-container)]">
          {[
            { id: 'slab', label: 'RCC Slab' },
            { id: 'beam', label: 'RCC Beam' },
            { id: 'column-rect', label: 'Rect Column' },
            { id: 'column-circ', label: 'Circ Column' },
            { id: 'footing', label: 'Pad Footing' },
            { id: 'staircase-waist', label: 'Stair Flight' },
            { id: 'lintel-chajja', label: 'Lintel & Chajja' },
            { id: 'pile-cage', label: 'Bored Pile Cage' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => updateBBS({ elementType: type.id as any })}
              className={`min-h-[44px] touch-target-48 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                currentType === type.id
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Global Rebar Settings: Clear Concrete Cover & Hook Angle */}
      <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-secondary)] tracking-wider">
            Clear Concrete Cover & Hook Standard
          </span>
          <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
            BNBC 2020 Sec 8.1.8 / ACI 318 Table 20.6.1.3.1
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <UnitInput
            label="Nominal Clear Cover"
            category="length"
            siValue={(bbs.clearCoverMm || 20) * 0.001}
            onChangeSI={(val) => updateBBS({ clearCoverMm: Math.max(10, Math.round(val * 1000)) })}
            currentUnitId={getFieldUnit('rebar.cover', 'length', 'mm')}
            onUnitChange={(u) => updateFieldUnit('rebar.cover', u)}
            customUnits={customUnits}
            step={5}
            presets={[
              { label: '20 mm', valueSI: 0.020, title: 'Internal Slab & Staircase' },
              { label: '40 mm', valueSI: 0.040, title: 'Beams & Columns (BNBC standard)' },
              { label: '50 mm', valueSI: 0.050, title: 'Severe Coastal / External Exposure' },
              { label: '75 mm', valueSI: 0.075, title: 'Cast Directly Against Soil (Footing Base)' },
            ]}
            validationRule={{
              minSI: 0.015,
              maxSI: 0.150,
              warningBelowSI: 0.020,
              warningHint: 'Clear cover < 20 mm is below code minimum for concrete exposed to weather or internal fire resistance.',
            }}
            standardRef="BNBC 2020 / ACI 318-19"
            recommendedRange="20 mm (slabs) – 75 mm (earth contact)"
            designTip="Cover protects reinforcing steel from carbonation, moisture ingress, and fire."
          />

          <div>
            <label className="block text-xs font-semibold mb-1">Steel Grade (BDS ISO 6935-2)</label>
            <select
              value={bbs.steelGradeType || '500w-grade60'}
              onChange={(e) => updateBBS({ steelGradeType: e.target.value as any })}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            >
              <option value="500w-grade60">500W Grade 60 (500 MPa / 72.5 ksi - BNBC Standard)</option>
              <option value="400w-grade40">400W Grade 40 (400 MPa / 58 ksi - Mild Deformed)</option>
              <option value="550d-highductile">550D High Ductility (550 MPa - High-Rise Frames)</option>
            </select>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
              BSRM / AKS / KSRM standard thermo-mechanically treated (TMT)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Standard Hook &amp; Stirrup Bend</label>
            <select
              value={bbs.hookAngle || '135'}
              onChange={(e) => updateBBS({ hookAngle: e.target.value as '90' | '135' | '180' })}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            >
              <option value="135">135° Seismic Ductile Stirrup (10db ≥ 75mm - BNBC §8.2.3)</option>
              <option value="90">90° Standard L-Bend (Bend deduction: 2d)</option>
              <option value="180">180° Semi-circular Hook (Bend deduction: 4d)</option>
            </select>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
              135° hooks mandatory for seismic confinement zones
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Lapping Standard (&gt; 12m)</label>
            <select
              value={bbs.lappingFactorD || 50}
              onChange={(e) => updateBBS({ lappingFactorD: Number(e.target.value) })}
              className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            >
              <option value="50">50d Tension Lap (BNBC / ACI Class B)</option>
              <option value="60">60d Severe / Seismic Splice Lap</option>
              <option value="40">40d Compression Lap (Columns only)</option>
            </select>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">
              12m stock mill length waste minimization
            </span>
          </div>
        </div>
      </div>

      {/* ELEMENT: RCC BEAM */}
      {currentType === 'beam' && (
        <div className="space-y-3 p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            RCC Beam Section Dimensions &amp; Longitudinal Reinforcement
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <UnitInput
              label="Clear Span Length L"
              category="length"
              siValue={bbs.beamLengthM || 5.0}
              onChangeSI={(val) => updateBBS({ beamLengthM: val })}
              currentUnitId={getFieldUnit('rebar.beamSpan', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.beamSpan', u)}
              customUnits={customUnits}
              step={0.5}
              presets={[
                { label: '3.0 m (10 ft)', valueSI: 3.0, title: '10 ft Span' },
                { label: '5.0 m (16.4 ft)', valueSI: 5.0, title: 'Standard Span' },
                { label: '6.0 m (20 ft)', valueSI: 6.0, title: 'Long Span' },
              ]}
              validationRule={{
                minSI: 0.5,
                maxSI: 30.0,
                warningBelowSI: 1.0,
                warningHint: 'Beam span < 1.0 m is unusually short for typical structural spans.',
              }}
            />
            <UnitInput
              label="Beam Width b"
              category="length"
              siValue={(bbs.beamWidthMm || 250) * 0.001}
              onChangeSI={(val) => updateBBS({ beamWidthMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.beamW', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.beamW', u)}
              customUnits={customUnits}
              step={25}
              presets={[
                { label: '250 mm (10")', valueSI: 0.250, title: '10" Beam Width' },
                { label: '300 mm (12")', valueSI: 0.300, title: '12" Beam Width' },
                { label: '375 mm (15")', valueSI: 0.375, title: '15" Heavy Width' },
              ]}
            />
            <UnitInput
              label="Beam Total Depth h"
              category="length"
              siValue={(bbs.beamDepthMm || 500) * 0.001}
              onChangeSI={(val) => updateBBS({ beamDepthMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.beamD', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.beamD', u)}
              customUnits={customUnits}
              step={50}
              presets={[
                { label: '400 mm (16")', valueSI: 0.400, title: '16" Depth' },
                { label: '500 mm (20")', valueSI: 0.500, title: '20" Depth' },
                { label: '600 mm (24")', valueSI: 0.600, title: '24" Heavy Depth' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Main Longitudinal Rebar Dia"
              category="length"
              siValue={(bbs.beamMainBarDiaMm || 16) * 0.001}
              onChangeSI={(val) => updateBBS({ beamMainBarDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.beamMainDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.beamMainDia', u)}
              customUnits={customUnits}
              step={4}
              presets={[
                { label: 'Ø16 mm', valueSI: 0.016, title: '16mm Tension Bar' },
                { label: 'Ø20 mm', valueSI: 0.020, title: '20mm Standard Bar' },
                { label: 'Ø25 mm', valueSI: 0.025, title: '25mm Heavy Bar' },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Bottom Bars (Tension)</label>
                <input
                  type="number"
                  min="2"
                  max="12"
                  value={bbs.beamBotBarCount || 3}
                  onChange={(e) => updateBBS({ beamBotBarCount: Math.max(1, Number(e.target.value) || 2) })}
                  className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                />
                <div className="flex items-center gap-1 mt-1">
                  {[2, 3, 4].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => updateBBS({ beamBotBarCount: cnt })}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                        (bbs.beamBotBarCount || 3) === cnt
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                          : 'bg-[var(--md-sys-color-surface-container)]'
                      }`}
                    >
                      {cnt} Nos
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Top Bars (Hangers)</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={bbs.beamTopBarCount || 2}
                  onChange={(e) => updateBBS({ beamTopBarCount: Math.max(1, Number(e.target.value) || 2) })}
                  className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                />
                <div className="flex items-center gap-1 mt-1">
                  {[2, 3, 4].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => updateBBS({ beamTopBarCount: cnt })}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                        (bbs.beamTopBarCount || 2) === cnt
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                          : 'bg-[var(--md-sys-color-surface-container)]'
                      }`}
                    >
                      {cnt} Nos
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Shear Stirrup Bar Dia"
              category="length"
              siValue={(bbs.beamStirrupDiaMm || 8) * 0.001}
              onChangeSI={(val) => updateBBS({ beamStirrupDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.beamStirrupDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.beamStirrupDia', u)}
              customUnits={customUnits}
              step={2}
              presets={[
                { label: 'Ø8 mm', valueSI: 0.008, title: '8mm Stirrup' },
                { label: 'Ø10 mm', valueSI: 0.010, title: '10mm Stirrup' },
              ]}
              standardRef="ACI 318 Sec 25.7.1"
            />
            <UnitInput
              label="Stirrup Spacing c/c"
              category="length"
              siValue={(bbs.beamStirrupSpacingMm || 150) * 0.001}
              onChangeSI={(val) => updateBBS({ beamStirrupSpacingMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.beamStirrupSpacing', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.beamStirrupSpacing', u)}
              customUnits={customUnits}
              step={25}
              presets={[
                { label: '100 mm (4")', valueSI: 0.100, title: 'End Zone Shear Spacing' },
                { label: '150 mm (6")', valueSI: 0.150, title: 'Midspan Spacing' },
                { label: '200 mm (8")', valueSI: 0.200, title: 'Maximum Code Spacing' },
              ]}
              standardRef="ACI 318 Sec 9.7.6"
            />
          </div>
        </div>
      )}

      {/* ELEMENT 1: RCC SLAB */}
      {currentType === 'slab' && (
        <div className="space-y-3 p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            Slab Geometry & Reinforcement Mesh
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <UnitInput
              label="Slab Long Span L"
              category="length"
              siValue={bbs.slabLengthM}
              onChangeSI={(val) => updateBBS({ slabLengthM: val })}
              currentUnitId={getFieldUnit('rebar.slabLength', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.slabLength', u)}
              customUnits={customUnits}
              step={0.25}
              presets={[
                { label: '4.5 m', valueSI: 4.5, title: 'Residential Room Span' },
                { label: '6.0 m', valueSI: 6.0, title: 'Standard Bay Span' },
                { label: '7.5 m', valueSI: 7.5, title: 'Large Commercial Bay' },
              ]}
              standardRef="BNBC 2020 Part 6"
            />
            <UnitInput
              label="Slab Short Span W"
              category="length"
              siValue={bbs.slabWidthM}
              onChangeSI={(val) => updateBBS({ slabWidthM: val })}
              currentUnitId={getFieldUnit('rebar.slabWidth', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.slabWidth', u)}
              customUnits={customUnits}
              step={0.25}
              presets={[
                { label: '3.5 m', valueSI: 3.5, title: 'Typical Corridor/Room Width' },
                { label: '4.5 m', valueSI: 4.5, title: 'Standard Panel Width' },
                { label: '6.0 m', valueSI: 6.0, title: 'Square Panel Grid' },
              ]}
              standardRef="BNBC 2020 Part 6"
            />
            <UnitInput
              label="Slab Thickness h"
              category="length"
              siValue={(bbs.slabThicknessMm || 150) * 0.001}
              onChangeSI={(val) => updateBBS({ slabThicknessMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.slabThick', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.slabThick', u)}
              customUnits={customUnits}
              step={10}
              presets={[
                { label: '125 mm (5")', valueSI: 0.125, title: 'Minimum 5" Two-Way Slab' },
                { label: '150 mm (6")', valueSI: 0.150, title: 'Standard 6" Floor Slab' },
                { label: '175 mm (7")', valueSI: 0.175, title: '7" Heavy Load Slab' },
                { label: '200 mm (8")', valueSI: 0.200, title: '8" Flat Plate Slab' },
              ]}
              standardRef="ACI 318-19 Table 8.3.1.1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Main Reinforcement Bar Dia (Short Span)"
              category="length"
              siValue={bbs.mainBarDiaMm * 0.001}
              onChangeSI={(val) => updateBBS({ mainBarDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.mainDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.mainDia', u)}
              customUnits={customUnits}
              step={2}
              presets={[
                { label: 'Ø10 mm', valueSI: 0.010, title: '#3 / 10mm Bar' },
                { label: 'Ø12 mm', valueSI: 0.012, title: '#4 / 12mm Standard Slab Bar' },
                { label: 'Ø16 mm', valueSI: 0.016, title: '#5 / 16mm Heavy Slab Bar' },
              ]}
              standardRef="ASTM A615 / BDS ISO 6935-2"
            />
            <UnitInput
              label="Main Bar Spacing c/c"
              category="length"
              siValue={(bbs.mainBarSpacingMm || 150) * 0.001}
              onChangeSI={(val) => updateBBS({ mainBarSpacingMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.mainSpacing', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.mainSpacing', u)}
              customUnits={customUnits}
              step={25}
              presets={[
                { label: '100 mm (4")', valueSI: 0.100, title: '4" Dense Spacing' },
                { label: '125 mm (5")', valueSI: 0.125, title: '5" Spacing' },
                { label: '150 mm (6")', valueSI: 0.150, title: '6" Standard Spacing' },
                { label: '175 mm (7")', valueSI: 0.175, title: '7" Spacing' },
              ]}
              validationRule={{
                minSI: 0.075,
                maxSI: 0.450,
                warningAboveSI: Math.min((bbs.slabThicknessMm || 150) * 3, 450) * 0.001,
                warningHint: `Spacing exceeds code maximum: BNBC/ACI limits slab bar spacing to min(3h, 450mm) = ${Math.min((bbs.slabThicknessMm || 150) * 3, 450)} mm.`,
              }}
              standardRef="ACI 318 Sec 7.7.2.3"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Distribution / Temperature Bar Dia"
              category="length"
              siValue={(bbs.distBarDiaMm || 10) * 0.001}
              onChangeSI={(val) => updateBBS({ distBarDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.distDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.distDia', u)}
              customUnits={customUnits}
              step={2}
              presets={[
                { label: 'Ø8 mm', valueSI: 0.008, title: '8mm Distribution' },
                { label: 'Ø10 mm', valueSI: 0.010, title: '10mm Distribution' },
                { label: 'Ø12 mm', valueSI: 0.012, title: '12mm Distribution' },
              ]}
              standardRef="ASTM A615 / BDS ISO 6935-2"
            />
            <UnitInput
              label="Distribution Bar Spacing c/c"
              category="length"
              siValue={(bbs.distBarSpacingMm || 175) * 0.001}
              onChangeSI={(val) => updateBBS({ distBarSpacingMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.distSpacing', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.distSpacing', u)}
              customUnits={customUnits}
              step={25}
              presets={[
                { label: '150 mm (6")', valueSI: 0.150, title: '6" Spacing' },
                { label: '175 mm (7")', valueSI: 0.175, title: '7" Spacing' },
                { label: '200 mm (8")', valueSI: 0.200, title: '8" Spacing' },
              ]}
              standardRef="ACI 318 Sec 7.7.2.3"
            />
          </div>
        </div>
      )}

      {/* ELEMENT 2: RECTANGULAR TIED COLUMN */}
      {currentType === 'column-rect' && (
        <div className="space-y-3 p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            Rectangular Column Cross Section & Lateral Ties
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <UnitInput
              label="Column Length L"
              category="length"
              siValue={(bbs.colLengthMm || 450) * 0.001}
              onChangeSI={(val) => updateBBS({ colLengthMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.colL', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.colL', u)}
              customUnits={customUnits}
              step={50}
              presets={[
                { label: '300 mm (12")', valueSI: 0.300, title: '12" Small Column' },
                { label: '450 mm (18")', valueSI: 0.450, title: '18" Standard Column' },
                { label: '600 mm (24")', valueSI: 0.600, title: '24" Heavy Column' },
              ]}
            />
            <UnitInput
              label="Column Width B"
              category="length"
              siValue={(bbs.colWidthMm || 450) * 0.001}
              onChangeSI={(val) => updateBBS({ colWidthMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.colW', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.colW', u)}
              customUnits={customUnits}
              step={50}
              presets={[
                { label: '300 mm (12")', valueSI: 0.300, title: '12" Small Column' },
                { label: '450 mm (18")', valueSI: 0.450, title: '18" Standard Column' },
                { label: '600 mm (24")', valueSI: 0.600, title: '24" Heavy Column' },
              ]}
            />
            <UnitInput
              label="Storey Clear Height H"
              category="length"
              siValue={bbs.colHeightM || 3.6}
              onChangeSI={(val) => updateBBS({ colHeightM: val })}
              currentUnitId={getFieldUnit('rebar.colH', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.colH', u)}
              customUnits={customUnits}
              step={0.3}
              presets={[
                { label: '3.0 m (10 ft)', valueSI: 3.0, title: '10 ft Residential Floor' },
                { label: '3.6 m (12 ft)', valueSI: 3.6, title: '12 ft Commercial Floor' },
                { label: '4.5 m (15 ft)', valueSI: 4.5, title: '15 ft High Bay' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Longitudinal Main Bar Dia"
              category="length"
              siValue={(bbs.colMainBarDiaMm || 20) * 0.001}
              onChangeSI={(val) => updateBBS({ colMainBarDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.colMainDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.colMainDia', u)}
              customUnits={customUnits}
              step={2}
              presets={[
                { label: 'Ø16 mm', valueSI: 0.016, title: '16mm Bar' },
                { label: 'Ø20 mm', valueSI: 0.020, title: '20mm Standard Column Bar' },
                { label: 'Ø25 mm', valueSI: 0.025, title: '25mm Heavy Bar' },
                { label: 'Ø32 mm', valueSI: 0.032, title: '32mm Core Bar' },
              ]}
              standardRef="BNBC 2020 Part 6"
            />
            <div>
              <label className="block text-xs font-semibold mb-1">Longitudinal Bar Count (Nos)</label>
              <input
                type="number"
                min="4"
                max="32"
                step="2"
                value={bbs.colMainBarCount || 8}
                onChange={(e) => updateBBS({ colMainBarCount: Math.max(4, Number(e.target.value) || 4) })}
                className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <div className="flex items-center gap-1 mt-1 overflow-x-auto">
                {[4, 6, 8, 12].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => updateBBS({ colMainBarCount: cnt })}
                    className={`px-2.5 py-0.5 text-[10px] font-mono rounded-full border transition-colors cursor-pointer ${
                      bbs.colMainBarCount === cnt
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent font-bold'
                        : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                    }`}
                  >
                    {cnt} Nos
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Lateral Tie / Stirrup Dia"
              category="length"
              siValue={(bbs.tieBarDiaMm || 10) * 0.001}
              onChangeSI={(val) => updateBBS({ tieBarDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.tieDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.tieDia', u)}
              customUnits={customUnits}
              step={2}
              presets={[
                { label: 'Ø8 mm', valueSI: 0.008, title: '8mm Tie (for ≤ 20mm main bars)' },
                { label: 'Ø10 mm', valueSI: 0.010, title: '10mm Standard Tie' },
                { label: 'Ø12 mm', valueSI: 0.012, title: '12mm Seismic Tie' },
              ]}
              standardRef="ACI 318 Sec 25.7.2.2"
            />
            <UnitInput
              label="Tie Spacing c/c"
              category="length"
              siValue={(bbs.tieSpacingMm || 150) * 0.001}
              onChangeSI={(val) => updateBBS({ tieSpacingMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.tieSpacing', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.tieSpacing', u)}
              customUnits={customUnits}
              step={25}
              presets={[
                { label: '100 mm (4")', valueSI: 0.100, title: 'Confined End Zone Spacing' },
                { label: '150 mm (6")', valueSI: 0.150, title: 'Standard Intermediate Spacing' },
                { label: '200 mm (8")', valueSI: 0.200, title: 'Maximum Code Limit' },
              ]}
              standardRef="ACI 318 Sec 25.7.2.1 / BNBC 2020"
            />
          </div>
        </div>
      )}

      {/* ELEMENT 3: CIRCULAR SPIRAL COLUMN */}
      {currentType === 'column-circ' && (
        <div className="space-y-3 p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            Circular Column Diameter & Helical Spiral
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <UnitInput
              label="Column Outer Diameter D"
              category="length"
              siValue={(bbs.circColDiaMm || 500) * 0.001}
              onChangeSI={(val) => updateBBS({ circColDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.circDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.circDia', u)}
              customUnits={customUnits}
              step={50}
              presets={[
                { label: '400 mm (16")', valueSI: 0.400, title: '16" Pier Column' },
                { label: '500 mm (20")', valueSI: 0.500, title: '20" Standard Pier' },
                { label: '600 mm (24")', valueSI: 0.600, title: '24" Heavy Column' },
              ]}
            />
            <UnitInput
              label="Clear Height H"
              category="length"
              siValue={bbs.circColHeightM || 3.6}
              onChangeSI={(val) => updateBBS({ circColHeightM: val })}
              currentUnitId={getFieldUnit('rebar.circH', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.circH', u)}
              customUnits={customUnits}
              step={0.3}
              presets={[
                { label: '3.0 m', valueSI: 3.0, title: '10 ft Storey' },
                { label: '3.6 m', valueSI: 3.6, title: '12 ft Storey' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Main Longitudinal Bar Dia"
              category="length"
              siValue={(bbs.circMainBarDiaMm || 20) * 0.001}
              onChangeSI={(val) => updateBBS({ circMainBarDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.circMainDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.circMainDia', u)}
              customUnits={customUnits}
              step={2}
              presets={[
                { label: 'Ø16 mm', valueSI: 0.016, title: '16mm Bar' },
                { label: 'Ø20 mm', valueSI: 0.020, title: '20mm Standard Bar' },
                { label: 'Ø25 mm', valueSI: 0.025, title: '25mm Heavy Bar' },
              ]}
            />
            <div>
              <label className="block text-xs font-semibold mb-1">Bar Count (Min 6 for Circular)</label>
              <input
                type="number"
                min="6"
                max="32"
                value={bbs.circMainBarCount || 8}
                onChange={(e) => updateBBS({ circMainBarCount: Math.max(6, Number(e.target.value) || 6) })}
                className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Helical Spiral Bar Dia"
              category="length"
              siValue={(bbs.spiralTieDiaMm || 10) * 0.001}
              onChangeSI={(val) => updateBBS({ spiralTieDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.spiralDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.spiralDia', u)}
              customUnits={customUnits}
              step={2}
              presets={[
                { label: 'Ø8 mm', valueSI: 0.008, title: '8mm Spiral' },
                { label: 'Ø10 mm', valueSI: 0.010, title: '10mm Spiral' },
              ]}
              standardRef="ACI 318 Sec 25.7.3"
            />
            <UnitInput
              label="Spiral Pitch / Lead c/c"
              category="length"
              siValue={(bbs.spiralPitchMm || 75) * 0.001}
              onChangeSI={(val) => updateBBS({ spiralPitchMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.spiralPitch', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.spiralPitch', u)}
              customUnits={customUnits}
              step={10}
              presets={[
                { label: '50 mm (2")', valueSI: 0.050, title: '2" Heavy Confinement' },
                { label: '75 mm (3")', valueSI: 0.075, title: '3" Standard Spiral Pitch' },
              ]}
              standardRef="ACI 318 Sec 25.7.3.3"
              recommendedRange="25 mm – 75 mm"
            />
          </div>
        </div>
      )}

      {/* ELEMENT 4: ISOLATED PAD FOOTING */}
      {currentType === 'footing' && (
        <div className="space-y-3 p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            Isolated Footing Geometry & Bottom Rebar Mesh
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <UnitInput
              label="Footing Length L"
              category="length"
              siValue={bbs.footingLengthM || 2.5}
              onChangeSI={(val) => updateBBS({ footingLengthM: val })}
              currentUnitId={getFieldUnit('rebar.footL', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.footL', u)}
              customUnits={customUnits}
              step={0.2}
              presets={[
                { label: '1.8 m', valueSI: 1.8, title: '6 ft Footing' },
                { label: '2.5 m', valueSI: 2.5, title: '8 ft Footing' },
                { label: '3.2 m', valueSI: 3.2, title: '10 ft Footing' },
              ]}
            />
            <UnitInput
              label="Footing Width B"
              category="length"
              siValue={bbs.footingWidthM || 2.5}
              onChangeSI={(val) => updateBBS({ footingWidthM: val })}
              currentUnitId={getFieldUnit('rebar.footW', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.footW', u)}
              customUnits={customUnits}
              step={0.2}
              presets={[
                { label: '1.8 m', valueSI: 1.8, title: '6 ft Footing' },
                { label: '2.5 m', valueSI: 2.5, title: '8 ft Footing' },
                { label: '3.2 m', valueSI: 3.2, title: '10 ft Footing' },
              ]}
            />
            <UnitInput
              label="Footing Depth / Thickness D"
              category="length"
              siValue={(bbs.footingDepthMm || 600) * 0.001}
              onChangeSI={(val) => updateBBS({ footingDepthMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.footD', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.footD', u)}
              customUnits={customUnits}
              step={50}
              presets={[
                { label: '450 mm (18")', valueSI: 0.450, title: '18" Depth' },
                { label: '600 mm (24")', valueSI: 0.600, title: '24" Standard Pad Depth' },
                { label: '750 mm (30")', valueSI: 0.750, title: '30" Heavy Pad Depth' },
              ]}
              standardRef="ACI 318 Sec 13.3.1.2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Footing Mesh Bar Dia"
              category="length"
              siValue={(bbs.footingBarDiaMm || 16) * 0.001}
              onChangeSI={(val) => updateBBS({ footingBarDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.footDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.footDia', u)}
              customUnits={customUnits}
              step={2}
              presets={[
                { label: 'Ø12 mm', valueSI: 0.012, title: '12mm Light Footing Bar' },
                { label: 'Ø16 mm', valueSI: 0.016, title: '16mm Standard Footing Bar' },
                { label: 'Ø20 mm', valueSI: 0.020, title: '20mm Heavy Footing Bar' },
              ]}
              standardRef="BNBC 2020 Part 6"
            />
            <UnitInput
              label="Mesh Spacing c/c (Both Ways)"
              category="length"
              siValue={(bbs.footingBarSpacingMm || 150) * 0.001}
              onChangeSI={(val) => updateBBS({ footingBarSpacingMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.footSpacing', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.footSpacing', u)}
              customUnits={customUnits}
              step={25}
              presets={[
                { label: '100 mm (4")', valueSI: 0.100, title: '4" Dense Mesh' },
                { label: '125 mm (5")', valueSI: 0.125, title: '5" Spacing' },
                { label: '150 mm (6")', valueSI: 0.150, title: '6" Standard Mesh' },
                { label: '200 mm (8")', valueSI: 0.200, title: '8" Maximum Footing Spacing' },
              ]}
              standardRef="ACI 318 Sec 13.3.3.3"
            />
          </div>
        </div>
      )}

      {/* ELEMENT 5: STAIRCASE WAIST SLAB */}
      {currentType === 'staircase-waist' && (
        <div className="space-y-3 p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            Staircase Flight Geometry & Longitudinal Rebar
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <UnitInput
              label="Horizontal Going L"
              category="length"
              siValue={bbs.stairGoingM || 3.0}
              onChangeSI={(val) => updateBBS({ stairGoingM: val })}
              currentUnitId={getFieldUnit('rebar.stairGoing', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.stairGoing', u)}
              customUnits={customUnits}
              step={0.25}
              presets={[
                { label: '2.5 m', valueSI: 2.5, title: 'Short Flight' },
                { label: '3.0 m', valueSI: 3.0, title: 'Standard 10-Tread Flight' },
              ]}
            />
            <UnitInput
              label="Total Vertical Rise H"
              category="length"
              siValue={bbs.stairTotalRiseM || 1.8}
              onChangeSI={(val) => updateBBS({ stairTotalRiseM: val })}
              currentUnitId={getFieldUnit('rebar.stairRise', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.stairRise', u)}
              customUnits={customUnits}
              step={0.15}
              presets={[
                { label: '1.5 m', valueSI: 1.5, title: '1.5m Mid-landing Rise' },
                { label: '1.8 m', valueSI: 1.8, title: '1.8m Half-storey Rise' },
              ]}
            />
            <UnitInput
              label="Waist Slab Thickness"
              category="length"
              siValue={(bbs.waistSlabThicknessMm || 150) * 0.001}
              onChangeSI={(val) => updateBBS({ waistSlabThicknessMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.waistThick', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.waistThick', u)}
              customUnits={customUnits}
              step={10}
              presets={[
                { label: '125 mm (5")', valueSI: 0.125, title: '5" Waist Slab' },
                { label: '150 mm (6")', valueSI: 0.150, title: '6" Standard Waist Slab' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Main Inclined Bar Dia"
              category="length"
              siValue={(bbs.stairMainBarDiaMm || 12) * 0.001}
              onChangeSI={(val) => updateBBS({ stairMainBarDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.stairMainDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.stairMainDia', u)}
              customUnits={customUnits}
              step={2}
              presets={[
                { label: 'Ø10 mm', valueSI: 0.010, title: '10mm Bar' },
                { label: 'Ø12 mm', valueSI: 0.012, title: '12mm Standard Stair Bar' },
                { label: 'Ø16 mm', valueSI: 0.016, title: '16mm Heavy Stair Bar' },
              ]}
            />
            <UnitInput
              label="Main Bar Spacing c/c"
              category="length"
              siValue={(bbs.stairMainBarSpacingMm || 150) * 0.001}
              onChangeSI={(val) => updateBBS({ stairMainBarSpacingMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.stairMainSpacing', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.stairMainSpacing', u)}
              customUnits={customUnits}
              step={25}
              presets={[
                { label: '125 mm (5")', valueSI: 0.125, title: '5" Spacing' },
                { label: '150 mm (6")', valueSI: 0.150, title: '6" Standard Spacing' },
              ]}
            />
          </div>
        </div>
      )}

      {/* ELEMENT 6: LINTEL & SUNSHADE CHAJJA */}
      {currentType === 'lintel-chajja' && (
        <div className="space-y-3 p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            Lintel Beam & Cantilever Chajja / Sunshade Dimensions
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <UnitInput
              label="Lintel Clear Span L"
              category="length"
              siValue={bbs.lintelLengthM ?? 2.1}
              onChangeSI={(val) => updateBBS({ lintelLengthM: val })}
              currentUnitId={getFieldUnit('rebar.lintelL', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.lintelL', u)}
              customUnits={customUnits}
              step={0.15}
              presets={[
                { label: '1.5 m (5 ft)', valueSI: 1.5, title: 'Standard Window Lintel' },
                { label: '2.1 m (7 ft)', valueSI: 2.1, title: 'Wide Window / Veranda Lintel' },
                { label: '2.7 m (9 ft)', valueSI: 2.7, title: 'Combined Door-Window Lintel' },
              ]}
            />
            <UnitInput
              label="Lintel Width b"
              category="length"
              siValue={(bbs.lintelWidthMm ?? 250) * 0.001}
              onChangeSI={(val) => updateBBS({ lintelWidthMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.lintelW', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.lintelW', u)}
              customUnits={customUnits}
              step={25}
              presets={[
                { label: '125 mm (5")', valueSI: 0.125, title: '5" Wall Lintel' },
                { label: '250 mm (10")', valueSI: 0.250, title: '10" Brickwork Wall Lintel' },
              ]}
            />
            <UnitInput
              label="Lintel Depth D"
              category="length"
              siValue={(bbs.lintelDepthMm ?? 150) * 0.001}
              onChangeSI={(val) => updateBBS({ lintelDepthMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.lintelD', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.lintelD', u)}
              customUnits={customUnits}
              step={25}
              presets={[
                { label: '150 mm (6")', valueSI: 0.150, title: '6" Standard Lintel Depth' },
                { label: '200 mm (8")', valueSI: 0.200, title: '8" Heavy Lintel Depth' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Lintel Main Rebar Dia"
              category="length"
              siValue={(bbs.lintelMainBarDiaMm ?? 12) * 0.001}
              onChangeSI={(val) => updateBBS({ lintelMainBarDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.lintelMainDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.lintelMainDia', u)}
              customUnits={customUnits}
              step={2}
              presets={[
                { label: 'Ø10 mm', valueSI: 0.010, title: '10mm Light Lintel' },
                { label: 'Ø12 mm', valueSI: 0.012, title: '12mm Standard Lintel' },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Bottom Rebar (Nos)</label>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={bbs.lintelBotBarCount ?? 2}
                  onChange={(e) => updateBBS({ lintelBotBarCount: Math.max(2, Number(e.target.value) || 2) })}
                  className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Top Rebar (Nos)</label>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={bbs.lintelTopBarCount ?? 2}
                  onChange={(e) => updateBBS({ lintelTopBarCount: Math.max(2, Number(e.target.value) || 2) })}
                  className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-secondary)] tracking-wider mb-2">
              Cantilever Chajja / Sunshade Overhang Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <UnitInput
                label="Chajja Projection P"
                category="length"
                siValue={bbs.chajjaProjectionM ?? 0.6}
                onChangeSI={(val) => updateBBS({ chajjaProjectionM: val })}
                currentUnitId={getFieldUnit('rebar.chajjaP', 'length', 'm')}
                onUnitChange={(u) => updateFieldUnit('rebar.chajjaP', u)}
                customUnits={customUnits}
                step={0.1}
                presets={[
                  { label: '0.45 m (18")', valueSI: 0.45, title: '18" Standard Projection' },
                  { label: '0.60 m (24")', valueSI: 0.60, title: '24" Generous Sunshade' },
                  { label: '0.75 m (30")', valueSI: 0.75, title: '30" Veranda Projection' },
                ]}
              />
              <UnitInput
                label="Chajja Main Cantilever Bar Dia"
                category="length"
                siValue={(bbs.chajjaMainBarDiaMm ?? 10) * 0.001}
                onChangeSI={(val) => updateBBS({ chajjaMainBarDiaMm: Math.round(val * 1000) })}
                currentUnitId={getFieldUnit('rebar.chajjaMainDia', 'length', 'mm')}
                onUnitChange={(u) => updateFieldUnit('rebar.chajjaMainDia', u)}
                customUnits={customUnits}
                step={2}
                presets={[
                  { label: 'Ø8 mm', valueSI: 0.008, title: '8mm Rebar' },
                  { label: 'Ø10 mm', valueSI: 0.010, title: '10mm Standard Rebar' },
                ]}
              />
              <UnitInput
                label="Chajja Main Bar Spacing c/c"
                category="length"
                siValue={(bbs.chajjaMainBarSpacingMm ?? 150) * 0.001}
                onChangeSI={(val) => updateBBS({ chajjaMainBarSpacingMm: Math.round(val * 1000) })}
                currentUnitId={getFieldUnit('rebar.chajjaSpacing', 'length', 'mm')}
                onUnitChange={(u) => updateFieldUnit('rebar.chajjaSpacing', u)}
                customUnits={customUnits}
                step={25}
                presets={[
                  { label: '125 mm (5")', valueSI: 0.125, title: '5" Spacing' },
                  { label: '150 mm (6")', valueSI: 0.150, title: '6" Standard Spacing' },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* ELEMENT 7: BORED CAST-IN-SITU PILE CAGE */}
      {currentType === 'pile-cage' && (
        <div className="space-y-3 p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            Bored Cast-in-Situ Pile Geometry & Reinforcement Cage
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <UnitInput
              label="Pile Diameter D"
              category="length"
              siValue={(bbs.pileDiaMm ?? 500) * 0.001}
              onChangeSI={(val) => updateBBS({ pileDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.pileDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.pileDia', u)}
              customUnits={customUnits}
              step={50}
              presets={[
                { label: '500 mm (20")', valueSI: 0.500, title: '20" Bored Pile' },
                { label: '600 mm (24")', valueSI: 0.600, title: '24" Standard Bored Pile' },
                { label: '750 mm (30")', valueSI: 0.750, title: '30" Heavy Capacity Pile' },
              ]}
              standardRef="BNBC 2020 Part 6 Sec 3.10"
            />
            <UnitInput
              label="Pile Depth / Length L"
              category="length"
              siValue={bbs.pileLengthM ?? 18.0}
              onChangeSI={(val) => updateBBS({ pileLengthM: val })}
              currentUnitId={getFieldUnit('rebar.pileL', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.pileL', u)}
              customUnits={customUnits}
              step={1.0}
              presets={[
                { label: '15.0 m (50 ft)', valueSI: 15.0, title: '50 ft Bored Pile' },
                { label: '18.0 m (60 ft)', valueSI: 18.0, title: '60 ft Standard Pile' },
                { label: '24.0 m (80 ft)', valueSI: 24.0, title: '80 ft Deep Pile (>12m lapped)' },
              ]}
            />
            <UnitInput
              label="Pile Head Embedment into Cap"
              category="length"
              siValue={bbs.pileCutoffEmbedmentM ?? 0.75}
              onChangeSI={(val) => updateBBS({ pileCutoffEmbedmentM: val })}
              currentUnitId={getFieldUnit('rebar.pileCapEmbed', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('rebar.pileCapEmbed', u)}
              customUnits={customUnits}
              step={0.05}
              presets={[
                { label: '0.60 m (24")', valueSI: 0.60, title: '24" Embedment' },
                { label: '0.75 m (30")', valueSI: 0.75, title: '30" Standard Dowel' },
              ]}
              standardRef="BNBC 2020 / ACI 318"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Longitudinal Main Bar Dia"
              category="length"
              siValue={(bbs.pileMainBarDiaMm ?? 16) * 0.001}
              onChangeSI={(val) => updateBBS({ pileMainBarDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.pileMainDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.pileMainDia', u)}
              customUnits={customUnits}
              step={4}
              presets={[
                { label: 'Ø16 mm', valueSI: 0.016, title: '16mm Main Bar' },
                { label: 'Ø20 mm', valueSI: 0.020, title: '20mm Main Bar' },
                { label: 'Ø25 mm', valueSI: 0.025, title: '25mm Main Bar' },
              ]}
            />
            <div>
              <label className="block text-xs font-semibold mb-1">Longitudinal Bar Count</label>
              <input
                type="number"
                min="6"
                max="24"
                value={bbs.pileMainBarCount ?? 7}
                onChange={(e) => updateBBS({ pileMainBarCount: Math.max(6, Number(e.target.value) || 6) })}
                className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              />
              <div className="flex items-center gap-1 mt-1 overflow-x-auto">
                {[6, 7, 8, 10, 12].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => updateBBS({ pileMainBarCount: cnt })}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                      (bbs.pileMainBarCount ?? 7) === cnt
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                        : 'bg-[var(--md-sys-color-surface-container)]'
                    }`}
                  >
                    {cnt} Nos
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <UnitInput
              label="Helical Spiral Tie Dia"
              category="length"
              siValue={(bbs.pileSpiralDiaMm ?? 8) * 0.001}
              onChangeSI={(val) => updateBBS({ pileSpiralDiaMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.pileSpiralDia', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.pileSpiralDia', u)}
              customUnits={customUnits}
              step={2}
              presets={[
                { label: 'Ø8 mm', valueSI: 0.008, title: '8mm Spiral Rebar' },
                { label: 'Ø10 mm', valueSI: 0.010, title: '10mm Spiral Rebar' },
              ]}
            />
            <UnitInput
              label="Helical Spiral Pitch"
              category="length"
              siValue={(bbs.pileSpiralPitchMm ?? 150) * 0.001}
              onChangeSI={(val) => updateBBS({ pileSpiralPitchMm: Math.round(val * 1000) })}
              currentUnitId={getFieldUnit('rebar.pileSpiralPitch', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('rebar.pileSpiralPitch', u)}
              customUnits={customUnits}
              step={25}
              presets={[
                { label: '100 mm (4")', valueSI: 0.100, title: '4" Top Confined Pitch' },
                { label: '150 mm (6")', valueSI: 0.150, title: '6" Standard Pitch' },
              ]}
            />
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export interface RebarBbsMetricsProps {
  result: RebarBBSResult;
  activeWorkspace: CivilWorkspace;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
}

export const RebarBbsMetrics: React.FC<RebarBbsMetricsProps> = ({
  result,
  activeWorkspace,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
  onExportCsv,
  onExportPdf,
}) => {
  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UnitValueDisplay
          label="Total Steel Weight"
          category="mass"
          siValue={result.totalSteelWeightKg}
          currentUnitId={getOutputUnit('rebar.out.mass', 'mass', 'kg')}
          onUnitChange={(u) => updateOutputUnit('rebar.out.mass', u)}
          customUnits={customUnits}
          highlight={true}
        />
        <UnitValueDisplay
          label="Total Bar Length"
          category="length"
          siValue={result.totalBarsLengthM}
          currentUnitId={getOutputUnit('rebar.out.len', 'length', 'm')}
          onUnitChange={(u) => updateOutputUnit('rebar.out.len', u)}
          customUnits={customUnits}
        />
        <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Total Steel Tonnes</div>
          <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
            {result.totalSteelTonnes.toFixed(3)} <span className="text-xs font-normal">MT</span>
          </div>
          <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Density: {result.steelDensityKgPerM3} kg/m³
          </div>
        </div>
        <UnitValueDisplay
          label="Total Bend Deductions"
          category="length"
          siValue={result.items.reduce((s: number, it) => s + (it.bendDeductionM || 0), 0)}
          currentUnitId={getOutputUnit('rebar.out.bend', 'length', 'm')}
          onUnitChange={(u) => updateOutputUnit('rebar.out.bend', u)}
          customUnits={customUnits}
          subText={`Hook: ${activeWorkspace.rebarBbs.hookAngle}° standard`}
        />
      </div>

      {/* Commercial 12m Full Bar Stock & Offcut Scrap Optimizer Table */}
      {result.commercialBarStock && result.commercialBarStock.itemsByDiameter.length > 0 && (
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--md-sys-color-primary)]">
                12m (39.37 ft) Commercial Full Bar Procurement &amp; Offcut Scrap Schedule
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {result.commercialBarStock.lappingStandardUsed}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Total 12m Bars: <strong className="text-[var(--md-sys-color-on-surface)]">{result.commercialBarStock.total12mBarsCount} Nos</strong> | Scrap: <strong className={result.commercialBarStock.overallScrapPercent > 8 ? 'text-amber-600' : 'text-emerald-600'}>{result.commercialBarStock.overallScrapPercent.toFixed(1)}%</strong> ({result.commercialBarStock.totalScrapWeightKg.toFixed(1)} kg)
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--md-sys-color-outline-variant)]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-2.5">Bar Dia</th>
                  <th className="py-2 px-2.5 text-right">Net BBS Length</th>
                  <th className="py-2 px-2.5 text-right">Net Weight</th>
                  <th className="py-2 px-2.5 text-right bg-primary/5 font-bold">12m Bars Reqd</th>
                  <th className="py-2 px-2.5 text-right">Purchased Wt</th>
                  <th className="py-2 px-2.5 text-right">Offcut Scrap</th>
                  <th className="py-2 px-2.5 text-right">Scrap %</th>
                  <th className="py-2 px-2.5 text-right">Est. Bundles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                {result.commercialBarStock.itemsByDiameter.map((row) => (
                  <tr key={row.barDiaMm} className="hover:bg-[var(--md-sys-color-surface-container-highest)]/40 transition-colors">
                    <td className="py-2 px-2.5 font-bold text-[var(--md-sys-color-on-surface)]">
                      Ø{row.barDiaMm} mm
                    </td>
                    <td className="py-2 px-2.5 text-right">{row.totalCuttingLengthM.toFixed(2)} m</td>
                    <td className="py-2 px-2.5 text-right">{row.totalWeightKg.toFixed(1)} kg</td>
                    <td className="py-2 px-2.5 text-right bg-primary/5 font-bold text-[var(--md-sys-color-primary)]">
                      {row.bars12mRequired} Nos ({row.purchasedLengthM.toFixed(0)} m)
                    </td>
                    <td className="py-2 px-2.5 text-right font-semibold">
                      {row.purchasedWeightKg.toFixed(1)} kg <span className="text-[10px] text-muted-foreground">({row.purchasedTonnes.toFixed(3)} MT)</span>
                    </td>
                    <td className="py-2 px-2.5 text-right text-amber-700 dark:text-amber-400">
                      {row.offcutScrapWeightKg.toFixed(1)} kg ({row.offcutScrapLengthM.toFixed(1)} m)
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        row.scrapPercent > 10
                          ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                          : row.scrapPercent > 5
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {row.scrapPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-right text-[var(--md-sys-color-on-surface-variant)]">
                      ~{row.commercialBundlesEstimate} Bdl
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[var(--md-sys-color-surface-container)] font-bold text-[11px]">
                <tr>
                  <td className="py-2 px-2.5">Total Commercial Stock</td>
                  <td className="py-2 px-2.5 text-right">{result.commercialBarStock.totalCuttingLengthM.toFixed(2)} m</td>
                  <td className="py-2 px-2.5 text-right">{result.totalSteelWeightKg.toFixed(1)} kg</td>
                  <td className="py-2 px-2.5 text-right text-[var(--md-sys-color-primary)]">
                    {result.commercialBarStock.total12mBarsCount} Bars ({result.commercialBarStock.totalPurchasedLengthM.toFixed(0)} m)
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    {result.commercialBarStock.totalPurchasedWeightKg.toFixed(1)} kg ({result.commercialBarStock.totalPurchasedTonnes.toFixed(3)} MT)
                  </td>
                  <td className="py-2 px-2.5 text-right text-amber-700 dark:text-amber-400">
                    {result.commercialBarStock.totalScrapWeightKg.toFixed(1)} kg
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <span className="text-amber-600 dark:text-amber-300 font-bold">
                      {result.commercialBarStock.overallScrapPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    ~{Math.ceil(result.commercialBarStock.totalPurchasedTonnes / 2.2)} Bdl
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* One-Click BBS Schedule Export Toolbar */}
      {(onExportCsv || onExportPdf) && (
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-semibold inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 cursor-pointer shadow-2xs transition-colors"
              title="Export Bar Bending Schedule to Microsoft Excel (CSV with UTF-8 BOM)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Export BBS to Excel (CSV)</span>
            </button>
          )}
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="touch-target-48 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-opacity"
              title="Export Certified BBS Submittal PDF Report"
            >
              <FileDown className="w-3.5 h-3.5 shrink-0" />
              <span>Export BBS PDF Report</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
