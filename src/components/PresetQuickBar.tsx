import React, { useState, useRef, useEffect } from 'react';
import {
  BookmarkCheck,
  ChevronDown,
  Plus,
  Sparkles,
  RotateCcw,
  BookOpenCheck,
  Share2,
} from 'lucide-react';
import { EngineeringPreset, EngineeringModuleId } from '../types/civil';
import { WorkedExampleEntry } from '../data/workedExamples';

export interface PresetQuickBarProps {
  activeModule: EngineeringModuleId;
  presets: EngineeringPreset[];
  onApplyPreset: (preset: EngineeringPreset) => void;
  onOpenPresetsManager: () => void;
  onSaveCurrentAsPreset: () => void;
  workedExamples?: WorkedExampleEntry[];
  onSelectWorkedExample?: (example: WorkedExampleEntry) => void;
  onCopyWorkedExampleUrl?: () => void;
  onLoadStandardPreset?: () => void;
  onResetToZero?: () => void;
  collapsedOnMobile?: boolean;
}

export const PresetQuickBar: React.FC<PresetQuickBarProps> = ({
  activeModule,
  presets,
  onApplyPreset,
  onOpenPresetsManager,
  onSaveCurrentAsPreset,
  workedExamples = [],
  onSelectWorkedExample,
  onCopyWorkedExampleUrl,
  onLoadStandardPreset,
  onResetToZero,
  collapsedOnMobile = false,
}) => {
  const [examplesOpen, setExamplesOpen] = useState(false);
  const examplesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (examplesRef.current && !examplesRef.current.contains(e.target as Node)) {
        setExamplesOpen(false);
      }
    };
    if (examplesOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [examplesOpen]);

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
    <div
      className={`items-center justify-between gap-2 px-3 md:px-6 py-1.5 bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] text-xs no-print transition-all duration-200 ${
        collapsedOnMobile ? 'hidden md:flex' : 'flex flex-wrap'
      }`}
    >
      {/* Left: Worked Examples Dropdown + Quick Preset Chips */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {workedExamples.length > 0 && onSelectWorkedExample && (
          <div className="relative shrink-0" ref={examplesRef}>
            <button
              type="button"
              onClick={() => setExamplesOpen((prev) => !prev)}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
              aria-expanded={examplesOpen}
              title="Load verified BNBC, PWD, and textbook worked examples"
            >
              <BookOpenCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Examples ({workedExamples.length})</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${examplesOpen ? 'rotate-180' : ''}`} />
            </button>

            {examplesOpen && (
              <div
                role="menu"
                className="absolute left-0 mt-1.5 w-80 max-w-[90vw] rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl p-1.5 z-40 space-y-1 text-xs font-sans"
              >
                <div className="px-2.5 py-1.5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--md-sys-color-primary)]">
                    Worked Examples
                  </span>
                  {onCopyWorkedExampleUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        onCopyWorkedExampleUrl();
                        setExamplesOpen(false);
                      }}
                      className="text-[10px] font-mono font-semibold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Copy shareable URL for current state"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Copy URL</span>
                    </button>
                  )}
                </div>

                {workedExamples.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setExamplesOpen(false);
                      onSelectWorkedExample(ex);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{ex.title}</span>
                      <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] shrink-0">
                        {ex.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-snug">
                      {ex.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1 text-[var(--md-sys-color-on-surface-variant)] shrink-0 font-medium pl-1">
          <BookmarkCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          <span>Presets:</span>
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
          {onLoadStandardPreset && (
            <button
              type="button"
              onClick={onLoadStandardPreset}
              className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[var(--md-sys-color-primary-container)]/50 hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-primary)]/30 shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
              title="Populate standard engineering preset for this module"
            >
              <Sparkles className="w-3 h-3" />
              <span>Standard</span>
            </button>
          )}

          {relevantPresets.slice(0, 3).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset)}
              className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] shrink-0 transition-colors cursor-pointer truncate max-w-[135px]"
              title={`Apply "${preset.name}": ${preset.description}`}
            >
              {preset.name}
            </button>
          ))}

          <button
            type="button"
            onClick={onOpenPresetsManager}
            className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline shrink-0 cursor-pointer"
          >
            All ({presets.length})
          </button>
        </div>
      </div>

      {/* Right: Save Preset + Reset to Zero */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onSaveCurrentAsPreset}
          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] inline-flex items-center gap-1 cursor-pointer transition-colors"
          title="Save current module inputs as a custom preset"
        >
          <Plus className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
          <span className="hidden sm:inline">Save Preset</span>
        </button>

        {onResetToZero && (
          <button
            type="button"
            onClick={onResetToZero}
            className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[var(--md-sys-color-surface)] hover:bg-rose-500/10 text-[var(--md-sys-color-on-surface)] hover:text-rose-600 dark:hover:text-rose-400 border border-[var(--md-sys-color-outline-variant)] hover:border-rose-500/40 inline-flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset all fields in this module back to 0 baseline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset 0</span>
          </button>
        )}
      </div>
    </div>
  );
};
