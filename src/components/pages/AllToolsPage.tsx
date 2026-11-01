import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  ListFilter,
  Pin,
  ArrowRight,
  Filter,
  Check,
  X,
  Layers,
  ArrowUpDown,
  BookOpen,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { EngineeringModuleId } from '../../types/civil';
import { useCivilLab } from '../../context/CivilLabContext';
import {
  TOOL_REGISTRY,
  TOOL_DISCIPLINES,
  ToolRegistryEntry,
  ToolDiscipline,
} from '../../data/toolRegistry';

export interface AllToolsPageProps {
  onSelectModule: (moduleId: EngineeringModuleId, subAction?: string) => void;
  onOpenArchitectureModal?: (tab: 'far' | 'staircase' | 'watertank' | 'septictank') => void;
  onOpenCadModal?: (tab: 'viewport' | 'shortcuts' | 'excel') => void;
  onOpenSiteQcModal?: () => void;
}

type ViewMode = 'grid' | 'table';
type SortOption = 'default' | 'alpha-asc' | 'alpha-desc' | 'pinned-first';

export const AllToolsPage: React.FC<AllToolsPageProps> = ({
  onSelectModule,
  onOpenArchitectureModal,
  onOpenCadModal,
  onOpenSiteQcModal,
}) => {
  const civilLab = useCivilLab();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const handleLaunchTool = (tool: ToolRegistryEntry) => {
    if (tool.moduleId) {
      onSelectModule(tool.moduleId);
    } else if (tool.modalType === 'architecture' && onOpenArchitectureModal) {
      onOpenArchitectureModal(tool.modalTab as any || 'far');
    } else if (tool.modalType === 'cad' && onOpenCadModal) {
      onOpenCadModal(tool.modalTab as any || 'viewport');
    } else if (tool.modalType === 'site-qc' && onOpenSiteQcModal) {
      onOpenSiteQcModal();
    }
  };

  // Filter and sort tools
  const processedTools = useMemo(() => {
    let result = [...TOOL_REGISTRY];

    // 1. Search Query Filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((tool) => {
        const matchTitle = tool.title.toLowerCase().includes(q);
        const matchShortLabel = tool.shortLabel.toLowerCase().includes(q);
        const matchShortCode = tool.shortCode.toLowerCase().includes(q);
        const matchCategory = tool.category.toLowerCase().includes(q);
        const matchSubCategory = tool.subCategory.toLowerCase().includes(q);
        const matchStandard = tool.standardUsed.toLowerCase().includes(q);
        const matchDesc = tool.description.toLowerCase().includes(q);
        const matchKeywords = tool.keywords.some((k) => k.toLowerCase().includes(q));

        return (
          matchTitle ||
          matchShortLabel ||
          matchShortCode ||
          matchCategory ||
          matchSubCategory ||
          matchStandard ||
          matchDesc ||
          matchKeywords
        );
      });
    }

    // 2. Discipline Filter
    if (selectedDiscipline !== 'all') {
      result = result.filter((tool) => tool.category === selectedDiscipline);
    }

    // 3. Sorting
    if (sortBy === 'pinned-first') {
      result.sort((a, b) => {
        const aPinned = civilLab.isToolPinned(a.id) ? 1 : 0;
        const bPinned = civilLab.isToolPinned(b.id) ? 1 : 0;
        if (bPinned !== aPinned) return bPinned - aPinned;
        return a.title.localeCompare(b.title);
      });
    } else if (sortBy === 'alpha-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'alpha-desc') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    }

    return result;
  }, [searchQuery, selectedDiscipline, sortBy, civilLab.pinnedTools]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-20 font-sans">
      {/* 1. TOP HEADER & PROMINENT DEDICATED SEARCH BAR */}
      <div className="rounded-2xl p-5 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-lg shadow-black/10 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)]/20 uppercase tracking-wider">
              Comprehensive Registry
            </span>
            <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              {TOOL_REGISTRY.length} Validated Civil & Structural Tools
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight mt-1">
            All Engineering Tools &amp; Features Directory
          </h1>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Search, filter, pin, and launch any calculation module, CAD drafting utility, or architectural by-law solver.
          </p>
        </div>

        {/* Dedicated Live Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[var(--md-sys-color-primary)] absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Instant live search... try "beam", "STR-01", "pile", "far", "manning", "1:100", "brick"'
            className="w-full h-11 pl-11 pr-11 text-xs sm:text-sm font-mono rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. CUSTOMIZATION TOOLBAR (View Switcher + Sort By + Category Filter Pills) */}
      <div className="rounded-2xl p-4 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
          {/* Left: View Mode Segmented Control */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] mr-1">
              View:
            </span>
            <div className="flex items-center p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-black'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-black'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
                title="Dense Compact Table View"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Compact Table</span>
              </button>
            </div>
          </div>

          {/* Right: Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)]">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] cursor-pointer"
            >
              <option value="default">Default (Discipline Category)</option>
              <option value="pinned-first">Pinned Tools First ★</option>
              <option value="alpha-asc">Alphabetical (A → Z)</option>
              <option value="alpha-desc">Alphabetical (Z → A)</option>
            </select>
            <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] ml-1">
              ({processedTools.length} found)
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedDiscipline('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold shrink-0 transition-all cursor-pointer border ${
              selectedDiscipline === 'all'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)] shadow-xs font-black'
                : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            All Disciplines ({TOOL_REGISTRY.length})
          </button>

          {TOOL_DISCIPLINES.map((discipline) => {
            const count = TOOL_REGISTRY.filter((t) => t.category === discipline).length;
            const isSelected = selectedDiscipline === discipline;

            return (
              <button
                key={discipline}
                type="button"
                onClick={() => setSelectedDiscipline(discipline)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold shrink-0 transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)] shadow-xs font-black'
                    : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <span>{discipline}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[var(--md-sys-color-on-primary)]/20 text-[var(--md-sys-color-on-primary)] font-bold' : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TOOLS PRESENTATION: GRID OR COMPACT TABLE */}
      {processedTools.length === 0 ? (
        <div className="rounded-2xl p-12 border border-dashed border-[var(--md-sys-color-outline)] text-center space-y-3 bg-[var(--md-sys-color-surface)]">
          <Search className="w-8 h-8 text-[var(--md-sys-color-on-surface-variant)] mx-auto opacity-50" />
          <div className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
            No engineering tools found for &quot;{searchQuery}&quot;
          </div>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-md mx-auto">
            Try searching for terms like &quot;beam&quot;, &quot;far&quot;, &quot;manning&quot;, &quot;mix&quot;, or select &quot;All Disciplines&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedDiscipline('all');
            }}
            className="px-4 py-1.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-mono font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: Technical Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedTools.map((tool) => {
            const isPinned = civilLab.isToolPinned(tool.id);

            return (
              <div
                key={tool.id}
                className={`group rounded-2xl p-5 border transition-all flex flex-col justify-between gap-3 shadow-2xs hover:shadow-lg ${
                  isPinned
                    ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/10 hover:border-amber-500'
                    : 'border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)]'
                }`}
              >
                <div>
                  {/* Top Badges & Pin Action */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)]">
                        {tool.shortCode}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                        {tool.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => civilLab.togglePinTool(tool.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isPinned
                          ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-amber-500 hover:bg-[var(--md-sys-color-surface-container)]'
                      }`}
                      title={isPinned ? 'Unpin tool' : 'Pin tool to Top Bar'}
                      aria-label={isPinned ? 'Unpin tool' : 'Pin tool'}
                    >
                      <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Title & Sub-category */}
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors leading-snug">
                    {tool.title}
                  </h3>
                  <div className="text-[11px] font-mono font-medium text-[var(--md-sys-color-primary)] mt-0.5">
                    {tool.subCategory}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-1.5 line-clamp-3">
                    {tool.description}
                  </p>

                  {/* Keywords chips */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {tool.keywords.slice(0, 4).map((kw) => (
                      <span
                        key={kw}
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate" title={tool.standardUsed}>
                    {tool.standardUsed}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleLaunchTool(tool)}
                    className="px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT LIST / TABLE VIEW */
        <div className="rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono divide-y divide-[var(--md-sys-color-outline-variant)]">
              <thead className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Pin</th>
                  <th className="py-2.5 px-3 w-20">Code</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Tool Name</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Discipline</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Sub-Category</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Standard Used</th>
                  <th className="py-2.5 px-4 text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                {processedTools.map((tool) => {
                  const isPinned = civilLab.isToolPinned(tool.id);

                  return (
                    <tr
                      key={tool.id}
                      onClick={() => handleLaunchTool(tool)}
                      className="hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer group"
                    >
                      {/* Pin Toggle */}
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          civilLab.togglePinTool(tool.id);
                        }}
                      >
                        <button
                          type="button"
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isPinned
                              ? 'text-amber-500'
                              : 'text-[var(--md-sys-color-on-surface-variant)] opacity-40 group-hover:opacity-100 hover:text-amber-500'
                          }`}
                          title={isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
                        </button>
                      </td>

                      {/* Code */}
                      <td className="py-2.5 px-3 font-bold text-[var(--md-sys-color-primary)]">
                        {tool.shortCode}
                      </td>

                      {/* Title */}
                      <td className="py-2.5 px-4 font-sans font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors">
                        {tool.title}
                      </td>

                      {/* Discipline */}
                      <td className="py-2.5 px-3 text-[var(--md-sys-color-on-surface-variant)]">
                        {tool.category}
                      </td>

                      {/* Sub-Category */}
                      <td className="py-2.5 px-3 text-[var(--md-sys-color-on-surface-variant)]">
                        {tool.subCategory}
                      </td>

                      {/* Standard */}
                      <td className="py-2.5 px-3 text-[var(--md-sys-color-on-surface-variant)] truncate max-w-[200px]">
                        {tool.standardUsed}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunchTool(tool);
                          }}
                          className="px-3 py-1 rounded-full bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] group-hover:bg-[var(--md-sys-color-primary)] group-hover:text-[var(--md-sys-color-on-primary)] font-bold transition-all text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
