import React from 'react';
import {
  EngineeringModuleId,
  CivilWorkspace,
} from '../types/civil';
import {
  CalculationEnvelope,
  BeamAnalysisResult,
  BearingAnalysisResult,
  ConcreteMixResult,
  ChannelHydraulicsResult,
  ConcreteMaterialResult,
  RebarBBSResult,
  MasonryResult,
  EarthworkResult,
  BOQResult,
  RateAnalysisResult,
  ContinuousBeamResult,
  PileCapacityResult,
  PipeHydraulicsResult,
  getCurrencySymbol,
} from '../utils/calculations';
import { FrameTruss2DResult } from '../utils/frameSolver2d';
import { SectionAnalyzerResult } from '../utils/sectionMechanics';
import { RcColumnDesignResult } from '../utils/rcColumnEngine';
import { StrutAndTieResult } from '../utils/strutAndTieEngine';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export interface AnalyticalDenseTableProps {
  activeModule: EngineeringModuleId;
  activeWorkspace: CivilWorkspace;
  currentEnvelope: CalculationEnvelope<any>;
  isCompact?: boolean;
  searchQuery?: string;
  className?: string;
}

export const AnalyticalDenseTable: React.FC<AnalyticalDenseTableProps> = ({
  activeModule,
  activeWorkspace,
  currentEnvelope,
  isCompact = false,
  searchQuery = '',
  className = '',
}) => {
  const result = currentEnvelope.result;
  const status = currentEnvelope.status;

  const matchesSearch = (terms: (string | number | undefined)[]) => {
    if (!searchQuery || !searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return terms.some((t) => t !== undefined && String(t).toLowerCase().includes(q));
  };

  const renderStatusBadge = (st: string) => {
    switch (st) {
      case 'zero_baseline':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Info className="w-3 h-3 text-amber-500" />
            <span>0 BASELINE ACTIVE</span>
          </span>
        );
      case 'valid':
      case 'nominal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>CAPACITY OK</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>CHECK LIMIT</span>
          </span>
        );
      case 'critical':
      case 'invalid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span>EXCEEDED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Info className="w-3 h-3" />
            <span>{st.toUpperCase()}</span>
          </span>
        );
    }
  };

  const cellPadding = isCompact ? 'py-1 px-2 text-[11px]' : 'py-1.5 px-2.5 text-xs';

  if (!result) {
    return (
      <div className="p-6 text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] border border-dashed border-[var(--md-sys-color-outline-variant)] rounded-lg">
        No active analytical convergence result. Please verify input parameters.
      </div>
    );
  }

  const hasZeroBaseline = (currentEnvelope.status as string) === 'zero_baseline' || currentEnvelope.issues.some((iss) => iss.message.includes('Zero Baseline') || iss.message.includes('currently 0'));

  return (
    <div className={`space-y-3 font-mono ${className}`}>
      {hasZeroBaseline && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-mono">
          <Info className="w-4 h-4 shrink-0 text-amber-500" />
          <div className="flex-1">
            <span className="font-bold">[0 VALUE ACTIVE]</span> Baseline Standby: One or more parameters are currently zero. Enter structural dimensions or load standard preset to run full capacity simulation.
          </div>
        </div>
      )}
      {/* 1. BEAM ANALYSIS DENSE SCHEDULE */}
      {activeModule === 'beam-analysis' && (() => {
        const beamRes = result as BeamAnalysisResult;
        const p = activeWorkspace.beam;
        return (
          <div className="space-y-2.5">
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Analytical Parameter</th>
                    <th className={`${cellPadding} text-center`}>Symbol</th>
                    <th className={`${cellPadding} text-right`}>Computed Value</th>
                    <th className={`${cellPadding} text-center`}>Unit</th>
                    <th className={`${cellPadding} text-center`}>SI Base Eq.</th>
                    <th className={`${cellPadding} text-center`}>Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                  <tr>
                    <td className={`${cellPadding} font-semibold`}>Clear Span Length</td>
                    <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>L</td>
                    <td className={`${cellPadding} text-right font-bold`}>{p.spanLengthM.toFixed(3)}</td>
                    <td className={`${cellPadding} text-center`}>m</td>
                    <td className={`${cellPadding} text-center opacity-70`}>{p.spanLengthM.toFixed(3)} m</td>
                    <td className={`${cellPadding} text-center`}>—</td>
                  </tr>
                  <tr>
                    <td className={`${cellPadding} font-semibold`}>Max Flexural Bending Moment</td>
                    <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>M_max</td>
                    <td className={`${cellPadding} text-right font-bold text-[var(--md-sys-color-primary)]`}>{beamRes.maxMomentKnm.toFixed(2)}</td>
                    <td className={`${cellPadding} text-center`}>kN·m</td>
                    <td className={`${cellPadding} text-center opacity-70`}>{(beamRes.maxMomentKnm * 1000).toLocaleString()} N·m</td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge(beamRes.status)}</td>
                  </tr>
                  <tr>
                    <td className={`${cellPadding} font-semibold`}>Max Vertical Shear Force</td>
                    <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>V_max</td>
                    <td className={`${cellPadding} text-right font-bold`}>{beamRes.maxShearKn.toFixed(2)}</td>
                    <td className={`${cellPadding} text-center`}>kN</td>
                    <td className={`${cellPadding} text-center opacity-70`}>{(beamRes.maxShearKn * 1000).toLocaleString()} N</td>
                    <td className={`${cellPadding} text-center`}>—</td>
                  </tr>
                  <tr>
                    <td className={`${cellPadding} font-semibold`}>Left Support Reaction</td>
                    <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>R_A</td>
                    <td className={`${cellPadding} text-right font-bold`}>{beamRes.reactionLeftKn.toFixed(2)}</td>
                    <td className={`${cellPadding} text-center`}>kN</td>
                    <td className={`${cellPadding} text-center opacity-70`}>{(beamRes.reactionLeftKn * 1000).toLocaleString()} N</td>
                    <td className={`${cellPadding} text-center`}>—</td>
                  </tr>
                  <tr>
                    <td className={`${cellPadding} font-semibold`}>Right Support Reaction</td>
                    <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>R_B</td>
                    <td className={`${cellPadding} text-right font-bold`}>{beamRes.reactionRightKn.toFixed(2)}</td>
                    <td className={`${cellPadding} text-center`}>kN</td>
                    <td className={`${cellPadding} text-center opacity-70`}>{(beamRes.reactionRightKn * 1000).toLocaleString()} N</td>
                    <td className={`${cellPadding} text-center`}>—</td>
                  </tr>
                  <tr>
                    <td className={`${cellPadding} font-semibold`}>Maximum Midspan Deflection</td>
                    <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>δ_max</td>
                    <td className={`${cellPadding} text-right font-bold`}>{beamRes.maxDeflectionMm.toFixed(3)}</td>
                    <td className={`${cellPadding} text-center`}>mm</td>
                    <td className={`${cellPadding} text-center opacity-70`}>{(beamRes.maxDeflectionMm * 0.001).toFixed(6)} m</td>
                    <td className={`${cellPadding} text-center`}>
                      {beamRes.maxDeflectionMm <= beamRes.allowableDeflectionMm ? renderStatusBadge('nominal') : renderStatusBadge('critical')}
                    </td>
                  </tr>
                  <tr>
                    <td className={`${cellPadding} font-semibold`}>Allowable Serviceability Deflection Limit (L/360)</td>
                    <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>δ_allow</td>
                    <td className={`${cellPadding} text-right font-bold`}>{beamRes.allowableDeflectionMm.toFixed(3)}</td>
                    <td className={`${cellPadding} text-center`}>mm</td>
                    <td className={`${cellPadding} text-center opacity-70`}>{(beamRes.allowableDeflectionMm * 0.001).toFixed(6)} m</td>
                    <td className={`${cellPadding} text-center`}>Service Limit</td>
                  </tr>
                  <tr>
                    <td className={`${cellPadding} font-semibold`}>Extreme Fiber Bending Stress</td>
                    <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>f_b</td>
                    <td className={`${cellPadding} text-right font-bold`}>{beamRes.bendingStressMpa.toFixed(2)}</td>
                    <td className={`${cellPadding} text-center`}>MPa</td>
                    <td className={`${cellPadding} text-center opacity-70`}>{(beamRes.bendingStressMpa * 1e6).toLocaleString()} Pa</td>
                    <td className={`${cellPadding} text-center`}>
                      {beamRes.bendingStressMpa <= p.allowableStressMpa ? renderStatusBadge('nominal') : renderStatusBadge('critical')}
                    </td>
                  </tr>
                  <tr className="bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-bold`}>Stress Utilization Demand/Capacity Ratio</td>
                    <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)] font-bold`}>D/C</td>
                    <td className={`${cellPadding} text-right font-black text-sm`}>{(beamRes.utilizationRatio * 100).toFixed(1)}%</td>
                    <td className={`${cellPadding} text-center`}>ratio</td>
                    <td className={`${cellPadding} text-center opacity-70`}>{beamRes.utilizationRatio.toFixed(4)}</td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge(beamRes.status)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Discretized Station Points Matrix (for engineering check) */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <div className="p-2 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Discretized Span Station Point Matrix (SFD / BMD / Deflection Envelope)
                </span>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  {beamRes.points.length} nodes computed
                </span>
              </div>
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Station x (m)</th>
                    <th className={`${cellPadding} text-right`}>Shear V (kN)</th>
                    <th className={`${cellPadding} text-right`}>Moment M (kN·m)</th>
                    <th className={`${cellPadding} text-right`}>Deflection δ (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {beamRes.points.filter((_, idx) => idx % Math.ceil(beamRes.points.length / 8) === 0 || idx === beamRes.points.length - 1).map((pt, i) => (
                    <tr key={i} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                      <td className={`${cellPadding} font-bold`}>{pt.x.toFixed(2)} m</td>
                      <td className={`${cellPadding} text-right`}>{pt.shearKn.toFixed(2)}</td>
                      <td className={`${cellPadding} text-right font-semibold text-[var(--md-sys-color-primary)]`}>{pt.momentKnm.toFixed(2)}</td>
                      <td className={`${cellPadding} text-right`}>{pt.deflectionMm.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 2. BEARING CAPACITY DENSE SCHEDULE */}
      {activeModule === 'bearing-capacity' && (() => {
        const bRes = result as BearingAnalysisResult;
        const p = activeWorkspace.bearing;
        return (
          <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                  <th className={cellPadding}>Geotechnical Variable</th>
                  <th className={`${cellPadding} text-center`}>Symbol</th>
                  <th className={`${cellPadding} text-right`}>Design Value</th>
                  <th className={`${cellPadding} text-center`}>Unit</th>
                  <th className={`${cellPadding} text-center`}>SI Base Readout</th>
                  <th className={`${cellPadding} text-center`}>Safety Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Footing Width × Length</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>B × L</td>
                  <td className={`${cellPadding} text-right font-bold`}>{p.footingWidthM.toFixed(2)} × {p.footingWidthM.toFixed(2)}</td>
                  <td className={`${cellPadding} text-center`}>m</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{bRes.footingAreaM2.toFixed(2)} m² plan</td>
                  <td className={`${cellPadding} text-center`}>Shape: {p.footingShape}</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Embedment Depth</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>D_f</td>
                  <td className={`${cellPadding} text-right font-bold`}>{p.embedmentDepthM.toFixed(2)}</td>
                  <td className={`${cellPadding} text-center`}>m</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{p.embedmentDepthM.toFixed(2)} m</td>
                  <td className={`${cellPadding} text-center`}>Water T: {p.waterTableDepthM} m</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Soil Effective Cohesion</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>c'</td>
                  <td className={`${cellPadding} text-right font-bold`}>{p.soilCohesionKpa.toFixed(1)}</td>
                  <td className={`${cellPadding} text-center`}>kPa</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{(p.soilCohesionKpa * 1000).toLocaleString()} Pa</td>
                  <td className={`${cellPadding} text-center`}>φ = {p.frictionAngleDeg}°</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Terzaghi/Meyerhof Factors</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>N_c, N_q, N_γ</td>
                  <td className={`${cellPadding} text-right font-bold`}>
                    {bRes.nc.toFixed(2)} / {bRes.nq.toFixed(2)} / {bRes.nGamma.toFixed(2)}
                  </td>
                  <td className={`${cellPadding} text-center`}>dim</td>
                  <td className={`${cellPadding} text-center opacity-70`}>Bearing Factors</td>
                  <td className={`${cellPadding} text-center`}>ASTM D1194</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Ultimate Bearing Capacity</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>q_ult</td>
                  <td className={`${cellPadding} text-right font-bold`}>{bRes.ultimateBearingKpa.toFixed(1)}</td>
                  <td className={`${cellPadding} text-center`}>kPa</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{(bRes.ultimateBearingKpa * 1000).toLocaleString()} Pa</td>
                  <td className={`${cellPadding} text-center`}>Limit State</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Net Allowable Bearing Pressure</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>q_all</td>
                  <td className={`${cellPadding} text-right font-bold text-[var(--md-sys-color-primary)]`}>{bRes.allowableBearingKpa.toFixed(1)}</td>
                  <td className={`${cellPadding} text-center`}>kPa</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{(bRes.allowableBearingKpa * 1000).toLocaleString()} Pa</td>
                  <td className={`${cellPadding} text-center`}>FS = {p.factorOfSafety}</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Actual Applied Column Pressure</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>q_app</td>
                  <td className={`${cellPadding} text-right font-bold`}>{bRes.appliedPressureKpa.toFixed(1)}</td>
                  <td className={`${cellPadding} text-center`}>kPa</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{(bRes.appliedPressureKpa * 1000).toLocaleString()} Pa</td>
                  <td className={`${cellPadding} text-center`}>
                    {bRes.appliedPressureKpa <= bRes.allowableBearingKpa ? renderStatusBadge('nominal') : renderStatusBadge('critical')}
                  </td>
                </tr>
                <tr className="bg-[var(--md-sys-color-surface-container-low)]">
                  <td className={`${cellPadding} font-bold`}>Effective Factor of Safety Realized</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)] font-bold`}>FS_eff</td>
                  <td className={`${cellPadding} text-right font-black text-sm text-emerald-600 dark:text-emerald-400`}>{bRes.effectiveSafetyFactor.toFixed(2)}</td>
                  <td className={`${cellPadding} text-center`}>ratio</td>
                  <td className={`${cellPadding} text-center opacity-70`}>Required: ≥ {p.factorOfSafety}</td>
                  <td className={`${cellPadding} text-center`}>{renderStatusBadge(bRes.status)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 3. CONCRETE MATERIALS DENSE SCHEDULE */}
      {activeModule === 'concrete-materials' && (() => {
        const matRes = result as ConcreteMaterialResult;
        return (
          <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                  <th className={cellPadding}>Material Constituent</th>
                  <th className={`${cellPadding} text-right`}>Volume (m³)</th>
                  <th className={`${cellPadding} text-right`}>Volume (CFT)</th>
                  <th className={`${cellPadding} text-right`}>Mass (kg)</th>
                  <th className={`${cellPadding} text-center`}>Site Dispatch Metric</th>
                  <th className={`${cellPadding} text-center`}>Proportion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Portland Cement (OPC/PCC)</td>
                  <td className={`${cellPadding} text-right`}>{matRes.cementVolumeM3.toFixed(3)}</td>
                  <td className={`${cellPadding} text-right`}>{(matRes.cementVolumeM3 * 35.314667).toFixed(2)}</td>
                  <td className={`${cellPadding} text-right font-bold`}>{matRes.cementMassKg.toFixed(1)}</td>
                  <td className={`${cellPadding} text-center font-bold text-[var(--md-sys-color-primary)]`}>
                    {matRes.cementBags50Kg.toFixed(1)} bags (50kg)
                  </td>
                  <td className={`${cellPadding} text-center`}>1 part</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Fine Aggregate (Sand / Sylhet Sand)</td>
                  <td className={`${cellPadding} text-right font-bold`}>{matRes.sandVolumeM3.toFixed(3)}</td>
                  <td className={`${cellPadding} text-right font-bold text-amber-600 dark:text-amber-400`}>{matRes.sandCft.toFixed(1)} cft</td>
                  <td className={`${cellPadding} text-right`}>{matRes.sandMassKg.toFixed(1)}</td>
                  <td className={`${cellPadding} text-center`}>Bulk Density: 1600 kg/m³</td>
                  <td className={`${cellPadding} text-center`}>Sand ratio</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Coarse Aggregate (Stone / Shingles)</td>
                  <td className={`${cellPadding} text-right font-bold`}>{matRes.aggregateVolumeM3.toFixed(3)}</td>
                  <td className={`${cellPadding} text-right font-bold text-blue-600 dark:text-blue-400`}>{matRes.aggregateCft.toFixed(1)} cft</td>
                  <td className={`${cellPadding} text-right`}>{matRes.aggregateMassKg.toFixed(1)}</td>
                  <td className={`${cellPadding} text-center`}>Bulk Density: 1520 kg/m³</td>
                  <td className={`${cellPadding} text-center`}>Stone ratio</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Effective Mixing Water Demand</td>
                  <td className={`${cellPadding} text-right`}>{(matRes.waterDemandLiters / 1000).toFixed(3)}</td>
                  <td className={`${cellPadding} text-right`}>—</td>
                  <td className={`${cellPadding} text-right`}>{matRes.waterDemandLiters.toFixed(1)}</td>
                  <td className={`${cellPadding} text-center font-bold text-cyan-600 dark:text-cyan-400`}>
                    {matRes.waterDemandLiters.toFixed(0)} Liters
                  </td>
                  <td className={`${cellPadding} text-center`}>w/c ratio</td>
                </tr>
                <tr className="bg-[var(--md-sys-color-surface-container-low)] font-bold">
                  <td className={cellPadding}>Batch Total (Wet: {matRes.wetVolumeM3.toFixed(2)} m³ · Dry Factor: {matRes.dryVolumeFactor})</td>
                  <td className={`${cellPadding} text-right font-black`}>{matRes.totalDryVolumeWithWastageM3.toFixed(3)} m³</td>
                  <td className={`${cellPadding} text-right font-black`}>{(matRes.totalDryVolumeWithWastageM3 * 35.314667).toFixed(1)} cft</td>
                  <td className={`${cellPadding} text-right font-black`}>{(matRes.cementMassKg + matRes.sandMassKg + matRes.aggregateMassKg).toFixed(0)} kg</td>
                  <td className={`${cellPadding} text-center text-xs text-[var(--md-sys-color-primary)]`}>Code: {matRes.code}</td>
                  <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 4. CONCRETE MIX DESIGN (ACI 211.1) */}
      {activeModule === 'concrete-mix' && (() => {
        const mixRes = result as ConcreteMixResult;
        return (
          <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                  <th className={cellPadding}>Mix Design Parameter (ACI 211.1)</th>
                  <th className={`${cellPadding} text-right`}>Mass Batch (kg)</th>
                  <th className={`${cellPadding} text-right`}>Solid Vol. (m³)</th>
                  <th className={`${cellPadding} text-center`}>Jobsite Quantity</th>
                  <th className={`${cellPadding} text-center`}>Specification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Batch Water Demand</td>
                  <td className={`${cellPadding} text-right font-bold`}>{mixRes.batchWaterKg.toFixed(1)}</td>
                  <td className={`${cellPadding} text-right`}>{(mixRes.batchWaterKg / 1000).toFixed(3)}</td>
                  <td className={`${cellPadding} text-center font-bold text-cyan-600 dark:text-cyan-400`}>{mixRes.batchWaterKg.toFixed(0)} L</td>
                  <td className={`${cellPadding} text-center`}>w/c = {activeWorkspace.concrete.waterCementRatio}</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Cement Content</td>
                  <td className={`${cellPadding} text-right font-bold`}>{mixRes.batchCementKg.toFixed(1)}</td>
                  <td className={`${cellPadding} text-right`}>{(mixRes.batchCementKg / (3.15 * 1000)).toFixed(3)}</td>
                  <td className={`${cellPadding} text-center font-bold text-[var(--md-sys-color-primary)]`}>
                    {(mixRes.batchCementKg / 50).toFixed(1)} bags (50kg)
                  </td>
                  <td className={`${cellPadding} text-center`}>Sp. Gr = 3.15</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Dry Coarse Aggregate</td>
                  <td className={`${cellPadding} text-right font-bold`}>{mixRes.batchCoarseAggKg.toFixed(1)}</td>
                  <td className={`${cellPadding} text-right`}>{(mixRes.batchCoarseAggKg / (2.68 * 1000)).toFixed(3)}</td>
                  <td className={`${cellPadding} text-center`}>{(mixRes.batchCoarseAggKg / 1520 * 35.314667).toFixed(1)} cft</td>
                  <td className={`${cellPadding} text-center`}>Sp. Gr = 2.68</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Dry Fine Aggregate</td>
                  <td className={`${cellPadding} text-right font-bold`}>{mixRes.batchFineAggKg.toFixed(1)}</td>
                  <td className={`${cellPadding} text-right`}>{(mixRes.batchFineAggKg / (2.62 * 1000)).toFixed(3)}</td>
                  <td className={`${cellPadding} text-center`}>{(mixRes.batchFineAggKg / 1600 * 35.314667).toFixed(1)} cft</td>
                  <td className={`${cellPadding} text-center`}>Sp. Gr = 2.62</td>
                </tr>
                <tr className="bg-[var(--md-sys-color-surface-container-low)] font-bold">
                  <td className={cellPadding}>Batch Total (Target f'c = {activeWorkspace.concrete.targetStrengthMpa} MPa)</td>
                  <td className={`${cellPadding} text-right font-black`}>
                    {(mixRes.batchWaterKg + mixRes.batchCementKg + mixRes.batchCoarseAggKg + mixRes.batchFineAggKg).toFixed(1)} kg
                  </td>
                  <td className={`${cellPadding} text-right font-black`}>1.000 m³</td>
                  <td className={`${cellPadding} text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold`}>
                    Density ~ 2380 kg/m³
                  </td>
                  <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 5. REBAR BAR BENDING SCHEDULE (BBS) */}
      {activeModule === 'rebar-bbs' && (() => {
        const bbsRes = result as RebarBBSResult;
        return (
          <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                  <th className={cellPadding}>Mark &amp; Bar Description</th>
                  <th className={`${cellPadding} text-center`}>Dia Φ (mm)</th>
                  <th className={`${cellPadding} text-center`}>Nos</th>
                  <th className={`${cellPadding} text-right`}>Cutting L (m)</th>
                  <th className={`${cellPadding} text-right`}>Total L (m)</th>
                  <th className={`${cellPadding} text-right`}>Unit Wt (kg/m)</th>
                  <th className={`${cellPadding} text-right`}>Total Mass (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                {bbsRes.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-semibold`}>{it.description}</td>
                    <td className={`${cellPadding} text-center font-bold text-[var(--md-sys-color-primary)]`}>{it.barDiaMm} mm</td>
                    <td className={`${cellPadding} text-center`}>{it.count}</td>
                    <td className={`${cellPadding} text-right`}>{it.cuttingLengthM.toFixed(3)}</td>
                    <td className={`${cellPadding} text-right`}>{it.totalLengthM.toFixed(2)}</td>
                    <td className={`${cellPadding} text-right font-mono`}>{it.unitWeightKgPerM.toFixed(3)}</td>
                    <td className={`${cellPadding} text-right font-bold`}>{it.totalWeightKg.toFixed(1)}</td>
                  </tr>
                ))}
                <tr className="bg-[var(--md-sys-color-surface-container-low)] font-bold">
                  <td className={cellPadding} colSpan={4}>
                    BBS Cumulative Tonnage ({bbsRes.items.length} Mark Entries)
                  </td>
                  <td className={`${cellPadding} text-right font-black`}>{bbsRes.totalBarsLengthM.toFixed(1)} m</td>
                  <td className={`${cellPadding} text-right font-black`}>—</td>
                  <td className={`${cellPadding} text-right font-black text-sm text-[var(--md-sys-color-primary)]`}>
                    {bbsRes.totalSteelWeightKg.toFixed(1)} kg ({bbsRes.totalSteelTonnes.toFixed(3)} MT)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 6. MASONRY, PLASTER & FINISHES */}
      {activeModule === 'masonry-finishes' && (() => {
        const masRes = result as MasonryResult;
        return (
          <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                  <th className={cellPadding}>Masonry &amp; Finish Component</th>
                  <th className={`${cellPadding} text-right`}>Surface Area (m²)</th>
                  <th className={`${cellPadding} text-right`}>Solid Volume (m³)</th>
                  <th className={`${cellPadding} text-right`}>Brick / Tile Count</th>
                  <th className={`${cellPadding} text-center`}>Dry Mortar Demand</th>
                  <th className={`${cellPadding} text-center`}>Cement Bags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Brick Masonry Wall Body</td>
                  <td className={`${cellPadding} text-right`}>{masRes.netWallAreaM2.toFixed(2)} m²</td>
                  <td className={`${cellPadding} text-right font-bold`}>{masRes.netWallVolumeM3.toFixed(3)} m³</td>
                  <td className={`${cellPadding} text-right font-bold text-[var(--md-sys-color-primary)]`}>
                    {masRes.bricksWithWastageCount.toLocaleString()} nos
                  </td>
                  <td className={`${cellPadding} text-center`}>{masRes.mortarSandCft.toFixed(1)} cft sand</td>
                  <td className={`${cellPadding} text-center font-bold text-amber-600 dark:text-amber-400`}>
                    {masRes.mortarCementBags50Kg.toFixed(1)} bags
                  </td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Cement-Sand Wall Plastering</td>
                  <td className={`${cellPadding} text-right font-bold`}>{masRes.plasterAreaM2.toFixed(2)} m²</td>
                  <td className={`${cellPadding} text-right`}>{masRes.plasterDryVolM3.toFixed(3)} m³</td>
                  <td className={`${cellPadding} text-right`}>—</td>
                  <td className={`${cellPadding} text-center`}>{masRes.plasterSandCft.toFixed(1)} cft sand</td>
                  <td className={`${cellPadding} text-center font-bold text-amber-600 dark:text-amber-400`}>
                    {masRes.plasterCementBags.toFixed(1)} bags
                  </td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Vitrified / Ceramic Floor Tiles</td>
                  <td className={`${cellPadding} text-right font-bold`}>{masRes.floorAreaM2.toFixed(2)} m²</td>
                  <td className={`${cellPadding} text-right`}>—</td>
                  <td className={`${cellPadding} text-right font-bold text-emerald-600 dark:text-emerald-400`}>
                    {masRes.tilesWithWastageCount} pcs ({masRes.tileBoxesCount} boxes)
                  </td>
                  <td className={`${cellPadding} text-center`}>{masRes.singleTileAreaM2.toFixed(4)} m²/tile</td>
                  <td className={`${cellPadding} text-center`}>Tile Adhesive</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 7. EARTHWORK & ROAD ALIGNMENT */}
      {activeModule === 'earthwork-alignment' && (() => {
        const earthRes = result as EarthworkResult;
        return (
          <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                  <th className={cellPadding}>Earthwork State Phase</th>
                  <th className={`${cellPadding} text-right`}>Volume (m³)</th>
                  <th className={`${cellPadding} text-right`}>Volume (CFT)</th>
                  <th className={`${cellPadding} text-center`}>Geotechnical Factor</th>
                  <th className={`${cellPadding} text-center`}>Jobsite Haul Trips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                <tr>
                  <td className={`${cellPadding} font-semibold`}>In-Situ Natural Bank Volume (Cut/Fill)</td>
                  <td className={`${cellPadding} text-right font-bold text-[var(--md-sys-color-primary)]`}>{earthRes.bankVolumeM3.toFixed(2)} m³</td>
                  <td className={`${cellPadding} text-right`}>{(earthRes.bankVolumeM3 * 35.314667).toFixed(1)} cft</td>
                  <td className={`${cellPadding} text-center`}>In-Situ Invariable</td>
                  <td className={`${cellPadding} text-center`}>Excavator Trench</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Loose Bulked Haul Volume</td>
                  <td className={`${cellPadding} text-right font-bold text-amber-600 dark:text-amber-400`}>{earthRes.looseVolumeM3.toFixed(2)} m³</td>
                  <td className={`${cellPadding} text-right`}>{(earthRes.looseVolumeM3 * 35.314667).toFixed(1)} cft</td>
                  <td className={`${cellPadding} text-center`}>Swell: +{((earthRes.swellFactor - 1) * 100).toFixed(0)}%</td>
                  <td className={`${cellPadding} text-center font-bold text-amber-700 dark:text-amber-300`}>
                    {earthRes.haulTruckTripsCount10M3} loads (10m³ truck)
                  </td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Compacted Embankment Volume</td>
                  <td className={`${cellPadding} text-right font-bold text-emerald-600 dark:text-emerald-400`}>{earthRes.compactedVolumeM3.toFixed(2)} m³</td>
                  <td className={`${cellPadding} text-right`}>{(earthRes.compactedVolumeM3 * 35.314667).toFixed(1)} cft</td>
                  <td className={`${cellPadding} text-center`}>Shrinkage: {earthRes.shrinkageFactor * 100}%</td>
                  <td className={`${cellPadding} text-center`}>Roller Compactor</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 8. OPEN CHANNEL HYDRAULICS */}
      {activeModule === 'open-channel' && (() => {
        const hydRes = result as ChannelHydraulicsResult;
        const p = activeWorkspace.channel;
        return (
          <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                  <th className={cellPadding}>Hydraulic Parameter</th>
                  <th className={`${cellPadding} text-center`}>Symbol</th>
                  <th className={`${cellPadding} text-right`}>Magnitude</th>
                  <th className={`${cellPadding} text-center`}>Unit</th>
                  <th className={`${cellPadding} text-center`}>SI Base Readout</th>
                  <th className={`${cellPadding} text-center`}>Manning Formula Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Discharge Flow Capacity</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>Q</td>
                  <td className={`${cellPadding} text-right font-bold text-[var(--md-sys-color-primary)]`}>{hydRes.dischargeM3ps.toFixed(3)}</td>
                  <td className={`${cellPadding} text-center`}>m³/s</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{hydRes.dischargeM3ps.toFixed(3)} cumecs</td>
                  <td className={`${cellPadding} text-center`}>Q = A × V</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Mean Flow Velocity</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>V</td>
                  <td className={`${cellPadding} text-right font-bold`}>{hydRes.velocityMps.toFixed(3)}</td>
                  <td className={`${cellPadding} text-center`}>m/s</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{(hydRes.velocityMps * 3.6).toFixed(2)} km/h</td>
                  <td className={`${cellPadding} text-center`}>V = (1/n) R^(2/3) S^(1/2)</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Wetted Flow Area</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>A</td>
                  <td className={`${cellPadding} text-right font-bold`}>{hydRes.flowAreaM2.toFixed(3)}</td>
                  <td className={`${cellPadding} text-center`}>m²</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{(hydRes.flowAreaM2 * 10.76391).toFixed(2)} sq ft</td>
                  <td className={`${cellPadding} text-center`}>A = (b + zy)y</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Wetted Perimeter</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>P</td>
                  <td className={`${cellPadding} text-right font-bold`}>{hydRes.wettedPerimeterM.toFixed(3)}</td>
                  <td className={`${cellPadding} text-center`}>m</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{hydRes.wettedPerimeterM.toFixed(3)} m</td>
                  <td className={`${cellPadding} text-center`}>P = b + 2y√(1+z²)</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Hydraulic Radius</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>R</td>
                  <td className={`${cellPadding} text-right font-bold`}>{hydRes.hydraulicRadiusM.toFixed(4)}</td>
                  <td className={`${cellPadding} text-center`}>m</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{hydRes.hydraulicRadiusM.toFixed(4)} m</td>
                  <td className={`${cellPadding} text-center`}>R = A / P</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Boundary Bed Shear Stress</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)]`}>τ_0</td>
                  <td className={`${cellPadding} text-right font-bold`}>{hydRes.shearStressPa.toFixed(2)}</td>
                  <td className={`${cellPadding} text-center`}>Pa</td>
                  <td className={`${cellPadding} text-center opacity-70`}>{hydRes.shearStressPa.toFixed(2)} N/m²</td>
                  <td className={`${cellPadding} text-center`}>τ = γ R S_0</td>
                </tr>
                <tr className="bg-[var(--md-sys-color-surface-container-low)] font-bold">
                  <td className={cellPadding}>Flow Hydrodynamic Regime &amp; Froude Number</td>
                  <td className={`${cellPadding} text-center text-[var(--md-sys-color-primary)] font-bold`}>Fr</td>
                  <td className={`${cellPadding} text-right font-black text-sm`}>{hydRes.froudeNumber.toFixed(3)}</td>
                  <td className={`${cellPadding} text-center`}>ratio</td>
                  <td className={`${cellPadding} text-center font-bold text-emerald-600 dark:text-emerald-400`}>
                    {hydRes.flowRegime}
                  </td>
                  <td className={`${cellPadding} text-center`}>{renderStatusBadge(hydRes.status)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 9. BOQ ESTIMATOR SUMMARY TABLE */}
      {activeModule === 'boq-estimator' && (() => {
        const boqRes = result as BOQResult;
        const sym = getCurrencySymbol(activeWorkspace.boq.currency);
        return (
          <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                  <th className={cellPadding}>Discipline Category</th>
                  <th className={`${cellPadding} text-center`}>Item Count</th>
                  <th className={`${cellPadding} text-right`}>Subtotal ({sym})</th>
                  <th className={`${cellPadding} text-right`}>Proportion (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                {boqRes.categorySummaries.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-semibold capitalize`}>{cat.category}</td>
                    <td className={`${cellPadding} text-center`}>{cat.itemCount}</td>
                    <td className={`${cellPadding} text-right font-bold`}>{cat.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className={`${cellPadding} text-right font-mono text-[var(--md-sys-color-primary)]`}>{cat.percentageOfSubtotal}%</td>
                  </tr>
                ))}
                <tr className="bg-[var(--md-sys-color-surface-container-low)] font-bold border-t-2 border-[var(--md-sys-color-outline)]">
                  <td className={cellPadding}>Grand Total (Contingency, Overhead &amp; Tax)</td>
                  <td className={`${cellPadding} text-center font-black`}>{boqRes.totalItemCount} items</td>
                  <td className={`${cellPadding} text-right font-black text-sm text-[var(--md-sys-color-primary)]`}>
                    {sym} {boqRes.grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`${cellPadding} text-right font-black`}>100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 10. RATE ANALYSIS SUMMARY TABLE */}
      {activeModule === 'rate-analysis' && (() => {
        const rateRes = result as RateAnalysisResult;
        return (
          <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                  <th className={cellPadding}>Trade Cost Center</th>
                  <th className={`${cellPadding} text-right`}>Subtotal ({rateRes.currencySymbol})</th>
                  <th className={`${cellPadding} text-right`}>Cost Share (%)</th>
                  <th className={`${cellPadding} text-center`}>Unit Rate per m³</th>
                  <th className={`${cellPadding} text-center`}>Unit Rate per CFT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                <tr>
                  <td className={`${cellPadding} font-semibold`}>1. Material Procurement Subtotal</td>
                  <td className={`${cellPadding} text-right font-bold`}>{rateRes.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className={`${cellPadding} text-right text-[var(--md-sys-color-primary)]`}>{rateRes.costDistributionPercent.materials}%</td>
                  <td className={`${cellPadding} text-center`}>—</td>
                  <td className={`${cellPadding} text-center`}>—</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>2. Direct Labor &amp; Skilled Craftsmanship</td>
                  <td className={`${cellPadding} text-right font-bold`}>{rateRes.laborsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className={`${cellPadding} text-right text-amber-600 dark:text-amber-400`}>{rateRes.costDistributionPercent.labor}%</td>
                  <td className={`${cellPadding} text-center`}>—</td>
                  <td className={`${cellPadding} text-center`}>—</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>3. Machinery, Mixer &amp; Scaffolding Formwork</td>
                  <td className={`${cellPadding} text-right font-bold`}>{rateRes.equipmentCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className={`${cellPadding} text-right text-blue-600 dark:text-blue-400`}>{rateRes.costDistributionPercent.equipment}%</td>
                  <td className={`${cellPadding} text-center`}>—</td>
                  <td className={`${cellPadding} text-center`}>—</td>
                </tr>
                <tr className="bg-[var(--md-sys-color-surface-container-low)] font-bold border-t-2 border-[var(--md-sys-color-outline)]">
                  <td className={cellPadding}>Composite Commercial Rate ({rateRes.workDescription})</td>
                  <td className={`${cellPadding} text-right font-black text-sm text-[var(--md-sys-color-primary)]`}>
                    {rateRes.currencySymbol} {rateRes.grandTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`${cellPadding} text-right font-black`}>100.0%</td>
                  <td className={`${cellPadding} text-center font-black text-emerald-600 dark:text-emerald-400`}>
                    {rateRes.currencySymbol} {rateRes.unitRatePerM3.toFixed(2)}/m³
                  </td>
                  <td className={`${cellPadding} text-center font-black text-cyan-600 dark:text-cyan-400`}>
                    {rateRes.currencySymbol} {rateRes.unitRatePerCft.toFixed(2)}/cft
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 11. UNIT CONVERTER MATRIX TABLE */}
      {activeModule === 'unit-converter' && (
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                <th className={cellPadding}>Measurement Category</th>
                <th className={`${cellPadding} text-center`}>Source Unit</th>
                <th className={`${cellPadding} text-right`}>Input Magnitude</th>
                <th className={`${cellPadding} text-center`}>Target Unit</th>
                <th className={`${cellPadding} text-right`}>Converted Output</th>
                <th className={`${cellPadding} text-center`}>Conversion Precision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
              <tr>
                <td className={`${cellPadding} font-semibold capitalize`}>{activeWorkspace.converter.category}</td>
                <td className={`${cellPadding} text-center font-bold text-[var(--md-sys-color-primary)]`}>{activeWorkspace.converter.fromUnit}</td>
                <td className={`${cellPadding} text-right font-mono font-bold`}>{activeWorkspace.converter.inputValue}</td>
                <td className={`${cellPadding} text-center font-bold text-emerald-600 dark:text-emerald-400`}>{activeWorkspace.converter.toUnit}</td>
                <td className={`${cellPadding} text-right font-mono font-black text-sm text-[var(--md-sys-color-primary)]`}>
                  {result.result !== undefined ? parseFloat(result.result.toPrecision(8)).toString() : '—'}
                </td>
                <td className={`${cellPadding} text-center text-xs text-[var(--md-sys-color-on-surface-variant)]`}>
                  Zero Precision Loss (SI Base Invariant)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 12. CONTINUOUS BEAM INDETERMINATE ANALYSIS SCHEDULE */}
      {activeModule === 'continuous-beam' && (() => {
        const cbRes = result as ContinuousBeamResult;
        const cbParams = activeWorkspace.continuousBeam;

        return (
          <div className="space-y-3">
            {/* Span by Span Mechanical Envelopes */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Span Index</th>
                    <th className={`${cellPadding} text-right`}>Clear Span (L)</th>
                    <th className={`${cellPadding} text-right`}>UDL (w)</th>
                    <th className={`${cellPadding} text-right`}>Point Load (P)</th>
                    <th className={`${cellPadding} text-right`}>Max Pos. Moment (+M)</th>
                    <th className={`${cellPadding} text-right`}>Max Shear (V_max)</th>
                    <th className={`${cellPadding} text-center`}>Limit State Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                  {cbRes.spans.map((span) => {
                    const spanParam = cbParams?.spans?.[span.spanIndex];
                    return (
                      <tr key={span.spanIndex} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                        <td className={`${cellPadding} font-bold text-[var(--md-sys-color-primary)]`}>
                          Span {span.spanIndex + 1}
                        </td>
                        <td className={`${cellPadding} text-right font-mono`}>{span.lengthM.toFixed(2)} m</td>
                        <td className={`${cellPadding} text-right font-mono`}>{(spanParam?.udlKnPerM ?? 0).toFixed(1)} kN/m</td>
                        <td className={`${cellPadding} text-right font-mono`}>{(spanParam?.pointLoadKn ?? 0).toFixed(1)} kN</td>
                        <td className={`${cellPadding} text-right font-mono font-bold text-emerald-600 dark:text-emerald-400`}>
                          {span.maxPositiveMomentKnm.toFixed(1)} kN·m
                        </td>
                        <td className={`${cellPadding} text-right font-mono font-bold text-sky-600 dark:text-sky-400`}>
                          {span.maxShearKn.toFixed(1)} kN
                        </td>
                        <td className={`${cellPadding} text-center`}>
                          {renderStatusBadge(status)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Governing Extreme Summary */}
                  <tr className="bg-[var(--md-sys-color-surface-container-low)] font-bold border-t-2 border-[var(--md-sys-color-outline)]">
                    <td className={cellPadding}>Continuous Envelope Maxima</td>
                    <td className={`${cellPadding} text-right font-mono font-black`}>
                      {cbRes.totalLengthM.toFixed(2)} m total
                    </td>
                    <td className={`${cellPadding} text-right`} colSpan={2}>
                      Extreme Fiber Stress: <strong className="text-[var(--md-sys-color-primary)]">{cbRes.bendingStressMpa.toFixed(1)} MPa</strong>
                    </td>
                    <td className={`${cellPadding} text-right font-black text-rose-600 dark:text-rose-400`}>
                      +M: {cbRes.maxSaggingMomentKnm.toFixed(1)} | -M: {cbRes.maxHoggingMomentKnm.toFixed(1)} kN·m
                    </td>
                    <td className={`${cellPadding} text-right font-black text-sky-600 dark:text-sky-400`}>
                      {cbRes.maxShearKn.toFixed(1)} kN
                    </td>
                    <td className={`${cellPadding} text-center font-black text-emerald-600 dark:text-emerald-400`}>
                      DCR = {(cbRes.utilizationRatio * 100).toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Support Reactions & Support Moments Sub-schedule */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Support Station</th>
                    <th className={`${cellPadding} text-center`}>Support Fixity</th>
                    <th className={`${cellPadding} text-right`}>Reaction Force (R)</th>
                    <th className={`${cellPadding} text-right`}>Support Hogging Moment (M_sup)</th>
                    <th className={`${cellPadding} text-center`}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                  {cbRes.supportMomentsKnm.map((mom, sIdx) => {
                    const rxn = cbRes.supportReactionsKn[sIdx] || 0;
                    const isEnd = sIdx === 0 || sIdx === cbRes.supportMomentsKnm.length - 1;
                    return (
                      <tr key={sIdx} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                        <td className={`${cellPadding} font-semibold`}>Support #{sIdx + 1}</td>
                        <td className={`${cellPadding} text-center font-mono`}>{isEnd ? 'Exterior Pin/Roller' : 'Continuous Intermediate'}</td>
                        <td className={`${cellPadding} text-right font-mono font-bold text-sky-600 dark:text-sky-400`}>{rxn.toFixed(1)} kN</td>
                        <td className={`${cellPadding} text-right font-mono font-bold ${mom < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          {mom.toFixed(1)} kN·m
                        </td>
                        <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 12B. 2D FRAME & TRUSS + P-DELTA MATRIX SCHEDULE */}
      {activeModule === 'frame-truss-2d' && (() => {
        const ftRes = result as FrameTruss2DResult;
        const filteredMembers = (ftRes.memberResults || []).filter((mr) =>
          matchesSearch([mr.label, mr.startLabel, mr.endLabel, mr.memberType])
        );
        const filteredNodes = (ftRes.nodalResults || []).filter((nr) =>
          matchesSearch([nr.label, nr.support])
        );

        return (
          <div className="space-y-3">
            {/* Member Envelopes & Combined Stress DCR */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <div className="p-2 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Member Internal Force Envelopes &amp; Combined Stress DCR ({ftRes.analysisMode === 'second-order-p-delta' ? '2nd-Order P-Δ' : '1st-Order Linear'})
                </span>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  α_cr = {Number.isFinite(ftRes.criticalBucklingFactorAlphaCr) ? ftRes.criticalBucklingFactorAlphaCr.toFixed(2) : '∞'} · B₂ = {ftRes.b2AmplificationFactor.toFixed(3)}×
                </span>
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Member</th>
                    <th className={`${cellPadding} text-center`}>Connectivity</th>
                    <th className={`${cellPadding} text-right`}>L (m)</th>
                    <th className={`${cellPadding} text-right`}>Axial N (kN)</th>
                    <th className={`${cellPadding} text-right`}>|V|_max (kN)</th>
                    <th className={`${cellPadding} text-right`}>|M|_max (kN·m)</th>
                    <th className={`${cellPadding} text-right`}>σ_comb (MPa)</th>
                    <th className={`${cellPadding} text-center`}>DCR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-mono tabular-nums">
                  {filteredMembers.map((mr) => {
                    const mStatus = mr.dcrRatio > 1.0 ? 'critical' : mr.dcrRatio > 0.85 ? 'warning' : 'nominal';
                    return (
                      <tr key={mr.memberId} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                        <td className={`${cellPadding} font-bold text-[var(--md-sys-color-primary)]`}>
                          {mr.label} <span className="text-[10px] opacity-70 uppercase">({mr.memberType})</span>
                        </td>
                        <td className={`${cellPadding} text-center`}>{mr.startLabel} → {mr.endLabel}</td>
                        <td className={`${cellPadding} text-right`}>{mr.lengthM.toFixed(2)}</td>
                        <td className={`${cellPadding} text-right font-semibold ${mr.axialStartKn >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {mr.axialStartKn >= 0 ? `+${mr.axialStartKn.toFixed(1)} (T)` : `${mr.axialStartKn.toFixed(1)} (C)`}
                        </td>
                        <td className={`${cellPadding} text-right`}>{mr.maxAbsShearKn.toFixed(2)}</td>
                        <td className={`${cellPadding} text-right font-semibold`}>{mr.maxAbsMomentKnm.toFixed(2)}</td>
                        <td className={`${cellPadding} text-right`}>{mr.combinedStressMpa.toFixed(1)}</td>
                        <td className={`${cellPadding} text-center`}>
                          <div className="inline-flex items-center gap-1.5">
                            <span>{(mr.dcrRatio * 100).toFixed(1)}%</span>
                            {renderStatusBadge(mStatus)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Nodal Displacements & Support Reactions */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <div className="p-2 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Nodal Displacements &amp; Support Reactions
                </span>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  Equilibrium Residual: {ftRes.equilibriumResidualKn.toExponential(2)} kN
                </span>
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Node</th>
                    <th className={`${cellPadding} text-center`}>Support</th>
                    <th className={`${cellPadding} text-right`}>ux (mm)</th>
                    <th className={`${cellPadding} text-right`}>uy (mm)</th>
                    <th className={`${cellPadding} text-right`}>θz (mrad)</th>
                    <th className={`${cellPadding} text-right`}>Rx (kN)</th>
                    <th className={`${cellPadding} text-right`}>Ry (kN)</th>
                    <th className={`${cellPadding} text-right`}>Mz (kN·m)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-mono tabular-nums">
                  {filteredNodes.map((nr) => (
                    <tr key={nr.nodeId} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                      <td className={`${cellPadding} font-bold text-[var(--md-sys-color-primary)]`}>{nr.label}</td>
                      <td className={`${cellPadding} text-center uppercase text-[10px]`}>{nr.support}</td>
                      <td className={`${cellPadding} text-right`}>{nr.uxMm.toFixed(3)}</td>
                      <td className={`${cellPadding} text-right`}>{nr.uyMm.toFixed(3)}</td>
                      <td className={`${cellPadding} text-right`}>{nr.rzMrad.toFixed(3)}</td>
                      <td className={`${cellPadding} text-right font-semibold`}>{nr.reactionFxKn.toFixed(2)}</td>
                      <td className={`${cellPadding} text-right font-semibold`}>{nr.reactionFyKn.toFixed(2)}</td>
                      <td className={`${cellPadding} text-right font-semibold`}>{nr.reactionMzKnm.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 12C. SECTION STRESSES & PLASTIC N-M INTERACTION SCHEDULE */}
      {activeModule === 'section-analyzer' && (() => {
        const saRes = result as SectionAnalyzerResult;
        const filteredCorners = (saRes.cornerStresses || []).filter((c) =>
          matchesSearch([c.label])
        );
        return (
          <div className="space-y-3">
            {/* Classification & Geometric Properties Table */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Section Property / Capacity Metric</th>
                    <th className={`${cellPadding} text-center`}>Symbol</th>
                    <th className={`${cellPadding} text-right`}>Computed Value</th>
                    <th className={`${cellPadding} text-center`}>Unit</th>
                    <th className={cellPadding}>Notes / Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-mono tabular-nums">
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Cross-Sectional Area</td>
                    <td className={`${cellPadding} text-center`}>A</td>
                    <td className={`${cellPadding} text-right font-bold`}>{saRes.areaCm2.toFixed(2)}</td>
                    <td className={`${cellPadding} text-center`}>cm²</td>
                    <td className={`${cellPadding} font-sans text-xs text-[var(--md-sys-color-on-surface-variant)]`}>Fiber Δ: {saRes.numericalAreaErrorPct.toFixed(2)}% ({saRes.massKgPerM.toFixed(1)} kg/m)</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Centroid Coordinates</td>
                    <td className={`${cellPadding} text-center`}>(ȳ, z̄)</td>
                    <td className={`${cellPadding} text-right`}>({saRes.centroidYMm.toFixed(1)}, {saRes.centroidZMm.toFixed(1)})</td>
                    <td className={`${cellPadding} text-center`}>mm</td>
                    <td className={`${cellPadding} font-sans text-xs text-[var(--md-sys-color-on-surface-variant)]`}>From bounding box bottom-left</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Second Moments of Area</td>
                    <td className={`${cellPadding} text-center`}>I_y / I_z</td>
                    <td className={`${cellPadding} text-right font-bold`}>{saRes.iyCm4.toFixed(1)} / {saRes.izCm4.toFixed(1)}</td>
                    <td className={`${cellPadding} text-center`}>cm⁴</td>
                    <td className={`${cellPadding} font-sans text-xs text-[var(--md-sys-color-on-surface-variant)]`}>I_y fiber Δ: {saRes.numericalIyErrorPct.toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Radii of Gyration</td>
                    <td className={`${cellPadding} text-center`}>r_y / r_z</td>
                    <td className={`${cellPadding} text-right`}>{saRes.ryMm.toFixed(1)} / {saRes.rzMm.toFixed(1)}</td>
                    <td className={`${cellPadding} text-center`}>mm</td>
                    <td className={`${cellPadding} font-sans text-xs text-[var(--md-sys-color-on-surface-variant)]`}>Major / minor axis</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Elastic & Plastic Moduli (Major)</td>
                    <td className={`${cellPadding} text-center`}>W_el,y / W_pl,y</td>
                    <td className={`${cellPadding} text-right font-bold`}>{saRes.welYMinCm3.toFixed(1)} / {saRes.wplYCm3.toFixed(1)}</td>
                    <td className={`${cellPadding} text-center`}>cm³</td>
                    <td className={`${cellPadding} font-sans text-xs text-[var(--md-sys-color-on-surface-variant)]`}>Shape factor k_y = {saRes.shapeFactorY.toFixed(3)}</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Torsion Constant</td>
                    <td className={`${cellPadding} text-center`}>J</td>
                    <td className={`${cellPadding} text-right`}>{saRes.torsionConstantJCm4.toFixed(2)}</td>
                    <td className={`${cellPadding} text-center`}>cm⁴</td>
                    <td className={`${cellPadding} font-sans text-xs text-[var(--md-sys-color-on-surface-variant)]`}>Saint-Venant closed/thin-walled J</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Section Classification ({saRes.designCode})</td>
                    <td className={`${cellPadding} text-center`}>Class</td>
                    <td className={`${cellPadding} text-right font-bold`}>{saRes.classification.classLabel}</td>
                    <td className={`${cellPadding} text-center`}>—</td>
                    <td className={`${cellPadding} font-sans text-xs text-[var(--md-sys-color-on-surface-variant)]`}>AISC: {saRes.classification.aiscEquivalent} · {saRes.classification.governingPart}</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Shifted Plastic Neutral Axis (PNA)</td>
                    <td className={`${cellPadding} text-center`}>z_PNA</td>
                    <td className={`${cellPadding} text-right`}>{saRes.plasticNeutralAxisZMm.toFixed(1)} ({saRes.plasticNeutralAxisFromBottomMm.toFixed(1)} mm soffit)</td>
                    <td className={`${cellPadding} text-center`}>mm</td>
                    <td className={`${cellPadding} font-sans text-xs text-[var(--md-sys-color-on-surface-variant)]`}>Reduced M_N,y,Rd = {saRes.mNyReducedRdKnm.toFixed(1)} kN·m</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Design Axial & Plastic Moment Resistance</td>
                    <td className={`${cellPadding} text-center`}>N_pl,Rd / M_pl,y,Rd</td>
                    <td className={`${cellPadding} text-right font-bold`}>{saRes.nPlRdKn.toFixed(1)} kN / {saRes.mPlYRdKnm.toFixed(1)} kN·m</td>
                    <td className={`${cellPadding} text-center`}>kN / kN·m</td>
                    <td className={`${cellPadding} font-sans text-xs text-[var(--md-sys-color-on-surface-variant)]`}>M_el,y,Rd = {saRes.mElYRdKnm.toFixed(1)} kN·m, V_pl,z,Rd = {saRes.vPlZRdKn.toFixed(1)} kN</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Corner / Extreme Fiber Stress Audit */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <div className="px-3 py-2 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Extreme Fiber & Corner Stress Schedule (+σ Tension / -σ Compression)
                </span>
                <span className="text-[11px] font-mono text-[var(--md-sys-color-primary)] font-semibold">
                  f_yd = {saRes.fydMpa.toFixed(1)} MPa · Governing DCR = {(saRes.governingDcr * 100).toFixed(1)}%
                </span>
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Fiber / Vertex</th>
                    <th className={`${cellPadding} text-right`}>y (mm)</th>
                    <th className={`${cellPadding} text-right`}>z (mm)</th>
                    <th className={`${cellPadding} text-right`}>σ_normal (MPa)</th>
                    <th className={`${cellPadding} text-right`}>τ_shear (MPa)</th>
                    <th className={`${cellPadding} text-right`}>σ_vM (MPa)</th>
                    <th className={`${cellPadding} text-center`}>Yield Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-mono tabular-nums">
                  {filteredCorners.map((c, idx) => {
                    const over = c.vonMisesMpa > saRes.fydMpa + 1e-3;
                    return (
                      <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                        <td className={`${cellPadding} font-sans font-semibold`}>{c.label}</td>
                        <td className={`${cellPadding} text-right`}>{c.yMm.toFixed(1)}</td>
                        <td className={`${cellPadding} text-right`}>{c.zMm.toFixed(1)}</td>
                        <td className={`${cellPadding} text-right font-semibold ${c.sigmaMpa >= 0 ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-error)]'}`}>
                          {c.sigmaMpa >= 0 ? `+${c.sigmaMpa.toFixed(2)}` : c.sigmaMpa.toFixed(2)}
                        </td>
                        <td className={`${cellPadding} text-right`}>{c.tauMpa.toFixed(2)}</td>
                        <td className={`${cellPadding} text-right font-bold`}>{c.vonMisesMpa.toFixed(2)}</td>
                        <td className={`${cellPadding} text-center`}>{renderStatusBadge(over ? 'critical' : 'nominal')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 12D. RC COLUMN N-M INTERACTION & SLENDERNESS SCHEDULE */}
      {activeModule === 'rc-column-design' && (() => {
        const colRes = result as RcColumnDesignResult;
        const filteredBars = (colRes.bars || []).filter((b) =>
          matchesSearch([b.id, b.xMm, b.yMm])
        );
        return (
          <div className="space-y-3">
            {/* Uniaxial, Biaxial & Slenderness Summary */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Column Check / Interaction Metric ({colRes.designCode})</th>
                    <th className={`${cellPadding} text-right`}>Major Axis (X-X)</th>
                    <th className={`${cellPadding} text-right`}>Minor Axis (Y-Y)</th>
                    <th className={`${cellPadding} text-center`}>Unit / Limit</th>
                    <th className={`${cellPadding} text-center`}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-mono tabular-nums">
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Pure Axial &amp; Max Design Cutoff (P₀ / φP_n,max)</td>
                    <td className={`${cellPadding} text-right font-bold`}>{colRes.p0Kn.toFixed(1)}</td>
                    <td className={`${cellPadding} text-right font-bold`}>{colRes.phiPnMaxKn.toFixed(1)}</td>
                    <td className={`${cellPadding} text-center`}>kN (P_u = {colRes.axialLoadPu_Kn.toFixed(1)})</td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge(colRes.axialDcr <= 1.0 ? 'nominal' : 'critical')}</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Balanced Point (φP_b / φM_b)</td>
                    <td className={`${cellPadding} text-right`}>{colRes.xAxis.phiPBalancedKn.toFixed(1)} kN / {colRes.xAxis.phiMBalancedKnm.toFixed(1)} kN·m</td>
                    <td className={`${cellPadding} text-right`}>{colRes.yAxis.phiPBalancedKn.toFixed(1)} kN / {colRes.yAxis.phiMBalancedKnm.toFixed(1)} kN·m</td>
                    <td className={`${cellPadding} text-center`}>c_bx={colRes.xAxis.cBalancedMm.toFixed(0)} mm</td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Slenderness Ratio (kL_u / r) &amp; Euler P_c</td>
                    <td className={`${cellPadding} text-right`}>{colRes.xAxis.slendernessRatioKluR.toFixed(1)} (P_c={colRes.xAxis.pcEulerKn.toFixed(0)} kN)</td>
                    <td className={`${cellPadding} text-right`}>{colRes.yAxis.slendernessRatioKluR.toFixed(1)} (P_c={colRes.yAxis.pcEulerKn.toFixed(0)} kN)</td>
                    <td className={`${cellPadding} text-center`}>Limit ≤ {colRes.xAxis.slendernessLimit.toFixed(1)}</td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge(colRes.xAxis.isSlender || colRes.yAxis.isSlender ? 'warning' : 'nominal')}</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Moment Magnifier δ_ns &amp; Design M_c</td>
                    <td className={`${cellPadding} text-right font-bold`}>{colRes.xAxis.magnifierDeltaNs.toFixed(3)}× → {colRes.xAxis.magnifiedMomentKnm.toFixed(1)}</td>
                    <td className={`${cellPadding} text-right font-bold`}>{colRes.yAxis.magnifierDeltaNs.toFixed(3)}× → {colRes.yAxis.magnifiedMomentKnm.toFixed(1)}</td>
                    <td className={`${cellPadding} text-center`}>kN·m (incl. e_min)</td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge(Math.max(colRes.xAxis.uniaxialDcr, colRes.yAxis.uniaxialDcr) <= 1.0 ? 'nominal' : 'critical')}</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Design Flexural Capacity at P_u (φM_n)</td>
                    <td className={`${cellPadding} text-right font-bold text-[var(--md-sys-color-primary)]`}>{colRes.xAxis.phiMnAtPuKnm.toFixed(1)} kN·m</td>
                    <td className={`${cellPadding} text-right font-bold text-[var(--md-sys-color-primary)]`}>{colRes.yAxis.phiMnAtPuKnm.toFixed(1)} kN·m</td>
                    <td className={`${cellPadding} text-center`}>Uniaxial {(colRes.xAxis.uniaxialDcr * 100).toFixed(1)}% / {(colRes.yAxis.uniaxialDcr * 100).toFixed(1)}%</td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge(colRes.status)}</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Bresler Load Contour Biaxial Check</td>
                    <td className={`${cellPadding} text-right font-bold`}>(M_cx/φM_nx)^α + (M_cy/φM_ny)^α</td>
                    <td className={`${cellPadding} text-right font-bold`}>{(colRes.breslerContourDcr * 100).toFixed(1)}% (α={colRes.breslerAlpha.toFixed(2)})</td>
                    <td className={`${cellPadding} text-center`}>≤ 100.0%</td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge(colRes.breslerContourDcr <= 1.0 ? 'nominal' : 'critical')}</td>
                  </tr>
                  <tr className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                    <td className={`${cellPadding} font-sans font-semibold`}>Reinforcement Ratio ρ_g &amp; Tie Detailing</td>
                    <td className={`${cellPadding} text-right`}>{colRes.totalBarCount}-Ø{colRes.longitudinalBarDiaMm} ({colRes.rhoPercent.toFixed(2)}%)</td>
                    <td className={`${cellPadding} text-right`}>Ties Ø{colRes.tieBarDiaMm}@{colRes.tieSpacingMm} mm</td>
                    <td className={`${cellPadding} text-center`}>1%–8% · s_max={colRes.maxAllowedTieSpacingMm} mm</td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge(colRes.rhoOk && colRes.tieDetailingOk ? 'nominal' : 'warning')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Longitudinal Bar Coordinates Schedule */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <div className="px-3 py-2 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Discretized Longitudinal Bar Coordinates (Centroidal Origin)
                </span>
                <span className="text-[11px] font-mono text-[var(--md-sys-color-primary)] font-semibold">
                  {colRes.totalBarCount} Bars · Total A_st = {colRes.astProvidedMm2.toFixed(0)} mm²
                </span>
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Bar ID</th>
                    <th className={`${cellPadding} text-right`}>x (mm)</th>
                    <th className={`${cellPadding} text-right`}>y (mm)</th>
                    <th className={`${cellPadding} text-right`}>Area A_b (mm²)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-mono tabular-nums">
                  {filteredBars.map((b) => (
                    <tr key={b.id} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                      <td className={`${cellPadding} font-bold`}>{b.id}</td>
                      <td className={`${cellPadding} text-right`}>{b.xMm.toFixed(1)}</td>
                      <td className={`${cellPadding} text-right`}>{b.yMm.toFixed(1)}</td>
                      <td className={`${cellPadding} text-right`}>{b.areaMm2.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 12E. STRUT-AND-TIE MODEL (STM) TRUSS EQUILIBRIUM SCHEDULE */}
      {activeModule === 'strut-and-tie' && (() => {
        const stmRes = result as StrutAndTieResult;
        const filteredMembers = (stmRes.memberResults || []).filter((m) =>
          matchesSearch([m.label, m.startLabel, m.endLabel, m.role])
        );
        const filteredNodes = (stmRes.nodeResults || []).filter((n) =>
          matchesSearch([n.label, n.support])
        );
        return (
          <div className="space-y-3">
            {/* Member Forces & Classification */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <div className="px-3 py-2 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  STM Member Axial Forces, Strut/Tie Classification &amp; Required Tie Steel
                </span>
                <span className="text-[11px] font-mono text-[var(--md-sys-color-primary)] font-semibold">
                  Partial Scope (Truss Equilibrium) · ΣF Residual = {stmRes.equilibriumResidualKn.toExponential(1)} kN
                </span>
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Element</th>
                    <th className={cellPadding}>Connectivity</th>
                    <th className={`${cellPadding} text-center`}>Role</th>
                    <th className={`${cellPadding} text-right`}>Length (m)</th>
                    <th className={`${cellPadding} text-right`}>Angle (°)</th>
                    <th className={`${cellPadding} text-right`}>Axial Force (kN)</th>
                    <th className={`${cellPadding} text-right`}>Stress (MPa)</th>
                    <th className={`${cellPadding} text-right`}>Req. A_s,tie (mm²)</th>
                    <th className={`${cellPadding} text-center`}>Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-mono tabular-nums">
                  {filteredMembers.map((m) => (
                    <tr key={m.memberId} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                      <td className={`${cellPadding} font-sans font-semibold`}>{m.label}</td>
                      <td className={cellPadding}>{m.startLabel} → {m.endLabel}</td>
                      <td className={`${cellPadding} text-center font-bold uppercase ${m.role === 'strut' ? 'text-amber-600 dark:text-amber-400' : m.role === 'tie' ? 'text-sky-600 dark:text-sky-400' : ''}`}>
                        {m.role}
                      </td>
                      <td className={`${cellPadding} text-right`}>{m.lengthM.toFixed(3)}</td>
                      <td className={`${cellPadding} text-right`}>{m.angleDeg.toFixed(1)}°</td>
                      <td className={`${cellPadding} text-right font-bold ${m.axialForceKn < 0 ? 'text-amber-600 dark:text-amber-400' : m.axialForceKn > 0 ? 'text-sky-600 dark:text-sky-400' : ''}`}>
                        {m.axialForceKn >= 0 ? `+${m.axialForceKn.toFixed(2)}` : m.axialForceKn.toFixed(2)}
                      </td>
                      <td className={`${cellPadding} text-right`}>{m.stressMpa.toFixed(2)} / {m.allowableLimitMpa.toFixed(1)}</td>
                      <td className={`${cellPadding} text-right font-semibold`}>{m.requiredTieSteelMm2 > 0 ? m.requiredTieSteelMm2.toFixed(0) : '—'}</td>
                      <td className={`${cellPadding} text-center`}>{renderStatusBadge(m.dcrRatio <= 1.0 ? 'nominal' : 'critical')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Nodal Equilibrium & Reactions */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <div className="px-3 py-2 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Joint Equilibrium, Displacements &amp; Support Reactions
                </span>
                <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  Total Required Tie Steel = {stmRes.totalRequiredTieSteelMm2.toFixed(0)} mm²
                </span>
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Node</th>
                    <th className={cellPadding}>Support</th>
                    <th className={`${cellPadding} text-right`}>(x, y) m</th>
                    <th className={`${cellPadding} text-right`}>Applied (Fx, Fy) kN</th>
                    <th className={`${cellPadding} text-right`}>Reaction (Rx, Ry) kN</th>
                    <th className={`${cellPadding} text-right`}>Disp (ux, uy) mm</th>
                    <th className={`${cellPadding} text-right`}>|ΣF| Residual (kN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-mono tabular-nums">
                  {filteredNodes.map((n) => {
                    const resMag = Math.hypot(n.sumFxResidualKn, n.sumFyResidualKn);
                    return (
                      <tr key={n.nodeId} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                        <td className={`${cellPadding} font-sans font-semibold`}>{n.label}</td>
                        <td className={cellPadding}>{n.support}</td>
                        <td className={`${cellPadding} text-right`}>({n.xM.toFixed(2)}, {n.yM.toFixed(2)})</td>
                        <td className={`${cellPadding} text-right`}>({n.appliedFxKn.toFixed(1)}, {n.appliedFyKn.toFixed(1)})</td>
                        <td className={`${cellPadding} text-right font-bold`}>({n.reactionRxKn.toFixed(2)}, {n.reactionRyKn.toFixed(2)})</td>
                        <td className={`${cellPadding} text-right`}>({n.uxMm.toFixed(3)}, {n.uyMm.toFixed(3)})</td>
                        <td className={`${cellPadding} text-right`}>{resMag.toExponential(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 13. DEEP PILE FOUNDATION BEARING CAPACITY SCHEDULE */}
      {activeModule === 'pile-capacity' && (() => {
        const pileRes = result as PileCapacityResult;
        return (
          <div className="space-y-3">
            {/* Primary Pile Bearing Summary */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Geotechnical Capacity Metric</th>
                    <th className={`${cellPadding} text-right`}>Design Magnitude</th>
                    <th className={`${cellPadding} text-center`}>Code Criterion</th>
                    <th className={`${cellPadding} text-center`}>Safety Factor / DCR</th>
                    <th className={`${cellPadding} text-center`}>Verification State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                  <tr>
                    <td className={`${cellPadding} font-semibold`}>Allowable Axial Pile Capacity (Q_all)</td>
                    <td className={`${cellPadding} text-right font-mono font-bold text-emerald-600 dark:text-emerald-400`}>
                      {pileRes.allowableCapacityKn.toFixed(1)} kN
                    </td>
                    <td className={`${cellPadding} text-center`}>Q_all = Q_ult / FS (BNBC Sec 3.12)</td>
                    <td className={`${cellPadding} text-center font-mono font-bold text-sky-600 dark:text-sky-400`}>
                      FS = {pileRes.factorOfSafety.toFixed(2)}
                    </td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge(pileRes.status)}</td>
                  </tr>
                  <tr>
                    <td className={`${cellPadding} font-semibold`}>Total Ultimate Geotechnical Resistance (Q_ult)</td>
                    <td className={`${cellPadding} text-right font-mono font-bold text-[var(--md-sys-color-primary)]`}>
                      {pileRes.ultimateCapacityKn.toFixed(1)} kN
                    </td>
                    <td className={`${cellPadding} text-center`}>Q_ult = Q_s (Shaft) + Q_p (Tip)</td>
                    <td className={`${cellPadding} text-center font-mono`}>100.0%</td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                  </tr>
                  <tr>
                    <td className={`${cellPadding} font-semibold pl-6`}>↳ Skin Friction / Shaft Resistance (Q_s)</td>
                    <td className={`${cellPadding} text-right font-mono font-semibold`}>{pileRes.skinFrictionKn.toFixed(1)} kN</td>
                    <td className={`${cellPadding} text-center`}>Tomlinson α &amp; β Skin Friction</td>
                    <td className={`${cellPadding} text-center font-mono text-[var(--md-sys-color-on-surface-variant)]`}>
                      {((pileRes.skinFrictionKn / pileRes.ultimateCapacityKn) * 100).toFixed(1)}% of Q_ult
                    </td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                  </tr>
                  <tr>
                    <td className={`${cellPadding} font-semibold pl-6`}>↳ End Bearing / Tip Resistance (Q_p)</td>
                    <td className={`${cellPadding} text-right font-mono font-semibold`}>{pileRes.endBearingKn.toFixed(1)} kN</td>
                    <td className={`${cellPadding} text-center`}>Meyerhof Deep Bearing (q_p = {pileRes.unitEndBearingKpa.toFixed(1)} kPa)</td>
                    <td className={`${cellPadding} text-center font-mono text-[var(--md-sys-color-on-surface-variant)]`}>
                      {((pileRes.endBearingKn / pileRes.ultimateCapacityKn) * 100).toFixed(1)}% of Q_ult
                    </td>
                    <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                  </tr>
                  <tr className="bg-[var(--md-sys-color-surface-container-low)] font-bold border-t border-[var(--md-sys-color-outline)]">
                    <td className={cellPadding}>Applied Axial Column Load (P_applied)</td>
                    <td className={`${cellPadding} text-right font-mono font-black text-rose-600 dark:text-rose-400`}>
                      {pileRes.appliedLoadKn.toFixed(1)} kN
                    </td>
                    <td className={`${cellPadding} text-center`}>
                      Settlement: {pileRes.totalSettlementMm ? pileRes.totalSettlementMm.toFixed(2) : pileRes.elasticSettlementMm.toFixed(2)} mm (Se: {pileRes.elasticSettlementMm.toFixed(1)} + Sc: {(pileRes.consolidationSettlementMm || 0).toFixed(1)} mm ≤ {pileRes.permissibleSettlementMm}mm)
                    </td>
                    <td className={`${cellPadding} text-center font-black text-[var(--md-sys-color-primary)]`}>
                      DCR = {(pileRes.utilizationRatio * 100).toFixed(1)}%
                    </td>
                    <td className={`${cellPadding} text-center`}>
                      {renderStatusBadge(pileRes.utilizationRatio <= 1.0 ? 'nominal' : 'critical')}
                    </td>
                  </tr>
                  {pileRes.pileGroupSummary && pileRes.pileGroupSummary.totalPiles > 1 && (
                    <tr className="bg-[var(--md-sys-color-surface-container)] font-bold">
                      <td className={cellPadding}>
                        Pile Group ({pileRes.pileGroupSummary.rows}×{pileRes.pileGroupSummary.cols} = {pileRes.pileGroupSummary.totalPiles} Piles @ {pileRes.pileGroupSummary.spacingM}m c/c)
                      </td>
                      <td className={`${cellPadding} text-right font-mono font-black text-emerald-600 dark:text-emerald-400`}>
                        {pileRes.pileGroupSummary.groupAllowableCapacityKn.toFixed(0)} kN
                      </td>
                      <td className={`${cellPadding} text-center font-mono`}>
                        Converse-Labarre η = {(pileRes.pileGroupSummary.groupEfficiency * 100).toFixed(1)}%
                      </td>
                      <td className={`${cellPadding} text-center font-mono font-bold text-sky-600 dark:text-sky-400`}>
                        Group DCR = {(pileRes.pileGroupSummary.groupDcr * 100).toFixed(1)}%
                      </td>
                      <td className={`${cellPadding} text-center`}>
                        {renderStatusBadge(pileRes.pileGroupSummary.groupDcr <= 1.0 ? 'nominal' : 'critical')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Layer-by-Layer Stratum Friction Schedule */}
            <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                    <th className={cellPadding}>Soil Strata Profile</th>
                    <th className={`${cellPadding} text-center`}>Depth Interval</th>
                    <th className={`${cellPadding} text-right`}>Unit Friction (f_s)</th>
                    <th className={`${cellPadding} text-right`}>Shaft Resistance (Q_s)</th>
                    <th className={`${cellPadding} text-center`}>Friction Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                  {pileRes.layerContributions.map((contrib, idx) => (
                    <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                      <td className={`${cellPadding} font-semibold`}>{contrib.layerName}</td>
                      <td className={`${cellPadding} text-center font-mono`}>{contrib.depthFromM} m → {contrib.depthToM} m</td>
                      <td className={`${cellPadding} text-right font-mono`}>{contrib.unitFrictionKpa.toFixed(1)} kPa</td>
                      <td className={`${cellPadding} text-right font-mono font-bold text-sky-600 dark:text-sky-400`}>
                        {contrib.frictionKn.toFixed(1)} kN
                      </td>
                      <td className={`${cellPadding} text-center font-mono text-[var(--md-sys-color-on-surface-variant)]`}>
                        {pileRes.skinFrictionKn > 0 ? ((contrib.frictionKn / pileRes.skinFrictionKn) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 14. PIPE HYDRAULICS (HAZEN-WILLIAMS) PRESSURE & SEWER FLOW SCHEDULE */}
      {activeModule === 'pipe-hydraulics' && (() => {
        const pipeRes = result as PipeHydraulicsResult;
        return (
          <div className="border border-[var(--md-sys-color-outline-variant)] rounded-lg overflow-x-auto bg-[var(--md-sys-color-surface)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                  <th className={cellPadding}>Hydraulic Flow Parameter</th>
                  <th className={`${cellPadding} text-right`}>Calculated Magnitude</th>
                  <th className={`${cellPadding} text-center`}>Engineering Unit</th>
                  <th className={`${cellPadding} text-center`}>Governing Formulation</th>
                  <th className={`${cellPadding} text-center`}>Compliance State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Discharge Capacity (Q)</td>
                  <td className={`${cellPadding} text-right font-mono font-bold text-[var(--md-sys-color-primary)]`}>
                    {pipeRes.flowRateLps.toFixed(2)}
                  </td>
                  <td className={`${cellPadding} text-center`}>L/s ({pipeRes.flowRateM3ps.toFixed(4)} m³/s)</td>
                  <td className={`${cellPadding} text-center`}>Mass Conservation Q = V·A</td>
                  <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Mean Flow Velocity (V)</td>
                  <td className={`${cellPadding} text-right font-mono font-bold text-sky-600 dark:text-sky-400`}>
                    {pipeRes.velocityMps.toFixed(2)}
                  </td>
                  <td className={`${cellPadding} text-center`}>m/s</td>
                  <td className={`${cellPadding} text-center`}>Self-Cleansing: {pipeRes.selfCleansingStatus.toUpperCase()} (0.6 - 3.0 m/s)</td>
                  <td className={`${cellPadding} text-center`}>{renderStatusBadge(pipeRes.selfCleansingStatus === 'pass' ? 'nominal' : 'warning')}</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Frictional Head Loss (h_f)</td>
                  <td className={`${cellPadding} text-right font-mono font-bold text-amber-600 dark:text-amber-400`}>
                    {pipeRes.frictionHeadLossM.toFixed(2)}
                  </td>
                  <td className={`${cellPadding} text-center`}>meters of fluid</td>
                  <td className={`${cellPadding} text-center`}>Hazen-Williams: 10.67·L·Q^1.852 / (C^1.852·D^4.87)</td>
                  <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Minor Head Loss (h_m)</td>
                  <td className={`${cellPadding} text-right font-mono font-semibold`}>{pipeRes.minorHeadLossM.toFixed(2)}</td>
                  <td className={`${cellPadding} text-center`}>meters of fluid</td>
                  <td className={`${cellPadding} text-center`}>h_m = K·(V² / 2g)</td>
                  <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Total Dynamic Head Loss (h_L)</td>
                  <td className={`${cellPadding} text-right font-mono font-bold text-rose-600 dark:text-rose-400`}>
                    {pipeRes.totalHeadLossM.toFixed(2)}
                  </td>
                  <td className={`${cellPadding} text-center`}>meters of water</td>
                  <td className={`${cellPadding} text-center`}>h_L = h_f + h_m (Friction Slope: {(pipeRes.frictionSlopeMPerM * 100).toFixed(3)}%)</td>
                  <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                </tr>
                <tr>
                  <td className={`${cellPadding} font-semibold`}>Reynolds Number (Re)</td>
                  <td className={`${cellPadding} text-right font-mono font-bold`}>{pipeRes.reynoldsNumber.toLocaleString()}</td>
                  <td className={`${cellPadding} text-center`}>Dimensionless</td>
                  <td className={`${cellPadding} text-center`}>Flow Regime: {pipeRes.flowRegime.toUpperCase()} (Re &gt; 4000)</td>
                  <td className={`${cellPadding} text-center`}>{renderStatusBadge('nominal')}</td>
                </tr>
                <tr className="bg-[var(--md-sys-color-surface-container-low)] font-bold border-t border-[var(--md-sys-color-outline)]">
                  <td className={cellPadding}>Outlet Residual Dynamic Pressure</td>
                  <td className={`${cellPadding} text-right font-mono font-black text-emerald-600 dark:text-emerald-400`}>
                    {pipeRes.outletPressureKpa.toFixed(1)}
                  </td>
                  <td className={`${cellPadding} text-center`}>kPa ({(pipeRes.outletPressureKpa * 0.145038).toFixed(1)} psi)</td>
                  <td className={`${cellPadding} text-center`}>Energy Grade Line (EGL): {pipeRes.outletTotalHeadM.toFixed(2)} m</td>
                  <td className={`${cellPadding} text-center`}>
                    {renderStatusBadge(pipeRes.outletPressureKpa >= 100 ? 'nominal' : 'warning')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
};
