import React from 'react';
import {
  CivilWorkspace,
  ContinuousBeamSpan,
  TriangularLoadPattern,
} from '../../types/civil';
import { ContinuousBeamResult } from '../../utils/calculations';
import {
  Layers,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  GitCompare,
  ShieldCheck,
  TrendingDown,
  Compass,
} from 'lucide-react';

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
      { id: 's1', spanIndex: 0, lengthM: 6.0, momentOfInertiaCm4: 120000, elasticModulusGpa: 200, udlKnPerM: 25.0, pointLoadKn: 40.0, pointLoadPositionM: 3.0, triangularLoadKnPerM: 0, triangularLoadPattern: 'increasing' },
      { id: 's2', spanIndex: 1, lengthM: 7.5, momentOfInertiaCm4: 120000, elasticModulusGpa: 200, udlKnPerM: 30.0, pointLoadKn: 60.0, pointLoadPositionM: 3.75, triangularLoadKnPerM: 0, triangularLoadPattern: 'increasing' },
      { id: 's3', spanIndex: 2, lengthM: 5.5, momentOfInertiaCm4: 120000, elasticModulusGpa: 200, udlKnPerM: 20.0, pointLoadKn: 30.0, pointLoadPositionM: 2.75, triangularLoadKnPerM: 0, triangularLoadPattern: 'increasing' },
    ],
    leftSupport: 'pin',
    rightSupport: 'pin',
    allowableStressMpa: 250,
    sectionDepthMm: 600,
    sectionWidthMm: 300,
    concreteGradeFckMpa: 25,
    steelGradeFyMpa: 420,
    codeStandard: 'BNBC-2020',
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
          udlKnPerM: 25.0,
          pointLoadKn: 40.0,
          pointLoadPositionM: 3.0,
          triangularLoadKnPerM: 0,
          triangularLoadPattern: 'increasing',
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

  // Quick Engineering Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'bnbc-building') {
      updateActiveWorkspace((ws) => ({
        ...ws,
        continuousBeam: {
          spanCount: 3,
          spans: [
            { id: 's1', spanIndex: 0, lengthM: 6.0, momentOfInertiaCm4: 140000, elasticModulusGpa: 200, udlKnPerM: 28.0, pointLoadKn: 50.0, pointLoadPositionM: 3.0, triangularLoadKnPerM: 0, triangularLoadPattern: 'increasing' },
            { id: 's2', spanIndex: 1, lengthM: 7.2, momentOfInertiaCm4: 140000, elasticModulusGpa: 200, udlKnPerM: 32.0, pointLoadKn: 65.0, pointLoadPositionM: 3.6, triangularLoadKnPerM: 0, triangularLoadPattern: 'increasing' },
            { id: 's3', spanIndex: 2, lengthM: 5.8, momentOfInertiaCm4: 140000, elasticModulusGpa: 200, udlKnPerM: 26.0, pointLoadKn: 45.0, pointLoadPositionM: 2.9, triangularLoadKnPerM: 0, triangularLoadPattern: 'increasing' },
          ],
          leftSupport: 'pin',
          rightSupport: 'pin',
          allowableStressMpa: 250,
          sectionDepthMm: 600,
          sectionWidthMm: 300,
          concreteGradeFckMpa: 25,
          steelGradeFyMpa: 420,
          codeStandard: 'BNBC-2020',
        },
      }));
    } else if (presetName === 'tank-hydrostatic') {
      updateActiveWorkspace((ws) => ({
        ...ws,
        continuousBeam: {
          spanCount: 4,
          spans: [
            { id: 's1', spanIndex: 0, lengthM: 4.5, momentOfInertiaCm4: 110000, elasticModulusGpa: 200, udlKnPerM: 15.0, pointLoadKn: 0, pointLoadPositionM: 2.25, triangularLoadKnPerM: 40.0, triangularLoadPattern: 'increasing' },
            { id: 's2', spanIndex: 1, lengthM: 5.0, momentOfInertiaCm4: 110000, elasticModulusGpa: 200, udlKnPerM: 15.0, pointLoadKn: 30.0, pointLoadPositionM: 2.5, triangularLoadKnPerM: 40.0, triangularLoadPattern: 'decreasing' },
            { id: 's3', spanIndex: 2, lengthM: 5.0, momentOfInertiaCm4: 110000, elasticModulusGpa: 200, udlKnPerM: 15.0, pointLoadKn: 30.0, pointLoadPositionM: 2.5, triangularLoadKnPerM: 35.0, triangularLoadPattern: 'symmetric' },
            { id: 's4', spanIndex: 3, lengthM: 4.5, momentOfInertiaCm4: 110000, elasticModulusGpa: 200, udlKnPerM: 15.0, pointLoadKn: 0, pointLoadPositionM: 2.25, triangularLoadKnPerM: 40.0, triangularLoadPattern: 'increasing' },
          ],
          leftSupport: 'fixed',
          rightSupport: 'fixed',
          allowableStressMpa: 250,
          sectionDepthMm: 550,
          sectionWidthMm: 350,
          concreteGradeFckMpa: 30,
          steelGradeFyMpa: 500,
          codeStandard: 'ACI-318',
        },
      }));
    } else if (presetName === 'bridge-girder') {
      updateActiveWorkspace((ws) => ({
        ...ws,
        continuousBeam: {
          spanCount: 2,
          spans: [
            { id: 's1', spanIndex: 0, lengthM: 12.0, momentOfInertiaCm4: 450000, elasticModulusGpa: 200, udlKnPerM: 35.0, pointLoadKn: 120.0, pointLoadPositionM: 6.0, triangularLoadKnPerM: 0, triangularLoadPattern: 'increasing' },
            { id: 's2', spanIndex: 1, lengthM: 12.0, momentOfInertiaCm4: 450000, elasticModulusGpa: 200, udlKnPerM: 35.0, pointLoadKn: 120.0, pointLoadPositionM: 6.0, triangularLoadKnPerM: 0, triangularLoadPattern: 'increasing' },
          ],
          leftSupport: 'pin',
          rightSupport: 'pin',
          allowableStressMpa: 280,
          sectionDepthMm: 900,
          sectionWidthMm: 450,
          concreteGradeFckMpa: 35,
          steelGradeFyMpa: 500,
          codeStandard: 'BNBC-2020',
        },
      }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Engineering Presets Strip */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-xs font-mono">
        <span className="flex items-center gap-1.5 font-bold text-[var(--md-sys-color-primary)] mr-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Structural Presets:</span>
        </span>
        <button
          type="button"
          onClick={() => applyPreset('bnbc-building')}
          className="px-2.5 py-1 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors"
        >
          3-Span BNBC Girder
        </button>
        <button
          type="button"
          onClick={() => applyPreset('tank-hydrostatic')}
          className="px-2.5 py-1 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors"
        >
          4-Span Tank (Triangular Hydrostatic)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('bridge-girder')}
          className="px-2.5 py-1 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors"
        >
          2-Span Heavy Bridge Girder
        </button>
      </div>

      {/* Global Configuration Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Span Count (2 to 4 Spans)
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
            <option value="fixed">Fixed Encastré (θ₀ = 0)</option>
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
            <option value="fixed">Fixed Encastré (θ_n = 0)</option>
          </select>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
              Allowable Flexural Stress (MPa)
            </label>
            {cb.allowableStressMpa === 0 && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                0 ACTIVE
              </span>
            )}
          </div>
          <input
            type="number"
            value={cb.allowableStressMpa}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                continuousBeam: { ...cb, allowableStressMpa: isNaN(val) ? 0 : val },
              }));
            }}
            className={`w-full touch-target-48 px-2.5 rounded-lg border font-mono text-xs bg-[var(--md-sys-color-surface)] ${
              cb.allowableStressMpa === 0
                ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                : 'border-[var(--md-sys-color-outline)]'
            }`}
            step="any"
            min="0"
          />
        </div>
      </div>

      {/* Cross-Section & Code Parameters (ACI 318 / BNBC 2020) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Section Depth d (mm)
            </label>
            {cb.sectionDepthMm === 0 && (
              <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                0
              </span>
            )}
          </div>
          <input
            type="number"
            value={cb.sectionDepthMm}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                continuousBeam: { ...cb, sectionDepthMm: isNaN(val) ? 0 : val },
              }));
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs bg-[var(--md-sys-color-surface)] ${
              cb.sectionDepthMm === 0
                ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                : 'border-[var(--md-sys-color-outline)]'
            }`}
            step="any"
            min="0"
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Section Width b (mm)
            </label>
            {cb.sectionWidthMm === 0 && (
              <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                0
              </span>
            )}
          </div>
          <input
            type="number"
            value={cb.sectionWidthMm}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                continuousBeam: { ...cb, sectionWidthMm: isNaN(val) ? 0 : val },
              }));
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs bg-[var(--md-sys-color-surface)] ${
              cb.sectionWidthMm === 0
                ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                : 'border-[var(--md-sys-color-outline)]'
            }`}
            step="any"
            min="0"
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Concrete f'c (MPa)
            </label>
            {cb.concreteGradeFckMpa === 0 && (
              <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                0
              </span>
            )}
          </div>
          <input
            type="number"
            value={cb.concreteGradeFckMpa}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : Number(e.target.value);
              updateActiveWorkspace((ws) => ({
                ...ws,
                continuousBeam: { ...cb, concreteGradeFckMpa: isNaN(val) ? 0 : val },
              }));
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs bg-[var(--md-sys-color-surface)] ${
              cb.concreteGradeFckMpa === 0
                ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                : 'border-[var(--md-sys-color-outline)]'
            }`}
            step="any"
            min="0"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
            Design Code Standard
          </label>
          <select
            value={cb.codeStandard || 'BNBC-2020'}
            onChange={(e) =>
              updateActiveWorkspace((ws) => ({
                ...ws,
                continuousBeam: { ...cb, codeStandard: e.target.value as any },
              }))
            }
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          >
            <option value="BNBC-2020">BNBC-2020 (Strength Design)</option>
            <option value="ACI-318">ACI 318-19 (LRFD)</option>
            <option value="IS-456">IS 456:2000 (Limit State)</option>
          </select>
        </div>
      </div>

      {/* Individual Span Loading & Geometry Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--md-sys-color-on-surface)]">
          <Sliders className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          <span>Span Loading, Point Loads &amp; Triangular Distribution</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cb.spans.slice(0, cb.spanCount).map((span, sIdx) => (
            <div
              key={span.id}
              className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-1.5">
                <span className="font-bold text-xs font-mono text-[var(--md-sys-color-primary)]">
                  Span {sIdx + 1} (Support {sIdx} → {sIdx + 1})
                </span>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                  L = {span.lengthM} m
                  {span.lengthM === 0 && (
                    <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                      0 ACTIVE
                    </span>
                  )}
                </span>
              </div>

              {/* Span Length & UDL */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <label className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      Span Length (m)
                    </label>
                    {span.lengthM === 0 && (
                      <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        [0]
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={span.lengthM}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      updateSpan(sIdx, { lengthM: isNaN(val) ? 0 : val });
                    }}
                    className={`w-full px-2 py-1.5 rounded border font-mono text-xs bg-[var(--md-sys-color-surface)] ${
                      span.lengthM === 0
                        ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'border-[var(--md-sys-color-outline)]'
                    }`}
                    step="any"
                    min="0"
                  />
                  <input
                    type="range"
                    aria-label={`Span ${sIdx + 1} length slider`}
                    min={1}
                    max={20}
                    step={0.25}
                    value={Math.min(20, Math.max(1, span.lengthM || 1))}
                    onChange={(e) => updateSpan(sIdx, { lengthM: Number(e.target.value) })}
                    className="w-full h-1.5 mt-1.5 accent-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <label className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      UDL w (kN/m)
                    </label>
                    {span.udlKnPerM === 0 && (
                      <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        [0]
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={span.udlKnPerM}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      updateSpan(sIdx, { udlKnPerM: isNaN(val) ? 0 : val });
                    }}
                    className={`w-full px-2 py-1.5 rounded border font-mono text-xs bg-[var(--md-sys-color-surface)] ${
                      span.udlKnPerM === 0
                        ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'border-[var(--md-sys-color-outline)]'
                    }`}
                    step="any"
                    min="0"
                  />
                  <input
                    type="range"
                    aria-label={`Span ${sIdx + 1} UDL slider`}
                    min={0}
                    max={100}
                    step={1}
                    value={Math.min(100, Math.max(0, span.udlKnPerM || 0))}
                    onChange={(e) => updateSpan(sIdx, { udlKnPerM: Number(e.target.value) })}
                    className="w-full h-1.5 mt-1.5 accent-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                </div>
              </div>

              {/* Point Load P & Position a */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <label className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      Point Load P (kN)
                    </label>
                    {span.pointLoadKn === 0 && (
                      <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        [0]
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={span.pointLoadKn}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      updateSpan(sIdx, { pointLoadKn: isNaN(val) ? 0 : val });
                    }}
                    className={`w-full px-2 py-1.5 rounded border font-mono text-xs bg-[var(--md-sys-color-surface)] ${
                      span.pointLoadKn === 0
                        ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'border-[var(--md-sys-color-outline)]'
                    }`}
                    step="any"
                    min="0"
                  />
                  <input
                    type="range"
                    aria-label={`Span ${sIdx + 1} point load slider`}
                    min={0}
                    max={200}
                    step={2}
                    value={Math.min(200, Math.max(0, span.pointLoadKn || 0))}
                    onChange={(e) => updateSpan(sIdx, { pointLoadKn: Number(e.target.value) })}
                    className="w-full h-1.5 mt-1.5 accent-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <label className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      Load Pos a (m)
                    </label>
                    {span.pointLoadPositionM === 0 && (
                      <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        [0]
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={span.pointLoadPositionM}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      updateSpan(sIdx, { pointLoadPositionM: isNaN(val) ? 0 : val });
                    }}
                    className={`w-full px-2 py-1.5 rounded border font-mono text-xs bg-[var(--md-sys-color-surface)] ${
                      span.pointLoadPositionM === 0
                        ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'border-[var(--md-sys-color-outline)]'
                    }`}
                    step="any"
                    min="0"
                  />
                  <input
                    type="range"
                    aria-label={`Span ${sIdx + 1} point load position slider`}
                    min={0}
                    max={Math.max(0.5, span.lengthM || 1)}
                    step={0.1}
                    value={Math.min(Math.max(0.5, span.lengthM || 1), Math.max(0, span.pointLoadPositionM || 0))}
                    onChange={(e) => updateSpan(sIdx, { pointLoadPositionM: Number(e.target.value) })}
                    className="w-full h-1.5 mt-1.5 accent-[var(--md-sys-color-primary)] cursor-pointer"
                  />
                </div>
              </div>

              {/* Triangular / Varying Load */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <label className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      Triangular w (kN/m)
                    </label>
                    {span.triangularLoadKnPerM === 0 && (
                      <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        [0]
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={span.triangularLoadKnPerM || 0}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      updateSpan(sIdx, { triangularLoadKnPerM: isNaN(val) ? 0 : val });
                    }}
                    className={`w-full px-2 py-1.5 rounded border font-mono text-xs bg-[var(--md-sys-color-surface)] ${
                      (span.triangularLoadKnPerM || 0) === 0
                        ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'border-[var(--md-sys-color-outline)]'
                    }`}
                    step="any"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)] mb-0.5">
                    Load Profile
                  </label>
                  <select
                    value={span.triangularLoadPattern || 'increasing'}
                    onChange={(e) => updateSpan(sIdx, { triangularLoadPattern: e.target.value as TriangularLoadPattern })}
                    className="w-full px-2 py-1.5 rounded border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
                  >
                    <option value="increasing">0 → Peak (↗)</option>
                    <option value="decreasing">Peak → 0 (↘)</option>
                    <option value="symmetric">Center Peak (△)</option>
                  </select>
                </div>
              </div>

              {/* Moment of Inertia I */}
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
  const isPass = result.safetyStatus === 'PASS';
  const isWarn = result.safetyStatus === 'WARNING';

  const statusBg = isPass
    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
    : isWarn
    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400'
    : 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400';

  return (
    <div className="space-y-4">
      {/* Executive Safety Summary Banner (ACI 318 / BNBC 2020) */}
      <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${statusBg}`}>
        <div className="flex items-center gap-3">
          {isPass ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
          ) : isWarn ? (
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
          )}
          <div>
            <div className="font-bold text-sm font-mono flex items-center gap-2">
              <span>{result.codeChecks.governingCode} LIMIT STATE: {result.safetyStatus}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface)]/80 font-mono">
                Gov. DCR = {(result.utilizationRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xs opacity-90 mt-0.5">
              {result.governingFailureMode === 'Adequate'
                ? 'Section moment capacity and shear reinforcement demands fully compliant with code safety margins.'
                : `Governing Limit State: ${result.governingFailureMode}. Verification required.`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="text-right">
            <div>Deflection Estimate: <strong>{result.codeChecks.maxDeflectionEstimateMm} mm</strong></div>
            <div className="text-[11px] opacity-80">{result.codeChecks.deflectionRatio} (Span / Deflection)</div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Max Sagging Moment */}
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
            <span>Max Sagging (+M)</span>
            <span className="text-emerald-600 font-bold">Bottom Tension</span>
          </div>
          <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            +{result.maxSaggingMomentKnm.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">kN·m</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Exact Location: <strong className="font-mono">{result.maxSaggingLocationM.toFixed(2)} m</strong> from left
          </div>
        </div>

        {/* Max Hogging Moment */}
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
            <span>Max Hogging (-M)</span>
            <span className="text-rose-600 font-bold">Top Tension</span>
          </div>
          <div className="text-xl font-mono font-bold text-rose-600 dark:text-rose-400">
            -{result.maxHoggingMomentKnm.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">kN·m</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Over Support <strong className="font-mono">#{result.maxHoggingSupportIndex}</strong>
          </div>
        </div>

        {/* Max Shear Force */}
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
            <span>Max Shear (V_max)</span>
            <span className="text-sky-600 font-bold">Support Face</span>
          </div>
          <div className="text-xl font-mono font-bold text-sky-600 dark:text-sky-400">
            {result.maxShearKn.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">kN</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Critical at d: <strong className="font-mono">{result.criticalShearKn.toFixed(1)} kN</strong>
          </div>
        </div>

        {/* Extreme Bending Stress & Flexural DCR */}
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
            <span>Extreme Stress (σ)</span>
            <span className="font-mono font-semibold">Limit: {result.allowableStressMpa} MPa</span>
          </div>
          <div className="text-xl font-mono font-bold text-[var(--md-sys-color-on-surface)]">
            {result.bendingStressMpa.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">MPa</span>
          </div>
          <div className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            Flexural DCR = {(result.flexuralDcr * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Dual-Method Validation: Three-Moment Theorem vs Moment Distribution Method */}
      <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="font-bold text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
            <GitCompare className="w-3.5 h-3.5" />
            <span>Dual-Solver Validation: Three-Moment (Clapeyron) vs Moment Distribution (Hardy Cross)</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
            {result.momentDistributionSummary.converged
              ? `Converged in ${result.momentDistributionSummary.iterations} cycles (Δ < ${result.momentDistributionSummary.maxDiscrepancyPercent}%)`
              : 'Direct Solution'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-1.5">
            <div className="font-bold text-[var(--md-sys-color-on-surface)] text-[11px]">
              Support Moments Cross-Check Schedule
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  <th className="py-1">Support</th>
                  <th className="py-1">Clapeyron (kN·m)</th>
                  <th className="py-1">Hardy Cross (kN·m)</th>
                  <th className="py-1 text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/40">
                {result.momentDistributionSummary.methodComparison.map((m) => (
                  <tr key={m.supportIndex}>
                    <td className="py-1 font-bold text-[var(--md-sys-color-primary)]">Sup {m.supportIndex}</td>
                    <td className="py-1">{m.clapeyronMomentKnm.toFixed(2)}</td>
                    <td className="py-1">{m.hardyCrossMomentKnm.toFixed(2)}</td>
                    <td className="py-1 text-right text-emerald-600 font-bold">{m.deltaKnm.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-2">
            <div className="font-bold text-[var(--md-sys-color-on-surface)] text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>ACI 318 / BNBC 2020 Limit States Checklist</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span>Flexural Stress Demand (σ ≤ F_allow):</span>
                <span className={result.codeChecks.flexurePass ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {result.codeChecks.flexurePass ? '✓ PASS' : '✗ FAIL'} ({result.bendingStressMpa.toFixed(1)} / {result.allowableStressMpa} MPa)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Concrete Shear Capacity (V_u,d ≤ φ·V_c):</span>
                <span className={result.codeChecks.shearPass ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {result.codeChecks.shearPass ? '✓ PASS' : '✗ STIRRUPS REQ.'} ({result.criticalShearKn.toFixed(1)} / {result.concreteShearCapacityVcKn.toFixed(1)} kN)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimated Immediate Deflection:</span>
                <span className={result.codeChecks.deflectionPass ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                  {result.codeChecks.deflectionRatio} ({result.codeChecks.deflectionPass ? 'Compliant' : 'Check L/360'})
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--md-sys-color-outline-variant)]/50 text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Inflection Points Detected:</span>
                <strong className="font-bold text-[var(--md-sys-color-on-surface)]">
                  {result.allInflectionPointsTotalM.length} contra-flexure cutoffs
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Reactions & Internal Support Moments Schedule */}
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
