import React from 'react';
import { BookmarkCheck, ChevronDown, Plus, Sparkles, Sliders } from 'lucide-react';
import { EngineeringPreset, EngineeringModuleId } from '../types/civil';

export interface PresetQuickBarProps {
  activeModule: EngineeringModuleId;
  presets: EngineeringPreset[];
  onApplyPreset: (preset: EngineeringPreset) => void;
  onOpenPresetsManager: () => void;
  onSaveCurrentAsPreset: () => void;
}

export const PresetQuickBar: React.FC<PresetQuickBarProps> = ({
  activeModule,
  presets,
  onApplyPreset,
  onOpenPresetsManager,
  onSaveCurrentAsPreset,
}) => {
  // Filter presets relevant to active module
  const relevantPresets = presets.filter((p) => {
    if (activeModule === 'concrete-materials' || activeModule === 'concrete-mix') {
      return p.category === 'concrete-mix';
    }
    if (activeModule === 'rate-analysis' || activeModule === 'boq-estimator') {
      return p.category === 'material-rates';
    }
    if (activeModule === 'beam-analysis') {
      return p.category === 'structural-beam';
    }
    if (activeModule === 'bearing-capacity') {
      return p.category === 'bearing-soil';
    }
    if (activeModule === 'open-channel' || activeModule === 'earthwork-alignment') {
      return p.category === 'earthwork-hydraulics';
    }
    return true;
  });

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-xs no-print">
      <div className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0 font-medium">
        <BookmarkCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
        <span className="hidden sm:inline">Module Presets:</span>
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
        {relevantPresets.slice(0, 3).map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApplyPreset(preset)}
            className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] shrink-0 transition-colors cursor-pointer truncate max-w-[140px]"
            title={`Apply "${preset.name}": ${preset.description}`}
          >
            {preset.name}
          </button>
        ))}

        <button
          type="button"
          onClick={onOpenPresetsManager}
          className="px-2 py-0.5 rounded text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline shrink-0 cursor-pointer"
        >
          View all ({presets.length}) →
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onSaveCurrentAsPreset}
          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:opacity-90 inline-flex items-center gap-1 cursor-pointer transition-opacity"
          title="Save current module inputs as a custom preset"
        >
          <Plus className="w-3 h-3" />
          <span className="hidden md:inline">Save as Preset</span>
        </button>
      </div>
    </div>
  );
};
