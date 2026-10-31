import React from 'react';
import {
  LayoutDashboard,
  X,
  Plus,
  Camera,
  FolderKanban,
  ChevronRight,
  BookmarkCheck,
} from 'lucide-react';
import { EngineeringModuleId } from '../../types/civil';
import { TOOL_REGISTRY_MAP } from '../../data/toolRegistry';

export interface WorkspaceTabItem {
  id: string; // e.g. 'dashboard' or 'tab-beam-analysis'
  type: 'dashboard' | 'module';
  moduleId?: EngineeringModuleId;
  title: string;
  shortCode?: string;
}

export interface WorkspaceTabsProps {
  openTabs: WorkspaceTabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  projectName: string;
  projectCode: string;
  onSaveSnapshot: () => void;
  onOpenProjectMetadata?: () => void;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  openTabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  projectName,
  projectCode,
  onSaveSnapshot,
  onOpenProjectMetadata,
}) => {
  return (
    <div className="h-10 shrink-0 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-lowest)] flex items-center justify-between px-2 gap-2 select-none overflow-x-auto no-scrollbar print:hidden">
      {/* LEFT: Browser / IDE-Style Multi-Tabs */}
      <div className="flex items-center gap-1 min-w-0 h-full pt-1 overflow-x-auto no-scrollbar">
        {openTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const toolMeta = tab.moduleId ? TOOL_REGISTRY_MAP[tab.moduleId] : null;
          const shortCode = tab.shortCode || toolMeta?.shortCode;

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group relative h-9 px-3 flex items-center gap-2 rounded-t text-xs font-mono transition-colors cursor-pointer border-t border-x ${
                isActive
                  ? 'bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] font-bold shadow-xs z-10'
                  : 'bg-[var(--md-sys-color-surface-container-low)] border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title={tab.title}
            >
              {/* Active Tab Top Indicator Line */}
              {isActive && (
                <div className="absolute top-0 inset-x-0 h-0.5 bg-[var(--md-sys-color-primary)] rounded-t" />
              )}

              {/* Icon / Short Code Badge */}
              {tab.type === 'dashboard' ? (
                <LayoutDashboard className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
              ) : (
                shortCode && (
                  <span className="px-1 py-0.2 rounded text-[9.5px] font-mono font-bold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] shrink-0">
                    {shortCode}
                  </span>
                )
              )}

              {/* Title */}
              <span className="truncate max-w-[140px] sm:max-w-[180px]">
                {tab.title}
              </span>

              {/* Close Button (Dashboard cannot be closed) */}
              {tab.type !== 'dashboard' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--md-sys-color-on-surface-variant)] hover:text-red-500 transition-colors ml-1"
                  title="Close Tab"
                  aria-label="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* RIGHT: Compact Breadcrumbs, Project Badge & Save Snapshot Action */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Project Badge */}
        <button
          type="button"
          onClick={onOpenProjectMetadata}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] text-xs font-mono text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          title="Click to edit project details"
        >
          <FolderKanban className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
          <span className="text-[10px] text-[var(--md-sys-color-primary)] font-bold">{projectCode}</span>
          <span className="truncate max-w-[120px] text-[11px] font-medium">{projectName}</span>
        </button>

        {/* Save Snapshot to Project Button */}
        <button
          type="button"
          onClick={onSaveSnapshot}
          className="flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-primary)] hover:text-white hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] text-xs font-mono font-semibold transition-all cursor-pointer shadow-2xs"
          title="Save immutable calculation snapshot to project audit trail"
        >
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Save Snapshot</span>
        </button>
      </div>
    </div>
  );
};
