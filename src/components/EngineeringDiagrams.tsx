import React, { useState, useRef } from 'react';
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
  PileCapacityParameters,
  PipeHydraulicsParameters,
} from '../types/civil';

/* 1. Beam Diagram with Interactive Crosshair & Limit State Safety */
export const BeamDiagramSvg: React.FC<{ params: BeamParameters; result: BeamAnalysisResult }> = ({
  params,
  result,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverData, setHoverData] = useState<{ x: number; shearKn: number; momentKnm: number; px: number } | null>(null);

  const width = 680;
  const height = 330;
  const padLeft = 58;
  const padRight = 130; // Room for beam section vignette
  const plotW = width - padLeft - padRight;
  const L = Math.max(0.1, params.spanLengthM);
  const maxV = Math.max(0.1, result.maxShearKn);
  const maxM = Math.max(0.1, result.maxMomentKnm);
  const toX = (xM: number) => padLeft + (Math.max(0, Math.min(L, xM)) / L) * plotW;

  const shearCenterY = 142;
  const shearAmp = 38;
  const shearPoints = result.points
    .map((pt) => `${toX(pt.x).toFixed(1)},${(shearCenterY - (pt.shearKn / maxV) * shearAmp).toFixed(1)}`)
    .join(' ');
  const shearAreaPoints = `${padLeft},${shearCenterY} ${shearPoints} ${padLeft + plotW},${shearCenterY}`;

  const momentCenterY = 254;
  const momentAmp = 40;
  const momentPoints = result.points
    .map((pt) => `${toX(pt.x).toFixed(1)},${(momentCenterY + (pt.momentKnm / maxM) * momentAmp).toFixed(1)}`)
    .join(' ');
  const momentAreaPoints = `${padLeft},${momentCenterY} ${momentPoints} ${padLeft + plotW},${momentCenterY}`;
  const pointLoadX = toX(Math.min(L, params.pointLoadPositionM));

  // Serviceability limit state check (L/250)
  const allowableDeflMm = (L * 1000) / 250;
  const deflRatio = result.maxDeflectionMm / Math.max(0.001, allowableDeflMm);
  const isDeflPassing = deflRatio <= 1.0;
  const deflStatusColor = deflRatio <= 0.8 ? '#10b981' : deflRatio <= 1.0 ? '#f59e0b' : '#ef4444';
  const deflStatusText = deflRatio <= 0.8 ? 'PASS · Serviceability Satisfied' : deflRatio <= 1.0 ? 'ATTENTION · High Deflection' : 'EXCEEDED · Deflection > L/250';

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = clientX * scaleX;

    if (svgX >= padLeft && svgX <= padLeft + plotW) {
      const curX = ((svgX - padLeft) / plotW) * L;
      // Interpolate or find nearest point
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
        px: toX(nearest.x),
      });
    } else {
      setHoverData(null);
    }
  };

  return (
    <div className="relative w-full">
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
            <stop offset="0%" stopColor="var(--md-sys-color-primary)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--md-sys-color-primary)" stopOpacity="0.4" />
          </linearGradient>
          <pattern id="diagonalHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Header / Limit State Indicator */}
        <text x={12} y={22} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">
          STRUCTURAL ACTIONS & DEFLECTION CHECK
        </text>
        <rect x={width - 250} y={10} width={240} height={20} rx={4} fill={deflStatusColor} fillOpacity="0.12" stroke={deflStatusColor} strokeWidth="1" />
        <circle cx={width - 240} cy={20} r={4} fill={deflStatusColor} />
        <text x={width - 230} y={23} fontSize="9" fontWeight="700" fill={deflStatusColor}>
          {deflStatusText} ({result.maxDeflectionMm.toFixed(2)}mm / {allowableDeflMm.toFixed(1)}mm)
        </text>

        {/* 1. Beam & Loads */}
        <text x={12} y={54} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">LOADS</text>
        {params.uniformLoadKnPerM > 0 && (
          <g>
            <line x1={padLeft} y1={36} x2={padLeft + plotW} y2={36} stroke="var(--md-sys-color-primary)" strokeWidth="1.5" />
            {Array.from({ length: 9 }).map((_, i) => {
              const xPos = padLeft + (i / 8) * plotW;
              return (
                <g key={i}>
                  <line x1={xPos} y1={36} x2={xPos} y2={50} stroke="var(--md-sys-color-primary)" strokeWidth="1" />
                  <polygon points={`${xPos - 2.5},47 ${xPos + 2.5},47 ${xPos},51`} fill="var(--md-sys-color-primary)" />
                </g>
              );
            })}
            <text x={padLeft + plotW / 2} y={32} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-primary)">
              w = {params.uniformLoadKnPerM} kN/m
            </text>
          </g>
        )}
        {params.pointLoadKn > 0 && (
          <g>
            <line x1={pointLoadX} y1={25} x2={pointLoadX} y2={50} stroke="var(--md-sys-color-tertiary)" strokeWidth="2.5" />
            <polygon points={`${pointLoadX - 4},44 ${pointLoadX + 4},44 ${pointLoadX},52`} fill="var(--md-sys-color-tertiary)" />
            <text x={pointLoadX + 6} y={32} fontSize="9" fontWeight="700" fill="var(--md-sys-color-tertiary)">
              P = {params.pointLoadKn} kN
            </text>
          </g>
        )}

        {/* Beam Solid Geometry */}
        <rect x={padLeft} y={52} width={plotW} height={10} rx={2} fill="url(#beamGradient)" />
        {/* Pinned Support (Left) */}
        <polygon points={`${padLeft},62 ${padLeft - 7},74 ${padLeft + 7},74`} fill="var(--md-sys-color-outline)" />
        <line x1={padLeft - 10} y1={74} x2={padLeft + 10} y2={74} stroke="var(--md-sys-color-outline)" strokeWidth="2" />
        {/* Roller Support (Right) */}
        <polygon points={`${padLeft + plotW},62 ${padLeft + plotW - 7},71 ${padLeft + plotW + 7},71`} fill="var(--md-sys-color-outline)" />
        <circle cx={padLeft + plotW - 4} cy={74} r={2} fill="var(--md-sys-color-outline)" />
        <circle cx={padLeft + plotW + 4} cy={74} r={2} fill="var(--md-sys-color-outline)" />
        <line x1={padLeft + plotW - 10} y1={77} x2={padLeft + plotW + 10} y2={77} stroke="var(--md-sys-color-outline)" strokeWidth="2" />

        {/* Span Dimension */}
        <text x={padLeft + plotW / 2} y={80} textAnchor="middle" fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
          Span L = {L.toFixed(2)} m
        </text>

        {/* 2. SFD */}
        <text x={12} y={146} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">SFD (kN)</text>
        <line x1={padLeft} y1={shearCenterY} x2={padLeft + plotW} y2={shearCenterY} stroke="var(--md-sys-color-outline)" strokeWidth="1" strokeDasharray="3 3" />
        <polygon points={shearAreaPoints} fill="var(--md-sys-color-primary)" fillOpacity="0.18" />
        <polyline fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="2" points={shearPoints} />
        <text x={padLeft + 4} y={shearCenterY - shearAmp + 6} fontSize="9" fill="var(--md-sys-color-primary)" fontWeight="600">
          +{maxV.toFixed(1)}
        </text>
        <text x={padLeft + 4} y={shearCenterY + shearAmp} fontSize="9" fill="var(--md-sys-color-primary)" fontWeight="600">
          -{maxV.toFixed(1)}
        </text>

        {/* 3. BMD */}
        <text x={12} y={258} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">BMD (kN·m)</text>
        <line x1={padLeft} y1={momentCenterY} x2={padLeft + plotW} y2={momentCenterY} stroke="var(--md-sys-color-outline)" strokeWidth="1" strokeDasharray="3 3" />
        <polygon points={momentAreaPoints} fill="var(--md-sys-color-secondary)" fillOpacity="0.20" />
        <polyline fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2" points={momentPoints} />
        <text x={padLeft + 4} y={momentCenterY + momentAmp} fontSize="9" fill="var(--md-sys-color-secondary)" fontWeight="600">
          M_max = {maxM.toFixed(1)} kN·m
        </text>

        {/* Beam Cross Section Vignette */}
        <g transform={`translate(${width - 110}, 85)`}>
          <rect x={0} y={0} width={100} height={190} rx={6} fill="var(--md-sys-color-surface-container-high)" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
          <text x={50} y={18} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface)">
            SECTION
          </text>
          {/* Concrete Core */}
          <rect x={15} y={28} width={70} height={120} rx={3} fill="var(--md-sys-color-surface-container-highest)" stroke="var(--md-sys-color-outline)" strokeWidth="1.5" />
          {/* Stirrup Tie */}
          <rect x={20} y={33} width={60} height={110} rx={2} fill="none" stroke="var(--md-sys-color-tertiary)" strokeWidth="1.2" strokeDasharray="2 1" />
          {/* Top Bars (Hanger) */}
          <circle cx={26} cy={39} r={3} fill="var(--md-sys-color-on-surface)" />
          <circle cx={74} cy={39} r={3} fill="var(--md-sys-color-on-surface)" />
          {/* Bottom Bars (Main Tension) */}
          <circle cx={26} cy={137} r={4} fill="var(--md-sys-color-primary)" />
          <circle cx={50} cy={137} r={4} fill="var(--md-sys-color-primary)" />
          <circle cx={74} cy={137} r={4} fill="var(--md-sys-color-primary)" />
          {/* Dimensions */}
          <text x={50} y={160} textAnchor="middle" fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
            b × h mm
          </text>
          <text x={50} y={174} textAnchor="middle" fontSize="8" fontWeight="600" fill="var(--md-sys-color-primary)">
            Main: 3-Ø16
          </text>
        </g>

        {/* Interactive Inspection Crosshair */}
        {hoverData && (
          <g pointerEvents="none">
            <line x1={hoverData.px} y1={25} x2={hoverData.px} y2={305} stroke="var(--md-sys-color-primary)" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx={hoverData.px} cy={shearCenterY - (hoverData.shearKn / maxV) * shearAmp} r={4.5} fill="var(--md-sys-color-primary)" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={hoverData.px} cy={momentCenterY + (hoverData.momentKnm / maxM) * momentAmp} r={4.5} fill="var(--md-sys-color-secondary)" stroke="#ffffff" strokeWidth="1.5" />

            {/* Floating Value Tag */}
            <g transform={`translate(${Math.min(width - 230, Math.max(padLeft, hoverData.px - 60))}, 92)`}>
              <rect x={0} y={0} width={135} height={38} rx={6} fill="var(--md-sys-color-surface-container-highest)" stroke="var(--md-sys-color-outline)" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
              <text x={8} y={15} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface)">
                x = {hoverData.x.toFixed(2)} m
              </text>
              <text x={8} y={28} fontSize="9" fontWeight="600" fill="var(--md-sys-color-primary)">
                V: {hoverData.shearKn.toFixed(1)} kN
              </text>
              <text x={70} y={28} fontSize="9" fontWeight="600" fill="var(--md-sys-color-secondary)">
                M: {hoverData.momentKnm.toFixed(1)} kNm
              </text>
            </g>
          </g>
        )}
      </svg>
      {!hoverData && (
        <div className="absolute top-2 left-16 text-[10px] text-zinc-400 dark:text-zinc-500 pointer-events-none select-none font-mono">
          Hover or drag across span to inspect shear & moment coordinates
        </div>
      )}
    </div>
  );
};

/* 2. Bearing Diagram with Soil Strata, GWT, and Boussinesq Stress Bulbs */
export const BearingDiagramSvg: React.FC<{ params: BearingParameters; result: BearingAnalysisResult }> = ({
  params,
  result,
}) => {
  const width = 680;
  const height = 300;
  const footingCenterX = 300;
  const footingW = Math.min(220, Math.max(90, params.footingWidthM * 40));
  const footingD = Math.min(65, Math.max(26, params.embedmentDepthM * 20));
  const gradeY = 75;
  const footingBaseY = gradeY + footingD;

  const fs = result.effectiveSafetyFactor;
  const isPassingFs = fs >= 3.0;
  const isMarginalFs = fs >= 2.0 && fs < 3.0;
  const fsColor = isPassingFs ? '#10b981' : isMarginalFs ? '#f59e0b' : '#ef4444';
  const fsLabel = isPassingFs ? 'SAFE (FS ≥ 3.0)' : isMarginalFs ? 'MARGINAL (2.0 ≤ FS < 3.0)' : 'UNSAFE (FS < 2.0)';

  // Water table relative position
  const waterDepthPx = Math.min(180, params.waterTableDepthM * 25);
  const waterY = gradeY + waterDepthPx;
  const netUltKpa = Math.max(0, result.ultimateBearingKpa - params.embedmentDepthM * params.unitWeightKnPerM3);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
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
        FOUNDATION PROFILE & STRESS BULB (BOUSSINESQ ISOBARS)
      </text>

      {/* Safety Factor Indicator Card (Top Right) */}
      <g transform={`translate(${width - 240}, 10)`}>
        <rect x={0} y={0} width={220} height={52} rx={6} fill="var(--md-sys-color-surface-container-high)" stroke={fsColor} strokeWidth="1.2" />
        <circle cx={14} cy={16} r={4.5} fill={fsColor} />
        <text x={24} y={19} fontSize="10" fontWeight="700" fill={fsColor}>
          {fsLabel}
        </text>
        <text x={14} y={35} fontSize="9" fill="var(--md-sys-color-on-surface)">
          FS = {fs.toFixed(2)} · q_allow = {result.allowableBearingKpa.toFixed(1)} kPa
        </text>
        <text x={14} y={46} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
          Applied Pressure = {result.appliedPressureKpa.toFixed(1)} kPa
        </text>
      </g>

      {/* Soil Strata Layers */}
      {/* Upper Stratum (Topsoil / Overburden) */}
      <rect x={30} y={gradeY} width={500} height={footingD} fill="var(--md-sys-color-surface-container)" />
      <rect x={30} y={gradeY} width={500} height={footingD} fill="url(#soilStripe)" />

      {/* Lower Stratum (Bearing Subgrade) */}
      <rect x={30} y={footingBaseY} width={500} height={height - footingBaseY - 15} fill="var(--md-sys-color-surface-container-low)" />
      <rect x={30} y={footingBaseY} width={500} height={height - footingBaseY - 15} fill="url(#gravelPattern)" />

      {/* Finished Ground Surface Line */}
      <line x1={30} y1={gradeY} x2={530} y2={gradeY} stroke="var(--md-sys-color-on-surface)" strokeWidth="2.5" />
      <text x={34} y={gradeY - 6} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        FINISHED GRADE EL ±0.00m
      </text>

      {/* Water Table (GWT) */}
      {waterY <= height - 20 && (
        <g>
          <line x1={30} y1={waterY} x2={530} y2={waterY} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="5 3" />
          <polygon points={`38,${waterY - 7} 44,${waterY - 7} 41,${waterY}`} fill="#0ea5e9" />
          <text x={48} y={waterY - 3} fontSize="9" fontWeight="700" fill="#0ea5e9">
            GWT ∇ -{params.waterTableDepthM.toFixed(1)}m
          </text>
        </g>
      )}

      {/* Boussinesq Stress Bulbs (Concentric Isobars under Footing) */}
      {/* 0.1q Isobar */}
      <path
        d={`M ${footingCenterX - footingW * 0.85} ${footingBaseY} Q ${footingCenterX} ${footingBaseY + footingW * 1.8} ${footingCenterX + footingW * 0.85} ${footingBaseY}`}
        fill="none"
        stroke="var(--md-sys-color-primary)"
        strokeWidth="1"
        strokeOpacity="0.25"
        strokeDasharray="3 3"
      />
      <text x={footingCenterX + 4} y={footingBaseY + footingW * 1.7} fontSize="8" fill="var(--md-sys-color-primary)" fillOpacity="0.7">0.10q</text>

      {/* 0.2q Isobar */}
      <path
        d={`M ${footingCenterX - footingW * 0.7} ${footingBaseY} Q ${footingCenterX} ${footingBaseY + footingW * 1.25} ${footingCenterX + footingW * 0.7} ${footingBaseY}`}
        fill="none"
        stroke="var(--md-sys-color-primary)"
        strokeWidth="1.2"
        strokeOpacity="0.4"
        strokeDasharray="4 2"
      />
      <text x={footingCenterX + 4} y={footingBaseY + footingW * 1.2} fontSize="8" fill="var(--md-sys-color-primary)" fillOpacity="0.8">0.20q</text>

      {/* 0.5q Isobar */}
      <path
        d={`M ${footingCenterX - footingW * 0.55} ${footingBaseY} Q ${footingCenterX} ${footingBaseY + footingW * 0.75} ${footingCenterX + footingW * 0.55} ${footingBaseY}`}
        fill="var(--md-sys-color-primary)"
        fillOpacity="0.08"
        stroke="var(--md-sys-color-primary)"
        strokeWidth="1.5"
        strokeOpacity="0.7"
      />
      <text x={footingCenterX + 4} y={footingBaseY + footingW * 0.7} fontSize="8" fontWeight="600" fill="var(--md-sys-color-primary)">0.50q</text>

      {/* 0.9q Isobar */}
      <path
        d={`M ${footingCenterX - footingW * 0.38} ${footingBaseY} Q ${footingCenterX} ${footingBaseY + footingW * 0.35} ${footingCenterX + footingW * 0.38} ${footingBaseY}`}
        fill="var(--md-sys-color-primary)"
        fillOpacity="0.16"
        stroke="var(--md-sys-color-primary)"
        strokeWidth="1.8"
      />
      <text x={footingCenterX + 4} y={footingBaseY + footingW * 0.32} fontSize="8" fontWeight="700" fill="var(--md-sys-color-primary)">0.90q</text>

      {/* Column Stub */}
      <rect x={footingCenterX - 18} y={30} width={36} height={gradeY - 30 + footingD - 18} fill="var(--md-sys-color-surface-container-highest)" stroke="var(--md-sys-color-outline)" strokeWidth="1.5" />

      {/* Applied Column Load Arrow */}
      <line x1={footingCenterX} y1={12} x2={footingCenterX} y2={28} stroke="var(--md-sys-color-tertiary)" strokeWidth="3" />
      <polygon points={`${footingCenterX - 4},24 ${footingCenterX + 4},24 ${footingCenterX},30`} fill="var(--md-sys-color-tertiary)" />
      <text x={footingCenterX + 8} y={20} fontSize="9" fontWeight="700" fill="var(--md-sys-color-tertiary)">
        P_col
      </text>

      {/* Reinforced Concrete Footing Pad */}
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

      {/* Depth Dimension D_f */}
      <line x1={footingCenterX + footingW / 2 + 15} y1={gradeY} x2={footingCenterX + footingW / 2 + 15} y2={footingBaseY} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
      <polyline points={`${footingCenterX + footingW / 2 + 12},${gradeY + 4} ${footingCenterX + footingW / 2 + 15},${gradeY} ${footingCenterX + footingW / 2 + 18},${gradeY + 4}`} fill="none" stroke="var(--md-sys-color-outline)" strokeWidth="1" />
      <polyline points={`${footingCenterX + footingW / 2 + 12},${footingBaseY - 4} ${footingCenterX + footingW / 2 + 15},${footingBaseY} ${footingCenterX + footingW / 2 + 18},${footingBaseY - 4}`} fill="none" stroke="var(--md-sys-color-outline)" strokeWidth="1" />
      <text x={footingCenterX + footingW / 2 + 22} y={gradeY + footingD / 2 + 3} fontSize="9" fill="var(--md-sys-color-on-surface)">
        D_f = {params.embedmentDepthM.toFixed(1)}m
      </text>

      {/* Footing Width Dimension B */}
      <line x1={footingCenterX - footingW / 2} y1={footingBaseY + 6} x2={footingCenterX + footingW / 2} y2={footingBaseY + 6} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
      <text x={footingCenterX} y={footingBaseY + 18} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-on-surface)">
        B = {params.footingWidthM.toFixed(2)}m
      </text>

      {/* Geotechnical Parameters Tag */}
      <g transform="translate(545, 80)">
        <rect x={0} y={0} width={125} height={190} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
        <text x={10} y={20} fontSize="9" fontWeight="700" fill="var(--md-sys-color-on-surface)">SOIL PARAMS</text>
        <text x={10} y={38} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">c = {params.soilCohesionKpa} kPa</text>
        <text x={10} y={54} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">φ = {params.frictionAngleDeg}°</text>
        <text x={10} y={70} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">γ = {params.unitWeightKnPerM3} kN/m³</text>
        <line x1={10} y1={82} x2={115} y2={82} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
        <text x={10} y={98} fontSize="9" fontWeight="700" fill="var(--md-sys-color-primary)">BEARING CAPACITY</text>
        <text x={10} y={114} fontSize="8" fill="var(--md-sys-color-on-surface)">q_ult: {result.ultimateBearingKpa.toFixed(0)} kPa</text>
        <text x={10} y={128} fontSize="8" fill="var(--md-sys-color-on-surface)">q_net: {netUltKpa.toFixed(0)} kPa</text>
        <text x={10} y={142} fontSize="8" fontWeight="600" fill="var(--md-sys-color-primary)">q_all: {result.allowableBearingKpa.toFixed(0)} kPa</text>
        <line x1={10} y1={154} x2={115} y2={154} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
        <text x={10} y={170} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Water Submergence:</text>
        <text x={10} y={182} fontSize="8" fontWeight="600" fill={waterDepthPx < footingD ? '#0ea5e9' : 'var(--md-sys-color-on-surface)'}>
          {params.waterTableDepthM <= params.embedmentDepthM ? 'Active Surcharge' : 'Deep (No Red.)'}
        </text>
      </g>
    </svg>
  );
};

/* 3. ACI 211 Concrete Mix Diagram */
export const ConcreteMixSvg: React.FC<{ params: ConcreteMixParameters; result: ConcreteMixResult }> = ({
  params,
  result,
}) => {
  const total = result.totalDensityKgPerM3;
  const wPct = (result.waterKgPerM3 / total) * 100;
  const cPct = (result.cementKgPerM3 / total) * 100;
  const fPct = (result.fineAggKgPerM3 / total) * 100;
  const gPct = (result.coarseAggKgPerM3 / total) * 100;

  const segments = [
    { label: 'Cement', kg: result.cementKgPerM3, pct: cPct, color: 'var(--md-sys-color-primary)' },
    { label: 'Water', kg: result.waterKgPerM3, pct: wPct, color: 'var(--md-sys-color-secondary)' },
    { label: 'Fine Sand', kg: result.fineAggKgPerM3, pct: fPct, color: 'var(--md-sys-color-tertiary)' },
    { label: 'Coarse Agg', kg: result.coarseAggKgPerM3, pct: gPct, color: 'var(--md-sys-color-on-surface-variant)' },
  ];

  let cursorX = 40;
  const barWidth = 600;

  return (
    <svg viewBox="0 0 680 220" className="w-full h-auto select-none font-mono" role="img">
      <text x={40} y={28} fontSize="11" fontWeight="600" fill="var(--md-sys-color-on-surface)">
        GRAVIMETRIC CONSTITUENT PROPORTIONS (TOTAL = {total.toFixed(0)} kg/m³ · W/C = {params.waterCementRatio.toFixed(2)})
      </text>

      {segments.map((seg) => {
        const w = (seg.pct / 100) * barWidth;
        const x = cursorX;
        cursorX += w;
        return (
          <g key={seg.label}>
            <rect x={x} y={44} width={Math.max(2, w - 2)} height={46} rx={4} fill={seg.color} />
          </g>
        );
      })}

      {segments.map((seg, i) => {
        const cardX = 40 + i * 152;
        return (
          <g key={seg.label}>
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
  );
};

/* 4. Open Channel Hydraulics Diagram with Flow Regime & Freeboard */
export const ChannelHydraulicsSvg: React.FC<{ params: ChannelParameters; result: ChannelHydraulicsResult }> = ({
  params,
  result,
}) => {
  const width = 680;
  const height = 250;
  const centerX = 290;
  const bedY = 195;
  const totalDepth = params.flowDepthM + params.freeboardRequirementM;
  const topWidthTotal = params.bottomWidthM + 2 * params.sideSlopeZ * totalDepth;
  const scale = Math.min(110 / Math.max(0.5, totalDepth), 350 / Math.max(1, topWidthTotal));

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

  // Flow regime styling
  const fr = result.froudeNumber;
  const isSubcritical = fr < 1;
  const isCritical = Math.abs(fr - 1.0) < 0.05;
  const regimeColor = isCritical ? '#f59e0b' : isSubcritical ? '#0ea5e9' : '#ec4899';
  const regimeLabel = isCritical ? 'CRITICAL FLOW (Fr ≈ 1.0)' : isSubcritical ? 'SUBCRITICAL (Tranquil, Fr < 1)' : 'SUPERCRITICAL (Rapid, Fr > 1)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <defs>
        <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Header & Flow Regime Badge */}
      <text x={24} y={24} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface-variant)">
        MANNING HYDRAULIC GEOMETRY & FLOW REGIME
      </text>

      {/* Regime Badge */}
      <g transform={`translate(${width - 270}, 10)`}>
        <rect x={0} y={0} width={250} height={26} rx={4} fill={regimeColor} fillOpacity="0.12" stroke={regimeColor} strokeWidth="1" />
        <circle cx={14} cy={13} r={4} fill={regimeColor} />
        <text x={24} y={16} fontSize="9" fontWeight="700" fill={regimeColor}>
          {regimeLabel}
        </text>
      </g>

      {/* Channel Bed & Banks */}
      <polyline fill="none" stroke="var(--md-sys-color-on-surface)" strokeWidth="3" points={channelPolyline} />

      {/* Flow Body */}
      <polygon points={waterPolygon} fill="url(#waterGrad)" stroke="#0ea5e9" strokeWidth="1.8" />

      {/* Water Surface Wave Motif */}
      <line x1={centerX - waterTopHalfPx} y1={bedY - yPx} x2={centerX + waterTopHalfPx} y2={bedY - yPx} stroke="#0ea5e9" strokeWidth="2" strokeDasharray="6 3" />

      {/* Water Depth y Dimension */}
      <line x1={centerX - waterTopHalfPx - 18} y1={bedY - yPx} x2={centerX - waterTopHalfPx - 18} y2={bedY} stroke="#0ea5e9" strokeWidth="1.2" />
      <polyline points={`${centerX - waterTopHalfPx - 21},${bedY - yPx + 4} ${centerX - waterTopHalfPx - 18},${bedY - yPx} ${centerX - waterTopHalfPx - 15},${bedY - yPx + 4}`} fill="none" stroke="#0ea5e9" strokeWidth="1.2" />
      <polyline points={`${centerX - waterTopHalfPx - 21},${bedY - 4} ${centerX - waterTopHalfPx - 18},${bedY} ${centerX - waterTopHalfPx - 15},${bedY - 4}`} fill="none" stroke="#0ea5e9" strokeWidth="1.2" />
      <text x={centerX - waterTopHalfPx - 24} y={bedY - yPx / 2 + 3} textAnchor="end" fontSize="9" fontWeight="600" fill="#0ea5e9">
        y = {params.flowDepthM.toFixed(2)}m
      </text>

      {/* Freeboard Dimension */}
      {params.freeboardRequirementM > 0 && (
        <g>
          <line x1={centerX + bankTopHalfPx + 15} y1={bedY - totalDepthPx} x2={centerX + bankTopHalfPx + 15} y2={bedY - yPx} stroke="var(--md-sys-color-tertiary)" strokeWidth="1.2" />
          <text x={centerX + bankTopHalfPx + 20} y={bedY - yPx - (totalDepthPx - yPx) / 2 + 3} fontSize="8" fontWeight="600" fill="var(--md-sys-color-tertiary)">
            FB: {params.freeboardRequirementM.toFixed(2)}m
          </text>
        </g>
      )}

      {/* Bottom Width Dimension */}
      <line x1={centerX - bPx / 2} y1={bedY + 12} x2={centerX + bPx / 2} y2={bedY + 12} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
      <text x={centerX} y={bedY + 24} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-on-surface)">
        Bed b = {params.bottomWidthM.toFixed(2)}m (Side Slope 1:{params.sideSlopeZ})
      </text>

      {/* Hydraulic Metrics Summary Card (Right Inset) */}
      <g transform={`translate(${width - 170}, 48)`}>
        <rect x={0} y={0} width={150} height={180} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
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
  );
};

/* 5. Concrete Materials Diagram (BNBC 2020 / ACI 318 / IS 456) */
export const ConcreteMaterialsDiagramSvg: React.FC<{ params: ConcreteMaterialParameters; result: ConcreteMaterialResult }> = ({
  result,
}) => {
  const width = 680;
  const height = 240;
  const barW = 580;
  const startX = 50;

  const cPct = (result.cementVolumeM3 / result.totalDryVolumeWithWastageM3) * 100;
  const sPct = (result.sandVolumeM3 / result.totalDryVolumeWithWastageM3) * 100;
  const aPct = (result.aggregateVolumeM3 / result.totalDryVolumeWithWastageM3) * 100;

  const wC = (cPct / 100) * barW;
  const wS = (sPct / 100) * barW;
  const wA = (aPct / 100) * barW;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <text x={50} y={28} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        VOLUMETRIC DRY CONSTITUENT DISTRIBUTION ({result.code} · Dry Factor {result.dryVolumeFactor})
      </text>

      <g transform="translate(0, 42)">
        <rect x={startX} y={0} width={Math.max(4, wC - 2)} height={42} rx={4} fill="var(--md-sys-color-primary)" />
        <rect x={startX + wC} y={0} width={Math.max(4, wS - 2)} height={42} rx={4} fill="var(--md-sys-color-tertiary)" />
        <rect x={startX + wC + wS} y={0} width={Math.max(4, wA - 2)} height={42} rx={4} fill="var(--md-sys-color-secondary)" />
      </g>

      <g transform="translate(50, 105)">
        <rect x={0} y={0} width={180} height={95} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={14} y={24} fontSize="10" fontWeight="600" fill="var(--md-sys-color-primary)">CEMENT ({result.cementBags50Kg.toFixed(1)} BAGS)</text>
        <text x={14} y={50} fontSize="16" fontWeight="700" fill="var(--md-sys-color-on-surface)">{result.cementMassKg.toFixed(0)} kg</text>
        <text x={14} y={74} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">Vol: {result.cementVolumeM3.toFixed(2)} m³</text>

        <rect x={200} y={0} width={180} height={95} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={214} y={24} fontSize="10" fontWeight="600" fill="var(--md-sys-color-tertiary)">FINE AGGREGATE / SAND</text>
        <text x={214} y={50} fontSize="16" fontWeight="700" fill="var(--md-sys-color-on-surface)">{result.sandCft.toFixed(1)} cft</text>
        <text x={214} y={74} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">Vol: {result.sandVolumeM3.toFixed(2)} m³ ({result.sandMassKg.toFixed(0)} kg)</text>

        <rect x={400} y={0} width={180} height={95} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={414} y={24} fontSize="10" fontWeight="600" fill="var(--md-sys-color-secondary)">COARSE AGGREGATE</text>
        <text x={414} y={50} fontSize="16" fontWeight="700" fill="var(--md-sys-color-on-surface)">{result.aggregateCft.toFixed(1)} cft</text>
        <text x={414} y={74} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">Vol: {result.aggregateVolumeM3.toFixed(2)} m³ ({result.aggregateMassKg.toFixed(0)} kg)</text>
      </g>
    </svg>
  );
};

/* 6. Rebar BBS Diagram with Bar Marks & Seismic Hook Detailing */
export const RebarBBSDiagramSvg: React.FC<{ params: RebarBBSParameters; result: RebarBBSResult }> = ({
  params,
  result,
}) => {
  const width = 680;
  const height = 240;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      {/* Title */}
      <text x={30} y={24} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        STRUCTURAL REBAR BBS CUTTING ENVELOPE ({params.elementType.toUpperCase()} · COVER: {params.clearCoverMm}mm)
      </text>

      {params.elementType === 'slab' && (
        <g transform="translate(35, 45)">
          <rect x={0} y={0} width={340} height={140} rx={4} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" />
          {/* Main Bottom Reinforcement */}
          {[25, 55, 85, 115].map((y, i) => (
            <g key={i}>
              <line x1={15} y1={y} x2={325} y2={y} stroke="var(--md-sys-color-primary)" strokeWidth="2.8" />
              {/* Crank / Bend at edges */}
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
        <g transform="translate(120, 45)">
          <rect x={0} y={0} width={150} height={150} rx={4} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" strokeWidth="2" />
          {/* 135-deg Seismic Tie */}
          <rect x={18} y={18} width={114} height={114} rx={3} fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2.2" />
          <polyline points="22,22 14,30 20,38" fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2.2" />
          {/* Longitudinal Rebars */}
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
        <g transform="translate(120, 45)">
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
        <g transform="translate(60, 45)">
          <rect x={0} y={0} width={290} height={140} rx={4} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" />
          {[22, 55, 88, 120].map((y, i) => (
            <line key={i} x1={12} y1={y} x2={278} y2={y} stroke="var(--md-sys-color-primary)" strokeWidth="2.5" />
          ))}
          {[30, 85, 140, 195, 250].map((x, i) => (
            <line key={i} x1={x} y1={12} x2={x} y2={128} stroke="var(--md-sys-color-tertiary)" strokeWidth="2.5" />
          ))}
          <text x={145} y={155} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-primary)">
            MK-01: Bi-directional mesh Ø{params.footingBarDiaMm || 12} @ {params.footingBarSpacingMm || 150}mm c/c
          </text>
        </g>
      )}

      {params.elementType === 'staircase-waist' && (
        <g transform="translate(50, 45)">
          <polyline points="0,130 180,45 290,45 290,15 180,15 0,100" fill="var(--md-sys-color-surface-container-high)" stroke="var(--md-sys-color-outline)" strokeWidth="1.5" />
          <line x1={8} y1={115} x2={285} y2={30} stroke="var(--md-sys-color-primary)" strokeWidth="3" />
          <text x={140} y={155} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--md-sys-color-primary)">
            Waist Slab Reinforcement: Main Ø{params.stairMainBarDiaMm || 12} tension bottom
          </text>
        </g>
      )}

      {/* Bill of Quantities / Rebar Summary Card */}
      <g transform="translate(420, 45)">
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
  );
};

/* 7. Masonry Diagram */
export const MasonryDiagramSvg: React.FC<{ params: MasonryParameters; result: MasonryResult }> = ({
  result,
}) => {
  const width = 680;
  const height = 230;
  const wallW = 360;
  const wallH = 130;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <text x={40} y={26} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        MASONRY WALL ELEVATION & OPENING DEDUCTIONS (NET AREA: {result.netWallAreaM2} m²)
      </text>

      <g transform="translate(50, 44)">
        <rect x={0} y={0} width={wallW} height={wallH} fill="var(--md-sys-color-tertiary-container)" stroke="var(--md-sys-color-tertiary)" strokeWidth="2" />
        <rect x={35} y={40} width={50} height={90} fill="var(--md-sys-color-surface)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.5" />
        <text x={42} y={85} fontSize="9" fontWeight="600" fill="var(--md-sys-color-on-surface)">DOOR</text>
        <rect x={160} y={35} width={70} height={55} fill="var(--md-sys-color-surface)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.5" />
        <text x={172} y={65} fontSize="9" fontWeight="600" fill="var(--md-sys-color-on-surface)">WINDOW</text>
      </g>

      <g transform="translate(440, 44)">
        <rect x={0} y={0} width={190} height={130} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={14} y={24} fontSize="10" fontWeight="600" fill="var(--md-sys-color-tertiary)">BRICK ESTIMATOR</text>
        <text x={14} y={52} fontSize="20" fontWeight="700" fill="var(--md-sys-color-on-surface)">{result.bricksWithWastageCount} Nos</text>
        <text x={14} y={76} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">Mortar: {result.mortarCementBags50Kg.toFixed(1)} Bags</text>
        <text x={14} y={98} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">Sand: {result.mortarSandCft.toFixed(1)} cft</text>
        <text x={14} y={120} fontSize="10" fill="var(--md-sys-color-primary)">Plaster: {result.plasterCementBags.toFixed(1)} Bags</text>
      </g>
    </svg>
  );
};

/* 8. Earthwork Diagram */
export const EarthworkDiagramSvg: React.FC<{ params: EarthworkParameters; result: EarthworkResult }> = ({
  result,
}) => {
  const width = 680;
  const height = 230;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <text x={40} y={26} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        SOIL VOLUME STATE TRANSITION (BANK → LOOSE → COMPACTED · {result.soilClassification.toUpperCase()})
      </text>

      <g transform="translate(50, 50)">
        <rect x={0} y={20} width={160} height={100} rx={6} fill="var(--md-sys-color-surface-container-high)" stroke="var(--md-sys-color-outline)" />
        <text x={14} y={44} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">BANK (IN-SITU)</text>
        <text x={14} y={76} fontSize="18" fontWeight="700" fill="var(--md-sys-color-on-surface)">{result.bankVolumeM3.toFixed(1)} m³</text>
        <text x={14} y={102} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">Factor: 1.00 (Base)</text>

        <rect x={200} y={0} width={170} height={120} rx={6} fill="var(--md-sys-color-tertiary-container)" stroke="var(--md-sys-color-tertiary)" strokeWidth="1.5" />
        <text x={214} y={28} fontSize="10" fontWeight="600" fill="var(--md-sys-color-tertiary)">LOOSE (SWELLED)</text>
        <text x={214} y={64} fontSize="20" fontWeight="700" fill="var(--md-sys-color-tertiary)">{result.looseVolumeM3.toFixed(1)} m³</text>
        <text x={214} y={90} fontSize="11" fill="var(--md-sys-color-on-surface)">Swell: {((result.swellFactor - 1) * 100).toFixed(0)}%</text>
        <text x={214} y={110} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface)">{result.haulTruckTripsCount10M3} Trucks (10m³)</text>

        <rect x={410} y={35} width={160} height={85} rx={6} fill="var(--md-sys-color-primary-container)" stroke="var(--md-sys-color-primary)" />
        <text x={424} y={58} fontSize="10" fontWeight="600" fill="var(--md-sys-color-primary)">COMPACTED (FILL)</text>
        <text x={424} y={88} fontSize="18" fontWeight="700" fill="var(--md-sys-color-primary)">{result.compactedVolumeM3.toFixed(1)} m³</text>
        <text x={424} y={108} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">Factor: {(result.shrinkageFactor * 100).toFixed(0)}%</text>
      </g>
    </svg>
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
  const width = 680;
  const height = 210;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <text x={40} y={28} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        HIGH-PRECISION CONVERSION VECTOR ({category.toUpperCase()})
      </text>

      <g transform="translate(50, 48)">
        {/* Source Box */}
        <rect x={0} y={0} width={240} height={110} rx={8} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={16} y={28} fontSize="11" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">INPUT VALUE ({fromUnit.toUpperCase()})</text>
        <text x={16} y={64} fontSize="24" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          {inputVal} <span className="text-sm font-normal">{fromUnit}</span>
        </text>
        <text x={16} y={92} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">Civil Engineering Source Unit</text>

        {/* Center Arrow */}
        <g transform="translate(260, 40)">
          <line x1={0} y1={15} x2={55} y2={15} stroke="var(--md-sys-color-primary)" strokeWidth="3" />
          <polygon points="50,8 65,15 50,22" fill="var(--md-sys-color-primary)" />
        </g>

        {/* Target Box */}
        <rect x={340} y={0} width={240} height={110} rx={8} fill="var(--md-sys-color-primary-container)" stroke="var(--md-sys-color-primary)" />
        <text x={356} y={28} fontSize="11" fontWeight="600" fill="var(--md-sys-color-on-primary-container)">CONVERTED EQUIVALENT ({toUnit.toUpperCase()})</text>
        <text x={356} y={64} fontSize="24" fontWeight="700" fill="var(--md-sys-color-on-primary-container)">
          {Number(outputVal.toFixed(4))} <span className="text-sm font-normal">{toUnit}</span>
        </text>
        <text x={356} y={92} fontSize="10" fill="var(--md-sys-color-on-primary-container)">High-Precision IEEE 754 Conversion</text>
      </g>
    </svg>
  );
};

/* 10. BOQ Cost Breakdown Diagram */
export const BOQCostBreakdownDiagramSvg: React.FC<{
  params: BOQParameters;
  result: BOQResult;
}> = ({ params, result }) => {
  const width = 680;
  const height = 290;

  const sym = result.currencySymbol;
  const grandTotal = Math.max(1, result.grandTotalAmount);

  // Stacked bar proportions
  const subtotalWidth = (result.subtotalAmount / grandTotal) * 580;
  const contWidth = (result.contingencyAmount / grandTotal) * 580;
  const cpWidth = (result.contractorOverheadAmount / grandTotal) * 580;
  const vatWidth = (result.vatTaxAmount / grandTotal) * 580;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <text x={40} y={28} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        PROJECT BILL OF QUANTITIES (BOQ) COST STRUCTURE ({result.currency})
      </text>

      {/* Grand Total Hero Box */}
      <g transform="translate(40, 42)">
        <rect x={0} y={0} width={260} height={70} rx={8} fill="var(--md-sys-color-primary-container)" stroke="var(--md-sys-color-primary)" strokeWidth="1.5" />
        <text x={14} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-primary-container)">GRAND TOTAL ESTIMATE</text>
        <text x={14} y={48} fontSize="20" fontWeight="800" fill="var(--md-sys-color-on-primary-container)">
          {sym} {result.grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </text>
        <text x={14} y={62} fontSize="9" fill="var(--md-sys-color-on-primary-container)">Includes Markups & Taxes</text>

        {/* Subtotal Box */}
        <rect x={275} y={0} width={150} height={70} rx={8} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={287} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">BASE TAKEOFF</text>
        <text x={287} y={46} fontSize="14" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          {sym} {result.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </text>
        <text x={287} y={60} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">{result.totalItemCount} Line Items</text>

        {/* CP&OH + VAT Box */}
        <rect x={438} y={0} width={162} height={70} rx={8} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={450} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">OVERHEAD & VAT</text>
        <text x={450} y={46} fontSize="14" fontWeight="700" fill="var(--md-sys-color-tertiary)">
          {sym} {(result.contractorOverheadAmount + result.vatTaxAmount + result.contingencyAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </text>
        <text x={450} y={60} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">CP&OH + Cont. + VAT</text>
      </g>

      {/* Stacked Proportional Bar */}
      <g transform="translate(40, 130)">
        <text x={0} y={-8} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">
          PROPORTIONAL CAPITAL DISTRIBUTION
        </text>
        <rect x={0} y={0} width={580} height={22} rx={4} fill="var(--md-sys-color-surface-container-high)" />

        {/* Subtotal Segment */}
        <rect x={0} y={0} width={Math.max(2, subtotalWidth)} height={22} rx={4} fill="var(--md-sys-color-primary)" />
        {/* Contingency Segment */}
        <rect x={subtotalWidth} y={0} width={Math.max(0, contWidth)} height={22} fill="var(--md-sys-color-tertiary)" />
        {/* CP&OH Segment */}
        <rect x={subtotalWidth + contWidth} y={0} width={Math.max(0, cpWidth)} height={22} fill="#eab308" />
        {/* VAT Segment */}
        <rect x={subtotalWidth + contWidth + cpWidth} y={0} width={Math.max(0, vatWidth)} height={22} fill="#ef4444" />
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
          <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">Overhead & Profit: {((result.contractorOverheadAmount / grandTotal) * 100).toFixed(1)}%</text>
        </g>
        <g transform="translate(500, 0)">
          <rect x={0} y={0} width={10} height={10} rx={2} fill="#ef4444" />
          <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">Tax/VAT: {((result.vatTaxAmount / grandTotal) * 100).toFixed(1)}%</text>
        </g>
      </g>

      {/* Top 3 Cost Drivers */}
      <g transform="translate(40, 210)">
        <text x={0} y={0} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          MAJOR TRADE CATEGORIES
        </text>
        <g transform="translate(0, 10)">
          {result.categorySummaries.slice(0, 4).map((cat, i) => (
            <g key={cat.category} transform={`translate(${i * 145}, 0)`}>
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
  );
};

/* 11. Granular Rate Analysis Breakdown Diagram */
export const RateAnalysisBreakdownDiagramSvg: React.FC<{
  params: RateAnalysisParameters;
  result: RateAnalysisResult;
}> = ({ params, result }) => {
  const width = 680;
  const height = 290;

  const sym = result.currencySymbol;
  const dist = result.costDistributionPercent;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <text x={40} y={28} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        GRANULAR UNIT RATE ANALYSIS — {result.workType.toUpperCase()} ({result.basisVolumeM3} m³)
      </text>

      {/* Rate Highlight Cards */}
      <g transform="translate(40, 42)">
        <rect x={0} y={0} width={260} height={70} rx={8} fill="var(--md-sys-color-primary-container)" stroke="var(--md-sys-color-primary)" strokeWidth="1.5" />
        <text x={14} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-primary-container)">UNIT RATE PER m³</text>
        <text x={14} y={48} fontSize="20" fontWeight="800" fill="var(--md-sys-color-on-primary-container)">
          {sym} {result.unitRatePerM3.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-xs font-normal"> / m³</span>
        </text>
        <text x={14} y={62} fontSize="9" fill="var(--md-sys-color-on-primary-container)">Authoritative Standard Composite Rate</text>

        {/* CFT Equivalent Card */}
        <rect x={275} y={0} width={150} height={70} rx={8} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={287} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">RATE PER CFT (ft³)</text>
        <text x={287} y={46} fontSize="15" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          {sym} {result.unitRatePerCft.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-xs font-normal"> / cft</span>
        </text>
        <text x={287} y={60} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">1 m³ = 35.315 CFT</text>

        {/* Contractor Margin Card */}
        <rect x={438} y={0} width={162} height={70} rx={8} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={450} y={22} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">PROFIT & OVERHEAD</text>
        <text x={450} y={46} fontSize="15" fontWeight="700" fill="var(--md-sys-color-tertiary)">
          {sym} {result.contractorProfitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </text>
        <text x={450} y={60} fontSize="9" fill="var(--md-sys-color-on-surface-variant)">{params.contractorProfitPercent}% Margin Added</text>
      </g>

      {/* Stacked Cost Distribution Bar */}
      <g transform="translate(40, 130)">
        <text x={0} y={-8} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">
          COMPOSITE COST FACTOR BREAKDOWN
        </text>
        <rect x={0} y={0} width={580} height={22} rx={4} fill="var(--md-sys-color-surface-container-high)" />

        {/* Materials */}
        <rect x={0} y={0} width={(dist.materials / 100) * 580} height={22} rx={4} fill="var(--md-sys-color-primary)" />
        {/* Labor */}
        <rect x={(dist.materials / 100) * 580} y={0} width={(dist.labor / 100) * 580} height={22} fill="var(--md-sys-color-tertiary)" />
        {/* Equipment */}
        <rect x={((dist.materials + dist.labor) / 100) * 580} y={0} width={(dist.equipment / 100) * 580} height={22} fill="#3b82f6" />
        {/* Profit */}
        <rect x={((dist.materials + dist.labor + dist.equipment + dist.waterElectricity) / 100) * 580} y={0} width={(dist.contractorProfit / 100) * 580} height={22} fill="#eab308" />
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
          <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">Plant & Formwork: {dist.equipment}%</text>
        </g>
        <g transform="translate(510, 0)">
          <rect x={0} y={0} width={10} height={10} rx={2} fill="#eab308" />
          <text x={16} y={9} fontSize="10" fill="var(--md-sys-color-on-surface)">CP&OH: {dist.contractorProfit}%</text>
        </g>
      </g>

      {/* Prime Cost Summary */}
      <g transform="translate(40, 210)">
        <rect x={0} y={0} width={580} height={50} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={16} y={20} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
          PRIME COST FORMULA:
        </text>
        <text x={16} y={38} fontSize="11" fill="var(--md-sys-color-on-surface-variant)">
          Prime = {sym}{result.materialsCost.toLocaleString()} (Mat) + {sym}{result.laborsCost.toLocaleString()} (Lab) + {sym}{result.equipmentCost.toLocaleString()} (Equip) = <tspan fontWeight="700" fill="var(--md-sys-color-on-surface)">{sym}{result.primeCost.toLocaleString()}</tspan>
        </text>
      </g>
    </svg>
  );
};

/* 12. Continuous Beam Diagram (Multi-Span BMD & SFD Envelopes) */
export const ContinuousBeamDiagramSvg: React.FC<{
  params: ContinuousBeamParameters;
  result: ContinuousBeamResult;
}> = ({ params, result }) => {
  const width = 760;
  const height = 380;
  const padLeft = 60;
  const padRight = 40;
  const plotW = width - padLeft - padRight;
  const totalL = Math.max(0.1, result.totalLengthM);

  const toX = (xM: number) => padLeft + (xM / totalL) * plotW;

  const maxV = Math.max(0.1, result.maxShearKn);
  const maxM = Math.max(0.1, Math.max(result.maxSaggingMomentKnm, result.maxHoggingMomentKnm));

  // Shear plot vertical center & amplitude
  const sfdCenterY = 175;
  const sfdAmp = 45;

  // Moment plot vertical center & amplitude (Hogging is negative, drawn upwards or standard)
  const bmdCenterY = 300;
  const bmdAmp = 50;

  const sfdPoints = result.points
    .map((pt) => `${toX(pt.xTotal).toFixed(1)},${(sfdCenterY - (pt.shearKn / maxV) * sfdAmp).toFixed(1)}`)
    .join(' ');

  const bmdPoints = result.points
    .map((pt) => `${toX(pt.xTotal).toFixed(1)},${(bmdCenterY - (pt.momentKnm / maxM) * bmdAmp).toFixed(1)}`)
    .join(' ');

  // Calculate support X positions
  const supportPositions: number[] = [padLeft];
  let accX = 0;
  for (const span of result.spans) {
    accX += span.lengthM;
    supportPositions.push(toX(accX));
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      {/* 1. Beam Elevation, Applied Loads & Supports */}
      <text x={12} y={35} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        LOADS &amp; SPANS
      </text>

      {/* Beam Axis Line */}
      <line x1={padLeft} y1={70} x2={padLeft + plotW} y2={70} stroke="var(--md-sys-color-primary)" strokeWidth="5" strokeLinecap="round" />

      {/* Spans and Loads */}
      {result.spans.map((span, idx) => {
        const xStart = supportPositions[idx];
        const xEnd = supportPositions[idx + 1];
        const spanW = xEnd - xStart;
        const spanDef = params.spans[idx];

        return (
          <g key={`span-load-${idx}`}>
            {/* UDL representation */}
            {spanDef && spanDef.udlKnPerM > 0 && (
              <g>
                <rect x={xStart} y={48} width={spanW} height={18} fill="var(--md-sys-color-primary)" opacity="0.12" />
                <line x1={xStart} y1={48} x2={xEnd} y2={48} stroke="var(--md-sys-color-primary)" strokeWidth="1" strokeDasharray="3 2" />
                {Array.from({ length: Math.max(3, Math.floor(spanW / 24)) }).map((_, arrIdx) => {
                  const arrX = xStart + (arrIdx + 0.5) * (spanW / Math.max(3, Math.floor(spanW / 24)));
                  return (
                    <line key={arrIdx} x1={arrX} y1={48} x2={arrX} y2={67} stroke="var(--md-sys-color-primary)" strokeWidth="1" markerEnd="url(#arrow)" />
                  );
                })}
                <text x={xStart + spanW / 2} y={44} fontSize="8.5" fontWeight="600" textAnchor="middle" fill="var(--md-sys-color-primary)">
                  w = {spanDef.udlKnPerM} kN/m
                </text>
              </g>
            )}

            {/* Point load */}
            {spanDef && spanDef.pointLoadKn > 0 && (
              <g>
                {(() => {
                  const ptX = xStart + ((spanDef.pointLoadPositionM || span.lengthM / 2) / span.lengthM) * spanW;
                  return (
                    <g>
                      <line x1={ptX} y1={28} x2={ptX} y2={66} stroke="#f43f5e" strokeWidth="2.5" />
                      <polygon points={`${ptX},70 ${ptX - 4},62 ${ptX + 4},62`} fill="#f43f5e" />
                      <text x={ptX} y={24} fontSize="8.5" fontWeight="700" textAnchor="middle" fill="#f43f5e">
                        P={spanDef.pointLoadKn} kN
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Span length dimension line */}
            <line x1={xStart} y1={92} x2={xEnd} y2={92} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
            <line x1={xStart} y1={88} x2={xStart} y2={96} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
            <line x1={xEnd} y1={88} x2={xEnd} y2={96} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
            <text x={xStart + spanW / 2} y={102} fontSize="9" fontWeight="600" textAnchor="middle" fill="var(--md-sys-color-on-surface-variant)">
              Span {idx + 1}: L = {span.lengthM}m
            </text>
          </g>
        );
      })}

      {/* Support Triangles & Reactions */}
      {supportPositions.map((supX, sIdx) => {
        const reaction = result.supportReactionsKn[sIdx] || 0;
        const isLeftFixed = sIdx === 0 && params.leftSupport === 'fixed';
        const isRightFixed = sIdx === supportPositions.length - 1 && params.rightSupport === 'fixed';

        return (
          <g key={`sup-${sIdx}`}>
            {isLeftFixed ? (
              <line x1={supX} y1={55} x2={supX} y2={85} stroke="var(--md-sys-color-on-surface)" strokeWidth="4" />
            ) : isRightFixed ? (
              <line x1={supX} y1={55} x2={supX} y2={85} stroke="var(--md-sys-color-on-surface)" strokeWidth="4" />
            ) : (
              <polygon points={`${supX},72 ${supX - 7},86 ${supX + 7},86`} fill="var(--md-sys-color-surface-container-highest)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.5" />
            )}
            <text x={supX} y={116} fontSize="8" fontWeight="700" textAnchor="middle" fill="var(--md-sys-color-primary)">
              R{sIdx}={reaction.toFixed(1)}kN
            </text>
          </g>
        );
      })}

      {/* 2. Continuous Shear Force Diagram (SFD) */}
      <text x={12} y={sfdCenterY - 20} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        SFD (kN)
      </text>
      <line x1={padLeft} y1={sfdCenterY} x2={padLeft + plotW} y2={sfdCenterY} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
      <polyline points={sfdPoints} fill="none" stroke="#0ea5e9" strokeWidth="2" />
      <polygon points={`${padLeft},${sfdCenterY} ${sfdPoints} ${padLeft + plotW},${sfdCenterY}`} fill="#0ea5e9" opacity="0.15" />
      <text x={padLeft + plotW + 5} y={sfdCenterY - 25} fontSize="8" fill="#0ea5e9">+{maxV.toFixed(1)}</text>
      <text x={padLeft + plotW + 5} y={sfdCenterY + 28} fontSize="8" fill="#0ea5e9">-{maxV.toFixed(1)}</text>

      {/* 3. Continuous Bending Moment Diagram (BMD) */}
      <text x={12} y={bmdCenterY - 20} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        BMD (kN·m)
      </text>
      <line x1={padLeft} y1={bmdCenterY} x2={padLeft + plotW} y2={bmdCenterY} stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" />
      <polyline points={bmdPoints} fill="none" stroke="#8b5cf6" strokeWidth="2.2" />
      <polygon points={`${padLeft},${bmdCenterY} ${bmdPoints} ${padLeft + plotW},${bmdCenterY}`} fill="#8b5cf6" opacity="0.18" />

      {/* Callouts for maximum sagging and support hogging moments */}
      <text x={padLeft + plotW + 5} y={bmdCenterY - (result.maxHoggingMomentKnm / maxM) * bmdAmp} fontSize="8" fontWeight="700" fill="#f43f5e">
        -{result.maxHoggingMomentKnm.toFixed(1)} (Hog)
      </text>
      <text x={padLeft + plotW + 5} y={bmdCenterY + (result.maxSaggingMomentKnm / maxM) * bmdAmp + 5} fontSize="8" fontWeight="700" fill="#10b981">
        +{result.maxSaggingMomentKnm.toFixed(1)} (Sag)
      </text>
    </svg>
  );
};

/* 13. Deep Foundation Pile Capacity Diagram */
export const PileCapacityDiagramSvg: React.FC<{
  params: PileCapacityParameters;
  result: PileCapacityResult;
}> = ({ params, result }) => {
  const width = 680;
  const height = 360;
  const pileLength = Math.max(1, result.lengthM);
  const pileDiameter = result.diameterM;

  const groundY = 60;
  const bottomY = 310;
  const totalH = bottomY - groundY;
  const toY = (depthM: number) => groundY + (depthM / pileLength) * totalH;

  const pileCenterX = 280;
  const pileW = Math.max(18, Math.min(45, (pileDiameter / 1.5) * 40));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      {/* Ground Surface */}
      <line x1={40} y1={groundY} x2={520} y2={groundY} stroke="#78716c" strokeWidth="3" />
      <text x={40} y={groundY - 8} fontSize="9" fontWeight="700" fill="#78716c">EGL Ground Level (0.00 m)</text>

      {/* Soil Strata Layers */}
      {result.layerContributions.map((layer, idx) => {
        const yTop = toY(layer.depthFromM);
        const yBot = toY(layer.depthToM);
        const lH = yBot - yTop;
        const isClay = layer.layerName.toLowerCase().includes('clay');
        const fillColor = isClay ? '#fef3c7' : '#ecfdf5';
        const strokeColor = isClay ? '#fde68a' : '#a7f3d0';

        return (
          <g key={`strata-${idx}`}>
            <rect x={40} y={yTop} width={480} height={lH} fill={fillColor} stroke={strokeColor} opacity="0.65" />
            <text x={48} y={yTop + 14} fontSize="8.5" fontWeight="700" fill="var(--md-sys-color-on-surface)">
              {layer.layerName}
            </text>
            <text x={48} y={yTop + 26} fontSize="7.5" fill="var(--md-sys-color-on-surface-variant)">
              Depth: {layer.depthFromM}m to {layer.depthToM}m · fs = {layer.unitFrictionKpa} kPa · Qs = {layer.frictionKn} kN
            </text>
          </g>
        );
      })}

      {/* Groundwater Table */}
      {params.groundwaterDepthM < pileLength && (
        <g>
          {(() => {
            const gwtY = toY(params.groundwaterDepthM);
            return (
              <g>
                <line x1={40} y1={gwtY} x2={520} y2={gwtY} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="6 4" />
                <text x={430} y={gwtY - 5} fontSize="8" fontWeight="700" fill="#0ea5e9">
                  ▼ GWT ({params.groundwaterDepthM.toFixed(1)} m)
                </text>
              </g>
            );
          })()}
        </g>
      )}

      {/* Pile Shaft Body */}
      <rect
        x={pileCenterX - pileW / 2}
        y={groundY}
        width={pileW}
        height={totalH}
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth="2"
        rx="2"
      />

      {/* Pile Cap / Top Working Load */}
      <rect x={pileCenterX - pileW - 6} y={groundY - 14} width={pileW * 2 + 12} height={14} fill="#64748b" rx="2" />
      <line x1={pileCenterX} y1={12} x2={pileCenterX} y2={groundY - 16} stroke="#e11d48" strokeWidth="3" markerEnd="url(#arrow)" />
      <polygon points={`${pileCenterX},${groundY - 14} ${pileCenterX - 5},${groundY - 24} ${pileCenterX + 5},${groundY - 24}`} fill="#e11d48" />
      <text x={pileCenterX} y={10} fontSize="10" fontWeight="700" textAnchor="middle" fill="#e11d48">
        P = {result.appliedLoadKn} kN
      </text>

      {/* Skin Friction Distribution Arrows */}
      {Array.from({ length: 6 }).map((_, i) => {
        const arrY = groundY + (i + 0.8) * (totalH / 7);
        return (
          <g key={`arrow-${i}`}>
            <line x1={pileCenterX - pileW / 2 - 12} y1={arrY} x2={pileCenterX - pileW / 2 - 2} y2={arrY - 6} stroke="#3b82f6" strokeWidth="1.5" />
            <line x1={pileCenterX + pileW / 2 + 12} y1={arrY} x2={pileCenterX + pileW / 2 + 2} y2={arrY - 6} stroke="#3b82f6" strokeWidth="1.5" />
          </g>
        );
      })}

      {/* End Bearing Bulb */}
      <path
        d={`M ${pileCenterX - pileW} ${bottomY} Q ${pileCenterX} ${bottomY + 35} ${pileCenterX + pileW} ${bottomY} Z`}
        fill="#f59e0b"
        opacity="0.5"
        stroke="#d97706"
        strokeWidth="1.5"
      />
      <text x={pileCenterX} y={bottomY + 22} fontSize="8" fontWeight="700" textAnchor="middle" fill="#92400e">
        qp = {result.unitEndBearingKpa} kPa
      </text>

      {/* Right Column: Capacity Summary Card */}
      <g transform="translate(540, 50)">
        <rect x={0} y={0} width={130} height={260} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={10} y={20} fontSize="9" fontWeight="700" fill="var(--md-sys-color-primary)">BEARING CAPACITY</text>

        <text x={10} y={45} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Skin Friction (Qs):</text>
        <text x={10} y={58} fontSize="11" fontWeight="700" fill="#3b82f6">{result.skinFrictionKn} kN</text>

        <text x={10} y={85} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">End Bearing (Qp):</text>
        <text x={10} y={98} fontSize="11" fontWeight="700" fill="#f59e0b">{result.endBearingKn} kN</text>

        <line x1={10} y1={112} x2={120} y2={112} stroke="var(--md-sys-color-outline-variant)" />

        <text x={10} y={128} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Ultimate Q_ult:</text>
        <text x={10} y={142} fontSize="12" fontWeight="800" fill="var(--md-sys-color-on-surface)">{result.ultimateCapacityKn} kN</text>

        <text x={10} y={165} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Allowable (FS={result.factorOfSafety}):</text>
        <text x={10} y={180} fontSize="12" fontWeight="800" fill="#10b981">{result.allowableCapacityKn} kN</text>

        <line x1={10} y1={194} x2={120} y2={194} stroke="var(--md-sys-color-outline-variant)" />

        <text x={10} y={212} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">DCR Utilization:</text>
        <text x={10} y={226} fontSize="11" fontWeight="700" fill={result.utilizationRatio <= 1 ? '#10b981' : '#f43f5e'}>
          {(result.utilizationRatio * 100).toFixed(1)}%
        </text>

        <text x={10} y={244} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Est. Settlement: <tspan fontWeight="700">{result.elasticSettlementMm}mm</tspan></text>
      </g>
    </svg>
  );
};

/* 14. Pipe Hydraulics Diagram (Hazen-Williams EGL & HGL Profile) */
export const PipeHydraulicsDiagramSvg: React.FC<{
  params: PipeHydraulicsParameters;
  result: PipeHydraulicsResult;
}> = ({ params, result }) => {
  const width = 680;
  const height = 320;
  const padLeft = 60;
  const padRight = 80;
  const plotW = width - padLeft - padRight;

  const inletY = 80;
  const outletY = 160;

  // Energy grade line (EGL) and Hydraulic grade line (HGL)
  const eglInletY = inletY - 40;
  const hglInletY = eglInletY + 12;
  const hglOutletY = hglInletY + (result.frictionHeadLossM / Math.max(1, result.totalHeadLossM || 1)) * 50;
  const eglOutletY = hglOutletY - 12;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <text x={12} y={25} fontSize="10" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        HYDRAULIC GRADE LINE (HGL) &amp; ENERGY GRADE LINE (EGL)
      </text>

      {/* Energy Grade Line (EGL) */}
      <line x1={padLeft} y1={eglInletY} x2={padLeft + plotW} y2={eglOutletY} stroke="#e11d48" strokeWidth="2" strokeDasharray="4 2" />
      <text x={padLeft + 5} y={eglInletY - 6} fontSize="8.5" fontWeight="700" fill="#e11d48">EGL Inlet ({result.inletTotalHeadM} m)</text>
      <text x={padLeft + plotW - 100} y={eglOutletY - 6} fontSize="8.5" fontWeight="700" fill="#e11d48">EGL Outlet ({result.outletTotalHeadM} m)</text>

      {/* Hydraulic Grade Line (HGL) */}
      <line x1={padLeft} y1={hglInletY} x2={padLeft + plotW} y2={hglOutletY} stroke="#0284c7" strokeWidth="2.5" />
      <text x={padLeft + 5} y={hglInletY + 14} fontSize="8.5" fontWeight="700" fill="#0284c7">HGL Slope (Sf = {result.frictionSlopeMPerM} m/m)</text>

      {/* Pipe Profile */}
      <line x1={padLeft} y1={inletY + 60} x2={padLeft + plotW} y2={outletY + 60} stroke="#475569" strokeWidth="16" strokeLinecap="round" />
      <line x1={padLeft} y1={inletY + 60} x2={padLeft + plotW} y2={outletY + 60} stroke="#38bdf8" strokeWidth="10" strokeLinecap="round" />

      {/* Velocity Vector & Direction */}
      <line x1={padLeft + plotW / 2 - 40} y1={inletY + 60 + (outletY - inletY) / 2} x2={padLeft + plotW / 2 + 40} y2={inletY + 60 + (outletY - inletY) / 2} stroke="#ffffff" strokeWidth="3" markerEnd="url(#arrow)" />
      <text x={padLeft + plotW / 2} y={inletY + 52 + (outletY - inletY) / 2} fontSize="9" fontWeight="800" textAnchor="middle" fill="#0f172a">
        V = {result.velocityMps} m/s ({result.flowRegime})
      </text>

      {/* Inlet & Outlet Elevation Callouts */}
      <text x={padLeft} y={inletY + 95} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
        Inlet Elev: {params.inletElevationM}m · Pin = {result.inletPressureKpa} kPa
      </text>
      <text x={padLeft + plotW - 110} y={outletY + 95} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">
        Outlet Elev: {params.outletElevationM}m · Pout = {result.outletPressureKpa} kPa
      </text>

      {/* Head Loss Dimension */}
      <g transform={`translate(${padLeft + plotW + 15}, ${eglInletY})`}>
        <line x1={0} y1={0} x2={0} y2={eglOutletY - eglInletY} stroke="#f43f5e" strokeWidth="1.5" />
        <line x1={-4} y1={0} x2={4} y2={0} stroke="#f43f5e" strokeWidth="1.5" />
        <line x1={-4} y1={eglOutletY - eglInletY} x2={4} y2={eglOutletY - eglInletY} stroke="#f43f5e" strokeWidth="1.5" />
        <text x={8} y={(eglOutletY - eglInletY) / 2 + 4} fontSize="8.5" fontWeight="700" fill="#f43f5e">
          h_f = {result.frictionHeadLossM}m
        </text>
      </g>

      {/* Velocity Status Indicators */}
      <g transform="translate(60, 260)">
        <rect x={0} y={0} width={260} height={42} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={12} y={18} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Self-Cleansing Velocity Check (&ge; 0.6 m/s):</text>
        <text x={12} y={32} fontSize="9.5" fontWeight="700" fill={result.selfCleansingStatus === 'pass' ? '#10b981' : '#f59e0b'}>
          {result.selfCleansingStatus === 'pass' ? '✓ PASS: Adequate Sediment Flushing' : '⚠ WARNING: Siltation Risk'}
        </text>
      </g>

      <g transform="translate(340, 260)">
        <rect x={0} y={0} width={260} height={42} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={12} y={18} fontSize="8" fill="var(--md-sys-color-on-surface-variant)">Scour / Water-Hammer Velocity Check (&le; 3.0 m/s):</text>
        <text x={12} y={32} fontSize="9.5" fontWeight="700" fill={result.maxVelocityStatus === 'pass' ? '#10b981' : '#f43f5e'}>
          {result.maxVelocityStatus === 'pass' ? '✓ PASS: Velocity Within Safe Envelope' : '✕ EXCEEDED: Excessive Scour / Surge'}
        </text>
      </g>
    </svg>
  );
};


