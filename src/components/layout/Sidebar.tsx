import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Layers,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  HardHat,
  Compass,
  FileSpreadsheet,
  Waves,
  Laptop,
  Star,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Sparkles,
  Building,
  Droplets,
  Scale,
  Hammer,
  Grid,
  Shovel,
  Boxes,
  Calculator,
  Terminal,
  FolderArchive,
  ClipboardCheck,
} from 'lucide-react';
import { EngineeringModuleId } from '../../types/civil';
import { useWorkbench } from '../../context/WorkbenchContext';
import { LogoMark } from '../Logo';

export interface SidebarCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SidebarSubItem[];
}

export interface SidebarSubItem {
  id: string;
  name: string;
  subtitle?: string;
  moduleId?: EngineeringModuleId;
  actionType?: 'module' | 'far-setback' | 'watertank' | 'septictank' | 'staircase' | 'cad-viewport' | 'cad-shortcuts' | 'excel-formulas' | 'site-qc' | 'earth-pressure';
  badge?: string;
}

export interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeModule: EngineeringModuleId;
  isDashboardActive: boolean;
  onSelectDashboard: () => void;
  onSelectModule: (moduleId: EngineeringModuleId, subAction?: string) => void;
  onOpenArchitectureModal?: (tab: 'far' | 'watertank' | 'septictank') => void;
  onOpenCadModal?: (tab: 'viewport' | 'shortcuts' | 'excel') => void;
  onOpenSiteQcModal?: () => void;
  onOpenWorkspaceManager?: () => void;
}

export const SIDEBAR_CATEGORIES: SidebarCategory[] = [
  {
    id: 'structural',
    name: 'Structural Lab',
    icon: SlidersHorizontal,
    items: [
      { id: 'beam-bending', name: 'Beam Bending & Shear', subtitle: 'AISC 360 / Eurocode 3', moduleId: 'beam-analysis', actionType: 'module' },
      { id: 'frame-analysis', name: 'Frame & Continuous Beam', subtitle: '3-Span Clapeyron Stiffness', moduleId: 'continuous-beam', actionType: 'module' },
      { id: 'column-buckling', name: 'Column Buckling & Design', subtitle: 'Euler / Slenderness', moduleId: 'rebar-bbs', actionType: 'module' },
      { id: 'singly-doubly-beam', name: 'Singly / Doubly RC Beam', subtitle: 'Flexure & Strain Limits', moduleId: 'beam-analysis', actionType: 'module' },
      { id: 'slab-design', name: 'Two-Way & One-Way Slab', subtitle: 'Moment Coefficient Method', moduleId: 'rebar-bbs', actionType: 'module' },
      { id: 'footing-structural', name: 'Isolated & Combined Footing', subtitle: 'Punching Shear & Flexure', moduleId: 'bearing-capacity', actionType: 'module' },
    ],
  },
  {
    id: 'geotechnical',
    name: 'Geotechnical Lab',
    icon: HardHat,
    items: [
      { id: 'bearing-capacity', name: 'Shallow Bearing Capacity', subtitle: 'Terzaghi / Meyerhof / Hansen', moduleId: 'bearing-capacity', actionType: 'module' },
      { id: 'pile-capacity', name: 'Deep Pile Capacity', subtitle: 'BNBC-2020 / Tomlinson α & β', moduleId: 'pile-capacity', actionType: 'module' },
      { id: 'earth-pressure', name: 'Earth Pressure', subtitle: 'Rankine & Coulomb Retaining', moduleId: 'earthwork-alignment', actionType: 'module' },
      { id: 'consolidation', name: 'Settlement & Consolidation', subtitle: 'Primary Cc & Elastic Se', moduleId: 'bearing-capacity', actionType: 'module' },
    ],
  },
  {
    id: 'architecture',
    name: 'Architecture & By-Laws',
    icon: Compass,
    items: [
      { id: 'far-mgc', name: 'FAR / MGC & Setback Sizer', subtitle: 'BNBC / Municipal Building Rules', actionType: 'far-setback', badge: 'By-Laws' },
      { id: 'staircase-ergonomics', name: 'Staircase Ergonomics', subtitle: '2R + T = 600mm / Waist Slab', moduleId: 'rebar-bbs', actionType: 'staircase' },
      { id: 'water-tank-ugwr', name: 'Water Reservoir (UGWR / OHT)', subtitle: 'LPCD Per Capita Sizer', actionType: 'watertank', badge: 'MEP' },
      { id: 'septic-tank-sizer', name: 'Septic Tank & Soak Pit', subtitle: '2-Chamber Sedimentation', actionType: 'septictank', badge: 'Sanitary' },
    ],
  },
  {
    id: 'construction',
    name: 'Construction, BOQ & BBS',
    icon: FileSpreadsheet,
    items: [
      { id: 'concrete-mix-design', name: 'Concrete Mix Design', subtitle: 'ACI 211.1 Absolute Volume', moduleId: 'concrete-mix', actionType: 'module' },
      { id: 'materials-takeoff', name: 'Brickwork, Plaster & Tiles', subtitle: 'Opening Deductions & Mortar', moduleId: 'masonry-finishes', actionType: 'module' },
      { id: 'rebar-bbs-generator', name: 'Bar Bending Schedule (BBS)', subtitle: 'Exact Bar Cutting & Tonnage', moduleId: 'rebar-bbs', actionType: 'module' },
      { id: 'surveying-land-suite', name: 'Surveying & Land Suite', subtitle: 'Irregular Land & Leveling Book', moduleId: 'surveying-suite', actionType: 'module', badge: 'Survey' },
      { id: 'site-qc-checklists', name: 'Site QA/QC Checklists', subtitle: 'Pre-pour & Compaction Audits', actionType: 'site-qc', badge: 'Field' },
      { id: 'boq-master-schedule', name: 'BOQ Estimator & Takeoff', subtitle: 'L×W×H Multi-Currency Sheet', moduleId: 'boq-estimator', actionType: 'module' },
      { id: 'rate-analysis-trades', name: 'Granular Unit Rate Analysis', subtitle: '1 m³ RCC & Composite Trades', moduleId: 'rate-analysis', actionType: 'module' },
    ],
  },
  {
    id: 'hydraulics',
    name: 'Hydraulics Lab',
    icon: Waves,
    items: [
      { id: 'manning-channel', name: "Open-Channel Manning's Flow", subtitle: 'Trapezoidal & Rectangular', moduleId: 'open-channel', actionType: 'module' },
      { id: 'critical-normal-depth', name: 'Critical & Normal Depth', subtitle: 'Froude Regime Sub/Supercritical', moduleId: 'open-channel', actionType: 'module' },
      { id: 'pipe-head-loss', name: 'Pipe Head Loss & Pressure', subtitle: 'Hazen-Williams / Reynolds', moduleId: 'pipe-hydraulics', actionType: 'module' },
    ],
  },
  {
    id: 'cad-excel-hub',
    name: 'CAD, Excel & Utilities Hub',
    icon: Laptop,
    items: [
      { id: 'cad-scale-viewport', name: 'AutoCAD Scale & Viewport', subtitle: 'Zoom XP Factor & Dimscale', actionType: 'cad-viewport', badge: 'AutoCAD' },
      { id: 'cad-shortcuts-lisp', name: 'CAD Shortcuts & LISP Hub', subtitle: 'OVERKILL, BURST, TLEN Script', actionType: 'cad-shortcuts', badge: 'LISP' },
      { id: 'excel-formula-library', name: 'Civil Excel Formula Library', subtitle: 'INDEX-MATCH, Bags, S-Curve', actionType: 'excel-formulas', badge: 'Formulas' },
      { id: 'land-unit-converter', name: 'Land & Smart Unit Converter', subtitle: 'Decimal, Katha, Feet-Inch', moduleId: 'unit-converter', actionType: 'module' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  activeModule,
  isDashboardActive,
  onSelectDashboard,
  onSelectModule,
  onOpenArchitectureModal,
  onOpenCadModal,
  onOpenSiteQcModal,
  onOpenWorkspaceManager,
}) => {
  const workbench = useWorkbench();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    structural: true,
    geotechnical: false,
    architecture: false,
    construction: false,
    hydraulics: false,
    'cad-excel-hub': false,
  });

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleItemClick = (item: SidebarSubItem) => {
    if (item.actionType === 'module' && item.moduleId) {
      onSelectModule(item.moduleId);
    } else if (item.actionType === 'far-setback') {
      if (onOpenArchitectureModal) onOpenArchitectureModal('far');
    } else if (item.actionType === 'watertank') {
      if (onOpenArchitectureModal) onOpenArchitectureModal('watertank');
    } else if (item.actionType === 'septictank') {
      if (onOpenArchitectureModal) onOpenArchitectureModal('septictank');
    } else if (item.actionType === 'staircase') {
      onSelectModule('rebar-bbs', 'staircase');
    } else if (item.actionType === 'cad-viewport') {
      if (onOpenCadModal) onOpenCadModal('viewport');
    } else if (item.actionType === 'cad-shortcuts') {
      if (onOpenCadModal) onOpenCadModal('shortcuts');
    } else if (item.actionType === 'excel-formulas') {
      if (onOpenCadModal) onOpenCadModal('excel');
    } else if (item.actionType === 'site-qc') {
      if (onOpenSiteQcModal) onOpenSiteQcModal();
    } else if (item.moduleId) {
      onSelectModule(item.moduleId);
    }
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--md-sys-color-surface)] border-r border-[var(--md-sys-color-outline-variant)] select-none">
      {/* Top Brand / Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] shrink-0">
        <div
          onClick={onSelectDashboard}
          className="flex items-center gap-3 cursor-pointer group transition-opacity"
        >
          <LogoMark size={32} animated={false} className="shadow-xs shrink-0" />
          {!isCollapsed && (
            <div className="leading-none min-w-0">
              <span className="text-base font-black tracking-tight text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors">
                PB CivilLab
              </span>
              <span className="block text-[10px] font-mono text-[var(--md-sys-color-primary)] uppercase tracking-wider font-semibold mt-0.5">
                Engineering Suite
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-xl hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="flex lg:hidden p-2 rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scrollable Nav Links */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
        {/* 1. Primary Dashboard Button */}
        <div>
          <button
            type="button"
            onClick={() => {
              onSelectDashboard();
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all cursor-pointer ${
              isDashboardActive
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-semibold'
                : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="text-xs font-bold tracking-tight">Executive Dashboard</span>
            )}
          </button>
        </div>

        {/* Pinned / Favorites Quick Strip (if expanded and has favorites) */}
        {!isCollapsed && workbench.favoriteTools.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="px-3 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              <span className="flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Pinned Calculators</span>
              </span>
              <span>{workbench.favoriteTools.length}</span>
            </div>
            <div className="space-y-0.5">
              {workbench.favoriteTools.map((modId) => {
                const isActive = !isDashboardActive && (activeModule as string) === modId;
                // find item name
                let itemName: string = modId;
                for (const cat of SIDEBAR_CATEGORIES) {
                  const match = cat.items.find((i) => (i.moduleId as string) === modId);
                  if (match) {
                    itemName = match.name;
                    break;
                  }
                }

                return (
                  <div
                    key={modId}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onSelectModule(modId as EngineeringModuleId);
                      onCloseMobile();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectModule(modId as EngineeringModuleId);
                        onCloseMobile();
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer select-none group/pinned ${
                      isActive
                        ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    <span className="truncate pr-1">{itemName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        workbench.toggleFavoriteTool(modId);
                      }}
                      className="p-1 text-amber-500 hover:text-amber-600 rounded flex items-center justify-center shrink-0 cursor-pointer"
                      title="Unpin from favorites"
                      aria-label={`Unpin ${itemName}`}
                    >
                      <Star className="w-3 h-3 fill-amber-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Six Accordion Categories */}
        <div className="space-y-2 pt-1">
          {!isCollapsed && (
            <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Engineering Laboratories
            </div>
          )}

          {SIDEBAR_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isOpen = openCategories[cat.id] ?? false;
            const hasActiveItem = !isDashboardActive && cat.items.some((it) => it.moduleId === activeModule);

            if (isCollapsed) {
              return (
                <div key={cat.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full p-2.5 rounded-2xl flex items-center justify-center transition-colors cursor-pointer ${
                      hasActiveItem
                        ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                    title={cat.name}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={cat.id}
                className="rounded-2xl border border-transparent hover:border-[var(--md-sys-color-outline-variant)] transition-colors overflow-hidden"
              >
                {/* Accordion Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`w-full px-3 py-2 flex items-center justify-between rounded-xl transition-colors cursor-pointer text-left ${
                    hasActiveItem
                      ? 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] font-bold'
                      : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${hasActiveItem ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`} />
                    <span className="text-xs font-semibold truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                      {cat.items.length}
                    </span>
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                    )}
                  </div>
                </button>

                {/* Sub-items list */}
                {isOpen && (
                  <div className="py-1 pl-6 pr-1 space-y-0.5 border-l border-[var(--md-sys-color-outline-variant)]/60 ml-4 my-1">
                    {cat.items.map((item) => {
                      const isItemActive = !isDashboardActive && item.moduleId === activeModule;
                      const isFav = item.moduleId ? workbench.isFavoriteTool(item.moduleId) : false;

                      return (
                        <div
                          key={item.id}
                          className={`group/sub flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer text-left ${
                            isItemActive
                              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-2xs'
                              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                          }`}
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="min-w-0 flex-1 pr-1.5">
                            <div className="text-xs truncate leading-snug">{item.name}</div>
                            {item.subtitle && (
                              <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] opacity-70 truncate">
                                {item.subtitle}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {item.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 text-[var(--md-sys-color-on-surface-variant)]">
                                {item.badge}
                              </span>
                            )}
                            {item.moduleId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  workbench.toggleFavoriteTool(item.moduleId!);
                                }}
                                className={`p-1 opacity-0 group-hover/sub:opacity-100 transition-opacity ${
                                  isFav ? '!opacity-100 text-amber-500' : 'text-slate-400 hover:text-amber-500'
                                }`}
                                title={isFav ? 'Remove from Pinned' : 'Pin to favorites'}
                              >
                                <Star className={`w-3 h-3 ${isFav ? 'fill-amber-500' : ''}`} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info / Project Meta */}
      <div className="p-3 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="truncate pr-2">
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Active Project</span>
              <span className="font-bold text-[var(--md-sys-color-on-surface)] truncate block">
                {workbench.projectMetadata.projectName}
              </span>
            </div>
            {onOpenWorkspaceManager && (
              <button
                type="button"
                onClick={onOpenWorkspaceManager}
                className="p-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] cursor-pointer shrink-0"
                title="Manage Projects"
              >
                <FolderArchive className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            {onOpenWorkspaceManager && (
              <button
                type="button"
                onClick={onOpenWorkspaceManager}
                className="p-2 rounded-xl text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface)] cursor-pointer"
                title="Manage Projects"
              >
                <FolderArchive className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block h-screen sticky top-0 shrink-0 transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={onCloseMobile}
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
