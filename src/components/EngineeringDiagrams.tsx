import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import {
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
} from '../utils/calculations';
import { FrameTruss2DResult } from '../utils/frameSolver2d';
import { SectionAnalyzerResult } from '../utils/sectionMechanics';
import { RcColumnDesignResult } from '../utils/rcColumnEngine';
import { StrutAndTieResult } from '../utils/strutAndTieEngine';
import {
  BeamParameters,
  BearingParameters,
  ConcreteMixParameters,
  ChannelParameters,
  ConcreteMaterialParameters,
  RebarBBSParameters,
  MasonryParameters,
  EarthworkParameters,
  BOQParameters,
  RateAnalysisParameters,
  ContinuousBeamParameters,
  FrameTruss2DParams,
  SectionAnalyzerParams,
  RcColumnParams,
  StrutAndTieParams,
  PileCapacityParameters,
  PipeHydraulicsParameters,
} from '../types/civil';

/* ==============================================================
   INTERACTIVE FORMULA TOOLTIP INFRASTRUCTURE FOR SVG DIAGRAMS
   Displays governing engineering formulas, parameters, and code
   references on hover over SVG vectors (loads, reactions, curves).
   ============================================================== */
export interface FormulaTooltipData {
  title: string;
  formula: string;
  substitution?: string;
  codeRef?: string;
  description?: string;
  category?: 'load' | 'reaction' | 'moment' | 'shear' | 'dimension' | 'capacity' | 'hydraulic' | 'material' | 'cost';
}

export function useFormulaTooltip() {
  const [tooltip, setTooltip] = useState<{
    data: FormulaTooltipData;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const showTooltip = (e: React.PointerEvent, data: FormulaTooltipData) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(12, Math.min(rect.width - 12, e.clientX - rect.left));
    const y = Math.max(12, Math.min(rect.height - 12, e.clientY - rect.top));
    setTooltip({ data, x, y });
  };

  const moveTooltip = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(12, Math.min(rect.width - 12, e.clientX - rect.left));
    const y = Math.max(12, Math.min(rect.height - 12, e.clientY - rect.top));
    setTooltip((prev) => (prev ? { ...prev, x, y } : null));
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  const bindHover = (data: FormulaTooltipData) => ({
    onPointerEnter: (e: React.PointerEvent) => showTooltip(e, data),
    onPointerMove: moveTooltip,
    onPointerLeave: hideTooltip,
    style: { cursor: 'help' } as React.CSSProperties,
    className: 'cursor-help transition-all duration-150 hover:filter hover:brightness-125 hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.7)]',
  });

  return {
    tooltip,
    containerRef,
    showTooltip,
    moveTooltip,
    hideTooltip,
    bindHover,
  };
}

export const FormulaTooltipOverlay: React.FC<{
  tooltip: { data: FormulaTooltipData; x: number; y: number } | null;
}> = ({ tooltip }) => {
  if (!tooltip) return null;

  const { data, x, y } = tooltip;
  const isNearTop = y < 140;
  const isNearLeft = x < 160;
  const isNearRight = x > 520;

  let transformClass = '-translate-x-1/2 -translate-y-full -mt-2';
  if (isNearTop) {
    if (isNearLeft) transformClass = 'translate-x-3 translate-y-3';
    else if (isNearRight) transformClass = '-translate-x-full translate-y-3 -ml-3';
    else transformClass = '-translate-x-1/2 translate-y-3';
  } else {
    if (isNearLeft) transformClass = 'translate-x-2 -translate-y-full -mt-2';
    else if (isNearRight) transformClass = '-translate-x-full -translate-y-full -mt-2 -ml-2';
  }

  return (
    <div
      className={`pointer-events-none absolute z-50 transform ${transformClass} transition-all duration-75`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-100 border border-cyan-500/60 shadow-2xl rounded-lg p-2.5 text-xs font-mono max-w-sm min-w-[240px] select-none">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-700/60 pb-1 mb-1.5">
          <span className="font-bold text-[10.5px] text-cyan-300 tracking-wide uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {data.title}
          </span>
          {data.codeRef && (
            <span className="text-[8.5px] bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
              {data.codeRef}
            </span>
          )}
        </div>
        <div className="bg-black/60 rounded px-2 py-1 text-emerald-400 font-bold border-l-2 border-emerald-400 text-[11px] tracking-wide my-1">
          {data.formula}
        </div>
        {data.substitution && (
          <div className="text-[9.5px] text-zinc-300 mt-1 bg-zinc-800/40 px-1.5 py-0.5 rounded border border-zinc-700/30">
            <span className="text-zinc-400 font-semibold">Substituted: </span>
            {data.substitution}
          </div>
        )}
        {data.description && (
          <div className="text-[9px] text-zinc-400 mt-1 leading-tight italic">
            {data.description}
          </div>
        )}
      </div>
    </div>
  );
};

export const DiagramFormulaHint: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-between px-2.5 py-1 bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded text-[10px] text-zinc-500 dark:text-zinc-400 font-mono select-none ${className}`}>
    <span className="flex items-center gap-1.5">
      <span className="text-cyan-600 dark:text-cyan-400 font-bold">ƒ(x)</span>
      <span>Hover arrows, curves &amp; structural vectors to view governing engineering formulas</span>
    </span>
    <span className="text-[9px] text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
      Interactive Physics
    </span>
  </div>
);

/* 1. Beam Diagram with Interactive Crosshair & Limit State Safety */
export const BeamDiagramSvg: React.FC<{ params: BeamParameters; result: BeamAnalysisResult }> = ({
  params,
  result,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverData, setHoverData] = useState<{
    x: number;
    shearKn: number;
    momentKnm: number;
    signedDeflMm: number;
    px: number;
  } | null>(null);
  const { tooltip, containerRef, bindHover } = useFormulaTooltip();

  const width = 680;
  const height = 408;
  const padLeft = 58;
  const padRight = 130; // Room for beam section vignette
  const plotW = width - padLeft - padRight;

  if (params.spanLengthM <= 0) {
    return (
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono">
          <rect x={10} y={10} width={width - 20} height={height - 20} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
          <text x={width / 2} y={height / 2 - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
            ZERO SPAN LENGTH (L = 0.00 m)
          </text>
          <text x={width / 2} y={height / 2 + 12} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
            Enter a positive span length to compute structural reactions, shear, bending and deflection
          </text>
        </svg>
      </div>
    );
  }

  const isOverhanging = params.supportCondition === 'overhanging';
  const ovL = isOverhanging ? Math.max(0, result.overhangLeftM ?? params.overhangLeftM ?? 0) : 0;
  const ovR = isOverhanging ? Math.max(0, result.overhangRightM ?? params.overhangRightM ?? 0) : 0;
  const L_main = Math.max(0.1, params.spanLengthM);
  const L_tot = Math.max(0.1, result.totalLengthM ?? (ovL + L_main + ovR));
  const xA = ovL;
  const xB = ovL + L_main;

  const maxV = Math.max(0.1, result.maxShearKn);
  const maxM = Math.max(0.1, result.maxMomentKnm);
  const maxD = Math.max(0.01, result.maxDeflectionMm);
  const toX = (xM: number) => padLeft + (Math.max(0, Math.min(L_tot, xM)) / L_tot) * plotW;

  const supportAX = toX(xA);
  const supportBX = toX(xB);

  const shearCenterY = 142;
  const shearAmp = 36;
  const shearPoints = result.points
    .map((pt) => `${toX(pt.x).toFixed(1)},${(shearCenterY - (pt.shearKn / maxV) * shearAmp).toFixed(1)}`)
    .join(' ');
  const shearAreaPoints = `${padLeft},${shearCenterY} ${shearPoints} ${padLeft + plotW},${shearCenterY}`;

  const momentCenterY = 236;
  const momentAmp = 36;
  const momentPoints = result.points
    .map((pt) => `${toX(pt.x).toFixed(1)},${(momentCenterY + (pt.momentKnm / maxM) * momentAmp).toFixed(1)}`)
    .join(' ');
  const momentAreaPoints = `${padLeft},${momentCenterY} ${momentPoints} ${padLeft + plotW},${momentCenterY}`;

  // Elastic Deflected Shape Curve y(x): signedDeflectionMm < 0 means downward sag (draw below baseline)
  const deflCenterY = 342;
  const deflAmp = 32;
  const getSignedDefl = (pt: typeof result.points[0]) =>
    pt.signedDeflectionMm !== undefined ? pt.signedDeflectionMm : -pt.deflectionMm;

  const deflPoints = result.points
    .map((pt) => {
      const signed = getSignedDefl(pt);
      return `${toX(pt.x).toFixed(1)},${(deflCenterY - (signed / maxD) * deflAmp).toFixed(1)}`;
    })
    .join(' ');
  const deflAreaPoints = `${padLeft},${deflCenterY} ${deflPoints} ${padLeft + plotW},${deflCenterY}`;

  // Subtle overlay curve directly along beam axis
  const beamOverlayDeflPoints = result.points
    .map((pt) => {
      const signed = getSignedDefl(pt);
      return `${toX(pt.x).toFixed(1)},${(57 - (signed / maxD) * 14).toFixed(1)}`;
    })
    .join(' ');

  const pointLoadX = toX(Math.min(L_tot, params.pointLoadPositionM));

  // Distributed load envelope intensities
  const distType = params.distributedLoadType || 'uniform';
  const wLeft = distType === 'triangular-increasing' ? 0 : Math.max(0, params.uniformLoadKnPerM || 0);
  const wRight =
    distType === 'uniform'
      ? Math.max(0, params.uniformLoadKnPerM || 0)
      : distType === 'triangular-decreasing'
        ? 0
        : distType === 'triangular-increasing'
          ? Math.max(0, params.endLoadKnPerM !== undefined ? params.endLoadKnPerM : params.uniformLoadKnPerM || 0)
          : Math.max(0, params.endLoadKnPerM !== undefined ? params.endLoadKnPerM : (params.uniformLoadKnPerM || 0) * 1.5);
  const maxW = Math.max(0.1, wLeft, wRight);

  // Serviceability limit state check
  const allowableDeflMm = result.allowableDeflectionMm || (L_main * 1000) / (result.deflectionLimitFactor || 360);
  const deflRatio = result.maxDeflectionMm / Math.max(0.001, allowableDeflMm);
  const deflStatusColor = deflRatio <= 0.8 ? '#10b981' : deflRatio <= 1.0 ? '#f59e0b' : '#ef4444';
  const deflStatusText =
    deflRatio <= 0.8
      ? 'PASS · Serviceability Satisfied'
      : deflRatio <= 1.0
        ? 'ATTENTION · High Deflection'
        : `EXCEEDED · Deflection > L/${result.deflectionLimitFactor || 360}`;

  const inflectionPoints = result.inflectionPointsM || [];
  const maxDeflLocM = result.maxDeflectionLocationM ?? L_tot / 2;
  const maxDeflPt = result.points.reduce(
    (best, pt) => (pt.deflectionMm > best.deflectionMm ? pt : best),
    result.points[0] || { x: maxDeflLocM, deflectionMm: result.maxDeflectionMm, signedDeflectionMm: -result.maxDeflectionMm, shearKn: 0, momentKnm: 0 }
  );
  const maxDeflSvgX = toX(maxDeflPt.x);
  const maxDeflSvgY = deflCenterY - (getSignedDefl(maxDeflPt) / maxD) * deflAmp;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || result.points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = clientX * scaleX;

    if (svgX >= padLeft && svgX <= padLeft + plotW) {
      const curX = ((svgX - padLeft) / plotW) * L_tot;
      let nearest = result.points[0];
      let minDiff = Infinity;
      for (const pt of result.points) {
        const diff = Math.abs(pt.x - curX);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = pt;
        }
      }
      setHoverData({
        x: nearest.x,
        shearKn: nearest.shearKn,
        momentKnm: nearest.momentKnm,
        signedDeflMm: getSignedDefl(nearest),
        px: toX(nearest.x),
      });
    } else {
      setHoverData(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none font-mono cursor-crosshair touch-none"
        role="img"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverData(null)}
      >
        <defs>
          <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--md-sys-color-primary)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--md-sys-color-primary)" stopOpacity="0.45" />
          </linearGradient>
          <pattern id="diagonalHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--md-sys-color-outline)" strokeWidth="1.2" />
          </pattern>
        </defs>

        {/* Header / Limit State Indicator with Hover Tooltip */}
        <text x={12} y={22} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">
          STRUCTURAL ACTIONS &amp; ELASTIC CURVE
        </text>
        <g
          {...bindHover({
            title: 'Serviceability Deflection Check',
            formula: `EI·y(x) = ∬M(x)dx² ≤ L/${result.deflectionLimitFactor || 360}`,
            substitution: `δ_max = ${result.maxDeflectionMm.toFixed(2)} mm ≤ ${allowableDeflMm.toFixed(1)} mm (${(deflRatio * 100).toFixed(1)}%)`,
            codeRef: `${result.governingCode || 'BNBC 2020'} Serviceability Limit`,
            description: 'Double-integrated Euler-Bernoulli elastic deflection check against structural serviceability limit.',
          })}
        >
          <title>{`Deflection Check: δ = ${result.maxDeflectionMm.toFixed(2)}mm ≤ ${allowableDeflMm.toFixed(1)}mm`}</title>
          <rect x={width - 268} y={10} width={258} height={20} rx={4} fill={deflStatusColor} fillOpacity="0.12" stroke={deflStatusColor} strokeWidth="1" />
          <text x={width - 258} y={23} fontSize="8.5" fontWeight="700" fill={deflStatusColor}>
            {deflStatusText} ({result.maxDeflectionMm.toFixed(2)} / {allowableDeflMm.toFixed(1)}mm)
          </text>
        </g>

        {/* 1. Beam & Loads with Hover Formula Tooltips */}
        <text x={12} y={54} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">LOADS</text>
        {(wLeft > 0 || wRight > 0) && (() => {
          const yBase = 51;
          const hLeft = 4 + (wLeft / maxW) * 16;
          const hRight = 4 + (wRight / maxW) * 16;
          const yLeftTop = yBase - hLeft;
          const yRightTop = yBase - hRight;
          return (
            <g
              {...bindHover({
                title: `Distributed Gravity Load (${distType})`,
                formula: distType === 'uniform' ? 'W_dist = w · L_tot' : 'W_dist = 0.5 · (w₁ + w₂) · L_tot',
                substitution: `w₁ = ${wLeft.toFixed(1)} kN/m → w₂ = ${wRight.toFixed(1)} kN/m across L_tot = ${L_tot.toFixed(2)} m`,
                codeRef: 'BNBC 2020 / ASCE 7-16',
                description: 'Distributed line load intensity generating continuous shear gradient and parabolic/cubic moments.',
              })}
            >
              <polygon
                points={`${padLeft},${yBase} ${padLeft},${yLeftTop} ${padLeft + plotW},${yRightTop} ${padLeft + plotW},${yBase}`}
                fill="var(--md-sys-color-primary)"
                fillOpacity="0.12"
                stroke="var(--md-sys-color-primary)"
                strokeWidth="1.2"
              />
              {Array.from({ length: 9 }).map((_, i) => {
                const frac = i / 8;
                const xPos = padLeft + frac * plotW;
                const yTop = yLeftTop + frac * (yRightTop - yLeftTop);
                if (yBase - yTop < 5) return null;
                return (
                  <g key={i}>
                    <line x1={xPos} y1={yTop} x2={xPos} y2={yBase - 1} stroke="var(--md-sys-color-primary)" strokeWidth="1" />
                    <polygon points={`${xPos - 2.2},${yBase - 4} ${xPos + 2.2},${yBase - 4} ${xPos},${yBase}`} fill="var(--md-sys-color-primary)" />
                  </g>
                );
              })}
              <text x={padLeft + plotW / 2} y={Math.min(yLeftTop, yRightTop) - 3} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="var(--md-sys-color-primary)">
                {distType === 'uniform'
                  ? `w = ${wLeft.toFixed(1)} kN/m`
                  : `w₁=${wLeft.toFixed(1)} → w₂=${wRight.toFixed(1)} kN/m`}
              </text>
            </g>
          );
        })()}
        {params.pointLoadKn > 0 && (
          <g
            {...bindHover({
              title: 'Concentrated Point Load (P)',
              formula: 'Shear step ΔV = −P · Moment slope cusp',
              substitution: `P = ${params.pointLoadKn} kN at x = ${params.pointLoadPositionM.toFixed(2)} m`,
              codeRef: 'Static Equilibrium: ΣM = 0',
              description: 'Single point force causing vertical step discontinuity in SFD and peak cusp in BMD.',
            })}
          >
            <line x1={pointLoadX} y1={24} x2={pointLoadX} y2={50} stroke="var(--md-sys-color-tertiary)" strokeWidth="2.5" />
            <polygon points={`${pointLoadX - 4},44 ${pointLoadX + 4},44 ${pointLoadX},52`} fill="var(--md-sys-color-tertiary)" />
            <text x={Math.min(padLeft + plotW - 55, pointLoadX + 6)} y={31} fontSize="8.5" fontWeight="700" fill="var(--md-sys-color-tertiary)">
              P = {params.pointLoadKn} kN
            </text>
          </g>
        )}

        {wLeft === 0 && wRight === 0 && params.pointLoadKn === 0 && (
          <g>
            <rect x={padLeft + plotW / 2 - 120} y={26} width={240} height={20} rx={4} fill="var(--md-sys-color-surface-container-high)" stroke="var(--md-sys-color-outline-variant)" />
            <text x={padLeft + plotW / 2} y={39} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">
              Quiescent Beam — Zero Gravity Loads (w=0, P=0)
            </text>
          </g>
        )}

        {/* Beam Solid Geometry & Subtle Axis Deflection Overlay */}
        <g
          {...bindHover({
            title: 'Beam Geometry & Deformed Axis Overlay',
            formula: 'L_tot = L_ovL + L_main + L_ovR · Dashed curve = scaled y(x)',
            substitution: `L_tot = ${L_tot.toFixed(2)} m, d = ${params.sectionDepthMm || 450} mm`,
            codeRef: 'Mechanics of Deformable Bodies',
            description: 'Flexural member showing boundary supports and scaled elastic centerline deformation.',
          })}
        >
          <rect x={padLeft} y={52} width={plotW} height={10} rx={2} fill="url(#beamGradient)" />
          {result.points.length > 1 && (
            <polyline
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              opacity="0.85"
              points={beamOverlayDeflPoints}
            />
          )}
          <text x={padLeft + plotW / 2} y={84} textAnchor="middle" fontSize="9.5" fill="var(--md-sys-color-on-surface-variant)">
            {isOverhanging
              ? `L_tot = ${L_tot.toFixed(2)} m (OvL ${ovL.toFixed(1)}m + Span ${L_main.toFixed(1)}m + OvR ${ovR.toFixed(1)}m)`
              : `Span L = ${L_main.toFixed(2)} m (${params.supportCondition})`}
          </text>
        </g>

        {/* Boundary Condition Support Graphics */}
        {(params.supportCondition === 'cantilever' || params.supportCondition === 'fixed-ends') ? (
          <g>
            {/* Left Encastré Wall */}
            <rect x={padLeft - 10} y={40} width={10} height={34} fill="url(#diagonalHatch)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.5" />
            <line x1={padLeft} y1={40} x2={padLeft} y2={74} stroke="var(--md-sys-color-on-surface)" strokeWidth="2.5" />
            <text x={padLeft + 4} y={96} fontSize="8" fontWeight="700" fill="var(--md-sys-color-primary)">
              R_A={result.reactionLeftKn.toFixed(1)}kN · M_A=−{(result.fixedEndMomentLeftKnm ?? 0).toFixed(1)}
            </text>
            {params.supportCondition === 'fixed-ends' && (
              <>
                <rect x={padLeft + plotW} y={40} width={10} height={34} fill="url(#diagonalHatch)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.5" />
                <line x1={padLeft + plotW} y1={40} x2={padLeft + plotW} y2={74} stroke="var(--md-sys-color-on-surface)" strokeWidth="2.5" />
                <text x={padLeft + plotW - 4} y={96} textAnchor="end" fontSize="8" fontWeight="700" fill="var(--md-sys-color-primary)">
                  R_B={result.reactionRightKn.toFixed(1)}kN
                </text>
              </>
            )}
          </g>
        ) : (
          <>
            {/* Pinned Support A at xA */}
            <g>
              <polygon points={`${supportAX},62 ${supportAX - 7},73 ${supportAX + 7},73`} fill="var(--md-sys-color-outline)" />
              <line x1={supportAX - 10} y1={73} x2={supportAX + 10} y2={73} stroke="var(--md-sys-color-outline)" strokeWidth="2" />
              <text x={supportAX} y={96} textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--md-sys-color-primary)">
                R_A={result.reactionLeftKn.toFixed(1)}kN
              </text>
            </g>
            {/* Roller Support B at xB */}
            <g>
              <polygon points={`${supportBX},62 ${supportBX - 7},70 ${supportBX + 7},70`} fill="var(--md-sys-color-outline)" />
              <circle cx={supportBX - 4} cy={73} r={2} fill="var(--md-sys-color-outline)" />
              <circle cx={supportBX + 4} cy={73} r={2} fill="var(--md-sys-color-outline)" />
              <line x1={supportBX - 10} y1={76} x2={supportBX + 10} y2={76} stroke="var(--md-sys-color-outline)" strokeWidth="2" />
              <text x={supportBX} y={96} textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--md-sys-color-primary)">
                R_B={result.reactionRightKn.toFixed(1)}kN
              </text>
            </g>
          </>
        )}

        {/* 2. SFD with Hover Tooltip */}
        <text x={12} y={146} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">SFD (kN)</text>
        <line x1={padLeft} y1={shearCenterY} x2={padLeft + plotW} y2={shearCenterY} stroke="var(--md-sys-color-outline)" strokeWidth="1" strokeDasharray="3 3" />
        <g
          {...bindHover({
            title: 'Shear Force Diagram (SFD)',
            formula: 'V(x) = R_A - ∫ w(x)dx - Σ P_i = dM/dx',
            substitution: `Peak Shear V_max = ${maxV.toFixed(1)} kN`,
            codeRef: 'Differential Shear Equilibrium',
            description: 'Internal transverse shear force envelope; zero-shear crossing corresponds to peak flexural moment.',
          })}
        >
          <polygon points={shearAreaPoints} fill="var(--md-sys-color-primary)" fillOpacity="0.18" />
          <polyline fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="2" points={shearPoints} />
        </g>
        <text x={padLeft + 4} y={shearCenterY - shearAmp + 6} fontSize="8.5" fill="var(--md-sys-color-primary)" fontWeight="600">
          +{maxV.toFixed(1)}
        </text>
        <text x={padLeft + 4} y={shearCenterY + shearAmp} fontSize="8.5" fill="var(--md-sys-color-primary)" fontWeight="600">
          -{maxV.toFixed(1)}
        </text>

        {/* 3. BMD with Hover Tooltip + Contraflexure Markers */}
        <text x={12} y={240} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">BMD (kN·m)</text>
        <line x1={padLeft} y1={momentCenterY} x2={padLeft + plotW} y2={momentCenterY} stroke="var(--md-sys-color-outline)" strokeWidth="1" strokeDasharray="3 3" />
        <g
          {...bindHover({
            title: 'Bending Moment Diagram (BMD)',
            formula: 'M(x) = ∫ V(x)dx · Sagging (+) / Hogging (−)',
            substitution: `|M|_max = ${maxM.toFixed(1)} kN·m${inflectionPoints.length > 0 ? ` · Contraflexure @ ${inflectionPoints.map((ip) => `${ip.toFixed(2)}m`).join(', ')}` : ''}`,
            codeRef: 'Euler-Bernoulli Flexural Theory',
            description: 'Internal bending moment envelope governing positive bottom and negative top flexural reinforcement.',
          })}
        >
          <polygon points={momentAreaPoints} fill="var(--md-sys-color-secondary)" fillOpacity="0.20" />
          <polyline fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2" points={momentPoints} />
        </g>
        {inflectionPoints.map((ip, idx) => {
          const ipX = toX(ip);
          return (
            <g key={`beam-ip-${idx}`}>
              <polygon
                points={`${ipX},${momentCenterY - 4.5} ${ipX + 4.5},${momentCenterY} ${ipX},${momentCenterY + 4.5} ${ipX - 4.5},${momentCenterY}`}
                fill="#eab308"
                stroke="#713f12"
                strokeWidth="1"
              />
              <text x={ipX} y={momentCenterY - 7} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#b45309">
                IP {ip.toFixed(2)}m
              </text>
            </g>
          );
        })}
        <text x={padLeft + 4} y={momentCenterY + momentAmp} fontSize="8.5" fill="var(--md-sys-color-secondary)" fontWeight="600">
          |M|_max = {maxM.toFixed(1)} kN·m
        </text>

        {/* 4. ELASTIC DEFLECTED SHAPE CURVE y(x) */}
        <text x={12} y={338} fontSize="9" fontWeight="700" fill="#0284c7">DEFL y(x)</text>
        <text x={12} y={350} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">(mm)</text>
        <line x1={padLeft} y1={deflCenterY} x2={padLeft + plotW} y2={deflCenterY} stroke="var(--md-sys-color-outline)" strokeWidth="1" strokeDasharray="3 3" />
        <g
          {...bindHover({
            title: 'Elastic Deflected Shape Curve y(x)',
            formula: 'EI · d²y/dx² = M(x)  (Double Integration)',
            substitution: `δ_max = ${result.maxDeflectionMm.toFixed(2)} mm @ x = ${maxDeflLocM.toFixed(2)} m`,
            codeRef: `${result.governingCode || 'BNBC-2020'} L/${result.deflectionLimitFactor || 360} Limit`,
            description: 'Exact vertical elastic displacement profile showing downward sagging and upward cantilever/overhang uplift.',
          })}
        >
          <polygon points={deflAreaPoints} fill="#0ea5e9" fillOpacity="0.16" />
          <polyline fill="none" stroke="#0ea5e9" strokeWidth="2.2" points={deflPoints} />
        </g>
        {result.points.length > 0 && (
          <g>
            <circle cx={maxDeflSvgX} cy={maxDeflSvgY} r={4} fill="#0ea5e9" stroke="#ffffff" strokeWidth="1.5" />
            <text
              x={Math.min(padLeft + plotW - 95, Math.max(padLeft + 6, maxDeflSvgX + 6))}
              y={Math.min(height - 10, maxDeflSvgY + 12)}
              fontSize="8.5"
              fontWeight="800"
              fill="#0284c7"
            >
              δ_max = {result.maxDeflectionMm.toFixed(2)} mm @ {maxDeflLocM.toFixed(2)}m
            </text>
          </g>
        )}

        {/* Beam Cross Section Vignette with Hover Tooltip */}
        <g
          transform={`translate(${width - 110}, 105)`}
          {...bindHover({
            title: 'Reinforced Concrete Beam Section',
            formula: 'M_n = A_s · f_y · (d - a/2)',
            substitution: `Section = ${(params as any).sectionWidthMm || 250} × ${params.sectionDepthMm || 450} mm`,
            codeRef: 'ACI 318-19 / BNBC 2020 Ch 6',
            description: 'Cross-section flexural profile and transverse shear stirrup ties.',
          })}
        >
          <rect x={0} y={0} width={100} height={190} rx={6} fill="var(--md-sys-color-surface-container-high)" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
          <text x={50} y={18} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface)">
            SECTION
          </text>
          <rect x={15} y={28} width={70} height={120} rx={3} fill="var(--md-sys-color-surface-container-highest)" stroke="var(--md-sys-color-outline)" strokeWidth="1.5" />
          <rect x={20} y={33} width={60} height={110} rx={2} fill="none" stroke="var(--md-sys-color-tertiary)" strokeWidth="1.2" strokeDasharray="2 1" />
          <circle cx={26} cy={39} r={3} fill="var(--md-sys-color-on-surface)" />
          <circle cx={74} cy={39} r={3} fill="var(--md-sys-color-on-surface)" />
          <circle cx={26} cy={137} r={4} fill="var(--md-sys-color-primary)" />
          <circle cx={50} cy={137} r={4} fill="var(--md-sys-color-primary)" />
          <circle cx={74} cy={137} r={4} fill="var(--md-sys-color-primary)" />
          <text x={50} y={160} textAnchor="middle" fontSize="8" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">
            {(params as any).sectionWidthMm || 250} × {params.sectionDepthMm || 450} mm
          </text>
          <text x={50} y={174} textAnchor="middle" fontSize="8" fontWeight="600" fill="var(--md-sys-color-primary)">
            DCR: {(result.utilizationRatio * 100).toFixed(0)}%
          </text>
        </g>

        {/* Interactive Inspection Crosshair */}
        {hoverData && (
          <g pointerEvents="none">
            <line x1={hoverData.px} y1={25} x2={hoverData.px} y2={390} stroke="var(--md-sys-color-primary)" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx={hoverData.px} cy={shearCenterY - (hoverData.shearKn / maxV) * shearAmp} r={4.5} fill="var(--md-sys-color-primary)" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={hoverData.px} cy={momentCenterY + (hoverData.momentKnm / maxM) * momentAmp} r={4.5} fill="var(--md-sys-color-secondary)" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={hoverData.px} cy={deflCenterY - (hoverData.signedDeflMm / maxD) * deflAmp} r={4.5} fill="#0ea5e9" stroke="#ffffff" strokeWidth="1.5" />

            {/* Floating Value Tag */}
            <g transform={`translate(${Math.min(width - 280, Math.max(padLeft, hoverData.px - 75))}, 96)`}>
              <rect x={0} y={0} width={166} height={50} rx={6} fill="var(--md-sys-color-surface-container-highest)" stroke="var(--md-sys-color-outline)" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
              <text x={8} y={14} fontSize="8.5" fontWeight="700" fill="var(--md-sys-color-on-surface)">
                x = {hoverData.x.toFixed(2)} m
              </text>
              <text x={8} y={28} fontSize="8.5" fontWeight="600" fill="var(--md-sys-color-primary)">
                V: {hoverData.shearKn.toFixed(1)} kN
              </text>
              <text x={82} y={28} fontSize="8.5" fontWeight="600" fill="var(--md-sys-color-secondary)">
                M: {hoverData.momentKnm.toFixed(1)} kNm
              </text>
              <text x={8} y={42} fontSize="8.5" fontWeight="700" fill="#0284c7">
                Defl y: {hoverData.signedDeflMm.toFixed(2)} mm
              </text>
            </g>
          </g>
        )}
      </svg>
      {!hoverData && (
        <div className="absolute top-2 left-16 text-[10px] text-zinc-400 dark:text-zinc-500 pointer-events-none select-none font-mono">
          Hover or drag across span to inspect shear, moment &amp; elastic deflection
        </div>
      )}
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 2. Bearing Diagram with Soil Strata, GWT, Boussinesq Stress Bulbs, and Settlement */
export const BearingDiagramSvg: React.FC<{ params: BearingParameters; result: BearingAnalysisResult }> = ({
  params,
  result,
}) => {
  const [activeTab, setActiveTab] = useState<'bulbs' | 'settlement' | 'breakdown' | 'methods'>('bulbs');
  const [hoverDepth, setHoverDepth] = useState<{ z: number; py: number; deltaSigma: number; sigmaV0: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { tooltip, containerRef, bindHover } = useFormulaTooltip();

  const width = 680;
  const height = 340;

  if (params.footingWidthM <= 0) {
    return (
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono">
          <rect x={10} y={10} width={width - 20} height={height - 20} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
          <text x={width / 2} y={height / 2 - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
            ZERO FOOTING GEOMETRY (B = 0.00 m)
          </text>
          <text x={width / 2} y={height / 2 + 12} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
            Enter footing width, length, and embedment depth to evaluate bearing capacity and settlement
          </text>
        </svg>
      </div>
    );
  }

  const footingCenterX = 290;
  const footingW = Math.min(220, Math.max(90, params.footingWidthM * 42));
  const footingD = Math.min(65, Math.max(26, params.embedmentDepthM * 20));
  const gradeY = 70;
  const footingBaseY = gradeY + footingD;
  const maxDepthM = Math.max(10, params.embedmentDepthM + params.footingWidthM * 3);
  const plotH = height - footingBaseY - 25;

  const toY = (depthM: number) => footingBaseY + ((depthM - params.embedmentDepthM) / (maxDepthM - params.embedmentDepthM)) * plotH;
  const toDepthM = (py: number) => params.embedmentDepthM + ((py - footingBaseY) / plotH) * (maxDepthM - params.embedmentDepthM);

  const fs = result.effectiveSafetyFactor;
  const isPassingFs = fs >= 2.5;
  const isMarginalFs = fs >= 2.0 && fs < 2.5;
  const fsColor = isPassingFs ? '#10b981' : isMarginalFs ? '#f59e0b' : '#ef4444';
  const fsLabel = isPassingFs ? 'SAFE (FS ≥ 2.5)' : isMarginalFs ? 'MARGINAL (2.0 ≤ FS < 2.5)' : 'UNSAFE (FS < 2.0)';

  // Water table relative position
  const waterDepthM = params.waterTableDepthM;
  const waterY = gradeY + (waterDepthM / Math.max(0.1, params.embedmentDepthM + 4)) * (footingD + 80);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawY = (e.clientY - rect.top) * (height / rect.height);
    if (rawY >= footingBaseY && rawY <= height - 20) {
      const zFromBase = toDepthM(rawY) - params.embedmentDepthM;
      if (zFromBase >= 0) {
        const B = params.footingWidthM;
        const L = params.footingLengthM || B;
        const deltaSigma = params.appliedColumnLoadKn / ((B + zFromBase) * (L + zFromBase));
        const sigmaV0 = result.effectiveOverburdenKpa + result.effectiveSubgradeGammaKnPerM3 * zFromBase;
        setHoverDepth({
          z: zFromBase,
          py: rawY,
          deltaSigma,
          sigmaV0,
        });
      }
    } else {
      setHoverDepth(null);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2 select-none font-mono relative">
      {/* View Switcher Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--md-sys-color-primary)]">
            Shallow Foundation Engine
          </span>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            BNBC-2020 Sec 3.9 &amp; 3.8 / ACI-318 ({result.solverMethodUsed ? result.solverMethodUsed.toUpperCase() : 'MEYERHOF'})
          </span>
        </div>

        <div className="flex items-center gap-1 rounded bg-[var(--md-sys-color-surface-container-high)] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('bulbs')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'bulbs' ? 'bg-[var(--md-sys-color-surface)] font-bold text-[var(--md-sys-color-on-surface)] shadow-xs' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}
          >
            Stress Bulbs &amp; Isobars
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settlement')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'settlement' ? 'bg-[var(--md-sys-color-surface)] font-bold text-[var(--md-sys-color-on-surface)] shadow-xs' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}
          >
            Settlement Breakdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('methods')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'methods' ? 'bg-[var(--md-sys-color-surface)] font-bold text-[var(--md-sys-color-on-surface)] shadow-xs' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}
          >
            Solver Comparison
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('breakdown')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'breakdown' ? 'bg-[var(--md-sys-color-surface)] font-bold text-[var(--md-sys-color-on-surface)] shadow-xs' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}
          >
            Code Clauses
          </button>
        </div>
      </div>

      {activeTab === 'methods' ? (
        /* Solver Formulation Comparison Tab */
        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--md-sys-color-primary)]">
              Shallow Bearing Capacity Solvers: Formulations &amp; Capacities
            </span>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
              Factor of Safety FS = {result.factorOfSafety}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl border ${result.solverMethodUsed === 'meyerhof' || !result.solverMethodUsed ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container)]' : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]'} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">Meyerhof (1963)</span>
                {(result.solverMethodUsed === 'meyerhof' || !result.solverMethodUsed) && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">ACTIVE</span>
                )}
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                q_ult = c·Nc·sc·dc + q·Nq·sq·dq + 0.5·γ·B·Nγ·sγ·dγ
              </div>
              <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {result.methodComparison?.meyerhofKpa ?? result.allowableBearingKpa.toFixed(1)} <span className="text-xs font-normal">kPa (q_all)</span>
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                BNBC-2020 Clause 3.9 Standard Method
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${result.solverMethodUsed === 'terzaghi' ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container)]' : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]'} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">Terzaghi (1943)</span>
                {result.solverMethodUsed === 'terzaghi' && (
                  <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[10px] font-bold">ACTIVE</span>
                )}
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                q_ult = 1.3·c·Nc + q·Nq + 0.4·γ·B·Nγ (Square)
              </div>
              <div className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">
                {result.methodComparison?.terzaghiKpa ?? (result.allowableBearingKpa * 0.95).toFixed(1)} <span className="text-xs font-normal">kPa (q_all)</span>
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                Classical General Shear Failure Theory
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${result.solverMethodUsed === 'hansen' ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container)]' : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]'} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">Hansen (1970)</span>
                {result.solverMethodUsed === 'hansen' && (
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold">ACTIVE</span>
                )}
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                q_ult = c·Nc·sc·dc·ic + q·Nq·sq·dq·iq + 0.5·γ·B·Nγ·sγ·dγ·iγ
              </div>
              <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                {result.methodComparison?.hansenKpa ?? (result.allowableBearingKpa * 1.02).toFixed(1)} <span className="text-xs font-normal">kPa (q_all)</span>
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                Comprehensive Multi-Factor Formulation
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'breakdown' ? (
        /* Code Breakdown Tab */
        <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2 text-xs">
          <div className="font-bold text-[var(--md-sys-color-primary)] mb-1">
            BNBC-2020 Part 6 Chapter 3 Geotechnical Derivation &amp; Clause Verification
          </div>
          <table className="w-full text-left font-mono border-collapse">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase">
                <th className="py-1 px-2">Design Step</th>
                <th className="py-1 px-2">Governing Formula</th>
                <th className="py-1 px-2">Evaluated Result</th>
                <th className="py-1 px-2">BNBC Clause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/40 text-[11px]">
              {result.calculationsBreakdown.map((item, idx) => (
                <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container)]">
                  <td className="py-1.5 px-2 font-semibold text-[var(--md-sys-color-on-surface)]">{item.step}</td>
                  <td className="py-1.5 px-2 text-[var(--md-sys-color-on-surface-variant)]">{item.formula}</td>
                  <td className="py-1.5 px-2 font-bold text-[var(--md-sys-color-primary)]">{item.result}</td>
                  <td className="py-1.5 px-2 font-mono text-[10px] text-sky-600 dark:text-sky-400">{item.clauseRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'settlement' ? (
        /* Settlement Visual Card */
        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[var(--md-sys-color-on-surface)]">
              Automated Settlement Evaluation (BNBC-2020 Sec 3.8 / Bowles)
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${result.settlementPass ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'}`}>
              {result.settlementPass ? 'PASS (Within Permissible Limit)' : 'EXCEEDED (Remediation Needed)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">Immediate Elastic (Se)</div>
              <div className="text-lg font-bold text-sky-600 dark:text-sky-400">{result.immediateSettlementMm.toFixed(1)} mm</div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Schmertmann / Bowles method</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">Consolidation (Sc)</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{result.consolidationSettlementMm.toFixed(1)} mm</div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">1D Terzaghi Oedometer</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">Total Estimated (St)</div>
              <div className={`text-lg font-bold ${result.settlementPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {result.totalSettlementMm.toFixed(1)} mm
              </div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Se + Sc combined</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">Permissible Limit (S_all)</div>
              <div className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">{result.permissibleSettlementMm.toFixed(1)} mm</div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">BNBC Table 6.3.1 Limit</div>
            </div>
          </div>

          {/* Graphical Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
              <span>Settlement Utilization (DCR): {(result.settlementUtilizationRatio * 100).toFixed(1)}%</span>
              <span>Max Allowable: {result.permissibleSettlementMm} mm</span>
            </div>
            <div className="h-3 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, (result.immediateSettlementMm / result.permissibleSettlementMm) * 100)}%` }}
                className="bg-sky-500 h-full"
                title={`Immediate Se: ${result.immediateSettlementMm} mm`}
              />
              <div
                style={{ width: `${Math.min(100, (result.consolidationSettlementMm / result.permissibleSettlementMm) * 100)}%` }}
                className="bg-purple-500 h-full"
                title={`Consolidation Sc: ${result.consolidationSettlementMm} mm`}
              />
            </div>
            <div className="flex items-center gap-4 text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-sky-500 rounded-sm" /> Elastic Se</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-500 rounded-sm" /> Consolidation Sc</span>
            </div>
          </div>
        </div>
      ) : (
        /* SVG Interactive Stress Bulbs Diagram */
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none font-mono cursor-crosshair"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverDepth(null)}
            role="img"
          >
            <defs>
              <pattern id="soilStripe" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.8" strokeOpacity="0.4" />
              </pattern>
              <pattern id="gravelPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="1.5" fill="var(--md-sys-color-outline-variant)" fillOpacity="0.5" />
                <circle cx="12" cy="12" r="2" fill="var(--md-sys-color-outline-variant)" fillOpacity="0.5" />
                <circle cx="12" cy="4" r="1" fill="var(--md-sys-color-outline-variant)" fillOpacity="0.4" />
              </pattern>
            </defs>

            {/* Title & Safety Banner */}
            <text x={24} y={24} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">
              BOUSSINESQ STRESS ISOBARS &amp; 2:1 LOAD DISPERSION (BNBC-2020)
            </text>

            {/* Safety Factor Indicator Card (Top Right) with Tooltip */}
            <g
              transform={`translate(${width - 240}, 10)`}
              {...bindHover({
                title: 'Allowable Bearing Capacity & Safety Factor',
                formula: 'q_all = q_ult / FS (FS ≥ 2.5 required)',
                substitution: `q_all = ${result.allowableBearingKpa.toFixed(1)} kPa (FS = ${fs.toFixed(2)}, Applied q = ${result.appliedPressureKpa.toFixed(1)} kPa)`,
                codeRef: 'BNBC 2020 §3.9 / Meyerhof',
                description: 'Safe permissible bearing pressure safeguarding against general shear failure and excessive differential settlement.',
              })}
            >
              <title>{`Allowable Bearing: q_all = ${result.allowableBearingKpa.toFixed(1)} kPa (FS = ${fs.toFixed(2)})`}</title>
              <rect x={0} y={0} width={220} height={52} rx={6} fill="var(--md-sys-color-surface-container-high)" stroke={fsColor} strokeWidth="1.2" />
              <circle cx={14} cy={16} r={4.5} fill={fsColor} />
              <text x={24} y={19} fontSize="10" fontWeight="700" fill={fsColor}>
                {fsLabel}
              </text>
              <text x={14} y={35} fontSize="9" fill="var(--md-sys-color-on-surface)">
                FS = {fs.toFixed(2)} · q_all = {result.allowableBearingKpa.toFixed(1)} kPa
              </text>
              <text x={14} y={46} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
                q_contact = {result.appliedPressureKpa.toFixed(1)} kPa · St = {result.totalSettlementMm.toFixed(1)}mm
              </text>
            </g>

            {/* Soil Strata Layers with Tooltip */}
            <g
              {...bindHover({
                title: 'Soil Overburden & Effective Subgrade',
                formula: 'q_overburden = γ · D_f · Effective stress σ\'_v = q + γ\'·z',
                substitution: `D_f = ${params.embedmentDepthM.toFixed(1)} m, γ = ${params.unitWeightKnPerM3} kN/m³ → q = ${(params.unitWeightKnPerM3 * params.embedmentDepthM).toFixed(1)} kPa`,
                codeRef: 'Terzaghi / Meyerhof Surcharge',
                description: 'Overburden soil provides lateral confining stress stabilizing shear slip failure wedges.',
              })}
            >
              <title>{`Overburden Stratum: D_f = ${params.embedmentDepthM}m, γ = ${params.unitWeightKnPerM3} kN/m³`}</title>
              {/* Upper Stratum (Topsoil / Overburden) */}
              <rect x={30} y={gradeY} width={500} height={footingD} fill="var(--md-sys-color-surface-container)" />
              <rect x={30} y={gradeY} width={500} height={footingD} fill="url(#soilStripe)" />

              {/* Lower Stratum (Bearing Subgrade) */}
              <rect x={30} y={footingBaseY} width={500} height={height - footingBaseY - 15} fill="var(--md-sys-color-surface-container-low)" />
              <rect x={30} y={footingBaseY} width={500} height={height - footingBaseY - 15} fill="url(#gravelPattern)" />
            </g>

            {/* Finished Ground Surface Line */}
            <line x1={30} y1={gradeY} x2={530} y2={gradeY} stroke="var(--md-sys-color-on-surface)" strokeWidth="2.5" />
            <text x={34} y={gradeY - 6} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface)">
              FINISHED GRADE EL ±0.00m
            </text>

            {/* Water Table (GWT) with Tooltip */}
            {waterY <= height - 20 && (
              <g
                {...bindHover({
                  title: 'Groundwater Table & Buoyant Unit Weight',
                  formula: 'γ\' = γ_sat - γ_w where γ_w = 9.81 kN/m³',
                  substitution: `GWT Depth = ${params.waterTableDepthM.toFixed(1)} m below ground level`,
                  codeRef: 'Hydrostatic Buoyancy / Terzaghi',
                  description: 'High water table submerges soil, reducing effective unit weight and cutting base bearing term by ~50%.',
                })}
              >
                <title>{`Water Table: GWT at -${params.waterTableDepthM.toFixed(1)}m`}</title>
                <line x1={30} y1={waterY} x2={530} y2={waterY} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="5 3" />
                <polygon points={`38,${waterY - 7} 44,${waterY - 7} 41,${waterY}`} fill="#0ea5e9" />
                <text x={48} y={waterY - 3} fontSize="9" fontWeight="700" fill="#0ea5e9">
                  GWT ∇ -{params.waterTableDepthM.toFixed(1)}m
                </text>
              </g>
            )}

            {/* 2:1 Stress Dispersion Frustum Lines with Tooltip */}
            {(() => {
              const bZ = footingW * 1.8;
              const yFrust = Math.min(height - 20, footingBaseY + bZ);
              const wAtBottom = footingW + bZ; // 2:1 slope -> slope angle approx 63.4 deg
              return (
                <g
                  {...bindHover({
                    title: '2:1 Approximate Stress Dispersion',
                    formula: 'Δσ_z = P / [ (B + z) · (L + z) ]',
                    substitution: `Spreads 1H : 2V downward under contact area ${(params.footingWidthM * (params.footingLengthM || params.footingWidthM)).toFixed(2)} m²`,
                    codeRef: 'Approximate Load Distribution',
                    description: 'Empirical 2:1 vertical spreading rate widely used for rapid multi-layer settlement assessment.',
                  })}
                >
                  <title>2:1 Stress Dispersion Frustum</title>
                  <line
                    x1={footingCenterX - footingW / 2}
                    y1={footingBaseY}
                    x2={Math.max(40, footingCenterX - wAtBottom / 2)}
                    y2={yFrust}
                    stroke="#f97316"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <line
                    x1={footingCenterX + footingW / 2}
                    y1={footingBaseY}
                    x2={Math.min(520, footingCenterX + wAtBottom / 2)}
                    y2={yFrust}
                    stroke="#f97316"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <text x={footingCenterX - wAtBottom / 2 - 2} y={yFrust - 4} fontSize="8" fill="#f97316">2:1 Slope</text>
                </g>
              );
            })()}

            {/* Boussinesq Stress Bulbs with Tooltip */}
            <g
              {...bindHover({
                title: 'Boussinesq Semi-Infinite Elastic Stress Bulbs',
                formula: 'Δσ_z = (3·Q)/(2π) · z³ / (r² + z²)^(5/2) · Isobar: 0.1q to 0.8q',
                substitution: `0.80q (z ≈ 0.4B), 0.50q (z ≈ 0.8B), 0.20q (z ≈ 1.5B), 0.10q (z ≈ 2.0B)`,
                codeRef: 'Boussinesq (1885) Elastic Theory',
                description: 'Pressure bulbs defining zone of significant stress influence where consolidation settlement occurs.',
              })}
            >
              <title>Boussinesq Stress Isobar Bulbs</title>
              {/* 0.10q Isobar */}
              <path
                d={`M ${footingCenterX - footingW * 0.88} ${footingBaseY} Q ${footingCenterX} ${footingBaseY + footingW * 2.0} ${footingCenterX + footingW * 0.88} ${footingBaseY}`}
                fill="none"
                stroke="var(--md-sys-color-primary)"
                strokeWidth="1"
                strokeOpacity="0.25"
                strokeDasharray="3 3"
              />
              <text x={footingCenterX + 4} y={footingBaseY + footingW * 1.9} fontSize="8" fill="var(--md-sys-color-primary)" fillOpacity="0.7">0.10q</text>

              {/* 0.20q Isobar */}
              <path
                d={`M ${footingCenterX - footingW * 0.72} ${footingBaseY} Q ${footingCenterX} ${footingBaseY + footingW * 1.35} ${footingCenterX + footingW * 0.72} ${footingBaseY}`}
                fill="none"
                stroke="var(--md-sys-color-primary)"
                strokeWidth="1.2"
                strokeOpacity="0.4"
                strokeDasharray="4 2"
              />
              <text x={footingCenterX + 4} y={footingBaseY + footingW * 1.3} fontSize="8" fill="var(--md-sys-color-primary)" fillOpacity="0.8">0.20q</text>

              {/* 0.50q Isobar */}
              <path
                d={`M ${footingCenterX - footingW * 0.55} ${footingBaseY} Q ${footingCenterX} ${footingBaseY + footingW * 0.78} ${footingCenterX + footingW * 0.55} ${footingBaseY}`}
                fill="var(--md-sys-color-primary)"
                fillOpacity="0.08"
                stroke="var(--md-sys-color-primary)"
                strokeWidth="1.5"
                strokeOpacity="0.7"
              />
              <text x={footingCenterX + 4} y={footingBaseY + footingW * 0.74} fontSize="8" fontWeight="600" fill="var(--md-sys-color-primary)">0.50q</text>

              {/* 0.80q Isobar */}
              <path
                d={`M ${footingCenterX - footingW * 0.40} ${footingBaseY} Q ${footingCenterX} ${footingBaseY + footingW * 0.40} ${footingCenterX + footingW * 0.40} ${footingBaseY}`}
                fill="var(--md-sys-color-primary)"
                fillOpacity="0.16"
                stroke="var(--md-sys-color-primary)"
                strokeWidth="1.8"
              />
              <text x={footingCenterX + 4} y={footingBaseY + footingW * 0.36} fontSize="8" fontWeight="700" fill="var(--md-sys-color-primary)">0.80q</text>
            </g>

            {/* Column Stub */}
            <rect x={footingCenterX - 18} y={30} width={36} height={gradeY - 30 + footingD - 18} fill="var(--md-sys-color-surface-container-highest)" stroke="var(--md-sys-color-outline)" strokeWidth="1.5" />

            {/* Applied Column Load Arrow with Tooltip */}
            <g
              {...bindHover({
                title: 'Applied Axial Column Force (P)',
                formula: 'q_contact = P / (B · L) ≤ q_allowable',
                substitution: `P = ${params.appliedColumnLoadKn} kN → q_contact = ${result.appliedPressureKpa.toFixed(1)} kPa on ${(params.footingWidthM * (params.footingLengthM || params.footingWidthM)).toFixed(2)} m² base`,
                codeRef: 'Superstructure Column Load',
                description: 'Factored or service downward column force transferred directly into foundation footing.',
              })}
            >
              <title>{`Column Load: P = ${params.appliedColumnLoadKn} kN`}</title>
              <line x1={footingCenterX} y1={12} x2={footingCenterX} y2={28} stroke="var(--md-sys-color-tertiary)" strokeWidth="3" />
              <polygon points={`${footingCenterX - 4},24 ${footingCenterX + 4},24 ${footingCenterX},30`} fill="var(--md-sys-color-tertiary)" />
              <text x={footingCenterX + 8} y={20} fontSize="9" fontWeight="700" fill="var(--md-sys-color-tertiary)">
                P = {params.appliedColumnLoadKn} kN
              </text>
            </g>

            {/* Reinforced Concrete Footing Pad with Tooltip */}
            <g
              {...bindHover({
                title: 'Spread Footing Pad Geometry & Rebar',
                formula: 'B = ${params.footingWidthM.toFixed(2)}m, L = ${(params.footingLengthM || params.footingWidthM).toFixed(2)}m · d_effective ≥ 150mm',
                substitution: `Base Area = ${(params.footingWidthM * (params.footingLengthM || params.footingWidthM)).toFixed(2)} m², Contact = ${result.appliedPressureKpa.toFixed(1)} kPa`,
                codeRef: 'BNBC 2020 Part 6 / ACI 318',
                description: 'Reinforced concrete foundation slab resisting two-way punching shear and one-way flexural tension.',
              })}
            >
              <title>{`Footing Pad: B = ${params.footingWidthM.toFixed(2)}m`}</title>
              <rect
                x={footingCenterX - footingW / 2}
                y={footingBaseY - 20}
                width={footingW}
                height={20}
                rx={2}
                fill="var(--md-sys-color-surface-container-high)"
                stroke="var(--md-sys-color-on-surface)"
                strokeWidth="2"
              />
              {/* Rebar Mat Representation inside footing */}
              <line
                x1={footingCenterX - footingW / 2 + 6}
                y1={footingBaseY - 5}
                x2={footingCenterX + footingW / 2 - 6}
                y2={footingBaseY - 5}
                stroke="var(--md-sys-color-primary)"
                strokeWidth="2"
              />
            </g>

            {/* Depth Dimension D_f with Tooltip */}
            <g
              {...bindHover({
                title: 'Embedment Depth Dimension (D_f)',
                formula: 'q = γ · D_f (Surcharge Overburden)',
                substitution: `D_f = ${params.embedmentDepthM.toFixed(1)} m`,
                codeRef: 'BNBC 2020 Foundation Embedment',
                description: 'Foundation depth below final grade ensuring frost protection and adequate confining overburden.',
              })}
            >
              <title>{`Depth: D_f = ${params.embedmentDepthM.toFixed(1)} m`}</title>
              <line x1={footingCenterX + footingW / 2 + 15} y1={gradeY} x2={footingCenterX + footingW / 2 + 15} y2={footingBaseY} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
              <polyline points={`${footingCenterX + footingW / 2 + 12},${gradeY + 4} ${footingCenterX + footingW / 2 + 15},${gradeY} ${footingCenterX + footingW / 2 + 18},${gradeY + 4}`} fill="none" stroke="var(--md-sys-color-outline)" strokeWidth="1" />
              <polyline points={`${footingCenterX + footingW / 2 + 12},${footingBaseY - 4} ${footingCenterX + footingW / 2 + 15},${footingBaseY} ${footingCenterX + footingW / 2 + 18},${footingBaseY - 4}`} fill="none" stroke="var(--md-sys-color-outline)" strokeWidth="1" />
              <text x={footingCenterX + footingW / 2 + 22} y={gradeY + footingD / 2 + 3} fontSize="9" fill="var(--md-sys-color-on-surface)">
                D_f = {params.embedmentDepthM.toFixed(1)}m
              </text>
            </g>

            {/* Footing Width Dimension B with Tooltip */}
            <g
              {...bindHover({
                title: 'Footing Base Width Dimension (B)',
                formula: 'Base Area A = B × L · Self-weight term = 0.5·γ·B·N_γ',
                substitution: `B = ${params.footingWidthM.toFixed(2)} m, L = ${(params.footingLengthM || params.footingWidthM).toFixed(2)} m`,
                codeRef: 'Geometric Base Dimension',
                description: 'Short foundation width dimension governing wedge capacity and width-proportional settlement.',
              })}
            >
              <title>{`Width: B = ${params.footingWidthM.toFixed(2)} m`}</title>
              <line x1={footingCenterX - footingW / 2} y1={footingBaseY + 6} x2={footingCenterX + footingW / 2} y2={footingBaseY + 6} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
              <text x={footingCenterX} y={footingBaseY + 18} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-on-surface)">
                B = {params.footingWidthM.toFixed(2)}m
              </text>
            </g>

            {/* Geotechnical Parameters Tag with Tooltip */}
            <g
              transform="translate(545, 75)"
              {...bindHover({
                title: 'Meyerhof General Bearing Capacity Formulation',
                formula: 'q_ult = c\'·N_c·s_c·d_c + q·N_q·s_q·d_q + 0.5·γ·B·N_γ·s_γ·d_γ',
                substitution: `c=${params.soilCohesionKpa} kPa, φ=${params.frictionAngleDeg}°, γ=${params.unitWeightKnPerM3} kN/m³ → q_ult = ${result.ultimateBearingKpa.toFixed(0)} kPa`,
                codeRef: 'Meyerhof (1963) / BNBC 2020 §3.9',
                description: 'Full tri-component superposition formulation combining cohesion, surcharge, and wedge gravity.',
              })}
            >
              <title>Geotechnical Soil &amp; Capacity Schedule</title>
              <rect x={0} y={0} width={125} height={235} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
              <text x={10} y={18} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface)">SOIL PARAMS</text>
              <text x={10} y={34} fontSize="8.5" fill="var(--md-sys-color-on-surface-variant)">c = {params.soilCohesionKpa} kPa</text>
              <text x={10} y={48} fontSize="8.5" fill="var(--md-sys-color-on-surface-variant)">φ = {params.frictionAngleDeg}°</text>
              <text x={10} y={62} fontSize="8.5" fill="var(--md-sys-color-on-surface-variant)">γ = {params.unitWeightKnPerM3} kN/m³</text>
              <line x1={10} y1={72} x2={115} y2={72} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
              <text x={10} y={86} fontSize="9" fontWeight="700" fill="var(--md-sys-color-primary)">BEARING CAPACITY</text>
              <text x={10} y={100} fontSize="8" fill="var(--md-sys-color-on-surface)">q_ult: {result.ultimateBearingKpa.toFixed(0)} kPa</text>
              <text x={10} y={114} fontSize="8" fill="var(--md-sys-color-on-surface)">q_net: {result.netUltimateBearingKpa.toFixed(0)} kPa</text>
              <text x={10} y={128} fontSize="8" fontWeight="700" fill="var(--md-sys-color-primary)">q_all: {result.allowableBearingKpa.toFixed(0)} kPa</text>
              <line x1={10} y1={138} x2={115} y2={138} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
              <text x={10} y={152} fontSize="9" fontWeight="700" fill="var(--md-sys-color-secondary)">SETTLEMENT</text>
              <text x={10} y={166} fontSize="8" fill="var(--md-sys-color-on-surface)">Se: {result.immediateSettlementMm.toFixed(1)} mm</text>
              <text x={10} y={180} fontSize="8" fill="var(--md-sys-color-on-surface)">Sc: {result.consolidationSettlementMm.toFixed(1)} mm</text>
              <text x={10} y={194} fontSize="8" fontWeight="700" fill={result.settlementPass ? '#10b981' : '#f43f5e'}>
                St: {result.totalSettlementMm.toFixed(1)} mm
              </text>
              <text x={10} y={206} fontSize="7" fill="var(--md-sys-color-on-surface-variant)">
                Lim: {result.permissibleSettlementMm} mm ({result.settlementPass ? 'PASS' : 'FAIL'})
              </text>
              <line x1={10} y1={214} x2={115} y2={214} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
              <text x={10} y={226} fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">
                Hover depth to inspect Δσ
              </text>
            </g>

            {/* Interactive Depth Crosshair and Value Card */}
            {hoverDepth && (
              <g pointerEvents="none">
                <line
                  x1={30}
                  y1={hoverDepth.py}
                  x2={530}
                  y2={hoverDepth.py}
                  stroke="var(--md-sys-color-primary)"
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                />
                <circle cx={footingCenterX} cy={hoverDepth.py} r="4" fill="var(--md-sys-color-primary)" stroke="#fff" strokeWidth="1.5" />
                <g transform={`translate(${Math.min(380, footingCenterX + 35)}, ${Math.max(gradeY + 10, hoverDepth.py - 22)})`}>
                  <rect x={0} y={0} width={140} height={44} rx={5} fill="var(--md-sys-color-surface)" stroke="var(--md-sys-color-primary)" strokeWidth="1.2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
                  <text x={8} y={13} fontSize="8.5" fontWeight="700" fill="var(--md-sys-color-primary)">
                    Depth z = {hoverDepth.z.toFixed(2)}m (El -{(params.embedmentDepthM + hoverDepth.z).toFixed(2)}m)
                  </text>
                  <text x={8} y={25} fontSize="8" fill="var(--md-sys-color-on-surface)">
                    Δσ_v = {hoverDepth.deltaSigma.toFixed(1)} kPa ({(hoverDepth.deltaSigma / result.appliedPressureKpa * 100).toFixed(0)}% q0)
                  </text>
                  <text x={8} y={37} fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">
                    Total σ = {(hoverDepth.sigmaV0 + hoverDepth.deltaSigma).toFixed(1)} kPa (σ\'v0: {hoverDepth.sigmaV0.toFixed(1)})
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>
      )}
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 3. ACI 211 Concrete Mix Diagram */
export const ConcreteMixSvg: React.FC<{ params: ConcreteMixParameters; result: ConcreteMixResult }> = ({
  params,
  result,
}) => {
  const { tooltip, containerRef, bindHover } = useFormulaTooltip();
  const total = Math.max(0, result.totalDensityKgPerM3);

  if (total <= 0 || params.targetStrengthMpa <= 0) {
    return (
      <svg viewBox="0 0 680 220" className="w-full h-auto select-none font-mono" role="img">
        <rect x={10} y={10} width={660} height={200} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
        <text x={340} y={100} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          ZERO CONCRETE MIX BASELINE (0 kg/m³)
        </text>
        <text x={340} y={122} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
          Enter target characteristic strength (f'c) or water-cement ratio to compute gravimetric batch proportions
        </text>
      </svg>
    );
  }

  const wPct = (result.waterKgPerM3 / total) * 100;
  const cPct = (result.cementKgPerM3 / total) * 100;
  const fPct = (result.fineAggKgPerM3 / total) * 100;
  const gPct = (result.coarseAggKgPerM3 / total) * 100;

  const segments = [
    {
      label: 'Cement',
      kg: result.cementKgPerM3,
      pct: cPct,
      color: 'var(--md-sys-color-primary)',
      formula: 'M_c = M_w / (w/c)',
      sub: `M_c = ${result.waterKgPerM3.toFixed(1)} / ${params.waterCementRatio.toFixed(2)} = ${result.cementKgPerM3.toFixed(1)} kg/m³ (${(result.cementKgPerM3 / 50).toFixed(1)} Bags)`,
      ref: 'ACI 211.1 / BNBC Part 6',
      desc: 'Binder mass determined from mixing water demand and target water-cement ratio.',
    },
    {
      label: 'Water',
      kg: result.waterKgPerM3,
      pct: wPct,
      color: 'var(--md-sys-color-secondary)',
      formula: 'w/c = M_water / M_cement',
      sub: `Water = ${result.waterKgPerM3.toFixed(1)} kg/m³ (w/c = ${params.waterCementRatio.toFixed(2)})`,
      ref: 'Abram\'s Law / ASTM C125',
      desc: 'Governs fresh slump workability and capillary porosity of hardened paste.',
    },
    {
      label: 'Fine Sand',
      kg: result.fineAggKgPerM3,
      pct: fPct,
      color: 'var(--md-sys-color-tertiary)',
      formula: 'V_fa = 1.0 - (V_c + V_w + V_ca + V_air)',
      sub: `Sand = ${result.fineAggKgPerM3.toFixed(1)} kg/m³ (${fPct.toFixed(1)}% mass share)`,
      ref: 'ACI Absolute Volume Method',
      desc: 'Fills voids between coarse aggregates to create homogeneous flowable mortar matrix.',
    },
    {
      label: 'Coarse Agg',
      kg: result.coarseAggKgPerM3,
      pct: gPct,
      color: 'var(--md-sys-color-on-surface-variant)',
      formula: 'M_ca = Dry-Rodded Unit Weight × (b/b₀)',
      sub: `Coarse = ${result.coarseAggKgPerM3.toFixed(1)} kg/m³ (${gPct.toFixed(1)}% mass share)`,
      ref: 'ACI 211.1 Table 6.3.6',
      desc: 'Primary skeleton carrying compressive forces and limiting shrinkage deformation.',
    },
  ];

  let cursorX = 40;
  const barWidth = 600;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg viewBox="0 0 680 220" className="w-full h-auto select-none font-mono" role="img">
        <text
          x={40}
          y={28}
          fontSize="11"
          fontWeight="600"
          fill="var(--md-sys-color-on-surface)"
          {...bindHover({
            title: 'Target Compressive Strength & Total Batch Density',
            formula: 'f\'_cr = f\'_c + 1.64·s · Total Density ρ = Σ M_i',
            substitution: `f\'_c = ${params.targetStrengthMpa} MPa → Total = ${total.toFixed(0)} kg/m³ (W/C = ${params.waterCementRatio.toFixed(2)})`,
            codeRef: 'BNBC 2020 / ACI 318 §26.4',
            description: 'Target mean strength providing 95% statistical confidence above specified design characteristic strength.',
          })}
        >
          GRAVIMETRIC CONSTITUENT PROPORTIONS (TOTAL = {total.toFixed(0)} kg/m³ · W/C = {params.waterCementRatio.toFixed(2)})
        </text>

        {segments.map((seg) => {
          const w = (seg.pct / 100) * barWidth;
          const x = cursorX;
          cursorX += w;
          return (
            <g
              key={seg.label}
              {...bindHover({
                title: `${seg.label} Batch Proportion`,
                formula: seg.formula,
                substitution: seg.sub,
                codeRef: seg.ref,
                description: seg.desc,
              })}
            >
              <title>{`${seg.label}: ${seg.kg.toFixed(1)} kg/m³ (${seg.pct.toFixed(1)}%)`}</title>
              <rect x={x} y={44} width={Math.max(2, w - 2)} height={46} rx={4} fill={seg.color} />
            </g>
          );
        })}

        {segments.map((seg, i) => {
          const cardX = 40 + i * 152;
          return (
            <g
              key={seg.label}
              {...bindHover({
                title: `${seg.label} Quantity & Proportion`,
                formula: seg.formula,
                substitution: seg.sub,
                codeRef: seg.ref,
                description: seg.desc,
              })}
            >
              <title>{`${seg.label}: ${seg.kg.toFixed(1)} kg/m³`}</title>
              <rect x={cardX} y={112} width={142} height={82} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
              <rect x={cardX + 12} y={126} width={10} height={10} rx={2} fill={seg.color} />
              <text x={cardX + 28} y={135} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface)">
                {seg.label}
              </text>
              <text x={cardX + 12} y={160} fontSize="14" fontWeight="700" fill="var(--md-sys-color-on-surface)">
                {seg.kg.toFixed(1)} kg/m³
              </text>
              <text x={cardX + 12} y={178} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
                {seg.pct.toFixed(1)}% by mass
              </text>
            </g>
          );
        })}
      </svg>
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 4. Open Channel Hydraulics Diagram with Flow Regime & Freeboard */
export const ChannelHydraulicsSvg: React.FC<{ params: ChannelParameters; result: ChannelHydraulicsResult }> = ({
  params,
  result,
}) => {
  const { tooltip, containerRef, bindHover } = useFormulaTooltip();
  const width = 680;
  const height = 260;
  const centerX = 280;
  const isCircular = params.shape === 'circular' || result.shape === 'circular';

  if ((isCircular && ((params.diameterM ?? 0) <= 0 && (result.diameterM || 0) <= 0)) || (!isCircular && params.bottomWidthM <= 0)) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <rect x={10} y={10} width={width - 20} height={height - 20} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
        <text x={width / 2} y={height / 2 - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          ZERO CHANNEL GEOMETRY (0.00 m)
        </text>
        <text x={width / 2} y={height / 2 + 12} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
          Enter channel bed width or conduit diameter to calculate Manning discharge and normal depth
        </text>
      </svg>
    );
  }

  // Flow regime styling
  const fr = result.froudeNumber;
  const isSubcritical = fr < 0.98;
  const isCritical = fr >= 0.98 && fr <= 1.02;
  const regimeColor = isCritical ? '#f59e0b' : isSubcritical ? '#0284c7' : '#ef4444';
  const regimeLabel = isCritical
    ? 'CRITICAL (Fr ≈ 1.0, Emin)'
    : isSubcritical
    ? 'SUBCRITICAL (Tranquil, Fr < 1)'
    : 'SUPERCRITICAL (Rapid Shooting, Fr > 1)';

  // Circular Conduit geometry rendering
  if (isCircular) {
    const D = params.diameterM || result.diameterM || 1.2;
    const y = Math.min(D, params.flowDepthM);
    const radiusPx = 80;
    const scale = (radiusPx * 2) / D;
    const centerY = 140;
    const yPx = y * scale;

    // Angle theta in radians
    const cosArg = Math.max(-1, Math.min(1, 1 - (2 * y) / D));
    const theta = 2 * Math.acos(cosArg);
    const halfTheta = theta / 2;

    // Water surface segment coordinates
    const leftX = centerX - radiusPx * Math.sin(halfTheta);
    const rightX = centerX + radiusPx * Math.sin(halfTheta);
    const waterY = centerY + radiusPx - yPx;
    const bottomY = centerY + radiusPx;

    const largeArc = theta > Math.PI ? 1 : 0;
    const waterPath = `M ${leftX} ${waterY} A ${radiusPx} ${radiusPx} 0 ${largeArc} 0 ${rightX} ${waterY} Z`;

    return (
      <div ref={containerRef} className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
          <defs>
            <linearGradient id="circWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          <text x={24} y={24} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">
            CIRCULAR CONDUIT / STORM SEWER CROSS-SECTION (MANNING)
          </text>

          {/* Regime Badge with Tooltip */}
          <g
            transform={`translate(${width - 270}, 10)`}
            {...bindHover({
              title: 'Froude Number & Energy Regime',
              formula: 'Fr = v / √(g · D_h) where D_h = A / TopWidth',
              substitution: `Fr = ${result.froudeNumber.toFixed(2)} (${result.flowRegime})`,
              codeRef: 'Dynamic Similarity in Gravity Conduits',
              description: 'Characterizes gravitational wave propagation speed versus mean water flow velocity.',
            })}
          >
            <title>{`Flow Regime: Fr = ${result.froudeNumber.toFixed(2)}`}</title>
            <rect x={0} y={0} width={250} height={26} rx={4} fill={regimeColor} fillOpacity="0.12" stroke={regimeColor} strokeWidth="1" />
            <circle cx={14} cy={13} r={4} fill={regimeColor} />
            <text x={24} y={16} fontSize="9" fontWeight="700" fill={regimeColor}>
              {regimeLabel}
            </text>
          </g>

          {/* Outer Conduit Wall with Tooltip */}
          <g
            {...bindHover({
              title: 'Circular Conduit Geometry & Roughness',
              formula: 'Total Area A_full = π · D² / 4 · Roughness n = ${params.roughnessN}',
              substitution: `Diameter D = ${D.toFixed(2)} m, Slope S_0 = ${params.bedSlope}`,
              codeRef: 'ASTM C76 Concrete Pipe / AASHTO',
              description: 'Precast reinforced concrete sewer or culvert barrel.',
            })}
          >
            <title>{`Conduit: D = ${D.toFixed(2)}m`}</title>
            <circle cx={centerX} cy={centerY} r={radiusPx + 6} fill="none" stroke="#64748b" strokeWidth="5" />
            <circle cx={centerX} cy={centerY} r={radiusPx} fill="#f1f5f9" fillOpacity="0.1" stroke="#334155" strokeWidth="2" />
          </g>

          {/* Water body with Tooltip */}
          <g
            {...bindHover({
              title: 'Partially-Full Circular Manning Flow',
              formula: 'Q = (1/n) · A · R_h^(2/3) · S_0^(1/2) · A = (D²/8)·(θ - sinθ)',
              substitution: `Q = ${result.dischargeM3ps.toFixed(3)} m³/s, v = ${result.velocityMps.toFixed(2)} m/s, θ = ${(theta * (180 / Math.PI)).toFixed(1)}°`,
              codeRef: 'Manning Equation for Partially Full Pipes',
              description: 'Discharge in gravity storm sewer flowing partially full under atmospheric pressure.',
            })}
          >
            <title>{`Flow: Q = ${result.dischargeM3ps.toFixed(3)} m³/s`}</title>
            <path d={waterPath} fill="url(#circWaterGrad)" stroke="#0ea5e9" strokeWidth="1.5" />
          </g>

          {/* Water Surface Line */}
          <line x1={leftX} y1={waterY} x2={rightX} y2={waterY} stroke="#0284c7" strokeWidth="2" strokeDasharray="4 2" />

          {/* Conduit Diameter & Depth Callouts with Tooltip */}
          <g
            {...bindHover({
              title: 'Conduit Diameter (D)',
              formula: 'Diameter D = Internal Bore Dimension',
              substitution: `D = ${D.toFixed(2)} m`,
              codeRef: 'Pipeline Sizing Standard',
            })}
          >
            <line x1={centerX - radiusPx - 15} y1={centerY - radiusPx} x2={centerX - radiusPx - 15} y2={centerY + radiusPx} stroke="#64748b" strokeWidth="1" />
            <text x={centerX - radiusPx - 20} y={centerY + 3} textAnchor="end" fontSize="9" fontWeight="600" fill="#64748b">
              D = {D.toFixed(2)}m
            </text>
          </g>

          <g
            {...bindHover({
              title: 'Normal Water Depth & Filling Ratio',
              formula: 'Filling Ratio = y / D · Wetted Perimeter P = θ · D / 2',
              substitution: `y = ${y.toFixed(2)} m (${((y / D) * 100).toFixed(0)}% full)`,
              codeRef: 'Hydraulic Filling Limits (Max Q at y/D ≈ 0.938)',
              description: 'Maximum velocity occurs at y/D = 0.81; maximum discharge occurs at y/D = 0.94.',
            })}
          >
            <line x1={centerX + radiusPx + 15} y1={waterY} x2={centerX + radiusPx + 15} y2={bottomY} stroke="#0284c7" strokeWidth="1.2" />
            <text x={centerX + radiusPx + 20} y={(waterY + bottomY) / 2 + 3} fontSize="9" fontWeight="600" fill="#0284c7">
              y = {y.toFixed(2)}m ({(result.fillingRatio ? result.fillingRatio * 100 : (y / D) * 100).toFixed(0)}%)
            </text>
          </g>

          {/* Hydraulic Jump indicator if supercritical */}
          {result.hydraulicJump?.isOccurring && (
            <g
              transform={`translate(${centerX - 80}, ${centerY + radiusPx + 20})`}
              {...bindHover({
                title: 'Hydraulic Jump Conjugate Sequent Depth',
                formula: 'y₂ / y₁ = 0.5 · [ √(1 + 8·Fr₁²) - 1 ] (Belanger Equation)',
                substitution: `y₂ = ${result.hydraulicJump.sequentDepthM.toFixed(2)} m from initial depth y₁ = ${y.toFixed(2)} m`,
                codeRef: 'Belanger Momentum Theorem (1828)',
                description: 'Abrupt energy-dissipating jump transition from supercritical shooting to subcritical tranquil flow.',
              })}
            >
              <title>Hydraulic Jump Warning</title>
              <rect x="0" y="0" width="160" height="20" rx="4" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1" />
              <text x="80" y="13" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ef4444">
                ⚠ Supercritical: Jump y2 = {result.hydraulicJump.sequentDepthM.toFixed(2)}m
              </text>
            </g>
          )}

          {/* Hydraulic Metrics Summary Card (Right Inset) with Tooltip */}
          <g
            transform={`translate(${width - 170}, 48)`}
            {...bindHover({
              title: 'Full Hydraulic Section Metrics',
              formula: 'Discharge Q = A · v · Critical Depth y_c = (Q² / g·T)^(1/3)',
              substitution: `Q = ${result.dischargeM3ps.toFixed(3)} m³/s, v = ${result.velocityMps.toFixed(2)} m/s, y_c = ${result.criticalDepthM.toFixed(3)} m`,
              codeRef: 'Open Channel Engineering Schedule',
              description: 'Summary of critical hydraulic design metrics for storm conduit design.',
            })}
          >
            <title>Conduit Metrics Schedule</title>
            <rect x={0} y={0} width={150} height={190} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
            <text x={12} y={20} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface)">CONDUIT METRICS</text>
            <line x1={12} y1={28} x2={138} y2={28} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
            <text x={12} y={44} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Discharge Q:</text>
            <text x={12} y={58} fontSize="12" fontWeight="700" fill="#0ea5e9">{result.dischargeM3ps.toFixed(3)} m³/s</text>
            <text x={12} y={76} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Mean Velocity V:</text>
            <text x={12} y={90} fontSize="11" fontWeight="600" fill="var(--md-sys-color-on-surface)">{result.velocityMps.toFixed(2)} m/s</text>
            <text x={12} y={108} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Critical Depth yc:</text>
            <text x={12} y={122} fontSize="11" fontWeight="600" fill="#f59e0b">{result.criticalDepthM.toFixed(3)} m</text>
            <text x={12} y={140} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Froude Number Fr:</text>
            <text x={12} y={154} fontSize="12" fontWeight="700" fill={regimeColor}>{result.froudeNumber.toFixed(2)}</text>
            <text x={12} y={170} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Full Cap Qfull: {result.fullDischargeM3ps?.toFixed(2) || '-'} m³/s</text>
          </g>
        </svg>
        <FormulaTooltipOverlay tooltip={tooltip} />
        <DiagramFormulaHint />
      </div>
    );
  }

  // Trapezoidal / Rectangular Channel
  const bedY = 195;
  const isRectangular = params.shape === 'rectangular' || params.sideSlopeZ === 0;
  const totalDepth = params.flowDepthM + (params.freeboardRequirementM || 0.3);
  const sideSlope = isRectangular ? 0 : params.sideSlopeZ;
  const topWidthTotal = params.bottomWidthM + 2 * sideSlope * totalDepth;
  const scale = Math.min(110 / Math.max(0.5, totalDepth), 340 / Math.max(1, topWidthTotal));
  const bPx = params.bottomWidthM * scale;
  const yPx = params.flowDepthM * scale;
  const totalDepthPx = totalDepth * scale;
  const waterTopHalfPx = (result.topWidthM * scale) / 2;
  const bankTopHalfPx = (topWidthTotal * scale) / 2;

  const waterPolygon = `
    ${centerX - bPx / 2},${bedY}
    ${centerX + bPx / 2},${bedY}
    ${centerX + waterTopHalfPx},${bedY - yPx}
    ${centerX - waterTopHalfPx},${bedY - yPx}
  `;

  const channelPolyline = `
    ${centerX - bankTopHalfPx - 25},${bedY - totalDepthPx}
    ${centerX - bankTopHalfPx},${bedY - totalDepthPx}
    ${centerX - bPx / 2},${bedY}
    ${centerX + bPx / 2},${bedY}
    ${centerX + bankTopHalfPx},${bedY - totalDepthPx}
    ${centerX + bankTopHalfPx + 25},${bedY - totalDepthPx}
  `;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <defs>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Header & Flow Regime Badge */}
        <text x={24} y={24} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">
          {isRectangular ? 'RECTANGULAR FLUME / CULVERT GEOMETRY' : 'TRAPEZOIDAL OPEN CHANNEL GEOMETRY'}
        </text>

        {/* Regime Badge with Tooltip */}
        <g
          transform={`translate(${width - 270}, 10)`}
          {...bindHover({
            title: 'Froude Number Flow Regime',
            formula: 'Fr = v / √(g · D_h) where Hydraulic Depth D_h = A / TopWidth',
            substitution: `Fr = ${result.froudeNumber.toFixed(2)} (${result.flowRegime})`,
            codeRef: 'Chow Open-Channel Hydraulics',
            description: 'Subcritical (Fr < 1): Tranquil stream; Supercritical (Fr > 1): High velocity rapid chute.',
          })}
        >
          <title>{`Flow Regime: Fr = ${result.froudeNumber.toFixed(2)}`}</title>
          <rect x={0} y={0} width={250} height={26} rx={4} fill={regimeColor} fillOpacity="0.12" stroke={regimeColor} strokeWidth="1" />
          <circle cx={14} cy={13} r={4} fill={regimeColor} />
          <text x={24} y={16} fontSize="9" fontWeight="700" fill={regimeColor}>
            {regimeLabel}
          </text>
        </g>

        {/* Channel Bed & Banks with Tooltip */}
        <g
          {...bindHover({
            title: 'Channel Bed & Side Slopes',
            formula: 'Wetted Perimeter P = b + 2 · y · √(1 + z²)',
            substitution: `Bed b = ${params.bottomWidthM.toFixed(2)} m, Side Slope z = ${params.sideSlopeZ}:1 → P = ${result.wettedPerimeterM.toFixed(2)} m`,
            codeRef: 'Open Channel Geometry Formulation',
            description: 'Solid boundary resisting flow via Manning boundary shear roughness n = ${params.roughnessN}.',
          })}
        >
          <title>{`Bed: b = ${params.bottomWidthM.toFixed(2)}m, z = ${params.sideSlopeZ}:1`}</title>
          <polyline fill="none" stroke="var(--md-sys-color-on-surface)" strokeWidth="3" points={channelPolyline} />
        </g>

        {/* Flow Body with Tooltip */}
        <g
          {...bindHover({
            title: 'Manning Uniform Flow Discharge',
            formula: 'Q = (1/n) · A · R_h^(2/3) · S_0^(1/2) · Area A = (b + z·y)·y',
            substitution: `Q = ${result.dischargeM3ps.toFixed(2)} m³/s, v = ${result.velocityMps.toFixed(2)} m/s, A = ${result.flowAreaM2.toFixed(2)} m²`,
            codeRef: 'Manning Formula (1889)',
            description: 'Fundamental governing equation for uniform gravity open-channel hydraulics.',
          })}
        >
          <title>{`Discharge: Q = ${result.dischargeM3ps.toFixed(2)} m³/s`}</title>
          <polygon points={waterPolygon} fill="url(#waterGrad)" stroke="#0ea5e9" strokeWidth="1.8" />
        </g>

        {/* Water Surface Wave Motif with Tooltip */}
        <g
          {...bindHover({
            title: 'Water Surface Top Width (T)',
            formula: 'Top Width T = b + 2 · z · y',
            substitution: `T = ${result.topWidthM.toFixed(2)} m at normal depth y = ${params.flowDepthM.toFixed(2)} m`,
            codeRef: 'Free Surface Geometry',
            description: 'Width of water surface exposed to atmosphere.',
          })}
        >
          <line x1={centerX - waterTopHalfPx} y1={bedY - yPx} x2={centerX + waterTopHalfPx} y2={bedY - yPx} stroke="#0ea5e9" strokeWidth="2" strokeDasharray="6 3" />
        </g>

        {/* Critical Depth Marker yc with Tooltip */}
        {result.criticalDepthM && (
          <g
            {...bindHover({
              title: 'Critical Flow Depth (y_c)',
              formula: 'Q² · T / (g · A³) = 1.0 → y_c = (q² / g)^(1/3) [for rectangular]',
              substitution: `y_c = ${result.criticalDepthM.toFixed(2)} m (Flow depth = ${params.flowDepthM.toFixed(2)} m)`,
              codeRef: 'Specific Energy Minimization: dE/dy = 0',
              description: 'Depth at which specific energy E = y + v²/(2g) reaches its absolute minimum for discharge Q.',
            })}
          >
            <title>{`Critical Depth: yc = ${result.criticalDepthM.toFixed(2)}m`}</title>
            <line
              x1={centerX - waterTopHalfPx}
              y1={bedY - result.criticalDepthM * scale}
              x2={centerX + waterTopHalfPx}
              y2={bedY - result.criticalDepthM * scale}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <text
              x={centerX + waterTopHalfPx + 8}
              y={bedY - result.criticalDepthM * scale + 3}
              fontSize="8"
              fontWeight="bold"
              fill="#f59e0b"
            >
              yc={result.criticalDepthM.toFixed(2)}m
            </text>
          </g>
        )}

        {/* Water Depth y Dimension with Tooltip */}
        <g
          {...bindHover({
            title: 'Normal Flow Depth (y) & Hydraulic Radius',
            formula: 'R_h = A / P = [ (b + z·y)·y ] / [ b + 2·y·√(1 + z²) ]',
            substitution: `y = ${params.flowDepthM.toFixed(2)} m → R_h = ${result.hydraulicRadiusM.toFixed(3)} m`,
            codeRef: 'Hydraulic Efficiency',
            description: 'Normal steady uniform water depth established by bed slope S_0 = ${params.bedSlope}.',
          })}
        >
          <title>{`Depth: y = ${params.flowDepthM.toFixed(2)}m`}</title>
          <line x1={centerX - waterTopHalfPx - 18} y1={bedY - yPx} x2={centerX - waterTopHalfPx - 18} y2={bedY} stroke="#0ea5e9" strokeWidth="1.2" />
          <text x={centerX - waterTopHalfPx - 24} y={bedY - yPx / 2 + 3} textAnchor="end" fontSize="9" fontWeight="600" fill="#0ea5e9">
            y = {params.flowDepthM.toFixed(2)}m
          </text>
        </g>

        {/* Freeboard Dimension with Tooltip */}
        {(params.freeboardRequirementM || 0) > 0 && (
          <g
            {...bindHover({
              title: 'Canal Bank Freeboard (FB)',
              formula: 'FB = √(c · y) ≈ 0.20 to 0.60 m (USBR Recommendation)',
              substitution: `FB = ${(params.freeboardRequirementM || 0.3).toFixed(2)} m above max water stage`,
              codeRef: 'USBR Design of Small Canals',
              description: 'Vertical safety margin preventing wave overtopping and bank erosion.',
            })}
          >
            <title>{`Freeboard: ${(params.freeboardRequirementM || 0.3).toFixed(2)}m`}</title>
            <line x1={centerX + bankTopHalfPx + 15} y1={bedY - totalDepthPx} x2={centerX + bankTopHalfPx + 15} y2={bedY - yPx} stroke="var(--md-sys-color-tertiary)" strokeWidth="1.2" />
            <text x={centerX + bankTopHalfPx + 20} y={bedY - yPx - (totalDepthPx - yPx) / 2 + 3} fontSize="8" fontWeight="600" fill="var(--md-sys-color-tertiary)">
              FB: {(params.freeboardRequirementM || 0.3).toFixed(2)}m
            </text>
          </g>
        )}

        {/* Bottom Width Dimension with Tooltip */}
        <g
          {...bindHover({
            title: 'Canal Bed Width (b)',
            formula: 'b = Bottom Bed Width',
            substitution: `Bed b = ${params.bottomWidthM.toFixed(2)} m`,
            codeRef: 'Canal Cross Section Geometry',
          })}
        >
          <line x1={centerX - bPx / 2} y1={bedY + 12} x2={centerX + bPx / 2} y2={bedY + 12} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
          <text x={centerX} y={bedY + 24} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-on-surface)">
            Bed b = {params.bottomWidthM.toFixed(2)}m {!isRectangular && `(Side Slope ${params.sideSlopeZ}:1)`}
          </text>
        </g>

        {/* Hydraulic Metrics Summary Card (Right Inset) with Tooltip */}
        <g
          transform={`translate(${width - 170}, 48)`}
          {...bindHover({
            title: 'Channel Hydraulic Metrics Schedule',
            formula: 'Q = A · v · Hydraulic Radius R_h = A / P',
            substitution: `Q = ${result.dischargeM3ps.toFixed(2)} m³/s, v = ${result.velocityMps.toFixed(2)} m/s, R = ${result.hydraulicRadiusM.toFixed(3)} m`,
            codeRef: 'Open Channel Hydraulic Schedule',
            description: 'Complete cross-section hydraulic parameters.',
          })}
        >
          <title>Hydraulic Metrics Schedule</title>
          <rect x={0} y={0} width={150} height={190} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
          <text x={12} y={20} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface)">HYDRAULIC METRICS</text>
          <line x1={12} y1={28} x2={138} y2={28} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
          <text x={12} y={44} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Discharge Q:</text>
          <text x={12} y={58} fontSize="12" fontWeight="700" fill="#0ea5e9">{result.dischargeM3ps.toFixed(2)} m³/s</text>
          <text x={12} y={76} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Mean Velocity V:</text>
          <text x={12} y={90} fontSize="11" fontWeight="600" fill="var(--md-sys-color-on-surface)">{result.velocityMps.toFixed(2)} m/s</text>
          <text x={12} y={108} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Hydraulic Radius R:</text>
          <text x={12} y={122} fontSize="11" fontWeight="600" fill="var(--md-sys-color-on-surface)">{result.hydraulicRadiusM.toFixed(3)} m</text>
          <text x={12} y={140} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Froude Number Fr:</text>
          <text x={12} y={154} fontSize="12" fontWeight="700" fill={regimeColor}>{result.froudeNumber.toFixed(2)}</text>
          <text x={12} y={170} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Top Width: {result.topWidthM.toFixed(2)}m</text>
        </g>
      </svg>
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 5. Concrete Materials Diagram (BNBC 2020 / ACI 318 / IS 456) */
export const ConcreteMaterialsDiagramSvg: React.FC<{ params: ConcreteMaterialParameters; result: ConcreteMaterialResult }> = ({
  params,
  result,
}) => {
  const { tooltip, containerRef, bindHover } = useFormulaTooltip();
  const width = 680;
  const height = 240;
  const totalVol = Math.max(0, result.totalDryVolumeWithWastageM3);

  if (totalVol <= 0 || params.wetVolumeM3 <= 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <rect x={10} y={10} width={width - 20} height={height - 20} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
        <text x={width / 2} y={height / 2 - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          ZERO CONCRETE VOLUME (0.00 m³)
        </text>
        <text x={width / 2} y={height / 2 + 12} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
          Enter concrete member volume or dimensions to estimate cement bags, sand cft and stone aggregates
        </text>
      </svg>
    );
  }

  const barW = 580;
  const startX = 50;

  const cPct = (result.cementVolumeM3 / totalVol) * 100;
  const sPct = (result.sandVolumeM3 / totalVol) * 100;
  const aPct = (result.aggregateVolumeM3 / totalVol) * 100;

  const wC = (cPct / 100) * barW;
  const wS = (sPct / 100) * barW;
  const wA = (aPct / 100) * barW;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <text
          x={50}
          y={28}
          fontSize="11"
          fontWeight="700"
          fill="var(--md-sys-color-on-surface)"
          {...bindHover({
            title: 'Concrete Dry Volume Expansion Multiplier',
            formula: 'V_dry = 1.54 × V_wet (30% granular voids + 24% compaction/shrinkage)',
            substitution: `Wet Volume = ${params.wetVolumeM3.toFixed(2)} m³ → Dry Batch = ${totalVol.toFixed(2)} m³ (Dry Factor: ${result.dryVolumeFactor})`,
            codeRef: 'PWD Standard Specifications / BNBC 2020',
            description: 'Volumetric expansion factor converting in-situ solid wet concrete into loose dry batch volumes.',
          })}
        >
          VOLUMETRIC DRY CONSTITUENT DISTRIBUTION ({result.code} · Dry Factor {result.dryVolumeFactor})
        </text>

        <g transform="translate(0, 42)">
          <g
            {...bindHover({
              title: 'Cement Volumetric Share',
              formula: 'V_c = [ r_c / (r_c + r_s + r_a) ] × V_dry',
              substitution: `Cement = ${result.cementVolumeM3.toFixed(2)} m³ (${cPct.toFixed(1)}% of dry mix)`,
              codeRef: 'Volumetric Ratio Batching',
            })}
          >
            <rect x={startX} y={0} width={Math.max(4, wC - 2)} height={42} rx={4} fill="var(--md-sys-color-primary)" />
          </g>
          <g
            {...bindHover({
              title: 'Fine Sand Volumetric Share',
              formula: 'V_s = [ r_s / (r_c + r_s + r_a) ] × V_dry',
              substitution: `Sand = ${result.sandVolumeM3.toFixed(2)} m³ (${sPct.toFixed(1)}% of dry mix)`,
              codeRef: 'Volumetric Ratio Batching',
            })}
          >
            <rect x={startX + wC} y={0} width={Math.max(4, wS - 2)} height={42} rx={4} fill="var(--md-sys-color-tertiary)" />
          </g>
          <g
            {...bindHover({
              title: 'Coarse Aggregate Volumetric Share',
              formula: 'V_a = [ r_a / (r_c + r_s + r_a) ] × V_dry',
              substitution: `Stone/Khoa = ${result.aggregateVolumeM3.toFixed(2)} m³ (${aPct.toFixed(1)}% of dry mix)`,
              codeRef: 'Volumetric Ratio Batching',
            })}
          >
            <rect x={startX + wC + wS} y={0} width={Math.max(4, wA - 2)} height={42} rx={4} fill="var(--md-sys-color-secondary)" />
          </g>
        </g>

        <g transform="translate(50, 105)">
          {/* Cement Card */}
          <g
            {...bindHover({
              title: 'Cement Requirement in 50kg Bags',
              formula: 'Bags = V_c / 0.03472 m³ (or CFT / 1.25 cft per bag)',
              substitution: `${result.cementBags50Kg.toFixed(1)} Bags (Total Mass: ${result.cementMassKg.toFixed(0)} kg)`,
              codeRef: 'Standard 50kg Cement Bag Specification',
              description: 'Standard Portland cement packaged in 50 kg bags (bulk density 1440 kg/m³).',
            })}
          >
            <rect x={0} y={0} width={180} height={95} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
            <text x={14} y={24} fontSize="10" fontWeight="600" fill="var(--md-sys-color-primary)">CEMENT ({result.cementBags50Kg.toFixed(1)} BAGS)</text>
            <text x={14} y={50} fontSize="16" fontWeight="700" fill="var(--md-sys-color-on-surface)">{result.cementMassKg.toFixed(0)} kg</text>
            <text x={14} y={74} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">Vol: {result.cementVolumeM3.toFixed(2)} m³</text>
          </g>

          {/* Sand Card */}
          <g
            {...bindHover({
              title: 'Fine Aggregate (Sand) Takeoff',
              formula: 'Sand CFT = V_s (m³) × 35.3147 cft/m³',
              substitution: `${result.sandCft.toFixed(1)} cft (${result.sandMassKg.toFixed(0)} kg)`,
              codeRef: 'PWD Fine Aggregate Volume',
              description: 'Coarse sand with minimum FM 2.2 to 2.5 for structural concrete.',
            })}
          >
            <rect x={200} y={0} width={180} height={95} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
            <text x={214} y={24} fontSize="10" fontWeight="600" fill="var(--md-sys-color-tertiary)">FINE AGGREGATE / SAND</text>
            <text x={214} y={50} fontSize="16" fontWeight="700" fill="var(--md-sys-color-on-surface)">{result.sandCft.toFixed(1)} cft</text>
            <text x={214} y={74} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">Vol: {result.sandVolumeM3.toFixed(2)} m³ ({result.sandMassKg.toFixed(0)} kg)</text>
          </g>

          {/* Aggregate Card */}
          <g
            {...bindHover({
              title: 'Coarse Aggregate (Stone / Shingle) Takeoff',
              formula: 'Aggregate CFT = V_a (m³) × 35.3147 cft/m³',
              substitution: `${result.aggregateCft.toFixed(1)} cft (${result.aggregateMassKg.toFixed(0)} kg)`,
              codeRef: 'PWD Coarse Aggregate Volume',
              description: 'Crushed stone chips (3/4" down graded) or first-class brick khoa.',
            })}
          >
            <rect x={400} y={0} width={180} height={95} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
            <text x={414} y={24} fontSize="10" fontWeight="600" fill="var(--md-sys-color-secondary)">COARSE AGGREGATE</text>
            <text x={414} y={50} fontSize="16" fontWeight="700" fill="var(--md-sys-color-on-surface)">{result.aggregateCft.toFixed(1)} cft</text>
            <text x={414} y={74} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">Vol: {result.aggregateVolumeM3.toFixed(2)} m³ ({result.aggregateMassKg.toFixed(0)} kg)</text>
          </g>
        </g>
      </svg>
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 6. Rebar BBS Diagram with Bar Marks & Seismic Hook Detailing */
export const RebarBBSDiagramSvg: React.FC<{ params: RebarBBSParameters; result: RebarBBSResult }> = ({
  params,
  result,
}) => {
  const { tooltip, containerRef, bindHover } = useFormulaTooltip();
  const width = 680;
  const height = 240;

  if (result.totalSteelWeightKg <= 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <rect x={10} y={10} width={width - 20} height={height - 20} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
        <text x={width / 2} y={height / 2 - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          ZERO REBAR SCHEDULE (0.00 kg)
        </text>
        <text x={width / 2} y={height / 2 + 12} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
          Select element type ({params.elementType.toUpperCase()}) and configure bar diameters to generate cutting schedule
        </text>
      </svg>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        {/* Title */}
        <text x={30} y={24} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          STRUCTURAL REBAR BBS CUTTING ENVELOPE ({params.elementType.toUpperCase()} · COVER: {params.clearCoverMm}mm)
        </text>

        {params.elementType === 'beam' && (
          <g
            transform="translate(45, 45)"
            {...bindHover({
              title: 'Continuous Beam Rebar Arrangement',
              formula: 'W = d² / 162.2 kg/m · L_cut = L_clear - 2·cover + 2·hooks - bends',
              substitution: `Bottom: ${params.beamBotBarCount || 3}-Ø${params.beamMainBarDiaMm || 16} · Stirrups: Ø${params.beamStirrupDiaMm || 8}@${params.beamStirrupSpacingMm || 150}mm c/c`,
              codeRef: 'BNBC 2020 Part 6 / ACI 318 §25',
              description: 'Tension bottom steel at midspan, top hanger bars, and shear stirrups.',
            })}
          >
            <title>Beam Rebar Detailing</title>
            {/* Beam Elevation Outline */}
            <rect x={0} y={15} width={340} height={110} rx={3} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" strokeWidth="1.5" />
            {/* Top Hanger Bars */}
            <line x1={10} y1={30} x2={330} y2={30} stroke="var(--md-sys-color-secondary)" strokeWidth="2.5" />
            <polyline points="10,30 10,48" fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2.5" />
            <polyline points="330,30 330,48" fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2.5" />
            {/* Bottom Tension Bars */}
            <line x1={10} y1={110} x2={330} y2={110} stroke="var(--md-sys-color-primary)" strokeWidth="3.2" />
            <polyline points="10,110 10,92" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="3.2" />
            <polyline points="330,110 330,92" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="3.2" />
            {/* Vertical 2-legged Stirrups */}
            {[35, 75, 115, 155, 195, 235, 275, 310].map((x, i) => (
              <line key={i} x1={x} y1={25} x2={x} y2={115} stroke="var(--md-sys-color-tertiary)" strokeWidth="1.8" strokeDasharray={i === 0 || i === 7 ? 'none' : '4 2'} />
            ))}
            <text x={10} y={145} fontSize="9" fontWeight="600" fill="var(--md-sys-color-primary)">
              MK-01: {params.beamBotBarCount || 3}-Ø{params.beamMainBarDiaMm || 16} Bottom · {params.beamTopBarCount || 2}-Ø{params.beamMainBarDiaMm || 16} Top · Stirrup Ø{params.beamStirrupDiaMm || 8}@{params.beamStirrupSpacingMm || 150}mm c/c
            </text>
          </g>
        )}

        {params.elementType === 'slab' && (
          <g
            transform="translate(35, 45)"
            {...bindHover({
              title: 'One-Way / Two-Way Slab Reinforcement Mesh',
              formula: 'W = d² / 162.2 kg/m · Bar Spacing s ≤ 3·h or 450 mm',
              substitution: `Main: Ø${params.mainBarDiaMm} @ ${params.mainBarSpacingMm}mm c/c with crank bends`,
              codeRef: 'BNBC 2020 Slab Minimum Rebar §6.3.8',
              description: 'Tension rebar mesh resisting slab flexural bending with alternate bent-up crank bars.',
            })}
          >
            <title>Slab Reinforcement Mesh</title>
            <rect x={0} y={0} width={340} height={140} rx={4} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" />
            {/* Main Bottom Reinforcement */}
            {[25, 55, 85, 115].map((y, i) => (
              <g key={i}>
                <line x1={15} y1={y} x2={325} y2={y} stroke="var(--md-sys-color-primary)" strokeWidth="2.8" />
                <polyline points={`15,${y} 8,${y - 8} 8,${y - 14}`} fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="2.5" />
                <polyline points={`325,${y} 332,${y - 8} 332,${y - 14}`} fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="2.5" />
              </g>
            ))}
            {/* Distribution Bars */}
            {[35, 90, 145, 200, 255, 310].map((x, i) => (
              <line key={i} x1={x} y1={12} x2={x} y2={128} stroke="var(--md-sys-color-secondary)" strokeWidth="1.8" strokeDasharray="3 2" />
            ))}
            <text x={15} y={155} fontSize="9" fontWeight="600" fill="var(--md-sys-color-primary)">
              MK-01: Main Ø{params.mainBarDiaMm} @ {params.mainBarSpacingMm}mm c/c
            </text>
          </g>
        )}

        {params.elementType === 'column-rect' && (
          <g
            transform="translate(120, 45)"
            {...bindHover({
              title: 'Rectangular Column Rebar & Seismic Ties',
              formula: 'Tie Length L_tie = 2(b - 2c) + 2(h - 2c) + 24·d_tie (135° hook)',
              substitution: `8-Ø${params.colMainBarDiaMm || 16} Longitudinal + Ø8 Ties @ 150mm c/c`,
              codeRef: 'ACI 318-19 Seismic Detailing / BNBC Ch 6',
              description: 'Longitudinal bars resist axial + bi-axial bending; seismic 135° ties confine core.',
            })}
          >
            <title>Rectangular Column Cross-Section</title>
            <rect x={0} y={0} width={150} height={150} rx={4} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" strokeWidth="2" />
            <rect x={18} y={18} width={114} height={114} rx={3} fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2.2" />
            <polyline points="22,22 14,30 20,38" fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2.2" />
            {[
              [24, 24], [75, 24], [126, 24],
              [24, 75], [126, 75],
              [24, 126], [75, 126], [126, 126],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={7} fill="var(--md-sys-color-primary)" stroke="#ffffff" strokeWidth="1" />
            ))}
            <text x={75} y={166} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-primary)">
              MK-01: 8-Ø{params.colMainBarDiaMm || 16} Long. + MK-02: Ø8 Tie @ 150 c/c (135° hook)
            </text>
          </g>
        )}

        {params.elementType === 'column-circ' && (
          <g
            transform="translate(120, 45)"
            {...bindHover({
              title: 'Circular Column Spiral Reinforcement',
              formula: 'Spiral Ratio ρ_s = 4·A_sp / (D_core · pitch) ≥ 0.45 · (A_g/A_ch - 1) · (f\'_c / f_yt)',
              substitution: `8-Ø${params.circMainBarDiaMm || 16} + Spiral Ø8 @ 100mm pitch`,
              codeRef: 'ACI 318 §10.7.6.5 Spiral Confinement',
              description: 'Continuous helical spiral increases concrete ductility and column toughness.',
            })}
          >
            <title>Circular Spiral Column Section</title>
            <circle cx={75} cy={75} r={70} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" strokeWidth="2" />
            <circle cx={75} cy={75} r={54} fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2.2" strokeDasharray="6 3" />
            {Array.from({ length: 8 }).map((_, i) => {
              const rad = (i * 2 * Math.PI) / 8;
              return <circle key={i} cx={75 + 54 * Math.cos(rad)} cy={75 + 54 * Math.sin(rad)} r={6.5} fill="var(--md-sys-color-primary)" stroke="#ffffff" strokeWidth="1" />;
            })}
            <text x={75} y={166} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-primary)">
              MK-01: 8-Ø{params.circMainBarDiaMm || 16} + MK-02: Spiral Ø8 @ 100mm pitch
            </text>
          </g>
        )}

        {params.elementType === 'footing' && (
          <g
            transform="translate(60, 45)"
            {...bindHover({
              title: 'Isolated Footing Bottom Mat Mesh',
              formula: 'W = d² / 162.2 kg/m · Net Length = B_footing - 2·cover + 2·9d_hook',
              substitution: `Bi-directional mesh Ø${params.footingBarDiaMm || 12} @ ${params.footingBarSpacingMm || 150}mm c/c`,
              codeRef: 'BNBC 2020 Foundation Rebar',
              description: 'Orthogonal mat resisting cantilever flexural tension under upward soil reaction.',
            })}
          >
            <title>Footing Bottom Rebar Mat</title>
            <rect x={0} y={0} width={290} height={140} rx={4} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" />
            {[22, 55, 88, 120].map((y, i) => (
              <line key={i} x1={12} y1={y} x2={278} y2={y} stroke="var(--md-sys-color-primary)" strokeWidth="2.5" />
            ))}
            {[30, 85, 140, 195, 250].map((x, i) => (
              <line key={i} x1={x} y1={12} x2={128} stroke="var(--md-sys-color-tertiary)" strokeWidth="2.5" />
            ))}
            <text x={145} y={155} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-primary)">
              MK-01: Bi-directional mesh Ø{params.footingBarDiaMm || 12} @ {params.footingBarSpacingMm || 150}mm c/c
            </text>
          </g>
        )}

        {params.elementType === 'staircase-waist' && (
          <g
            transform="translate(50, 45)"
            {...bindHover({
              title: 'Staircase Waist Slab Main Reinforcement',
              formula: 'L_inclined = √(T² + R²) / T · L_horizontal · W = d² / 162.2',
              substitution: `Main Ø${params.stairMainBarDiaMm || 12} tension bottom with anchorage hooks`,
              codeRef: 'BNBC 2020 Part 6 Staircase Standard',
              description: 'Inclined longitudinal bars carrying flight gravity load into landing beams.',
            })}
          >
            <title>Staircase Waist Slab Rebar</title>
            <polyline points="0,130 180,45 290,45 290,15 180,15 0,100" fill="var(--md-sys-color-surface-container-high)" stroke="var(--md-sys-color-outline)" strokeWidth="1.5" />
            <line x1={8} y1={115} x2={285} y2={30} stroke="var(--md-sys-color-primary)" strokeWidth="3" />
            <text x={140} y={155} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-primary)">
              Waist Slab Reinforcement: Main Ø{params.stairMainBarDiaMm || 12} tension bottom
            </text>
          </g>
        )}

        {/* Bill of Quantities / Rebar Summary Card with Tooltip */}
        <g
          transform="translate(420, 45)"
          {...bindHover({
            title: 'Authoritative Rebar Unit Weight & Mass Formulation',
            formula: 'Unit W = d² / 162.2 kg/m · Total Mass = Σ [ N_bars × L_cut × W ] × (1 + Scrap%)',
            substitution: `${result.totalSteelWeightKg.toFixed(1)} kg (${result.totalSteelTonnes.toFixed(3)} Tonnes) · Cut = ${result.totalBarsLengthM.toFixed(1)} m`,
            codeRef: 'IS 1786 / BS 8666 Scheduling Code',
            description: 'Derived from density of steel (7850 kg/m³); provides exact fabrication order tonnage.',
          })}
        >
          <title>Total Rebar Quantity Schedule</title>
          <rect x={0} y={0} width={230} height={150} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
          <text x={16} y={24} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">TOTAL REBAR QUANTITY</text>
          <text x={16} y={56} fontSize="24" fontWeight="800" fill="var(--md-sys-color-primary)">{result.totalSteelWeightKg.toFixed(1)} kg</text>
          <text x={16} y={80} fontSize="12" fontWeight="600" fill="var(--md-sys-color-on-surface)">= {result.totalSteelTonnes.toFixed(3)} Tonnes</text>
          <line x1={16} y1={92} x2={214} y2={92} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
          <text x={16} y={108} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">Total Cut Length: {result.totalBarsLengthM.toFixed(1)} m</text>
          <text x={16} y={124} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">Est. Scrap / Wastage: 5% incl.</text>
          <text x={16} y={138} fontSize="8" fontWeight="600" fill="var(--md-sys-color-primary)">Unit Wt: {result.unitWeightFormulaUsed}</text>
        </g>
      </svg>
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 7. Masonry Diagram */
export const MasonryDiagramSvg: React.FC<{ params: MasonryParameters; result: MasonryResult }> = ({
  params,
  result,
}) => {
  const { containerRef, tooltip, bindHover } = useFormulaTooltip();
  const width = 680;
  const height = 230;

  if (params.wallLengthM <= 0 || params.wallHeightM <= 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <rect x={10} y={10} width={width - 20} height={height - 20} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
        <text x={width / 2} y={height / 2 - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          ZERO MASONRY WALL GEOMETRY (0.00 m)
        </text>
        <text x={width / 2} y={height / 2 + 12} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
          Enter wall length and height to compute net brick count, mortar volume and plastering area
        </text>
      </svg>
    );
  }

  const wallW = 360;
  const wallH = 130;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <text x={40} y={26} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          MASONRY WALL ELEVATION &amp; OPENING DEDUCTIONS (NET AREA: {result.netWallAreaM2} m²)
        </text>

        {/* Wall & Openings Group with Tooltips */}
        <g transform="translate(50, 44)">
          {/* Gross Wall Solid Face */}
          <g
            {...bindHover({
              title: 'Gross Wall Masonry Volume & Face Area',
              formula: 'V_gross = L_wall × H_wall × T_wall · A_gross = L_wall × H_wall',
              substitution: `${params.wallLengthM}m × ${params.wallHeightM}m × ${(params.wallThicknessM || 0.25).toFixed(3)}m = ${result.netWallVolumeM3.toFixed(2)} m³ net (A_gross = ${(params.wallLengthM * params.wallHeightM).toFixed(2)} m²)`,
              codeRef: 'BNBC 2020 Part 6 Masonry / PWD Specification',
              description: 'Gross vertical facade area before deduction of door and window voids.',
            })}
          >
            <title>Gross Masonry Wall Envelope</title>
            <rect x={0} y={0} width={wallW} height={wallH} fill="var(--md-sys-color-tertiary-container)" stroke="var(--md-sys-color-tertiary)" strokeWidth="2" />
          </g>

          {/* Door Opening Void */}
          <g
            transform="translate(35, 40)"
            {...bindHover({
              title: 'Door Aperture Deduction (Net Takeoff)',
              formula: 'A_deduct = W_door × H_door × N_doors · V_deduct = A_deduct × T_wall',
              substitution: `Total Opening Deductions = ${result.totalOpeningAreaM2.toFixed(2)} m² across ${params.openings?.length || 0} scheduled openings`,
              codeRef: 'BNBC 2020 / IS 1200 Part 3 Deduction Standard',
              description: 'Clear architectural opening void subtracted from gross wall area for bricks & mortar.',
            })}
          >
            <title>Door Opening Deduction</title>
            <rect x={0} y={0} width={50} height={90} fill="var(--md-sys-color-surface)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.5" />
            <text x={7} y={45} fontSize="9" fontWeight="600" fill="var(--md-sys-color-on-surface)">DOOR</text>
          </g>

          {/* Window Opening Void */}
          <g
            transform="translate(160, 35)"
            {...bindHover({
              title: 'Window Aperture Deduction (Net Takeoff)',
              formula: 'A_deduct = W_window × H_window × N_windows',
              substitution: `Scheduled Openings Deducted = ${result.totalOpeningAreaM2.toFixed(2)} m² from gross facade`,
              codeRef: 'BNBC 2020 / PWD Works Specification',
              description: 'Standard opening deduction for windows exceeding 0.1 m² area per civil engineering codes.',
            })}
          >
            <title>Window Opening Deduction</title>
            <rect x={0} y={0} width={70} height={55} fill="var(--md-sys-color-surface)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.5" />
            <text x={12} y={30} fontSize="9" fontWeight="600" fill="var(--md-sys-color-on-surface)">WINDOW</text>
          </g>
        </g>

        {/* Brick Estimator & Mortar Summary Card with Tooltip */}
        <g
          transform="translate(440, 44)"
          {...bindHover({
            title: 'Modular Brick Takeoff with Jobsite Breakage',
            formula: 'N_bricks = (V_net / V_brick_nominal) × (1 + Wastage%)',
            substitution: `${result.bricksWithWastageCount} Bricks (${result.requiredBricksCount} base + ${params.brickWastagePercent}% scrap)`,
            codeRef: 'BNBC 2020 Section 2.1 Standard Bricks',
            description: 'Calculated using 242mm × 114mm × 70mm nominal brick with 10mm mortar joint thickness.',
          })}
        >
          <title>Masonry Takeoff Schedule</title>
          <rect x={0} y={0} width={190} height={130} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
          <text x={14} y={24} fontSize="10" fontWeight="600" fill="var(--md-sys-color-tertiary)">BRICK ESTIMATOR</text>
          <text x={14} y={52} fontSize="20" fontWeight="700" fill="var(--md-sys-color-on-surface)">{result.bricksWithWastageCount} Nos</text>
          <text x={14} y={76} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">Mortar: {result.mortarCementBags50Kg.toFixed(1)} Bags</text>
          <text x={14} y={98} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">Sand: {result.mortarSandCft.toFixed(1)} cft</text>
          <text x={14} y={120} fontSize="10" fill="var(--md-sys-color-primary)">Plaster: {result.plasterCementBags.toFixed(1)} Bags</text>
        </g>
      </svg>
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 8. Earthwork Diagram */
export const EarthworkDiagramSvg: React.FC<{ params: EarthworkParameters; result: EarthworkResult }> = ({
  params,
  result,
}) => {
  const { containerRef, tooltip, bindHover } = useFormulaTooltip();
  const width = 680;
  const height = 230;

  if (result.bankVolumeM3 <= 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <rect x={10} y={10} width={width - 20} height={height - 20} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
        <text x={width / 2} y={height / 2 - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          ZERO EARTHWORK EXCAVATION (0.00 m³)
        </text>
        <text x={width / 2} y={height / 2 + 12} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
          Enter excavation dimensions or alignment cross-sections to compute bank, loose and compacted volumes
        </text>
      </svg>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <text x={40} y={26} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          SOIL VOLUME STATE TRANSITION (BANK → LOOSE → COMPACTED · {result.soilClassification.toUpperCase()})
        </text>

        <g transform="translate(50, 50)">
          {/* Bank (In-Situ) Box with Tooltip */}
          <g
            {...bindHover({
              title: 'In-Situ Bank Soil Volume (V_bank)',
              formula: 'V_bank = L × ((W_top + W_bot) / 2) × H_cut',
              substitution: `${result.bankVolumeM3.toFixed(1)} m³ (Base State · Factor = 1.00)`,
              codeRef: 'BNBC 2020 Section 3.4 Earthwork Excavations',
              description: 'Undisturbed natural virgin ground state prior to excavation or trenching.',
            })}
          >
            <title>Bank In-Situ Soil State</title>
            <rect x={0} y={20} width={160} height={100} rx={6} fill="var(--md-sys-color-surface-container-high)" stroke="var(--md-sys-color-outline)" />
            <text x={14} y={44} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">BANK (IN-SITU)</text>
            <text x={14} y={76} fontSize="18" fontWeight="700" fill="var(--md-sys-color-on-surface)">{result.bankVolumeM3.toFixed(1)} m³</text>
            <text x={14} y={102} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">Factor: 1.00 (Base)</text>
          </g>

          {/* Loose (Swelled) Box with Tooltip */}
          <g
            transform="translate(200, 0)"
            {...bindHover({
              title: 'Loose Volume & Bulking Swell Factor',
              formula: 'V_loose = V_bank × (1 + Swell%) = V_bank × F_swell',
              substitution: `${result.bankVolumeM3.toFixed(1)} m³ × ${result.swellFactor.toFixed(2)} = ${result.looseVolumeM3.toFixed(1)} m³ (${result.haulTruckTripsCount10M3} dump truck trips @ 10m³)`,
              codeRef: 'Caterpillar Earthmoving Fundamentals / AASHTO',
              description: 'Excavation mechanically disrupts soil structure, generating air voids and increasing hauling bulk.',
            })}
          >
            <title>Loose Swelled Soil State</title>
            <rect x={0} y={0} width={170} height={120} rx={6} fill="var(--md-sys-color-tertiary-container)" stroke="var(--md-sys-color-tertiary)" strokeWidth="1.5" />
            <text x={14} y={28} fontSize="10" fontWeight="600" fill="var(--md-sys-color-tertiary)">LOOSE (SWELLED)</text>
            <text x={14} y={64} fontSize="20" fontWeight="700" fill="var(--md-sys-color-tertiary)">{result.looseVolumeM3.toFixed(1)} m³</text>
            <text x={14} y={90} fontSize="11" fill="var(--md-sys-color-on-surface)">Swell: {((result.swellFactor - 1) * 100).toFixed(0)}%</text>
            <text x={14} y={110} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface)">{result.haulTruckTripsCount10M3} Trucks (10m³)</text>
          </g>

          {/* Compacted (Fill) Box with Tooltip */}
          <g
            transform="translate(410, 35)"
            {...bindHover({
              title: 'Compacted Engineered Fill & Shrinkage Factor',
              formula: 'V_compact = V_bank × (1 - Shrinkage%) = V_bank × F_shrinkage',
              substitution: `${result.bankVolumeM3.toFixed(1)} m³ × ${result.shrinkageFactor.toFixed(2)} = ${result.compactedVolumeM3.toFixed(1)} m³`,
              codeRef: 'ASTM D698 / AASHTO T-99 Standard Proctor Compaction',
              description: 'Vibratory roller compaction expels pore air to achieve target dry density (e.g. 95% MDD).',
            })}
          >
            <title>Compacted Fill Soil State</title>
            <rect x={0} y={0} width={160} height={85} rx={6} fill="var(--md-sys-color-primary-container)" stroke="var(--md-sys-color-primary)" />
            <text x={14} y={23} fontSize="10" fontWeight="600" fill="var(--md-sys-color-primary)">COMPACTED (FILL)</text>
            <text x={14} y={53} fontSize="18" fontWeight="700" fill="var(--md-sys-color-primary)">{result.compactedVolumeM3.toFixed(1)} m³</text>
            <text x={14} y={73} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">Factor: {(result.shrinkageFactor * 100).toFixed(0)}%</text>
          </g>
        </g>
      </svg>
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 9. Universal Unit Converter Diagram */
export const UnitConverterDiagramSvg: React.FC<{
  fromUnit: string;
  toUnit: string;
  inputVal: number;
  outputVal: number;
  category: string;
}> = ({ fromUnit, toUnit, inputVal, outputVal, category }) => {
  const { containerRef, tooltip, bindHover } = useFormulaTooltip();
  const width = 680;
  const height = 210;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <text x={40} y={28} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          HIGH-PRECISION CONVERSION VECTOR ({category.toUpperCase()})
        </text>

        <g transform="translate(50, 48)">
          {/* Source Box with Tooltip */}
          <g
            {...bindHover({
              title: 'Source Engineering Unit & Dimension',
              formula: 'Value_base = Value_input × Scale_from_base',
              substitution: `${inputVal} ${fromUnit} in category ${category}`,
              codeRef: 'ISO 80000 / NIST SP 811 Metric Guide',
              description: 'Source civil engineering dimension awaiting canonical scalar transformation.',
            })}
          >
            <title>Source Engineering Input</title>
            <rect x={0} y={0} width={240} height={110} rx={8} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
            <text x={16} y={28} fontSize="11" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">INPUT VALUE ({fromUnit.toUpperCase()})</text>
            <text x={16} y={64} fontSize="24" fontWeight="700" fill="var(--md-sys-color-on-surface)">
              {inputVal} <span className="text-sm font-normal">{fromUnit}</span>
            </text>
            <text x={16} y={92} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">Civil Engineering Source Unit</text>
          </g>

          {/* Center Conversion Vector Arrow with Tooltip */}
          <g
            transform="translate(260, 40)"
            {...bindHover({
              title: 'Authoritative Scalar Conversion Ratio',
              formula: 'Value_target = (Value_input × Ratio_from) / Ratio_to',
              substitution: `1 ${fromUnit} = ${(outputVal / (inputVal || 1)).toPrecision(6)} ${toUnit}`,
              codeRef: 'BNBC 2020 Appendix / ASTM E380 Conversion Standard',
              description: 'Zero-drift IEEE-754 precision scalar transformation preserving exact physical quantity.',
            })}
          >
            <title>High-Precision Unit Conversion Vector</title>
            <line x1={0} y1={15} x2={55} y2={15} stroke="var(--md-sys-color-primary)" strokeWidth="3" />
            <polygon points="50,8 65,15 50,22" fill="var(--md-sys-color-primary)" />
          </g>

          {/* Target Box with Tooltip */}
          <g
            transform="translate(340, 0)"
            {...bindHover({
              title: 'Converted Standard Engineering Equivalent',
              formula: 'Value_target = f(Value_source)',
              substitution: `${Number(outputVal.toFixed(4))} ${toUnit}`,
              codeRef: 'International System of Units (SI) / Bangladesh Local Practice',
              description: 'Certified equivalent measurement ready for calculation, detailing, or procurement.',
            })}
          >
            <title>Target Engineering Result</title>
            <rect x={0} y={0} width={240} height={110} rx={8} fill="var(--md-sys-color-primary-container)" stroke="var(--md-sys-color-primary)" />
            <text x={16} y={28} fontSize="11" fontWeight="600" fill="var(--md-sys-color-on-primary-container)">CONVERTED EQUIVALENT ({toUnit.toUpperCase()})</text>
            <text x={16} y={64} fontSize="24" fontWeight="700" fill="var(--md-sys-color-on-primary-container)">
              {Number(outputVal.toFixed(4))} <span className="text-sm font-normal">{toUnit}</span>
            </text>
            <text x={16} y={92} fontSize="10" fill="var(--md-sys-color-on-primary-container)">High-Precision IEEE 754 Conversion</text>
          </g>
        </g>
      </svg>
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 10. BOQ Cost Breakdown Diagram */
export const BOQCostBreakdownDiagramSvg: React.FC<{
  params: BOQParameters;
  result: BOQResult;
}> = ({ params, result }) => {
  const { containerRef, tooltip, bindHover } = useFormulaTooltip();
  const width = 680;
  const height = 290;

  if (result.grandTotalAmount <= 0 || result.totalItemCount === 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <rect x={10} y={10} width={width - 20} height={height - 20} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
        <text x={width / 2} y={height / 2 - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          EMPTY BILL OF QUANTITIES ({result.currency || 'BDT'} 0.00)
        </text>
        <text x={width / 2} y={height / 2 + 12} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
          Add line items or synchronize from engineering modules to visualize capital distribution and trade costs
        </text>
      </svg>
    );
  }

  const sym = result.currencySymbol;
  const grandTotal = Math.max(1, result.grandTotalAmount);

  // Stacked bar proportions
  const subtotalWidth = (result.subtotalAmount / grandTotal) * 580;
  const contWidth = (result.contingencyAmount / grandTotal) * 580;
  const cpWidth = (result.contractorOverheadAmount / grandTotal) * 580;
  const vatWidth = (result.vatTaxAmount / grandTotal) * 580;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <text x={40} y={28} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          PROJECT BILL OF QUANTITIES (BOQ) COST STRUCTURE ({result.currency})
        </text>

        {/* Grand Total Hero Box with Tooltip */}
        <g transform="translate(40, 42)">
          <g
            {...bindHover({
              title: 'BOQ Contract Grand Total Formulation',
              formula: 'C_grand = C_subtotal + C_contingency + C_cpoh + C_vat',
              substitution: `${sym} ${result.grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Direct + Cont ${params.contingencyPercent}% + CP&OH ${params.contractorOverheadPercent}% + VAT ${params.vatTaxPercent}%)`,
              codeRef: 'Public Procurement Rules (PPR-2008) / FIDIC Red Book',
              description: 'Total certified commercial construction project value inclusive of all statutory levies, reserves, and markups.',
            })}
          >
            <title>BOQ Grand Total Value</title>
            <rect x={0} y={0} width={260} height={70} rx={8} fill="var(--md-sys-color-primary-container)" stroke="var(--md-sys-color-primary)" strokeWidth="1.5" />
            <text x={14} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-primary-container)">GRAND TOTAL ESTIMATE</text>
            <text x={14} y={48} fontSize="20" fontWeight="800" fill="var(--md-sys-color-on-primary-container)">
              {sym} {result.grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </text>
            <text x={14} y={62} fontSize="9" fill="var(--md-sys-color-on-primary-container)">Includes Markups &amp; Taxes</text>
          </g>

          {/* Subtotal Box with Tooltip */}
          <g
            transform="translate(275, 0)"
            {...bindHover({
              title: 'Direct Works Takeoff Subtotal',
              formula: 'C_subtotal = Σ [ Quantity_i × UnitRate_i ]',
              substitution: `${sym} ${result.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} across ${result.totalItemCount} line items`,
              codeRef: 'CESMM4 / NRM2 Standard Method of Measurement',
              description: 'Direct prime cost of labor, materials, and machinery without contractor markups.',
            })}
          >
            <title>Direct Works Subtotal</title>
            <rect x={0} y={0} width={150} height={70} rx={8} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
            <text x={12} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">BASE TAKEOFF</text>
            <text x={12} y={46} fontSize="14" fontWeight="700" fill="var(--md-sys-color-on-surface)">
              {sym} {result.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </text>
            <text x={12} y={60} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">{result.totalItemCount} Line Items</text>
          </g>

          {/* CP&OH + VAT Box with Tooltip */}
          <g
            transform="translate(438, 0)"
            {...bindHover({
              title: 'Statutory Markups, Overheads & VAT',
              formula: 'C_indirect = (Contingency% + CP&OH% + VAT%) × C_subtotal',
              substitution: `${sym} ${(result.contractorOverheadAmount + result.vatTaxAmount + result.contingencyAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              codeRef: 'NBR Bangladesh Tax Code / PWD Works Manual',
              description: 'Mandatory contractual overheads, risk reserves, and VAT for compliant commercial bidding.',
            })}
          >
            <title>Indirect Costs & Markups</title>
            <rect x={0} y={0} width={162} height={70} rx={8} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
            <text x={12} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">OVERHEAD &amp; VAT</text>
            <text x={12} y={46} fontSize="14" fontWeight="700" fill="var(--md-sys-color-tertiary)">
              {sym} {(result.contractorOverheadAmount + result.vatTaxAmount + result.contingencyAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </text>
            <text x={12} y={60} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">CP&amp;OH + Cont. + VAT</text>
          </g>
        </g>

        {/* Stacked Proportional Bar with Tooltips */}
        <g transform="translate(40, 130)">
          <text x={0} y={-8} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">
            PROPORTIONAL CAPITAL DISTRIBUTION
          </text>
          <rect x={0} y={0} width={580} height={22} rx={4} fill="var(--md-sys-color-surface-container-high)" />

          {/* Subtotal Segment */}
          <rect
            x={0}
            y={0}
            width={Math.max(2, subtotalWidth)}
            height={22}
            rx={4}
            fill="var(--md-sys-color-primary)"
            {...bindHover({
              title: 'Direct Physical Construction Works',
              formula: 'Direct% = (C_subtotal / C_grand) × 100%',
              substitution: `${((result.subtotalAmount / grandTotal) * 100).toFixed(1)}% of total project expenditure (${sym}${result.subtotalAmount.toLocaleString()})`,
              codeRef: 'CESMM4 Project Budget Classification',
              description: 'Capital directly tied into tangible built civil structural elements.',
            })}
          />
          {/* Contingency Segment */}
          <rect
            x={subtotalWidth}
            y={0}
            width={Math.max(0, contWidth)}
            height={22}
            fill="var(--md-sys-color-tertiary)"
            {...bindHover({
              title: 'Contingency Risk Reserve',
              formula: 'C_cont = C_subtotal × (P_cont / 100)',
              substitution: `${params.contingencyPercent}% rate = ${sym} ${result.contingencyAmount.toLocaleString()} (${((result.contingencyAmount / grandTotal) * 100).toFixed(1)}%)`,
              codeRef: 'PPR-2008 Standard Contingency Allocation',
              description: 'Reserve buffer dedicated to unforeseen site conditions, subsoil variances, and design revisions.',
            })}
          />
          {/* CP&OH Segment */}
          <rect
            x={subtotalWidth + contWidth}
            y={0}
            width={Math.max(0, cpWidth)}
            height={22}
            fill="#eab308"
            {...bindHover({
              title: 'Contractor Profit & Head Office Overhead',
              formula: 'C_cpoh = C_subtotal × (P_overhead / 100)',
              substitution: `${params.contractorOverheadPercent}% rate = ${sym} ${result.contractorOverheadAmount.toLocaleString()} (${((result.contractorOverheadAmount / grandTotal) * 100).toFixed(1)}%)`,
              codeRef: 'PWD Schedule of Rates Markup Guidelines',
              description: 'Contractor margin covering administration, executive supervision, and commercial margin.',
            })}
          />
          {/* VAT Segment */}
          <rect
            x={subtotalWidth + contWidth + cpWidth}
            y={0}
            width={Math.max(0, vatWidth)}
            height={22}
            fill="#ef4444"
            {...bindHover({
              title: 'Value Added Tax (VAT / AIT)',
              formula: 'C_vat = (C_subtotal + C_cont + C_cpoh) × (P_vat / 100)',
              substitution: `${params.vatTaxPercent}% statutory rate = ${sym} ${result.vatTaxAmount.toLocaleString()} (${((result.vatTaxAmount / grandTotal) * 100).toFixed(1)}%)`,
              codeRef: 'National Board of Revenue (NBR) Bangladesh Code',
              description: 'Statutory government tax withheld on public and commercial civil engineering works.',
            })}
          />
        </g>

        {/* Legend & Categories */}
        <g transform="translate(40, 175)">
          <g transform="translate(0, 0)">
            <rect x={0} y={0} width={10} height={10} rx={2} fill="var(--md-sys-color-primary)" />
            <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">Direct Work: {((result.subtotalAmount / grandTotal) * 100).toFixed(1)}%</text>
          </g>
          <g transform="translate(160, 0)">
            <rect x={0} y={0} width={10} height={10} rx={2} fill="var(--md-sys-color-tertiary)" />
            <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">Contingency ({params.contingencyPercent}%): {((result.contingencyAmount / grandTotal) * 100).toFixed(1)}%</text>
          </g>
          <g transform="translate(360, 0)">
            <rect x={0} y={0} width={10} height={10} rx={2} fill="#eab308" />
            <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">Overhead &amp; Profit: {((result.contractorOverheadAmount / grandTotal) * 100).toFixed(1)}%</text>
          </g>
          <g transform="translate(500, 0)">
            <rect x={0} y={0} width={10} height={10} rx={2} fill="#ef4444" />
            <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">Tax/VAT: {((result.vatTaxAmount / grandTotal) * 100).toFixed(1)}%</text>
          </g>
        </g>

        {/* Top Trade Categories */}
        <g transform="translate(40, 210)">
          <text x={0} y={0} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
            MAJOR TRADE CATEGORIES
          </text>
          <g transform="translate(0, 10)">
            {result.categorySummaries.slice(0, 4).map((cat, i) => (
              <g
                key={cat.category}
                transform={`translate(${i * 145}, 0)`}
                {...bindHover({
                  title: `Trade Category: ${cat.category.toUpperCase()}`,
                  formula: 'C_cat = Σ [ Q_i × R_i ] · Share = C_cat / C_subtotal',
                  substitution: `${sym} ${cat.subtotal.toLocaleString()} (${cat.percentageOfSubtotal}% of base takeoff across ${cat.itemCount} items)`,
                  codeRef: 'CSI MasterFormat / UniFormat Trade Structure',
                  description: 'Consolidated trade expenditure for procurement packaging and subcontract tenders.',
                })}
              >
                <title>{cat.category} Trade Summary</title>
                <rect x={0} y={0} width={135} height={46} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
                <text x={8} y={16} fontSize="9" fontWeight="700" fill="var(--md-sys-color-primary)">
                  {cat.category.toUpperCase()} ({cat.itemCount})
                </text>
                <text x={8} y={32} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
                  {sym} {cat.subtotal.toLocaleString()}
                </text>
                <text x={8} y={42} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
                  {cat.percentageOfSubtotal}% of base
                </text>
              </g>
            ))}
          </g>
        </g>
      </svg>
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 11. Granular Rate Analysis Breakdown Diagram */
export const RateAnalysisBreakdownDiagramSvg: React.FC<{
  params: RateAnalysisParameters;
  result: RateAnalysisResult;
}> = ({ params, result }) => {
  const { containerRef, tooltip, bindHover } = useFormulaTooltip();
  const width = 680;
  const height = 290;

  if (result.unitRatePerM3 <= 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <rect x={10} y={10} width={width - 20} height={height - 20} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
        <text x={width / 2} y={height / 2 - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          ZERO UNIT RATE ANALYSIS ({result.workType?.toUpperCase() || 'RCC'})
        </text>
        <text x={width / 2} y={height / 2 + 12} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
          Enter basic material prices and labor wages to compute composite unit rate per m³ and cft
        </text>
      </svg>
    );
  }

  const sym = result.currencySymbol;
  const dist = result.costDistributionPercent;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <text x={40} y={28} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          GRANULAR UNIT RATE ANALYSIS — {result.workType.toUpperCase()} ({result.basisVolumeM3} m³)
        </text>

        {/* Rate Highlight Cards with Tooltips */}
        <g transform="translate(40, 42)">
          {/* Unit Rate per m³ Card */}
          <g
            {...bindHover({
              title: 'Composite Unit Rate Formulation (per m³)',
              formula: 'R_m³ = (C_materials + C_labor + C_plant + C_water) × (1 + Profit%) / V_basis',
              substitution: `${sym} ${result.unitRatePerM3.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / m³ (${result.basisVolumeM3} m³ basis volume)`,
              codeRef: 'PWD Schedule of Rates 2022 / CPWD Guidelines',
              description: 'Official composite commercial unit rate per cubic meter for contractual estimation.',
            })}
          >
            <title>Rate per m³</title>
            <rect x={0} y={0} width={260} height={70} rx={8} fill="var(--md-sys-color-primary-container)" stroke="var(--md-sys-color-primary)" strokeWidth="1.5" />
            <text x={14} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-primary-container)">UNIT RATE PER m³</text>
            <text x={14} y={48} fontSize="20" fontWeight="800" fill="var(--md-sys-color-on-primary-container)">
              {sym} {result.unitRatePerM3.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-normal"> / m³</span>
            </text>
            <text x={14} y={62} fontSize="9" fill="var(--md-sys-color-on-primary-container)">Authoritative Standard Composite Rate</text>
          </g>

          {/* CFT Equivalent Card */}
          <g
            transform="translate(275, 0)"
            {...bindHover({
              title: 'Site CFT Unit Rate Formulation',
              formula: 'R_cft = R_m³ / 35.3146667',
              substitution: `${sym} ${result.unitRatePerM3.toFixed(2)} / 35.3147 = ${sym} ${result.unitRatePerCft.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / cft`,
              codeRef: 'Bangladesh Construction Jobsite Practice',
              description: 'Unit rate per cubic foot commonly used by Bangladeshi contractors for labor subcontracts.',
            })}
          >
            <title>Rate per CFT</title>
            <rect x={0} y={0} width={150} height={70} rx={8} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
            <text x={12} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">RATE PER CFT (ft³)</text>
            <text x={12} y={46} fontSize="15" fontWeight="700" fill="var(--md-sys-color-on-surface)">
              {sym} {result.unitRatePerCft.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-normal"> / cft</span>
            </text>
            <text x={12} y={60} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">1 m³ = 35.315 CFT</text>
          </g>

          {/* Contractor Margin Card */}
          <g
            transform="translate(438, 0)"
            {...bindHover({
              title: 'Contractor Overhead & Profit (CP&OH)',
              formula: 'C_cpoh = Prime_Cost × (Profit% / 100)',
              substitution: `${sym} ${result.primeCost.toLocaleString()} × ${params.contractorProfitPercent}% = ${sym} ${result.contractorProfitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              codeRef: 'PWD General Conditions of Contract / PPR',
              description: 'Statutory margin compensating contractor for head office management, risk, and corporate profit.',
            })}
          >
            <title>Contractor Profit & Overhead</title>
            <rect x={0} y={0} width={162} height={70} rx={8} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
            <text x={12} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">PROFIT &amp; OVERHEAD</text>
            <text x={12} y={46} fontSize="15" fontWeight="700" fill="var(--md-sys-color-tertiary)">
              {sym} {result.contractorProfitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </text>
            <text x={12} y={60} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">{params.contractorProfitPercent}% Margin Added</text>
          </g>
        </g>

        {/* Stacked Cost Distribution Bar with Tooltips */}
        <g transform="translate(40, 130)">
          <text x={0} y={-8} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">
            COMPOSITE COST FACTOR BREAKDOWN
          </text>
          <rect x={0} y={0} width={580} height={22} rx={4} fill="var(--md-sys-color-surface-container-high)" />

          {/* Materials */}
          <rect
            x={0}
            y={0}
            width={(dist.materials / 100) * 580}
            height={22}
            rx={4}
            fill="var(--md-sys-color-primary)"
            {...bindHover({
              title: 'Material Constituent Expenditure',
              formula: 'Cost_mat = Σ [ Material_Qty × Material_Rate ]',
              substitution: `${dist.materials}% of total composite rate (${sym}${result.materialsCost.toLocaleString()})`,
              codeRef: 'PWD Material Analysis Breakdown',
              description: 'Aggregate, cement, sand, brick, rebar and chemical admixture purchase costs.',
            })}
          />
          {/* Labor */}
          <rect
            x={(dist.materials / 100) * 580}
            y={0}
            width={(dist.labor / 100) * 580}
            height={22}
            fill="var(--md-sys-color-tertiary)"
            {...bindHover({
              title: 'Direct Trade Labor Component',
              formula: 'Cost_lab = Σ [ Labor_ManDays × Daily_Wage ]',
              substitution: `${dist.labor}% of total rate (${sym}${result.laborsCost.toLocaleString()})`,
              codeRef: 'National Labor Standards / PWD Gang Output',
              description: 'Masons, rod-binders, formwork carpenters, and helpers.',
            })}
          />
          {/* Equipment */}
          <rect
            x={((dist.materials + dist.labor) / 100) * 580}
            y={0}
            width={(dist.equipment / 100) * 580}
            height={22}
            fill="#3b82f6"
            {...bindHover({
              title: 'Plant, Shuttering & Machinery Cost',
              formula: 'Cost_equip = Mixer + Vibrator + Scaffolding / Shuttering',
              substitution: `${dist.equipment}% of total rate (${sym}${result.equipmentCost.toLocaleString()})`,
              codeRef: 'Equipment Hire & Depreciation Standards',
              description: 'Mechanical concrete mixers, needle vibrators, steel shuttering, and staging props.',
            })}
          />
          {/* Profit */}
          <rect
            x={((dist.materials + dist.labor + dist.equipment + dist.waterElectricity) / 100) * 580}
            y={0}
            width={(dist.contractorProfit / 100) * 580}
            height={22}
            fill="#eab308"
            {...bindHover({
              title: 'Contractor Margin & Overhead Factor',
              formula: 'CP&OH = Prime_Cost × Profit%',
              substitution: `${dist.contractorProfit}% of composite rate (${sym}${result.contractorProfitCost.toLocaleString()})`,
              codeRef: 'Standard Public Works Contracting Practice',
              description: 'Contractor business operating overhead and net enterprise profit margin.',
            })}
          />
        </g>

        {/* Factor Legend */}
        <g transform="translate(40, 175)">
          <g transform="translate(0, 0)">
            <rect x={0} y={0} width={10} height={10} rx={2} fill="var(--md-sys-color-primary)" />
            <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">Materials: {dist.materials}% ({sym}{result.materialsCost.toLocaleString()})</text>
          </g>
          <g transform="translate(200, 0)">
            <rect x={0} y={0} width={10} height={10} rx={2} fill="var(--md-sys-color-tertiary)" />
            <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">Labor: {dist.labor}% ({sym}{result.laborsCost.toLocaleString()})</text>
          </g>
          <g transform="translate(370, 0)">
            <rect x={0} y={0} width={10} height={10} rx={2} fill="#3b82f6" />
            <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">Plant &amp; Formwork: {dist.equipment}%</text>
          </g>
          <g transform="translate(510, 0)">
            <rect x={0} y={0} width={10} height={10} rx={2} fill="#eab308" />
            <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">CP&amp;OH: {dist.contractorProfit}%</text>
          </g>
        </g>

        {/* Prime Cost Summary Box with Tooltip */}
        <g
          transform="translate(40, 210)"
          {...bindHover({
            title: 'Authoritative Prime Cost Formulation',
            formula: 'Prime_Cost = C_materials + C_labor + C_plant',
            substitution: `Prime = ${sym}${result.materialsCost.toLocaleString()} (Mat) + ${sym}${result.laborsCost.toLocaleString()} (Lab) + ${sym}${result.equipmentCost.toLocaleString()} (Equip) = ${sym}${result.primeCost.toLocaleString()}`,
            codeRef: 'IS 7272 / Civil Construction Economics',
            description: 'Fundamental raw cost of construction before adding statutory profit, water charges, and tax.',
          })}
        >
          <title>Prime Cost Equation</title>
          <rect x={0} y={0} width={580} height={50} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
          <text x={16} y={20} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
            PRIME COST FORMULA:
          </text>
          <text x={16} y={38} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">
            Prime = {sym}{result.materialsCost.toLocaleString()} (Mat) + {sym}{result.laborsCost.toLocaleString()} (Lab) + {sym}{result.equipmentCost.toLocaleString()} (Equip) = <tspan fontWeight="700" fill="var(--md-sys-color-on-surface)">{sym}{result.primeCost.toLocaleString()}</tspan>
          </text>
        </g>
      </svg>
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 12. Continuous Beam Diagram (Multi-Span BMD & SFD Envelopes) */
export const ContinuousBeamDiagramSvg: React.FC<{
  params: ContinuousBeamParameters;
  result: ContinuousBeamResult;
}> = ({ params, result }) => {
  const { containerRef, tooltip, bindHover } = useFormulaTooltip();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'sfd' | 'bmd' | 'deflection' | 'coordinates'>('all');
  const [hoverData, setHoverData] = useState<{
    xTotal: number;
    xSpan: number;
    spanIndex: number;
    shearKn: number;
    momentKnm: number;
    deflectionMm: number;
    px: number;
  } | null>(null);

  const width = 820;
  const height = activeTab === 'all' ? 525 : 360;

  if (result.totalLengthM <= 0 || params.spans.every((s) => s.lengthM <= 0)) {
    return (
      <div className="space-y-2 select-none font-mono">
        <svg viewBox={`0 0 ${width} 320`} className="w-full h-auto select-none font-mono">
          <rect x={10} y={10} width={width - 20} height={300} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
          <text x={width / 2} y={145} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
            ZERO CONTINUOUS BEAM SPAN (0.00 m)
          </text>
          <text x={width / 2} y={170} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
            Enter span lengths to solve multi-span 3-moment Clapeyron equations and plot moment envelopes
          </text>
        </svg>
      </div>
    );
  }

  const padLeft = 65;
  const padRight = 50;
  const plotW = width - padLeft - padRight;
  const totalL = Math.max(0.1, result.totalLengthM);

  const toX = (xM: number) => padLeft + (Math.max(0, Math.min(totalL, xM)) / totalL) * plotW;

  const maxV = Math.max(0.1, result.maxShearKn);
  const maxM = Math.max(0.1, Math.max(result.maxSaggingMomentKnm, result.maxHoggingMomentKnm));
  const maxD = Math.max(0.01, result.maxDeflectionMm || result.codeChecks.maxDeflectionEstimateMm || 1);

  // Vertical layout centers based on activeTab
  const elevY = activeTab === 'all' ? 70 : 80;
  const sfdCenterY = activeTab === 'all' ? 195 : 220;
  const sfdAmp = activeTab === 'all' ? 42 : 75;
  const bmdCenterY = activeTab === 'all' ? 320 : 230;
  const bmdAmp = activeTab === 'all' ? 48 : 85;
  const deflCenterY = activeTab === 'all' ? 450 : 235;
  const deflAmp = activeTab === 'all' ? 38 : 75;

  // Support X positions
  const supportPositions: number[] = [padLeft];
  let accX = 0;
  for (const span of result.spans) {
    accX += span.lengthM;
    supportPositions.push(toX(accX));
  }

  // Handle interactive pointer move
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * width;

    if (svgX < padLeft || svgX > padLeft + plotW) {
      setHoverData(null);
      return;
    }

    const relX = ((svgX - padLeft) / plotW) * totalL;
    let closestPt = result.points[0];
    let minDist = Infinity;
    for (const pt of result.points) {
      const d = Math.abs(pt.xTotal - relX);
      if (d < minDist) {
        minDist = d;
        closestPt = pt;
      }
    }

    if (closestPt) {
      setHoverData({
        xTotal: closestPt.xTotal,
        xSpan: closestPt.xSpan,
        spanIndex: closestPt.spanIndex,
        shearKn: closestPt.shearKn,
        momentKnm: closestPt.momentKnm,
        deflectionMm: closestPt.deflectionMm ?? 0,
        px: toX(closestPt.xTotal),
      });
    }
  };

  const handlePointerLeave = () => {
    setHoverData(null);
  };

  const NUM_MORPH_POINTS = 100;

  const samplePointAt = (xM: number) => {
    if (!result.points || result.points.length === 0) return { shearKn: 0, momentKnm: 0, deflectionMm: 0 };
    let low = 0;
    let high = result.points.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (result.points[mid].xTotal < xM) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const idx1 = Math.max(0, Math.min(result.points.length - 1, high));
    const idx2 = Math.min(result.points.length - 1, idx1 + 1);
    const p1 = result.points[idx1];
    const p2 = result.points[idx2];
    if (idx1 === idx2 || Math.abs(p2.xTotal - p1.xTotal) < 1e-6) {
      return { shearKn: p1.shearKn, momentKnm: p1.momentKnm, deflectionMm: p1.deflectionMm ?? 0 };
    }
    const frac = (xM - p1.xTotal) / (p2.xTotal - p1.xTotal);
    const d1 = p1.deflectionMm ?? 0;
    const d2 = p2.deflectionMm ?? 0;
    return {
      shearKn: p1.shearKn + frac * (p2.shearKn - p1.shearKn),
      momentKnm: p1.momentKnm + frac * (p2.momentKnm - p1.momentKnm),
      deflectionMm: d1 + frac * (d2 - d1),
    };
  };

  const { sfdStrokePathD, sfdAreaPathD, bmdStrokePathD, bmdAreaPathD, deflStrokePathD, deflAreaPathD } = useMemo(() => {
    const points: { px: number; ySFD: number; yBMD: number; yDEFL: number }[] = [];
    for (let i = 0; i <= NUM_MORPH_POINTS; i++) {
      const u = i / NUM_MORPH_POINTS;
      const xM = u * totalL;
      const px = padLeft + u * plotW;
      const { shearKn, momentKnm, deflectionMm } = samplePointAt(xM);
      const ySFD = sfdCenterY - (shearKn / maxV) * sfdAmp;
      const yBMD = bmdCenterY - (momentKnm / maxM) * bmdAmp;
      const yDEFL = deflCenterY - (deflectionMm / maxD) * deflAmp;
      points.push({ px, ySFD, yBMD, yDEFL });
    }

    const sfdStroke = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px.toFixed(2)} ${p.ySFD.toFixed(2)}`)
      .join(' ');

    const sfdArea =
      `M ${padLeft.toFixed(2)} ${sfdCenterY.toFixed(2)} ` +
      points.map((p) => `L ${p.px.toFixed(2)} ${p.ySFD.toFixed(2)}`).join(' ') +
      ` L ${(padLeft + plotW).toFixed(2)} ${sfdCenterY.toFixed(2)} Z`;

    const bmdStroke = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px.toFixed(2)} ${p.yBMD.toFixed(2)}`)
      .join(' ');

    const bmdArea =
      `M ${padLeft.toFixed(2)} ${bmdCenterY.toFixed(2)} ` +
      points.map((p) => `L ${p.px.toFixed(2)} ${p.yBMD.toFixed(2)}`).join(' ') +
      ` L ${(padLeft + plotW).toFixed(2)} ${bmdCenterY.toFixed(2)} Z`;

    const deflStroke = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px.toFixed(2)} ${p.yDEFL.toFixed(2)}`)
      .join(' ');

    const deflArea =
      `M ${padLeft.toFixed(2)} ${deflCenterY.toFixed(2)} ` +
      points.map((p) => `L ${p.px.toFixed(2)} ${p.yDEFL.toFixed(2)}`).join(' ') +
      ` L ${(padLeft + plotW).toFixed(2)} ${deflCenterY.toFixed(2)} Z`;

    return {
      sfdStrokePathD: sfdStroke,
      sfdAreaPathD: sfdArea,
      bmdStrokePathD: bmdStroke,
      bmdAreaPathD: bmdArea,
      deflStrokePathD: deflStroke,
      deflAreaPathD: deflArea,
    };
  }, [result.points, totalL, plotW, padLeft, maxV, maxM, maxD, sfdCenterY, sfdAmp, bmdCenterY, bmdAmp, deflCenterY, deflAmp]);

  const pathTransition: Transition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };
  const springTransition: Transition = { type: 'spring', damping: 25, stiffness: 220 };

  const safetyColor =
    result.safetyStatus === 'PASS'
      ? '#10b981'
      : result.safetyStatus === 'WARNING'
      ? '#f59e0b'
      : '#f43f5e';

  const safetyBg =
    result.safetyStatus === 'PASS'
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
      : result.safetyStatus === 'WARNING'
      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400'
      : 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400';

  return (
    <div ref={containerRef} className="relative w-full">
      <motion.div layout className="space-y-2 select-none">
        {/* Top Interactive Engineering HUD Bar */}
        <motion.div
          layout
          className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs font-mono"
        >
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold flex items-center gap-1.5 ${safetyBg}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: safetyColor }} />
              <span>{result.safetyStatus}</span>
              <span className="opacity-75 font-normal tabular-nums">
                DCR {(result.utilizationRatio * 100).toFixed(1)}%
              </span>
            </div>

            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] hidden sm:inline">
              ACI 318 / BNBC 2020 · δ_max = {(result.maxDeflectionMm ?? result.codeChecks.maxDeflectionEstimateMm).toFixed(2)} mm
            </span>
          </div>

          <div className="flex items-center gap-1 rounded bg-[var(--md-sys-color-surface-container-high)] p-0.5 relative">
            {(
              [
                { id: 'all', label: 'All Envelopes' },
                { id: 'sfd', label: 'SFD' },
                { id: 'bmd', label: 'BMD' },
                { id: 'deflection', label: 'Deflected Curve' },
                { id: 'coordinates', label: 'Critical Coordinates' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors"
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="cb-diagram-active-tab-indicator"
                    className="absolute inset-0 rounded bg-[var(--md-sys-color-surface)] shadow-2xs border border-[var(--md-sys-color-outline-variant)]/40"
                    transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                  />
                )}
                <span
                  className={`relative z-10 transition-colors ${
                    activeTab === tab.id
                      ? 'font-bold text-[var(--md-sys-color-primary)]'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'coordinates' ? (
            /* Critical Coordinates Ledger View */
            <motion.div
              key="coordinates-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-x-auto"
            >
              <div className="text-xs font-bold font-mono text-[var(--md-sys-color-primary)] mb-2">
                Exact Critical Coordinates Schedule (Inflection Points, Peak Sagging &amp; Support Shears)
              </div>
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[10px] uppercase text-[var(--md-sys-color-on-surface-variant)]">
                    <th className="py-1 px-2">Point ID</th>
                    <th className="py-1 px-2">Span</th>
                    <th className="py-1 px-2">x_local (m)</th>
                    <th className="py-1 px-2">x_global (m)</th>
                    <th className="py-1 px-2">Shear V (kN)</th>
                    <th className="py-1 px-2">Moment M (kN·m)</th>
                    <th className="py-1 px-2">Structural Significance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/50">
                  {result.criticalCoordinates.map((cp) => (
                    <tr key={cp.id} className="hover:bg-[var(--md-sys-color-surface-container)] transition-colors">
                      <td className="py-1 px-2 font-semibold text-[var(--md-sys-color-on-surface)]">{cp.label}</td>
                      <td className="py-1 px-2">Span {cp.spanIndex + 1}</td>
                      <td className="py-1 px-2 font-bold">{cp.xSpanM.toFixed(2)} m</td>
                      <td className="py-1 px-2 font-bold text-[var(--md-sys-color-primary)]">{cp.xTotalM.toFixed(2)} m</td>
                      <td className="py-1 px-2 text-sky-600 dark:text-sky-400">{cp.shearKn.toFixed(1)} kN</td>
                      <td className="py-1 px-2 font-bold text-emerald-600 dark:text-emerald-400">{cp.momentKnm.toFixed(1)} kN·m</td>
                      <td className="py-1 px-2 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">{cp.significance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : (
            /* SVG Interactive Multi-Span Vector Diagram with Fluid Framer Motion Transitions */
            <motion.div
              key="svg-diagram-view"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto cursor-crosshair select-none font-mono"
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                role="img"
                aria-label="Multi-span continuous beam bending moment and shear force envelopes"
              >
                <defs>
                  {/* Arrow Markers */}
                  <marker id="beam-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--md-sys-color-primary)" />
                  </marker>
                  <marker id="point-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                  </marker>
                  <marker id="tri-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#eab308" />
                  </marker>

                  {/* Gradient fills for SFD and BMD */}
                  <linearGradient id="sfd-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="bmd-gradient-sag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.06" />
                  </linearGradient>
                  <linearGradient id="bmd-gradient-hog" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.06" />
                  </linearGradient>

                  {/* Cross-hatch pattern for fixed wall encastré supports */}
                  <pattern id="fixed-wall-hatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="var(--md-sys-color-outline)" strokeWidth="1.2" />
                  </pattern>
                </defs>

                {/* 1. BEAM ELEVATION, LOADS & REALISTIC STRUCTURAL SUPPORTS */}
                {(activeTab === 'all' || activeTab === 'sfd' || activeTab === 'bmd' || activeTab === 'deflection') && (
                  <g id="elevation-group">
                    <text x={12} y={elevY - 35} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
                      BEAM ELEVATION
                    </text>
                    <text x={12} y={elevY - 22} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
                      Total L = {result.totalLengthM.toFixed(1)}m
                    </text>

                    {/* Main Structural Beam Solid Axis with Tooltip */}
                    <rect
                      x={padLeft}
                      y={elevY - 5}
                      width={plotW}
                      height={10}
                      fill="var(--md-sys-color-surface-container-highest)"
                      stroke="var(--md-sys-color-primary)"
                      strokeWidth="1.8"
                      rx="2"
                      {...bindHover({
                        title: 'Clapeyron Three-Moment Theorem Continuity',
                        formula: 'M_A·L_1 + 2M_B·(L_1 + L_2) + M_C·L_2 = -6·(A_1·a_1/L_1 + A_2·b_2/L_2)',
                        substitution: `Continuity solved across ${result.spans.length} spans · Total length = ${result.totalLengthM.toFixed(2)} m`,
                        codeRef: 'BNBC 2020 Part 6 Structural Analysis / ACI 318',
                        description: 'Exact indeterminate beam continuity equations enforcing slope compatibility at supports.',
                      })}
                    >
                      <title>Beam Structural Axis</title>
                    </rect>

                    {/* Spans, Load distributions and Dimension lines */}
                    {result.spans.map((span, idx) => {
                      const xStart = supportPositions[idx];
                      const xEnd = supportPositions[idx + 1];
                      const spanW = Math.max(1, xEnd - xStart);
                      const spanDef = params.spans[idx];

                      return (
                        <g key={`span-load-${idx}`}>
                          {/* A. Uniformly Distributed Load (UDL) */}
                          {spanDef && spanDef.udlKnPerM > 0 && (
                            <g
                              {...bindHover({
                                title: `Span ${idx + 1} Uniformly Distributed Load (UDL)`,
                                formula: 'w·L · Free Moment M_0 = w·L² / 8',
                                substitution: `w = ${spanDef.udlKnPerM} kN/m · Span L = ${span.lengthM}m · Free M_0 = ${((spanDef.udlKnPerM * span.lengthM ** 2) / 8).toFixed(1)} kN·m`,
                                codeRef: 'BNBC 2020 Structural Loading Code',
                                description: 'Continuously distributed gravity dead and live loads across beam clear span.',
                              })}
                            >
                              <title>{`Span ${idx + 1} UDL: ${spanDef.udlKnPerM} kN/m`}</title>
                              <motion.rect
                                animate={{ x: xStart, width: spanW }}
                                transition={springTransition}
                                y={elevY - 32}
                                height={24}
                                fill="var(--md-sys-color-primary)"
                                opacity="0.12"
                              />
                              <motion.line
                                animate={{ x1: xStart, x2: xEnd }}
                                transition={springTransition}
                                y1={elevY - 32}
                                y2={elevY - 32}
                                stroke="var(--md-sys-color-primary)"
                                strokeWidth="1"
                                strokeDasharray="3 2"
                              />
                              {Array.from({ length: Math.max(3, Math.floor(spanW / 24)) }).map((_, arrIdx) => {
                                const arrX = xStart + (arrIdx + 0.5) * (spanW / Math.max(3, Math.floor(spanW / 24)));
                                return (
                                  <line
                                    key={arrIdx}
                                    x1={arrX}
                                    y1={elevY - 32}
                                    x2={arrX}
                                    y2={elevY - 8}
                                    stroke="var(--md-sys-color-primary)"
                                    strokeWidth="1"
                                    markerEnd="url(#beam-arrow)"
                                  />
                                );
                              })}
                              <motion.text
                                animate={{ x: xStart + spanW / 2 }}
                                transition={springTransition}
                                y={elevY - 35}
                                fontSize="8.5"
                                fontWeight="700"
                                textAnchor="middle"
                                fill="var(--md-sys-color-primary)"
                              >
                                w = {spanDef.udlKnPerM} kN/m
                              </motion.text>
                            </g>
                          )}

                          {/* B. Triangular / Varying Load Profile */}
                          {spanDef && (spanDef.triangularLoadKnPerM || 0) > 0 && (
                            <g
                              {...bindHover({
                                title: `Span ${idx + 1} Linearly Varying / Triangular Load`,
                                formula: 'W_tri = 0.5 × w_tri × L · Cubic Shear & Quartic Moment',
                                substitution: `Peak w_tri = ${spanDef.triangularLoadKnPerM} kN/m (${spanDef.triangularLoadPattern || 'increasing'})`,
                                codeRef: 'Hydrostatic & Retaining Wall Load Distribution',
                                description: 'Linearly varying load generating cubic shear distribution and 4th-degree moment curves.',
                              })}
                            >
                              <title>{`Span ${idx + 1} Triangular Load: ${spanDef.triangularLoadKnPerM} kN/m`}</title>
                              {(() => {
                                const triW = spanDef.triangularLoadKnPerM || 0;
                                const pat = spanDef.triangularLoadPattern || 'increasing';
                                let pathD = '';
                                if (pat === 'increasing') {
                                  pathD = `M ${xStart.toFixed(1)} ${(elevY - 6).toFixed(1)} L ${xEnd.toFixed(1)} ${(elevY - 36).toFixed(1)} L ${xEnd.toFixed(1)} ${(elevY - 6).toFixed(1)} Z`;
                                } else if (pat === 'decreasing') {
                                  pathD = `M ${xStart.toFixed(1)} ${(elevY - 36).toFixed(1)} L ${xEnd.toFixed(1)} ${(elevY - 6).toFixed(1)} L ${xStart.toFixed(1)} ${(elevY - 6).toFixed(1)} Z`;
                                } else {
                                  pathD = `M ${xStart.toFixed(1)} ${(elevY - 6).toFixed(1)} L ${(xStart + spanW / 2).toFixed(1)} ${(elevY - 36).toFixed(1)} L ${xEnd.toFixed(1)} ${(elevY - 6).toFixed(1)} Z`;
                                }
                                return (
                                  <g>
                                    <motion.path
                                      animate={{ d: pathD }}
                                      transition={pathTransition}
                                      fill="#eab308"
                                      opacity="0.2"
                                      stroke="#eab308"
                                      strokeWidth="1"
                                      strokeDasharray="2 2"
                                    />
                                    <motion.text
                                      animate={{ x: xStart + spanW / 2 }}
                                      transition={springTransition}
                                      y={elevY - 38}
                                      fontSize="8"
                                      fontWeight="700"
                                      textAnchor="middle"
                                      fill="#b45309"
                                    >
                                      ▲ w_tri = {triW} kN/m ({pat})
                                    </motion.text>
                                  </g>
                                );
                              })()}
                            </g>
                          )}

                          {/* C. Concentrated Point Load Vector */}
                          {spanDef && spanDef.pointLoadKn > 0 && (
                            <g
                              {...bindHover({
                                title: `Span ${idx + 1} Concentrated Point Load`,
                                formula: 'P · Free Moment M_0 = P·a·b / L · Shear Step ΔV = P',
                                substitution: `P = ${spanDef.pointLoadKn} kN @ ${spanDef.pointLoadPositionM || (span.lengthM / 2).toFixed(1)}m from left support`,
                                codeRef: 'BNBC 2020 Point Force Criterion',
                                description: 'Concentrated load causing an instantaneous step discontinuity in SFD and slope kink in BMD.',
                              })}
                            >
                              <title>{`Span ${idx + 1} Point Load: ${spanDef.pointLoadKn} kN`}</title>
                              {(() => {
                                const ptX = xStart + ((spanDef.pointLoadPositionM || span.lengthM / 2) / span.lengthM) * spanW;
                                return (
                                  <motion.g
                                    animate={{ x: ptX }}
                                    transition={springTransition}
                                  >
                                    <line x1={0} y1={elevY - 48} x2={0} y2={elevY - 8} stroke="#f43f5e" strokeWidth="2.8" />
                                    <polygon points={`0,${elevY - 6} -4,${elevY - 14} 4,${elevY - 14}`} fill="#f43f5e" />
                                    <rect x={-28} y={elevY - 58} width={56} height={12} rx="2" fill="var(--md-sys-color-surface)" stroke="#f43f5e" strokeWidth="1" />
                                    <text x={0} y={elevY - 49} fontSize="8" fontWeight="800" textAnchor="middle" fill="#f43f5e">
                                      P={spanDef.pointLoadKn}kN
                                    </text>
                                  </motion.g>
                                );
                              })()}
                            </g>
                          )}

                          {/* Span dimension callout line */}
                          <motion.line
                            animate={{ x1: xStart, x2: xEnd }}
                            transition={springTransition}
                            y1={elevY + 28}
                            y2={elevY + 28}
                            stroke="var(--md-sys-color-outline)"
                            strokeWidth="1"
                          />
                          <motion.line
                            animate={{ x1: xStart, x2: xStart }}
                            transition={springTransition}
                            y1={elevY + 24}
                            y2={elevY + 32}
                            stroke="var(--md-sys-color-outline)"
                            strokeWidth="1"
                          />
                          <motion.line
                            animate={{ x1: xEnd, x2: xEnd }}
                            transition={springTransition}
                            y1={elevY + 24}
                            y2={elevY + 32}
                            stroke="var(--md-sys-color-outline)"
                            strokeWidth="1"
                          />
                          <motion.text
                            animate={{ x: xStart + spanW / 2 }}
                            transition={springTransition}
                            y={elevY + 39}
                            fontSize="8.5"
                            fontWeight="700"
                            textAnchor="middle"
                            fill="var(--md-sys-color-on-surface)"
                          >
                            Span {idx + 1}: L={span.lengthM}m
                          </motion.text>
                        </g>
                      );
                    })}

                    {/* Realistic Support Triangles & Fixed Encastré Walls with Fluid Translation */}
                    {supportPositions.map((supX, sIdx) => {
                      const rxn = result.supportReactionsKn[sIdx] || 0;
                      const isLeftFixed = sIdx === 0 && params.leftSupport === 'fixed';
                      const isRightFixed = sIdx === supportPositions.length - 1 && params.rightSupport === 'fixed';

                      return (
                        <motion.g
                          key={`sup-graphic-${sIdx}`}
                          animate={{ x: supX }}
                          transition={springTransition}
                          {...bindHover({
                            title: `Support ${sIdx} Boundary Reaction`,
                            formula: 'R_i = V_i,left + V_i,right · Equilibrium Σ F_y = 0',
                            substitution: `Support R${sIdx} = ${rxn.toFixed(1)} kN upward reaction (${isLeftFixed || isRightFixed ? 'Fixed Encastré' : 'Pinned Roller'})`,
                            codeRef: 'BNBC 2020 Support Reaction Standard',
                            description: 'Vertical reaction force transferred from continuous beam into supporting structural column or wall.',
                          })}
                        >
                          <title>{`Support ${sIdx}: R = ${rxn.toFixed(1)} kN`}</title>
                          {isLeftFixed ? (
                            /* Left Encastré Wall */
                            <g>
                              <rect x={-12} y={elevY - 22} width={12} height={44} fill="url(#fixed-wall-hatch)" stroke="var(--md-sys-color-on-surface)" strokeWidth="2" />
                              <line x1={0} y1={elevY - 22} x2={0} y2={elevY + 22} stroke="var(--md-sys-color-on-surface)" strokeWidth="3" />
                            </g>
                          ) : isRightFixed ? (
                            /* Right Encastré Wall */
                            <g>
                              <rect x={0} y={elevY - 22} width={12} height={44} fill="url(#fixed-wall-hatch)" stroke="var(--md-sys-color-on-surface)" strokeWidth="2" />
                              <line x1={0} y1={elevY - 22} x2={0} y2={elevY + 22} stroke="var(--md-sys-color-on-surface)" strokeWidth="3" />
                            </g>
                          ) : (
                            /* Pinned / Roller Triangle Support */
                            <g>
                              <polygon
                                points={`0,${elevY + 6} -8,${elevY + 20} 8,${elevY + 20}`}
                                fill="var(--md-sys-color-surface-container-highest)"
                                stroke="var(--md-sys-color-on-surface)"
                                strokeWidth="1.5"
                              />
                              <line x1={-11} y1={elevY + 21} x2={11} y2={elevY + 21} stroke="var(--md-sys-color-on-surface)" strokeWidth="1.5" />
                              <circle cx={-4} cy={elevY + 24} r="1.5" fill="var(--md-sys-color-outline)" />
                              <circle cx={4} cy={elevY + 24} r="1.5" fill="var(--md-sys-color-outline)" />
                            </g>
                          )}

                          {/* Support Reaction Upward Force Tag */}
                          <text x={0} y={elevY + 54} fontSize="8" fontWeight="800" textAnchor="middle" fill="var(--md-sys-color-primary)">
                            R{sIdx} = {rxn.toFixed(1)} kN
                          </text>
                        </motion.g>
                      );
                    })}
                  </g>
                )}

                {/* 2. CONTINUOUS SHEAR FORCE DIAGRAM (SFD) WITH FLUID PATH TRANSITION */}
                {(activeTab === 'all' || activeTab === 'sfd') && (
                  <g
                    id="sfd-group"
                    {...bindHover({
                      title: 'Continuous Shear Force Envelope (SFD)',
                      formula: 'V(x) = dM/dx = -∫ w(x) dx · V_max Peak Shear Limit Check',
                      substitution: `Peak Shear V_max = ±${result.maxShearKn.toFixed(1)} kN across continuous spans`,
                      codeRef: 'ACI 318-19 §22.5 Shear Strength / BNBC 2020',
                      description: 'Internal transverse shear gradient governing stirrup bar spacing and web shear reinforcement.',
                    })}
                  >
                    <title>Shear Force Diagram (SFD)</title>
                    <text x={12} y={sfdCenterY - 22} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
                      SFD (kN)
                    </text>
                    <text x={12} y={sfdCenterY - 10} fontSize="8" fill="#0ea5e9">
                      V_max = {result.maxShearKn.toFixed(1)} kN
                    </text>

                    {/* Zero-Shear Reference Axis */}
                    <line x1={padLeft} y1={sfdCenterY} x2={padLeft + plotW} y2={sfdCenterY} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1.2" />

                    {/* Morphing SFD Area Fill */}
                    <motion.path
                      animate={{ d: sfdAreaPathD }}
                      transition={pathTransition}
                      fill="url(#sfd-gradient)"
                    />

                    {/* Morphing SFD Stroke Curve */}
                    <motion.path
                      animate={{ d: sfdStrokePathD }}
                      transition={pathTransition}
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />

                    {/* Support vertical guideline cuts */}
                    {supportPositions.map((supX, sIdx) => (
                      <motion.line
                        key={`sup-sfd-line-${sIdx}`}
                        animate={{ x1: supX, x2: supX }}
                        transition={springTransition}
                        y1={sfdCenterY - sfdAmp}
                        y2={sfdCenterY + sfdAmp}
                        stroke="var(--md-sys-color-outline-variant)"
                        strokeWidth="0.8"
                        strokeDasharray="2 3"
                      />
                    ))}

                    {/* Peak annotations */}
                    <text x={padLeft + plotW + 6} y={sfdCenterY - sfdAmp + 8} fontSize="8" fontWeight="700" fill="#0ea5e9">
                      +{result.maxShearKn.toFixed(1)}
                    </text>
                    <text x={padLeft + plotW + 6} y={sfdCenterY + sfdAmp - 2} fontSize="8" fontWeight="700" fill="#0ea5e9">
                      -{result.maxShearKn.toFixed(1)}
                    </text>
                  </g>
                )}

                {/* 3. CONTINUOUS BENDING MOMENT DIAGRAM (BMD) WITH FLUID PATH TRANSITION */}
                {(activeTab === 'all' || activeTab === 'bmd') && (
                  <g
                    id="bmd-group"
                    {...bindHover({
                      title: 'Continuous Bending Moment Envelope (BMD)',
                      formula: 'M(x) = M_0(x) + M_A·(1 - x/L) + M_B·(x/L) · d²w/dx² = -M(x)/EI',
                      substitution: `Peak Sagging = +${result.maxSaggingMomentKnm.toFixed(1)} kN·m (bottom rebar) · Peak Hogging = -${result.maxHoggingMomentKnm.toFixed(1)} kN·m (top rebar)`,
                      codeRef: 'ACI 318-19 Flexural Design / BNBC 2020 Part 6',
                      description: 'Internal flexural moment envelope displaying sagging (tension at bottom) and hogging over supports (tension at top).',
                    })}
                  >
                    <title>Bending Moment Diagram (BMD)</title>
                    <text x={12} y={bmdCenterY - 22} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
                      BMD (kN·m)
                    </text>
                    <text x={12} y={bmdCenterY - 10} fontSize="8" fill="#8b5cf6">
                      Sag / Hogging
                    </text>

                    {/* Baseline (M = 0) */}
                    <line x1={padLeft} y1={bmdCenterY} x2={padLeft + plotW} y2={bmdCenterY} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1.2" />

                    {/* Morphing BMD Area Fill */}
                    <motion.path
                      animate={{ d: bmdAreaPathD }}
                      transition={pathTransition}
                      fill="url(#bmd-gradient-sag)"
                    />

                    {/* Morphing BMD Stroke Curve */}
                    <motion.path
                      animate={{ d: bmdStrokePathD }}
                      transition={pathTransition}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                    />

                    {/* Support vertical cut lines */}
                    {supportPositions.map((supX, sIdx) => (
                      <motion.line
                        key={`sup-bmd-line-${sIdx}`}
                        animate={{ x1: supX, x2: supX }}
                        transition={springTransition}
                        y1={bmdCenterY - bmdAmp}
                        y2={bmdCenterY + bmdAmp}
                        stroke="var(--md-sys-color-outline-variant)"
                        strokeWidth="0.8"
                        strokeDasharray="2 3"
                      />
                    ))}

                    {/* Inflection Points (Contra-flexure M = 0) Gliding Along Axis */}
                    {result.allInflectionPointsTotalM.map((ipM, ipIdx) => {
                      const ipX = toX(ipM);
                      return (
                        <motion.g
                          key={`inf-pt-${ipIdx}`}
                          animate={{ x: ipX }}
                          transition={springTransition}
                        >
                          <polygon
                            points={`0,${bmdCenterY - 4} 4,${bmdCenterY} 0,${bmdCenterY + 4} -4,${bmdCenterY}`}
                            fill="#eab308"
                            stroke="#713f12"
                            strokeWidth="1"
                          />
                          <text x={0} y={bmdCenterY - 7} fontSize="7" fontWeight="700" textAnchor="middle" fill="#b45309">
                            x={ipM.toFixed(2)}m
                          </text>
                        </motion.g>
                      );
                    })}

                    {/* Peak Sagging & Hogging Values Tag */}
                    <text x={padLeft + plotW + 6} y={bmdCenterY - (result.maxHoggingMomentKnm / maxM) * bmdAmp} fontSize="8" fontWeight="800" fill="#f43f5e">
                      -{result.maxHoggingMomentKnm.toFixed(1)} (Hog)
                    </text>
                    <text x={padLeft + plotW + 6} y={bmdCenterY + (result.maxSaggingMomentKnm / maxM) * bmdAmp + 5} fontSize="8" fontWeight="800" fill="#10b981">
                      +{result.maxSaggingMomentKnm.toFixed(1)} (Sag)
                    </text>
                  </g>
                )}

                {/* 3.5 CONTINUOUS ELASTIC DEFLECTED SHAPE CURVE y(x) */}
                {(activeTab === 'all' || activeTab === 'deflection') && (
                  <g
                    id="deflection-group"
                    {...bindHover({
                      title: 'Continuous Beam Elastic Deflected Shape y(x)',
                      formula: 'EI_i · d²y/dx² = M(x) with y(support) = 0 and θ_L = θ_R',
                      substitution: `Max δ_max = ${(result.maxDeflectionMm ?? result.codeChecks.maxDeflectionEstimateMm).toFixed(2)} mm @ x = ${(result.maxDeflectionLocationM ?? 0).toFixed(2)} m (${result.codeChecks.deflectionRatio})`,
                      codeRef: `${result.codeChecks.governingCode} Table 24.2.2`,
                      description: 'Continuous deflected shape curve solved by piecewise curvature double-integration.',
                    })}
                  >
                    <title>Elastic Deflected Shape Curve y(x)</title>
                    <text x={12} y={deflCenterY - 14} fontSize="10" fontWeight="700" fill="#0284c7">
                      DEFL y(x)
                    </text>
                    <text x={12} y={deflCenterY - 2} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
                      δ_max = {(result.maxDeflectionMm ?? result.codeChecks.maxDeflectionEstimateMm).toFixed(2)} mm
                    </text>

                    <line x1={padLeft} y1={deflCenterY} x2={padLeft + plotW} y2={deflCenterY} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1.2" strokeDasharray="3 3" />

                    <motion.path
                      animate={{ d: deflAreaPathD }}
                      transition={pathTransition}
                      fill="#0ea5e9"
                      fillOpacity="0.16"
                    />
                    <motion.path
                      animate={{ d: deflStrokePathD }}
                      transition={pathTransition}
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="2.3"
                      strokeLinejoin="round"
                    />

                    {supportPositions.map((supX, sIdx) => (
                      <motion.circle
                        key={`sup-defl-node-${sIdx}`}
                        animate={{ cx: supX }}
                        transition={springTransition}
                        cy={deflCenterY}
                        r="3"
                        fill="var(--md-sys-color-surface)"
                        stroke="var(--md-sys-color-on-surface)"
                        strokeWidth="1.5"
                      />
                    ))}

                    {result.maxDeflectionLocationM !== undefined && (
                      <text
                        x={Math.min(padLeft + plotW - 110, Math.max(padLeft + 10, toX(result.maxDeflectionLocationM)))}
                        y={deflCenterY + deflAmp + 11}
                        fontSize="8"
                        fontWeight="800"
                        fill="#0284c7"
                      >
                        δ_max = {(result.maxDeflectionMm ?? 0).toFixed(2)} mm @ {result.maxDeflectionLocationM.toFixed(2)}m
                      </text>
                    )}
                  </g>
                )}

                {/* 4. REAL-TIME INTERACTIVE CROSSHAIR & FLOATING HUD TRACKER */}
                {hoverData && (
                  <g id="hover-crosshair-group">
                    <line
                      x1={hoverData.px}
                      y1={20}
                      x2={hoverData.px}
                      y2={height - 20}
                      stroke="var(--md-sys-color-primary)"
                      strokeWidth="1.4"
                      strokeDasharray="4 3"
                    />

                    {(activeTab === 'all' || activeTab === 'sfd') && (
                      <circle
                        cx={hoverData.px}
                        cy={sfdCenterY - (hoverData.shearKn / maxV) * sfdAmp}
                        r="4"
                        fill="#0ea5e9"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}

                    {(activeTab === 'all' || activeTab === 'bmd') && (
                      <circle
                        cx={hoverData.px}
                        cy={bmdCenterY - (hoverData.momentKnm / maxM) * bmdAmp}
                        r="4.5"
                        fill="#8b5cf6"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}

                    {(activeTab === 'all' || activeTab === 'deflection') && (
                      <circle
                        cx={hoverData.px}
                        cy={deflCenterY - (hoverData.deflectionMm / maxD) * deflAmp}
                        r="4.5"
                        fill="#0ea5e9"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Floating Tooltip HUD */}
                    {(() => {
                      const boxW = 166;
                      const boxH = 68;
                      let boxX = hoverData.px + 12;
                      if (boxX + boxW > width - 10) boxX = hoverData.px - boxW - 12;
                      const boxY = 22;

                      return (
                        <g>
                          <rect
                            x={boxX}
                            y={boxY}
                            width={boxW}
                            height={boxH}
                            rx="6"
                            fill="var(--md-sys-color-surface)"
                            stroke="var(--md-sys-color-primary)"
                            strokeWidth="1.5"
                            filter="drop-shadow(0 2px 5px rgba(0,0,0,0.18))"
                          />
                          <text x={boxX + 8} y={boxY + 14} fontSize="8.5" fontWeight="800" fill="var(--md-sys-color-primary)">
                            x = {hoverData.xTotal.toFixed(2)}m (Span {hoverData.spanIndex + 1})
                          </text>
                          <text x={boxX + 8} y={boxY + 28} fontSize="8" fill="var(--md-sys-color-on-surface)">
                            Shear V: <tspan fontWeight="700" fill="#0ea5e9">{hoverData.shearKn.toFixed(2)} kN</tspan>
                          </text>
                          <text x={boxX + 8} y={boxY + 41} fontSize="8" fill="var(--md-sys-color-on-surface)">
                            Moment M: <tspan fontWeight="700" fill={hoverData.momentKnm >= 0 ? '#10b981' : '#f43f5e'}>
                              {hoverData.momentKnm >= 0 ? `+${hoverData.momentKnm.toFixed(2)}` : hoverData.momentKnm.toFixed(2)} kN·m
                            </tspan>
                          </text>
                          <text x={boxX + 8} y={boxY + 54} fontSize="8" fill="var(--md-sys-color-on-surface)">
                            Defl y: <tspan fontWeight="700" fill="#0284c7">{hoverData.deflectionMm.toFixed(2)} mm</tspan>
                          </text>
                          <text x={boxX + 8} y={boxY + 64} fontSize="6.8" fill="var(--md-sys-color-on-surface-variant)">
                            {hoverData.momentKnm >= 0 ? 'Tension on Bottom' : 'Tension on Top (Hogging)'}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 13. Deep Foundation Pile Capacity Diagram (BNBC-2020 / Tomlinson / Vesic) */
export const PileCapacityDiagramSvg: React.FC<{
  params: PileCapacityParameters;
  result: PileCapacityResult;
}> = ({ params, result }) => {
  const { containerRef, tooltip, bindHover } = useFormulaTooltip();
  const [activeTab, setActiveTab] = useState<'stratigraphy' | 'friction-spt' | 'settlement' | 'methods' | 'clauses'>('stratigraphy');
  const [hoverDepth, setHoverDepth] = useState<{ z: number; py: number; layerName: string; fsKpa: number; sigmaV0: number; sptN: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const width = 680;
  const height = 370;

  if (params.lengthM <= 0 || params.diameterM <= 0) {
    return (
      <div className="space-y-2 select-none font-mono">
        <svg viewBox={`0 0 ${width} 320`} className="w-full h-auto select-none font-mono">
          <rect x={10} y={10} width={width - 20} height={300} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
          <text x={width / 2} y={145} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
            ZERO PILE GEOMETRY (L = 0.00m, D = 0.00m)
          </text>
          <text x={width / 2} y={170} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
            Enter pile length, diameter and stratigraphy layers to evaluate skin friction and end bearing
          </text>
        </svg>
      </div>
    );
  }

  const pileLength = Math.max(1, result.lengthM);
  const pileDiameter = result.diameterM;

  const groundY = 65;
  const bottomY = 320;
  const totalH = bottomY - groundY;
  const maxProfileDepthM = pileLength + 4; // allow viewing beneath pile tip
  const toY = (depthM: number) => groundY + (depthM / maxProfileDepthM) * (totalH + 25);
  const toDepthM = (py: number) => ((py - groundY) / (totalH + 25)) * maxProfileDepthM;

  const pileTipY = toY(pileLength);
  const pileCenterX = 240;
  const pileW = Math.max(20, Math.min(48, (pileDiameter / 1.2) * 36));

  const fs = result.effectiveSafetyFactor;
  const isPassingFs = fs >= 2.5;
  const isMarginalFs = fs >= 2.0 && fs < 2.5;
  const fsColor = isPassingFs ? '#10b981' : isMarginalFs ? '#f59e0b' : '#ef4444';
  const fsLabel = isPassingFs ? 'SAFE (FS ≥ 2.5)' : isMarginalFs ? 'MARGINAL (2.0 ≤ FS < 2.5)' : 'UNSAFE (FS < 2.0)';

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawY = (e.clientY - rect.top) * (height / rect.height);
    if (rawY >= groundY && rawY <= pileTipY) {
      const z = Math.max(0, Math.min(pileLength, toDepthM(rawY)));
      // Find matching stratum
      const matchingContrib = result.layerContributions.find(
        (c) => z >= c.depthFromM && z <= c.depthToM
      ) || result.layerContributions[0];

      if (matchingContrib) {
        setHoverDepth({
          z,
          py: rawY,
          layerName: matchingContrib.layerName,
          fsKpa: matchingContrib.unitFrictionKpa,
          sigmaV0: matchingContrib.effectiveStressKpa,
          sptN: matchingContrib.sptN || 15,
        });
      }
    } else {
      setHoverDepth(null);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2 select-none font-mono relative w-full">
      {/* Top Controls & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--md-sys-color-primary)]">
            Deep Foundation Analysis
          </span>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            BNBC-2020 Clause 3.10 ({result.methodUsed})
          </span>
        </div>

        <div className="flex items-center gap-1 rounded bg-[var(--md-sys-color-surface-container-high)] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('stratigraphy')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'stratigraphy' ? 'bg-[var(--md-sys-color-surface)] font-bold text-[var(--md-sys-color-on-surface)] shadow-xs' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}
          >
            Borehole Strata
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('friction-spt')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'friction-spt' ? 'bg-[var(--md-sys-color-surface)] font-bold text-[var(--md-sys-color-on-surface)] shadow-xs' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}
          >
            Friction &amp; SPT N
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settlement')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'settlement' ? 'bg-[var(--md-sys-color-surface)] font-bold text-[var(--md-sys-color-on-surface)] shadow-xs' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}
          >
            Settlement (Se + Sc)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('methods')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'methods' ? 'bg-[var(--md-sys-color-surface)] font-bold text-[var(--md-sys-color-on-surface)] shadow-xs' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}
          >
            Method Solvers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clauses')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'clauses' ? 'bg-[var(--md-sys-color-surface)] font-bold text-[var(--md-sys-color-on-surface)] shadow-xs' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}
          >
            Code Breakdown
          </button>
        </div>
      </div>

      {activeTab === 'methods' ? (
        /* Solvers Comparison Tab */
        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--md-sys-color-primary)]">
              Deep Foundation Capacity Solvers Comparison
            </span>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
              Safety Factor FS = {result.factorOfSafety} | D = {result.diameterM}m, L = {result.lengthM}m
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-1">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-semibold uppercase">Tomlinson α &amp; Burland β</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{result.alphaBetaCapacityKn.qall} kN</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                Qs: {result.alphaBetaCapacityKn.qs} kN · Qp: {result.alphaBetaCapacityKn.qp} kN
              </div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Theoretical Adhesion &amp; Effective Beta</div>
            </div>

            <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-1">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-semibold uppercase">Meyerhof SPT Correlation</div>
              <div className="text-lg font-bold text-sky-600 dark:text-sky-400">{result.meyerhofSptCapacityKn.qall} kN</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                Qs: {result.meyerhofSptCapacityKn.qs} kN · Qp: {result.meyerhofSptCapacityKn.qp} kN
              </div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Standard N60 Blow-Count Formula</div>
            </div>

            {result.terzaghiCapacityKn && (
              <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-1">
                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-semibold uppercase">Terzaghi &amp; Bowles</div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{result.terzaghiCapacityKn.qall} kN</div>
                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Qs: {result.terzaghiCapacityKn.qs} kN · Qp: {result.terzaghiCapacityKn.qp} kN
                </div>
                <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Bearing Factor Nq/Nc Formulation</div>
              </div>
            )}

            <div className="p-3 rounded-xl border-2 border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container)] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[var(--md-sys-color-primary)] font-bold uppercase">BNBC-2020 Combined</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">ACTIVE</span>
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{result.allowableCapacityKn.toFixed(0)} kN</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                Qs: {result.skinFrictionKn.toFixed(0)} kN · Qp: {result.endBearingKn.toFixed(0)} kN
              </div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Governing Design Resistance</div>
            </div>
          </div>
        </div>
      ) : activeTab === 'clauses' ? (
        /* Code Audit Trail Tab */
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2 text-xs">
          <div className="font-bold text-[var(--md-sys-color-primary)]">
            BNBC-2020 Part 6 Chapter 3 Deep Foundation Derivations &amp; Verification
          </div>
          <table className="w-full text-left font-mono border-collapse">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase">
                <th className="py-1 px-2">Design Step</th>
                <th className="py-1 px-2">Analytical Formula</th>
                <th className="py-1 px-2">Evaluated Output</th>
                <th className="py-1 px-2">BNBC Clause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/40 text-[11px]">
              {result.calculationsBreakdown.map((item, idx) => (
                <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container)]">
                  <td className="py-1.5 px-2 font-semibold text-[var(--md-sys-color-on-surface)]">{item.step}</td>
                  <td className="py-1.5 px-2 text-[var(--md-sys-color-on-surface-variant)]">{item.formula}</td>
                  <td className="py-1.5 px-2 font-bold text-[var(--md-sys-color-primary)]">{item.result}</td>
                  <td className="py-1.5 px-2 font-mono text-[10px] text-sky-600 dark:text-sky-400">{item.clauseRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'settlement' ? (
        /* Vesic Settlement 3-Component + Consolidation Breakdown */
        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[var(--md-sys-color-on-surface)]">
              Pile Settlement Evaluation: Elastic Vesic + Primary Consolidation (BNBC Clause 3.10.4.2)
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${result.settlementPass ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'}`}>
              {result.settlementPass ? 'PASS (≤ Permissible Limit)' : 'EXCEEDED (> Permissible Limit)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-1">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">1. Shaft Elastic (Ss)</div>
              <div className="text-lg font-bold text-sky-600 dark:text-sky-400">{result.settlementShaftMm.toFixed(1)} mm</div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Shaft concrete deformation</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-1">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">2. Base Punch (Sb)</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{result.settlementBaseMm.toFixed(1)} mm</div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Point load soil displacement</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-1">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">3. Interaction (Sbs)</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{result.settlementInteractionMm.toFixed(1)} mm</div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Shaft-to-base load transfer</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-1">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">4. Consolidation (Sc)</div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{result.consolidationSettlementMm.toFixed(1)} mm</div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Equivalent 2/3L raft method</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-1">
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">Total St (Se + Sc)</div>
              <div className={`text-lg font-bold ${result.settlementPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {result.totalSettlementMm.toFixed(1)} mm
              </div>
              <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Limit: {result.permissibleSettlementMm} mm</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
              <span>Settlement Utilization: {((result.totalSettlementMm / result.permissibleSettlementMm) * 100).toFixed(1)}%</span>
              <span>Allowable Cap: {result.permissibleSettlementMm} mm</span>
            </div>
            <div className="h-3.5 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, (result.settlementShaftMm / result.permissibleSettlementMm) * 100)}%` }}
                className="bg-sky-500 h-full"
                title={`Shaft Elastic Ss: ${result.settlementShaftMm} mm`}
              />
              <div
                style={{ width: `${Math.min(100, (result.settlementBaseMm / result.permissibleSettlementMm) * 100)}%` }}
                className="bg-purple-500 h-full"
                title={`Base Punch Sb: ${result.settlementBaseMm} mm`}
              />
              <div
                style={{ width: `${Math.min(100, (result.settlementInteractionMm / result.permissibleSettlementMm) * 100)}%` }}
                className="bg-amber-500 h-full"
                title={`Interaction Sbs: ${result.settlementInteractionMm} mm`}
              />
              <div
                style={{ width: `${Math.min(100, (result.consolidationSettlementMm / result.permissibleSettlementMm) * 100)}%` }}
                className="bg-indigo-500 h-full"
                title={`Consolidation Sc: ${result.consolidationSettlementMm} mm`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-sky-500 rounded-sm" /> Ss Shaft ({result.settlementShaftMm.toFixed(1)}mm)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-500 rounded-sm" /> Sb Base ({result.settlementBaseMm.toFixed(1)}mm)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" /> Sbs ({result.settlementInteractionMm.toFixed(1)}mm)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" /> Sc Consolidation ({result.consolidationSettlementMm.toFixed(1)}mm)</span>
            </div>
          </div>
        </div>
      ) : (
        /* SVG Interactive Visual Diagram */
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none font-mono cursor-crosshair"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverDepth(null)}
            role="img"
          >
            {/* Ground Surface Line with Tooltip */}
            <g
              {...bindHover({
                title: 'Finished Ground Level Datum (EL ±0.00m)',
                formula: "σ'v0 = 0 kPa at GL · Overburden σ'v = Σ (γ_i × h_i)",
                substitution: `Pile head elevation datum with ${result.layerContributions.length} subsoil strata`,
                codeRef: 'BNBC 2020 Geotechnical Ground Reference',
                description: 'Reference benchmark for measuring borehole stratigraphy, pile penetration, and effective overburden.',
              })}
            >
              <title>Ground Surface Level</title>
              <line x1={30} y1={groundY} x2={510} y2={groundY} stroke="#78716c" strokeWidth="3" />
              <text x={35} y={groundY - 8} fontSize="9" fontWeight="700" fill="#78716c">
                FINISHED GROUND LEVEL EL ±0.00m
              </text>
            </g>

            {/* Borehole Strata Blocks with Tooltips */}
            {result.layerContributions.map((layer, idx) => {
              const yTop = toY(layer.depthFromM);
              const yBot = toY(layer.depthToM);
              const lH = yBot - yTop;
              const isClay = layer.soilType === 'clay';
              const isSilt = layer.soilType === 'silt';
              const fillColor = isClay ? '#fef3c7' : isSilt ? '#ffedd5' : '#ecfdf5';
              const strokeColor = isClay ? '#fde68a' : isSilt ? '#fed7aa' : '#a7f3d0';

              return (
                <g
                  key={`strata-${idx}`}
                  {...bindHover({
                    title: `Borehole Stratum: ${layer.layerName}`,
                    formula: layer.soilType === 'clay' ? "f_s = α × c_u (Tomlinson α-method)" : "f_s = β × σ'v0 = K_s × σ'v0 × tan(δ) (Burland β-method)",
                    substitution: `${layer.depthFromM}m to ${layer.depthToM}m · ${layer.soilType.toUpperCase()} · Unit Friction fs = ${layer.unitFrictionKpa} kPa · SPT N = ${layer.sptN || 15}`,
                    codeRef: 'BNBC 2020 Clause 3.10.3 / Tomlinson Method',
                    description: 'Subsoil stratum contributing to cumulative cylindrical shaft skin friction resistance.',
                  })}
                >
                  <title>{`${layer.layerName}: fs = ${layer.unitFrictionKpa} kPa`}</title>
                  <rect x={30} y={yTop} width={480} height={lH} fill={fillColor} stroke={strokeColor} opacity="0.65" />
                  <text x={38} y={yTop + 14} fontSize="8" fontWeight="700" fill="var(--md-sys-color-on-surface)">
                    {layer.layerName}
                  </text>
                  <text x={38} y={yTop + 25} fontSize="7" fill="var(--md-sys-color-on-surface-variant)">
                    {layer.depthFromM}m to {layer.depthToM}m · {layer.soilType.toUpperCase()} · fs = {layer.unitFrictionKpa} kPa
                  </text>

                  {/* SPT N-Value Bar Chart on the Left (active in friction-spt tab) */}
                  {activeTab === 'friction-spt' && (
                    <g transform={`translate(150, ${yTop + 4})`}>
                      <rect x={0} y={0} width={Math.min(60, (layer.sptN || 10) * 1.5)} height={lH - 8} fill="#3b82f6" opacity="0.25" rx="2" />
                      <text x={Math.min(60, (layer.sptN || 10) * 1.5) + 4} y={(lH - 8) / 2 + 3} fontSize="7.5" fontWeight="700" fill="#2563eb">
                        N = {layer.sptN || 10}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Groundwater Table (GWT) with Tooltip */}
            {params.groundwaterDepthM < maxProfileDepthM && (
              <g
                {...bindHover({
                  title: 'Groundwater Table (Piezometric Phreatic Level)',
                  formula: "σ'v = σ_total - u · Submerged γ' = γ_sat - γ_w (γ_w = 9.81 kN/m³)",
                  substitution: `GWT Depth = -${params.groundwaterDepthM.toFixed(1)}m below GL · Pore water pressure u = γ_w × (z - z_gwt)`,
                  codeRef: 'BNBC 2020 Geotechnical Effective Stress Analysis',
                  description: 'Buoyancy reduces effective vertical overburden stress on sand layers below water table.',
                })}
              >
                <title>Groundwater Table</title>
                {(() => {
                  const gwtY = toY(params.groundwaterDepthM);
                  return (
                    <g>
                      <line x1={30} y1={gwtY} x2={510} y2={gwtY} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="6 4" />
                      <polygon points={`34,${gwtY - 6} 40,${gwtY - 6} 37,${gwtY}`} fill="#0ea5e9" />
                      <text x={44} y={gwtY - 4} fontSize="8" fontWeight="700" fill="#0ea5e9">
                        ▼ GWT -{params.groundwaterDepthM.toFixed(1)}m (Piezometric Level)
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Realistic Pile Shaft Body with Tooltip */}
            <g
              {...bindHover({
                title: 'Deep Foundation Pile Shaft Friction Capacity',
                formula: 'Q_s = π × D × Σ [ f_s,i × ΔL_i ] (Shaft Perimeter P = π·D)',
                substitution: `D = ${result.diameterM}m · L = ${result.lengthM}m · Total Mobilized Qs = ${result.skinFrictionKn.toFixed(0)} kN`,
                codeRef: 'BNBC 2020 Part 6 Clause 3.10.1 Pile Shaft Friction',
                description: 'Cumulative frictional resistance integrated along cylindrical bored/driven pile concrete surface.',
              })}
            >
              <title>Pile Shaft Body</title>
              <rect
                x={pileCenterX - pileW / 2}
                y={groundY}
                width={pileW}
                height={pileTipY - groundY}
                fill="#94a3b8"
                stroke="#334155"
                strokeWidth="2"
                rx="2"
              />
              {/* Rebar Cage Representation inside Pile */}
              <line x1={pileCenterX - pileW / 2 + 4} y1={groundY + 2} x2={pileCenterX - pileW / 2 + 4} y2={pileTipY - 4} stroke="#475569" strokeWidth="1.5" strokeDasharray="3 2" />
              <line x1={pileCenterX + pileW / 2 - 4} y1={groundY + 2} x2={pileCenterX + pileW / 2 - 4} y2={pileTipY - 4} stroke="#475569" strokeWidth="1.5" strokeDasharray="3 2" />
            </g>

            {/* Pile Cap / Top Applied Load with Tooltip */}
            <g
              {...bindHover({
                title: 'Superstructure Column Service Axial Compression',
                formula: 'P ≤ Q_all = (Q_s + Q_p) / FS',
                substitution: `Applied P = ${result.appliedLoadKn} kN ≤ Allowable Q_all = ${result.allowableCapacityKn.toFixed(0)} kN (FS = ${result.factorOfSafety})`,
                codeRef: 'BNBC 2020 Axial Load Resistance Check',
                description: 'Direct downward compressive load transferred from column superstructure into foundation pile head.',
              })}
            >
              <title>Applied Column Load</title>
              <rect x={pileCenterX - pileW - 6} y={groundY - 14} width={pileW * 2 + 12} height={14} fill="#64748b" rx="2" />
              <line x1={pileCenterX} y1={12} x2={pileCenterX} y2={groundY - 16} stroke="#e11d48" strokeWidth="3" />
              <polygon points={`${pileCenterX},${groundY - 14} ${pileCenterX - 5},${groundY - 24} ${pileCenterX + 5},${groundY - 24}`} fill="#e11d48" />
              <text x={pileCenterX} y={10} fontSize="10" fontWeight="700" textAnchor="middle" fill="#e11d48">
                P = {result.appliedLoadKn} kN
              </text>
            </g>

            {/* Skin Friction Mobilization Vectors (Upward on pile boundary) with Tooltip */}
            <g
              {...bindHover({
                title: 'Unit Shaft Skin Friction Mobilization (fs)',
                formula: 'τ_shaft = f_s · Mobilized upward to equilibrate downward column load',
                substitution: `Shaft Resistance Qs = ${result.skinFrictionKn.toFixed(0)} kN across ${result.layerContributions.length} strata`,
                codeRef: 'BNBC 2020 Clause 3.10.3 Load-Transfer Mechanics',
                description: 'Upward soil shear stress mobilized along pile-soil interface perimeter.',
              })}
            >
              <title>Shaft Skin Friction Vectors</title>
              {Array.from({ length: 7 }).map((_, i) => {
                const arrY = groundY + (i + 0.6) * ((pileTipY - groundY) / 7.5);
                return (
                  <g key={`arrow-${i}`}>
                    <line x1={pileCenterX - pileW / 2 - 10} y1={arrY} x2={pileCenterX - pileW / 2 - 2} y2={arrY - 5} stroke="#3b82f6" strokeWidth="1.5" />
                    <line x1={pileCenterX + pileW / 2 + 10} y1={arrY} x2={pileCenterX + pileW / 2 + 2} y2={arrY - 5} stroke="#3b82f6" strokeWidth="1.5" />
                  </g>
                );
              })}
            </g>

            {/* Base End Bearing Bulb (Meyerhof Isobar under Pile Tip) with Tooltip */}
            <g
              {...bindHover({
                title: 'Pile Base End Bearing Capacity (Qp)',
                formula: "Q_p = q_p × A_base = (σ'vb × N_q + c_u × N_c) × (π·D² / 4)",
                substitution: `q_p = ${result.unitEndBearingKpa.toFixed(0)} kPa · Toe Area = ${(Math.PI * (result.diameterM ** 2) / 4).toFixed(3)} m² · Q_p = ${result.endBearingKn.toFixed(0)} kN`,
                codeRef: 'BNBC 2020 Clause 3.10.2 / Meyerhof Point Resistance',
                description: 'Geotechnical soil punching resistance mobilized beneath circular pile tip at founding stratum.',
              })}
            >
              <title>Base End Bearing Resistance</title>
              <path
                d={`M ${pileCenterX - pileW * 1.2} ${pileTipY} Q ${pileCenterX} ${pileTipY + 40} ${pileCenterX + pileW * 1.2} ${pileTipY} Z`}
                fill="#f59e0b"
                opacity="0.5"
                stroke="#d97706"
                strokeWidth="1.8"
              />
              <text x={pileCenterX} y={pileTipY + 24} fontSize="8" fontWeight="700" textAnchor="middle" fill="#92400e">
                qp = {result.unitEndBearingKpa.toFixed(0)} kPa (Qp = {result.endBearingKn.toFixed(0)} kN)
              </text>
            </g>

            {/* Right Summary Engineering Card with Tooltip */}
            <g
              transform="translate(530, 45)"
              {...bindHover({
                title: 'Deep Foundation Capacity & Vesic Settlement Summary',
                formula: 'Q_ult = Q_s + Q_p · Q_all = Q_ult / FS · S_total = S_s + S_b + S_bs + S_c',
                substitution: `Q_ult = ${result.ultimateCapacityKn.toFixed(0)} kN · Q_all = ${result.allowableCapacityKn.toFixed(0)} kN · Elastic Settlement = ${result.elasticSettlementMm.toFixed(1)} mm ≤ ${result.permissibleSettlementMm} mm`,
                codeRef: 'BNBC 2020 Part 6 Chapter 3 Deep Foundations',
                description: 'Comprehensive design verification covering ultimate capacity, safety factors, and permissible settlement criteria.',
              })}
            >
              <title>Axial Capacity Schedule</title>
              <rect x={0} y={0} width={140} height={295} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
              <text x={10} y={18} fontSize="9" fontWeight="700" fill="var(--md-sys-color-primary)">AXIAL CAPACITY (BNBC)</text>

              <text x={10} y={38} fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">Shaft Skin Friction (Qs):</text>
              <text x={10} y={52} fontSize="11" fontWeight="700" fill="#3b82f6">{result.skinFrictionKn.toFixed(0)} kN</text>

              <text x={10} y={72} fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">Base End Bearing (Qp):</text>
              <text x={10} y={86} fontSize="11" fontWeight="700" fill="#f59e0b">{result.endBearingKn.toFixed(0)} kN</text>

              <line x1={10} y1={96} x2={130} y2={96} stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.8" />

              <text x={10} y={110} fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">Ultimate Capacity (Q_ult):</text>
              <text x={10} y={124} fontSize="12" fontWeight="800" fill="var(--md-sys-color-on-surface)">{result.ultimateCapacityKn.toFixed(0)} kN</text>

              <text x={10} y={144} fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">Allowable (FS = {result.factorOfSafety}):</text>
              <text x={10} y={158} fontSize="12" fontWeight="800" fill="#10b981">{result.allowableCapacityKn.toFixed(0)} kN</text>

              <line x1={10} y1={168} x2={130} y2={168} stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.8" />

              <text x={10} y={182} fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">Geotechnical DCR:</text>
              <text x={10} y={196} fontSize="11" fontWeight="700" fill={result.utilizationRatio <= 1 ? '#10b981' : '#f43f5e'}>
                {(result.utilizationRatio * 100).toFixed(1)}% ({result.utilizationRatio <= 1 ? 'PASS' : 'FAIL'})
              </text>

              <text x={10} y={214} fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">Structural Shaft Cap:</text>
              <text x={10} y={228} fontSize="9" fontWeight="700" fill={result.structuralPass ? 'var(--md-sys-color-on-surface)' : '#f43f5e'}>
                {result.structuralCapacityKn.toFixed(0)} kN ({result.structuralPass ? 'PASS' : 'FAIL'})
              </text>

              <line x1={10} y1={238} x2={130} y2={238} stroke="var(--md-sys-color-outline-variant)" strokeWidth="0.8" />

              <text x={10} y={252} fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">Est. Settlement (Vesic):</text>
              <text x={10} y={266} fontSize="10" fontWeight="700" fill={result.settlementPass ? 'var(--md-sys-color-primary)' : '#f43f5e'}>
                {result.elasticSettlementMm.toFixed(1)} mm ≤ {result.permissibleSettlementMm}mm
              </text>
              <text x={10} y={282} fontSize="7" fill="var(--md-sys-color-on-surface-variant)">
                Hover depth to inspect strata
              </text>
            </g>

            {/* Interactive Depth Crosshair and Value HUD */}
            {hoverDepth && (
              <g pointerEvents="none">
                <line
                  x1={30}
                  y1={hoverDepth.py}
                  x2={510}
                  y2={hoverDepth.py}
                  stroke="var(--md-sys-color-primary)"
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                />
                <circle cx={pileCenterX} cy={hoverDepth.py} r="4" fill="var(--md-sys-color-primary)" stroke="#fff" strokeWidth="1.5" />
                <g transform={`translate(${Math.min(350, pileCenterX + 35)}, ${Math.max(groundY + 10, hoverDepth.py - 24)})`}>
                  <rect x={0} y={0} width={150} height={48} rx={5} fill="var(--md-sys-color-surface)" stroke="var(--md-sys-color-primary)" strokeWidth="1.2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
                  <text x={8} y={13} fontSize="8.5" fontWeight="700" fill="var(--md-sys-color-primary)">
                    Depth z = {hoverDepth.z.toFixed(2)}m · {hoverDepth.layerName}
                  </text>
                  <text x={8} y={26} fontSize="8" fill="var(--md-sys-color-on-surface)">
                    Unit fs: <tspan fontWeight="700" fill="#3b82f6">{hoverDepth.fsKpa} kPa</tspan> · SPT N: <tspan fontWeight="700">{hoverDepth.sptN}</tspan>
                  </text>
                  <text x={8} y={38} fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">
                    Overburden σ'v: {hoverDepth.sigmaV0.toFixed(1)} kPa
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>
      )}
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* 14. Pipe Hydraulics Diagram (Hazen-Williams EGL & HGL Profile) */
export const PipeHydraulicsDiagramSvg: React.FC<{
  params: PipeHydraulicsParameters;
  result: PipeHydraulicsResult;
}> = ({ params, result }) => {
  const { containerRef, tooltip, bindHover } = useFormulaTooltip();
  const width = 680;
  const height = 330;

  if (params.internalDiameterMm <= 0 || params.lengthM <= 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <rect x={10} y={10} width={width - 20} height={height - 20} rx={8} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="4 4" />
        <text x={width / 2} y={height / 2 - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          ZERO PIPELINE CONDUIT GEOMETRY (D = 0 mm)
        </text>
        <text x={width / 2} y={height / 2 + 12} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
          Enter pipe diameter, length and flow rate to generate hydraulic grade line (HGL) and energy grade line (EGL)
        </text>
      </svg>
    );
  }

  const padLeft = 60;
  const padRight = 80;
  const plotW = width - padLeft - padRight;
  const inletY = 85;
  const outletY = 165;

  // Energy grade line (EGL) and Hydraulic grade line (HGL)
  const eglInletY = inletY - 45;
  const hglInletY = eglInletY + Math.max(8, Math.min(25, result.velocityHeadM * 18));
  const dropPx = Math.min(75, Math.max(15, (result.totalHeadLossM / Math.max(1, result.lengthM)) * 250 + 20));
  const eglOutletY = eglInletY + dropPx;
  const hglOutletY = eglOutletY + Math.max(8, Math.min(25, result.velocityHeadM * 18));

  const isTurbulent = result.flowRegime === 'Turbulent';
  const isTransitional = result.flowRegime === 'Transitional';
  const regimeColor = isTurbulent ? '#2563eb' : isTransitional ? '#f59e0b' : '#10b981';

  return (
    <div ref={containerRef} className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
        <defs>
          <marker id="pipeFlowArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0284c7" />
          </marker>
        </defs>

        <text x={12} y={22} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          PIPELINE ENERGY (EGL) &amp; HYDRAULIC GRADE LINE (HGL) PROFILE
        </text>

        {/* Reynolds Regime Badge with Tooltip */}
        <g
          transform={`translate(${width - 240}, 8)`}
          {...bindHover({
            title: 'Reynolds Number & Flow Regime Classification',
            formula: 'Re = (v × D) / ν · Laminar < 2000, Transitional 2000-4000, Turbulent > 4000',
            substitution: `Re = ${result.reynoldsNumber.toLocaleString()} (${result.flowRegime.toUpperCase()} FLOW) · ν = 1.004 × 10⁻⁶ m²/s @ 20°C`,
            codeRef: 'Fluid Mechanics / Moody Chart Regime Criterion',
            description: 'Ratio of inertial forces to viscous forces determining pipe friction loss characteristics.',
          })}
        >
          <title>Reynolds Flow Regime</title>
          <rect x={0} y={0} width={220} height={22} rx={4} fill={regimeColor} fillOpacity="0.12" stroke={regimeColor} strokeWidth="1" />
          <circle cx={12} cy={11} r={3.5} fill={regimeColor} />
          <text x={22} y={14} fontSize="8.5" fontWeight="700" fill={regimeColor}>
            Re = {result.reynoldsNumber.toLocaleString()} ({result.flowRegime.toUpperCase()})
          </text>
        </g>

        {/* Energy Grade Line (EGL) with Tooltip */}
        <g
          {...bindHover({
            title: 'Total Energy Grade Line (EGL Formulation)',
            formula: 'EGL = z + P/γ + v²/(2g) · EGL_in - EGL_out = Total Head Loss (h_L)',
            substitution: `EGL_in = ${result.inletTotalHeadM.toFixed(2)}m · EGL_out = ${result.outletTotalHeadM.toFixed(2)}m · Total Head Loss = ${result.totalHeadLossM.toFixed(2)}m`,
            codeRef: 'Bernoulli Equation with Viscous Energy Dissipation',
            description: 'Total mechanical energy per unit weight of fluid flowing from upstream to downstream.',
          })}
        >
          <title>Energy Grade Line (EGL)</title>
          <line x1={padLeft} y1={eglInletY} x2={padLeft + plotW} y2={eglOutletY} stroke="#e11d48" strokeWidth="2" strokeDasharray="5 2" />
          <text x={padLeft + 5} y={eglInletY - 6} fontSize="8" fontWeight="700" fill="#e11d48">
            EGL In ({result.inletTotalHeadM} m)
          </text>
          <text x={padLeft + plotW - 85} y={eglOutletY - 6} fontSize="8" fontWeight="700" fill="#e11d48">
            EGL Out ({result.outletTotalHeadM} m)
          </text>
        </g>

        {/* Hydraulic Grade Line (HGL) with Tooltip */}
        <g
          {...bindHover({
            title: 'Hydraulic Grade Line (HGL Formulation)',
            formula: 'HGL = z + P/γ = EGL - v²/(2g) · Hydraulic Gradient S_f = h_f / L',
            substitution: `Velocity Head v²/2g = ${result.velocityHeadM.toFixed(3)}m · Piezometric Slope Sf = ${(result.frictionSlopeMPerM * 1000).toFixed(1)} m/km`,
            codeRef: 'Hazen-Williams / Darcy-Weisbach Hydraulic Gradient',
            description: 'Piezometric pressure head line indicating liquid elevation in a vertical manometer tube.',
          })}
        >
          <title>Hydraulic Grade Line (HGL)</title>
          <line x1={padLeft} y1={hglInletY} x2={padLeft + plotW} y2={hglOutletY} stroke="#0284c7" strokeWidth="2.5" />
          <text x={padLeft + 5} y={hglInletY + 14} fontSize="8" fontWeight="700" fill="#0284c7">
            HGL (Sf = {(result.frictionSlopeMPerM * 1000).toFixed(1)} m/km)
          </text>
        </g>

        {/* Pipe Profile with Crown, Invert and Flow Velocity Vector */}
        <g
          {...bindHover({
            title: 'Pipeline Flow Velocity & Discharge Formulation',
            formula: 'v = 4Q / (π·D²) · Hazen-Williams h_f = 10.67 × (Q/C)^1.852 × D^-4.87 × L',
            substitution: `v = ${result.velocityMps.toFixed(2)} m/s · Q = ${params.flowRateLps} L/s · C = ${result.hazenWilliamsC} · Internal D = ${params.internalDiameterMm} mm`,
            codeRef: 'AWWA / BNBC 2020 Part 8 Building Services / Water Supply',
            description: 'Mean conduit velocity and head loss governed by Hazen-Williams roughness coefficient C.',
          })}
        >
          <title>Pipe Conduit & Flow Velocity</title>
          <line x1={padLeft} y1={inletY + 55} x2={padLeft + plotW} y2={outletY + 55} stroke="#475569" strokeWidth="18" strokeLinecap="round" />
          <line x1={padLeft} y1={inletY + 55} x2={padLeft + plotW} y2={outletY + 55} stroke="#38bdf8" strokeWidth="12" strokeLinecap="round" />

          {/* Velocity Vector & Direction */}
          <line
            x1={padLeft + plotW / 2 - 35}
            y1={inletY + 55 + (outletY - inletY) / 2}
            x2={padLeft + plotW / 2 + 35}
            y2={inletY + 55 + (outletY - inletY) / 2}
            stroke="#0284c7"
            strokeWidth="3"
            markerEnd="url(#pipeFlowArrow)"
          />
          <text
            x={padLeft + plotW / 2}
            y={inletY + 45 + (outletY - inletY) / 2}
            fontSize="9"
            fontWeight="800"
            textAnchor="middle"
            fill="#0f172a"
          >
            V = {result.velocityMps} m/s (C = {result.hazenWilliamsC})
          </text>
        </g>

        {/* Cavitation / Syphon Warning in Diagram */}
        {result.cavitationWarning && (
          <g
            transform={`translate(${padLeft + plotW / 2 - 60}, ${inletY + 15})`}
            {...bindHover({
              title: 'Sub-Atmospheric Syphon / Cavitation Hazard',
              formula: 'P_abs < P_vapor ≈ 2.34 kPa (abs) @ 20°C',
              substitution: `Conduit profile rises above hydraulic grade line causing negative gauge pressure`,
              codeRef: 'Fluid Mechanics Cavitation Criterion',
              description: 'Vapor pockets collapse violently downstream causing pitting damage and flow chokage.',
            })}
          >
            <title>Syphon Cavitation Warning</title>
            <rect x={0} y={0} width={120} height={18} rx={4} fill="#dc2626" opacity="0.95" />
            <text x={60} y={12} textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#ffffff">
              ⚠ SUB-ATMOSPHERIC SYPHON
            </text>
          </g>
        )}

        {/* Inlet & Outlet Elevation Callouts */}
        <text x={padLeft} y={inletY + 95} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
          Inlet: {params.inletElevationM}m · Pin = {result.inletPressureKpa} kPa
        </text>
        <text x={padLeft + plotW - 120} y={outletY + 95} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
          Outlet: {params.outletElevationM}m · Pout = {result.outletPressureKpa} kPa
        </text>

        {/* Head Loss Dimension Bar with Tooltip */}
        <g
          transform={`translate(${padLeft + plotW + 15}, ${eglInletY})`}
          {...bindHover({
            title: 'Frictional Head Loss Dissipation (h_f)',
            formula: 'h_f = S_f × L · Darcy-Weisbach h_f = f × (L/D) × (v² / 2g)',
            substitution: `h_f = ${result.frictionHeadLossM.toFixed(2)} m friction head drop across ${params.lengthM} m length`,
            codeRef: 'Hazen-Williams Head Loss Equation',
            description: 'Irreversible pressure head loss caused by boundary layer viscous shear against pipe interior.',
          })}
        >
          <title>Frictional Head Loss</title>
          <line x1={0} y1={0} x2={0} y2={eglOutletY - eglInletY} stroke="#f43f5e" strokeWidth="1.5" />
          <line x1={-4} y1={0} x2={4} y2={0} stroke="#f43f5e" strokeWidth="1.5" />
          <line x1={-4} y1={eglOutletY - eglInletY} x2={4} y2={eglOutletY - eglInletY} stroke="#f43f5e" strokeWidth="1.5" />
          <text x={8} y={(eglOutletY - eglInletY) / 2 + 4} fontSize="8.5" fontWeight="700" fill="#f43f5e">
            h_f = {result.frictionHeadLossM}m
          </text>
        </g>

        {/* Velocity Status Indicators with Tooltips */}
        <g
          transform="translate(60, 265)"
          {...bindHover({
            title: 'Conduit Self-Cleansing Velocity Limit State',
            formula: 'v ≥ 0.60 m/s (Non-silting / Self-cleansing) · v ≤ 2.50 m/s (Non-scouring / Anti-hammer)',
            substitution: `Actual v = ${result.velocityMps.toFixed(2)} m/s (${result.selfCleansingStatus === 'pass' ? 'PASS: Adequate Self-Cleansing' : 'WARNING: Blockage / Siltation Risk'})`,
            codeRef: 'BNBC 2020 Water & Sewerage Design Standard',
            description: 'Ensures suspended solids remain mobilized to prevent sediment accumulation without conduit erosion.',
          })}
        >
          <title>Self-Cleansing Velocity</title>
          <rect x={0} y={0} width={260} height={45} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
          <text x={12} y={16} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Self-Cleansing Velocity Check (&ge; 0.6 m/s):</text>
          <text x={12} y={32} fontSize="9.5" fontWeight="700" fill={result.selfCleansingStatus === 'pass' ? '#10b981' : '#f59e0b'}>
            {result.selfCleansingStatus === 'pass' ? '✓ PASS: Adequate Self-Cleansing' : '⚠ WARNING: Siltation / Blockage Risk'}
          </text>
        </g>

        <g
          transform="translate(340, 265)"
          {...bindHover({
            title: 'Optimal Commercial Pipe Diameter Sizing',
            formula: 'D_econ ≈ k × √(Q) · Economical Velocity Range 1.0 m/s - 1.8 m/s',
            substitution: `Recommended Commercial Bore: DN ${result.sizingRecommendation?.recommendedDn || result.internalDiameterMm} mm`,
            codeRef: 'AWWA / BNBC 2020 Standard Commercial Pipe Schedules',
            description: 'Standard nominal diameter balancing capital pipe cost against lifecycle pump energy consumption.',
          })}
        >
          <title>Commercial Sizing Recommendation</title>
          <rect x={0} y={0} width={260} height={45} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
          <text x={12} y={16} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Commercial Sizing Solution:</text>
          <text x={12} y={32} fontSize="9.5" fontWeight="700" fill="#2563eb">
            Recommended: DN {result.sizingRecommendation?.recommendedDn || result.internalDiameterMm} mm
          </text>
        </g>
      </svg>
      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* ==============================================================
   2D FRAME & TRUSS + P-DELTA INTERACTIVE CAD DIAGRAM
   ============================================================== */
export const FrameTruss2DDiagramSvg: React.FC<{
  params: FrameTruss2DParams;
  result: FrameTruss2DResult;
}> = ({ params, result }) => {
  const [overlayMode, setOverlayMode] = useState<'deformed' | 'bmd' | 'sfd' | 'afd'>('bmd');
  const [showDeformedGhost, setShowDeformedGhost] = useState(true);
  const [deformScale, setDeformScale] = useState(40);
  const { tooltip, containerRef, bindHover } = useFormulaTooltip();

  const svgW = 760;
  const svgH = 440;
  const padX = 95;
  const padTop = 64;
  const padBottom = 74;

  const nodes = params.nodes || [];
  const members = params.members || [];

  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, maxX: 6, minY: 0, maxY: 4, scale: 50, offsetX: padX, offsetY: svgH - padBottom };
    }
    const xs = nodes.map((n) => n.xM);
    const ys = nodes.map((n) => n.yM);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(1e-3, maxX - minX);
    const spanY = Math.max(1e-3, maxY - minY);
    const availW = svgW - padX * 2;
    const availH = svgH - padTop - padBottom;
    const scale = Math.min(availW / spanX, availH / spanY);
    const drawnW = spanX * scale;
    const drawnH = spanY * scale;
    const offsetX = padX + (availW - drawnW) / 2;
    const offsetY = padTop + (availH - drawnH) / 2 + drawnH;
    return { minX, maxX, minY, maxY, scale, offsetX, offsetY };
  }, [nodes]);

  const toSvg = (xM: number, yM: number) => ({
    x: bounds.offsetX + (xM - bounds.minX) * bounds.scale,
    y: bounds.offsetY - (yM - bounds.minY) * bounds.scale,
  });

  // Auto-normalize displacement visual exaggeration so max displacement is visibly clear yet bounded
  const autoDispScalePxPerM = useMemo(() => {
    const maxDispM = Math.max(result.maxDisplacementMm / 1000, 1e-6);
    const targetMaxPx = (deformScale / 100) * 65;
    return targetMaxPx / maxDispM;
  }, [result.maxDisplacementMm, deformScale]);

  // Scale factor for BMD / SFD / AFD perpendicular plots
  const diagramMaxPx = 42;
  const maxValForMode = useMemo(() => {
    if (overlayMode === 'bmd') return Math.max(result.maxAbsMomentKnm, 1e-4);
    if (overlayMode === 'sfd') return Math.max(result.maxAbsShearKn, 1e-4);
    if (overlayMode === 'afd') return Math.max(result.maxAbsAxialKn, 1e-4);
    return 1;
  }, [overlayMode, result]);

  const nodeById = useMemo(() => {
    const map = new Map<string, (typeof result.nodalResults)[0]>();
    result.nodalResults.forEach((nr) => map.set(nr.nodeId, nr));
    return map;
  }, [result.nodalResults]);

  return (
    <div ref={containerRef} className="relative space-y-2.5">
      {/* Interactive Overlay Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div
          role="radiogroup"
          aria-label="2D Frame diagram overlay"
          className="inline-flex items-center p-0.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[11px] font-mono"
        >
          {[
            { id: 'bmd' as const, label: 'BMD (M)' },
            { id: 'sfd' as const, label: 'SFD (V)' },
            { id: 'afd' as const, label: 'AFD (N)' },
            { id: 'deformed' as const, label: 'Deformed Only' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="radio"
              aria-checked={overlayMode === tab.id}
              onClick={() => setOverlayMode(tab.id)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                overlayMode === tab.id
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          {overlayMode !== 'deformed' && (
            <label className="flex items-center gap-1.5 cursor-pointer text-[var(--md-sys-color-on-surface-variant)]">
              <input
                type="checkbox"
                checked={showDeformedGhost}
                onChange={(e) => setShowDeformedGhost(e.target.checked)}
              />
              <span>Deformed Shape</span>
            </label>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--md-sys-color-on-surface-variant)]">Δ Scale:</span>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={deformScale}
              onChange={(e) => setDeformScale(Number(e.target.value))}
              aria-label="Deformation visual magnification scale"
              className="w-20 accent-[var(--md-sys-color-primary)] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main CAD Viewport */}
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full h-auto rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"
        role="img"
        aria-label={`2D Frame and Truss Structural Diagram (${overlayMode.toUpperCase()})`}
      >
        <defs>
          <pattern id="ft-grid-minor" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="var(--md-sys-color-outline-variant)"
              strokeWidth="0.4"
              strokeOpacity="0.35"
            />
          </pattern>
          <pattern id="ft-fixed-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--md-sys-color-on-surface-variant)" strokeWidth="1.5" />
          </pattern>
        </defs>

        <rect x={0} y={0} width={svgW} height={svgH} fill="url(#ft-grid-minor)" />

        {/* Header Status Strip inside SVG */}
        <g transform="translate(14, 20)">
          <text x={0} y={0} fontSize="10" fontWeight="700" fontFamily="monospace" fill="var(--md-sys-color-on-surface)">
            {result.analysisMode === 'second-order-p-delta'
              ? `2ND-ORDER P-Δ ([K_E + K_G]) · α_cr = ${Number.isFinite(result.criticalBucklingFactorAlphaCr) ? result.criticalBucklingFactorAlphaCr.toFixed(2) : '∞'}`
              : '1ST-ORDER LINEAR ([K_E])'}
          </text>
          <text x={0} y={14} fontSize="9" fontFamily="monospace" fill="var(--md-sys-color-on-surface-variant)">
            {overlayMode === 'bmd' && `BMD Peak |M| = ${result.maxAbsMomentKnm.toFixed(2)} kN·m`}
            {overlayMode === 'sfd' && `SFD Peak |V| = ${result.maxAbsShearKn.toFixed(2)} kN`}
            {overlayMode === 'afd' && `AFD Peak |N| = ${result.maxAbsAxialKn.toFixed(2)} kN (Cyan = Tension +, Rose = Compression -)`}
            {overlayMode === 'deformed' && `Peak Δ = ${result.maxDisplacementMm.toFixed(2)} mm @ ${result.maxDisplacementNodeLabel}`}
          </text>
        </g>

        {/* 1. Undeformed Structural Wireframe + Member Loads */}
        {result.memberResults.map((mr) => {
          const mSpec = members.find((m) => m.id === mr.memberId);
          const n1 = nodeById.get(mr.startNodeId);
          const n2 = nodeById.get(mr.endNodeId);
          if (!n1 || !n2) return null;
          const p1 = toSvg(n1.xM, n1.yM);
          const p2 = toSvg(n2.xM, n2.yM);
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          // Unit outward normal in SVG space perpendicular to member axis (local +y' direction)
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const lenPx = Math.hypot(dx, dy) || 1;
          // Local +y' in world is (-sin, cos) -> in SVG (y down) is (-dy/lenPx_y_flipped) -> wait:
          // World (cos, sin) -> SVG (dx, dy) with dy = -sin*L*scale.
          // World local +y' = (-sin, cos) -> SVG (-(-dy)/len, -dx/len) wait: x'=(dx,-dy), y'=(dy,dx) in world, in SVG (-dy_world...):
          // Let's compute directly from world angle!
          const angleRad = (mr.angleDeg * Math.PI) / 180;
          const c = Math.cos(angleRad);
          const s = Math.sin(angleRad);
          // World +y' vector = (-s, c). In SVG pixels (x right, y down), direction is (-s, -c).
          const nySvgX = -s;
          const nySvgY = -c;

          // Internal Force Diagram Polygon (BMD / SFD / AFD)
          let diagPolyPoints = '';
          let diagStrokeColor = 'var(--md-sys-color-primary)';
          let diagFillColor = 'rgba(37, 99, 235, 0.16)';

          if (overlayMode !== 'deformed') {
            const ptsUpper: string[] = [];
            const ptsBase: string[] = [];
            const valFor = (st: (typeof mr.stations)[0]) =>
              overlayMode === 'bmd'
                ? st.bendingMomentKnm
                : overlayMode === 'sfd'
                  ? st.shearForceKn
                  : st.axialForceKn;

            if (overlayMode === 'sfd') {
              diagStrokeColor = '#0ea5e9';
              diagFillColor = 'rgba(14, 165, 233, 0.18)';
            } else if (overlayMode === 'bmd') {
              diagStrokeColor = '#6366f1';
              diagFillColor = 'rgba(99, 102, 241, 0.18)';
            } else if (overlayMode === 'afd') {
              const isTension = mr.axialStartKn >= 0;
              diagStrokeColor = isTension ? '#06b6d4' : '#f43f5e';
              diagFillColor = isTension ? 'rgba(6, 182, 212, 0.20)' : 'rgba(244, 63, 94, 0.20)';
            }

            mr.stations.forEach((st) => {
              const base = toSvg(st.xGlobalM, st.yGlobalM);
              const val = valFor(st);
              // Plot BMD on tension face (positive sagging opposite local +y'), SFD & AFD along +y'
              const signDir = overlayMode === 'bmd' ? -1 : 1;
              const offsetPx = (val / maxValForMode) * diagramMaxPx * signDir;
              ptsUpper.push(`${(base.x + nySvgX * offsetPx).toFixed(1)},${(base.y + nySvgY * offsetPx).toFixed(1)}`);
              ptsBase.unshift(`${base.x.toFixed(1)},${base.y.toFixed(1)}`);
            });
            diagPolyPoints = [...ptsUpper, ...ptsBase].join(' ');
          }

          // Deformed member curve coordinates
          const deformedPathD = mr.stations
            .map((st, sIdx) => {
              const base = toSvg(st.xGlobalM, st.yGlobalM);
              const sx = base.x + (st.uxGlobalMm / 1000) * autoDispScalePxPerM;
              const sy = base.y - (st.uyGlobalMm / 1000) * autoDispScalePxPerM;
              return `${sIdx === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
            })
            .join(' ');

          // Member UDL arrow visualization (local -y' direction = SVG (-nySvgX, -nySvgY))
          const udlArrows =
            mSpec && Math.abs(mSpec.udlKnPerM) > 1e-3
              ? [0.15, 0.32, 0.5, 0.68, 0.85].map((r) => {
                  const bx = p1.x + dx * r;
                  const by = p1.y + dy * r;
                  const tipX = bx + nySvgX * 4;
                  const tipY = by + nySvgY * 4;
                  const tailX = bx + nySvgX * 22;
                  const tailY = by + nySvgY * 22;
                  return { tipX, tipY, tailX, tailY };
                })
              : [];

          return (
            <g
              key={mr.memberId}
              {...bindHover({
                title: `Member ${mr.label} (${mr.startLabel} → ${mr.endLabel})`,
                formula: `L = ${mr.lengthM.toFixed(2)} m · ${mr.memberType.toUpperCase()}`,
                substitution: `N = ${mr.axialStartKn.toFixed(1)} kN (${mr.axialStartKn >= 0 ? 'Tension' : 'Compression'}) · |V|_max = ${mr.maxAbsShearKn.toFixed(1)} kN · |M|_max = ${mr.maxAbsMomentKnm.toFixed(1)} kN·m`,
                codeRef: `${result.governingCode} Member Envelope`,
                description: `Combined Stress σ = ${mr.combinedStressMpa.toFixed(1)} MPa (DCR ${(mr.dcrRatio * 100).toFixed(1)}%).`,
              })}
            >
              {/* Force Diagram Fill */}
              {overlayMode !== 'deformed' && diagPolyPoints && (
                <polygon
                  points={diagPolyPoints}
                  fill={diagFillColor}
                  stroke={diagStrokeColor}
                  strokeWidth="1.5"
                />
              )}

              {/* Undeformed Reference Wireframe */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="var(--md-sys-color-on-surface)"
                strokeWidth={overlayMode === 'deformed' ? '1.5' : '2.6'}
                strokeDasharray={overlayMode === 'deformed' ? '4 3' : undefined}
                strokeOpacity={overlayMode === 'deformed' ? 0.5 : 0.9}
              />

              {/* Curved Deformed Shape Overlay */}
              {(overlayMode === 'deformed' || showDeformedGhost) && (
                <path
                  d={deformedPathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={overlayMode === 'deformed' ? '2.6' : '1.7'}
                  strokeDasharray={overlayMode === 'deformed' ? undefined : '5 3'}
                />
              )}

              {/* Member UDL Arrows */}
              {udlArrows.length > 0 && (
                <g opacity={0.85}>
                  <line
                    x1={udlArrows[0].tailX}
                    y1={udlArrows[0].tailY}
                    x2={udlArrows[udlArrows.length - 1].tailX}
                    y2={udlArrows[udlArrows.length - 1].tailY}
                    stroke="#f59e0b"
                    strokeWidth="1.4"
                  />
                  {udlArrows.map((arr, aIdx) => (
                    <g key={aIdx}>
                      <line
                        x1={arr.tailX}
                        y1={arr.tailY}
                        x2={arr.tipX}
                        y2={arr.tipY}
                        stroke="#f59e0b"
                        strokeWidth="1.3"
                      />
                      <circle cx={arr.tipX} cy={arr.tipY} r="1.5" fill="#f59e0b" />
                    </g>
                  ))}
                  <text
                    x={(udlArrows[0].tailX + udlArrows[udlArrows.length - 1].tailX) / 2}
                    y={(udlArrows[0].tailY + udlArrows[udlArrows.length - 1].tailY) / 2 - 5}
                    fontSize="8"
                    fontWeight="700"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fill="#d97706"
                  >
                    w={mSpec?.udlKnPerM} kN/m
                  </text>
                </g>
              )}

              {/* Internal Hinges (Open Circles) */}
              {mSpec && (mSpec.startHinge || mSpec.memberType === 'truss') && (
                <circle
                  cx={p1.x + (dx / lenPx) * 8}
                  cy={p1.y + (dy / lenPx) * 8}
                  r="3.6"
                  fill="var(--md-sys-color-surface)"
                  stroke="var(--md-sys-color-on-surface)"
                  strokeWidth="1.6"
                />
              )}
              {mSpec && (mSpec.endHinge || mSpec.memberType === 'truss') && (
                <circle
                  cx={p2.x - (dx / lenPx) * 8}
                  cy={p2.y - (dy / lenPx) * 8}
                  r="3.6"
                  fill="var(--md-sys-color-surface)"
                  stroke="var(--md-sys-color-on-surface)"
                  strokeWidth="1.6"
                />
              )}

              {/* Member Label + Peak Diagram Value Callout */}
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x={-20}
                  y={-8}
                  width={40}
                  height={14}
                  rx="3"
                  fill="var(--md-sys-color-surface)"
                  stroke="var(--md-sys-color-outline-variant)"
                  strokeWidth="0.8"
                />
                <text
                  x={0}
                  y={2}
                  fontSize="8"
                  fontWeight="700"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fill="var(--md-sys-color-on-surface)"
                >
                  {mr.label}
                </text>
              </g>
            </g>
          );
        })}

        {/* 2. Support Boundary Symbols, Nodal Loads & Deformed Joints */}
        {result.nodalResults.map((nr) => {
          const p = toSvg(nr.xM, nr.yM);
          const load = (params.nodalLoads || []).find((l) => l.nodeId === nr.nodeId);
          const rxLabel =
            nr.support !== 'none'
              ? `R=(${nr.reactionFxKn.toFixed(1)}, ${nr.reactionFyKn.toFixed(1)}) kN`
              : `Δ=(${nr.uxMm.toFixed(1)}, ${nr.uyMm.toFixed(1)}) mm`;

          return (
            <g
              key={nr.nodeId}
              {...bindHover({
                title: `Joint ${nr.label} (${nr.xM.toFixed(2)}m, ${nr.yM.toFixed(2)}m)`,
                formula: `Support: ${nr.support.toUpperCase()} · |Δ| = ${nr.displacementMagMm.toFixed(2)} mm`,
                substitution: rxLabel,
                codeRef: `${result.governingCode} Nodal DOF Response`,
                description: `u_x = ${nr.uxMm.toFixed(2)} mm, u_y = ${nr.uyMm.toFixed(2)} mm, θ_z = ${nr.rzMrad.toFixed(2)} mrad.`,
              })}
            >
              {/* Support Glyphs */}
              {nr.support === 'fixed' && (
                <g transform={`translate(${p.x}, ${p.y})`}>
                  <rect x={-12} y={0} width={24} height={9} fill="url(#ft-fixed-hatch)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.3" />
                  <line x1={-14} y1={0} x2={14} y2={0} stroke="var(--md-sys-color-on-surface)" strokeWidth="2.2" />
                </g>
              )}
              {nr.support === 'pin' && (
                <g transform={`translate(${p.x}, ${p.y})`}>
                  <polygon points="0,0 -9,13 9,13" fill="var(--md-sys-color-surface-container-highest)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.5" />
                  <line x1={-12} y1={14} x2={12} y2={14} stroke="var(--md-sys-color-on-surface)" strokeWidth="1.5" />
                </g>
              )}
              {nr.support === 'roller-x' && (
                <g transform={`translate(${p.x}, ${p.y})`}>
                  <polygon points="0,0 -8,11 8,11" fill="var(--md-sys-color-surface-container-highest)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.4" />
                  <circle cx={-4.5} cy={14} r="2.2" fill="var(--md-sys-color-on-surface)" />
                  <circle cx={4.5} cy={14} r="2.2" fill="var(--md-sys-color-on-surface)" />
                  <line x1={-12} y1={17} x2={12} y2={17} stroke="var(--md-sys-color-on-surface)" strokeWidth="1.4" />
                </g>
              )}
              {nr.support === 'roller-y' && (
                <g transform={`translate(${p.x}, ${p.y})`}>
                  <polygon points="0,0 -11,-7 -11,7" fill="var(--md-sys-color-surface-container-highest)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.4" />
                  <circle cx={-14} cy={-4} r="2.1" fill="var(--md-sys-color-on-surface)" />
                  <circle cx={-14} cy={4} r="2.1" fill="var(--md-sys-color-on-surface)" />
                  <line x1={-17} y1={-11} x2={-17} y2={11} stroke="var(--md-sys-color-on-surface)" strokeWidth="1.4" />
                </g>
              )}
              {nr.support === 'spring' && (
                <g transform={`translate(${p.x}, ${p.y})`}>
                  <polyline
                    points="0,0 0,4 -5,7 5,11 -5,15 5,19 0,22 0,25"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="1.8"
                  />
                  <line x1={-10} y1={25} x2={10} y2={25} stroke="#14b8a6" strokeWidth="1.6" />
                </g>
              )}

              {/* Nodal Load Force Vectors */}
              {load && Math.abs(load.fxKn) > 1e-3 && (
                <g>
                  {(() => {
                    const dir = load.fxKn > 0 ? 1 : -1;
                    return (
                      <>
                        <line x1={p.x - dir * 34} y1={p.y} x2={p.x - dir * 7} y2={p.y} stroke="#f43f5e" strokeWidth="2.2" />
                        <polygon
                          points={`${p.x - dir * 5},${p.y} ${p.x - dir * 13},${p.y - 4} ${p.x - dir * 13},${p.y + 4}`}
                          fill="#f43f5e"
                        />
                        <text x={p.x - dir * 36} y={p.y - 6} fontSize="8" fontWeight="700" fontFamily="monospace" textAnchor={dir > 0 ? 'end' : 'start'} fill="#f43f5e">
                          Fx={load.fxKn}kN
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}
              {load && Math.abs(load.fyKn) > 1e-3 && (
                <g>
                  {(() => {
                    const down = load.fyKn < 0;
                    const yTail = down ? p.y - 34 : p.y + 34;
                    const yTip = down ? p.y - 6 : p.y + 6;
                    return (
                      <>
                        <line x1={p.x} y1={yTail} x2={p.x} y2={yTip} stroke="#f43f5e" strokeWidth="2.2" />
                        <polygon
                          points={`${p.x},${yTip} ${p.x - 4},${yTip + (down ? -8 : 8)} ${p.x + 4},${yTip + (down ? -8 : 8)}`}
                          fill="#f43f5e"
                        />
                        <text x={p.x + 6} y={yTail + (down ? 4 : -2)} fontSize="8" fontWeight="700" fontFamily="monospace" fill="#f43f5e">
                          Fy={load.fyKn}kN
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* Joint Dot & Label */}
              <circle cx={p.x} cy={p.y} r="4.2" fill="var(--md-sys-color-primary)" stroke="var(--md-sys-color-surface)" strokeWidth="1.3" />
              <text
                x={p.x + 7}
                y={p.y - 6}
                fontSize="8.5"
                fontWeight="700"
                fontFamily="monospace"
                fill="var(--md-sys-color-on-surface)"
              >
                {nr.label}
              </text>
              {nr.support !== 'none' && (
                <text
                  x={p.x}
                  y={p.y + 32}
                  fontSize="7.5"
                  fontWeight="700"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fill="var(--md-sys-color-primary)"
                >
                  R=({nr.reactionFxKn.toFixed(1)}, {nr.reactionFyKn.toFixed(1)})
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* ==============================================================
   16. SECTION ANALYZER: CROSS-SECTION, STRESS PROFILE & N-M CHART
   ============================================================== */
export const SectionAnalyzerDiagramSvg: React.FC<{
  params: SectionAnalyzerParams;
  result: SectionAnalyzerResult;
}> = ({ params, result }) => {
  const { containerRef, tooltip, bindHover } = useFormulaTooltip();
  const [panelMode, setPanelMode] = useState<'dual' | 'stress' | 'nm'>('dual');
  const [showPlasticOverlay, setShowPlasticOverlay] = useState(true);
  const [interactionView, setInteractionView] = useState<'nm' | 'mymz'>('nm');

  const cls = result.classification;
  const plasticAllowed = cls.isPlasticAllowed;

  // Cross-section + Stress profiles coordinates (viewBox 0..680 x 0..310 for single or side-by-side)
  const svgWidth = panelMode === 'dual' ? 760 : 680;
  const svgHeight = 320;

  // Section bounding coordinates (centered at centroid (0,0))
  const secW = Math.max(1, result.yMaxMm - result.yMinMm);
  const secH = Math.max(1, result.zMaxMm - result.zMinMm);

  const secBox = panelMode === 'dual'
    ? { x: 24, y: 42, w: 120, h: 220 }
    : { x: 56, y: 42, w: 190, h: 220 };
  const scaleSec = Math.min(secBox.w / secW, secBox.h / secH);
  const secCx = secBox.x + secBox.w / 2;
  const secCy = secBox.y + secBox.h / 2;
  const secCenterYMid = (result.yMinMm + result.yMaxMm) / 2;
  const secCenterZMid = (result.zMinMm + result.zMaxMm) / 2;

  const mapSecX = (yRel: number) => secCx + (yRel - secCenterYMid) * scaleSec;
  const mapSecY = (zRel: number) => secCy - (zRel - secCenterZMid) * scaleSec; // +z up -> SVG y down

  const zTopPx = mapSecY(result.zMaxMm);
  const zBotPx = mapSecY(result.zMinMm);
  const zCentroidPx = mapSecY(0);
  const zPnaPx = mapSecY(result.plasticNeutralAxisZMm);
  const zEnaZeroPx =
    result.elasticNeutralAxisZMm !== null
      ? Math.max(zTopPx - 14, Math.min(zBotPx + 14, mapSecY(result.elasticNeutralAxisZMm)))
      : null;

  // Sigma stress plot region
  const sigmaBox = panelMode === 'dual'
    ? { x: 168, y: 42, w: 105, h: 220 }
    : { x: 288, y: 42, w: 165, h: 220 };
  const sigmaCenterX = sigmaBox.x + sigmaBox.w / 2;
  const maxSigmaScale = Math.max(
    result.fydMpa * 1.15,
    result.sigmaAbsMaxMpa * 1.15,
    25
  );
  const mapSigmaX = (sigMpa: number) =>
    sigmaCenterX + (sigMpa / maxSigmaScale) * (sigmaBox.w * 0.44);

  // Tau shear stress plot region
  const tauBox = panelMode === 'dual'
    ? { x: 292, y: 42, w: 72, h: 220 }
    : { x: 492, y: 42, w: 135, h: 220 };
  const maxTauScale = Math.max(result.tauMaxShearZMpa * 1.2, 10);
  const mapTauX = (tauMpa: number) =>
    tauBox.x + 8 + (tauMpa / maxTauScale) * (tauBox.w - 16);

  // Build sigma polygon path & tau polygon path synchronized with mapSecY(zRel)
  const elasticSigmaPts = [
    `${sigmaCenterX},${mapSecY(result.zMaxMm)}`,
    ...result.stressProfile.map((sp) => `${mapSigmaX(sp.sigmaTotalMpa)},${mapSecY(sp.zMm)}`),
    `${sigmaCenterX},${mapSecY(result.zMinMm)}`,
  ].join(' ');

  const tauPts = [
    `${tauBox.x + 8},${mapSecY(result.zMaxMm)}`,
    ...result.stressProfile.map((sp) => `${mapTauX(sp.tauShearZMpa)},${mapSecY(sp.zMm)}`),
    `${tauBox.x + 8},${mapSecY(result.zMinMm)}`,
  ].join(' ');

  // N-M / My-Mz Chart region
  const chartBox = panelMode === 'dual'
    ? { x: 405, y: 42, w: 325, h: 220 }
    : { x: 105, y: 42, w: 470, h: 220 };

  const nmCx = chartBox.x + 48; // M=0 on left vertical axis (symmetric +|M| rightwards, N from -1 to +1)
  const nmPlotW = chartBox.w - 68;
  const nmCy = chartBox.y + chartBox.h / 2;
  const nmHalfH = chartBox.h * 0.44;
  const maxMRatioAxis = Math.max(
    1.18,
    ...result.nmInteractionCurve.map((p) => p.mRatio),
    result.mPlYRdKnm > 1e-6 ? Math.abs(result.momentMy_Knm) / result.mPlYRdKnm + 0.12 : 1.18
  );
  const maxNRatioAxis = Math.max(
    1.15,
    result.nPlRdKn > 1e-6 ? Math.abs(result.axialForceN_Kn) / result.nPlRdKn + 0.12 : 1.15
  );

  const mapNmX = (mRatio: number) => nmCx + (Math.max(0, mRatio) / maxMRatioAxis) * nmPlotW;
  const mapNmY = (nRatio: number) => nmCy - (nRatio / maxNRatioAxis) * nmHalfH;

  const plasticNmPath = result.nmInteractionCurve
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapNmX(pt.mRatio).toFixed(1)} ${mapNmY(pt.nRatio).toFixed(1)}`)
    .join(' ');

  const elasticNmPath = result.nmInteractionCurve
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapNmX(pt.elasticMRatio || 0).toFixed(1)} ${mapNmY(pt.nRatio).toFixed(1)}`)
    .join(' ');

  const loadMRatio = result.mPlYRdKnm > 1e-6 ? Math.abs(result.momentMy_Knm) / result.mPlYRdKnm : 0;
  const loadNRatio = result.nPlRdKn > 1e-6 ? result.axialForceN_Kn / result.nPlRdKn : 0;
  const loadPtPx = { x: mapNmX(loadMRatio), y: mapNmY(loadNRatio) };

  // My-Mz Biaxial coordinates
  const biaxOriginX = chartBox.x + 52;
  const biaxOriginY = chartBox.y + chartBox.h - 22;
  const biaxW = chartBox.w - 75;
  const biaxH = chartBox.h - 42;
  const loadMyRatio = result.mNyReducedRdKnm > 1e-6 ? Math.abs(result.momentMy_Knm) / result.mNyReducedRdKnm : 0;
  const loadMzRatio = result.mPlZRdKnm > 1e-6 ? Math.abs(result.momentMz_Knm) / result.mPlZRdKnm : 0;
  const biaxMaxAxis = Math.max(1.2, loadMyRatio + 0.12, loadMzRatio + 0.12);
  const mapBiaxX = (myR: number) => biaxOriginX + (myR / biaxMaxAxis) * biaxW;
  const mapBiaxY = (mzR: number) => biaxOriginY - (mzR / biaxMaxAxis) * biaxH;

  const biaxPath =
    result.myMzInteractionCurve
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapBiaxX(pt.myRatio).toFixed(1)} ${mapBiaxY(pt.mzRatio).toFixed(1)}`)
      .join(' ') +
    ` L ${mapBiaxX(0).toFixed(1)} ${mapBiaxY(0).toFixed(1)} Z`;

  return (
    <div ref={containerRef} className="relative w-full space-y-2.5">
      {/* Diagram Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="inline-flex items-center p-0.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[11px] font-mono">
          {([
            { id: 'dual', label: 'Side-by-Side' },
            { id: 'stress', label: 'Section & Stress (σ, τ)' },
            { id: 'nm', label: 'Interaction Chart' },
          ] as const).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPanelMode(m.id)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                panelMode === m.id
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-2xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          {panelMode !== 'nm' && plasticAllowed && (
            <button
              type="button"
              onClick={() => setShowPlasticOverlay((v) => !v)}
              className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                showPlasticOverlay
                  ? 'border-amber-500/70 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {showPlasticOverlay ? '✓ Plastic Yield Block' : 'Show Plastic Block'}
            </button>
          )}
          {panelMode !== 'stress' && (
            <div className="inline-flex items-center p-0.5 rounded-md bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
              <button
                type="button"
                onClick={() => setInteractionView('nm')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  interactionView === 'nm'
                    ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                N–M_y Curve
              </button>
              <button
                type="button"
                onClick={() => setInteractionView('mymz')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  interactionView === 'mymz'
                    ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                Biaxial M_y–M_z
              </button>
            </div>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto select-none font-mono"
        role="img"
        aria-label="Cross-section geometry, normal & shear stress distributions, and N-M interaction diagram"
      >
        <defs>
          <pattern id="steelHatchPattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--md-sys-color-primary)" strokeOpacity="0.22" strokeWidth="1.5" />
          </pattern>
        </defs>

        {/* ============================================================
            PANEL A: CROSS-SECTION + NORMAL STRESS (σ) + SHEAR STRESS (τ)
           ============================================================ */}
        {panelMode !== 'nm' && (
          <g>
            {/* Title */}
            <text x={secBox.x} y={20} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
              CROSS-SECTION &amp; ELASTIC / PLASTIC AXES
            </text>
            <text x={sigmaBox.x} y={20} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
              σ(z) NORMAL STRESS
            </text>
            <text x={tauBox.x} y={20} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
              τ(z) SHEAR
            </text>

            {/* Cross-Section Outer Polygons */}
            <g
              {...bindHover({
                title: `${result.presetName} · Geometric Properties`,
                formula: 'I_y = Σ(I_0 + A·d²),  W_el = I_y / |z_max|,  W_pl = ∫|z − z_EAA| dA',
                substitution: `A = ${result.areaCm2.toFixed(1)} cm², I_y = ${result.iyCm4.toFixed(0)} cm⁴, W_pl,y = ${result.wplYCm3.toFixed(0)} cm³`,
                codeRef: `${result.designCode} · ${cls.classLabel}`,
                description: `Section centroid at (${result.centroidYMm.toFixed(1)}, ${result.centroidZMm.toFixed(1)}) mm from bottom-left.`,
              })}
            >
              {result.outlinePolygons.map((poly, idx) => (
                <polygon
                  key={`sec-out-${idx}`}
                  points={poly.map((p) => `${mapSecX(p.yMm).toFixed(1)},${mapSecY(p.zMm).toFixed(1)}`).join(' ')}
                  fill="url(#steelHatchPattern)"
                  stroke="var(--md-sys-color-primary)"
                  strokeWidth="2"
                />
              ))}
              {result.holePolygons.map((poly, idx) => (
                <polygon
                  key={`sec-hole-${idx}`}
                  points={poly.map((p) => `${mapSecX(p.yMm).toFixed(1)},${mapSecY(p.zMm).toFixed(1)}`).join(' ')}
                  fill="var(--md-sys-color-surface-container-low)"
                  stroke="var(--md-sys-color-primary)"
                  strokeWidth="1.5"
                />
              ))}
            </g>

            {/* Centroid / Elastic Neutral Axis */}
            <line
              x1={secBox.x - 10}
              y1={zCentroidPx}
              x2={secBox.x + secBox.w + 10}
              y2={zCentroidPx}
              stroke="#0ea5e9"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <text x={secBox.x - 8} y={zCentroidPx - 4} fontSize="7.5" fontWeight="700" fill="#0ea5e9">
              ENA (z=0)
            </text>

            {/* Zero-stress line if shifted by Axial N */}
            {zEnaZeroPx !== null && Math.abs(zEnaZeroPx - zCentroidPx) > 3 && (
              <>
                <line
                  x1={secBox.x - 4}
                  y1={zEnaZeroPx}
                  x2={secBox.x + secBox.w + 4}
                  y2={zEnaZeroPx}
                  stroke="#06b6d4"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text x={secBox.x + secBox.w + 6} y={zEnaZeroPx + 3} fontSize="7" fill="#06b6d4">
                  σ=0
                </text>
              </>
            )}

            {/* Plastic Neutral Axis (PNA) when Class 1 or 2 */}
            {plasticAllowed && (
              <g
                {...bindHover({
                  title: 'Shifted Plastic Neutral Axis (PNA)',
                  formula: 'A_below(PNA) = 0.5 · (A − N / f_yd)',
                  substitution: `z_PNA = ${result.plasticNeutralAxisZMm >= 0 ? '+' : ''}${result.plasticNeutralAxisZMm.toFixed(1)} mm from centroid (${result.plasticNeutralAxisFromBottomMm.toFixed(1)} mm from bottom)`,
                  codeRef: `${result.designCode} Plastic Stress Block`,
                  description: 'Boundary separating +f_yd plastic tension block from -f_yd compression block under axial load N.',
                })}
              >
                <line
                  x1={secBox.x - 10}
                  y1={zPnaPx}
                  x2={secBox.x + secBox.w + 10}
                  y2={zPnaPx}
                  stroke="#f59e0b"
                  strokeWidth="1.8"
                  strokeDasharray="5 3"
                />
                <text x={secBox.x + secBox.w - 4} y={zPnaPx - 5} textAnchor="end" fontSize="7.5" fontWeight="700" fill="#d97706">
                  PNA ({result.plasticNeutralAxisZMm >= 0 ? '+' : ''}{result.plasticNeutralAxisZMm.toFixed(0)}mm)
                </text>
              </g>
            )}

            {/* Dimension labels */}
            <text x={secCx} y={zBotPx + 18} textAnchor="middle" fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
              b = {result.widthMm.toFixed(0)} × h = {result.depthMm.toFixed(0)} mm
            </text>

            {/* Normal Stress σ(z) Diagram */}
            <g
              {...bindHover({
                title: 'Combined Elastic Normal Stress σ(z)',
                formula: 'σ(y,z) = N/A + (M_y·z)/I_y − (M_z·y)/I_z',
                substitution: `σ_top = ${result.sigmaTopMpa.toFixed(1)} MPa, σ_bot = ${result.sigmaBotMpa.toFixed(1)} MPa (f_yd = ${result.fydMpa.toFixed(1)} MPa)`,
                codeRef: 'Navier / Bernoulli Superposition',
                description: 'Linear strain distribution across cross-section depth; + is Tension, − is Compression.',
              })}
            >
              {/* Zero-stress vertical baseline */}
              <line x1={sigmaCenterX} y1={zTopPx - 8} x2={sigmaCenterX} y2={zBotPx + 8} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
              {/* Yield limit vertical guides ±fyd */}
              <line x1={mapSigmaX(result.fydMpa)} y1={zTopPx} x2={mapSigmaX(result.fydMpa)} y2={zBotPx} stroke="#10b981" strokeWidth="0.9" strokeDasharray="3 3" opacity="0.6" />
              <line x1={mapSigmaX(-result.fydMpa)} y1={zTopPx} x2={mapSigmaX(-result.fydMpa)} y2={zBotPx} stroke="#10b981" strokeWidth="0.9" strokeDasharray="3 3" opacity="0.6" />

              {/* Optional Plastic Rectangular Stress Block Overlay */}
              {plasticAllowed && showPlasticOverlay && (
                <g opacity="0.22">
                  <rect
                    x={sigmaCenterX}
                    y={zTopPx}
                    width={Math.max(2, mapSigmaX(result.fydMpa) - sigmaCenterX)}
                    height={Math.max(0, zPnaPx - zTopPx)}
                    fill="#f59e0b"
                  />
                  <rect
                    x={mapSigmaX(-result.fydMpa)}
                    y={zPnaPx}
                    width={Math.max(2, sigmaCenterX - mapSigmaX(-result.fydMpa))}
                    height={Math.max(0, zBotPx - zPnaPx)}
                    fill="#f59e0b"
                  />
                </g>
              )}

              <polygon
                points={elasticSigmaPts}
                fill="#3b82f6"
                fillOpacity="0.24"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <text x={mapSigmaX(result.sigmaTopMpa)} y={zTopPx - 6} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#2563eb">
                {result.sigmaTopMpa >= 0 ? `+${result.sigmaTopMpa.toFixed(0)}` : result.sigmaTopMpa.toFixed(0)} MPa
              </text>
              <text x={mapSigmaX(result.sigmaBotMpa)} y={zBotPx + 14} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#2563eb">
                {result.sigmaBotMpa >= 0 ? `+${result.sigmaBotMpa.toFixed(0)}` : result.sigmaBotMpa.toFixed(0)} MPa
              </text>
              <text x={sigmaCenterX} y={zBotPx + 27} textAnchor="middle" fontSize="7" fill="var(--md-sys-color-on-surface-variant)">
                ±f_yd = ±{result.fydMpa.toFixed(0)} MPa
              </text>
            </g>

            {/* Transverse Shear Stress τ(z) Profile */}
            <g
              {...bindHover({
                title: 'Transverse Parabolic Shear Flow τ(z)',
                formula: 'τ(z) = (V_z · Q_y(z)) / (I_y · t(z))',
                substitution: `τ_max(V_z) = ${result.tauMaxShearZMpa.toFixed(1)} MPa, τ_total = ${result.tauTotalMaxMpa.toFixed(1)} MPa`,
                codeRef: 'Jourawski Shear Flow Formula',
                description: 'Parabolic shear distribution jumping sharply at flange-to-web thickness transition.',
              })}
            >
              <line x1={tauBox.x + 8} y1={zTopPx - 8} x2={tauBox.x + 8} y2={zBotPx + 8} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
              <polygon
                points={tauPts}
                fill="#14b8a6"
                fillOpacity="0.28"
                stroke="#0d9488"
                strokeWidth="2"
              />
              <text x={tauBox.x + tauBox.w / 2} y={zBotPx + 18} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#0d9488">
                τ_max={result.tauTotalMaxMpa.toFixed(1)}
              </text>
            </g>
          </g>
        )}

        {/* ============================================================
            PANEL B: INTERACTIVE N-M PLASTIC / ELASTIC INTERACTION CHART
           ============================================================ */}
        {panelMode !== 'stress' && (
          <g>
            {interactionView === 'nm' ? (
              <>
                <text x={chartBox.x} y={20} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
                  N–M INTERACTION ENVELOPE ({plasticAllowed ? 'PLASTIC + ELASTIC' : 'ELASTIC ONLY · PLASTIC BLOCKED'})
                </text>

                {/* Chart Frame & Grid */}
                <rect
                  x={chartBox.x}
                  y={chartBox.y}
                  width={chartBox.w}
                  height={chartBox.h}
                  rx={6}
                  fill="var(--md-sys-color-surface)"
                  stroke="var(--md-sys-color-outline-variant)"
                />
                {/* Axes M=0 & N=0 */}
                <line x1={nmCx} y1={chartBox.y + 8} x2={nmCx} y2={chartBox.y + chartBox.h - 8} stroke="var(--md-sys-color-outline)" strokeWidth="1.2" />
                <line x1={chartBox.x + 12} y1={nmCy} x2={chartBox.x + chartBox.w - 10} y2={nmCy} stroke="var(--md-sys-color-outline)" strokeWidth="1.2" />

                {/* Reference 1.0 gridlines */}
                <line x1={mapNmX(1)} y1={chartBox.y + 10} x2={mapNmX(1)} y2={chartBox.y + chartBox.h - 10} stroke="var(--md-sys-color-outline-variant)" strokeDasharray="3 3" />
                <line x1={nmCx} y1={mapNmY(1)} x2={mapNmX(1)} y2={mapNmY(1)} stroke="var(--md-sys-color-outline-variant)" strokeDasharray="3 3" />
                <line x1={nmCx} y1={mapNmY(-1)} x2={mapNmX(1)} y2={mapNmY(-1)} stroke="var(--md-sys-color-outline-variant)" strokeDasharray="3 3" />

                {/* Plastic Yield Boundary */}
                <path
                  d={plasticNmPath}
                  fill={plasticAllowed ? '#3b82f6' : '#94a3b8'}
                  fillOpacity={plasticAllowed ? 0.14 : 0.06}
                  stroke={plasticAllowed ? '#2563eb' : '#94a3b8'}
                  strokeWidth={plasticAllowed ? '2.4' : '1.4'}
                  strokeDasharray={plasticAllowed ? undefined : '5 4'}
                  {...bindHover({
                    title: plasticAllowed ? 'Plastic N–M Yield Boundary' : 'Plastic N–M Boundary (BLOCKED for Class 3/4)',
                    formula: 'M_N,y,Rd = ∫ (z − z̄) · σ_pl(PNA) dA',
                    substitution: `N_pl,Rd = ${result.nPlRdKn.toFixed(1)} kN, M_pl,y,Rd = ${result.mPlYRdKnm.toFixed(1)} kN·m, M_N,Rd(at N) = ${result.mNyReducedRdKnm.toFixed(1)} kN·m`,
                    codeRef: `${result.designCode} Plastic Interaction`,
                    description: plasticAllowed
                      ? 'Exact full-plastification interaction envelope computed via shifted Plastic Neutral Axis.'
                      : 'Dashed reference only: blocked because plate local buckling governs before full yield.',
                  })}
                />

                {/* Elastic First-Yield Limit Boundary */}
                <path
                  d={elasticNmPath}
                  fill={!plasticAllowed ? '#f59e0b' : 'none'}
                  fillOpacity={!plasticAllowed ? 0.14 : 0}
                  stroke="#f59e0b"
                  strokeWidth={!plasticAllowed ? '2.4' : '1.6'}
                  strokeDasharray={!plasticAllowed ? undefined : '4 3'}
                  {...bindHover({
                    title: 'Elastic First-Yield Limit Envelope',
                    formula: '|N| / N_pl,Rd + |M_y| / M_el,y,Rd = 1.0',
                    substitution: `M_el,y,Rd = ${result.mElYRdKnm.toFixed(1)} kN·m`,
                    codeRef: 'First-Yield Governing Boundary',
                    description: 'Linear elastic stress boundary where extreme fiber reaches f_yd.',
                  })}
                />

                {/* Radial DCR Vector & Plotted Load Point (N, M) */}
                <line
                  x1={nmCx}
                  y1={nmCy}
                  x2={loadPtPx.x}
                  y2={loadPtPx.y}
                  stroke={result.governingDcr > 1.0 ? '#ef4444' : '#10b981'}
                  strokeWidth="1.6"
                  strokeDasharray="3 2"
                />
                <circle
                  cx={loadPtPx.x}
                  cy={loadPtPx.y}
                  r="6"
                  fill={result.governingDcr > 1.0 ? '#ef4444' : result.governingDcr > 0.85 ? '#f59e0b' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  {...bindHover({
                    title: 'Applied Load Point (M_y, N)',
                    formula: 'η = Governing Utilization Ratio (DCR)',
                    substitution: `M_y = ${result.momentMy_Knm.toFixed(1)} kN·m (${(loadMRatio * 100).toFixed(0)}% M_pl), N = ${result.axialForceN_Kn.toFixed(1)} kN (${(loadNRatio * 100).toFixed(0)}% N_pl) · DCR = ${(result.governingDcr * 100).toFixed(1)}%`,
                    codeRef: `${cls.classLabel}`,
                    description: result.governingDcr <= 1.0 ? 'Load point lies inside the admissible capacity envelope.' : 'OVERSTRESSED: Load point exceeds design section resistance!',
                  })}
                />

                <text x={loadPtPx.x + 8} y={loadPtPx.y - 6} fontSize="8" fontWeight="700" fill={result.governingDcr > 1.0 ? '#dc2626' : '#059669'}>
                  ({loadMRatio.toFixed(2)}, {loadNRatio.toFixed(2)}) · η={(result.governingDcr * 100).toFixed(0)}%
                </text>

                {/* Axis Labels */}
                <text x={chartBox.x + chartBox.w - 12} y={nmCy - 5} textAnchor="end" fontSize="8" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">
                  |M_y| / M_pl,y →
                </text>
                <text x={nmCx + 5} y={chartBox.y + 16} fontSize="8" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">
                  +N / N_pl (Tens)
                </text>
                <text x={nmCx + 5} y={chartBox.y + chartBox.h - 10} fontSize="8" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">
                  −N / N_pl (Comp)
                </text>

                {/* Explicit Class 3/4 Block Warning Pill inside SVG */}
                {!plasticAllowed && (
                  <g transform={`translate(${chartBox.x + chartBox.w - 156}, ${chartBox.y + 10})`}>
                    <rect x={0} y={0} width={148} height={24} rx={4} fill="#fef3c7" stroke="#f59e0b" />
                    <text x={74} y={15} textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#92400e">
                      CLASS {cls.sectionClass}: PLASTIC BLOCKED
                    </text>
                  </g>
                )}
              </>
            ) : (
              /* BIAXIAL My - Mz ENVELOPE */
              <>
                <text x={chartBox.x} y={20} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
                  BIAXIAL M_y–M_z INTERACTION AT N = {result.axialForceN_Kn.toFixed(0)} kN
                </text>
                <rect
                  x={chartBox.x}
                  y={chartBox.y}
                  width={chartBox.w}
                  height={chartBox.h}
                  rx={6}
                  fill="var(--md-sys-color-surface)"
                  stroke="var(--md-sys-color-outline-variant)"
                />
                <line x1={biaxOriginX} y1={chartBox.y + 12} x2={biaxOriginX} y2={biaxOriginY} stroke="var(--md-sys-color-outline)" strokeWidth="1.2" />
                <line x1={biaxOriginX} y1={biaxOriginY} x2={chartBox.x + chartBox.w - 14} y2={biaxOriginY} stroke="var(--md-sys-color-outline)" strokeWidth="1.2" />

                <path
                  d={biaxPath}
                  fill="#8b5cf6"
                  fillOpacity="0.16"
                  stroke="#7c3aed"
                  strokeWidth="2.2"
                />
                <circle
                  cx={mapBiaxX(loadMyRatio)}
                  cy={mapBiaxY(loadMzRatio)}
                  r="6"
                  fill={result.governingDcr > 1.0 ? '#ef4444' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="1.8"
                />
                <text x={mapBiaxX(loadMyRatio) + 8} y={mapBiaxY(loadMzRatio) - 6} fontSize="8" fontWeight="700" fill="var(--md-sys-color-on-surface)">
                  ({loadMyRatio.toFixed(2)}, {loadMzRatio.toFixed(2)})
                </text>
                <text x={chartBox.x + chartBox.w - 14} y={biaxOriginY - 6} textAnchor="end" fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
                  |M_y| / M_N,y,Rd →
                </text>
                <text x={biaxOriginX + 6} y={chartBox.y + 20} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
                  ↑ |M_z| / M_pl,z
                </text>
              </>
            )}
          </g>
        )}
      </svg>

      {/* Compact Legend Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-[#0ea5e9]" /> ENA (Centroid)
          </span>
          {plasticAllowed && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 bg-[#f59e0b]" /> PNA (Shifted)
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 bg-[#3b82f6]/30 border border-[#2563eb]" /> Normal Stress σ(z)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 bg-[#14b8a6]/30 border border-[#0d9488]" /> Shear Flow τ(z)
          </span>
        </div>
        <div>
          Hover diagram zones for Eurocode / AISC equations
        </div>
      </div>

      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* ==============================================================
   12. RC COLUMN P-M INTERACTION & CROSS-SECTION REBAR DIAGRAM
   ============================================================== */
export const RcColumnDiagramSvg: React.FC<{
  params: RcColumnParams;
  result: RcColumnDesignResult;
}> = ({ params, result }) => {
  const { tooltip, containerRef, bindHover } = useFormulaTooltip();
  const [activeAxis, setActiveAxis] = useState<'X' | 'Y'>('X');
  const [showNominal, setShowNominal] = useState(true);

  const axisRes = activeAxis === 'X' ? result.xAxis : result.yAxis;
  const curve = axisRes.curve;

  // Chart Coordinate Mapping (M on X-axis, P on Y-axis)
  const chartX = 335;
  const chartY = 38;
  const chartW = 355;
  const chartH = 265;

  const maxM = Math.max(
    50,
    ...curve.map((p) => p.mnKnm),
    axisRes.magnifiedMomentKnm * 1.15
  );
  const maxP = Math.max(
    100,
    result.p0Kn * 1.08,
    result.axialLoadPu_Kn * 1.08
  );
  const minP = Math.min(
    -50,
    result.ptTensionKn * 1.12,
    result.axialLoadPu_Kn * 1.08
  );

  const mapM = (m: number) => chartX + (Math.max(0, m) / maxM) * chartW;
  const mapP = (p: number) =>
    chartY + ((maxP - p) / Math.max(1, maxP - minP)) * chartH;

  const nominalPath = curve
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapM(pt.mnKnm).toFixed(1)} ${mapP(pt.pnKn).toFixed(1)}`)
    .join(' ');

  const designPath = curve
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapM(pt.phiMnKnm).toFixed(1)} ${mapP(pt.phiPnKn).toFixed(1)}`)
    .join(' ');

  const designFillPath = `${designPath} L ${mapM(0).toFixed(1)} ${mapP(result.phiPtTensionKn).toFixed(1)} L ${mapM(0).toFixed(1)} ${mapP(result.phiPnMaxKn).toFixed(1)} Z`;

  // Cross-Section Geometry Mapping (Left Panel)
  const secBoxCx = 148;
  const secBoxCy = 168;
  const maxSecDim = Math.max(result.widthB_Mm, result.depthH_Mm);
  const secScale = 155 / Math.max(100, maxSecDim);
  const drawW = result.widthB_Mm * secScale;
  const drawH = result.depthH_Mm * secScale;
  const secX = secBoxCx - drawW / 2;
  const secY = secBoxCy - drawH / 2;
  const coverDraw = result.clearCoverMm * secScale;

  const demandSafe = result.governingDcr <= 1.0;
  const demX = mapM(axisRes.magnifiedMomentKnm);
  const demY = mapP(result.axialLoadPu_Kn);
  const rawDemX = mapM(axisRes.appliedMomentKnm);
  const cutoffY = mapP(result.phiPnMaxKn);
  const zeroPY = mapP(0);

  return (
    <div ref={containerRef} className="relative w-full select-none space-y-2">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
          <button
            type="button"
            onClick={() => setActiveAxis('X')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold cursor-pointer transition-colors ${
              activeAxis === 'X'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            Major X-Axis (M_ux / h={result.depthH_Mm})
          </button>
          <button
            type="button"
            onClick={() => setActiveAxis('Y')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold cursor-pointer transition-colors ${
              activeAxis === 'Y'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            Minor Y-Axis (M_uy / b={result.widthB_Mm})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNominal((v) => !v)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer transition-colors ${
              showNominal
                ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-surface)]'
                : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
            }`}
          >
            {showNominal ? 'Hide Nominal Pn-Mn' : 'Show Nominal Pn-Mn'}
          </button>
        </div>
      </div>

      <svg viewBox="0 0 720 355" className="w-full h-auto rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        {/* Left Panel Title */}
        <text x={secBoxCx} y={24} textAnchor="middle" className="fill-[var(--md-sys-color-on-surface)] font-sans text-[12px] font-bold">
          Column Section ({result.widthB_Mm}×{result.depthH_Mm} mm)
        </text>
        <text x={secBoxCx} y={40} textAnchor="middle" className="fill-[var(--md-sys-color-on-surface-variant)] font-mono text-[10px]">
          {result.totalBarCount}-Ø{result.longitudinalBarDiaMm}mm (ρ_g = {result.rhoPercent.toFixed(2)}%)
        </text>

        {/* Concrete Outline */}
        <rect
          x={secX}
          y={secY}
          width={drawW}
          height={drawH}
          rx={2}
          className="fill-slate-100 dark:fill-slate-800/70 stroke-[var(--md-sys-color-on-surface)]"
          strokeWidth={2}
        />

        {/* Transverse Tie Hoop */}
        <rect
          x={secX + coverDraw}
          y={secY + coverDraw}
          width={Math.max(10, drawW - 2 * coverDraw)}
          height={Math.max(10, drawH - 2 * coverDraw)}
          rx={4}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
        />

        {/* Centroid Axes */}
        <line
          x1={secX - 16}
          y1={secBoxCy}
          x2={secX + drawW + 16}
          y2={secBoxCy}
          stroke="#64748b"
          strokeDasharray="4,3"
          strokeWidth={1}
        />
        <line
          x1={secBoxCx}
          y1={secY - 14}
          x2={secBoxCx}
          y2={secY + drawH + 14}
          stroke="#64748b"
          strokeDasharray="4,3"
          strokeWidth={1}
        />

        {/* Longitudinal Rebar Dots */}
        {result.bars.map((bar) => {
          const cx = secBoxCx + bar.xMm * secScale;
          const cy = secBoxCy - bar.yMm * secScale;
          const r = Math.max(3.5, Math.min(7, (params.longitudinalBarDiaMm / 2) * secScale));
          return (
            <circle
              key={bar.id}
              cx={cx}
              cy={cy}
              r={r}
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth={1}
              {...bindHover({
                title: `Longitudinal Rebar ${bar.id} (Ø${params.longitudinalBarDiaMm}mm)`,
                formula: `A_s,bar = ${(bar.areaMm2).toFixed(0)} mm² | Coord: (${bar.xMm.toFixed(0)}, ${bar.yMm.toFixed(0)}) mm`,
                codeRef: `${result.designCode} · Clear cover ${result.clearCoverMm} mm`,
              })}
            />
          );
        })}

        {/* Width & Depth Dimension Annotations */}
        <text x={secBoxCx} y={secY + drawH + 28} textAnchor="middle" className="fill-[var(--md-sys-color-on-surface-variant)] font-mono text-[10px]">
          b = {result.widthB_Mm} mm
        </text>
        <text
          x={secX - 18}
          y={secBoxCy}
          textAnchor="middle"
          transform={`rotate(-90 ${secX - 18} ${secBoxCy})`}
          className="fill-[var(--md-sys-color-on-surface-variant)] font-mono text-[10px]"
        >
          h = {result.depthH_Mm} mm
        </text>
        <text x={secBoxCx} y={322} textAnchor="middle" className="fill-[var(--md-sys-color-on-surface-variant)] font-mono text-[10px]">
          Ties Ø{result.tieBarDiaMm}@{result.tieSpacingMm}mm c/c · f&apos;c={result.concreteFcMpa} / fy={result.rebarFyMpa} MPa
        </text>

        {/* Divider */}
        <line x1={290} y1={16} x2={290} y2={338} className="stroke-[var(--md-sys-color-outline-variant)]" strokeWidth={1} />

        {/* Right Panel: P-M Interaction Diagram */}
        <text x={chartX + chartW / 2} y={22} textAnchor="middle" className="fill-[var(--md-sys-color-on-surface)] font-sans text-[12px] font-bold">
          {activeAxis}-Axis P–M Interaction Envelope ({result.designCode})
        </text>

        {/* Chart Grid & Zero Axial Line */}
        <rect
          x={chartX}
          y={chartY}
          width={chartW}
          height={chartH}
          className="fill-slate-50/70 dark:fill-slate-900/50 stroke-[var(--md-sys-color-outline-variant)]"
          strokeWidth={1}
        />
        <line
          x1={chartX}
          y1={zeroPY}
          x2={chartX + chartW}
          y2={zeroPY}
          stroke="#64748b"
          strokeWidth={1.2}
        />
        <text x={chartX - 4} y={zeroPY + 3} textAnchor="end" className="fill-[var(--md-sys-color-on-surface-variant)] font-mono text-[9px]">
          0
        </text>
        <text x={chartX - 4} y={mapP(result.p0Kn) + 4} textAnchor="end" className="fill-[var(--md-sys-color-on-surface-variant)] font-mono text-[9px]">
          {result.p0Kn.toFixed(0)}
        </text>
        <text x={chartX - 4} y={mapP(result.ptTensionKn) + 3} textAnchor="end" className="fill-[var(--md-sys-color-on-surface-variant)] font-mono text-[9px]">
          {result.ptTensionKn.toFixed(0)}
        </text>
        <text x={chartX - 8} y={chartY + chartH / 2} textAnchor="middle" transform={`rotate(-90 ${chartX - 24} ${chartY + chartH / 2})`} className="fill-[var(--md-sys-color-on-surface-variant)] font-mono text-[9px]">
          Axial Force P (kN)
        </text>
        <text x={chartX + chartW / 2} y={chartY + chartH + 28} textAnchor="middle" className="fill-[var(--md-sys-color-on-surface-variant)] font-mono text-[10px]">
          Bending Moment M_{activeAxis.toLowerCase()} (kN·m) — Peak {maxM.toFixed(0)}
        </text>

        {/* Design Envelope Fill */}
        <path d={designFillPath} fill="#2563eb" fillOpacity={0.1} />

        {/* Nominal Pn-Mn Curve */}
        {showNominal && (
          <path
            d={nominalPath}
            fill="none"
            stroke="#6366f1"
            strokeWidth={1.6}
            strokeDasharray="5,4"
            {...bindHover({
              title: `Nominal Strength Envelope (Pn–Mn)`,
              formula: `P_0 = ${result.p0Kn.toFixed(0)} kN | Pure Bending M_n0 = ${(curve.find((c) => c.regime === 'pure-bending')?.mnKnm || 0).toFixed(1)} kN·m`,
              codeRef: `Unfactored strain-compatibility curve (${result.designCode})`,
            })}
          />
        )}

        {/* Design phi*Pn - phi*Mn Curve */}
        <path
          d={designPath}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2.5}
          {...bindHover({
            title: `Design Factored Envelope (φPn–φMn)`,
            formula: `φP_n,max = ${result.phiPnMaxKn.toFixed(0)} kN | φM_n(Pu) = ${axisRes.phiMnAtPuKnm.toFixed(1)} kN·m`,
            codeRef: `Strength reduction φ = 0.65 (compression) → 0.90 (tension)`,
          })}
        />

        {/* Pure Axial Cutoff Line */}
        <line
          x1={chartX}
          y1={cutoffY}
          x2={chartX + chartW}
          y2={cutoffY}
          stroke="#f59e0b"
          strokeDasharray="4,3"
          strokeWidth={1.3}
          {...bindHover({
            title: `Maximum Tied Axial Cutoff (φP_n,max)`,
            formula: `φP_n,max = 0.80 · φ · P_0 = ${result.phiPnMaxKn.toFixed(1)} kN`,
            codeRef: `ACI 318-19 Table 22.4.2.1 / BNBC 2020`,
          })}
        />
        <text x={chartX + chartW - 4} y={cutoffY - 4} textAnchor="end" className="fill-amber-600 dark:fill-amber-400 font-mono text-[9px] font-semibold">
          φP_n,max = {result.phiPnMaxKn.toFixed(0)} kN
        </text>

        {/* Balanced Point Marker */}
        <circle
          cx={mapM(axisRes.phiMBalancedKnm)}
          cy={mapP(axisRes.phiPBalancedKn)}
          r={4.5}
          fill="#f59e0b"
          stroke="#ffffff"
          strokeWidth={1.5}
          {...bindHover({
            title: `Balanced Failure Point (c_b = ${axisRes.cBalancedMm.toFixed(1)} mm)`,
            formula: `φP_b = ${axisRes.phiPBalancedKn.toFixed(1)} kN ,  φM_b = ${axisRes.phiMBalancedKnm.toFixed(1)} kN·m`,
            codeRef: `Simultaneous ε_cu & ε_t = f_y / E_s`,
          })}
        />

        {/* Unmagnified vs Magnified Demand Line */}
        {Math.abs(demX - rawDemX) > 2 && (
          <>
            <line
              x1={rawDemX}
              y1={demY}
              x2={demX}
              y2={demY}
              stroke="#ef4444"
              strokeDasharray="3,2"
              strokeWidth={1.5}
            />
            <circle cx={rawDemX} cy={demY} r={3.5} fill="#ffffff" stroke="#64748b" strokeWidth={1.5} />
          </>
        )}

        {/* Applied Factored Load Point */}
        <line x1={chartX} y1={demY} x2={demX} y2={demY} stroke={demandSafe ? '#10b981' : '#ef4444'} strokeDasharray="2,3" strokeWidth={1} />
        <line x1={demX} y1={demY} x2={demX} y2={chartY + chartH} stroke={demandSafe ? '#10b981' : '#ef4444'} strokeDasharray="2,3" strokeWidth={1} />
        <circle
          cx={demX}
          cy={demY}
          r={6}
          fill={demandSafe ? '#10b981' : '#ef4444'}
          stroke="#ffffff"
          strokeWidth={2}
          {...bindHover({
            title: `Factored Demand (P_u, M_c${activeAxis.toLowerCase()}) — ${demandSafe ? 'SAFE' : 'OVERLOADED'}`,
            formula: `P_u = ${result.axialLoadPu_Kn} kN | M_c${activeAxis.toLowerCase()} = ${axisRes.magnifiedMomentKnm.toFixed(1)} kN·m (δ_ns = ${axisRes.magnifierDeltaNs.toFixed(2)}×)`,
            codeRef: `Uniaxial DCR = ${(axisRes.uniaxialDcr * 100).toFixed(1)}% · Biaxial Bresler = ${(result.breslerContourDcr * 100).toFixed(1)}%`,
          })}
        />
        <text
          x={Math.min(chartX + chartW - 60, demX + 8)}
          y={Math.max(chartY + 16, demY - 8)}
          className={`font-mono text-[10px] font-bold ${demandSafe ? 'fill-emerald-700 dark:fill-emerald-400' : 'fill-rose-600 dark:fill-rose-400'}`}
        >
          ({axisRes.magnifiedMomentKnm.toFixed(0)} kN·m, {result.axialLoadPu_Kn} kN)
        </text>
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] px-1">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-[#2563eb]" /> Design φPn–φMn
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 border-t border-dashed border-[#6366f1]" /> Nominal Pn–Mn
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Balanced Point
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${demandSafe ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} /> Applied Demand
          </span>
        </div>
        <div>Hover curve &amp; bars for strain-compatibility equations</div>
      </div>

      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};

/* ==============================================================
   13. STRUT-AND-TIE MODEL (STM) DISCONTINUITY TRUSS DIAGRAM
   ============================================================== */
export const StrutAndTieDiagramSvg: React.FC<{
  params: StrutAndTieParams;
  result: StrutAndTieResult;
}> = ({ params, result }) => {
  const { tooltip, containerRef, bindHover } = useFormulaTooltip();

  const xs = result.nodeResults.map((n) => n.xM);
  const ys = result.nodeResults.map((n) => n.yM);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = Math.max(0.4, maxX - minX);
  const spanY = Math.max(0.4, maxY - minY);

  const svgW = 720;
  const svgH = 340;
  const padX = 90;
  const padTop = 58;
  const padBot = 65;

  const scale = Math.min(
    (svgW - 2 * padX) / spanX,
    (svgH - padTop - padBot) / spanY
  );
  const drawW = spanX * scale;
  const drawH = spanY * scale;
  const offX = (svgW - drawW) / 2;
  const offY = padTop + (svgH - padTop - padBot - drawH) / 2;

  const mapX = (xM: number) => offX + (xM - minX) * scale;
  const mapY = (yM: number) => offY + drawH - (yM - minY) * scale;

  const nodeMap = new Map(result.nodeResults.map((n) => [n.nodeId, n]));

  return (
    <div ref={containerRef} className="relative w-full select-none space-y-2">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        {/* Title & Partial Advisory */}
        <text x={svgW / 2} y={22} textAnchor="middle" className="fill-[var(--md-sys-color-on-surface)] font-sans text-[12px] font-bold">
          {params.presetName} · Strut-and-Tie Truss Equilibrium
        </text>
        <text x={svgW / 2} y={37} textAnchor="middle" className="fill-[var(--md-sys-color-on-surface-variant)] font-mono text-[10px]">
          b = {params.memberThicknessMm} mm · f&apos;c = {params.concreteFcMpa} MPa · fy = {params.rebarFyMpa} MPa · Partial Scope (Equilibrium &amp; Forces)
        </text>

        {/* Concrete D-Region Envelope Silhouette */}
        <rect
          x={offX - 24}
          y={offY - 20}
          width={drawW + 48}
          height={drawH + 40}
          rx={4}
          className="fill-slate-100/80 dark:fill-slate-800/40 stroke-slate-300 dark:stroke-slate-700"
          strokeWidth={1.5}
        />

        {/* Members: Struts (Dashed Red/Amber) & Ties (Solid Blue/Emerald) */}
        {result.memberResults.map((mr) => {
          const n1 = nodeMap.get(mr.startNodeId);
          const n2 = nodeMap.get(mr.endNodeId);
          if (!n1 || !n2) return null;
          const x1 = mapX(n1.xM);
          const y1 = mapY(n1.yM);
          const x2 = mapX(n2.xM);
          const y2 = mapY(n2.yM);
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;

          const isStrut = mr.role === 'strut';
          const isTie = mr.role === 'tie';
          const stroke = isStrut
            ? '#d97706' // Amber/Red compression strut
            : isTie
            ? '#0284c7' // Blue tension tie
            : '#94a3b8';

          return (
            <g
              key={mr.memberId}
              {...bindHover({
                title: `${mr.label} — ${isStrut ? 'COMPRESSION STRUT' : isTie ? 'TENSION TIE' : 'ZERO-FORCE'}`,
                formula: `Axial N = ${mr.axialForceKn >= 0 ? '+' : ''}${mr.axialForceKn.toFixed(1)} kN | Stress = ${mr.stressMpa.toFixed(1)} MPa (DCR ${(mr.dcrRatio * 100).toFixed(1)}%)`,
                codeRef: isTie
                  ? `Required Tie Rebar A_s = ${mr.requiredTieSteelMm2.toFixed(0)} mm² (φ = 0.75)`
                  : `Strut capacity limit = ${mr.allowableLimitMpa.toFixed(1)} MPa`,
              })}
            >
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth={isStrut ? 5.5 : isTie ? 3.5 : 1.5}
                strokeDasharray={isStrut ? '9,5' : isTie ? undefined : '3,4'}
                strokeLinecap="round"
              />
              {/* Force Label Pill-free Clean Box */}
              <rect
                x={mx - 44}
                y={my - 12}
                width={88}
                height={18}
                rx={3}
                className="fill-[var(--md-sys-color-surface)]/95 stroke-[var(--md-sys-color-outline-variant)]"
                strokeWidth={0.8}
              />
              <text
                x={mx}
                y={my + 1}
                textAnchor="middle"
                className="font-mono text-[9.5px] font-bold"
                fill={stroke}
              >
                {isStrut
                  ? `-${Math.abs(mr.axialForceKn).toFixed(0)} kN (C)`
                  : isTie
                  ? `+${mr.axialForceKn.toFixed(0)} kN (T)`
                  : `0 kN`}
              </text>
            </g>
          );
        })}

        {/* Nodes, Support Symbols & Applied Loads */}
        {result.nodeResults.map((nr) => {
          const x = mapX(nr.xM);
          const y = mapY(nr.yM);
          const hasLoad = Math.abs(nr.appliedFxKn) > 0.1 || Math.abs(nr.appliedFyKn) > 0.1;

          return (
            <g
              key={nr.nodeId}
              {...bindHover({
                title: `Node ${nr.label} (${nr.xM.toFixed(2)}m, ${nr.yM.toFixed(2)}m)`,
                formula: `Applied: (${nr.appliedFxKn.toFixed(1)}, ${nr.appliedFyKn.toFixed(1)}) kN | Reaction: (${nr.reactionRxKn.toFixed(1)}, ${nr.reactionRyKn.toFixed(1)}) kN`,
                codeRef: `Joint ΣFx=${nr.sumFxResidualKn.toExponential(1)}, ΣFy=${nr.sumFyResidualKn.toExponential(1)} kN`,
              })}
            >
              {/* Support Geometry */}
              {nr.support === 'pin' && (
                <polygon
                  points={`${x},${y + 4} ${x - 10},${y + 20} ${x + 10},${y + 20}`}
                  fill="none"
                  className="stroke-[var(--md-sys-color-primary)]"
                  strokeWidth={2}
                />
              )}
              {nr.support === 'roller-y' && (
                <>
                  <polygon
                    points={`${x},${y + 4} ${x - 9},${y + 17} ${x + 9},${y + 17}`}
                    fill="none"
                    className="stroke-[var(--md-sys-color-primary)]"
                    strokeWidth={1.8}
                  />
                  <circle cx={x - 5} cy={y + 21} r={2.5} className="fill-[var(--md-sys-color-primary)]" />
                  <circle cx={x + 5} cy={y + 21} r={2.5} className="fill-[var(--md-sys-color-primary)]" />
                </>
              )}
              {nr.support === 'roller-x' && (
                <polygon
                  points={`${x - 4},${y} ${x - 18},${y - 9} ${x - 18},${y + 9}`}
                  fill="none"
                  className="stroke-[var(--md-sys-color-primary)]"
                  strokeWidth={1.8}
                />
              )}

              {/* Applied Point Load Arrows */}
              {hasLoad && Math.abs(nr.appliedFyKn) > 0.1 && (
                <g>
                  <line
                    x1={x}
                    y1={nr.appliedFyKn < 0 ? y - 38 : y + 38}
                    x2={x}
                    y2={nr.appliedFyKn < 0 ? y - 8 : y + 8}
                    stroke="#dc2626"
                    strokeWidth={2.5}
                  />
                  <polygon
                    points={
                      nr.appliedFyKn < 0
                        ? `${x},${y - 6} ${x - 4.5},${y - 14} ${x + 4.5},${y - 14}`
                        : `${x},${y + 6} ${x - 4.5},${y + 14} ${x + 4.5},${y + 14}`
                    }
                    fill="#dc2626"
                  />
                  <text
                    x={x}
                    y={nr.appliedFyKn < 0 ? y - 42 : y + 50}
                    textAnchor="middle"
                    fill="#dc2626"
                    className="font-mono text-[10px] font-bold"
                  >
                    {Math.abs(nr.appliedFyKn).toFixed(0)} kN
                  </text>
                </g>
              )}

              {hasLoad && Math.abs(nr.appliedFxKn) > 0.1 && (
                <g>
                  <line
                    x1={nr.appliedFxKn > 0 ? x + 8 : x - 8}
                    y1={y}
                    x2={nr.appliedFxKn > 0 ? x + 42 : x - 42}
                    y2={y}
                    stroke="#dc2626"
                    strokeWidth={2.2}
                  />
                  <text
                    x={nr.appliedFxKn > 0 ? x + 46 : x - 46}
                    y={y + 3}
                    textAnchor={nr.appliedFxKn > 0 ? 'start' : 'end'}
                    fill="#dc2626"
                    className="font-mono text-[10px] font-bold"
                  >
                    {nr.appliedFxKn > 0 ? '+' : ''}{nr.appliedFxKn.toFixed(0)} kN
                  </text>
                </g>
              )}

              {/* Node Dot */}
              <circle
                cx={x}
                cy={y}
                r={5.5}
                className="fill-[var(--md-sys-color-surface)] stroke-[var(--md-sys-color-on-surface)]"
                strokeWidth={2}
              />
              <text
                x={x}
                y={y + (nr.support !== 'none' ? 35 : -12)}
                textAnchor="middle"
                className="fill-[var(--md-sys-color-on-surface)] font-mono text-[9.5px] font-semibold"
              >
                {nr.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] px-1">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-[#d97706]" /> Compression Strut (-C)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-[#0284c7]" /> Tension Tie (+T)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#dc2626]" /> Factored Load
          </span>
        </div>
        <div>Hover struts, ties, or nodes for Method of Joints details</div>
      </div>

      <FormulaTooltipOverlay tooltip={tooltip} />
      <DiagramFormulaHint />
    </div>
  );
};





