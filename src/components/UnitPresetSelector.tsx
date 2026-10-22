import React from 'react';
import { motion } from 'framer-motion';
import { UnitSystemPreset } from '../types/civil';
import { Sliders, RefreshCw } from 'lucide-react';

export interface UnitPresetSelectorProps {
  currentPreset: UnitSystemPreset;
  onSelectPreset: (preset: UnitSystemPreset) => void;
  isTransitioning?: boolean;
  className?: string;
}

export const UnitPresetSelector: React.FC<UnitPresetSelectorProps> = ({
  currentPreset,
  onSelectPreset,
  isTransitioning = false,
  className = '',
}) => {
  const presets: { id: UnitSystemPreset; label: string; tooltip: string }[] = [
    { id: 'metric', label: 'Metric (SI)', tooltip: 'm, mm, kN, MPa, m³, kg' },
    { id: 'imperial', label: 'Imperial / US', tooltip: 'ft, in, kips, psi, cft, lb' },
    { id: 'regional', label: 'Regional', tooltip: 'ft, in, CFT, Katha, 50kg bags' },
  ];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mr-1 select-none">
        {isTransitioning ? (
          <RefreshCw className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] animate-spin" />
        ) : (
          <Sliders className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] transition-transform hover:rotate-45" />
        )}
        <span className="hidden sm:inline font-bold">Units:</span>
      </div>

      <div className="relative inline-flex rounded-lg p-0.5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        {presets.map((p) => {
          const isActive = currentPreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p.id)}
              title={p.tooltip}
              className={`relative px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-colors cursor-pointer select-none z-10 ${
                isActive
                  ? 'text-[var(--md-sys-color-primary)] font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeUnitPresetPill"
                  className="absolute inset-0 bg-[var(--md-sys-color-surface)] rounded-md shadow-xs border border-[var(--md-sys-color-outline-variant)]/60 -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-1">
                {p.label}
              </span>
            </button>
          );
        })}
      </div>

      {isTransitioning && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="text-[10px] font-mono text-[var(--md-sys-color-primary)] font-bold hidden lg:inline animate-pulse"
        >
          Converting...
        </motion.span>
      )}
    </div>
  );
};

