import React, { useState } from 'react';
import {
  CivilWorkspace,
  SectionAnalyzerParams,
  SectionShapeType,
  SectionStandardCode,
  SectionPolygonVertex,
} from '../../types/civil';
import {
  SectionAnalyzerResult,
  STEEL_SECTION_CATALOGUE,
  createDefaultCustomPolygon,
} from '../../utils/sectionMechanics';
import { createDefaultSectionAnalyzer } from '../../utils/storage';
import {
  Layers,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  ChevronDown,
  Sliders,
  Zap,
  AlertTriangle,
} from 'lucide-react';

export interface SectionAnalyzerInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  result?: SectionAnalyzerResult | null;
}

const SHAPE_OPTIONS: Array<{ id: SectionShapeType; label: string }> = [
  { id: 'i-beam', label: 'I-Beam / H' },
  { id: 'hollow-box', label: 'Hollow Box' },
  { id: 'rectangular', label: 'Rectangle' },
  { id: 'circular', label: 'Circular' },
  { id: 't-section', label: 'T-Section' },
  { id: 'channel', label: 'Channel (U)' },
  { id: 'custom-polygon', label: 'Custom Poly' },
];

export const SectionAnalyzerInputs: React.FC<SectionAnalyzerInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  result,
}) => {
  const sa = activeWorkspace.sectionAnalyzer || createDefaultSectionAnalyzer();
  const unitPreset = activeWorkspace.unitPreferences?.systemPreset || 'metric';
  const isImp = unitPreset === 'imperial';

  const [openSections, setOpenSections] = useState({
    geometry: true,
    material: true,
    loads: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const commit = (patch: Partial<SectionAnalyzerParams>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      sectionAnalyzer: {
        ...(ws.sectionAnalyzer || createDefaultSectionAnalyzer()),
        ...patch,
      },
    }));
  };

  const handleSelectCatalogue = (catalogueId: string) => {
    if (catalogueId === 'custom') {
      commit({ presetId: 'custom' });
      return;
    }
    const entry = STEEL_SECTION_CATALOGUE.find((c) => c.id === catalogueId);
    if (!entry) return;
    commit({
      presetId: entry.id,
      shape: entry.shape,
      depthH_Mm: entry.depthH_Mm,
      widthB_Mm: entry.widthB_Mm,
      webThicknessTw_Mm: entry.webThicknessTw_Mm,
      flangeThicknessTf_Mm: entry.flangeThicknessTf_Mm,
      wallThicknessT_Mm: entry.wallThicknessT_Mm,
    });
  };

  const handleSelectShape = (shape: SectionShapeType) => {
    const defaultsByShape: Partial<SectionAnalyzerParams> =
      shape === 'rectangular'
        ? { depthH_Mm: 400, widthB_Mm: 250, presetId: 'custom' }
        : shape === 'circular'
        ? { depthH_Mm: 300, widthB_Mm: 300, presetId: 'custom' }
        : shape === 'hollow-box'
        ? { depthH_Mm: 200, widthB_Mm: 120, wallThicknessT_Mm: 8, presetId: 'rhs-200x120x8' }
        : shape === 'i-beam'
        ? { depthH_Mm: 300, widthB_Mm: 150, webThicknessTw_Mm: 7.1, flangeThicknessTf_Mm: 10.7, presetId: 'ipe-300' }
        : shape === 't-section'
        ? { depthH_Mm: 240, widthB_Mm: 160, webThicknessTw_Mm: 8, flangeThicknessTf_Mm: 12, presetId: 'custom' }
        : shape === 'channel'
        ? { depthH_Mm: 200, widthB_Mm: 75, webThicknessTw_Mm: 6.0, flangeThicknessTf_Mm: 12.5, presetId: 'pfc-200x75' }
        : {
            presetId: 'custom',
            polygonPointsMm:
              sa.polygonPointsMm && sa.polygonPointsMm.length >= 3
                ? sa.polygonPointsMm
                : createDefaultCustomPolygon(),
          };
    commit({ shape, ...defaultsByShape });
  };

  const handleAddVertex = () => {
    const pts = sa.polygonPointsMm || createDefaultCustomPolygon();
    const last = pts[pts.length - 1] || { yMm: 0, zMm: 0 };
    const nextPt: SectionPolygonVertex = {
      id: `v-${Date.now().toString(36)}`,
      yMm: Math.max(0, last.yMm + 20),
      zMm: last.zMm,
    };
    commit({ presetId: 'custom', polygonPointsMm: [...pts, nextPt] });
  };

  const handleUpdateVertex = (id: string, field: 'yMm' | 'zMm', val: number) => {
    const pts = (sa.polygonPointsMm || []).map((p) =>
      p.id === id ? { ...p, [field]: Number.isFinite(val) ? val : 0 } : p
    );
    commit({ presetId: 'custom', polygonPointsMm: pts });
  };

  const handleDeleteVertex = (id: string) => {
    if ((sa.polygonPointsMm?.length || 0) <= 3) return;
    commit({
      presetId: 'custom',
      polygonPointsMm: sa.polygonPointsMm.filter((p) => p.id !== id),
    });
  };

  const applyLoadCasePreset = (mode: 'beam-column' | 'pure-moment' | 'biaxial' | 'high-compression') => {
    if (mode === 'beam-column') {
      commit({ axialForceN_Kn: -420, momentMy_Knm: 145, momentMz_Knm: 0, shearVy_Kn: 0, shearVz_Kn: 95, torsionT_Knm: 0 });
    } else if (mode === 'pure-moment') {
      commit({ axialForceN_Kn: 0, momentMy_Knm: 195, momentMz_Knm: 0, shearVy_Kn: 0, shearVz_Kn: 110, torsionT_Knm: 0 });
    } else if (mode === 'biaxial') {
      commit({ axialForceN_Kn: -320, momentMy_Knm: 115, momentMz_Knm: 32, shearVy_Kn: 25, shearVz_Kn: 80, torsionT_Knm: 8 });
    } else {
      commit({ axialForceN_Kn: -1250, momentMy_Knm: 65, momentMz_Knm: 15, shearVy_Kn: 0, shearVz_Kn: 45, torsionT_Knm: 0 });
    }
  };

  const cls = result?.classification;
  const isBlocked = cls && !cls.isPlasticAllowed;

  return (
    <div className="space-y-4">
      {/* Classification Guardrail Status Strip */}
      {cls && (
        <div
          className={`rounded-xl border p-3 text-xs ${
            isBlocked
              ? 'border-amber-500/60 bg-amber-500/10 text-[var(--md-sys-color-on-surface)]'
              : 'border-emerald-500/40 bg-emerald-500/5 text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              {isBlocked ? (
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold flex items-center gap-2 flex-wrap">
                  <span>{cls.classLabel}</span>
                  <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                    · {cls.aiscEquivalent} ({sa.designCode})
                  </span>
                </div>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 leading-relaxed">
                  {isBlocked
                    ? cls.plasticBlockedReason
                    : `Full plastic hinge & N–M interaction allowed (${cls.governingPart}: flange c/t=${cls.flangeSlenderness} ≤ ${cls.flangeLimitClass2}, web c/t=${cls.webSlenderness} ≤ ${cls.webLimitClass2}).`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shape & Standard Steel Catalogue Selector */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold font-sans text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <span>Cross-Section Shape &amp; Steel Catalogue</span>
          </div>
          <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
            {isImp ? 'US Display (in / ksi / kip)' : 'SI Units (mm / MPa / kN)'}
          </span>
        </div>

        {/* Shape Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {SHAPE_OPTIONS.map((opt) => {
            const active = sa.shape === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectShape(opt.id)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-mono font-semibold border transition-all cursor-pointer whitespace-nowrap truncate ${
                  active
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]'
                    : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Standard Steel Catalogue Preset Dropdown */}
        <div>
          <label className="block text-[11px] font-mono font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
            Preset Steel Catalogue (Auto-Populates Section Dimensions)
          </label>
          <select
            value={sa.presetId || 'custom'}
            onChange={(e) => handleSelectCatalogue(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg text-xs font-mono bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
          >
            <option value="custom">— Custom User Dimensions —</option>
            {STEEL_SECTION_CATALOGUE.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · h={item.depthH_Mm}×b={item.widthB_Mm} mm ({item.massKgPerM} kg/m)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Collapsible Group 1: Geometry Dimensions */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('geometry')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>01. Cross-Section Dimensions (mm)</span>
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.geometry ? 'rotate-180' : ''}`} />
        </button>

        {openSections.geometry && (
          <div className="p-3.5 space-y-3 border-t border-[var(--md-sys-color-outline-variant)]">
            {sa.shape !== 'custom-polygon' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    {sa.shape === 'circular' ? 'Outer Diameter D (mm)' : 'Overall Depth h (mm)'}
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={1}
                    value={sa.depthH_Mm}
                    onChange={(e) => commit({ presetId: 'custom', depthH_Mm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
                  />
                  {isImp && (
                    <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      ≈ {(sa.depthH_Mm / 25.4).toFixed(2)} in
                    </div>
                  )}
                </div>

                {sa.shape !== 'circular' && (
                  <div>
                    <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Flange / Total Width b (mm)
                    </label>
                    <input
                      type="number"
                      min={10}
                      step={1}
                      value={sa.widthB_Mm}
                      onChange={(e) => commit({ presetId: 'custom', widthB_Mm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
                    />
                    {isImp && (
                      <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                        ≈ {(sa.widthB_Mm / 25.4).toFixed(2)} in
                      </div>
                    )}
                  </div>
                )}

                {sa.shape === 'hollow-box' && (
                  <div className="col-span-2">
                    <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Uniform Wall Thickness t (mm)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={0.5}
                      value={sa.wallThicknessT_Mm}
                      onChange={(e) => commit({ presetId: 'custom', wallThicknessT_Mm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
                    />
                  </div>
                )}

                {(sa.shape === 'i-beam' || sa.shape === 't-section' || sa.shape === 'channel') && (
                  <>
                    <div>
                      <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                        Web Thickness t_w (mm)
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={0.2}
                        value={sa.webThicknessTw_Mm}
                        onChange={(e) => commit({ presetId: 'custom', webThicknessTw_Mm: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                        Flange Thickness t_f (mm)
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={0.2}
                        value={sa.flangeThicknessTf_Mm}
                        onChange={(e) => commit({ presetId: 'custom', flangeThicknessTf_Mm: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                    Polygon Perimeter Vertices (y, z in mm)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => commit({ polygonPointsMm: createDefaultCustomPolygon() })}
                      className="px-2 py-1 rounded text-[10px] font-mono border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                    >
                      Reset L-Angle
                    </button>
                    <button
                      type="button"
                      onClick={handleAddVertex}
                      className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Pt
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto border border-[var(--md-sys-color-outline-variant)] rounded-lg divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {(sa.polygonPointsMm || []).map((pt, idx) => (
                    <div key={pt.id} className="grid grid-cols-12 gap-1.5 items-center px-2 py-1 text-xs font-mono">
                      <span className="col-span-2 text-[10px] font-bold text-[var(--md-sys-color-primary)]">V{idx + 1}</span>
                      <input
                        type="number"
                        value={pt.yMm}
                        onChange={(e) => handleUpdateVertex(pt.id, 'yMm', parseFloat(e.target.value))}
                        className="col-span-4 px-1.5 py-1 rounded bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-right tabular-nums"
                        aria-label={`Vertex ${idx + 1} Y`}
                      />
                      <input
                        type="number"
                        value={pt.zMm}
                        onChange={(e) => handleUpdateVertex(pt.id, 'zMm', parseFloat(e.target.value))}
                        className="col-span-4 px-1.5 py-1 rounded bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-right tabular-nums"
                        aria-label={`Vertex ${idx + 1} Z`}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteVertex(pt.id)}
                        disabled={(sa.polygonPointsMm?.length || 0) <= 3}
                        className="col-span-2 flex justify-center text-rose-500 disabled:opacity-30 cursor-pointer"
                        title="Remove vertex"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Group 2: Material & Code Classification */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('material')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
        >
          <span>02. Material Strength &amp; Governing Standard</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.material ? 'rotate-180' : ''}`} />
        </button>

        {openSections.material && (
          <div className="p-3.5 space-y-3 border-t border-[var(--md-sys-color-outline-variant)]">
            <div className="grid grid-cols-3 gap-2">
              {(['Eurocode-3', 'AISC-360', 'BNBC-2020'] as SectionStandardCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() =>
                    commit({
                      designCode: code,
                      gammaM0: code === 'Eurocode-3' ? 1.0 : 1.11,
                    })
                  }
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                    sa.designCode === code
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)]'
                      : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Yield f_y (MPa)
                </label>
                <input
                  type="number"
                  min={100}
                  step={5}
                  value={sa.fyMpa}
                  onChange={(e) => commit({ fyMpa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
                />
                {isImp && (
                  <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    {(sa.fyMpa * 0.145038).toFixed(1)} ksi
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Modulus E (GPa)
                </label>
                <input
                  type="number"
                  min={10}
                  step={5}
                  value={sa.elasticModulusGpa}
                  onChange={(e) => commit({ elasticModulusGpa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Factor γ_M0
                </label>
                <input
                  type="number"
                  min={0.9}
                  step={0.05}
                  value={sa.gammaM0}
                  onChange={(e) => commit({ gammaM0: parseFloat(e.target.value) || 1.0 })}
                  className="w-full px-2 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Group 3: Applied Internal Forces */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('loads')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>03. Applied Internal Forces (N, M_y, M_z, V, T)</span>
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.loads ? 'rotate-180' : ''}`} />
        </button>

        {openSections.loads && (
          <div className="p-3.5 space-y-3 border-t border-[var(--md-sys-color-outline-variant)]">
            {/* Quick Load Case Strip */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyLoadCasePreset('beam-column')}
                className="px-2 py-1 rounded text-[10px] font-mono border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] cursor-pointer"
              >
                Beam-Column
              </button>
              <button
                type="button"
                onClick={() => applyLoadCasePreset('pure-moment')}
                className="px-2 py-1 rounded text-[10px] font-mono border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] cursor-pointer"
              >
                Major Flexure
              </button>
              <button
                type="button"
                onClick={() => applyLoadCasePreset('biaxial')}
                className="px-2 py-1 rounded text-[10px] font-mono border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] cursor-pointer"
              >
                Biaxial + Torsion
              </button>
              <button
                type="button"
                onClick={() => applyLoadCasePreset('high-compression')}
                className="px-2 py-1 rounded text-[10px] font-mono border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] cursor-pointer"
              >
                Heavy Axial
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Axial Force N (kN) <span className="opacity-70">(−Comp / +Tens)</span>
                </label>
                <input
                  type="number"
                  step={10}
                  value={sa.axialForceN_Kn}
                  onChange={(e) => commit({ axialForceN_Kn: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
                />
                {isImp && (
                  <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    {(sa.axialForceN_Kn * 0.224809).toFixed(1)} kip
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Major Moment M_y (kN·m)
                </label>
                <input
                  type="number"
                  step={5}
                  value={sa.momentMy_Knm}
                  onChange={(e) => commit({ momentMy_Knm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
                />
                {isImp && (
                  <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    {(sa.momentMy_Knm * 0.737562).toFixed(1)} kip·ft
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Minor Moment M_z (kN·m)
                </label>
                <input
                  type="number"
                  step={2}
                  value={sa.momentMz_Knm}
                  onChange={(e) => commit({ momentMz_Knm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Vertical Shear V_z (kN)
                </label>
                <input
                  type="number"
                  step={5}
                  value={sa.shearVz_Kn}
                  onChange={(e) => commit({ shearVz_Kn: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Horizontal Shear V_y (kN)
                </label>
                <input
                  type="number"
                  step={2}
                  value={sa.shearVy_Kn}
                  onChange={(e) => commit({ shearVy_Kn: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Torsion Moment T (kN·m)
                </label>
                <input
                  type="number"
                  step={1}
                  value={sa.torsionT_Knm}
                  onChange={(e) => commit({ torsionT_Knm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   KPI SUMMARY STRIP (4 M3 CARDS)
------------------------------------------------------------- */
export const SectionAnalyzerMetrics: React.FC<{
  result: SectionAnalyzerResult;
  activeWorkspace?: CivilWorkspace;
}> = ({ result, activeWorkspace }) => {
  const isImp = activeWorkspace?.unitPreferences?.systemPreset === 'imperial';
  const cls = result.classification;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {/* KPI 1: Area & Major Inertia */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-3.5">
        <div className="text-[11px] font-mono font-semibold text-[var(--md-sys-color-on-surface-variant)]">
          Section Properties (A / I_y)
        </div>
        <div className="text-lg font-mono font-extrabold tabular-nums text-[var(--md-sys-color-on-surface)] mt-1">
          {isImp
            ? `${(result.areaCm2 * 0.155).toFixed(2)} in²`
            : `${result.areaCm2.toFixed(1)} cm²`}
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5 tabular-nums">
          I_y = {isImp ? `${(result.iyCm4 * 0.024025).toFixed(1)} in⁴` : `${result.iyCm4.toFixed(0)} cm⁴`} · W_pl = {result.wplYCm3.toFixed(0)} cm³
        </div>
      </div>

      {/* KPI 2: Peak Elastic & Shear Stress */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-3.5">
        <div className="text-[11px] font-mono font-semibold text-[var(--md-sys-color-on-surface-variant)]">
          Peak Stress (σ_vM / τ_max)
        </div>
        <div className="text-lg font-mono font-extrabold tabular-nums text-[var(--md-sys-color-on-surface)] mt-1">
          {isImp
            ? `${(result.vonMisesMaxMpa * 0.145038).toFixed(1)} ksi`
            : `${result.vonMisesMaxMpa.toFixed(1)} MPa`}
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5 tabular-nums">
          σ_N+M = {result.sigmaAbsMaxMpa.toFixed(1)} MPa · τ_max = {result.tauTotalMaxMpa.toFixed(1)} MPa
        </div>
      </div>

      {/* KPI 3: Classification & PNA Shift */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-3.5">
        <div className="text-[11px] font-mono font-semibold text-[var(--md-sys-color-on-surface-variant)]">
          Code Class &amp; PNA Shift
        </div>
        <div
          className={`text-lg font-mono font-extrabold mt-1 flex items-center gap-1.5 ${
            cls.isPlasticAllowed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {!cls.isPlasticAllowed && <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>Class {cls.sectionClass}</span>
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5 tabular-nums">
          {cls.isPlasticAllowed
            ? `z_PNA = ${result.plasticNeutralAxisZMm >= 0 ? '+' : ''}${result.plasticNeutralAxisZMm.toFixed(1)} mm`
            : 'Plastic blocked (Elastic limit)'}
        </div>
      </div>

      {/* KPI 4: Governing Utilization DCR */}
      <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] p-3.5">
        <div className="text-[11px] font-mono font-semibold text-[var(--md-sys-color-on-surface-variant)]">
          {cls.isPlasticAllowed ? 'Plastic N–M DCR (η)' : 'Elastic Yield DCR (η)'}
        </div>
        <div
          className={`text-lg font-mono font-extrabold tabular-nums mt-1 ${
            result.governingDcr > 1.0
              ? 'text-rose-600 dark:text-rose-400'
              : result.governingDcr > 0.85
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {(result.governingDcr * 100).toFixed(1)}%
        </div>
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5 tabular-nums">
          M_N,Rd = {cls.isPlasticAllowed ? `${result.mNyReducedRdKnm.toFixed(1)} kN·m` : `${result.mElYRdKnm.toFixed(1)} kN·m (El)`}
        </div>
      </div>
    </div>
  );
};
