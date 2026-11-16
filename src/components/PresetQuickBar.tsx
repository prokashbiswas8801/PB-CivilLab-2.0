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
  // Helper to check if a preset directly populates the active module
  const matchesModulePayload = (p: EngineeringPreset): boolean => {
    if (p.payload.targetModule === activeModule) return true;
    switch (activeModule) {
      case 'concrete-materials':
        return Boolean(p.payload.concreteMaterials);
      case 'concrete-mix':
        return Boolean(p.payload.concreteMix);
      case 'rate-analysis':
        return Boolean(p.payload.rateAnalysis);
      case 'boq-estimator':
        return Boolean(p.payload.boq);
      case 'beam-analysis':
        return Boolean(p.payload.beam);
      case 'continuous-beam':
        return Boolean(p.payload.continuousBeam);
      case 'frame-truss-2d':
        return Boolean(p.payload.frameTruss2d);
      case 'section-analyzer':
        return Boolean(p.payload.sectionAnalyzer);
      case 'rc-column-design':
        return Boolean(p.payload.rcColumn);
      case 'strut-and-tie':
        return Boolean(p.payload.strutAndTie);
      case 'bearing-capacity':
        return Boolean(p.payload.bearing);
      case 'pile-capacity':
        return Boolean(p.payload.pile);
      case 'open-channel':
        return Boolean(p.payload.channel);
      case 'pipe-hydraulics':
        return Boolean(p.payload.pipe);
      case 'rebar-bbs':
        return Boolean(p.payload.rebarBbs);
      case 'masonry-finishes':
        return Boolean(p.payload.masonry);
      case 'earthwork-alignment':
        return Boolean(p.payload.earthwork);
      case 'surveying-suite':
        return Boolean(p.payload.surveying);
      default:
        return false;
    }
  };

  const directMatches = presets
    .filter(matchesModulePayload)
    .sort((a, b) => (a.payload.targetModule === activeModule ? -1 : b.payload.targetModule === activeModule ? 1 : 0));

  const relevantPresets =
    directMatches.length > 0
      ? directMatches
      : presets.filter((p) => {
          if (activeModule === 'concrete-materials' || activeModule === 'concrete-mix') {
            return p.category === 'concrete-mix';
          }
          if (activeModule === 'rate-analysis' || activeModule === 'boq-estimator') {
            return p.category === 'material-rates';
          }
          if (
            activeModule === 'beam-analysis' ||
            activeModule === 'continuous-beam' ||
            activeModule === 'frame-truss-2d' ||
            activeModule === 'section-analyzer' ||
            activeModule === 'rc-column-design' ||
            activeModule === 'strut-and-tie'
          ) {
            return p.category === 'structural-beam';
          }
          if (activeModule === 'bearing-capacity' || activeModule === 'pile-capacity') {
            return p.category === 'bearing-soil';
          }
          if (activeModule === 'open-channel' || activeModule === 'pipe-hydraulics' || activeModule === 'earthwork-alignment') {
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
