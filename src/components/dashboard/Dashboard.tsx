import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calculator,
  FileSpreadsheet,
  HardHat,
  Waves,
  Boxes,
  Hammer,
  Grid,
  Shovel,
  Sparkles,
  Scale,
  SlidersHorizontal,
  FolderArchive,
  Download,
  Printer,
  ShieldCheck,
  Search,
  Plus,
  ArrowRight,
  RotateCcw,
  Clock,
  User,
  Star,
  Trash2,
  FileText,
  Building,
  CheckCircle2,
  Laptop,
  Compass,
  ClipboardCheck,
} from 'lucide-react';
import {
  EngineeringModuleId,
  CivilWorkspace,
  UserProfile,
  CalculationRecord,
} from '../../types/civil';
import { useWorkbench } from '../../context/WorkbenchContext';
import { BrandLogoIcon } from '../Logo';
import { SIDEBAR_CATEGORIES } from '../layout/Sidebar';
import { getCurrencySymbol } from '../../utils/calculations';

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
  activeModule,
  onSelectModule,
  onSelectWorkspace,
  onOpenNewWorkspace,
  onOpenWorkspaceManager,
  onOpenProfileModal,
  onOpenPrintPreview,
  onDirectDownloadPdf,
  calculationHistory,
  onRestoreCalculation,
  onDeleteCalculation,
  userProfile,
  onOpenArchitectureModal,
  onOpenCadModal,
  onOpenSiteQcModal,
}) => {
  const workbench = useWorkbench();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Flattened catalogue of all engineering tools
  const allTools = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      category: string;
      categoryId: string;
      subtitle: string;
      moduleId?: EngineeringModuleId;
      icon: React.ComponentType<{ className?: string }>;
      actionType?: string;
    }> = [];

    SIDEBAR_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        list.push({
          id: item.id,
          name: item.name,
          category: cat.name,
          categoryId: cat.id,
          subtitle: item.subtitle || '',
          moduleId: item.moduleId,
          icon: cat.icon,
          actionType: item.actionType,
        });
      });
    });

    return list;
  }, []);

  // Filtered tools
  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      const matchesCat = selectedCategory === 'all' || tool.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.subtitle.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [allTools, selectedCategory, searchQuery]);

  // Favorite / Pinned Tools
  const favoriteToolItems = useMemo(() => {
    return workbench.favoriteTools
      .map((modId) => allTools.find((t) => t.moduleId === modId))
      .filter(Boolean) as typeof allTools;
  }, [workbench.favoriteTools, allTools]);

  // Recent Tools
  const recentToolItems = useMemo(() => {
    return workbench.recentTools
      .map((modId) => allTools.find((t) => t.moduleId === modId))
      .filter(Boolean) as typeof allTools;
  }, [workbench.recentTools, allTools]);

  const handleToolClick = (tool: (typeof allTools)[0]) => {
    if (tool.actionType === 'far-setback' && onOpenArchitectureModal) {
      onOpenArchitectureModal('far');
    } else if (tool.actionType === 'staircase' && onOpenArchitectureModal) {
      onOpenArchitectureModal('staircase');
    } else if (tool.actionType === 'watertank' && onOpenArchitectureModal) {
      onOpenArchitectureModal('watertank');
    } else if (tool.actionType === 'septictank' && onOpenArchitectureModal) {
      onOpenArchitectureModal('septictank');
    } else if (tool.actionType === 'cad-viewport' && onOpenCadModal) {
      onOpenCadModal('viewport');
    } else if (tool.actionType === 'cad-shortcuts' && onOpenCadModal) {
      onOpenCadModal('shortcuts');
    } else if (tool.actionType === 'excel-formulas' && onOpenCadModal) {
      onOpenCadModal('excel');
    } else if (tool.actionType === 'site-qc' && onOpenSiteQcModal) {
      onOpenSiteQcModal();
    } else if (tool.moduleId) {
      onSelectModule(tool.moduleId);
    }
  };

  // Quick project statistics
  const boqTotal = activeWorkspace.boq.items.reduce(
    (sum, it) => sum + (it.numberOfMembers * it.lengthM * it.widthM * it.heightM * it.unitRate),
    0
  );

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 md:px-6 pt-5">
      {/* 1. PROJECT SUMMARY HERO CARD */}
      <section className="rounded-3xl p-6 md:p-8 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="font-bold text-[var(--md-sys-color-primary)]">
                [{activeWorkspace.projectCode}]
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">
                {activeWorkspace.siteLocation}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)]">
                Code: {activeWorkspace.governingCode}
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] uppercase tracking-wider">
                Active Project
              </span>
            </div>

            <div className="flex items-center gap-3.5 pt-1">
              <BrandLogoIcon size={44} animated={false} className="shadow-xs shrink-0" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)] leading-tight">
                  {activeWorkspace.name}
                </h1>
                <div className="text-[11px] font-mono font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider mt-0.5">
                  Engineer of Record: {workbench.projectMetadata.engineerName || activeWorkspace.engineerOfRecord}
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-2xl leading-relaxed">
              Integrated engineering lab suite spanning Structural, Geotechnical, Architectural By-Laws, Construction BOQ &amp; BBS, Hydraulics, and CAD &amp; Excel Hub.
            </p>

            {/* Project Switcher Bar */}
            {workspaces.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 custom-scrollbar text-xs">
                <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)] shrink-0">
                  Switch Project:
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => onSelectWorkspace(ws.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        ws.id === activeWorkspace.id
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                          : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                      }`}
                    >
                      [{ws.projectCode}] {ws.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Commands */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onDirectDownloadPdf}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              title="Download Certified PDF Submittal Report"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={onOpenPrintPreview}
              className="px-4 py-2.5 rounded-2xl bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Print A4</span>
            </button>

            <button
              type="button"
              onClick={onOpenWorkspaceManager}
              className="px-3.5 py-2.5 rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FolderArchive className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <span>Projects ({workspaces.length})</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewWorkspace}
              className="px-3.5 py-2.5 rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. PINNED / FAVORITE TOOLS & RECENTLY USED CALCULATORS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pinned / Favorite Tools */}
        <div className="p-5 rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Pinned / Favorite Tools ({favoriteToolItems.length})
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Quick 1-Click Launch
            </span>
          </div>

          {favoriteToolItems.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              No pinned tools yet. Click the star icon on any tool card or in the sidebar to pin your top calculators.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {favoriteToolItems.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className="p-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] hover:border-[var(--md-sys-color-primary)] transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate group-hover:text-[var(--md-sys-color-primary)] transition-colors">
                          {tool.name}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                          {tool.category}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[var(--md-sys-color-primary)] transition-all shrink-0 ml-2" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Recently Used Calculators */}
        <div className="p-5 rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Recently Used Calculators
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Auto-tracked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentToolItems.slice(0, 6).map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  className="p-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] hover:border-[var(--md-sys-color-primary)] transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate group-hover:text-[var(--md-sys-color-primary)] transition-colors">
                        {tool.name}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                        {tool.category}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[var(--md-sys-color-primary)] transition-all shrink-0 ml-2" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. RECENT CALCULATION HISTORY TABLE */}
      <section className="p-5 rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              Recent Calculation History
            </h2>
          </div>
          <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
            {calculationHistory.length} Snapshots
          </span>
        </div>

        {calculationHistory.length === 0 ? (
          <div className="py-10 text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] space-y-1">
            <Clock className="w-8 h-8 mx-auto text-slate-400" />
            <div className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">No Calculations Recorded Yet</div>
            <div>When you run structural or geotech calculations, click "Save Snapshot" to log them here.</div>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-mono divide-y divide-[var(--md-sys-color-outline-variant)]">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)]">
                <tr>
                  <th className="py-3 px-3">Date / Time</th>
                  <th className="py-3 px-3">Calculation Title</th>
                  <th className="py-3 px-3">Laboratory Module</th>
                  <th className="py-3 px-3">Key Metric / Result</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/60">
                {calculationHistory.slice(0, 8).map((record) => {
                  const metricStr = (record.keyMetrics || [])
                    .map((m) => `${m.label}: ${m.value} ${m.unit}`)
                    .slice(0, 2)
                    .join(' · ');

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors"
                    >
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                        {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-bold text-[var(--md-sys-color-on-surface)]">
                        {record.title}
                      </td>
                      <td className="py-3 px-3 text-[var(--md-sys-color-primary)] font-semibold">
                        {record.moduleId}
                      </td>
                      <td className="py-3 px-3 text-[var(--md-sys-color-on-surface-variant)]">
                        {metricStr || record.notes || '—'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectModule(record.moduleId);
                              if (onRestoreCalculation) onRestoreCalculation(record);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] text-[11px] font-bold inline-flex items-center gap-1 hover:opacity-90 cursor-pointer"
                            title="Reload calculation inputs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reload</span>
                          </button>

                          <button
                            type="button"
                            onClick={onDirectDownloadPdf}
                            className="p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Download PDF report"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {onDeleteCalculation && (
                            <button
                              type="button"
                              onClick={() => onDeleteCalculation(record.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Delete snapshot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. SEARCH & CATEGORY FILTER TABS FOR COMPLETE CALCULATOR CATALOGUE */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all 6 labs, 20+ civil tools, CAD &amp; Excel formulas..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-xs text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:outline-none"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-xs">
            {[
              { id: 'all', label: 'All 6 Labs' },
              { id: 'structural', label: 'Structural' },
              { id: 'geotechnical', label: 'Geotechnical' },
              { id: 'architecture', label: 'Architecture' },
              { id: 'construction', label: 'Construction & BOQ' },
              { id: 'hydraulics', label: 'Hydraulics' },
              { id: 'cad-excel-hub', label: 'CAD & Excel' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold shadow-xs'
                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtered Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            const isFav = tool.moduleId ? workbench.isFavoriteTool(tool.moduleId) : false;

            return (
              <div
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className="p-4 rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] transition-all cursor-pointer group flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {tool.category.split(' ')[0]}
                      </span>
                      {tool.moduleId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            workbench.toggleFavoriteTool(tool.moduleId!);
                          }}
                          className={`p-1 rounded-md transition-colors ${
                            isFav ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors leading-snug">
                      {tool.name}
                    </h3>
                    <p className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] line-clamp-2">
                      {tool.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-between text-[11px] font-semibold text-[var(--md-sys-color-primary)]">
                  <span>Open Solver</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
