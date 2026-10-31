import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRightLeft,
  BookOpen,
  Download,
  ChevronUp,
  X,
  Layers,
  Check,
  Compass,
  CornerDownLeft,
} from 'lucide-react';
import { EngineeringModuleId, BuildingCode } from '../../types/civil';
import { useWorkbench, GlobalUnitSystem } from '../../context/WorkbenchContext';
import { useTheme, EngineeringTheme } from '../../context/ThemeContext';
import { TOOL_REGISTRY, ToolRegistryEntry, TOOL_DISCIPLINES, ToolDiscipline } from '../../data/toolRegistry';

export interface BottomCommandBarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  activeModule: EngineeringModuleId;
  governingCode: BuildingCode;
  onChangeGoverningCode?: (code: BuildingCode) => void;
  onSelectModule: (moduleId: EngineeringModuleId) => void;
  onOpenArchitectureModal?: (tab?: any) => void;
  onOpenCadModal?: (tab?: any) => void;
  onOpenSiteQcModal?: () => void;
  onExportPdf?: () => void;
  onOpenCommandPalette?: () => void;
}

export const BottomCommandBar: React.FC<BottomCommandBarProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  activeModule,
  governingCode,
  onChangeGoverningCode,
  onSelectModule,
  onOpenArchitectureModal,
  onOpenCadModal,
  onOpenSiteQcModal,
  onExportPdf,
  onOpenCommandPalette,
}) => {
  const workbench = useWorkbench();
  const { theme, themeConfig, setTheme, availableThemes } = useTheme();

  // Bottom Command & Search Input State
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categoryLauncherOpen, setCategoryLauncherOpen] = useState(false);
  const [codeDropdownOpen, setCodeDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Filter tools based on query
  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default recommended tools
      return TOOL_REGISTRY.slice(0, 10);
    }
    return TOOL_REGISTRY.filter((tool) => {
      const matchTitle = tool.title.toLowerCase().includes(q);
      const matchShortCode = tool.shortCode.toLowerCase().includes(q);
      const matchCategory = tool.category.toLowerCase().includes(q);
      const matchKeywords = tool.keywords.some((k) => k.toLowerCase().includes(q));
      const matchStandard = tool.standardUsed.toLowerCase().includes(q);
      return matchTitle || matchShortCode || matchCategory || matchKeywords || matchStandard;
    });
  }, [query]);

  // Group filtered results by Discipline
  const groupedTools = useMemo(() => {
    const groups: Partial<Record<ToolDiscipline, ToolRegistryEntry[]>> = {};
    for (const tool of filteredTools) {
      if (!groups[tool.category]) {
        groups[tool.category] = [];
      }
      groups[tool.category]!.push(tool);
    }
    return groups;
  }, [filteredTools]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsFocused(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(target)) {
        setCategoryLauncherOpen(false);
      }
      if (codeRef.current && !codeRef.current.contains(target)) {
        setCodeDropdownOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(target)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keydown: focus bottom bar when pressing "/" if not typing in another input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsFocused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExecuteTool = (tool: ToolRegistryEntry) => {
    if (tool.moduleId) {
      onSelectModule(tool.moduleId);
    } else if (tool.modalType === 'architecture' && onOpenArchitectureModal) {
      onOpenArchitectureModal(tool.modalTab);
    } else if (tool.modalType === 'cad' && onOpenCadModal) {
      onOpenCadModal(tool.modalTab);
    } else if (tool.modalType === 'site-qc' && onOpenSiteQcModal) {
      onOpenSiteQcModal();
    }
    setIsFocused(false);
    setQuery('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredTools.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % Math.max(1, filteredTools.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools.length > 0) {
        handleExecuteTool(filteredTools[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const isResultsOpen = isFocused && (query.trim().length > 0 || isFocused);

  return (
    <footer className="fixed bottom-0 inset-x-0 z-50 h-11 bg-[var(--md-sys-color-surface)]/95 backdrop-blur-md border-t border-[var(--md-sys-color-outline)] px-3 flex items-center justify-between gap-2.5 text-xs font-mono select-none print:hidden">
      {/* LEFT SECTION: Sidebar Toggle & Quick Category Launcher */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          title={isSidebarCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar'}
          aria-label="Toggle Sidebar"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Quick Category Launcher Popover */}
        <div className="relative" ref={categoryRef}>
          <button
            type="button"
            onClick={() => setCategoryLauncherOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
            title="Browse Engineering Disciplines"
          >
            <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
            <span className="hidden sm:inline font-semibold">Disciplines</span>
            <ChevronUp className="w-3 h-3 text-[var(--md-sys-color-on-surface-variant)]" />
          </button>

          {categoryLauncherOpen && (
            <div className="absolute bottom-full mb-1 left-0 w-64 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl p-1 z-50 space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
                Civil Disciplines
              </div>
              {TOOL_DISCIPLINES.map((discipline) => {
                const count = TOOL_REGISTRY.filter((t) => t.category === discipline).length;
                return (
                  <button
                    key={discipline}
                    type="button"
                    onClick={() => {
                      setQuery(discipline);
                      setCategoryLauncherOpen(false);
                      setIsFocused(true);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <span className="font-medium text-[var(--md-sys-color-on-surface)]">{discipline}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
                      {count} tools
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CENTER SECTION: AutoCAD-Style Bottom Command Line & Upward Results Menu */}
      <div className="flex-1 max-w-2xl relative" ref={searchContainerRef}>
        <div
          className={`flex items-center h-8 px-2.5 rounded border transition-all ${
            isFocused
              ? 'border-[var(--md-sys-color-primary)] ring-1 ring-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)]'
              : 'border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-outline-variant)]'
          }`}
        >
          <span className="text-[var(--md-sys-color-primary)] font-bold text-xs mr-2 font-mono select-none">
            &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleInputKeyDown}
            placeholder='Type a command or search tools... e.g. "beam", "bbs", "far", "brick", "STR-01"'
            className="w-full bg-transparent text-xs font-mono text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] shrink-0">
            /
          </kbd>
        </div>

        {/* Upward-Expanding Smart Results Menu */}
        {isResultsOpen && (
          <div className="absolute bottom-full mb-1 left-0 right-0 max-h-96 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl overflow-y-auto p-1.5 z-50 custom-scrollbar space-y-2">
            <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--md-sys-color-outline-variant)] text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
              <span>{query ? `Search: "${query}" (${filteredTools.length} tools)` : 'Recommended Engineering Tools'}</span>
              <span>Navigate: [↑/↓] Select: [Enter] Close: [Esc]</span>
            </div>

            {filteredTools.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                No matching tools or codes found for &quot;{query}&quot;. Try &quot;beam&quot;, &quot;far&quot;, &quot;mix&quot;, or &quot;STR-01&quot;.
              </div>
            ) : (
              Object.entries(groupedTools).map(([discipline, tools]) => (
                <div key={discipline} className="space-y-0.5">
                  <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                    {discipline}
                  </div>
                  {tools!.map((tool) => {
                    const globalIdx = filteredTools.findIndex((t) => t.id === tool.id);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleExecuteTool(tool)}
                        className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] ring-1 ring-[var(--md-sys-color-primary)]'
                            : 'hover:bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Short-code badge */}
                          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)] shrink-0">
                            {tool.shortCode}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                              {tool.title}
                            </div>
                            <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                              Standard: {tool.standardUsed} · {tool.subCategory}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <CornerDownLeft className="w-3 h-3 text-[var(--md-sys-color-on-surface-variant)]/60" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* RIGHT SECTION: Interactive Engineering Status Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Status Pill 1: Unit System Toggle */}
        <button
          type="button"
          onClick={() => {
            const nextUnit: GlobalUnitSystem = workbench.unitSystem === 'SI' ? 'Imperial' : 'SI';
            workbench.setUnitSystem(nextUnit);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer text-[11px]"
          title="Click to toggle Global Unit System (SI <-> Imperial)"
        >
          <ArrowRightLeft className="w-3 h-3 text-[var(--md-sys-color-primary)] shrink-0" />
          <span className="font-bold">
            {workbench.unitSystem === 'SI' ? 'SI: kN, m' : 'IMP: kip, ft'}
          </span>
        </button>

        {/* Status Pill 2: Active Code Reference Dropdown */}
        <div className="relative" ref={codeRef}>
          <button
            type="button"
            onClick={() => setCodeDropdownOpen((prev) => !prev)}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer text-[11px]"
            title="Active Structural & Building Code Reference"
          >
            <BookOpen className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="font-semibold">{governingCode}</span>
          </button>

          {codeDropdownOpen && onChangeGoverningCode && (
            <div className="absolute bottom-full mb-1 right-0 w-44 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl p-1 z-50 space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
                Governing Code
              </div>
              {(['BNBC-2020', 'ACI-318', 'IS-456'] as BuildingCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    onChangeGoverningCode(code);
                    setCodeDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    governingCode === code
                      ? 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] font-bold'
                      : 'hover:bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  <span>{code}</span>
                  {governingCode === code && <Check className="w-3 h-3 text-[var(--md-sys-color-primary)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Pill 3: Theme Selector Popover */}
        <div className="relative" ref={themeRef}>
          <button
            type="button"
            onClick={() => setThemeDropdownOpen((prev) => !prev)}
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer text-[11px]"
            title="Switch Engineering Theme"
          >
            <span
              className="w-2 h-2 rounded-full border border-black/20 shrink-0"
              style={{ backgroundColor: themeConfig.colors.accent }}
            />
            <span className="font-semibold">{themeConfig.name}</span>
          </button>

          {themeDropdownOpen && (
            <div className="absolute bottom-full mb-1 right-0 w-60 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl p-1 z-50 space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
                Engineering Themes
              </div>
              {availableThemes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    theme === t.id
                      ? 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] font-bold'
                      : 'hover:bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: t.colors.accent }}
                    />
                    <span>{t.name}</span>
                  </div>
                  {theme === t.id && <Check className="w-3 h-3 text-[var(--md-sys-color-primary)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Pill 4: Quick Export PDF */}
        {onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer text-[11px] shadow-xs shrink-0"
            title="Direct Export Certified PDF Submittal Report"
          >
            <Download className="w-3 h-3" />
            <span>PDF</span>
          </button>
        )}
      </div>
    </footer>
  );
};
