import React from 'react';
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
} from '../types/civil';

/* 1. Beam Diagram */
export const BeamDiagramSvg: React.FC<{ params: BeamParameters; result: BeamAnalysisResult }> = ({
  params,
  result,
}) => {
  const width = 680;
  const height = 320;
  const padLeft = 58;
  const padRight = 36;
  const plotW = width - padLeft - padRight;
  const L = params.spanLengthM;
  const maxV = Math.max(0.1, result.maxShearKn);
  const maxM = Math.max(0.1, result.maxMomentKnm);
  const toX = (xM: number) => padLeft + (xM / L) * plotW;

  const shearCenterY = 140;
  const shearAmp = 36;
  const shearPoints = result.points
    .map((pt) => `${toX(pt.x).toFixed(1)},${(shearCenterY - (pt.shearKn / maxV) * shearAmp).toFixed(1)}`)
    .join(' ');
  const shearAreaPoints = `${padLeft},${shearCenterY} ${shearPoints} ${padLeft + plotW},${shearCenterY}`;

  const momentCenterY = 250;
  const momentAmp = 38;
  const momentPoints = result.points
    .map((pt) => `${toX(pt.x).toFixed(1)},${(momentCenterY + (pt.momentKnm / maxM) * momentAmp).toFixed(1)}`)
    .join(' ');
  const momentAreaPoints = `${padLeft},${momentCenterY} ${momentPoints} ${padLeft + plotW},${momentCenterY}`;
  const pointLoadX = toX(Math.min(L, params.pointLoadPositionM));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <text x={12} y={38} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">LOAD</text>
      {params.uniformLoadKnPerM > 0 && (
        <g>
          <line x1={padLeft} y1={22} x2={padLeft + plotW} y2={22} stroke="var(--md-sys-color-primary)" strokeWidth="1.5" />
          <text x={padLeft + 4} y={16} fontSize="10" fill="var(--md-sys-color-primary)">w = {params.uniformLoadKnPerM} kN/m</text>
        </g>
      )}
      {params.pointLoadKn > 0 && (
        <g>
          <line x1={pointLoadX} y1={10} x2={pointLoadX} y2={40} stroke="var(--md-sys-color-tertiary)" strokeWidth="2.5" />
          <polygon points={`${pointLoadX - 4},34 ${pointLoadX + 4},34 ${pointLoadX},42`} fill="var(--md-sys-color-tertiary)" />
          <text x={pointLoadX + 6} y={16} fontSize="10" fontWeight="600" fill="var(--md-sys-color-tertiary)">P = {params.pointLoadKn} kN</text>
        </g>
      )}
      <rect x={padLeft} y={42} width={plotW} height={8} rx={2} fill="var(--md-sys-color-on-surface)" />
      
      {/* SFD */}
      <text x={12} y={144} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">SFD (kN)</text>
      <line x1={padLeft} y1={shearCenterY} x2={padLeft + plotW} y2={shearCenterY} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
      <polygon points={shearAreaPoints} fill="var(--md-sys-color-primary)" fillOpacity="0.16" />
      <polyline fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="2" points={shearPoints} />
      
      {/* BMD */}
      <text x={12} y={254} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">BMD (kN·m)</text>
      <line x1={padLeft} y1={momentCenterY} x2={padLeft + plotW} y2={momentCenterY} stroke="var(--md-sys-color-outline)" strokeWidth="1" />
      <polygon points={momentAreaPoints} fill="var(--md-sys-color-secondary)" fillOpacity="0.18" />
      <polyline fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2" points={momentPoints} />
    </svg>
  );
};

/* 2. Bearing Diagram */
export const BearingDiagramSvg: React.FC<{ params: BearingParameters; result: BearingAnalysisResult }> = ({
  params,
  result,
}) => {
  const width = 680;
  const height = 260;
  const footingCenterX = 340;
  const footingW = Math.min(220, Math.max(90, params.footingWidthM * 35));
  const footingBaseY = 145;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <line x1={40} y1={70} x2={width - 40} y2={70} stroke="var(--md-sys-color-on-surface)" strokeWidth="2" />
      <text x={48} y={62} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">FINISHED GRADE EL 0.00m</text>
      
      {/* Column and Pad */}
      <rect x={footingCenterX - 20} y={25} width={40} height={100} fill="var(--md-sys-color-surface-container-highest)" stroke="var(--md-sys-color-on-surface)" strokeWidth="1.5" />
      <rect x={footingCenterX - footingW / 2} y={footingBaseY - 24} width={footingW} height={24} fill="var(--md-sys-color-surface-container-high)" stroke="var(--md-sys-color-on-surface)" strokeWidth="2" />
      
      {/* Prandtl Failure Wedge */}
      <path
        d={`M ${footingCenterX - footingW / 2} ${footingBaseY} L ${footingCenterX} ${footingBaseY + footingW * 0.5} L ${footingCenterX + footingW / 2} ${footingBaseY} Z`}
        fill="var(--md-sys-color-primary)"
        fillOpacity="0.15"
        stroke="var(--md-sys-color-primary)"
        strokeDasharray="4 3"
      />
      <text x={footingCenterX} y={235} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--md-sys-color-primary)">
        q_all = {result.allowableBearingKpa.toFixed(1)} kPa · q_app = {result.appliedPressureKpa.toFixed(1)} kPa · FS = {result.effectiveSafetyFactor.toFixed(2)}
      </text>
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

/* 4. Open Channel Hydraulics Diagram */
export const ChannelHydraulicsSvg: React.FC<{ params: ChannelParameters; result: ChannelHydraulicsResult }> = ({
  params,
  result,
}) => {
  const width = 680;
  const height = 240;
  const centerX = 340;
  const bedY = 190;
  const totalDepth = params.flowDepthM + params.freeboardRequirementM;
  const topWidthTotal = params.bottomWidthM + 2 * params.sideSlopeZ * totalDepth;
  const scale = Math.min(110 / Math.max(0.5, totalDepth), 420 / Math.max(1, topWidthTotal));

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
    ${centerX - bankTopHalfPx - 20},${bedY - totalDepthPx}
    ${centerX - bankTopHalfPx},${bedY - totalDepthPx}
    ${centerX - bPx / 2},${bedY}
    ${centerX + bPx / 2},${bedY}
    ${centerX + bankTopHalfPx},${bedY - totalDepthPx}
    ${centerX + bankTopHalfPx + 20},${bedY - totalDepthPx}
  `;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <polygon points={waterPolygon} fill="var(--md-sys-color-primary)" fillOpacity="0.22" stroke="var(--md-sys-color-primary)" strokeWidth="1.5" />
      <polyline fill="none" stroke="var(--md-sys-color-on-surface)" strokeWidth="3" points={channelPolyline} />
      <text x={centerX} y={bedY - yPx - 8} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--md-sys-color-primary)">
        WSE (y = {params.flowDepthM.toFixed(2)}m · T = {result.topWidthM.toFixed(2)}m)
      </text>
      <text x={centerX} y={bedY + 22} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--md-sys-color-on-surface)">
        Q = {result.dischargeM3ps.toFixed(2)} m³/s · V = {result.velocityMps.toFixed(2)} m/s · Fr = {result.froudeNumber.toFixed(2)} ({result.flowRegime})
      </text>
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

/* 6. Rebar BBS Diagram */
export const RebarBBSDiagramSvg: React.FC<{ params: RebarBBSParameters; result: RebarBBSResult }> = ({
  params,
  result,
}) => {
  const width = 680;
  const height = 240;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono" role="img">
      <text x={40} y={28} fontSize="11" fontWeight="700" fill="var(--md-sys-color-on-surface)">
        STRUCTURAL REBAR BBS CUTTING ENVELOPE ({params.elementType.toUpperCase()} · CLEAR COVER: {params.clearCoverMm}mm)
      </text>

      {params.elementType === 'slab' && (
        <g transform="translate(50, 48)">
          <rect x={0} y={0} width={340} height={130} rx={4} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" />
          {[22, 52, 82, 112].map((y, i) => (
            <line key={i} x1={15} y1={y} x2={325} y2={y} stroke="var(--md-sys-color-primary)" strokeWidth="2.5" />
          ))}
          {[30, 85, 140, 195, 250, 305].map((x, i) => (
            <line key={i} x1={x} y1={12} x2={x} y2={118} stroke="var(--md-sys-color-secondary)" strokeWidth="1.8" strokeDasharray="3 2" />
          ))}
        </g>
      )}

      {params.elementType === 'column-rect' && (
        <g transform="translate(140, 48)">
          <rect x={0} y={0} width={130} height={130} rx={4} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" strokeWidth="2" />
          <rect x={14} y={14} width={102} height={102} rx={2} fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2" />
          {[
            [22, 22], [65, 22], [108, 22],
            [22, 65], [108, 65],
            [22, 108], [65, 108], [108, 108],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6} fill="var(--md-sys-color-primary)" />
          ))}
        </g>
      )}

      {params.elementType === 'column-circ' && (
        <g transform="translate(140, 48)">
          <circle cx={65} cy={65} r={62} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" strokeWidth="2" />
          <circle cx={65} cy={65} r={48} fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2" strokeDasharray="5 3" />
          {Array.from({ length: 8 }).map((_, i) => {
            const rad = (i * 2 * Math.PI) / 8;
            return <circle key={i} cx={65 + 48 * Math.cos(rad)} cy={65 + 48 * Math.sin(rad)} r={6} fill="var(--md-sys-color-primary)" />;
          })}
        </g>
      )}

      {params.elementType === 'footing' && (
        <g transform="translate(70, 48)">
          <rect x={0} y={0} width={280} height={130} rx={4} fill="var(--md-sys-color-surface-container-low)" stroke="var(--md-sys-color-outline)" />
          {[20, 50, 80, 110].map((y, i) => (
            <line key={i} x1={12} y1={y} x2={268} y2={y} stroke="var(--md-sys-color-primary)" strokeWidth="2.5" />
          ))}
          {[30, 80, 130, 180, 230].map((x, i) => (
            <line key={i} x1={x} y1={12} x2={x} y2={118} stroke="var(--md-sys-color-tertiary)" strokeWidth="2.5" />
          ))}
        </g>
      )}

      {params.elementType === 'staircase-waist' && (
        <g transform="translate(60, 48)">
          <polyline points="0,120 180,40 280,40 280,10 180,10 0,90" fill="var(--md-sys-color-surface-container-high)" stroke="var(--md-sys-color-outline)" strokeWidth="1.5" />
          <line x1={5} y1={105} x2={275} y2={25} stroke="var(--md-sys-color-primary)" strokeWidth="2.5" />
        </g>
      )}

      <g transform="translate(420, 48)">
        <rect x={0} y={0} width={220} height={130} rx={6} fill="var(--md-sys-color-surface-container)" stroke="var(--md-sys-color-outline-variant)" />
        <text x={16} y={26} fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-surface-variant)">TOTAL REBAR QUANTITY</text>
        <text x={16} y={58} fontSize="22" fontWeight="700" fill="var(--md-sys-color-primary)">{result.totalSteelWeightKg.toFixed(1)} kg</text>
        <text x={16} y={82} fontSize="11" fill="var(--md-sys-color-on-surface)">= {result.totalSteelTonnes.toFixed(3)} Tonnes</text>
        <text x={16} y={110} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">Length: {result.totalBarsLengthM.toFixed(1)} m</text>
      </g>

      <text x={40} y={218} fontSize="10" fill="var(--md-sys-color-on-surface-variant)">
        {result.unitWeightFormulaUsed}
      </text>
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

