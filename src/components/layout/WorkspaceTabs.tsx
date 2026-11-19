import React from 'react';
import {
  Home,
  X,
  Plus,
} from 'lucide-react';
import { EngineeringModuleId } from '../../types/civil';
import { TOOL_REGISTRY_MAP } from '../../data/toolRegistry';
import { MODULE_META } from '../../data/moduleMeta';

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
  projectName?: string;
  projectCode?: string;
  onSaveSnapshot?: () => void;
  onOpenProjectMetadata?: () => void;
  onOpenToolPicker?: () => void;
  collapsedOnMobile?: boolean;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  openTabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onOpenToolPicker,
  collapsedOnMobile = false,
}) => {
  return (
    <div
      className={`h-10 shrink-0 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-lowest)] items-center justify-between px-2 gap-2 select-none overflow-x-auto no-scrollbar print:hidden transition-all duration-200 ${
        collapsedOnMobile ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Browser / IDE-Style Multi-Tabs */}
      <div className="flex items-center gap-1 min-w-0 h-full pt-1 overflow-x-auto no-scrollbar">
        {openTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const toolMeta = tab.moduleId ? TOOL_REGISTRY_MAP[tab.moduleId] : null;
          const modMeta = tab.moduleId ? MODULE_META[tab.moduleId] : null;
          const shortCode = tab.shortCode || toolMeta?.shortCode;
          const displayTitle =
            tab.type === 'dashboard'
              ? 'Home'
              : modMeta?.label || toolMeta?.shortLabel || tab.title;

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group relative h-9 px-3 flex items-center gap-2 rounded-t text-xs font-sans transition-colors cursor-pointer border-t border-x ${
                isActive
                  ? 'bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] font-semibold shadow-xs z-10'
                  : 'bg-[var(--md-sys-color-surface-container-low)] border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title={displayTitle}
            >
              {/* Active Tab Top Indicator Line with Jewel Glow */}
              {isActive && (
                <div className="absolute top-0 inset-x-0 h-0.5 bg-[var(--md-sys-color-primary)] shadow-[0_0_10px_var(--md-sys-color-primary)] rounded-t" />
              )}

              {/* Icon / Short Code Badge */}
              {tab.type === 'dashboard' ? (
                <Home className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
              ) : (
                shortCode && (
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline)] shrink-0">
                    {shortCode}
                  </span>
                )
              )}

              {/* Title */}
              <span className="truncate max-w-[140px] sm:max-w-[180px]">
                {displayTitle}
              </span>

              {/* Close Button (Home tab cannot be closed) */}
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

        {/* + Open Tool Quick Button */}
        {onOpenToolPicker && (
          <button
            type="button"
            onClick={onOpenToolPicker}
            className="h-8 px-2.5 rounded-t text-xs font-sans font-medium flex items-center gap-1.5 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer border border-dashed border-[var(--md-sys-color-outline-variant)] shrink-0"
            title="Open an engineering module (Ctrl+K)"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span className="hidden sm:inline">Open Tool</span>
          </button>
        )}
      </div>
    </div>
  );
};
