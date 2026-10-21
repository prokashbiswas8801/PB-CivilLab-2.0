import React from 'react';
import {
  CivilWorkspace,
  ContinuousBeamSpan,
} from '../../types/civil';
import { ContinuousBeamResult } from '../../utils/calculations';
import { Layers, Activity, Sliders, ArrowRight } from 'lucide-react';

export interface ContinuousBeamInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
}

export const ContinuousBeamInputs: React.FC<ContinuousBeamInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
}) => {
  const cb = activeWorkspace.continuousBeam || {
    spanCount: 3,
    spans: [
      { id: 's1', spanIndex: 0, lengthM: 6.0, momentOfInertiaCm4: 120000, elasticModulusGpa: 200, udlKnPerM: 25.0, pointLoadKn: 40.0, pointLoadPositionM: 3.0 },
      { id: 's2', spanIndex: 1, lengthM: 7.5, momentOfInertiaCm4: 120000, elasticModulusGpa: 200, udlKnPerM: 30.0, pointLoadKn: 60.0, pointLoadPositionM: 3.75 },
      { id: 's3', spanIndex: 2, lengthM: 5.5, momentOfInertiaCm4: 120000, elasticModulusGpa: 200, udlKnPerM: 20.0, pointLoadKn: 30.0, pointLoadPositionM: 2.75 },
    ],
    leftSupport: 'pin',
    rightSupport: 'pin',
    allowableStressMpa: 250,
    sectionDepthMm: 600,
  };

  const handleSpanCountChange = (count: 2 | 3 | 4) => {
    let currentSpans = [...cb.spans];
    if (currentSpans.length < count) {
      for (let i = currentSpans.length; i < count; i++) {
        currentSpans.push({
          id: `span-${i + 1}`,
          spanIndex: i,
          lengthM: 6.0,
          momentOfInertiaCm4: 120000,
          elasticModulusGpa: 200,
          udlKnPerM: 20.0,
          pointLoadKn: 0,
          pointLoadPositionM: 3.0,
        });
      }
    } else {
      currentSpans = currentSpans.slice(0, count);
    }

    updateActiveWorkspace((ws) => ({
      ...ws,
      continuousBeam: {
        ...cb,
        spanCount: count,
        spans: currentSpans,
      },
    }));
  };

  const updateSpan = (index: number, patch: Partial<ContinuousBeamSpan>) => {
    const updated = cb.spans.map((s, i) => (i === index ? { ...s, ...patch } : s));
    updateActiveWorkspace((ws) => ({
      ...ws,
      continuousBeam: {
        ...cb,
        spans: updated,
      },
    }));
  };

  return (
    <div className="space-y-4">
      {/* Global Configuration Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Span Count
          </label>
          <div className="grid grid-cols-3 gap-1">
            {([2, 3, 4] as const).map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => handleSpanCountChange(cnt)}
                className={`py-1.5 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                  cb.spanCount === cnt
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                    : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container)]'
                }`}
              >
                {cnt} Spans
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Left End Support
          </label>
          <select
            value={cb.leftSupport}
            onChange={(e) =>
              updateActiveWorkspace((ws) => ({
                ...ws,
                continuousBeam: { ...cb, leftSupport: e.target.value as 'pin' | 'fixed' },
              }))
            }
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          >
            <option value="pin">Pinned / Roller (M₀ = 0)</option>
            <option value="fixed">Fixed Encastré (Slope θ₀ = 0)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Right End Support
          </label>
          <select
            value={cb.rightSupport}
            onChange={(e) =>
              updateActiveWorkspace((ws) => ({
                ...ws,
                continuousBeam: { ...cb, rightSupport: e.target.value as 'pin' | 'fixed' },
              }))
            }
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          >
            <option value="pin">Pinned / Roller (M_n = 0)</option>
            <option value="fixed">Fixed Encastré (Slope θ_n = 0)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Allowable Stress (MPa)
          </label>
          <input
            type="number"
            value={cb.allowableStressMpa}
            onChange={(e) =>
              updateActiveWorkspace((ws) => ({
                ...ws,
                continuousBeam: { ...cb, allowableStressMpa: Number(e.target.value) || 250 },
              }))
            }
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="10"
            min="50"
          />
        </div>
      </div>

      {/* Individual Span Loading & Geometry Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--md-sys-color-on-surface)]">
          <Sliders className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          <span>Span Loading &amp; Section Parameters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cb.spans.slice(0, cb.spanCount).map((span, sIdx) => (
            <div
              key={span.id}
              className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-1.5">
                <span className="font-bold text-xs font-mono text-[var(--md-sys-color-primary)]">
                  Span {sIdx + 1} (Support {sIdx} to {sIdx + 1})
                </span>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  L = {span.lengthM} m
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                    Span Length (m)
                  </label>
                  <input
                    type="number"
                    value={span.lengthM}
                    onChange={(e) => updateSpan(sIdx, { lengthM: Math.max(0.5, Number(e.target.value) || 1) })}
                    className="w-full px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                    step="0.5"
                    min="0.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                    UDL w (kN/m)
                  </label>
                  <input
                    type="number"
                    value={span.udlKnPerM}
                    onChange={(e) => updateSpan(sIdx, { udlKnPerM: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                    step="5"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                    Point Load P (kN)
                  </label>
                  <input
                    type="number"
                    value={span.pointLoadKn}
                    onChange={(e) => updateSpan(sIdx, { pointLoadKn: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                    step="5"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                    Load Pos a (m)
                  </label>
                  <input
                    type="number"
                    value={span.pointLoadPositionM}
                    onChange={(e) => updateSpan(sIdx, { pointLoadPositionM: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                    step="0.5"
                    min="0"
                    max={span.lengthM}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                  Moment of Inertia I (cm⁴)
                </label>
                <input
                  type="number"
                  value={span.momentOfInertiaCm4}
                  onChange={(e) => updateSpan(sIdx, { momentOfInertiaCm4: Math.max(100, Number(e.target.value) || 1000) })}
                  className="w-full px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                  step="5000"
                  min="100"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export interface ContinuousBeamMetricsProps {
  result: ContinuousBeamResult;
}

export const ContinuousBeamMetrics: React.FC<ContinuousBeamMetricsProps> = ({ result }) => {
  return (
    <div className="space-y-4">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Max Sagging Moment (+M)
          </div>
          <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            +{result.maxSaggingMomentKnm.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">kN·m</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Mid-span tension bottom</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Max Hogging Moment (-M)
          </div>
          <div className="text-xl font-mono font-bold text-rose-600 dark:text-rose-400">
            -{result.maxHoggingMomentKnm.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">kN·m</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Over intermediate supports</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Max Shear Force (V_max)
          </div>
          <div className="text-xl font-mono font-bold text-sky-600 dark:text-sky-400">
            {result.maxShearKn.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">kN</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Critical support face shear</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Extreme Bending Stress (σ)
          </div>
          <div className="text-xl font-mono font-bold text-[var(--md-sys-color-on-surface)]">
            {result.bendingStressMpa.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">MPa</span>
          </div>
          <div className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            DCR = {(result.utilizationRatio * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Support Reactions & Hogging Moments Grid */}
      <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
        <div className="text-xs font-bold font-mono text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>Support Reactions &amp; Internal Support Moments Schedule</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs font-mono">
          {result.supportMomentsKnm.map((mom, sIdx) => {
            const rxn = result.supportReactionsKn[sIdx] || 0;
            return (
              <div key={sIdx} className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-1">
                <div className="font-bold text-[var(--md-sys-color-primary)]">Support {sIdx}</div>
                <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
                  Reaction R: <strong className="font-bold">{rxn.toFixed(1)} kN</strong>
                </div>
                <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Moment M: <strong className={mom < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600'}>{mom.toFixed(1)} kN·m</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
