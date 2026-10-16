import React from 'react';

export interface LogoProps {
  /** Variant of the logo display */
  variant?: 'full' | 'mark' | 'horizontal' | 'stacked';
  /** Preset size or custom height in px */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to show the official tagline "CALCULATE SMARTER. BUILD BETTER." */
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
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', { height: number; markSize: number }> = {
  xs: { height: 24, markSize: 22 },
  sm: { height: 32, markSize: 28 },
  md: { height: 40, markSize: 36 },
  lg: { height: 56, markSize: 48 },
  xl: { height: 80, markSize: 72 },
};

/**
 * Pure SVG Emblem Mark extracting the stylized PB monogram & structural building perspective
 * from 'PB CivlLab gray .svg'. Adapts dynamically to light and dark themes using currentColor.
 */
export const LogoMark: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 36,
  className = '',
  animated = false,
}) => {
  return (
    <svg
      viewBox="0 0 280 160"
      width={size * (280 / 160)}
      height={size}
      fill="currentColor"
      className={`shrink-0 overflow-visible transition-all duration-300 ${
        animated ? 'hover:scale-105 transition-transform' : ''
      } ${className}`}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className={animated ? 'origin-center transition-all' : ''}>
        {/* Left 'P' Letterform & Architectural Fluted Columns */}
        {/* Upper Bowl & Header Bar of 'P' */}
        <path
          d="M 15 15 L 125 15 C 155 15 175 32 175 62 C 175 90 152 105 120 105 L 92 105 L 92 82 L 118 82 C 136 82 148 74 148 60 C 148 45 136 37 118 37 L 42 37 L 42 135 L 15 135 Z"
          className="opacity-95"
        />

        {/* Architectural Column Pier 1 with 45° Top Chamfer */}
        <polygon points="15,78 33,60 33,135 15,135" className="opacity-90" />

        {/* Architectural Column Pier 2 with 45° Top Chamfer */}
        <polygon points="38,52 56,34 56,135 38,135" className="opacity-90" />

        {/* Right 'B' Letterform & Aerodynamic Structural Curves */}
        <path
          d="M 132 15 L 230 15 C 252 15 268 28 268 48 C 268 64 256 76 240 80 C 262 86 275 102 275 122 C 275 144 258 155 232 155 L 145 155 L 145 132 L 226 132 C 242 132 250 125 250 114 C 250 102 240 94 222 94 L 175 94 L 175 72 L 220 72 C 236 72 244 64 244 54 C 244 43 236 37 222 37 L 132 37 Z"
          className="opacity-95"
        />

        {/* Curved Foundation Ground Horizon (Civil Infrastructure Topography) */}
        <path
          d="M 105 137 Q 185 130 280 138 Q 185 134 105 137 Z"
          className="opacity-80"
        />

        {/* Axonometric Building Structural Perspective Vignette */}
        {/* Cantilever Roof Slab */}
        <polygon points="195,75 220,65 248,80 222,90" className="opacity-95" />
        <polygon points="195,75 222,90 222,93 195,78" className="opacity-75" />
        <polygon points="222,90 248,80 248,83 222,93" className="opacity-75" />

        {/* Structural Column Bays / Mullions */}
        {/* Center Corner Column */}
        <rect x="220" y="92" width="4" height="42" className="opacity-95" />
        {/* Left Flank Column */}
        <rect x="196" y="77" width="3.5" height="57" className="opacity-85" />
        {/* Right Flank Column */}
        <rect x="245" y="82" width="3.5" height="52" className="opacity-85" />
        {/* Intermediate Mullions */}
        <rect x="208" y="84" width="2.5" height="50" className="opacity-70" />
        <rect x="233" y="87" width="2.5" height="47" className="opacity-70" />

        {/* Mid-Floor Spandrel Beam Band */}
        <polygon points="196,102 222,113 222,116 196,105" className="opacity-75" />
        <polygon points="222,113 246,103 246,106 222,116" className="opacity-75" />
      </g>
    </svg>
  );
};

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
}) => {
  const resolved = typeof size === 'number' ? { height: size, markSize: size * 0.9 } : SIZE_MAP[size];

  const content = (
    <div
      className={`inline-flex items-center transition-all duration-300 ${
        collapsed ? 'gap-0 justify-center' : 'gap-2.5 sm:gap-3'
      } ${variant === 'stacked' ? 'flex-col text-center items-center' : 'flex-row'} ${className}`}
    >
      {/* Structural Logo Mark */}
      <div className="relative shrink-0 flex items-center justify-center transition-transform duration-300">
        <LogoMark size={collapsed ? 24 : resolved.markSize} animated={animated} />
      </div>

      {/* Typography: PB CivilLab & Optional Official Tagline */}
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
            <span className="font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight" style={{ fontSize: `${resolved.height * 0.52}px` }}>
              PB
            </span>
            <span className="ml-1 font-bold text-[var(--md-sys-color-primary)] tracking-tight" style={{ fontSize: `${resolved.height * 0.52}px` }}>
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
        aria-label="PB CivilLab Home - Return to Workbench Dashboard"
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
        aria-label="PB CivilLab Home - Return to Workbench Dashboard"
        className="group inline-flex items-center text-[var(--md-sys-color-on-surface)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)] rounded-lg p-0.5 transition-all cursor-pointer border-0 bg-transparent text-left"
      >
        {content}
      </button>
    );
  }

  return content;
};

export default Logo;
