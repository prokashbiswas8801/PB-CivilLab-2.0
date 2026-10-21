import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Gauge,
  Info,
  Layers,
} from 'lucide-react';
import { CapacityUtilizationInfo } from '../utils/analyticalExport';

/**
 * Framer Motion container variants for staggered entrance animation.
 * Orchestrates child DCR gauge items to sequentially fade in and slide up.
 */
export const dcrContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

/**
 * Framer Motion child item variants.
 * Smoothly fades in from opacity 0 to 1 and slides up from y: 22px to 0 with spring physics.
 */
export const dcrItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 24,
      mass: 0.8,
    },
  },
};

export interface DcrCapacityGaugeProps {
  capacityInfo: CapacityUtilizationInfo;
  className?: string;
  showBenchmarks?: boolean;
  variants?: Variants;
  customIndex?: number;
}

export const DcrCapacityGauge: React.FC<DcrCapacityGaugeProps> = ({
  capacityInfo,
  className = '',
  showBenchmarks = true,
  variants,
  customIndex,
}) => {
  // Animated width percentage for smooth initial mount and continuous dynamic transitions
  const [animatedWidth, setAnimatedWidth] = useState<number>(0);
  const [displayPercentage, setDisplayPercentage] = useState<number>(0);
  const [showInfoPopover, setShowInfoPopover] = useState<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  // Target percentage clamped between 4% (minimum visible thumb for rounded cap) and 100%
  const targetWidth = useMemo(() => {
    return Math.min(100, Math.max(4, Math.round(capacityInfo.percentage)));
  }, [capacityInfo.percentage]);

  // Dynamic smooth fill animation on mount and whenever analytical results change
  useEffect(() => {
    let rafId: number;
    const timeoutId = setTimeout(() => {
      rafId = requestAnimationFrame(() => {
        setAnimatedWidth(targetWidth);
      });
    }, 16);

    return () => {
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [targetWidth]);

  // Smooth numeric counter interpolation for the percentage display
  useEffect(() => {
    const startVal = displayPercentage;
    const endVal = capacityInfo.percentage;
    const duration = 600; // ms
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startVal + (endVal - startVal) * easeProgress);

      setDisplayPercentage(currentVal);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateCounter);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateCounter);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [capacityInfo.percentage]);

  const statusColorClass =
    capacityInfo.status === 'safe'
      ? 'dcr-fill-safe'
      : capacityInfo.status === 'warning'
      ? 'dcr-fill-warning'
      : 'dcr-fill-critical';

  const statusBadgeClass =
    capacityInfo.status === 'safe'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
      : capacityInfo.status === 'warning'
      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';

  const statusDotClass =
    capacityInfo.status === 'safe'
      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
      : capacityInfo.status === 'warning'
      ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse'
      : 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-bounce';

  const StatusIcon =
    capacityInfo.status === 'safe'
      ? CheckCircle2
      : capacityInfo.status === 'warning'
      ? AlertTriangle
      : AlertOctagon;

  const defaultStandaloneVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 280,
        damping: 24,
        delay: (customIndex ?? 0) * 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={variants || defaultStandaloneVariants}
      initial={variants ? undefined : 'hidden'}
      animate={variants ? undefined : 'visible'}
      className={`p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5 transition-colors duration-300 shadow-2xs ${className}`}
      role="region"
      aria-label="Demand-Capacity Ratio Gauge"
    >
      {/* Top Header: Metric Label + Formatted Readout Badge + Reference Limit */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDotClass}`} />
          <div className="flex items-center gap-1.5 min-w-0">
            <Gauge className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
            <span className="font-bold text-[var(--md-sys-color-on-surface)] font-mono truncate">
              {capacityInfo.metricLabel}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider border shrink-0 transition-colors duration-300 inline-flex items-center gap-1 ${statusBadgeClass}`}
            title={`Utilization state: ${capacityInfo.status.toUpperCase()}`}
          >
            <StatusIcon className="w-3 h-3 shrink-0" />
            <span>{capacityInfo.formattedValue}</span>
            <span className="text-[9px] opacity-80">({displayPercentage}%)</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {capacityInfo.referenceLimit && (
            <span className="text-[11px] font-mono font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              {capacityInfo.referenceLimit}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowInfoPopover((prev) => !prev)}
            className="p-1 rounded hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors"
            title="Toggle DCR Limit-State Criteria details"
            aria-label="DCR Information"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Track & Animated Fill Bar */}
      <div className="relative pt-0.5">
        <div
          className="dcr-gauge-track w-full h-3 rounded-full border border-[var(--md-sys-color-outline-variant)] relative"
          role="progressbar"
          aria-valuenow={Math.round(capacityInfo.percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${capacityInfo.metricLabel}: ${capacityInfo.formattedValue} (${displayPercentage}%)`}
          aria-label={capacityInfo.metricLabel}
        >
          {/* Benchmark Indicator Ticks */}
          {showBenchmarks && (
            <>
              <div
                className="absolute top-0 bottom-0 w-px bg-[var(--md-sys-color-outline-variant)] z-10 pointer-events-none"
                style={{ left: '25%' }}
                title="25% Design Demand"
              />
              <div
                className="absolute top-0 bottom-0 w-px bg-[var(--md-sys-color-outline-variant)] z-10 pointer-events-none"
                style={{ left: '50%' }}
                title="50% Mid-Capacity"
              />
              <div
                className="absolute top-0 bottom-0 w-px bg-[var(--md-sys-color-outline-variant)] z-10 pointer-events-none"
                style={{ left: '75%' }}
                title="75% Moderate Demand"
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-500/60 z-10 pointer-events-none"
                style={{ left: '85%' }}
                title="85% Advisory Warning Threshold"
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500/70 z-10 pointer-events-none"
                style={{ left: '100%' }}
                title="100% Code Allowable Capacity Limit"
              />
            </>
          )}

          {/* Smooth Dynamic Progress Bar Fill with GPU acceleration */}
          <div
            className={`dcr-gauge-fill ${statusColorClass}`}
            style={{
              width: `${animatedWidth}%`,
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)',
              willChange: 'width, background-color, box-shadow',
            }}
          />
        </div>

        {/* Milestone Tick Labels */}
        {showBenchmarks && (
          <div className="flex justify-between text-[9px] font-mono text-[var(--md-sys-color-on-surface-variant)]/70 px-0.5 pt-1 select-none">
            <span>0%</span>
            <span className="hidden sm:inline">25%</span>
            <span className="hidden sm:inline">50% Demand</span>
            <span className="hidden sm:inline">75%</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">85% Limit</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">100% Max</span>
          </div>
        )}
      </div>

      {/* Engineering Evaluative Note */}
      <div className="flex items-start gap-1.5 text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-mono leading-tight">
        <Activity className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0 mt-0.5" />
        <p className="flex-1">{capacityInfo.description}</p>
      </div>

      {/* Popover / Collapsible Limit State Guidelines */}
      {showInfoPopover && (
        <div className="p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[11px] font-mono text-[var(--md-sys-color-on-surface)] space-y-1.5 animate-in fade-in duration-150">
          <div className="font-bold flex items-center justify-between text-xs border-b border-[var(--md-sys-color-outline-variant)] pb-1">
            <span>DCR Limit-State Criteria (AASHTO / ACI / Eurocode)</span>
            <button
              type="button"
              onClick={() => setShowInfoPopover(false)}
              className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              <div className="font-bold text-[10px]">DCR &le; 0.85</div>
              <div className="text-[10px] opacity-90">Safe: Resilient design with reserve safety margin.</div>
            </div>
            <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
              <div className="font-bold text-[10px]">0.85 &lt; DCR &le; 1.00</div>
              <div className="text-[10px] opacity-90">Advisory: Approaches limit; check deflection and shear.</div>
            </div>
            <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
              <div className="font-bold text-[10px]">DCR &gt; 1.00</div>
              <div className="text-[10px] opacity-90">Overloaded: Section capacity exceeded; redesign required.</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export interface DcrGaugeSuiteProps {
  gauges: CapacityUtilizationInfo[];
  moduleKey: string;
  className?: string;
  showAllInitially?: boolean;
}

/**
 * Orchestrates all DCR gauge components on the page with a staggered entrance animation using Framer Motion.
 * Fades in and slides up sequentially whenever the workspace module loads or changes.
 */
export const DcrGaugeSuite: React.FC<DcrGaugeSuiteProps> = ({
  gauges,
  moduleKey,
  className = '',
  showAllInitially = false,
}) => {
  const [showAllGauges, setShowAllGauges] = useState<boolean>(showAllInitially);

  // If there's only 1 gauge, render it directly with motion
  if (!gauges || gauges.length === 0) return null;

  const displayGauges = showAllGauges || gauges.length <= 1 ? gauges : [gauges[0]];

  return (
    <div className={`space-y-2 mb-3.5 ${className}`}>
      {gauges.length > 1 && (
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface-variant)] font-mono text-[11px]">
            <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Demand-Capacity Limit State Suite</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[10px] font-bold">
              {gauges.length} Checks
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAllGauges((prev) => !prev)}
            className="text-[11px] font-mono text-[var(--md-sys-color-primary)] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>{showAllGauges ? 'Show Governing Only' : `View All ${gauges.length} Limit States`}</span>
          </button>
        </div>
      )}

      {/* Staggered Framer Motion Container: triggers when moduleKey changes */}
      <motion.div
        key={moduleKey}
        variants={dcrContainerVariants}
        initial="hidden"
        animate="visible"
        className={
          displayGauges.length > 1
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'
            : 'space-y-3'
        }
      >
        {displayGauges.map((gauge, idx) => (
          <DcrCapacityGauge
            key={`${moduleKey}-${gauge.metricLabel}-${idx}`}
            capacityInfo={gauge}
            variants={dcrItemVariants}
            customIndex={idx}
          />
        ))}
      </motion.div>
    </div>
  );
};
