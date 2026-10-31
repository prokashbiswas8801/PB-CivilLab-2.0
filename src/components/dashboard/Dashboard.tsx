import React from 'react';
import {
  EngineeringModuleId,
  CivilWorkspace,
  UserProfile,
  CalculationRecord,
} from '../../types/civil';
import { ProjectRollupBanner } from './ProjectRollupBanner';
import { QuickScratchpadConverter } from './QuickScratchpadConverter';
import { DisciplineMatrix } from './DisciplineMatrix';
import { CalculationLedger } from './CalculationLedger';
import { QuickReferencePanel } from './QuickReferencePanel';

export interface DashboardProps {
  activeWorkspace: CivilWorkspace;
  workspaces: CivilWorkspace[];
  activeModule: EngineeringModuleId;
  onSelectModule: (moduleId: EngineeringModuleId) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onOpenNewWorkspace: () => void;
  onOpenWorkspaceManager: () => void;
  onOpenProfileModal?: (tab: 'profile' | 'preferences' | 'presets') => void;
  onOpenPrintPreview: () => void;
  onDirectDownloadPdf: () => void;
  calculationHistory: CalculationRecord[];
  onRestoreCalculation?: (record: CalculationRecord) => void;
  onDeleteCalculation?: (id: string) => void;
  userProfile?: UserProfile;
  onOpenArchitectureModal?: (tab: 'far' | 'staircase' | 'watertank' | 'septictank') => void;
  onOpenCadModal?: (tab: 'viewport' | 'shortcuts' | 'excel') => void;
  onOpenSiteQcModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activeWorkspace,
  workspaces,
  onSelectModule,
  onSelectWorkspace,
  onOpenNewWorkspace,
  onOpenWorkspaceManager,
  onOpenPrintPreview,
  onDirectDownloadPdf,
  calculationHistory,
  onRestoreCalculation,
  onDeleteCalculation,
  onOpenArchitectureModal,
  onOpenCadModal,
  onOpenSiteQcModal,
}) => {
  return (
    <div className="space-y-4 pb-20 max-w-7xl mx-auto px-3 sm:px-5 pt-4">
      {/* 1. TOP ROW: ACTIVE PROJECT & LIVE MATERIAL ROLLUP BANNER */}
      <ProjectRollupBanner
        activeWorkspace={activeWorkspace}
        workspaces={workspaces}
        onSelectWorkspace={onSelectWorkspace}
        onOpenNewWorkspace={onOpenNewWorkspace}
        onOpenWorkspaceManager={onOpenWorkspaceManager}
        onOpenPrintPreview={onOpenPrintPreview}
        onDirectDownloadPdf={onDirectDownloadPdf}
      />

      {/* MIDDLE ROW: HIGH-DENSITY 3-COLUMN BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* 2. LEFT WIDGET: QUICK ENGINEERING SCRATCHPAD & INLINE CONVERTER (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col">
          <QuickScratchpadConverter />
        </div>

        {/* 3. CENTER WIDGET: SMART DISCIPLINE MATRIX & PINNED TOOLS (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col">
          <DisciplineMatrix
            onSelectModule={onSelectModule}
            onOpenArchitectureModal={onOpenArchitectureModal}
            onOpenCadModal={onOpenCadModal}
            onOpenSiteQcModal={onOpenSiteQcModal}
          />
        </div>

        {/* 4. RIGHT WIDGET: LIVE CALCULATION LOG & SAVED SNAPSHOTS (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col">
          <CalculationLedger
            calculationHistory={calculationHistory}
            onSelectModule={onSelectModule}
            onRestoreCalculation={onRestoreCalculation}
            onDeleteCalculation={onDeleteCalculation}
            onDirectDownloadPdf={onDirectDownloadPdf}
          />
        </div>
      </div>

      {/* 5. BOTTOM WIDGET: QUICK REFERENCE CONSTANTS DRAWER / PANEL */}
      <QuickReferencePanel />
    </div>
  );
};

export default Dashboard;
