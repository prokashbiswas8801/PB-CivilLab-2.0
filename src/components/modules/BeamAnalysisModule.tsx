import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
  SupportCondition,
} from '../../types/civil';
import { BeamAnalysisResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';

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
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
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
        />
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
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
        />
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
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-semibold mb-1">Moment of Inertia I (cm⁴)</label>
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
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          />
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
        />
      </div>
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
