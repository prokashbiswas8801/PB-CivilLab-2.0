import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  RotateCw,
  FolderArchive,
  Download,
  Printer,
  ChevronDown,
  Check,
  Edit3,
  Calendar,
  User,
  Building,
  Sliders,
  Scale,
  Sparkles,
  Command,
  Palette,
  Home,
} from 'lucide-react';
import { useWorkbench } from '../../context/WorkbenchContext';
import { useTheme, EngineeringTheme } from '../../context/ThemeContext';
import { LogoMark } from '../Logo';
import { ThemePreference } from '../../types/civil';
import { OfflineSyncManager } from '../sitemanagement/OfflineSyncManager';

export interface TopbarProps {
  onToggleMobileSidebar: () => void;
  onOpenCommandPalette: () => void;
  themePreference: ThemePreference;
  onSelectTheme: (theme: ThemePreference) => void;
  onOpenPrintPreview?: () => void;
  onDirectDownloadPdf?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  sunlightMode?: boolean;
  onToggleSunlightMode?: () => void;
  onNavigateHome?: () => void;
  isHomeActive?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileSidebar,
  onOpenCommandPalette,
  themePreference,
  onSelectTheme,
  onOpenPrintPreview,
  onDirectDownloadPdf,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  sunlightMode = false,
  onToggleSunlightMode,
  onNavigateHome,
  isHomeActive = false,
}) => {
  const workbench = useWorkbench();
  const { theme, themeConfig, setTheme, cycleNextTheme, availableThemes } = useTheme();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [themeFilterMode, setThemeFilterMode] = useState<'all' | 'dark' | 'light'>('all');
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Local popover edit state
  const [editName, setEditName] = useState(workbench.projectMetadata.projectName);
  const [editEngineer, setEditEngineer] = useState(workbench.projectMetadata.engineerName);
  const [editDate, setEditDate] = useState(workbench.projectMetadata.date);

  // Synchronize when context updates
  useEffect(() => {
    setEditName(workbench.projectMetadata.projectName);
    setEditEngineer(workbench.projectMetadata.engineerName);
    setEditDate(workbench.projectMetadata.date);
  }, [workbench.projectMetadata]);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setProjectPopoverOpen(false);
      }
    };
    if (projectPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [projectPopoverOpen]);

  // Close theme dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    if (themeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [themeDropdownOpen]);

  const handleSaveMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    workbench.updateProjectMetadata({
      projectName: editName.trim() || 'Untitled Project',
      engineerName: editEngineer.trim(),
      date: editDate || new Date().toISOString().split('T')[0],
    });
    setProjectPopoverOpen(false);
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-40 h-12 w-full theme-glass-panel border-b border-[var(--md-sys-color-outline-variant)] px-3 md:px-4 flex items-center justify-between gap-3 select-none">
      {/* Left Zone: Mobile Hamburger + Brand Lockup */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (onNavigateHome) onNavigateHome();
            if (typeof window !== 'undefined') {
              const mainEl = document.getElementById('top');
              if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2.5 cursor-pointer group rounded-xl py-1 px-1.5 hover:bg-[var(--md-sys-color-surface-container-low)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
          title="Go to Home Dashboard — BD. CivilLab"
          aria-label="BD. CivilLab — Home Dashboard"
        >
          <LogoMark size={28} animated={true} className="shadow-xs shrink-0" />
          <div className="flex items-baseline gap-1.5 hidden sm:flex">
            <span className="text-sm font-black tracking-tight text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors whitespace-nowrap flex items-baseline">
              <span className="text-[var(--md-sys-color-primary)]">BD</span>
              <span className="inline-block w-1.5 h-1.5 rounded-[2px] bg-amber-500 mx-0.5 mb-0.5 shrink-0 transition-transform duration-300 group-hover:rotate-45" aria-hidden="true" />
              <span>Civil</span>
              <span className="text-[var(--md-sys-color-primary)] font-bold">Lab</span>
            </span>
            <span className="hidden xl:inline text-[10.5px] text-[var(--md-sys-color-on-surface-variant)] opacity-85 font-nikosh tracking-normal" lang="bn">
              • সিভিল ইঞ্জিনিয়ারিং ওয়ার্কবেঞ্চ
            </span>
          </div>
          <span className="hidden lg:inline px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)]">
            v2.6 Enterprise
          </span>
        </button>

        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            aria-current={isHomeActive ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
              isHomeActive
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)] shadow-xs'
                : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)]'
            }`}
            title="Go to Home (Alt+1)"
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>Home</span>
          </button>
        )}
      </div>

      {/* Right Zone: Controls, Unit System Toggle, Project Quick-Edit, Theme Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

        {/* Global SI / BD (Site) / Imperial Unit System Toggle Switch — Tactile Pill */}
        <div className="flex items-center bg-[var(--md-sys-color-surface-container-low)] p-0.5 rounded-full border border-[var(--md-sys-color-outline)] shadow-xs">
          <button
            type="button"
            onClick={() => workbench.setUnitSystem('SI')}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full transition-all cursor-pointer ${
              workbench.unitSystem === 'SI'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-black'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
            title="Switch to Metric (SI) Units (m, mm, kN, MPa, m³, L/s)"
          >
            SI
          </button>
          <button
            type="button"
            onClick={() => workbench.setUnitSystem('Regional')}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full transition-all cursor-pointer ${
              workbench.unitSystem === 'Regional'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-black'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
            title="Switch to Bangladesh Standard / Site (ft, in, Suta, RFT, SFT, CFT, Decimal, Katha, 50kg Bag, Maund) • বাংলাদেশ স্ট্যান্ডার্ড (BNBC / লোকাল সাইট ইউনিট)"
          >
            BD (Site)
          </button>
          <button
            type="button"
            onClick={() => workbench.setUnitSystem('Imperial')}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full transition-all cursor-pointer ${
              workbench.unitSystem === 'Imperial'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-black'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
            title="Switch to Imperial (US) Units (ft, in, kip, ksi, cft)"
          >
            US
          </button>
        </div>

        {/* Project Metadata Quick-Edit Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setProjectPopoverOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-xs font-medium text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer max-w-[150px] sm:max-w-[200px]"
            title="Edit Project Name, Engineer & Date"
          >
            <Building className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
            <span className="truncate hidden sm:inline">
              {workbench.projectMetadata.projectName}
            </span>
            <span className="truncate sm:hidden">Project</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
          </button>

          {projectPopoverOpen && (
            <div className="absolute right-0 mt-2 w-80 p-4 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] uppercase font-mono tracking-wider">
                  Project Metadata
                </span>
                <span className="text-[10px] font-mono font-bold text-[var(--md-sys-color-primary)]">
                  {workbench.projectMetadata.projectCode}
                </span>
              </div>

              <form onSubmit={handleSaveMetadata} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                    <Building className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                    <span>Project Name</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs px-4 py-2 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:outline-none"
                    placeholder="Enter project name..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                    <User className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                    <span>Engineer Name</span>
                  </label>
                  <input
                    type="text"
                    value={editEngineer}
                    onChange={(e) => setEditEngineer(e.target.value)}
                    className="w-full text-xs px-4 py-2 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:outline-none"
                    placeholder="Engineer of record..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                    <span>Calculation Date</span>
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full text-xs px-4 py-2 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                  <button
                    type="button"
                    onClick={() => setProjectPopoverOpen(false)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold shadow-xs cursor-pointer hover:opacity-95 font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Undo / Redo buttons (if handlers provided) */}
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-xl transition-colors cursor-pointer hidden md:flex ${
              canUndo
                ? 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                : 'text-[var(--md-sys-color-on-surface-variant)] opacity-40 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {onRedo && (
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-xl transition-colors cursor-pointer hidden md:flex ${
              canRedo
                ? 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                : 'text-[var(--md-sys-color-on-surface-variant)] opacity-40 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}

        {/* Interactive 6-Theme Architectural Studio Gallery Popover */}
        <div className="relative" ref={themeDropdownRef}>
          <button
            type="button"
            onClick={() => setThemeDropdownOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer btn-tactile ${
              themeDropdownOpen
                ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/30 text-[var(--md-sys-color-on-surface)] ring-2 ring-[var(--md-sys-color-primary)]/30'
                : 'border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]'
            }`}
            title="Open Architectural Theme Studio (6 Handcrafted Dark & Light Themes)"
          >
            <Palette className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
            <div className="flex -space-x-1 shrink-0">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/30 shadow-2xs"
                style={{ backgroundColor: themeConfig.colors.bg }}
              />
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/30 shadow-2xs"
                style={{ backgroundColor: themeConfig.colors.accent }}
              />
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/30 shadow-2xs"
                style={{ backgroundColor: themeConfig.colors.secondary }}
              />
            </div>
            <span className="hidden sm:inline font-bold tracking-tight">{themeConfig.name}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] transition-transform duration-200 ${
                themeDropdownOpen ? 'rotate-180 text-[var(--md-sys-color-primary)]' : ''
              }`}
            />
          </button>

          {themeDropdownOpen && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-auto sm:mt-2 w-[calc(100vw-1rem)] max-w-[490px] rounded-3xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]/95 backdrop-blur-2xl shadow-2xl p-3.5 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              {/* Popover Header + Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[var(--md-sys-color-outline-variant)]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    <span className="text-xs font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)]">
                      Architectural Theme Studio
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                      6 Curated
                    </span>
                  </div>
                  <p className="text-[10.5px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Blueprint micro-grids, 3D specular bevels &amp; ambient studio lighting
                  </p>
                </div>

                {/* Filter Pills: All / Dark / Light */}
                <div className="flex items-center gap-1 bg-[var(--md-sys-color-surface-container-low)] p-0.5 rounded-full border border-[var(--md-sys-color-outline-variant)] self-start sm:self-auto">
                  {(['all', 'dark', 'light'] as const).map((modeOpt) => {
                    const active = themeFilterMode === modeOpt;
                    return (
                      <button
                        key={modeOpt}
                        type="button"
                        onClick={() => setThemeFilterMode(modeOpt)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                          active
                            ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-2xs'
                            : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                        }`}
                      >
                        {modeOpt === 'dark' && <Moon className="w-2.5 h-2.5" />}
                        {modeOpt === 'light' && <Sun className="w-2.5 h-2.5" />}
                        <span>{modeOpt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2-Column Live Surface Preview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[68vh] overflow-y-auto custom-scrollbar pr-0.5">
                {availableThemes
                  .filter((t) => themeFilterMode === 'all' || t.mode === themeFilterMode)
                  .map((t) => {
                    const isActive = t.id === theme;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTheme(t.id);
                          onSelectTheme(t.mode === 'dark' ? 'dark' : 'light');
                          setThemeDropdownOpen(false);
                        }}
                        className={`group/tcard relative text-left rounded-2xl p-2.5 border transition-all cursor-pointer flex flex-col justify-between ${
                          isActive
                            ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/35 bg-[var(--md-sys-color-surface-container)] shadow-lg'
                            : 'border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/60 bg-[var(--md-sys-color-surface-container-low)]/70 hover:bg-[var(--md-sys-color-surface-container)]'
                        }`}
                      >
                        {/* Live Miniature Architectural Surface & 3D Glass Preview Canvas */}
                        <div
                          className="w-full h-20 rounded-xl relative overflow-hidden border mb-2.5 p-2 flex flex-col justify-between transition-transform duration-200 group-hover/tcard:scale-[1.01]"
                          style={{
                            backgroundColor: t.colors.bg,
                            borderColor: t.colors.border,
                            backgroundImage: `
                              radial-gradient(circle at 18% 20%, ${t.colors.ambientGlow} 0%, transparent 60%),
                              linear-gradient(to right, ${t.colors.gridLine} 1px, transparent 1px),
                              linear-gradient(to bottom, ${t.colors.gridLine} 1px, transparent 1px)
                            `,
                            backgroundSize: '100% 100%, 14px 14px, 14px 14px',
                          }}
                        >
                          {/* Top Mini HUD Bar inside Preview */}
                          <div className="flex items-center justify-between z-10">
                            <span
                              className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider border"
                              style={{
                                backgroundColor: t.colors.glassSurface,
                                borderColor: t.colors.border,
                                color: t.colors.text,
                                boxShadow: `inset 0 1px 0 0 ${t.colors.bevelHighlight}`,
                              }}
                            >
                              {t.subtitle}
                            </span>

                            <span
                              className="px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase flex items-center gap-1"
                              style={{
                                backgroundColor: t.colors.accent,
                                color: t.mode === 'dark' ? '#0C0B0A' : '#FFFFFF',
                              }}
                            >
                              {t.mode === 'dark' ? 'DARK' : 'LIGHT'}
                            </span>
                          </div>

                          {/* Miniature 3D Beveled Glass Card inside Preview */}
                          <div
                            className="rounded-lg p-1.5 border flex items-center justify-between gap-2 z-10"
                            style={{
                              backgroundColor: t.colors.card,
                              borderColor: t.colors.border,
                              boxShadow: `0 4px 10px -2px rgba(0,0,0,0.35), inset 0 1px 0 0 ${t.colors.bevelHighlight}`,
                            }}
                          >
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: t.colors.accent }}
                                />
                                <div
                                  className="h-1.5 w-14 rounded-full"
                                  style={{ backgroundColor: t.colors.text, opacity: 0.85 }}
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <div
                                  className="h-1 w-10 rounded-full"
                                  style={{ backgroundColor: t.colors.secondary, opacity: 0.9 }}
                                />
                                <div
                                  className="h-1 w-6 rounded-full"
                                  style={{ backgroundColor: t.colors.tertiary || t.colors.success, opacity: 0.85 }}
                                />
                              </div>
                            </div>

                            {/* 4-Swatch Palette Stack */}
                            <div className="flex -space-x-1 shrink-0">
                              {t.colors.palette.map((swatch, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-2xs"
                                  style={{ backgroundColor: swatch }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card Title, Description & Surface Badges */}
                        <div className="space-y-1.5 w-full">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs font-extrabold text-[var(--md-sys-color-on-surface)] truncate">
                              {t.name}
                            </span>
                            {isActive ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                Active
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-mono text-[var(--md-sys-color-on-surface-variant)] opacity-0 group-hover/tcard:opacity-100 transition-opacity">
                                Apply →
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] line-clamp-2 leading-snug">
                            {t.description}
                          </p>

                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {t.surfaceBadges.map((badge, bIdx) => (
                              <span
                                key={bIdx}
                                className="px-1.5 py-0.5 rounded-md text-[8.5px] font-mono font-semibold bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* Popover Footer */}
              <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                <span>
                  Active: <strong className="text-[var(--md-sys-color-primary)]">{themeConfig.name}</strong> ({themeConfig.mode.toUpperCase()})
                </span>
                <button
                  type="button"
                  onClick={() => cycleNextTheme()}
                  className="px-2.5 py-1 rounded-full border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-bold cursor-pointer transition-colors"
                >
                  Cycle Next Theme ↻
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Field Sunlight Mode Toggle (Ultra-high-contrast for outdoor job sites) */}
        {onToggleSunlightMode && (
          <button
            type="button"
            onClick={onToggleSunlightMode}
            aria-pressed={sunlightMode}
            className={`min-h-[32px] px-2.5 sm:px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              sunlightMode
                ? 'bg-amber-400 text-black border-amber-500 shadow-sm ring-2 ring-amber-400/50'
                : 'border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
            }`}
            title="Field Sunlight Mode (Shift+S): Ultra-high contrast pure black-on-white with bold CAD strokes for outdoor job sites under glare"
            aria-label="Toggle Field Sunlight Mode"
          >
            <Sun className={`w-3.5 h-3.5 ${sunlightMode ? 'text-black stroke-[2.5]' : 'text-amber-500'}`} />
            <span className="hidden xl:inline">{sunlightMode ? 'Sunlight Active' : 'Sunlight Mode'}</span>
          </button>
        )}

        {/* Global Offline Sync & Job-Site Status Pill */}
        <OfflineSyncManager className="hidden md:flex" />

        {/* Direct PDF Export Action */}
        {onDirectDownloadPdf && (
          <button
            type="button"
            onClick={onDirectDownloadPdf}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Download Certified PDF Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}
      </div>
    </header>
  );
};
