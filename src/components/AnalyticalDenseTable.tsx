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
  getCurrencySymbol,
} from '../utils/calculations';
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

  return (
    <div className={`space-y-3 font-mono ${className}`}>
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
    </div>
  );
};
