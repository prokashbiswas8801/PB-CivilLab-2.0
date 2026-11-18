import React, { useId } from 'react';

export const BRAND_LOGO_SRC = '/logo.svg';
export const OFFICIAL_TAGLINE = 'Calculate Smarter. Design Stronger. Build Better.';
export const OFFICIAL_TAGLINE_BN = 'নিখুঁত হিসাব · সুদৃঢ় নকশা · মজবুত নির্মাণ';

export interface LogoProps {
  /** Variant of the logo display */
  variant?: 'full' | 'mark' | 'horizontal' | 'stacked';
  /** Preset size or custom height in px */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to show the official tagline */
  showTagline?: boolean;
  /** Custom class name for the wrapper */
  className?: string;
  /** Custom class name for the tagline */
  taglineClassName?: string;
  /** When true, renders with dynamic mechanical caliper-gear micro-interactions */
  animated?: boolean;
  /** Optional click handler or navigation (e.g. navigate to Home/Dashboard) */
  onClick?: () => void;
  /** If true, wraps in an interactive accessible link to '/' or href */
  asLink?: boolean;
  /** Optional custom href for asLink */
  href?: string;
  /** When true, smoothly collapses typography and displays only the compact LogoMark icon */
  collapsed?: boolean;
  /** When true, uses the modern geometric brand logo icon */
  useBrandIcon?: boolean;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', { height: number; markSize: number }> = {
  xs: { height: 24, markSize: 24 },
  sm: { height: 32, markSize: 30 },
  md: { height: 40, markSize: 38 },
  lg: { height: 56, markSize: 50 },
  xl: { height: 80, markSize: 74 },
};

/**
 * BD. CivilLab — Dynamic Isometric Structural Truss, Compass Caliper & Golden-Ratio Node Emblem
 *
 * Mechanical Caliper & Gear Engagement Kinematics on Hover:
 * - Emblem Chassis: Subtle +3.5° clockwise engagement & 1.05× scale with spring-snap easing.
 * - Outer Compass Caliper Arc: Rotates +14° clockwise around (34, 34).
 * - Inner Toothed Micrometer Gear Ring: Counter-rotates -22° around the golden-ratio pivot (45.5, 27.5).
 * - Upper Crown Pinion Gear: Rotates +18° around (34.5, 16.5).
 * - Vernier Scale Graduations: Shifts -1px vertically as caliper jaws lock.
 */
export const ClVectorMark: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 36,
  className = '',
  animated = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const sheenGradId = `cl-sheen-${uid}`;
  const trussGradId = `cl-truss-${uid}`;
  const caliperGradId = `cl-caliper-${uid}`;
  const goldNodeGradId = `cl-node-${uid}`;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`group/mark shrink-0 overflow-visible select-none ${
        animated
          ? 'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105 group-hover:rotate-[3.5deg] group-hover/logo:scale-105 group-hover/logo:rotate-[3.5deg] hover:scale-105 hover:rotate-[3.5deg] motion-reduce:transition-none motion-reduce:transform-none'
          : ''
      } ${className}`}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Theme-Adaptive Diagonal Architectural Sheen */}
        <linearGradient id={sheenGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--md-sys-color-primary)" stopOpacity="0.18" />
          <stop offset="55%" stopColor="var(--md-sys-color-surface-container-highest)" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.14" />
        </linearGradient>

        {/* Primary Cantilever & Compass Gradient */}
        <linearGradient id={caliperGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--md-sys-color-primary)" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Isometric Structural Truss Chord Gradient */}
        <linearGradient id={trussGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--md-sys-color-on-surface)" />
          <stop offset="100%" stopColor="var(--md-sys-color-on-surface-variant)" />
        </linearGradient>

        {/* Golden-Ratio Equilibrium Node Radial Glow */}
        <radialGradient id={goldNodeGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
          <stop offset="65%" stopColor="#F59E0B" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Theme-Adaptive Architectural Squircle Base (Crisp in both Light & Dark modes) */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="15"
        fill="var(--md-sys-color-surface-container-highest, #141821)"
        stroke="var(--md-sys-color-outline-variant, #334155)"
        strokeWidth="1.5"
      />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="14.25"
        fill={`url(#${sheenGradId})`}
        stroke="var(--md-sys-color-primary)"
        strokeOpacity="0.28"
        strokeWidth="0.8"
      />

      {/* 2. Subtle Isometric Blueprint Grid & Axis Crosshairs */}
      <g stroke="var(--md-sys-color-on-surface-variant)" strokeOpacity="0.16" strokeWidth="0.75">
        <path d="M32 7V57M7 32H57" strokeDasharray="2 2.5" />
        <path d="M14 17L50 47M50 17L14 47" strokeDasharray="1.5 3" />
      </g>

      {/* 3. Sweeping Compass Caliper Arc & Degree Protractor Ticks (Rotates +14° Clockwise on Hover) */}
      <g
        style={{ transformBox: 'view-box', transformOrigin: '34px 34px' }}
        className={
          animated
            ? 'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-[14deg] group-hover/logo:rotate-[14deg] group-hover/mark:rotate-[14deg] motion-reduce:transition-none motion-reduce:transform-none'
            : ''
        }
      >
        <path
          d="M25 12.5 A21.5 21.5 0 0 1 53.5 37.5"
          fill="none"
          stroke={`url(#${caliperGradId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 2"
        />
        {/* Compass Caliper Radial Degree Ticks */}
        <path
          d="M41.5 13.2L40.2 15.8 M48.2 18.2L46.1 20.1 M52.4 25.8L49.7 26.8"
          stroke="#F59E0B"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      </g>

      {/* 4. Isometric Structural Space-Truss ('C' Load-Bearing Frame) */}
      <g>
        {/* Internal Warren-Truss Diagonal Web Bracing */}
        <path
          d="M15.5 21.5 L26.5 27 L15.5 32.5 L26.5 38 L15.5 43.5"
          fill="none"
          stroke="var(--md-sys-color-primary)"
          strokeOpacity="0.45"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Primary Isometric 'C' Structural Channel Chord */}
        <path
          d="M29.5 14 L15.5 21.5 V42.5 L29.5 50"
          fill="none"
          stroke={`url(#${trussGradId})`}
          strokeWidth="4.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Structural Pin-Support Nodes on 'C' Frame */}
        <circle cx="15.5" cy="21.5" r="1.7" fill="var(--md-sys-color-primary)" />
        <circle cx="15.5" cy="42.5" r="1.7" fill="var(--md-sys-color-primary)" />
      </g>

      {/* 5. Interlocking 'L' Cantilever Mast & Vernier Caliper Scale */}
      <g>
        {/* Main 'L' Structural Beam & Base Footing */}
        <path
          d="M34.5 16.5 V46.5 H50.5"
          fill="none"
          stroke={`url(#${caliperGradId})`}
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Precision Millimeter Caliper Graduations on 'L' Mast (Micro-shifts on Hover as Vernier Locks) */}
        <path
          d="M35.5 24H40 M35.5 30H42 M35.5 36H40 M35.5 41.5H43.5"
          stroke="var(--md-sys-color-on-surface)"
          strokeOpacity="0.85"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={
            animated
              ? 'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-[1px] group-hover/logo:-translate-y-[1px] group-hover/mark:-translate-y-[1px] motion-reduce:transition-none'
              : ''
          }
        />
        {/* Diagonal Tension Tie Rod connecting 'L' Mast to 'C' Truss */}
        <path
          d="M26.5 27 L45.5 27.5 L34.5 46.5"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.85"
        />
      </g>

      {/* 6. Golden-Ratio Equilibrium Node & Counter-Rotating Micrometer Gear Ring */}
      <g>
        {/* Pulsing Equilibrium Halo */}
        <circle
          cx="45.5"
          cy="27.5"
          r="6.6"
          fill={`url(#${goldNodeGradId})`}
          style={{ transformBox: 'view-box', transformOrigin: '45.5px 27.5px' }}
          className={
            animated
              ? 'opacity-75 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125 group-hover/logo:scale-125 group-hover/mark:scale-125 motion-reduce:transition-none'
              : 'opacity-65'
          }
        />

        {/* Counter-Rotating Precision Toothed Micrometer Gear Ring (-22° on Hover) */}
        <g
          style={{ transformBox: 'view-box', transformOrigin: '45.5px 27.5px' }}
          className={
            animated
              ? 'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-[22deg] group-hover/logo:-rotate-[22deg] group-hover/mark:-rotate-[22deg] motion-reduce:transition-none motion-reduce:transform-none'
              : ''
          }
        >
          <circle
            cx="45.5"
            cy="27.5"
            r="5.3"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.35"
            strokeDasharray="1.7 1.65"
            strokeOpacity="0.92"
          />
        </g>

        {/* Outer Golden Pin-Joint Ring */}
        <circle
          cx="45.5"
          cy="27.5"
          r="3.3"
          fill="#F59E0B"
          stroke="var(--md-sys-color-surface, #0F172A)"
          strokeWidth="1.2"
        />
        {/* Center Precision Target Core */}
        <circle cx="45.5" cy="27.5" r="1.2" fill="#FFFBEB" />

        {/* Upper Crown Pinion Gear & Node on 'L' Mast (+18° Clockwise Engagement on Hover) */}
        <g
          style={{ transformBox: 'view-box', transformOrigin: '34.5px 16.5px' }}
          className={
            animated
              ? 'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-[18deg] group-hover/logo:rotate-[18deg] group-hover/mark:rotate-[18deg] motion-reduce:transition-none motion-reduce:transform-none'
              : ''
          }
        >
          <circle
            cx="34.5"
            cy="16.5"
            r="3.8"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.1"
            strokeDasharray="1.4 1.4"
            strokeOpacity="0.8"
          />
          <circle
            cx="34.5"
            cy="16.5"
            r="2.3"
            fill="#F59E0B"
            stroke="var(--md-sys-color-surface, #0F172A)"
            strokeWidth="1"
          />
        </g>
      </g>
    </svg>
  );
};

/**
 * Brand Logo Icon rendered using the dynamic isometric truss & compass caliper mark
 */
export const BrandLogoIcon: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 36,
  className = '',
  animated = true,
}) => {
  return <ClVectorMark size={size} className={className} animated={animated} />;
};

/**
 * Brand Logo Mark - renders the modern geometric brand logo icon everywhere consistently.
 */
export const LogoMark: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 36,
  className = '',
  animated = true,
}) => {
  return <ClVectorMark size={size} className={className} animated={animated} />;
};

/**
 * Backward-compatible alias for the vector mark
 */
export const LegacySvgEmblem = ClVectorMark;

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  showTagline = false,
  className = '',
  taglineClassName = '',
  animated = true,
  onClick,
  asLink = false,
  href = '#top',
  collapsed = false,
}) => {
  const resolved = typeof size === 'number' ? { height: size, markSize: size * 0.92 } : SIZE_MAP[size];

  const handleTrigger = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
      if (typeof window !== 'undefined') {
        const mainEl = document.getElementById('top');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const content = (
    <div
      className={`group/logo inline-flex items-center transition-all duration-200 ${
        collapsed ? 'gap-0 justify-center' : 'gap-2.5 sm:gap-3'
      } ${variant === 'stacked' ? 'flex-col text-center items-center' : 'flex-row'} ${className}`}
    >
      {/* Dynamic Isometric Truss & Compass Caliper Logo Mark */}
      <div className="relative shrink-0 flex items-center justify-center">
        <ClVectorMark size={collapsed ? 30 : resolved.markSize} animated={animated} />
      </div>

      {/* Typography: BD. CivilLab & Official Tagline */}
      {variant !== 'mark' && (
        <div
          className={`flex flex-col min-w-0 transition-all duration-200 ease-out overflow-hidden whitespace-nowrap ${
            variant === 'stacked' ? 'items-center' : 'items-start'
          } ${
            collapsed
              ? 'max-w-0 opacity-0 -translate-x-3 pointer-events-none'
              : 'max-w-[300px] opacity-100 translate-x-0'
          }`}
        >
          <div className="flex items-baseline tracking-tight font-sans leading-none select-none">
            <span
              className="font-black text-[var(--md-sys-color-primary)] tracking-tight"
              style={{ fontSize: `${resolved.height * 0.52}px` }}
            >
              BD
            </span>
            <span
              className="inline-block w-1.5 h-1.5 rounded-[2px] bg-amber-500 mx-0.5 mb-0.5 shrink-0 transition-transform duration-300 group-hover/logo:rotate-45 group-hover:rotate-45"
              aria-hidden="true"
            />
            <span
              className="ml-0.5 font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight group-hover/logo:text-[var(--md-sys-color-primary)] transition-colors"
              style={{ fontSize: `${resolved.height * 0.52}px` }}
            >
              Civil
            </span>
            <span
              className="font-bold text-[var(--md-sys-color-primary)] tracking-tight"
              style={{ fontSize: `${resolved.height * 0.52}px` }}
            >
              Lab
            </span>
          </div>

          {showTagline && (
            <span
              className={`font-mono uppercase font-bold tracking-wider text-[9px] sm:text-[10px] mt-1 text-[var(--md-sys-color-on-surface-variant)] opacity-95 truncate ${taglineClassName}`}
            >
              {OFFICIAL_TAGLINE}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <a
        href={href}
        onClick={handleTrigger}
        title="Go to Home Dashboard — BD. CivilLab"
        aria-label="BD. CivilLab — Go to Home Dashboard"
        className="group inline-flex items-center text-[var(--md-sys-color-on-surface)] hover:opacity-95 focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)] rounded-xl p-0.5 transition-all cursor-pointer"
      >
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={handleTrigger}
        title="Go to Home Dashboard — BD. CivilLab"
        aria-label="BD. CivilLab — Go to Home Dashboard"
        className="group inline-flex items-center text-[var(--md-sys-color-on-surface)] hover:opacity-95 focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)] rounded-xl p-0.5 transition-all cursor-pointer border-0 bg-transparent text-left"
      >
        {content}
      </button>
    );
  }

  return content;
};

export default Logo;
