import React, { useState, useEffect } from 'react';
import { LogoMark } from './Logo';

export interface AppSplashProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

export const AppSplash: React.FC<AppSplashProps> = ({ onComplete, minDurationMs = 1200 }) => {
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Elegant presentation timer
    const timer = setTimeout(() => {
      setFading(true);
      const exitTimer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 400);
      return () => clearTimeout(exitTimer);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onComplete]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading PB CivilLab Workbench"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] transition-opacity duration-400 select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center max-w-sm px-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Animated Architectural Logo Mark */}
        <div className="relative flex items-center justify-center p-4">
          <div className="absolute inset-0 rounded-full bg-[var(--md-sys-color-primary)]/10 blur-xl animate-pulse" />
          <div className="relative text-[var(--md-sys-color-primary)]">
            <LogoMark size={68} animated={true} />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <div className="text-2xl font-extrabold tracking-tight">
            <span>PB</span>{' '}
            <span className="text-[var(--md-sys-color-primary)]">CivilLab</span>
          </div>
          <div className="text-[11px] font-mono uppercase font-bold tracking-widest text-[var(--md-sys-color-on-surface-variant)]">
            CALCULATE SMARTER. BUILD BETTER.
          </div>
        </div>

        {/* Subtle Engineering Load Bar */}
        <div className="w-48 h-1 bg-[var(--md-sys-color-surface-container-high)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--md-sys-color-primary)] rounded-full animate-indeterminate" />
        </div>

        {/* Developer Attribution & Bypass */}
        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] opacity-80 pt-2 space-y-2">
          <div>Developed &amp; Designed by <strong>PROKASH BISWAS</strong></div>
          <button
            type="button"
            onClick={() => {
              setFading(true);
              setTimeout(() => {
                setVisible(false);
                if (onComplete) onComplete();
              }, 200);
            }}
            className="text-[10px] underline hover:text-[var(--md-sys-color-primary)] cursor-pointer"
          >
            Enter Workbench &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppSplash;
