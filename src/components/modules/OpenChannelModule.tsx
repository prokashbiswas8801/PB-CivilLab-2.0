import {
  CivilWorkspace,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { ChannelHydraulicsResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';

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
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <UnitInput
          label="Bottom Width b"
          category="length"
          siValue={activeWorkspace.channel.bottomWidthM}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              channel: { ...ws.channel, bottomWidthM: val },
            }));
          }}
          currentUnitId={getFieldUnit('hyd.b', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('hyd.b', u)}
          customUnits={customUnits}
          step={0.2}
        />
        <UnitInput
          label="Flow Depth y"
          category="length"
          siValue={activeWorkspace.channel.flowDepthM}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              channel: { ...ws.channel, flowDepthM: val },
            }));
          }}
          currentUnitId={getFieldUnit('hyd.y', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('hyd.y', u)}
          customUnits={customUnits}
          step={0.1}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <UnitInput
          label="Bed Slope S₀"
          category="slope"
          siValue={activeWorkspace.channel.bedSlope}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              channel: { ...ws.channel, bedSlope: val },
            }));
          }}
          currentUnitId={getFieldUnit('hyd.slope', 'slope', 'ratio')}
          onUnitChange={(u) => updateFieldUnit('hyd.slope', u)}
          customUnits={customUnits}
          step={0.0005}
        />
        <div>
          <label className="block text-xs font-semibold mb-1">Side Slope z (z:1 H:V)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={activeWorkspace.channel.sideSlopeZ}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                channel: { ...ws.channel, sideSlopeZ: val },
              }));
            }}
            placeholder="0 for rectangular, 1.5 for earth"
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Manning's n</label>
          <input
            type="number"
            step="0.001"
            min="0.008"
            max="0.15"
            value={activeWorkspace.channel.manningN}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                channel: { ...ws.channel, manningN: val },
              }));
            }}
            placeholder="0.015 concrete"
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          />
        </div>
        <UnitInput
          label="Freeboard"
          category="length"
          siValue={activeWorkspace.channel.freeboardRequirementM || 0.3}
          onChangeSI={(val) => {
            updateActiveWorkspace((ws) => ({
              ...ws,
              channel: { ...ws.channel, freeboardRequirementM: val },
            }));
          }}
          currentUnitId={getFieldUnit('hyd.freeboard', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('hyd.freeboard', u)}
          customUnits={customUnits}
          step={0.05}
        />
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
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
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
        label="Wetted Flow Area"
        category="area"
        siValue={result.flowAreaM2}
        currentUnitId={getOutputUnit('hyd.out.A', 'area', 'm2')}
        onUnitChange={(u) => updateOutputUnit('hyd.out.A', u)}
        customUnits={customUnits}
      />
      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Froude Number (Fr)</div>
        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
          Fr = {result.froudeNumber.toFixed(3)}
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 capitalize">
          Regime: {result.flowRegime}
        </div>
      </div>
    </div>
  );
};
