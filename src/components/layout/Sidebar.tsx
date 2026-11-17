import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
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
  Building2,
  FlaskConical,
  User,
  Palette,
  Check,
  RotateCw,
  Calculator,
  Layers,
  Columns,
  Shield,
  Anchor,
  Mountain,
  Boxes,
  DollarSign,
  BrickWall,
  MapPin,
  Droplets,
  ArrowRightLeft,
  Package,
  ClipboardList,
  CalendarClock,
  Users,
  BookOpen,
  Receipt,
  Wallet,
  Box,
  FileText,
  Mail,
} from 'lucide-react';
import { EngineeringModuleId, UnitSystemPreset, ThemePreference } from '../../types/civil';
import { useWorkbench } from '../../context/WorkbenchContext';
import { useTheme, EngineeringTheme } from '../../context/ThemeContext';
import { useCivilLab } from '../../context/CivilLabContext';
import { TOOL_REGISTRY_MAP } from '../../data/toolRegistry';

export type DisciplineAccentKey = 'amber' | 'emerald' | 'indigo' | 'sky' | 'teal' | 'rose';

export interface SidebarSubItem {
  id: string;
  name: string;
  bnLabel?: string;
  subtitle?: string;
  moduleId?: EngineeringModuleId;
  subAction?: string;
  actionType?:
    | 'module'
    | 'far-setback'
    | 'watertank'
    | 'septictank'
    | 'staircase'
    | 'arch-services'
    | 'cad-viewport'
    | 'cad-shortcuts'
    | 'excel-formulas'
    | 'site-qc';
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SidebarCategory {
  id: string;
  name: string;
  shortName: string;
  accent: DisciplineAccentKey;
  icon: React.ComponentType<{ className?: string }>;
  items: SidebarSubItem[];
}

export interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenMobile?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeModule: EngineeringModuleId;
  activeSubAction?: string;
  isDashboardActive: boolean;
  isHomeActive?: boolean;
  onSelectDashboard: () => void;
  onSelectModule: (moduleId: EngineeringModuleId, subAction?: string) => void;
  onOpenArchitectureModal?: (tab: 'far' | 'staircase' | 'watertank' | 'septictank' | 'services') => void;
  onOpenCadModal?: (tab: 'viewport' | 'shortcuts' | 'excel') => void;
  onOpenSiteQcModal?: () => void;
  onOpenWorkspaceManager?: () => void;
  onOpenProfileModal?: (tab?: 'profile' | 'preferences' | 'presets') => void;
  unitSystemPreset?: UnitSystemPreset;
  onSelectUnitPreset?: (preset: UnitSystemPreset) => void;
  onSelectTheme?: (theme: ThemePreference) => void;
  engineerDisplayName?: string;
}

const ACCENT_STYLES: Record<
  DisciplineAccentKey,
  {
    iconBg: string;
    iconText: string;
    badgeBg: string;
    dotBg: string;
    activeHeader: string;
  }
> = {
  amber: {
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-500',
    badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    dotBg: 'bg-amber-500',
    activeHeader: 'bg-amber-500/10 text-[var(--md-sys-color-on-surface)]',
  },
  emerald: {
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    dotBg: 'bg-emerald-500',
    activeHeader: 'bg-emerald-500/10 text-[var(--md-sys-color-on-surface)]',
  },
  indigo: {
    iconBg: 'bg-indigo-500/15',
    iconText: 'text-indigo-500',
    badgeBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    dotBg: 'bg-indigo-500',
    activeHeader: 'bg-indigo-500/10 text-[var(--md-sys-color-on-surface)]',
  },
  sky: {
    iconBg: 'bg-sky-500/15',
    iconText: 'text-sky-500',
    badgeBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    dotBg: 'bg-sky-500',
    activeHeader: 'bg-sky-500/10 text-[var(--md-sys-color-on-surface)]',
  },
  teal: {
    iconBg: 'bg-teal-500/15',
    iconText: 'text-teal-500',
    badgeBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    dotBg: 'bg-teal-500',
    activeHeader: 'bg-teal-500/10 text-[var(--md-sys-color-on-surface)]',
  },
  rose: {
    iconBg: 'bg-rose-500/15',
    iconText: 'text-rose-500',
    badgeBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    dotBg: 'bg-rose-500',
    activeHeader: 'bg-rose-500/10 text-[var(--md-sys-color-on-surface)]',
  },
};

export const SIDEBAR_CATEGORIES: SidebarCategory[] = [
  {
    id: 'structural',
    name: 'Structural & RCC',
    shortName: 'Structural',
    accent: 'amber',
    icon: SlidersHorizontal,
    items: [
      { id: 'beam-analysis', name: 'Beam Analysis', badge: 'STR-01', moduleId: 'beam-analysis', actionType: 'module', icon: Calculator },
      { id: 'continuous-beam', name: 'Continuous Beam', badge: 'STR-02', moduleId: 'continuous-beam', actionType: 'module', icon: Layers },
      { id: 'frame-truss-2d', name: '2D Frame & Truss', badge: 'STR-04', moduleId: 'frame-truss-2d', actionType: 'module', icon: Columns },
      { id: 'section-analyzer', name: 'Section Analyzer', badge: 'STR-05', moduleId: 'section-analyzer', actionType: 'module', icon: Shield },
      { id: 'rc-column-design', name: 'RC Column Design', badge: 'STR-06', moduleId: 'rc-column-design', actionType: 'module', icon: Building2 },
      { id: 'strut-and-tie', name: 'Strut-and-Tie (STM)', badge: 'STR-07', moduleId: 'strut-and-tie', actionType: 'module', icon: Layers },
      { id: 'rebar-bbs', name: 'Rebar BBS', bnLabel: 'রড হিসাব', badge: 'STR-03', moduleId: 'rebar-bbs', actionType: 'module', icon: Calculator },
    ],
  },
  {
    id: 'geotechnical',
    name: 'Geotechnical & Foundation',
    shortName: 'Geotechnical',
    accent: 'emerald',
    icon: HardHat,
    items: [
      { id: 'bearing-capacity', name: 'Shallow Bearing Capacity', bnLabel: 'মাটি ধারণ', badge: 'GEO-01', moduleId: 'bearing-capacity', actionType: 'module', icon: HardHat },
      { id: 'pile-capacity', name: 'Deep Pile Capacity', bnLabel: 'পাইল', badge: 'GEO-02', moduleId: 'pile-capacity', actionType: 'module', icon: Anchor },
      { id: 'earthwork-alignment', name: 'Earthwork & Alignment', bnLabel: 'মাটি কাটা', badge: 'EAR-01', moduleId: 'earthwork-alignment', actionType: 'module', icon: Mountain },
    ],
  },
  {
    id: 'estimation',
    name: 'Estimation, Takeoff & BOQ',
    shortName: 'BOQ & Takeoff',
    accent: 'indigo',
    icon: FileSpreadsheet,
    items: [
      { id: 'boq-estimator', name: 'BOQ Estimator', bnLabel: 'বিওকিউ', badge: 'BOQ-01', moduleId: 'boq-estimator', actionType: 'module', icon: FileSpreadsheet },
      { id: 'rate-analysis', name: 'Rate Analysis', bnLabel: 'দর বিশ্লেষণ', badge: 'BOQ-02', moduleId: 'rate-analysis', actionType: 'module', icon: DollarSign },
      { id: 'concrete-materials', name: 'Concrete Materials', bnLabel: 'ম্যাটেরিয়াল', badge: 'MAT-02', moduleId: 'concrete-materials', actionType: 'module', icon: Boxes },
      { id: 'concrete-mix', name: 'Concrete Mix (ACI 211)', badge: 'MAT-01', moduleId: 'concrete-mix', actionType: 'module', icon: Boxes },
      { id: 'masonry-finishes', name: 'Masonry & Finishes', bnLabel: 'গাঁথুনি', badge: 'MAT-03', moduleId: 'masonry-finishes', actionType: 'module', icon: BrickWall },
      { id: 'surveying-suite', name: 'Surveying Suite', bnLabel: 'জরিপ', badge: 'SUR-01', moduleId: 'surveying-suite', actionType: 'module', icon: MapPin },
    ],
  },
  {
    id: 'hydraulics',
    name: 'Hydraulics & Conduits',
    shortName: 'Hydraulics',
    accent: 'sky',
    icon: Waves,
    items: [
      { id: 'open-channel', name: 'Open-Channel Hydraulics', badge: 'HYD-01', moduleId: 'open-channel', actionType: 'module', icon: Waves },
      { id: 'pipe-hydraulics', name: 'Pipe Hydraulics', badge: 'HYD-02', moduleId: 'pipe-hydraulics', actionType: 'module', icon: Droplets },
      { id: 'unit-converter', name: 'Smart Unit Converter', bnLabel: 'ইউনিট', badge: 'UNI-01', moduleId: 'unit-converter', actionType: 'module', icon: ArrowRightLeft },
    ],
  },
  {
    id: 'sitemanagement',
    name: 'Site Management & Field ERP',
    shortName: 'Field ERP',
    accent: 'teal',
    icon: Building2,
    items: [
      { id: 'store-inventory', name: 'Store Inventory', bnLabel: 'স্টোর', badge: 'SM-01', moduleId: 'store-inventory', actionType: 'module', icon: Package },
      { id: 'material-requisition', name: 'Material Requisitions & PO', bnLabel: 'রিকুইজিশন', badge: 'SM-02', moduleId: 'material-requisition', actionType: 'module', icon: ClipboardList },
      { id: 'schedule-roster', name: 'Schedule & Roster', bnLabel: 'শিডিউল', badge: 'SM-03', moduleId: 'schedule-roster', actionType: 'module', icon: CalendarClock },
      { id: 'labor-attendance', name: 'Labor & Wages', bnLabel: 'হাজিরা', badge: 'SM-04', moduleId: 'labor-attendance', actionType: 'module', icon: Users },
      { id: 'field-notebook', name: 'Field Notebook', bnLabel: 'নোটবুক', badge: 'SM-05', moduleId: 'field-notebook', actionType: 'module', icon: BookOpen },
      { id: 'contractor-bills', name: 'Sub-Contractor RA Bills', bnLabel: 'বিল', badge: 'SM-06', moduleId: 'contractor-bills', actionType: 'module', icon: Receipt },
      { id: 'petty-cash', name: 'Petty Cash & Imprest', bnLabel: 'ক্যাশ', badge: 'SM-07', moduleId: 'petty-cash', actionType: 'module', icon: Wallet },
      { id: 'cube-tests', name: 'Concrete Cube Tests', bnLabel: 'কিউব টেস্ট', badge: 'SM-08', moduleId: 'cube-tests', actionType: 'module', icon: Box },
      { id: 'daily-progress-report', name: 'Daily Progress Report', bnLabel: 'ডিপিআর', badge: 'SM-09', moduleId: 'daily-progress-report', actionType: 'module', icon: FileText },
      { id: 'office-docs', name: 'Official Letters & Docs', bnLabel: 'অফিস ডক', badge: 'SM-10', moduleId: 'office-docs', actionType: 'module', icon: Mail },
    ],
  },
  {
    id: 'testing-lab-qaqc',
    name: 'Testing Lab & QA/QC',
    shortName: 'Testing Lab',
    accent: 'rose',
    icon: FlaskConical,
    items: [
      { id: 'lab-overview', name: 'Lab Suite Overview', bnLabel: 'ল্যাব', badge: 'LAB-00', moduleId: 'testing-lab-qaqc', actionType: 'module', icon: FlaskConical },
      { id: 'lab-cement', name: 'Cement Quality', bnLabel: 'সিমেন্ট', badge: 'LAB-01', moduleId: 'testing-lab-qaqc', subAction: 'cement', actionType: 'module' },
      { id: 'lab-aggregate', name: 'Sand & Aggregate', bnLabel: 'বালি-পাথর', badge: 'LAB-02', moduleId: 'testing-lab-qaqc', subAction: 'aggregate', actionType: 'module' },
      { id: 'lab-brick', name: 'Brick & Block', bnLabel: 'ইট-ব্লক', badge: 'LAB-03', moduleId: 'testing-lab-qaqc', subAction: 'brick-block', actionType: 'module' },
      { id: 'lab-concrete', name: 'Concrete & NDT', bnLabel: 'কনক্রিট', badge: 'LAB-04', moduleId: 'testing-lab-qaqc', subAction: 'concrete-ndt', actionType: 'module' },
      { id: 'lab-rebar', name: 'Rebar & Steel', bnLabel: 'রড টেস্ট', badge: 'LAB-05', moduleId: 'testing-lab-qaqc', subAction: 'rebar-steel', actionType: 'module' },
      { id: 'lab-soil', name: 'Soil & Pile', bnLabel: 'মাটি-পাইল', badge: 'LAB-06', moduleId: 'testing-lab-qaqc', subAction: 'soil-pile', actionType: 'module' },
      { id: 'lab-highway', name: 'Highway & Bitumen', bnLabel: 'সড়ক', badge: 'LAB-07', moduleId: 'testing-lab-qaqc', subAction: 'highway-bitumen', actionType: 'module' },
      { id: 'lab-water', name: 'Water & Plumbing', bnLabel: 'পানি', badge: 'LAB-08', moduleId: 'testing-lab-qaqc', subAction: 'water-plumbing', actionType: 'module' },
      { id: 'lab-checklists', name: 'Site QA/QC Checklists', bnLabel: 'চেকলিস্ট', badge: 'LAB-09', moduleId: 'testing-lab-qaqc', subAction: 'site-checklists', actionType: 'module' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  onOpenMobile,
  isCollapsed,
  onToggleCollapse,
  activeModule,
  activeSubAction,
  isDashboardActive,
  isHomeActive,
  onSelectDashboard,
  onSelectModule,
  onOpenArchitectureModal,
  onOpenCadModal,
  onOpenSiteQcModal,
  onOpenProfileModal,
  onSelectTheme,
  engineerDisplayName,
}) => {
  const workbench = useWorkbench();
  const civilLab = useCivilLab();
  const { theme, themeConfig, setTheme, availableThemes } = useTheme();

  const [filterQuery, setFilterQuery] = useState('');
  // All categories start collapsed by default (null). Single-open accordion mode.
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  // Compact Rail flyout state (when collapsed on desktop or on tablet rail)
  const [railFlyoutCatId, setRailFlyoutCatId] = useState<string | null>(null);
  const [railFlyoutTop, setRailFlyoutTop] = useState<number>(80);
  const [themePopoverOpen, setThemePopoverOpen] = useState(false);

  const tabletRailRef = useRef<HTMLDivElement>(null);
  const desktopRailRef = useRef<HTMLDivElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Close rail flyout & theme popover on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTablet = tabletRailRef.current?.contains(target) ?? false;
      const insideDesktop = desktopRailRef.current?.contains(target) ?? false;
      const insideMobile = mobileDrawerRef.current?.contains(target) ?? false;
      const insideAnySidebar = insideTablet || insideDesktop || insideMobile;

      if (railFlyoutCatId && !insideTablet && !insideDesktop) {
        setRailFlyoutCatId(null);
      }
      if (themePopoverOpen && !insideAnySidebar) {
        setThemePopoverOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRailFlyoutCatId(null);
        setThemePopoverOpen(false);
        if (isMobileOpen) onCloseMobile();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [railFlyoutCatId, themePopoverOpen, isMobileOpen, onCloseMobile]);

  const toggleCategory = (catId: string) => {
    setOpenCategoryId((prev) => (prev === catId ? null : catId));
  };

  const handleSelectCuratedTheme = (tId: EngineeringTheme) => {
    const matched = availableThemes.find((t) => t.id === tId);
    setTheme(tId);
    civilLab.updateUserProfile({ theme: tId });
    if (matched && onSelectTheme) {
      onSelectTheme(matched.mode === 'dark' ? 'dark' : 'light');
    }
    setThemePopoverOpen(false);
  };

  const handleQuickCycleTheme = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentIdx = availableThemes.findIndex((t) => t.id === theme);
    const nextTheme = availableThemes[(currentIdx + 1) % availableThemes.length];
    if (nextTheme) {
      setTheme(nextTheme.id);
      civilLab.updateUserProfile({ theme: nextTheme.id });
      if (onSelectTheme) {
        onSelectTheme(nextTheme.mode === 'dark' ? 'dark' : 'light');
      }
    }
  };

  const handleItemClick = (item: SidebarSubItem) => {
    if (item.actionType === 'module' && item.moduleId) {
      onSelectModule(item.moduleId, item.subAction);
    } else if (item.actionType === 'far-setback') {
      onOpenArchitectureModal?.('far');
    } else if (item.actionType === 'watertank') {
      onOpenArchitectureModal?.('watertank');
    } else if (item.actionType === 'septictank') {
      onOpenArchitectureModal?.('septictank');
    } else if (item.actionType === 'staircase') {
      if (onOpenArchitectureModal) onOpenArchitectureModal('staircase');
      else onSelectModule('rebar-bbs', 'staircase');
    } else if (item.actionType === 'arch-services') {
      onOpenArchitectureModal?.('services');
    } else if (item.actionType === 'cad-viewport') {
      onOpenCadModal?.('viewport');
    } else if (item.actionType === 'cad-shortcuts') {
      onOpenCadModal?.('shortcuts');
    } else if (item.actionType === 'excel-formulas') {
      onOpenCadModal?.('excel');
    } else if (item.actionType === 'site-qc') {
      onOpenSiteQcModal?.();
    } else if (item.moduleId) {
      onSelectModule(item.moduleId, item.subAction);
    }
    setRailFlyoutCatId(null);
    setThemePopoverOpen(false);
    onCloseMobile();
  };

  const resolvedEngineerName =
    (engineerDisplayName || civilLab.userProfile.name || '').trim() || 'Engineer Profile';

  // Filtered discipline groups for real-time sidebar search
  const normalizedFilter = filterQuery.trim().toLowerCase();
  const visibleCategories = useMemo(() => {
    if (!normalizedFilter) return SIDEBAR_CATEGORIES;
    return SIDEBAR_CATEGORIES.map((cat) => {
      const catMatches =
        cat.name.toLowerCase().includes(normalizedFilter) ||
        cat.shortName.toLowerCase().includes(normalizedFilter);
      if (catMatches) return cat;
      const matchingItems = cat.items.filter(
        (item) =>
          item.name.toLowerCase().includes(normalizedFilter) ||
          (item.badge && item.badge.toLowerCase().includes(normalizedFilter)) ||
          (item.bnLabel && item.bnLabel.includes(normalizedFilter)) ||
          (item.moduleId && item.moduleId.toLowerCase().includes(normalizedFilter))
      );
      return { ...cat, items: matchingItems };
    }).filter((cat) => cat.items.length > 0);
  }, [normalizedFilter]);

  const checkItemActive = (item: SidebarSubItem): boolean => {
    if (isDashboardActive || !item.moduleId || item.moduleId !== activeModule) return false;
    if (item.moduleId === 'testing-lab-qaqc') {
      if (item.subAction) return item.subAction === activeSubAction;
      return !activeSubAction;
    }
    return true;
  };

  const renderSidebarBody = (opts: {
    railMode: boolean;
    isSlideOver?: boolean;
    containerRef?: React.RefObject<HTMLDivElement | null>;
  }) => {
    const { railMode, isSlideOver = false, containerRef } = opts;
    const homeSelected = isHomeActive ?? isDashboardActive;

    return (
      <div
        ref={containerRef}
        className="relative flex flex-col h-full max-h-full min-h-0 overflow-hidden theme-glass-panel border-r border-[var(--md-sys-color-outline-variant)] select-none"
      >
        {/* 1. STICKY TOP CONTROLS (Home + Collapse/Close + Filter Search) */}
        <div
          className={`sticky top-0 z-20 shrink-0 border-b border-[var(--md-sys-color-outline-variant)]/70 bg-[var(--md-sys-color-surface)]/95 backdrop-blur-md ${
            railMode ? 'px-2 py-2.5 flex flex-col items-center gap-1.5' : 'px-3 pt-2.5 pb-2.5 space-y-2'
          }`}
        >
          <div className={`flex items-center ${railMode ? 'flex-col gap-1.5 w-full' : 'justify-between gap-2'}`}>
            <button
              type="button"
              onClick={() => {
                onSelectDashboard();
                setRailFlyoutCatId(null);
                setThemePopoverOpen(false);
                onCloseMobile();
              }}
              aria-current={homeSelected ? 'page' : undefined}
              title="Home"
              className={`group relative flex items-center transition-all cursor-pointer rounded-2xl min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] ${
                railMode ? 'w-11 justify-center px-0' : 'flex-1 gap-2.5 px-3'
              } ${
                homeSelected
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-2xs'
                  : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] font-semibold'
              }`}
            >
              <Home
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                  homeSelected
                    ? 'text-[var(--md-sys-color-on-primary-container)]'
                    : 'text-[var(--md-sys-color-primary)]'
                }`}
              />
              {!railMode && <span className="text-xs tracking-tight whitespace-nowrap">Home</span>}
            </button>

            {/* Collapse / Expand or Slide-Over Close Control */}
            {isSlideOver ? (
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-9 h-9 flex items-center justify-center rounded-2xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer shrink-0"
                aria-label="Close navigation drawer"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <>
                {/* Desktop (lg+) 2-state Collapse / Expand toggle */}
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className={`hidden lg:flex items-center justify-center rounded-2xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer shrink-0 ${
                    railMode ? 'w-11 h-8' : 'w-9 h-[38px]'
                  }`}
                  title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse to Icon Rail (Ctrl+B)'}
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>

                {/* Tablet (md only) 1-click Expand Drawer toggle */}
                {onOpenMobile && (
                  <button
                    type="button"
                    onClick={onOpenMobile}
                    className="hidden md:flex lg:hidden items-center justify-center w-11 h-8 rounded-2xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer shrink-0"
                    title="Expand Navigation Drawer"
                    aria-label="Expand Navigation Drawer"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Compact Quick-Filter Search Input (Expanded mode only) */}
          {!railMode && (
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter modules..."
                aria-label="Filter modules"
                className="w-full h-8 pl-8 pr-8 rounded-xl text-xs bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/70 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-colors"
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2 p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                  aria-label="Clear filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. INDEPENDENTLY SCROLLABLE DISCIPLINE CATEGORIES / ICON RAIL */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar ${
            railMode ? 'px-2 py-2 space-y-1.5' : 'px-2.5 py-2 space-y-1.5'
          }`}
        >
          {/* Compact Icon Rail Mode (Desktop collapsed or Tablet md) */}
          {railMode ? (
            <div className="flex flex-col items-center space-y-1.5">
              {SIDEBAR_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const accentStyle = ACCENT_STYLES[cat.accent];
                const hasActiveItem =
                  !isDashboardActive && cat.items.some((it) => it.moduleId === activeModule);
                const isFlyoutOpen = railFlyoutCatId === cat.id;

                return (
                  <div key={cat.id} className="relative group/rail w-full flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const maxTop = Math.max(16, window.innerHeight - 360);
                        setRailFlyoutTop(Math.min(Math.max(16, rect.top), maxTop));
                        setThemePopoverOpen(false);
                        setRailFlyoutCatId((prev) => (prev === cat.id ? null : cat.id));
                      }}
                      aria-expanded={isFlyoutOpen}
                      aria-label={cat.name}
                      title={cat.name}
                      className={`w-11 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] ${
                        hasActiveItem || isFlyoutOpen
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                          hasActiveItem || isFlyoutOpen
                            ? 'bg-transparent'
                            : `${accentStyle.iconBg} ${accentStyle.iconText}`
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                      </span>
                      {hasActiveItem && !isFlyoutOpen && (
                        <span
                          className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${accentStyle.dotBg}`}
                        />
                      )}
                    </button>

                    {/* Hover Tooltip when flyout is closed */}
                    {!isFlyoutOpen && (
                      <div
                        role="tooltip"
                        className="pointer-events-none opacity-0 group-hover/rail:opacity-100 transition-opacity duration-150 fixed left-[76px] z-50 px-2.5 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] shadow-xl whitespace-nowrap hidden md:block"
                        style={{ marginTop: '4px' }}
                      >
                        {cat.name}
                      </div>
                    )}

                    {/* Floating Popover Menu on Rail Click */}
                    {isFlyoutOpen && (
                      <div
                        style={{ top: `${railFlyoutTop}px` }}
                        className="fixed left-[76px] z-50 w-60 max-h-[68vh] overflow-y-auto custom-scrollbar rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] shadow-2xl p-2 space-y-1"
                      >
                        <div className="px-2.5 py-1.5 flex items-center gap-2 border-b border-[var(--md-sys-color-outline-variant)]">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${accentStyle.iconBg} ${accentStyle.iconText}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                            {cat.name}
                          </span>
                        </div>

                        <div className="space-y-0.5 pt-1">
                          {cat.items.map((item) => {
                            const isItemActive = checkItemActive(item);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleItemClick(item)}
                                className={`w-full min-h-[36px] px-2.5 py-1.5 rounded-xl flex items-center gap-2 text-left transition-colors cursor-pointer ${
                                  isItemActive
                                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isItemActive
                                      ? accentStyle.dotBg
                                      : 'bg-[var(--md-sys-color-outline)]'
                                  }`}
                                />
                                <span className="text-xs truncate">{item.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Expanded Mode: Pinned + Single-Open Collapsible Discipline Accordions */
            <>
              {/* Quick Pinned Calculators (only when not filtering) */}
              {!normalizedFilter && workbench.favoriteTools.length > 0 && (
                <div className="pb-1.5 mb-1 border-b border-[var(--md-sys-color-outline-variant)]/70">
                  <div className="px-2 pb-1 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>Pinned</span>
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {workbench.favoriteTools.map((modId) => {
                      const isActive = !isDashboardActive && (activeModule as string) === modId;
                      let itemName: string = TOOL_REGISTRY_MAP[modId]?.shortLabel || modId;
                      for (const cat of SIDEBAR_CATEGORIES) {
                        const match = cat.items.find(
                          (i) => (i.moduleId as string) === modId && !i.subAction
                        );
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
                          className={`w-full min-h-[34px] flex items-center justify-between px-2.5 py-1 rounded-xl text-xs transition-colors cursor-pointer select-none group/pinned ${
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
                            className="p-1 text-amber-500 hover:text-amber-600 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                            title="Unpin"
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

              {/* Empty Filter State */}
              {visibleCategories.length === 0 ? (
                <div className="px-3 py-6 text-center space-y-2 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                  <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                    No matching modules
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilterQuery('')}
                    className="text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
                  >
                    Clear filter
                  </button>
                </div>
              ) : (
                visibleCategories.map((cat) => {
                  const Icon = cat.icon;
                  const accentStyle = ACCENT_STYLES[cat.accent];
                  const hasActiveItem =
                    !isDashboardActive && cat.items.some((it) => it.moduleId === activeModule);
                  const isOpen = Boolean(normalizedFilter) || openCategoryId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className={`rounded-2xl border overflow-hidden transition-colors ${
                        isOpen
                          ? 'bg-[var(--md-sys-color-surface-container-low)]/75 border-[var(--md-sys-color-outline-variant)]'
                          : 'bg-[var(--md-sys-color-surface-container-low)]/35 border-[var(--md-sys-color-outline-variant)]/50 hover:border-[var(--md-sys-color-outline-variant)]'
                      }`}
                    >
                      {/* Clean Category Accordion Header (Collapsed by default) */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        aria-expanded={isOpen}
                        className={`w-full px-2.5 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer text-left min-h-[40px] ${
                          hasActiveItem
                            ? accentStyle.activeHeader
                            : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${accentStyle.iconBg} ${accentStyle.iconText}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-semibold tracking-tight truncate">
                            {cat.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasActiveItem && !isOpen && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${accentStyle.dotBg}`}
                              title="Contains active module"
                            />
                          )}
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] transition-transform duration-200 ${
                              isOpen ? 'rotate-90 text-[var(--md-sys-color-on-surface)]' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Accordion Module Items (Clean module names only + subtle hover pin star) */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-[var(--md-sys-color-outline-variant)]/40">
                              {cat.items.map((item) => {
                                const isItemActive = checkItemActive(item);
                                const isFav = item.moduleId
                                  ? workbench.isFavoriteTool(item.moduleId)
                                  : false;

                                return (
                                  <div
                                    key={item.id}
                                    className={`group/item relative flex items-center justify-between gap-2 min-h-[36px] px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                                      isItemActive
                                        ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold shadow-2xs'
                                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] font-medium'
                                    }`}
                                    onClick={() => handleItemClick(item)}
                                    title={item.name}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                                          isItemActive
                                            ? `${accentStyle.dotBg} scale-125`
                                            : 'bg-[var(--md-sys-color-outline)] group-hover/item:bg-[var(--md-sys-color-on-surface-variant)]'
                                        }`}
                                      />
                                      <span className="text-xs truncate leading-snug">
                                        {item.name}
                                      </span>
                                    </div>

                                    {item.moduleId && !item.subAction && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          workbench.toggleFavoriteTool(item.moduleId!);
                                        }}
                                        className={`p-1 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer shrink-0 ${
                                          isFav
                                            ? '!opacity-100 text-amber-500'
                                            : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-amber-500'
                                        }`}
                                        title={isFav ? 'Unpin' : 'Pin module'}
                                        aria-label={isFav ? `Unpin ${item.name}` : `Pin ${item.name}`}
                                      >
                                        <Star className={`w-3 h-3 ${isFav ? 'fill-amber-500' : ''}`} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* 3. STICKY SIDEBAR FOOTER DOCK (CAD, By-Laws, Permanent Theme Switcher + Profile) */}
        <div
          className={`sticky bottom-0 z-20 mt-auto border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]/95 backdrop-blur-md shrink-0 ${
            railMode
              ? 'p-2 flex flex-col items-center gap-1.5'
              : 'px-2.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] space-y-1.5'
          }`}
        >
          {/* Upward 6-Theme Popup Menu (Works in Mobile Portrait, Mobile Landscape, Tablet Rail & Desktop) */}
          {themePopoverOpen && (
            <div
              className={`absolute bottom-full mb-2 z-50 rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]/95 backdrop-blur-2xl shadow-2xl p-2 space-y-1.5 ${
                railMode ? 'left-[72px] w-68' : 'left-2 right-2 w-auto'
              }`}
            >
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-2">
                <span>Architectural Themes</span>
                <button
                  type="button"
                  onClick={handleQuickCycleTheme}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:opacity-90 text-[9.5px] font-mono font-bold cursor-pointer transition-opacity"
                  title="1-Tap Cycle Next Theme"
                >
                  <RotateCw className="w-2.5 h-2.5" />
                  <span>Cycle</span>
                </button>
              </div>
              <div className="space-y-1 max-h-[min(260px,52vh)] overflow-y-auto custom-scrollbar pr-0.5">
                {availableThemes.map((t) => {
                  const isActive = t.id === theme;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectCuratedTheme(t.id)}
                      className={`w-full px-2 py-1.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-[var(--md-sys-color-primary-container)]/35 border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-bold shadow-2xs'
                          : 'border-transparent hover:border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Mini Live Blueprint Surface Swatch */}
                        <div
                          className="w-7 h-7 rounded-lg border shrink-0 flex items-center justify-center relative overflow-hidden shadow-2xs"
                          style={{
                            backgroundColor: t.colors.bg,
                            borderColor: t.colors.border,
                            backgroundImage: `
                              radial-gradient(circle at 25% 25%, ${t.colors.ambientGlow} 0%, transparent 70%),
                              linear-gradient(to right, ${t.colors.gridLine} 1px, transparent 1px),
                              linear-gradient(to bottom, ${t.colors.gridLine} 1px, transparent 1px)
                            `,
                            backgroundSize: '100% 100%, 6px 6px, 6px 6px',
                          }}
                        >
                          <div className="flex -space-x-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/30"
                              style={{ backgroundColor: t.colors.accent }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/30"
                              style={{ backgroundColor: t.colors.secondary }}
                            />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold truncate">{t.name}</div>
                          <div className="text-[9.5px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                            {t.subtitle} · {t.mode.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {railMode ? (
            /* Rail Mode Sticky Footer Icons */
            <>
              {onOpenCadModal && (
                <button
                  type="button"
                  onClick={() => onOpenCadModal('viewport')}
                  className="w-10 h-9 rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-center transition-colors cursor-pointer"
                  title="CAD & Excel Hub"
                  aria-label="CAD & Excel Hub"
                >
                  <Laptop className="w-4 h-4 text-sky-500" />
                </button>
              )}

              {onOpenArchitectureModal && (
                <button
                  type="button"
                  onClick={() => onOpenArchitectureModal('far')}
                  className="w-10 h-9 rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-center transition-colors cursor-pointer"
                  title="Architecture By-Laws"
                  aria-label="Architecture By-Laws"
                >
                  <Compass className="w-4 h-4 text-emerald-500" />
                </button>
              )}

              {/* Permanent Theme Switcher Icon in Rail Footer */}
              <button
                type="button"
                onClick={() => {
                  setRailFlyoutCatId(null);
                  setThemePopoverOpen((prev) => !prev);
                }}
                className={`relative w-10 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  themePopoverOpen
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                }`}
                title={`Theme: ${themeConfig.name} (Click for 6-theme menu)`}
                aria-label="Switch Theme"
              >
                <Palette className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span
                  className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-black/30"
                  style={{ backgroundColor: themeConfig.colors.accent }}
                />
              </button>

              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={() => onOpenProfileModal('profile')}
                  className="w-10 h-9 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] flex items-center justify-center transition-colors cursor-pointer"
                  title={resolvedEngineerName}
                  aria-label={resolvedEngineerName}
                >
                  <User className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            /* Expanded Mode Sticky Footer: CAD + By-Laws + Permanent Theme Control (Popup + 1-Tap Cycle) + Engineer Profile */
            <>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onOpenCadModal?.('viewport');
                    onCloseMobile();
                  }}
                  className="min-h-[32px] px-2 py-1 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/50 hover:bg-[var(--md-sys-color-surface-container)] text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="CAD & Excel Hub"
                >
                  <Laptop className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="truncate">CAD</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenArchitectureModal?.('far');
                    onCloseMobile();
                  }}
                  className="min-h-[32px] px-2 py-1 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/50 hover:bg-[var(--md-sys-color-surface-container)] text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Architecture By-Laws"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">By-Laws</span>
                </button>

                {/* Permanent Theme Control: Main button opens 6-theme popup menu, right action cycles in 1 tap */}
                <div
                  className={`min-h-[32px] rounded-xl border flex items-stretch overflow-hidden transition-colors ${
                    themePopoverOpen
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]/60'
                      : 'bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/50 text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setThemePopoverOpen((prev) => !prev)}
                    className="flex-1 pl-2 pr-1 py-1 flex items-center justify-center gap-1 text-[11px] font-semibold hover:bg-[var(--md-sys-color-surface-container)]/60 transition-colors cursor-pointer min-w-0"
                    title={`Active Theme: ${themeConfig.name} (Tap to open 6-theme menu)`}
                    aria-expanded={themePopoverOpen}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/30 shrink-0"
                      style={{ backgroundColor: themeConfig.colors.accent }}
                    />
                    <span className="truncate">Theme</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickCycleTheme}
                    className="px-1.5 flex items-center justify-center border-l border-[var(--md-sys-color-outline-variant)]/70 hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] transition-colors cursor-pointer shrink-0"
                    title="1-Tap Cycle Next Theme"
                    aria-label="1-Tap Cycle Next Theme"
                  >
                    <RotateCw className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenProfileModal('profile');
                    onCloseMobile();
                  }}
                  className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/60 hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-between gap-2 transition-colors cursor-pointer text-left"
                  title="Open Engineer Profile & Preferences"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
                      <User className="w-3 h-3" />
                    </span>
                    <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                      {resolvedEngineerName}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Tablet Persistent Compact Icon Rail (md only: 768px - 1023px) */}
      <aside
        aria-label="Compact Navigation Rail"
        className="hidden md:block lg:hidden w-[68px] h-full max-h-full min-h-0 shrink-0 z-30 print:hidden"
      >
        {renderSidebarBody({ railMode: true, containerRef: tabletRailRef })}
      </aside>

      {/* 2. Desktop Persistent 2-State Navigation Drawer / Icon Rail (lg and above) */}
      <aside
        aria-label="Primary Navigation Sidebar"
        className={`hidden lg:block h-full max-h-full min-h-0 shrink-0 transition-all duration-300 z-30 print:hidden ${
          isCollapsed ? 'w-[68px]' : 'w-64 xl:w-[272px]'
        }`}
      >
        {renderSidebarBody({ railMode: isCollapsed, containerRef: desktopRailRef })}
      </aside>

      {/* 3. Mobile (<md) & Tablet Expanded Slide-Over Modal Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-md"
              onClick={onCloseMobile}
            />

            {/* Slide-Over Drawer Panel (supports swipe-left to close) */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current !== null && e.changedTouches[0]) {
                  const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
                  if (deltaX < -55) {
                    onCloseMobile();
                  }
                }
                touchStartXRef.current = null;
              }}
              className="relative w-72 max-w-[85vw] h-[100dvh] max-h-[100dvh] shadow-2xl z-10 flex flex-col rounded-r-3xl overflow-hidden"
            >
              {renderSidebarBody({ railMode: false, isSlideOver: true, containerRef: mobileDrawerRef })}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};


