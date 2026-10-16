import React from 'react';
import {
  FolderArchive,
  X,
  Plus,
  Upload,
  Sparkles,
  Download,
  Edit3,
  Copy,
  Trash2,
} from 'lucide-react';
import { CivilWorkspace, CalculationRecord } from '../../types/civil';
import { getCurrencySymbol } from '../../utils/calculations';

export interface WorkspaceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: CivilWorkspace[];
  activeWorkspaceId: string;
  calculationHistory: CalculationRecord[];
  onSwitchWorkspace: (id: string, name: string) => void;
  onOpenNewWorkspace: () => void;
  onOpenEditWorkspace: (ws: CivilWorkspace) => void;
  onDuplicateWorkspace: (ws: CivilWorkspace) => void;
  onExportSingleProject: (ws: CivilWorkspace) => void;
  onDeleteWorkspace: (id: string) => void;
  onImportProjectJson: () => void;
  onLoadDemoProject: () => void;
  onExportAllProjects: () => void;
}

export const WorkspaceManagerModal: React.FC<WorkspaceManagerModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  activeWorkspaceId,
  calculationHistory,
  onSwitchWorkspace,
  onOpenNewWorkspace,
  onOpenEditWorkspace,
  onDuplicateWorkspace,
  onExportSingleProject,
  onDeleteWorkspace,
  onImportProjectJson,
  onLoadDemoProject,
  onExportAllProjects,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl p-6 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
              <span>Project Workspaces Manager</span>
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Manage multi-project engineering workspaces, dedicated takeoff sheets, and validated JSON exports
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Project Workspaces Manager"
            className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[var(--md-sys-color-surface-container)]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewWorkspace();
              }}
              className="touch-target-48 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>

            <button
              type="button"
              onClick={onImportProjectJson}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <span>Import Project JSON</span>
            </button>

            <button
              type="button"
              onClick={onLoadDemoProject}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-xs font-bold inline-flex items-center gap-1.5 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/40 cursor-pointer"
              title="Load sample Padma River Viaduct project with 7 takeoffs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Demo Project</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onExportAllProjects}
            className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[var(--md-sys-color-tertiary)]" />
            <span>Export All Projects (Bundle JSON)</span>
          </button>
        </div>

        {/* Workspaces List */}
        <div className="space-y-3">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            const boqItemsCount = ws.boq?.items?.length || 0;
            const historyCount = calculationHistory.filter((rec) => rec.workspaceId === ws.id).length;
            const sym = getCurrencySymbol(ws.currency || 'BDT');

            return (
              <div
                key={ws.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/10 ring-1 ring-[var(--md-sys-color-primary)]'
                    : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-outline)]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate">
                        {ws.name}
                      </span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 flex flex-wrap items-center gap-2">
                      <span>Code: <strong>{ws.projectCode}</strong></span>
                      <span>·</span>
                      <span>Site: {ws.siteLocation}</span>
                      <span>·</span>
                      <span>EOR: {ws.engineerOfRecord}</span>
                      <span>·</span>
                      <span className="font-bold text-[var(--md-sys-color-primary)]">Currency: {ws.currency || 'BDT'} ({sym})</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                      <span className="p-1 rounded bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                        📋 <strong>{boqItemsCount}</strong> Takeoff Items
                      </span>
                      <span className="p-1 rounded bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                        📑 <strong>{historyCount}</strong> History Logs
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => onSwitchWorkspace(ws.id, ws.name)}
                        className="touch-target-48 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] text-xs font-bold text-[var(--md-sys-color-primary)] cursor-pointer"
                      >
                        Switch To
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenEditWorkspace(ws)}
                      className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                      title="Edit Project Metadata"
                      aria-label={`Edit ${ws.name}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDuplicateWorkspace(ws)}
                      className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-tertiary)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                      title="Duplicate Project Workspace"
                      aria-label={`Duplicate ${ws.name}`}
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onExportSingleProject(ws)}
                      className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                      title="Export Project (.json)"
                      aria-label={`Export ${ws.name}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {workspaces.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteWorkspace(ws.id)}
                        className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                        title="Delete Project Workspace"
                        aria-label={`Delete ${ws.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
