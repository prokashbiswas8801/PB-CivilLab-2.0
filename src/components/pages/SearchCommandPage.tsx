import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Terminal,
  Clock,
  ArrowRight,
  CornerDownLeft,
  X,
  Trash2,
  Copy,
  Check,
  Calculator,
  ArrowRightLeft,
  BookOpen,
  Palette,
  FileDown,
  History,
  User,
  Sliders,
  FolderArchive,
  Sparkles,
  Command,
} from 'lucide-react';
import { EngineeringModuleId, CalculationRecord } from '../../types/civil';
import { useCivilLab } from '../../context/CivilLabContext';
import { useWorkbench } from '../../context/WorkbenchContext';
import { useTheme } from '../../context/ThemeContext';
import { TOOL_REGISTRY, ToolRegistryEntry } from '../../data/toolRegistry';
import { evaluateInlineMath, MathEvaluationResult } from '../../utils/inlineMathEvaluator';

export interface SearchCommandPageProps {
  onSelectModule: (moduleId: EngineeringModuleId, subAction?: string) => void;
  onOpenArchitectureModal?: (tab: 'far' | 'staircase' | 'watertank' | 'septictank') => void;
  onOpenCadModal?: (tab: 'viewport' | 'shortcuts' | 'excel') => void;
  onOpenSiteQcModal?: () => void;
  onOpenProfileModal?: (tab?: 'profile' | 'preferences' | 'presets') => void;
  onOpenPrintPreview?: () => void;
  onDirectDownloadPdf?: () => void;
  onOpenHistoryDrawer?: () => void;
  onOpenWorkspaceManager?: () => void;
}

interface CommandAction {
  id: string;
  title: string;
  category: 'Commands' | 'Units' | 'Themes' | 'Actions';
  description: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export const SearchCommandPage: React.FC<SearchCommandPageProps> = ({
  onSelectModule,
  onOpenArchitectureModal,
  onOpenCadModal,
  onOpenSiteQcModal,
  onOpenProfileModal,
  onOpenPrintPreview,
  onDirectDownloadPdf,
  onOpenHistoryDrawer,
  onOpenWorkspaceManager,
}) => {
  const civilLab = useCivilLab();
  const workbench = useWorkbench();
  const { theme, setTheme, availableThemes } = useTheme();

  const [query, setQuery] = useState('');
  const [copiedMath, setCopiedMath] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Inline Math or Unit Evaluation Result
  const mathResult: MathEvaluationResult | null = useMemo(() => {
    if (!query.trim()) return null;
    return evaluateInlineMath(query);
  }, [query]);

  // Copy Math evaluation result to clipboard
  const handleCopyMath = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMath(true);
    setTimeout(() => setCopiedMath(false), 2000);
  };

  // Launch a tool entry
  const handleLaunchTool = (tool: ToolRegistryEntry) => {
    civilLab.addSearchQuery(tool.title);
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

  // Quick Executable System Commands
  const systemCommands: CommandAction[] = useMemo(() => [
    {
      id: 'cmd-unit-si',
      title: 'Switch to SI Metric Unit System (kN, m, MPa)',
      category: 'Units',
      description: 'Set global engineering unit system to Metric SI conventions.',
      icon: ArrowRightLeft,
      shortcut: 'SI',
      action: () => {
        workbench.setUnitSystem('SI');
        civilLab.addSearchQuery('> Switch to SI Units');
      },
    },
    {
      id: 'cmd-unit-imp',
      title: 'Switch to Imperial US Customary Units (kip, ft, psi)',
      category: 'Units',
      description: 'Set global engineering unit system to US Customary conventions.',
      icon: ArrowRightLeft,
      shortcut: 'IMP',
      action: () => {
        workbench.setUnitSystem('Imperial');
        civilLab.addSearchQuery('> Switch to Imperial Units');
      },
    },
    {
      id: 'cmd-open-history',
      title: 'View Saved Calculation History Ledger',
      category: 'Actions',
      description: 'Review permanent snapshots of past calculations & unit conversions.',
      icon: History,
      shortcut: 'Alt+5',
      action: () => {
        civilLab.addSearchQuery('> View Saved History');
        if (onOpenHistoryDrawer) onOpenHistoryDrawer();
        else civilLab.setActivePage('history');
      },
    },
    {
      id: 'cmd-open-profile',
      title: 'Open Engineer Profile & License Preferences',
      category: 'Actions',
      description: 'Manage official registration number, designation, and company header.',
      icon: User,
      shortcut: 'Alt+6',
      action: () => {
        civilLab.addSearchQuery('> Open Profile');
        onOpenProfileModal?.('profile');
      },
    },
    {
      id: 'cmd-open-pdf-preset',
      title: 'Configure Global PDF Export Presets',
      category: 'Actions',
      description: 'Customize paper margins, header titles, QR stamps, and orientation.',
      icon: Sliders,
      action: () => {
        civilLab.addSearchQuery('> Open PDF Presets');
        onOpenProfileModal?.('presets');
      },
    },
    {
      id: 'cmd-manage-projects',
      title: 'Open Project Workspaces Manager',
      category: 'Actions',
      description: 'Switch, clone, export, or create new engineering project workspaces.',
      icon: FolderArchive,
      action: () => {
        civilLab.addSearchQuery('> Manage Projects');
        onOpenWorkspaceManager?.();
      },
    },
    {
      id: 'cmd-direct-pdf',
      title: 'Export Certified Engineering PDF Report',
      category: 'Actions',
      description: 'Instantly download vector PDF calculation submittal for active module.',
      icon: FileDown,
      action: () => {
        civilLab.addSearchQuery('> Export PDF');
        onDirectDownloadPdf?.();
      },
    },
    ...availableThemes.map((t) => ({
      id: `cmd-theme-${t.id}`,
      title: `Theme: ${t.name} (${t.subtitle})`,
      category: 'Themes' as const,
      description: t.description,
      icon: Palette,
      action: () => {
        setTheme(t.id);
        civilLab.addSearchQuery(`> Theme: ${t.name}`);
      },
    })),
  ], [workbench, civilLab, availableThemes, setTheme, onOpenHistoryDrawer, onOpenProfileModal, onOpenWorkspaceManager, onDirectDownloadPdf]);

  // Is Command Mode active (query starts with '>')
  const isCommandMode = query.trim().startsWith('>');
  const cleanCommandQuery = query.trim().replace(/^>\s*/, '').toLowerCase();

  // Filtered Commands
  const filteredCommands = useMemo(() => {
    if (!isCommandMode && !query.trim()) return systemCommands.slice(0, 6);
    if (isCommandMode) {
      if (!cleanCommandQuery) return systemCommands;
      return systemCommands.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(cleanCommandQuery) ||
          cmd.description.toLowerCase().includes(cleanCommandQuery) ||
          cmd.category.toLowerCase().includes(cleanCommandQuery)
      );
    }
    const q = query.trim().toLowerCase();
    return systemCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [systemCommands, isCommandMode, cleanCommandQuery, query]);

  // Filtered Tools
  const filteredTools = useMemo(() => {
    if (isCommandMode) return [];
    const q = query.trim().toLowerCase();
    if (!q) return TOOL_REGISTRY.slice(0, 8); // Recommended default

    return TOOL_REGISTRY.filter((tool) => {
      const matchTitle = tool.title.toLowerCase().includes(q);
      const matchShortLabel = tool.shortLabel.toLowerCase().includes(q);
      const matchShortCode = tool.shortCode.toLowerCase().includes(q);
      const matchCategory = tool.category.toLowerCase().includes(q);
      const matchSubCategory = tool.subCategory.toLowerCase().includes(q);
      const matchStandard = tool.standardUsed.toLowerCase().includes(q);
      const matchKeywords = tool.keywords.some((k) => k.toLowerCase().includes(q));

      return matchTitle || matchShortLabel || matchShortCode || matchCategory || matchSubCategory || matchStandard || matchKeywords;
    });
  }, [query, isCommandMode]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-3 sm:px-6 pt-4 pb-20 font-sans">
      {/* 1. UNIFIED COMMAND SEARCH INPUT BAR */}
      <div className="rounded-2xl p-5 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-lg shadow-black/10 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)]/20 uppercase tracking-wider flex items-center gap-1">
              <Command className="w-3 h-3" />
              Multi-Mode Engine
            </span>
            <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Search Tools · Run Commands (type &quot;&gt;&quot;) · Evaluate Math (e.g. 25*1.54)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight mt-1">
            Search &amp; Intelligent Command Palette
          </h1>
        </div>

        {/* Search Input Box */}
        <div className="relative flex items-center">
          <span className="text-[var(--md-sys-color-primary)] font-bold text-base font-mono absolute left-4 select-none">
            {isCommandMode ? '>' : '/'}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (filteredCommands.length > 0 && isCommandMode) {
                  filteredCommands[0].action();
                } else if (filteredTools.length > 0) {
                  handleLaunchTool(filteredTools[0]);
                }
              }
            }}
            placeholder='Type a command, tool name, code (STR-01), or math: e.g. "> switch to imperial", "beam", "25*1.54", "10 m to ft"'
            className="w-full h-12 pl-10 pr-12 text-sm sm:text-base font-mono rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-3.5 p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] absolute right-3 pointer-events-none">
              Ctrl+K
            </kbd>
          )}
        </div>

        {/* Quick Command Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs font-mono">
          <span className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] mr-1">
            Quick Actions:
          </span>
          <button
            type="button"
            onClick={() => setQuery('> ')}
            className="px-2 py-0.5 rounded-lg border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] font-bold cursor-pointer"
          >
            &gt; Commands Mode
          </button>
          <button
            type="button"
            onClick={() => setQuery('25 * 1.54')}
            className="px-2 py-0.5 rounded-lg border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
          >
            25 * 1.54 (Dry Vol)
          </button>
          <button
            type="button"
            onClick={() => setQuery('10 m to ft')}
            className="px-2 py-0.5 rounded-lg border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
          >
            10 m to ft
          </button>
          <button
            type="button"
            onClick={() => setQuery('50 kn to kip')}
            className="px-2 py-0.5 rounded-lg border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
          >
            50 kN to kip
          </button>
          <button
            type="button"
            onClick={() => setQuery('STR-01')}
            className="px-2 py-0.5 rounded-lg border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
          >
            STR-01 (Beam)
          </button>
        </div>
      </div>

      {/* 2. INSTANT INLINE MATH & CONVERSION EVALUATION CARD */}
      {mathResult && (
        <div className="rounded-2xl p-4 sm:p-5 border-2 border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-lg animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {mathResult.isUnitConversion ? 'Live Engineering Unit Conversion' : 'Instant Math Expression Evaluation'}
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-900 dark:text-emerald-200 tracking-tight mt-0.5">
                  {mathResult.formattedResult}
                </div>
                <div className="text-xs font-mono text-emerald-800 dark:text-emerald-300/80 mt-0.5">
                  {mathResult.explanation}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyMath(String(mathResult.result))}
              className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 text-xs font-mono font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
            >
              {copiedMath ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Answer</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. PERSISTENT SEARCH HISTORY PANEL */}
      {civilLab.searchHistory.length > 0 && !query && (
        <div className="rounded-2xl p-4 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              <Clock className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Recent Searches &amp; Executed Commands ({civilLab.searchHistory.length})</span>
            </div>
            <button
              type="button"
              onClick={civilLab.clearSearchHistory}
              className="text-xs font-mono text-[var(--md-sys-color-error)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {civilLab.searchHistory.map((q) => (
              <div
                key={q}
                className="group flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] text-xs font-mono transition-all"
              >
                <button
                  type="button"
                  onClick={() => setQuery(q)}
                  className="cursor-pointer text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] font-medium"
                >
                  {q}
                </button>
                <button
                  type="button"
                  onClick={() => civilLab.removeSearchQuery(q)}
                  className="p-0.5 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] cursor-pointer"
                  title="Remove query"
                  aria-label="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. EXECUTABLE SYSTEM COMMANDS LIST */}
      {(isCommandMode || filteredCommands.length > 0) && (
        <div className="rounded-2xl p-5 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
              <Terminal className="w-3.5 h-3.5" />
              <span>Executable System Actions ({filteredCommands.length})</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Press Enter or Click to Execute
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredCommands.map((cmd) => {
              const CmdIcon = cmd.icon;

              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={cmd.action}
                  className="w-full text-left p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] flex items-center justify-center shrink-0">
                      <CmdIcon className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                        {cmd.title}
                      </div>
                      <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                        {cmd.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {cmd.shortcut && (
                      <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)]">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    <CornerDownLeft className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]/60 group-hover:text-[var(--md-sys-color-primary)]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. MATCHING ENGINEERING CALCULATORS & TOOLS */}
      {!isCommandMode && (
        <div className="rounded-2xl p-5 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
              <Calculator className="w-3.5 h-3.5" />
              <span>Matching Engineering Tools ({filteredTools.length})</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Click to Launch
            </span>
          </div>

          {filteredTools.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              No tools matched &quot;{query}&quot;. Try searching for &quot;beam&quot;, &quot;far&quot;, &quot;mix&quot;, or math like &quot;15 * 3.28&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleLaunchTool(tool)}
                  className="w-full text-left p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)] shrink-0 mt-0.5">
                      {tool.shortCode}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                        {tool.title}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
                        {tool.category} · {tool.standardUsed}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]/60 group-hover:text-[var(--md-sys-color-primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
