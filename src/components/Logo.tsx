import React from 'react';

export const BRAND_LOGO_SRC = '/logo.svg';

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
  /** When true, renders with subtle animation effects */
  animated?: boolean;
  /** Optional click handler or navigation */
  onClick?: () => void;
  /** If true, wraps in an interactive accessible link to '/' */
  asLink?: boolean;
  /** Optional custom href for asLink */
  href?: string;
  /** When true, smoothly collapses typography and displays only the compact LogoMark icon */
  collapsed?: boolean;
  /** When true, uses the generated modern geometric brand logo icon */
  useBrandIcon?: boolean;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', { height: number; markSize: number }> = {
  xs: { height: 24, markSize: 22 },
  sm: { height: 32, markSize: 28 },
  md: { height: 40, markSize: 36 },
  lg: { height: 56, markSize: 48 },
  xl: { height: 80, markSize: 72 },
};

/**
 * Architectural CL Vector Mark
 * Hand-drafted Swiss-grid structural CAD monogram of "C" and "L" with millimeter scale caliper ticks.
 */
export const ClVectorMark: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 36,
  className = '',
  animated = false,
}) => {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`shrink-0 overflow-visible transition-all duration-300 ${
        animated ? 'hover:scale-105 transition-transform' : ''
      } ${className}`}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Obsidian Dark Foundation Squircle */}
      <rect width="64" height="64" rx="14" fill="#141413" stroke="#2B2A27" strokeWidth="1.2" />

      {/* CAD Precision Grid Lines */}
      <path
        d="M14 20h36M14 32h36M14 44h36 M20 14v36M32 14v36M44 14v36"
        stroke="#252422"
        strokeWidth="0.75"
        strokeDasharray="1.5 2.5"
      />

      {/* 45° Chamfer Alignment Accents */}
      <path d="M12 16L16 12M48 52l4-4" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* "C" Structural Channel Frame (Warm Titanium White #F8FAFC) */}
      <path
        d="M30 18H21.5L16.5 23.5V40.5L21.5 46H30"
        fill="none"
        stroke="#F8FAFC"
        strokeWidth="5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* "L" Reinforced Angle Beam & Structural Ruler (Engineered Amber Gold #F59E0B) */}
      <path
        d="M35 18V46H48"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Millimeter Scale Caliper Ticks on 'L' Vertical Leg */}
      <path
        d="M31.5 23.5h2.5 M30 29h4 M31.5 34.5h2.5 M30 40h4"
        stroke="#F59E0B"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Structural Node Caliper Pivot & Anchor Point */}
      <circle cx="41.5" cy="27" r="2.2" fill="#F59E0B" />
      <circle cx="41.5" cy="27" r="0.9" fill="#141413" />
    </svg>
  );
};

/**
 * Brand Logo Icon rendered using the architectural CL vector mark
 */
export const BrandLogoIcon: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 36,
  className = '',
  animated = false,
}) => {
  return <ClVectorMark size={size} className={className} animated={animated} />;
};

/**
 * Brand Logo Mark - renders the modern geometric brand logo icon everywhere consistently.
 */
export const LogoMark: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 36,
  className = '',
  animated = false,
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
  animated = false,
  onClick,
  asLink = false,
  href = '#top',
  collapsed = false,
  useBrandIcon = true,
}) => {
  const resolved = typeof size === 'number' ? { height: size, markSize: size * 0.9 } : SIZE_MAP[size];

  const content = (
    <div
      className={`inline-flex items-center transition-all duration-300 ${
        collapsed ? 'gap-0 justify-center' : 'gap-2.5 sm:gap-3'
      } ${variant === 'stacked' ? 'flex-col text-center items-center' : 'flex-row'} ${className}`}
    >
      {/* Structural Logo Mark or Brand Icon */}
      <div className="relative shrink-0 flex items-center justify-center transition-transform duration-300">
        <ClVectorMark size={collapsed ? 28 : resolved.markSize} animated={animated} />
      </div>

      {/* Typography: BD. CivilLab & Optional Official Tagline */}
      {variant !== 'mark' && (
        <div
          className={`flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
            variant === 'stacked' ? 'items-center' : 'items-start'
          } ${
            collapsed
              ? 'max-w-0 opacity-0 -translate-x-3 pointer-events-none'
              : 'max-w-[220px] opacity-100 translate-x-0'
          }`}
        >
          <div className="flex items-baseline tracking-tight font-sans leading-none select-none">
            <span
              className="font-black text-[var(--md-sys-color-primary)] tracking-tight"
              style={{ fontSize: `${resolved.height * 0.52}px` }}
            >
              BD.
            </span>
            <span
              className="ml-1 font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight"
              style={{ fontSize: `${resolved.height * 0.52}px` }}
            >
              CivilLab
            </span>
          </div>

          {showTagline && (
            <span
              className={`font-mono uppercase font-bold tracking-widest text-[9px] sm:text-[10px] mt-1 text-[var(--md-sys-color-on-surface-variant)] opacity-90 truncate ${taglineClassName}`}
            >
              CALCULATE SMARTER. BUILD BETTER.
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
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label="BD. CivilLab Home - Return to Workbench Dashboard"
        className="group inline-flex items-center text-[var(--md-sys-color-on-surface)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)] rounded-lg p-0.5 transition-all cursor-pointer"
      >
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="BD. CivilLab Home - Return to Workbench Dashboard"
        className="group inline-flex items-center text-[var(--md-sys-color-on-surface)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)] rounded-lg p-0.5 transition-all cursor-pointer border-0 bg-transparent text-left"
      >
        {content}
      </button>
    );
  }

  return content;
};

export default Logo;
