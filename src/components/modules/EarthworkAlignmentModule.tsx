import React from 'react';
import { Plus, Trash2, Route } from 'lucide-react';
import {
  CivilWorkspace,
  CustomUnitDefinition,
  EarthworkChainageStation,
  UnitCategoryKey,
} from '../../types/civil';
import { EarthworkResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import { UnitValueDisplay } from '../UnitValueDisplay';

export interface EarthworkAlignmentInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
}

const DEFAULT_MULTI_STATION_PROFILE: EarthworkChainageStation[] = [
  { id: 'ch-000', chainageM: 0, cutDepthM: 0, fillHeightM: 1.2, groundCrossSlopePct: 0 },
  { id: 'ch-100', chainageM: 100, cutDepthM: 0, fillHeightM: 1.85, groundCrossSlopePct: 2 },
  { id: 'ch-200', chainageM: 200, cutDepthM: 0.4, fillHeightM: 0.9, groundCrossSlopePct: 3 },
  { id: 'ch-300', chainageM: 300, cutDepthM: 1.4, fillHeightM: 0, groundCrossSlopePct: 2 },
  { id: 'ch-400', chainageM: 400, cutDepthM: 0.9, fillHeightM: 0, groundCrossSlopePct: 0 },
  { id: 'ch-500', chainageM: 500, cutDepthM: 0, fillHeightM: 1.1, groundCrossSlopePct: 0 },
];

export const EarthworkAlignmentInputs: React.FC<EarthworkAlignmentInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
}) => {
  const ew = activeWorkspace.earthwork;
  const stations = Array.isArray(ew.chainageStations) ? ew.chainageStations : [];
  const multiStationActive = ew.calculationType === 'prismoidal-road' && stations.length >= 2;

  const updateStation = (id: string, patch: Partial<EarthworkChainageStation>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      earthwork: {
        ...ws.earthwork,
        chainageStations: (ws.earthwork.chainageStations || []).map((st) =>
          st.id === id ? { ...st, ...patch } : st
        ),
      },
    }));
  };

  const addStation = () => {
    const lastCh = stations.length > 0 ? stations[stations.length - 1].chainageM : -100;
    const nextCh = lastCh + 100;
    updateActiveWorkspace((ws) => ({
      ...ws,
      earthwork: {
        ...ws.earthwork,
        chainageStations: [
          ...(ws.earthwork.chainageStations || []),
          {
            id: `ch-${Date.now().toString().slice(-5)}-${stations.length}`,
            chainageM: nextCh,
            cutDepthM: 0,
            fillHeightM: 1.0,
            groundCrossSlopePct: 0,
          },
        ],
      },
    }));
  };

  const removeStation = (id: string) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      earthwork: {
        ...ws.earthwork,
        chainageStations: (ws.earthwork.chainageStations || []).filter((st) => st.id !== id),
      },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5">Calculation Type</label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[var(--md-sys-color-surface-container)]">
            {(
              [
                { id: 'pit-excavation', label: 'Sloped Pit' },
                { id: 'trapezoidal-trench', label: 'Trench' },
                { id: 'prismoidal-road', label: 'Road Align' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    earthwork: { ...ws.earthwork, calculationType: t.id },
                  }))
                }
                className={`touch-target-48 px-1 rounded-md text-xs font-semibold cursor-pointer ${
                  ew.calculationType === t.id
                    ? 'bg-[var(--md-sys-color-surface)] font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">Soil Classification (Swell / Shrinkage)</label>
          <select
            value={ew.soilType}
            onChange={(e) =>
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: {
                  ...ws.earthwork,
                  soilType: e.target.value as CivilWorkspace['earthwork']['soilType'],
                },
              }))
            }
            className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-xs font-semibold text-[var(--md-sys-color-on-surface)]"
          >
            <option value="sand-gravel">Sand / Gravel (+15% Swell · 88% Compact)</option>
            <option value="common-earth">Common Earth (+25% Swell · 80% Compact)</option>
            <option value="dense-clay">Dense Clay (+40% Swell · 75% Compact)</option>
            <option value="blasted-rock">Blasted Rock (+60% Swell · 125% Compact)</option>
          </select>
        </div>
      </div>

      {ew.calculationType === 'pit-excavation' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <UnitInput
            label="Pit Top Length"
            category="length"
            siValue={ew.pitTopLengthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, pitTopLengthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.pitL', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.pitL', u)}
            customUnits={customUnits}
            step={0.5}
            presets={[
              { label: '3.0 m', valueSI: 3.0, title: 'Single Footing Pit' },
              { label: '6.0 m', valueSI: 6.0, title: 'Combined Pit' },
              { label: '12.0 m', valueSI: 12.0, title: 'Raft Foundation Excavation' },
            ]}
            standardRef="BNBC 2020 Part 7 / OSHA 1926 Subpart P"
            recommendedRange="2.0 m – 30.0 m"
            designTip="Include working clearance (min 0.6m each side) outside formwork line."
          />
          <UnitInput
            label="Pit Top Width"
            category="length"
            siValue={ew.pitTopWidthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, pitTopWidthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.pitW', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.pitW', u)}
            customUnits={customUnits}
            step={0.5}
            presets={[
              { label: '3.0 m', valueSI: 3.0, title: 'Single Footing Pit' },
              { label: '6.0 m', valueSI: 6.0, title: 'Combined Pit' },
              { label: '10.0 m', valueSI: 10.0, title: 'Basement Pit' },
            ]}
          />
          <UnitInput
            label="Excavation Depth"
            category="length"
            siValue={ew.pitDepthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, pitDepthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.pitD', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.pitD', u)}
            customUnits={customUnits}
            step={0.2}
            presets={[
              { label: '1.5 m (5 ft)', valueSI: 1.5, title: 'OSHA max un-shored vertical trench depth' },
              { label: '2.5 m (8 ft)', valueSI: 2.5, title: 'Standard Basement Depth' },
              { label: '4.0 m (13 ft)', valueSI: 4.0, title: 'Deep Basement / Underground Tank' },
            ]}
            validationRule={{
              minSI: 0.2,
              maxSI: 25.0,
              warningAboveSI: 1.5,
              warningHint: 'Safety Warning: Excavations deeper than 1.5m (5 ft) require shoring, sheet piling, or safe slope angle under OSHA & BNBC 2020 Part 7.',
            }}
            standardRef="OSHA 1926.652 / BNBC 2020 Part 7"
            recommendedRange="1.0 m – 5.0 m"
            designTip="For depths > 1.5m without shoring, side slopes must be battered (e.g. 1:1 for Type B soils)."
          />
          <div>
            <label className="block text-xs font-semibold mb-1.5">Side Batter (H : 1V)</label>
            <input
              type="number"
              step={0.25}
              min={0}
              max={3}
              value={ew.pitSideSlopeH}
              onChange={(e) =>
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  earthwork: { ...ws.earthwork, pitSideSlopeH: Math.max(0, Number(e.target.value) || 0) },
                }))
              }
              className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-sm font-semibold text-[var(--md-sys-color-on-surface)]"
            />
          </div>
        </div>
      )}

      {ew.calculationType === 'trapezoidal-trench' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <UnitInput
            label="Trench Length"
            category="length"
            siValue={ew.trenchLengthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, trenchLengthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.trenchL', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.trenchL', u)}
            customUnits={customUnits}
            step={5}
            presets={[
              { label: '25 m', valueSI: 25, title: 'Short Pipe Laying' },
              { label: '50 m', valueSI: 50, title: 'Standard Sewer Run' },
              { label: '150 m', valueSI: 150, title: 'Street Utility Trench' },
            ]}
          />
          <UnitInput
            label="Bottom Width"
            category="length"
            siValue={ew.trenchBottomWidthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, trenchBottomWidthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.trenchW', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.trenchW', u)}
            customUnits={customUnits}
            step={0.25}
            presets={[
              { label: '0.8 m (32")', valueSI: 0.8, title: 'Small Water / Gas Pipe Trench' },
              { label: '1.2 m (4 ft)', valueSI: 1.2, title: 'Medium Sewer / Storm Drain' },
              { label: '2.0 m (6.5 ft)', valueSI: 2.0, title: 'Large Culvert / Foundation Trench' },
            ]}
            standardRef="BNBC 2020 Part 7"
            recommendedRange="0.6 m – 3.0 m"
          />
          <UnitInput
            label="Trench Depth"
            category="length"
            siValue={ew.trenchDepthM}
            onChangeSI={(val) => {
              updateActiveWorkspace((ws) => ({
                ...ws,
                earthwork: { ...ws.earthwork, trenchDepthM: val },
              }));
            }}
            currentUnitId={getFieldUnit('earth.trenchD', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('earth.trenchD', u)}
            customUnits={customUnits}
            step={0.2}
            presets={[
              { label: '1.2 m (4 ft)', valueSI: 1.2, title: 'Frost Safe Utility Depth' },
              { label: '1.8 m (6 ft)', valueSI: 1.8, title: 'Standard Gravity Sewer Depth' },
              { label: '3.0 m (10 ft)', valueSI: 3.0, title: 'Deep Trunk Sewer' },
            ]}
            validationRule={{
              minSI: 0.2,
              maxSI: 15.0,
              warningAboveSI: 1.5,
              warningHint: 'Trench safety alert: Depths > 1.5m mandate trench boxes, hydraulic shoring, or stepped benching.',
            }}
          />
          <div>
            <label className="block text-xs font-semibold mb-1.5">Side Slope (s : 1)</label>
            <input
              type="number"
              step={0.25}
              min={0}
              max={3}
              value={ew.trenchSideSlopeH}
              onChange={(e) =>
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  earthwork: { ...ws.earthwork, trenchSideSlopeH: Math.max(0, Number(e.target.value) || 0) },
                }))
              }
              className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-sm font-semibold text-[var(--md-sys-color-on-surface)]"
            />
          </div>
        </div>
      )}

      {ew.calculationType === 'prismoidal-road' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <UnitInput
              label="Formation Width (b)"
              category="length"
              siValue={ew.formationWidthM}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  earthwork: { ...ws.earthwork, formationWidthM: val },
                }));
              }}
              currentUnitId={getFieldUnit('earth.roadW', 'length', 'm')}
              onUnitChange={(u) => updateFieldUnit('earth.roadW', u)}
              customUnits={customUnits}
              step={0.5}
              presets={[
                { label: '5.5 m', valueSI: 5.5, title: 'Single Lane + Earthen Shoulders' },
                { label: '6.5 m', valueSI: 6.5, title: 'LGED Rural Paved Road Formation' },
                { label: '7.3 m', valueSI: 7.3, title: 'Standard Two-Lane Carriageway' },
                { label: '10.3 m', valueSI: 10.3, title: 'Two-Lane Highway with Paved Shoulders' },
              ]}
              standardRef="AASHTO / RHD / LGED Standard Geometric Design"
              recommendedRange="5.5 m – 24.0 m"
              designTip="Formation width is total embankment width at finished road formation level, including shoulders."
            />

            <div>
              <label className="block text-xs font-semibold mb-1.5">Side Slope (s : 1 H:V)</label>
              <input
                type="number"
                step={0.25}
                min={0}
                max={4}
                value={ew.sideSlopeS}
                onChange={(e) =>
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    earthwork: { ...ws.earthwork, sideSlopeS: Math.max(0, Number(e.target.value) || 0) },
                  }))
                }
                className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-sm font-semibold text-[var(--md-sys-color-on-surface)]"
              />
              <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
                Typical: 1.5:1 (Embankment) · 1.0:1 (Cut)
              </div>
            </div>

            {!multiStationActive ? (
              <UnitInput
                label="Road Align Length"
                category="length"
                siValue={ew.roadLengthM}
                onChangeSI={(val) => {
                  updateActiveWorkspace((ws) => ({
                    ...ws,
                    earthwork: { ...ws.earthwork, roadLengthM: val },
                  }));
                }}
                currentUnitId={getFieldUnit('earth.roadL', 'length', 'm')}
                onUnitChange={(u) => updateFieldUnit('earth.roadL', u)}
                customUnits={customUnits}
                step={25}
                presets={[
                  { label: '100 m', valueSI: 100, title: 'Standard Alignment Segment' },
                  { label: '250 m', valueSI: 250, title: 'Feeder Road Block' },
                  { label: '500 m', valueSI: 500, title: 'Half-Kilometer Section' },
                ]}
                standardRef="AASHTO Green Book / RHD Bangladesh"
              />
            ) : (
              <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-primary-container)]/20 flex flex-col justify-center">
                <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-primary)]">
                  Multi-Station Active
                </div>
                <div className="text-sm font-mono font-bold tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
                  {stations.length} Stations · {Math.max(0, Math.max(...stations.map((s) => s.chainageM)) - Math.min(...stations.map((s) => s.chainageM))).toFixed(0)} m
                </div>
              </div>
            )}
          </div>

          {!multiStationActive && (
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Station 1 Depth d₁ (m)</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={ew.depthStation1M}
                  onChange={(e) =>
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      earthwork: { ...ws.earthwork, depthStation1M: Math.max(0, Number(e.target.value) || 0) },
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Mid-Station Depth d_m (m)</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={ew.depthStation2M}
                  onChange={(e) =>
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      earthwork: { ...ws.earthwork, depthStation2M: Math.max(0, Number(e.target.value) || 0) },
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Station 3 Depth d₃ (m)</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={ew.depthStation3M}
                  onChange={(e) =>
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      earthwork: { ...ws.earthwork, depthStation3M: Math.max(0, Number(e.target.value) || 0) },
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] font-mono tabular-nums text-xs font-semibold"
                />
              </div>
            </div>
          )}

          {/* Multi-Station Chainage & Cut/Fill Alignment Table */}
          <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <div>
                  <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                    Multi-Station Chainage &amp; Cut/Fill Profile
                  </div>
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                    Add 2+ stations for longitudinal Prismoidal Cut/Fill &amp; Mass-Haul Balance.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {stations.length < 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveWorkspace((ws) => ({
                        ...ws,
                        earthwork: {
                          ...ws.earthwork,
                          formationWidthM: ws.earthwork.formationWidthM > 0 ? ws.earthwork.formationWidthM : 6.5,
                          sideSlopeS: ws.earthwork.sideSlopeS > 0 ? ws.earthwork.sideSlopeS : 1.5,
                          chainageStations: DEFAULT_MULTI_STATION_PROFILE.map((st) => ({ ...st })),
                        },
                      }))
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-primary-container)]/40 text-[var(--md-sys-color-primary)] text-[11px] font-semibold hover:opacity-90 cursor-pointer"
                  >
                    Load 6-Station Profile
                  </button>
                )}
                {stations.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveWorkspace((ws) => ({
                        ...ws,
                        earthwork: { ...ws.earthwork, chainageStations: [] },
                      }))
                    }
                    className="px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                  >
                    3-Station Mode
                  </button>
                )}
                <button
                  type="button"
                  onClick={addStation}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:opacity-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Station</span>
                </button>
              </div>
            </div>

            {stations.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--md-sys-color-surface-container)] text-[10px] font-mono uppercase text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
                      <th className="py-1.5 px-2">Chainage (m)</th>
                      <th className="py-1.5 px-2">Cut Depth (m)</th>
                      <th className="py-1.5 px-2">Fill Height (m)</th>
                      <th className="py-1.5 px-2">Cross Slope (%)</th>
                      <th className="py-1.5 px-2 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] font-mono tabular-nums">
                    {stations.map((st) => (
                      <tr key={st.id}>
                        <td className="p-1.5">
                          <input
                            type="number"
                            step={25}
                            min={0}
                            value={st.chainageM}
                            onChange={(e) =>
                              updateStation(st.id, { chainageM: Math.max(0, Number(e.target.value) || 0) })
                            }
                            className="w-20 px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-semibold"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            step={0.1}
                            min={0}
                            value={st.cutDepthM}
                            onChange={(e) =>
                              updateStation(st.id, { cutDepthM: Math.max(0, Number(e.target.value) || 0) })
                            }
                            className="w-20 px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-semibold"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            step={0.1}
                            min={0}
                            value={st.fillHeightM}
                            onChange={(e) =>
                              updateStation(st.id, { fillHeightM: Math.max(0, Number(e.target.value) || 0) })
                            }
                            className="w-20 px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-semibold"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            step={0.5}
                            min={-25}
                            max={25}
                            value={st.groundCrossSlopePct ?? 0}
                            onChange={(e) =>
                              updateStation(st.id, { groundCrossSlopePct: Number(e.target.value) || 0 })
                            }
                            className="w-20 px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-semibold"
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeStation(st.id)}
                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                            title="Remove chainage station"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface EarthworkAlignmentMetricsProps {
  result: EarthworkResult;
  customUnits: CustomUnitDefinition[];
  getOutputUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateOutputUnit: (fieldKey: string, unitId: string) => void;
}

export const EarthworkAlignmentMetrics: React.FC<EarthworkAlignmentMetricsProps> = ({
  result,
  customUnits,
  getOutputUnit,
  updateOutputUnit,
}) => {
  const netBalance = result.netMassHaulBalanceM3 ?? 0;
  const isSurplus = netBalance >= 0;

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UnitValueDisplay
          label="In-Situ Cut/Borrow Bank"
          category="volume"
          siValue={result.bankVolumeM3}
          currentUnitId={getOutputUnit('earth.out.insitu', 'volume', 'm3')}
          onUnitChange={(u) => updateOutputUnit('earth.out.insitu', u)}
          customUnits={customUnits}
          highlight={true}
        />
        <UnitValueDisplay
          label="Bulked Haul Volume"
          category="volume"
          siValue={result.looseVolumeM3}
          currentUnitId={getOutputUnit('earth.out.swelled', 'volume', 'm3')}
          onUnitChange={(u) => updateOutputUnit('earth.out.swelled', u)}
          customUnits={customUnits}
        />
        <UnitValueDisplay
          label="Compacted Embankment"
          category="volume"
          siValue={result.compactedVolumeM3}
          currentUnitId={getOutputUnit('earth.out.compacted', 'volume', 'm3')}
          onUnitChange={(u) => updateOutputUnit('earth.out.compacted', u)}
          customUnits={customUnits}
        />
        <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Dump Truck Trips</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
            {result.haulTruckTripsCount10M3} <span className="text-xs font-normal">loads</span>
          </div>
          <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Basis: {result.haulTruckCapacityM3 || 10} m³ tipper truck
          </div>
        </div>
      </div>

      {result.multiStationActive && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]">
            <div className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">Cumulative Cut (Bank)</div>
            <div className="text-base font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
              {(result.totalCutBankM3 || 0).toFixed(1)} m³
            </div>
            <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Prismoidal excavation
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]">
            <div className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">Cumulative Fill (Comp.)</div>
            <div className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
              {(result.totalFillCompactedM3 || 0).toFixed(1)} m³
            </div>
            <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Bank eq: {(result.totalFillBankRequiredM3 || 0).toFixed(1)} m³
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]">
            <div className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">Net Mass-Haul Balance</div>
            <div className={`text-base font-bold font-mono tabular-nums mt-0.5 ${isSurplus ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isSurplus ? `+${(result.surplusCutBankM3 || 0).toFixed(1)}` : `-${(result.borrowFillBankM3 || 0).toFixed(1)}`} m³
            </div>
            <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              {isSurplus ? 'Surplus Cut to Spoil' : 'Borrow Fill Required'}
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]">
            <div className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">Prismoidal vs End-Area</div>
            <div className="text-base font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-0.5">
              Δ {(result.prismoidalCorrectionM3 || 0).toFixed(2)} m³
            </div>
            <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              EA {(result.trapezoidalVolumeM3 || 0).toFixed(1)} vs P {(result.prismoidalVolumeM3 || 0).toFixed(1)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
