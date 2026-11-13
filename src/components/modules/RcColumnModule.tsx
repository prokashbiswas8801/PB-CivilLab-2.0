import React, { useState } from 'react';
import {
  CivilWorkspace,
  RcColumnDesignCode,
  RcColumnParams,
} from '../../types/civil';
import { RcColumnDesignResult } from '../../utils/rcColumnEngine';
import { createDefaultRcColumnDesign } from '../../utils/storage';
import {
  ChevronDown,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Zap,
} from 'lucide-react';

export interface RcColumnInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  result?: RcColumnDesignResult | null;
}

export const RcColumnInputs: React.FC<RcColumnInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  result,
}) => {
  const col = activeWorkspace.rcColumn || createDefaultRcColumnDesign();
  const unitPreset = activeWorkspace.unitPreferences?.systemPreset || 'metric';
  const isImp = unitPreset === 'imperial';

  const [openSections, setOpenSections] = useState({
    geometry: true,
    reinforcement: true,
    loads: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const commit = (patch: Partial<RcColumnParams>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      rcColumn: {
        ...(ws.rcColumn || createDefaultRcColumnDesign()),
        ...patch,
      },
    }));
  };

  const totalBarCount =
    2 * Math.max(2, col.barsAlongWidthB) +
    2 * Math.max(0, Math.max(2, col.barsAlongDepthH) - 2);

  return (
    <div className="space-y-4">
      {/* Code Standard & Frame Bracing Quick Header */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--md-sys-color-on-surface)]">
            <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Design Standard &amp; Frame Sway Condition</span>
          </div>
          {result && (
            <span
              className={`text-[11px] font-mono font-bold ${
                result.status === 'critical'
                  ? 'text-[var(--md-sys-color-error)]'
                  : result.status === 'warning'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              Governing DCR: {(result.governingDcr * 100).toFixed(1)}%
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Governing Code
            </label>
            <select
              value={col.designCode}
              onChange={(e) => commit({ designCode: e.target.value as RcColumnDesignCode })}
              className="w-full px-2.5 py-2 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-xs font-mono text-[var(--md-sys-color-on-surface)]"
            >
              <option value="BNBC-2020">BNBC 2020 (Part 6 Ch 6)</option>
              <option value="ACI-318-19">ACI 318-19 (USD)</option>
              <option value="Eurocode-2">Eurocode 2 (EN 1992-1-1)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Frame Stability Restraint
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
              <button
                type="button"
                onClick={() => commit({ isBracedFrame: true, effectiveLengthFactorK: 0.85 })}
                className={`px-2 py-1.5 rounded text-[11px] font-mono font-semibold cursor-pointer transition-colors ${
                  col.isBracedFrame
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                }`}
              >
                Braced (Non-Sway)
              </button>
              <button
                type="button"
                onClick={() => commit({ isBracedFrame: false, effectiveLengthFactorK: 1.35 })}
                className={`px-2 py-1.5 rounded text-[11px] font-mono font-semibold cursor-pointer transition-colors ${
                  !col.isBracedFrame
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                }`}
              >
                Unbraced (Sway)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Column Geometry & Slenderness */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('geometry')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] text-left cursor-pointer"
        >
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>1. Cross-Section Dimensions &amp; Slenderness</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] transition-transform ${
              openSections.geometry ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.geometry && (
          <div className="p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Width b (mm)
                {isImp && (
                  <span className="ml-1 font-mono text-[10px] text-[var(--md-sys-color-primary)]">
                    ({(col.widthB_Mm / 25.4).toFixed(1)} in)
                  </span>
                )}
              </label>
              <input
                type="number"
                min={150}
                max={2500}
                step={25}
                value={col.widthB_Mm}
                onChange={(e) => commit({ widthB_Mm: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Depth h (mm)
                {isImp && (
                  <span className="ml-1 font-mono text-[10px] text-[var(--md-sys-color-primary)]">
                    ({(col.depthH_Mm / 25.4).toFixed(1)} in)
                  </span>
                )}
              </label>
              <input
                type="number"
                min={150}
                max={2500}
                step={25}
                value={col.depthH_Mm}
                onChange={(e) => commit({ depthH_Mm: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Clear Cover (mm)
              </label>
              <input
                type="number"
                min={20}
                max={100}
                step={5}
                value={col.clearCoverMm}
                onChange={(e) => commit({ clearCoverMm: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Unsupported L_u (m)
                {isImp && (
                  <span className="ml-1 font-mono text-[10px] text-[var(--md-sys-color-primary)]">
                    ({(col.unsupportedLengthLu_M * 3.28084).toFixed(1)} ft)
                  </span>
                )}
              </label>
              <input
                type="number"
                min={1.0}
                max={18.0}
                step={0.1}
                value={col.unsupportedLengthLu_M}
                onChange={(e) => commit({ unsupportedLengthLu_M: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Restraint Factor k
              </label>
              <input
                type="number"
                min={0.5}
                max={2.5}
                step={0.05}
                value={col.effectiveLengthFactorK}
                onChange={(e) => commit({ effectiveLengthFactorK: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Sustained Ratio β_dns
              </label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={col.sustainedLoadRatioBetaDns ?? 0.6}
                onChange={(e) => commit({ sustainedLoadRatioBetaDns: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Concrete, Longitudinal Rebar & Ties */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('reinforcement')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] text-left cursor-pointer"
        >
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>
              2. Concrete Grade &amp; Rebar Layout ({totalBarCount}-Ø{col.longitudinalBarDiaMm}mm)
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] transition-transform ${
              openSections.reinforcement ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.reinforcement && (
          <div className="p-3.5 space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Concrete f&apos;c (MPa)
                </label>
                <input
                  type="number"
                  min={15}
                  max={80}
                  step={1}
                  value={col.concreteFcMpa}
                  onChange={(e) => commit({ concreteFcMpa: Number(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Rebar Yield f_y (MPa)
                </label>
                <select
                  value={col.rebarFyMpa}
                  onChange={(e) => commit({ rebarFyMpa: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono text-[var(--md-sys-color-on-surface)]"
                >
                  <option value={415}>415 MPa (Fe 415 / Grade 60)</option>
                  <option value={420}>420 MPa (ASTM Grade 60)</option>
                  <option value={500}>500 MPa (BD 500W / B500B)</option>
                  <option value={550}>550 MPa (High Strength)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Main Bar Ø (mm)
                </label>
                <select
                  value={col.longitudinalBarDiaMm}
                  onChange={(e) => commit({ longitudinalBarDiaMm: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono text-[var(--md-sys-color-on-surface)]"
                >
                  {[12, 16, 20, 22, 25, 28, 32].map((d) => (
                    <option key={d} value={d}>
                      Ø {d} mm
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Bars on b-Face (n_x)
                </label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  step={1}
                  value={col.barsAlongWidthB}
                  onChange={(e) => commit({ barsAlongWidthB: Math.max(2, Number(e.target.value) || 2) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Bars on h-Face (n_y)
                </label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  step={1}
                  value={col.barsAlongDepthH}
                  onChange={(e) => commit({ barsAlongDepthH: Math.max(2, Number(e.target.value) || 2) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Tie Ø / Spacing (mm)
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={col.tieBarDiaMm}
                    onChange={(e) => commit({ tieBarDiaMm: Number(e.target.value) })}
                    className="w-1/2 px-1.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value={8}>Ø8</option>
                    <option value={10}>Ø10</option>
                    <option value={12}>Ø12</option>
                  </select>
                  <input
                    type="number"
                    min={75}
                    max={400}
                    step={25}
                    value={col.tieSpacingMm}
                    onChange={(e) => commit({ tieSpacingMm: Number(e.target.value) || 150 })}
                    className="w-1/2 px-2 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Bar Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mr-1">
                Quick Rebar Presets:
              </span>
              {[
                { label: '4-Ø16', d: 16, nx: 2, ny: 2 },
                { label: '8-Ø20', d: 20, nx: 3, ny: 3 },
                { label: '10-Ø20', d: 20, nx: 3, ny: 4 },
                { label: '12-Ø25', d: 25, nx: 4, ny: 4 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() =>
                    commit({
                      longitudinalBarDiaMm: p.d,
                      barsAlongWidthB: p.nx,
                      barsAlongDepthH: p.ny,
                    })
                  }
                  className="px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] font-mono text-[11px] cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Factored Axial & Biaxial Moments */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('loads')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] text-left cursor-pointer"
        >
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>3. Factored Load Demand (P_u, M_ux, M_uy)</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] transition-transform ${
              openSections.loads ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.loads && (
          <div className="p-3.5 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Axial Load P_u (kN)
                  {isImp && (
                    <span className="ml-1 font-mono text-[10px] text-[var(--md-sys-color-primary)]">
                      ({(col.axialLoadPu_Kn * 0.224809).toFixed(0)} kips)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step={50}
                  value={col.axialLoadPu_Kn}
                  onChange={(e) => commit({ axialLoadPu_Kn: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Major Moment M_ux (kN·m)
                  {isImp && (
                    <span className="ml-1 font-mono text-[10px] text-[var(--md-sys-color-primary)]">
                      ({(col.momentMux_Knm * 0.737562).toFixed(1)} k·ft)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={col.momentMux_Knm}
                  onChange={(e) => commit({ momentMux_Knm: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Minor Moment M_uy (kN·m)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={col.momentMuy_Knm}
                  onChange={(e) => commit({ momentMuy_Knm: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] font-mono tabular-nums text-[var(--md-sys-color-on-surface)]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mr-1">
                Load Cases:
              </span>
              {[
                { label: 'Gravity Interior', pu: 1850, mx: 65, my: 30 },
                { label: 'Biaxial Corner', pu: 1100, mx: 190, my: 115 },
                { label: 'Seismic Overturn', pu: 450, mx: 260, my: 55 },
                { label: 'Overloaded Demo', pu: 2450, mx: 320, my: 140 },
              ].map((lc) => (
                <button
                  key={lc.label}
                  type="button"
                  onClick={() =>
                    commit({
                      axialLoadPu_Kn: lc.pu,
                      momentMux_Knm: lc.mx,
                      momentMuy_Knm: lc.my,
                    })
                  }
                  className="px-2 py-1 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] font-mono text-[11px] cursor-pointer"
                >
                  {lc.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const RcColumnMetrics: React.FC<{
  result: RcColumnDesignResult;
  activeWorkspace: CivilWorkspace;
}> = ({ result }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          Governing Interaction DCR
        </div>
        <div
          className={`text-xl font-bold font-mono tabular-nums mt-1 ${
            result.status === 'critical'
              ? 'text-[var(--md-sys-color-error)]'
              : result.status === 'warning'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {(result.governingDcr * 100).toFixed(1)}%
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          Bresler Biaxial: {(result.breslerContourDcr * 100).toFixed(1)}% · α={result.breslerAlpha.toFixed(2)}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          Design Flexural Capacity at P_u
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-1">
          {result.xAxis.phiMnAtPuKnm.toFixed(1)} kN·m
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          φM_ny = {result.yAxis.phiMnAtPuKnm.toFixed(1)} kN·m · φP_n,max = {result.phiPnMaxKn.toFixed(0)} kN
        </div>
      </div>

      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          Slenderness &amp; Magnifier δ_ns
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] mt-1 flex items-center gap-1.5">
          <span>{result.xAxis.magnifierDeltaNs.toFixed(3)}×</span>
          {result.xAxis.isSlender && (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          )}
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          kL_u/r_x = {result.xAxis.slendernessRatioKluR.toFixed(1)} ({result.xAxis.isSlender ? 'Slender' : 'Short'})
        </div>
      </div>

      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5">
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          Longitudinal Steel &amp; Ties
        </div>
        <div className="text-xl font-bold font-mono tabular-nums text-[var(--md-sys-color-primary)] mt-1">
          {result.totalBarCount}-Ø{result.longitudinalBarDiaMm} ({result.rhoPercent.toFixed(2)}%)
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
          A_st = {result.astProvidedMm2.toFixed(0)} mm² · Ties Ø{result.tieBarDiaMm}@{result.tieSpacingMm}mm
        </div>
      </div>
    </div>
  );
};
