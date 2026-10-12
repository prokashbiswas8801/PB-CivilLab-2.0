import React from 'react';
import { UnitSystemPreset } from '../types/civil';
import { Sliders } from 'lucide-react';

export interface UnitPresetSelectorProps {
  currentPreset: UnitSystemPreset;
  onSelectPreset: (preset: UnitSystemPreset) => void;
  className?: string;
}

export const UnitPresetSelector: React.FC<UnitPresetSelectorProps> = ({
  currentPreset,
  onSelectPreset,
  className = '',
}) => {
  const presets: { id: UnitSystemPreset; label: string; tooltip: string }[] = [
    { id: 'metric', label: 'Metric (SI)', tooltip: 'm, mm, kN, MPa, m³, kg' },
    { id: 'imperial', label: 'Imperial / US', tooltip: 'ft, in, kips, psi, cft, lb' },
    { id: 'regional', label: 'Regional', tooltip: 'ft, in, CFT, Katha, 50kg bags' },
  ];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mr-1">
        <Sliders className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
        <span className="hidden sm:inline font-bold">Units:</span>
      </div>

      <div className="inline-flex rounded-lg p-0.5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
        {presets.map((p) => {
          const isActive = currentPreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p.id)}
              title={p.tooltip}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-bold shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
