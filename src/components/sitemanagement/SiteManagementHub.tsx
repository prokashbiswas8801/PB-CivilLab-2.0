import React, { useState, useRef } from 'react';
import {
  Boxes,
  FileText,
  Calendar,
  Users,
  BookOpen,
  Receipt,
  Wallet,
  Layers,
  ClipboardCheck,
  Download,
  Upload,
  History,
  Printer,
  Sparkles,
} from 'lucide-react';
import { EngineeringModuleId, CalculationRecord } from '../../types/civil';
import { useSiteManagement } from '../../context/SiteManagementContext';
import { AboutThisTool } from '../ui/AboutThisTool';
import {
  StoreInventoryModule,
  RequisitionModule,
  ScheduleRosterModule,
  LaborAttendanceModule,
  FieldNotebookModule,
  ContractorBillModule,
  PettyCashModule,
  CubeTestModule,
  DailyProgressReportModule,
} from './index';

export interface SiteManagementHubProps {
  activeTab: EngineeringModuleId;
  onSelectTab: (tab: EngineeringModuleId) => void;
  onSaveToHistory?: (record: CalculationRecord) => void;
  workspaceId?: string;
  projectName?: string;
  currency?: string;
}

interface ErpModuleTabDef {
  id: EngineeringModuleId;
  shortCode: string;
  title: string;
  bengaliTitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ERP_TABS: ErpModuleTabDef[] = [
  {
    id: 'store-inventory',
    shortCode: 'SM-01',
    title: 'Store & Inventory',
    bengaliTitle: 'মালামাল ইন-আউট',
    icon: Boxes,
  },
  {
    id: 'material-requisition',
    shortCode: 'SM-02',
    title: 'Material Requisitions',
    bengaliTitle: 'রিকুইজিশন ও PO',
    icon: FileText,
  },
  {
    id: 'schedule-roster',
    shortCode: 'SM-03',
    title: 'Schedule & Roster',
    bengaliTitle: 'শিডিউল ও কিউরিং',
    icon: Calendar,
  },
  {
    id: 'labor-attendance',
    shortCode: 'SM-04',
    title: 'Labor Muster Roll',
    bengaliTitle: 'হাজিরা খাতা ও মজুরি',
    icon: Users,
  },
  {
    id: 'field-notebook',
    shortCode: 'SM-05',
    title: 'Field Notebook',
    bengaliTitle: 'সাইট নোটবুক ও ডায়েরি',
    icon: BookOpen,
  },
  {
    id: 'contractor-bills',
    shortCode: 'SM-06',
    title: 'Sub-Contractor Bills',
    bengaliTitle: 'কন্ট্রাক্টর RA বিল',
    icon: Receipt,
  },
  {
    id: 'petty-cash',
    shortCode: 'SM-07',
    title: 'Site Petty Cash',
    bengaliTitle: 'খুচরা ক্যাশ লেজার',
    icon: Wallet,
  },
  {
    id: 'cube-tests',
    shortCode: 'SM-08',
    title: 'Cube Test Register',
    bengaliTitle: 'কিউব টেস্ট রেজিস্টার',
    icon: Layers,
  },
  {
    id: 'daily-progress-report',
    shortCode: 'SM-09',
    title: '1-Click DPR',
    bengaliTitle: 'ডেইলি প্রগ্রেস রিপোর্ট',
    icon: ClipboardCheck,
  },
];

export const SiteManagementHub: React.FC<SiteManagementHubProps> = ({
  activeTab,
  onSelectTab,
  onSaveToHistory,
  workspaceId = 'default',
  projectName = 'Main Civil Project',
  currency = 'BDT',
}) => {
  const {
    siteData,
    financialSummary,
    exportSiteDataBackup,
    importSiteDataBackup,
  } = useSiteManagement();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute live KPIs
  const lowStockCount = siteData.inventory.filter(
    (item) => item.currentStock <= item.minThreshold
  ).length;
  const activeWorkersCount = siteData.workers.filter(
    (w) => w.isActive !== false
  ).length;
  const pendingCubesCount = siteData.cubeTests.filter(
    (c) => c.status === 'Scheduled'
  ).length;

  // Handle JSON Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = importSiteDataBackup(content);
        if (success) {
          showToast('Project site data restored successfully!');
        } else {
          showToast('Failed to import site data. Invalid JSON schema.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle JSON Export
  const handleExportBackup = () => {
    const jsonStr = exportSiteDataBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Site_Management_Backup_${workspaceId}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Site Management JSON backup downloaded.');
  };

  // Handle Save Snapshot to History
  const handleSaveSnapshot = () => {
    if (!onSaveToHistory) {
      showToast('Site Management state preserved in localStorage');
      return;
    }

    const currentTabDef = ERP_TABS.find((t) => t.id === activeTab) || ERP_TABS[0];
    const newRecord: CalculationRecord = {
      id: `sm-rec-${Date.now()}`,
      workspaceId,
      moduleId: activeTab,
      timestamp: new Date().toISOString(),
      title: `${currentTabDef.shortCode}: ${currentTabDef.title} Snapshot`,
      notes: `Recorded on ${new Date().toLocaleDateString()} for ${projectName}. Cash in Hand: ${currency} ${financialSummary.pettyCashBalance.toLocaleString()}. Active Workforce: ${activeWorkersCount} workers.`,
      status: lowStockCount > 0 ? 'warning' : 'nominal',
      keyMetrics: [
        { label: 'Active Workforce', value: String(activeWorkersCount), unit: 'workers' },
        { label: 'Cash in Hand', value: String(Math.round(financialSummary.pettyCashBalance)), unit: currency },
        { label: 'Low Stock Items', value: String(lowStockCount), unit: 'materials' },
        { label: 'Active Cubes', value: String(pendingCubesCount), unit: 'tests' },
      ],
      inputsSnapshot: {
        activeTab,
        totalInventoryCount: siteData.inventory.length,
        totalWorkers: siteData.workers.length,
        cashInHand: financialSummary.pettyCashBalance,
        savedAt: new Date().toISOString(),
      },
    };

    onSaveToHistory(newRecord);
    showToast(`Snapshot of "${currentTabDef.title}" added to Project History!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 font-serif">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full bg-emerald-700 text-white shadow-xl flex items-center gap-2 text-sm font-sans animate-bounce border border-emerald-500">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for JSON Backup Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* 1. MASTER HEADER & LIVE JOB-SITE KPI STRIP */}
      <div className="rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-md p-4 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[var(--md-sys-color-outline-variant)]">
          {/* Module Brand & Context */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500 shadow-inner">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold tracking-wider uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  FIELD ERP SUITE
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Saved to LocalStorage
                </span>
                <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  Project: <strong className="text-[var(--md-sys-color-on-surface)]">{projectName}</strong>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight mt-1">
                Site Management & Field ERP
              </h1>
              <p className="text-xs font-sans text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                মাঠ ও নির্মাণ প্রকৌশল হিসাব — Store, Labor Muster Roll, Schedule, Sub-Contractors, Cash & DPR
              </p>
            </div>
          </div>

          {/* Quick Actions (Backup, Restore, History) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-3.5 py-1.5 rounded-full text-xs font-sans font-bold inline-flex items-center gap-1.5 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors shadow-2xs cursor-pointer"
              title="Download full JSON backup of all 9 Site Management modules"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>Backup JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-full text-xs font-sans font-bold inline-flex items-center gap-1.5 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors shadow-2xs cursor-pointer"
              title="Restore Site Management database from a previously exported JSON backup"
            >
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>Restore JSON</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="px-3.5 py-1.5 rounded-full text-xs font-sans font-bold inline-flex items-center gap-1.5 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors shadow-2xs cursor-pointer"
              title="Save current module status as an official snapshot in project history"
            >
              <History className="w-3.5 h-3.5 text-emerald-500" />
              <span>Add to History</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-full text-xs font-sans font-bold inline-flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors shadow-2xs cursor-pointer"
              title="Print active module sheet or submittal"
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>

        {/* Live Job-Site Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center justify-between text-[11px] font-sans text-[var(--md-sys-color-on-surface-variant)]">
              <span>Site Cash in Hand</span>
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="mt-1 text-base sm:text-lg font-black font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
              {currency} {financialSummary.pettyCashBalance.toLocaleString()}
            </div>
            <div className="text-[10px] font-sans text-[var(--md-sys-color-on-surface-variant)]">
              Total Spent: {currency} {financialSummary.totalPettyCashSpent.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center justify-between text-[11px] font-sans text-[var(--md-sys-color-on-surface-variant)]">
              <span>Active Workforce</span>
              <Users className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="mt-1 text-base sm:text-lg font-black font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
              {activeWorkersCount} Workers
            </div>
            <div className="text-[10px] font-sans text-[var(--md-sys-color-on-surface-variant)]">
              Present Book Active
            </div>
          </div>

          <div
            onClick={() => onSelectTab('store-inventory')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              lowStockCount > 0
                ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500'
                : 'bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-sans text-[var(--md-sys-color-on-surface-variant)]">
              <span>Store Materials</span>
              <Boxes className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-1 text-base sm:text-lg font-black font-mono tabular-nums text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              <span>{siteData.inventory.length} Items</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-rose-500 text-white animate-pulse">
                  {lowStockCount} LOW
                </span>
              )}
            </div>
            <div className="text-[10px] font-sans text-[var(--md-sys-color-on-surface-variant)]">
              {lowStockCount > 0 ? 'Click to inspect & re-order' : 'All stock balanced'}
            </div>
          </div>

          <div
            onClick={() => onSelectTab('cube-tests')}
            className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-sans text-[var(--md-sys-color-on-surface-variant)]">
              <span>QA/QC Cube Tests</span>
              <Layers className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="mt-1 text-base sm:text-lg font-black font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
              {siteData.cubeTests.length} Castings
            </div>
            <div className="text-[10px] font-sans text-[var(--md-sys-color-on-surface-variant)]">
              {pendingCubesCount} pending crushing
            </div>
          </div>
        </div>
      </div>

      {/* 2. PILL-TAB SWITCHER (ALL 9 MODULES) */}
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-2 min-w-max p-1.5 rounded-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
          {ERP_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`group px-3.5 py-2 rounded-full text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[var(--md-sys-color-on-primary)]' : 'text-[var(--md-sys-color-primary)]'
                  }`}
                />
                <div className="flex flex-col items-start leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-mono font-bold px-1 rounded-full ${
                        isActive
                          ? 'bg-[var(--md-sys-color-on-primary)]/20 text-[var(--md-sys-color-on-primary)]'
                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {tab.shortCode}
                    </span>
                    <span className="font-semibold">{tab.title}</span>
                  </div>
                  <span
                    className={`text-[9px] font-serif ${
                      isActive
                        ? 'text-[var(--md-sys-color-on-primary)]/80'
                        : 'text-[var(--md-sys-color-on-surface-variant)]/70'
                    }`}
                  >
                    {tab.bengaliTitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE MODULE VIEW CONTAINER */}
      <div className="space-y-6">
        {activeTab === 'store-inventory' && (
          <StoreInventoryModule
            onNavigateToRequisitions={() => onSelectTab('material-requisition')}
          />
        )}

        {activeTab === 'material-requisition' && (
          <RequisitionModule onNavigateToStore={() => onSelectTab('store-inventory')} />
        )}

        {activeTab === 'schedule-roster' && <ScheduleRosterModule />}

        {activeTab === 'labor-attendance' && <LaborAttendanceModule />}

        {activeTab === 'field-notebook' && <FieldNotebookModule />}

        {activeTab === 'contractor-bills' && <ContractorBillModule />}

        {activeTab === 'petty-cash' && <PettyCashModule />}

        {activeTab === 'cube-tests' && <CubeTestModule />}

        {activeTab === 'daily-progress-report' && <DailyProgressReportModule />}
      </div>

      {/* 4. DEDICATED EXPANDABLE "ABOUT THIS TOOL" MONOGRAPH FOR THE ACTIVE MODULE */}
      <div className="pt-4">
        <AboutThisTool toolId={activeTab} defaultExpanded={false} />
      </div>
    </div>
  );
};
