import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  ArrowRight,
  Filter,
  Check,
  Compass,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EngineeringModuleId } from '../../types/civil';
import { TOOL_REGISTRY, ToolRegistryEntry } from '../../data/toolRegistry';
import { useWorkbench } from '../../context/WorkbenchContext';

interface DisciplineMatrixProps {
  onSelectModule: (moduleId: EngineeringModuleId) => void;
  onOpenArchitectureModal?: (tab: 'far' | 'staircase' | 'watertank' | 'septictank') => void;
  onOpenCadModal?: (tab: 'viewport' | 'shortcuts' | 'excel') => void;
  onOpenSiteQcModal?: () => void;
}

type DisciplineTab =
  | 'All'
  | 'Structural'
  | 'Geotech'
  | 'Architecture'
  | 'BOQ & BBS'
  | 'Hydraulics'
  | 'CAD & Excel';

const DISCIPLINE_TABS: DisciplineTab[] = [
  'All',
  'Structural',
  'Geotech',
  'Architecture',
  'BOQ & BBS',
  'Hydraulics',
  'CAD & Excel',
];

export const DisciplineMatrix: React.FC<DisciplineMatrixProps> = ({
  onSelectModule,
  onOpenArchitectureModal,
  onOpenCadModal,
  onOpenSiteQcModal,
}) => {
  const workbench = useWorkbench();
  const [activeTab, setActiveTab] = useState<DisciplineTab>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLaunchTool = (tool: ToolRegistryEntry) => {
    if (tool.modalType === 'architecture' && onOpenArchitectureModal) {
      onOpenArchitectureModal(tool.modalTab as 'far' | 'staircase' | 'watertank' | 'septictank');
    } else if (tool.modalType === 'cad' && onOpenCadModal) {
      onOpenCadModal(tool.modalTab as 'viewport' | 'shortcuts' | 'excel');
    } else if (tool.modalType === 'site-qc' && onOpenSiteQcModal) {
      onOpenSiteQcModal();
    } else if (tool.moduleId) {
      workbench.recordToolUsage(tool.moduleId);
      onSelectModule(tool.moduleId);
    }
  };

  const filteredTools = useMemo(() => {
    return TOOL_REGISTRY.filter((tool) => {
      // Category filter
      let matchesCategory = true;
      if (activeTab === 'Structural') {
        matchesCategory = tool.category === 'Structural';
      } else if (activeTab === 'Geotech') {
        matchesCategory = tool.category === 'Geotechnical';
      } else if (activeTab === 'Architecture') {
        matchesCategory = tool.category === 'Architecture & By-Laws';
      } else if (activeTab === 'BOQ & BBS') {
        matchesCategory =
          tool.category === 'BOQ & Takeoff' ||
          tool.id === 'rebar-bbs' ||
          tool.category === 'Materials & Mix';
      } else if (activeTab === 'Hydraulics') {
        matchesCategory = tool.category === 'Hydraulics & Drainage';
      } else if (activeTab === 'CAD & Excel') {
        matchesCategory =
          tool.category === 'CAD & Utilities' ||
          tool.category === 'Earthwork & Surveying' ||
          tool.category === 'Site QC & Field';
      }

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        tool.shortCode.toLowerCase().includes(q) ||
        tool.title.toLowerCase().includes(q) ||
        tool.shortLabel.toLowerCase().includes(q) ||
        tool.standardUsed.toLowerCase().includes(q) ||
        tool.subCategory.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  // Pinned / favorite tools
  const pinnedTools = useMemo(() => {
    return TOOL_REGISTRY.filter((tool) => tool.moduleId && workbench.isFavoriteTool(tool.moduleId));
  }, [workbench.favoriteTools]);

  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] rounded-md p-3.5 space-y-3 flex flex-col shadow-xs">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--md-sys-color-outline-variant)]/60 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
            Discipline Tool Matrix
          </h2>
          <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
            ({filteredTools.length} Solvers)
          </span>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code or name..."
            className="w-full pl-8 pr-2.5 py-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded text-xs font-mono text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60"
          />
        </div>
      </div>

      {/* DISCIPLINE TABS WITH JOYFUL ACCENTS */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5 text-xs">
        {DISCIPLINE_TABS.map((tab) => {
          const isSel = activeTab === tab;
          let activeClass = 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold';
          if (isSel) {
            if (tab === 'Structural') activeClass = 'bg-sky-500 text-white font-bold shadow-xs';
            else if (tab === 'Geotech') activeClass = 'bg-amber-500 text-slate-950 font-bold shadow-xs';
            else if (tab === 'Architecture') activeClass = 'bg-purple-500 text-white font-bold shadow-xs';
            else if (tab === 'BOQ & BBS') activeClass = 'bg-emerald-500 text-white font-bold shadow-xs';
            else if (tab === 'Hydraulics') activeClass = 'bg-teal-500 text-white font-bold shadow-xs';
            else if (tab === 'CAD & Excel') activeClass = 'bg-rose-500 text-white font-bold shadow-xs';
          }
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                isSel
                  ? activeClass
                  : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* PINNED TOOLS STRIP (IF ANY & NO SEARCH QUERY) */}
      {!searchQuery && activeTab === 'All' && pinnedTools.length > 0 && (
        <div className="p-2 bg-[var(--md-sys-color-surface-container-low)] border border-amber-500/30 rounded space-y-1.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>Pinned Engineering Solvers</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {pinnedTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleLaunchTool(tool)}
                className="px-2 py-1 bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] hover:border-amber-400/50 rounded text-left flex items-center justify-between group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-[10px] font-bold text-amber-400 shrink-0">
                    {tool.shortCode}
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                    {tool.shortLabel}
                  </span>
                </div>
                <ArrowRight className="w-2.5 h-2.5 text-slate-400 group-hover:text-amber-400 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FILTERED MATRIX TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-0.5">
        {filteredTools.map((tool) => {
          const isPinned = tool.moduleId ? workbench.isFavoriteTool(tool.moduleId) : false;

          // Discipline-specific jewel color
          const prefix = tool.shortCode.split('-')[0];
          let badgeStyle = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
          if (prefix === 'STR') badgeStyle = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
          else if (prefix === 'GEO') badgeStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
          else if (prefix === 'BOQ') badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
          else if (prefix === 'MAT') badgeStyle = 'bg-teal-500/15 text-teal-400 border-teal-500/30';
          else if (prefix === 'ARC') badgeStyle = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
          else if (prefix === 'HYD') badgeStyle = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
          else if (prefix === 'SUR') badgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
          else if (prefix === 'CAD') badgeStyle = 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
          else if (prefix === 'QCS') badgeStyle = 'bg-orange-500/15 text-orange-400 border-orange-500/30';

          return (
            <div
              key={tool.id}
              onClick={() => handleLaunchTool(tool)}
              className="p-2.5 bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/80 hover:border-sky-400/50 rounded transition-all cursor-pointer group flex flex-col justify-between space-y-2 shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded border font-mono text-[10px] font-bold shrink-0 ${badgeStyle}`}>
                    {tool.shortCode}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate max-w-[120px]">
                      {tool.standardUsed.split('/')[0]}
                    </span>
                    {tool.moduleId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          workbench.toggleFavoriteTool(tool.moduleId!);
                        }}
                        className={`p-0.5 rounded hover:bg-[var(--md-sys-color-surface)] transition-colors ${
                          isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                        }`}
                        title={isPinned ? 'Unpin tool' : 'Pin tool to top'}
                      >
                        <Star className={`w-3 h-3 ${isPinned ? 'fill-amber-500' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors line-clamp-1">
                  {tool.title}
                </div>

                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="pt-1 border-t border-[var(--md-sys-color-outline-variant)]/40 flex items-center justify-between text-[10px] font-mono">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">
                  {tool.subCategory}
                </span>
                <span className="text-[var(--md-sys-color-primary)] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Launch <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          );
        })}

        {filteredTools.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
            No engineering solvers matched &quot;{searchQuery}&quot; under &quot;{activeTab}&quot;.
          </div>
        )}
      </div>
    </div>
  );
};
