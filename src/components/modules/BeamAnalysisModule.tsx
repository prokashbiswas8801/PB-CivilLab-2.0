import React, { useState } from 'react';
import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
  SupportCondition,
} from '../../types/civil';
import { BeamAnalysisResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';
import { HelpCircle } from 'lucide-react';

export interface BeamAnalysisInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

export const BeamAnalysisInputs: React.FC<BeamAnalysisInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'geometry' | 'loads' | 'section'>('all');

  const applyBeamPreset = (span: number, w: number, P: number, Ppos: number, cond: SupportCondition) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      beam: {
        ...ws.beam,
        spanLengthM: span,
        uniformLoadKnPerM: w,
        pointLoadKn: P,
        pointLoadPositionM: Ppos,
        supportCondition: cond,
      },
    }));
  };

  return (
    <div className="space-y-3.5">
      {/* Progressive Disclosure Ergonomic Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--md-sys-color-surface-container)] rounded-xl overflow-x-auto text-xs font-medium">
        {[
          { id: 'all', label: 'All Inputs' },
          { id: 'geometry', label: 'Geometry' },
          { id: 'loads', label: 'Loads (UDL / Point)' },
          { id: 'section', label: 'Section & E' },
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

      {/* Quick Setup Presets Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] shrink-0 mr-1">
          Quick Setup:
        </span>
        <button
          type="button"
          onClick={() => applyBeamPreset(5.0, 25, 40, 2.5, 'simply-supported')}
          className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors shrink-0 cursor-pointer"
        >
          Floor Beam (5m)
        </button>
        <button
          type="button"
          onClick={() => applyBeamPreset(6.5, 35, 60, 3.25, 'simply-supported')}
          className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors shrink-0 cursor-pointer"
        >
          Main Girder (6.5m)
        </button>
        <button
          type="button"
          onClick={() => applyBeamPreset(2.2, 12, 15, 2.2, 'cantilever')}
          className="min-h-[32px] px-2.5 py-1 text-[11px] font-mono rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors shrink-0 cursor-pointer"
        >
          Balcony Cantilever (2.2m)
        </button>
      </div>

      {/* Tab Group 1: Geometry & Supports */}
      {(activeTab === 'all' || activeTab === 'geometry') && (
        <div className="space-y-2.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]/50 border border-[var(--md-sys-color-outline-variant)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)] tracking-wider">
            Span & Support Geometry
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold mb-1">Support Condition</label>
              <select
                value={activeWorkspace.beam.supportCondition}
                onChange={(e) => {
                  const cond = e.target.value as SupportCondition;
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    beam: { ...ws.beam, supportCondition: cond },
                  }));
                }}
                className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
              >
                <option value="simply-supported">Simply Supported (Pin / Roller)</option>
                <option value="cantilever">Cantilever (Fixed / Free)</option>
                <option value="fixed-ends">Fixed - Fixed (Continuous span)</option>
              </select>
            </div>
            <UnitInput
              label="Span Length L"
              category="length"
              siValue={activeWorkspace.beam.spanLengthM}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  beam: { ...ws.beam, spanLengthM: val },
                }));
              }}
              currentUnitId={getFieldUnit('beam.spanLength', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('beam.spanLength', u)}
              customUnits={customUnits}
              step={0.5}
              presets={[
                { label: '3.0 m', valueSI: 3.0, title: 'Secondary / Corridor' },
                { label: '5.0 m', valueSI: 5.0, title: 'Standard Floor Span' },
                { label: '6.5 m', valueSI: 6.5, title: 'Commercial Grid Span' },
                { label: '8.0 m', valueSI: 8.0, title: 'Long Span Transfer Girder' },
              ]}
              validationRule={{
                minSI: 0.5,
                maxSI: 35,
                warningBelowSI: 1.0,
                warningAboveSI: 15.0,
                warningHint: 'Spans exceeding 15m usually require post-tensioned tendons or truss framing under AISC 360 / BNBC.',
              }}
              standardRef="BNBC 2020 Part 6 / AISC 360-16 / ACI 318-19 Table 9.3.1.1"
              recommendedRange="3.0 m – 9.0 m for building frames"
              designTip="Effective span is taken as the clear distance between supports plus depth d, or center-to-center of bearings."
            />
          </div>
        </div>
      )}

      {/* Tab Group 2: Applied Loads */}
      {(activeTab === 'all' || activeTab === 'loads') && (
        <div className="space-y-2.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]/50 border border-[var(--md-sys-color-outline-variant)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-tertiary)] tracking-wider">
            Applied Loading Actions
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <UnitInput
              label="Uniform Load w"
              category="distributed_load"
              siValue={activeWorkspace.beam.uniformLoadKnPerM * 1000}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  beam: { ...ws.beam, uniformLoadKnPerM: val / 1000 },
                }));
              }}
              currentUnitId={getFieldUnit('beam.udl', 'distributed_load', 'kN/m')}
              onUnitChange={(u) => updateFieldUnit('beam.udl', u)}
              customUnits={customUnits}
              step={1}
              presets={[
                { label: '15 kN/m', valueSI: 15000, title: 'Light Partition & Self-Weight' },
                { label: '25 kN/m', valueSI: 25000, title: 'Standard Residential Floor' },
                { label: '40 kN/m', valueSI: 40000, title: 'Heavy Commercial / Storage Floor' },
              ]}
              validationRule={{
                minSI: 0,
                maxSI: 250000,
                warningAboveSI: 80000,
                warningHint: 'UDL exceeding 80 kN/m indicates heavy industrial or transfer floor loading.',
              }}
              standardRef="BNBC 2020 Chapter 2 / ASCE 7-16"
              recommendedRange="10 – 50 kN/m (typical building framing)"
              designTip="Uniform load represents dead load self-weight plus superimposed dead load (finishes, partitions) and live load."
            />
            <UnitInput
              label="Point Load P"
              category="force"
              siValue={activeWorkspace.beam.pointLoadKn * 1000}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  beam: { ...ws.beam, pointLoadKn: val / 1000 },
                }));
              }}
              currentUnitId={getFieldUnit('beam.pointLoad', 'force', 'kN')}
              onUnitChange={(u) => updateFieldUnit('beam.pointLoad', u)}
              customUnits={customUnits}
              step={5}
              presets={[
                { label: '0 kN', valueSI: 0, title: 'Pure UDL - No Concentrated Load' },
                { label: '25 kN', valueSI: 25000, title: 'Secondary Beam Reaction' },
                { label: '60 kN', valueSI: 60000, title: 'Intermediate Post / Rooftop Unit' },
                { label: '120 kN', valueSI: 120000, title: 'Column Transfer Reaction' },
              ]}
              standardRef="BNBC 2020 Part 6 / ASCE 7-16"
              recommendedRange="0 – 200 kN"
              designTip="Set to 0 if the member carries distributed floor loads only."
            />
            <UnitInput
              label="Load Position a"
              category="length"
              siValue={activeWorkspace.beam.pointLoadPositionM}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  beam: { ...ws.beam, pointLoadPositionM: val },
                }));
              }}
              currentUnitId={getFieldUnit('beam.loadPos', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('beam.loadPos', u)}
              customUnits={customUnits}
              step={0.25}
              presets={[
                { label: 'L / 4', valueSI: activeWorkspace.beam.spanLengthM * 0.25, title: 'Quarter-span' },
                { label: 'L / 2 (Mid)', valueSI: activeWorkspace.beam.spanLengthM * 0.5, title: 'Mid-span Maximum Moment' },
                { label: '3L / 4', valueSI: activeWorkspace.beam.spanLengthM * 0.75, title: 'Three-quarter span' },
              ]}
              validationRule={{
                minSI: 0,
                maxSI: activeWorkspace.beam.spanLengthM,
                warningAboveSI: activeWorkspace.beam.spanLengthM,
                warningHint: `Point load position (${activeWorkspace.beam.pointLoadPositionM}m) cannot exceed beam span length (${activeWorkspace.beam.spanLengthM}m).`,
              }}
              standardRef="BNBC 2020 / AISC 360"
              recommendedRange={`0.0 m – ${activeWorkspace.beam.spanLengthM} m`}
              designTip="Mid-span (L/2) produces the maximum flexural bending moment for a simply supported beam."
            />
          </div>
        </div>
      )}

      {/* Tab Group 3: Cross Section & Material Properties */}
      {(activeTab === 'all' || activeTab === 'section') && (
        <div className="space-y-2.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]/50 border border-[var(--md-sys-color-outline-variant)]">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-secondary)] tracking-wider">
            Section Properties & Material Limits
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <UnitInput
              label="Section Depth d"
              category="length"
              siValue={activeWorkspace.beam.sectionDepthMm * 0.001}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  beam: { ...ws.beam, sectionDepthMm: val * 1000 },
                }));
              }}
              currentUnitId={getFieldUnit('beam.depth', 'length', 'mm')}
              onUnitChange={(u) => updateFieldUnit('beam.depth', u)}
              customUnits={customUnits}
              step={25}
              presets={[
                { label: '300 mm', valueSI: 0.3, title: 'Light 12" Beam' },
                { label: '450 mm', valueSI: 0.45, title: 'Standard 18" Beam' },
                { label: '600 mm', valueSI: 0.6, title: 'Deep 24" Girder' },
                { label: '750 mm', valueSI: 0.75, title: 'Heavy 30" Transfer Girder' },
              ]}
              validationRule={{
                minSI: 0.1,
                maxSI: 2.5,
                warningBelowSI: activeWorkspace.beam.spanLengthM / 25,
                warningHint: `Deflection warning: Section depth (${activeWorkspace.beam.sectionDepthMm} mm) is shallower than L/25 (${Math.round((activeWorkspace.beam.spanLengthM / 25) * 1000)} mm). ACI 318 recommends minimum depth d ≥ L/16 (${Math.round((activeWorkspace.beam.spanLengthM / 16) * 1000)} mm) to satisfy serviceability deflection limits without specialized calculations.`,
              }}
              standardRef="ACI 318-19 Table 9.3.1.1 / BNBC 2020"
              recommendedRange="L/16 (simply supported) to L/21 (both ends continuous)"
              designTip="Sizing depth d to at least L/16 controls deflection and eliminates vibration under normal floor occupancy."
            />
            <UnitInput
              label="Elastic Modulus E"
              category="pressure"
              siValue={activeWorkspace.beam.elasticModulusGpa * 1e9}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  beam: { ...ws.beam, elasticModulusGpa: val / 1e9 },
                }));
              }}
              currentUnitId={getFieldUnit('beam.E', 'pressure', 'GPa')}
              onUnitChange={(u) => updateFieldUnit('beam.E', u)}
              customUnits={customUnits}
              step={5}
              presets={[
                { label: '200 GPa', valueSI: 200e9, title: 'Structural Steel (ASTM A36 / Gr 50)' },
                { label: '25 GPa', valueSI: 25e9, title: 'C25 RCC Concrete (Ec = 4700 √fc)' },
                { label: '30 GPa', valueSI: 30e9, title: 'C35 RCC Concrete' },
                { label: '12 GPa', valueSI: 12e9, title: 'Structural Timber / Glulam' },
              ]}
              standardRef="ASTM A36 / ACI 318-19 Sec 19.2.2"
              recommendedRange="200 GPa (Steel) / 20–35 GPa (Concrete)"
              designTip="Steel modulus is constant at 200 GPa (29,000 ksi). For concrete, Ec = 4700 √f'c (MPa) under ACI 318."
            />
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <label className="block text-xs font-semibold">Moment of Inertia I</label>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[var(--md-sys-color-primary)] px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] cursor-help"
                  title="Conversion Factor relative to Base SI (m⁴):&#10;• 1 cm⁴ = 10⁻⁸ m⁴ (0.00000001 m⁴)&#10;• 1 m⁴ = 10⁸ cm⁴ (100,000,000 cm⁴)&#10;• 1 in⁴ ≈ 41.6231 cm⁴ (4.16231 × 10⁻⁷ m⁴)"
                >
                  <span>cm⁴ (10⁻⁸ m⁴)</span>
                  <HelpCircle className="w-3 h-3 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
                </span>
              </div>
              <input
                type="number"
                step="100"
                min="1"
                value={activeWorkspace.beam.momentOfInertiaCm4}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    beam: { ...ws.beam, momentOfInertiaCm4: val },
                  }));
                }}
                className="w-full min-h-[48px] touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                title="Moment of inertia in cm⁴ (1 cm⁴ = 10⁻⁸ m⁴ in base SI units)"
              />
              <div className="flex items-center gap-1 mt-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    // Rectangular b * d^3 / 12 for 300x500 = 30 * 50^3 / 12 = 312,500 cm4
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      beam: { ...ws.beam, momentOfInertiaCm4: 312500 },
                    }));
                  }}
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                  title="300x500 mm Rectangular RCC Section"
                >
                  300×500 mm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // W18x50 steel section Ix ≈ 800 in4 ≈ 33,300 cm4
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      beam: { ...ws.beam, momentOfInertiaCm4: 33300 },
                    }));
                  }}
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                  title="AISC W18×50 I-Beam Section"
                >
                  W18×50
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // W24x68 steel section Ix ≈ 1830 in4 ≈ 76,200 cm4
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      beam: { ...ws.beam, momentOfInertiaCm4: 76200 },
                    }));
                  }}
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                  title="AISC W24×68 I-Beam Section"
                >
                  W24×68
                </button>
              </div>
            </div>
            <UnitInput
              label="Allowable Stress"
              category="pressure"
              siValue={activeWorkspace.beam.allowableStressMpa * 1e6}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  beam: { ...ws.beam, allowableStressMpa: val / 1e6 },
                }));
              }}
              currentUnitId={getFieldUnit('beam.stress', 'pressure', 'MPa')}
              onUnitChange={(u) => updateFieldUnit('beam.stress', u)}
              customUnits={customUnits}
              step={5}
              presets={[
                { label: '165 MPa', valueSI: 165e6, title: 'ASTM A36 (0.66 Fy = 165 MPa)' },
                { label: '230 MPa', valueSI: 230e6, title: 'Grade 50 / 345 MPa (0.66 Fy = 230 MPa)' },
                { label: '250 MPa', valueSI: 250e6, title: 'Eurocode S355 / Grade 400W' },
                { label: '14 MPa', valueSI: 14e6, title: 'Concrete Permissible Flexural Stress WSD (0.45 fc)' },
              ]}
              validationRule={{
                minSI: 1e6,
                maxSI: 600e6,
                warningAboveSI: 350e6,
                warningHint: 'Allowable bending stress Fb exceeding 350 MPa exceeds standard structural steel working stress limits under AISC 360 ASD.',
              }}
              standardRef="AISC 360-16 ASD Table B4.1 / BNBC 2020 Part 6"
              recommendedRange="140 – 250 MPa (Structural Steel ASD)"
              designTip="For ASD, allowable bending stress Fb = 0.60 to 0.66 Fy for compact laterally braced sections."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export interface BeamAnalysisMetricsProps {
  result: BeamAnalysisResult;
  activeWorkspace: CivilWorkspace;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
}

export const BeamAnalysisMetrics: React.FC<BeamAnalysisMetricsProps> = ({
  result,
  activeWorkspace,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <UnitValueDisplay
        label="Max Moment (Mmax)"
        category="moment"
        siValue={result.maxMomentKnm * 1000}
        currentUnitId={getOutputUnit('beam.out.moment', 'moment', 'kN.m')}
        onUnitChange={(u) => updateOutputUnit('beam.out.moment', u)}
        customUnits={customUnits}
        highlight={true}
      />
      <UnitValueDisplay
        label="Max Shear (Vmax)"
        category="force"
        siValue={result.maxShearKn * 1000}
        currentUnitId={getOutputUnit('beam.out.shear', 'force', 'kN')}
        onUnitChange={(u) => updateOutputUnit('beam.out.shear', u)}
        customUnits={customUnits}
      />
      <UnitValueDisplay
        label="Max Deflection"
        category="length"
        siValue={result.maxDeflectionMm * 0.001}
        currentUnitId={getOutputUnit('beam.out.defl', 'length', 'mm')}
        onUnitChange={(u) => updateOutputUnit('beam.out.defl', u)}
        customUnits={customUnits}
        subText={`Allowable limit: ${result.allowableDeflectionMm.toFixed(2)} mm`}
      />
      <UnitValueDisplay
        label="Max Flexural Stress"
        category="pressure"
        siValue={result.bendingStressMpa * 1000000}
        currentUnitId={getOutputUnit('beam.out.stress', 'pressure', 'MPa')}
        onUnitChange={(u) => updateOutputUnit('beam.out.stress', u)}
        customUnits={customUnits}
        subText={`Allowable: ${activeWorkspace.beam.allowableStressMpa} MPa`}
      />
    </div>
  );
};
