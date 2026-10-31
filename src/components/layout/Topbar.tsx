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
} from 'lucide-react';
import { useWorkbench } from '../../context/WorkbenchContext';
import { useTheme, EngineeringTheme } from '../../context/ThemeContext';
import { LogoMark } from '../Logo';
import { ThemePreference } from '../../types/civil';

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
}) => {
  const workbench = useWorkbench();
  const { theme, themeConfig, setTheme, availableThemes } = useTheme();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
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
      projectName: editName.trim() || 'Standard Civil Infrastructure Project',
      engineerName: editEngineer.trim() || 'Lead Structural Engineer',
      date: editDate || new Date().toISOString().split('T')[0],
    });
    setProjectPopoverOpen(false);
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-40 h-12 w-full bg-[var(--md-sys-color-surface)]/95 backdrop-blur-md border-b border-[var(--md-sys-color-outline-variant)] px-3 md:px-4 flex items-center justify-between gap-3 select-none">
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

        <div className="flex items-center gap-2">
          <LogoMark size={24} animated={false} className="shadow-xs shrink-0" />
          <span className="text-sm font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)] whitespace-nowrap hidden sm:inline">
            PB CivilLab
          </span>
          <span className="hidden lg:inline px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)]">
            v2.6 Enterprise
          </span>
        </div>
      </div>

      {/* Right Zone: Controls, Unit System Toggle, Project Quick-Edit, Theme Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

        {/* Global SI / Imperial Unit System Toggle Switch */}
        <div className="flex items-center bg-[var(--md-sys-color-surface-container-low)] p-1 rounded-xl border border-[var(--md-sys-color-outline-variant)]">
          <button
            type="button"
            onClick={() => workbench.setUnitSystem('SI')}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              workbench.unitSystem === 'SI'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
            title="Switch to Metric (SI) Units (m, mm, kN, MPa, m³)"
          >
            SI
          </button>
          <button
            type="button"
            onClick={() => workbench.setUnitSystem('Imperial')}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              workbench.unitSystem === 'Imperial'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-xs font-medium text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer max-w-[150px] sm:max-w-[200px]"
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
                <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)]">
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
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:outline-none"
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
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:outline-none"
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
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                  <button
                    type="button"
                    onClick={() => setProjectPopoverOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold shadow-xs cursor-pointer hover:opacity-95"
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

        {/* Engineering 4-Theme Switcher */}
        <div className="relative" ref={themeDropdownRef}>
          <button
            type="button"
            onClick={() => setThemeDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] text-xs font-mono transition-colors cursor-pointer"
            title="Switch Engineering Workbench Theme"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/30"
              style={{ backgroundColor: themeConfig.colors.accent }}
            />
            <span className="hidden sm:inline font-semibold">{themeConfig.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl p-1.5 z-50 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
                Engineering Theme Presets
              </div>
              {availableThemes.map((t) => {
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
                    className={`w-full text-left p-2 rounded flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                        : 'hover:bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex -space-x-1 shrink-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/30"
                          style={{ backgroundColor: t.colors.bg }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/30"
                          style={{ backgroundColor: t.colors.accent }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                          <span>{t.name}</span>
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
                            {t.subtitle}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                          {t.description}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Direct PDF Export Action */}
        {onDirectDownloadPdf && (
          <button
            type="button"
            onClick={onDirectDownloadPdf}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
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
